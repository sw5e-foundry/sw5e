/**
 * Produce the schema field for an item's properties attribute.
 * @param {object} config             Object describing the internal properties of the field.
 * @param {object} [schemaOptions]    Options passed to the outer schema.
 * @returns {SchemaField}
 */
export function makeItemProperties( config, schemaOptions = {} ) {
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

/**
 * Apply migrations to the item's properties.
 * @param {object} source  The candidate source data from which the model will be constructed.
 * @param {object} config  Object describing the internal properties of the field.
 */
export function migrateItemProperties( source, config ) {
  if (!source) return;
  for (const [key, prop] of Object.entries(config)) {
    if (typeof source[key] !== prop.type.toLowerCase()) source[key] = null;
    else if (prop.type === "Number" && Number.isNaN(source[key])) source[key] = null;
    else if (prop.type === "Number") source[key] = Math.max(source[key], prop.min || -Infinity);
  }
  if (source.indeterminate) {
    for (const key of Object.keys(source)) if (!(key in config) && (key !== "indeterminate")) delete source[key];
    for (const key of Object.keys(source.indeterminate)) if (!(key in config)) delete source.indeterminate[key];
  } else {
    for (const key of Object.keys(source)) if (!(key in config)) delete source[key];
  }
}
