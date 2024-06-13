import HitDice from "../../documents/actor/hit-dice.mjs";
import Proficiency from "../../documents/actor/proficiency.mjs";
import { simplifyBonus } from "../../utils.mjs";
import { FormulaField, LocalDocumentField } from "../fields.mjs";
import CreatureTypeField from "../shared/creature-type-field.mjs";
import RollConfigField from "../shared/roll-config-field.mjs";
import AttributesFields from "./templates/attributes.mjs";
import CreatureTemplate from "./templates/creature.mjs";
import DetailsFields from "./templates/details.mjs";
import TraitsFields from "./templates/traits.mjs";

const { SchemaField, NumberField, StringField, BooleanField, ArrayField, IntegerSortField } = foundry.data.fields;

/**
 * @typedef {object} ActorFavorites5e
 * @property {"effect"|"item"|"skill"|"slots"|"tool"} type  The favorite type.
 * @property {string} id                                    The Document UUID, skill or tool identifier, or power slot
 *                                                          level identifier.
 * @property {number} sort                                  The sort value.
 */

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
 * @property {ActorFavorites5e[]} favorites               The character's favorites.
 */
export default class CharacterData extends CreatureTemplate {

  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
    supportsAdvancement: true
  }, { inplace: false }));

  /* -------------------------------------------- */

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
          ac: new SchemaField(
            {
              flat: new NumberField({ integer: true, min: 0, label: "SW5E.ArmorClassFlat" }),
              calc: new StringField({ initial: "default", label: "SW5E.ArmorClassCalculation" }),
              formula: new FormulaField({ deterministic: true, label: "SW5E.ArmorClassFormula" })
            },
            { label: "SW5E.ArmorClass" }
          ),
          hp: new SchemaField(
            {
              value: new NumberField({
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.HitPointsCurrent"
              }),
              max: new NumberField({
                nullable: true,
                integer: true,
                min: 0,
                initial: null,
                label: "SW5E.HitPointsOverride"
              }),
              temp: new NumberField({
                integer: true,
                initial: 0,
                min: 0,
                label: "SW5E.HitPointsTemp"
              }),
              tempmax: new NumberField({
                integer: true,
                initial: 0,
                label: "SW5E.HitPointsTempMax"
              }),
              bonuses: new SchemaField({
                level: new FormulaField({ deterministic: true, label: "SW5E.HitPointsBonusLevel" }),
                overall: new FormulaField({ deterministic: true, label: "SW5E.HitPointsBonusOverall" })
              })
            },
            { label: "SW5E.HitPoints" }
          ),
          death: new RollConfigField(
            {
              success: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.DeathSaveSuccesses"
              }),
              failure: new NumberField({
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
          inspiration: new BooleanField({ required: true, label: "SW5E.Inspiration" })
        },
        { label: "SW5E.Attributes" }
      ),
      details: new SchemaField(
        {
          ...DetailsFields.common,
          ...DetailsFields.creature,
          description: new SchemaField(
            {
              value: new HTMLField({ label: "SW5E.Description" }),
              public: new HTMLField({ label: "SW5E.DescriptionPublic" })
            },
            { label: "SW5E.Description" }
          ),
          background: new LocalDocumentField(foundry.documents.BaseItem, {
            required: true, fallback: true, label: "SW5E.Background"
          }),
          originalClass: new StringField({ required: true, label: "SW5E.ClassOriginal" }),
          xp: new SchemaField(
            {
              value: new NumberField({
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
          prestige: new SchemaField(
            {
              value: new NumberField({
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
          appearance: new StringField({ required: true, label: "SW5E.Appearance" }),
          trait: new StringField({ required: true, label: "SW5E.PersonalityTraits" }),
          ideal: new StringField({ required: true, label: "SW5E.Ideals" }),
          bond: new StringField({ required: true, label: "SW5E.Bonds" }),
          flaw: new StringField({ required: true, label: "SW5E.Flaws" }),
          gender: new StringField({ label: "SW5E.Gender" }),
          eyes: new StringField({ label: "SW5E.Eyes" }),
          height: new StringField({ label: "SW5E.Height" }),
          faith: new StringField({ label: "SW5E.Faith" }),
          hair: new StringField({ label: "SW5E.Hair" }),
          skin: new StringField({ label: "SW5E.Skin" }),
          age: new StringField({ label: "SW5E.Age" }),
          weight: new StringField({ label: "SW5E.Weight" }),
          notes: new SchemaField(
            {
              value: new HTMLField({ label: "SW5E.Notes" }),
              public: new HTMLField({ label: "SW5E.NotesPublic" })
            },
            { label: "SW5E.Notes" }
          )
        },
        { label: "SW5E.Details" }
      ),
      traits: new SchemaField(
        {
          ...TraitsFields.common,
          ...TraitsFields.creature,
          weaponProf: TraitsFields.makeSimpleTrait({ label: "SW5E.TraitWeaponProf" }),
          armorProf: TraitsFields.makeSimpleTrait({ label: "SW5E.TraitArmorProf" })
        },
        { label: "SW5E.Traits" }
      ),
      resources: new SchemaField(
        {
          primary: makeResourceField({ label: "SW5E.ResourcePrimary" }),
          secondary: makeResourceField({ label: "SW5E.ResourceSecondary" }),
          tertiary: makeResourceField({ label: "SW5E.ResourceTertiary" })
        },
        { label: "SW5E.Resources" }
      ),
      favorites: new ArrayField(new SchemaField({
        type: new StringField({ required: true, blank: false }),
        id: new StringField({ required: true, blank: false }),
        sort: new IntegerSortField()
      }), { label: "SW5E.Favorites" })
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

  /** @inheritdoc */
  prepareBaseData() {
    this.attributes.hd = new HitDice(this.parent);
    this.details.level = this.attributes.hd.max;
    this.attributes.attunement.value = 0;
    this.details.ranks = 0;

    for (const item of this.parent.items) {

      // Determine character rank based on owned Deployment items
      if (item.type === "deployment") {
        const rankLevels = parseInt(item.system.levels) || 1;
        this.details.ranks += rankLevels;
      }

      // Attuned items
      if (item.system.attuned) this.attributes.attunement.value += 1;
    }

    // Character proficiency bonus
    this.attributes.prof = Proficiency.calculateMod(this.details.level);

    // Experience required for next level
    const { xp, level } = this.details;
    xp.max = this.parent.getLevelExp(level || 1);
    xp.min = level ? this.parent.getLevelExp(level - 1) : 0;
    if (level >= CONFIG.SW5E.CHARACTER_EXP_LEVELS.length) xp.pct = 100;
    else {
      const required = xp.max - xp.min;
      const pct = Math.round((xp.value - xp.min) * 100 / required);
      xp.pct = Math.clamp(pct, 0, 100);
    }

    // Prestige required for next rank
    const { prestige, ranks } = this.details;
    prestige.max = this.parent.getRankExp(ranks || 1);
    prestige.min = ranks ? this.parent.getRankExp(ranks - 1) : 0;
    if (ranks >= CONFIG.SW5E.CHARACTER_PRESTIGE_RANKS.length) prestige.pct = 100;
    else {
      const required = prestige.max - prestige.min;
      const pct = Math.round((prestige.value - prestige.min) * 100 / required);
      prestige.pct = Math.clamp(pct, 0, 100);
    }

    AttributesFields.prepareBaseArmorClass.call(this);
    AttributesFields.prepareBaseEncumbrance.call(this);
    AttributesFields.prepareBasePowercasting.call(this);
    AttributesFields.prepareBaseSuperiority.call(this);
  }

  /* -------------------------------------------- */

  /**
   * Prepare movement & senses values derived from species item.
   */
  prepareEmbeddedData() {
    if (this.details.species instanceof Item) {
      AttributesFields.prepareSpecies.call(this, this.details.species);
      this.details.type = this.details.species.system.type;
    } else {
      this.details.type = new CreatureTypeField({ swarm: false }).initialize({ value: "humanoid" }, this);
    }
    for (const key of Object.keys(CONFIG.SW5E.movementTypes)) this.attributes.movement[key] ??= 0;
    for (const key of Object.keys(CONFIG.SW5E.senses)) this.attributes.senses[key] ??= 0;
    this.attributes.movement.units ??= Object.keys(CONFIG.SW5E.movementUnits)[0];
    this.attributes.senses.units ??= Object.keys(CONFIG.SW5E.movementUnits)[0];
  }

  /* -------------------------------------------- */

  /**
   * Prepare remaining character data.
   */
  prepareDerivedData() {
    const rollData = this.parent.getRollData({ deterministic: true });
    const { originalSaves } = this.parent.getOriginalStats();

    this.prepareAbilities({ rollData, originalSaves });
    AttributesFields.prepareEncumbrance.call(this, rollData);
    AttributesFields.prepareExhaustionLevel.call(this);
    AttributesFields.prepareMovement.call(this);
    AttributesFields.prepareConcentration.call(this, rollData);
    TraitsFields.prepareResistImmune.call(this);

    // Hit Points
    const hpOptions = {};
    if (this.attributes.hp.max === null) {
      hpOptions.advancement = Object.values(this.parent.classes)
        .map(c => c.advancement.byType.HitPoints?.[0]).filter(a => a);
      hpOptions.bonus = (simplifyBonus(this.attributes.hp.bonuses.level, rollData) * this.details.level)
        + simplifyBonus(this.attributes.hp.bonuses.overall, rollData);
      hpOptions.mod = this.abilities[CONFIG.SW5E.defaultAbilities.hitPoints ?? "con"]?.mod ?? 0;
    }
    AttributesFields.prepareHitPoints.call(this, this.attributes.hp, hpOptions);
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Checks whether the item with the given relative UUID has been favorited
   * @param {string} favoriteId  The relative UUID of the item to check.
   * @returns {boolean}
   */
  hasFavorite(favoriteId) {
    return !!this.favorites.find(f => f.id === favoriteId);
  }

  /* -------------------------------------------- */

  /**
   * Add a favorite item to this actor.
   * If the given item is already favorite, this method has no effect.
   * @param {ActorFavorites5e} favorite  The favorite to add.
   * @returns {Promise<Actor5e>}
   * @throws If the item intended to be favorited does not belong to this actor.
   */
  addFavorite(favorite) {
    if (this.hasFavorite(favorite.id)) return Promise.resolve(this.parent);

    if (favorite.id.startsWith(".") && fromUuidSync(favorite.id, { relative: this.parent }) === null) {
      // Assume that an ID starting with a "." is a relative ID.
      throw new Error(`The item with id ${favorite.id} is not owned by actor ${this.parent.id}`);
    }

    let maxSort = 0;
    const favorites = this.favorites.map(f => {
      if (f.sort > maxSort) maxSort = f.sort;
      return { ...f };
    });
    favorites.push({ ...favorite, sort: maxSort + CONST.SORT_INTEGER_DENSITY });
    return this.parent.update({ "system.favorites": favorites });
  }

  /* -------------------------------------------- */

  /**
   * Removes the favorite with the given relative UUID or resource ID
   * @param {string} favoriteId  The relative UUID or resource ID of the favorite to remove.
   * @returns {Promise<Actor5e>}
   */
  removeFavorite(favoriteId) {
    if (favoriteId.startsWith("resources.")) return this.parent.update({ [`system.${favoriteId}.max`]: 0 });
    const favorites = this.favorites.filter(f => f.id !== favoriteId);
    return this.parent.update({ "system.favorites": favorites });
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
  return new SchemaField(
    {
      value: new NumberField({
        required: true,
        integer: true,
        initial: 0,
        labels: "SW5E.ResourceValue"
      }),
      max: new NumberField({
        required: true,
        integer: true,
        initial: 0,
        labels: "SW5E.ResourceMax"
      }),
      sr: new BooleanField({ required: true, labels: "SW5E.ShortRestRecovery" }),
      lr: new BooleanField({ required: true, labels: "SW5E.LongRestRecovery" }),
      label: new StringField({ required: true, labels: "SW5E.ResourceLabel" })
    },
    schemaOptions
  );
}
