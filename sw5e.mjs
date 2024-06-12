/**
 * The SW5e game system for Foundry Virtual Tabletop
 * Author: Kakeman89
 * Software License: GNU GPLv3
 * Content License: https://media.wizards.com/2016/downloads/SW5E/SRD-OGL_V5.1.pdf
 * Repository: https://github.com/sw5e-foundry/sw5e
 * Issue Tracker: https://github.com/sw5e-foundry/sw5e/issues
 */

// Import Configuration
import SW5E from "./module/config.mjs";
import { registerSystemSettings, registerDeferredSettings } from "./module/settings.mjs";

// Import Documents
import CharacterImporter from "./module/character-importer.mjs";
import DisplayCR from "./module/display-cr.mjs";

// Import Submodules
import * as applications from "./module/applications/_module.mjs";
import * as canvas from "./module/canvas/_module.mjs";
import * as dataModels from "./module/data/_module.mjs";
import * as dice from "./module/dice/_module.mjs";
import * as documents from "./module/documents/_module.mjs";
import * as enrichers from "./module/enrichers.mjs";
import * as migrations from "./module/migration.mjs";
import * as utils from "./module/utils.mjs";
import {ModuleArt} from "./module/module-art.mjs";
import Tooltips5e from "./module/tooltips.mjs";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.sw5e = {
  applications,
  canvas,
  config: SW5E,
  dataModels,
  dice,
  documents,
  enrichers,
  migrations,
  utils
};
// Add DND5e namespace for module compatibility
globalThis.dnd5e = globalThis.sw5e;

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

// Keep on while testing new SW5e build
CONFIG.debug.hooks = false;

