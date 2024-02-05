const { BooleanField, ColorField, FilePathField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Token Ring flag data
 * @typedef {object} TokenRingFlagData
 * @property {boolean} enabled                    Should the dynamic token be used?
 * @property {object} [colors]
 * @property {string|number} [colors.ring]        The color of the ring.
 * @property {string|number} [colors.background]  The color of the background.
 * @property {number} effects                     The effect value (composited with bitwise operations). Only supports
 *                                                up to 23 bits of data.
 * @property {number} [scaleCorrection]           Size scale adjustment to apply to the ring, but not the subject.
 * @property {object} [textures]
 * @property {string} [textures.subject]          Explicit image to use for the ring's subject.
 */

/**
 * A custom model to validate system flags on Token Documents.
 *
 * @property {TokenRingFlagData} tokenRing
 */
export default class TokenSystemFlags extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      tokenRing: new SchemaField({
        enabled: new BooleanField({label: "SW5E.TokenRings.Enabled"}),
        colors: new SchemaField({
          ring: new ColorField({required: false, label: "SW5E.TokenRings.RingColor"}),
          background: new ColorField({required: false, label: "SW5E.TokenRings.RingColor"})
        }, {required: false, initial: undefined}),
        effects: new NumberField({
          initial: 1, min: 0, max: 8388607, integer: true, label: "SW5E.TokenRings.Effects.Label"
        }),
        scaleCorrection: new NumberField({
          required: false, initial: 1, min: 0, label: "SW5E.TokenRings.ScaleCorrection"
        }),
        textures: new SchemaField({
          subject: new FilePathField({
            required: false, categories: ["IMAGE"], label: "SW5E.TokenRings.Subject.Label",
            hint: "SW5E.TokenRings.Subject.Hint"
          })
        }, {required: false, initial: undefined})
      }, {required: false, initial: undefined, label: "SW5E.TokenRings.Title"})
    };
  }
}
