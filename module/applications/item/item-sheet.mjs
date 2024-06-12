import ActiveEffect5e from "../../documents/active-effect.mjs";
import * as Trait from "../../documents/actor/trait.mjs";
import { filteredKeys, sortObjectEntries } from "../../utils.mjs";
import ActorMovementConfig from "../actor/movement-config.mjs";
import ActorSensesConfig from "../actor/senses-config.mjs";
import ActorTypeConfig from "../actor/type-config.mjs";
import AdvancementManager from "../advancement/advancement-manager.mjs";
import AdvancementMigrationDialog from "../advancement/advancement-migration-dialog.mjs";
import Accordion from "../accordion.mjs";
import EffectsElement from "../components/effects.mjs";
import SourceConfig from "../source-config.mjs";
import EnchantmentConfig from "./enchantment-config.mjs";
import StartingEquipmentConfig from "./starting-equipment-config.mjs";
import SummoningConfig from "./summoning-config.mjs";

/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemSheet5e extends ItemSheet {
  constructor(...args) {
    super(...args);

    this._accordions = this._createAccordions();
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 560,
      classes: ["sw5e", "sheet", "item"],
      resizable: true,
      scrollY: [
        ".tab[data-tab=details]",
        ".tab[data-tab=effects] .items-list",
        ".tab[data-tab=description] .editor-content",
        ".tab[data-tab=advancement] .items-list"
      ],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
      dragDrop: [
        {dragSelector: "[data-effect-id]", dropSelector: ".effects-list"},
        {dragSelector: ".advancement-item", dropSelector: ".advancement"}
      ],
      accordions: [{
        headingSelector: ".description-header", contentSelector: ".editor"
      }],
      elements: {
        effects: "sw5e-effects"
      }
    });
  }

  /* -------------------------------------------- */

  /**
   * Whether advancements on embedded items should be configurable.
   * @type {boolean}
   */
  advancementConfigurationMode = false;

  /* -------------------------------------------- */

  /**
   * The description currently being edited.
   * @type {string}
   */
  editingDescriptionTarget;

  /* -------------------------------------------- */

  /** @inheritdoc */
  get template() {
    return `systems/sw5e/templates/items/${this.item.type}.hbs`;
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _render(force, options) {
    if ( !this.editingDescriptionTarget ) this._accordions.forEach(accordion => accordion._saveCollapsedState());
    return super._render(force, options);
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const item = context.item;
    const source = item.toObject();

    // Game system configuration
    context.config = CONFIG.SW5E;

    // Item rendering data
    foundry.utils.mergeObject(context, {
      source: source.system,
      system: item.system,
      labels: item.labels,
      isEmbedded: item.isEmbedded,
      advancementEditable: (this.advancementConfigurationMode || !item.isEmbedded) && context.editable,
      rollData: this.item.getRollData(),
      user: game.user,

      // Item Type, Status, and Details
      itemType: game.i18n.localize(CONFIG.Item.typeLabels[this.item.type]),
      itemStatus: this._getItemStatus(),
      itemProperties: this._getItemProperties(),
      baseItems: await this._getItemBaseTypes(),
      isPhysical: item.system.hasOwnProperty("quantity"),

      // Action Details
      isHealing: item.system.actionType === "heal",
      isFlatDC: item.system.save?.scaling === "flat",
      isLine: ["line", "wall"].includes(item.system.target?.type),
      isFormulaRecharge: !!CONFIG.SW5E.limitedUsePeriods[item.system.uses?.per]?.formula,
      isCostlessAction: item.system.activation?.type in CONFIG.SW5E.staticAbilityActivationTypes,

      // Identified state
      isIdentifiable: "identified" in item.system,
      isIdentified: item.system.identified !== false,

      // Vehicles
      isCrewed: item.system.activation?.type === "crew",

      // Armor Class
      hasDexModifier: item.isArmor && (item.system.type.value !== "shield"),

      // Advancement
      advancement: this._getItemAdvancement(item),

      // Enchantment
      appliedEnchantments: item.system.enchantment?.appliedEnchantments?.map(enchantment => ({
        enchantment,
        name: enchantment.parent._source.name,
        actor: enchantment.parent.actor,
        item: enchantment.parent
      })),

      // Prepare Active Effects
      effects: EffectsElement.prepareCategories(item.effects, { parent: this.item }),
      elements: this.options.elements,

      concealDetails: !game.user.isGM && (this.document.system.identified === false)
    });
    context.abilityConsumptionTargets = this._getItemConsumptionTargets();
    if ( !item.isEmbedded && foundry.utils.isEmpty(context.abilityConsumptionTargets) ) {
      context.abilityConsumptionHint = (this.item.system.consume?.type === "attribute")
        ? "SW5E.ConsumeHint.Attribute" : "SW5E.ConsumeHint.Item";
    }

    if ( ("properties" in item.system) && (item.type in CONFIG.SW5E.validProperties) ) {
      context.properties = item.system.validProperties.reduce((obj, k) => {
        const v = CONFIG.SW5E.itemProperties[k];
        obj[k] = {
          label: v.label,
          selected: item.system.properties.has(k)
        };
        return obj;
      }, {});
      if ( item.type !== "power" ) context.properties = sortObjectEntries(context.properties, "label");
    }

    // Handle item subtypes.
    if ( ["feat", "loot", "consumable"].includes(item.type) ) {
      const name = item.type === "feat" ? "feature" : item.type;
      const itemTypes = CONFIG.SW5E[`${name}Types`][item.system.type.value];
      if ( itemTypes ) {
        context.itemType = itemTypes.label;
        context.itemSubtypes = itemTypes.subtypes;
      }
    }

    // Enrich HTML description
    const enrichmentOptions = {
      secrets: item.isOwner, async: true, relativeTo: this.item, rollData: context.rollData
    };
    context.enriched = {
      description: await TextEditor.enrichHTML(item.system.description.value, enrichmentOptions),
      unidentified: await TextEditor.enrichHTML(item.system.unidentified?.description, enrichmentOptions),
      chat: await TextEditor.enrichHTML(item.system.description.chat, enrichmentOptions)
    };
    if ( this.editingDescriptionTarget ) {
      context.editingDescriptionTarget = this.editingDescriptionTarget;
      context.enriched.editing = await TextEditor.enrichHTML(
        foundry.utils.getProperty(context, this.editingDescriptionTarget), enrichmentOptions
      );
    }
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Get the display object used to show the advancement tab.
   * @param {Item5e} item  The item for which the advancement is being prepared.
   * @returns {object}     Object with advancement data grouped by levels.
   */
  _getItemAdvancement(item) {
    if ( !item.system.advancement ) return {};
    const advancement = {};
    const configMode = !item.parent || this.advancementConfigurationMode;
    const maxLevel = !configMode
      ? (item.system.levels ?? item.class?.system.levels ?? item.parent.system.details?.level ?? -1) : -1;

    // Improperly configured advancements
    if ( item.advancement.needingConfiguration.length ) {
      advancement.unconfigured = {
        items: item.advancement.needingConfiguration.map(a => ({
          id: a.id,
          order: a.constructor.order,
          title: a.title,
          icon: a.icon,
          classRestriction: a.classRestriction,
          configured: false
        })),
        configured: "partial"
      };
    }

    // All other advancements by level
    for ( let [level, advancements] of Object.entries(item.advancement.byLevel) ) {
      if ( !configMode ) advancements = advancements.filter(a => a.appliesToClass);
      const items = advancements.map(advancement => ({
        id: advancement.id,
        order: advancement.sortingValueForLevel(level),
        title: advancement.titleForLevel(level, { configMode }),
        icon: advancement.icon,
        classRestriction: advancement.classRestriction,
        summary: advancement.summaryForLevel(level, { configMode }),
        configured: advancement.configuredForLevel(level)
      }));
      if ( !items.length ) continue;
      advancement[level] = {
        items: items.sort((a, b) => a.order.localeCompare(b.order, game.i18n.lang)),
        configured: (level > maxLevel) ? false : items.some(a => !a.configured) ? "partial" : "full"
      };
    }
    return advancement;
  }

  /* -------------------------------------------- */

  /**
   * Get the base weapons and tools based on the selected type.
   * @returns {Promise<object>}  Object with base items for this type formatted for selectOptions.
   * @protected
   */
  async _getItemBaseTypes() {
    const baseIds = this.item.type === "equipment" ? {
      ...CONFIG.SW5E.armorIds,
      ...CONFIG.SW5E.shieldIds
    } : CONFIG.SW5E[`${this.item.type}Ids`];
    if ( baseIds === undefined ) return {};

    const baseType = this.item.system.type.value;

    const items = {};
    for ( const [name, id] of Object.entries(baseIds) ) {
      const baseItem = await Trait.getBaseItem(id);
      if ( baseType !== baseItem?.system?.type?.value ) continue;
      items[name] = baseItem.name;
    }
    return Object.fromEntries(Object.entries(items).sort((lhs, rhs) => lhs[1].localeCompare(rhs[1], game.i18n.lang)));
  }

  /* -------------------------------------------- */

  /**
   * Get the valid item consumption targets which exist on the actor
   * @returns {Object<string>}   An object of potential consumption targets
   * @private
   */
  _getItemConsumptionTargets() {
    const consume = this.item.system.consume || {};
    if ( !consume.type ) return [];
    const actor = this.item.actor;
    if ( !actor && (consume.type !== "hitDice") ) return {};

    // Ammunition
    if ( consume.type === "ammo" ) {
      return actor.itemTypes.consumable.reduce((ammo, i) => {
        if ( i.system.type.value === "ammo" ) ammo[i.id] = `${i.name} (${i.system.quantity})`;
        return ammo;
      }, {});
    }

    // Attributes
    else if ( consume.type === "attribute" ) {
      const attrData = actor.type;
      return TokenDocument.implementation.getConsumedAttributes(attrData).reduce((obj, attr) => {
        obj[attr] = attr;
        return obj;
      }, {});
    }

    // Hit Dice
    else if ( consume.type === "hitDice" ) {
      return {
        smallest: game.i18n.localize("SW5E.ConsumeHitDiceSmallest"),
        ...CONFIG.SW5E.hitDieTypes.reduce((obj, hd) => { obj[hd] = hd; return obj; }, {}),
        largest: game.i18n.localize("SW5E.ConsumeHitDiceLargest")
      };
    }

    // Materials
    else if ( consume.type === "material" ) {
      return actor.items.reduce((obj, i) => {
        if ( ["consumable", "loot"].includes(i.type) && !i.system.activation ) {
          obj[i.id] = `${i.name} (${i.system.quantity})`;
        }
        return obj;
      }, {});
    }

    // Charges
    else if ( consume.type === "charges" ) {
      return actor.items.reduce((obj, i) => {

        // Limited-use items
        const uses = i.system.uses || {};
        if ( uses.per && uses.max ) {
          const label = CONFIG.SW5E.limitedUsePeriods[uses.per]?.formula
            ? ` (${game.i18n.format("SW5E.AbilityUseChargesLabel", {value: uses.value})})`
            : ` (${game.i18n.format("SW5E.AbilityUseConsumableLabel", {max: uses.max, per: uses.per})})`;
          obj[i.id] = i.name + label;
        }

        // Recharging items
        const recharge = i.system.recharge || {};
        if ( recharge.value ) obj[i.id] = `${i.name} (${game.i18n.format("SW5E.Recharge")})`;
        return obj;
      }, {});
    }
    else return {};
  }

  /* -------------------------------------------- */

  /**
   * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet.
   * @returns {string|null}  Item status string if applicable to item's type.
   * @protected
   */
  _getItemStatus() {
    switch ( this.item.type ) {
      case "class":
        return game.i18n.format("SW5E.LevelCount", {ordinal: this.item.system.levels.ordinalString()});
      case "equipment":
      case "weapon":
        return game.i18n.localize(this.item.system.equipped ? "SW5E.Equipped" : "SW5E.Unequipped");
      case "feat":
      case "consumable":
        return this.item.system.type.label;
      case "power":
        return CONFIG.SW5E.powerPreparationModes[this.item.system.preparation.mode]?.label;
      case "tool":
        return CONFIG.SW5E.proficiencyLevels[this.item.system.prof?.multiplier || 0];
    }
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Retrieve the list of fields that are currently modified by Active Effects on the Item.
   * @returns {string[]}
   * @protected
   */
  _getItemOverrides() {
    const overrides = Object.keys(foundry.utils.flattenObject(this.item.overrides ?? {}));
    this.item.system.getItemOverrides?.(overrides);
    if ( "properties" in this.item.system ) {
      ActiveEffect5e.addOverriddenChoices(this.item, "system.properties", "system.properties", overrides);
    }
    if ( ("damage" in this.item.system) && foundry.utils.getProperty(this.item.overrides, "system.damage.parts") ) {
      overrides.push("damage-control");
      Array.fromRange(2).forEach(index => overrides.push(
        `system.damage.parts.${index}.0`, `system.damage.parts.${index}.1`
      ));
    }
    return overrides;
  }

  /* -------------------------------------------- */

  /**
   * Get the Array of item properties which are used in the small sidebar of the description tab.
   * @returns {string[]}   List of property labels to be shown.
   * @private
   */
  _getItemProperties() {
    const props = [];
    const labels = this.item.labels;
    switch ( this.item.type ) {
      case "consumable":
      case "weapon":
        if ( this.item.isMountable ) props.push(labels.armor);
        const ip = CONFIG.SW5E.itemProperties;
        const vp = CONFIG.SW5E.validProperties[this.item.type];
        this.item.system.properties.forEach(k => {
          if ( vp.has(k) ) props.push(ip[k].label);
        });
        break;
      case "equipment":
        props.push(CONFIG.SW5E.equipmentTypes[this.item.system.type.value]);
        if ( this.item.isArmor || this.item.isMountable ) props.push(labels.armor);
        break;
      case "feat":
        props.push(labels.featType);
        break;
      case "power":
        props.push(labels.components.vsm, labels.materials, ...labels.components.tags);
        break;
    }

    // Action type
    if ( this.item.system.actionType ) {
      props.push(CONFIG.SW5E.itemActionTypes[this.item.system.actionType]);
    }

    // Action usage
    if ( (this.item.type !== "weapon") && !foundry.utils.isEmpty(this.item.system.activation) ) {
      props.push(labels.activation, labels.range, labels.target, labels.duration);
    }
    return props.filter(p => !!p);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onChangeTab(event, tabs, active) {
    this.setPosition({ height: "auto" });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async activateEditor(name, options={}, initialContent="") {
    options.relativeLinks = true;
    options.plugins = {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        compact: true,
        destroyOnSave: true,
        onSave: () => {
          this.saveEditor(name, {remove: true});
          this.editingDescriptionTarget = null;
        }
      })
    };
    return super.activateEditor(name, options, initialContent);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _getSubmitData(updateData={}) {
    const formData = foundry.utils.expandObject(super._getSubmitData(updateData));

    // Handle Damage array
    const damage = formData.system?.damage;
    if ( damage && !foundry.utils.getProperty(this.item.overrides, "system.damage.parts") ) {
      damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || "", d[1] || ""]);
    }

    // Handle properties
    if ( foundry.utils.hasProperty(formData, "system.properties") ) {
      const keys = new Set(Object.keys(formData.system.properties));
      const preserve = new Set(this.item._source.system.properties ?? []).difference(keys);
      formData.system.properties = [...filteredKeys(formData.system.properties), ...preserve];
    }

    // Check max uses formula
    const uses = formData.system?.uses;
    if ( uses?.max ) {
      const maxRoll = new Roll(uses.max);
      if ( !maxRoll.isDeterministic ) {
        uses.max = this.item._source.system.uses.max;
        this.form.querySelector("input[name='system.uses.max']").value = uses.max;
        ui.notifications.error(game.i18n.format("SW5E.FormulaCannotContainDiceError", {
          name: game.i18n.localize("SW5E.LimitedUses")
        }));
        return null;
      }
    }

    // Check duration value formula
    const duration = formData.system?.duration;
    if ( duration?.value ) {
      const durationRoll = new Roll(duration.value);
      if ( !durationRoll.isDeterministic ) {
        duration.value = this.item._source.system.duration.value;
        this.form.querySelector("input[name='system.duration.value']").value = duration.value;
        ui.notifications.error(game.i18n.format("SW5E.FormulaCannotContainDiceError", {
          name: game.i18n.localize("SW5E.Duration")
        }));
        return null;
      }
    }

    // Check class identifier
    if ( formData.system?.identifier && !sw5e.utils.validators.isValidIdentifier(formData.system.identifier) ) {
      formData.system.identifier = this.item._source.system.identifier;
      this.form.querySelector("input[name='system.identifier']").value = formData.system.identifier;
      ui.notifications.error("SW5E.IdentifierError", {localize: true});
      return null;
    }

    // Return the flattened submission data
    return foundry.utils.flattenObject(formData);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    if ( !this.editingDescriptionTarget ) this._accordions.forEach(accordion => accordion.bind(html[0]));
    if ( this.isEditable ) {
      html.find(".config-button").click(this._onConfigMenu.bind(this));
      html.find(".damage-control").click(this._onDamageControl.bind(this));
      html.find(".enchantment-button").click(this._onEnchantmentAction.bind(this));
      html.find(".advancement .item-control").click(event => {
        const t = event.currentTarget;
        if ( t.dataset.action ) this._onAdvancementAction(t, t.dataset.action);
      });
      html.find(".description-edit").click(event => {
        if ( event.currentTarget.ariaDisabled ) return;
        this.editingDescriptionTarget = event.currentTarget.dataset.target;
        this.render();
      });
      for ( const override of this._getItemOverrides() ) {
        for ( const element of html[0].querySelectorAll(`[name="${override}"]`) ) {
          element.disabled = true;
          element.dataset.tooltip = "SW5E.Enchantment.Warning.Override";
        }
        for ( const element of html[0].querySelectorAll(`[data-target="${override}"]`) ) {
          element.ariaDisabled = true;
          element.dataset.tooltip = "SW5E.Enchantment.Warning.Override";
        }
        if ( override === "damage-control" ) html[0].querySelectorAll(".damage-control").forEach(e => e.remove());
      }
    }
    html[0].querySelectorAll('[data-action="view"]').forEach(e => e.addEventListener("click", this._onView.bind(this)));

    // Advancement context menu
    const contextOptions = this._getAdvancementContextMenuOptions();
    /**
     * A hook event that fires when the context menu for the advancements list is constructed.
     * @function sw5e.getItemAdvancementContext
     * @memberof hookEvents
     * @param {jQuery} html                      The HTML element to which the context options are attached.
     * @param {ContextMenuEntry[]} entryOptions  The context menu entries.
     */
    Hooks.call("sw5e.getItemAdvancementContext", html, contextOptions);
    if ( contextOptions ) new ContextMenu(html, ".advancement-item", contextOptions);
  }

  /* -------------------------------------------- */

  /**
   * Get the set of ContextMenu options which should be applied for advancement entries.
   * @returns {ContextMenuEntry[]}  Context menu entries.
   * @protected
   */
  _getAdvancementContextMenuOptions() {
    const condition = li => (this.advancementConfigurationMode || !this.isEmbedded) && this.isEditable;
    return [
      {
        name: "SW5E.AdvancementControlEdit",
        icon: "<i class='fas fa-edit fa-fw'></i>",
        condition,
        callback: li => this._onAdvancementAction(li[0], "edit")
      },
      {
        name: "SW5E.AdvancementControlDuplicate",
        icon: "<i class='fas fa-copy fa-fw'></i>",
        condition: li => {
          const id = li[0].closest(".advancement-item")?.dataset.id;
          const advancement = this.item.advancement.byId[id];
          return condition(li) && advancement?.constructor.availableForItem(this.item);
        },
        callback: li => this._onAdvancementAction(li[0], "duplicate")
      },
      {
        name: "SW5E.AdvancementControlDelete",
        icon: "<i class='fas fa-trash fa-fw' style='color: rgb(255, 65, 65);'></i>",
        condition,
        callback: li => this._onAdvancementAction(li[0], "delete")
      }
    ];
  }

  /* -------------------------------------------- */

  /**
   * Handle spawning the configuration applications.
   * @param {Event} event   The click event which originated the selection.
   * @protected
   */
  _onConfigMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    let app;
    switch ( button.dataset.action ) {
      case "enchantment":
        app = new EnchantmentConfig(this.item);
        break;
      case "movement":
        app = new ActorMovementConfig(this.item, { keyPath: "system.movement" });
        break;
      case "senses":
        app = new ActorSensesConfig(this.item, { keyPath: "system.senses" });
        break;
      case "source":
        app = new SourceConfig(this.item, { keyPath: "system.source" });
        break;
      case "starting-equipment":
        app = new StartingEquipmentConfig(this.item);
        break;
      case "summoning":
        app = new SummoningConfig(this.item);
        break;
      case "type":
        app = new ActorTypeConfig(this.item, { keyPath: "system.type" });
        break;
    }
    app?.render(true);
  }

  /* -------------------------------------------- */

  /**
   * Add or remove a damage part from the damage formula.
   * @param {Event} event             The original click event.
   * @returns {Promise<Item5e>|null}  Item with updates applied.
   * @private
   */
  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new damage component
    if ( a.classList.contains("add-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const damage = this.item.system.damage;
      return this.item.update({"system.damage.parts": damage.parts.concat([["", ""]])});
    }

    // Remove a damage component
    if ( a.classList.contains("delete-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".damage-part");
      const damage = foundry.utils.deepClone(this.item.system.damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      return this.item.update({"system.damage.parts": damage.parts});
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle actions on entries in the enchanted items list.
   * @param {PointerEvent} event  Triggering click event.
   * @private
   */
  async _onEnchantmentAction(event) {
    event.preventDefault();
    const enchantment = fromUuidSync(event.currentTarget.closest("[data-enchantment-uuid]")?.dataset.enchantmentUuid);
    if ( !enchantment ) return;
    switch ( event.currentTarget.dataset.action ) {
      case "removeEnchantment":
        await enchantment.delete();
        this.render();
        break;
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle actions on a view sheet button.
   * @param {PointerEvent} event  Triggering click event.
   * @private
   */
  async _onView(event) {
    event.preventDefault();
    const doc = await fromUuid(event.currentTarget.dataset.uuid);
    doc?.sheet.render(true);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _canDragStart(selector) {
    if ( [".advancement-item", "[data-effect-id]"].includes(selector) ) return true;
    return this.isEditable;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ( event.target.classList.contains("content-link") ) return;

    // Create drag data
    let dragData;

    // Active Effect
    if ( li.dataset.effectId ) {
      const effect = this.item.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    } else if ( li.classList.contains("advancement-item") ) {
      dragData = this.item.advancement.byId[li.dataset.id]?.toDragData();
    }

    if ( !dragData ) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const item = this.item;

    /**
     * A hook event that fires when some useful data is dropped onto an ItemSheet5e.
     * @function sw5e.dropItemSheetData
     * @memberof hookEvents
     * @param {Item5e} item                  The Item5e
     * @param {ItemSheet5e} sheet            The ItemSheet5e application
     * @param {object} data                  The data that has been dropped onto the sheet
     * @returns {boolean}                    Explicitly return `false` to prevent normal drop handling.
     */
    const allowed = Hooks.call("sw5e.dropItemSheetData", item, this, data);
    if ( allowed === false ) return;

    switch ( data.type ) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Advancement":
      case "Item":
        return this._onDropAdvancement(event, data);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle the dropping of ActiveEffect data onto an Item Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const effect = await ActiveEffect.implementation.fromDropData(data);
    if ( !this.item.isOwner || !effect
      || (this.item.uuid === effect.parent?.uuid)
      || (this.item.uuid === effect.origin) ) return false;
    const effectData = effect.toObject();
    let keepOrigin = false;

    // Validate against the enchantment's restraints on the origin item
    if ( effect.getFlag("sw5e", "type") === "enchantment" ) {
      const errors = effect.parent.system.enchantment?.canEnchant(this.item);
      if ( errors?.length ) {
        errors.forEach(err => ui.notifications.error(err.message));
        return false;
      }
      effectData.origin ??= effect.parent.uuid;
      keepOrigin = true;
    }

    return ActiveEffect.create(effectData, {parent: this.item, keepOrigin});
  }

  /* -------------------------------------------- */

  /**
   * Handle the dropping of an advancement or item with advancements onto the advancements tab.
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data.
   * @param {object} data                      The data transfer extracted from the event.
   * @returns {Promise}
   */
  async _onDropAdvancement(event, data) {
    if ( !this.item.system.advancement ) return;

    let advancements;
    let showDialog = false;
    if ( data.type === "Advancement" ) {
      advancements = [await fromUuid(data.uuid)];
    } else if ( data.type === "Item" ) {
      const item = await Item.implementation.fromDropData(data);
      if ( !item?.system.advancement ) return false;
      advancements = Object.values(item.advancement.byId);
      showDialog = true;
    } else {
      return false;
    }
    advancements = advancements.filter(a => {
      const validItemTypes = CONFIG.SW5E.advancementTypes[a.constructor.typeName]?.validItemTypes
        ?? a.metadata.validItemTypes;
      return !this.item.advancement.byId[a.id]
        && validItemTypes.has(this.item.type)
        && a.constructor.availableForItem(this.item);
    });

    // Display dialog prompting for which advancements to add
    if ( showDialog ) {
      try {
        advancements = await AdvancementMigrationDialog.createDialog(this.item, advancements);
      } catch(err) {
        return false;
      }
    }

    if ( !advancements.length ) return false;
    if ( this.item.actor?.system.metadata?.supportsAdvancement && !game.settings.get("sw5e", "disableAdvancements") ) {
      const manager = AdvancementManager.forNewAdvancement(this.item.actor, this.item.id, advancements);
      if ( manager.steps.length ) return manager.render(true);
    }

    // If no advancements need to be applied, just add them to the item
    const advancementArray = this.item.system.toObject().advancement;
    advancementArray.push(...advancements.map(a => a.toObject()));
    this.item.update({"system.advancement": advancementArray});
  }

  /* -------------------------------------------- */

  /**
   * Handle one of the advancement actions from the buttons or context menu.
   * @param {Element} target  Button or context menu entry that triggered this action.
   * @param {string} action   Action being triggered.
   * @returns {Promise|void}
   */
  _onAdvancementAction(target, action) {
    const id = target.closest(".advancement-item")?.dataset.id;
    const advancement = this.item.advancement.byId[id];
    let manager;
    if ( ["edit", "delete", "duplicate"].includes(action) && !advancement ) return;
    switch (action) {
      case "add": return game.sw5e.applications.advancement.AdvancementSelection.createDialog(this.item);
      case "edit": return new advancement.constructor.metadata.apps.config(advancement).render(true);
      case "delete":
        if ( this.item.actor?.system.metadata?.supportsAdvancement
            && !game.settings.get("sw5e", "disableAdvancements") ) {
          manager = AdvancementManager.forDeletedAdvancement(this.item.actor, this.item.id, id);
          if ( manager.steps.length ) return manager.render(true);
        }
        return this.item.deleteAdvancement(id);
      case "duplicate": return this.item.duplicateAdvancement(id);
      case "modify-choices":
        const level = target.closest("li")?.dataset.level;
        manager = AdvancementManager.forModifyChoices(this.item.actor, this.item.id, Number(level));
        if ( manager.steps.length ) manager.render(true);
        return;
      case "toggle-configuration":
        this.advancementConfigurationMode = !this.advancementConfigurationMode;
        return this.render();
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onSubmit(...args) {
    if ( this._tabs[0].active === "details" ) this.position.height = "auto";
    await super._onSubmit(...args);
  }

  /* -------------------------------------------- */

  /**
   * Instantiate accordion widgets.
   * @returns {Accordion[]}
   * @protected
   */
  _createAccordions() {
    return this.options.accordions.map(config => new Accordion(config));
  }
}
