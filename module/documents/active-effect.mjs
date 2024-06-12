import { FormulaField } from "../data/fields.mjs";
import { EnchantmentData } from "../data/item/fields/enchantment-field.mjs";
import { staticID } from "../utils.mjs";

/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class ActiveEffect5e extends ActiveEffect {
  /**
   * Static ActiveEffect ID for various conditions.
   * @type {Record<string, string>}
   */
  static ID = {
    ENCUMBERED: staticID("sw5eencumbered"),
    EXHAUSTION: staticID("sw5eexhaustion")
  };

  /* -------------------------------------------- */

  /**
   * Additional key paths to properties added during base data preparation that should be treated as formula fields.
   * @type {Set<string>}
   */
  static FORMULA_FIELDS = new Set([
    "system.attributes.ac.bonus",
    "system.attributes.encumbrance.bonuses.encumbered",
    "system.attributes.encumbrance.bonuses.heavilyEncumbered",
    "system.attributes.encumbrance.bonuses.maximum",
    "system.attributes.encumbrance.bonuses.overall",
    "system.attributes.encumbrance.multipliers.encumbered",
    "system.attributes.encumbrance.multipliers.heavilyEncumbered",
    "system.attributes.encumbrance.multipliers.maximum",
    "system.attributes.encumbrance.multipliers.overall"
  ]);

  /* -------------------------------------------- */

  /**
   * Is this effect an enchantment on an item that accepts enchantment?
   * @type {boolean}
   */
  get isAppliedEnchantment() {
    return (this.getFlag("sw5e", "type") === "enchantment")
      && !!this.origin && (this.origin !== this.parent.uuid);
  }

  /* -------------------------------------------- */

  /**
   * Is this active effect currently suppressed?
   * @type {boolean}
   */
  isSuppressed = false;

  /* -------------------------------------------- */

  /**
   * Retrieve the source Actor or Item, or null if it could not be determined.
   * @returns {Promise<Actor5e|Item5e|null>}
   */
  async getSource() {
    if ( (this.target instanceof sw5e.documents.Actor5e) && (this.parent instanceof sw5e.documents.Item5e) ) {
      return this.parent;
    }
    return fromUuid(this.origin);
  }

  /* -------------------------------------------- */

  /**
   * Create an ActiveEffect instance from some status effect ID.
   * Delegates to {@link ActiveEffect._fromStatusEffect} to create the ActiveEffect instance
   * after creating the ActiveEffect data from the status effect data if `CONFIG.statusEffects`.
   * @param {string} statusId                             The status effect ID.
   * @param {DocumentModificationContext} [options={}]    Additional options to pass to ActiveEffect instantiation.
   * @returns {Promise<ActiveEffect>}                     The created ActiveEffect instance.
   * @throws    An error if there's not status effect in `CONFIG.statusEffects` with the given status ID,
   *            and if the status has implicit statuses but doesn't have a static _id.
   */
  static async fromStatusEffect(statusId, options={}) {
    // TODO: This function has been copy & pasted from V12. Remove it once V11 support is dropped.

    const status = CONFIG.statusEffects.find(e => e.id === statusId);
    if ( !status ) throw new Error(`Invalid status ID "${statusId}" provided to ActiveEffect.fromStatusEffect`);
    if ( foundry.utils.isNewerVersion(game.version, 12) ) {
      for ( const [oldKey, newKey] of Object.entries({label: "name", icon: "img"}) ) {
        if ( !(newKey in status) && (oldKey in status) ) {
          const msg = `StatusEffectConfig#${oldKey} has been deprecated in favor of StatusEffectConfig#${newKey}`;
          foundry.utils.logCompatibilityWarning(msg, {since: 12, until: 14, once: true});
        }
      }
    }
    const {id, label, icon, hud, ...effectData} = foundry.utils.deepClone(status);
    effectData.name = game.i18n.localize(effectData.name ?? label);
    if ( game.release.generation < 12 ) effectData.icon ??= icon;
    else effectData.img ??= icon;
    effectData.statuses = Array.from(new Set([id, ...effectData.statuses ?? []]));
    if ( (effectData.statuses.length > 1) && !status._id ) {
      throw new Error("Status effects with implicit statuses must have a static _id");
    }
    return ActiveEffect.implementation._fromStatusEffect(statusId, effectData, options);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static async _fromStatusEffect(statusId, { reference, ...effectData }, options) {
    if ( !("description" in effectData) && reference ) effectData.description = `@Embed[${reference} inline]`;
    return super._fromStatusEffect?.(statusId, effectData, options) ?? new this(effectData, options);
  }

  /* -------------------------------------------- */
  /*  Effect Application                          */
  /* -------------------------------------------- */

  /** @inheritdoc */
  apply(actor, change) {
    if ( change.key.startsWith("flags.sw5e.") ) change = this._prepareFlagChange(actor, change);

    // Determine type using DataField
    let field = change.key.startsWith("system.")
      ? actor.system.schema.getField(change.key.slice(7))
      : actor.schema.getField(change.key);

    // Get the current value of the target field
    const current = foundry.utils.getProperty(actor, change.key) ?? null;

    const getTargetType = field => {
      if ( (field instanceof FormulaField) || ActiveEffect5e.FORMULA_FIELDS.has(change.key) ) return "formula";
      else if ( field instanceof foundry.data.fields.ArrayField ) return "Array";
      else if ( field instanceof foundry.data.fields.ObjectField ) return "Object";
      else if ( field instanceof foundry.data.fields.BooleanField ) return "boolean";
      else if ( field instanceof foundry.data.fields.NumberField ) return "number";
      else if ( field instanceof foundry.data.fields.StringField ) return "string";
    };

    const targetType = getTargetType(field);
    if ( !targetType ) return super.apply(actor, change);
    const modes = CONST.ACTIVE_EFFECT_MODES;

    // Special handling for FormulaField
    if ( targetType === "formula" ) {
      const changes = {};
      if ( !field ) field = new FormulaField({ deterministic: true });
      const delta = field._cast(change.value).trim();
      this._applyFormulaField(actor, change, current, delta, changes);
      foundry.utils.mergeObject(actor, changes);
      return changes;
    }

    else if ( (targetType === "string") && (change.mode === modes.OVERRIDE) && change.value.includes("{}") ) {
      change = foundry.utils.deepClone(change);
      change.value = change.value.replace("{}", current ?? "");
    }

    let delta;
    try {
      if ( targetType === "Array" ) {
        const innerType = getTargetType(field.element);
        delta = this._castArray(change.value, innerType);
      }
      else delta = this._castDelta(change.value, targetType);
    } catch(err) {
      console.warn(`Actor [${actor.id}] | Unable to parse active effect change for ${change.key}: "${change.value}"`);
      return;
    }

    // Apply the change depending on the application mode
    const changes = {};
    switch ( change.mode ) {
      case modes.ADD:
        this._applyAdd(actor, change, current, delta, changes);
        break;
      case modes.MULTIPLY:
        this._applyMultiply(actor, change, current, delta, changes);
        break;
      case modes.OVERRIDE:
        this._applyOverride(actor, change, current, delta, changes);
        break;
      case modes.UPGRADE:
      case modes.DOWNGRADE:
        this._applyUpgrade(actor, change, current, delta, changes);
        break;
      default:
        this._applyCustom(actor, change, current, delta, changes);
        break;
    }

    // Apply all changes to the Actor data
    foundry.utils.mergeObject(actor, changes);
    return changes;
  }

  /* -------------------------------------------- */

  /**
   * Custom application for FormulaFields.
   * @param {Actor5e} actor                 The Actor to whom this effect should be applied
   * @param {EffectChangeData} change       The change data being applied
   * @param {string} current                The current value being modified
   * @param {string} delta                  The parsed value of the change object
   * @param {object} changes                An object which accumulates changes to be applied
   */
  _applyFormulaField(actor, change, current, delta, changes) {
    if ( !current || change.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE ) {
      this._applyOverride(actor, change, current, delta, changes);
      return;
    }
    const terms = (new Roll(current)).terms;
    let fn = "min";
    switch ( change.mode ) {
      case CONST.ACTIVE_EFFECT_MODES.ADD:
        const operator = delta.startsWith("-") ? "-" : "+";
        delta = delta.replace(/^[+-]?/, "").trim();
        changes[change.key] = `${current} ${operator} ${delta}`;
        break;
      case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
        if ( terms.length > 1 ) changes[change.key] = `(${current}) * ${delta}`;
        else changes[change.key] = `${current} * ${delta}`;
        break;
      case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
        fn = "max";
      case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE:
        if ( (terms.length === 1) && (terms[0].fn === fn) ) {
          changes[change.key] = current.replace(/\)$/, `, ${delta})`);
        } else changes[change.key] = `${fn}(${current}, ${delta})`;
        break;
      default:
        this._applyCustom(actor, change, current, delta, changes);
        break;
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _applyAdd(actor, change, current, delta, changes) {
    if ( current instanceof Set ) {
      const handle = v => {
        const neg = v.replace(/^\s*-\s*/, "");
        if ( neg !== v ) current.delete(neg);
        else current.add(v);
      };
      if ( Array.isArray(delta) ) delta.forEach(item => handle(item));
      else handle(delta);
      return;
    }
    super._applyAdd(actor, change, current, delta, changes);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _applyOverride(actor, change, current, delta, changes) {
    if ( current instanceof Set ) {
      current.clear();
      if ( Array.isArray(delta) ) delta.forEach(item => current.add(item));
      else current.add(delta);
      return;
    }
    return super._applyOverride(actor, change, current, delta, changes);
  }

  /* --------------------------------------------- */

  /** @inheritdoc */
  _applyUpgrade(actor, change, current, delta, changes) {
    if ( current === null ) return this._applyOverride(actor, change, current, delta, changes);
    return super._applyUpgrade(actor, change, current, delta, changes);
  }

  /* --------------------------------------------- */

  /**
   * Transform the data type of the change to match the type expected for flags.
   * @param {Actor5e} actor            The Actor to whom this effect should be applied.
   * @param {EffectChangeData} change  The change being applied.
   * @returns {EffectChangeData}       The change with altered types if necessary.
   */
  _prepareFlagChange(actor, change) {
    const { key, value } = change;
    const data = CONFIG.SW5E.characterFlags[key.replace("flags.sw5e.", "")];
    if ( !data ) return change;

    // Set flag to initial value if it isn't present
    const current = foundry.utils.getProperty(actor, key) ?? null;
    if ( current === null ) {
      let initialValue = null;
      if ( data.placeholder ) initialValue = data.placeholder;
      else if ( data.type === Boolean ) initialValue = false;
      else if ( data.type === Number ) initialValue = 0;
      foundry.utils.setProperty(actor, key, initialValue);
    }

    // Coerce change data into the correct type
    if ( data.type === Boolean ) {
      if ( value === "false" ) change.value = false;
      else change.value = Boolean(value);
    }
    return change;
  }

  /* --------------------------------------------- */

  /**
   * Determine whether this Active Effect is suppressed or not.
   */
  determineSuppression() {
    this.isSuppressed = false;
    if ( this.getFlag("sw5e", "type") === "enchantment" ) return;
    if ( this.parent instanceof sw5e.documents.Item5e ) this.isSuppressed = this.parent.areEffectsSuppressed;
  }

  /* -------------------------------------------- */

  /** @override */
  getRelativeUUID(doc) {
    // TODO: Backport relative UUID fixes to accommodate descendant documents. Can be removed once v12 is the minimum.
    if ( this.compendium && (this.compendium !== doc.compendium) ) return this.uuid;
    if ( this.isEmbedded && (this.collection === doc.collection) ) return `.${this.id}`;
    const parts = [this.documentName, this.id];
    let parent = this.parent;
    while ( parent ) {
      if ( parent === doc ) break;
      parts.unshift(parent.documentName, parent.id);
      parent = parent.parent;
    }
    if ( parent === doc ) return `.${parts.join(".")}`;
    return this.uuid;
  }

  /* -------------------------------------------- */
  /*  Lifecycle                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    if ( this.id === this.constructor.ID.EXHAUSTION ) this._prepareExhaustionLevel();
    if ( this.isAppliedEnchantment ) EnchantmentData.trackEnchantment(this.origin, this.uuid);
  }

  /* -------------------------------------------- */

  /**
   * Modify the ActiveEffect's attributes based on the exhaustion level.
   * @protected
   */
  _prepareExhaustionLevel() {
    const config = CONFIG.SW5E.conditionTypes.exhaustion;
    let level = this.getFlag("sw5e", "exhaustionLevel");
    if ( !Number.isFinite(level) ) level = 1;
    // TODO: Remove when v11 support is dropped.
    if ( game.release.version < 12 ) this.icon = this.constructor._getExhaustionImage(level);
    else this.img = this.constructor._getExhaustionImage(level);
    this.name = `${game.i18n.localize("SW5E.Exhaustion")} ${level}`;
    if ( level >= config.levels ) {
      this.statuses.add("dead");
      CONFIG.SW5E.statusEffects.dead.statuses?.forEach(s => this.statuses.add(s));
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare effect favorite data.
   * @returns {Promise<FavoriteData5e>}
   */
  async getFavoriteData() {
    return {
      img: this.img,
      title: this.name,
      subtitle: this.duration.remaining ? this.duration.label : "",
      toggle: !this.disabled,
      suppressed: this.isSuppressed
    };
  }

  /* -------------------------------------------- */

  /**
   * Create conditions that are applied separately from an effect.
   * @returns {Promise<ActiveEffect5e[]|void>}      Created rider effects.
   */
  async createRiderConditions() {
    const riders = new Set(this.statuses.reduce((acc, status) => {
      const r = CONFIG.statusEffects.find(e => e.id === status)?.riders ?? [];
      return acc.concat(r);
    }, []));
    if ( !riders.size ) return;

    const createRider = async id => {
      const existing = this.parent.effects.get(staticID(`sw5e${id}`));
      if ( existing ) return;
      const effect = await ActiveEffect.implementation.fromStatusEffect(id);
      return ActiveEffect.implementation.create(effect, { parent: this.parent, keepId: true });
    };

    return Promise.all(Array.from(riders).map(createRider));
  }

  /* -------------------------------------------- */

  /**
   * Create additional effects that are applied separately from an enchantment.
   */
  async createRiderEnchantments() {
    const origin = await fromUuid(this.origin);

    // Create Effects
    const riderEffects = (this.getFlag("sw5e", "enchantment.riders.effect") ?? []).map(id => {
      const effectData = origin.effects.get(id)?.toObject();
      if ( effectData ) {
        delete effectData._id;
        delete effectData.flags?.sw5e?.rider;
        effectData.origin = this.origin;
      }
      return effectData;
    });
    const createdEffects = await this.parent.createEmbeddedDocuments("ActiveEffect", riderEffects.filter(e => e));

    // Create Items
    let createdItems = [];
    if ( this.parent.isEmbedded ) {
      const riderItems = await Promise.all((this.getFlag("sw5e", "enchantment.riders.item") ?? []).map(async uuid => {
        const itemData = (await fromUuid(uuid))?.toObject();
        if ( itemData ) {
          delete itemData._id;
          foundry.utils.setProperty(itemData, "flags.sw5e.enchantment", { origin: this.uuid });
        }
        return itemData;
      }));
      createdItems = await this.parent.actor.createEmbeddedDocuments("Item", riderItems.filter(i => i));
    }

    if ( createdEffects.length || createdItems.length ) this.addDependent(...createdEffects, ...createdItems);
  }

  /* -------------------------------------------- */
  /*  Socket Event Handlers                       */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    if ( await super._preCreate(data, options, user) === false ) return false;
    if ( options.keepOrigin === false ) this.updateSource({ origin: this.parent.uuid });

    // Enchantments cannot be added directly to actors
    if ( (this.getFlag("sw5e", "type") === "enchantment") && (this.parent instanceof Actor) ) {
      ui.notifications.error("SW5E.Enchantment.Warning.NotOnActor", { localize: true });
      return false;
    }

    if ( this.isAppliedEnchantment ) {
      const origin = await fromUuid(this.origin);
      const errors = origin?.system.enchantment?.canEnchant(this.parent);
      if ( errors?.length ) {
        errors.forEach(err => console.error(err));
        return false;
      }
      this.updateSource({ disabled: false });
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if ( userId === game.userId ) {
      if ( this.active && (this.parent instanceof Actor) ) await this.createRiderConditions();
      if ( this.isAppliedEnchantment ) await this.createRiderEnchantments();
    }
    if ( options.chatMessageOrigin ) {
      document.body.querySelectorAll(`[data-message-id="${options.chatMessageOrigin}"] enchantment-application`)
        .forEach(element => element.buildItemList());
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    const originalLevel = foundry.utils.getProperty(options, "sw5e.originalExhaustion");
    const newLevel = foundry.utils.getProperty(data, "flags.sw5e.exhaustionLevel");
    const originalEncumbrance = foundry.utils.getProperty(options, "sw5e.originalEncumbrance");
    const newEncumbrance = data.statuses?.[0];
    const name = this.name;

    // Display proper scrolling status effects for exhaustion
    if ( (this.id === this.constructor.ID.EXHAUSTION) && Number.isFinite(newLevel) && Number.isFinite(originalLevel) ) {
      if ( newLevel === originalLevel ) return;
      // Temporarily set the name for the benefit of _displayScrollingTextStatus. We should improve this method to
      // accept a name parameter instead.
      if ( newLevel < originalLevel ) this.name = `Exhaustion ${originalLevel}`;
      this._displayScrollingStatus(newLevel > originalLevel);
      this.name = name;
    }

    // Display proper scrolling status effects for encumbrance
    else if ( (this.id === this.constructor.ID.ENCUMBERED) && originalEncumbrance && newEncumbrance ) {
      if ( newEncumbrance === originalEncumbrance ) return;
      const increase = !originalEncumbrance || ((originalEncumbrance === "encumbered") && newEncumbrance)
        || (newEncumbrance === "exceedingCarryingCapacity");
      if ( !increase ) this.name = CONFIG.SW5E.encumbrance.effects[originalEncumbrance].name;
      this._displayScrollingStatus(increase);
      this.name = name;
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preDelete(options, user) {
    const dependents = this.getDependents();
    if ( dependents.length && !game.users.activeGM ) {
      ui.notifications.warn("SW5E.ConcentrationBreakWarning", { localize: true });
      return false;
    }
    return super._preDelete(options, user);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    if ( game.user === game.users.activeGM ) this.getDependents().forEach(e => e.delete());
    if ( this.isAppliedEnchantment ) EnchantmentData.untrackEnchantment(this.origin, this.uuid);
    document.body.querySelectorAll(`enchantment-application:has([data-enchantment-uuid="${this.uuid}"]`)
      .forEach(element => element.buildItemList());
  }

  /* -------------------------------------------- */
  /*  Exhaustion and Concentration Handling       */
  /* -------------------------------------------- */

  /**
   * Create effect data for concentration on an actor.
   * @param {Item5e} item       The item on which to begin concentrating.
   * @param {object} [data]     Additional data provided for the effect instance.
   * @returns {object}          Created data for the ActiveEffect.
   */
  static createConcentrationEffectData(item, data={}) {
    if ( !item.isEmbedded || !item.requiresConcentration ) {
      throw new Error("You may not begin concentrating on this item!");
    }

    const statusEffect = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.CONCENTRATING);
    const effectData = foundry.utils.mergeObject({
      ...statusEffect,
      name: `${game.i18n.localize("EFFECT.SW5E.StatusConcentrating")}: ${item.name}`,
      description: game.i18n.format("SW5E.ConcentratingOn", {
        name: item.name,
        type: game.i18n.localize(`TYPES.Item.${item.type}`)
      }),
      duration: ActiveEffect5e.getEffectDurationFromItem(item),
      "flags.sw5e.itemData": item.actor.items.has(item.id) ? item.id : item.toObject(),
      origin: item.uuid,
      statuses: [statusEffect.id].concat(statusEffect.statuses ?? [])
    }, data, {inplace: false});
    delete effectData.id;
    if ( item.type === "power" ) effectData["flags.sw5e.powerLevel"] = item.system.level;

    return effectData;
  }

  /* -------------------------------------------- */

  /**
   * Register listeners for custom handling in the TokenHUD.
   */
  static registerHUDListeners() {
    Hooks.on("renderTokenHUD", this.onTokenHUDRender);
    document.addEventListener("click", this.onClickTokenHUD.bind(this), { capture: true });
    document.addEventListener("contextmenu", this.onClickTokenHUD.bind(this), { capture: true });
  }

  /* -------------------------------------------- */

  /**
   * Adjust exhaustion icon display to match current level.
   * @param {Application} app  The TokenHUD application.
   * @param {jQuery} html      The TokenHUD HTML.
   */
  static onTokenHUDRender(app, html) {
    const actor = app.object.actor;
    const level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
    if ( Number.isFinite(level) && (level > 0) ) {
      const img = ActiveEffect5e._getExhaustionImage(level);
      html.find('[data-status-id="exhaustion"]').css({
        objectPosition: "-100px",
        background: `url('${img}') no-repeat center / contain`
      });
    }
  }

  /* -------------------------------------------- */

  /**
   * Get the image used to represent exhaustion at this level.
   * @param {number} level
   * @returns {string}
   */
  static _getExhaustionImage(level) {
    const split = CONFIG.SW5E.conditionTypes.exhaustion.icon.split(".");
    const ext = split.pop();
    const path = split.join(".");
    return `${path}-${level}.${ext}`;
  }

  /* -------------------------------------------- */

  /**
   * Map the duration of an item to an active effect duration.
   * @param {Item5e} item     An item with a duration.
   * @returns {object}        The active effect duration.
   */
  static getEffectDurationFromItem(item) {
    const dur = item.system.duration ?? {};
    const value = dur.value || 1;

    switch ( dur.units ) {
      case "turn": return { turns: value };
      case "round": return { rounds: value };
      case "minute": return { seconds: value * 60 };
      case "hour": return { seconds: value * 60 * 60 };
      case "day": return { seconds: value * 60 * 60 * 24 };
      case "year": return { seconds: value * 60 * 60 * 24 * 365 };
      default: return {};
    }
  }

  /* -------------------------------------------- */

  /**
   * Implement custom behavior for select conditions on the token HUD.
   * @param {PointerEvent} event        The triggering event.
   */
  static onClickTokenHUD(event) {
    const { target } = event;
    if ( !target.classList?.contains("effect-control") ) return;

    const actor = canvas.hud.token.object?.actor;
    if ( !actor ) return;

    const id = target.dataset?.statusId;
    if ( id === "exhaustion" ) ActiveEffect5e._manageExhaustion(event, actor);
    else if ( id === "concentrating" ) ActiveEffect5e._manageConcentration(event, actor);
  }

  /* -------------------------------------------- */

  /**
   * Manage custom exhaustion cycling when interacting with the token HUD.
   * @param {PointerEvent} event        The triggering event.
   * @param {Actor5e} actor             The actor belonging to the token.
   */
  static _manageExhaustion(event, actor) {
    let level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
    if ( !Number.isFinite(level) ) return;
    event.preventDefault();
    event.stopPropagation();
    if ( event.button === 0 ) level++;
    else level--;
    const max = CONFIG.SW5E.conditionTypes.exhaustion.levels;
    actor.update({ "system.attributes.exhaustion": Math.clamp(level, 0, max) });
  }

  /* -------------------------------------------- */

  /**
   * Manage custom concentration handling when interacting with the token HUD.
   * @param {PointerEvent} event        The triggering event.
   * @param {Actor5e} actor             The actor belonging to the token.
   */
  static _manageConcentration(event, actor) {
    const { effects } = actor.concentration;
    if ( effects.size < 1 ) return;
    event.preventDefault();
    event.stopPropagation();
    if ( effects.size === 1 ) {
      actor.endConcentration(effects.first());
      return;
    }
    const choices = effects.reduce((acc, effect) => {
      const data = effect.getFlag("sw5e", "itemData");
      acc[effect.id] = data?.name ?? actor.items.get(data)?.name ?? game.i18n.localize("SW5E.ConcentratingItemless");
      return acc;
    }, {});
    const options = HandlebarsHelpers.selectOptions(choices, { hash: { sort: true } });
    const content = `
    <form class="sw5e">
      <p>${game.i18n.localize("SW5E.ConcentratingEndChoice")}</p>
      <div class="form-group">
        <label>${game.i18n.localize("SW5E.Source")}</label>
        <div class="form-fields">
          <select name="source">${options}</select>
        </div>
      </div>
    </form>`;
    Dialog.prompt({
      content: content,
      callback: ([html]) => {
        const source = new FormDataExtended(html.querySelector("FORM")).object.source;
        if ( source ) actor.endConcentration(source);
      },
      rejectClose: false,
      title: game.i18n.localize("SW5E.Concentration"),
      label: game.i18n.localize("SW5E.Confirm")
    });
  }

  /* -------------------------------------------- */

  /**
   * Record another effect as a dependent of this one.
   * @param {...ActiveEffect5e} dependent  One or more dependent effects.
   * @returns {Promise<ActiveEffect5e>}
   */
  addDependent(...dependent) {
    const dependents = this.getFlag("sw5e", "dependents") ?? [];
    dependents.push(...dependent.map(d => ({ uuid: d.uuid })));
    return this.setFlag("sw5e", "dependents", dependents);
  }

  /* -------------------------------------------- */

  /**
   * Retrieve a list of dependent effects.
   * @returns {Array<ActiveEffect5e|Item5e>}
   */
  getDependents() {
    return (this.getFlag("sw5e", "dependents") || []).reduce((arr, { uuid }) => {
      const effect = fromUuidSync(uuid);
      if ( effect ) arr.push(effect);
      return arr;
    }, []);
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Helper method to add choices that have been overridden by an active effect. Used to determine what fields might
   * need to be disabled because they are overridden by an active effect in a way not easily determined by looking at
   * the `Document#overrides` data structure.
   * @param {Actor5e|Item5e} doc  Document from which to determine the overrides.
   * @param {string} prefix       The initial form prefix under which the choices are grouped.
   * @param {string} path         Path in document data.
   * @param {string[]} overrides  The list of fields that are currently modified by Active Effects. *Will be mutated.*
   */
  static addOverriddenChoices(doc, prefix, path, overrides) {
    const source = new Set(foundry.utils.getProperty(doc._source, path) ?? []);
    const current = foundry.utils.getProperty(doc, path) ?? new Set();
    const delta = current.symmetricDifference(source);
    for ( const choice of delta ) overrides.push(`${prefix}.${choice}`);
  }

  /* -------------------------------------------- */

  /**
   * Render a rich tooltip for this effect.
   * @param {EnrichmentOptions} [enrichmentOptions={}]  Options for text enrichment.
   * @returns {Promise<{content: string, classes: string[]}>}
   */
  async richTooltip(enrichmentOptions={}) {
    const properties = [];
    if ( this.isSuppressed ) properties.push("SW5E.EffectType.Unavailable");
    else if ( this.disabled ) properties.push("SW5E.EffectType.Inactive");
    else if ( this.isTemporary ) properties.push("SW5E.EffectType.Temporary");
    else properties.push("SW5E.EffectType.Passive");
    if ( this.getFlag("sw5e", "type") === "enchantment" ) properties.push("SW5E.Enchantment.Label");

    return {
      content: await renderTemplate(
        "systems/sw5e/templates/effects/parts/effect-tooltip.hbs", {
          effect: this,
          description: await TextEditor.enrichHTML(this.description ?? "", {
            async: true, relativeTo: this, ...enrichmentOptions
          }),
          durationParts: this.duration.remaining ? this.duration.label.split(", ") : [],
          properties: properties.map(p => game.i18n.localize(p))
        }
      ),
      classes: ["sw5e2", "sw5e-tooltip", "effect-tooltip"]
    };
  }
}
