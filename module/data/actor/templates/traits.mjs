import { FormulaField, MappingField } from "../../fields.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Shared contents of the traits schema between various actor types.
 */
export default class TraitsField {
  /**
   * Data structure for a standard actor trait.
   *
   * @typedef {object} SimpleTraitData
   * @property {Set<string>} value  Keys for currently selected traits.
   * @property {string} custom      Semicolon-separated list of custom traits.
   */

  /**
   * Data structure for a damage actor trait.
   *
   * @typedef {object} DamageTraitData
   * @property {Set<string>} value     Keys for currently selected traits.
   * @property {Set<string>} bypasses  Keys for physical weapon properties that cause resistances to be bypassed.
   * @property {string} custom         Semicolon-separated list of custom traits.
   */

  /**
   * Data structure for a damage actor trait.
   *
   * @typedef {object} DamageModificationData
   * @property {{[key: string]: string}} amount  Damage boost or reduction by damage type.
   * @property {Set<string>} bypasses            Keys for physical properties that cause modification to be bypassed.
   */

  /* -------------------------------------------- */

  /**
   * Fields shared between characters, NPCs, and vehicles.
   *
   * @type {object}
   * @property {string} size                Actor's size.
   * @property {DamageTraitData} di         Damage immunities.
   * @property {DamageTraitData} dr         Damage resistances.
   * @property {DamageTraitData} dv         Damage vulnerabilities.
   * @property {DamageModificationData} dm  Damage modification.
   * @property {SimpleTraitData} ci         Condition immunities.
   */
  static get common() {
    return {
      size: new StringField({ required: true, initial: "med", label: "SW5E.Size" }),
      di: this.makeDamageTrait({ label: "SW5E.DamImm" }),
      dr: this.makeDamageTrait({ label: "SW5E.DamRes" }),
      dv: this.makeDamageTrait({ label: "SW5E.DamVuln" }),
      dm: new SchemaField({
        amount: new MappingField(new FormulaField({deterministic: true}), {label: "SW5E.DamMod"}),
        bypasses: new SetField(new StringField(), {
          label: "SW5E.DamagePhysicalBypass", hint: "SW5E.DamagePhysicalBypassHint"
        })
      }),
      ci: this.makeSimpleTrait({ label: "SW5E.ConImm" })
    };
  }

  /* -------------------------------------------- */

  /**
   * Fields shared between characters and NPCs.
   *
   * @type {object}
   * @property {SimpleTraitData} languages  Languages known by this creature.
   */
  static get creature() {
    return {
      languages: this.makeSimpleTrait({ label: "SW5E.Languages" })
    };
  }

  /* -------------------------------------------- */

  /**
   * Produce the schema field for a simple trait.
   * @param {object} [schemaOptions={}]          Options passed to the outer schema.
   * @param {object} [options={}]
   * @param {string[]} [options.initial={}]      The initial value for the value set.
   * @param {object} [options.extraFields={}]    Additional fields added to schema.
   * @returns {SchemaField}
   */
  static makeSimpleTrait(schemaOptions = {}, { initial = [], extraFields = {} } = {}) {
    return new SchemaField(
      {
        ...extraFields,
        value: new SetField(new StringField(), {
          label: "SW5E.TraitsChosen",
          initial
        }),
        custom: new StringField({ required: true, label: "SW5E.Special" })
      },
      schemaOptions
    );
  }

  /* -------------------------------------------- */

  /**
   * Produce the schema field for a damage trait.
   * @param {object} [schemaOptions={}]          Options passed to the outer schema.
   * @param {object} [options={}]
   * @param {string[]} [options.initial={}]      The initial value for the value set.
   * @param {object} [options.extraFields={}]    Additional fields added to schema.
   * @returns {SchemaField}
   */
  static makeDamageTrait(schemaOptions = {}, { initial = [], initialBypasses = [], extraFields = {} } = {}) {
    return this.makeSimpleTrait(schemaOptions, {
      initial,
      extraFields: {
        ...extraFields,
        bypasses: new SetField(new StringField(), {
          label: "SW5E.DamagePhysicalBypass",
          hint: "SW5E.DamagePhysicalBypassHint",
          initial: initialBypasses
        })
      }
    });
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * Modify resistances and immunities for a specific condition.
   * @this {CharacterData|NPCData}
   */
  static prepareResistImmune() {
    if ( this.parent.hasConditionEffect("petrification") ) {
      this.traits.dr.custom = game.i18n.localize("SW5E.DamageAll");
      Object.keys(CONFIG.SW5E.damageTypes).forEach(type => this.traits.dr.value.add(type));
      this.traits.dr.bypasses.clear();
      this.traits.di.value.add("poison");
      this.traits.ci.value.add("poisoned");
      this.traits.ci.value.add("diseased");
    }
  }
}
