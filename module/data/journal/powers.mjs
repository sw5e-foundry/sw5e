import { IdentifierField } from "../fields.mjs";
import SourceField from "../shared/source-field.mjs";

const { ArrayField, DocumentIdField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data needed to display powers that aren't able to be linked (outside SRD & current module).
 *
 * @typedef {object} UnlinkedPowerConfiguration
 * @property {string} _id            Unique ID for this entry.
 * @property {string} name           Name of the power.
 * @property {object} system
 * @property {number} system.level   Power level.
 * @property {string} system.school  Power school.
 * @property {object} source
 * @property {string} source.book    Book/publication where the power originated.
 * @property {string} source.page    Page or section where the power can be found.
 * @property {string} source.custom  Fully custom source label.
 * @property {string} source.uuid    UUID of the power, if available in another module.
 */

/**
 * Data model for power list data.
 *
 * @property {string} type               Type of power list (e.g. class, archetype, species, etc.).
 * @property {string} identifier         Common identifier that matches the associated type (e.g. bard, cleric).
 * @property {string} grouping           Default grouping mode.
 * @property {object} description
 * @property {string} description.value  Description to display before power list.
 * @property {Set<string>} powers        UUIDs of powers to display.
 * @property {UnlinkedPowerConfiguration[]} unlinkedPowers  Unavailable powers that are entered manually.
 */
export default class PowerListJournalPageData extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      type: new StringField({
        initial: "class", label: "JOURNALENTRYPAGE.SW5E.PowerList.Type.Label"
      }),
      identifier: new IdentifierField({label: "SW5E.Identifier"}),
      grouping: new StringField({
        initial: "level", choices: this.GROUPING_MODES,
        label: "JOURNALENTRYPAGE.SW5E.PowerList.Grouping.Label",
        hint: "JOURNALENTRYPAGE.SW5E.PowerList.Grouping.Hint"
      }),
      description: new SchemaField({
        value: new HTMLField({label: "SW5E.Description"})
      }),
      powers: new SetField(new StringField(), {label: "SW5E.ItemTypePowerPl"}),
      unlinkedPowers: new ArrayField(new SchemaField({
        _id: new DocumentIdField({initial: () => foundry.utils.randomID()}),
        name: new StringField({required: true, label: "Name"}),
        system: new SchemaField({
          level: new NumberField({min: 0, integer: true, label: "SW5E.Level"}),
          school: new StringField({label: "SW5E.School"})
        }),
        source: new SourceField({license: false, uuid: new StringField()})
      }), {label: "JOURNALENTRYPAGE.SW5E.PowerList.UnlinkedPowers.Label"})
    };
  }

  /* -------------------------------------------- */

  /**
   * Different ways in which powers can be grouped on the sheet.
   * @enum {string}
   */
  static GROUPING_MODES = {
    none: "JOURNALENTRYPAGE.SW5E.PowerList.Grouping.None",
    alphabetical: "JOURNALENTRYPAGE.SW5E.PowerList.Grouping.Alphabetical",
    level: "JOURNALENTRYPAGE.SW5E.PowerList.Grouping.Level",
    school: "JOURNALENTRYPAGE.SW5E.PowerList.Grouping.School"
  };
}
