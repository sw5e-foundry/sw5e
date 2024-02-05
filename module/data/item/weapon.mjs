import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import MountableTemplate from "./templates/mountable.mjs";
import ModdableTemplate from "./templates/moddable.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";
import { MapField } from "../fields.mjs";

const { NumberField, SetField, StringField, SchemaField, ArrayField } = foundry.data.fields;

/**
 * Data definition for Weapon items.
 * @mixes IdentifiableTemplate
 * @mixes ItemDescriptionTemplate
 * @mixes ItemTypeTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 * @mixes MountableTemplate
 * @mixes ModdableTemplate
 *
 * @property {string} weaponClass         Weapon class as defined in `SW5E.weaponClasses`.
 * @property {Set<string>} properties     Weapon's properties.
 * @property {number} proficient          Does the weapon's owner have proficiency?
 * @property {object} ammo
 * @property {string} ammo.target         Id of the selected ammo item.
 * @property {string} ammo.value          Current amount of loaded ammo.
 * @property {string} ammo.use            Amount of ammo spent per shot.
 * @property {Array<string>} ammo.types   Types of ammo this ammo can accept.
 * @property {string} firingArc           In which direction can the weapon fire? Options defined in `SW5E.weaponFiringArcs`.
 */
export default class WeaponData extends ItemDataModel.mixin(
  IdentifiableTemplate,
  ItemTypeTemplate,
  ItemDescriptionTemplate,
  PhysicalItemTemplate,
  EquippableItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate,
  MountableTemplate,
  ModdableTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      type: new ItemTypeField({value: "simpleM", subtype: false}, {label: "SW5E.ItemWeaponType"}),
      properties: new MapField({label: "SW5E.ItemWeaponProperties"}),
      proficient: new NumberField({
        required: true, min: 0, max: 1, integer: true, initial: null, label: "SW5E.ProficiencyLevel"
      }),
      weaponClass: new StringField({
        required: true,
        blank: true,
        label: "SW5E.ItemWeaponClass"
      }),
      ammo: new SchemaField(
        {
          target: new StringField({
            required: true,
            nullable: true,
            label: "SW5E.WeaponAmmoSelected"
          }),
          value: new NumberField({
            required: true,
            nullable: true,
            label: "SW5E.WeaponAmmoLoaded"
          }),
          use: new NumberField({ required: true, nullable: true, label: "SW5E.WeaponAmmoUse" }),
          types: new ArrayField(new StringField(), {
            required: true,
            initial: ["powerCell"],
            label: "SW5E.WeaponAmmoValid"
          })
        },
        {}
      ),
      firingArc: new StringField({
        required: true,
        blank: true,
        label: "SW5E.ItemFiringArc"
      })
    });
  }

  /* -------------------------------------------- */
  /*  Data Migrations                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    WeaponData.#migrateProficient(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the proficient field to convert boolean values.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateProficient(source) {
    if (typeof source.proficient === "boolean") source.proficient = Number(source.proficient);
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.type.label = CONFIG.SW5E.weaponTypes[this.type.value];
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async getFavoriteData() {
    return foundry.utils.mergeObject(await super.getFavoriteData(), {
      subtitle: CONFIG.SW5E.itemActionTypes[this.actionType],
      modifier: this.parent.labels.modifier,
      range: this.range
    });
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [
      this.type.label,
      this.isMountable ? (this.parent.labels?.armor ?? null) : null
    ];
  }

  /* -------------------------------------------- */

  /**
   * Properties displayed on the item card.
   * @type {string[]}
   */
  get cardProperties() {
    return [
      this.isMountable ? (this.parent.labels?.armor ?? null) : null
    ];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    if (["simpleB", "martialB"].includes(this.type.value)) return "dex";

    const abilities = this.parent?.actor?.system?.abilities;
    if (this.properties.has("fin") && abilities) {
      return (abilities.dex?.mod ?? 0) >= (abilities.str?.mod ?? 0) ? "dex" : "str";
    }

    return null;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeBaseCriticalThreshold() {
    return Math.max(15, 20 - (this.properties.ken ?? this.properties.SS_ken ?? 0));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.sw5e?.weaponCriticalThreshold ?? Infinity;
  }

  /* -------------------------------------------- */

  /**
   * Is this item a separate large object like a siege engine or vehicle component that is
   * usually mounted on fixtures rather than equipped, and has its own AC and HP?
   * @type {boolean}
   */
  get isMountable() {
    return this.type.value === "siege";
  }

  /* -------------------------------------------- */

  /**
   * Is this a starship weapon?
   * @type {boolean}
   */
  get isStarshipWeapon() {
    return this.type.value in CONFIG.SW5E.weaponStarshipTypes;
  }

  /* -------------------------------------------- */

  /**
   * Is this a starship item.
   * @type {boolean}
   */
  get isStarshipItem() {
    return this.isStarshipWeapon;
  }

  /* -------------------------------------------- */

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    if ( Number.isFinite(this.proficient) ) return this.proficient;
    const actor = this.parent.actor;
    if ( !actor ) return 0;
    // NPCs and Starships are always considered proficient with any weapon in their stat block.
    if ( actor.type === "npc" || this.isStarshipWeapon ) return 1;
    const config = CONFIG.SW5E.weaponProficienciesMap;
    const itemProf = config[this.type.value];
    const actorProfs = actor.system.traits?.weaponProf?.value ?? new Set();
    const natural = this.type.value === "natural";
    const improvised = (this.type.value === "improv") && !!actor.getFlag("sw5e", "tavernBrawlerFeat");
    const isProficient = natural || improvised || actorProfs.has(itemProf) || actorProfs.has(this.type.baseItem);
    return Number(isProficient);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get validProperties() {
    const valid = super.validProperties;
    if (this.isStarshipItem) CONFIG.SW5E.validProperties.weapon.starship.forEach(p => valid.add(p));
    else CONFIG.SW5E.validProperties.weapon.character.forEach(p => valid.add(p));
    return valid;
  }
}
