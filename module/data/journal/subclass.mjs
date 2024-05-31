/**
 * Data definition for Archetype Summary journal entry pages.
 *
 * @property {string} item               UUID of the archetype item included.
 * @property {object} description
 * @property {string} description.value  Introductory description for the archetype.
 */
export default class ArchetypeJournalPageData extends foundry.abstract.DataModel {
  /** @inheritDoc */
  static defineSchema() {
    return {
      item: new foundry.data.fields.StringField({required: true, label: "JOURNALENTRYPAGE.SW5E.Archetype.Item"}),
      description: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.HTMLField({
          label: "JOURNALENTRYPAGE.SW5E.Class.Description",
          hint: "JOURNALENTRYPAGE.SW5E.Class.DescriptionHint"
        })
      })
    };
  }
}
