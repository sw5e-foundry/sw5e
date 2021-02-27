/**
 * The Star Wars 5th Edition game system for Foundry Virtual Tabletop
 * Author: Kakeman89
 * Software License: GNU GPLv3
 * Content License: https://media.wizards.com/2016/downloads/SW5E/SRD-OGL_V5.1.pdf
 * Repository: https://gitlab.com/foundrynet/sw5e
 * Issue Tracker: https://gitlab.com/foundrynet/sw5e/issues
 */

// Import Modules
import { SW5E } from "./module/config.js";
import { registerSystemSettings } from "./module/settings.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import { _getInitiativeFormula } from "./module/combat.js";
import { measureDistances, getBarAttribute } from "./module/canvas.js";

// Import Entities
import Actor5e from "./module/actor/entity.js";
import Item5e from "./module/item/entity.js";
import CharacterImporter from "./module/characterImporter.js";

// Import Applications
import AbilityTemplate from "./module/pixi/ability-template.js";
import AbilityUseDialog from "./module/apps/ability-use-dialog.js";
import ActorSheetFlags from "./module/apps/actor-flags.js";
import ActorSheet5eCharacter from "./module/actor/sheets/oldSheets/character.js";
import ActorSheet5eNPC from "./module/actor/sheets/oldSheets/npc.js";
import ActorSheet5eVehicle from "./module/actor/sheets/oldSheets/vehicle.js";
import ActorSheet5eCharacterNew from "./module/actor/sheets/newSheet/character.js";
import ActorSheet5eNPCNew from "./module/actor/sheets/newSheet/npc.js";
import ItemSheet5e from "./module/item/sheet.js";
import ShortRestDialog from "./module/apps/short-rest.js";
import TraitSelector from "./module/apps/trait-selector.js";
import ActorMovementConfig from "./module/apps/movement-config.js";
import ActorSensesConfig from "./module/apps/senses-config.js";

// Import Helpers
import * as chat from "./module/chat.js";
import * as dice from "./module/dice.js";
import * as macros from "./module/macros.js";
import * as migrations from "./module/migration.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
  console.log(`SW5e | Initializing SW5E System\n${SW5E.ASCII}`);

  // Create a SW5E namespace within the game global
  game.sw5e = {
    applications: {
      AbilityUseDialog,
      ActorSheetFlags,
      ActorSheet5eCharacter,
      ActorSheet5eCharacterNew,
      ActorSheet5eNPC,
      ActorSheet5eNPCNew,
      ActorSheet5eVehicle,
      ItemSheet5e,
      ShortRestDialog,
      TraitSelector,
      ActorMovementConfig
    },
    canvas: {
      AbilityTemplate
    },
    config: SW5E,
    dice: dice,
    entities: {
      Actor5e,
      Item5e,
    },
    macros: macros,
    migrations: migrations,
    rollItemMacro: macros.rollItemMacro
  };

  // Record Configuration Values
  CONFIG.SW5E = SW5E;
  CONFIG.Actor.entityClass = Actor5e;
  CONFIG.Item.entityClass = Item5e;
  CONFIG.time.roundTime = 6;
  CONFIG.fontFamilies = [
    "Engli-Besh",
    "Open Sans",
    "Russo One"
  ];

  // 5e cone RAW should be 53.13 degrees
  CONFIG.MeasuredTemplate.defaults.angle = 53.13;

  // Add DND5e namespace for module compatability
  game.dnd5e = game.sw5e;
  CONFIG.DND5E = CONFIG.SW5E;

  // Register System Settings
  registerSystemSettings();

  // Patch Core Functions
  CONFIG.Combat.initiative.formula = "1d20 + @attributes.init.mod + @attributes.init.prof + @attributes.init.bonus";
  Combat.prototype._getInitiativeFormula = _getInitiativeFormula;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("sw5e", ActorSheet5eCharacterNew, {
    types: ["character"],
    makeDefault: true,
    label: "SW5E.SheetClassCharacter"
   });
  Actors.registerSheet("sw5e", ActorSheet5eCharacter, {
    types: ["character"],
    makeDefault: false,
    label: "SW5E.SheetClassCharacterOld"
   });
  Actors.registerSheet("sw5e", ActorSheet5eNPCNew, {
    types: ["npc"],
    makeDefault: true,
    label: "SW5E.SheetClassNPC"
  });
  Actors.registerSheet("sw5e", ActorSheet5eNPC, {
    types: ["npc"],
    makeDefault: false,
    label: "SW5E.SheetClassNPCOld"
  });
  Actors.registerSheet('sw5e', ActorSheet5eVehicle, {
    types: ['vehicle'],
    makeDefault: true,
    label: "SW5E.SheetClassVehicle"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("sw5e", ItemSheet5e, {
	types: ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'class', 'power', 'feat', 'species', 'backpack', 'archetype', 'classfeature', 'background', 'fightingmastery', 'fightingstyle', 'lightsaberform'],
    makeDefault: true,
    label: "SW5E.SheetClassItem"
  });

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();
});