Hooks.once("init", function() {
  globalThis.sw5e = game.sw5e = Object.assign(game.system, globalThis.sw5e);
  console.log(`SW5e | Initializing the SW5e Game System - Version ${sw5e.version}\n${SW5E.ASCII}`);

  // TODO: Remove when v11 support is dropped.
  CONFIG.compatibility.excludePatterns.push(/filePicker|select/);
  CONFIG.compatibility.excludePatterns.push(/foundry\.dice\.terms/);
  CONFIG.compatibility.excludePatterns.push(
    /aggregateDamageRoll|configureDamage|preprocessFormula|simplifyRollFormula/
  );
  CONFIG.compatibility.excludePatterns.push(/core\.sourceId/);
  if ( game.release.generation < 12 ) Math.clamp = Math.clamped;

  // Record Configuration Values
  CONFIG.SW5E = SW5E;
  CONFIG.ActiveEffect.documentClass = documents.ActiveEffect5e;
  CONFIG.ActiveEffect.legacyTransferral = false;
  CONFIG.Actor.documentClass = documents.Actor5e;
  CONFIG.ChatMessage.documentClass = documents.ChatMessage5e;
  CONFIG.Combat.documentClass = documents.Combat5e;
  CONFIG.Combatant.documentClass = documents.Combatant5e;
  CONFIG.Item.collection = dataModels.collection.Items5e;
  CONFIG.Item.compendiumIndexFields.push("system.container");
  CONFIG.Item.documentClass = documents.Item5e;
  CONFIG.Token.documentClass = documents.TokenDocument5e;
  CONFIG.Token.objectClass = canvas.Token5e;
  CONFIG.Token.ringClass = canvas.TokenRing;
  CONFIG.User.documentClass = documents.User5e;
  CONFIG.time.roundTime = 6;
  Roll.TOOLTIP_TEMPLATE = "systems/sw5e/templates/chat/roll-breakdown.hbs";
  CONFIG.Dice.DamageRoll = dice.DamageRoll;
  CONFIG.Dice.D20Roll = dice.D20Roll;
  CONFIG.Dice.AttribDieRoll = dice.AttribDieRoll;
  CONFIG.MeasuredTemplate.defaults.angle = 53.13; // 5e cone RAW should be 53.13 degrees
  CONFIG.Note.objectClass = canvas.Note5e;
  CONFIG.ui.combat = applications.sidebar.CombatTracker5e;
  CONFIG.ui.items = sw5e.applications.item.ItemDirectory5e;
  CONFIG.ui.compendium = applications.sidebar.CompendiumDirectory5e;

  // Add DND5e namespace for module compatibility
  game.dnd5e = game.sw5e;
  CONFIG.DND5E = CONFIG.SW5E;
  // Add 'spell' equivalent of 'power' config for module compatibility
  for (const [power, val] of Object.entries(CONFIG.SW5E).filter(
    ([k]) => k.search(/power(?!die|routing|coupling)/i) !== -1
  )) {
    const spell = power.replace(/power/g, "spell").replace(/Power/g, "Spell");
    if (CONFIG.SW5E[spell] !== undefined) console.warn(`CONFIG.SW5E.${spell} is already defined`);
    else CONFIG.SW5E[spell] = val;
  }

  // Register System Settings
  registerSystemSettings();

  // Configure module art
  game.sw5e.moduleArt = new ModuleArt();

  // Configure tooltips
  game.sw5e.tooltips = new Tooltips5e();

  // Set up status effects
  _configureStatusEffects();

  // Remove honor & sanity from configuration if they aren't enabled
  if (!game.settings.get("sw5e", "honorScore")) delete SW5E.abilities.hon;
  if (!game.settings.get("sw5e", "sanityScore")) delete SW5E.abilities.san;

  // Register Roll Extensions
  CONFIG.Dice.rolls.push(dice.D20Roll);
  CONFIG.Dice.rolls.push(dice.DamageRoll);
  CONFIG.Dice.rolls.push(dice.AttribDieRoll);

  // Hook up system data types
  CONFIG.Actor.dataModels = dataModels.actor.config;
  CONFIG.Item.dataModels = dataModels.item.config;
  CONFIG.JournalEntryPage.dataModels = dataModels.journal.config;

  // Add fonts
  _configureFonts();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("sw5e", applications.actor.ActorSheetSW5eCharacter, {
    types: ["character"],
    makeDefault: true,
    label: "SW5E.SheetSWClassCharacter"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetDnD5eCharacter, {
    types: ["character"],
    label: "SW5E.SheetDnDClassCharacterLegacy"
  });
  DocumentSheetConfig.registerSheet(Actor, "sw5e", applications.actor.ActorSheetDnD5eCharacter2, {
    types: ["character"],
    makeDefault: false,
    label: "SW5E.SheetDnDClassCharacter"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetSW5eNPC, {
    types: ["npc"],
    makeDefault: true,
    label: "SW5E.SheetSWClassNPC"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetDnD5eNPC, {
    types: ["npc"],
    makeDefault: false,
    label: "SW5E.SheetDnDClassNPC"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetSW5eStarship, {
    types: ["starship"],
    makeDefault: true,
    label: "SW5E.SheetClassStarship"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetSW5eVehicle, {
    types: ["vehicle"],
    makeDefault: true,
    label: "SW5E.SheetClassVehicle"
  });
  Actors.registerSheet("sw5e", applications.actor.GroupActorSheet, {
    types: ["group"],
    makeDefault: true,
    label: "SW5E.SheetClassGroup"
  });

  DocumentSheetConfig.unregisterSheet(Item, "core", ItemSheet);
  DocumentSheetConfig.registerSheet(Item, "sw5e", applications.item.ItemSheet5e, {
/*    types: [
      "weapon",
      "equipment",
      "consumable",
      "tool",
      "loot",
      "class",
      "power",
      "feat",
      "species",
      "backpack",
      "archetype",
      "classfeature",
      "background",
      "fightingmastery",
      "fightingstyle",
      "lightsaberform",
      "deployment",
      "deploymentfeature",
      "starship",
      "starshipsize",
      "starshipaction",
      "starshipfeature",
      "starshipmod",
      "venture",
      "modification",
      "maneuver"
    ],*/
    makeDefault: true,
    label: "SW5E.SheetClassItem"
  });
  DocumentSheetConfig.unregisterSheet(Item, "sw5e", applications.item.ItemSheet5e, { types: ["container"] });
  DocumentSheetConfig.registerSheet(Item, "sw5e", applications.item.ContainerSheet, {
    makeDefault: true,
    types: ["container"],
    label: "SW5E.SheetClassContainer"
  });

  DocumentSheetConfig.registerSheet(JournalEntry, "sw5e", applications.journal.JournalSheet5e, {
    makeDefault: true,
    label: "SW5E.SheetClassJournalEntry"
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalClassPageSheet, {
    label: "SW5E.SheetClassClassSummary",
    types: ["class", "archetype"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalMapLocationPageSheet, {
    label: "SW5E.SheetClassMapLocation",
    types: ["map"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalRulePageSheet, {
    label: "SW5E.SheetClassRule",
    types: ["rule"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalPowerListPageSheet, {
    label: "SW5E.SheetClassPowerList",
    types: ["powers"]
  });

  CONFIG.Token.prototypeSheetClass = applications.TokenConfig5e;
  DocumentSheetConfig.unregisterSheet(TokenDocument, "core", TokenConfig);
  DocumentSheetConfig.registerSheet(TokenDocument, "sw5e", applications.TokenConfig5e, {
    label: "SW5E.SheetClassToken"
  });

  // Preload Handlebars helpers & partials
  utils.registerHandlebarsHelpers();
  utils.preloadHandlebarsTemplates();

  // Enrichers
  enrichers.registerCustomEnrichers();

  // Register Babele stuff
  if (typeof Babele !== "undefined") {
    Babele.get().setSystemTranslationsDir("babele");
  }

  // Exhaustion handling
  documents.ActiveEffect5e.registerHUDListeners();
});

/* -------------------------------------------- */

/**
 * Configure explicit lists of attributes that are trackable on the token HUD and in the combat tracker.
 * @internal
 */
function _configureTrackableAttributes() {
  const common = {
    bar: [],
    value: [
      ...Object.keys(SW5E.abilities).map(ability => `abilities.${ability}.value`),
      ...Object.keys(SW5E.movementTypes).map(movement => `attributes.movement.${movement}`),
      "attributes.ac.value", "attributes.init.total"
    ]
  };

  const altPowers = Object.entries(SW5E.powerPreparationModes).reduce((acc, [k, v]) => {
    if ( !["prepared", "always"].includes(k) && v.upcast ) acc.push(`powers.${k}`);
    return acc;
  }, []);

  const creature = {
    bar: [
      ...common.bar,
      "attributes.hp",
      "attributes.force.points.value",
      "attributes.tech.points.value",
      ...altPowers,
      ...Array.fromRange(Object.keys(SW5E.powerLevels).length - 1, 1).map(l => `powers.power${l}`)
    ],
    value: [
      ...common.value,
      ...Object.keys(SW5E.skills).map(skill => `skills.${skill}.passive`),
      ...Object.keys(SW5E.senses).map(sense => `attributes.senses.${sense}`),
      "attributes.powerdc"
    ]
  };

  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: [...creature.bar, "resources.primary", "resources.secondary", "resources.tertiary", "details.xp"],
      value: [...creature.value]
    },
    npc: {
      bar: [...creature.bar, "resources.legact", "resources.legres"],
      value: [...creature.value, "details.cr", "details.powerLevel", "details.xp.value"]
    },
    vehicle: {
      bar: [...common.bar, "attributes.hp"],
      value: [...common.value]
    },
    group: {
      bar: [],
      value: []
    },
    starship: {
      bar: [...creature.bar, "resources.primary", "resources.secondary", "resources.tertiary"],
      value: [
        ...common.value,
        ...Object.keys(SW5E.starshipSkills).map(skill => `skills.${skill}.passive`),
        ...Object.keys(SW5E.powerDieSlots).map(slot => `attributes.power.${slot}.value`),
        "attributes.fuel.value"
      ]
    }
  };
}

/* -------------------------------------------- */

/**
 * Configure which attributes are available for item consumption.
 * @internal
 */
function _configureConsumableAttributes() {
  const altPowers = Object.entries(SW5E.powerPreparationModes).reduce((acc, [k, v]) => {
    if ( !["prepared", "always"].includes(k) && v.upcast ) acc.push(`powers.${k}.value`);
    return acc;
  }, []);

  CONFIG.SW5E.consumableResources = [
    ...Object.keys(SW5E.abilities).map(ability => `abilities.${ability}.value`),
    "attributes.ac.flat",
    "attributes.hp.value",
    "attributes.hp.temp", // Added for consuming starship shield points
    ...Object.keys(SW5E.senses).map(sense => `attributes.senses.${sense}`),
    ...Object.keys(SW5E.movementTypes).map(type => `attributes.movement.${type}`),
    ...Object.keys(SW5E.currencies).map(denom => `currency.${denom}`),
    "details.xp.value",
    "resources.primary.value", "resources.secondary.value", "resources.tertiary.value",
    "resources.legact.value", "resources.legres.value",
    ...altPowers,
    // ...Array.fromRange(Object.keys(SW5E.powerLevels).length - 1, 1).map(level => `powers.power${level}.value`)
    "attributes.force.points.value",
    "attributes.tech.points.value",
    "attributes.super.dice.value",
    // TODO SW5E: Check if this would work for consuming power dice
    ...Object.keys(SW5E.ssModSystems).map(system => `attributes.power.${system.lower()}.value`),
  ];
}

/* -------------------------------------------- */

/**
 * Configure additional system fonts.
 */
function _configureFonts() {
  Object.assign(CONFIG.fontDefinitions, {
    Roboto: {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/roboto/Roboto-Regular.woff2"] },
        { urls: ["systems/sw5e/fonts/roboto/Roboto-Bold.woff2"], weight: "bold" },
        { urls: ["systems/sw5e/fonts/roboto/Roboto-Italic.woff2"], style: "italic" },
        { urls: ["systems/sw5e/fonts/roboto/Roboto-BoldItalic.woff2"], weight: "bold", style: "italic" }
      ]
    },
    "Roboto Condensed": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/roboto-condensed/RobotoCondensed-Regular.woff2"] },
        { urls: ["systems/sw5e/fonts/roboto-condensed/RobotoCondensed-Bold.woff2"], weight: "bold" },
        { urls: ["systems/sw5e/fonts/roboto-condensed/RobotoCondensed-Italic.woff2"], style: "italic" },
        {
          urls: ["systems/sw5e/fonts/roboto-condensed/RobotoCondensed-BoldItalic.woff2"], weight: "bold",
          style: "italic"
        }
      ]
    },
    "Roboto Slab": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/roboto-slab/RobotoSlab-Regular.ttf"] },
        { urls: ["systems/sw5e/fonts/roboto-slab/RobotoSlab-Bold.ttf"], weight: "bold" }
      ]
    },
    Aurebesh: {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/Aurebesh/Aurebesh.otf"] },
        { urls: ["systems/sw5e/fonts/Aurebesh/Aurebesh-Bold.otf"], weight: "bold" },
        { urls: ["systems/sw5e/fonts/Aurebesh/Aurebesh-Italic.otf"], style: "italic" },
        { urls: ["systems/sw5e/fonts/Aurebesh/Aurebesh-BoldItalic.otf"], weight: "bold", style: "italic" }
      ]
    },
    "Aurebesh Condensed": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/Aurebesh-Condensed/AurebeshCondensed.otf"] },
        { urls: ["systems/sw5e/fonts/Aurebesh-Condensed/AurebeshCondensed-Bold.otf"], weight: "bold" },
        { urls: ["systems/sw5e/fonts/Aurebesh-Condensed/AurebeshCondensed-Italic.otf"], style: "italic" },
        {
          urls: ["systems/sw5e/fonts/Aurebesh-Condensed/AurebeshCondensed-BoldItalic.otf"], weight: "bold",
          style: "italic"
        }
      ]
    },
    "Bungee Inline": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/BungeeInline-Regular.ttf"] }
      ]
    },
    "Engli-Besh": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/EngliBesh-KG3W.ttf"] }
      ]
    },
    "Nodesto Caps Condensed": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/NodestoCapsCondensed.otf"] }
      ]
    },
    OpenSans: {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/OpenSans/OpenSans-Regular.ttf"] },
        { urls: ["systems/sw5e/fonts/OpenSans/OpenSans-Bold.ttf"], weight: "bold" },
        { urls: ["systems/sw5e/fonts/OpenSans/OpenSans-Italic.ttf"], style: "italic" },
        { urls: ["systems/sw5e/fonts/OpenSans/OpenSans-BoldItalic.ttf"], weight: "bold", style: "italic" }
      ]
    },
    "Russo One": {
      editor: true,
      fonts: [
        { urls: ["systems/sw5e/fonts/RussoOne.ttf"] }
      ]
    }
  });
}

