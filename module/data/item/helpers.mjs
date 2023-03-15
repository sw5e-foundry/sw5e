/**
 * Produce the schema field for an item's properties attribute.
 * @param {object} config             Object describing the internal properties of the field.
 * @param {object} [schemaOptions]    Options passed to the outer schema.
 * @returns {SchemaField}
 */
export default function makeItemProperties( config, schemaOptions = {} ) {
  const schemaObj = { ...schemaOptions.extraFields };
  delete schemaOptions.extraFields;
  for (const [key, prop] of Object.entries(config)) {
    if (prop.type === "Number") schemaObj[key] = new foundry.data.fields.NumberField({
      required: false,
      nullable: true,
      integer: true,
      min: prop.min ?? 0,
      // Initial: 0,
      label: prop.full,
      hint: prop.desc
    });
    else if (prop.type === "Boolean") schemaObj[key] = new foundry.data.fields.BooleanField({
      required: false,
      nullable: true,
      label: prop.full,
      hint: prop.desc
    });
    else console.warn("Invalid item property type", key, prop);
  }
  return new foundry.data.fields.SchemaField(schemaObj, schemaOptions);
}
