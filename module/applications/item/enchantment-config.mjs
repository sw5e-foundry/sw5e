import { EnchantmentData } from "../../data/item/fields/enchantment-field.mjs";

/**
 * Application for configuring enchantment information for an item.
 */
export default class EnchantmentConfig extends DocumentSheet {

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e", "enchantment-config"],
      dragDrop: [{ dropSelector: "form" }],
      template: "systems/sw5e/templates/apps/enchantment-config.hbs",
      width: 500,
      height: "auto",
      sheetConfig: false,
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true
    });
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Expanded states for each enchantment.
   * @type {Map<string, boolean>}
   */
  expandedEnchantments = new Map();

  /* -------------------------------------------- */

  /** @inheritDoc */
  get title() {
    return `${game.i18n.localize("SW5E.Enchantment.Configuration")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options={}) {
    const context = await super.getData(options);

    context.enchantableTypes = EnchantmentData.enchantableTypes.reduce((obj, k) => {
      obj[k] = game.i18n.localize(CONFIG.Item.typeLabels[k]);
      return obj;
    }, {});
    context.enchantment = this.document.system.enchantment;
    context.isPower = this.document.type === "power";
    context.source = this.document.toObject().system.enchantment;

    const effects = [];
    context.enchantments = [];
    for ( const effect of this.document.effects ) {
      if ( effect.getFlag("sw5e", "type") !== "enchantment" ) effects.push(effect);
      else if ( !effect.isAppliedEnchantment ) context.enchantments.push(effect);
    }
    context.enchantments = context.enchantments.map(effect => ({
      id: effect.id,
      uuid: effect.uuid,
      name: effect.name,
      flags: effect.flags,
      collapsed: this.expandedEnchantments.get(effect.id) ? "" : "collapsed",
      riderEffects: effects.map(({ id, name }) => ({
        id, name, selected: effect.flags.sw5e?.enchantment?.riders?.effect?.includes(id) ? "selected" : ""
      })),
      riderItems: effect.flags.sw5e?.enchantment?.riders?.item?.join(",") ?? ""
    }));

    return context;
  }

  /* -------------------------------------------- */
  /*  Event Handling                              */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(jQuery) {
    super.activateListeners(jQuery);
    const html = jQuery[0];

    for ( const element of html.querySelectorAll("[data-action]") ) {
      element.addEventListener("click", event => this.submit({ updateData: {
        action: event.target.dataset.action,
        enchantmentId: event.target.closest("[data-enchantment-id]")?.dataset.enchantmentId
      } }));
    }

    for ( const element of html.querySelectorAll("multi-select") ) {
      element.addEventListener("change", this._onChangeInput.bind(this));
    }

    for ( const element of html.querySelectorAll(".collapsible") ) {
      element.addEventListener("click", event => {
        const id = event.target.closest("[data-enchantment-id]")?.dataset.enchantmentId;
        if ( event.target.closest(".collapsible-content") || !id ) return;
        event.currentTarget.classList.toggle("collapsed");
        this.expandedEnchantments.set(id, !event.currentTarget.classList.contains("collapsed"));
      });
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _updateObject(event, formData) {
    const { action, effects, enchantmentId, ...data } = foundry.utils.expandObject(formData);

    await this.document.update({"system.enchantment": data});

    const riderIds = new Set();
    const effectsChanges = Object.entries(effects ?? {}).map(([_id, changes]) => {
      const updates = { _id, ...changes };
      // Fix bug with <multi-select> in V11
      if ( !foundry.utils.hasProperty(updates, "flags.sw5e.enchantment.riders.effect") ) {
        foundry.utils.setProperty(updates, "flags.sw5e.enchantment.riders.effect", []);
      }
      // End bug fix
      riderIds.add(...(foundry.utils.getProperty(updates, "flags.sw5e.enchantment.riders.effect") ?? []));
      return updates;
    });
    for ( const effect of this.document.effects ) {
      if ( effect.getFlag("sw5e", "type") === "enchantment" ) continue;
      if ( riderIds.has(effect.id) ) effectsChanges.push({ _id: effect.id, "flags.sw5e.rider": true });
      else effectsChanges.push({ _id: effect.id, "flags.sw5e.-=rider": null });
    }
    if ( effectsChanges.length ) await this.document.updateEmbeddedDocuments("ActiveEffect", effectsChanges);

    const enchantment = this.document.effects.get(enchantmentId);
    switch ( action ) {
      case "add-enchantment":
        const effect = await ActiveEffect.implementation.create({
          name: this.document.name,
          icon: this.document.img,
          "flags.sw5e.type": "enchantment"
        }, { parent: this.document });
        effect.sheet.render(true);
        break;
      case "delete-enchantment":
        enchantment?.deleteDialog();
        break;
      case "edit-enchantment":
        enchantment?.sheet.render(true);
        break;
    }
  }
}