/* -------------------------------------------- */

/**
 * Configure system status effects.
 */
function _configureStatusEffects() {
  const addEffect = (effects, {special, ...data}) => {
    data = foundry.utils.deepClone(data);
    data._id = utils.staticID(`sw5e${data.id}`);
    if ( foundry.utils.isNewerVersion(game.version, 12) ) {
      data.img = data.icon ?? data.img;
      delete data.icon;
    }
    effects.push(data);
    if ( special ) CONFIG.specialStatusEffects[special] = data.id;
  };
  CONFIG.statusEffects = Object.entries(CONFIG.SW5E.statusEffects).reduce((arr, [id, data]) => {
    const original = CONFIG.statusEffects.find(s => s.id === id);
    addEffect(arr, foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false }));
    return arr;
  }, []);
  for ( const [id, {label: name, ...data}] of Object.entries(CONFIG.SW5E.conditionTypes) ) {
    addEffect(CONFIG.statusEffects, { id, name, ...data });
  }
  for ( const [id, data] of Object.entries(CONFIG.SW5E.encumbrance.effects) ) {
    addEffect(CONFIG.statusEffects, { id, ...data, hud: false });
  }
}

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * Prepare attribute lists.
 */
Hooks.once("setup", function() {
  // Configure trackable & consumable attributes.
  _configureTrackableAttributes();
  _configureConsumableAttributes();

  CONFIG.SW5E.trackableAttributes = expandAttributeList(CONFIG.SW5E.trackableAttributes);
  game.sw5e.moduleArt.registerModuleArt();
  Tooltips5e.activateListeners();
  game.sw5e.tooltips.observe();

  // Register settings after modules have had a chance to initialize
  registerDeferredSettings();

  // Apply table of contents compendium style if specified in flags
  game.packs
    .filter(p => p.metadata.flags?.display === "table-of-contents")
    .forEach(p => p.applicationClass = applications.journal.TableOfContentsCompendium);

  // Apply custom item compendium
  game.packs.filter(p => p.metadata.type === "Item")
    .forEach(p => p.applicationClass = applications.item.ItemCompendium5e);

  // Configure token rings
  CONFIG.SW5E.tokenRings.shaderClass ??= canvas.TokenRingSamplerShaderV11;
  CONFIG.Token.ringClass.initialize();
  let theme = `${game.settings.get("sw5e", "colorTheme")}-theme`;
  document.body.classList.add(theme);
});

