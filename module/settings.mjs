import { ModuleArtConfig } from "./module-art.mjs";

/**
 * Register all of the system's settings.
 */
export default function registerSystemSettings() {
  // Internal System Migration Version
  game.settings.register("sw5e", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: game.system.version
  });

  // Rest Recovery Rules
  game.settings.register("sw5e", "restVariant", {
    name: "SETTINGS.5eRestN",
    hint: "SETTINGS.5eRestL",
    scope: "world",
    config: true,
    default: "normal",
    type: String,
    choices: {
      normal: "SETTINGS.5eRestPHB",
      gritty: "SETTINGS.5eRestGritty",
      epic: "SETTINGS.5eRestEpic"
    }
  });

  // Diagonal Movement Rule
  game.settings.register("sw5e", "diagonalMovement", {
    name: "SETTINGS.5eDiagN",
    hint: "SETTINGS.5eDiagL",
    scope: "world",
    config: true,
    default: "555",
    type: String,
    choices: {
      555: "SETTINGS.5eDiagPHB",
      5105: "SETTINGS.5eDiagDMG",
      EUCL: "SETTINGS.5eDiagEuclidean"
    },
    onChange: rule => (canvas.grid.diagonalRule = rule)
  });

  // Allow rotating square templates
  game.settings.register("sw5e", "gridAlignedSquareTemplates", {
    name: "SETTINGS.5eGridAlignedSquareTemplatesN",
    hint: "SETTINGS.5eGridAlignedSquareTemplatesL",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  // Proficiency modifier type
  game.settings.register("sw5e", "proficiencyModifier", {
    name: "SETTINGS.5eProfN",
    hint: "SETTINGS.5eProfL",
    scope: "world",
    config: true,
    default: "bonus",
    type: String,
    choices: {
      bonus: "SETTINGS.5eProfBonus",
      dice: "SETTINGS.5eProfDice"
    }
  });

  // Allow feats during Ability Score Improvements
  game.settings.register("sw5e", "allowFeats", {
    name: "SETTINGS.5eFeatsN",
    hint: "SETTINGS.5eFeatsL",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  // Allow 'feat + 1 ASI' variant rule
  game.settings.register("sw5e", "allowFeatsAndASI", {
    name: "SETTINGS.5eFeatsAndASIN",
    hint: "SETTINGS.5eFeatsAndASIL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  // Use Honor ability score
  game.settings.register("sw5e", "honorScore", {
    name: "SETTINGS.5eHonorN",
    hint: "SETTINGS.5eHonorL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  // Use Sanity ability score
  game.settings.register("sw5e", "sanityScore", {
    name: "SETTINGS.5eSanityN",
    hint: "SETTINGS.5eSanityL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  // Apply Dexterity as Initiative Tiebreaker
  game.settings.register("sw5e", "initiativeDexTiebreaker", {
    name: "SETTINGS.5eInitTBN",
    hint: "SETTINGS.5eInitTBL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  // Record Currency Weight
  game.settings.register("sw5e", "currencyWeight", {
    name: "SETTINGS.5eCurWtN",
    hint: "SETTINGS.5eCurWtL",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  // Disable Experience Tracking
  game.settings.register("sw5e", "disableExperienceTracking", {
    name: "SETTINGS.5eNoExpN",
    hint: "SETTINGS.5eNoExpL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  // Disable Advancements
  game.settings.register("sw5e", "disableAdvancements", {
    name: "SETTINGS.5eNoAdvancementsN",
    hint: "SETTINGS.5eNoAdvancementsL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  // Collapse Item Cards (by default)
  game.settings.register("sw5e", "autoCollapseItemCards", {
    name: "SETTINGS.5eAutoCollapseCardN",
    hint: "SETTINGS.5eAutoCollapseCardL",
    scope: "client",
    config: true,
    default: false,
    type: Boolean,
    onChange: s => {
      ui.chat.render();
    }
  });

  // Allow Polymorphing
  game.settings.register("sw5e", "allowPolymorphing", {
    name: "SETTINGS.5eAllowPolymorphingN",
    hint: "SETTINGS.5eAllowPolymorphingL",
    scope: "world",
    config: true,
    default: false,
    type: Boolean
  });

  // Polymorph Settings
  game.settings.register("sw5e", "polymorphSettings", {
    scope: "client",
    default: {
      keepPhysical: false,
      keepMental: false,
      keepSaves: false,
      keepSkills: false,
      mergeSaves: false,
      mergeSkills: false,
      keepClass: false,
      keepFeats: false,
      keepPowers: false,
      keepItems: false,
      keepBio: false,
      keepVision: true,
      keepSelf: false,
      keepAE: false,
      keepOriginAE: true,
      keepOtherOriginAE: true,
      keepFeatAE: true,
      keepPowerAE: true,
      keepEquipmentAE: true,
      keepClassAE: true,
      keepBackgroundAE: true,
      transformTokens: true
    }
  });

  // Visual Color Theme
  game.settings.register("sw5e", "colorTheme", {
    name: "SETTINGS.SWColorN",
    hint: "SETTINGS.SWColorL",
    scope: "world",
    config: true,
    default: "light",
    type: String,
    choices: {
      light: "SETTINGS.SWColorLight",
      dark: "SETTINGS.SWColorDark"
    }
  });

  // Metric Unit Weights
  game.settings.register("sw5e", "metricWeightUnits", {
    name: "SETTINGS.5eMetricN",
    hint: "SETTINGS.5eMetricL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Simplified Forcecasting
  game.settings.register("sw5e", "simplifiedForcecasting", {
    name: "SETTINGS.SWSimplifiedForcecastingN",
    hint: "SETTINGS.SWSimplifiedForcecastingL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Critical Damage Modifiers
  game.settings.register("sw5e", "criticalDamageModifiers", {
    name: "SETTINGS.5eCriticalModifiersN",
    hint: "SETTINGS.5eCriticalModifiersL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Critical Damage Maximize
  game.settings.register("sw5e", "criticalDamageMaxDice", {
    name: "SETTINGS.5eCriticalMaxDiceN",
    hint: "SETTINGS.5eCriticalMaxDiceL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Strict validation
  game.settings.register("sw5e", "strictValidation", {
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });

  // Dynamic art.
  game.settings.registerMenu("sw5e", "moduleArtConfiguration", {
    name: "SW5E.ModuleArtConfigN",
    label: "SW5E.ModuleArtConfigL",
    hint: "SW5E.ModuleArtConfigH",
    icon: "fa-solid fa-palette",
    type: ModuleArtConfig,
    restricted: true
  });

  game.settings.register("sw5e", "moduleArtConfiguration", {
    name: "Module Art Configuration",
    scope: "world",
    config: false,
    type: Object,
    default: {
      sw5e: {
        portraits: true,
        tokens: true
      }
    }
  });

  // Disable Item Modification Effects
  game.settings.register("sw5e", "disableItemMods", {
    name: "SETTINGS.SWDisableModsN",
    hint: "SETTINGS.SWDisableModsL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Use old starship movement calculation rules
  game.settings.register("sw5e", "oldStarshipMovement", {
    name: "SETTINGS.SWOldStarshipMovementN",
    hint: "SETTINGS.SWOldStarshipMovementL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // NPCs consume ammo
  game.settings.register("sw5e", "npcConsumeAmmo", {
    name: "SETTINGS.SWnpcConsumeAmmoN",
    hint: "SETTINGS.SWnpcConsumeAmmoL",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
}
