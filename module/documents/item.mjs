import AdvancementManager from "../applications/advancement/advancement-manager.mjs";
import AdvancementConfirmationDialog from "../applications/advancement/advancement-confirmation-dialog.mjs";
import ClassData from "../data/item/class.mjs";
import ContainerData from "../data/item/container.mjs";
import EquipmentData from "../data/item/equipment.mjs";
import PowerData from "../data/item/power.mjs";
import { EnchantmentData } from "../data/item/fields/enchantment-field.mjs";
import PhysicalItemTemplate from "../data/item/templates/physical-item.mjs";
import { d20Roll, damageRoll } from "../dice/dice.mjs";
import simplifyRollFormula from "../dice/simplify-roll-formula.mjs";
import { getSceneTargets } from "../utils.mjs";
import Advancement from "./advancement/advancement.mjs";
import AbilityUseDialog from "../applications/item/ability-use-dialog.mjs";
import Proficiency from "./actor/proficiency.mjs";
import SystemDocumentMixin from "./mixins/document.mjs";

/**
 * Override and extend the basic Item implementation.
 */
export default class Item5e extends SystemDocumentMixin( Item ) {

  /**
   * Caches an item linked to this one, such as a archetype associated with a class.
   * @type {Item5e}
   * @private
   */
  _classLink;

  /* -------------------------------------------- */

  /**
   * An object that tracks which tracks the changes to the data model which were applied by active effects and modifications
   * @type {object}
   */
  overrides = this.overrides ?? {};

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _initializeSource( data, options = {} ) {
    // Migrate backpack -> container.
    if ( data.type === "backpack" ) {
      data.type = "container";
      foundry.utils.setProperty( data, "flags.sw5e.persistSourceMigration", true );
    }

    /**
     * A hook event that fires before source data is initialized for an Item in a compendium.
     * @function sw5e.initializeItemSource
     * @memberof hookEvents
     * @param {Item5e} item     Item for which the data is being initialized.
     * @param {object} data     Source data being initialized.
     * @param {object} options  Additional data initialization options.
     */
    if ( options.pack || options.parent?.pack ) Hooks.callAll( "sw5e.initializeItemSource", this, data, options );

    return super._initializeSource( data, options );
  }

  /* -------------------------------------------- */
  /*  Item Properties                             */
  /* -------------------------------------------- */

  /**
   * Which ability score modifier is used by this item?
   * @type {string|null}
   * @see {@link ActionTemplate#abilityMod}
   */
  get abilityMod() {
    return this.system.abilityMod ?? null;
  }

  /* --------------------------------------------- */

  /**
   * The item that contains this item, if it is in a container. Returns a promise if the item is located
   * in a compendium pack.
   * @type {Item5e|Promise<Item5e>|void}
   */
  get container() {
    if ( !this.system.container ) return;
    if ( this.isEmbedded ) return this.actor.items.get( this.system.container );
    if ( this.pack ) return game.packs.get( this.pack ).getDocument( this.system.container );
    return game.items.get( this.system.container );
  }

  /* -------------------------------------------- */

  /**
   * What is the critical hit threshold for this item, if applicable?
   * @type {number|null}
   * @see {@link ActionTemplate#criticalThreshold}
   */
  get criticalThreshold() {
    return this.system.criticalThreshold ?? null;
  }

  /* --------------------------------------------- */

