import Proficiency from "../documents/actor/proficiency.mjs";

/**
 * Data Model variant with some extra methods to support template mix-ins.
 *
 * **Note**: This uses some advanced Javascript techniques that are not necessary for most data models.
 * Please refer to the [advancement data models]{@link BaseAdvancement} for an example of a more typical usage.
 *
 * In template.json, each Actor or Item type can incorporate several templates which are chunks of data that are
 * common across all the types that use them. One way to represent them in the schema for a given Document type is to
 * duplicate schema definitions for the templates and write them directly into the Data Model for the Document type.
 * This works fine for small templates or systems that do not need many Document types but for more complex systems
 * this boilerplate can become prohibitive.
 *
 * Here we have opted to instead create a separate Data Model for each template available. These define their own
 * schemas which are then mixed-in to the final schema for the Document type's Data Model. A Document type Data Model
 * can define its own schema unique to it, and then add templates in direct correspondence to those in template.json
 * via SystemDataModel.mixin.
 */
export default class SystemDataModel extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static _enableV10Validation = true;

  /**
   * System type that this system data model represents (e.g. "character", "npc", "vehicle").
   * @type {string}
   */
  static _systemType;

  /* -------------------------------------------- */

  /**
   * Base templates used for construction.
   * @type {*[]}
   * @private
   */
  static _schemaTemplates = [];

  /* -------------------------------------------- */

  /**
   * The field names of the base templates used for construction.
   * @type {Set<string>}
   * @private
   */
  static get _schemaTemplateFields() {
    const fieldNames = Object.freeze(new Set(this._schemaTemplates.map(t => t.schema.keys()).flat()));
    Object.defineProperty(this, "_schemaTemplateFields", {
      value: fieldNames,
      writable: false,
      configurable: false
    });
    return fieldNames;
  }

  /* -------------------------------------------- */

  /**
   * A list of properties that should not be mixed-in to the final type.
   * @type {Set<string>}
   * @private
   */
  static _immiscible = new Set(["length", "mixed", "name", "prototype", "cleanData", "_cleanData",
    "_initializationOrder", "validateJoint", "_validateJoint", "migrateData", "_migrateData",
    "shimData", "_shimData", "defineSchema"]);

  /* -------------------------------------------- */

  /**
   * @typedef {object} SystemDataModelMetadata
   * @property {typeof DataModel} [systemFlagsModel]  Model that represents flags data within the sw5e namespace.
   */

  /**
   * Metadata that describes this DataModel.
   * @type {SystemDataModelMetadata}
   */
  static metadata = Object.freeze({
    systemFlagsModel: null
  });

  get metadata() {
    return this.constructor.metadata;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = {};
    for ( const template of this._schemaTemplates ) {
      if ( !template.defineSchema ) {
        throw new Error(`Invalid sw5e template mixin ${template} defined on class ${this.constructor}`);
      }
      this.mergeSchema(schema, template.defineSchema());
    }
    return schema;
  }

  /* -------------------------------------------- */

  /**
   * Merge two schema definitions together as well as possible.
   * @param {DataSchema} a  First schema that forms the basis for the merge. *Will be mutated.*
   * @param {DataSchema} b  Second schema that will be merged in, overwriting any non-mergeable properties.
   * @returns {DataSchema}  Fully merged schema.
   */
  static mergeSchema(a, b) {
    Object.assign(a, b);
    return a;
  }


  /* -------------------------------------------- */
  /*  Data Cleaning                               */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static cleanData(source, options) {
    this._cleanData(source, options);
    return super.cleanData(source, options);
  }

  /* -------------------------------------------- */

  /**
   * Performs cleaning without calling DataModel.cleanData.
   * @param {object} [source]         The source data
   * @param {object} [options={}]     Additional options (see DataModel.cleanData)
   * @protected
   */
  static _cleanData(source, options) {
    for ( const template of this._schemaTemplates ) {
      template._cleanData(source, options);
    }
  }

  /* -------------------------------------------- */
  /*  Data Initialization                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static *_initializationOrder() {
    for ( const template of this._schemaTemplates ) {
      for ( const entry of template._initializationOrder() ) {
        entry[1] = this.schema.get(entry[0]);
        yield entry;
      }
    }
    for ( const entry of this.schema.entries() ) {
      if ( this._schemaTemplateFields.has(entry[0]) ) continue;
      yield entry;
    }
  }

  /* -------------------------------------------- */
  /*  Data Validation                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  validate(options={}) {
    if ( this.constructor._enableV10Validation === false ) return true;
    return super.validate(options);
  }

  /* -------------------------------------------- */
  /*  Socket Event Handlers                       */
  /* -------------------------------------------- */

  /**
   * Pre-creation logic for this system data.
   * @param {object} data               The initial data object provided to the document creation request.
   * @param {object} options            Additional options which modify the creation request.
   * @param {User} user                 The User requesting the document creation.
   * @returns {Promise<boolean|void>}   A return value of false indicates the creation operation should be cancelled.
   * @see {Document#_preCreate}
   * @protected
   */
  async _preCreate(data, options, user) {
    const actor = this.parent.actor;
    if ( (actor?.type !== "character") || !this.metadata?.singleton ) return;
    if ( actor.itemTypes[data.type]?.length ) {
      ui.notifications.error(game.i18n.format("SW5E.ActorWarningSingleton", {
        itemType: game.i18n.localize(CONFIG.Item.typeLabels[data.type]),
        actorType: game.i18n.localize(CONFIG.Actor.typeLabels[actor.type])
      }));
      return false;
    }
  }

  /* -------------------------------------------- */
  /*  Data Validation                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static validateJoint(data) {
    this._validateJoint(data);
    return super.validateJoint(data);
  }

  /* -------------------------------------------- */

  /**
   * Performs joint validation without calling DataModel.validateJoint.
   * @param {object} data     The source data
   * @throws                  An error if a validation failure is detected
   * @protected
   */
  static _validateJoint(data) {
    for ( const template of this._schemaTemplates ) {
      template._validateJoint(data);
    }
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    this._migrateData(source);
    return super.migrateData(source);
  }

  /* -------------------------------------------- */

  /**
   * Performs migration without calling DataModel.migrateData.
   * @param {object} source     The source data
   * @protected
   */
  static _migrateData(source) {
    for ( const template of this._schemaTemplates ) {
      template._migrateData(source);
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static shimData(data, options) {
    this._shimData(data, options);
    return super.shimData(data, options);
  }

  /* -------------------------------------------- */

  /**
   * Performs shimming without calling DataModel.shimData.
   * @param {object} data         The source data
   * @param {object} [options]    Additional options (see DataModel.shimData)
   * @protected
   */
  static _shimData(data, options) {
    for ( const template of this._schemaTemplates ) {
      template._shimData(data, options);
    }
  }

  /* -------------------------------------------- */
  /*  Mixins                                      */
  /* -------------------------------------------- */

  /**
   * Mix multiple templates with the base type.
   * @param {...*} templates            Template classes to mix.
   * @returns {typeof SystemDataModel}  Final prepared type.
   */
  static mixin(...templates) {
    for ( const template of templates ) {
      if ( !(template.prototype instanceof SystemDataModel) ) {
        throw new Error(`${template.name} is not a archetype of SystemDataModel`);
      }
    }

    const Base = class extends this {};
    Object.defineProperty(Base, "_schemaTemplates", {
      value: Object.seal([...this._schemaTemplates, ...templates]),
      writable: false,
      configurable: false
    });

    for ( const template of templates ) {
      // Take all static methods and fields from template and mix in to base class
      for ( const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(template)) ) {
        if ( this._immiscible.has(key) ) continue;
        Object.defineProperty(Base, key, descriptor);
      }

      // Take all instance methods and fields from template and mix in to base class
      for ( const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(template.prototype)) ) {
        if ( ["constructor"].includes(key) ) continue;
        Object.defineProperty(Base.prototype, key, descriptor);
      }
    }

    return Base;
  }
}

