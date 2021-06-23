/**
 * An application class which provides advanced configuration for special character flags which modify an Actor
 * @implements {DocumentSheet}
 */
export default class ActorSheetFlags extends DocumentSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "actor-flags",
	    classes: ["sw5e"],
      template: "systems/sw5e/templates/apps/actor-flags.html",
      width: 500,
      closeOnSubmit: true
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize('SW5E.FlagsTitle')}: ${this.object.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = {};
    data.actor = this.object;
    data.classes = this._getClasses();
    data.flags = this._getFlags();
    data.bonuses = this._getBonuses();
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Prepare an object of sorted classes.
   * @return {object}
   * @private
   */
  _getClasses() {
    const classes = this.object.items.filter(i => i.type === "class");
    return classes.sort((a, b) => a.name.localeCompare(b.name)).reduce((obj, i) => {
      obj[i.id] = i.name;
      return obj;
    }, {});
  }

  /* -------------------------------------------- */

  /**
   * Prepare an object of flags data which groups flags by section
   * Add some additional data for rendering
   * @return {object}
   * @private
   */
  _getFlags() {
    const flags = {};
    const baseData = this.document.toJSON();
    for ( let [k, v] of Object.entries(CONFIG.SW5E.characterFlags) ) {
      if ( !flags.hasOwnProperty(v.section) ) flags[v.section] = {};
      let flag = foundry.utils.deepClone(v);
      flag.type = v.type.name;
      flag.isCheckbox = v.type === Boolean;
      flag.isSelect = v.hasOwnProperty('choices');
      flag.value = getProperty(baseData.flags, `sw5e.${k}`);
      flags[v.section][`flags.sw5e.${k}`] = flag;
    }
    return flags;
  }

  /* -------------------------------------------- */

  /**
   * Get the bonuses fields and their localization strings
   * @return {Array<object>}
   * @private
   */
  _getBonuses() {
    const bonuses = [
      {name: "data.bonuses.mwak.attack", label: "SW5E.BonusMWAttack"},
      {name: "data.bonuses.mwak.damage", label: "SW5E.BonusMWDamage"},
      {name: "data.bonuses.rwak.attack", label: "SW5E.BonusRWAttack"},
      {name: "data.bonuses.rwak.damage", label: "SW5E.BonusRWDamage"},
      {name: "data.bonuses.mpak.attack", label: "SW5E.BonusMPAttack"},
      {name: "data.bonuses.mpak.damage", label: "SW5E.BonusMPDamage"},
      {name: "data.bonuses.rpak.attack", label: "SW5E.BonusRPAttack"},
      {name: "data.bonuses.rpak.damage", label: "SW5E.BonusRPDamage"},
      {name: "data.bonuses.abilities.check", label: "SW5E.BonusAbilityCheck"},
      {name: "data.bonuses.abilities.save", label: "SW5E.BonusAbilitySave"},
      {name: "data.bonuses.abilities.skill", label: "SW5E.BonusAbilitySkill"},
      {name: "data.bonuses.power.dc", label: "SW5E.BonusPowerDC"},
      {name: "data.bonuses.power.forceLightDC", label: "SW5E.BonusForceLightPowerDC"},
      {name: "data.bonuses.power.forceDarkDC", label: "SW5E.BonusForceDarkPowerDC"},
      {name: "data.bonuses.power.forceUnivDC", label: "SW5E.BonusForceUnivPowerDC"},
      {name: "data.bonuses.power.techDC", label: "SW5E.BonusTechPowerDC"}
    ];
    for ( let b of bonuses ) {
      b.value = getProperty(this.object._data, b.name) || "";
    }
    return bonuses;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    const actor = this.object;
    let updateData = expandObject(formData);

    // Unset any flags which are "false"
    let unset = false;
    const flags = updateData.flags.sw5e;
    //clone flags to dnd5e for module compatability
    updateData.flags.dnd5e = updateData.flags.sw5e
    for ( let [k, v] of Object.entries(flags) ) {
      if ( [undefined, null, "", false, 0].includes(v) ) {
        delete flags[k];
        if ( hasProperty(actor._data.flags, `sw5e.${k}`) ) {
          unset = true;
          flags[`-=${k}`] = null;
        }
      }
    }

    // Clear any bonuses which are whitespace only
    for ( let b of Object.values(updateData.data.bonuses ) ) {
      for ( let [k, v] of Object.entries(b) ) {
        b[k] = v.trim();
      }
    }

    // Diff the data against any applied overrides and apply
    await actor.update(updateData, {diff: false});
  }
}