/* --------------------------------------------- */

/**
 * Expand a list of attribute paths into an object that can be traversed.
 * @param {string[]} attributes  The initial attributes configuration.
 * @returns {object}  The expanded object structure.
 */
function expandAttributeList(attributes) {
  return attributes.reduce((obj, attr) => {
    foundry.utils.setProperty(obj, attr, true);
    return obj;
  }, {});
}

/* --------------------------------------------- */

/**
 * Perform one-time pre-localization and sorting of some configuration objects
 */
Hooks.once("i18nInit", () => utils.performPreLocalization(CONFIG.SW5E));

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (["Item", "ActiveEffect"].includes(data.type)) {
      documents.macro.create5eMacro(data, slot);
      return false;
    }
  });

  // Determine whether a system migration is required and feasible
  if ( !game.user.isGM ) return;
  const cv = game.settings.get("sw5e", "systemMigrationVersion") || game.world.flags.sw5e?.version;
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if ( !cv && totalDocuments === 0 ) return game.settings.set("sw5e", "systemMigrationVersion", game.system.version);
  if ( cv && !foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv) ) return;

  // Perform the migration
  if ( cv && foundry.utils.isNewerVersion(game.system.flags.compatibleMigrationVersion, cv) ) {
    ui.notifications.error("MIGRATION.5eVersionTooOldWarning", {localize: true, permanent: true});
  }
  migrations.migrateWorld();

  // Configure compendium browser.
  game.sw5e.compendiumBrowser = new applications.compendium.CompendiumBrowser();

  // Make deprecated item types unavailable to create
  game.documentTypes.Item = game.documentTypes.Item.filter(t => !CONFIG.SW5E.deprecatedItemTypes.includes(t));
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", gameCanvas => {
  if ( game.release.generation < 12 ) {
  gameCanvas.grid.diagonalRule = game.settings.get("sw5e", "diagonalMovement");
  SquareGrid.prototype.measureDistances = canvas.measureDistances;
  }
  CONFIG.Token.ringClass.pushToLoad(gameCanvas.loadTexturesOptions.additionalSources);
});

