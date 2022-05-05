/**
 * The SW5E game system for Foundry Virtual Tabletop
 * Author: Kakeman89
 * Software License: GNU GPLv3
 * Content License: https://media.wizards.com/2016/downloads/SW5E/SRD-OGL_V5.1.pdf
 * Repository: https://gitlab.com/foundrynet/sw5e
 * Issue Tracker: https://gitlab.com/foundrynet/sw5e/issues
 */

// Import Modules
import {SW5E} from "./module/config.js";
import {registerSystemSettings} from "./module/settings.js";
import {preloadHandlebarsTemplates, registerHandlebarsHelpers} from "./module/templates.js";
import {_getInitiativeFormula} from "./module/combat.js";
import {measureDistances} from "./module/canvas.js";

// Import Documents
import Actor5e from "./module/actor/entity.js";
import Item5e from "./module/item/entity.js";
import CharacterImporter from "./module/characterImporter.js";
import {TokenDocument5e, Token5e} from "./module/token.js";
import DisplayCR from "./module/display-cr.js";

// Import Applications
import AbilityTemplate from "./module/pixi/ability-template.js";
import AbilityUseDialog from "./module/apps/ability-use-dialog.js";
import ActorAbilityConfig from "./module/apps/ability-config.js";
import ActorArmorConfig from "./module/apps/actor-armor.js";
import ActorHitDiceConfig from "./module/apps/hit-dice-config.js";
import ActorMovementConfig from "./module/apps/movement-config.js";
import ActorSensesConfig from "./module/apps/senses-config.js";
import ActorSheetFlags from "./module/apps/actor-flags.js";
import ActorSheet5eCharacter from "./module/actor/sheets/oldSheets/character.js";
import ActorSheet5eNPC from "./module/actor/sheets/oldSheets/npc.js";
import ActorSheet5eStarship from "./module/actor/sheets/newSheet/starship.js";
import ActorSheet5eVehicle from "./module/actor/sheets/oldSheets/vehicle.js";
import ActorSheet5eCharacterNew from "./module/actor/sheets/newSheet/character.js";
import ActorSheet5eNPCNew from "./module/actor/sheets/newSheet/npc.js";
import ActorSkillConfig from "./module/apps/skill-config.js";
import ActorTypeConfig from "./module/apps/actor-type.js";
import ItemSheet5e from "./module/item/sheet.js";
import LongRestDialog from "./module/apps/long-rest.js";
import ProficiencySelector from "./module/apps/proficiency-selector.js";
import SelectItemsPrompt from "./module/apps/select-items-prompt.js";
import ShortRestDialog from "./module/apps/short-rest.js";
import TraitSelector from "./module/apps/trait-selector.js";

// Import Helpers
import advancement from "./module/advancement.js";
import * as chat from "./module/chat.js";
import * as dice from "./module/dice.js";
import * as macros from "./module/macros.js";
import * as migrations from "./module/migration.js";
import * as utils from "./module/utils.js";
import ActiveEffect5e from "./module/active-effect.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

// Keep on while testing new SW5e build
CONFIG.debug.hooks = false;

