import { _linkForUuid } from "./utils.js";

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Shared Partials
    "systems/sw5e/templates/actors/parts/active-effects.html",

    // Actor Sheet Partials
    "systems/sw5e/templates/actors/parts/actor-traits.html",
    "systems/sw5e/templates/actors/parts/actor-inventory.html",
    "systems/sw5e/templates/actors/parts/actor-features.html",
    "systems/sw5e/templates/actors/parts/actor-powerbook.html",
    "systems/sw5e/templates/actors/parts/actor-warnings.html",

    // Item Sheet Partials
    "systems/sw5e/templates/items/parts/item-action.html",
    "systems/sw5e/templates/items/parts/item-activation.html",
    "systems/sw5e/templates/items/parts/item-advancement.html",
    "systems/sw5e/templates/items/parts/item-description.html",
    "systems/sw5e/templates/items/parts/item-mountable.html",
    "systems/sw5e/templates/items/parts/item-powercasting.html",

    // Advancement Partials
    "systems/sw5e/templates/advancement/parts/advancement-controls.html"
  ]);
};

/* -------------------------------------------- */

/**
 * Register custom Handlebars helpers used by 5e.
 */
export const registerHandlebarsHelpers = function() {
  Handlebars.registerHelper({
    getProperty: foundry.utils.getProperty,
    "sw5e-linkForUuid": _linkForUuid
  });
};
