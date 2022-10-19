import {d20Roll, damageRoll} from "../dice/dice.mjs";
import simplifyRollFormula from "../dice/simplify-roll-formula.mjs";
import {fromUuidSynchronous, fromUuidSafe} from "../utils.js";
import AbilityUseDialog from "../applications/item/ability-use-dialog.mjs";
import Proficiency from "./actor/proficiency.mjs";

/**
 * Override and extend the basic Item implementation.
 */
export default class Item5e extends Item {
    /**
     * Caches an item linked to this one, such as a archetype associated with a class.
     * @type {Item5e}
     * @private
     */
    _classLink;

    constructor(data, context) {
        super(data, context);

        /**
         * An object that tracks which tracks the changes to the data model which were applied by modifications
         * @type {object}
         */
        this.overrides = this.overrides || {};
    }

    /* -------------------------------------------- */
    /*  Item Properties                             */
    /* -------------------------------------------- */

    /**
     * Which ability score modifier is used by this item?
     * @type {string|null}
     */
    get abilityMod() {
        if (!("ability" in this.system)) return null;

        // Case 1 - defined directly by the item
        if (this.system.ability) return this.system.ability;

        // Case 2 - inferred from a parent actor
        if (this.actor) {
            const abilities = this.actor.system.abilities;
            const powercasting = this.actor.system.attributes.powercasting;

            // Powers - Use Actor powercasting modifier based on power school
            const isScroll = this.type === "consumable" && this.system.consumableType === "scroll";
            if (this.type === "power" || isScroll || ["mpak", "rpak"].includes(this.system.actionType)) {
                let school = this.system.school;
                if (game.settings.get("sw5e", "simplifiedForcecasting") && ["lgt", "drk"].includes(school))
                    school = "uni";
                switch (school) {
                    case "lgt":
                        return "wis";
                    case "uni":
                        return abilities.wis.mod >= abilities.cha.mod ? "wis" : "cha";
                    case "drk":
                        return "cha";
                    case "tec":
                        return "int";
                }
                return "none";
            }

            // Special rules per item type
            switch (this.type) {
                case "tool":
                    return "int";
                case "weapon":
                    // Weapons using the powercasting modifier
                    // No current SW5e weapons use this, but it's worth checking just in case
                    if (["mpak", "rpak"].includes(this.system.actionType)) {
                        return powercasting || "int";
                    }

                    // Finesse weapons - Str or Dex (PHB pg. 147)
                    if (this.system.properties.fin === true) {
                        return abilities.dex.mod >= abilities.str.mod ? "dex" : "str";
                    }
                    // Ranged weapons - Dex (PH p.194)
                    if (["simpleB", "martialB"].includes(this.system.weaponType)) return "dex";
                    break;
                case "maneuver":
                    const type = this.system.maneuverType;

                    let attrs = [];
                    if (type === "physical") attrs = ["str", "dex", "con"];
                    else if (type === "mental") attrs = ["int", "wis", "cha"];
                    else attrs = ["str", "dex", "con", "int", "wis", "cha"];

                    const {attr, mod} = attrs.reduce(
                        (acc, attr) => {
                            const mod = abilities[attr]?.mod ?? -1001;
                            if (mod > acc.mod) acc = {attr: attr, mod: mod};
                            return acc;
                        },
                        {attr: "str", mod: -1000}
                    );

                    return attr;
                    break;
            }

            // If a specific attack type is defined
            if (this.hasAttack)
                return {
                    mwak: "str",
                    rwak: "dex"
                }[this.system.actionType];
        }

        // Case 3 - unknown
        return null;
    }

    /* -------------------------------------------- */

