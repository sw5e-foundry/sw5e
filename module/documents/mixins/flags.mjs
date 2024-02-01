/**
 * Mixin used to add system flags enforcement to types.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base => class extends Base {

  /**
   * Get the data model that represents system flags.
   * @type {typeof DataModel|null}
   * @abstract
   */
  get _systemFlagsDataModel() {
    return null;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareData() {
    super.prepareData();
    if ( ("sw5e" in this.flags) && this._systemFlagsDataModel ) {
      this.flags.sw5e = new this._systemFlagsDataModel(this._source.flags.sw5e, { parent: this });
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async setFlag(scope, key, value) {
    if ( (scope === "sw5e") && this._systemFlagsDataModel ) {
      let diff;
      const changes = foundry.utils.expandObject({ [key]: value });
      if ( this.flags.sw5e ) diff = this.flags.sw5e.updateSource(changes, { dryRun: true });
      else diff = new this._systemFlagsDataModel(changes, { parent: this }).toObject();
      return this.update({ flags: { sw5e: diff } });
    }
    return super.setFlag(scope, key, value);
  }
};