/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function() {

  // Localize CONFIG objects once up-front
  const toLocalize = [
    "abilities", "abilityAbbreviations", "abilityActivationTypes", "abilityConsumptionTypes", "actorSizes", "alignments",
    "armorProficiencies", "armorPropertiesTypes", "conditionTypes", "consumableTypes", "cover", "currencies", "damageResistanceTypes",
    "damageTypes", "distanceUnits", "equipmentTypes", "healingTypes", "itemActionTypes", "languages",
    "limitedUsePeriods", "movementTypes", "movementUnits", "polymorphSettings", "proficiencyLevels", "senses", "skills",
    "powerComponents", "powerLevels", "powerPreparationModes", "powerScalingModes", "powerSchools", "targetTypes",
    "timePeriods", "toolProficiencies", "weaponProficiencies", "weaponProperties", "weaponTypes"
  ];

  // Exclude some from sorting where the default order matters
  const noSort = [
    "abilities", "alignments", "currencies", "distanceUnits", "movementUnits", "itemActionTypes", "proficiencyLevels",
    "limitedUsePeriods", "powerComponents", "powerLevels", "powerPreparationModes", "weaponTypes"
  ];

  // Localize and sort CONFIG objects
  for ( let o of toLocalize ) {
    const localized = Object.entries(CONFIG.SW5E[o]).map(e => {
      return [e[0], game.i18n.localize(e[1])];
    });
    if ( !noSort.includes(o) ) localized.sort((a, b) => a[1].localeCompare(b[1]));
    CONFIG.SW5E[o] = localized.reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {});
  }
  // add DND5E translation for module compatability
  game.i18n.translations.DND5E = game.i18n.translations.SW5E;
  // console.log(game.settings.get("sw5e", "colorTheme"));
  let theme = game.settings.get("sw5e", "colorTheme") + '-theme';
  document.body.classList.add(theme);
});

/* -------------------------------------------- */

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", function() {

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => macros.create5eMacro(data, slot));

  // Determine whether a system migration is required and feasible
  if ( !game.user.isGM ) return;
  const currentVersion = game.settings.get("sw5e", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "R1-A1";
  const COMPATIBLE_MIGRATION_VERSION = 0.80;
  const needsMigration = currentVersion && isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  //if ( !needsMigration ) return;

  // Perform the migration
  //if ( currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) ) {
  //  const warning = `Your SW5e system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
  //  ui.notifications.error(warning, {permanent: true});
  //}
  migrations.migrateWorld();
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function() {

  // Extend Diagonal Measurement
  canvas.grid.diagonalRule = game.settings.get("sw5e", "diagonalMovement");
  SquareGrid.prototype.measureDistances = measureDistances;

  // Extend Token Resource Bars
  Token.prototype.getBarAttribute = getBarAttribute;
});


/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("renderChatMessage", (app, html, data) => {

  // Display action buttons
  chat.displayChatActionButtons(app, html, data);

  // Highlight critical success or failure die
  chat.highlightCriticalSuccessFailure(app, html, data);

  // Optionally collapse the content
  if (game.settings.get("sw5e", "autoCollapseItemCards")) html.find(".card-content").hide();
});
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatLog", (app, html, data) => Item5e.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => Item5e.chatListeners(html));
Hooks.on('getActorDirectoryEntryContext', Actor5e.addDirectoryContextOptions);
Hooks.on("renderSceneDirectory", (app, html, data)=> {
  //console.log(html.find("header.folder-header"));
  setFolderBackground(html);
});
Hooks.on("renderActorDirectory", (app, html, data)=> {
  setFolderBackground(html);
  CharacterImporter.addImportButton(html);
});
Hooks.on("renderItemDirectory",  (app, html, data)=> {
  setFolderBackground(html);
});
Hooks.on("renderJournalDirectory",  (app, html, data)=> {
  setFolderBackground(html);
});
Hooks.on("renderRollTableDirectory",  (app, html, data)=> {
  setFolderBackground(html);
});
Hooks.on("ActorSheet5eCharacterNew", (app, html, data) => {
  console.log("renderSwaltSheet");
});
// TODO I should remove this
Handlebars.registerHelper('getProperty', function (data, property) {
  return getProperty(data, property);
});


function setFolderBackground(html) {
  html.find("header.folder-header").each(function() {
    let bgColor = $(this).css("background-color");
    if(bgColor == undefined)
      bgColor = "rgb(255,255,255)";
    $(this).closest('li').css("background-color", bgColor);
   })
}