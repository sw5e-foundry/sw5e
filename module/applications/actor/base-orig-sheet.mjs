import * as Trait from "../../documents/actor/trait.mjs";
import Item5e from "../../documents/item.mjs";
import EffectsElement from "../components/effects.mjs";

import ActorAbilityConfig from "./ability-config.mjs";
import ActorArmorConfig from "./armor-config.mjs";
import ActorHitDiceConfig from "./hit-dice-config.mjs";
import ActorHitPointsConfig from "./hit-points-config.mjs";
import ActorInitiativeConfig from "./initiative-config.mjs";
import ActorMovementConfig from "./movement-config.mjs";
import ActorSensesConfig from "./senses-config.mjs";
import ActorSheetFlags from "./sheet-flags.mjs";
import ActorTypeConfig from "./type-config.mjs";
import SourceConfig from "../source-config.mjs";

import AdvancementManager from "../advancement/advancement-manager.mjs";

import TraitSelector from "./trait-selector.mjs";
import ProficiencyConfig from "./proficiency-config.mjs";
import ToolSelector from "./tool-selector.mjs";
import ActorSheetMixin from "./sheet-mixin.mjs";
import ActorPowerSlotsConfig from "./power-slots-config.mjs";

/**
 * Extend the basic ActorSheet class to suppose SW5e-specific logic and functionality.
 * @abstract
 */
export default class ActorSheetOrig5e extends ActorSheetMixin(ActorSheet) {
  /**
   * @typedef {object} FilterState5e
   * @property {string} name             Filtering by name.
   * @property {Set<string>} properties  Filtering by some property.
   */