/* -------------------------------------------- */

/**
 * Variant of the SystemDataModel with some extra actor-specific handling.
 */
export class ActorDataModel extends SystemDataModel {

  /**
   * @typedef {SystemDataModelMetadata} ActorDataModelMetadata
   * @property {boolean} supportsAdvancement  Can advancement be performed for this actor type?
   */

  /** @type {ActorDataModelMetadata} */
  static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
    supportsAdvancement: false
  }, {inplace: false}));

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Other actors that are available for currency transfers from this actor.
   * @type {Actor5e[]}
   */
  get transferDestinations() {
    const primaryParty = game.settings.get("sw5e", "primaryParty")?.actor;
    if ( !primaryParty?.system.members.ids.has(this.parent.id) ) return [];
    const destinations = primaryParty.system.members.map(m => m.actor).filter(a => a.isOwner && a !== this.parent);
    if ( primaryParty.isOwner ) destinations.unshift(primaryParty);
    return destinations;
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
   * @param {object} [options]
   * @param {boolean} [options.deterministic] Whether to force deterministic values for data properties that could be
   *                                          either a die term or a flat term.
   * @returns {object}
   */
  getRollData({ deterministic=false }={}) {
    const data = { ...this };
    data.prof = new Proficiency(this.attributes?.prof ?? 0, 1);
    if ( deterministic ) data.prof = data.prof.flat;
    return data;
  }
}

/* -------------------------------------------- */

/**
 * Variant of the SystemDataModel with support for rich item tooltips.
 */
export class ItemDataModel extends SystemDataModel {

  /**
   * @typedef {SystemDataModelMetadata} ItemDataModelMetadata
   * @property {boolean} singleton  Should only a single item of this type be allowed on an actor?
   */

