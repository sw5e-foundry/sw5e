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
import registerSystemSettings from "./module/settings.mjs";

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
import { ModuleArt } from "./module/module-art.mjs";
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
  CONFIG.compatibility.excludePatterns.push(/Math\.clamped/);

  // Record Configuration Values
  CONFIG.SW5E = SW5E;
  CONFIG.ActiveEffect.documentClass = documents.ActiveEffect5e;
  CONFIG.ActiveEffect.legacyTransferral = false;
  CONFIG.Actor.documentClass = documents.Actor5e;
  CONFIG.ChatMessage.documentClass = documents.ChatMessage5e;
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

  // Configure module art.
  game.sw5e.moduleArt = new ModuleArt();

  // Configure tooltips
  game.sw5e.tooltips = new Tooltips5e();

  // Set up status effects
  _configureStatusEffects();

  // Remove honor & sanity from configuration if they aren't enabled
  if (!game.settings.get("sw5e", "honorScore")) delete SW5E.abilities.hon;
  if (!game.settings.get("sw5e", "sanityScore")) delete SW5E.abilities.san;

  // Configure trackable & consumable attributes.
  _configureTrackableAttributes();
  _configureConsumableAttributes();

  // Patch Core Functions
  Combatant.prototype.getInitiativeRoll = documents.combat.getInitiativeRoll;

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
  Actors.registerSheet("sw5e", applications.actor.ActorSheet5eCharacter, {
    types: ["character"],
    label: "SW5E.SheetClassCharacter"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetOrig5eCharacter, {
    types: ["character"],
    label: "SW5E.SheetClassCharacterLegacy"
  });
  DocumentSheetConfig.registerSheet(Actor, "sw5e", applications.actor.ActorSheet5eCharacter2, {
    types: ["character"],
    makeDefault: true,
    label: "SW5E.SheetClassCharacterOld"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheet5eNPC, {
    types: ["npc"],
    label: "SW5E.SheetClassNPC"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetOrig5eNPC, {
    types: ["npc"],
    makeDefault: true,
    label: "SW5E.SheetClassNPCOld"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheet5eStarship, {
    types: ["starship"],
    makeDefault: true,
    label: "SW5E.SheetClassStarship"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheet5eVehicle, {
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
    types: ["class"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalMapLocationPageSheet, {
    label: "SW5E.SheetClassMapLocation",
    types: ["map"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalRulePageSheet, {
    label: "SW5E.SheetClassRule",
    types: ["rule"]
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

  // Exhaustion handling
  documents.ActiveEffect5e.registerHUDListeners();

  // Register Babele stuff
  if (typeof Babele !== "undefined") {
    Babele.get().setSystemTranslationsDir("babele");
  }
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
      "attributes.ac.value",
      "attributes.init.total"
    ]
  };

  const creature = {
    bar: [
      ...common.bar,
      "attributes.hp",
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
    // ...Array.fromRange(Object.keys(SW5E.powerLevels).length - 1, 1).map(level => `powers.power${level}.value`)
    "attributes.force.points.value",
    "attributes.tech.points.value",
    "attributes.super.dice.value"
    // TODO SW5E: Check if this would work for consuming power dice
    // ...Object.keys(SW5E.ssModSystems).map(system => `attributes.power.${system.lower()}.value`),
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
    }
  });
}

/* -------------------------------------------- */

/**
 * Configure system status effects.
 */
function _configureStatusEffects() {
  const addEffect = (effects, data) => {
    effects.push(data);
    if ( "special" in data ) CONFIG.specialStatusEffects[data.special] = data.id;
  };
  CONFIG.statusEffects = Object.entries(CONFIG.SW5E.statusEffects).reduce((arr, [id, data]) => {
    const original = CONFIG.statusEffects.find(s => s.id === id);
    addEffect(arr, foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false }));
    return arr;
  }, []);
  for ( const [id, {label: name, ...data}] of Object.entries(CONFIG.SW5E.conditionTypes) ) {
    addEffect(CONFIG.statusEffects, { id, name, ...data });
  }
}

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * Prepare attribute lists.
 */
Hooks.once("setup", function() {
  CONFIG.SW5E.trackableAttributes = expandAttributeList(CONFIG.SW5E.trackableAttributes);
  game.sw5e.moduleArt.registerModuleArt();

  Tooltips5e.activateListeners();
  game.sw5e.tooltips.observe();

  // Apply table of contents compendium style if specified in flags
  game.packs
    .filter(p => p.metadata.flags?.display === "table-of-contents")
    .forEach(p => p.applicationClass = applications.journal.TableOfContentsCompendium);

  // Apply custom item compendium
  game.packs.filter(p => p.metadata.type === "Item")
    .forEach(p => p.applicationClass = applications.item.ItemCompendium5e);

  // Configure token rings
  CONFIG.SW5E.tokenRings.shaderClass ??= game.release.generation < 12
    ? canvas.TokenRingSamplerShaderV11 : canvas.TokenRingSamplerShader;
  CONFIG.Token.ringClass.initialize();

  // Console.log(game.settings.get("sw5e", "colorTheme"));
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

  // World migration.
  if (migrations.needsMigration()) await migrations.migrateWorld();

  // Compendium pack folder migration.
  const cv = game.settings.get("sw5e", "systemMigrationVersion") || game.world.flags.sw5e?.version;
  if ( foundry.utils.isNewerVersion("3.0.0", cv) ) {
    migrations.reparentCompendiums("SW5e SRD Content", "D&D SRD Content");
  }

  // Configure compendium browser.
  game.sw5e.compendiumBrowser = new applications.compendium.CompendiumBrowser();

  // Make deprecated item types unavailable to create
  game.documentTypes.Item = game.documentTypes.Item.filter(t => !CONFIG.SW5E.deprecatedItemTypes.includes(t));
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", gameCanvas => {
  gameCanvas.grid.diagonalRule = game.settings.get("sw5e", "diagonalMovement");
  SquareGrid.prototype.measureDistances = canvas.measureDistances;
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

// Hooks.on("renderPause", (app, [html]) => {
//   html.classList.add("sw5e2");
//   const img = html.querySelector("img");
//   img.src = "systems/sw5e/ui/official/ampersand.svg";
//   img.className = "";
// });

// Hooks.on("renderSettings", () => {
//   const details = document.getElementById("game-details");
//   details.querySelector(".system").remove();
//   const heading = document.createElement("div");
//   heading.classList.add("sw5e2", "sidebar-heading");
//   heading.innerHTML = `
//     <h2>${game.i18n.localize("WORLD.GameSystem")}</h2>
//     <ul class="links">
//       <li>
//         <a href="https://github.com/foundryvtt/sw5e/releases/latest" target="_blank">
//           ${game.i18n.localize("SW5E.Notes")}
//         </a>
//       </li>
//       <li>
//         <a href="https://github.com/foundryvtt/sw5e/issues" target="_blank">${game.i18n.localize("SW5E.Issues")}</a>
//       </li>
//       <li>
//         <a href="https://github.com/foundryvtt/sw5e/wiki" target="_blank">${game.i18n.localize("SW5E.Wiki")}</a>
//       </li>
//       <li>
//         <a href="https://discord.com/channels/170995199584108546/670336046164213761" target="_blank">
//           ${game.i18n.localize("SW5E.Discord")}
//         </a>
//       </li>
//     </ul>
//   `;
//   details.insertAdjacentElement("afterend", heading);
//   const badge = document.createElement("div");
//   badge.classList.add("sw5e2", "system-badge");
//   badge.innerHTML = `
//     <img src="systems/sw5e/ui/official/dnd-badge-32.webp" data-tooltip="${sw5e.title}" alt="${sw5e.title}">
//     <span class="system-info">${sw5e.version}</span>
//   `;
//   heading.insertAdjacentElement("afterend", badge);
// });

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

Hooks.on("chatMessage", (app, message, data) => sw5e.applications.Award.chatMessage(message));

Hooks.on("renderActorDirectory", (app, html, data) => documents.Actor5e.onRenderActorDirectory(html));
Hooks.on("getActorDirectoryEntryContext", documents.Actor5e.addDirectoryContextOptions);

Hooks.on("applyTokenStatusEffect", canvas.Token5e.onApplyTokenStatusEffect);
Hooks.on("targetToken", canvas.Token5e.onTargetToken);

Hooks.on("renderSceneDirectory", (app, html, data) => {
  // Console.log(html.find("header.folder-header"));
  setFolderBackground(html);
});
Hooks.on("renderActorDirectory", (app, html, data) => {
  setFolderBackground(html);
  CharacterImporter.addImportButton(html);
  DisplayCR(html);
});
Hooks.on("renderCompendium", (compendium, html, data) => {
  DisplayCR(html, compendium);
});
Hooks.on("renderItemDirectory", (app, html, data) => {
  setFolderBackground(html);
});
Hooks.on("renderJournalDirectory", (app, html, data) => {
  setFolderBackground(html);
});
Hooks.on("renderRollTableDirectory", (app, html, data) => {
  setFolderBackground(html);
});
// Remigrate button and links, adapted from pf2e
Hooks.on("renderSettings", async (_app, html) => {
  const elements = ["<h2>Star Wars 5e</h2>"];

  const links = {
    guide: {
      url: "https://github.com/unrealkakeman89/sw5e/wiki",
      label: game.i18n.localize("SW5E.Wiki")
    },
    changelog: {
      url: "https://github.com/unrealkakeman89/sw5e/releases",
      label: game.i18n.localize("SW5E.Changelog")
    },
    discord: {
      url: "https://discord.gg/HUNHVhDQka",
      label: game.i18n.localize("SW5E.Discord")
    }
  };

  for (const link of Object.values(links)) {
    const element = $("<div>").attr({ id: "sw5e-link" });
    const lnk = $(`<a href=${link.url}>`).append(
      $('<button type="button">').append(utils.fontAwesomeIcon("link"), link.label)
    );
    element.append(lnk);

    elements.push(element);
  }

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
Hooks.on("ActorSheet5eCharacterNew", (app, html, data) => {
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
