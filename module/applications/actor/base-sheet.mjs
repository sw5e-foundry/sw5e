import ActiveEffect5e from "../../documents/active-effect.mjs";
import * as Trait from "../../documents/actor/trait.mjs";
import Item5e from "../../documents/item.mjs";

import ActorAbilityConfig from "./ability-config.mjs";
import ActorArmorConfig from "./armor-config.mjs";
import ActorHitDiceConfig from "./hit-dice-config.mjs";
import ActorHitPointsConfig from "./hit-points-config.mjs";
import ActorCastPointsConfig from "./cast-points-config.mjs";
import ActorInitiativeConfig from "./initiative-config.mjs";
import ActorMovementConfig from "./movement-config.mjs";
import ActorSensesConfig from "./senses-config.mjs";
import ActorSheetFlags from "./sheet-flags.mjs";
import ActorTypeConfig from "./type-config.mjs";
import SourceConfig from "../source-config.mjs";

import AdvancementConfirmationDialog from "../advancement/advancement-confirmation-dialog.mjs";
import AdvancementManager from "../advancement/advancement-manager.mjs";

import PropertyAttribution from "../property-attribution.mjs";
import TraitSelector from "./trait-selector.mjs";
import ProficiencyConfig from "./proficiency-config.mjs";
import ToolSelector from "./tool-selector.mjs";
import { simplifyBonus } from "../../utils.mjs";
import ActorSheetMixin from "./sheet-mixin.mjs";

/**
 * Extend the basic ActorSheet class to suppose SW5e-specific logic and functionality.
 * @abstract
 */
export default class ActorSheet5e extends ActorSheetMixin(ActorSheet) {
  /**
   * Track the set of item filters which are applied
   * @type {Object<string, Set>}
   * @protected
   */
  _filters = {
    inventory: new Set(),
    ssactions: new Set(),
    forcePowerbook: new Set(),
    techPowerbook: new Set(),
    superiorityPowerbook: new Set(),
    features: new Set(),
    ssfeatures: new Set(),
    ssequipment: new Set(),
    effects: new Set()
  };

  /* -------------------------------------------- */

  /**
   * Track the most recent drag event.
   * @type {DragEvent}
   * @protected
   */
  _event = null;

  /* -------------------------------------------- */

  /**
   * IDs for items on the sheet that have been expanded.
   * @type {Set<string>}
   * @protected
   */
  _expanded = new Set();

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      scrollY: [
        ".inventory .group-list",
        ".cargo .group-list",
        ".features .group-list",
        ".ssfeatures .group-list",
        ".force-powerbook .group-list",
        ".tech-powerbook .group-list",
        ".superiority-powerbook .group-list",
        ".effects .effects-list",
        ".center-pane"
      ],
      tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /* -------------------------------------------- */

  /**
   * A set of item types that should be prevented from being dropped on this type of actor sheet.
   * @type {Set<string>}
   */
  static unsupportedItemTypes = new Set();

