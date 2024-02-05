import BaseConfigSheet from "./base-config.mjs";

/**
 * A form for configuring actor hit points and bonuses.
 */
export default class ActorHitPointsConfig extends BaseConfigSheet {
  constructor(hitPointType, ...args) {
    super(...args);

    /**
     * Cloned copy of the actor for previewing changes.
     * @type {Actor5e}
     */
    this.clone = this.object.clone();

    /**
     * Which hit point type is this, hit-points, hull-points or shield-points.
     * @type {string}
     */
    this.hitPointType = hitPointType.split(/(?=[A-Z])/)[0];
  }

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e", "actor-hit-points-config"],
      template: "systems/sw5e/templates/apps/hit-points-config.hbs",
      width: 320,
      height: "auto",
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize(`SW5E.${this.hitPointType.capitalize()}PointsConfig`)}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData(options) {
    const source = this.clone.toObject().system.attributes.hp;
    const hp = this.clone.system.attributes.hp;
    const temp = this.hitPointType === "shield" ? "temp" : "";
    const data = {
      hp,
      isNpc: this.document.type === "npc",
      value: {
        sourceMax: source[`${temp}max`],
        max: hp[`${temp}max`],
        level: hp.bonuses?.[`${temp}level`],
        overall: hp.bonuses?.[`${temp}overall`]
      },
      path: {
        max: `hp.${temp}max`,
        level: `hp.bonuses.${temp}level`,
        overall: `hp.bonuses.${temp}overall`
      },
      label: {
        override: `SW5E.${this.hitPointType.capitalize()}PointsOverride`,
        max: `SW5E.${this.hitPointType.capitalize()}PointsMax`,
        bonusLevel: `SW5E.${this.hitPointType.capitalize()}PointsBonusLevel`,
        bonusOverall: `SW5E.${this.hitPointType.capitalize()}PointsBonusOverall`
      }
    };
    return data;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getActorOverrides() {
    return Object.keys(foundry.utils.flattenObject(this.object.overrides?.system?.attributes || {}));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _updateObject(event, formData) {
    const hp = foundry.utils.expandObject(formData).hp;
    const temp = this.hitPointType === "shield" ? "temp" : "";
    this.clone.updateSource({ "system.attributes.hp": hp });
    const maxDelta = this.clone.system.attributes.hp[`${temp}max`] - this.document.system.attributes.hp[`${temp}max`];
    hp[temp || "value"] = Math.max(this.document.system.attributes.hp[temp || "value"] + maxDelta, 0);
    return this.document.update({ "system.attributes.hp": hp });
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".roll-hit-points").click(this._onRollHPFormula.bind(this));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput(event) {
    await super._onChangeInput(event);
    const t = event.currentTarget;

    // Update clone with new data & re-render
    this.clone.updateSource({ [`system.attributes.${t.name}`]: t.value || null });
    if (t.name !== "hp.formula") this.render();
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling NPC health values using the provided formula.
   * @param {Event} event  The original click event.
   * @protected
   */
  async _onRollHPFormula(event) {
    event.preventDefault();
    try {
      const roll = await this.clone.rollNPCHitPoints();
      this.clone.updateSource({ "system.attributes.hp.max": roll.total });
      this.render();
    } catch(error) {
      ui.notifications.error("SW5E.HPFormulaError", { localize: true });
      throw error;
    }
  }
}
