import ActorSheetOrig5e from "./base-orig-sheet.mjs";
import ActorTypeConfig from "./type-config.mjs";
import AdvancementConfirmationDialog from "../advancement/advancement-confirmation-dialog.mjs";
import AdvancementManager from "../advancement/advancement-manager.mjs";

/**
 * An Actor sheet for player character type actors in the SW5E system.
 */
export default class ActorSheetOrig5eCharacter extends ActorSheetOrig5e {
  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e", "sheet", "actor", "character"]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  static unsupportedItemTypes = new Set(["starshipsize", "starshipmod"]);

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options = {}) {
    const context = await super.getData(options);

    // Resources
    context.resources = ["primary", "secondary", "tertiary"].reduce((arr, r) => {
      const res = foundry.utils.mergeObject(context.actor.system.resources[r] || {}, {
        name: r,
        placeholder: game.i18n.localize(`SW5E.Resource${r.titleCase()}`)
      }, {inplace: false});
      if ( res.value === 0 ) delete res.value;
      if ( res.max === 0 ) delete res.max;
      return arr.concat([res]);
    }, []);

    const classes = this.actor.itemTypes.class;
    return foundry.utils.mergeObject(context, {
      disableExperience: game.settings.get("sw5e", "disableExperienceTracking"),
      classLabels: classes.map(c => c.name).join(", "),
      labels: {
        type: context.system.details.type.label
      },
      multiclassLabels: classes.map(c => [c.archetype?.name ?? "", c.name, c.system.levels].filterJoin(" ")).join(", "),
      weightUnit: game.i18n.localize(
        `SW5E.Abbreviation${game.settings.get("sw5e", "metricWeightUnits") ? "Kg" : "Lbs"}`
      ),
      encumbrance: context.system.attributes.encumbrance
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(context) {
    // Categorize items as inventory, powerbook, features, and classes
    const inventory = {};
    for (const type of ["weapon", "equipment", "consumable", "tool", "container", "loot"]) {
      inventory[type] = { label: `${CONFIG.Item.typeLabels[type]}Pl`, items: [], dataset: { type } };
    }

    // Partition items by category
    let {
      items,
      powers,
      feats,
      classes,
      species,
      archetypes,
      classfeatures,
      backgrounds,
      fightingstyles,
      fightingmasteries,
      lightsaberforms
    } = context.items.reduce(
      (obj, item) => {
        const { quantity, uses, recharge } = item.system;

        // Item details
        const ctx = (context.itemContext[item.id] ??= {});
        ctx.isStack = Number.isNumeric(quantity) && quantity !== 1;
        ctx.attunement = {
          [CONFIG.SW5E.attunementTypes.REQUIRED]: {
            icon: "fa-sun",
            cls: "not-attuned",
            title: "SW5E.AttunementRequired"
          },
          [CONFIG.SW5E.attunementTypes.ATTUNED]: {
            icon: "fa-sun",
            cls: "attuned",
            title: "SW5E.AttunementAttuned"
          }
        }[item.system.attunement];

        // Prepare data needed to display expanded sections
        ctx.isExpanded = this._expanded.has(item.id);

        // Item usage
        ctx.hasUses = item.hasLimitedUses;
        ctx.isOnCooldown = recharge && !!recharge.value && recharge.charged === false;
        ctx.isDepleted = ctx.isOnCooldown && ctx.hasUses && (uses.value > 0);
        ctx.hasTarget = item.hasAreaTarget || item.hasIndividualTarget;

        // Item grouping
        const [originId] = item.getFlag("sw5e", "advancementOrigin")?.split(".") ?? [];
        const group = this.actor.items.get(originId);
        switch ( group?.type ) {
          case "species": ctx.group = "species"; break;
          case "background": ctx.group = "background"; break;
          case "class": ctx.group = group.identifier; break;
          case "archetype": ctx.group = group.class?.identifier ?? "other"; break;
          default: ctx.group = "other";
        }

        // Individual item preparation
        this._prepareItem(item, ctx);

        // Classify items into types
        if (item.type === "power") obj.powers.push(item);
        else if (item.type === "feat") {
          if (item.system.type.value === "class") obj.classfeatures.push(item);
          else if (item.system.type.value === "customizationOption") {
            if (item.system.type.subtype === "fightingMastery") obj.fightingmasteries.push(item);
            else if (item.system.type.subtype === "fightingStyle") obj.fightingstyles.push(item);
            else if (item.system.type.subtype === "lightsaberForm") obj.lightsaberforms.push(item);
          } else obj.feats.push(item);
        }
        else if (item.type === "class") obj.classes.push(item);
        else if (item.type === "species") obj.species.push(item);
        else if (item.type === "archetype") obj.archetypes.push(item);
        else if (item.type === "background") obj.backgrounds.push(item);
        else if (item.type in inventory) obj.items.push(item);
        return obj;
      },
      {
        items: [],
        powers: [],
        feats: [],
        classes: [],
        species: [],
        archetypes: [],
        classfeatures: [],
        backgrounds: [],
        fightingstyles: [],
        fightingmasteries: [],
        lightsaberforms: []
      }
    );

    // Organize items
    for (let i of items) {
      const ctx = (context.itemContext[i.id] ??= {});
      ctx.totalWeight = i.system.totalWeight.toNearest(0.1);
      inventory[i.type].items.push(i);
    }

    // Organize Powerbook and count the number of prepared powers (excluding always, at will, etc...)
    const powerbook = this._preparePowerbook(context, powers);
    const nPrepared = powers.filter(power => {
      const prep = power.system.preparation;
      return power.system.level > 0 && prep.mode === "prepared" && prep.prepared;
    }).length;

    // Sort classes and interleave matching archetypes, put unmatched archetypes into features so they don't disappear
    classes.sort((a, b) => b.system.levels - a.system.levels);
    const maxLevelDelta = CONFIG.SW5E.maxLevel - this.actor.system.details.level;
    classes = classes.reduce((arr, cls) => {
      const ctx = (context.itemContext[cls.id] ??= {});
      ctx.availableLevels = Array.fromRange(CONFIG.SW5E.maxLevel + 1)
        .slice(1)
        .map(level => {
          const delta = level - cls.system.levels;
          return { level, delta, disabled: delta > maxLevelDelta };
        });
      ctx.prefixedImage = cls.img ? foundry.utils.getRoute(cls.img) : null;
      arr.push(cls);
      const identifier = cls.system.identifier || cls.name.slugify({ strict: true });
      const archetype = archetypes.findSplice(s => s.system.classIdentifier === identifier);
      if (archetype) arr.push(archetype);
      return arr;
    }, []);
    for (const archetype of archetypes) {
      feats.push(archetype);
      const message = game.i18n.format("SW5E.ArchetypeMismatchWarn", {
        name: archetype.name,
        class: archetype.system.classIdentifier
      });
      context.warnings.push({ message, type: "warning" });
    }

    // Organize Features
    const features = {
      background: {
        label: CONFIG.Item.typeLabels.background,
        items: backgrounds,
        hasActions: false,
        dataset: { type: "background" },
        isBackground: true
      },
      classes: {
        label: `${CONFIG.Item.typeLabels.class}Pl`,
        items: classes,
        hasActions: false,
        dataset: { type: "class" },
        isClass: true
      },
      classfeatures: {
        label: "SW5E.Feature.Class",
        items: classfeatures,
        hasActions: true,
        dataset: { type: "feat", featType: "class" },
        isClassfeature: true
      },
      species: {
        label: CONFIG.Item.typeLabels.species,
        items: species,
        hasActions: false,
        dataset: { type: "species" },
        isSpecies: true
      },
      fightingstyles: {
        label: "SW5E.CustomizationOption.FightingStyle",
        items: fightingstyles,
        hasActions: true,
        dataset: { type: "feat", featType: "customizationOption", featSubType: "fightingStyle" },
        isFightingstyle: true
      },
      fightingmasteries: {
        label: "SW5E.CustomizationOption.FightingMastery",
        items: fightingmasteries,
        hasActions: true,
        dataset: { type: "feat", featType: "customizationOption", featSubType: "fightingMastery" },
        isFightingmastery: true
      },
      lightsaberforms: {
        label: "SW5E.CustomizationOption.LightsaberForm",
        items: lightsaberforms,
        hasActions: true,
        dataset: { type: "feat", featType: "customizationOption", featSubType: "lightsaberForm" },
        isLightsaberform: true
      },
      active: {
        label: "SW5E.FeatureActive",
        items: [],
        hasActions: true,
        dataset: { type: "feat", "activation.type": "action" }
      },
      passive: {
        label: "SW5E.FeaturePassive",
        items: [],
        hasActions: false,
        dataset: { type: "feat" }
      }
    };

    for (const feat of feats) {
      if (feat.system.activation?.type) features.active.items.push(feat);
      else features.passive.items.push(feat);
    }

    // Assign and return
    context.inventoryFilters = true;
    context.inventory = Object.values(inventory);
    context.powerbook = powerbook;
    context.preparedPowers = nPrepared;
    context.features = Object.values(features);
  }

  /* -------------------------------------------- */

  /**
   * A helper method to establish the displayed preparation state for an item.
   * @param {Item5e} item     Item being prepared for display.
   * @param {object} context  Context data for display.
   * @protected
   */
  _prepareItem(item, context) {
    if (item.type === "power") {
      const prep = item.system.preparation || {};
      const isAlways = prep.mode === "always";
      const isPrepared = !!prep.prepared;
      context.toggleClass = isPrepared ? "active" : "";
      if (isAlways) context.toggleClass = "fixed";
      if (isAlways) context.toggleTitle = CONFIG.SW5E.powerPreparationModes.always;
      else if (isPrepared) context.toggleTitle = CONFIG.SW5E.powerPreparationModes.prepared;
      else context.toggleTitle = game.i18n.localize("SW5E.PowerUnprepared");
    } else {
      const isActive = !!item.system.equipped;
      context.toggleClass = isActive ? "active" : "";
      context.toggleTitle = game.i18n.localize(isActive ? "SW5E.Equipped" : "SW5E.Unequipped");
      context.canToggle = "equipped" in item.system;
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find(".level-selector").change(this._onLevelChange.bind(this));
    html.find(".short-rest").click(this._onShortRest.bind(this));
    html.find(".long-rest").click(this._onLongRest.bind(this));
    html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onConfigMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    if ( (event.currentTarget.dataset.action === "type") && (this.actor.system.details.species?.id) ) {
      new ActorTypeConfig(this.actor.system.details.species, { keyPath: "system.type" }).render(true);
    } else if ( event.currentTarget.dataset.action !== "type" ) {
      return super._onConfigMenu(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle mouse click events for character sheet actions.
   * @param {MouseEvent} event  The originating click event.
   * @returns {Promise}         Dialog or roll result.
   * @protected
   */
  _onSheetAction(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch (button.dataset.action) {
      case "rollDeathSave":
        return this.actor.rollDeathSave({ event });
      case "rollInitiative":
        return this.actor.rollInitiativeDialog({ event });
    }
  }

  /* -------------------------------------------- */

  /**
   * Respond to a new level being selected from the level selector.
   * @param {Event} event                           The originating change.
   * @returns {Promise<AdvancementManager|Item5e>}  Manager if advancements needed, otherwise updated item.
   * @private
   */
  async _onLevelChange(event) {
    event.preventDefault();
    const delta = Number(event.target.value);
    const itemId = event.target.closest("[data-item-id]")?.dataset.itemId;
    if (!delta || !itemId) return;
    const item = this.actor.items.get(itemId);

    let attr = null;
    if (item.type === "class") attr = "levels";
    else if (item.type === "deployment") attr = "rank";
    if (!attr) return ui.error(`Unexpected item.type '${item.type}'`);

    if (!game.settings.get("sw5e", "disableAdvancements")) {
      const manager = AdvancementManager.forLevelChange(this.actor, itemId, delta);
      if (manager.steps.length) {
        if (delta > 0) return manager.render(true);
        try {
          const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forLevelDown(item);
          if (shouldRemoveAdvancements) return manager.render(true);
        } catch(err) {
          return;
        }
      }
    }
    return item.update({ [`system.${attr}`]: item.system[attr] + delta });
  }

  /* -------------------------------------------- */

  /**
   * Take a short rest, calling the relevant function on the Actor instance.
   * @param {Event} event             The triggering click event.
   * @returns {Promise<RestResult>}  Result of the rest action.
   * @private
   */
  async _onShortRest(event) {
    event.preventDefault();
    await this._onSubmit(event);
    return this.actor.shortRest();
  }

  /* -------------------------------------------- */

  /**
   * Take a long rest, calling the relevant function on the Actor instance.
   * @param {Event} event             The triggering click event.
   * @returns {Promise<RestResult>}  Result of the rest action.
   * @private
   */
  async _onLongRest(event) {
    event.preventDefault();
    await this._onSubmit(event);
    return this.actor.longRest();
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropSingleItem(itemData) {
    // Increment the number of class levels a character instead of creating a new item
    if (itemData.type === "class") {
      const charLevel = this.actor.system.details.level;
      itemData.system.levels = Math.min(itemData.system.levels, CONFIG.SW5E.maxLevel - charLevel);
      if (itemData.system.levels <= 0) {
        const err = game.i18n.format("SW5E.MaxCharacterLevelExceededWarn", { max: CONFIG.SW5E.maxLevel });
        ui.notifications.error(err);
        return false;
      }

      const cls = this.actor.itemTypes.class.find(c => c.identifier === itemData.system.identifier);
      if (cls) {
        const priorLevel = cls.system.levels;
        if (!game.settings.get("sw5e", "disableAdvancements")) {
          const manager = AdvancementManager.forLevelChange(this.actor, cls.id, itemData.system.levels);
          if (manager.steps.length) {
            manager.render(true);
            return false;
          }
        }
        cls.update({ "system.levels": priorLevel + itemData.system.levels });
        return false;
      }
    }

    // If a archetype is dropped, ensure it doesn't match another archetype with the same identifier
    else if (itemData.type === "archetype") {
      const other = this.actor.itemTypes.archetype.find(i => i.identifier === itemData.system.identifier);
      if (other) {
        const err = game.i18n.format("SW5E.ArchetypeDuplicateError", { identifier: other.identifier });
        ui.notifications.error(err);
        return false;
      }
      const cls = this.actor.itemTypes.class.find(i => i.identifier === itemData.system.classIdentifier);
      if (cls && cls.archetype) {
        const err = game.i18n.format("SW5E.ArchetypeAssignmentError", {
          class: cls.name,
          archetype: cls.archetype.name
        });
        ui.notifications.error(err);
        return false;
      }
    }
    return super._onDropSingleItem(itemData);
  }
}