    /**
     * Return an item's identifier.
     * @type {string}
     */
    get identifier() {
        return this.system.identifier || this.name.slugify({strict: true});
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
     * Does the Item implement an attack roll as part of its usage?
     * @type {boolean}
     */
    get hasAttack() {
        return ["mwak", "rwak", "mpak", "rpak"].includes(this.system.actionType);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a damage roll as part of its usage?
     * @type {boolean}
     */
    get hasDamage() {
        return !!(this.system.damage && this.system.damage.parts.length);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a versatile damage roll as part of its usage?
     * @type {boolean}
     */
    get isVersatile() {
        return !!(this.hasDamage && this.system.damage.versatile);
    }

    /* -------------------------------------------- */

    /**
     * Does the item provide an amount of healing instead of conventional damage?
     * @type {boolean}
     */
    get isHealing() {
        return this.system.actionType === "heal" && this.system.damage.parts.length;
    }

    /* -------------------------------------------- */

    /**
     * Is this class item the original class for the containing actor? If the item is not a class or it is not
     * embedded in an actor then this will return `null`.
     * @type {boolean|null}
     */
    get isOriginalClass() {
        if (this.type !== "class" || !this.isEmbedded) return null;
        return this.id === this.parent.system.details.originalClass;
    }

    /* -------------------------------------------- */

    /**
     * Class associated with this archetype. Always returns null on non-archetype or non-embedded items.
     * @type {Item5e|null}
     */
    get class() {
        if (!this.isEmbedded || this.type !== "archetype") return null;
        const cid = this.system.classIdentifier;
        return (this._classLink ??= this.parent.items.find((i) => i.type === "class" && i.system.identifier === cid));
    }

    /* -------------------------------------------- */

    /**
     * Archetype associated with this class. Always returns null on non-class or non-embedded items.
     * @type {Item5e|null}
     */
    get archetype() {
        if (!this.isEmbedded || this.type !== "class") return null;
        const items = this.parent.items;
        const cid = this.system.identifier;
        return (this._classLink ??= items.find((i) => i.type === "archetype" && i.system.classIdentifier === cid));
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a saving throw as part of its usage?
     * @type {boolean}
     */
    get hasSave() {
        const save = this.system.save || {};
        return !!(save.ability && save.scaling);
    }

    /* --------------------------------------------- */

    /**
     * Does the Item implement an ability check as part of its usage?
     * @type {boolean}
     */
    get hasAbilityCheck() {
        return this.system.actionType === "abil" && this.system.ability;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item have a target?
     * @type {boolean}
     */
    get hasTarget() {
        const target = this.system.target;
        return target && !["none", ""].includes(target.type);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item have an area of effect target?
     * @type {boolean}
     */
    get hasAreaTarget() {
        const target = this.system.target;
        return target && target.type in CONFIG.SW5E.areaTargetTypes;
    }

    /* -------------------------------------------- */

    /**
     * Is this Item limited in its ability to be used by charges or by recharge?
     * @type {boolean}
     */
    get hasLimitedUses() {
        let recharge = this.system.recharge || {};
        let uses = this.system.uses || {};
        return !!recharge.value || (uses.per && uses.max > 0);
    }

    /* -------------------------------------------- */

    /**
     * Is this item any of the armor subtypes?
     * @type {boolean}
     */
    get isArmor() {
        return this.system.armor?.type in CONFIG.SW5E.armorTypes;
    }

    /* -------------------------------------------- */

    /**
     * Retrieve scale values for current level from advancement data.
     * @type {object}
     */
    get scaleValues() {
        if (!this.advancement.byType.ScaleValue?.length) return {};
        if (!this.advancement.byType.ScaleValue[0].constructor.metadata.validItemTypes.has(this.type)) return {};
        const level = this.curAdvancementLevel;
        return this.advancement.byType.ScaleValue.reduce((obj, advancement) => {
            obj[advancement.identifier] = advancement.prepareValue(level);
            return obj;
        }, {});
    }

    /* -------------------------------------------- */

    /**
     * Retrieve the powercasting for a class or archetype. For classes, this will return the powercasting
     * of the archetype if it overrides the class. For archetypes, this will return the class's powercasting
     * if no powercasting is defined on the archetype.
     * @type {object}  Powercasting object containing progression & ability.
     */
    get powercasting() {
        const powercasting = this.system.powercasting;
        if (!powercasting) return powercasting;
        const isArchetype = this.type === "archetype";
        const classPowercasting = isArchetype ? this.class?.system.powercasting : powercasting;
        const archetypePowercasting = isArchetype ? powercasting : this.archetype?.system.powercasting;
        if (archetypePowercasting && archetypePowercasting.progression !== "none") return archetypePowercasting;
        return classPowercasting;
    }

    /* -------------------------------------------- */

    /**
     * Should this item's active effects be suppressed.
     * @type {boolean}
     */
    get areEffectsSuppressed() {
        const requireEquipped =
            this.type !== "consumable" || ["rod", "trinket", "wand"].includes(this.system.consumableType);
        if (requireEquipped && this.system.equipped === false) return true;

        if (this.type === "modification" && (this.system.modifying === null || this.system.modifying.disabled))
            return true;

        return this.system.attunement === CONFIG.SW5E.attunementTypes.REQUIRED;
    }

    /* -------------------------------------------- */

    /**
     * The current level this item's advancements should have.
     * @type {number}
     * @protected
     */
    get curAdvancementLevel() {
        if (this.type === "class") return this.system?.levels ?? 1;
        if (this.type === "deployment") return this.system?.rank ?? 1;
        if (this.type === "starship") return this.system?.tier ?? 1;
        if (this.type === "archetype") return this.class?.system?.levels ?? 0;
        return this.parent?.system?.details?.level ?? 0;
    }

    /* -------------------------------------------- */

    /**
     * The current character level this item's advancements should have.
     * @type {number}
     * @protected
     */
    get curAdvancementCharLevel() {
        if (this.type === "deployment") return this.parent?.system?.details?.ranks ?? 0;
        if (this.type === "starship") return this.system?.tier ?? 0;
        return this.parent?.system?.details?.level ?? 0;
    }

    /* -------------------------------------------- */

    /**
     * The max level this item's advancements should have.
     * @type {boolean}
     */
    get maxAdvancementLevel() {
        if (this.type === "deployment") return CONFIG.SW5E.maxIndividualRank;
        if (this.type === "starship") return CONFIG.SW5E.maxTier;
        return CONFIG.SW5E.maxLevel;
    }

    /* -------------------------------------------- */

    /**
     * The min level this item's advancements should apply.
     * @type {boolean}
     */
    get minAdvancementLevel() {
        if (["class", "archetype", "deployment", "starship"].includes(this.type)) return 1;
        return 0;
    }

    /* -------------------------------------------- */
    /*  Data Preparation                            */
    /* -------------------------------------------- */

    /** @inheritDoc */
    prepareDerivedData() {
        super.prepareDerivedData();
        this.labels = {};

        // Clear out linked item cache
        this._classLink = undefined;

        // Advancement
        this._prepareAdvancement();

        // Modifications
        this.applyModifications();

        // Specialized preparation per Item type
        switch (this.type) {
            case "equipment":
                this._prepareEquipment();
                break;
            case "feat":
                this._prepareFeat();
                break;
            case "power":
                this._preparePower();
                break;
            case "maneuver":
                this._prepareManeuver();
                break;
            case "starshipmod":
                this._prepareStarshipMod();
                break;
            case "weapon":
                this._prepareWeapon();
                break;
            case "species":
                break;
            case "archetype":
                break;
            case "background":
                break;
            case "classfeature":
                break;
            case "deployment":
                break;
            case "venture":
                break;
            case "fightingstyle":
                break;
            case "fightingmastery":
                break;
            case "lightsaberform":
                break;
        }

        // Activated Items
        this._prepareActivation();
        this._prepareAction();

        // Un-owned items can have their final preparation done here, otherwise this needs to happen in the owning Actor
        if (!this.isOwned) this.prepareFinalAttributes();
    }

    /* -------------------------------------------- */

    /**
     * Apply modifications.
     */
    applyModifications() {
        this.overrides = {};

        // Get the Item's data
        const item = this;
        const itemData = item.system;
        const itemMods = itemData.modify;
        const changes = foundry.utils.flattenObject(itemMods?.changes ?? {});
        const overrides = {};

        if (!itemMods) return;

        // Calculate the type of item modifications accepted
        if (item.type === "equipment") {
            if (itemData.armor?.type in CONFIG.SW5E.armorTypes) itemMods.type = "armor";
            else if (itemData.armor?.type in CONFIG.SW5E.miscEquipmentTypes) itemMods.type = itemData.armor?.type;
            else itemMods.type = null;
        } else if (item.type === "weapon") {
            if (itemData.weaponType?.endsWith("LW")) itemMods.type = "lightweapon";
            else if (itemData.weaponType?.endsWith("VW")) itemMods.type = "vibroweapon";
            else if (itemData.weaponType?.endsWith("B")) itemMods.type = "blaster";
            else itemMods.type = "vibroweapon";
        } else itemMods.type = null;

        if (game.settings.get("sw5e", "disableItemMods") || foundry.utils.isObjectEmpty(changes)) return;

        for (const change in changes) {
            // Handle type specific changes
            if (
                !itemMods.type in CONFIG.SW5E.modificationTypesEquipment &&
                change in ["armor.value", "armor.dex", "strength", "stealth"]
            )
                continue;
            overrides[`system.${change}`] = changes[change];
        }

        // Handle non-overwrite changes
        if ((itemData.attackBonus || "0") !== "0" && overrides["system.attackBonus"]) {
            overrides["system.attackBonus"] = `${itemData.attackBonus} + ${overrides["system.attackBonus"]}`;
        }
        if (itemData.damage?.parts && overrides["system.damage.parts"]) {
            overrides["system.damage.parts"] = itemData.damage.parts.concat(overrides["system.damage.parts"]);
        }
        if (itemData.armor?.value && overrides["system.armor.value"])
            overrides["system.armor.value"] += itemData.armor.value;

        let props = null;
        if (item.type === "weapon") props = CONFIG.SW5E.weaponProperties;
        if (item.type === "equipment") {
            if (itemData.armor.type in CONFIG.SW5E.armorTypes) props = CONFIG.SW5E.armorProperties;
            if (itemData.armor.type in CONFIG.SW5E.castingEquipmentTypes) props = CONFIG.SW5E.castingProperties;
        }
        if (props) {
            for (const [prop, propData] of Object.entries(props)) {
                if (propData.type === "Number" && overrides[`system.properties.${prop}`]) {
                    if (itemData.properties[prop])
                        overrides[`system.properties.${prop}`] += Number(itemData.properties[prop]);
                    if (propData.min !== undefined)
                        overrides[`system.properties.${prop}`] = Math.max(
                            overrides[`system.properties.${prop}`],
                            propData.min
                        );
                    if (propData.max !== undefined)
                        overrides[`system.properties.${prop}`] = Math.min(
                            overrides[`system.properties.${prop}`],
                            propData.max
                        );
                }
            }
        }

        for (const prop of Object.keys(overrides)) {
            foundry.utils.setProperty(this.data, prop, overrides[prop]);
        }
        this.overrides = foundry.utils.expandObject(overrides);
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for an equipment-type item and define labels.
     * @protected
     */
    _prepareEquipment() {
        this.labels.armor = this.system.armor.value
            ? `${this.system.armor.value} ${game.i18n.localize("SW5E.AC")}`
            : "";
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for a feat-type item and define labels.
     * @protected
     */
    _prepareFeat() {
        const act = this.system.activation;
        const types = CONFIG.SW5E.abilityActivationTypes;
        if (act?.type === types.legendary) this.labels.featType = game.i18n.localize("SW5E.LegendaryActionLabel");
        else if (act?.type === types.lair) this.labels.featType = game.i18n.localize("SW5E.LairActionLabel");
        else if (act?.type) {
            this.labels.featType = game.i18n.localize(this.system.damage.length ? "SW5E.Attack" : "SW5E.Action");
        } else this.labels.featType = game.i18n.localize("SW5E.Passive");
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for a power-type item and define labels.
     * @protected
     */
    _preparePower() {
        const tags = Object.fromEntries(
            Object.entries(CONFIG.SW5E.powerTags).map(([k, v]) => {
                v.tag = true;
                return [k, v];
            })
        );
        const attributes = {...CONFIG.SW5E.powerComponents, ...tags};
        this.system.preparation.mode ||= "prepared";
        this.labels.level = CONFIG.SW5E.powerLevels[this.system.level];
        this.labels.school = CONFIG.SW5E.powerSchools[this.system.school];
        this.labels.components = Object.entries(this.system.components).reduce(
            (obj, [c, active]) => {
                const config = attributes[c];
                if (!config || active !== true) return obj;
                obj.all.push({abbr: config.abbr, tag: config.tag});
                if (config.tag) obj.tags.push(config.label);
                else obj.vsm.push(config.abbr);
                return obj;
            },
            {all: [], vsm: [], tags: []}
        );
        this.labels.materials = this.system?.materials?.value ?? null;
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for a maneuver-type item and define labels.
     * @protected
     */
    _prepareManuever() {
        labels.maneuverType = game.i18n.localize(CONFIG.SW5E.maneuverTypes[this.system.maneuverType]);
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for a starship mod-type item and define labels.
     * @protected
     */
    _prepareStarshipMod() {
        foundry.utils.setProperty(
            this.system,
            "baseCost.value",
            this.system?.baseCost?.value || CONFIG.SW5E.ssModSystemsBaseCost[this.system.system.value]
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for a weapon-type item and define labels.
     * @protected
     */
    _prepareWeapon() {
        this.system.ammo.max = this.system.properties.rel || this.system.properties.ovr || 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data for activated items and define labels.
     * @protected
     */
    _prepareActivation() {
        if (!("activation" in this.system)) return;
        const C = CONFIG.SW5E;

        // Ability Activation Label
        const act = this.system.activation ?? {};
        this.labels.activation = [act.cost, C.abilityActivationTypes[act.type]].filterJoin(" ");

        // Target Label
        let tgt = this.system.target ?? {};
        if (["none", "touch", "self"].includes(tgt.units)) tgt.value = null;
        if (["none", "self"].includes(tgt.type)) {
            tgt.value = null;
            tgt.units = null;
        }
        this.labels.target = [tgt.value, C.distanceUnits[tgt.units], C.targetTypes[tgt.type]].filterJoin(" ");

        // Range Label
        let rng = this.system.range ?? {};
        if (["none", "touch", "self"].includes(rng.units)) {
            rng.value = null;
            rng.long = null;
        }
        this.labels.range = [rng.value, rng.long ? `/ ${rng.long}` : null, C.distanceUnits[rng.units]].filterJoin(" ");

        // Duration Label
        let dur = this.system.duration ?? {};
        if (["inst", "perm"].includes(dur.units)) dur.value = null;
        this.labels.duration = [dur.value, C.timePeriods[dur.units]].filterJoin(" ");

        // Recharge Label
        let chg = this.system.recharge ?? {};
        const chgSuffix = `${chg.value}${parseInt(chg.value) < 6 ? "+" : ""}`;
        this.labels.recharge = `${game.i18n.localize("SW5E.Recharge")} [${chgSuffix}]`;
    }

    /* -------------------------------------------- */

    /**
     * Prepare derived data and labels for items which have an action which deals damage.
     * @protected
     */
    _prepareAction() {
        if (!("actionType" in this.system)) return;
        let dmg = this.system.damage || {};
        if (dmg.parts) {
            const types = CONFIG.SW5E.damageTypes;
            this.labels.damage = dmg.parts
                .map((d) => d[0])
                .join(" + ")
                .replace(/\+ -/g, "- ");
            this.labels.damageTypes = dmg.parts.map((d) => types[d[1]]).join(", ");
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare advancement objects from stored advancement data.
     * @protected
     */
    _prepareAdvancement() {
        const minAdvancementLevel = ["class", "archetype"].includes(this.type) ? 1 : 0;
        const maxLevel = this.maxAdvancementLevel;
        this.advancement = {
            byId: {},
            byLevel: Object.fromEntries(
                Array.fromRange(maxLevel + 1)
                    .slice(minAdvancementLevel)
                    .map((l) => [l, []])
            ),
            byType: {},
            needingConfiguration: []
        };
        for (const advancementData of this.system.advancement ?? []) {
            const Advancement = sw5e.advancement.types[`${advancementData.type}Advancement`];
            if (!Advancement) continue;
            const advancement = new Advancement(this, advancementData);
            this.advancement.byId[advancement.id] = advancement;
            this.advancement.byType[advancementData.type] ??= [];
            this.advancement.byType[advancementData.type].push(advancement);
            advancement.levels.forEach((l) => this.advancement.byLevel[l].push(advancement));
            if (!advancement.levels.length) this.advancement.needingConfiguration.push(advancement);
        }
        Object.entries(this.advancement.byLevel).forEach(([lvl, data]) =>
            data.sort((a, b) => {
                return a.sortingValueForLevel(lvl).localeCompare(b.sortingValueForLevel(lvl));
            })
        );
    }

    /* -------------------------------------------- */

    /**
     * Compute item attributes which might depend on prepared actor data. If this item is embedded this method will
     * be called after the actor's data is prepared.
     * Otherwise, it will be called at the end of `Item5e#prepareDerivedData`.
     */
    prepareFinalAttributes() {
        // Proficiency
        if (this.type === "weapon" && this.system.weaponType in CONFIG.SW5E.weaponStarshipTypes)
            this.system.proficient = true;
        const isProficient = this.type === "power" || this.system.proficient; // Always proficient in power attacks.
        this.system.prof = new Proficiency(this.actor?.system.attributes.prof, isProficient);

        // Class data
        if (this.type === "class") this.system.isOriginalClass = this.isOriginalClass;

        // Action usage
        if ("actionType" in this.system) {
            this.labels.abilityCheck = game.i18n.format("SW5E.AbilityPromptTitle", {
                ability: CONFIG.SW5E.abilities[this.system.ability]
            });

            // Saving throws
            this.getSaveDC();

            // To Hit
            this.getAttackToHit();

            // Limited Uses
            this.prepareMaxUses();

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
        if (!this.hasDamage || !this.isOwned) return [];
        const rollData = this.getRollData();
        const damageLabels = {...CONFIG.SW5E.damageTypes, ...CONFIG.SW5E.healingTypes};
        const derivedDamage = this.system.damage?.parts?.map((damagePart) => {
            let formula;
            try {
                const roll = new Roll(damagePart[0], rollData);
                formula = simplifyRollFormula(roll.formula, {preserveFlavor: true});
            } catch (err) {
                console.warn(`Unable to simplify formula for ${this.name}: ${err}`);
            }
            const damageType = damagePart[1];
            return {formula, damageType, label: `${formula} ${damageLabels[damageType] ?? ""}`};
        });
        return (this.labels.derivedDamage = derivedDamage);
    }

    /* -------------------------------------------- */

    /**
     * Update the derived power DC for an item that requires a saving throw.
     * @returns {number|null}
     */
    getSaveDC() {
        if (!this.hasSave) return null;
        const save = this.system.save;

        // Actor power-DC based scaling
        if (save.scaling === "power") {
            switch (this.system.school) {
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
        else if (save.scaling !== "flat") {
            save.dc = this.isOwned ? this.actor.system.abilities[save.scaling].dc : null;
        }

        // Update labels
        const abl = CONFIG.SW5E.abilities[save.ability] ?? "";
        this.labels.save = game.i18n.format("SW5E.SaveDC", {dc: save.dc || "", ability: abl});
        return save.dc;
    }

    /* -------------------------------------------- */

    /**
     * Update a label to the Item detailing its total to hit bonus from the following sources:
     * - item document's innate attack bonus
     * - item's actor's proficiency bonus if applicable
     * - item's actor's global bonuses to the given item type
     * - item's ammunition if applicable
     * @returns {{rollData: object, parts: string[]}|null}  Data used in the item's Attack roll.
     */
    getAttackToHit() {
        if (!this.hasAttack) return null;
        const rollData = this.getRollData();

        // Use wisdom on attack rolls for starship weapons, unless an item specific ability is set
        if (rollData && !this.system.ability && (this.system.weaponType ?? "").search("(starship)") !== -1)
            rollData.mod = rollData.abilities.wis?.mod;

        // Define Roll bonuses
        const parts = [];

        // Include the item's innate attack bonus as the initial value and label
        const ab = this.system.attackBonus;
        if (ab) {
            parts.push(ab);
            this.labels.toHit = !/^[+-]/.test(ab) ? `+ ${ab}` : ab;
        }

        // Take no further action for un-owned items
        if (!this.isOwned) return {rollData, parts};

        // Ability score modifier
        parts.push("@mod");

        // Add proficiency bonus if an explicit proficiency flag is present or for non-item features
        if (!["weapon", "consumable"].includes(this.type) || this.system.proficient) {
            parts.push("@prof");
            if (this.system.prof?.hasProficiency) {
                rollData.prof = this.system.prof.term;
            }
        }

        // Actor-level global bonus to attack rolls
        const actorBonus = this.actor.system.bonuses?.[this.system.actionType] || {};
        if (actorBonus.attack) parts.push(actorBonus.attack);

        // One-time bonus provided by consumed ammunition
        if ((this.system.ammo?.target || this.system.consume?.type === "ammo") && this.actor.items) {
            const isReload = this.system.ammo?.target;

            const ammoItem = this.actor.items.get(this.system.consume?.target || this.system.ammo?.target);

            if (ammoItem) {
                const ammoItemQuantity = isReload ? this.system.ammo?.value : ammoItem.system?.quantity;
                const ammoConsumeAmmount = isReload ? 1 : this.system.consume.amount ?? 0;
                const ammoCanBeConsumed = ammoItemQuantity && ammoItemQuantity - ammoConsumeAmmount >= 0;
                const ammoItemAttackBonus = ammoItem.system.attackBonus;
                const ammoIsTypeConsumable =
                    ammoItem.type === "consumable" && ammoItem.system.consumableType === "ammo";
                if (ammoCanBeConsumed && ammoItemAttackBonus && ammoIsTypeConsumable) {
                    parts.push("@ammo");
                    rollData.ammo = ammoItemAttackBonus;
                }
            }
        }

        // Condense the resulting attack bonus formula into a simplified label
        const roll = new Roll(parts.join("+"), rollData);
        const formula = simplifyRollFormula(roll.formula) || "0";
        this.labels.toHit = !/^[+-]/.test(formula) ? `+ ${formula}` : formula;
        return {rollData, parts};
    }

    /* -------------------------------------------- */

    /**
     * Retrieve an item's critical hit threshold.
     * Uses a custom treshold if the item has one set
     * Otherwise, uses the smaller value from amongst the following:
     * - item document's actor's critical threshold (if it has one)
     * - the constant '20' - item document's keen property (if it has one)
     *
     * @returns {number|null}  The minimum value that must be rolled to be considered a critical hit.
     */
    getCriticalThreshold() {
        // Get the actor's critical threshold
        const actorFlags = this.actor.flags.sw5e || {};
        if (!this.hasAttack) return null;
        let actorThreshold = null;
        if (this.type === "weapon") actorThreshold = actorFlags.weaponCriticalThreshold;
        else if (this.type === "power") actorThreshold = actorFlags.powerCriticalThreshold;
        // Get the item's critical threshold
        const itemTreshold = Math.min(this.system.critical?.threshold ?? 20, 20 - (this.system?.properties?.ken ?? 0));

        // Use the lowest of the the item and actor thresholds
        return Math.max(Math.min(itemTreshold, actorThreshold ?? 20), 15);
    }

    /* -------------------------------------------- */

    /**
     * Retrieve an item's number of bonus dice on a critical hit. Uses the sum of the extra damage from the
     * following sources:
     * - item entity's brutal property (if it has one)
     * - item entity's actor (if it has one)
     *
     * @returns {number|null}  The extra dice of damage dealt on a critical hit.
     */

    getCriticalExtraDice() {
        const itemData = this.system;
        const actorFlags = this.actor.flags.sw5e || {};
        if (!this.hasAttack || !itemData) return;

        let dice = 0;

        // Get the actor's extra damage
        if (itemData.actionType === "mwak") dice += this.actor.getFlag("sw5e", "meleeCriticalDamageDice") ?? 0;
        // TODO: Maybe add flags for the other attack types?

        // Get the item's extra damage
        dice += itemData.properties?.bru ?? 0;

        return dice;
    }

    /* -------------------------------------------- */

    /**
     * Populates the max uses of an item.
     * If the item is an owned item and the `max` is not numeric, calculate based on actor data.
     */
    prepareMaxUses() {
        const uses = this.system.uses;
        if (!uses?.max) return;
        let max = uses.max;

        if (this.isOwned && !Number.isNumeric(max)) {
            try {
                const rollData = this.actor.getRollData({deterministic: true});
                max = Roll.safeEval(Roll.replaceFormulaData(max, rollData, {missing: 0, warn: true}));
            } catch (e) {
                console.error("Problem preparing Max uses for", this.name, e);
                return;
            }
        }
        uses.max = Number(max);
    }

    /* -------------------------------------------- */

    /**
     * Configuration data for an item usage being prepared.
     *
     * @typedef {object} ItemUseConfiguration
     * @property {boolean} createMeasuredTemplate  Trigger a template creation
     * @property {boolean} consumeQuantity         Should the item's quantity be consumed?
     * @property {boolean} consumeRecharge         Should a recharge be consumed?
     * @property {boolean} consumeResource         Should a linked (non-ammo) resource be consumed?
     * @property {number|string|null} consumePowerLevel  Specific power level to consume, or "pact" for pact level.
     * @property {boolean} consumePowerSlot        Should any power slot be consumed?
     * @property {boolean} consumeSuperiorityDie   Should superiority die be consumed?
     * @property {boolean} consumeUsage            Should limited uses be consumed?
     * @property {boolean} needsConfiguration      Is user-configuration needed?
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
     */

    /**
     * Trigger an item usage, optionally creating a chat message with followup actions.
     * @param {ItemUseOptions} [options]           Options used for configuring item usage.
     * @returns {Promise<ChatMessage|object|void>} Chat message if options.createMessage is true, message data if it is
     *                                             false, and nothing if the roll wasn't performed.
     * @deprecated since 2.0 in favor of `Item5e#use`, targeted for removal in 2.4
     */
    async roll(options = {}) {
        foundry.utils.logCompatibilityWarning(
            "Item5e#roll has been renamed Item5e#use. Support for the old name will be removed in future versions.",
            {since: "SW5e 2.0", until: "SW5e 2.4"}
        );
        return this.use(undefined, options);
    }

    /**
     * Trigger an item usage, optionally creating a chat message with followup actions.
     * @param {ItemUseConfiguration} [config]      Initial configuration data for the usage.
     * @param {ItemUseOptions} [options]           Options used for configuring item usage.
     * @returns {Promise<ChatMessage|object|void>} Chat message if options.createMessage is true, message data if it is
     *                                             false, and nothing if the roll wasn't performed.
     */
    async use(config = {}, options = {}) {
        let item = this;
        const is = item.system;
        const actor = this.actor;
        const starship = actor.getStarship();
        const as = item.actor.system;

        // Ensure the options object is ready
        options = foundry.utils.mergeObject(
            {
                configureDialog: true,
                createMessage: true,
                flags: {}
            },
            options
        );

        // Reference aspects of the item data necessary for usage
        const resource = is.consume || {}; // Resource consumption
        const isPower = item.type === "power"; // Does the item require a power slot?
        // TODO: Possibly Mod this to not consume slots based on class?
        // We could use this for feats and architypes that let a character cast one slot every rest or so
        const requirePowerSlot = isPower && is.level > 0 && CONFIG.SW5E.powerUpcastModes.includes(is.preparation.mode);

        // Define follow-up actions resulting from the item usage
        config = foundry.utils.mergeObject(
            {
                createMeasuredTemplate: item.hasAreaTarget,
                consumeQuantity: is.uses?.autoDestroy ?? false,
                consumeRecharge: !!is.recharge?.value,
                consumeResource:
                    !!resource.target &&
                    (!item.hasAttack ||
                        (resource.type !== "ammo" &&
                            !(resource.type === "charges" && resource.target.system.consumableType === "ammo"))),
                consumePowerLevel: requirePowerSlot ? is.level : null,
                consumePowerSlot: requirePowerSlot,
                consumeSuperiorityDie: item.type === "maneuver",
                consumeUsage: !!is.uses?.per
            },
            config
        );

        // Display a configuration dialog to customize the usage
        const needsConfiguration =
            createMeasuredTemplate ||
            consumeRecharge ||
            (consumeResource && !["simpleB", "martialB"].includes(id.weaponType)) ||
            consumePowerSlot ||
            consumeSuperiorityDie ||
            (consumeUsage && !["simpleB", "martialB"].includes(id.weaponType));
        if (configureDialog && needsConfiguration) {
            const configuration = await AbilityUseDialog.create(this);
            if (!configuration) return;

            // Determine consumption preferences
            createMeasuredTemplate = Boolean(configuration.placeTemplate);
            consumeUsage = Boolean(configuration.consumeUse);
            consumeRecharge = Boolean(configuration.consumeRecharge);
            consumeResource = Boolean(configuration.consumeResource);
            consumePowerSlot = Boolean(configuration.consumeSlot);
            consumeSuperiorityDie = Boolean(configuration.consumeSuperiorityDie);

            // Handle power upcasting
            if (requirePowerSlot) {
                consumePowerLevel = `power${configuration.level}`;
                if (consumePowerSlot === false) consumePowerLevel = null;
                const upcastLevel = parseInt(configuration.level);
                if (!Number.isNaN(upcastLevel) && upcastLevel !== id.level) {
                    item = this.clone({"data.level": upcastLevel}, {keepId: true});
                    item.data.update({_id: this.id}); // Retain the original ID (needed until 0.8.2+)
                    item.prepareFinalAttributes(); // Power save DC, etc...
                }
            }
        }

        // Determine whether the item can be used by testing for resource consumption
        const usage = item._getUsageUpdates({
            consumeRecharge,
            consumeResource,
            consumePowerLevel,
            consumeSuperiorityDie,
            consumeUsage,
            consumeQuantity
        });
        if (!usage) return;

        const {actorUpdates, itemUpdates, resourceUpdates, starshipUpdates} = usage;

        // Commit pending data updates
        if (!foundry.utils.isObjectEmpty(itemUpdates)) await item.update(itemUpdates);
        if (consumeQuantity && item.data.data.quantity === 0) await item.delete();
        if (!foundry.utils.isObjectEmpty(actorUpdates)) await actor.update(actorUpdates);
        if (starship && !foundry.utils.isObjectEmpty(starshipUpdates)) await starship.update(starshipUpdates);
        if (resourceUpdates.length) await actor.updateEmbeddedDocuments("Item", resourceUpdates);

        // Initiate measured template creation
        if (createMeasuredTemplate) {
            const template = game.sw5e.canvas.AbilityTemplate.fromItem(item);
            if (template) template.drawPreview();
        }

        // Create or return the Chat Message data
        return item.displayCard({rollMode, createMessage});
    }

    /* -------------------------------------------- */

    /**
     * Verify that the consumed resources used by an Item are available.
     * Otherwise display an error and return false.
     * @param {object} options
     * @param {boolean} options.consumeQuantity           Consume quantity of the item if other consumption modes are not
     *                                                    available?
     * @param {boolean} options.consumeRecharge           Whether the item consumes the recharge mechanic
     * @param {boolean} options.consumeReload             Whether the item consumes loaded ammo
     * @param {boolean} options.consumeResource           Whether the item consumes a limited resource
     * @param {string|null} options.consumePowerLevel     The category of power slot to consume, or null
     * @param {boolean} options.consumeSuperiorityDie     Wheter the item consumes a superiority die
     * @param {boolean} options.consumeUsage              Whether the item consumes a limited usage
     * @returns {object|boolean}                          A set of data changes to apply when the item is used, or false
     * @private
     */

    _getUsageUpdates({
        consumeQuantity,
        consumeRecharge,
        consumeReload,
        consumeResource,
        consumePowerLevel,
        consumeSuperiorityDie,
        consumeUsage
    }) {
        // Reference item data
        const id = this.data.data;
        const actorUpdates = {};
        const itemUpdates = {};
        const resourceUpdates = [];
        const starshipUpdates = {};

        // Consume Recharge
        if (consumeRecharge) {
            const recharge = id.recharge || {};
            if (recharge.charged === false) {
                ui.notifications.warn(game.i18n.format("SW5E.ItemNoUses", {name: this.name}));
                return false;
            }
            itemUpdates["data.recharge.charged"] = false;
        }

        // Consume Weapon Reload
        if (consumeReload) {
            if (id.ammo.value <= 0) {
                if (id.properties.rel)
                    ui.notifications.warn(game.i18n.format("SW5E.ItemReloadNeeded", {name: this.name}));
                else if (id.properties.ovr)
                    ui.notifications.warn(game.i18n.format("SW5E.ItemCoolDownNeeded", {name: this.name}));
                return false;
            }
            itemUpdates["data.ammo.value"] = id.ammo.value - 1;
        }

        // Consume Limited Resource
        if (consumeResource) {
            const canConsume = this._handleConsumeResource(itemUpdates, actorUpdates, resourceUpdates, starshipUpdates);
            if (canConsume === false) return false;
        }

        // Consume Power Slots and Force/Tech Points
        if (consumePowerLevel) {
            if (Number.isNumeric(consumePowerLevel)) consumePowerLevel = `power${consumePowerLevel}`;
            const level = this.actor?.data.data.powers[consumePowerLevel];
            const fp = this.actor.data.data.attributes.force.points;
            const tp = this.actor.data.data.attributes.tech.points;
            const powerCost = parseInt(id.level, 10) + 1;
            const innatePower = this.actor.data.data.attributes.powercasting === "innate";
            if (!innatePower) {
                switch (id.school) {
                    case "lgt":
                    case "uni":
                    case "drk": {
                        const powers = Number(level?.fvalue ?? 0);
                        if (powers === 0) {
                            const label = game.i18n.localize(`SW5E.PowerLevel${id.level}`);
                            ui.notifications.warn(
                                game.i18n.format("SW5E.PowerCastNoSlots", {name: this.name, level: label})
                            );
                            return false;
                        }
                        actorUpdates[`data.powers.${consumePowerLevel}.fvalue`] = Math.max(powers - 1, 0);
                        if (fp.temp >= powerCost) {
                            actorUpdates["data.attributes.force.points.temp"] = fp.temp - powerCost;
                        } else {
                            actorUpdates["data.attributes.force.points.value"] = fp.value + fp.temp - powerCost;
                            actorUpdates["data.attributes.force.points.temp"] = 0;
                        }
                        break;
                    }
                    case "tec": {
                        const powers = Number(level?.tvalue ?? 0);
                        if (powers === 0) {
                            const label = game.i18n.localize(`SW5E.PowerLevel${id.level}`);
                            ui.notifications.warn(
                                game.i18n.format("SW5E.PowerCastNoSlots", {name: this.name, level: label})
                            );
                            return false;
                        }
                        actorUpdates[`data.powers.${consumePowerLevel}.tvalue`] = Math.max(powers - 1, 0);
                        if (tp.temp >= powerCost) {
                            actorUpdates["data.attributes.tech.points.temp"] = tp.temp - powerCost;
                        } else {
                            actorUpdates["data.attributes.tech.points.value"] = tp.value + tp.temp - powerCost;
                            actorUpdates["data.attributes.tech.points.temp"] = 0;
                        }
                        break;
                    }
                }
            }
        }

        // Consume Superiority Die
        if (consumeSuperiorityDie) {
            const curDice = this.actor?.data?.data?.attributes?.super?.dice?.value;
            if (!curDice) return false;
            actorUpdates["data.attributes.super.dice.value"] = curDice - 1;
        }

        // Consume Limited Usage
        if (consumeUsage) {
            const uses = id.uses || {};
            const available = Number(uses.value ?? 0);
            let used = false;

            // Reduce usages
            const remaining = Math.max(available - 1, 0);
            if (available >= 1) {
                used = true;
                itemUpdates["data.uses.value"] = remaining;
            }

            // Reduce quantity if not reducing usages or if usages hit 0 and we are set to consumeQuantity
            if (consumeQuantity && (!used || remaining === 0)) {
                const q = Number(id.quantity ?? 1);
                if (q >= 1) {
                    used = true;
                    itemUpdates["data.quantity"] = Math.max(q - 1, 0);
                    itemUpdates["data.uses.value"] = uses.max ?? 1;
                }
            }

            // If the item was not used, return a warning
            if (!used) {
                ui.notifications.warn(game.i18n.format("SW5E.ItemNoUses", {name: this.name}));
                return false;
            }
        }

        // Return the configured usage
        return {itemUpdates, actorUpdates, resourceUpdates, starshipUpdates};
    }

    /* -------------------------------------------- */

    /**
     * Handle update actions required when consuming an external resource
     * @param {object} itemUpdates        An object of data updates applied to this item
     * @param {object} actorUpdates       An object of data updates applied to the item owner (Actor)
     * @param {object[]} resourceUpdates  An object of data updates applied to a different resource item (Item)
     * @param {object} starshipUpdates    An object of data updates applied to the item owner's deployed starship (Actor)
     * @returns {boolean|void}            Return false to block further progress, or return nothing to continue
     * @private
     */
    _handleConsumeResource(itemUpdates, actorUpdates, resourceUpdates, starshipUpdates) {
        const actor = this.actor;
        const starship = actor.getStarship();
        const itemData = this.data.data;
        let consume = itemData.consume || {};
        if (!consume.type) return;

        // No consumed target
        const typeLabel = CONFIG.SW5E.abilityConsumptionTypes[consume.type];
        if (!consume.target) {
            ui.notifications.warn(
                game.i18n.format("SW5E.ConsumeWarningNoResource", {name: this.name, type: typeLabel})
            );
            return false;
        }

        // Identify the consumed resource and its current quantity
        let resource = null;
        let amount = Number(consume.amount ?? 1);
        let quantity = 0;
        switch (consume.type) {
            case "attribute":
                resource = getProperty(actor.data.data, consume.target);
                quantity = resource || 0;
                break;
            case "ammo":
            case "material":
                resource = actor.items.get(consume.target);
                quantity = resource ? resource.data.data.quantity : 0;
                break;
            case "hitDice":
                const denom = !["smallest", "largest"].includes(consume.target) ? consume.target : false;
                resource = Object.values(actor.classes).filter((cls) => !denom || cls.data.data.hitDice === denom);
                quantity = resource.reduce((count, cls) => count + cls.data.data.levels - cls.data.data.hitDiceUsed, 0);
                break;
            case "charges":
                resource = actor.items.get(consume.target);
                if (!resource) break;
                const uses = resource.data.data.uses;
                if (uses.per && uses.max) quantity = uses.value;
                else if (resource.data.data.recharge?.value) {
                    quantity = resource.data.data.recharge.charged ? 1 : 0;
                    amount = 1;
                }
                break;
            case "powerdice":
                if (!starship) {
                    ui.notifications.warn(
                        game.i18n.format("SW5E.ConsumeWarningNotDeployed", {name: this.name, actor: actor.name})
                    );
                    return false;
                }
                resource = getProperty(starship.data.data, consume.target);
                quantity = resource || 0;
                break;
        }

        // Verify that a consumed resource is available
        if (resource === undefined) {
            ui.notifications.warn(game.i18n.format("SW5E.ConsumeWarningNoSource", {name: this.name, type: typeLabel}));
            return false;
        }

        // Verify that the required quantity is available
        let remaining = quantity - amount;
        if (remaining < 0 && consume.type === "powerdice") {
            consume = {
                target: "attributes.power.central.value",
                type: "powerdice"
            };
            resource = getProperty(starship.data.data, consume.target);
            quantity = resource || 0;
            remaining = quantity - amount;
        }
        if (remaining < 0) {
            ui.notifications.warn(
                game.i18n.format("SW5E.ConsumeWarningNoQuantity", {name: this.name, type: typeLabel})
            );
            return false;
        }

        // Define updates to provided data objects
        switch (consume.type) {
            case "attribute":
                actorUpdates[`data.${consume.target}`] = remaining;
                break;
            case "ammo":
            case "material":
                resourceUpdates.push({"_id": consume.target, "data.quantity": remaining});
                break;
            case "hitDice":
                if (["smallest", "largest"].includes(consume.target))
                    resource = resource.sort((lhs, rhs) => {
                        let sort = lhs.data.data.hitDice.localeCompare(rhs.data.data.hitDice, "en", {numeric: true});
                        if (consume.target === "largest") sort *= -1;
                        return sort;
                    });
                let toConsume = consume.amount;
                for (const cls of resource) {
                    const d = cls.data.data;
                    const available = (toConsume > 0 ? d.levels : 0) - d.hitDiceUsed;
                    const delta = toConsume > 0 ? Math.min(toConsume, available) : Math.max(toConsume, available);
                    if (delta !== 0) {
                        resourceUpdates.push({"_id": cls.id, "data.hitDiceUsed": d.hitDiceUsed + delta});
                        toConsume -= delta;
                        if (toConsume === 0) break;
                    }
                }
            case "charges":
                const uses = resource.data.data.uses || {};
                const recharge = resource.data.data.recharge || {};
                const data = {_id: consume.target};
                if (uses.per && uses.max) data["data.uses.value"] = remaining;
                else if (recharge.value) data["data.recharge.charged"] = false;
                resourceUpdates.push(data);
                break;
            case "powerdice":
                starshipUpdates[`data.${consume.target}`] = remaining;
                break;
        }
    }

    /* -------------------------------------------- */

    /**
     * Display the chat card for an Item as a Chat Message
     * @param {object} [options]                Options which configure the display of the item chat card
     * @param {string} [options.rollMode]       The message visibility mode to apply to the created card
     * @param {boolean} [options.createMessage] Whether to automatically create a ChatMessage document (if true), or only
     *                                          return the prepared message data (if false)
     * @returns {ChatMessage|object}            Chat message if `createMessage` is true, otherwise an object containing message data.
     */
    async displayCard({rollMode, createMessage = true} = {}) {
        // Render the chat card template
        const token = this.actor.token;
        const templateData = {
            actor: this.actor.data,
            tokenId: token?.uuid || null,
            item: this.data,
            data: this.getChatData(this.actor.owner),
            labels: this.labels,
            hasAttack: this.hasAttack,
            isHealing: this.isHealing,
            hasDamage: this.hasDamage,
            isVersatile: this.isVersatile,
            isPower: this.data.type === "power",
            hasSave: this.hasSave,
            hasAreaTarget: this.hasAreaTarget,
            isTool: this.data.type === "tool",
            hasAbilityCheck: this.hasAbilityCheck
        };
        const html = await renderTemplate("systems/sw5e/templates/chat/item-card.html", templateData);

        // Create the ChatMessage data object
        const chatData = {
            user: game.user.data._id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: html,
            flavor: this.data.data.chatFlavor || this.name,
            speaker: ChatMessage.getSpeaker({actor: this.actor, token}),
            flags: {"core.canPopout": true}
        };

        // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
        if (this.data.type === "consumable" && !this.actor.items.has(this.id)) {
            chatData.flags["sw5e.itemData"] = this.data;
        }

        // Apply the roll mode to adjust message visibility
        ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode"));

        // Create the Chat Message or return its data
        return createMessage ? ChatMessage.create(chatData) : chatData;
    }

    /* -------------------------------------------- */
    /*  Chat Cards                                  */
    /* -------------------------------------------- */

    /**
     * Prepare an object of chat data used to display a card for the Item in the chat log.
     * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
     * @returns {object}              An object of chat data to render.
     */
    getChatData(htmlOptions = {}) {
        const data = foundry.utils.deepClone(this.data.data);
        const labels = this.labels;

        // Rich text description
        data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);

        // Item type specific properties
        const props = [];
        const fn = this[`_${this.data.type}ChatData`];
        if (fn) fn.bind(this)(data, labels, props);

        // Equipment properties
        if (data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.data.type)) {
            if (data.attunement === CONFIG.SW5E.attunementTypes.REQUIRED) {
                props.push(CONFIG.SW5E.attunements[CONFIG.SW5E.attunementTypes.REQUIRED]);
            }
            props.push(
                game.i18n.localize(data.equipped ? "SW5E.Equipped" : "SW5E.Unequipped"),
                game.i18n.localize(data.proficient ? "SW5E.Proficient" : "SW5E.NotProficient")
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            props.push(
                labels.activation + (data.activation?.condition ? ` (${data.activation.condition})` : ""),
                labels.target,
                labels.range,
                labels.duration
            );
        }

        // Filter properties and return
        data.properties = props.filter((p) => !!p);
        return data;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for equipment type items.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _equipmentChatData(data, labels, props) {
        props.push(
            CONFIG.SW5E.equipmentTypes[data.armor.type],
            labels.armor || null,
            data.stealth.value ? game.i18n.localize("SW5E.StealthDisadvantage") : null
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for weapon type items.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _weaponChatData(data, labels, props) {
        props.push(CONFIG.SW5E.weaponTypes[data.weaponType]);
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for consumable type items.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _consumableChatData(data, labels, props) {
        props.push(
            CONFIG.SW5E.consumableTypes[data.consumableType],
            `${data.uses.value}/${data.uses.max} ${game.i18n.localize("SW5E.Charges")}`
        );
        data.hasCharges = data.uses.value >= 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for tool type items.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _toolChatData(data, labels, props) {
        props.push(
            CONFIG.SW5E.abilities[data.ability] || null,
            CONFIG.SW5E.proficiencyLevels[data.proficient || 0].label
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for loot type items.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _lootChatData(data, labels, props) {
        props.push(
            game.i18n.localize("SW5E.ItemTypeLoot"),
            data.weight ? `${data.weight} ${game.i18n.localize("SW5E.AbbreviationLbs")}` : null
        );
    }

    /* -------------------------------------------- */

    /**
     * Render a chat card for Power type data.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _powerChatData(data, labels, props) {
        props.push(labels.level, ...labels.components.tags);
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for items of the Feat type.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    _featChatData(data, labels, props) {
        props.push(data.requirements);
    }

    /* -------------------------------------------- */
    /*  Item Rolls - Attack, Damage, Saves, Checks  */
    /* -------------------------------------------- */

    /**
     * Place an attack roll using an item (weapon, feat, power, or equipment)
     * Rely upon the d20Roll logic for the core implementation
     *
     * @param {object} options        Roll options which are configured and provided to the d20Roll function
     * @returns {Promise<Roll|null>}  A Promise which resolves to the created Roll instance
     */
    async rollAttack(options = {}) {
        const itemData = this.data.data;
        const flags = this.actor.data.flags.sw5e || {};
        if (!this.hasAttack) {
            throw new Error("You may not place an Attack Roll with this Item.");
        }
        let title = `${this.name} - ${game.i18n.localize("SW5E.AttackRoll")}`;

        // Get the parts and rollData for this item's attack
        const {parts, rollData} = this.getAttackToHit();

        // Handle ammunition consumption
        delete this._ammo;
        let ammo = null;
        let ammoUpdate = [];
        let itemUpdate = {};
        const consume = itemData.consume;
        if (itemData.ammo?.max) {
            ammo = this.actor.items.get(itemData.ammo.target);
            if (ammo) {
                const q = itemData.ammo.value;
                const consumeAmount = 1;
                if (q && q - consumeAmount >= 0) {
                    this._ammo = ammo;
                    title += ` [${ammo.name}]`;
                }
            }

            // Get pending reload update
            const usage = this._getUsageUpdates({consumeReload: true});
            if (usage === false) return null;
            itemUpdate = usage.itemUpdates || {};
        } else if (consume?.type === "ammo") {
            ammo = this.actor.items.get(consume.target);
            if (ammo?.data) {
                const quant = ammo.data.data.quantity;
                const consumeAmount = consume.amount ?? 0;
                if (quant && quant - consumeAmount >= 0) {
                    this._ammo = ammo;
                    title += ` [${ammo.name}]`;
                }
            }

            // Get pending ammunition update
            const usage = this._getUsageUpdates({consumeResource: true});
            if (usage === false) return null;
            ammoUpdate = usage.resourceUpdates || [];
        } else if (consume?.type === "charges") {
            ammo = this.actor.items.get(consume.target);
            if (ammo?.data?.data?.consumableType === "ammo") {
                const uses = ammo.data.data.uses;
                if (uses.per && uses.max) {
                    const q = ammo.data.data.uses.value;
                    const consumeAmount = consume.amount ?? 0;
                    if (q && q - consumeAmount >= 0) {
                        this._ammo = ammo;
                        title += ` [${ammo.name}]`;
                    }
                }

                // Get pending ammunition update
                const usage = this._getUsageUpdates({consumeResource: true});
                if (usage === false) return null;
                ammoUpdate = usage.resourceUpdates || [];
            }
        }

        // Compose roll options
        let rollConfig = {
            parts: parts,
            actor: this.actor,
            data: rollData,
            title: title,
            flavor: title,
            dialogOptions: {
                width: 400,
                top: options.event ? options.event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            messageData: {
                "flags.sw5e.roll": {type: "attack", itemId: this.id},
                "speaker": ChatMessage.getSpeaker({actor: this.actor})
            }
        };

        // Critical hit thresholds
        rollConfig.critical = this.getCriticalThreshold();

        // Elven Accuracy
        if (flags.elvenAccuracy && ["dex", "int", "wis", "cha"].includes(this.abilityMod)) {
            rollConfig.elvenAccuracy = true;
        }

        // Apply Halfling Lucky
        if (flags.halflingLucky) rollConfig.halflingLucky = true;

        // Compose calculated roll options with passed-in roll options
        rollConfig = mergeObject(rollConfig, options);

        // Invoke the d20 roll helper
        const roll = await d20Roll(rollConfig);
        if (roll === null) return null;

        // Commit ammunition consumption on attack rolls resource consumption if the attack roll was made
        if (ammoUpdate.length) await this.actor?.updateEmbeddedDocuments("Item", ammoUpdate);
        if (!foundry.utils.isObjectEmpty(itemUpdate)) await this.update(itemUpdate);
        return roll;
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
     * @param {object} [config.options]      Additional options passed to the damageRoll function
     * @returns {Promise<Roll>}              A Promise which resolves to the created Roll instance, or null if the action
     *                                       cannot be performed.
     */
    rollDamage({critical = false, event = null, powerLevel = null, versatile = false, options = {}} = {}) {
        if (!this.hasDamage) throw new Error("You may not make a Damage Roll with this Item.");
        const itemData = this.data.data;
        const actorData = this.actor.data.data;
        const messageData = {
            "flags.sw5e.roll": {type: "damage", itemId: this.id},
            "speaker": ChatMessage.getSpeaker({actor: this.actor})
        };

        // Get roll data
        const parts = itemData.damage.parts.map((d) => d[0]);
        const rollData = this.getRollData();
        if (powerLevel) rollData.item.level = powerLevel;

        // Configure the damage roll
        const actionFlavor = game.i18n.localize(itemData.actionType === "heal" ? "SW5E.Healing" : "SW5E.DamageRoll");
        const title = `${this.name} - ${actionFlavor}`;
        const rollConfig = {
            actor: this.actor,
            critical: critical ?? event?.altKey ?? false,
            data: rollData,
            event: event,
            fastForward: event ? event.shiftKey || event.altKey || event.ctrlKey || event.metaKey : false,
            parts: parts,
            title: title,
            flavor: this.labels.damageTypes.length ? `${title} (${this.labels.damageTypes})` : title,
            dialogOptions: {
                width: 400,
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710
            },
            messageData
        };

        // Adjust damage from versatile usage
        if (versatile && itemData.damage.versatile) {
            parts[0] = itemData.damage.versatile;
            messageData["flags.sw5e.roll"].versatile = true;
        }

        // Scale damage from up-casting powers
        if (this.data.type === "power") {
            if (itemData.scaling.mode === "atwill") {
                let level;
                if (this.actor.type === "character") level = actorData.details.level;
                else if (itemData.preparation.mode === "innate") level = Math.ceil(actorData.details.cr);
                else if (itemData.school === "tec") level = actorData.details.powerTechLevel;
                else if (["lgt", "drk", "uni"].includes(itemData.school)) level = actorData.details.powerForceLevel;
                else level = actorData.details.powerLevel;
                this._scaleAtWillDamage(parts, itemData.scaling.formula, level, rollData);
            } else if (powerLevel && itemData.scaling.mode === "level" && itemData.scaling.formula) {
                const scaling = itemData.scaling.formula;
                this._scalePowerDamage(parts, itemData.level, powerLevel, scaling, rollData);
            }
        }

        // Add damage bonus formula
        const actorBonus = getProperty(actorData, `bonuses.${itemData.actionType}`) || {};
        if (actorBonus.damage && parseInt(actorBonus.damage) !== 0) {
            parts.push(actorBonus.damage);
        }

        // Handle ammunition damage
        const ammoData = this._ammo?.data;

        // Only add the ammunition damage if the ammution is a consumable with type 'ammo'
        if (this._ammo && ammoData.type === "consumable" && ammoData.data.consumableType === "ammo") {
            parts.push("@ammo");
            rollData.ammo = ammoData.data.damage.parts.map((p) => p[0]).join("+");
            rollConfig.flavor += ` [${this._ammo.name}]`;
            delete this._ammo;
        }

        // Factor in extra critical damage dice from the item and actor
        rollConfig.criticalBonusDice = this.getCriticalExtraDice();

        // Factor in extra weapon-specific critical damage
        if (itemData.critical?.damage) {
            rollConfig.criticalBonusDamage = itemData.critical.damage;
        }

        // Call the roll helper utility
        return damageRoll(foundry.utils.mergeObject(rollConfig, options));
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
    _scaleAtWillDamage(parts, scale, level, rollData) {
        const add = Math.floor((level + 1) / 6);
        if (add === 0) return;
        return this._scaleDamage(parts, scale || parts.join(" + "), add, rollData);
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
    _scalePowerDamage(parts, baseLevel, powerLevel, formula, rollData) {
        const upcastLevels = Math.max(powerLevel - baseLevel, 0);
        if (upcastLevels === 0) return parts;
        this._scaleDamage(parts, formula, upcastLevels, rollData);
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
    _scaleDamage(parts, scaling, times, rollData) {
        if (times <= 0) return parts;
        const p0 = new Roll(parts[0], rollData);
        const s = new Roll(scaling, rollData).alter(times);

        // Attempt to simplify by combining like dice terms
        let simplified = false;
        if (s.terms[0] instanceof Die && s.terms.length === 1) {
            const d0 = p0.terms[0];
            const s0 = s.terms[0];
            if (d0 instanceof Die && d0.faces === s0.faces && d0.modifiers.equals(s0.modifiers)) {
                d0.number += s0.number;
                parts[0] = p0.formula;
                simplified = true;
            }
        }

        // Otherwise add to the first part
        if (!simplified) {
            parts[0] = `${parts[0]} + ${s.formula}`;
        }
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
    async rollFormula({powerLevel} = {}) {
        if (!this.data.data.formula) {
            throw new Error("This Item does not have a formula to roll!");
        }

        // Define Roll Data
        const rollData = this.getRollData();
        if (powerLevel) rollData.item.level = powerLevel;
        const title = `${this.name} - ${game.i18n.localize("SW5E.OtherFormula")}`;

        // Invoke the roll and submit it to chat
        const roll = await new Roll(rollData.item.formula, rollData).roll({async: true});
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            flavor: title,
            rollMode: game.settings.get("core", "rollMode"),
            messageData: {"flags.sw5e.roll": {type: "other", itemId: this.id}}
        });
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Perform an ability recharge test for an item which uses the d6 recharge mechanic.
     * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance
     */
    async rollRecharge() {
        const data = this.data.data;
        if (!data.recharge.value) return;

        // Roll the check
        const roll = await new Roll("1d6").roll({async: true});
        const success = roll.total >= parseInt(data.recharge.value);

        // Display a Chat Message
        const promises = [
            roll.toMessage({
                flavor: `${game.i18n.format("SW5E.ItemRechargeCheck", {name: this.name})} - ${game.i18n.localize(
                    success ? "SW5E.ItemRechargeSuccess" : "SW5E.ItemRechargeFailure"
                )}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token})
            })
        ];

        // Update the Item data
        if (success) promises.push(this.update({"data.recharge.charged": true}));
        return Promise.all(promises).then(() => roll);
    }

    /* -------------------------------------------- */

    /**
     * Prepare data needed to roll a tool check and then pass it off to `d20Roll`.
     * @param {object} [options]  Roll configuration options provided to the d20Roll function.
     * @returns {Promise<Roll>}   A Promise which resolves to the created Roll instance.
     */
    rollToolCheck(options = {}) {
        if (this.type !== "tool") throw new Error("Wrong item type!");

        // Prepare roll data
        const rollData = this.getRollData();
        const abl = this.data.data.ability;
        const parts = ["@mod", "@abilityCheckBonus"];
        const title = `${this.name} - ${game.i18n.localize("SW5E.ToolCheck")}`;

        // Add proficiency
        if (this.data.data.prof?.hasProficiency) {
            parts.push("@prof");
            rollData.prof = this.data.data.prof.term;
        }

        // Add tool bonuses
        if (this.data.data.bonus) {
            parts.push("@toolBonus");
            rollData.toolBonus = Roll.replaceFormulaData(this.data.data.bonus, rollData);
        }

        // Add ability-specific check bonus
        if (getProperty(rollData, `abilities.${abl}.bonuses.check`)) {
            rollData.abilityCheckBonus = Roll.replaceFormulaData(checkBonus, rollData);
        } else rollData.abilityCheckBonus = 0;

        // Add global actor bonus
        const bonuses = getProperty(this.actor.data.data, "bonuses.abilities") || {};
        if (bonuses.check) {
            parts.push("@checkBonus");
            rollData.checkBonus = Roll.replaceFormulaData(bonuses.check, rollData);
        }

        // Compose the roll data
        const rollConfig = mergeObject(
            {
                parts: parts,
                data: rollData,
                title: title,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: title,
                dialogOptions: {
                    width: 400,
                    top: options.event ? options.event.clientY - 80 : null,
                    left: window.innerWidth - 710
                },
                chooseModifier: true,
                halflingLucky: this.actor.getFlag("sw5e", "halflingLucky") || false,
                reliableTalent: this.data.data.proficient >= 1 && this.actor.getFlag("sw5e", "reliableTalent"),
                messageData: {
                    "speaker": options.speaker || ChatMessage.getSpeaker({actor: this.actor}),
                    "flags.sw5e.roll": {type: "tool", itemId: this.id}
                }
            },
            options
        );
        rollConfig.event = options.event;

        // Call the roll helper utility
        return d20Roll(rollConfig);
    }

    /* -------------------------------------------- */

    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item.
     * @returns {object}  Data used for @ formula replacement in Roll formulas.
     * @private
     */
    getRollData() {
        if (!this.actor) return null;

        const actorRollData = this.actor.getRollData();

        const rollData = {
            ...actorRollData,
            item: foundry.utils.deepClone(this.data.data)
        };

        // Include an ability score modifier if one exists
        const abl = this.abilityMod;
        if (abl) {
            const ability = rollData.abilities[abl];
            if (!ability) {
                console.warn(
                    `Item ${this.name} in Actor ${this.actor.name} has an invalid item ability modifier of ${abl} defined`
                );
            }
            rollData.mod = ability?.mod || 0;
        }

        return rollData;
    }

    /* -------------------------------------------- */
    /*  Chat Message Helpers                        */
    /* -------------------------------------------- */

    /**
     * Apply listeners to chat messages.
     * @param {HTML} html  Rendered chat message.
     */
    static chatListeners(html) {
        html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
        html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Handle execution of a chat card action via a click event on one of the card buttons
     * @param {Event} event       The originating click event
     * @returns {Promise}         A promise which resolves once the handler workflow is complete
     * @private
     */
    static async _onChatCardAction(event) {
        event.preventDefault();

        // Extract card data
        const button = event.currentTarget;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        // Validate permission to proceed with the roll
        const isTargetted = action === "save";
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Recover the actor for the chat card
        const actor = await this._getChatCardActor(card);
        if (!actor) return;

        // Get the Item from stored flag data or by the item ID on the Actor
        const storedData = message.getFlag("sw5e", "itemData");
        const item = storedData ? new this(storedData, {parent: actor}) : actor.items.get(card.dataset.itemId);
        if (!item) {
            return ui.notifications.error(
                game.i18n.format("SW5E.ActionWarningNoItem", {item: card.dataset.itemId, name: actor.name})
            );
        }
        const powerLevel = parseInt(card.dataset.powerLevel) || null;

        // Handle different actions
        let targets;
        switch (action) {
            case "attack":
                await item.rollAttack({event});
                break;
            case "damage":
            case "versatile":
                await item.rollDamage({
                    critical: event.altKey,
                    event: event,
                    powerLevel: powerLevel,
                    versatile: action === "versatile"
                });
                break;
            case "formula":
                await item.rollFormula({event, powerLevel});
                break;
            case "save":
                targets = this._getChatCardTargets(card);
                for (let token of targets) {
                    const speaker = ChatMessage.getSpeaker({scene: canvas.scene, token: token});
                    await token.actor.rollAbilitySave(button.dataset.ability, {event, speaker});
                }
                break;
            case "toolCheck":
                await item.rollToolCheck({event});
                break;
            case "placeTemplate":
                const template = game.sw5e.canvas.AbilityTemplate.fromItem(item);
                if (template) template.drawPreview();
                break;
            case "abilityCheck":
                targets = this._getChatCardTargets(card);
                for (let token of targets) {
                    const speaker = ChatMessage.getSpeaker({scene: canvas.scene, token: token});
                    await token.actor.rollAbilityTest(button.dataset.ability, {event, speaker});
                }
                break;
        }

        // Re-enable the button
        button.disabled = false;
    }

    /* -------------------------------------------- */

    /**
     * Handle toggling the visibility of chat card content when the name is clicked
     * @param {Event} event   The originating click event
     * @private
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest(".chat-card");
        const content = card.querySelector(".card-content");
        if (content) content.style.display = content.style.display === "none" ? "block" : "none";
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @returns {Actor|null}        The Actor document or null
     * @private
     */
    static async _getChatCardActor(card) {
        // Case 1 - a synthetic actor from a Token
        if (card.dataset.tokenId) {
            const token = await fromUuid(card.dataset.tokenId);
            if (!token) return null;
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const actorId = card.dataset.actorId;
        return game.actors.get(actorId) || null;
    }

    /* -------------------------------------------- */

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @returns {Actor[]}           An Array of Actor documents, if any
     * @private
     */
    static _getChatCardTargets(card) {
        let targets = canvas.tokens.controlled.filter((t) => !!t.actor);
        if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
        if (!targets.length) ui.notifications.warn(game.i18n.localize("SW5E.ActionWarningNoToken"));
        return targets;
    }

    /* -------------------------------------------- */
    /*  Advancements                                */
    /* -------------------------------------------- */

    /**
     * Create a new advancement of the specified type.
     * @param {string} type                        Type of advancement to create.
     * @param {object} [data]                      Data to use when creating the advancement.
     * @param {object} [options]
     * @param {boolean} [options.showConfig=true]  Should the new advancement's configuration application be shown?
     * @returns {Promise<AdvancementConfig>}
     */
    async createAdvancement(type, data = {}, {showConfig = true} = {}) {
        if (!this.data.data.advancement) return;

        const Advancement = game.sw5e.advancement.types[`${type}Advancement`];
        if (!Advancement) throw new Error(`${type}Advancement not found in game.sw5e.advancement.types`);
        data = foundry.utils.mergeObject(Advancement.defaultData, data);

        const advancement = foundry.utils.deepClone(this.data.data.advancement);
        if (!data._id) data._id = foundry.utils.randomID();
        advancement.push(data);
        await this.update({"data.advancement": advancement});

        if (!showConfig) return;
        const config = new Advancement.metadata.apps.config(this.advancement.byId[data._id]);
        return config.render(true);
    }

    /* -------------------------------------------- */

    /**
     * Update an advancement belonging to this item.
     * @param {string} id          ID of the advancement to update.
     * @param {object} updates     Updates to apply to this advancement, using the same format as `Document#update`.
     * @returns {Promise<Item5e>}  This item with the changes applied.
     */
    async updateAdvancement(id, updates) {
        if (!this.data.data.advancement) return;

        const idx = this.data.data.advancement.findIndex((a) => a._id === id);
        if (idx === -1) throw new Error(`Advancement of ID ${id} could not be found to update`);

        const advancement = foundry.utils.deepClone(this.data.data.advancement);
        foundry.utils.mergeObject(advancement[idx], updates);
        return this.update({"data.advancement": advancement});
    }

    /* -------------------------------------------- */

    /**
     * Remove an advancement from this item.
     * @param {number} id          ID of the advancement to remove.
     * @returns {Promise<Item5e>}  This item with the changes applied.
     */
    async deleteAdvancement(id) {
        if (!this.data.data.advancement) return;
        return this.update({"data.advancement": this.data.data.advancement.filter((a) => a._id !== id)});
    }

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    /** @inheritdoc */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Create class identifier based on name
        if (["class", "archetype"].includes(this.type) && !this.data.data.identifier) {
            await this.data.update({"data.identifier": data.name.slugify({strict: true})});
        }

        let updates;
        if (!this.isEmbedded) {
            switch (data.type) {
                case "modification":
                    updates = this._onCreateUnownedModification(data);
                    break;
            }
        } else {
            if (this.parent.type === "vehicle") return;
            const actorData = this.parent.data;
            const isNPC = this.parent.type === "npc";
            const isStarship = this.parent.type === "starship";
            switch (data.type) {
                case "equipment":
                    updates = this._onCreateOwnedEquipment(data, actorData, isNPC || isStarship);
                    break;
                case "power":
                    updates = this._onCreateOwnedPower(data, actorData, isNPC);
                    break;
                case "tool":
                    updates = this._onCreateOwnedTool(data, actorData, isNPC);
                    break;
                case "weapon":
                    updates = this._onCreateOwnedWeapon(data, actorData, isNPC);
                    break;
            }
        }

        if (updates) return this.data.update(updates);
    }

    /** @inheritdoc */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);

        const changes = foundry.utils.flattenObject(changed);
        delete changes["_id"];
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static async _onCreateDocuments(items, context) {
        return await super._onCreateDocuments(items, context);
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        if (userId !== game.user.id || !this.parent) return;

        // Assign a new original class
        if (this.parent.type === "character" && this.type === "class") {
            const pc = this.parent.items.get(this.parent.data.data.details.originalClass);
            if (!pc) await this.parent._assignPrimaryClass();
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);
        if (this.type !== "class" || !changed.data || !("levels" in changed.data)) return;

        // Check to make sure the updated class level isn't below zero
        if (changed.data.levels <= 0) {
            ui.notifications.warn(game.i18n.localize("SW5E.MaxClassLevelMinimumWarn"));
            changed.data.levels = 1;
        }

        // Check to make sure the updated class level doesn't exceed level cap
        if (changed.data.levels > CONFIG.SW5E.maxLevel) {
            ui.notifications.warn(game.i18n.format("SW5E.MaxClassLevelExceededWarn", {max: CONFIG.SW5E.maxLevel}));
            changed.data.levels = CONFIG.SW5E.maxLevel;
        }
        if (!this.isEmbedded || this.parent.type !== "character") return;

        // Check to ensure the updated character doesn't exceed level cap
        const newCharacterLevel = this.actor.data.data.details.level + (changed.data.levels - this.data.data.levels);
        if (newCharacterLevel > CONFIG.SW5E.maxLevel) {
            ui.notifications.warn(game.i18n.format("SW5E.MaxCharacterLevelExceededWarn", {max: CONFIG.SW5E.maxLevel}));
            changed.data.levels -= newCharacterLevel - CONFIG.SW5E.maxLevel;
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        const changes = foundry.utils.flattenObject(changed);
        delete changes["_id"];

        // If a temporary modification item changes it's data, update the data in the modified item
        if (this.type === "modification" && this.actor && this.data.data?.modifying?.id) {
            const modType = this.data.data?.modificationType === "augment" ? "augment" : "mod";
            this.actor.items.get(this.data.data.modifying.id)?.updModification(this.id, null, this.data.toObject());
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDelete(options, userId) {
        super._onDelete(options, userId);
        if (userId !== game.user.id || !this.parent) return;

        // Assign a new original class
        if (this.type === "class" && this.id === this.parent.data.data.details.originalClass) {
            this.parent._assignPrimaryClass();
        }

        // Remove modification data from modified item
        if (this.type === "modification") {
            const modType = this.data.data?.modificationType === "augment" ? "augment" : "mod";
            this.actor?.items?.get(this.data.data?.modifying?.id)?.delModification(this.id, null, false);
        }
        // Delete any temporary modification items on the parent actor created by this item
        else {
            const itemMods = this.data.data?.modify;
            if (this.actor && itemMods) for (const mod of itemMods.items) this.actor.items.get(mod.id)?.delete();
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
    _onCreateUnownedModification(data) {
        const updates = {};

        // Unowned modifications are not modifying any item
        if (foundry.utils.getProperty(data, "data.modifying.id") !== null) updates["data.modifying.id"] = null;
        if (foundry.utils.getProperty(data, "data.modifying.disabled") !== false)
            updates["data.modifying.disabled"] = false;

        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Pre-creation logic for the automatic configuration of owned equipment type Items.
     *
     * @param {object} data           Data for the newly created item.
     * @param {object} actorData      Data for the actor to which the item is being added.
     * @param {boolean} isNPCorSS     Is this actor an NPC or Starship?
     * @returns {object}              Updates to apply to the item data.
     * @private
     */
    _onCreateOwnedEquipment(data, actorData, isNPCorSS) {
        const updates = {};
        if (foundry.utils.getProperty(data, "data.equipped") === undefined) {
            updates["data.equipped"] = isNPCorSS; // NPCs and Starships automatically equip equipment
        }

        if (foundry.utils.getProperty(data, "data.proficient") === undefined) {
            if (isNPCorSS) {
                updates["data.proficient"] = true; // NPCs and Starships automatically have equipment proficiency
            } else {
                const armorProf = CONFIG.SW5E.armorProficienciesMap[this.data.data.armor?.type]; // Player characters check proficiency
                const actorArmorProfs = actorData.data.traits?.armorProf?.value || [];
                updates["data.proficient"] =
                    armorProf === true ||
                    actorArmorProfs.includes(armorProf) ||
                    actorArmorProfs.includes(this.data.data.baseItem);
            }
        }
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Pre-creation logic for the automatic configuration of owned power type Items.
     *
     * @param {object} data       Data for the newly created item.
     * @param {object} actorData  Data for the actor to which the item is being added.
     * @param {boolean} isNPC     Is this actor an NPC?
     * @returns {object}          Updates to apply to the item data.
     * @private
     */
    _onCreateOwnedPower(data, actorData, isNPC) {
        const updates = {};
        updates["data.preparation.prepared"] = true; // Automatically prepare powers for everyone
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Pre-creation logic for the automatic configuration of owned tool type Items.
     *
     * @param {object} data       Data for the newly created item.
     * @param {object} actorData  Data for the actor to which the item is being added.
     * @param {boolean} isNPC     Is this actor an NPC?
     * @returns {object}          Updates to apply to the item data.
     * @private
     */
    _onCreateOwnedTool(data, actorData, isNPC) {
        const updates = {};
        if (data.data?.proficient === undefined) {
            if (isNPC) {
                updates["data.proficient"] = 1;
            } else if (actorData.type !== "starship") {
                const actorToolProfs = actorData.data.traits?.toolProf?.value;
                const proficient =
                    actorToolProfs.includes(this.data.data.toolType) ||
                    actorToolProfs.includes(this.data.data.baseItem);
                updates["data.proficient"] = Number(proficient);
            }
        }
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Pre-creation logic for the automatic configuration of owned weapon type Items.
     * @param {object} data       Data for the newly created item.
     * @param {object} actorData  Data for the actor to which the item is being added.
     * @param {boolean} isNPC     Is this actor an NPC?
     * @returns {object}          Updates to apply to the item data.
     * @private
     */
    _onCreateOwnedWeapon(data, actorData, isNPC) {
        const updates = {};

        // NPCs automatically equip items and are proficient with them
        if (isNPC) {
            updates["data.equipped"] = true;
            updates["data.proficient"] = true;
            return updates;
        }

        if (data.data?.proficient !== undefined) return updates;

        // Some weapon types are always proficient
        const weaponProf = CONFIG.SW5E.weaponProficienciesMap[this.data.data.weaponType];
        if (weaponProf === true) updates["data.proficient"] = true;
        // Characters may have proficiency in this weapon type (or specific base weapon)
        else {
            const actorProfs = actorData.data.traits?.weaponProf?.value || [];
            updates["data.proficient"] =
                actorProfs.includes(weaponProf) || actorProfs.includes(this.data.data.baseItem);
        }
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Handle the weapon reload logic.
     */
    reloadWeapon() {
        if (this.type !== "weapon") return;

        const wpnData = this.data.data;
        const actor = this.actor;
        const ammo = wpnData.ammo.target ? actor?.items?.get(wpnData.ammo.target) : null;
        const ammoData = ammo?.data?.data;

        let toReload = wpnData.ammo.max - wpnData.ammo.value;
        const updates = [];

        if (ammo) {
            if (!wpnData.ammo.types.includes(ammoData.ammoType)) return;
            if (ammoData.quantity <= 0) return;

            switch (ammoData.ammoType) {
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
                    toReload = Math.min(toReload, ammoData.quantity);
                    updates.push({
                        "data.quantity": ammoData.quantity - toReload,
                        "_id": ammo.id
                    });
                    break;
                case "powerCell":
                case "flechetteClip":
                case "flechetteMag":
                case "powerGenerator":
                case "projectorCanister":
                case "projectorTank":
                    updates.push({
                        "data.quantity": ammoData.quantity - 1,
                        "_id": ammo.id
                    });
                    break;
            }
        }

        if (toReload <= 0) return;
        updates.push({
            "data.ammo.value": wpnData.ammo.value + toReload,
            "_id": this.id
        });

        if (updates.length) actor.updateEmbeddedDocuments("Item", updates);
    }

    /* -------------------------------------------- */
    /*  Factory Methods                             */
    /* -------------------------------------------- */
    // TODO: Make work properly
    /**
     * Create a consumable power scroll Item from a power Item.
     * @param {Item5e} power      The power to be made into a scroll
     * @returns {Item5e}          The created scroll consumable item
     */
    static async createScrollFromPower(power) {
        // Get power data
        const itemData = power instanceof Item5e ? power.toObject() : power;
        const {actionType, description, source, activation, duration, target, range, damage, formula, save, level} =
            itemData.data;

        // Get scroll data
        const scrollUuid = `Compendium.${CONFIG.SW5E.sourcePacks.ITEMS}.${CONFIG.SW5E.powerScrollIds[level]}`;
        const scrollItem = await fromUuid(scrollUuid);
        const scrollData = scrollItem.toObject();
        delete scrollData._id;

        // Split the scroll description into an intro paragraph and the remaining details
        const scrollDescription = scrollData.data.description.value;
        const pdel = "</p>";
        const scrollIntroEnd = scrollDescription.indexOf(pdel);
        const scrollIntro = scrollDescription.slice(0, scrollIntroEnd + pdel.length);
        const scrollDetails = scrollDescription.slice(scrollIntroEnd + pdel.length);

        // Create a composite description from the scroll description and the power details
        const desc = `${scrollIntro}<hr/><h3>${itemData.name} (Level ${level})</h3><hr/>${description.value}<hr/><h3>Scroll Details</h3><hr/>${scrollDetails}`;

        // Create the power scroll data
        const powerScrollData = foundry.utils.mergeObject(scrollData, {
            name: `${game.i18n.localize("SW5E.PowerScroll")}: ${itemData.name}`,
            img: itemData.img,
            data: {
                "description.value": desc.trim(),
                source,
                actionType,
                activation,
                duration,
                target,
                range,
                damage,
                formula,
                save,
                level
            }
        });
        return new this(powerScrollData);
    }

    /* -------------------------------------------- */
    /*  Item Modifications                          */
    /* -------------------------------------------- */

    async addModification(uuid) {
        const item = this;
        const itemData = item.data.data;
        const itemMods = itemData.modify;
        if (!itemMods) return;

        const mod = await fromUuid(uuid);
        const modData = mod?.data?.data;
        if (mod?.type !== "modification") return;

        const rarityMap = {
            standard: 1,
            premium: 2,
            prototype: 3,
            advanced: 4,
            legendary: 5,
            artifact: 6
        };

        if (["none", "enhanced"].includes(itemMods.chassis))
            return ui.notifications.warn(
                game.i18n.format("SW5E.ErrorModNoChassis", {
                    name: item.name
                })
            );
        if (itemMods.chassis === "chassis" && (rarityMap[itemData.rarity] ?? 0) < (rarityMap[modData.rarity] ?? 0)) {
            return ui.notifications.warn(
                game.i18n.format("SW5E.ErrorModWrongRarity", {
                    name: item.name,
                    rarity: itemData.rarity ?? "common"
                })
            );
        }

        if (!(itemMods.type in CONFIG.SW5E.modificationTypes))
            return ui.notifications.warn(
                game.i18n.format("SW5E.ErrorModUnrecognizedType", {
                    name: item.name,
                    type: itemMods.type
                })
            );

        if (!(modData.modificationType in CONFIG.SW5E.modificationTypes))
            return ui.notifications.warn(
                game.i18n.format("SW5E.ErrorModUnrecognizedType", {
                    name: mod.name,
                    type: modData.modificationType
                })
            );

        const modType = modData.modificationType === "augment" ? "augment" : "mod";
        if (modType === "mod" && itemMods.type !== modData.modificationType)
            return ui.notifications.warn(
                game.i18n.format("SW5E.ErrorModWrongType", {
                    modName: mod.name,
                    modType: modData.modificationType,
                    itemName: item.name,
                    itemType: itemMods.type
                })
            );

        const modCount = itemMods.items.filter((m) => m.type === modType).length;
        if (modCount >= itemMods[`${modType}Slots`])
            return ui.notifications.warn(
                game.i18n.format("SW5E.ErrorModNoSpace", {
                    itemName: item.name,
                    modName: mod.name,
                    modType: modType
                })
            );

        const updates = {};

        const data = mod.toObject();
        delete data._id;
        data.data.modifying.id = item.id;
        const obj = {data: data, name: mod.name, type: modType};

        if (this.actor) {
            const items = await Item5e.createDocuments([data], {parent: this.actor});
            if (items?.length) obj.id = items[0].id;
        }

        itemMods.items.push(obj);
        updates[`data.modify.items`] = itemMods.items;

        if (!foundry.utils.isObjectEmpty(updates)) await this.update(updates);

        await this.updModificationChanges();
    }

    async updModification(id = null, index = null, data = null) {
        if (id === null && index === null) return;

        const mods = this.data?.data?.modify?.items;
        if (mods) {
            if (id === null) id = mods[index].id;
            if (data === null) data = this.actor?.items?.get(id)?.toObject();
            if (data === null) return;

            if (index === null) index = mods.findIndex((m) => m.id === id);
            if (index === -1) return;
            mods[index].data = data;
            mods[index].name = data.name;
            await this.update({[`data.modify.items`]: mods});
        }

        await this.updModificationChanges();
    }

    async delModification(id = null, index = null, deleteTempItem = true) {
        if (id === null && index === null) return;

        const mods = this.data?.data?.modify?.items;
        if (mods) {
            if (index === null) index = mods.findIndex((m) => m.id === id);
            if (index === -1) return;
            mods.splice(index, 1);
            await this.update({[`data.modify.items`]: mods});
        }

        if (deleteTempItem) {
            if (id === null) id = mods[index].id;
            const item = await this.actor?.items?.get(id);
            await item.delete();
        }

        await this.updModificationChanges();
    }

    async tglModification(id = null, index = null) {
        if (id === null && index === null) return;

        const mods = this.data?.data?.modify?.items;
        if (mods) {
            if (index === null) index = mods.findIndex((m) => m.id === id);
            if (index === -1) return;
            mods[index].disabled = !mods[index].disabled;
            await this.update({[`data.modify.items`]: mods});

            if (id === null) id = mods[index].id;
            await this.actor?.items?.get(id)?.update({"data.modifying.disabled": mods[index].disabled});
        }

        await this.updModificationChanges();
    }

    async updModificationChanges() {
        const changes = {};
        const itemMods = this.data.data.modify;
        if (!itemMods) return;

        // Precalculate valid properties
        let props = null;
        if (this.type === "weapon") props = CONFIG.SW5E.weaponProperties;
        if (this.type === "equipment") {
            if (itemData.armor.type in CONFIG.SW5E.armorTypes) props = CONFIG.SW5E.armorProperties;
            if (itemData.armor.type in CONFIG.SW5E.castingEquipmentTypes) props = CONFIG.SW5E.castingProperties;
        }

        const mods = itemMods.items;
        for (const mod of mods) {
            if (mod.disabled) continue;
            this._calcSingleModChanges(mod.data.data, changes, props);
        }

        if (itemMods.changes !== changes) {
            if (
                itemMods.changes !== null &&
                itemMods.changes !== undefined &&
                Object.keys(itemMods.changes).length !== 0
            ) {
                await this.update({"data.modify.-=changes": null});
            }
            if (changes !== null && changes !== undefined && Object.keys(changes) !== 0) {
                await this.update({"data.modify.changes": changes});
            }
        }
    }
    _calcSingleModChanges(mod, changes, props) {
        if (props) {
            for (const [prop, propData] of Object.entries(props)) {
                if (propData.type === "Number" && mod.properties[prop]) {
                    if (!changes[`properties.${prop}`]) changes[`properties.${prop}`] = 0;
                    else changes[`properties.${prop}`] = Number(changes[`properties.${prop}`]);
                    changes[`properties.${prop}`] += mod.properties[prop];
                } else if (
                    propData.type === "Boolean" &&
                    mod.properties.indeterminate &&
                    mod.properties.indeterminate[prop] === false
                ) {
                    changes[`properties.${prop}`] = mod.properties[prop];
                }
            }
        } else if (mod.properties?.indeterminate) {
            for (const prop of Object.keys(mod?.properties)) {
                if (prop === "indeterminate") continue;
                if (mod.properties.indeterminate[prop] === false) {
                    changes[`properties.${prop}`] = mod.properties[prop];
                }
            }
        }

        // Attack bonus
        if (mod.attackBonus && mod.attackBonus !== "0") {
            if (changes["attackBonus"]) changes["attackBonus"] += " + ";
            else changes["attackBonus"] = "";
            changes["attackBonus"] += mod.attackBonus.replace(/^\s*[+]\s*/, "");
        }
        // Damage rolls
        if (mod.damage?.parts?.length) {
            changes["damage.parts"] ||= [];
            changes["damage.parts"] = changes["damage.parts"].concat(mod.damage.parts);
        }

        // Armor Class
        if (mod.armor?.value) {
            changes["armor.value"] ||= 0;
            changes["armor.value"] += mod.armor.value;
        }
        // Dexterity Modifier
        if (mod.armor?.dex) changes["armor.dex"] = mod.armor.dex;
        // Strength Requirement
        if (mod.strength) changes["strength"] = mod.strength;
        // Stealth Disadvantage
        if (mod.indeterminate?.stealth === false) changes[`stealth`] = mod.stealth;
    }
}