  /**
   * Track the set of item filters which are applied
   * @type {Object<string, FilterState5e>}
   * @protected
   */
  _filters = {
    inventory: { name: "", properties: new Set() },
    powerbook: { name: "", properties: new Set() },
    features: { name: "", properties: new Set() },
    effects: { name: "", properties: new Set() }
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
        "sw5e-inventory .inventory-list",
        "sw5e-effects .effects-list",
        ".center-pane"
      ],
      tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }],
      width: 720,
      height: Math.max(680, Math.max(
        237 + (Object.keys(CONFIG.SW5E.abilities).length * 70),
        240 + (Object.keys(CONFIG.SW5E.skills).length * 24)
      )),
      elements: {
        effects: "sw5e-effects",
        inventory: "sw5e-inventory"
      }
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
    if (!game.user.isGM && this.actor.limited) return "systems/sw5e/templates/actors/origActor/limited-sheet.hbs";
    return `systems/sw5e/templates/actors/origActor/${this.actor.type}-sheet.hbs`;
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
      effects: EffectsElement.prepareCategories(this.actor.allApplicableEffects()),
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
      },
      elements: this.options.elements
    };

    // Remove items in containers & sort remaining
    context.items = context.items
      .filter(i => !this.actor.items.has(i.system.container))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Temporary HP
    const hp = { ...context.system.attributes.hp };
    if (hp.temp === 0) delete hp.temp;
    if (hp.tempmax === 0) delete hp.tempmax;
    context.hp = hp;

    // Ability Scores
    for (const [a, abl] of Object.entries(context.abilities)) {
      abl.icon = this._getProficiencyIcon(abl.proficient);
      abl.hover = CONFIG.SW5E.proficiencyLevels[abl.proficient].label;
      abl.label = CONFIG.SW5E.abilities[a]?.label;
      abl.baseProf = source.system.abilities[a]?.proficient ?? 0;
    }

    // Skills & tools.
    ["skills", "tools"].forEach(prop => {
      for (const [key, entry] of Object.entries(context[prop])) {
        entry.abbreviation = CONFIG.SW5E.abilities[entry.ability]?.abbreviation;
        entry.icon = this._getProficiencyIcon(entry.value);
        entry.hover = CONFIG.SW5E.proficiencyLevels[entry.value].label;
        entry.label = prop === "skills" ? CONFIG.SW5E.skills[key]?.label : Trait.keyLabel(key, {trait: "tool"});
        entry.baseValue = source.system[prop]?.[key]?.value ?? 0;
        entry.baseAbility = source.system[prop]?.[key]?.ability ?? "int";
      }
    });

    // Update traits
    context.traits = this._prepareTraits(context.system);

    // Prepare owned items
    this._prepareItems(context);
    context.expandedData = {};
    for (const id of this._expanded) {
      const item = this.actor.items.get(id);
      if ( item ) {
        context.expandedData[id] = await item.getChatData({secrets: this.actor.isOwner});
        if ( context.itemContext[id] ) context.itemContext[id].expanded = context.expandedData[id];
      }
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
    if ( senses.special ) senses.special.split(";").forEach((c, i) => tags[`custom${i+1}`] = c.trim());
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
          if (!CONFIG.SW5E.damageTypes[t]?.isPhysical) return true;
          physical.push(t);
          return false;
        });
      }

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
          bypassTypes: bypassFormatter.format(data.bypasses.reduce((acc, t) => {
            const v = CONFIG.SW5E.itemProperties[t];
            if ( v && v.isPhysical ) acc.push(v.label);
            return acc;
          }, []))
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
   * @protected
   */
  _prepareItems() {}

  /* -------------------------------------------- */

  /**
   * Insert a power into the powerbook object when rendering the character sheet.
   * @param {object} context    Sheet rendering context data being prepared for render.
   * @param {object[]} powers   Powers to be included in the powerbook.
   * @returns {object[]}        Powerbook sections in the proper order.
   * @protected
   */
  _preparePowerbook(context, powers) {
    const owner = this.actor.isOwner;
    const levels = context.actor.system.powers;
    const powerbook = {};

    // Define section and label mappings
    const sections = { atwill: -20, innate: -10, pact: 0.5 };
    const useLabels = { "-20": "-", "-10": "-", 0: "&infin;" };

    // Format a powerbook entry for a certain indexed level
    const registerSection = (sl, i, label, { prepMode = "prepared", value, max, override } = {}) => {
      const aeOverride = foundry.utils.hasProperty(this.actor.overrides, `system.powers.power${i}.override`);
      powerbook[i] = {
        order: i,
        label,
        usesSlots: i > 0,
        canCreate: owner,
        canPrepare: context.actor.type === "character" && i >= 1,
        powers: [],
        uses: useLabels[i] || value || 0,
        slots: useLabels[i] || max || 0,
        override: override || 0,
        dataset: { type: "power", level: prepMode in sections ? 1 : i, preparationMode: prepMode },
        prop: sl,
        editable: context.editable && !aeOverride
      };
    };

    // Determine the maximum power level which has a slot
    const maxLevel = Array.fromRange(10).reduce((max, i) => {
      if (i === 0) return max;
      const level = levels[`power${i}`];
      if ((level.max || level.override) && i > max) max = i;
      return max;
    }, 0);

    // Level-based powercasters have cantrips and leveled slots
    if (maxLevel > 0) {
      registerSection("power0", 0, CONFIG.SW5E.powerLevels[0]);
      for (let lvl = 1; lvl <= maxLevel; lvl++) {
        const sl = `power${lvl}`;
        registerSection(sl, lvl, CONFIG.SW5E.powerLevels[lvl], levels[sl]);
      }
    }

    // Pact magic users have cantrips and a pact magic section
    // TODO SW5E: Check if this is needed, we've removed pacts everywhere else
    if (levels.pact && levels.pact.max) {
      if (!powerbook["0"]) registerSection("power0", 0, CONFIG.SW5E.powerLevels[0]);
      const l = levels.pact;
      const config = CONFIG.SW5E.powerPreparationModes.pact;
      const level = game.i18n.localize(`SW5E.PowerLevel${levels.pact.level}`);
      const label = `${config} — ${level}`;
      registerSection("pact", sections.pact, label, {
        prepMode: "pact",
        value: l.value,
        max: l.max,
        override: l.override
      });
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
            value: l.value,
            max: l.max,
            override: l.override
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
   * Filter child embedded Documents based on the current set of filters.
   * @param {string} collection    The embedded collection name.
   * @param {Set<string>} filters  Filters to apply to the children.
   * @returns {Document[]}
   * @protected
   */
  _filterChildren(collection, filters) {
    switch ( collection ) {
      case "items": return this._filterItems(this.actor.items, filters);
      case "effects": return this._filterEffects(Array.from(this.actor.allApplicableEffects()), filters);
    }
    return [];
  }

  /* -------------------------------------------- */

  /**
   * Filter Active Effects based on the current set of filters.
   * @param {ActiveEffect5e[]} effects  The effects to filter.
   * @param {Set<string>} filters       Filters to apply to the effects.
   * @returns {ActiveEffect5e[]}
   * @protected
   */
  _filterEffects(effects, filters) {
    return effects;
  }

  /* -------------------------------------------- */

  /**
   * Filter items based on the current set of filters.
   * @param {Item5e[]} items       Copies of item data to be filtered.
   * @param {Set<string>} filters  Filters applied to the item list.
   * @returns {Item5e[]}           Subset of input items limited by the provided filters.
   * @protected
   */
  _filterItems(items, filters) {
    const powerSchools = new Set(Object.keys(CONFIG.SW5E.powerSchools));
    return items.filter(item => {
      // Archetype-specific logic.
      const filtered = this._filterItem(item);
      if ( filtered !== undefined ) return filtered;

      // Action usage
      for (let f of ["action", "bonus", "reaction"]) {
        if (filters.has(f) && item.system.activation?.type !== f) return false;
      }

      // Power-specific filters
      if ( filters.has("ritual") && !item.system.properties?.has("ritual") ) return false;
      if ( filters.has("concentration") && !item.system.properties?.has("concentration") ) return false;
      const schoolFilter = powerSchools.intersection(filters);
      if ( schoolFilter.size && !schoolFilter.has(item.system.school) ) return false;
      if ( filters.has("prepared") ) {
        if ( ["innate", "always"].includes(item.system.preparation?.mode) ) return true;
        if ( this.actor.type === "npc" ) return true;
        return item.system.preparation?.prepared;
      }

      // Equipment-specific filters
      if (filters.has("equipped") && item.system.equipped !== true) return false;
      if ( filters.has("mgc") && !item.system.properties?.has("mgc") ) return false;

      // Feature-specific filters
      if ( filters.has("lr") && (item.system.uses?.per !== "lr") ) return false;
      if ( filters.has("sr") && (item.system.uses?.per !== "sr") ) return false;

      return true;
    });
  }

  /* -------------------------------------------- */

  /**
   * Determine whether an Item will be shown based on the current set of filters.
   * @param {Item5e} item  The item.
   * @returns {boolean|void}
   * @protected
   */
  _filterItem(item) {}

  /* -------------------------------------------- */

  /**
   * Get the font-awesome icon used to display a certain level of skill proficiency.
   * @param {number} level  A proficiency mode defined in `CONFIG.SW5E.proficiencyLevels`.
   * @returns {string}      HTML string for the chosen icon.
   * @private
   */
  _getProficiencyIcon(level) {
    const levels = Object.keys(CONFIG.SW5E.proficiencyLevels);
    const icon = (levels[level] ?? levels[0]).icon;
    return `<i class="far ${icon}"></i>`;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    // Property attributions
    this.form.querySelectorAll("[data-attribution], .attributable").forEach(this._applyAttributionTooltips.bind(this));

    // Preparation Warnings
    html.find(".warnings").click(this._onWarningLink.bind(this));

    // Editable Only Listeners
    if (this.isEditable) {
      // Input focus and update
      const inputs = html.find("input");
      inputs.focus(ev => ev.currentTarget.select());
      inputs.addBack().find('[type="text"][data-dtype="Number"]').change(this._onChangeInputDelta.bind(this));

      // Ability Proficiency
      html.find(".ability-proficiency").click(this._onToggleAbilityProficiency.bind(this));

      // Toggle Skill Proficiency
      html.find(".skill-proficiency").on("click contextmenu", event => this._onCycleProficiency(event, "skill"));

      // Toggle Tool Proficiency
      html.find(".tool-proficiency").on("click contextmenu", event => this._onCycleProficiency(event, "tool"));

      // Trait Selector
      html.find(".trait-selector").click(this._onTraitSelector.bind(this));

      // Configure Special Flags
      html.find(".config-button").click(this._onConfigMenu.bind(this));

      // Owned Item management
      html.find(".slot-max-override").click(this._onPowerSlotOverride.bind(this));
      html.find(".attunement-max-override").click(this._onAttunementOverride.bind(this));

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
    }

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
      case "hitDice":
        app = new ActorHitDiceConfig(this.actor);
        break;
      case "hitPoints":
        app = new ActorHitPointsConfig(button.dataset.action, this.actor);
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
      case "powerSlots":
        app = new ActorPowerSlotsConfig(this.actor);
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

  /** @inheritdoc */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ( event.target.classList.contains("content-link") ) return;

    if ( li.dataset.effectId && li.dataset.parentId ) {
      const effect = this.actor.items.get(li.dataset.parentId)?.effects.get(li.dataset.effectId);
      if ( effect ) event.dataTransfer.setData("text/plain", JSON.stringify(effect.toDragData()));
      return;
    }

    super._onDragStart(event);
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

  /** @inheritdoc */
  async _onDropActiveEffect(event, data) {
    const effect = await ActiveEffect.implementation.fromDropData(data);
    if ( effect?.target === this.actor ) return false;
    return super._onDropActiveEffect(event, data);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropItem(event, data) {
    if ( !this.actor.isOwner ) return false;
    const item = await Item.implementation.fromDropData(data);

    // Handle moving out of container & item sorting
    if ( this.actor.uuid === item.parent?.uuid ) {
      if ( item.system.container !== null ) await item.update({"system.container": null});
      return this._onSortItem(event, item.toObject());
    }

    return this._onDropItemCreate(item);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropFolder(event, data) {
    if ( !this.actor.isOwner ) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if ( folder.type !== "Item" ) return [];
    const droppedItemData = await Promise.all(folder.contents.map(async item => {
      if ( !(item instanceof Item) ) item = await fromUuid(item.uuid);
      return item;
    }));
    return this._onDropItemCreate(droppedItemData);
  }

  /* -------------------------------------------- */

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * @param {Item5e[]|Item5e} itemData     The item or items requested for creation
   * @returns {Promise<Item5e[]>}
   * @protected
   */
  async _onDropItemCreate(itemData) {
    let items = itemData instanceof Array ? itemData : [itemData];
    const itemsWithoutAdvancement = items.filter(i => !i.system.advancement?.length);
    const multipleAdvancements = items.length - itemsWithoutAdvancement.length > 1;
    if (multipleAdvancements && !game.settings.get("sw5e", "disableAdvancements")) {
      ui.notifications.warn(game.i18n.format("SW5E.WarnCantAddMultipleAdvancements"));
      items = itemsWithoutAdvancement;
    }

    // Filter out items already in containers to avoid creating duplicates
    const containers = new Set(items.filter(i => i.type === "container").map(i => i._id));
    items = items.filter(i => !containers.has(i.system.container));

    // Create the owned items & contents as normal
    const toCreate = await Item5e.createWithContents(items, {
      transformFirst: item => this._onDropSingleItem(item.toObject())
    });
    return Item5e.createDocuments(toCreate, {pack: this.actor.pack, parent: this.actor, keepId: true});
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

    // Create a Consumable power scroll on the Inventory tab
    // TODO SW5E: This is pretty non functional as the base items for the scrolls,
    //       and the powers, are not defined, maybe consider using holocrons
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
    const { level, preparationMode } = header?.closest("[data-level]")?.dataset ?? {};
    const schoolCfg = CONFIG.SW5E.powerSchools[item.system.school] ?? {};

    // Determine the actor's power slot progressions, if any.
    const progs = Object.values(this.document.classes).reduce((acc, cls) => {
      if ( schoolCfg.isForce && cls.powercasting?.force !== "none" ) acc.leveled = true;
      if ( schoolCfg.isTech && cls.powercasting?.tech !== "none" ) acc.leveled = true;
      return acc;
    }, { leveled: false } );

    // Case 1: Drop an at-will.
    if ( itemData.system.level === 0 ) {
      if ( ["prepared"].includes(preparationMode) ) {
        itemData.system.preparation.mode = "prepared";
      } else if ( !preparationMode ) {
        const isCaster = this.document.system.details.powerLevel || progs.leveled;
        itemData.system.preparation.mode = isCaster ? "prepared" : "innate";
      } else {
        itemData.system.preparation.mode = preparationMode;
      }
    }

    // Case 2: Drop a leveled power in a section without a mode.
    else if ( (level === "0") || !preparationMode ) {
      if ( this.document.type === "npc" ) {
        itemData.system.preparation.mode = this.document.system.details.powerLevel ? "prepared" : "innate";
      } else {
        itemData.system.preparation.mode = progs.leveled ? "prepared" : "innate";
      }
    }

    // Case 3: Drop a leveled power in a specific section.
    else itemData.system.preparation.mode = preparationMode;
  }

  /* -------------------------------------------- */

  /**
   * Handle enabling editing for a power slot override value.
   * @param {MouseEvent} event    The originating click event.
   * @private
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
   * Initialize attribution tooltips on an element.
   * @param {HTMLElement} element  The tooltipped element.
   * @protected
   */
  _applyAttributionTooltips(element) {
    if ( "tooltip" in element.dataset ) return;
    element.dataset.tooltip = `
      <section class="loading" data-uuid="${this.actor.uuid}"><i class="fas fa-spinner fa-spin-pulse"></i></section>
    `;
    element.dataset.tooltipClass = "property-attribution";
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
   * Handle toggling Ability score proficiency level.
   * @param {Event} event              The originating click event.
   * @returns {Promise<Actor5e>|void}  Updated actor instance.
   * @private
   */
  _onToggleAbilityProficiency(event) {
    if (event.currentTarget.classList.contains("disabled")) return;
    event.preventDefault();
    const field = event.currentTarget.previousElementSibling;
    return this.actor.update({ [field.name]: 1 - parseInt(field.value) });
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
