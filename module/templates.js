/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Shared Partials
    "systems/sw5e/templates/actors/parts/active-effects.html",

    // Actor Sheet Partials
    "systems/sw5e/templates/actors/oldActor/parts/actor-traits.html",
    "systems/sw5e/templates/actors/oldActor/parts/actor-inventory.html",
    "systems/sw5e/templates/actors/oldActor/parts/actor-features.html",
    "systems/sw5e/templates/actors/oldActor/parts/actor-powerbook.html",
	  "systems/sw5e/templates/actors/oldActor/parts/actor-notes.html",

    "systems/sw5e/templates/actors/newActor/parts/swalt-biography.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-core.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-crew.html",	
	  "systems/sw5e/templates/actors/newActor/parts/swalt-active-effects.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-features.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-inventory.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-force-powerbook.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-tech-powerbook.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-resources.html",
    "systems/sw5e/templates/actors/newActor/parts/swalt-traits.html",
    
    // Item Sheet Partials
    "systems/sw5e/templates/items/parts/item-action.html",
    "systems/sw5e/templates/items/parts/item-activation.html",
    "systems/sw5e/templates/items/parts/item-description.html",
    "systems/sw5e/templates/items/parts/item-mountable.html"
  ]);
};
