import { FormulaField, LocalDocumentField } from "../fields.mjs";
import CreatureTypeField from "../shared/creature-type-field.mjs";
import AttributesFields from "./templates/attributes.mjs";
import CreatureTemplate from "./templates/creature.mjs";
import DetailsFields from "./templates/details.mjs";
import TraitsFields from "./templates/traits.mjs";

/**
 * System data definition for Characters.
 *
 * @property {object} attributes
 * @property {object} attributes.ac
 * @property {number} attributes.ac.flat                  Flat value used for flat or natural armor calculation.
 * @property {string} attributes.ac.calc                  Name of one of the built-in formulas to use.
 * @property {string} attributes.ac.formula               Custom formula to use.
 * @property {object} attributes.hp
 * @property {number} attributes.hp.value                 Current hit points.
 * @property {number} attributes.hp.max                   Override for maximum HP.
 * @property {number} attributes.hp.temp                  Temporary HP applied on top of value.
 * @property {number} attributes.hp.tempmax               Temporary change to the maximum HP.
 * @property {object} attributes.hp.bonuses
 * @property {string} attributes.hp.bonuses.level         Bonus formula applied for each class level.
 * @property {string} attributes.hp.bonuses.overall       Bonus formula applied to total HP.
 * @property {object} attributes.death
 * @property {number} attributes.death.success            Number of successful death saves.
 * @property {number} attributes.death.failure            Number of failed death saves.
 * @property {number} attributes.exhaustion               Number of levels of exhaustion.
 * @property {number} attributes.inspiration              Does this character have inspiration?
 * @property {object} details
 * @property {string} details.description                 Character's description.
 * @property {Item5e|string} details.background           Character's background item or name.
 * @property {string} details.originalClass               ID of first class taken by character.
 * @property {XPData} details.xp                          Experience points gained.
 * @property {number} details.xp.value                    Total experience points earned.
 * @property {XPData} details.prestige                    Prestige points gained (starship deployment).
 * @property {number} details.prestige.value              Total prestige points earned (starship deployment).
 * @property {string} details.appearance                  Description of character's appearance.
 * @property {string} details.trait                       Character's personality traits.
 * @property {string} details.ideal                       Character's ideals.
 * @property {string} details.bond                        Character's bonds.
 * @property {string} details.flaw                        Character's flaws.
 * @property {object} details.notes
 * @property {string} details.notes.value                 Player notes.
 * @property {object} traits
 * @property {SimpleTraitData} traits.weaponProf          Character's weapon proficiencies.
 * @property {SimpleTraitData} traits.armorProf           Character's armor proficiencies.
 * @property {object} resources
 * @property {CharacterResourceData} resources.primary    Resource number one.
 * @property {CharacterResourceData} resources.secondary  Resource number two.
 * @property {CharacterResourceData} resources.tertiary   Resource number three.
 */
export default class CharacterData extends CreatureTemplate {
  /** @inheritdoc */
  static _systemType = "character";

