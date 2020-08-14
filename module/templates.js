/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "systems/sw5e/templates/actors/parts/actor-traits.html",
    "systems/sw5e/templates/actors/parts/actor-inventory.html",
    "systems/sw5e/templates/actors/parts/actor-features.html",
    "systems/sw5e/templates/actors/parts/actor-powerbook.html",

    // Item Sheet Partials
    "systems/sw5e/templates/items/parts/item-action.html",
    "systems/sw5e/templates/items/parts/item-activation.html",
    "systems/sw5e/templates/items/parts/item-description.html",
    "systems/sw5e/templates/items/parts/item-mountable.html"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