/* -------------------------------------------- */
/*  Canvas Draw                                 */
/* -------------------------------------------- */

Hooks.on("canvasDraw", gameCanvas => {
  // The sprite sheet has been loaded now, we can create the uvs for each texture
  CONFIG.Token.ringClass.createAssetsUVs();
});

/* -------------------------------------------- */
/*  System Styling                              */
/* -------------------------------------------- */

Hooks.on("renderSettings", (app, [html]) => {
  const details = html.querySelector("#game-details");
  const pip = details.querySelector(".system-info .update");
  details.querySelector(".system").remove();

  const heading = document.createElement("div");
  heading.classList.add("sw5e2", "sidebar-heading");
  heading.innerHTML = `
    <h2>${game.i18n.localize("WORLD.GameSystem")}</h2>
    <ul class="links">
      <li>
        <a href="https://github.com/sw5e-foundry/sw5e/releases/latest" target="_blank">
          ${game.i18n.localize("SW5E.Notes")}
        </a>
      </li>
      <li>
        <a href="https://github.com/sw5e-foundry/sw5e/issues" target="_blank">${game.i18n.localize("SW5E.Issues")}</a>
      </li>
      <li>
        <a href="https://github.com/sw5e-foundry/sw5e/wiki" target="_blank">${game.i18n.localize("SW5E.Wiki")}</a>
      </li>
      <li>
        <a href="https://discord.com/channels/727847839631278110/812443835980447774" target="_blank">
          ${game.i18n.localize("SW5E.Discord")}
        </a>
      </li>
    </ul>
  `;
  details.insertAdjacentElement("afterend", heading);

  const badge = document.createElement("div");
  badge.classList.add("sw5e2", "system-badge");
  badge.innerHTML = `
    <img src="systems/sw5e/ui/SW5e-logo.svg" data-tooltip="${sw5e.title}" alt="${sw5e.title}">
    <span class="system-info">${sw5e.version}</span>
  `;
  if ( pip ) badge.querySelector(".system-info").insertAdjacentElement("beforeend", pip);
  heading.insertAdjacentElement("afterend", badge);
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("renderChatPopout", documents.ChatMessage5e.onRenderChatPopout);
Hooks.on("getChatLogEntryContext", documents.ChatMessage5e.addChatMessageContextOptions);

Hooks.on("renderChatLog", (app, html, data) => {
  documents.Item5e.chatListeners(html);
  documents.ChatMessage5e.onRenderChatLog(html);
});
Hooks.on("renderChatPopout", (app, html, data) => documents.Item5e.chatListeners(html));

Hooks.on("chatMessage", (app, message, data) => applications.Award.chatMessage(message));

Hooks.on("renderActorDirectory", (app, html, data) => {
  documents.Actor5e.onRenderActorDirectory(html);
  setFolderBackground(html);
  CharacterImporter.addImportButton(html);
  DisplayCR(html);
});
Hooks.on("getActorDirectoryEntryContext", documents.Actor5e.addDirectoryContextOptions);

Hooks.on("renderSceneDirectory", (app, html, data) => {
  // Console.log(html.find("header.folder-header"));
  setFolderBackground(html);
});

Hooks.on("renderCompendium", (compendium, html, data) => {
  DisplayCR(html, compendium);
});
Hooks.on("getCompendiumEntryContext", documents.Item5e.addCompendiumContextOptions);

Hooks.on("renderItemDirectory", (app, html, data) => {
  setFolderBackground(html);
});
Hooks.on("getItemDirectoryEntryContext", documents.Item5e.addDirectoryContextOptions);

Hooks.on("renderJournalDirectory", (app, html, data) => {
  setFolderBackground(html);
});
Hooks.on("renderJournalPageSheet", applications.journal.JournalSheet5e.onRenderJournalPageSheet);

Hooks.on("renderRollTableDirectory", (app, html, data) => {
  setFolderBackground(html);
});
// Remigrate button adapted from pf2e
Hooks.on("renderSettings", async (_app, html) => {
    if (game.user.hasRole("GAMEMASTER")) {
    const remigrate = $("<div>").attr({ id: "sw5e-remigrate" });
    const shootButton = $('<button type="button">')
      .append(utils.fontAwesomeIcon("wrench"), game.i18n.localize("SW5E.Remigrate"))
      .on("click", ev => migrations.migrateWorld(ev.ctrlKey));
    remigrate.append(shootButton);

    elements.push(remigrate);
  }

  $("#settings-documentation").after(elements);
});

Hooks.on("targetToken", canvas.Token5e.onTargetToken);

Hooks.on("ActorSheetSW5eCharacter", (app, html, data) => {
  console.log("renderSwaltSheet");
});

Handlebars.registerHelper("round", function(value) {
  return Math.floor(value);
});

Handlebars.registerHelper("debug", function(value) {
  console.log(value);
  return value;
});

Handlebars.registerHelper("isUndefined", function(value) {
  return value === undefined;
});

Handlebars.registerHelper("isNull", function(value) {
  return value === null;
});

Handlebars.registerHelper("json", function(value) {
  return JSON.stringify(value);
});

/**
 * Sets folder background color
 * @param {jQuery} html
 */
function setFolderBackground(html) {
  html.find("header.folder-header").each(function() {
    let bgColor = $(this).css("background-color");
    if (bgColor === undefined) bgColor = "rgb(255,255,255)";
    $(this).closest("li").css("background-color", bgColor);
  });
}

/* -------------------------------------------- */
/*  Bundled Module Exports                      */
/* -------------------------------------------- */

export {
  applications,
  canvas,
  dataModels,
  dice,
  documents,
  enrichers,
  migrations,
  utils,
  SW5E
};