  /**
   * Does the Item implement an ability check as part of its usage?
   * @type {boolean}
   * @see {@link ActionTemplate#hasAbilityCheck}
   */
  get hasAbilityCheck() {
    return this.system.hasAbilityCheck ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does this item support advancement and have advancements defined?
   * @type {boolean}
   */
  get hasAdvancement() {
    return !!this.system.advancement?.length;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item have an area of effect target?
   * @type {boolean}
   * @see {@link ActivatedEffectTemplate#hasAreaTarget}
   */
  get hasAreaTarget() {
    return this.system.hasAreaTarget ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement an attack roll as part of its usage?
   * @type {boolean}
   * @see {@link ActionTemplate#hasAttack}
   */
  get hasAttack() {
    return this.system.hasAttack ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a damage roll as part of its usage?
   * @type {boolean}
   * @see {@link ActionTemplate#hasDamage}
   */
  get hasDamage() {
    return this.system.hasDamage ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item target one or more distinct targets?
   * @type {boolean}
   * @see {@link ActivatedEffectTemplate#hasIndividualTarget}
   */
  get hasIndividualTarget() {
    return this.system.hasIndividualTarget ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Is this Item limited in its ability to be used by charges or by recharge?
   * @type {boolean}
   * @see {@link ActivatedEffectTemplate#hasLimitedUses}
   * @see {@link FeatData#hasLimitedUses}
   */
  get hasLimitedUses() {
    return this.system.hasLimitedUses ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does this Item draw from a resource?
   * @type {boolean}
   * @see {@link ActivatedEffectTemplate#hasResource}
   */
  get hasResource() {
    return this.system.hasResource ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does this Item draw from ammunition?
   * @type {boolean}
   * @see {@link ActivatedEffectTemplate#hasReload} and {@link ActivatedEffectTemplate#hasAmmo}
   */
  get hasAmmo() {
    return ( this.system.hasReload || this.system.hasAmmo ) ?? false;
  }


  /* -------------------------------------------- */

  /**
   * What item does this item use as ammunition?
   * @type {object}
   * @see {@link ActivatedEffectTemplate#getAmmo}
   */
  get getAmmo() {
    return this.system.getAmmo ?? {};
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a saving throw as part of its usage?
   * @type {boolean}
   * @see {@link ActionTemplate#hasSave}
   */
  get hasSave() {
    return this.system.hasSave ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item have a target?
   * @type {boolean}
   * @see {@link ActivatedEffectTemplate#hasTarget}
   */
  get hasTarget() {
    return this.system.hasTarget ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Return an item's identifier.
   * @type {string}
   */
  get identifier() {
    return this.system.identifier || this.name.slugify( { strict: true } );
  }

  /* --------------------------------------------- */

  /**
   * Is this Item an activatable item?
   * @type {boolean}
   */
  get isActive() {
    return this.system.isActive ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Is this item any of the armor subtypes?
   * @type {boolean}
   * @see {@link EquipmentTemplate#isArmor}
   */
  get isArmor() {
    return this.system.isArmor ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Does the item provide an amount of healing instead of conventional damage?
   * @type {boolean}
   * @see {@link ActionTemplate#isHealing}
   */
  get isHealing() {
    return this.system.isHealing ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Is this item a separate large object like a siege engine or vehicle component that is
   * usually mounted on fixtures rather than equipped, and has its own AC and HP?
   * @type {boolean}
   * @see {@link EquipmentData#isMountable}
   * @see {@link WeaponData#isMountable}
   */
  get isMountable() {
    return this.system.isMountable ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Is this class item the original class for the containing actor? If the item is not a class or it is not
   * embedded in an actor then this will return `null`.
   * @type {boolean|null}
   */
  get isOriginalClass() {
    if ( this.type !== "class" || !this.isEmbedded || !this.parent.system.details?.originalClass ) return null;
    return this.id === this.parent.system.details.originalClass;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a versatile damage roll as part of its usage?
   * @type {boolean}
   * @see {@link ActionTemplate#isVersatile}
   */
  get isVersatile() {
    return this.system.isVersatile ?? false;
  }

  /* --------------------------------------------- */

  /**
   * Does this item require concentration?
   * @type {boolean}
   */
  get requiresConcentration() {
    const isValid = this.system.validProperties.has( "concentration" ) && this.system.properties.has( "concentration" );
    return isValid && this.isActive && this.system.hasScalarDuration;
  }

  /* -------------------------------------------- */

  /**
   * Class associated with this archetype. Always returns null on non-archetype or non-embedded items.
   * @type {Item5e|null}
   */
  get class() {
    if ( !this.isEmbedded || this.type !== "archetype" ) return null;
    const cid = this.system.classIdentifier;
    return ( this._classLink ??= this.parent.items.find( i => i.type === "class" && i.identifier === cid ) );
  }

  /* -------------------------------------------- */

  /**
   * Archetype associated with this class. Always returns null on non-class or non-embedded items.
   * @type {Item5e|null}
   */
  get archetype() {
    if ( !this.isEmbedded || this.type !== "class" ) return null;
    const items = this.parent.items;
    const cid = this.identifier;
    return ( this._classLink ??= items.find( i => i.type === "archetype" && i.system.classIdentifier === cid ) );
  }

  /* -------------------------------------------- */

  /**
   * Is this item a starship item?
   * @type {boolean}
   */
  get isStarshipItem() {
    return this.system.isStarshipItem ?? false;
  }

  /* -------------------------------------------- */

  /**
   * Retrieve scale values for current level from advancement data.
   * @type {object}
   */
  get scaleValues() {
    if ( !this.advancement?.byType?.ScaleValue ) return {};
    if ( !this.advancement.byType.ScaleValue[0].constructor.metadata.validItemTypes.has( this.type ) ) return {};
    const level = this.curAdvancementLevel;
    return this.advancement.byType.ScaleValue.reduce( ( obj, advancement ) => {
      obj[advancement.identifier] = advancement.valueForLevel( level );
      return obj;
    }, {} );
  }

  /* -------------------------------------------- */

  /**
   * Does this item scale with any kind of consumption?
   * @type {string|null}
   */
  get usageScaling() {
    const { level, preparation, consume } = this.system;
    const isLeveled = ( this.type === "power" ) && ( level > 0 );
    if ( isLeveled && CONFIG.SW5E.powerPreparationModes[preparation.mode]?.upcast ) return "slot";
    else if ( isLeveled && this.hasResource && consume.scale ) return "resource";
    return null;
  }

  /* -------------------------------------------- */

  /**
   * Powercasting details for a class or archetype.
   *
   * @typedef {object} PowercastingDescription
   * @property {string} type              Powercasting type as defined in ``CONFIG.SW5E.powercastingTypes`.
   * @property {string|null} progression  Progression within the specified powercasting type if supported.
   * @property {string} ability           Ability used when casting powers from this class or archetype.
   * @property {number|null} levels       Number of levels of this class or archetype's class if embedded.
   */

  /**
   * Retrieve the powercasting for a class or archetype. For classes, this will return the powercasting
   * of the archetype if it overrides the class. For archetypes, this will return the class's powercasting
   * if no powercasting is defined on the archetype.
   * @type {PowercastingDescription|null}  Powercasting object containing progression & ability.
   */
  get powercasting() {
    const powercasting = this.system.powercasting;
    if ( !powercasting ) return null;
    const isArchetype = this.type === "archetype";
    const classPC = isArchetype ? this.class?.system.powercasting : powercasting;
    const archetypePC = isArchetype ? powercasting : this.archetype?.system.powercasting;
    const finalPC = foundry.utils.deepClone( archetypePC && archetypePC.progression !== "none" ? archetypePC : classPC );
    if ( !finalPC ) return null;
    finalPC.levels = this.isEmbedded ? this.system.levels ?? this.class?.system.levels : null;

    // // Temp method for determining powercasting type until this data is available directly using advancement
    // if (CONFIG.SW5E.powercastingTypes[finalPC.progression]) finalPC.type = finalPC.progression;
    // else finalPC.type = Object.entries(CONFIG.SW5E.powercastingTypes).find(([type, data]) => {
    //   return !!data.progression?.[finalPC.progression];
    // })?.[0];

    return finalPC;
  }

  /* -------------------------------------------- */
  /*  Active Effects                              */
  /* -------------------------------------------- */

  /**
   * Get all ActiveEffects that may apply to this Item.
   * @yields {ActiveEffect5e}
   * @returns {Generator<ActiveEffect5e, void, void>}
   */
  *allApplicableEffects() {
    for ( const effect of this.effects ) {
      if ( effect.isAppliedEnchantment ) yield effect;
    }
  }

  /* -------------------------------------------- */

  /**
   * Apply any transformation to the Item data which are caused by enchantment Effects.
   */
  applyActiveEffects() {
    const overrides = {};

    // Organize non-disabled effects by their application priority
    const changes = [];
    for ( const effect of this.allApplicableEffects() ) {
      if ( !effect.active ) continue;
      changes.push( ...effect.changes.map( change => {
        const c = foundry.utils.deepClone( change );
        c.effect = effect;
        c.priority ??= c.mode * 10;
        return c;
      } ) );
    }
    changes.sort( ( a, b ) => a.priority - b.priority );

    // Apply all changes
    for ( const change of changes ) {
      if ( !change.key ) continue;
      const changes = change.effect.apply( this, change );
      Object.assign( overrides, changes );
    }

    // Expand the set of final overrides
    this.overrides = foundry.utils.expandObject( overrides );
  }

  /* -------------------------------------------- */

  /**
   * Should this item's active effects be suppressed.
   * @type {boolean}
   */
  get areEffectsSuppressed() {
    const requireEquipped =
      this.type !== "consumable" || ["rod", "trinket", "wand"].includes( this.system.type.value );
    if ( requireEquipped && this.system.equipped === false ) return true;

    if ( this.type === "modification" && ( this.system.modifying === null || this.system.modifying.disabled ) ) return true;

    return !this.system.attuned && ( this.system.attunement === "required" );
  }

  /* -------------------------------------------- */

  /**
   * The current level this item's advancements should have.
   * @type {number}
   * @protected
   */
  get curAdvancementLevel() {
    if ( this.type === "class" ) return this.system?.levels ?? 1;
    if ( this.type === "deployment" ) return this.system?.rank ?? 1;
    if ( this.type === "starshipsize" ) return this.system?.tier ?? 0;
    if ( this.type === "archetype" ) return this.class?.system?.levels ?? 0;
    return this.parent?.system?.details?.level ?? 0;
  }

  set curAdvancementLevel( value ) {
    if ( this.type === "class" ) {
      if ( this.system?.levels !== undefined ) this.system.levels = value;
    } else if ( this.type === "deployment" ) {
      if ( this.system?.rank !== undefined ) this.system.rank = value;
    } else if ( this.type === "starshipsize" ) {
      if ( this.system?.tier !== undefined ) this.system.tier = value;
    } else if ( this.type === "archetype" ) {
      if ( this.class?.system?.levels !== undefined ) this.class.system.levels = value;
    } else if ( this.parent?.system?.details?.level !== undefined ) this.parent.system.details.level = value;
  }

  /* -------------------------------------------- */

  /**
   * The current character level this item's advancements should have.
   * @type {number}
   * @protected
   */
  get curAdvancementCharLevel() {
    if ( this.type === "deployment" ) return this.parent?.system?.details?.ranks ?? 0;
    if ( this.type === "starshipsize" ) return this.system?.tier ?? 0;
    return this.parent?.system?.details?.level ?? 0;
  }

  /* -------------------------------------------- */

  /**
   * The max level this item's advancements should have.
   * @type {boolean}
   */
  get maxAdvancementLevel() {
    if ( this.type === "deployment" ) return CONFIG.SW5E.maxIndividualRank;
    if ( this.type === "starshipsize" ) return CONFIG.SW5E.maxTier;
    return CONFIG.SW5E.maxLevel;
  }

  /* -------------------------------------------- */

  /**
   * The min level this item's advancements should apply.
   * @type {boolean}
   */
  get minAdvancementLevel() {
    if ( ["class", "archetype", "deployment"].includes( this.type ) ) return 1;
    return 0;
  }

  /* -------------------------------------------- */

  /**
   * The list of valid properties for this item.
   * @type {object|null}
   */
  get propertiesList() {
    if ( this.type === "weapon" || ( this.type === "consumable" && this.system.type.value === "ammo" ) ) {
      if ( this.isStarshipItem ) return CONFIG.SW5E.weaponFullStarshipProperties;
      else return CONFIG.SW5E.weaponFullCharacterProperties;
    } else if ( this.type === "equipment" ) {
      if ( this.isArmor ) return CONFIG.SW5E.armorProperties;
      if ( this.system.type.value in CONFIG.SW5E.castingEquipmentTypes ) return CONFIG.SW5E.castingProperties;
    } else if ( this.type === "modification" ) {
      if ( this.system.type.value in CONFIG.SW5E.modificationTypesWeapon ) return CONFIG.SW5E.weaponProperties;
      if ( this.system.type.value in CONFIG.SW5E.modificationTypesEquipment ) return CONFIG.SW5E.armorProperties;
      if ( this.system.type.value in CONFIG.SW5E.modificationTypesCasting ) return CONFIG.SW5E.castingProperties;
    }
    return null;
  }

  /* -------------------------------------------- */

  /**
   * The type of modifications this item accepts
   * @type {string|null}
   */
  get modificationsType() {
    if ( this.type === "equipment" ) {
      if ( this.isArmor ) return "armor";
      if ( this.system.type?.value in CONFIG.SW5E.miscEquipmentTypes ) return this.system.type.value;
    } else if ( this.type === "weapon" ) {
      if ( this.system.type.value?.endsWith( "LW" ) ) return "lightweapon";
      if ( this.system.type.value?.endsWith( "VW" ) ) return "vibroweapon";
      if ( this.system.type.value?.endsWith( "B" ) ) return "blaster";
      return "vibroweapon";
    }
    return null;
  }

  /* -------------------------------------------- */

  /**
   * The icon's background. Usually determined by rarity.
   * @type {string|null}
   */
  get iconBackground() {
    if ( this.system.rarity === undefined ) return null;
    const rarity = this.system.rarity?.capitalize() || "Mundane";
    return `systems/sw5e/packs/Icons/ItemBackdrop/${rarity}.webp`;
  }

  /* -------------------------------------------- */

  /**
   * The icon's foreground.
   * @type {string|null}
   */
  get iconForeground() {
    if ( ( this?.system?.modify?.chassis ?? "none" ) !== "none" ) return "systems/sw5e/packs/Icons/Modifications/ChassisIcon.webp";
    return null;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  _initialize( options = {} ) {
    super._initialize( options );
  }
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareEmbeddedDocuments() {
    super.prepareEmbeddedDocuments();
    this.applyModifications();
    if ( !this.actor || this.actor._embeddedPreparation ) this.applyActiveEffects();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.labels = {};

    // Clear out linked item cache
    this._classLink = undefined;

    // Advancement
    this._prepareAdvancement();

    // Item Properties
    if ( this.system.properties ) {
      this.labels.properties = this.system.properties.reduce( ( acc, prop ) => {
        if ( ( prop === "concentration" ) && !this.requiresConcentration ) return acc;
        acc.push( {
          abbr: prop,
          label: CONFIG.SW5E.itemProperties[prop]?.label,
          icon: CONFIG.SW5E.itemProperties[prop]?.icon
        } );
        return acc;
      }, [] );
    }

    // Specialized preparation per Item type
    switch ( this.type ) {
      case "equipment":
        this._prepareEquipment();
        break;
      case "feat":
        this._prepareFeat();
        break;
      case "power":
        this._preparePower();
        break;
      case "weapon":
        this._prepareWeapon();
        break;
      case "maneuver":
        this._prepareManeuver();
        break;
      case "starshipmod":
        this._prepareStarshipMod();
        break;
      case "species":
        break;
      case "archetype":
        break;
      case "background":
        break;
      case "deployment":
        break;
    }

    // Activated Items
    this._prepareAction();
    this._prepareRecovery();

    // Un-owned items can have their final preparation done here, otherwise this needs to happen in the owning Actor
    if ( !this.isOwned ) this.prepareFinalAttributes();
  }

  /* -------------------------------------------- */

  /**
   * Apply modifications.
   */
  applyModifications() {
    if ( !( "modify" in this.system ) ) return;

    // Get the Item's data
    const item = this;
    const itemData = item.system;
    const itemMods = itemData.modify;
    const changes = foundry.utils.flattenObject( itemMods?.changes ?? {} );
    let overrides = {};

    // Calculate the type of item modifications accepted
    const modificationTypes = this.modificationsType;

    if ( game.settings.get( "sw5e", "disableItemMods" ) || foundry.utils.isEmpty( changes ) ) overrides = {};
    else if ( !foundry.utils.isEmpty( this.overrides ) ) overrides = foundry.utils.flattenObject( this.overrides );
    else {
      for ( const [prop, val] of Object.entries( changes ) ) {
        // Handle type specific changes
        if (
          !( modificationTypes in CONFIG.SW5E.modificationTypesEquipment )
          && ["armor.value", "armor.dex", "strength", "stealth"].includes( prop )
        ) continue;
        overrides[`system.${prop}`] = val;
      }

      // Handle non-overwrite changes
      if ( ( itemData.attackBonus || "0" ) !== "0" && overrides["system.attackBonus"] ) {
        overrides["system.attackBonus"] = `${itemData.attackBonus} + ${overrides["system.attackBonus"]}`;
      }
      if ( itemData.damage?.parts && overrides["system.damage.parts"] ) {
        overrides["system.damage.parts"] = itemData.damage.parts.concat( overrides["system.damage.parts"] );
      }
      if ( itemData.armor?.value && overrides["system.armor.value"] ) overrides["system.armor.value"] += itemData.armor.value;

      // Handle item properties
      const props = this.propertiesList;
      if ( props ) {
        for ( const [prop, propData] of Object.entries( props ) ) {
          if ( propData.type === "Number" && overrides[`system.properties.${prop}`] ) {
            if ( itemData.properties[prop] ) overrides[`system.properties.${prop}`] += Number( itemData.properties[prop] );
            if ( propData.min !== undefined ) overrides[`system.properties.${prop}`] = Math.max( overrides[`system.properties.${prop}`], propData.min );
            if ( propData.max !== undefined ) overrides[`system.properties.${prop}`] = Math.min( overrides[`system.properties.${prop}`], propData.max );
          }
        }
      }
    }

    // Apply all changes to the Actor data
    foundry.utils.mergeObject( this, overrides );

    // Expand the set of final overrides
    this.overrides = foundry.utils.expandObject( overrides );
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data for an equipment-type item and define labels.
   * @protected
   */
  _prepareEquipment() {
    this.labels.armor = this.system.armor.value ? `${this.system.armor.value} ${game.i18n.localize( "SW5E.AC" )}` : "";
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data for a feat-type item and define labels.
   * @protected
   */
  _prepareFeat() {
    const act = this.system.activation;
    if ( act?.type === "legendary" ) this.labels.featType = game.i18n.localize( "SW5E.LegendaryActionLabel" );
    else if ( act?.type === "lair" ) this.labels.featType = game.i18n.localize( "SW5E.LairActionLabel" );
    else if ( act?.type ) {
      const isAttack = /\w\wak$/.test( this.system.actionType );
      this.labels.featType = game.i18n.localize( isAttack ? "SW5E.Attack" : "SW5E.Action" );
    }
    else this.labels.featType = game.i18n.localize( "SW5E.Passive" );
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data for a power-type item and define labels.
   * @protected
   */
  _preparePower() {
    const attributes = this.system?.validProperties.reduce( ( obj, k ) => {
      obj[k] = CONFIG.SW5E.itemProperties[k];
      return obj;
    }, {} );
    this.system.preparation.mode ||= "prepared";
    this.labels.level = CONFIG.SW5E.powerLevels[this.system.level];
    this.labels.school = CONFIG.SW5E.powerSchools[this.system.school]?.label;
    this.labels.components = this.system.properties.reduce( ( obj, c ) => {
      const config = attributes[c];
      if ( !config ) return obj;
      const { abbreviation: abbr, label, icon } = config;
      obj.all.push( { abbr, label, icon, tag: config.isTag } );
      if ( config.isTag ) obj.tags.push( label );
      else obj.vsm.push( abbr );
      return obj;
    },
    { all: [], vsm: [], tags: [] }
    );
    this.labels.materials = this.system?.materials?.value ?? null;
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data for a maneuver-type item and define labels.
   * @protected
   */
  _prepareManeuver() {
    this.labels.maneuverType = game.i18n.localize( CONFIG.SW5E.maneuverTypes[this.system.type.value] );
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data for a starship mod-type item and define labels.
   * @protected
   */
  _prepareStarshipMod() {
    const defaultBaseCost = CONFIG.SW5E.ssModSystemsBaseCost[this.system.type.value.toLowerCase()];
    const baseCost = this.system?.baseCost?.value ?? defaultBaseCost;
    const sizeMult = this.actor?.itemTypes?.starshipsize?.[0]?.system?.modCostMult;
    const gradeMult = Number.isNumeric( this.system.grade.value ) ? this.system.grade.value || 1 : 1;
    if ( baseCost && sizeMult && gradeMult ) this.labels.cost = game.i18n.format( "SW5E.ModFullCost", {
      cost: baseCost * sizeMult * gradeMult,
      baseCost,
      sizeMult,
      gradeMult
    } );
    else this.labels.cost = game.i18n.format( "SW5E.ModBaseCost" );

    foundry.utils.setProperty( this.system, "baseCost.default", defaultBaseCost );
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data for a weapon-type item and define labels.
   * @protected
   */
  _prepareWeapon() {
    this.labels.armor = this.system.armor.value ? `${this.system.armor.value} ${game.i18n.localize( "SW5E.AC" )}` : "";
    if ( this.system.ammo ) {
      this.system.ammo.max = this.system.getProperty?.( "reload", 0 ) || this.system.getProperty?.( "overheat", 0 );
      this.system.ammo.baseUse = 1;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare derived data and labels for items which have an action which deals damage.
   * @protected
   */
  _prepareAction() {
    if ( !( "actionType" in this.system ) ) return;
    let dmg = this.system.damage || {};
    if ( dmg.parts ) {
      const types = CONFIG.SW5E.damageTypes;
      this.labels.damage = dmg.parts
        .map( d => d[0] )
        .join( " + " )
        .replace( /\+ -/g, "- " );
      this.labels.damageTypes = dmg.parts.map( d => types[d[1]]?.label ).join( ", " );
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare recovery labels.
   * @protected
   */
  _prepareRecovery() {
    const { per } = this.system.uses ?? {};
    const config = CONFIG.SW5E.limitedUsePeriods[per] ?? {};
    this.labels.recovery = config.abbreviation ?? config.label;
  }

  /* -------------------------------------------- */

  /**
   * Prepare advancement objects from stored advancement data.
   * @protected
   */
  _prepareAdvancement() {
    const minAdvancementLevel = this.minAdvancementLevel;
    const maxLevel = this.maxAdvancementLevel;
    this.advancement = {
      byId: {},
      byLevel: Object.fromEntries(
        Array.fromRange( maxLevel, minAdvancementLevel ).map( l => [l, []] )
      ),
      byType: {},
      needingConfiguration: []
    };
    for ( const advancement of this.system.advancement ?? [] ) {
      if ( !( advancement instanceof Advancement ) ) continue;
      this.advancement.byId[advancement.id] = advancement;
      this.advancement.byType[advancement.type] ??= [];
      this.advancement.byType[advancement.type].push( advancement );
      advancement.levels.forEach( l => this.advancement.byLevel[l]?.push( advancement ) );
      if ( !advancement.levels.length
        || ( ( advancement.levels.length === 1 ) && ( advancement.levels[0] < minAdvancementLevel ) ) ) {
        this.advancement.needingConfiguration.push( advancement );
      }
    }
    Object.entries( this.advancement.byLevel ).forEach( ( [lvl, data] ) =>
      data.sort( ( a, b ) => {
        return a.sortingValueForLevel( lvl ).localeCompare( b.sortingValueForLevel( lvl ), game.i18n.lang );
      } )
    );
  }

  /* -------------------------------------------- */

  /**
   * Determine an item's proficiency level based on its parent actor's proficiencies.
   * @protected
   */
  _prepareProficiency() {
    if ( !["power", "weapon", "equipment", "tool", "feat", "consumable"].includes( this.type ) ) return;
    if ( !this.actor?.system.attributes?.prof ) {
      this.system.prof = new Proficiency( 0, 0 );
      return;
    }

    this.system.prof = new Proficiency( this.actor.system.attributes.prof, this.system.proficiencyMultiplier ?? 0 );
  }

  /* -------------------------------------------- */

  /**
   * Compute item attributes which might depend on prepared actor data. If this item is embedded this method will
   * be called after the actor's data is prepared.
   * Otherwise, it will be called at the end of `Item5e#prepareDerivedData`.
   */
  prepareFinalAttributes() {
    this.system.prepareFinalData?.();

    // Proficiency
    this._prepareProficiency();

    // Class data
    if ( this.type === "class" ) this.system.isOriginalClass = this.isOriginalClass;

    // Action usage
    if ( "actionType" in this.system ) {
      this.labels.abilityCheck = game.i18n.format( "SW5E.AbilityPromptTitle", {
        ability: CONFIG.SW5E.abilities[this.system.ability]?.label ?? ""
      } );

      // Saving throws
      this.getSaveDC();

      // To Hit
      this.getAttackToHit();

      // Damage Label
      this.getDerivedDamageLabel();
    }
  }

  /* -------------------------------------------- */

  /**
   * Populate a label with the compiled and simplified damage formula based on owned item
   * actor data. This is only used for display purposes and is not related to `Item5e#rollDamage`.
   * @returns {{damageType: string, formula: string, label: string}[]}
   */
  getDerivedDamageLabel() {
    if ( !this.hasDamage || !this.isOwned ) return [];
    const rollData = this.getRollData();
    const damageLabels = { ...CONFIG.SW5E.damageTypes, ...CONFIG.SW5E.healingTypes };
    const derivedDamage = this.system.damage?.parts?.map( ( damagePart, index ) => {
      let formula;
      try {
        formula = damagePart[0];
        if ( ( index === 0 ) && this.system.magicAvailable ) formula = `${formula} + ${this.system.magicalBonus ?? 0}`;
        const roll = new Roll( formula, rollData );
        formula = simplifyRollFormula( roll.formula, { preserveFlavor: true } );
      } catch( err ) {
        const parentInfo = this.parent ? ` on ${this.parent.name} (${this.parent.id})` : "";
        console.warn( `Unable to simplify formula for ${this.name} (${this.id})${parentInfo}`, err );
      }
      const damageType = damagePart[1];
      return { formula, damageType, label: `${formula} ${damageLabels[damageType]?.label ?? ""}` };
    } );
    return ( this.labels.derivedDamage = derivedDamage );
  }

  /* -------------------------------------------- */

  /**
   * Update the derived power DC for an item that requires a saving throw.
   * @returns {number|null}
   */
  getSaveDC() {
    if ( !this.hasSave ) return null;
    const save = this.system.save;

    // Actor power-DC based scaling
    if ( save.scaling === "power" ) {
      switch ( this.system.school ) {
        case "lgt": {
          save.dc = this.isOwned ? this.actor.system.attributes.powerForceLightDC : null;
          break;
        }
        case "uni": {
          save.dc = this.isOwned ? this.actor.system.attributes.powerForceUnivDC : null;
          break;
        }
        case "drk": {
          save.dc = this.isOwned ? this.actor.system.attributes.powerForceDarkDC : null;
          break;
        }
        case "tec": {
          save.dc = this.isOwned ? this.actor.system.attributes.powerTechDC : null;
          break;
        }
      }
    }

    // Ability-score based scaling
    else if ( save.scaling !== "flat" ) {
      save.dc = this.isOwned ? this.actor.system.abilities[save.scaling]?.dc : null;
    }

    // Update labels
    const abl = CONFIG.SW5E.abilities[save.ability]?.label ?? "";
    this.labels.save = game.i18n.format( "SW5E.SaveDC", { dc: save.dc || "", ability: abl } );
    return save.dc;
  }

  /* -------------------------------------------- */

  /**
   * Update a label to the Item detailing its total to hit bonus from the following sources:
   * - item's actor's proficiency bonus if applicable
   * - item's actor's global bonuses to the given item type
   * - item document's innate & magical attack bonuses
   * - item's ammunition if applicable
   * @returns {{rollData: object, parts: string[]}|null}  Data used in the item's Attack roll.
   */
  getAttackToHit() {
    if ( !this.hasAttack ) return null;
    const flat = this.system.attack.flat;
    const rollData = this.getRollData();

    // Use wisdom on attack rolls for starship weapons, unless an item specific ability is set
    if ( rollData && !this.system.ability && ( this.system.type?.value ?? "" ).search( "(starship)" ) !== -1 ) rollData.mod = rollData.abilities?.wis?.mod ?? 0;

    // Define Roll bonuses
    const parts = [];
    let ammo;

    if ( this.isOwned && !flat ) {
      // Ability score modifier
      if ( this.system.ability !== "none" ) parts.push( "@mod" );

      // Add proficiency bonus.
      if ( this.system.prof?.hasProficiency ) {
        parts.push( "@prof" );
        rollData.prof = this.system.prof.term;
      }

      // Actor-level global bonus to attack rolls
      const actorBonus = this.actor?.system?.bonuses?.[this.system.actionType] || {};
      if ( actorBonus.attack ) parts.push( actorBonus.attack );

      ammo = this.hasAmmo ? this.getAmmo : null;
    }

    // Include the item's innate & magical attack bonuses
    if ( this.system.attack.bonus ) parts.push( this.system.attack.bonus );
    if ( this.system.magicalBonus && this.system.magicAvailable && !flat ) parts.push( this.system.magicalBonus );

    // One-time bonus provided by consumed ammunition
    if ( ammo && !flat ) {
      const ammoItemQuantity = ammo.quantity;
      const ammoConsumeAmount = ammo.consumeAmount;
      const ammoCanBeConsumed = ammoItemQuantity && ( ammoItemQuantity - ammoConsumeAmount >= 0 );
      const ammoParts = [
        Roll.replaceFormulaData( ammo.item.system.attack.bonus, rollData ),
        ammo.system.magicAvailable ? ammo.item.system.magicalBonus : null
      ].filter( b => b );
      const ammoIsTypeConsumable = ( ammo.item.type === "consumable" ) && ( ammo.item.system.type.value === "ammo" );
      if ( ammoCanBeConsumed && ammoItemAttackBonus && ammoIsTypeConsumable ) {
        parts.push( "@ammo" );
        rollData.ammo = ammoParts.join( " + " );
      }
    }

    // Condense the resulting attack bonus formula into a simplified label
    const roll = new Roll( parts.join( "+" ), rollData );
    const formula = simplifyRollFormula( roll.formula ) || "0";
    this.labels.modifier = simplifyRollFormula( roll.formula, { deterministic: true } ) || "0";
    this.labels.toHit = !/^[+-]/.test( formula ) ? `+ ${formula}` : formula;
    return { rollData, parts };
  }

  /* -------------------------------------------- */

  /**
   * Retrieve an item's number of bonus dice on a critical hit. Uses the sum of the extra damage from the
   * following sources:
   * - item's brutal property
   * - actor flags
   *
   * @returns {number|null}  The extra dice of damage dealt on a critical hit.
   */

  getCriticalExtraDice() {
    const itemData = this.system;
    if ( !this.hasAttack || !itemData ) return;

    let dice = 0;

    // Get the actor's extra damage
    if ( itemData.actionType === "mwak" ) dice += this.actor.getFlag( "sw5e", "meleeCriticalDamageDice" ) ?? 0;
    // TODO: Maybe add flags for the other attack types?

    // Get the item's extra damage
    dice += itemData.getProperty?.( "bru", 0 ) ?? 0;

    return dice;
  }

  /* -------------------------------------------- */

  /**
   * Replace referenced data attributes in the roll formula with values from the provided data.
   * If the attribute is not found in the provided data, display a warning on the actor.
   * @param {string} formula           The original formula within which to replace.
   * @param {object} data              The data object which provides replacements.
   * @param {object} options
   * @param {string} options.property  Name of the property to which this formula belongs.
   * @returns {string}                 Formula with replaced data.
   * @deprecated since SW5e 3.2, available until SW5e 3.4
   */
  replaceFormulaData( formula, data, { property } ) {
    foundry.utils.logCompatibilityWarning(
      "Item5e#replaceFormulaData has been moved to sw5e.utils.replaceFormulaData.",
      { since: "SW5e 3.2", until: "SW5e 3.4" }
    );
    return sw5e.utils.replaceFormulaData( formula, data, { actor: this.actor, property } );
  }

  /* -------------------------------------------- */

  /**
   * Render a rich tooltip for this item.
   * @param {EnrichmentOptions} [enrichmentOptions={}]  Options for text enrichment.
   * @returns {Promise<{content: string, classes: string[]}>|null}
   */
  richTooltip( enrichmentOptions = {} ) {
    return this.system.richTooltip?.() ?? null;
  }

  /* -------------------------------------------- */

  /**
   * Configuration data for an item usage being prepared.
   *
   * @typedef {object} ItemUseConfiguration
   * @property {boolean} createMeasuredTemplate     Should this item create a template?
   * @property {boolean} createSummons              Should this item create a summoned creature?
   * @property {boolean} consumeResource            Should this item consume a (non-ammo) resource?
   * @property {boolean} consumePowerSlot           Should this item (a power) consume a power slot?
   * @property {boolean} consumeAmmo                Should this item consume ammo?
   * @property {boolean} consumeSuperiorityDie      Should this item consume a superiority die?
   * @property {boolean} consumeUsage               Should this item consume its limited uses or recharge?
   * @property {string} enchantmentProfile          ID of the enchantment to apply.
   * @property {boolean} promptEnchantment          Does an enchantment profile need to be selected?
   * @property {string|number|null} slotLevel       The power slot type or level to consume by default.
   * @property {string|null} summonsProfile         ID of the summoning profile to use.
   * @property {number|null} resourceAmount         The amount to consume by default when scaling with consumption.
   * @property {boolean} beginConcentrating         Should this item initiate concentration?
   * @property {string|null} endConcentration       The id of the active effect to end concentration on, if any.
   */

  /**
   * Additional options used for configuring item usage.
   *
   * @typedef {object} ItemUseOptions
   * @property {boolean} configureDialog  Display a configuration dialog for the item usage, if applicable?
   * @property {string} rollMode          The roll display mode with which to display (or not) the card.
   * @property {boolean} createMessage    Whether to automatically create a chat message (if true) or simply return
   *                                      the prepared chat message data (if false).
   * @property {object} flags             Additional flags added to the chat message.
   * @property {Event} event              The browser event which triggered the item usage, if any.
   */

  /**
   * Trigger an item usage, optionally creating a chat message with followup actions.
   * @param {ItemUseConfiguration} [config]      Initial configuration data for the usage.
   * @param {ItemUseOptions} [options]           Options used for configuring item usage.
   * @returns {Promise<ChatMessage|object|void>} Chat message if options.createMessage is true, message data if it is
   *                                             false, and nothing if the roll wasn't performed.
   */
  async use( config = {}, options = {} ) {
    if ( !this.isOwner ) {
      ui.notifications.error( "SW5E.DocumentUseWarn", { localize: true } );
      return null;
    }
    let item = this;
    const is = item.system;
    // Const actor = this.actor;
    const as = item.actor.system;
    // Const starship = actor.getStarship();

    // Ensure the options object is ready
    options = foundry.utils.mergeObject(
      {
        configureDialog: true,
        createMessage: true,
        "flags.sw5e.use": { type: this.type, itemId: this.id, itemUuid: this.uuid }
      },
      options
    );

    // Define follow-up actions resulting from the item usage
    if ( config.consumeSlotLevel ) {
      console.warn( "You are passing 'consumeSlotLevel' to the ItemUseConfiguration object, which now expects a key as 'slotLevel'." );
      config.slotLevel = config.consumeSlotLevel;
      delete config.consumeSlotLevel;
    }
    config = foundry.utils.mergeObject( this._getUsageConfig(), config );

    /**
     * A hook event that fires before an item usage is configured.
     * @function sw5e.preUseItem
     * @memberof hookEvents
     * @param {Item5e} item                  Item being used.
     * @param {ItemUseConfiguration} config  Configuration data for the item usage being prepared.
     * @param {ItemUseOptions} options       Additional options used for configuring item usage.
     * @returns {boolean}                    Explicitly return `false` to prevent item from being used.
     */
    if ( Hooks.call( "sw5e.preUseItem", item, config, options ) === false ) return;

    // Are any default values necessitating a prompt?
    const needsConfiguration = Object.values( config ).includes( true );

    // Display configuration dialog
    if ( options.configureDialog !== false && needsConfiguration ) {
      const configuration = await AbilityUseDialog.create( item, config );
      if ( !configuration ) return;
      foundry.utils.mergeObject( config, configuration );
    }

    // Store selected enchantment profile in flag
    if ( config.enchantmentProfile ) {
      foundry.utils.setProperty( options.flags, "sw5e.use.enchantmentProfile", config.enchantmentProfile );
    }

    // Handle upcasting
    if ( item.type === "power" ) {
      let level = null;
      if ( config.resourceAmount in as.powers ) config.slotLevel = config.resourceAmount;
      if ( config.slotLevel ) {
        // A power slot was consumed.
        if ( Number.isInteger( config.slotLevel ) ) level = config.slotLevel;
        else if ( config.slotLevel in as.powers ) {
          if ( /^power([0-9]+)$/.test( config.slotLevel ) ) level = parseInt( config.slotLevel.replace( "power", "" ) );
          else level = as.powers[config.slotLevel].level;
        }
      } else if ( config.resourceAmount ) {
        // A quantity of the resource was consumed.
        const diff = config.resourceAmount - ( this.system.consume.amount || 1 );
        level = is.level + diff;
      }
      if ( level && ( level !== is.level ) ) {
        item = item.clone( { "system.level": level }, { keepId: true } );
        item.prepareData();
        item.prepareFinalAttributes();
      }
    }
    if ( item.type === "power" ) foundry.utils.mergeObject( options.flags, { "sw5e.use.powerLevel": item.system.level } );

    // Calculate and consume item consumption
    if ( await this.consume( item, config, options ) === false ) return;

    // Initiate or end concentration.
    const effects = [];
    if ( config.beginConcentrating ) {
      const effect = await item.actor.beginConcentrating( item );
      if ( effect ) {
        effects.push( effect );
        foundry.utils.setProperty( options.flags, "sw5e.use.concentrationId", effect.id );
      }
      if ( config.endConcentration ) {
        const deleted = await item.actor.endConcentration( config.endConcentration );
        effects.push( ...deleted );
      }
    }

    // Prepare card data & display it if options.createMessage is true
    const cardData = await item.displayCard( options );

    // Initiate measured template creation
    let templates;
    if ( config.createMeasuredTemplate ) {
      try {
        templates = await sw5e.canvas.AbilityTemplate.fromItem( item )?.drawPreview();
      } catch( err ) {
        Hooks.onError( "Item5e#use", err, {
          msg: game.i18n.localize( "SW5E.PlaceTemplateError" ),
          log: "error",
          notify: "error"
        } );
      }
    }

    // Initiate summons creation
    let summoned;
    if ( config.createSummons ) {
      try {
        summoned = await item.system.summons.summon( config.summonsProfile, config.summonsOptions );
      } catch( err ) {
        Hooks.onError( "Item5e#use", err, { log: "error", notify: "error" } );
      }
    }

    /**
     * A hook event that fires when an item is used, after the measured template has been created if one is needed.
     * @function sw5e.useItem
     * @memberof hookEvents
     * @param {Item5e} item                                Item being used.
     * @param {ItemUseConfiguration} config                Configuration data for the roll.
     * @param {ItemUseOptions} options                     Additional options for configuring item usage.
     * @param {MeasuredTemplateDocument[]|null} templates  The measured templates if they were created.
     * @param {ActiveEffect5e[]} effects                   The active effects that were created or deleted.
     * @param {TokenDocument5e[]|null} summoned            Summoned tokens if they were created.
     */
    Hooks.callAll( "sw5e.useItem", item, config, options, templates ?? null, effects, summoned ?? null );

    return cardData;
  }

  /* -------------------------------------------- */

  /**
   * Handle item's consumption.
   * @param {Item5e} item  Item or clone to use when calculating updates.
   * @param {ItemUseConfiguration} config  Configuration data for the item usage being prepared.
   * @param {ItemUseOptions} options       Additional options used for configuring item usage.
   * @returns {false|void}                 Returns `false` if any further usage should be canceled.
   */
  async consume( item, config, options ) {
    /**
     * A hook event that fires before an item's resource consumption has been calculated.
     * @function sw5e.preItemUsageConsumption
     * @memberof hookEvents
     * @param {Item5e} item                  Item being used.
     * @param {ItemUseConfiguration} config  Configuration data for the item usage being prepared.
     * @param {ItemUseOptions} options       Additional options used for configuring item usage.
     * @returns {boolean}                    Explicitly return `false` to prevent item from being used.
     */
    if ( Hooks.call( "sw5e.preItemUsageConsumption", item, config, options ) === false ) return false;

    // Determine whether the item can be used by testing the chosen values of the config.
    const usage = item._getUsageUpdates( config );
    if ( !usage ) return false;

    options.flags ??= {};
    if ( config.consumeUsage ) foundry.utils.setProperty( options.flags, "sw5e.use.consumedUsage", true );
    if ( config.consumeResource ) foundry.utils.setProperty( options.flags, "sw5e.use.consumedResource", true );
    if ( config.consumePowerSlot ) foundry.utils.setProperty( options.flags, "sw5e.use.consumedPowerSlot", true );

    /**
     * A hook event that fires after an item's resource consumption has been calculated but before any
     * changes have been made.
     * @function sw5e.itemUsageConsumption
     * @memberof hookEvents
     * @param {Item5e} item                     Item being used.
     * @param {ItemUseConfiguration} config     Configuration data for the item usage being prepared.
     * @param {ItemUseOptions} options          Additional options used for configuring item usage.
     * @param {object} usage
     * @param {object} usage.actorUpdates       Updates that will be applied to the actor.
     * @param {object} usage.itemUpdates        Updates that will be applied to the item being used.
     * @param {object[]} usage.resourceUpdates  Updates that will be applied to other items on the actor.
     * @param {Set<string>} usage.deleteIds     Item ids for those which consumption will delete.
     * @returns {boolean}                       Explicitly return `false` to prevent item from being used.
     */
    if ( Hooks.call( "sw5e.itemUsageConsumption", item, config, options, usage ) === false ) return false;

    // Commit pending data updates
    const { actorUpdates, itemUpdates, resourceUpdates, starshipUpdates, deleteIds } = usage;
    if ( !foundry.utils.isEmpty( itemUpdates ) ) await item.update( itemUpdates );
    if ( !foundry.utils.isEmpty( deleteIds ) ) await this.actor.deleteEmbeddedDocuments( "Item", [...deleteIds] );
    if ( !foundry.utils.isEmpty( actorUpdates ) ) await this.actor.update( actorUpdates );
    const starship = this.actor.getStarship();
    if ( starship && !foundry.utils.isEmpty( starshipUpdates ) ) await starship.update( starshipUpdates );
    if ( !foundry.utils.isEmpty( resourceUpdates ) ) await this.actor.updateEmbeddedDocuments( "Item", resourceUpdates );
  }

  /* -------------------------------------------- */

  /**
   * Prepare an object of possible and default values for item usage. A value that is `null` is ignored entirely.
   * @returns {ItemUseConfiguration}  Configuration data for the roll.
   */
  _getUsageConfig() {
    const { consume, uses, summons, target, level } = this.system;

    const config = {
      createMeasuredTemplate: null,
      createSummons: null,
      consumeResource: null,
      consumePowerSlot: null,
      consumePowerPoints: null,
      consumeUsage: null,
      enchantmentProfile: null,
      promptEnchantment: null,
      slotLevel: null,
      summonsProfile: null,
      resourceAmount: null,
      beginConcentrating: null,
      endConcentration: null,
      consumeAmmo: null,
      consumeSuperiorityDie: null
    };

    const scaling = this.usageScaling;
    if ( scaling === "slot" ) {
      const powers = this.actor.system.powers ?? {};
      config.consumePowerSlot = true;
      config.consumePowerPoints = true;
      config.slotLevel = ( preparation?.mode in powers ) ? preparation.mode : `power${level}`;
    } else if ( scaling === "resource" ) {
      config.resourceAmount = consume.amount || 1;
    }
    if ( this.hasLimitedUses ) config.consumeUsage = uses.prompt;
    if ( this.hasResource ) {
      config.consumeResource = true;
      // Do not suggest consuming your own uses if also consuming them through resources.
      if ( consume.target === this.id ) config.consumeUsage = null;
    }
    // For attacks, the ammo is consumed on the attack roll
    if ( this.hasAmmo && !( this.system.actionType in CONFIG.SW5E.itemActionTypesAttack ) ) {
      config.consumeAmmo = true;
    }
    if ( this.type === "maneuver" ) config.consumeSuperiorityDie = true;
    if ( game.user.can( "TEMPLATE_CREATE" ) && this.hasAreaTarget && canvas.scene ) {
      config.createMeasuredTemplate = target.prompt;
    }
    if ( this.system.isEnchantment ) {
      const availableEnchantments = EnchantmentData.availableEnchantments( this );
      config.promptEnchantment = availableEnchantments.length > 1;
      config.enchantmentProfile = availableEnchantments[0]?.id;
    }
    if ( this.system.hasSummoning && this.system.summons.canSummon && canvas.scene ) {
      config.createSummons = summons.prompt;
      config.summonsProfile = this.system.summons.profiles[0]._id;
    }
    if ( this.requiresConcentration && !game.settings.get( "sw5e", "disableConcentration" ) ) {
      config.beginConcentrating = true;
      const { effects } = this.actor.concentration;
      const limit = this.actor.system.attributes?.concentration?.limit ?? 0;
      if ( limit && ( limit <= effects.size ) ) {
        const id = effects.find( e => {
          const data = e.flags.sw5e?.itemData ?? {};
          return ( data === this.id ) || ( data._id === this.id );
        } )?.id ?? effects.first()?.id ?? null;
        config.endConcentration = id;
      }
    }

    return config;
  }

  /* -------------------------------------------- */

  /**
   * Verify that the consumed resources used by an Item are available and prepare the updates that should
   * be performed. If required resources are not available, display an error and return false.
   * @param {ItemUseConfiguration} config  Configuration data for an item usage being prepared.
   * @returns {object|boolean}             A set of data changes to apply when the item is used, or false.
   * @protected
   */
  _getUsageUpdates( config ) {
    // Reference item system data
    const is = this.system;
    const actorUpdates = {};
    const itemUpdates = {};
    const resourceUpdates = [];
    const starshipUpdates = {};
    const deleteIds = new Set();

    // Consume own limited uses or recharge
    if ( config.consumeUsage ) {
      const canConsume = this._handleConsumeUses( itemUpdates, actorUpdates, resourceUpdates, starshipUpdates, deleteIds );
      if ( canConsume === false ) return false;
    }

    // Consume Weapon Ammo
    if ( config.consumeAmmo ) {
      if ( !this.hasAmmo ) {
        ui.notifications.warn( game.i18n.format( "SW5E.ConsumeWarningNoSource", { name: this.name, type: "ammo" } ) );
        return false;
      }
      const ammo = this.getAmmo;
      const remaining = ammo.quantity - ammo.consumeAmount;
      if ( is.hasReload ) {
        if ( remaining < 0 ) {
          if ( is.properties.has( "rel" ) ) ui.notifications.warn( game.i18n.format( "SW5E.ItemReloadNeeded", { name: this.name } ) );
          else if ( is.properties.has( "ovr" ) ) ui.notifications.warn( game.i18n.format( "SW5E.ItemCoolDownNeeded", { name: this.name } ) );
          return false;
        } else itemUpdates["system.ammo.value"] = remaining;
      } else {
        const consume = is.consume;
        const typeLabel = CONFIG.SW5E.abilityConsumptionTypes[consume.type];
        if ( remaining < 0 ) {
          if ( !ammo.item ) ui.notifications.warn( game.i18n.format( "SW5E.ConsumeWarningNoSource", { name: this.name, type: typeLabel } ) );
          else ui.notifications.warn( game.i18n.format( "SW5E.ConsumeWarningNoQuantity", { name: this.name, type: typeLabel } ) );
          return false;
        } else resourceUpdates.push( { _id: consume.target, "system.quantity": remaining } );
      }
    }

    // Consume Limited Resource
    if ( config.consumeResource ) {
      const canConsume = this._handleConsumeResource( config, itemUpdates, actorUpdates, resourceUpdates, starshipUpdates, deleteIds );
      if ( canConsume === false ) return false;
    }

    // Consume Power Slots and Power Points
    if ( config.consumePowerSlot || config.consumePowerPoints ) {
      const powerData = this.actor?.system.powers ?? {};
      const levelNumber = Number( config.slotLevel.substring( 5 ) );
      const level = powerData[config.slotLevel];
      const powerType = ( this.system.school in CONFIG.SW5E.powerSchoolsForce ) ? "force" : "tech";
      const pAbbr = powerType.substring( 0, 1 );
      const maxSlots = Number( level?.[`${pAbbr}max`] ?? 0 );
      const infSlots = maxSlots === 1000;
      const slots = infSlots ? 1000 : Number( level?.[`${pAbbr}value`] ?? 0 );
      const points = this.actor?.system?.attributes?.[powerType]?.points ?? 0;
      const discount = this.actor?.getFlag( "sw5e", `${powerType}PowerDiscount` ) ?? 0;
      const cost = Math.max( levelNumber + 1 - discount, 1 );
      if ( config.consumePowerSlot && ( slots === 0 ) ) {
        const label = game.i18n.localize( `SW5E.PowerLevel${this.system.level}` );
        ui.notifications.warn( game.i18n.format( "SW5E.PowerCastNoSlots", { name: this.name, level: label } ) );
        return false;
      }
      if ( config.consumePowerPoints && ( ( points.value + points.temp ) < cost ) ) {
        ui.notifications.warn( game.i18n.format( "SW5E.PowerCastNoPoints", { name: this.name, type: powerType } ) );
        return false;
      }
      if ( config.consumePowerSlot && !infSlots ) actorUpdates[`system.powers.${config.slotLevel}.${pAbbr}value`] = Math.max( slots - 1, 0 );
      if ( config.consumePowerPoints ) {
        if ( points.temp >= cost ) {
          actorUpdates[`system.attributes.${powerType}.points.temp`] = points.temp - cost;
        } else {
          actorUpdates[`system.attributes.${powerType}.points.value`] = points.value + points.temp - cost;
          actorUpdates[`system.attributes.${powerType}.points.temp`] = 0;
        }
      }
    }

    // Consume Superiority Die
    if ( config.consumeSuperiorityDie ) {
      const curDice = this.actor?.system?.attributes?.super?.dice?.value;
      if ( !curDice ) return false;
      actorUpdates["system.attributes.super.dice.value"] = curDice - 1;
    }

    // Determine whether the item can be used by testing for available concentration.
    if ( config.beginConcentrating ) {
      const { effects } = this.actor.concentration;

      // Case 1: Replacing.
      if ( config.endConcentration ) {
        const replacedEffect = effects.find( i => i.id === config.endConcentration );
        if ( !replacedEffect ) {
          ui.notifications.warn( "SW5E.ConcentratingMissingItem", { localize: true } );
          return false;
        }
      }

      // Case 2: Starting concentration, but at limit.
      else if ( effects.size >= this.actor.system.attributes.concentration.limit ) {
        ui.notifications.warn( "SW5E.ConcentratingLimited", { localize: true } );
        return false;
      }
    }

    // Return the configured usage
    return { itemUpdates, actorUpdates, resourceUpdates, starshipUpdates, deleteIds };
  }

  /* -------------------------------------------- */

  /**
   * Handle update actions required when consuming an item's uses or recharge
   * @param {object} itemUpdates        An object of data updates applied to this item
   * @param {object} actorUpdates       An object of data updates applied to the item owner (Actor)
   * @param {object[]} resourceUpdates  An array of updates to apply to other items owned by the actor
   * @param {object} starshipUpdates    An object of data updates applied to the starship the item owner (Actor) is deployed to
   * @param {Set<string>} deleteIds     A set of item ids that will be deleted off the actor
   * @returns {boolean|void}            Return false to block further progress, or return nothing to continue
   * @protected
   */
  _handleConsumeUses( itemUpdates, actorUpdates, resourceUpdates, starshipUpdates, deleteIds ) {
    const recharge = this.system.recharge || {};
    const uses = this.system.uses || {};
    const quantity = this.system.quantity ?? 1;
    let used = false;

    // Consume recharge.
    if ( recharge.value ) {
      if ( recharge.charged ) {
        itemUpdates["system.recharge.charged"] = false;
        used = true;
      }
    }

    // Consume uses (or quantity).
    else if ( uses.max && uses.per && ( uses.value > 0 ) ) {
      const remaining = Math.max( uses.value - 1, 0 );

      if ( remaining > 0 || ( !remaining && !uses.autoDestroy ) ) {
        used = true;
        itemUpdates["system.uses.value"] = remaining;
      } else if ( quantity >= 2 ) {
        used = true;
        itemUpdates["system.quantity"] = quantity - 1;
        itemUpdates["system.uses.value"] = uses.max;
      } else if ( quantity === 1 ) {
        used = true;
        deleteIds.add( this.id );
      }
    }

    // If the item was not used, return a warning
    if ( !used ) {
      ui.notifications.warn( game.i18n.format( "SW5E.ItemNoUses", { name: this.name } ) );
      return false;
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle update actions required when consuming an external resource
   * @param {ItemUseConfiguration} usageConfig  Configuration data for an item usage being prepared.
   * @param {object} itemUpdates                An object of data updates applied to this item
   * @param {object} actorUpdates               An object of data updates applied to the item owner (Actor)
   * @param {object[]} resourceUpdates          An array of updates to apply to other items owned by the actor
   * @param {object} starshipUpdates            An object of data updates applied to the starship the item owner (Actor) is deployed to
   * @param {Set<string>} deleteIds             A set of item ids that will be deleted off the actor
   * @returns {boolean|void}                    Return false to block further progress, or return nothing to continue
   * @protected
   */
  _handleConsumeResource( usageConfig, itemUpdates, actorUpdates, resourceUpdates, starshipUpdates, deleteIds ) {
    const actor = this.actor;
    const starship = actor.getStarship();
    const itemSystemdata = this.system;
    const consume = itemSystemdata.consume || {};
    if ( !consume.type ) return;

    // No consumed target
    const typeLabel = CONFIG.SW5E.abilityConsumptionTypes[consume.type];
    if ( !consume.target ) {
      ui.notifications.warn( game.i18n.format( "SW5E.ConsumeWarningNoResource", { name: this.name, type: typeLabel } ) );
      return false;
    }

    const as = actor.system;
    // Identify the consumed resource and its current quantity
    let resource = null;
    let amount = usageConfig.resourceAmount ? usageConfig.resourceAmount : ( consume.amount || 0 );
    if ( as.powers && ( amount in as.powers ) ) amount = consume.amount || 0;
    let quantity = 0;
    switch ( consume.type ) {
      case "attribute":
        const amt = usageConfig.resourceAmount;
        const target = as.powers && ( amt in as.powers ) ? `powers.${amt}.value` : consume.target;
        resource = foundry.utils.getProperty?.( as, target );
        quantity = resource || 0;
        break;
      case "ammo":
      case "material":
        resource = actor.items.get( consume.target );
        quantity = resource ? resource.system.quantity : 0;
        break;
      case "hitDice":
        const denom = !["smallest", "largest"].includes( consume.target ) ? consume.target : false;
        resource = Object.values( actor.classes ).filter( cls => !denom || cls.system.hitDice === denom );
        quantity = resource.reduce( ( count, cls ) => count + cls.system.levels - cls.system.hitDiceUsed, 0 );
        break;
      case "charges":
        resource = actor.items.get( consume.target );
        if ( !resource ) break;
        const uses = resource.system.uses;
        if ( uses.per && uses.max ) quantity = uses.value;
        else if ( resource.system.recharge?.value ) {
          quantity = resource.system.recharge.charged ? 1 : 0;
          amount = 1;
        }
        break;
      case "powerdice":
        if ( !starship ) {
          ui.notifications.warn(
            game.i18n.format( "SW5E.ConsumeWarningNotDeployed", { name: this.name, actor: actor.name } )
          );
          return false;
        }
        resource = foundry.utils.getProperty?.( starship.system, consume.target );
        quantity = resource || 0;
        break;
    }

    // Verify that a consumed resource is available
    if ( resource === undefined ) {
      ui.notifications.warn( game.i18n.format( "SW5E.ConsumeWarningNoSource", { name: this.name, type: typeLabel } ) );
      return false;
    }

    // Verify that the required quantity is available
    let remaining = quantity - amount;
    if ( remaining < 0 && consume.type === "powerdice" ) {
      consume.target = "attributes.power.central.value";
      resource = foundry.utils.getProperty?.( starship.system, consume.target );
      quantity = resource || 0;
      remaining = quantity - amount;
    }
    if ( remaining < 0 ) {
      ui.notifications.warn( game.i18n.format( "SW5E.ConsumeWarningNoQuantity", { name: this.name, type: typeLabel } ) );
      return false;
    }

    // Define updates to provided data objects
    switch ( consume.type ) {
      case "attribute":
        const amt = usageConfig.resourceAmount;
        const target = ( amt in as.powers ) ? `powers.${amt}.value` : consume.target;
        actorUpdates[`system.${target}`] = remaining;
        break;
      case "ammo":
      case "material":
        resourceUpdates.push( { _id: consume.target, "system.quantity": remaining } );
        break;
      case "hitDice":
        if ( ["smallest", "largest"].includes( consume.target ) ) resource = resource.sort( ( lhs, rhs ) => {
          let sort = lhs.system.hitDice.localeCompare( rhs.system.hitDice, "en", { numeric: true } );
          if ( consume.target === "largest" ) sort *= -1;
          return sort;
        } );
        let toConsume = amount;
        for ( const cls of resource ) {
          const cs = cls.system;
          const available = ( toConsume > 0 ? cs.levels : 0 ) - cs.hitDiceUsed;
          const delta = toConsume > 0 ? Math.min( toConsume, available ) : Math.max( toConsume, available );
          if ( delta !== 0 ) {
            resourceUpdates.push( { _id: cls.id, "system.hitDiceUsed": cs.hitDiceUsed + delta } );
            toConsume -= delta;
            if ( toConsume === 0 ) break;
          }
        }
        break;
      case "charges":
        const uses = resource.system.uses || {};
        const recharge = resource.system.recharge || {};
        const update = { _id: consume.target };
        // Reduce quantity of, or delete, the external resource.
        if ( uses.per && uses.max && uses.autoDestroy && ( remaining === 0 ) ) {
          update["system.quantity"] = Math.max( resource.system.quantity - 1, 0 );
          update["system.uses.value"] = uses.max ?? 1;
          if ( update["system.quantity"] === 0 ) deleteIds.add( resource.id );
          else resourceUpdates.push( update );
          break;
        }

        // Regular consumption.
        if ( uses.per && uses.max ) update["system.uses.value"] = remaining;
        else if ( recharge.value ) update["system.recharge.charged"] = false;
        resourceUpdates.push( update );
        break;
      case "powerdice":
        starshipUpdates[`system.${consume.target}`] = remaining;
        break;
    }
  }

  /* -------------------------------------------- */

  /**
   * Display the chat card for an Item as a Chat Message
   * @param {ItemUseOptions} [options]  Options which configure the display of the item chat card.
   * @returns {ChatMessage|object}      Chat message if `createMessage` is true, otherwise an object containing
   *                                    message data.
   */
  async displayCard( options = {} ) {

    // Render the chat card template
    const token = this.actor.token;
    const consumeUsage = this.hasLimitedUses && !options.flags?.sw5e?.use?.consumedUsage;
    const consumeResource = this.hasResource && !options.flags?.sw5e?.use?.consumedResource;
    const hasButtons = this.hasAttack || this.hasDamage || this.isVersatile || this.hasSave || this.system.formula
      || this.hasAreaTarget || ( this.type === "tool" ) || this.hasAbilityCheck || this.system.hasSummoning
      || consumeUsage || consumeResource;
    const templateData = {
      hasButtons,
      actor: this.actor,
      config: CONFIG.SW5E,
      tokenId: token?.uuid || null,
      item: this,
      effects: this.effects.filter( e => ( e.getFlag( "sw5e", "type" ) !== "enchantment" ) && !e.getFlag( "sw5e", "rider" ) ),
      data: await this.system.getCardData(),
      labels: this.labels,
      hasAttack: this.hasAttack,
      isHealing: this.isHealing,
      hasDamage: this.hasDamage,
      isVersatile: this.isVersatile,
      isPower: this.type === "power",
      hasSave: this.hasSave,
      hasAreaTarget: this.hasAreaTarget,
      isTool: this.type === "tool",
      hasAbilityCheck: this.hasAbilityCheck,
      consumeUsage,
      consumeResource
    };
    const html = await renderTemplate( "systems/sw5e/templates/chat/item-card.hbs", templateData );

    // Create the ChatMessage data object
    const chatData = {
      user: game.user.id,
      content: html,
      speaker: ChatMessage.getSpeaker( { actor: this.actor, token } ),
      flags: { "core.canPopout": true }
    };
    // TODO: Remove when v11 support is dropped.
    if ( game.release.generation < 12 ) chatData.type = CONST.CHAT_MESSAGE_TYPES.OTHER;

    // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
    if ( this.type === "consumable" && !this.actor.items.has( this.id ) ) {
      chatData.flags["sw5e.itemData"] = templateData.item.toObject();
    }

    // Merge in the flags from options
    chatData.flags = foundry.utils.mergeObject( chatData.flags, options.flags );

    /**
     * A hook event that fires before an item chat card is created.
     * @function sw5e.preDisplayCard
     * @memberof hookEvents
     * @param {Item5e} item             Item for which the chat card is being displayed.
     * @param {object} chatData         Data used to create the chat message.
     * @param {ItemUseOptions} options  Options which configure the display of the item chat card.
     */
    Hooks.callAll( "sw5e.preDisplayCard", this, chatData, options );

    // Apply the roll mode to adjust message visibility
    ChatMessage.applyRollMode( chatData, options.rollMode ?? game.settings.get( "core", "rollMode" ) );

    // Create the Chat Message or return its data
    const card = options.createMessage !== false ? await ChatMessage.create( chatData ) : chatData;

    /**
     * A hook event that fires after an item chat card is created.
     * @function sw5e.displayCard
     * @memberof hookEvents
     * @param {Item5e} item              Item for which the chat card is being displayed.
     * @param {ChatMessage|object} card  The created ChatMessage instance or ChatMessageData depending on whether
     *                                   options.createMessage was set to `true`.
     */
    Hooks.callAll( "sw5e.displayCard", this, card );

    return card;
  }

  /* -------------------------------------------- */
  /*  Chat Cards                                  */
  /* -------------------------------------------- */

  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log.
   * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
   * @returns {object}              An object of chat data to render.
   */
  async getChatData( htmlOptions = {} ) {
    const data = this.toObject().system;

    // Rich text description
    data.description.value = await TextEditor.enrichHTML( data.description.value, {
      async: true,
      relativeTo: this,
      rollData: this.getRollData(),
      ...htmlOptions
    } );

    // Type specific properties
    data.properties = [
      ...( this.system.chatProperties ?? [] ),
      ...( this.system.equippableItemCardProperties ?? [] ),
      ...( this.system.activatedEffectCardProperties ?? [] )
    ].filter( p => p );

    return data;
  }

  /* -------------------------------------------- */
  /*  Item Rolls - Attack, Damage, Saves, Checks  */
  /* -------------------------------------------- */

  /**
   * Place an attack roll using an item (weapon, feat, power, or equipment)
   * Rely upon the d20Roll logic for the core implementation
   *
   * @param {D20RollConfiguration} options  Roll options which are configured and provided to the d20Roll function
   * @returns {Promise<D20Roll|null>}       A Promise which resolves to the created Roll instance
   */
  async rollAttack( options = {} ) {
    const flags = this.actor.flags.sw5e ?? {};
    const target = [...game.user?.targets ?? []][0]?.actor;
    if ( !this.hasAttack ) throw new Error( "You may not place an Attack Roll with this Item." );
    let title = `${this.name} - ${game.i18n.localize( "SW5E.AttackRoll" )}`;

    // Get the parts and rollData for this item's attack
    const { parts, rollData } = this.getAttackToHit();
    if ( options.powerLevel ) rollData.item.level = options.powerLevel;

    // Handle ammunition consumption
    let ammoUpdate = [];
    let itemUpdate = {};

    if ( this.hasAmmo ) {
      const ammo = this.getAmmo;
      // Get pending ammunition update
      const usage = this._getUsageUpdates( { consumeAmmo: true } );
      if ( usage === false ) return null;

      if ( ammo?.item ) title += ` [${ammo.item.name}]`;
      ammoUpdate = usage.resourceUpdates ?? [];
      itemUpdate = usage.itemUpdates ?? [];
    }

    // Flags
    const elvenAccuracy = !!this.actor?._getCharacterFlag( "elvenAccuracy", this.abilityMod );

    const grantsAdvantageFlag = target?._getCharacterFlag( [
      "grants.advantage.attack.all",
      `grants.advantage.attack.${this.system.actionType}`
    ], { situational: true } );
    const grantsAdvantageHint = target?._getCharacterFlagTooltip( grantsAdvantageFlag );
    const advantageFlag = grantsAdvantageFlag || this.actor?._getCharacterFlag( [
      "advantage.all",
      "advantage.attack.all",
      `advantage.attack.${this.abilityMod}`,
      `advantage.attack.${this.system.actionType}`
    ], { situational: true } );
    const advantage = !!( advantageFlag || options.advantage );
    const advantageHint = grantsAdvantageHint || this.actor?._getCharacterFlagTooltip( advantageFlag );

    const disadvantageFlag = this.actor?._getCharacterFlag( [
      "disadvantage.all",
      "disadvantage.ability.save.all",
      `disadvantage.attack.${this.abilityMod}`,
      `disadvantage.attack.${this.system.actionType}`
    ], { situational: true } );
    const disadvantage = !!( disadvantageFlag || options.disadvantage );
    const disadvantageHint = this.actor?._getCharacterFlagTooltip( disadvantageFlag );

    // Compose roll options
    const rollConfig = foundry.utils.mergeObject(
      {
        actor: this.actor,
        data: rollData,
        critical: this.criticalThreshold,
        title,
        flavor: title,
        elvenAccuracy,
        halflingLucky: flags.halflingLucky,
        advantageHint,
        disadvantageHint,
        dialogOptions: {
          width: 400,
          top: options.event ? options.event.clientY - 80 : null,
          left: window.innerWidth - 710
        },
        messageData: {
          "flags.sw5e": {
            targets: this.constructor._formatAttackTargets(),
            roll: { type: "attack", itemId: this.id, itemUuid: this.uuid }
          },
          speaker: ChatMessage.getSpeaker( { actor: this.actor } )
        }
      },
      options
    );
    rollConfig.parts = parts.concat( options.parts ?? [] );
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before an attack is rolled for an Item.
     * @function sw5e.preRollAttack
     * @memberof hookEvents
     * @param {Item5e} item                  Item for which the roll is being performed.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @returns {boolean}                    Explicitly return false to prevent the roll from being performed.
     */
    if ( Hooks.call( "sw5e.preRollAttack", this, rollConfig ) === false ) return;

    const roll = await d20Roll( rollConfig );
    if ( roll === null ) return null;

    /**
     * A hook event that fires after an attack has been rolled for an Item.
     * @function sw5e.rollAttack
     * @memberof hookEvents
     * @param {Item5e} item          Item for which the roll was performed.
     * @param {D20Roll} roll         The resulting roll.
     * @param {object[]} ammoUpdate  Updates that will be applied to ammo Items as a result of this attack.
     * @param {object[]} itemUpdate  Updates that will be applied to the weapon as a result of this attack.
     */
    Hooks.callAll( "sw5e.rollAttack", this, roll, ammoUpdate, itemUpdate );

    // Commit ammunition consumption on attack rolls resource consumption if the attack roll was made
    if ( ammoUpdate.length ) await this.actor?.updateEmbeddedDocuments( "Item", ammoUpdate );
    if ( !foundry.utils.isEmpty( itemUpdate ) ) await this.update( itemUpdate );
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * @typedef {object} TargetDescriptor5e
   * @property {string} uuid  The UUID of the target.
   * @property {string} img   The target's image.
   * @property {string} name  The target's name.
   * @property {number} ac    The target's armor class.
   */

  /**
   * Extract salient information about targeted Actors.
   * @returns {TargetDescriptor5e[]}
   * @protected
   */
  static _formatAttackTargets() {
    const targets = new Map();
    for ( const token of game.user.targets ) {
      const { name, img, system, uuid } = token.actor ?? {};
      const ac = system?.attributes?.ac ?? {};
      if ( uuid && Number.isNumeric( ac.value ) ) targets.set( uuid, { name, img, uuid, ac: ac.value } );
    }
    return Array.from( targets.values() );
  }

  /* -------------------------------------------- */

  /**
   * Place a damage roll using an item (weapon, feat, power, or equipment)
   * Rely upon the damageRoll logic for the core implementation.
   * @param {object} [config]
   * @param {MouseEvent} [config.event]    An event which triggered this roll, if any
   * @param {boolean} [config.critical]    Should damage be rolled as a critical hit?
   * @param {number} [config.powerLevel]   If the item is a power, override the level for damage scaling
   * @param {boolean} [config.versatile]   If the item is a weapon, roll damage using the versatile formula
   * @param {DamageRollConfiguration} [config.options]  Additional options passed to the damageRoll function
   * @returns {Promise<DamageRoll[]>}      A Promise which resolves to the created Roll instances, or null if the action
   *                                       cannot be performed.
   */
  async rollDamage( { critical, event = null, powerLevel = null, versatile = false, options = {} } = {} ) {
    if ( !this.hasDamage ) throw new Error( "You may not make a Damage Roll with this Item." );

    // Fetch level from tags if not specified
    let originalLevel = this.system.level;
    let scaling = this.system.scaling;
    const levelingFlag = this.getFlag( "sw5e", "powerLevel" );
    if ( !powerLevel && levelingFlag ) {
      powerLevel = levelingFlag.value;
      originalLevel = levelingFlag.base;
      scaling = levelingFlag.scaling;
    }

    // Get roll data
    const dmg = this.system.damage;
    const properties = Array.from( this.system.properties ).filter( p => CONFIG.SW5E.itemProperties[p]?.isPhysical );
    const rollConfigs = dmg.parts.map( ( [formula, type] ) => ( { parts: [formula], type, properties } ) );
    const rollData = this.getRollData();
    if ( powerLevel ) rollData.item.level = powerLevel;

    // Configure the damage roll
    const actionFlavor = game.i18n.localize( this.system.actionType === "heal" ? "SW5E.Healing" : "SW5E.DamageRoll" );
    const title = `${this.name} - ${actionFlavor}`;
    const rollConfig = {
      actor: this.actor,
      critical,
      data: rollData,
      event,
      title: title,
      flavor: this.labels.damageTypes.length ? `${title} (${this.labels.damageTypes})` : title,
      dialogOptions: {
        width: 400,
        top: event ? event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {
        "flags.sw5e": {
          targets: this.constructor._formatAttackTargets(),
          roll: { type: "damage", itemId: this.id, itemUuid: this.uuid }
        },
        speaker: ChatMessage.getSpeaker( { actor: this.actor } )
      }
    };

    // Adjust damage from versatile usage
    if ( versatile && dmg.versatile ) {
      rollConfigs[0].parts[0] = dmg.versatile;
      rollConfig.messageData["flags.sw5e"].roll.versatile = true;
    }

    // Add magical damage if available
    if ( this.system.magicalBonus && this.system.magicAvailable ) {
      rollConfigs[0].parts.push( this.system.magicalBonus );
    }

    // Scale damage from up-casting powers
    if ( ( this.type === "power" ) || scaling ) {
      if ( scaling.mode === "atwill" ) {
        let level;
        if ( this.actor.type === "character" ) level = this.actor.system.details.level;
        else if ( this.system.preparation.mode === "innate" ) level = Math.ceil( this.actor.system.details.cr );
        else if ( this.system.school === "tec" ) level = this.actor.system.details.powerTechLevel;
        else if ( ["lgt", "drk", "uni"].includes( this.system.school ) ) level = this.actor.system.details.powerForceLevel;
        else level = this.actor.system.details.powerLevel;
        rollConfigs.forEach( c => this._scaleAtWillDamage( c.parts, scaling.formula, level, rollData ) );
      }
      else if ( powerLevel && ( scaling.mode === "level" ) ) rollConfigs.forEach( c => {
        if ( scaling.formula || c.parts.length ) {
          this._scalePowerDamage( c.parts, originalLevel, powerLevel, scaling.formula || c.parts[0], rollData );
        }
      } );
    }

    // Add damage bonus formula
    const actorBonus = foundry.utils.getProperty?.( this.actor.system, `bonuses.${this.system.actionType}` ) || {};
    if ( actorBonus.damage && parseInt( actorBonus.damage ) !== 0 ) {
      rollConfigs[0].parts.push( actorBonus.damage );
    }

    // Only add the ammunition damage if the ammunition is a consumable with type 'ammo'
    const ammo = this.hasAmmo ? this.actor.items.get( this.system.consume.target ) : null;
    if ( ammo ) {
      const properties = Array.from( ammo.system.properties ).filter( p => CONFIG.SW5E.itemProperties[p]?.isPhysical );
      if ( this.system.properties.has( "mgc" ) && !properties.includes( "mgc" ) ) properties.push( "mgc" );
      const ammoConfigs = ammo.system.damage.parts.map( ( ( [formula, type] ) => ( { parts: [formula], type, properties } ) ) );
      if ( ammo.system.magicalBonus && ammo.system.magicAvailable ) {
        rollConfigs[0].parts.push( "@ammo" );
        properties.forEach( p => {
          if ( !rollConfigs[0].properties.includes( p ) ) rollConfigs[0].properties.push( p );
        } );
        rollData.ammo = ammo.system.magicalBonus;
      }
      rollConfigs.push( ...ammoConfigs );
    }

    // Factor in extra critical damage dice from the item and actor
    rollConfig.criticalBonusDice = this.getCriticalExtraDice();

    // Factor in extra weapon-specific critical damage
    if ( this.system.critical?.damage ) rollConfig.criticalBonusDamage = this.system.critical.damage;

    foundry.utils.mergeObject( rollConfig, options );
    rollConfig.rollConfigs = rollConfigs.concat( options.rollConfigs ?? [] );

    /**
     * A hook event that fires before a damage is rolled for an Item.
     * @function sw5e.preRollDamage
     * @memberof hookEvents
     * @param {Item5e} item                     Item for which the roll is being performed.
     * @param {DamageRollConfiguration} config  Configuration data for the pending roll.
     * @returns {boolean}                       Explicitly return false to prevent the roll from being performed.
     */
    if ( Hooks.call( "sw5e.preRollDamage", this, rollConfig ) === false ) return;

    const rolls = await damageRoll( rollConfig );

    /**
     * A hook event that fires after a damage has been rolled for an Item.
     * @function sw5e.rollDamage
     * @memberof hookEvents
     * @param {Item5e} item                    Item for which the roll was performed.
     * @param {DamageRoll|DamageRoll[]} rolls  The resulting rolls (or single roll if `returnMultiple` is `false`).
     */
    if ( rolls || ( rollConfig.returnMultiple && rolls?.length ) ) Hooks.callAll( "sw5e.rollDamage", this, rolls );

    return rolls;
  }

  /* -------------------------------------------- */

  /**
   * Adjust an at-will damage formula to scale it for higher level characters and monsters.
   * @param {string[]} parts   The original parts of the damage formula.
   * @param {string} scale     The scaling formula.
   * @param {number} level     Level at which the power is being cast.
   * @param {object} rollData  A data object that should be applied to the scaled damage roll.
   * @returns {string[]}       The parts of the damage formula with the scaling applied.
   * @private
   */
  _scaleAtWillDamage( parts, scale, level, rollData ) {
    const add = Math.floor( ( level + 1 ) / 6 );
    if ( add === 0 ) return [];
    return this._scaleDamage( parts, scale || parts.join( " + " ), add, rollData );
  }

  /* -------------------------------------------- */

  /**
   * Adjust the power damage formula to scale it for power level up-casting.
   * @param {string[]} parts      The original parts of the damage formula.
   * @param {number} baseLevel    Default level for the power.
   * @param {number} powerLevel   Level at which the power is being cast.
   * @param {string} formula      The scaling formula.
   * @param {object} rollData     A data object that should be applied to the scaled damage roll.
   * @returns {string[]}          The parts of the damage formula with the scaling applied.
   * @private
   */
  _scalePowerDamage( parts, baseLevel, powerLevel, formula, rollData ) {
    const upcastLevels = Math.max( powerLevel - baseLevel, 0 );
    if ( upcastLevels === 0 ) return parts;
    return this._scaleDamage( parts, formula, upcastLevels, rollData );
  }

  /* -------------------------------------------- */

  /**
   * Scale an array of damage parts according to a provided scaling formula and scaling multiplier.
   * @param {string[]} parts    The original parts of the damage formula.
   * @param {string} scaling    The scaling formula.
   * @param {number} times      A number of times to apply the scaling formula.
   * @param {object} rollData   A data object that should be applied to the scaled damage roll
   * @returns {string[]}        The parts of the damage formula with the scaling applied.
   * @private
   */
  _scaleDamage( parts, scaling, times, rollData ) {
    if ( times <= 0 ) return parts;
    const p0 = new Roll( parts[0], rollData );
    const s = new Roll( scaling, rollData ).alter( times );

    // Attempt to simplify by combining like dice terms
    let simplified = false;
    if ( s.terms[0] instanceof Die && s.terms.length === 1 ) {
      const d0 = p0.terms[0];
      const s0 = s.terms[0];
      if ( d0 instanceof Die && d0.faces === s0.faces && d0.modifiers.equals( s0.modifiers ) ) {
        d0.number += s0.number;
        parts[0] = p0.formula;
        simplified = true;
      }
    }

    // Otherwise, add to the first part
    if ( !simplified ) parts[0] = `${parts[0]} + ${s.formula}`;
    return parts;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data needed to roll an attack using an item (weapon, feat, power, or equipment)
   * and then pass it off to `d20Roll`.
   * @param {object} [options]
   * @param {boolean} [options.powerLevel]  Level at which a power is cast.
   * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance.
   */
  async rollFormula( { powerLevel } = {} ) {
    if ( !this.system.formula ) throw new Error( "This Item does not have a formula to roll!" );

    const rollConfig = {
      formula: this.system.formula,
      data: this.getRollData(),
      chatMessage: true
    };
    if ( powerLevel ) rollConfig.data.item.level = powerLevel;

    /**
     * A hook event that fires before a formula is rolled for an Item.
     * @function sw5e.preRollFormula
     * @memberof hookEvents
     * @param {Item5e} item                 Item for which the roll is being performed.
     * @param {object} config               Configuration data for the pending roll.
     * @param {string} config.formula       Formula that will be rolled.
     * @param {object} config.data          Data used when evaluating the roll.
     * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
     * @returns {boolean}                   Explicitly return false to prevent the roll from being performed.
     */
    if ( Hooks.call( "sw5e.preRollFormula", this, rollConfig ) === false ) return;

    const roll = await new Roll( rollConfig.formula, rollConfig.data ).roll( { async: true } );

    if ( rollConfig.chatMessage ) {
      roll.toMessage( {
        speaker: ChatMessage.getSpeaker( { actor: this.actor } ),
        flavor: `${this.name} - ${game.i18n.localize( "SW5E.OtherFormula" )}`,
        rollMode: game.settings.get( "core", "rollMode" ),
        messageData: { "flags.sw5e.roll": { type: "other", itemId: this.id, itemUuid: this.uuid } }
      } );
    }

    /**
     * A hook event that fires after a formula has been rolled for an Item.
     * @function sw5e.rollFormula
     * @memberof hookEvents
     * @param {Item5e} item  Item for which the roll was performed.
     * @param {Roll} roll    The resulting roll.
     */
    Hooks.callAll( "sw5e.rollFormula", this, roll );

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Perform an ability recharge test for an item which uses the d6 recharge mechanic.
   * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance
   */
  async rollRecharge() {
    const recharge = this.system.recharge ?? {};
    if ( !recharge.value ) return;

    const rollConfig = {
      formula: "1d6",
      data: this.getRollData(),
      target: parseInt( recharge.value ),
      chatMessage: true
    };

    /**
     * A hook event that fires before the Item is rolled to recharge.
     * @function sw5e.preRollRecharge
     * @memberof hookEvents
     * @param {Item5e} item                 Item for which the roll is being performed.
     * @param {object} config               Configuration data for the pending roll.
     * @param {string} config.formula       Formula that will be used to roll the recharge.
     * @param {object} config.data          Data used when evaluating the roll.
     * @param {number} config.target        Total required to be considered recharged.
     * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
     * @returns {boolean}                   Explicitly return false to prevent the roll from being performed.
     */
    if ( Hooks.call( "sw5e.preRollRecharge", this, rollConfig ) === false ) return;

    const roll = await new Roll( rollConfig.formula, rollConfig.data ).roll( { async: true } );
    const success = roll.total >= rollConfig.target;

    if ( rollConfig.chatMessage ) {
      const resultMessage = game.i18n.localize( `SW5E.ItemRecharge${success ? "Success" : "Failure"}` );
      roll.toMessage( {
        flavor: `${game.i18n.format( "SW5E.ItemRechargeCheck", { name: this.name } )} - ${resultMessage}`,
        speaker: ChatMessage.getSpeaker( { actor: this.actor, token: this.actor.token } )
      } );
    }

    /**
     * A hook event that fires after the Item has rolled to recharge, but before any changes have been performed.
     * @function sw5e.rollRecharge
     * @memberof hookEvents
     * @param {Item5e} item  Item for which the roll was performed.
     * @param {Roll} roll    The resulting roll.
     * @returns {boolean}    Explicitly return false to prevent the item from being recharged.
     */
    if ( Hooks.call( "sw5e.rollRecharge", this, roll ) === false ) return roll;

    // Update the Item data
    if ( success ) this.update( { "system.recharge.charged": true } );

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data needed to roll a tool check and then pass it off to `d20Roll`.
   * @param {D20RollConfiguration} [options]  Roll configuration options provided to the d20Roll function.
   * @returns {Promise<Roll>}                 A Promise which resolves to the created Roll instance.
   */
  async rollToolCheck( options = {} ) {
    if ( this.type !== "tool" ) throw new Error( "Wrong item type!" );
    return this.actor?.rollToolCheck( this.system.type.baseItem, {
      ability: this.system.ability,
      bonus: this.system.bonus,
      prof: this.system.prof,
      item: this,
      ...options
    } );
  }

  /* -------------------------------------------- */

  /**
   * @inheritdoc
   * @param {object} [options]
   * @param {boolean} [options.deterministic] Whether to force deterministic values for data properties that could be
   *                                          either a die term or a flat term.
   */
  getRollData( { deterministic = false } = {} ) {
    let data;
    if ( this.system.getRollData ) data = this.system.getRollData( { deterministic } );
    else data = { ...( this.actor?.getRollData( { deterministic } ) ?? {} ), item: { ...this.system } };
    if ( data?.item ) {
      data.item.flags = { ...this.flags };
      data.item.name = this.name;
    }
    return data;
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  /**
   * Apply listeners to chat messages.
   * @param {HTML} html  Rendered chat message.
   */
  static chatListeners( html ) {
    html.on( "click", ".chat-card button[data-action]", this._onChatCardAction.bind( this ) );
    html.on( "click", ".item-name, .collapsible", this._onChatCardToggleContent.bind( this ) );
    html[0].addEventListener( "click", event => {
      if ( event.target.closest( "[data-context-menu]" ) ) {
        event.preventDefault();
        event.stopPropagation();
        event.target.closest( "[data-message-id]" ).dispatchEvent( new PointerEvent( "contextmenu", {
          view: window, bubbles: true, cancelable: true
        } ) );
      }
    } );
  }

  /* -------------------------------------------- */

  /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
  static async _onChatCardAction( event ) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest( ".chat-card" );
    const messageId = card.closest( ".message" ).dataset.messageId;
    const message = game.messages.get( messageId );
    const action = button.dataset.action;

    try {
      // Recover the actor for the chat card
      const actor = await this._getChatCardActor( card );
      if ( !actor ) return;

      // Validate permission to proceed with the roll
      const isTargetted = action === "save";
      if ( !( isTargetted || game.user.isGM || actor.isOwner ) ) return;

      // Get the Item from stored flag data or by the item ID on the Actor
      const storedData = message.getFlag( "sw5e", "itemData" );
      let item = storedData ? new this( storedData, { parent: actor } ) : actor.items.get( card.dataset.itemId );
      if ( !item ) {
        ui.notifications.error( game.i18n.format( "SW5E.ActionWarningNoItem", {
          item: card.dataset.itemId,
          name: actor.name
        } ) );
        return null;
      }

      let powerLevel;
      if ( item.system.level === 0 ) powerLevel = 0;
      else powerLevel = parseInt( card.dataset.powerLevel ) || null;

      // Handle different actions
      let targets;
      let messageUpdates = {};
      switch ( action ) {
        case "abilityCheck":
          targets = this._getChatCardTargets( card );
          for ( let token of targets ) {
            const speaker = ChatMessage.getSpeaker( { scene: canvas.scene, token: token.document } );
            await token.actor.rollAbilityTest( button.dataset.ability, {
              event,
              speaker
            } );
          }
          break;
        case "applyEffect":
          const li = button.closest( "li.effect" );
          let effect = item.effects.get( li.dataset.effectId );
          if ( !effect ) effect = await fromUuid( li.dataset.uuid );
          const concentration = actor.effects.get( message.getFlag( "sw5e", "use.concentrationId" ) );
          const effectData = { "flags.sw5e.powerLevel": powerLevel };
          for ( const token of canvas.tokens.controlled ) {
            try {
              await this._applyEffectToToken( effect, token, { concentration, effectData } );
            } catch( err ) {
              Hooks.onError( "Item5e._applyEffectToToken", err, { notify: "warn", log: "warn" } );
            }
          }
          break;
        case "attack":
          await item.rollAttack( {
            event: event,
            powerLevel: powerLevel,
            attackItemUuid: item.uuid
          } );
          break;
        case "consumeUsage":
          await item.consume( item, { consumeUsage: true }, messageUpdates );
          break;
        case "consumeResource":
          await item.consume( item, { consumeResource: true }, messageUpdates );
          break;
        case "damage":
        case "versatile":
          await item.rollDamage( {
            critical: event.altKey,
            event: event,
            powerLevel: powerLevel,
            versatile: action === "versatile"
          } );
          break;
        case "formula":
          await item.rollFormula( { event, powerLevel } );
          break;
        case "placeTemplate":
          try {
            await sw5e.canvas.AbilityTemplate.fromItem( item, {
              "flags.sw5e.powerLevel": powerLevel,
              templateItemUuid: item.uuid
            } )?.drawPreview();
          } catch( err ) {
            Hooks.onError( "Item5e#_onChatCardAction", err, {
              msg: game.i18n.localize( "SW5E.PlaceTemplateError" ),
              log: "error",
              notify: "error"
            } );
          }
          break;
        case "save":
          targets = this._getChatCardTargets( card );
          for ( let token of targets ) {
            const dc = parseInt( button.dataset.dc );
            const speaker = ChatMessage.getSpeaker( { scene: canvas.scene, token: token.document } );
            await token.actor.rollAbilitySave( button.dataset.ability, {
              event,
              speaker,
              targetValue: Number.isFinite( dc ) ? dc : undefined,
              saveItemUuid: item.uuid
            } );
          }
          break;
        case "summon":
          if ( powerLevel ) item = item.clone( { "system.level": powerLevel }, { keepId: true } );
          await this._onChatCardSummon( message, item );
          break;
        case "toolCheck":
          await item.rollToolCheck( {
            event,
            toolItemUuid: item.uuid
          } );
          break;
      }
      if ( !foundry.utils.isEmpty( messageUpdates ) ) await message.update( messageUpdates );

    } catch( err ) {
      Hooks.onError( "Item5e._onChatCardAction", err, { log: "error", notify: "error" } );
    } finally {
      // Re-enable the button
      button.disabled = false;
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle applying an Active Effect to a Token.
   * @param {ActiveEffect5e} effect                   The effect.
   * @param {Token5e} token                           The token.
   * @param {object} [options]
   * @param {ActiveEffect5e} [options.concentration]  An optional concentration effect to act as the applied effect's
   *                                                  origin instead.
   * @param {number} [options.effectData]             Optional data to merge into the created or updated effect.
   * @returns {Promise<ActiveEffect5e|false>}
   * @throws {Error}                                  If the effect could not be applied.
   * @protected
   */
  static async _applyEffectToToken( effect, token, { concentration, effectData = {} } = {} ) {
    const origin = concentration ?? effect;
    if ( !game.user.isGM && !token.actor?.isOwner ) {
      throw new Error( game.i18n.localize( "SW5E.EffectApplyWarningOwnership" ) );
    }

    // Enable an existing effect on the target if it originated from this effect
    const existingEffect = token.actor?.effects.find( e => e.origin === origin.uuid );
    if ( existingEffect ) {
      return existingEffect.update( foundry.utils.mergeObject( {
        ...effect.constructor.getInitialDuration(),
        disabled: false
      }, effectData ) );
    }

    if ( !game.user.isGM && concentration && !concentration.actor?.isOwner ) {
      throw new Error( game.i18n.localize( "SW5E.EffectApplyWarningConcentration" ) );
    }

    // Otherwise, create a new effect on the target
    effectData = foundry.utils.mergeObject( {
      ...effect.toObject(),
      disabled: false,
      transfer: false,
      origin: origin.uuid
    }, effectData );
    const applied = await ActiveEffect.implementation.create( effectData, { parent: token.actor } );
    if ( concentration ) await concentration.addDependent( applied );
    return applied;
  }

  /* -------------------------------------------- */

  /**
   * Handle summoning from a chat card.
   * @param {ChatMessage5e} message  The message that was clicked.
   * @param {Item5e} item            The item from which to summon.
   */
  static async _onChatCardSummon( message, item ) {
    let summonsProfile;
    let summonsOptions = {};
    let needsConfiguration = false;

    // No profile specified and only one profile on item, use that one
    if ( item.system.summons.profiles.length === 1 ) summonsProfile = item.system.summons.profiles[0]._id;
    else needsConfiguration = true;

    // More than one creature type requires configuration
    if ( item.system.summons.creatureSizes.size > 1
      || item.system.summons.creatureTypes.size > 1 ) needsConfiguration = true;

    // Show the item use dialog to get the profile and other options
    if ( needsConfiguration ) {
      let config = await AbilityUseDialog.create( item, {
        beginConcentrating: null,
        consumeResource: null,
        consumePowerSlot: null,
        consumeUsage: null,
        createMeasuredTemplate: null,
        createSummons: true
      }, {
        button: {
          icon: '<i class="fa-solid fa-spaghetti-monster-flying"></i>',
          label: game.i18n.localize( "SW5E.Summoning.Action.Summon" )
        },
        disableScaling: true
      } );
      if ( !config?.summonsProfile ) return;
      config = foundry.utils.expandObject( config );
      summonsProfile = config.summonsProfile;
      summonsOptions = config.summonsOptions;
    }

    try {
      await item.system.summons.summon( summonsProfile, summonsOptions );
    } catch( err ) {
      Hooks.onError( "Item5e#_onChatCardSummon", err, { log: "error", notify: "error" } );
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent( event ) {
    const header = event.currentTarget;
    if ( header.classList.contains( "collapsible" ) && !event.target.closest( ".collapsible-content.card-content" ) ) {
      event.preventDefault();
      header.classList.toggle( "collapsed" );

      // Clear the height from the chat popout container so that it appropriately resizes.
      const popout = header.closest( ".chat-popout" );
      if ( popout ) popout.style.height = "";
    }
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @returns {Actor|null}        The Actor document or null
   * @private
   */
  static async _getChatCardActor( card ) {

    // Case 1 - a synthetic actor from a Token
    if ( card.dataset.tokenId ) {
      const token = await fromUuid( card.dataset.tokenId );
      if ( !token ) return null;
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get( actorId ) || null;
  }

  /* -------------------------------------------- */

  /**
   * Get token targets for the current chat card action and display warning of none are selected.
   * @param {HTMLElement} card  The chat card being used.
   * @returns {Token5e[]}       An Array of Token objects, if any.
   * @private
   */
  static _getChatCardTargets( card ) {
    const targets = getSceneTargets();
    if ( !targets.length ) ui.notifications.warn( "SW5E.ActionWarningNoToken", { localize: true } );
    return targets;
  }

  /* -------------------------------------------- */
  /*  Advancements                                */
  /* -------------------------------------------- */

  /**
   * Create a new advancement of the specified type.
   * @param {string} type                          Type of advancement to create.
   * @param {object} [data]                        Data to use when creating the advancement.
   * @param {object} [options]
   * @param {boolean} [options.showConfig=true]    Should the new advancement's configuration application be shown?
   * @param {boolean} [options.source=false]       Should a source-only update be performed?
   * @returns {Promise<AdvancementConfig>|Item5e}  Promise for advancement config for new advancement if local
   *                                               is `false`, or item with newly added advancement.
   */
  createAdvancement( type, data = {}, { showConfig = true, source = false } = {} ) {
    if ( !this.system.advancement ) return this;

    let config = CONFIG.SW5E.advancementTypes[type];
    if ( !config ) throw new Error( `${type} not found in CONFIG.SW5E.advancementTypes` );
    if ( config.prototype instanceof Advancement ) {
      foundry.utils.logCompatibilityWarning(
        "Advancement type configuration changed into an object with `documentClass` defining the advancement class.",
        { since: "SW5e 3.1", until: "SW5e 3.3", once: true }
      );
      config = {
        documentClass: config,
        validItemTypes: config.metadata.validItemTypes
      };
    }
    const cls = config.documentClass;

    if ( !config.validItemTypes.has( this.type ) || !cls.availableForItem( this ) ) {
      throw new Error( `${type} advancement cannot be added to ${this.name}` );
    }

    const createData = foundry.utils.deepClone( data );
    const advancement = new cls( data, { parent: this } );
    if ( advancement._preCreate( createData ) === false ) return;

    const advancementCollection = this.toObject().system.advancement;
    advancementCollection.push( advancement.toObject() );
    if ( source ) return this.updateSource( { "system.advancement": advancementCollection } );
    return this.update( { "system.advancement": advancementCollection } ).then( () => {
      if ( !showConfig ) return this;
      const config = new cls.metadata.apps.config( this.advancement.byId[advancement.id] );
      return config.render( true );
    } );
  }

  /* -------------------------------------------- */

  /**
   * Update an advancement belonging to this item.
   * @param {string} id                       ID of the advancement to update.
   * @param {object} updates                  Updates to apply to this advancement.
   * @param {object} [options={}]
   * @param {boolean} [options.source=false]  Should a source-only update be performed?
   * @returns {Promise<Item5e>|Item5e}        This item with the changes applied, promised if source is `false`.
   */
  updateAdvancement( id, updates, { source = false } = {} ) {
    if ( !this.system.advancement ) return this;
    const idx = this.system.advancement.findIndex( a => a._id === id );
    if ( idx === -1 ) throw new Error( `Advancement of ID ${id} could not be found to update` );

    const advancement = this.advancement.byId[id];
    if ( source ) {
      advancement.updateSource( updates );
      advancement.render();
      return this;
    }

    const advancementCollection = this.toObject().system.advancement;
    const clone = new advancement.constructor( advancementCollection[idx], { parent: advancement.parent } );
    clone.updateSource( updates );
    advancementCollection[idx] = clone.toObject();
    return this.update( { "system.advancement": advancementCollection } ).then( r => {
      advancement.render( false, { height: "auto" } );
      return r;
    } );
  }

  /* -------------------------------------------- */

  /**
   * Remove an advancement from this item.
   * @param {string} id                       ID of the advancement to remove.
   * @param {object} [options={}]
   * @param {boolean} [options.source=false]  Should a source-only update be performed?
   * @returns {Promise<Item5e>|Item5e}        This item with the changes applied.
   */
  deleteAdvancement( id, { source = false } = {} ) {
    if ( !this.system.advancement ) return this;

    const advancementCollection = this.toObject().system.advancement.filter( a => a._id !== id );
    if ( source ) return this.updateSource( { "system.advancement": advancementCollection } );
    return this.update( { "system.advancement": advancementCollection } );
  }

  /* -------------------------------------------- */

  /**
   * Duplicate an advancement, resetting its value to default and giving it a new ID.
   * @param {string} id                             ID of the advancement to duplicate.
   * @param {object} [options]
   * @param {boolean} [options.showConfig=true]     Should the new advancement's configuration application be shown?
   * @param {boolean} [options.source=false]        Should a source-only update be performed?
   * @returns {Promise<AdvancementConfig>|Item5e}   Promise for advancement config for duplicate advancement if source
   *                                                is `false`, or item with newly duplicated advancement.
   */
  duplicateAdvancement( id, options ) {
    const original = this.advancement.byId[id];
    if ( !original ) return this;
    const duplicate = original.toObject();
    delete duplicate._id;
    if ( original.constructor.metadata.dataModels?.value ) {
      duplicate.value = new original.constructor.metadata.dataModels.value().toObject();
    } else {
      duplicate.value = original.constructor.metadata.defaults?.value ?? {};
    }
    return this.createAdvancement( original.constructor.typeName, duplicate, options );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getEmbeddedDocument( embeddedName, id, options ) {
    if ( embeddedName !== "Advancement" ) return super.getEmbeddedDocument( embeddedName, id, options );
    const advancement = this.advancement.byId[id];
    if ( options?.strict && advancement === undefined ) {
      throw new Error( `The key ${id} does not exist in the ${embeddedName} Collection` );
    }
    return advancement;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preCreate( data, options, user ) {
    if ( ( await super._preCreate( data, options, user ) ) === false ) return false;

    // Create class identifier based on name
    if ( ["class", "archetype"].includes( this.type ) && !this.system.identifier ) {
      await this.updateSource( { "system.identifier": data.name.slugify( { strict: true } ) } );
    }

    let updates;
    if ( !this.isEmbedded ) {
      switch ( data.type ) {
        case "modification":
          updates = this._onCreateUnownedModification( data );
          break;
      }
    } else {
      if ( this.parent.type === "vehicle" ) return;
      const isNPC = this.parent.type === "npc";
      const isStarship = this.parent.type === "starship";
      switch ( data.type ) {
        case "equipment":
          updates = this._onCreateOwnedEquipment( data, isNPC || isStarship );
          break;
        case "power":
          updates = this._onCreateOwnedPower( data, isNPC );
          break;
        case "weapon":
          updates = this._onCreateOwnedWeapon( data, isNPC );
          break;
        case "feat":
          updates = this._onCreateOwnedFeature( data, isNPC );
          break;
      }
    }

    if ( updates ) return this.updateSource( updates );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static async _onCreateDocuments( items, context ) {
    return await super._onCreateDocuments( items, context );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onCreate( data, options, userId ) {
    super._onCreate( data, options, userId );
    if ( userId !== game.user.id || !this.parent ) return;

    // Assign a new original class
    if ( this.parent.type === "character" && this.type === "class" ) {
      const pc = this.parent.items.get( this.parent.system.details.originalClass );
      if ( !pc ) await this.parent._assignPrimaryClass();
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate( changed, options, user ) {
    if ( ( await super._preUpdate( changed, options, user ) ) === false ) return false;

    if ( foundry.utils.hasProperty( changed, "system.container" ) ) {
      options.formerContainer = ( await this.container )?.uuid;
    }

    if ( this.type !== "class" || !( "levels" in ( changed.system || {} ) ) ) return;

    // Check to make sure the updated class level isn't below zero
    if ( changed.system.levels <= 0 ) {
      ui.notifications.warn( "SW5E.MaxClassLevelMinimumWarn", { localize: true } );
      changed.system.levels = 1;
    }

    // Check to make sure the updated class level doesn't exceed level cap
    if ( changed.system.levels > CONFIG.SW5E.maxLevel ) {
      ui.notifications.warn( game.i18n.format( "SW5E.MaxClassLevelExceededWarn", { max: CONFIG.SW5E.maxLevel } ) );
      changed.system.levels = CONFIG.SW5E.maxLevel;
    }
    if ( !this.isEmbedded || this.parent.type !== "character" ) return;

    // Check to ensure the updated character doesn't exceed level cap
    const newCharacterLevel = this.actor.system.details.level + ( changed.system.levels - this.system.levels );
    if ( newCharacterLevel > CONFIG.SW5E.maxLevel ) {
      ui.notifications.warn( game.i18n.format( "SW5E.MaxCharacterLevelExceededWarn", { max: CONFIG.SW5E.maxLevel } ) );
      changed.system.levels -= newCharacterLevel - CONFIG.SW5E.maxLevel;
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onUpdate( changed, options, userId ) {
    super._onUpdate( changed, options, userId );

    const changes = foundry.utils.flattenObject( changed );
    delete changes._id;

    // If a temporary modification item changes it's data, update the data in the modified item
    if ( this.type === "modification" && this.actor && this.system?.modifying?.id ) {
      this.actor.items.get( this.system.modifying.id )?.updModification( this.id, null, this.toObject() );
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDelete( options, userId ) {
    super._onDelete( options, userId );
    if ( userId !== game.user.id ) return;

    // Delete a container's contents when it is deleted
    const contents = await this.system.allContainedItems;
    if ( contents?.size && options.deleteContents ) {
      await Item.deleteDocuments( Array.from( contents.map( i => i.id ) ), { pack: this.pack, parent: this.parent } );
    }

    // End concentration on any effects.
    this.parent?.endConcentration?.( this );

    // Assign a new original class
    if ( this.parent && ( this.type === "class" ) && ( this.id === this.parent.system.details.originalClass ) ) {
      this.parent._assignPrimaryClass();
    }

    // Remove modification data from modified item
    if ( this.type === "modification" ) {
      this.actor?.items?.get( this.system?.modifying?.id )?.delModification( this.id, null, false );
    }
    // Delete any temporary modification items on the parent actor created by this item
    else {
      const itemMods = this.system?.modify;
      if ( this.actor && itemMods ) for ( const mod of itemMods.items ) this.actor.items.get( mod.id )?.delete();
    }
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of unowned modification type Items.
   *
   * @param {object} data           Data for the newly created item.
   * @returns {object}              Updates to apply to the item data.
   * @private
   */
  _onCreateUnownedModification( data ) {
    const updates = {};

    // Unowned modifications are not modifying any item
    if ( foundry.utils.getProperty?.( data, "system.modifying.id" ) !== null ) updates["system.modifying.id"] = null;
    if ( foundry.utils.getProperty?.( data, "system.modifying.disabled" ) !== false ) updates["system.modifying.disabled"] = false;

    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned equipment type Items.
   *
   * @param {object} data           Data for the newly created item.
   * @param {boolean} isNPCorSS     Is this actor an NPC or Starship?
   * @returns {object}              Updates to apply to the item data.
   * @private
   */
  _onCreateOwnedEquipment( data, isNPCorSS ) {
    const updates = {};
    if ( foundry.utils.getProperty?.( data, "system.equipped" ) === undefined ) {
      updates["system.equipped"] = isNPCorSS; // NPCs and Starships automatically equip equipment
    }

    if ( foundry.utils.getProperty?.( data, "system.proficient" ) === undefined ) {
      if ( isNPCorSS ) {
        updates["system.proficient"] = true; // NPCs and Starships automatically have equipment proficiency
      } else {
        const armorProf = CONFIG.SW5E.armorProficienciesMap[this.system.type.value]; // Player characters check proficiency
        const actorArmorProfs = this.parent.system.traits?.armorProf?.value || new Set();
        updates["system.proficient"] =
          armorProf === true || actorArmorProfs.has( armorProf ) || actorArmorProfs.has( this.system.baseItem );
      }
    }
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned power type Items.
   *
   * @param {object} data       Data for the newly created item.
   * @param {boolean} isNPC     Is this actor an NPC?
   * @returns {object}          Updates to apply to the item data.
   * @private
   */
  _onCreateOwnedPower( data, isNPC ) {
    const updates = {};
    updates["system.preparation.prepared"] = true; // Automatically prepare powers for everyone
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned weapon type Items.
   * @param {object} data       Data for the newly created item.
   * @param {boolean} isNPC     Is this actor an NPC?
   * @returns {object|void}     Updates to apply to the item data.
   * @private
   */
  _onCreateOwnedWeapon( data, isNPC ) {
    if ( !isNPC ) return;
    // NPCs automatically equip items.
    const updates = {};
    if ( !foundry.utils.hasProperty( data, "system.equipped" ) ) updates["system.equipped"] = true;
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned feature type Items.
   * @param {object} data       Data for the newly created item.
   * @param {boolean} isNPC     Is this actor an NPC?
   * @returns {object}          Updates to apply to the item data.
   * @private
   */
  _onCreateOwnedFeature( data, isNPC ) {
    const updates = {};
    if ( isNPC && !foundry.utils.getProperty?.( data, "system.type.value" ) ) {
      updates["system.type.value"] = "monster"; // Set features on NPCs to be 'monster features'.
    }
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Handle the weapon reload logic.
   */
  reloadWeapon() {
    if ( this.type !== "weapon" ) return;

    const wpnSysData = this.system;
    const actor = this.actor;
    const ammo = wpnSysData.ammo.target ? actor?.items?.get( wpnSysData.ammo.target ) : null;
    const ammoSysData = ammo?.system;
    const freeShot = actor.type === "npc" && !game.settings.get( "sw5e", "npcConsumeAmmo" );

    let toReload = wpnSysData.ammo.max - wpnSysData.ammo.value;
    const updates = [];

    if ( ammo ) {
      if ( !wpnSysData.ammo.types.includes( ammoSysData.type.subtype ) ) return;
      if ( ammoSysData.quantity <= 0 ) return;

      switch ( ammoSysData.type.subtype ) {
        case "cartridge":
        case "dart":
        case "missile":
        case "rocket":
        case "snare":
        case "torpedo":
        case "ssmissile":
        case "ssrocket":
        case "sstorpedo":
        case "ssbomb":
          toReload = Math.min( toReload, ammoSysData.quantity );
          if ( !freeShot ) updates.push( {
            "system.quantity": ammoSysData.quantity - toReload,
            _id: ammo.id
          } );
          break;
        case "powerCell":
        case "flechetteClip":
        case "flechetteMag":
        case "powerGenerator":
        case "projectorCanister":
        case "projectorTank":
          if ( !freeShot ) updates.push( {
            "system.quantity": ammoSysData.quantity - 1,
            _id: ammo.id
          } );
          break;
      }
    }

    if ( toReload <= 0 ) return;
    updates.push( {
      "system.ammo.value": wpnSysData.ammo.value + toReload,
      _id: this.id
    } );

    if ( updates.length ) actor.updateEmbeddedDocuments( "Item", updates );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async deleteDialog( options = {} ) {
    // If item has advancement, handle it separately
    if ( this.actor?.system.metadata?.supportsAdvancement && !game.settings.get( "sw5e", "disableAdvancements" ) ) {
      const manager = AdvancementManager.forDeletedItem( this.actor, this.id );
      if ( manager.steps.length ) {
        try {
          const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forDelete( this );
          if ( shouldRemoveAdvancements ) return manager.render( true );
          return this.delete( { shouldRemoveAdvancements } );
        } catch( err ) {
          return;
        }
      }
    }

    // Display custom delete dialog when deleting a container with contents
    const count = await this.system.contentsCount;
    if ( count ) {
      return Dialog.confirm( {
        title: `${game.i18n.format( "DOCUMENT.Delete", { type: game.i18n.localize( "SW5E.Container" ) } )}: ${this.name}`,
        content: `<h4>${game.i18n.localize( "AreYouSure" )}</h4>
          <p>${game.i18n.format( "SW5E.ContainerDeleteMessage", { count } )}</p>
          <label>
            <input type="checkbox" name="deleteContents">
            ${game.i18n.localize( "SW5E.ContainerDeleteContents" )}
          </label>`,
        yes: html => {
          const deleteContents = html.querySelector( '[name="deleteContents"]' ).checked;
          this.delete( { deleteContents } );
        },
        options: { ...options, jQuery: false }
      } );
    }

    return super.deleteDialog( options );
  }

  /* -------------------------------------------- */
  /*  Factory Methods                             */
  /* -------------------------------------------- */

  /**
   * Add additional system-specific compendium context menu options for Item documents.
   * @param {jQuery} html            The compendium HTML.
   * @param {object{}} entryOptions  The default array of context menu options.
   */
  static addCompendiumContextOptions( html, entryOptions ) {
    const makeUuid = li => {
      const pack = li[0].closest( "[data-pack]" )?.dataset.pack;
      return `Compendium.${pack}.Item.${li.data( "documentId" )}`;
    };
    entryOptions.push( {
      name: "SW5E.Scroll.CreateScroll",
      icon: '<i class="fa-solid fa-scroll"></i>',
      callback: async li => {
        const power = await fromUuid( makeUuid( li ) );
        Item5e.create( await Item5e.createScrollFromPower( power ) );
      },
      condition: li => {
        const item = fromUuidSync( makeUuid( li ) );
        return ( item?.type === "power" ) && game.user.hasPermission( "ITEM_CREATE" );
      },
      group: "system"
    } );
  }

  /* -------------------------------------------- */

  /**
   * Add additional system-specific sidebar directory context menu options for Item documents.
   * @param {jQuery} html            The sidebar HTML.
   * @param {object[]} entryOptions  The default array of context menu options.
   */
  static addDirectoryContextOptions( html, entryOptions ) {
    entryOptions.push( {
      name: "SW5E.Scroll.CreateScroll",
      icon: '<i class="fa-solid fa-scroll"></i>',
      callback: async li => {
        const power = game.items.get( li.data( "documentId" ) );
        Item5e.create( await Item5e.createScrollFromPower( power ) );
      },
      condition: li => {
        const item = game.items.get( li.data( "documentId" ) );
        return ( item.type === "power" ) && game.user.hasPermission( "ITEM_CREATE" );
      },
      group: "system"
    } );
  }

  /* -------------------------------------------- */

  /**
   * Prepare creation data for the provided items and any items contained within them. The data created by this method
   * can be passed to `createDocuments` with `keepId` always set to true to maintain links to container contents.
   * @param {Item5e[]} items                     Items to create.
   * @param {object} [context={}]                Context for the item's creation.
   * @param {Item5e} [context.container]         Container in which to create the item.
   * @param {boolean} [context.keepId=false]     Should IDs be maintained?
   * @param {Function} [context.transformAll]    Method called on provided items and their contents.
   * @param {Function} [context.transformFirst]  Method called only on provided items.
   * @returns {Promise<object[]>}                Data for items to be created.
   */
  static async createWithContents( items, { container, keepId = false, transformAll, transformFirst } = {} ) {
    let depth = 0;
    if ( container ) {
      depth = 1 + ( await container.system.allContainers() ).length;
      if ( depth > PhysicalItemTemplate.MAX_DEPTH ) {
        ui.notifications.warn( game.i18n.format( "SW5E.ContainerMaxDepth", { depth: PhysicalItemTemplate.MAX_DEPTH } ) );
        return;
      }
    }

    const createItemData = async ( item, containerId, depth ) => {
      let newItemData = transformAll ? await transformAll( item ) : item;
      if ( transformFirst && ( depth === 0 ) ) newItemData = await transformFirst( newItemData );
      if ( !newItemData ) return;
      if ( newItemData instanceof Item ) newItemData = newItemData.toObject();
      foundry.utils.mergeObject( newItemData, { "system.container": containerId } );
      if ( !keepId ) newItemData._id = foundry.utils.randomID();

      created.push( newItemData );

      const contents = await item.system.contents;
      if ( contents && ( depth < PhysicalItemTemplate.MAX_DEPTH ) ) {
        for ( const doc of contents ) await createItemData( doc, newItemData._id, depth + 1 );
      }
    };

    const created = [];
    for ( const item of items ) await createItemData( item, container?.id, depth );
    return created;
  }

  /* -------------------------------------------- */

  // TODO SW5E: Make work properly
  /**
   * Configuration options for power scroll creation.
   *
   * @typedef {object} PowerScrollConfiguration
   * @property {boolean} [dialog=true]                           Present scroll creation dialog?
   * @property {"full"|"reference"|"none"} [explanation="full"]  Length of power scroll rules text to include.
   * @property {number} [level]                                  Level at which the power should be cast.
   */

  /**
   * Create a consumable power scroll Item from a power Item.
   * @param {Item5e|object} power                   The power or item data to be made into a scroll.
   * @param {object} [options]                      Additional options that modify the created scroll.
   * @param {PowerScrollConfiguration} [config={}]  Configuration options for scroll creation.
   * @returns {Promise<Item5e>}                     The created scroll consumable item.
   */
  static async createScrollFromPower( power, options = {}, config = {} ) {
    config = foundry.utils.mergeObject( {
      explanation: game.user.getFlag( "sw5e", "creation.scrollExplanation" ) ?? "reference",
      level: power.system.level
    }, config );

    if ( config.dialog !== false ) {
      const anchor = power instanceof Item5e ? power.toAnchor().outerHTML : `<span>${power.name}</span>`;
      const result = await Dialog.prompt( {
        title: game.i18n.format( "SW5E.Scroll.CreateFrom", { power: power.name } ),
        label: game.i18n.localize( "SW5E.Scroll.CreateScroll" ),
        content: await renderTemplate( "systems/sw5e/templates/apps/power-scroll-dialog.hbs", {
          ...config, anchor, powerLevels: Object.entries( CONFIG.SW5E.powerLevels ).reduce( ( obj, [k, v] ) => {
            if ( Number( k ) >= power.system.level ) obj[k] = v;
            return obj;
          }, {} )
        } ),
        callback: dialog => ( new FormDataExtended( dialog.querySelector( "form" ) ) ).object,
        rejectClose: false,
        options: { jQuery: false }
      } );
      if ( result === null ) return;
      foundry.utils.mergeObject( config, result );
      await game.user.setFlag( "sw5e", "creation.scrollExplanation", config.explanation );
    }

    // Get power data
    const flags = {};
    const itemData = ( power instanceof Item5e ) ? power.toObject() : power;
    if ( Number.isNumeric( config.level ) ) {
      flags.sw5e = {
        powerLevel: {
          value: config.level,
          base: power.system.level,
          scaling: power.system.scaling
        }
      };
      itemData.system.level = config.level;
    }

    /**
     * A hook event that fires before the item data for a scroll is created.
     * @function sw5e.preCreateScrollFromPower
     * @memberof hookEvents
     * @param {object} itemData                  The initial item data of the power to convert to a scroll.
     * @param {object} options                   Additional options that modify the created scroll.
     * @param {PowerScrollConfiguration} config  Configuration options for scroll creation.
     * @returns {boolean}                        Explicitly return false to prevent the scroll to be created.
     */
    if ( Hooks.call( "sw5e.preCreateScrollFromPower", itemData, options, config ) === false ) return;

    let {
      actionType, description, source, activation, duration, target, summons,
      range, damage, formula, save, level, attack, ability, properties
    } = itemData.system;

    // Get scroll data
    let scrollUuid;
    const id = CONFIG.SW5E.powerScrollIds[level];
    if ( foundry.data.validators.isValidId( id ) ) {
      scrollUuid = game.packs.get( CONFIG.SW5E.sourcePacks.ITEMS ).index.get( id ).uuid;
    } else {
      scrollUuid = id;
    }
    const scrollItem = await fromUuid( scrollUuid );
    const scrollData = scrollItem.toObject();
    delete scrollData._id;
    const isConc = properties.includes( "concentration" );

    // Create a composite description from the scroll description and the power details
    let desc;
    switch ( config.explanation ) {
      case "full":
        // Split the scroll description into an intro paragraph and the remaining details
        const scrollDescription = scrollData.system.description.value;
        const pdel = "</p>";
        const scrollIntroEnd = scrollDescription.indexOf( pdel );
        const scrollIntro = scrollDescription.slice( 0, scrollIntroEnd + pdel.length );
        const scrollDetails = scrollDescription.slice( scrollIntroEnd + pdel.length );
        desc = [
          scrollIntro,
          "<hr>",
          `<h3>${itemData.name} (${game.i18n.format( "SW5E.LevelNumber", { level } )})</h3>`,
          isConc ? `<p><em>${game.i18n.localize( "SW5E.Scroll.RequiresConcentration" )}</em></p>` : null,
          "<hr>",
          description.value,
          "<hr>",
          `<h3>${game.i18n.localize( "SW5E.Scroll.Details" )}</h3>`,
          "<hr>",
          scrollDetails
        ].filterJoin( "" );
        break;
      case "reference":
        desc = [
          "<p><em>",
          CONFIG.SW5E.powerLevels[level] ?? level,
          " &Reference[Power Scroll]",
          isConc ? `, ${game.i18n.localize( "SW5E.Scroll.RequiresConcentration" )}` : null,
          "</em></p>",
          description.value
        ].filterJoin( "" );
        break;
      default:
        desc = description.value;
        break;
    }

    // Used a fixed attack modifier and saving throw according to the level of power scroll.
    if ( ["mwak", "rwak", "mpak", "rpak"].includes( actionType ) ) {
      attack = { bonus: scrollData.system.attack.bonus };
    }
    if ( save.ability ) {
      save.scaling = "flat";
      save.dc = scrollData.system.save.dc;
    }

    // Create the power scroll data
    const powerScrollData = foundry.utils.mergeObject( scrollData, {
      name: `${game.i18n.localize( "SW5E.PowerScroll" )}: ${itemData.name}`,
      img: itemData.img,
      effects: itemData.effects ?? [],
      flags,
      system: {
        description: { value: desc.trim() }, source, actionType, activation, duration, target, summons,
        range, damage, formula, save, level, ability, properties, attack: { bonus: attack.bonus, flat: true }
      }
    } );
    foundry.utils.mergeObject( powerScrollData, options );
    powerScrollData.system.properties = [
      "mgc",
      ...scrollData.system.properties,
      ...properties ?? [],
      ...options.system?.properties ?? []
    ];

    /**
     * A hook event that fires after the item data for a scroll is created but before the item is returned.
     * @function sw5e.createScrollFromPower
     * @memberof hookEvents
     * @param {Item5e|object} power              The power or item data to be made into a scroll.
     * @param {object} powerScrollData           The final item data used to make the scroll.
     * @param {PowerScrollConfiguration} config  Configuration options for scroll creation.
     */
    Hooks.callAll( "sw5e.createScrollFromPower", power, powerScrollData, config );

    return new this( powerScrollData );
  }

  /* -------------------------------------------- */

  /**
   * Spawn a dialog for creating a new Item.
   * @param {object} [data]  Data to pre-populate the Item with.
   * @param {object} [context]
   * @param {Actor5e} [context.parent]       A parent for the Item.
   * @param {string|null} [context.pack]     A compendium pack the Item should be placed in.
   * @param {string[]|null} [context.types]  A list of types to restrict the choices to, or null for no restriction.
   * @returns {Promise<Item5e|null>}
   */
  static async createDialog( data = {}, { parent = null, pack = null, types = null, ...options } = {} ) {
    types ??= game.documentTypes[this.documentName].filter( t => ( t !== CONST.BASE_DOCUMENT_TYPE ) && ( t !== "backpack" ) );
    if ( !types.length ) return null;
    const collection = parent ? null : pack ? game.packs.get( pack ) : game.collections.get( this.documentName );
    const folders = collection?._formatFolderSelectOptions() ?? [];
    const label = game.i18n.localize( this.metadata.label );
    const title = game.i18n.format( "DOCUMENT.Create", { type: label } );
    const name = data.name || game.i18n.format( "DOCUMENT.New", { type: label } );
    let type = data.type || CONFIG[this.documentName]?.defaultType;
    if ( !types.includes( type ) ) type = types[0];
    const content = await renderTemplate( "systems/sw5e/templates/apps/document-create.hbs", {
      folders, name, type,
      folder: data.folder,
      hasFolders: folders.length > 0,
      types: types.reduce( ( arr, type ) => {
        if ( CONFIG.SW5E.deprecatedItemTypes.includes( type ) ) return arr;
        const label = CONFIG[this.documentName]?.typeLabels?.[type] ?? type;
        arr.push( {
          type,
          label: game.i18n.has( label ) ? game.i18n.localize( label ) : type,
          icon: this.getDefaultArtwork( { type } )?.img ?? "icons/svg/item-bag.svg"
        } );
        return arr;
      }, [] ).sort( ( a, b ) => a.label.localeCompare( b.label, game.i18n.lang ) )
    } );
    return Dialog.prompt( {
      title, content,
      label: title,
      render: html => {
        const app = html.closest( ".app" );
        const folder = app.querySelector( "select" );
        if ( folder ) app.querySelector( ".dialog-buttons" ).insertAdjacentElement( "afterbegin", folder );
        app.querySelectorAll( ".window-header .header-button" ).forEach( btn => {
          const label = btn.innerText;
          const icon = btn.querySelector( "i" );
          btn.innerHTML = icon.outerHTML;
          btn.dataset.tooltip = label;
          btn.setAttribute( "aria-label", label );
        } );
        app.querySelector( ".document-name" ).select();
      },
      callback: html => {
        const form = html.querySelector( "form" );
        const fd = new FormDataExtended( form );
        const createData = foundry.utils.mergeObject( data, fd.object, { inplace: false } );
        if ( !createData.folder ) delete createData.folder;
        if ( !createData.name?.trim() ) createData.name = this.defaultName();
        return this.create( createData, { parent, pack, renderSheet: true } );
      },
      rejectClose: false,
      options: { ...options, jQuery: false, width: 350, classes: ["sw5e2", "create-document", "dialog"] }
    } );
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  static getDefaultArtwork( itemData = {} ) {
    const { type } = itemData;
    const { img } = super.getDefaultArtwork( itemData );
    return { img: CONFIG.SW5E.defaultArtwork.Item[type] ?? img };
  }

  /* -------------------------------------------- */
  /*  Item Modifications                          */
  /* -------------------------------------------- */

  async addModification( uuid ) {
    if ( !( "modify" in this.system ) ) return;

    const item = this;
    const itemSysData = item.system;
    const itemMods = itemSysData.modify;
    const mods = [...itemMods.items];

    // Get the modification item
    const mod = await fromUuid( uuid );
    const modSysData = mod?.system;
    const modificationsType = this.modificationsType;

    // Validate the installation
    if ( mod?.type !== "modification" ) return;

    if ( ["none", "enhanced"].includes( itemMods.chassis ) ) {
      ui.notifications.warn(
        game.i18n.format( "SW5E.ErrorModNoChassis", {
          name: item.name
        } )
      );
      return null;
    }

    const rarityMap = {
      standard: 1,
      premium: 2,
      prototype: 3,
      advanced: 4,
      legendary: 5,
      artifact: 6
    };
    if ( itemMods.chassis === "chassis" && ( rarityMap[itemSysData.rarity] ?? 0 ) < ( rarityMap[modSysData.rarity] ?? 0 ) ) {
      ui.notifications.warn(
        game.i18n.format( "SW5E.ErrorModWrongRarity", {
          name: item.name,
          rarity: itemSysData.rarity ?? "common"
        } )
      );
      return null;
    }

    if ( !( modificationsType in CONFIG.SW5E.modificationTypes ) ) {
      ui.notifications.warn(
        game.i18n.format( "SW5E.ErrorModUnrecognizedType", {
          name: item.name,
          type: modificationsType
        } )
      );
      return null;
    }

    if ( !( modSysData.type.value in CONFIG.SW5E.modificationTypes ) ) {
      ui.notifications.warn(
        game.i18n.format( "SW5E.ErrorModUnrecognizedType", {
          name: mod.name,
          type: modSysData.type.value
        } )
      );
      return null;
    }

    const modType = modSysData.type.value === "augment" ? "augment" : "mod";
    if ( modType === "mod" && modificationsType !== modSysData.type.value ) {
      ui.notifications.warn(
        game.i18n.format( "SW5E.ErrorModWrongType", {
          modName: mod.name,
          modType: modSysData.type.value,
          itemName: item.name,
          itemType: modificationsType
        } )
      );
      return null;
    }

    const modCount = mods.filter( m => m.type === modType ).length;
    if ( modCount >= itemMods[`${modType}Slots`] ) {
      ui.notifications.warn(
        game.i18n.format( "SW5E.ErrorModNoSpace", {
          itemName: item.name,
          modName: mod.name,
          modType
        } )
      );
      return null;
    }

    // Apply the changes
    const objData = mod.toObject();
    delete objData._id;
    objData.system.modifying.id = item.id;
    const obj = { objData, name: mod.name, type: modType };

    if ( this.actor ) {
      const items = await this.actor.createEmbeddedDocuments( "Item", [objData] );
      if ( items?.length ) obj.id = items[0].id;
    }

    mods.push( obj );

    if ( mods !== this.system.modify.items ) await this.update( { "system.modify.items": mods } );

    await this.updModificationChanges();
  }

  async updModification( id = null, index = null, objData = null ) {
    if ( !( "modify" in this.system ) ) return;
    if ( id === null && index === null ) return;

    const mods = [...( this.system?.modify?.items ?? [] )];
    if ( id === null ) id = mods[index].id;
    if ( objData === null ) objData = this.actor?.items?.get( id )?.toObject();
    if ( objData === null ) return;

    if ( index === null ) index = mods.findIndex( m => m.id === id );
    if ( index === -1 ) return;
    mods[index].objData = objData;
    mods[index].name = objData.name;
    if ( mods !== this.system.modify.items ) await this.update( { "system.modify.items": mods } );

    await this.updModificationChanges();
  }

  async delModification( id = null, index = null, deleteTempItem = true ) {
    if ( !( "modify" in this.system ) ) return;
    if ( id === null && index === null ) return;

    const mods = [...( this.system?.modify?.items ?? [] )];
    if ( index === null ) index = mods.findIndex( m => m.id === id );
    if ( index === -1 ) return;
    mods.splice( index, 1 );

    if ( mods !== this.system.modify.items ) await this.update( { "system.modify.items": mods } );

    if ( deleteTempItem ) {
      if ( id === null ) id = mods[index].id;
      const item = await this.actor?.items?.get( id );
      await item?.delete();
    }

    await this.updModificationChanges();
  }

  async tglModification( id = null, index = null ) {
    if ( !( "modify" in this.system ) ) return;
    if ( id === null && index === null ) return;

    const mods = [...( this.system?.modify?.items ?? [] )];
    if ( index === null ) index = mods.findIndex( m => m.id === id );
    if ( index === -1 ) return;
    mods[index].disabled = !mods[index].disabled;

    if ( mods !== this.system.modify.items ) await this.update( { "system.modify.items": mods } );

    if ( id === null ) id = mods[index].id;
    await this.actor?.items?.get( id )?.update( { "system.modifying.disabled": mods[index].disabled } );
    await this.updModificationChanges();
  }

  async updModificationChanges() {
    if ( !( "modify" in this.system ) ) return;

    const props = this.propertiesList;
    const itemMods = this.system.modify;
    const mods = itemMods.items;
    let changes = {};

    // Accumulate changes of all active modifications
    for ( const mod of mods ) {
      if ( mod.disabled ) continue;
      this._calcSingleModChanges( mod.objData.system, changes, props );
    }

    changes = foundry.utils.expandObject( changes );

    // Update the changes property
    if ( changes !== this.system.modify.changes ) {
      const updates = {};
      for ( const key of Object.keys( this.system.modify.changes ) ) updates[`system.modify.changes.-=${key}`] = null;
      await this.update( updates );
      await this.update( { "system.modify.changes": changes } );
    }
  }

  _calcSingleModChanges( modSysData, changes, props ) {
    if ( props ) {
      for ( const [prop, propData] of Object.entries( props ) ) {
        if ( propData.type === "Number" && modSysData.properties[prop] ) {
          if ( !changes[`properties.${prop}`] ) changes[`properties.${prop}`] = 0;
          else changes[`properties.${prop}`] = Number( changes[`properties.${prop}`] );
          changes[`properties.${prop}`] += modSysData.properties[prop];
        } else if (
          propData.type === "Boolean"
          && modSysData.properties.indeterminate
          && modSysData.properties.indeterminate[prop] === false
        ) {
          changes[`properties.${prop}`] = modSysData.properties[prop];
        }
      }
    } else if ( modSysData.properties?.indeterminate ) {
      for ( const prop of Object.keys( modSysData?.properties ) ) {
        if ( prop === "indeterminate" ) continue;
        if ( modSysData.properties.indeterminate[prop] === false ) {
          changes[`properties.${prop}`] = modSysData.properties[prop];
        }
      }
    }

    // Attack bonus
    if ( modSysData.attackBonus && modSysData.attackBonus !== "0" ) {
      if ( changes.attackBonus ) changes.attackBonus += " + ";
      else changes.attackBonus = "";
      changes.attackBonus += modSysData.attackBonus.replace( /^\s*[+]\s*/, "" );
    }
    // Damage rolls
    if ( modSysData.damage?.parts?.length ) {
      changes["damage.parts"] ||= [];
      changes["damage.parts"] = changes["damage.parts"].concat( modSysData.damage.parts );
    }

    // Armor Class
    if ( modSysData.armor?.value ) {
      changes["armor.value"] ||= 0;
      changes["armor.value"] += modSysData.armor.value;
    }
    // Dexterity Modifier
    if ( modSysData.armor?.dex ) changes["armor.dex"] = modSysData.armor.dex;
    // Strength Requirement
    if ( modSysData.strength ) changes.strength = modSysData.strength;
    // Stealth Disadvantage
    if ( modSysData.indeterminate?.stealth === false ) changes.stealth = modSysData.stealth;
  }

  /* -------------------------------------------- */
  /*  Migrations & Deprecations                   */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData( source ) {
    source = super.migrateData( source );
    if ( source.type === "class" ) ClassData._migrateTraitAdvancement( source );
    else if ( source.type === "container" ) ContainerData._migrateWeightlessData( source );
    else if ( source.type === "equipment" ) EquipmentData._migrateStealth( source );
    else if ( source.type === "power" ) PowerData._migrateComponentData( source );
    return source;
  }
}
