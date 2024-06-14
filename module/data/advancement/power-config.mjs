import { FormulaField } from "../fields.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

export default class PowerConfigurationData extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      ability: new SetField(new StringField()),
      preparation: new StringField({ label: "SW5E.PowerPreparationMode" }),
      uses: new SchemaField({
        max: new FormulaField({ deterministic: true, label: "SW5E.UsesMax" }),
        per: new StringField({ label: "SW5E.UsesPeriod" })
      }, { label: "SW5E.LimitedUses" })
    };
  }

  /* -------------------------------------------- */
  /*  Data Migrations                             */
  /* -------------------------------------------- */

  /** @inheritDoc */
  static migrateData(source) {
    if (foundry.utils.getType(source.ability) === "string") {
      source.ability = source.ability ? [source.ability] : [];
    }
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Changes that this power configuration indicates should be performed on powers.
   * @param {object} data  Data for the advancement process.
   * @returns {object}
   */
  getPowerChanges(data = {}) {
    const updates = {};
    if (this.ability.size) {
      updates["system.ability"] = this.ability.has(data.ability) ? data.ability : this.ability.first();
    }
    if (this.preparation) updates["system.preparation.mode"] = this.preparation;
    if (this.uses.max && this.uses.per) {
      updates["system.uses.max"] = this.uses.max;
      updates["system.uses.per"] = this.uses.per;
      if (Number.isNumeric(this.uses.max)) updates["system.uses.value"] = parseInt(this.uses.max);
      else {
        try {
          const rollData = this.parent.parent.actor.getRollData({ deterministic: true });
          const formula = Roll.replaceFormulaData(this.uses.max, rollData, { missing: 0 });
          updates["system.uses.value"] = Roll.safeEval(formula);
        } catch (e) { }
      }
    }
    return updates;
  }
}