  /** @type {ItemDataModelMetadata} */
  static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
    singleton: false
  }, {inplace: false}));

  /**
   * The handlebars template for rendering item tooltips.
   * @type {string}
   */
  static ITEM_TOOLTIP_TEMPLATE = "systems/sw5e/templates/items/parts/item-tooltip.hbs";

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Render a rich tooltip for this item.
   * @param {EnrichmentOptions} [enrichmentOptions={}]  Options for text enrichment.
   * @returns {{content: string, classes: string[]}}
   */
  async richTooltip(enrichmentOptions={}) {
    return {
      content: await renderTemplate(
        this.constructor.ITEM_TOOLTIP_TEMPLATE, await this.getCardData(enrichmentOptions)
      ),
      classes: ["sw5e2", "sw5e-tooltip", "item-tooltip"]
    };
  }

  /* -------------------------------------------- */

  /**
   * Prepare item card template data.
   * @param {EnrichmentOptions} enrichmentOptions  Options for text enrichment.
   * @returns {Promise<object>}
   */
  async getCardData(enrichmentOptions={}) {
    const { name, type, img } = this.parent;
    let {
      price, weight, uses, identified, unidentified, description, school, materials, activation, properties
    } = this;
    const rollData = this.parent.getRollData();
    const isIdentified = identified !== false;
    const chat = isIdentified ? description.chat || description.value : unidentified?.description;
    description = game.user.isGM || isIdentified ? description.value : unidentified?.description;
    uses = this.hasLimitedUses && (game.user.isGM || identified) ? uses : null;
    price = game.user.isGM || identified ? price : null;

    const subtitle = [this.type?.label ?? game.i18n.localize(CONFIG.Item.typeLabels[this.parent.type])];
    const context = {
      name, type, img, price, weight, uses, school, materials, activation,
      config: CONFIG.SW5E,
      labels: foundry.utils.deepClone(this.parent.labels),
      tags: this.parent.labels?.components?.tags,
      subtitle: subtitle.filterJoin(" &bull; "),
      description: {
        value: await TextEditor.enrichHTML(description ?? "", {
          rollData, async: true, relativeTo: this.parent, ...enrichmentOptions
        }),
        chat: await TextEditor.enrichHTML(chat ?? "", {
          rollData, async: true, relativeTo: this.parent, ...enrichmentOptions
        })
      }
    };

    context.properties = [];

    if ( game.user.isGM || isIdentified ) {
      context.properties.push(
        ...this.cardProperties ?? [],
        ...this.activatedEffectCardProperties ?? [],
        ...this.equippableItemCardProperties ?? []
      );
    }

    if ( context.labels.duration ) {
      context.labels.concentrationDuration = properties?.has("concentration")
        ? game.i18n.format("SW5E.ConcentrationDuration", {
          duration: context.labels.duration.toLocaleLowerCase(game.i18n.lang)
        })
        : context.labels.duration;
    }

    context.properties = context.properties.filter(_ => _);
    context.hasProperties = context.tags?.length || context.properties.length;
    return context;
  }

  /* -------------------------------------------- */

  /**
   * @typedef {object} FavoriteData5e
   * @property {string} img                  The icon path.
   * @property {string} title                The title.
   * @property {string|string[]} [subtitle]  An optional subtitle or several subtitle parts.
   * @property {number} [value]              A single value to display.
   * @property {number} [quantity]           The item's quantity.
   * @property {string|number} [modifier]    A modifier associated with the item.
   * @property {number} [passive]            A passive score associated with the item.
   * @property {object} [range]              The item's range.
   * @property {number} [range.value]        The first range increment.
   * @property {number|null} [range.long]    The second range increment.
   * @property {string} [range.units]        The range units.
   * @property {object} [save]               The item's saving throw.
   * @property {string} [save.ability]       The saving throw ability.
   * @property {number} [save.dc]            The saving throw DC.
   * @property {object} [uses]               Data on an item's uses.
   * @property {number} [uses.value]         The current available uses.
   * @property {number} [uses.max]           The maximum available uses.
   * @property {string} [uses.name]          The property to update on the item. If none is provided, the property will
   *                                         not be updatable.
   * @property {boolean} [toggle]            The effect's toggle state.
   * @property {boolean} [suppressed]        Whether the favorite is suppressed.
   */

  /**
   * Prepare item favorite data.
   * @returns {Promise<FavoriteData5e>}
   */
  async getFavoriteData() {
    return {
      img: this.parent.img,
      title: this.parent.name,
      subtitle: game.i18n.localize(CONFIG.Item.typeLabels[this.parent.type])
    };
  }

  /* -------------------------------------------- */

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item.
   * @param {object} [options]
   * @param {boolean} [options.deterministic] Whether to force deterministic values for data properties that could be
   *                                          either a die term or a flat term.
   * @returns {object}
   */
  getRollData({ deterministic=false }={}) {
    if ( !this.parent.actor ) return null;
    const actorRollData = this.parent.actor.getRollData({ deterministic });
    const data = { ...actorRollData, item: { ...this } };
    return data;
  }
}

/* -------------------------------------------- */

/**
 * Data Model variant that does not export fields with an `undefined` value during `toObject(true)`.
 */
export class SparseDataModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  toObject(source=true) {
    if ( !source ) return super.toObject(source);
    const clone = foundry.utils.flattenObject(this._source);
    // Remove any undefined keys from the source data
    Object.keys(clone).filter(k => clone[k] === undefined).forEach(k => delete clone[k]);
    return foundry.utils.expandObject(clone);
  }
}