  /* -------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      attributes: new foundry.data.fields.SchemaField(
        {
          ...AttributesFields.common,
          ...AttributesFields.creature,
          ac: new foundry.data.fields.SchemaField(
            {
              flat: new foundry.data.fields.NumberField({ integer: true, min: 0, label: "SW5E.ArmorClassFlat" }),
              calc: new foundry.data.fields.StringField({ initial: "default", label: "SW5E.ArmorClassCalculation" }),
              formula: new FormulaField({ deterministic: true, label: "SW5E.ArmorClassFormula" })
            },
            { label: "SW5E.ArmorClass" }
          ),
          hp: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.HitPointsCurrent"
              }),
              max: new foundry.data.fields.NumberField({
                nullable: true,
                integer: true,
                min: 0,
                initial: null,
                label: "SW5E.HitPointsOverride"
              }),
              temp: new foundry.data.fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
                label: "SW5E.HitPointsTemp"
              }),
              tempmax: new foundry.data.fields.NumberField({
                integer: true,
                initial: 0,
                label: "SW5E.HitPointsTempMax"
              }),
              bonuses: new foundry.data.fields.SchemaField({
                level: new FormulaField({ deterministic: true, label: "SW5E.HitPointsBonusLevel" }),
                overall: new FormulaField({ deterministic: true, label: "SW5E.HitPointsBonusOverall" })
              })
            },
            { label: "SW5E.HitPoints" }
          ),
          death: new foundry.data.fields.SchemaField(
            {
              success: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.DeathSaveSuccesses"
              }),
              failure: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.DeathSaveFailures"
              })
            },
            { label: "SW5E.DeathSave" }
          ),
          exhaustion: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.Exhaustion"
          }),
          inspiration: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.Inspiration" })
        },
        { label: "SW5E.Attributes" }
      ),
      details: new foundry.data.fields.SchemaField(
        {
          ...DetailsFields.common,
          ...DetailsFields.creature,
          description: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.HTMLField({ label: "SW5E.Description" }),
              public: new foundry.data.fields.HTMLField({ label: "SW5E.DescriptionPublic" })
            },
            { label: "SW5E.Description" }
          ),
          background: new LocalDocumentField(foundry.documents.BaseItem, {
            required: true, fallback: true, label: "SW5E.Background"
          }),
          originalClass: new foundry.data.fields.StringField({ required: true, label: "SW5E.ClassOriginal" }),
          xp: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.ExperiencePointsCurrent"
              })
            },
            { label: "SW5E.ExperiencePoints" }
          ),
          prestige: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.PrestigePointsCurrent"
              })
            },
            { label: "SW5E.PrestigePoints" }
          ),
          appearance: new foundry.data.fields.StringField({ required: true, label: "SW5E.Appearance" }),
          trait: new foundry.data.fields.StringField({ required: true, label: "SW5E.PersonalityTraits" }),
          ideal: new foundry.data.fields.StringField({ required: true, label: "SW5E.Ideals" }),
          bond: new foundry.data.fields.StringField({ required: true, label: "SW5E.Bonds" }),
          flaw: new foundry.data.fields.StringField({ required: true, label: "SW5E.Flaws" }),
          notes: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.HTMLField({ label: "SW5E.Notes" }),
              public: new foundry.data.fields.HTMLField({ label: "SW5E.NotesPublic" })
            },
            { label: "SW5E.Notes" }
          )
        },
        { label: "SW5E.Details" }
      ),
      traits: new foundry.data.fields.SchemaField(
        {
          ...TraitsFields.common,
          ...TraitsFields.creature,
          weaponProf: TraitsFields.makeSimpleTrait({ label: "SW5E.TraitWeaponProf" }),
          armorProf: TraitsFields.makeSimpleTrait({ label: "SW5E.TraitArmorProf" })
        },
        { label: "SW5E.Traits" }
      ),
      resources: new foundry.data.fields.SchemaField(
        {
          primary: makeResourceField({ label: "SW5E.ResourcePrimary" }),
          secondary: makeResourceField({ label: "SW5E.ResourceSecondary" }),
          tertiary: makeResourceField({ label: "SW5E.ResourceTertiary" })
        },
        { label: "SW5E.Resources" }
      )
    });
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    AttributesFields._migrateInitiative(source.attributes);
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * Prepare movement & senses values derived from species item.
   */
  prepareEmbeddedData() {
    const speciesData = this.details.species?.system;
    if ( !speciesData ) {
      this.details.type = new CreatureTypeField({ swarm: false }).initialize({ value: "humanoid" }, this);
      return;
    }

    for ( const key of Object.keys(CONFIG.SW5E.movementTypes) ) {
      if ( speciesData.movement[key] ) this.attributes.movement[key] ??= speciesData.movement[key];
    }
    if ( speciesData.movement.hover ) this.attributes.movement.hover = true;
    this.attributes.movement.units ??= speciesData.movement.units;

    for ( const key of Object.keys(CONFIG.SW5E.senses) ) {
      if ( speciesData.senses[key] ) this.attributes.senses[key] ??= speciesData.senses[key];
    }
    this.attributes.senses.special = [this.attributes.senses.special, speciesData.senses.special].filterJoin(";");
    this.attributes.senses.units ??= speciesData.senses.units;

    this.details.type = speciesData.type;
  }
}

/* -------------------------------------------- */

/**
 * Data structure for character's resources.
 *
 * @typedef {object} ResourceData
 * @property {number} value  Available uses of this resource.
 * @property {number} max    Maximum allowed uses of this resource.
 * @property {boolean} sr    Does this resource recover on a short rest?
 * @property {boolean} lr    Does this resource recover on a long rest?
 * @property {string} label  Displayed name.
 */

/**
 * Produce the schema field for a simple trait.
 * @param {object} schemaOptions  Options passed to the outer schema.
 * @returns {ResourceData}
 */
function makeResourceField(schemaOptions = {}) {
  return new foundry.data.fields.SchemaField(
    {
      value: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        initial: 0,
        labels: "SW5E.ResourceValue"
      }),
      max: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        initial: 0,
        labels: "SW5E.ResourceMax"
      }),
      sr: new foundry.data.fields.BooleanField({ required: true, labels: "SW5E.ShortRestRecovery" }),
      lr: new foundry.data.fields.BooleanField({ required: true, labels: "SW5E.LongRestRecovery" }),
      label: new foundry.data.fields.StringField({ required: true, labels: "SW5E.ResourceLabel" })
    },
    schemaOptions
  );
}