Hooks.once("init", function () {
    console.log(`SW5e | Initializing SW5E System\n${SW5E.ASCII}`);

    // Create a SW5E namespace within the game global
    game.sw5e = {
        advancement,
        applications: {
            AbilityUseDialog,
            ActorAbilityConfig,
            ActorArmorConfig,
            ActorHitDiceConfig,
            ActorMovementConfig,
            ActorSensesConfig,
            ActorSheetFlags,
            ActorSheet5eCharacter,
            ActorSheet5eCharacterNew,
            ActorSheet5eNPC,
            ActorSheet5eNPCNew,
            ActorSheet5eVehicle,
            ActorSheet5eStarship,
            ActorSkillConfig,
            ActorTypeConfig,
            ItemSheet5e,
            LongRestDialog,
            ProficiencySelector,
            SelectItemsPrompt,
            ShortRestDialog,
            TraitSelector
        },
        canvas: {
            AbilityTemplate
        },
        config: SW5E,
        dice,
        entities: {
            Actor5e,
            Item5e,
            TokenDocument5e,
            Token5e
        },
        macros,
        migrations,
        rollItemMacro: macros.rollItem,
        utils,
        isV9: !foundry.utils.isNewerVersion("9.224", game.version)
    };

    // Record Configuration Values
    CONFIG.SW5E = SW5E;
    CONFIG.ActiveEffect.documentClass = ActiveEffect5e;
    CONFIG.Actor.documentClass = Actor5e;
    CONFIG.Item.documentClass = Item5e;
    CONFIG.Token.documentClass = TokenDocument5e;
    CONFIG.Token.objectClass = Token5e;
    CONFIG.time.roundTime = 6;
    CONFIG.fontFamilies = ["Engli-Besh", "Open Sans", "Russo One"];

    CONFIG.Dice.DamageRoll = dice.DamageRoll;
    CONFIG.Dice.D20Roll = dice.D20Roll;
    CONFIG.Dice.AttribDieRoll = dice.AttribDieRoll;

    // 5e cone RAW should be 53.13 degrees
    CONFIG.MeasuredTemplate.defaults.angle = 53.13;

    // Add DND5e namespace for module compatability
    game.dnd5e = game.sw5e;
    CONFIG.DND5E = CONFIG.SW5E;

    // Register System Settings
    registerSystemSettings();

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
    CONFIG.Combat.initiative.formula =
        "1d20 + @attributes.init.mod + @attributes.init.prof + @attributes.init.bonus + @abilities.dex.bonuses.check + @bonuses.abilities.check";
    Combatant.prototype._getInitiativeFormula = _getInitiativeFormula;

    // Register Roll Extensions
    CONFIG.Dice.rolls.push(dice.D20Roll);
    CONFIG.Dice.rolls.push(dice.DamageRoll);
    CONFIG.Dice.rolls.push(dice.AttribDieRoll);

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
    Actors.registerSheet("sw5e", ActorSheet5eStarship, {
        types: ["starship"],
        makeDefault: true,
        label: "SW5E.SheetClassStarship"
    });
    Actors.registerSheet("sw5e", ActorSheet5eVehicle, {
        types: ["vehicle"],
        makeDefault: true,
        label: "SW5E.SheetClassVehicle"
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("sw5e", ItemSheet5e, {
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
            "starshipaction",
            "starshipfeature",
            "starshipmod",
            "venture",
            "modification"
        ],
        makeDefault: true,
        label: "SW5E.SheetClassItem"
    });

    // Preload Handlebars helpers & partials
    registerHandlebarsHelpers();
    preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * Prepare attribute lists.
 */
Hooks.once("setup", function () {
    CONFIG.SW5E.trackableAttributes = expandAttributeList(CONFIG.SW5E.trackableAttributes);
    CONFIG.SW5E.consumableResources = expandAttributeList(CONFIG.SW5E.consumableResources);

    // console.log(game.settings.get("sw5e", "colorTheme"));
    let theme = game.settings.get("sw5e", "colorTheme") + "-theme";
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
Hooks.once("ready", function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => macros.create5eMacro(data, slot));

    // Determine whether a system migration is required and feasible
    if (!game.user.isGM) return;
    const currentVersion = game.settings.get("sw5e", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = "1.6.0.2.2";
    // Check for R1 SW5E versions
    const SW5E_NEEDS_MIGRATION_VERSION = "1.6.0.Z";
    const COMPATIBLE_MIGRATION_VERSION = 0.8;
    const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
    if (!currentVersion && totalDocuments === 0)
        return game.settings.set("sw5e", "systemMigrationVersion", game.system.data.version);
    const needsMigration =
        currentVersion &&
        (isNewerVersion(SW5E_NEEDS_MIGRATION_VERSION, currentVersion) ||
            isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion));
    if (!needsMigration && needsMigration !== "") return;

    // Perform the migration
    if (currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)) {
        ui.notifications.error(game.i18n.localize("MIGRATION.5eVersionTooOldWarning"), {permanent: true});
    }
    migrations.migrateWorld();
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function () {
    // Extend Diagonal Measurement
    canvas.grid.diagonalRule = game.settings.get("sw5e", "diagonalMovement");
    SquareGrid.prototype.measureDistances = measureDistances;
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
Hooks.on("getActorDirectoryEntryContext", Actor5e.addDirectoryContextOptions);
Hooks.on("renderSceneDirectory", (app, html, data) => {
    //console.log(html.find("header.folder-header"));
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
Hooks.on("ActorSheet5eCharacterNew", (app, html, data) => {
    console.log("renderSwaltSheet");
});

Handlebars.registerHelper("round", function (value) {
    return Math.floor(value);
});

Handlebars.registerHelper("debug", function (value) {
    console.log(value);
    return value;
});

Handlebars.registerHelper("isUndefined", function (value) {
    return value === undefined;
});

Handlebars.registerHelper("isNull", function (value) {
    return value === null;
});

Handlebars.registerHelper("contentLink", function (uuid, placeholdertext) {
    if (!uuid) {
        if (!placeholdertext || typeof placeholdertext != String) return new Handlebars.SafeString("");
        return new Handlebars.SafeString(placeholdertext);
    }
    const parts = uuid.split(".");
    const type = parts[0];
    const target = parts.slice(1).join(".");
    const html = TextEditor._createContentLink("", type, target);
    return new Handlebars.SafeString(html.outerHTML);
});

function setFolderBackground(html) {
    html.find("header.folder-header").each(function () {
        let bgColor = $(this).css("background-color");
        if (bgColor == undefined) bgColor = "rgb(255,255,255)";
        $(this).closest("li").css("background-color", bgColor);
    });
}
