/**
 * Data definition for Class Summary journal entry pages.
 *
 * @property {string} item                             UUID of the class item included.
 * @property {object} description
 * @property {string} description.value                Introductory description for the class.
 * @property {string} description.additionalHitPoints  Additional text displayed beneath the hit points section.
 * @property {string} description.additionalTraits     Additional text displayed beneath the traits section.
 * @property {string} description.additionalEquipment  Additional text displayed beneath the equipment section.
 * @property {string} description.archetype             Introduction to the archetype section.
 * @property {string} archetypeHeader                   Archetype header to replace the default.
 * @property {Set<string>} archetypeItems               UUIDs of all archetypes to display.
 */
export default class ClassJournalPageData extends foundry.abstract.DataModel {
  /** @inheritDoc */
  static defineSchema() {
    return {
      item: new foundry.data.fields.StringField({required: true, label: "JOURNALENTRYPAGE.SW5E.Class.Item"}),
      description: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.HTMLField({
          label: "JOURNALENTRYPAGE.SW5E.Class.Description",
          hint: "JOURNALENTRYPAGE.SW5E.Class.DescriptionHint"
        }),
        additionalHitPoints: new foundry.data.fields.HTMLField({
          label: "JOURNALENTRYPAGE.SW5E.Class.AdditionalHitPoints",
          hint: "JOURNALENTRYPAGE.SW5E.Class.AdditionalHitPointsHint"
        }),
        additionalTraits: new foundry.data.fields.HTMLField({
          label: "JOURNALENTRYPAGE.SW5E.Class.AdditionalTraits",
          hint: "JOURNALENTRYPAGE.SW5E.Class.AdditionalTraitsHint"
        }),
        additionalEquipment: new foundry.data.fields.HTMLField({
          label: "JOURNALENTRYPAGE.SW5E.Class.AdditionalEquipment",
          hint: "JOURNALENTRYPAGE.SW5E.Class.AdditionalEquipmentHint"
        }),
        archetype: new foundry.data.fields.HTMLField({
          label: "JOURNALENTRYPAGE.SW5E.Class.ArchetypeDescription",
          hint: "JOURNALENTRYPAGE.SW5E.Class.ArchetypeDescriptionHint"
        })
      }),
      archetypeHeader: new foundry.data.fields.StringField({
        label: "JOURNALENTRYPAGE.SW5E.Class.ArchetypeHeader"
      }),
      archetypeItems: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
        label: "JOURNALENTRYPAGE.SW5E.Class.ArchetypeItems"
      })
    };
  }
}