  /* -------------------------------------------- */

  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited) return "systems/sw5e/templates/actors/newActor/expanded-limited-sheet.hbs";
    return `systems/sw5e/templates/actors/newActor/${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    // The Actor's data
    const source = this.actor.toObject();

    // Basic data
    const context = {
      actor: this.actor,
      source: source.system,
      system: this.actor.system,
      items: Array.from(this.actor.items),
      itemContext: {},
      abilities: foundry.utils.deepClone(this.actor.system.abilities),
      skills: foundry.utils.deepClone(this.actor.system.skills ?? {}),
      tools: foundry.utils.deepClone(this.actor.system.tools ?? {}),
      labels: this._getLabels(),
      movement: this._getMovementSpeed(this.actor.system),
      senses: this._getSenses(this.actor.system),
      effects: ActiveEffect5e.prepareActiveEffectCategories(this.actor.effects),
      warnings: foundry.utils.deepClone(this.actor._preparationWarnings),
      filters: this._filters,
      owner: this.actor.isOwner,
      limited: this.actor.limited,
      options: this.options,
      editable: this.isEditable,
      cssClass: this.actor.isOwner ? "editable" : "locked",
      isCharacter: this.actor.type === "character",
      isNPC: this.actor.type === "npc",
      isStarship: this.actor.type === "starship",
      isVehicle: this.actor.type === "vehicle",
      config: CONFIG.SW5E,
      rollableClass: this.isEditable ? "rollable" : "",
      rollData: this.actor.getRollData(),
      overrides: {
        attunement: foundry.utils.hasProperty(this.actor.overrides, "system.attributes.attunement.max")
      }
    };

    // Sort Owned Items
    context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    const hp = { ...context.system.attributes.hp };
    // Temporary HP
    if (!context.isStarship) {
      if (hp.temp === 0) delete hp.temp;
      if (hp.tempmax === 0) delete hp.tempmax;
    }
    context.hp = hp;
    context.sourceHP = context.source.attributes.hp;

    // Powercasting
    context.force = { ...context.system.attributes.force };
    context.tech = { ...context.system.attributes.tech };
    context.super = { ...context.system.attributes.super };
    context.sourceForce = context.source.attributes.force;
    context.sourceFech = context.source.attributes.tech;
    context.sourceFuper = context.source.attributes.super;

    // Ability Scores
    for (const [a, abl] of Object.entries(context.abilities)) {
      abl.icon = this._getProficiencyIcon(abl.proficient);
      abl.hover = CONFIG.SW5E.proficiencyLevels[abl.proficient].label;
      abl.label = CONFIG.SW5E.abilities[a]?.label;
      abl.baseProf = source.system.abilities[a]?.proficient ?? 0;
    }

    // Skills & Tools
    ["skills", "tools"].forEach(prop => {
      for (const [key, entry] of Object.entries(context[prop])) {
        entry.abbreviation = CONFIG.SW5E.abilities[entry.ability]?.abbreviation;
        entry.icon = this._getProficiencyIcon(entry.value);
        entry.hover = CONFIG.SW5E.proficiencyLevels[entry.value].label;
        entry.label =
          prop === "skills"
            ? context.isStarship
              ? CONFIG.SW5E.starshipSkills[key]?.label
              : CONFIG.SW5E.skills[key]?.label
            : Trait.keyLabel(key, { trait: "tool" });
        entry.baseValue = source.system[prop]?.[key]?.value ?? 0;
      }
    });

    // Update traits
    context.traits = this._prepareTraits(context.system);

    // Prepare owned items
    this._prepareItems(context);
    context.expandedData = {};
    for (const id of this._expanded) {
      const item = this.actor.items.get(id);
      if (item) context.expandedData[id] = await item.getChatData({ secrets: this.actor.isOwner });
    }

    // Biography HTML enrichment
    context.biographyHTML = await TextEditor.enrichHTML(context.system.details.biography.value, {
      secrets: this.actor.isOwner,
      rollData: context.rollData,
      async: true,
      relativeTo: this.actor
    });

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare labels object for the context.
   * @returns {object}           Object containing various labels.
   * @protected
   */
  _getLabels() {
    const labels = { ...this.actor.labels };

    // Currency Labels
    labels.currencies = Object.entries(CONFIG.SW5E.currencies).reduce((obj, [k, c]) => {
      obj[k] = c.label;
      return obj;
    }, {});

    // Proficiency
    labels.proficiency =
      game.settings.get("sw5e", "proficiencyModifier") === "dice"
        ? `d${this.actor.system.attributes.prof * 2}`
        : `+${this.actor.system.attributes.prof}`;

    return labels;
  }

  /* -------------------------------------------- */

  /**
   * Prepare the display of movement speed data for the Actor.
   * @param {object} systemData               System data for the Actor being prepared.
   * @param {boolean} [largestPrimary=false]  Show the largest movement speed as "primary", otherwise show "walk".
   * @returns {{primary: string, special: string}}
   * @protected
   */
  _getMovementSpeed(systemData, largestPrimary = false) {
    const movement = systemData.attributes.movement ?? {};

    // Prepare an array of available movement speeds
    let speeds = [
      [movement.burrow, `${game.i18n.localize("SW5E.MovementBurrow")} ${movement.burrow}`],
      [movement.climb, `${game.i18n.localize("SW5E.MovementClimb")} ${movement.climb}`],
      [
        movement.fly,
        `${game.i18n.localize("SW5E.MovementFly")} ${movement.fly}${
          movement.hover ? ` (${game.i18n.localize("SW5E.MovementHover")})` : ""
        }`
      ],
      [movement.swim, `${game.i18n.localize("SW5E.MovementSwim")} ${movement.swim}`]
    ];
    if (largestPrimary) {
      speeds.push([movement.walk, `${game.i18n.localize("SW5E.MovementWalk")} ${movement.walk}`]);
    }

    // Filter and sort speeds on their values
    speeds = speeds.filter(s => s[0]).sort((a, b) => b[0] - a[0]);

    // Case 1: Largest as primary
    if (largestPrimary) {
      let primary = speeds.shift();
      return {
        primary: `${primary ? primary[1] : "0"} ${movement.units || Object.keys(CONFIG.SW5E.movementUnits)[0]}`,
        special: speeds.map(s => s[1]).join(", ")
      };
    }

    // Case 2: Walk as primary
    else {
      return {
        primary: `${movement.walk || 0} ${movement.units || Object.keys(CONFIG.SW5E.movementUnits)[0]}`,
        special: speeds.length ? speeds.map(s => s[1]).join(", ") : ""
      };
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare senses object for display.
   * @param {object} systemData  System data for the Actor being prepared.
   * @returns {object}           Senses grouped by key with localized and formatted string.
   * @protected
   */
  _getSenses(systemData) {
    const senses = systemData.attributes.senses ?? {};
    const tags = {};
    for (let [k, label] of Object.entries(CONFIG.SW5E.senses)) {
      const v = senses[k] ?? 0;
      if (v === 0) continue;
      tags[k] = `${game.i18n.localize(label)} ${v} ${senses.units ?? Object.keys(CONFIG.SW5E.movementUnits)[0]}`;
    }
    if (senses.special) senses.special.split(";").forEach((c, i) => tags[`custom${i+1}`] = c.trim());
    return tags;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async activateEditor(name, options = {}, initialContent = "") {
    options.relativeLinks = true;
    return super.activateEditor(name, options, initialContent);
  }

  /* --------------------------------------------- */
  /*  Property Attribution                         */
  /* --------------------------------------------- */

  /**
   * Break down all of the Active Effects affecting a given target property.
   * @param {string} target               The data property being targeted.
   * @returns {AttributionDescription[]}  Any active effects that modify that property.
   * @protected
   */
  _prepareActiveEffectAttributions(target) {
    const rollData = this.actor.getRollData({deterministic: true});
    return this.actor.effects.reduce((arr, e) => {
      let source = e.sourceName;
      if (e.origin === this.actor.uuid) source = e.name;
      if (source && source !== e.name) source = `${source}/${e.name}`;
      if (!source || e.disabled || e.isSuppressed) return arr;
      let override = null;
      const value = e.changes.reduce((n, change) => {
        if (change.key !== target) return n;
        if (override) return n;
        if ([CONST.ACTIVE_EFFECT_MODES.OVERRIDE, CONST.ACTIVE_EFFECT_MODES.CUSTOM].includes(change.mode)) {
          override = change.mode;
          return simplifyBonus(change.value, rollData);
        }
        else if (change.mode !== CONST.ACTIVE_EFFECT_MODES.ADD) return n;
        return n + simplifyBonus(change.value, rollData);
      }, 0);
      if (!value) return arr;
      arr.push({ value, label: source, mode: override ?? CONST.ACTIVE_EFFECT_MODES.ADD });
      return arr;
    }, []);
  }

  /* -------------------------------------------- */

  /**
   * Produce a list of armor class attribution objects.
   * @param {object} rollData             Data provided by Actor5e#getRollData
   * @returns {AttributionDescription[]}  List of attribution descriptions.
   * @protected
   */
  _prepareArmorClassAttribution(rollData) {
    const ac = rollData.attributes.ac;
    const cfg = CONFIG.SW5E.armorClasses[ac.calc];
    const attribution = [];

    // Base AC Attribution
    switch (ac.calc) {
      // Flat AC
      case "flat":
        return [
          {
            label: game.i18n.localize("SW5E.ArmorClassFlat"),
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: ac.flat
          }
        ];

      // Natural armor
      case "natural":
        attribution.push({
          label: game.i18n.localize("SW5E.ArmorClassNatural"),
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: ac.flat
        });
        break;

      default:
        const formula = ac.calc === "custom" ? ac.formula : cfg.formula;
        let base = ac.base;
        const dataRgx = new RegExp(/@([a-z.0-9_-]+)/gi);
        for (const [match, term] of formula.matchAll(dataRgx)) {
          const value = String(foundry.utils.getProperty(rollData, term));
          if (term === "attributes.ac.armor" || value === "0") continue;
          if (Number.isNumeric(value)) base -= Number(value);
          attribution.push({
            label: match,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value
          });
        }
        const armorInFormula = formula.includes("@attributes.ac.armor");
        let label = game.i18n.localize("SW5E.PropertyBase");
        if (armorInFormula) label = this.actor.armor?.name ?? game.i18n.localize("SW5E.ArmorClassUnarmored");
        attribution.unshift({
          label,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: base
        });
        break;
    }

    // Shield
    if (ac.shield !== 0) attribution.push({
      label: this.actor.shield?.name ?? game.i18n.localize("SW5E.EquipmentShield"),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: ac.shield
    });

    // Bonus
    if (ac.bonus !== 0) attribution.push(...this._prepareActiveEffectAttributions("system.attributes.ac.bonus"));

    // Cover
    if (ac.cover !== 0) attribution.push({
      label: game.i18n.localize("SW5E.Cover"),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: ac.cover
    });
    return attribution;
  }

  /* -------------------------------------------- */

  /**
   * Prepare the data structure for traits data like languages, resistances & vulnerabilities, and proficiencies.
   * @param {object} systemData  System data for the Actor being prepared.
   * @returns {object}           Prepared trait data.
   * @protected
   */
  _prepareTraits(systemData) {
    const traits = {};
    for (const [trait, traitConfig] of Object.entries(CONFIG.SW5E.traits)) {
      const key = traitConfig.actorKeyPath?.replace("system.", "") ?? `traits.${trait}`;
      const data = foundry.utils.deepClone(foundry.utils.getProperty(systemData, key));
      if (!data) continue;

      foundry.utils.setProperty(traits, key, data);
      let values = data.value;
      if (!values) values = [];
      else if (values instanceof Set) values = Array.from(values);
      else if (!Array.isArray(values)) values = [values];

      // Split physical damage types from others if bypasses is set
      const physical = [];
      if (data.bypasses?.size) {
        values = values.filter(t => {
          if (!CONFIG.SW5E.physicalDamageTypes[t]) return true;
          physical.push(t);
          return false;
        });
      }

      // Fill out trait values
      data.selected = values.reduce((obj, key) => {
        obj[key] = Trait.keyLabel(key, { trait }) ?? key;
        return obj;
      }, {});

      // Display bypassed damage types
      if (physical.length) {
        const damageTypesFormatter = new Intl.ListFormat(game.i18n.lang, { style: "long", type: "conjunction" });
        const bypassFormatter = new Intl.ListFormat(game.i18n.lang, { style: "long", type: "disjunction" });
        data.selected.physical = game.i18n.format("SW5E.DamagePhysicalBypasses", {
          damageTypes: damageTypesFormatter.format(physical.map(t => Trait.keyLabel(t, { trait }))),
          bypassTypes: bypassFormatter.format(data.bypasses.map(t => CONFIG.SW5E.physicalWeaponProperties[t]?.full))
        });
      }

      // Add custom entries
      if (data.custom) data.custom.split(";").forEach((c, i) => (data.selected[`custom${i + 1}`] = c.trim()));
      data.cssClass = !foundry.utils.isEmpty(data.selected) ? "" : "inactive";
    }

    return traits;
  }

  /* -------------------------------------------- */

  /**
   * Prepare the data structure for items which appear on the actor sheet.
   * Each archetype overrides this method to implement type-specific logic.
   * @param {object} context
   * @protected
   */
  _prepareItems(context) {}

  /* -------------------------------------------- */

  _prepareItemCategories(config = {}) {
    config = foundry.utils.mergeObject(
      {
        expandSubtypes: true,
        combineForcePowers: true,
        combineManeuvers: true,
        splitActive: false,
        splitEquipped: false
      },
      config
    );
    const categories = {
      inventory: {},
      class: {},
      features: {},
      powers: {},
      maneuvers: {},
      unsorted: { label: "SW5E.Unsorted", items: [] },
      config
    };

    if (config.splitEquipped) categories.equipped = {};
    for (const itemType of config.inventoryItems ?? CONFIG.SW5E.itemTypes.inventory) {
      categories.inventory[itemType] = {
        label: `${CONFIG.Item.typeLabels[itemType]}Pl`,
        items: [],
        required: true,
        dataset: { type: itemType }
      };
      if (config.splitEquipped) {
        categories.equipped[itemType] = {
          label: `${CONFIG.Item.typeLabels[itemType]}Pl`,
          items: [],
          required: true,
          dataset: { type: itemType, equipped: true }
        };
      }
    }

    for (const itemType of config.classItems ?? CONFIG.SW5E.itemTypes.class) {
      categories.class[itemType] = {
        label: CONFIG.Item.typeLabels[itemType],
        items: [],
        required: true,
        dataset: { type: itemType }
      };
    }

    for (const [type, val] of Object.entries(config.featureTypes ?? CONFIG.SW5E.featureTypes)) {
      if ("subtypes" in val && config.expandSubtypes) for (const [subtype, label] of Object.entries(val.subtypes)) {
        categories.features[`feat.${type}.${subtype}`] = {
          label,
          items: [],
          hasActions: true,
          dataset: { type: "feat", featType: type, featSubtype: subtype }
        };
      }
      categories.features[`feat.${type}`] = {
        label: val.label,
        items: [],
        hasActions: true,
        dataset: { type: "feat", featType: type }
      };
    }
    if (config.splitActive) {
      categories.features.active = {
        label: "SW5E.FeatureActive",
        items: [],
        hasActions: true,
        required: true,
        dataset: { type: "feat", "activation.type": "action" }
      };
      categories.features.passive = {
        label: "SW5E.FeaturePassive",
        items: [],
        hasActions: false,
        required: true,
        dataset: { type: "feat" }
      };
    } else categories.features.feat = {
      label: "ITEM.TypeFeat",
      items: [],
      hasActions: true,
      required: true,
      dataset: { type: "feat" }
    };

    for (const [scl, label] of Object.entries(config.powerSchools ?? CONFIG.SW5E.powerSchools)) {
      if (config.combineForcePowers && ["lgt", "uni", "drk"].includes(scl)) continue;
      categories.powers[scl] = { label, items: [], dataset: { type: "power", school: scl } };
    }
    if (config.combineForcePowers) categories.powers.for = { items: [], dataset: { type: "power", school: "uni" } };

    if (config.combineManeuvers) categories.maneuvers = { items: [], dataset: { type: "maneuver", maneuverType: "general" } };
    else for (const [type, label] of Object.entries(config.maneuverTypes ?? CONFIG.SW5E.maneuverTypes)) {
      categories.maneuvers[type] = { label, items: [], dataset: { type: "maneuver", maneuverType: type } };
    }

    return categories;
  }

  _prepareItemsCategorized(context, categories) {
    const config = categories.config;
    for (const item of context.items) {

      // Item context
      const ctx = context.itemContext[item.id] ??= {};
      this._prepareItemContext(item, ctx);

      // Categorize the item
      if (config.splitEquipped && equipped && item.type in categories.equipped) {
        categories.equipped[item.type].items.push(item);
        continue;
      } else if (item.type in categories.inventory) {
        categories.inventory[item.type].items.push(item);
        continue;
      } else if (item.type in categories.class) {
        categories.class[item.type].items.push(item);
        continue;
      } else if (item.type === "feat") {
        const featType = item.system.type.value ? `feat.${item.system.type.value}` : null;
        const featSubtype = featType && item.system.type.subtype ? `${featType}.${item.system.type.subtype}` : null;
        if (featSubtype in categories.features) categories.features[featSubtype].items.push(item);
        else if (featType in categories.features) categories.features[featType].items.push(item);
        else if (config.splitActive) {
          if (item.system.activation?.type) categories.features.active.items.push(item);
          else categories.features.passive.items.push(item);
        } else categories.features.feat.items.push(item);
        continue;
      } else if (item.type === "power") {
        if (["lgt", "uni", "drk"].includes(item.system.school) && config.combineForcePowers) {
          categories.powers.for.items.push(item);
          continue;
        } else if (item.system.school in categories.powers) {
          categories.powers[item.system.school]?.items?.push(item);
          continue;
        }
      } else if (item.type === "maneuver") {
        if (config.combineManeuvers) {
          categories.maneuvers.items.push(item);
          continue;
        } else {
          categories.maneuvers[item.system.maneuverType]?.items.push(item);
          continue;
        }
      }

      categories.unsorted.items.push(item);
      console.warn(`Item ${item.name} of type ${item.type} is unsorted.`);
    }
  }

  _prepareItemContext(item, ctx={}) {
    const { quantity, uses, recharge, equipped } = item.system;

    // Item details
    ctx.isStack = Number.isNumeric(quantity) && quantity !== 1;
    ctx.id = item.id;
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

    // Item toggle state
    this._prepareItemToggleState(item, ctx);

    // Item Weight
    if ("weight" in item.system) ctx.totalWeight = ((item.system.quantity ?? 1) * item.system.weight).toNearest(0.1);

    // Weapon Firing Arc
    if ("firingArc" in item.system) ctx.firingArc = CONFIG.SW5E.weaponFiringArcs[item.system.firingArc]?.label;

    // Item properties
    ctx.propertiesList = item.propertiesList;
    ctx.isStarshipItem = item.isStarshipItem;
    item.sheet._getWeaponReloadProperties(ctx);

    return ctx;
  }

  /* -------------------------------------------- */

  /**
   * Insert a power into the powerbook object when rendering the character sheet.
   * @param {object} context    Sheet rendering context data being prepared for render.
   * @param {object[]} powers   Powers to be included in the powerbook.
   * @param {string} school     The school of the powerbook being prepared.
   * @returns {object[]}        Powerbook sections in the proper order.
   * @protected
   */
  _preparePowerbook(context, powers, school) {
    const owner = this.actor.isOwner;
    const levels = context.actor.system.powers;
    const powerbook = {};
    const schoolCfg = CONFIG.SW5E.powerSchools[school];
    const powerType = schoolCfg.isForce ? "force" : "tech";

    const abbr = powerType[0];
    const aMax = `${abbr}max`;
    const aVal = `${abbr}val`;
    const aOverride = `${abbr}override`;

    // Define section and label mappings
    const sections = { atwill: -20, innate: -10 };
    const useLabels = { "-20": "-", "-10": "-", 0: "&infin;" };

    // Format a powerbook entry for a certain indexed level
    const registerSection = (sl, i, label, { prepMode = "prepared", value, max, override } = {}) => {
      const aeOverride = foundry.utils.hasProperty(this.actor.overrides, `system.powers.power${i}.${aOverride}`);
      powerbook[i] = {
        order: i,
        label: label,
        usesSlots: i > 0,
        canCreate: owner,
        canPrepare: context.actor.type === "character" && i >= 1,
        powers: [],
        uses: useLabels[i] || value || 0,
        slots: useLabels[i] || max || 0,
        override: override || 0,
        dataset: {
          type: "power",
          level: prepMode in sections ? 1 : i,
          "preparation.mode": prepMode,
          school: school
        },
        prop: sl,
        editable: context.editable && !aeOverride
      };
    };

    // Determine the maximum power level which has a slot
    const maxLevel = context.actor.system.attributes[powerType].maxPowerLevel;

    // Level-based powercasters have cantrips and leveled slots
    if (maxLevel > 0) {
      registerSection("power0", 0, CONFIG.SW5E.powerLevels[0]);
      for (let lvl = 1; lvl <= maxLevel; lvl++) {
        const sl = `power${lvl}`;
        registerSection(sl, lvl, CONFIG.SW5E.powerLevels[lvl], levels[sl]);
      }
    }

    // Iterate over every power item, adding powers to the powerbook by section
    powers.forEach(power => {
      const mode = power.system.preparation.mode || "prepared";
      let s = power.system.level || 0;
      const sl = `power${s}`;

      // Specialized powercasting modes (if they exist)
      if (mode in sections) {
        s = sections[mode];
        if (!powerbook[s]) {
          const l = levels[mode] || {};
          const config = CONFIG.SW5E.powerPreparationModes[mode];
          registerSection(mode, s, config, {
            prepMode: mode,
            value: l[aVal],
            max: l[aMax],
            override: l[aOverride]
          });
        }
      }

      // Sections for higher-level powers which the caster "should not" have, but power items exist for
      else if (!powerbook[s]) {
        registerSection(sl, s, CONFIG.SW5E.powerLevels[s], { levels: levels[sl] });
      }

      // Add the power to the relevant heading
      powerbook[s].powers.push(power);
    });

    // Sort the powerbook by section level
    const sorted = Object.values(powerbook);
    sorted.sort((a, b) => a.order - b.order);
    return sorted;
  }

  /* -------------------------------------------- */

  /**
   * Insert a maneuver into the superiority powerbook object when rendering the character sheet.
   * @param {object[]} maneuvers  Maneuvers to be included in the superiority powerbook.
   * @returns {object[]}          Superiority powerbook sections in the proper order.
   * @protected
   */
  _prepareManeuvers(maneuvers) {
    const owner = this.actor.isOwner;

    const superiorityPowerbook = Object.keys(CONFIG.SW5E.maneuverTypes).reduce((obj, t, i) => {
      obj[t] = {
        order: i,
        label: CONFIG.SW5E.maneuverTypes[t],
        canCreate: owner,
        maneuvers: [],
        dataset: {
          type: "maneuver",
          "maneuver-type": t
        }
      };
      return obj;
    }, {});

    // Iterate over every maneuver item, adding maneuvers to the superiorityPowerbook by section
    maneuvers.forEach(maneuver => {
      const type = maneuver.system.maneuverType;
      superiorityPowerbook[type].maneuvers.push(maneuver);
    });

    // Sort the superiorityPowerbook
    const sorted = Object.values(superiorityPowerbook);
    sorted.sort((a, b) => a.order - b.order);
    return sorted;
  }

  /* -------------------------------------------- */

  /**
   * Determine whether an Owned Item will be shown based on the current set of filters.
   * @param {object[]} items       Copies of item data to be filtered.
   * @param {Set<string>} filters  Filters applied to the item list.
   * @returns {object[]}           Subset of input items limited by the provided filters.
   * @protected
   */
  _filterItems(items, filters) {
    return items.filter(item => {
      // Do not display modifications that are applied to an item
      if (item.system.modifying?.id) return false;

      // Action usage
      for (let f of ["action", "bonus", "reaction"]) {
        if (filters.has(f) && item.system.activation.type !== f) return false;
      }

      // Power-specific filters
      if (filters.has("ritual") && item.system.components.ritual !== true) return false;
      if (filters.has("concentration") && item.system.components.concentration !== true) return false;
      if (filters.has("prepared")) {
        if (item.system.level === 0 || ["innate", "always"].includes(item.system.preparation.mode)) return true;
        if (["npc", "starship"].includes(this.actor.type)) return true;
        return item.system.preparation.prepared;
      }

      // Equipment-specific filters
      if (filters.has("equipped") && item.system.equipped !== true) return false;
      return true;
    });
  }

  /* -------------------------------------------- */

  /**
   * Get the font-awesome icon used to display a certain level of skill proficiency.
   * @param {number} level  A proficiency mode defined in `CONFIG.SW5E.proficiencyLevels`.
   * @returns {string}      HTML string for the chosen icon.
   * @private
   */
  _getProficiencyIcon(level) {
    const levels = CONFIG.SW5E.proficiencyLevels;
    const icon = (levels[level] ?? levels[0]).icon;
    return `<i class="${icon}"></i>`;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    // Activate Item Filters
    const filterLists = html.find(".filter-list");
    filterLists.each(this._initializeFilterItemList.bind(this));
    filterLists.on("click", ".filter-item", this._onToggleFilter.bind(this));

    // Item summaries
    html.find(".item .item-name.rollable h4").click(event => this._onItemSummary(event));

    // View Item Sheets
    html.find(".item-edit").click(this._onItemEdit.bind(this));

    // Property attributions
    html.find("[data-attribution]").mouseover(this._onPropertyAttribution.bind(this));
    html.find(".attributable").mouseover(this._onPropertyAttribution.bind(this));

    // Preparation Warnings
    html.find(".warnings").click(this._onWarningLink.bind(this));

    // Editable Only Listeners
    if (this.isEditable) {
      // Input focus and update
      const inputs = html.find("input");
      inputs.focus(ev => ev.currentTarget.select());
      inputs.addBack().find('[type="text"][data-dtype="Number"]').change(this._onChangeInputDelta.bind(this));

      // Ability Proficiency
      html.find(".ability-proficiency").click(this._onCycleAbilityProficiency.bind(this));

      // Toggle Skill Proficiency
      html.find(".skill-proficiency").on("click contextmenu", event => this._onCycleProficiency(event, "skill"));

      // Toggle Tool Proficiency
      html.find(".tool-proficiency").on("click contextmenu", event => this._onCycleProficiency(event, "tool"));

      // Trait Selector
      html.find(".trait-selector").click(this._onTraitSelector.bind(this));

      // Configure Special Flags
      html.find(".config-button").click(this._onConfigMenu.bind(this));

      // Owned Item management
      html.find(".item-create").click(this._onItemCreate.bind(this));
      html.find(".item-delete").click(this._onItemDelete.bind(this));
      html.find(".item-collapse").click(this._onItemCollapse.bind(this));
      html.find(".item-uses input, .item-reload input").click(ev => ev.target.select()).change(this._onUsesChange.bind(this));
      html.find(".item-quantity input").click(ev => ev.target.select()).change(this._onQuantityChange.bind(this));
      html.find(".weapon-select-ammo").change(event => {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet._onWeaponSelectAmmo(event);
      });
      html.find(".slot-max-override").click(this._onPowerSlotOverride.bind(this));
      html.find(".attunement-max-override").click(this._onAttunementOverride.bind(this));

      // Active Effect management
      html.find(".effect-control").click(ev => ActiveEffect5e.onManageActiveEffect(ev, this.actor));
      this._disableOverriddenFields(html);
    }

    // Owner Only Listeners, for non-compendium actors.
    if ( this.actor.isOwner && !this.actor.compendium ) {
      // Ability Checks
      html.find(".ability-name").click(this._onRollAbilityTest.bind(this));

      // Roll Skill Checks
      html.find(".skill-name").click(this._onRollSkillCheck.bind(this));

      // Roll Tool Checks.
      html.find(".tool-name").on("click", this._onRollToolCheck.bind(this));

      // Item Rolling
      html.find(".rollable .item-image").click(event => this._onItemUse(event));
      html.find(".item .item-recharge").click(event => this._onItemRecharge(event));
    }

    // Otherwise, remove rollable classes
    else {
      html.find(".rollable").each((i, el) => el.classList.remove("rollable"));
    }

    // Item Context Menu
    new ContextMenu(html, ".item-list .item", [], { onOpen: this._onItemContext.bind(this) });

    // Handle default listeners last so system listeners are triggered first
    super.activateListeners(html);
  }

  /* -------------------------------------------- */

  /**
   * Disable any fields that are overridden by active effects and display an informative tooltip.
   * @param {jQuery} html  The sheet's rendered HTML.
   * @protected
   */
  _disableOverriddenFields(html) {
    const proficiencyToggles = {
      ability: /system\.abilities\.([^.]+)\.proficient/,
      skill: /system\.skills\.([^.]+)\.value/,
      tool: /system\.tools\.([^.]+)\.value/
    };

    for (const override of Object.keys(foundry.utils.flattenObject(this.actor.overrides))) {
      html.find(`input[name="${override}"],select[name="${override}"]`).each((i, el) => {
        el.disabled = true;
        el.dataset.tooltip = "SW5E.ActiveEffectOverrideWarning";
      });

      for (const [key, regex] of Object.entries(proficiencyToggles)) {
        const [, match] = override.match(regex) || [];
        if (match) {
          const toggle = html.find(`li[data-${key}="${match}"] .proficiency-toggle`);
          toggle.addClass("disabled");
          toggle.attr("data-tooltip", "SW5E.ActiveEffectOverrideWarning");
        }
      }

      const [, power] = override.match(/system\.powers\.(power\d)\.override/) || [];
      if (power) {
        html.find(`.power-max[data-level="${power}"]`).attr("data-tooltip", "SW5E.ActiveEffectOverrideWarning");
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle activation of a context menu for an embedded Item or ActiveEffect document.
   * Dynamically populate the array of context menu options.
   * @param {HTMLElement} element       The HTML element for which the context menu is activated
   * @protected
   */
  _onItemContext(element) {
    // Active Effects
    if (element.classList.contains("effect")) {
      const effect = this.actor.effects.get(element.dataset.effectId);
      if (!effect) return;
      ui.context.menuItems = this._getActiveEffectContextOptions(effect);
      Hooks.call("sw5e.getActiveEffectContextOptions", effect, ui.context.menuItems);
    }

    // Items
    else {
      const item = this.actor.items.get(element.dataset.itemId);
      if (!item) return;
      ui.context.menuItems = this._getItemContextOptions(item);
      Hooks.call("sw5e.getItemContextOptions", item, ui.context.menuItems);
    }
  }

  /* -------------------------------------------- */

  /**
   * Initialize Item list filters by activating the set of filters which are currently applied
   * @param {number} i  Index of the filter in the list.
   * @param {HTML} ul   HTML object for the list item surrounding the filter.
   * @private
   */
  _initializeFilterItemList(i, ul) {
    const set = this._filters[ul.dataset.filter];
    const filters = ul.querySelectorAll(".filter-item");
    for (let li of filters) {
      if (set.has(li.dataset.filter)) li.classList.add("active");
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle spawning the TraitSelector application which allows a checkbox of multiple trait options.
   * @param {Event} event   The click event which originated the selection.
   * @private
   */
  _onConfigMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    let app;
    switch (button.dataset.action) {
      case "armor":
        app = new ActorArmorConfig(this.actor);
        break;
      case "hit-dice":
        app = new ActorHitDiceConfig(this.actor);
        break;
      case "hit-points":
      case "hull-points":
      case "shield-points":
        app = new ActorHitPointsConfig(button.dataset.action, this.actor);
        break;
      case "force-points":
      case "tech-points":
      case "super-dice":
        app = new ActorCastPointsConfig(button.dataset.action, this.actor);
        break;
      case "initiative":
        app = new ActorInitiativeConfig(this.actor);
        break;
      case "movement":
        app = new ActorMovementConfig(this.actor);
        break;
      case "flags":
        app = new ActorSheetFlags(this.actor);
        break;
      case "senses":
        app = new ActorSensesConfig(this.actor);
        break;
      case "source":
        app = new SourceConfig(this.actor);
        break;
      case "type":
        app = new ActorTypeConfig(this.actor);
        break;
      case "ability":
        const ability = event.currentTarget.closest("[data-ability]").dataset.ability;
        app = new ActorAbilityConfig(this.actor, null, ability);
        break;
      case "skill":
        const skill = event.currentTarget.closest("[data-key]").dataset.key;
        app = new ProficiencyConfig(this.actor, { property: "skills", key: skill });
        break;
      case "tool":
        const tool = event.currentTarget.closest("[data-key]").dataset.key;
        app = new ProficiencyConfig(this.actor, { property: "tools", key: tool });
        break;
    }
    app?.render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle cycling proficiency in a skill or tool.
   * @param {Event} event     A click or contextmenu event which triggered this action.
   * @returns {Promise|void}  Updated data for this actor after changes are applied.
   * @protected
   */
  _onCycleProficiency(event) {
    if (event.currentTarget.classList.contains("disabled")) return;
    event.preventDefault();
    const parent = event.currentTarget.closest(".proficiency-row");
    const field = parent.querySelector('[name$=".value"]');
    const { property, key } = parent.dataset;
    const value = this.actor._source.system[property]?.[key]?.value ?? 0;

    // Cycle to the next or previous skill level.
    const levels = CONFIG.SW5E.proficiencyLevelsOrdered;
    const idx = levels.indexOf(value);
    const next = idx + (event.type === "contextmenu" ? levels.length - 1 : 1);
    field.value = levels[next % levels.length];

    // Update the field value and save the form.
    return this._onSubmit(event);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropActor(event, data) {
    const canPolymorph = game.user.isGM || (this.actor.isOwner && game.settings.get("sw5e", "allowPolymorphing"));
    if (!canPolymorph) return false;

    // Get the target actor
    const cls = getDocumentClass("Actor");
    const sourceActor = await cls.fromDropData(data);
    if (!sourceActor) return;

    // Define a function to record polymorph settings for future use
    const rememberOptions = html => {
      const options = {};
      html.find("input").each((i, el) => {
        options[el.name] = el.checked;
      });
      const settings = foundry.utils.mergeObject(game.settings.get("sw5e", "polymorphSettings") ?? {}, options);
      game.settings.set("sw5e", "polymorphSettings", settings);
      return settings;
    };

    // Create and render the Dialog
    return new Dialog(
      {
        title: game.i18n.localize("SW5E.PolymorphPromptTitle"),
        content: {
          options: game.settings.get("sw5e", "polymorphSettings"),
          settings: CONFIG.SW5E.polymorphSettings,
          effectSettings: CONFIG.SW5E.polymorphEffectSettings,
          isToken: this.actor.isToken
        },
        default: "accept",
        buttons: {
          accept: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize("SW5E.PolymorphAcceptSettings"),
            callback: html => this.actor.transformInto(sourceActor, rememberOptions(html))
          },
          wildshape: {
            icon: CONFIG.SW5E.transformationPresets.wildshape.icon,
            label: CONFIG.SW5E.transformationPresets.wildshape.label,
            callback: html =>
              this.actor.transformInto(
                sourceActor,
                foundry.utils.mergeObject(CONFIG.SW5E.transformationPresets.wildshape.options, {
                  transformTokens: rememberOptions(html).transformTokens
                })
              )
          },
          polymorph: {
            icon: CONFIG.SW5E.transformationPresets.polymorph.icon,
            label: CONFIG.SW5E.transformationPresets.polymorph.label,
            callback: html =>
              this.actor.transformInto(
                sourceActor,
                foundry.utils.mergeObject(CONFIG.SW5E.transformationPresets.polymorph.options, {
                  transformTokens: rememberOptions(html).transformTokens
                })
              )
          },
          self: {
            icon: CONFIG.SW5E.transformationPresets.polymorphSelf.icon,
            label: CONFIG.SW5E.transformationPresets.polymorphSelf.label,
            callback: html =>
              this.actor.transformInto(
                sourceActor,
                foundry.utils.mergeObject(CONFIG.SW5E.transformationPresets.polymorphSelf.options, {
                  transformTokens: rememberOptions(html).transformTokens
                })
              )
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("Cancel")
          }
        }
      },
      {
        classes: ["dialog", "sw5e", "polymorph"],
        width: 900,
        template: "systems/sw5e/templates/apps/polymorph-prompt.hbs"
      }
    ).render(true);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDrop(event) {
    this._event = event;
    return super._onDrop(event);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropItemCreate(itemData) {
    let items = itemData instanceof Array ? itemData : [itemData];
    const itemsWithoutAdvancement = items.filter(i => !i.system.advancement?.length);
    const multipleAdvancements = items.length - itemsWithoutAdvancement.length > 1;
    if (multipleAdvancements && !game.settings.get("sw5e", "disableAdvancements")) {
      ui.notifications.warn(game.i18n.format("SW5E.WarnCantAddMultipleAdvancements"));
      items = itemsWithoutAdvancement;
    }

    const toCreate = [];
    for (const item of items) {
      const result = await this._onDropSingleItem(item);
      if (result) toCreate.push(result);
    }

    // Create the owned items as normal
    return this.actor.createEmbeddedDocuments("Item", toCreate);
  }

  /* -------------------------------------------- */

  /**
   * Handles dropping of a single item onto this character sheet.
   * @param {object} itemData            The item data to create.
   * @returns {Promise<object|boolean>}  The item data to create after processing, or false if the item should not be
   *                                     created or creation has been otherwise handled.
   * @protected
   */
  async _onDropSingleItem(itemData) {
    // Check to make sure items of this type are allowed on this actor
    if (this.constructor.unsupportedItemTypes.has(itemData.type)) {
      ui.notifications.warn(
        game.i18n.format("SW5E.ActorWarningInvalidItem", {
          itemType: game.i18n.localize(CONFIG.Item.typeLabels[itemData.type]),
          actorType: game.i18n.localize(CONFIG.Actor.typeLabels[this.actor.type])
        })
      );
      return false;
    }

    // TODO SW5E: Possibly make this a holocron
    // Create a Consumable power scroll on the Inventory tab
    if (
      itemData.type === "power"
      && (this._tabs[0].active === "inventory" || ["vehicle", "starship"].includes(this.actor.type))
    ) {
      const scroll = await Item5e.createScrollFromPower(itemData);
      return scroll.toObject();
    }

    // Clean up data
    this._onDropResetData(itemData);

    // Stack identical consumables
    const stacked = this._onDropStackConsumables(itemData);
    if (stacked) return false;

    // Ensure that this item isn't violating the singleton rule
    // TODO: When v10 support is dropped, this will only need to be handled for items with advancement
    const dataModel = CONFIG.Item[sw5e.isV10 ? "systemDataModels" : "dataModels"][itemData.type];
    const singleton = dataModel?.metadata.singleton ?? false;
    if ( singleton && this.actor.itemTypes[itemData.type].length ) {
      ui.notifications.error(game.i18n.format("SW5E.ActorWarningSingleton", {
        itemType: game.i18n.localize(CONFIG.Item.typeLabels[itemData.type]),
        actorType: game.i18n.localize(CONFIG.Actor.typeLabels[this.actor.type])
      }));
      return false;
    }

    // Bypass normal creation flow for any items with advancement
    if (itemData.system.advancement?.length && !game.settings.get("sw5e", "disableAdvancements")) {
      const manager = AdvancementManager.forNewItem(this.actor, itemData);
      if (manager.steps.length) {
        manager.render(true);
        return false;
      }
    }

    // Adjust the preparation mode of a leveled power depending on the section on which it is dropped.
    if ( itemData.type === "power" ) this._onDropPower(itemData);

    return itemData;
  }

  /* -------------------------------------------- */

  /**
   * Reset certain pieces of data stored on items when they are dropped onto the actor.
   * @param {object} itemData    The item data requested for creation. **Will be mutated.**
   */
  _onDropResetData(itemData) {
    if (!itemData.system) return;
    ["equipped", "proficient", "prepared"].forEach(k => delete itemData.system[k]);
    if ("attunement" in itemData.system) {
      itemData.system.attunement = Math.min(itemData.system.attunement, CONFIG.SW5E.attunementTypes.REQUIRED);
    }
  }

  /* -------------------------------------------- */

  /**
   * Adjust the preparation mode of a dropped power depending on the drop location on the sheet.
   * @param {object} itemData    The item data requested for creation. **Will be mutated.**
   */
  _onDropPower(itemData) {
    if ( !["npc", "character"].includes(this.document.type) ) return;

    // Determine the section it is dropped on, if any.
    let header = this._event.target.closest(".items-header"); // Dropped directly on the header.
    if ( !header ) {
      const list = this._event.target.closest(".item-list"); // Dropped inside an existing list.
      header = list?.previousElementSibling;
    }
    const mode = header?.dataset ?? {};
    const schoolCfg = CONFIG.SW5E.powerSchools[item.system.school] ?? {};

    // Determine the actor's power slot progressions, if any.
    const progs = Object.values(this.document.classes).reduce((acc, cls) => {
      if ( schoolCfg.isForce && cls.powercasting?.force !== "none" ) acc.leveled = true;
      if ( schoolCfg.isTech && cls.powercasting?.tech !== "none" ) acc.leveled = true;
      return acc;
    }, { leveled: false } );

    // Case 1: Drop an at-will.
    if ( itemData.system.level === 0 ) {
      if ( ["prepared"].includes(mode["preparation.mode"]) ) {
        itemData.system.preparation.mode = "prepared";
      } else if ( !mode["preparation.mode"] ) {
        const isCaster = this.document.system.details.powerLevel || progs.leveled;
        itemData.system.preparation.mode = isCaster ? "prepared" : "innate";
      } else {
        itemData.system.preparation.mode = mode["preparation.mode"];
      }
    }

    // Case 2: Drop a leveled power in a section without a mode.
    else if ( (mode.level === 0) || !mode["preparation.mode"] ) {
      if ( this.document.type === "npc" ) {
        const powerCaster = this.document.system.attributes[schoolCfg.isForce ? "force" : schoolCfg.isTech ? "tech" : "nope"]?.level;
        itemData.system.preparation.mode = powerCaster ? "prepared" : "innate";
      } else {
        itemData.system.preparation.mode = progs.leveled ? "prepared" : "innate";
      }
    }

    // Case 3: Drop a leveled power in a specific section.
    else {
      itemData.system.preparation.mode = mode["preparation.mode"];
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle enabling editing for a power slot override value.
   * @param {MouseEvent} event    The originating click event.
   * @protected
   */
  async _onPowerSlotOverride(event) {
    const span = event.currentTarget.parentElement;
    const level = span.dataset.level;
    const override = this.actor.system.powers[level].override || span.dataset.slots;
    const input = document.createElement("INPUT");
    input.type = "text";
    input.name = `system.powers.${level}.override`;
    input.value = override;
    input.placeholder = span.dataset.slots;
    input.dataset.dtype = "Number";
    input.addEventListener("focus", event => event.currentTarget.select());

    // Replace the HTML
    const parent = span.parentElement;
    parent.removeChild(span);
    parent.appendChild(input);
  }

  /* -------------------------------------------- */

  /**
   * Handle enabling editing for attunement maximum.
   * @param {MouseEvent} event    The originating click event.
   * @private
   */
  async _onAttunementOverride(event) {
    const span = event.currentTarget.parentElement;
    const input = document.createElement("INPUT");
    input.type = "text";
    input.name = "system.attributes.attunement.max";
    input.value = this.actor.system.attributes.attunement.max;
    input.placeholder = 3;
    input.dataset.dtype = "Number";
    input.addEventListener("focus", event => event.currentTarget.select());

    // Replace the HTML
    const parent = span.parentElement;
    parent.removeChild(span);
    parent.appendChild(input);
  }

  /* -------------------------------------------- */

  /**
   * Handle using an item from the Actor sheet, obtaining the Item instance, and dispatching to its use method.
   * @param {Event} event  The triggering click event.
   * @returns {Promise}    Results of the usage.
   * @protected
   */
  _onItemUse(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.use({}, { event });
  }

  /* -------------------------------------------- */

  /**
   * Handle attempting to recharge an item usage by rolling a recharge check.
   * @param {Event} event      The originating click event.
   * @returns {Promise<Roll>}  The resulting recharge roll.
   * @private
   */
  _onItemRecharge(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.rollRecharge();
  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset.
   * @param {Event} event          The originating click event.
   * @returns {Promise<Item5e[]>}  The newly created item.
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const dataset = (event.currentTarget.closest(".powerbook-header") ?? event.currentTarget).dataset;
    const type = dataset.type;
    const featType = dataset.feattype ?? "";
    const featSubtype = dataset.featsubtype ?? "";

    // Check to make sure the newly created class doesn't take player over level cap
    if (type === "class" && this.actor.system.details.level + 1 > CONFIG.SW5E.maxLevel) {
      const errClass = game.i18n.format("SW5E.MaxCharacterLevelExceededWarn", { max: CONFIG.SW5E.maxLevel });
      ui.notifications.error(errClass);
      return null;
    }

    // Check to make sure the newly created deployment doesn't take player over rank cap
    if (type === "deployment" && this.actor.system.details.ranks + 1 > CONFIG.SW5E.maxRank) {
      const errDeploy = game.i18n.format("SW5E.MaxCharacterRankExceededWarn", { max: CONFIG.SW5E.maxRank });
      ui.notifications.error(errDeploy);
      return null;
    }

    const itemData = {
      name: game.i18n.format("SW5E.ItemNew", { type: game.i18n.localize(CONFIG.Item.typeLabels[type]) }),
      type: type,
      system: foundry.utils.expandObject({ ...dataset })
    };

    delete itemData.system.tooltip;
    delete itemData.system.type;
    delete itemData.system.feattype;
    delete itemData.system.featsubtype;

    if (featType) {
      itemData.system.type = {
        value: featType,
        subtype: featSubtype
      };
      let cfg = CONFIG.SW5E.featureTypes[featType];
      if (featSubtype) cfg = cfg.subtypes[featSubtype];
      else cfg = cfg.label;
      // TODO: See if this works since format for item name was changed above
      itemData.name = game.i18n.format("SW5E.ItemNew", { type: game.i18n.localize(cfg).capitalize() });
    }

    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /* -------------------------------------------- */

  /**
   * Handle editing an existing Owned Item for the Actor.
   * @param {Event} event    The originating click event.
   * @returns {ItemSheet5e}  The rendered item sheet.
   * @private
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    return item.sheet.render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle deleting an existing Owned Item for the Actor.
   * @param {Event} event  The originating click event.
   * @returns {Promise<Item5e|AdvancementManager>|undefined}  The deleted item if something was deleted or the
   *                                                          advancement manager if advancements need removing.
   * @private
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (!item) return;

    // If item has advancement, handle it separately
    if (!game.settings.get("sw5e", "disableAdvancements")) {
      const manager = AdvancementManager.forDeletedItem(this.actor, item.id);
      if (manager.steps.length) {
        try {
          const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forDelete(item);
          if ( shouldRemoveAdvancements ) return manager.render(true);
          return item.delete({ shouldRemoveAdvancements });
        } catch(err) {
          return;
        }
      }
    }

    return item.deleteDialog();
  }

  /* -------------------------------------------- */

  /**
   * Handle collapsing a Feature row on the actor sheet
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCollapse(event) {
    event.preventDefault();

    event.currentTarget.classList.toggle("active");

    const li = event.currentTarget.closest("li");
    const content = li.querySelector(".content");

    if (content.style.display === "none") {
      content.style.display = "block";
    } else {
      content.style.display = "none";
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle displaying the property attribution tooltip when a property is hovered over.
   * @param {Event} event   The originating mouse event.
   * @private
   */
  async _onPropertyAttribution(event) {
    const element = event.target;
    let property = element.dataset.attribution;
    if (!property) return;

    const rollData = this.actor.getRollData({ deterministic: true });
    const title = game.i18n.localize(element.dataset.attributionCaption);
    let attributions;
    switch (property) {
      case "attributes.ac":
        attributions = this._prepareArmorClassAttribution(rollData);
        break;
    }
    if (!attributions) return;
    new PropertyAttribution(this.actor, attributions, property, { title }).renderTooltip(element);
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling an Ability test or saving throw.
   * @param {Event} event      The originating click event.
   * @private
   */
  _onRollAbilityTest(event) {
    event.preventDefault();
    let ability = event.currentTarget.parentElement.dataset.ability;
    this.actor.rollAbility(ability, { event: event });
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling a Skill check.
   * @param {Event} event      The originating click event.
   * @returns {Promise<Roll>}  The resulting roll.
   * @private
   */
  _onRollSkillCheck(event) {
    event.preventDefault();
    const skill = event.currentTarget.closest("[data-key]").dataset.key;
    return this.actor.rollSkill(skill, { event: event });
  }

  /* -------------------------------------------- */

  _onRollToolCheck(event) {
    event.preventDefault();
    const tool = event.currentTarget.closest("[data-key]").dataset.key;
    return this.actor.rollToolCheck(tool, { event });
  }

  /* -------------------------------------------- */

  /**
   * Handle cycling proficiency in an Ability score.
   * @param {Event} event              A click or contextmenu event which triggered the handler.
   * @returns {Promise<Actor5e>|void}  Updated data for this actor after changes are applied.
   * @private
   */
  _onCycleAbilityProficiency(event) {
    if (event.currentTarget.classList.contains("disabled")) return;
    event.preventDefault();
    const field = event.currentTarget.previousElementSibling;

    // Cycle to the next or previous proficiency level
    const levels = CONFIG.SW5E.proficiencyLevelsOrdered;
    const idx = levels.indexOf(Number(field.value));
    const next = (idx + (event.type === "click" ? 1 : levels.length - 1)) % levels.length;
    field.value = levels[next];

    // Update the field value and save the form
    return this._onSubmit(event);
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling of filters to display a different set of owned items.
   * @param {Event} event     The click event which triggered the toggle.
   * @returns {ActorSheet5e}  This actor sheet with toggled filters.
   * @private
   */
  _onToggleFilter(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const set = this._filters[li.parentElement.dataset.filter];
    const filter = li.dataset.filter;
    if (set.has(filter)) set.delete(filter);
    else set.add(filter);
    return this.render();
  }

  /* -------------------------------------------- */

  /**
   * Handle spawning the TraitSelector application which allows a checkbox of multiple trait options.
   * @param {Event} event      The click event which originated the selection.
   * @returns {TraitSelector}  Newly displayed application.
   * @private
   */
  _onTraitSelector(event) {
    event.preventDefault();
    const trait = event.currentTarget.dataset.trait;
    if (trait === "tool") return new ToolSelector(this.actor, trait).render(true);
    return new TraitSelector(this.actor, trait).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle links within preparation warnings.
   * @param {Event} event  The click event on the warning.
   * @protected
   */
  async _onWarningLink(event) {
    event.preventDefault();
    const a = event.target;
    if (!a || !a.dataset.target) return;
    switch (a.dataset.target) {
      case "armor":
        new ActorArmorConfig(this.actor).render(true);
        return;
      default:
        const item = await fromUuid(a.dataset.target);
        item?.sheet.render(true);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (this.actor.isPolymorphed) {
      buttons.unshift({
        label: "SW5E.PolymorphRestoreTransformation",
        class: "restore-transformation",
        icon: "fas fa-backward",
        onclick: () => this.actor.revertOriginalForm()
      });
    }
    return buttons;
  }
}
