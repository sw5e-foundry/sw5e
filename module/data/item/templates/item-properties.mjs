import SystemDataModel from "../../abstract.mjs";
import { filteredKeys } from "../../../utils.mjs";

const { StringField, SetField, ObjectField } = foundry.data.fields;

/**
 * Data model template with item properties.
 *
 * @property {Set<string>} properties     Item's properties.
 * @property {object} properties          Item's property values.
 * @mixin
 */
export default class ItemPropertiesTemplate extends SystemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      properties: new SetField( new StringField(), { label: "SW5E.ItemProperties" } ),
      _propertyValues: new ObjectField()
    };
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData( source ) {
    super._migrateData( source );
    ItemPropertiesTemplate.#migratePropertiesData( source );
  }

  /* -------------------------------------------- */

  /**
   * Migrate the properties object into a set, and store values in _propertyValues.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migratePropertiesData( source ) {
    if ( foundry.utils.getType( source.properties ) !== "Object" ) return;
    source._propertyValues = Object.fromEntries(Object.entries(source.properties).filter( e => e[1]));
    source.properties = filteredKeys( source.properties );
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  getProperty(key, default_value=false) {
    return this.properties.has(key) ? (this._propertyValues[key] ?? true) : default_value;
  }

  setProperty(key, value) {
    this.properties.add(key);
    this.parent.update({ "system.properties": Array.from(this.properties) }, { resursive: false });
    this.parent.update({ ["system._propertyValues." + key]: value });
  }

  deleteProperty(key) {
    this.properties.delete(key);
    this.parent.update({ "system.properties": Array.from(this.properties) }, { resursive: false });
    this.parent.update({ ["system._propertyValues." + key]: null });
  }
}
