import ActorSheet5e from "./base.js";

/**
 * An Actor sheet for starships in the SW5E system.
 * Extends the base ActorSheet5e class.
 * @extends {ActorSheet5e}
 */
export default class ActorSheet5eStarship extends ActorSheet5e {

  /** @override */
  get template() {
    if ( !game.user.isGM && this.actor.limited ) return "systems/sw5e/templates/actors/newActor/limited-sheet.html";
    return `systems/sw5e/templates/actors/newActor/starship.html`;
  }
  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      classes: ["sw5e", "sheet", "actor", "starship"],
      width: 800,
      tabs: [{
        navSelector: ".root-tabs",
        contentSelector: ".sheet-body",
        initial: "attributes"
      }],
    });
  }

  /* -------------------------------------------- */

  /**
   * Organize Owned Items for rendering the starship sheet
   * @private
   */
  _prepareItems(data) {

    // Categorize Items as Features and Powers
    const features = {
      weapons: { label: game.i18n.localize("SW5E.ItemTypeWeaponPl"), items: [], hasActions: true, dataset: {type: "weapon", "weapon-type": "natural"} },
      passive: { label: game.i18n.localize("SW5E.Features"), items: [], dataset: {type: "feat"} },
      equipment: { label: game.i18n.localize("SW5E.StarshipEquipment"), items: [], dataset: {type: "equipment"}},
	    starshipfeatures: { label: game.i18n.localize("SW5E.StarshipfeaturePl"), items: [], hasActions: true, dataset: {type: "starshipfeature"} },
	    starshipmods: { label: game.i18n.localize("SW5E.StarshipmodPl"), items: [], hasActions: false, dataset: {type: "starshipmod"} }
    };

    // Start by classifying items into groups for rendering
    let [forcepowers, techpowers, other] = data.items.reduce((arr, item) => {
      item.img = item.img || CONST.DEFAULT_TOKEN;
      item.isStack = Number.isNumeric(item.data.quantity) && (item.data.quantity !== 1);
      item.hasUses = item.data.uses && (item.data.uses.max > 0);
      item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
      item.isDepleted = item.isOnCooldown && (item.data.uses.per && (item.data.uses.value > 0));
      item.hasTarget = !!item.data.target && !(["none",""].includes(item.data.target.type));
      if ( item.type === "power" && ["lgt", "drk", "uni"].includes(item.data.school) ) arr[0].push(item);
      else if ( item.type === "power" && ["tec"].includes(item.data.school) ) arr[1].push(item);
      else arr[2].push(item);
      return arr;
    }, [[], [], []]);

    // Apply item filters
    forcepowers = this._filterItems(forcepowers, this._filters.forcePowerbook);
    techpowers = this._filterItems(techpowers, this._filters.techPowerbook);
    other = this._filterItems(other, this._filters.features);

    // Organize Powerbook
//    const forcePowerbook = this._preparePowerbook(data, forcepowers, "uni");
//    const techPowerbook = this._preparePowerbook(data, techpowers, "tec");

    // Organize Features
    for ( let item of other ) {
      if ( item.type === "weapon" ) features.weapons.items.push(item);
      else if ( item.type === "feat" ) {
        if ( item.data.activation.type ) features.actions.items.push(item);
        else features.passive.items.push(item);
      }
      else if ( item.type === "starshipfeature" ) {
		  features.starshipfeatures.items.push(item);
	  }	  
	  else if ( item.type === "starshipmod" ) {
		  features.starshipmods.items.push(item);
	  }
      else features.equipment.items.push(item);
    }

    // Assign and return
    data.features = Object.values(features);
//    data.forcePowerbook = forcePowerbook;
//    data.techPowerbook = techPowerbook;
  }


  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const data = super.getData(options);

    // Add Size info
    data.isTiny = data.actor.data.traits.size === "tiny";
    data.isSmall = data.actor.data.traits.size === "sm";
    data.isMedium = data.actor.data.traits.size === "med";
    data.isLarge = data.actor.data.traits.size === "lg";
    data.isHuge = data.actor.data.traits.size === "huge";
    data.isGargantuan = data.actor.data.traits.size === "grg";

    // Challenge Rating
    const cr = parseFloat(data.data.details.cr || 0);
    const crLabels = {0: "0", 0.125: "1/8", 0.25: "1/4", 0.5: "1/2"};
    data.labels["cr"] = cr >= 1 ? String(cr) : crLabels[cr] || 1;
    return data;
  }

  /* -------------------------------------------- */
  /*  Object Updates                              */
  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {

    // Format NPC Challenge Rating
    const crs = {"1/8": 0.125, "1/4": 0.25, "1/2": 0.5};
    let crv = "data.details.cr";
    let cr = formData[crv];
    cr = crs[cr] || parseFloat(cr);
    if ( cr ) formData[crv] = cr < 1 ? cr : parseInt(cr);

    // Parent ActorSheet update steps
    return super._updateObject(event, formData);
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);
    html.find(".health .rollable").click(this._onRollHPFormula.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling NPC health values using the provided formula
   * @param {Event} event     The original click event
   * @private
   */
  _onRollHPFormula(event) {
    event.preventDefault();
    const formula = this.actor.data.data.attributes.hp.formula;
    if ( !formula ) return;
    const hp = new Roll(formula).roll().total;
    AudioHelper.play({src: CONFIG.sounds.dice});
    this.actor.update({"data.attributes.hp.value": hp, "data.attributes.hp.max": hp});
  }
}
