import BaseConfigSheet from "./base-config.mjs";

/**
 * A form for configuring actor force and tech points, superiority dice and bonuses.
 */
export default class ActorCastPointsConfig extends BaseConfigSheet {
  constructor(name, ...args) {
    super(...args);

    /**
     * Cloned copy of the actor for previewing changes.
     * @type {Actor5e}
     */
    this.clone = this.object.clone();

    /**
     * Type of casting this form represents.
     * @type {string}
     */
    this.attrName = name.split('-')[0];

    /**
     * Part of the attribute to be modified.
     * @type {string}
     */
    this.subName = '';

    /**
     * Path to the attribute this form will alter.
     * @type {string}
     */
    this.attrPath = `system.attributes.${this.attrName}`;

    const attr = foundry.utils.getProperty(this.clone, this.attrPath);
    if (attr.dice !== undefined) this.subName += "dice";
    else if (attr.points !== undefined) this.subName += "points";

    if (this.subName) this.attrPath += `.${this.subName}`;

    console.debug('ActorCastPointsConfig | clone', this.clone);
    console.debug('ActorCastPointsConfig | attrName', this.attrName);
    console.debug('ActorCastPointsConfig | attrName', this.subName);
    console.debug('ActorCastPointsConfig | attrPath', this.attrPath);
  }

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e", "actor-cast-points-config"],
      template: "systems/sw5e/templates/apps/cast-points-config.hbs",
      width: 320,
      height: "auto",
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize(`SW5E.${this.attrName.capitalize()}${this.subName.capitalize()}Config`)}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData(options) {
    let label = `SW5E.${this.attrName.capitalize()}${this.subName.capitalize()}`;

    return {
      maxOverrideLabel: label + "Override",
      bonusLevelLabel: label + "BonusLevel",
      bonusOverallLabel: label + "BonusOverall",
      attr: foundry.utils.getProperty(this.clone, this.attrPath),
      source: foundry.utils.getProperty(this.clone.toObject(), this.attrPath),
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getActorOverrides() {
    return Object.keys(foundry.utils.flattenObject(this.object.overrides?.system?.attributes || {}));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _updateObject(event, formData) {
    console.debug('ActorCastPointsConfig | _updateObject formData', formData);
    const attr = foundry.utils.expandObject(formData);
    this.clone.updateSource({ [this.attrPath]: attr });

    const cloneAttr = foundry.utils.getProperty(this.clone, this.attrPath);
    const documentAttr = foundry.utils.getProperty(this.document, this.attrPath);

    const maxDelta = cloneAttr.max - documentAttr.max;
    attr.value = Math.max(documentAttr.value + maxDelta, 0);
    return this.document.update({ [this.attrPath]: attr });
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput(event) {
    await super._onChangeInput(event);
    const t = event.currentTarget;

    console.debug('ActorCastPointsConfig | _onChangeInput event', event);
    console.debug('ActorCastPointsConfig | _onChangeInput t', t);
    console.debug('ActorCastPointsConfig | _onChangeInput t.name', t.name);
    console.debug('ActorCastPointsConfig | _onChangeInput t.value', t.value);
    console.debug('ActorCastPointsConfig | _onChangeInput path', `${this.attrPath}.${t.name}`);

    // Update clone with new data & re-render
    this.clone.updateSource({ [`${this.attrPath}.${t.name}`]: t.value || null });
    this.render();
  }
}
