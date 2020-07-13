import { TraitSelector } from "../apps/trait-selector.js";


/**
 * Override and extend the core ItemSheet implementation to handle D&D5E specific item types
 * @type {ItemSheet}
 */
export class ItemSheet5e extends ItemSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      width: 560,
      height: 420,
      classes: ["sw5e", "sheet", "item"],
      resizable: false,
      scrollY: [".tab.details"],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/sw5e/templates/items/";
    return `${path}/${this.item.data.type}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.labels = this.item.labels;

    // Include CONFIG values
    data.config = CONFIG.SW5E;

    // Item Type, Status, and Details
    data.itemType = data.item.type.titleCase();
    data.itemStatus = this._getItemStatus(data.item);
    data.itemProperties = this._getItemProperties(data.item);
    data.isPhysical = data.item.data.hasOwnProperty("quantity");

    // Action Details
    data.hasAttackRoll = this.item.hasAttack;
    data.isHealing = data.item.data.actionType === "heal";
    data.isFlatDC = getProperty(data.item.data, "save.scaling") === "flat";
	data.isWeapon = data.item.type === "weapon";
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
   * @return {string}
   * @private
   */
  _getItemStatus(item) {
    if ( item.type === "power" ) {
      return CONFIG.SW5E.powerPreparationModes[item.data.preparation];
    }
    else if ( ["weapon", "equipment"].includes(item.type) ) {
      return item.data.equipped ? "Equipped" : "Unequipped";
    }
    else if ( item.type === "tool" ) {
      return item.data.proficient ? "Proficient" : "Not Proficient";
    }
  }

  /* -------------------------------------------- */

  /**
   * Get the Array of item properties which are used in the small sidebar of the description tab
   * @return {Array}
   * @private
   */
  _getItemProperties(item) {
    const props = [];
    const labels = this.item.labels;

    if ( item.type === "weapon" ) {
      props.push(...Object.entries(item.data.properties)
        .filter(e => e[1] === true)
        .map(e => CONFIG.SW5E.weaponProperties[e[0]]));
    }

    else if ( item.type === "power" ) {
      props.push(
        labels.components,
        labels.materials,
        item.data.components.concentration ? "Concentration" : null,
        item.data.components.ritual ? "Ritual" : null
      )
    }

    else if ( item.type === "equipment" ) {
      props.push(CONFIG.SW5E.equipmentTypes[item.data.armor.type]);
      props.push(labels.armor);
    }

    else if ( item.type === "feat" ) {
      props.push(labels.featType);
    }

    // Action type
    if ( item.data.actionType ) {
      props.push(CONFIG.SW5E.itemActionTypes[item.data.actionType]);
    }

    // Action usage
    if ( (item.type !== "weapon") && item.data.activation && !isObjectEmpty(item.data.activation) ) {
      props.push(
        labels.activation,
        labels.range,
        labels.target,
        labels.duration
      )
    }
    return props.filter(p => !!p);
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(position={}) {
    position.height = this._tabs[0].active === "details" ? "auto" : this.options.height;
    return super.setPosition(position);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
	/* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    // Handle Damage Array
    let damage = Object.entries(formData).filter(e => e[0].startsWith("data.damage.parts"));
    formData["data.damage.parts"] = damage.reduce((arr, entry) => {
      let [i, j] = entry[0].split(".").slice(3);
      if ( !arr[i] ) arr[i] = [];
      arr[i][j] = entry[1];
      return arr;
    }, []);

// Handle armorproperties Array
    let armorproperties = Object.entries(formData).filter(e => e[0].startsWith("data.armorproperties.parts"));
    formData["data.armorproperties.parts"] = armorproperties.reduce((arr, entry) => {
      let [i, j] = entry[0].split(".").slice(3);
      if ( !arr[i] ) arr[i] = [];
      arr[i][j] = entry[1];
      return arr;
    }, []);
	
	// Handle weaponproperties Array
	let weaponproperties = Object.entries(formData).filter(e => e[0].startsWith("data.weaponproperties.parts"));
    formData["data.weaponproperties.parts"] = weaponproperties.reduce((arr, entry) => {
      let [i, j] = entry[0].split(".").slice(3);
      if ( !arr[i] ) arr[i] = [];
      arr[i][j] = entry[1];
      return arr;
    }, []);


    // Update the Item
    super._updateObject(event, formData);
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".damage-control").click(this._onDamageControl.bind(this));

    // Activate any Trait Selectors
    html.find('.trait-selector.class-skills').click(this._onConfigureClassSkills.bind(this));
	
	// Armor properties
	html.find(".armorproperties-control").click(this._onarmorpropertiesControl.bind(this));
	
	// Weapon properties
	html.find(".weaponproperties-control").click(this._onweaponpropertiesControl.bind(this));
	
  }

  /* -------------------------------------------- */

  /**
   * Add or remove a damage part from the damage formula
   * @param {Event} event     The original click event
   * @return {Promise}
   * @private
   */
  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new damage component
    if ( a.classList.contains("add-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const damage = this.item.data.data.damage;
      return this.item.update({"data.damage.parts": damage.parts.concat([["", ""]])});
    }

    // Remove a damage component
    if ( a.classList.contains("delete-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".damage-part");
      const damage = duplicate(this.item.data.data.damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      return this.item.update({"data.damage.parts": damage.parts});
    }
  }

  /* -------------------------------------------- */

/**
   * Add or remove a armorproperties part from the armorproperties formula
   * @param {Event} event     The original click event
   * @return {Promise}
   * @private
   */
  async _onarmorpropertiesControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new armorproperties component
    if ( a.classList.contains("add-armorproperties") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const armorproperties = this.item.data.data.armorproperties;
      return this.item.update({"data.armorproperties.parts": armorproperties.parts.concat([["", ""]])});
    }

    // Remove a armorproperties component
    if ( a.classList.contains("delete-armorproperties") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".armorproperties-part");
      const armorproperties = duplicate(this.item.data.data.armorproperties);
      armorproperties.parts.splice(Number(li.dataset.armorpropertiesPart), 1);
      return this.item.update({"data.armorproperties.parts": armorproperties.parts});
    }
  }
  
  /* -------------------------------------------- */
  
  /**
   * Add or remove a weaponproperties part from the weaponproperties formula
   * @param {Event} event     The original click event
   * @return {Promise}
   * @private
   */
  async _onweaponpropertiesControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new weaponproperties component
    if ( a.classList.contains("add-weaponproperties") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const weaponproperties = this.item.data.data.weaponproperties;
      return this.item.update({"data.weaponproperties.parts": weaponproperties.parts.concat([["", ""]])});
    }

    // Remove a weaponproperties component
    if ( a.classList.contains("delete-weaponproperties") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".weaponproperties-part");
      const weaponproperties = duplicate(this.item.data.data.weaponproperties);
      weaponproperties.parts.splice(Number(li.dataset.weaponpropertiesPart), 1);
      return this.item.update({"data.weaponproperties.parts": weaponproperties.parts});
    }
  }
  
  /* -------------------------------------------- */

  /**
   * Handle spawning the TraitSelector application which allows a checkbox of multiple trait options
   * @param {Event} event   The click event which originated the selection
   * @private
   */
  _onConfigureClassSkills(event) {
    event.preventDefault();
    const skills = this.item.data.data.skills;
    const choices = skills.choices && skills.choices.length ? skills.choices : Object.keys(CONFIG.SW5E.skills);
    const a = event.currentTarget;
    const label = a.parentElement;

    // Render the Trait Selector dialog
    new TraitSelector(this.item, {
      name: a.dataset.edit,
      title: label.innerText,
      choices: Object.entries(CONFIG.SW5E.skills).reduce((obj, e) => {
        if ( choices.includes(e[0] ) ) obj[e[0]] = e[1];
        return obj;
      }, {}),
      minimum: skills.number,
      maximum: skills.number
    }).render(true)
  }
}
