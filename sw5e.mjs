/**
 * The SW5e game system for Foundry Virtual Tabletop
 * Author: Kakeman89
 * Software License: GNU GPLv3
 * Content License: https://media.wizards.com/2016/downloads/SW5E/SRD-OGL_V5.1.pdf
 * Repository: https://github.com/foundrynet/sw5e
 * Issue Tracker: https://github.com/foundrynet/sw5e/issues
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
import * as migrations from "./module/migration.mjs";
import * as utils from "./module/utils.mjs";
import { ModuleArt } from "./module/module-art.mjs";

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

  /** @deprecated */
  Object.defineProperty(sw5e, "entities", {
    get() {
      foundry.utils.logCompatibilityWarning(
        "You are referencing the 'sw5e.entities' property which has been deprecated and renamed to "
          + "'sw5e.documents'. Support for this old path will be removed in a future version.",
        { since: "SW5e 2.0", until: "SW5e 2.2" }
      );
      return sw5e.documents;
    }
  });

  /** @deprecated */
  Object.defineProperty(sw5e, "rollItemMacro", {
    get() {
      foundry.utils.logCompatibilityWarning(
        "You are referencing the 'sw5e.rollItemMacro' method which has been deprecated and renamed to "
          + "'sw5e.documents.macro.rollItem'. Support for this old path will be removed in a future version.",
        { since: "SW5e 2.0", until: "SW5e 2.2" }
      );
      return sw5e.documents.macro.rollItem;
    }
  });

  /** @deprecated */
  Object.defineProperty(sw5e, "macros", {
    get() {
      foundry.utils.logCompatibilityWarning(
        "You are referencing the 'sw5e.macros' property which has been deprecated and renamed to "
          + "'sw5e.documents.macro'. Support for this old path will be removed in a future version.",
        { since: "SW5e 2.0", until: "SW5e 2.2" }
      );
      return sw5e.documents.macro;
    }
  });

  // Record Configuration Values
  CONFIG.SW5E = SW5E;
  CONFIG.ActiveEffect.documentClass = documents.ActiveEffect5e;
  CONFIG.Actor.documentClass = documents.Actor5e;
  CONFIG.Item.documentClass = documents.Item5e;
  CONFIG.Token.documentClass = documents.TokenDocument5e;
  CONFIG.Token.objectClass = canvas.Token5e;
  CONFIG.time.roundTime = 6;
  // TODO: Figure out if this is still necessary / how to make this work
  // CONFIG.fontFamilies = ["Engli-Besh", "Open Sans", "Russo One"];
  CONFIG.Dice.DamageRoll = dice.DamageRoll;
  CONFIG.Dice.D20Roll = dice.D20Roll;
  CONFIG.Dice.AttribDieRoll = dice.AttribDieRoll;
  CONFIG.MeasuredTemplate.defaults.angle = 53.13; // 5e cone RAW should be 53.13 degrees
  CONFIG.ui.combat = applications.combat.CombatTracker5e;

  // Add DND5e namespace for module compatibility
  game.dnd5e = game.sw5e;
  CONFIG.DND5E = CONFIG.SW5E;
  // Add 'spell' equivalent of 'power' config for module compatibility
  for (const [power, val] of Object.entries(CONFIG.SW5E).filter(([k]) => k.search(/power(?!die|routing|coupling)/i) !== -1)) {
    const spell = power.replace(/power/g, "spell").replace(/Power/g, "Spell");
    if (CONFIG.SW5E[spell] !== undefined) console.warn(`CONFIG.SW5E.${spell} is already defined`);
    else CONFIG.SW5E[spell] = val;
  }

  // Register System Settings
  registerSystemSettings();

  // Validation strictness.
  _determineValidationStrictness();

  // Configure module art.
  game.sw5e.moduleArt = new ModuleArt();

  // Remove honor & sanity from configuration if they aren't enabled
  if (!game.settings.get("sw5e", "honorScore")) {
    delete SW5E.abilities.hon;
    delete SW5E.abilityAbbreviations.hon;
  }
  if (!game.settings.get("sw5e", "sanityScore")) {
    delete SW5E.abilities.san;
    delete SW5E.abilityAbbreviations.san;
  }

  // Patch Core Functions
  Combatant.prototype.getInitiativeRoll = documents.combat.getInitiativeRoll;

  // Register Roll Extensions
  CONFIG.Dice.rolls.push(dice.D20Roll);
  CONFIG.Dice.rolls.push(dice.DamageRoll);
  CONFIG.Dice.rolls.push(dice.AttribDieRoll);

  // Hook up system data types
  CONFIG.Actor.systemDataModels = dataModels.actor.config;
  CONFIG.Item.systemDataModels = dataModels.item.config;
  CONFIG.JournalEntryPage.systemDataModels = dataModels.journal.config;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("sw5e", applications.actor.ActorSheet5eCharacter, {
    types: ["character"],
    makeDefault: true,
    label: "SW5E.SheetClassCharacter"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetOrig5eCharacter, {
    types: ["character"],
    makeDefault: false,
    label: "SW5E.SheetClassCharacterOld"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheet5eNPC, {
    types: ["npc"],
    makeDefault: true,
    label: "SW5E.SheetClassNPC"
  });
  Actors.registerSheet("sw5e", applications.actor.ActorSheetOrig5eNPC, {
    types: ["npc"],
    makeDefault: false,
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

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("sw5e", applications.item.ItemSheet5e, {
    types: [
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
    ],
    makeDefault: true,
    label: "SW5E.SheetClassItem"
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "sw5e", applications.journal.JournalClassPageSheet, {
    label: "SW5E.SheetClassClassSummary",
    types: ["class"]
  });

  // Preload Handlebars helpers & partials
  utils.registerHandlebarsHelpers();
  utils.preloadHandlebarsTemplates();
});

/**
 * Determine if this is a 'legacy' world with permissive validation, or one where strict validation is enabled.
 * @internal
 */
function _determineValidationStrictness() {
  dataModels.SystemDataModel._enableV10Validation = game.settings.get("sw5e", "strictValidation");
}

/**
 * Update the world's validation strictness setting based on whether validation errors were encountered.
 * @internal
 */
async function _configureValidationStrictness() {
  if (!game.user.isGM) return;
  const invalidDocuments = game.actors.invalidDocumentIds.size + game.items.invalidDocumentIds.size;
  const strictValidation = game.settings.get("sw5e", "strictValidation");
  if (invalidDocuments && strictValidation) {
    await game.settings.set("sw5e", "strictValidation", false);
    game.socket.emit("reload");
    foundry.utils.debouncedReload();
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
  CONFIG.SW5E.consumableResources = expandAttributeList(CONFIG.SW5E.consumableResources);
  game.sw5e.moduleArt.registerModuleArt();

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
  // Configure validation strictness.
  _configureValidationStrictness();

  // TODO: Uncomment this once/if we ever add a rules compendium like dnd5e
  // // Apply custom compendium styles to the SRD rules compendium.
  // const rules = game.packs.get("sw5e.rules");
  // rules.apps = [new applications.journal.SRDCompendium(rules)];

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (["Item", "ActiveEffect"].includes(data.type)) {
      documents.macro.create5eMacro(data, slot);
      return false;
    }
  });

  if (migrations.needsMigration()) await migrations.migrateWorld();

  // Make deprecated item types unavailable to create
  game.documentTypes.Item = game.documentTypes.Item.filter(t => !(t in CONFIG.SW5E.deprecatedItemTypes));
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", gameCanvas => {
  gameCanvas.grid.diagonalRule = game.settings.get("sw5e", "diagonalMovement");
  SquareGrid.prototype.measureDistances = canvas.measureDistances;
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("renderChatMessage", documents.chat.onRenderChatMessage);
Hooks.on("getChatLogEntryContext", documents.chat.addChatMessageContextOptions);

Hooks.on("renderChatLog", (app, html, data) => documents.Item5e.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => documents.Item5e.chatListeners(html));
Hooks.on("getActorDirectoryEntryContext", documents.Actor5e.addDirectoryContextOptions);
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
// Remigrate button and links, adapted from PF2E
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

export { applications, canvas, dataModels, dice, documents, migrations, utils, SW5E };
