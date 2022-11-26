import Proficiency from "./proficiency.mjs";
import {d20Roll, damageRoll, attribDieRoll} from "../../dice/dice.mjs";
import {simplifyBonus} from "../../utils.mjs";
import ShortRestDialog from "../../applications/actor/short-rest.mjs";
import LongRestDialog from "../../applications/actor/long-rest.mjs";
import RechargeRepairDialog from "../../applications/actor/recharge-repair.mjs";
import RefittingRepairDialog from "../../applications/actor/refitting-repair.mjs";
import RegenRepairDialog from "../../applications/actor/regen-repair.mjs";
import AllocatePowerDice from "../../applications/actor/allocate-power-dice.mjs";
import ExpendPowerDice from "../../applications/actor/expend-power-dice.mjs";
import ProficiencySelector from "../../applications/proficiency-selector.mjs";
import Item5e from "../item.mjs";
import SelectItemsPrompt from "../../applications/select-items-prompt.mjs";
import {fromUuidSynchronous} from "../../utils.mjs";

/**
 * Extend the base Actor class to implement additional system-specific logic for SW5e.
 */
export default class Actor5e extends Actor {
    /**
     * The data source for Actor5e.classes allowing it to be lazily computed.
     * @type {Object<Item5e>}
     * @private
     */
    _classes;

    /**
     * The data source for Actor5e.deployments allowing it to be lazily computed.
     * @type {Object<Item5e>}
     * @private
     */
    _deployments;

    /**
     * The data source for Actor5e.starships allowing it to be lazily computed.
     * @type {Object<Item5e>}
     * @private
     */
    _starships;

    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /**
     * A mapping of classes belonging to this Actor.
     * @type {Object<Item5e>}
     */
    get classes() {
        if (this._classes !== undefined) return this._classes;
        if (!["character", "npc"].includes(this.type)) return (this._classes = {});
        return (this._classes = this.items
            .filter((item) => item.type === "class")
            .reduce((obj, cls) => {
                obj[cls.identifier] = cls;
                return obj;
            }, {}));
    }

    /* -------------------------------------------- */

    /**
     * A mapping of deployments belonging to this Actor.
     * @type {object<string, Item5e>}
     */
    get deployments() {
        if (this._deployments !== undefined) return this._deployments;
        if (!["character", "npc"].includes(this.type)) return (this._deployments = {});
        return (this._deployments = this.items
            .filter((item) => item.type === "deployment")
            .reduce((obj, dep) => {
                obj[dep.identifier] = dep;
                return obj;
            }, {}));
    }

    /* -------------------------------------------- */

    /**
     * A mapping of starships belonging to this Actor.
     * @type {object<string, Item5e>}
     */
    get starships() {
        if (this._starships !== undefined) return this._starships;
        if (this.type !== "starship") return (this._starships = {});
        return (this._starships = this.items
            .filter((item) => item.type === "starship")
            .reduce((obj, sship) => {
                obj[sship.identifier] = sship;
                return obj;
            }, {}));
    }

    /* -------------------------------------------- */

    /**
     * Is this Actor currently polymorphed into some other creature?
     * @type {boolean}
     */
    get isPolymorphed() {
        return this.getFlag("sw5e", "isPolymorphed") || false;
    }

    /* -------------------------------------------- */

    /**
     * The Actor's currently equipped armor, if any.
     * @type {Item5e|null}
     */
    get armor() {
        return this.system.attributes.ac.equippedArmor ?? null;
    }

    /* -------------------------------------------- */

    /**
     * The Actor's currently equipped shield, if any.
     * @type {Item5e|null}
     */
    get shield() {
        return this.system.attributes.ac.equippedShield ?? null;
    }

    /* -------------------------------------------- */
    /*  Methods                                     */
    /* -------------------------------------------- */

    /** @inheritDoc */
    prepareData() {
        this._classes = undefined;
        this._deployments = undefined;
        this._starships = undefined;
        this._preparationWarnings = [];
        super.prepareData();
        this.items.forEach((item) => item.prepareFinalAttributes());
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    prepareBaseData() {
        const updates = {};
        this._prepareBaseAbilities(updates);
        this._prepareBaseSkills(updates);
        if (!foundry.utils.isEmpty(updates)) {
            if (!this.id) this.updateSource(updates);
            else this.update(updates);
        }

        this._prepareBaseArmorClass();
        this._prepareScaleValues();
        switch (this.type) {
            case "character":
                return this._prepareCharacterData();
            case "npc":
                return this._prepareNPCData();
            case "starship":
                return this._prepareBaseStarshipData();
            case "vehicle":
                return this._prepareVehicleData();
        }
    }

    /* --------------------------------------------- */

    /** @inheritDoc */
    applyActiveEffects() {
        // The Active Effects do not have access to their parent at preparation time, so we wait until this stage to
        // determine whether they are suppressed or not.
        this.effects.forEach((e) => e.determineSuppression());
        return super.applyActiveEffects();
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    prepareDerivedData() {
        const flags = this.flags.sw5e || {};
        this.labels = {};

        // Retrieve data for polymorphed actors
        let originalSaves = null;
        let originalSkills = null;
        if (this.isPolymorphed) {
            const transformOptions = flags.transformOptions;
            const original = game.actors?.get(flags.originalActor);
            if (original) {
                if (transformOptions.mergeSaves) originalSaves = original.system.abilities;
                if (transformOptions.mergeSkills) originalSkills = original.system.skills;
            }
        }

        // Prepare abilities, skills, & everything else
        const globalBonuses = this.system.bonuses?.abilities ?? {};
        const bonusData = this.getRollData();
        const checkBonus = simplifyBonus(globalBonuses?.check, bonusData);
        this._prepareAbilities(bonusData, globalBonuses, checkBonus, originalSaves);
        this._prepareSkills(bonusData, globalBonuses, checkBonus, originalSkills);
        this._prepareArmorClass();
        this._prepareEncumbrance();
        this._prepareInitiative(bonusData, checkBonus);
        this._prepareScaleValues();
        this._preparePowercasting(bonusData);
        this._prepareSuperiority(bonusData);
        if (this.type === "starship") this._prepareStarshipData();
    }

    /* -------------------------------------------- */

    /**
     * Return the amount of experience required to gain a certain character level.
     * @param {number} level  The desired level.
     * @returns {number}      The XP required.
     */
    getLevelExp(level) {
        const levels = CONFIG.SW5E.CHARACTER_EXP_LEVELS;
        return levels[Math.min(level, levels.length - 1)];
    }

    /* -------------------------------------------- */

    /**
     * Return the amount of experience granted by killing a creature of a certain CR.
     * @param {number} cr     The creature's challenge rating.
     * @returns {number}      The amount of experience granted per kill.
     */
    getCRExp(cr) {
        if (cr < 1.0) return Math.max(200 * cr, 10);
        return CONFIG.SW5E.CR_EXP_LEVELS[cr];
    }

    /* -------------------------------------------- */

    /**
     * Return the amount of prestige required to gain a certain rank level.
     * @param {number} level  The desired level.
     * @return {Number}       The prestige required.
     */
    getRankExp(rank) {
        const ranks = CONFIG.SW5E.CHARACTER_RANK_LEVELS;
        return ranks[Math.min(rank, ranks.length - 1)];
    }

    /* -------------------------------------------- */

    /**
     * @inheritdoc
     * @param {object} [options]
     * @param {boolean} [options.deterministic] Whether to force deterministic values for data properties that could be
     *                                          either a die term or a flat term.
     */
    getRollData({deterministic = false} = {}) {
        const data = foundry.utils.deepClone(super.getRollData());
        data.prof = new Proficiency(this.system.attributes.prof, 1);
        if (deterministic) data.prof = data.prof.flat;

        data.classes = {};
        for (const [identifier, cls] of Object.entries(this.classes)) {
            data.classes[identifier] = cls.system;
            if (cls.archetype) data.classes[identifier].archetype = cls.archetype.system;
        }

        data.deployments = {};
        for (const [identifier, dep] of Object.entries(this.deployments)) {
            data.deployments[identifier] = dep.system;
        }

        data.starships = {};
        for (const [identifier, ss] of Object.entries(this.starships)) {
            data.starships[identifier] = ss.system;
        }

        data.hitDice = {};
        const hitDice = CONFIG.SW5E.hitDieTypes.reduce((acc, dice) => {
            acc[dice] = {
                cur: 0,
                max: 0,
                dice: dice,
                number: parseInt(dice.substring(1)),
            }
            return acc;
        }, {});
        for (const [identifier, cls] of Object.entries(this.classes)) {
            const dice = cls.system.hitDice ?? "d4";
            const max = (cls.system.levels ?? 0);
            const cur = max - (cls.system.hitDiceUsed ?? 0);
            hitDice[dice].cur += cur;
            hitDice[dice].max += max;
        }
        for (const [identifier, hd] of Object.entries(hitDice)) {
            if (hd.max === 0) continue;
            if (data.hitDice.largest === undefined || hd.number > data.hitDice.largest.number) data.hitDice.largest = hd;
            if (data.hitDice.smallest === undefined || hd.number < data.hitDice.smallest.number) data.hitDice.smallest = hd;
            if (data.hitDice.predominant === undefined || hd.max > data.hitDice.predominant.max) data.hitDice.predominant = hd;
        }

        return data;
    }

    /* -------------------------------------------- */

    /**
     * Return data related to the installation of an item in a starship.
     * @param {string} itemId       The id of the item.
     * @return [
     *           {Number} minCrew      The minimum crew required to install.
     *           {Number} installCost  The credits cost to install.
     *           {Number} installTime  The time taken to install.
     *         ]
     */
    getInstallationData(itemId) {
        if (this.type !== "starship") return [0, 0, 0];

        const item = this.items.get(itemId);
        const ship = this.items.filter((i) => i.type === "starship")[0];

        const itemData = item.system;
        const shipData = ship.system;

        const isMod = item.type === "starshipmod";
        const isWpn = item.type === "weapon";

        const baseCost = isMod ? itemData.basecost.value : itemData.price;
        const sizeMult = isMod ? shipData.modCostMult : isWpn ? 1 : shipData.equipCostMult;
        const gradeMult = isMod ? Number(itemData.grade) || 1 : 1;
        const fullCost = baseCost * sizeMult * gradeMult;

        const minCrew = isMod ? shipData.modMinWorkforce : shipData.equipMinWorkforce;
        const installCost = Math.ceil(fullCost / 2);
        const installTime = fullCost / (500 * minCrew);
        // TODO: accept a 'crew' parameter to use instead of minCrew in the install time calculation

        return {minCrew, installCost, installTime};
    }

    /* -------------------------------------------- */

    /**
     */
    async addStarshipDefaults() {
        const items = [];

        const actions = await game.packs.get("sw5e.starshipactions").getIndex();
        const action_ids = actions.map((a) => "Compendium.sw5e.starshipactions." + a._id);
        for (const id of action_ids) items.push(await fromUuid(id));

        for (const id of CONFIG.SW5E.defaultStarshipEquipment) {
            const item = await fromUuid(id);
            if (
                item.type === "equipment" &&
                this.items.filter((i) => i.type === "equipment" && item.system.armor.type === i.system.armor.type)
                    .length
            )
                continue;
            if (item.type === "starship" && this.items.filter((i) => i.type === "starship").length) continue;
            items.push(item);
        }

        const result = await this.addEmbeddedItems(items, false);

        const updates = [];
        for (const item of result) updates.push({"_id": item.id, "data.equipped": true});
        await this.updateEmbeddedDocuments("Item", updates);
    }

    /* -------------------------------------------- */
    /*  Base Data Preparation Helpers               */
    /* -------------------------------------------- */

    /**
     * Update the actor's abilities list to match the abilities configured in `SW5E.abilities`.
     * Mutates the system.abilities object.
     * @param {object} updates  Updates to be applied to the actor. *Will be mutated.*
     * @protected
     */
    _prepareBaseAbilities(updates) {
        const abilities = {};
        for (const key of Object.keys(CONFIG.SW5E.abilities)) {
            abilities[key] = this.system.abilities[key];
            if (!abilities[key]) {
                abilities[key] = foundry.utils.deepClone(game.system.template.Actor.templates.common.abilities.cha);

                // Honor: Charisma for NPC, 0 for vehicles
                if (key === "hon") {
                    if (["vehicle", "starship"].includes(actorData.type)) abilities[key].value = 0;
                    else if (this.type === "npc") abilities[key].value = this.system.abilities.cha?.value ?? 10;
                }

                // Sanity: Wisdom for NPC, 0 for vehicles
                else if (key === "san") {
                    if (["vehicle", "starship"].includes(actorData.type)) abilities[key].value = 0;
                    else if (this.type === "npc") abilities[key].value = this.system.abilities.wis?.value ?? 10;
                }

                updates[`system.abilities.${key}`] = foundry.utils.deepClone(abilities[key]);
            }
        }
        this.system.abilities = abilities;
    }

    /* -------------------------------------------- */

    /**
     * Update the actor's skill list to match the skills configured in `SW5E.skills`.
     * Mutates the system.skills object.
     * @param {object} updates  Updates to be applied to the actor. *Will be mutated*.
     * @private
     */
    _prepareBaseSkills(updates) {
        if (this.type === "vehicle") return;
        const skills = {};
        for (const [key, skill] of Object.entries(
            this.type === "starship" ? CONFIG.SW5E.starshipSkills : CONFIG.SW5E.skills
        )) {
            skills[key] = this.system.skills[key];
            if (!skills[key]) {
                skills[key] = foundry.utils.deepClone(game.system.template.Actor.templates.creature.skills.acr);
                skills[key].ability = skill.ability;
                updates[`system.skills.${key}`] = foundry.utils.deepClone(skills[key]);
            }
        }
        this.system.skills = skills;
    }

    /* -------------------------------------------- */

    /**
     * Initialize derived AC fields for Active Effects to target.
     * Mutates the system.attributes.ac object.
     * @protected
     */
    _prepareBaseArmorClass() {
        const ac = this.system.attributes.ac;
        ac.armor = 10;
        ac.shield = ac.bonus = ac.cover = 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare base data related to the power-casting capabilities of the Actor.
     * Mutates the value of the system.powers object.
     * @protected
     */
    _prepareBasePowercasting() {
        if (this.type === "vehicle" || this.type === "starship") return;

        const isNPC = this.type === "npc";

        // Prepare base progression data
        const charProgression = ["force", "tech"].reduce((obj, castType) => {
            obj[castType] = {
                castType: castType,
                prefix: castType.slice(0, 1),
                powersKnownCur: 0,
                powersKnownMax: 0,
                points: 0,
                casterLevel: 0,
                maxPowerLevel: 0,
                maxClassProg: null,
                maxClassLevel: 0,
                classes: 0
            };
            return obj;
        }, {});

        // Translate the list of classes into force and tech power-casting progression
        for (const cls of this.itemTypes.class) {
            const cd = cls.system;
            const ad = cls?.archetype?.system;
            const levels = cd.levels;
            if (levels < 1) continue;
            for (const progression of Object.values(charProgression)) {
                const castType = progression.castType;

                let prog = ad?.powercasting?.[castType] ?? "none";
                if (prog === "none") prog = cd?.powercasting?.[castType] ?? "none";

                if (!(prog in CONFIG.SW5E.powerProgression) || prog === "none") continue;
                if (prog === "half" && castType === "tech" && levels < 2) continue; // Tech half-casters only get techcasting at lvl 2

                const known = CONFIG.SW5E.powersKnown[castType][prog][levels];
                const points = levels * CONFIG.SW5E.powerPointsBase[prog];
                const casterLevel = levels * (CONFIG.SW5E.powerMaxLevel[prog][20] / 9);

                progression.classes++;
                progression.powersKnownMax += known;
                progression.points += points;
                progression.casterLevel += casterLevel;

                if (levels > progression.maxClassLevel) {
                    progression.maxClassLevel = levels;
                    progression.maxClassProg = prog;
                }
            }
        }

        // Calculate known powers
        for (const pwr of this.itemTypes.power) {
            const school = pwr?.system?.school;
            if (["lgt", "uni", "drk"].includes(school)) charProgression.force.powersKnownCur++;
            if ("tec" === school) charProgression.tech.powersKnownCur++;
        }

        // Make final adjustments and apply progression data
        charProgression.tech.points /= 2;
        for (const progression of Object.values(charProgression)) {
            // 'Round Appropriately'
            progression.points = Math.round(progression.points);
            progression.casterLevel = Math.round(progression.casterLevel);

            // EXCEPTION: NPC with an explicit power-caster level
            const npcData = this.system?.details?.powercasting?.[progression.castType];
            if (isNPC && npcData?.casterLevel) {
                progression.classes = -1;
                progression.casterLevel = npcData.casterlevel;
                progression.points = npcData.points;
                progression.limit = 10;
            } else {
                // What level is considered 'high level casting'
                progression.limit = CONFIG.SW5E.powerLimit[progression.maxClassProg];
            }

            // What is the maximum power level you can cast
            if (progression.classes) {
                if (progression.classes !== 1)
                    progression.maxPowerLevel = CONFIG.SW5E.powerMaxLevel.full[progression.casterLevel];
                else
                    progression.maxPowerLevel =
                        CONFIG.SW5E.powerMaxLevel[progression.maxClassProg][progression.maxClassLevel];
            }

            // Set the 'power slots'
            const p = progression.prefix;
            for (const [n, lvl] of Object.entries(this.system.powers)) {
                const i = parseInt(n.slice(-1));
                if (Number.isNaN(i)) continue;

                if (Number.isNumeric(lvl[`${p}override`])) lvl[`${p}max`] = Math.max(parseInt(lvl[`${p}override`]), 0);
                else lvl[`${p}max`] = i > progression.maxPowerLevel ? 0 : i >= progression.limit ? 1 : 1000;

                if (isNPC) {
                    lvl[`${p}value`] = lvl[`${p}max`];
                } else {
                    lvl[`${p}value`] = Math.min(
                        parseInt(lvl[`${p}value`] ?? lvl.value ?? lvl[`${p}max`]),
                        lvl[`${p}max`]
                    );
                }
            }

            // Apply the calculated values to the sheet
            this.system.attributes[progression.castType].known.value = progression.powersKnownCur;
            this.system.attributes[progression.castType].known.max = progression.powersKnownMax;
            this.system.attributes[progression.castType].points.max = progression.points;
            this.system.attributes[progression.castType].level = progression.casterLevel;
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare base data related to the superiority capabilities of the Actor.
     * Mutates the value of the system.superiority object.
     * @protected
     */
    _prepareBaseSuperiority() {
        if (this.type === "vehicle" || this.type === "starship") return;
        const superiority = this.system.attributes.super;

        // Determine superiority level based on class items
        let {level, levels, known, dice} = this.itemTypes.class.reduce(
            (obj, cls) => {
                const cd = cls?.system;
                const ad = cls?.archetype?.system;

                const cp = cd?.superiority?.progression ?? 0;
                const ap = ad?.superiority?.progression ?? 0;

                const progression = Math.max(cp, ap);
                const levels = cd?.levels ?? 1;

                if (progression) {
                    obj.level += levels * progression;
                    obj.levels += levels;
                    obj.known += CONFIG.SW5E.maneuversKnownProgression[Math.round(levels * progression)];
                    obj.dice += Math.round(CONFIG.SW5E.superiorityDiceQuantProgression[levels] * progression);
                }

                return obj;
            },
            {level: 0, levels: 0, known: 0, dice: 0}
        );

        level = Math.round(Math.max(Math.min(level, CONFIG.SW5E.maxLevel), 0));
        levels = Math.round(Math.max(Math.min(levels, CONFIG.SW5E.maxLevel), 0));

        // Calculate derived values
        superiority.level = level;
        superiority.known.value = this.itemTypes.maneuver.length;
        superiority.known.max = known;
        superiority.dice.max = dice;
        superiority.die = CONFIG.SW5E.superiorityDieSizeProgression[levels];

        this.superiority = superiority;
    }

    /* -------------------------------------------- */

    /**
     * Perform any Character specific preparation.
     * Mutates several aspects of the system data object.
     * @protected
     */
    _prepareCharacterData() {
        this.system.details.level = 0;
        this.system.attributes.hd = 0;
        this.system.attributes.attunement.value = 0;
        this.system.details.ranks = 0;

        for (const item of this.items) {
            // Class levels & hit dice
            if (item.type === "class") {
                const classLevels = parseInt(item.system.levels) || 1;
                this.system.details.level += classLevels;
                this.system.attributes.hd += classLevels - (parseInt(item.system.hitDiceUsed) || 0);
            }
            // Determine character rank based on owned Deployment items
            if (item.type === "deployment") {
                const rankLevels = parseInt(item.system.levels) || 1;
                this.system.details.ranks += rankLevels;
            }

            // Attuned items
            else if (item.system.attunement === CONFIG.SW5E.attunementTypes.ATTUNED) {
                this.system.attributes.attunement.value += 1;
            }
        }

        // Character proficiency bonus
        this.system.attributes.prof = Math.floor((this.system.details.level + 7) / 4);

        // Experience required for next level
        const xp = this.system.details.xp;
        xp.max = this.getLevelExp(this.system.details.level || 1);
        const prior = this.getLevelExp(this.system.details.level - 1 || 0);
        const required = xp.max - prior;
        const pct = Math.round(((xp.value - prior) * 100) / required);
        xp.pct = Math.clamped(pct, 0, 100);

        // Prestige required for next Rank
        const prestige = this.system.details.prestige;
        prestige.max = this.getRankExp(this.system.details.ranks + 1 || 0);
        const rankPrior = this.getRankExp(this.system.details.ranks || 0);
        const rankRequired = prestige.max - rankPrior;
        const rankPct = Math.round(((prestige.value - rankPrior) * 100) / rankRequired);
        prestige.pct = Math.clamped(rankPct, 0, 100);

        // Add base Powercasting attributes
        this._prepareBasePowercasting();

        // Add base Superiority attributes
        this._prepareBaseSuperiority();
    }

    /* -------------------------------------------- */

    /**
     * Perform any NPC specific preparation.
     * Mutates several aspects of the system data object.
     * @protected
     */
    _prepareNPCData() {
        const cr = this.system.details.cr;

        // Attuned items
        this.system.attributes.attunement.value = this.items.filter((i) => {
            return i.system.attunement === CONFIG.SW5E.attunementTypes.ATTUNED;
        }).length;

        // Kill Experience
        this.system.details.xp.value = this.getCRExp(cr);

        // Proficiency
        this.system.attributes.prof = Math.floor((Math.max(cr, 1) + 7) / 4);

        // Determine npc rank based on owned Deployment items
        this.system.details.ranks = this.items.reduce((acc, item) => {
            if (item.type === "deployment") {
                const rankLevels = parseInt(item.system.levels) || 1;
                acc += rankLevels;
            }
            return acc;
        }, 0);

        // Add base Powercasting attributes
        this._prepareBasePowercasting();

        // Powercaster Level
        if (this.system.attributes.powercasting && !Number.isNumeric(this.system.details.powerLevel)) {
            this.system.details.powerLevel = Math.max(cr, 1);
        }
    }

    /* -------------------------------------------- */

    /**
     * Perform any Vehicle specific preparation.
     * Mutates several aspects of the system data object.
     * @protected
     */
    _prepareVehicleData() {
        this.system.attributes.prof = 0;
    }

    /* -------------------------------------------- */

    /**
     * Perform any Starship specific preparation.
     * Mutates several aspects of the system data object.
     * @protected
     */
    _prepareBaseStarshipData() {
        // Determine starship's proficiency bonus based on active deployed crew member
        this.system.attributes.prof = 0;
        const active = this.system.attributes.deployment.active;
        const actor = fromUuidSynchronous(active.value);
        if (actor?.system?.details?.ranks) this.system.attributes.prof = actor.system.attributes?.prof ?? 0;

        // Determine Starship size-based properties based on owned Starship item
        const size = this.items.filter((i) => i.type === "starship");
        if (size.length !== 0) {
            const sizeData = size[0].system;
            const hugeOrGrg = ["huge", "grg"].includes(sizeData.size);
            const tiers = parseInt(sizeData.tier) || 0;

            this.system.traits.size = sizeData.size; // needs to be the short code
            this.system.details.tier = tiers;

            this.system.attributes.cost.baseBuild = sizeData.buildBaseCost;
            this.system.attributes.cost.baseUpgrade = CONFIG.SW5E.baseUpgradeCost[tiers];
            this.system.attributes.cost.multEquip = sizeData.equipCostMult;
            this.system.attributes.cost.multModification = sizeData.modCostMult;
            this.system.attributes.cost.multUpgrade = sizeData.upgrdCostMult;

            this.system.attributes.equip.size.cargoCap = sizeData.cargoCap;
            this.system.attributes.equip.size.crewMinWorkforce = parseInt(sizeData.crewMinWorkforce) || 1;
            this.system.attributes.equip.size.foodCap = sizeData.foodCap;

            this.system.attributes.fuel.cost = sizeData.fuelCost;
            this.system.attributes.fuel.fuelCap = sizeData.fuelCap;

            const hullmax = sizeData.hullDiceStart + (hugeOrGrg ? 2 : 1) * tiers;
            this.system.attributes.hull = {
                die: sizeData.hullDice,
                dicemax: hullmax,
                dice: hullmax - (parseInt(sizeData.hullDiceUsed) || 0)
            };

            const shldmax = sizeData.shldDiceStart + (hugeOrGrg ? 2 : 1) * tiers;
            this.system.attributes.shld = {
                die: sizeData.shldDice,
                dicemax: shldmax,
                dice: shldmax - (parseInt(sizeData.shldDiceUsed) || 0)
            };

            this.system.attributes.mods.cap.max = sizeData.modBaseCap;
            this.system.attributes.mods.suite.max = sizeData.modMaxSuitesBase;
            this.system.attributes.mods.hardpoint.max = 0;

            this.system.attributes.power.die = CONFIG.SW5E.powerDieTypes[tiers];

            this.system.attributes.workforce.max = this.system.attributes.workforce.minBuild * 5;
            this.system.attributes.workforce.minBuild = sizeData.buildMinWorkforce;
            this.system.attributes.workforce.minEquip = sizeData.equipMinWorkforce;
            this.system.attributes.workforce.minModification = sizeData.modMinWorkforce;
            this.system.attributes.workforce.minUpgrade = sizeData.upgrdMinWorkforce;
        }

        // Determine Starship armor-based properties based on owned Starship item
        const armor = this._getEquipment("starship", {equipped: true});
        if (armor.length !== 0) {
            const armorData = armor[0].system;
            this.system.attributes.equip.armor.dr = parseInt(armorData.attributes.dmgred.value) || 0;
            this.system.attributes.equip.armor.maxDex = armorData.armor.dex;
            this.system.attributes.equip.armor.stealthDisadv = armorData.stealth;
        } else {
            // no armor installed
            this.system.attributes.equip.armor.dr = 0;
            this.system.attributes.equip.armor.maxDex = 99;
            this.system.attributes.equip.armor.stealthDisadv = false;
        }

        // Determine Starship hyperdrive-based properties based on owned Starship item
        const hyperdrive = this._getEquipment("hyper", {equipped: true});
        if (hyperdrive.length !== 0) {
            const hdData = hyperdrive[0].system;
            this.system.attributes.equip.hyperdrive.class = parseFloat(hdData.hdclass.value) || null;
        } else {
            // no hyperdrive installed
            this.system.attributes.equip.hyperdrive.class = null;
        }

        // Determine Starship power coupling-based properties based on owned Starship item
        const pwrcpl = this._getEquipment("powerc", {equipped: true});
        if (pwrcpl.length !== 0) {
            const pwrcplData = pwrcpl[0].system;
            this.system.attributes.equip.powerCoupling.centralCap = parseInt(pwrcplData.cscap.value) || 0;
            this.system.attributes.equip.powerCoupling.systemCap = parseInt(pwrcplData.sscap.value) || 0;
        } else {
            // no power coupling installed
            this.system.attributes.equip.powerCoupling.centralCap = 0;
            this.system.attributes.equip.powerCoupling.systemCap = 0;
        }

        this.system.attributes.power.central.max = 0;
        this.system.attributes.power.comms.max = 0;
        this.system.attributes.power.engines.max = 0;
        this.system.attributes.power.shields.max = 0;
        this.system.attributes.power.sensors.max = 0;
        this.system.attributes.power.weapons.max = 0;

        // Determine Starship reactor-based properties based on owned Starship item
        const reactor = this._getEquipment("reactor", {equipped: true});
        if (reactor.length !== 0) {
            const reactorData = reactor[0].system;
            this.system.attributes.equip.reactor.fuelMult = parseFloat(reactorData.fuelcostsmod.value) || 0;
            this.system.attributes.equip.reactor.powerRecDie = reactorData.powdicerec.value;
        } else {
            // no reactor installed
            this.system.attributes.equip.reactor.fuelMult = 1;
            this.system.attributes.equip.reactor.powerRecDie = "1d1";
        }

        // Determine Starship shield-based properties based on owned Starship item
        const shields = this._getEquipment("ssshield", {equipped: true});
        if (shields.length !== 0) {
            const shieldsData = shields[0].system;
            this.system.attributes.equip.shields.capMult = parseFloat(shieldsData.capx.value) || 1;
            this.system.attributes.equip.shields.regenRateMult = parseFloat(shieldsData.regrateco.value) || 1;
        } else {
            // no shields installed
            this.system.attributes.equip.shields.capMult = 0;
            this.system.attributes.equip.shields.regenRateMult = 0;
        }

        // Inherit deployed pilot's proficiency in piloting
        const pilot = fromUuidSynchronous(this.system.attributes.deployment.pilot.value);
        if (pilot) this.system.skills.man.value = Math.max(this.system.skills.man.value, pilot.system.skills.pil.value);
    }

    /* -------------------------------------------- */
    /*  Derived Data Preparation Helpers            */
    /* -------------------------------------------- */

    /**
     * Prepare abilities.
     * @param {object} bonusData      Data produced by `getRollData` to be applied to bonus formulas.
     * @param {object} globalBonuses  Global bonus data.
     * @param {number} checkBonus     Global ability check bonus.
     * @param {object} originalSaves  A transformed actor's original actor's abilities.
     * @protected
     */
    _prepareAbilities(bonusData, globalBonuses, checkBonus, originalSaves) {
        const flags = this.flags.sw5e ?? {};
        const dcBonus = simplifyBonus(this.system.bonuses?.power?.dc, bonusData);
        const saveBonus = simplifyBonus(globalBonuses.save, bonusData);
        for (const [id, abl] of Object.entries(this.system.abilities)) {
            if (flags.diamondSoul) abl.proficient = 1; // Diamond Soul is proficient in all saves
            abl.mod = Math.floor((abl.value - 10) / 2);

            const isRA = this._isRemarkableAthlete(id);
            abl.checkProf = new Proficiency(
                this.system.attributes.prof,
                isRA || flags.jackOfAllTrades ? 0.5 : 0,
                !isRA
            );
            const saveBonusAbl = simplifyBonus(abl.bonuses?.save, bonusData);
            abl.saveBonus = saveBonusAbl + saveBonus;

            abl.saveProf = new Proficiency(this.system.attributes.prof, abl.proficient);
            const checkBonusAbl = simplifyBonus(abl.bonuses?.check, bonusData);
            abl.checkBonus = checkBonusAbl + checkBonus;

            abl.save = abl.mod + abl.saveBonus;
            if (Number.isNumeric(abl.saveProf.term)) abl.save += abl.saveProf.flat;
            abl.dc = 8 + abl.mod + this.system.attributes.prof + dcBonus;

            // If we merged saves when transforming, take the highest bonus here.
            if (originalSaves && abl.proficient) abl.save = Math.max(abl.save, originalSaves[id].save);
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare skill checks. Mutates the values of system.skills.
     * @param {object} bonusData       Data produced by `getRollData` to be applied to bonus formulas.
     * @param {object} globalBonuses   Global bonus data.
     * @param {number} checkBonus      Global ability check bonus.
     * @param {object} originalSkills  A transformed actor's original actor's skills.
     * @protected
     */
    _prepareSkills(bonusData, globalBonuses, checkBonus, originalSkills) {
        if (this.type === "vehicle") return;
        const flags = this.flags.sw5e ?? {};

        // Skill modifiers
        const feats = CONFIG.SW5E.characterFlags;
        const skillBonus = simplifyBonus(globalBonuses.skill, bonusData);
        for (const [id, skl] of Object.entries(this.system.skills)) {
            const ability = this.system.abilities[skl.ability];
            skl.value = Math.clamped(Number(skl.value).toNearest(0.5), 0, 5) ?? 0;
            const baseBonus = simplifyBonus(skl.bonuses?.check, bonusData);

            // Remarkable Athlete
            if (this._isRemarkableAthlete(skl.ability) && skl.value < 0.5) {
                skl.value = 0.5;
            }

            // Jack of All Trades
            else if (flags.jackOfAllTrades && skl.value < 0.5) {
                skl.value = 0.5;
            }

            // Polymorph Skill Proficiencies
            if (originalSkills) {
                skl.value = Math.max(skl.value, originalSkills[id].value);
            }

            // Compute modifier
            const checkBonusAbl = simplifyBonus(ability?.bonuses?.check, bonusData);
            skl.bonus = baseBonus + checkBonus + checkBonusAbl + skillBonus;
            skl.mod = ability?.mod ?? 0;
            skl.prof = new Proficiency(this.system.attributes.prof, skl.value);
            skl.proficient = skl.value;
            skl.total = skl.mod + skl.bonus;
            if (Number.isNumeric(skl.prof.term)) skl.total += skl.prof.flat;

            // Compute passive bonus
            const passive = flags.observantFeat && feats.observantFeat.skills.includes(id) ? 5 : 0;
            const passiveBonus = simplifyBonus(skl.bonuses?.passive, bonusData);
            skl.passive = 10 + skl.mod + skl.bonus + skl.prof.flat + passive + passiveBonus;
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare a character's AC value from their equipped armor and shield.
     * Mutates the value of the `system.attributes.ac` object.
     */
    _prepareArmorClass() {
        const ac = this.system.attributes.ac;

        // Apply automatic migrations for older data structures
        let cfg = CONFIG.SW5E.armorClasses[ac.calc];
        if (!cfg) {
            ac.calc = "flat";
            if (Number.isNumeric(ac.value)) ac.flat = Number(ac.value);
            cfg = CONFIG.SW5E.armorClasses.flat;
        }

        // Identify Equipped Items
        const armorTypes = new Set(Object.keys(CONFIG.SW5E.armorTypes));
        const {armors, shields} = this.itemTypes.equipment.reduce(
            (obj, equip) => {
                const armor = equip.system.armor;
                if (!equip.system.equipped || !armorTypes.has(armor?.type)) return obj;
                if (armor.type === "shield") obj.shields.push(equip);
                else obj.armors.push(equip);
                return obj;
            },
            {armors: [], shields: []}
        );

        // Determine base AC
        switch (ac.calc) {
            // Flat AC (no additional bonuses)
            case "flat":
                ac.value = Number(ac.flat);
                return;

            // Natural AC (includes bonuses)
            case "natural":
                ac.base = Number(ac.flat);
                break;

            // Starship-Based AC
            case "starship":
                const tier = this.system.details.tier;
                ac.tier = Math.max(tier - 1, 0);
                if (armors.length) {
                    if ( armors.length > 1 ) this._preparationWarnings.push({
                        message: game.i18n.localize("SW5E.WarnMultipleArmor"), type: "warning"
                    });
                    const armorData = armors[0].system.armor;
                    ac.dex = Math.min(armorData.dex ?? Infinity, this.system.abilities.dex.mod);
                    ac.base = (armorData.value ?? 0) + ac.tier + ac.dex;
                    ac.equippedArmor = armors[0];
                } else {
                    ac.dex = this.system.abilities.dex.mod;
                    ac.base = 10 + ac.tier + ac.dex;
                }
                break;

            default:
                let formula = ac.calc === "custom" ? ac.formula : cfg.formula;
                if (armors.length) {
                    if ( armors.length > 1 ) this._preparationWarnings.push({
                      message: game.i18n.localize("SW5E.WarnMultipleArmor"), type: "warning"
                    });
                    const armorData = armors[0].system.armor;
                    const isHeavy = armorData.type === "heavy";
                    ac.armor = armorData.value ?? ac.armor;
                    ac.dex = isHeavy ? 0 : Math.min(armorData.dex ?? Infinity, this.system.abilities.dex?.mod ?? 0);
                    ac.equippedArmor = armors[0];
                } else ac.dex = this.system.abilities.dex?.mod ?? 0;

                const rollData = this.getRollData({deterministic: true});
                rollData.attributes.ac = ac;
                try {
                    const replaced = Roll.replaceFormulaData(formula, rollData);
                    ac.base = Roll.safeEval(replaced);
                } catch (err) {
                    this._preparationWarnings.push({
                        message: game.i18n.localize("SW5E.WarnBadACFormula"), link: "armor", type: "error"
                    });
                    const replaced = Roll.replaceFormulaData(CONFIG.SW5E.armorClasses.default.formula, rollData);
                    ac.base = Roll.safeEval(replaced);
                }
                break;
        }

        // Equipped Shield
        if (shields.length) {
            if ( shields.length > 1 ) this._preparationWarnings.push({
                message: game.i18n.localize("SW5E.WarnMultipleShields"), type: "warning"
            });
            ac.shield = shields[0].system.armor.value ?? 0;
            ac.equippedShield = shields[0];
        }

        // Compute total AC and return
        ac.value = ac.base + ac.shield + ac.bonus + ac.cover;
    }

    /* -------------------------------------------- */

    /**
     * Prepare the level and percentage of encumbrance for an Actor.
     * Optionally include the weight of carried currency by applying the standard rule from the PHB pg. 143.
     * Mutates the value of the `system.attributes.encumbrance` object.
     * @protected
     */
    _prepareEncumbrance() {
        // TODO: Maybe add an option for variant encumbrance
        const encumbrance = (this.system.attributes.encumbrance ??= {});

        // Get the total weight from items
        const physicalItems = ["weapon", "equipment", "consumable", "tool", "backpack", "loot"];
        let weight = this.items.reduce((weight, i) => {
            if (!physicalItems.includes(i.type)) return weight;
            const q = i.system.quantity || 0;
            const w = i.system.weight || 0;
            return weight + q * w;
        }, 0);

        // [Optional] add Currency Weight (for non-transformed actors)
        const currency = this.system.currency;
        if (game.settings.get("sw5e", "currencyWeight") && currency) {
            const numCoins = Object.values(currency).reduce((val, denom) => (val += Math.max(denom, 0)), 0);
            const currencyPerWeight = game.settings.get("sw5e", "metricWeightUnits")
                ? CONFIG.SW5E.encumbrance.currencyPerWeight.metric
                : CONFIG.SW5E.encumbrance.currencyPerWeight.imperial;
            weight += numCoins / currencyPerWeight;
        }

        // Determine the Encumbrance size class
        let mod =
            {
                tiny: 0.5,
                sm: 1,
                med: 1,
                lg: 2,
                huge: 4,
                grg: 8
            }[this.system.traits.size] || 1;
        if (this.flags.sw5e?.powerfulBuild) mod = Math.min(mod * 2, 8);

        const strengthMultiplier = game.settings.get("sw5e", "metricWeightUnits")
            ? CONFIG.SW5E.encumbrance.strMultiplier.metric
            : CONFIG.SW5E.encumbrance.strMultiplier.imperial;

        // Populate final Encumbrance values
        encumbrance.value = weight.toNearest(0.1);
        encumbrance.max = ((this.system.abilities.str?.value ?? 10) * strengthMultiplier * mod).toNearest(0.1);
        encumbrance.pct = Math.clamped((encumbrance.value * 100) / encumbrance.max, 0, 100);
        encumbrance.encumbered = encumbrance.pct > 200 / 3;
    }

    /* -------------------------------------------- */

    /**
     * Prepare the initiative data for an actor.
     * Mutates the value of the `system.attributes.init` object.
     * @param {object} bonusData         Data produced by `getRollData` to be applied to bonus formulas.
     * @param {number} globalCheckBonus  Global ability check bonus.
     * @protected
     */
    _prepareInitiative(bonusData, globalCheckBonus) {
        const init = (this.system.attributes.init ??= {});
        const {initiativeAlert, jackOfAllTrades, remarkableAthlete} = this.flags.sw5e ?? {};
        // Initiative modifiers
        const dexCheckBonus = simplifyBonus(this.system.abilities.dex?.bonuses?.check, bonusData);

        // Compute initiative modifier
        init.mod = this.system.abilities.dex?.mod ?? 0;
        init.prof = new Proficiency(this.system.attributes.prof, jackOfAllTrades || remarkableAthlete ? 0.5 : 0);
        init.value = init.value ?? 0;
        init.bonus = init.value + (initiativeAlert ? 5 : 0);
        init.total = init.mod + init.bonus + dexCheckBonus + globalCheckBonus;
        if (Number.isNumeric(init.prof.term)) init.total += init.prof.flat;
    }

    /* -------------------------------------------- */

    /**
     * Derive any values that have been scaled by the Advancement system.
     * Mutates the value of the `system.scale` object.
     * @protected
     */
    _prepareScaleValues() {
        const scale = (this.system.scale = {});
        for (const [identifier, obj] of Object.entries(this.classes)) {
            scale[identifier] = obj.scaleValues;
            if (obj.archetype) scale[obj.archetype.identifier] = obj.archetype.scaleValues;
        }

        for (const [identifier, obj] of Object.entries(this.deployments)) {
            scale[identifier] = obj.scaleValues;
        }

        for (const [identifier, obj] of Object.entries(this.starships)) {
            scale[identifier] = obj.scaleValues;
        }

        const superiority = this.system?.attributes?.super;
        if (superiority?.levels) {
            if (scale.superiority) ui.notifications.warn("SW5E.SuperiorityIdentifierWarn");
            scale.superiority = superiority;
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare data related to the power-casting capabilities of the Actor.
     * @protected
     */
    _preparePowercasting(bonusData) {
        if (!(this.type === "character" || this.type === "npc")) return;

        const bonusAll = simplifyBonus(this.system.bonuses?.power?.dc, bonusData);
        const bonusLight = simplifyBonus(this.system.bonuses?.power?.forceLightDC, bonusData) + bonusAll;
        const bonusDark = simplifyBonus(this.system.bonuses?.power?.forceDarkDC, bonusData) + bonusAll;
        const bonusUniv = simplifyBonus(this.system.bonuses?.power?.forceUnivDC, bonusData) + bonusAll;
        const bonusTech = simplifyBonus(this.system.bonuses?.power?.techDC, bonusData) + bonusAll;

        // Powercasting DC for Actors and NPCs
        this.system.attributes.powerForceLightDC =
            8 + this.system.abilities.wis.mod + this.system.attributes.prof ?? 10;
        this.system.attributes.powerForceDarkDC = 8 + this.system.abilities.cha.mod + this.system.attributes.prof ?? 10;
        this.system.attributes.powerForceUnivDC =
            Math.max(this.system.attributes.powerForceLightDC, this.system.attributes.powerForceDarkDC) ?? 10;
        this.system.attributes.powerTechDC = 8 + this.system.abilities.int.mod + this.system.attributes.prof ?? 10;

        if (game.settings.get("sw5e", "simplifiedForcecasting")) {
            this.system.attributes.powerForceLightDC = this.system.attributes.powerForceUnivDC;
            this.system.attributes.powerForceDarkDC = this.system.attributes.powerForceUnivDC;
        }

        this.system.attributes.powerForceLightDC += bonusLight;
        this.system.attributes.powerForceDarkDC += bonusDark;
        this.system.attributes.powerForceUnivDC += bonusUniv;
        this.system.attributes.powerTechDC += bonusTech;

        if (this.type !== "character") return;

        // Set Force and tech bonus points for PC Actors
        for (const castType of ["force", "tech"]) {
            if (this.system.attributes[castType].level === 0) continue;
            const mod = CONFIG.SW5E.powerPointsBonus[castType].reduce((best, attr) => {
                return Math.max(best, this.system.abilities?.[attr]?.mod ?? Number.NEGATIVE_INFINITY);
            }, Number.NEGATIVE_INFINITY);
            if (mod !== Number.NEGATIVE_INFINITY) this.system.attributes[castType].points.max += mod;
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare data related to the superiority capabilities of the Actor
     * @protected
     */
    _prepareSuperiority(bonusData) {
        if (!(this.type === "character" || this.type === "npc")) return;

        const bonusAll = simplifyBonus(this.system.bonuses?.super?.dc, bonusData);
        const bonusGeneral = simplifyBonus(this.system.bonuses?.super?.generalDC, bonusData) + bonusAll;
        const bonusPhysical = simplifyBonus(this.system.bonuses?.super?.physicalDC, bonusData) + bonusAll;
        const bonusMental = simplifyBonus(this.system.bonuses?.super?.mentalDC, bonusData) + bonusAll;

        // Powercasting DC for Actors and NPCs
        this.system.attributes.super.physicalDC =
            8 +
                Math.max(this.system.abilities.str.mod, this.system.abilities.dex.mod, this.system.abilities.con.mod) +
                this.system.attributes.prof ?? 10;
        this.system.attributes.super.mentalDC =
            8 +
                Math.max(this.system.abilities.int.mod, this.system.abilities.wis.mod, this.system.abilities.cha.mod) +
                this.system.attributes.prof ?? 10;
        this.system.attributes.super.generalDC =
            Math.max(this.system.attributes.super.physicalDC, this.system.attributes.super.mentalDC) ?? 10;

        this.system.attributes.super.generalDC += bonusGeneral;
        this.system.attributes.super.physicalDC += bonusPhysical;
        this.system.attributes.super.mentalDC += bonusMental;
    }

    /* -------------------------------------------- */

    _prepareStarshipData() {
        // Find Size info of Starship
        const size = this.items.filter((i) => i.type === "starship");
        if (size.length === 0) return;
        const sizeData = size[0].system;

        // Set Power Die Storage
        this.system.attributes.power.central.max += this.system.attributes.equip.powerCoupling.centralCap;
        this.system.attributes.power.comms.max += this.system.attributes.equip.powerCoupling.systemCap;
        this.system.attributes.power.engines.max += this.system.attributes.equip.powerCoupling.systemCap;
        this.system.attributes.power.shields.max += this.system.attributes.equip.powerCoupling.systemCap;
        this.system.attributes.power.sensors.max += this.system.attributes.equip.powerCoupling.systemCap;
        this.system.attributes.power.weapons.max += this.system.attributes.equip.powerCoupling.systemCap;

        // Prepare Hull Points
        this.system.attributes.hp.max =
            sizeData.hullDiceRolled.reduce((a, b) => a + b, 0) +
            (this.system.attributes.hull.dicemax - sizeData.hullDiceRolled.length) *
                CONFIG.SW5E.hitDieAvg[sizeData.hullDice] +
            this.system.abilities.con.mod * this.system.attributes.hull.dicemax;
        if (this.system.attributes.hp.value === null) this.system.attributes.hp.value = this.system.attributes.hp.max;

        // Prepare Shield Points
        this.system.attributes.hp.tempmax = Math.floor(
            (sizeData.shldDiceRolled.reduce((a, b) => a + b, 0) +
                (this.system.attributes.shld.dicemax - sizeData.shldDiceRolled.length) *
                    CONFIG.SW5E.hitDieAvg[sizeData.shldDice] +
                this.system.abilities.str.mod * this.system.attributes.shld.dicemax) *
                this.system.attributes.equip.shields.capMult
        );
        if (this.system.attributes.hp.temp === null) this.system.attributes.hp.temp = this.system.attributes.hp.tempmax;

        // Disable Shields
        this.system.attributes.shld.depleted =
            this.system.attributes.hp.temp === 0 && this.system.attributes.equip.shields.capMult !== 0 ? true : false;

        // Prepare Speeds
        this.system.attributes.movement.space =
            sizeData.baseSpaceSpeed + 50 * (this.system.abilities.str.mod - this.system.abilities.con.mod);
        this.system.attributes.movement.turn = Math.min(
            this.system.attributes.movement.space,
            Math.max(50, sizeData.baseTurnSpeed - 50 * (this.system.abilities.dex.mod - this.system.abilities.con.mod))
        );

        // Prepare Mods
        this.system.attributes.mods.cap.value = this.items.filter(
            (i) => i.type === "starshipmod" && i.system.equipped && !i.system.free.slot
        ).length;

        // Prepare Suites
        this.system.attributes.mods.suite.max += sizeData.modMaxSuitesMult * this.system.abilities.con.mod;
        this.system.attributes.mods.suite.value = this.items.filter(
            (i) =>
                i.type === "starshipmod" &&
                i.system.equipped &&
                !i.system.free.suite &&
                i.system.system.value === "Suite"
        ).length;

        // Prepare Hardpoints
        this.system.attributes.mods.hardpoint.max +=
            sizeData.hardpointMult * Math.max(1, this.system.abilities.str.mod);

        // Prepare Fuel
        this.system.attributes.fuel = this._computeFuel();
    }

    /* -------------------------------------------- */

    /**
     * Get a list of all equipment of a certain type.
     * @param {string} type       The type of equipment to return, empty for all.
     * @param {boolean} equipped  Ignore non-equipped items
     * @type {object}             Array of items of that type
     */
    _getEquipment(type, {equipped = false} = {}) {
        return this.items.filter(
            (item) =>
                item.type === "equipment" && type === item.system.armor.type && (!equipped || item.system.equipped)
        );
    }

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    _computeFuel() {
        const fuel = this.system.attributes.fuel;
        fuel.cost *= this.system.attributes.equip.reactor.fuelMult;
        // Compute Fuel percentage
        const pct = Math.clamped((fuel.value.toNearest(0.1) * 100) / fuel.fuelCap, 0, 100);
        return {...fuel, pct, fueled: pct > 0};
    }

    /** @inheritdoc */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        const sourceId = this.getFlag("core", "sourceId");
        if (sourceId?.startsWith("Compendium.")) return;

        // Configure prototype token settings
        const s = CONFIG.SW5E.tokenSizes[this.system.traits.size || "med"];
        const prototypeToken = {width: s, height: s};
        if (this.type === "character") Object.assign(prototypeToken, {vision: true, actorLink: true, disposition: 1});
        this.updateSource({prototypeToken});
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        // Add starship actions
        if (this.type == "starship") this.addStarshipDefaults();
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);

        // Apply changes in Actor size to Token width/height
        const newSize = foundry.utils.getProperty(changed, "system.traits.size");
        if (newSize && newSize !== this.system.traits?.size) {
            let size = CONFIG.SW5E.tokenSizes[newSize];
            if (!foundry.utils.hasProperty(changed, "prototypeToken.width")) {
                changed.prototypeToken ||= {};
                changed.prototypeToken.height = size;
                changed.prototypeToken.width = size;
            }
        }

        // Reset death save counters
        const isDead = this.system.attributes.hp.value <= 0;
        if (isDead && foundry.utils.getProperty(changed, "system.attributes.hp.value") > 0) {
            foundry.utils.setProperty(changed, "system.attributes.death.success", 0);
            foundry.utils.setProperty(changed, "system.attributes.death.failure", 0);
        }
    }

    /* -------------------------------------------- */

    /**
     * Assign a class item as the original class for the Actor based on which class has the most levels.
     * @returns {Promise<Actor5e>}  Instance of the updated actor.
     * @protected
     */
    _assignPrimaryClass() {
        const classes = this.itemTypes.class.sort((a, b) => b.system.levels - a.system.levels);
        const newPC = classes[0]?.id || "";
        return this.update({"system.details.originalClass": newPC});
    }

    /* -------------------------------------------- */
    /*  Gameplay Mechanics                          */
    /* -------------------------------------------- */

    /** @override */
    async modifyTokenAttribute(attribute, value, isDelta, isBar) {
        if (attribute === "attributes.hp") {
            const hp = this.system.attributes.hp;
            const delta = isDelta ? -1 * value : hp.value + hp.temp - value;
            return this.applyDamage(Math.abs(delta), delta >= 0 ? 1 : -1);
        }
        return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }

    /* -------------------------------------------- */

    /**
     * Apply a certain amount of damage or healing to the health pool for Actor
     * @param {number} amount       An amount of damage (positive) or healing (negative) to sustain
     * @param {number} multiplier   A multiplier which allows for resistance, vulnerability, or healing
     * @param {string} [damageType] The damage type, will override multiplier if defined
     * @param {string} [itemUuid]   The uuid of the item dealing the damage
     * @returns {Promise<Actor5e>}  A Promise which resolves once the damage has been applied
     */
    async applyDamage(amount = 0, multiplier = 1, {damageType = null, itemUuid = null} = {}) {
        const traits = this.system.traits;
        const hp = this.system.attributes.hp;
        const updates = {};

        amount = parseInt(amount) || 0;
        if (amount <= 0) return this;

        if (damageType) damageType = damageType.toLowerCase();

        if (multiplier > 0) {
            // Apply Damage Reduction
            if (this.type === "starship" && itemUuid) {
                // TODO: maybe expand this to work with characters as well?
                const dr = this.system?.attributes?.equip?.armor?.dr || 0;
                // Starship damage resistance applies only to attacks
                const item = fromUuidSynchronous(itemUuid);
                if (item && ["mwak", "rwak"].includes(item.system.actionType)) {
                    amount = Math.max(1, amount - dr);
                }
            }

            // Deduct damage from temp HP first
            const tmp = parseInt(hp.temp) || 0;
            let tmpMult = multiplier;
            if (damageType) {
                const prefix = this.type === "starship" ? "sd" : "d";
                if (traits[prefix + "i"]?.value?.includes(damageType)) tmpMult = 0;
                else if (traits[prefix + "r"]?.value?.includes(damageType)) tmpMult = 0.5;
                else if (traits[prefix + "v"]?.value?.includes(damageType)) tmpMult = 2;
                else tmpMult = 1;
            }
            const tmpDamage = Math.floor(Math.min(tmp, amount * tmpMult));
            amount = tmpMult ? amount - Math.min(tmp / tmpMult, amount) : 0;

            // Remaining goes to health
            const hpCur = parseInt(hp.value) || 0;
            let hpMult = multiplier;
            if (damageType) {
                if (traits.di.value.includes(damageType)) hpMult = 0;
                else if (traits.dr.value.includes(damageType)) hpMult = 0.5;
                else if (traits.dv.value.includes(damageType)) hpMult = 2;
                else hpMult = 1;
            }
            const hpDamage = Math.floor(Math.min(hpCur, amount * hpMult));

            // Prepare updates
            updates["system.attributes.hp.temp"] = tmp - tmpDamage;
            updates["system.attributes.hp.value"] = hpCur - hpDamage;

            amount = tmpDamage + hpDamage;
        } else {
            // Calculate healing
            const hpMax = (parseInt(hp.max) || 0) + (parseInt(hp.tempmax) || 0);
            const hpCur = parseInt(hp.value) || 0;
            const heal = Math.floor(amount * -multiplier);

            // Prepare updates
            updates["system.attributes.hp.value"] = Math.min(hpCur + heal, hpMax);
            amount = -heal;
        }

        // Delegate damage application to a hook
        // TODO replace this in the future with a better modifyTokenAttribute function in the core
        const allowed = Hooks.call(
            "modifyTokenAttribute",
            {
                attribute: "attributes.hp",
                value: amount,
                isDelta: false,
                isBar: true
            },
            updates
        );
        return allowed !== false ? await this.update(updates, {dhp: -amount}) : this;
    }

    /* -------------------------------------------- */

    /**
     * Apply a certain amount of temporary hit point, but only if it's more than the actor currently has.
     * @param {number} amount       An amount of temporary hit points to set
     * @returns {Promise<Actor5e>}  A Promise which resolves once the temp HP has been applied
     */
    async applyTempHP(amount = 0) {
        amount = parseInt(amount);
        const hp = this.system.attributes.hp;

        // Update the actor if the new amount is greater than the current
        const tmp = parseInt(hp.temp) || 0;
        return amount > tmp ? this.update({"system.attributes.hp.temp": amount}) : this;
    }

    /* -------------------------------------------- */

    /**
     * Apply an array of damages to the health pool of the Actor
     * @param {{Number: ammount, String: type}[]} damages   Ammount and Types of the damages to apply
     * @param {string} [itemUuid]                           The uuid of the item dealing the damage
     */
    async applyDamages(damages, itemUuid = null) {
        for (const damage of damages) {
            await this.applyDamage(Math.abs(damage.ammount), damage.ammount >= 0 ? 1 : -1, {
                damageType: damage.type,
                itemUuid: itemUuid
            });
        }
        return this;
    }

    /* -------------------------------------------- */

    /**
     * Determine whether the provided ability is usable for remarkable athlete.
     * @param {string} ability  Ability type to check.
     * @returns {boolean}       Whether the actor has the remarkable athlete flag and the ability is physical.
     * @private
     */
    _isRemarkableAthlete(ability) {
        return (
            this.getFlag("sw5e", "remarkableAthlete") &&
            CONFIG.SW5E.characterFlags.remarkableAthlete.abilities.includes(ability)
        );
    }

    /* -------------------------------------------- */

    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {object} options      Options which configure how the skill check is rolled
     * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
     */
    async rollSkill(skillId, options = {}) {
        const skl = this.system.skills[skillId];
        const abl = this.system.abilities[skl.ability];
        const globalBonuses = this.system.bonuses?.abilities ?? {};
        const parts = ["@mod", "@abilityCheckBonus"];
        const data = this.getRollData();

        // Add ability modifier
        data.mod = skl.mod;
        data.defaultAbility = skl.ability;

        // Include proficiency bonus
        if (skl.prof.hasProficiency) {
            parts.push("@prof");
            data.prof = skl.prof.term;
        }

        // Global ability check bonus
        if (globalBonuses.check) {
            parts.push("@checkBonus");
            data.checkBonus = Roll.replaceFormulaData(globalBonuses.check, data);
        }

        // Ability-specific check bonus
        if (abl?.bonuses?.check) data.abilityCheckBonus = Roll.replaceFormulaData(abl.bonuses.check, data);
        else data.abilityCheckBonus = 0;

        // Skill-specific skill bonus
        if (skl.bonuses?.check) {
            const checkBonusKey = `${skillId}CheckBonus`;
            parts.push(`@${checkBonusKey}`);
            data[checkBonusKey] = Roll.replaceFormulaData(skl.bonuses.check, data);
        }

        // Global skill check bonus
        if (globalBonuses.skill) {
            parts.push("@skillBonus");
            data.skillBonus = Roll.replaceFormulaData(globalBonuses.skill, data);
        }

        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts?.length > 0) parts.push(...options.parts);

        // Reliable Talent applies to any skill check we have full or better proficiency in
        const reliableTalent = skl.value >= 1 && this.getFlag("sw5e", "reliableTalent");

        // Roll and return
        const flavor = game.i18n.format("SW5E.SkillPromptTitle", {skill: CONFIG.SW5E.skills[skillId]?.label ?? ""});
        const rollData = foundry.utils.mergeObject(
            {
                parts: parts,
                data: data,
                title: `${flavor}: ${this.name}`,
                flavor,
                chooseModifier: true,
                halflingLucky: this.getFlag("sw5e", "halflingLucky"),
                reliableTalent,
                messageData: {
                    "speaker": options.speaker || ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "skill", skillId}
                }
            },
            options
        );

        /**
         * A hook event that fires before a skill check is rolled for an Actor.
         * @function sw5e.preRollSkill
         * @memberof hookEvents
         * @param {Actor5e} actor                Actor for which the skill check is being rolled.
         * @param {D20RollConfiguration} config  Configuration data for the pending roll.
         * @param {string} skillId               ID of the skill being rolled as defined in `SW5E.skills`.
         * @returns {boolean}                    Explicitly return `false` to prevent skill check from being rolled.
         */
        if (Hooks.call("sw5e.preRollSkill", this, rollData, skillId) === false) return;

        const roll = await d20Roll(rollData);

        /**
         * A hook event that fires after a skill check has been rolled for an Actor.
         * @function sw5e.rollSkill
         * @memberof hookEvents
         * @param {Actor5e} actor   Actor for which the skill check has been rolled.
         * @param {D20Roll} roll    The resulting roll.
         * @param {string} skillId  ID of the skill that was rolled as defined in `SW5E.skills`.
         */
        if (roll) Hooks.callAll("sw5e.rollSkill", this, roll, skillId);

        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a generic ability test or saving throw.
     * Prompt the user for input on which variety of roll they want to do.
     * @param {string} abilityId    The ability id (e.g. "str")
     * @param {object} options      Options which configure how ability tests or saving throws are rolled
     */
    rollAbility(abilityId, options = {}) {
        const label = CONFIG.SW5E.abilities[abilityId] ?? "";
        new Dialog({
            title: `${game.i18n.format("SW5E.AbilityPromptTitle", {ability: label})}: ${this.name}`,
            content: `<p>${game.i18n.format("SW5E.AbilityPromptText", {ability: label})}</p>`,
            buttons: {
                test: {
                    label: game.i18n.localize("SW5E.ActionAbil"),
                    callback: () => this.rollAbilityTest(abilityId, options)
                },
                save: {
                    label: game.i18n.localize("SW5E.ActionSave"),
                    callback: () => this.rollAbilitySave(abilityId, options)
                }
            }
        }).render(true);
    }

    /* -------------------------------------------- */

    /**
     * Roll an Ability Test
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} abilityId    The ability ID (e.g. "str")
     * @param {object} options      Options which configure how ability tests are rolled
     * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
     */
    async rollAbilityTest(abilityId, options = {}) {
        const label = CONFIG.SW5E.abilities[abilityId] ?? "";
        const abl = this.system.abilities[abilityId];
        const globalBonuses = this.system.bonuses?.abilities ?? {};
        const parts = [];
        const data = this.getRollData();

        // Add ability modifier
        parts.push("@mod");
        data.mod = abl?.mod ?? 0;

        // Include proficiency bonus
        if (abl?.checkProf.hasProficiency) {
            parts.push("@prof");
            data.prof = abl.checkProf.term;
        }

        // Add ability-specific check bonus
        if (abl?.bonuses?.check) {
            const checkBonusKey = `${abilityId}CheckBonus`;
            parts.push(`@${checkBonusKey}`);
            data[checkBonusKey] = Roll.replaceFormulaData(abl.bonuses.check, data);
        }

        // Add global actor bonus
        if (globalBonuses.check) {
            parts.push("@checkBonus");
            data.checkBonus = Roll.replaceFormulaData(globalBonuses.check, data);
        }

        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts?.length > 0) parts.push(...options.parts);

        // Roll and return
        const flavor = game.i18n.format("SW5E.AbilityPromptTitle", {ability: label});
        const rollData = foundry.utils.mergeObject(
            {
                parts,
                data,
                title: `${flavor}: ${this.name}`,
                flavor,
                halflingLucky: this.getFlag("sw5e", "halflingLucky"),
                messageData: {
                    "speaker": options.speaker || ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "ability", abilityId}
                }
            },
            options
        );

        /**
         * A hook event that fires before an ability test is rolled for an Actor.
         * @function sw5e.preRollAbilityTest
         * @memberof hookEvents
         * @param {Actor5e} actor                Actor for which the ability test is being rolled.
         * @param {D20RollConfiguration} config  Configuration data for the pending roll.
         * @param {string} abilityId             ID of the ability being rolled as defined in `SW5E.abilities`.
         * @returns {boolean}                    Explicitly return `false` to prevent ability test from being rolled.
         */
        if (Hooks.call("sw5e.preRollAbilityTest", this, rollData, abilityId) === false) return;

        const roll = await d20Roll(rollData);

        /**
         * A hook event that fires after an ability test has been rolled for an Actor.
         * @function sw5e.rollAbilityTest
         * @memberof hookEvents
         * @param {Actor5e} actor     Actor for which the ability test has been rolled.
         * @param {D20Roll} roll      The resulting roll.
         * @param {string} abilityId  ID of the ability that was rolled as defined in `SW5E.abilities`.
         */
        if (roll) Hooks.callAll("sw5e.rollAbilityTest", this, roll, abilityId);

        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll an Ability Saving Throw
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} abilityId    The ability ID (e.g. "str")
     * @param {object} options      Options which configure how ability tests are rolled
     * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
     */
    async rollAbilitySave(abilityId, options = {}) {
        const label = CONFIG.SW5E.abilities[abilityId] ?? "";
        const abl = this.system.abilities[abilityId];
        const globalBonuses = this.system.bonuses?.abilities ?? {};
        const parts = [];
        const data = this.getRollData();

        // Add ability modifier
        parts.push("@mod");
        data.mod = abl?.mod ?? 0;

        // Include proficiency bonus
        if (abl?.saveProf.hasProficiency) {
            parts.push("@prof");
            data.prof = abl.saveProf.term;
        }

        // Include ability-specific saving throw bonus
        if (abl?.bonuses?.save) {
            const saveBonusKey = `${abilityId}SaveBonus`;
            parts.push(`@${saveBonusKey}`);
            data[saveBonusKey] = Roll.replaceFormulaData(abl.bonuses.save, data);
        }

        // Include a global actor ability save bonus
        if (globalBonuses.save) {
            parts.push("@saveBonus");
            data.saveBonus = Roll.replaceFormulaData(globalBonuses.save, data);
        }

        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts?.length > 0) parts.push(...options.parts);

        // Roll and return
        const flavor = game.i18n.format("SW5E.SavePromptTitle", {ability: label});
        const rollData = foundry.utils.mergeObject(
            {
                parts,
                data,
                title: `${flavor}: ${this.name}`,
                flavor,
                halflingLucky: this.getFlag("sw5e", "halflingLucky"),
                messageData: {
                    "speaker": options.speaker || ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "save", abilityId}
                }
            },
            options
        );

        /**
         * A hook event that fires before an ability save is rolled for an Actor.
         * @function sw5e.preRollAbilitySave
         * @memberof hookEvents
         * @param {Actor5e} actor                Actor for which the ability save is being rolled.
         * @param {D20RollConfiguration} config  Configuration data for the pending roll.
         * @param {string} abilityId             ID of the ability being rolled as defined in `SW5E.abilities`.
         * @returns {boolean}                    Explicitly return `false` to prevent ability save from being rolled.
         */
        if (Hooks.call("sw5e.preRollAbilitySave", this, rollData, abilityId) === false) return;

        const roll = await d20Roll(rollData);

        /**
         * A hook event that fires after an ability save has been rolled for an Actor.
         * @function sw5e.rollAbilitySave
         * @memberof hookEvents
         * @param {Actor5e} actor     Actor for which the ability save has been rolled.
         * @param {D20Roll} roll      The resulting roll.
         * @param {string} abilityId  ID of the ability that was rolled as defined in `SW5E.abilities`.
         */
        if (roll) Hooks.callAll("sw5e.rollAbilitySave", this, roll, abilityId);

        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Perform a death saving throw, rolling a d20 plus any global save bonuses
     * @param {object} options          Additional options which modify the roll
     * @returns {Promise<D20Roll|null>} A Promise which resolves to the Roll instance
     */
    async rollDeathSave(options = {}) {
        const death = this.system.attributes.death;

        // Display a warning if we are not at zero HP or if we already have reached 3
        if (this.system.attributes.hp.value > 0 || death.failure >= 3 || death.success >= 3) {
            ui.notifications.warn(game.i18n.localize("SW5E.DeathSaveUnnecessary"));
            return null;
        }

        // Evaluate a global saving throw bonus
        const speaker = options.speaker || ChatMessage.getSpeaker({actor: this});
        const globalBonuses = this.system.bonuses?.abilities ?? {};
        const parts = [];
        const data = this.getRollData();

        // Diamond Soul adds proficiency
        if (this.getFlag("sw5e", "diamondSoul")) {
            parts.push("@prof");
            data.prof = new Proficiency(this.system.attributes.prof, 1).term;
        }

        // Include a global actor ability save bonus
        if (globalBonuses.save) {
            parts.push("@saveBonus");
            data.saveBonus = Roll.replaceFormulaData(globalBonuses.save, data);
        }

        // Evaluate the roll
        const flavor = game.i18n.localize("SW5E.DeathSavingThrow");
        const rollData = foundry.utils.mergeObject(
            {
                parts,
                data,
                title: `${flavor}: ${this.name}`,
                flavor,
                halflingLucky: this.getFlag("sw5e", "halflingLucky"),
                targetValue: 10,
                messageData: {
                    "speaker": speaker,
                    "flags.sw5e.roll": {type: "death"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a death saving throw is rolled for an Actor.
         * @function sw5e.preRollDeathSave
         * @memberof hookEvents
         * @param {Actor5e} actor                Actor for which the death saving throw is being rolled.
         * @param {D20RollConfiguration} config  Configuration data for the pending roll.
         * @returns {boolean}                    Explicitly return `false` to prevent death saving throw from being rolled.
         */
        if (Hooks.call("sw5e.preRollDeathSave", this, rollData) === false) return;

        const roll = await d20Roll(rollData);
        if (!roll) return null;

        // Take action depending on the result
        const details = {};

        // Save success
        if (roll.total >= (roll.options.targetValue ?? 10)) {
            let successes = (death.success || 0) + 1;

            // Critical Success = revive with 1hp
            if (roll.isCritical) {
                details.updates = {
                    "system.attributes.death.success": 0,
                    "system.attributes.death.failure": 0,
                    "system.attributes.hp.value": 1
                };
                details.chatString = "SW5E.DeathSaveCriticalSuccess";
            }

            // 3 Successes = survive and reset checks
            else if (successes === 3) {
                details.updates = {
                    "system.attributes.death.success": 0,
                    "system.attributes.death.failure": 0
                };
                details.chatString = "SW5E.DeathSaveSuccess";
            }

            // Increment successes
            else details.updates = {"system.attributes.death.success": Math.clamped(successes, 0, 3)};
        }

        // Save failure
        else {
            let failures = (death.failure || 0) + (roll.isFumble ? 2 : 1);
            details.updates = {"system.attributes.death.failure": Math.clamped(failures, 0, 3)};
            if (failures >= 3) {
                // 3 Failures = death
                details.chatString = "SW5E.DeathSaveFailure";
            }
        }

        /**
         * A hook event that fires after a death saving throw has been rolled for an Actor, but before
         * updates have been performed.
         * @function sw5e.rollDeathSave
         * @memberof hookEvents
         * @param {Actor5e} actor              Actor for which the death saving throw has been rolled.
         * @param {D20Roll} roll               The resulting roll.
         * @param {object} details
         * @param {object} details.updates     Updates that will be applied to the actor as a result of this save.
         * @param {string} details.chatString  Localizable string displayed in the create chat message. If not set, then
         *                                     no chat message will be displayed.
         * @returns {boolean}                  Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollDeathSave", this, roll, details) === false) return roll;

        if (!foundry.utils.isEmpty(details.updates)) await this.update(details.updates);

        // Display success/failure chat message
        if (details.chatString) {
            let chatData = {content: game.i18n.format(details.chatString, {name: this.name}), speaker};
            ChatMessage.applyRollMode(chatData, roll.options.rollMode);
            await ChatMessage.create(chatData);
        }

        // Return the rolled result
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Perform a destruction saving throw, rolling a d20 plus any global save bonuses
     * @param {object} options           Additional options which modify the roll
     * @returns {Promise<D20Roll|null>}  A Promise which resolves to the Roll instance
     */
    async rollDestructionSave(options = {}) {
        const death = this.system.attributes.death;

        // Display a warning if we are not at zero HP or if we already have reached 3
        if (this.system.attributes.hp.value > 0 || death.failure >= 3 || death.success >= 3) {
            ui.notifications.warn(game.i18n.localize("SW5E.DestructionSaveUnnecessary"));
            return null;
        }

        // Evaluate a global saving throw bonus
        const speaker = options.speaker || ChatMessage.getSpeaker({actor: this});
        const globalBonuses = this.system.bonuses?.abilities ?? {};
        const parts = [];
        const data = this.getRollData();

        // Include a global actor ability save bonus
        if (globalBonuses.save) {
            parts.push("@saveBonus");
            data.saveBonus = Roll.replaceFormulaData(globalBonuses.save, data);
        }

        // Evaluate the roll
        const rollData = foundry.utils.mergeObject(
            {
                parts: parts,
                data: data,
                title: `${game.i18n.localize("SW5E.DestructionSavingThrow")}: ${this.name}`,
                halflingLucky: this.getFlag("sw5e", "halflingLucky"),
                targetValue: 10,
                messageData: {
                    "speaker": speaker,
                    "flags.sw5e.roll": {type: "destruction"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a destruction saving throw is rolled for an Actor.
         * @function sw5e.preRollDestructionSave
         * @memberof hookEvents
         * @param {Actor5e} actor                Actor for which the destruction saving throw is being rolled.
         * @param {D20RollConfiguration} config  Configuration data for the pending roll.
         * @returns {boolean}                    Explicitly return `false` to prevent destruction saving throw from being rolled.
         */
        if (Hooks.call("sw5e.preRollDestructionSave", this, rollData) === false) return;

        const roll = await d20Roll(rollData);
        if (!roll) return null;

        // Take action depending on the result
        const details = {};

        // Save success
        if (roll.total >= (roll.options.targetValue ?? 10)) {
            let successes = (death.success || 0) + 1;

            // Critical Success = revive with 1hp
            if (roll.isCritical) {
                details.updates = {
                    "system.attributes.death.success": 0,
                    "system.attributes.death.failure": 0,
                    "system.attributes.hp.value": 1
                };
                details.chatString = "SW5E.DestructionSaveCriticalSuccess";
            }

            // 3 Successes = survive and reset checks
            else if (successes === 3) {
                details.updates = {
                    "system.attributes.death.success": 0,
                    "system.attributes.death.failure": 0
                };
                details.chatString = "SW5E.DestructionSaveSuccess";
            }

            // Increment successes
            else details.update = {"system.attributes.death.success": Math.clamped(successes, 0, 3)};
        }

        // Save failure
        else {
            let failures = (death.failure || 0) + (roll.isFumble ? 2 : 1);
            details.updates = {"system.attributes.death.failure": Math.clamped(failures, 0, 3)};
            if (failures >= 3) {
                // 3 Failures = destruction
                details.chatString = "SW5E.DestructionSaveFailure";
            }
        }
        /**
         * A hook event that fires after a destruction saving throw has been rolled for an Actor, but before
         * updates have been performed.
         * @function sw5e.rollDestructionSave
         * @memberof hookEvents
         * @param {Actor5e} actor              Actor for which the destruction saving throw has been rolled.
         * @param {D20Roll} roll               The resulting roll.
         * @param {object} details
         * @param {object} details.updates     Updates that will be applied to the actor as a result of this save.
         * @param {string} details.chatString  Localizable string displayed in the create chat message. If not set, then
         *                                     no chat message will be displayed.
         * @returns {boolean}                  Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollDestructionSave", this, roll, details) === false) return roll;

        if (!foundry.utils.isEmpty(details.updates)) await this.update(details.updates);

        // Display success/failure chat message
        if (details.chatString) {
            let chatData = {content: game.i18n.format(details.chatString, {name: this.name}), speaker};
            ChatMessage.applyRollMode(chatData, roll.options.rollMode);
            await ChatMessage.create(chatData);
        }

        // Return the rolled result
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a hit die of the appropriate type, gaining hit points equal to the die roll plus your CON modifier.
     * @param {string} [denomination]  The hit denomination of hit die to roll. Example "d8".
     *                                 If no denomination is provided, the first available HD will be used
     * @param {object} options         Additional options which modify the roll.
     * @returns {Promise<Roll|null>}   The created Roll instance, or null if no hit die was rolled
     */
    async rollHitDie(denomination, options = {}) {
        // If no denomination was provided, choose the first available
        let cls = null;
        if (!denomination) {
            cls = this.itemTypes.class.find((c) => c.system.hitDiceUsed < c.system.levels);
            if (!cls) return null;
            denomination = cls.system.hitDice;
        }

        // Otherwise, locate a class (if any) which has an available hit die of the requested denomination
        else
            cls = this.items.find((i) => {
                return i.system.hitDice === denomination && (i.system.hitDiceUsed || 0) < (i.system.levels || 1);
            });

        // If no class is available, display an error notification
        if (!cls) {
            ui.notifications.error(game.i18n.format("SW5E.HitDiceWarn", {name: this.name, formula: denomination}));
            return null;
        }

        // Prepare roll data
        const flavor = game.i18n.localize("SW5E.HitDiceRoll");
        const rollConfig = foundry.utils.mergeObject({
            formula: `max(0, 1${denomination} + @abilities.con.mod)`,
                data: this.getRollData(),
                chatMessage: true,
                messageData: {
                    "speaker": ChatMessage.getSpeaker({actor: this}),
                    flavor,
                    title: `${flavor}: ${this.name}`,
                    rollMode: game.settings.get("core", "rollMode"),
                    "flags.sw5e.roll": {type: "hitDie"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a hit die is rolled for an Actor.
         * @function sw5e.preRollHitDie
         * @memberof hookEvents
         * @param {Actor5e} actor               Actor for which the hit die is to be rolled.
         * @param {object} config               Configuration data for the pending roll.
         * @param {string} config.formula       Formula that will be rolled.
         * @param {object} config.data          Data used when evaluating the roll.
         * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
         * @param {object} config.messageData   Data used to create the chat message.
         * @param {string} denomination         Size of hit die to be rolled.
         * @returns {boolean}                   Explicitly return `false` to prevent hit die from being rolled.
         */
        if (Hooks.call("sw5e.preRollHitDie", this, rollConfig, denomination) === false) return;

        const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({async: true});
        if ( rollConfig.chatMessage ) roll.toMessage(rollConfig.messageData);

        const hp = this.system.attributes.hp;
        const dhp = Math.min(hp.max + (hp.tempmax ?? 0) - hp.value, roll.total);
        const updates = {
            actor: {"system.attributes.hp.value": hp.value + dhp},
            class: {"system.hitDiceUsed": cls.system.hitDiceUsed + 1}
        };

        /**
         * A hook event that fires after a hit die has been rolled for an Actor, but before updates have been performed.
         * @function sw5e.rollHitDie
         * @memberof hookEvents
         * @param {Actor5e} actor         Actor for which the hit die has been rolled.
         * @param {Roll} roll             The resulting roll.
         * @param {object} updates
         * @param {object} updates.actor  Updates that will be applied to the actor.
         * @param {object} updates.class  Updates that will be applied to the class.
         * @returns {boolean}             Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollHitDie", this, roll, updates) === false) return roll;

        // Perform updates
        if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
        if (!foundry.utils.isEmpty(updates.class)) await cls.update(updates.class);

        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a hull die of the appropriate type, gaining hull points equal to the die roll plus your CON modifier
     * @param {string} [denomination]          The hit denomination of hull die to roll. Example "d8".
     *                                         If no denomination is provided, the first available HD will be used
     * @param {string} [numDice]               How many dice to roll?
     * @param {string} [keep]                  Which dice to keep? Example "kh1".
     * @param {object} options                 Additional options which modify the roll.
     * @returns {Promise<attribDieRoll|null>}  The created Roll instance, or null if no hull die was rolled
     */
    async rollHullDie(denomination, numDice = "1", keep = "", options = {}) {
        // If no denomination was provided, choose the first available
        let sship = null;
        const hullMult = ["huge", "grg"].includes(this.system.traits.size) ? 2 : 1;
        if (!denomination) {
            sship = this.itemTypes.starship.find(
                (s) => s.system.hullDiceUsed < s.system.tier * hullMult + s.system.hullDiceStart
            );
            if (!sship) return null;
            denomination = sship.system.hullDice;
        }

        // Otherwise locate a starship (if any) which has an available hit die of the requested denomination
        else
            sship = this.items.find((i) => {
                return (
                    i.system.hullDice === denomination &&
                    (i.system.hullDiceUsed || 0) < (i.system.tier * hullMult || 0) + i.system.hullDiceStart
                );
            });

        // If no starship is available, display an error notification
        if (!sship) {
            ui.notifications.error(
                game.i18n.format("SW5E.HullDiceWarn", {
                    name: this.name,
                    formula: denomination
                })
            );
            return null;
        }

        // Prepare roll data
        const flavor = game.i18n.localize("SW5E.HullDiceRoll");
        if (options.fastForward === undefined) options.fastForward = !options.dialog;
        const rollData = foundry.utils.mergeObject(
            {
                event: new Event("hullDie"),
                parts: [`${numDice}${denomination}${keep}`, "@abilities.con.mod"],
                data: this.getRollData(),
                title: `${flavor}: ${this.name}`,
                dialogOptions: {width: 350},
                messageData: {
                    "speaker": ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "hullDie"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a hull die is rolled for an Actor.
         * @function sw5e.preRollHullDie
         * @memberof hookEvents
         * @param {Actor5e} actor                      Actor for which the hull die is to be rolled.
         * @param {AttribDieRollConfiguration} config  Configuration data for the pending roll.
         * @param {string} denomination                Size of hull die to be rolled.
         * @returns {boolean}                          Explicitly return `false` to prevent hull die from being rolled.
         */
        if (Hooks.call("sw5e.preRollHullDie", this, rollData, denomination) === false) return;

        const roll = await attribDieRoll(rollData);
        if (!roll) return roll;

        const hp = this.system.attributes.hp;
        const dhp = Math.min(hp.max - hp.value, roll.total);
        const updates = {
            actor: {"system.attributes.hp.value": hp.value + dhp},
            starship: {"system.hullDiceUsed": sship.system.hullDiceUsed + 1}
        };

        /**
         * A hook event that fires after a hull die has been rolled for an Actor, but before updates have been performed.
         * @function sw5e.rollHullDie
         * @memberof hookEvents
         * @param {Actor5e} actor            Actor for which the hull die has been rolled.
         * @param {AttribDieRoll} roll       The resulting roll.
         * @param {object} updates
         * @param {object} updates.actor     Updates that will be applied to the actor.
         * @param {object} updates.starship  Updates that will be applied to the starship size.
         * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollHullDie", this, roll, updates) === false) return roll;

        // Perform updates
        if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
        if (!foundry.utils.isEmpty(updates.starship)) await sship.update(updates.starship);

        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Results from a roll shield die operation.
     *
     * @typedef {object} SDRollResult
     * @property {number} sp             Shield Points recovered.
     * @property {object} actorUpdates   Updates applied to the actor.
     * @property {object} itemUpdates    Updates applied to the actor's items.
     * @property {Roll} roll             The created Roll instance, or null if no shield die was rolled
     */

    /* -------------------------------------------- */

    /**
     * Roll a shield die of the appropriate type, gaining shield points equal to the die roll
     * multiplied by the shield regeneration coefficient
     * @param {string} [denomination]        The denomination of shield die to roll. Example "d8".
     *                                       If no denomination is provided, the first available SD will be used
     * @param {boolean} [natural]            Natural ship shield regeneration (true) or user action (false)?
     * @param {string} [numDice]             How many dice to roll?
     * @param {string} [keep]                Which dice to keep? Example "kh1".
     * @param {object} options               Additional options which modify the roll.
     * @return {Promise<SDRollResult|null>}  A Promise which resolves once the shield die roll workflow has completed.
     */
    async rollShieldDie({denomination, natural = false, numDice = "1", keep = "", update = true, options = {}} = {}) {
        const result = {
            sp: 0,
            actorUpdates: {},
            itemUpdates: [],
            roll: null
        };

        const attr = this.system.attributes;
        const shld = attr.shld;
        const hp = attr.hp;

        // If shields are depleted, display an error notification and exit
        if (shld.depleted) {
            ui.notifications.error(
                game.i18n.format("SW5E.ShieldDepletedWarn", {
                    name: this.name
                })
            );
            return result;
        }

        // If no denomination was provided, choose the first available
        let sship = null;
        const shldMult = ["huge", "grg"].includes(this.system.traits.size) ? 2 : 1;
        if (!denomination) {
            sship = this.itemTypes.starship.find(
                (i) => (i.system.shldDiceUsed || 0) < (i.system.tier * shldMult || 0) + i.system.shldDiceStart
            );
            if (!sship) return result;
            denomination = sship.system.shldDice;
        }
        // Otherwise locate a starship (if any) which has an available shield die of the requested denomination
        else {
            sship = this.itemTypes.starship.find((i) => {
                return (
                    i.system.shldDice === denomination &&
                    (i.system.shldDiceUsed || 0) < (i.system.tier * shldMult || 0) + i.system.shldDiceStart
                );
            });
        }

        // If no starship is available, display an error notification
        if (!sship) {
            ui.notifications.error(
                game.i18n.format("SW5E.ShieldDiceWarn", {
                    name: this.name,
                    formula: denomination
                })
            );
            return result;
        }

        // If shields are full, display an error notification
        if (hp.temp >= hp.tempmax) {
            ui.notifications.error(
                game.i18n.format("SW5E.ShieldFullWarn", {
                    name: this.name
                })
            );
            return result;
        }

        // Prepare roll data
        // if natural regeneration roll max
        const dieRoll = natural ? denomination : numDice + denimination + keep;
        const flavor = game.i18n.localize("SW5E.ShieldDiceRoll");
        if (options.fastForward === undefined) options.fastForward = !options.dialog;
        const rollData = foundry.utils.mergeObject(
            {
                event: new Event("shldDie"),
                parts: [`${dieRoll} * @attributes.equip.shields.regenRateMult`],
                data: this.getRollData(),
                title: `${flavor}: ${this.name}`,
                dialogOptions: {width: 350},
                messageData: {
                    "speaker": ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "shldDie"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a shield die is rolled for an Actor.
         * @function sw5e.preRollShieldDie
         * @memberof hookEvents
         * @param {Actor5e} actor                      Actor for which the shield die is to be rolled.
         * @param {AttribDieRollConfiguration} config  Configuration data for the pending roll.
         * @param {string} denomination                Size of shield die to be rolled.
         * @returns {boolean}                          Explicitly return `false` to prevent shield die from being rolled.
         */
        if (Hooks.call("sw5e.preRollShieldDie", this, rollData, denomination) === false) return result;

        const roll = await attribDieRoll(rollData);
        if (!roll) return result;
        result.roll = roll;

        const dsp = Math.min(hp.tempmax - hp.temp, roll.total);
        result.sp = dsp;

        const updates = {
            actor: {"system.attributes.hp.temp": hp.temp + dsp},
            starship: {"system.shldDiceUsed": sship.system.shldDiceUsed + 1}
        };
        result.actorUpdates = updates.actor;
        result.itemUpdates = [ { ...updates.starship, '_id': sship.id } ];

        /**
         * A hook event that fires after a shield die has been rolled for an Actor, but before updates have been performed.
         * @function sw5e.rollShieldDie
         * @memberof hookEvents
         * @param {Actor5e} actor            Actor for which the shield die has been rolled.
         * @param {AttribDieRoll} roll       The resulting roll.
         * @param {object} updates
         * @param {object} updates.actor     Updates that will be applied to the actor.
         * @param {object} updates.starship  Updates that will be applied to the starship size.
         * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollShieldDie", this, roll, updates) === false) return result;

        // Perform updates
        if (update) {
            if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
            if (!foundry.utils.isEmpty(updates.starship)) await sship.update(updates.starship);
        }

        return result;
    }

    /* -------------------------------------------- */

    /**
     * Results from a power die recovery operation.
     *
     * @typedef {object} PDRecoveryResult
     * @property {number} pd             Power die recovered.
     * @property {object} actorUpdates   Updates applied to the actor.
     * @property {object} itemUpdates    Updates applied to the actor's items.
     * @property {Roll} roll             The created Roll instance, or null if no power die was rolled
     */

    /* -------------------------------------------- */

    /**
     * Roll a power die recovery of the appropriate type, gaining power dice equal to the roll
     *
     * @param {string} [formula]                Formula from reactor to use for power die recovery
     * @param {object} options                  Additional options which modify the roll.
     * @return {Promise<PDRecoveryResult|null>} A Promise which resolves once the power die recovery workflow has completed.
     */
    async rollPowerDieRecovery({formula, update = false, options = {}} = {}) {
        const result = {
            pd: 0,
            actorUpdates: {},
            itemUpdates: [],
            roll: null
        };

        // Prepare helper data
        const attr = this.system.attributes;
        const pd = attr.power;

        // if no formula check starship for equipped reactor
        if (!formula) formula = attr.equip.reactor.powerRecDie;

        // Calculate how many available slots for power die the ship has
        const pdMissing = {};
        const slots = CONFIG.SW5E.powerDieSlots;
        for (const slot of Object.keys(slots)) {
            pdMissing[slot] = pd[slot].max - Number(pd[slot].value);
            pdMissing.total = (pdMissing.total ?? 0) + pdMissing[slot];
        }

        // Don't roll it there are no available slots
        if (!pdMissing.total) return result;

        // Prepare roll data
        const flavor = game.i18n.localize("SW5E.PowerDiceRecovery");

        // Call the roll helper utility
        const rollData = foundry.utils.mergeObject(
            {
                event: new Event("pwrDieRec"),
                parts: [formula],
                data: this.getRollData(),
                title: `${flavor}: ${this.name}`,
                fastForward: true,
                dialogOptions: {width: 350},
                messageData: {
                    "speaker": ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "pwrDieRec"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a power recovery die is rolled for an Actor.
         * @function sw5e.preRollPowerDieRecovery
         * @memberof hookEvents
         * @param {Actor5e} actor                      Actor for which the power recovery die is to be rolled.
         * @param {AttribDieRollConfiguration} config  Configuration data for the pending roll.
         * @param {string} formula                     Formula of power recovery die to be rolled.
         * @returns {boolean}                          Explicitly return `false` to prevent power recovery die from being rolled.
         */
        if (Hooks.call("sw5e.preRollPowerDieRecovery", this, rollData, formula) === false) return result;

        const roll = await attribDieRoll(rollData);
        if (!roll) return result;

        // If the roll is enough to fill all available slots
        if (pdMissing.total <= roll.total) {
            for (const slot of Object.keys(slots))
                result.actorUpdates[`system.attributes.power.${slot}.value`] = pd[slot].max;
            result.pd = pdMissing.total;
        }
        // If all new power die can fit into the central storage
        else if (pdMissing.central >= roll.total) {
            result.actorUpdates["system.attributes.power.central.value"] = String(Number(pd.central.value) + roll.total);
            result.pd = roll.total;
        }
        // Otherwise, create an allocation dialog popup
        else {
            result.actorUpdates["system.attributes.power.central.value"] = pd.central.max;
            try {
                const allocation = await AllocatePowerDice.allocatePowerDice(this, roll.total - pdMissing.central);
                for (const slot of allocation)
                    result.actorUpdates[`system.attributes.power.${slot}.value`] = Number(pd[slot].value) + 1;
                result.pd = allocation.length + pdMissing.central;
            } catch (err) {
                return result;
            }
        }

        const updates = {
            actor: result.actorUpdates,
            starship: result.itemUpdates
        };

        /**
         * A hook event that fires after a power recovery die has been rolled for an Actor, but before updates have been performed.
         * @function sw5e.rollPowerDieRecovery
         * @memberof hookEvents
         * @param {Actor5e} actor            Actor for which the power recovery die has been rolled.
         * @param {AttribDieRoll} roll       The resulting roll.
         * @param {object} updates
         * @param {object} updates.actor     Updates that will be applied to the actor.
         * @param {object} updates.starship  Updates that will be applied to the starship size.
         * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollPowerDieRecovery", this, roll, updates) === false) return result;

        // Perform updates
        if (update) {
            if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
            if (!foundry.utils.isEmpty(updates.starship)) await sship.update(updates.starship);
        }

        result.roll = roll;
        return result;
    }

    /* -------------------------------------------- */

    /**
     * Roll a power die
     *
     * @param {string} [slot]                Where to draw the power die from, if empty, opens a popup to select
     * @param {object} options               Additional options which modify the roll.
     * @return {Promise<AttribDieRoll|null>}  The created Roll instance, or null if no power die was rolled
     */
    async rollPowerDie(slot = null, options = {}) {
        // Prepare helper data
        const attr = this.system.attributes;
        const pd = attr.power;
        const slots = CONFIG.SW5E.powerDieSlots;

        // Validate the slot
        if (slot === null) {
            try {
                slot = await ExpendPowerDice.expendPowerDice(this);
            } catch (err) {
                return null;
            }
        }
        if (!Object.keys(slots).includes(slot)) {
            ui.notifications.warn(
                game.i18n.format("SW5E.PowerDieInvalidSlot", {
                    slot: slot
                })
            );
            return null;
        }
        if (pd[slot].value < 1) {
            ui.notifications.warn(
                game.i18n.format("SW5E.PowerDieUnavailable", {
                    slot: game.i18n.localize(CONFIG.SW5E.powerDieSlots[slot])
                })
            );
            return null;
        }

        // Prepare the roll data
        const flavor = game.i18n.localize("SW5E.PowerDiceRoll");

        // Call the roll helper utility
        const rollData = foundry.utils.mergeObject(
            {
                event: new Event("pwrDieRoll"),
                parts: [pd.die],
                data: this.getRollData(),
                title: `${flavor}: ${this.name}`,
                fastForward: true,
                dialogOptions: {width: 350},
                messageData: {
                    "speaker": ChatMessage.getSpeaker({actor: this}),
                    "flags.sw5e.roll": {type: "pwrDieRoll"}
                }
            },
            options
        );

        /**
         * A hook event that fires before a power die is rolled for an Actor.
         * @function sw5e.preRollPowerDie
         * @memberof hookEvents
         * @param {Actor5e} actor                      Actor for which the power die is to be rolled.
         * @param {AttribDieRollConfiguration} config  Configuration data for the pending roll.
         * @param {string} denomination                Size of power die to be rolled.
         * @returns {boolean}                          Explicitly return `false` to prevent power die from being rolled.
         */
        if (Hooks.call("sw5e.preRollPowerDie", this, rollData, pd.die) === false) return;

        const roll = await attribDieRoll(rollData);
        if (!roll) return roll;

        const updates = {
            actor: {}
        };
        updates.actor[`system.attributes.power.${slot}.value`] = pd[slot].value - 1;

        /**
         * A hook event that fires after a Power die has been rolled for an Actor, but before updates have been performed.
         * @function sw5e.rollPowerDie
         * @memberof hookEvents
         * @param {Actor5e} actor            Actor for which the Power die has been rolled.
         * @param {AttribDieRoll} roll       The resulting roll.
         * @param {object} updates
         * @param {object} updates.actor     Updates that will be applied to the actor.
         * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
         */
        if (Hooks.call("sw5e.rollPowerDie", this, roll, updates) === false) return roll;

        // Perform updates
        if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);

        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll hit points for a specific class as part of a level-up workflow.
     * @param {Item5e} item      The class item whose hit dice to roll.
     * @returns {Promise<Roll>}  The completed roll.
     * @see {@link sw5e.preRollClassHitPoints}
     */
    async rollClassHitPoints(item) {
        if (item.type !== "class") throw new Error("Hit points can only be rolled for a class item.");
        const rollData = {formula: `1${item.system.hitDice}`, data: item.getRollData()};
        const flavor = game.i18n.format("SW5E.AdvancementHitPointsRollMessage", {class: item.name});
        const messageData = {
            "title": `${flavor}: ${this.name}`,
            flavor,
            "speaker": ChatMessage.getSpeaker({actor: this}),
            "flags.sw5e.roll": {type: "hitPoints"}
        };

        /**
         * A hook event that fires before hit points are rolled for a character's class.
         * @function sw5e.preRollClassHitPoints
         * @memberof hookEvents
         * @param {Actor5e} actor            Actor for which the hit points are being rolled.
         * @param {Item5e} item              The class item whose hit dice will be rolled.
         * @param {object} rollData
         * @param {string} rollData.formula  The string formula to parse.
         * @param {object} rollData.data     The data object against which to parse attributes within the formula.
         * @param {object} messageData       The data object to use when creating the message.
         */
        Hooks.callAll("sw5e.preRollClassHitPoints", this, item, rollData, messageData);

        const roll = new Roll(rollData.formula, rollData.data);
        await roll.toMessage(messageData);
        return roll;
    }

    /* -------------------------------------------- */
    /*  Resting                                     */
    /* -------------------------------------------- */

    /**
     * Configuration options for a rest.
     *
     * @typedef {object} RestConfiguration
     * @property {boolean} dialog            Present a dialog window which allows for rolling hit dice as part of the
     *                                       Short Rest and selecting whether a new day has occurred.
     * @property {boolean} chat              Should a chat message be created to summarize the results of the rest?
     * @property {boolean} newDay            Does this rest carry over to a new day?
     * @property {boolean} [autoHD]          Should hit dice be spent automatically during a short rest?
     * @property {number} [autoHDThreshold]  How many hit points should be missing before hit dice are
     *                                       automatically spent during a short rest.
     */

    /**
     * Results from a rest operation.
     *
     * @typedef {object} RestResult
     * @property {number} dhp            Hit points recovered during the rest.
     * @property {number} dhd            Hit dice recovered or spent during the rest.
     * @property {object} updateData     Updates applied to the actor.
     * @property {object[]} updateItems  Updates applied to actor's items.
     * @property {boolean} longRest      Whether the rest type was a long rest.
     * @property {boolean} newDay        Whether a new day occurred during the rest.
     * @property {Roll[]} rolls          Any rolls that occurred during the rest process, not including hit dice.
     */

    /* -------------------------------------------- */

    /**
     * Take a short rest, possibly spending hit dice and recovering resources, item uses, and tech slots & points.
     * @param {RestConfiguration} [config]  Configuration options for a short rest.
     * @returns {Promise<RestResult>}       A Promise which resolves once the short rest workflow has completed.
     */
    async shortRest(config = {}) {
        config = foundry.utils.mergeObject(
            {
                dialog: true,
                chat: true,
                newDay: false,
                autoHD: false,
                autoHDThreshold: 3
            },
            config
        );

        /**
         * A hook event that fires before a short rest is started.
         * @function sw5e.preShortRest
         * @memberof hookEvents
         * @param {Actor5e} actor             The actor that is being rested.
         * @param {RestConfiguration} config  Configuration options for the rest.
         * @returns {boolean}                 Explicitly return `false` to prevent the rest from being started.
         */
        if (Hooks.call("sw5e.preShortRest", this, config) === false) return;

        // Take note of the initial hit points and number of hit dice the Actor has
        const hd0 = this.system.attributes.hd;
        const hp0 = this.system.attributes.hp.value;

        // Display a Dialog for rolling hit dice
        if (config.dialog) {
            try {
                config.newDay = await ShortRestDialog.shortRestDialog({actor: this, canRoll: hd0 > 0});
            } catch (err) {
                return;
            }
        }

        // Automatically spend hit dice
        else if (config.autoHD) await this.autoSpendHitDice({threshold: config.autoHDThreshold});

        // Return the rest result
        const dhd = this.system.attributes.hd - hd0;
        const dhp = this.system.attributes.hp.value - hp0;
        const dtp = this.system.attributes.tech.points.max - this.system.attributes.tech.points.value;
        return this._rest(config.chat, config.newDay, false, dhd, dhp, dtp);
    }

    /* -------------------------------------------- */

    /**
     * Take a long rest, recovering hit points, hit dice, resources, item uses, and tech & force power points & slots.
     * @param {RestConfiguration} [config]  Configuration options for a long rest.
     * @returns {Promise<RestResult>}          A Promise which resolves once the long rest workflow has completed.
     */
    async longRest(config = {}) {
        config = foundry.utils.mergeObject(
            {
                dialog: true,
                chat: true,
                newDay: true
            },
            config
        );

        /**
         * A hook event that fires before a long rest is started.
         * @function sw5e.preLongRest
         * @memberof hookEvents
         * @param {Actor5e} actor             The actor that is being rested.
         * @param {RestConfiguration} config  Configuration options for the rest.
         * @returns {boolean}                 Explicitly return `false` to prevent the rest from being started.
         */
        if (Hooks.call("sw5e.preLongRest", this, config) === false) return;

        if (config.dialog) {
            try {
                config.newDay = await LongRestDialog.longRestDialog({actor: this});
            } catch (err) {
                return;
            }
        }

        const dtp = this.system.attributes.tech.points.max - this.system.attributes.tech.points.value;
        const dfp = this.system.attributes.force.points.max - this.system.attributes.force.points.value;

        return this._rest(config.chat, config.newDay, true, 0, 0, dtp, dfp);
    }

    /* -------------------------------------------- */

    /**
     * Perform all of the changes needed for a short or long rest.
     *
     * @param {boolean} chat           Summarize the results of the rest workflow as a chat message.
     * @param {boolean} newDay         Has a new day occurred during this rest?
     * @param {boolean} longRest       Is this a long rest?
     * @param {number} [dhd=0]         Number of hit dice spent during so far during the rest.
     * @param {number} [dhp=0]         Number of hit points recovered so far during the rest.
     * @param {number} [dtp=0]         Number of tech points recovered so far during the rest.
     * @param {number} [dfp=0]         Number of force points recovered so far during the rest.
     * @returns {Promise<RestResult>}  Consolidated results of the rest workflow.
     * @private
     */
    async _rest(chat, newDay, longRest, dhd = 0, dhp = 0, dtp = 0, dfp = 0) {
        // TODO: Turn gritty realism into the SW5e longer rests variant rule https://sw5e.com/rules/variantRules/Longer%20Rests
        let hitPointsRecovered = 0;
        let hitPointUpdates = {};
        let hitDiceRecovered = 0;
        let hitDiceUpdates = [];
        const rolls = [];

        // Recover hit points & hit dice on long rest
        if (longRest) {
            ({updates: hitPointUpdates, hitPointsRecovered} = this._getRestHitPointRecovery());
            ({updates: hitDiceUpdates, hitDiceRecovered} = this._getRestHitDiceRecovery());
        }

        // Figure out the rest of the changes
        const result = {
            dhd: dhd + hitDiceRecovered,
            dhp: dhp + hitPointsRecovered,
            dtp: dtp,
            dfp: dfp,
            updateData: {
                ...hitPointUpdates,
                ...this._getRestResourceRecovery({
                    recoverShortRestResources: !longRest,
                    recoverLongRestResources: longRest
                }),
                ...this._getRestPowerRecovery({recoverForcePowers: longRest}),
                ...this._getRestSuperiorityRecovery()
            },
            updateItems: [
                ...hitDiceUpdates,
                ...await this._getRestItemUsesRecovery({recoverLongRestUses: longRest, recoverDailyUses: newDay, rolls})
            ],
            longRest,
            newDay
        };
        result.rolls = rolls;

        /**
         * A hook event that fires after rest result is calculated, but before any updates are performed.
         * @function sw5e.preRestCompleted
         * @memberof hookEvents
         * @param {Actor5e} actor      The actor that is being rested.
         * @param {RestResult} result  Details on the rest to be completed.
         * @returns {boolean}          Explicitly return `false` to prevent the rest updates from being performed.
         */
        if (Hooks.call("sw5e.preRestCompleted", this, result) === false) return result;

        // Perform updates
        await this.update(result.updateData);
        await this.updateEmbeddedDocuments("Item", result.updateItems);

        // Display a Chat Message summarizing the rest effects
        if (chat) await this._displayRestResultMessage(result, longRest);

        if (Hooks.events.restCompleted?.length)
            foundry.utils.logCompatibilityWarning(
                "The restCompleted hook has been deprecated in favor of sw5e.restCompleted.",
                {since: "SW5e 1.6", until: "SW5e 2.1"}
            );
        /** @deprecated since 1.6, targeted for removal in 2.1 */
        Hooks.callAll("restCompleted", this, result);

        /**
         * A hook event that fires when the rest process is completed for an actor.
         * @function sw5e.restCompleted
         * @memberof hookEvents
         * @param {Actor5e} actor      The actor that just completed resting.
         * @param {RestResult} result  Details on the rest completed.
         */
        Hooks.callAll("sw5e.restCompleted", this, result);

        // Return data summarizing the rest effects
        return result;
    }

    /* -------------------------------------------- */

    /**
     * Display a chat message with the result of a rest.
     *
     * @param {RestResult} result         Result of the rest operation.
     * @param {boolean} [longRest=false]  Is this a long rest?
     * @returns {Promise<ChatMessage>}    Chat message that was created.
     * @protected
     */
    async _displayRestResultMessage(result, longRest = false) {
        const {dhd, dhp, dtp, dfp, newDay} = result;
        const diceRestored = dhd !== 0;
        const healthRestored = dhp !== 0;
        const length = longRest ? "Long" : "Short";

        // Summarize the rest duration
        let restFlavor;
        switch (game.settings.get("sw5e", "restVariant")) {
            case "normal":
                restFlavor = (longRest && newDay) ? "SW5E.LongRestOvernight" : `SW5E.${length}RestNormal`;
                break;
            case "gritty":
                restFlavor = (!longRest && newDay) ? "SW5E.ShortRestOvernight" : `SW5E.${length}RestGritty`;
                break;
            case "epic":
                restFlavor = `SW5E.${length}RestEpic`;
                break;
        }

        // Determine the chat message to display
        let message;
        if (longRest) {
            message = "SW5E.LongRestResult";
            if (healthRestored) message += "HP";
            if (dfp !== 0) message += "FP";
            if (dtp !== 0) message += "TP";
            if (diceRestored) message += "HD";
        } else {
            message = "SW5E.ShortRestResultShort";
            if (diceRestored && healthRestored) {
                if (dtp !== 0) {
                    message = "SW5E.ShortRestResultWithTech";
                } else {
                    message = "SW5E.ShortRestResult";
                }
            } else {
                if (dtp !== 0) {
                    message = "SW5E.ShortRestResultOnlyTech";
                }
            }
        }

        // Create a chat message
        let chatData = {
            user: game.user.id,
            speaker: {actor: this, alias: this.name},
            flavor: game.i18n.localize(restFlavor),
            rolls: result.rolls,
            content: game.i18n.format(message, {
                name: this.name,
                dice: longRest ? dhd : -dhd,
                health: dhp,
                tech: dtp,
                force: dfp
            })
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(chatData);
    }

    /* -------------------------------------------- */

    /**
     * Automatically spend hit dice to recover hit points up to a certain threshold.
     * @param {object} [options]
     * @param {number} [options.threshold=3]  A number of missing hit points which would trigger an automatic HD roll.
     * @returns {Promise<number>}             Number of hit dice spent.
     */
    async autoSpendHitDice({threshold = 3} = {}) {
        const hp = this.system.attributes.hp;
        const max = hp.max + hp.tempmax;
        let diceRolled = 0;
        while (this.system.attributes.hp.value + threshold <= max) {
            const r = await this.rollHitDie();
            if (r === null) break;
            diceRolled += 1;
        }
        return diceRolled;
    }

    /* -------------------------------------------- */

    /**
     * Recovers actor hit points and eliminates any temp HP.
     * @param {object} [options]
     * @param {boolean} [options.recoverTemp=true]     Reset temp HP to zero.
     * @param {boolean} [options.recoverTempMax=true]  Reset temp max HP to zero.
     * @returns {object}                               Updates to the actor and change in hit points.
     * @protected
     */
    _getRestHitPointRecovery({recoverTemp = true, recoverTempMax = true} = {}) {
        const hp = this.system.attributes.hp;
        let max = hp.max;
        let updates = {};
        if (recoverTempMax) updates["system.attributes.hp.tempmax"] = 0;
        else max += hp.tempmax;
        updates["system.attributes.hp.value"] = max;
        if (recoverTemp) updates["system.attributes.hp.temp"] = 0;
        return {updates, hitPointsRecovered: max - hp.value};
    }

    /* -------------------------------------------- */

    /**
     * Recovers actor resources.
     * @param {object} [options]
     * @param {boolean} [options.recoverShortRestResources=true]  Recover resources that recharge on a short rest.
     * @param {boolean} [options.recoverLongRestResources=true]   Recover resources that recharge on a long rest.
     * @returns {object}                                          Updates to the actor.
     * @protected
     */
    _getRestResourceRecovery({recoverShortRestResources = true, recoverLongRestResources = true} = {}) {
        let updates = {};
        for (let [k, r] of Object.entries(this.system.resources)) {
            if (
                Number.isNumeric(r.max) &&
                ((recoverShortRestResources && r.sr) || (recoverLongRestResources && r.lr))
            ) {
                updates[`system.resources.${k}.value`] = Number(r.max);
            }
        }
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Recovers power points and slots.
     * @param {object} [options]
     * @param {boolean} [options.recoverTechPowers=true]    Recover all tech power points and slots.
     * @param {boolean} [options.recoverForcePowers=true]   Recover all force power points and slots.
     * @returns {object}                                  Updates to the actor.
     * @protected
     */
    _getRestPowerRecovery({recoverTechPowers = true, recoverForcePowers = true} = {}) {
        let updates = {};

        if (recoverTechPowers) {
            updates["system.attributes.tech.points.value"] = this.system.attributes.tech.points.max;
            updates["system.attributes.tech.points.temp"] = 0;
            updates["system.attributes.tech.points.tempmax"] = 0;

            for (let [k, v] of Object.entries(this.system.powers)) {
                updates[`system.powers.${k}.tvalue`] = Number.isNumeric(v.toverride) ? v.toverride : v.tmax ?? 0;
            }
        }

        if (recoverForcePowers) {
            updates["system.attributes.force.points.value"] = this.system.attributes.force.points.max;
            updates["system.attributes.force.points.temp"] = 0;
            updates["system.attributes.force.points.tempmax"] = 0;

            for (let [k, v] of Object.entries(this.system.powers)) {
                updates[`system.powers.${k}.fvalue`] = Number.isNumeric(v.foverride) ? v.foverride : v.fmax ?? 0;
            }
        }

        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Recovers superiority dice.
     *
     * @returns {object}       Updates to the actor.
     * @protected
     */
    _getRestSuperiorityRecovery() {
        let updates = {};

        updates["system.attributes.super.dice.value"] = this.system.attributes.super.dice.max;

        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Recovers class hit dice during a long rest.
     *
     * @param {object} [options]
     * @param {number} [options.maxHitDice]  Maximum number of hit dice to recover.
     * @returns {object}                     Array of item updates and number of hit dice recovered.
     * @protected
     */
     _getRestHitDiceRecovery({maxHitDice}={}) {
        // Determine the number of hit dice which may be recovered
        if (maxHitDice === undefined) maxHitDice = Math.max(Math.round(this.system.details.level / 2), 1);

        // Sort classes which can recover HD, assuming players prefer recovering larger HD first.
        const sortedClasses = Object.values(this.classes).sort((a, b) => {
            return (parseInt(b.system.hitDice.slice(1)) || 0) - (parseInt(a.system.hitDice.slice(1)) || 0);
        });

        // Update hit dice usage
        let updates = [];
        let hitDiceRecovered = 0;
        for (let item of sortedClasses) {
            const hitDiceUsed = item.system.hitDiceUsed;
            if (hitDiceRecovered < maxHitDice && hitDiceUsed > 0) {
                let delta = Math.min(hitDiceUsed || 0, maxHitDice - hitDiceRecovered);
                hitDiceRecovered += delta;
                updates.push({"_id": item.id, "system.hitDiceUsed": hitDiceUsed - delta});
            }
        }

        return {updates, hitDiceRecovered};
    }

    /* -------------------------------------------- */

    /**
     * Recovers item uses during short or long rests.
     *
     * @param {object} [options]
     * @param {boolean} [options.recoverShortRestUses=true]  Recover uses for items that recharge after a short rest.
     * @param {boolean} [options.recoverLongRestUses=true]   Recover uses for items that recharge after a long rest.
     * @param {boolean} [options.recoverDailyUses=true]      Recover uses for items that recharge on a new day.
     * @param {Roll[]} [options.rolls]                       Rolls that have been performed as part of this rest.
     * @returns {Promise<object[]>}                          Array of item updates.
     * @protected
     */
     async _getRestItemUsesRecovery({recoverShortRestUses=true, recoverLongRestUses=true,
        recoverDailyUses=true, rolls}={}) {
        let recovery = [];
        if (recoverShortRestUses) recovery.push("sr");
        if (recoverLongRestUses) recovery.push("lr");
        if (recoverDailyUses) recovery.push("day");

        let updates = [];
        for (let item of this.items) {
            const uses = item.system.uses;
            if ( recovery.includes(uses?.per) ) {
              updates.push({_id: item.id, "system.uses.value": uses.max});
            }
            if (recoverLongRestUses && item.system.recharge?.value) {
                updates.push({"_id": item.id, "system.recharge.charged": true});
            }

            // Items that roll to gain charges on a new day
            if ( recoverDailyUses && uses?.recovery && (uses?.per === "charges") ) {
                const roll = new Roll(uses.recovery, this.getRollData());
                if ( recoverLongRestUses && (game.settings.get("sw5e", "restVariant") === "gritty") ) {
                    roll.alter(7, 0, {multiplyNumeric: true});
                }

                let total = 0;
                try {
                    total = (await roll.evaluate({async: true})).total;
                } catch (err) {
                    ui.notifications.warn(game.i18n.format("SW5E.ItemRecoveryFormulaWarning", {
                        name: item.name,
                        formula: uses.recovery
                    }));
                }

                const newValue = Math.clamped(uses.value + total, 0, uses.max);
                if ( newValue !== uses.value ) {
                    const diff = newValue - uses.value;
                    const isMax = newValue === uses.max;
                    const locKey = `SW5E.Item${diff < 0 ? "Loss" : "Recovery"}Roll${isMax ? "Max" : ""}`;
                    updates.push({_id: item.id, "system.uses.value": newValue});
                    rolls.push(roll);
                    await roll.toMessage({
                        user: game.user.id,
                        speaker: {actor: this, alias: this.name},
                        flavor: game.i18n.format(locKey, {name: item.name, count: Math.abs(diff)})
                    });
                }
            }
        }
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Configuration options for a repair.
     *
     * @typedef {object} RepairConfiguration
     * @param {boolean} dialog              Present a dialog window which allows for rolling hull dice as part
     *                                      of the Recharge Repair and selecting whether a new day has occurred.
     * @param {boolean} chat                Should a chat message be created to summarize the results of the repair?
     * @param {boolean} [autoHD]            Automatically spend Hull Dice if you are missing 3 or more hit points.
     * @param {boolean} [autoHDThreshold]   A number of missing hull points which would trigger an automatic HD roll.
     */

    /**
     * Results from a repair operation.
     *
     * @typedef {object} RepairResult
     * @property {number} dhp               Hull points recovered during the repair.
     * @property {number} dhd               Hull dice recovered or spent during the repair.
     * @property {object} updateData        Updates applied to the actor.
     * @property {object[]} updateItems     Updates applied to actor's items.
     * @property {boolean} RefittingRepair  Whether the rest type was a long rest.
     * @property {boolean} newDay           Whether a new day occurred during the repair.
     */

    /* -------------------------------------------- */

    /**
     * Take a recharge repair, possibly spending hull dice and recovering resources, and item uses.
     * @param {RepairConfiguration} [config]  Configuration options for a recharge repair.
     * @return {Promise.<RepairResult>}       A Promise which resolves once the recharge repair workflow has completed.
     */
    async rechargeRepair(config = {}) {
        config = foundry.utils.mergeObject(
            {
                dialog: true,
                chat: true,
                autoHD: false,
                autoHDThreshold: 3
            },
            config
        );

        /**
         * A hook event that fires before a recharge repair is started.
         * @function sw5e.preRechargeRepair
         * @memberof hookEvents
         * @param {Actor5e} actor               The actor that is being repaired.
         * @param {RepairConfiguration} config  Configuration options for the repair.
         * @returns {boolean}                   Explicitly return `false` to prevent the repair from being started.
         */
        if (Hooks.call("sw5e.preRechargeRepair", this, config) === false) return;

        // Take note of the initial hull points and number of hull dice the Actor has
        const hd0 = this.system.attributes.hull.dice;
        const hp0 = this.system.attributes.hp.value;
        const regenShld = !this.system.attributes.shld.depleted;
        let newDay = false;

        // Display a Dialog for rolling hull dice
        if (config.dialog) {
            try {
                newDay = await RechargeRepairDialog.rechargeRepairDialog({
                    actor: this,
                    canRoll: hd0 > 0
                });
            } catch (err) {
                return;
            }
        }

        // Automatically spend hull dice
        else if (config.autoHD) await this.autoSpendHullDice({threshold: config.autoHDThreshold});

        // Return the rest result
        const dhd = this.system.attributes.hull.dice - hd0;
        const dhp = this.system.attributes.hp.value - hp0;

        return this._repair(chat, newDay, false, dhd, dhp, regenShld);
    }

    /* -------------------------------------------- */

    /**
     * Take a refitting repair, recovering hull points, hull dice, resources, and item uses.
     *
     * @param {RepairConfiguration} [config]  Configuration options for a refitting repair.
     * @return {Promise.<RepairResult>}       A Promise which resolves once the refitting repair workflow has completed.
     */
    async refittingRepair(config = {}) {
        config = foundry.utils.mergeObject(
            {
                dialog: true,
                chat: true,
                newDay: true
            },
            config
        );

        /**
         * A hook event that fires before a refitting repair is started.
         * @function sw5e.preRefittingRepair
         * @memberof hookEvents
         * @param {Actor5e} actor               The actor that is being repaired.
         * @param {RepairConfiguration} config  Configuration options for the repair.
         * @returns {boolean}                   Explicitly return `false` to prevent the repair from being started.
         */
        if (Hooks.call("sw5e.preRefittingRepair", this, config) === false) return;

        if (config.dialog) {
            try {
                config.newDay = await RefittingRepairDialog.refittingRepairDialog({actor: this});
            } catch (err) {
                return;
            }
        }

        return this._repair(chat, newDay, true, 0, 0, true);
    }

    /* -------------------------------------------- */

    /**
     * Take a regen repair, recovering shield points, and power dice.
     *
     * @param {object} [options]
     * @param {boolean} [options.dialog=true]        Present a confirmation dialog window whether or not to regen.
     * @param {boolean} [options.chat=true]          Summarize the results of the regen workflow as a chat message.
     * @param {boolean} [options.useShieldDie=true]  Whether to expend a shield die for automatic regen.
     * @return {Promise.<RepairResult>}              A Promise which resolves once the regen workflow has completed.
     */
    async regenRepair({dialog = true, chat = true, useShieldDie = true} = {}) {
        if (dialog) {
            try {
                useShieldDie = await RegenRepairDialog.regenRepairDialog({actor: this});
            } catch (err) {
                return;
            }
        }

        // Prepare shield point recovery
        let shldRecovery = null;
        if (useShieldDie) shldRecovery = await this.rollShieldDie({natural: true, update: false});

        // Prepare power die recovery
        const pdRecovery = await this.rollPowerDieRecovery({update: false});

        // Consolidate the changes
        const result = {
            sp: shldRecovery?.sp ?? 0,
            pd: pdRecovery.pd,

            actorUpdates: {
                ...(shldRecovery?.actorUpdates ?? {}),
                ...pdRecovery.actorUpdates
            },
            itemUpdates: [...(shldRecovery?.itemUpdates ?? []), ...pdRecovery.itemUpdates]
        };

        if (foundry.utils.isEmpty(result.actorUpdates) && !result.itemUpdates.length) return result;

        // Perform updates
        await this.update(result.actorUpdates);
        await this.updateEmbeddedDocuments("Item", result.itemUpdates);

        // Display a Chat Message summarizing the repair effects
        if (chat) await this._displayRegenResultMessage(result);

        return result;
    }

    /* -------------------------------------------- */

    /**
     * Perform all of the changes needed for a recharge or refitting repair.
     *
     * @param {boolean} chat             Summarize the results of the repair workflow as a chat message.
     * @param {boolean} newDay           Has a new day occurred during this repair?
     * @param {boolean} refittingRepair  Is this a refitting repair?
     * @param {number} [dhd=0]           Number of hull dice spent during so far during the repair.
     * @param {number} [dhp=0]           Number of hull points recovered so far during the repair.
     * @param {boolean} resetShields     reset shields to max during the repair.
     * @return {Promise.<RepairResult>}  Consolidated results of the repair workflow.
     * @private
     */
    async _repair(chat, newDay, refittingRepair, dhd = 0, dhp = 0, resetShields) {
        // TODO: Turn gritty realism into the SW5e longer repairs variant rule https://sw5e.com/rules/variantRules/Longer%20Repairs
        let powerDiceUpdates = {};
        let hullPointsRecovered = 0;
        let hullPointUpdates = {};
        let hullDiceRecovered = 0;
        let hullDiceUpdates = [];
        let shldPointsRecovered = 0;
        let shldPointUpdates = {};
        let shldDiceRecovered = 0;
        let shldDiceUpdates = [];

        // Recover power dice on any repair
        ({updates: powerDiceUpdates} = this._getRepairPowerDiceRecovery());

        // Recover hit points & hit dice on refitting repair
        if (refittingRepair) {
            ({updates: hullPointUpdates, hullPointsRecovered} = this._getRepairHullPointRecovery());
            ({updates: hullDiceUpdates, hullDiceRecovered} = this._getRepairHullDiceRecovery());
            resetShields = true;
        }

        if (resetShields) {
            ({updates: shldPointUpdates, shldPointsRecovered} = this._getRepairShieldPointRecovery());
            ({updates: shldDiceUpdates, shldDiceRecovered} = this._getRepairShieldDiceRecovery());
        }

        // Figure out the repair of the changes
        const result = {
            dhd: dhd + hullDiceRecovered,
            dhp: dhp + hullPointsRecovered,
            shd: shldDiceRecovered,
            shp: shldPointsRecovered,
            updateData: {
                ...powerDiceUpdates,
                ...hullPointUpdates,
                ...shldPointUpdates
            },
            updateItems: [
                ...hullDiceUpdates,
                ...shldDiceUpdates,
                ...this._getRepairItemUsesRecovery({
                    recoverRefittingRepairUses: refittingRepair,
                    recoverDailyUses: newDay
                })
            ],
            newDay: newDay
        };

        /**
         * A hook event that fires after repair result is calculated, but before any updates are performed.
         * @function sw5e.preRepairCompleted
         * @memberof hookEvents
         * @param {Actor5e} actor      The actor that is being repaired.
         * @param {RepairResult} result  Details on the repair to be completed.
         * @returns {boolean}          Explicitly return `false` to prevent the repair updates from being performed.
         */
        if (Hooks.call("sw5e.preRepairCompleted", this, result) === false) return result;

        // Perform updates
        await this.update(result.updateData);
        await this.updateEmbeddedDocuments("Item", result.updateItems);

        // Display a Chat Message summarizing the repair effects
        if (chat) await this._displayRepairResultMessage(result, refittingRepair);

        /**
         * A hook event that fires when the repair process is completed for an actor.
         * @function sw5e.repairCompleted
         * @memberof hookEvents
         * @param {Actor5e} actor        The actor that just completed repairing.
         * @param {RepairResult} result  Details on the repair completed.
         */
        Hooks.callAll("sw5e.repairCompleted", this, result);

        // Return data summarizing the repair effects
        return result;
    }

    /* -------------------------------------------- */

    /**
     * Display a chat message with the result of a repair.
     *
     * @param {RepairResult} result              Result of the repair operation.
     * @param {boolean} [refittingRepair=false]  Is this a refitting repair?
     * @return {Promise.<ChatMessage>}           Chat message that was created.
     * @protected
     */
    async _displayRepairResultMessage(result, refittingRepair) {
        const {dhd, dhp, shd, shp, newDay} = result;
        const hullDiceRestored = dhd !== 0;
        const hullPointsRestored = dhp !== 0;
        const shldDiceRestored = shd !== 0;
        const shldPointsRestored = shp !== 0;
        const length = refittingRepair ? "Refitting" : "Recharge";

        let repairFlavor, message;

        // Summarize the repair duration
        repairFlavor = refittingRepair && newDay ? "SW5E.RefittingRepairOvernight" : `SW5E.${length}RepairNormal`;

        // if we have a variant timing use the following instead
        /*
        /* switch (game.settings.get("sw5e", "repairVariant")) {
        /*     case "normal":
        /*         repairFlavor =
        /*             refittingRepair && newDay ? "SW5E.RefittingRepairOvernight" : `SW5E.${length}RepairNormal`;
        /*         break;
        /*     case "gritty":
        /*         repairFlavor =
        /*             !refittingRepair && newDay ? "SW5E.RechargeRepairOvernight" : `SW5E.${length}RepairGritty`;
        /*         break;
        /*     case "epic":
        /*         repairFlavor = `SW5E.${length}RepairEpic`;
        /*         break;
        /* }
        */

        // Determine the chat message to display
        if (refittingRepair) {
            message = "SW5E.RefittingRepairResult";
            if (hullPointsRestored) message += "HP";
            if (hullDiceRestored) message += "HD";
            if (shldDiceRestored || shldPointsRestored) message += "S";
        } else {
            message = "SW5E.RechargeRepairResult";
            if (hullPointsRestored) message += "HP";
            if (hullDiceRestored) message += "HD";
            if (shldDiceRestored || shldPointsRestored) message += "S";
        }

        // Create a chat message
        let chatData = {
            user: game.user.id,
            speaker: {actor: this, alias: this.name},
            flavor: game.i18n.localize(repairFlavor),
            content: game.i18n.format(message, {
                name: this.name,
                hullDice: refittingRepair ? dhd : -dhd,
                hullPoints: dhp,
                shldDice: shd,
                shldPoints: shp
            })
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(chatData);
    }

    /**
     * Display a chat message with the result of a regen.
     *
     * @param {RepairResult} result              Result of the regen operation.
     * @return {Promise.<ChatMessage>}           Chat message that was created.
     * @protected
     */
    async _displayRegenResultMessage(result) {
        const {sp, pd} = result;
        const shldPointsRestored = sp !== 0;
        const powerDiceRestored = pd !== 0;

        let message = "SW5E.RegenRepairResult";

        if (shldPointsRestored) message += "S";
        if (powerDiceRestored) message += "P";

        // Create a chat message
        let chatData = {
            user: game.user.id,
            speaker: {actor: this, alias: this.name},
            content: game.i18n.format(message, {
                name: this.name,
                shieldPoints: sp,
                powerDice: pd
            })
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(chatData);
    }

    /* -------------------------------------------- */

    /**
     * Automatically spend hull dice to recover hull points up to a certain threshold.
     *
     * @param {object} [options]
     * @param {number} [options.threshold=3]  A number of missing hull points which would trigger an automatic HD roll.
     * @return {Promise.<number>}             Number of hull dice spent.
     */
    async autoSpendHullDice({threshold = 3} = {}) {
        const hp = this.system.attributes.hp;
        const max = hp.max + hp.tempmax;
        let diceRolled = 0;
        while (this.system.attributes.hp.value + threshold <= max) {
            const r = await this.rollHullDie(undefined, {dialog: false});
            if (r === null) break;
            diceRolled += 1;
        }
        return diceRolled;
    }

    /* -------------------------------------------- */

    /**
     * Recovers actor hull points.
     *
     * @param {object} [options]
     * @return {object}           Updates to the actor and change in hull points.
     * @protected
     */
    _getRepairHullPointRecovery() {
        const hp = this.system.attributes.hp;
        let max = hp.max;
        let updates = {};

        updates["system.attributes.hp.value"] = max;

        return {updates, hullPointsRecovered: max - hp.value};
    }

    /* -------------------------------------------- */

    /**
     * Recovers actor shield points and repair depleted shields.
     *
     * @param {object} [options]
     * @return {object}           Updates to the actor and change in shield points.
     * @protected
     */
    _getRepairShieldPointRecovery() {
        const hp = this.system.attributes.hp;
        let max = hp.tempmax;
        let updates = {};

        updates["system.attributes.hp.temp"] = max;
        updates["system.attributes.shld.depleted"] = false;

        return {updates, shldPointsRecovered: max - hp.temp};
    }

    /* -------------------------------------------- */

    /**
     * Recovers actor power dice.
     *
     * @param {object} [options]
     * @return {object}           Updates to the actor.
     * @protected
     */
    _getRepairPowerDiceRecovery() {
        const power = this.system.attributes.power;
        const centralMax = power.central.max;
        const commsMax = power.comms.max;
        const enginesMax = power.engines.max;
        const shieldsMax = power.shields.max;
        const sensorsMax = power.sensors.max;
        const weaponsMax = power.weapons.max;

        let updates = {};

        updates["system.attributes.power.central.value"] = centralMax;
        updates["system.attributes.power.comms.value"] = commsMax;
        updates["system.attributes.power.engines.value"] = enginesMax;
        updates["system.attributes.power.shields.value"] = shieldsMax;
        updates["system.attributes.power.sensors.value"] = sensorsMax;
        updates["system.attributes.power.weapons.value"] = weaponsMax;

        return {updates};
    }

    /* -------------------------------------------- */

    /**
     * Recovers hull during a refitting repair.
     *
     * @param {object} [options]
     * @param {number} [options.maxHullDice]    Maximum number of hull dice to recover.
     * @return {object}                         Array of item updates and number of hit dice recovered.
     * @protected
     */
    _getRepairHullDiceRecovery({maxHullDice = undefined} = {}) {
        // Determine the number of hull dice which may be recovered
        if (maxHullDice === undefined) maxHullDice = this.system.attributes.hull.dicemax;

        // Sort starship sizes which can recover HD, assuming players prefer recovering larger HD first.
        const sortedStarships = Object.values(this.starships).sort((a, b) => {
            return (parseInt(b.system.hullDice.slice(1)) || 0) - (parseInt(a.system.hullDice.slice(1)) || 0);
        });

        // Update hull dice usage
        let updates = [];
        let hullDiceRecovered = 0;
        for (let item of sortedStarships) {
            const hullDiceUsed = item.system.hullDiceUsed;
            if (hullDiceRecovered < maxHullDice && hullDiceUsed > 0) {
                let delta = Math.min(hullDiceUsed || 0, maxHullDice - hullDiceRecovered);
                hullDiceRecovered += delta;
                updates.push({
                    "_id": item.id,
                    "system.hullDiceUsed": hullDiceUsed - delta
                });
            }
        }

        return {updates, hullDiceRecovered};
    }

    /**
     * Recovers shields during a repair.
     *
     * @param {object} [options]
     * @return {object}           Array of item updates and number of shield dice recovered.
     * @protected
     */
    _getRepairShieldDiceRecovery() {
        // Determine the number of shield dice which may be recovered
        const maxShldDice = this.system.attributes.shld.dicemax;

        // Sort starship sizes which can recover SD, assuming players prefer recovering larger SD first.
        const sortedStarships = Object.values(this.starships).sort((a, b) => {
            return (parseInt(b.system.shldDice.slice(1)) || 0) - (parseInt(a.system.shldDice.slice(1)) || 0);
        });

        // Update shield dice usage
        let updates = [];
        let shldDiceRecovered = 0;
        for (let item of sortedStarships) {
            const shldDiceUsed = item.system.shldDiceUsed;
            if (shldDiceRecovered < maxShldDice && shldDiceUsed > 0) {
                let delta = Math.min(shldDiceUsed || 0, maxShldDice - shldDiceRecovered);
                shldDiceRecovered += delta;
                updates.push({
                    "_id": item.id,
                    "system.shldDiceUsed": shldDiceUsed - delta
                });
            }
        }

        return {updates, shldDiceRecovered};
    }

    /* -------------------------------------------- */

    /**
     * Recovers item uses during recharge or refitting repairs.
     *
     * @param {object} [options]
     * @param {boolean} [options.recoverRechargeRepairUses=true]   Recover uses for items that recharge after a recharge repair.
     * @param {boolean} [options.recoverRefittingRepairUses=true]  Recover uses for items that recharge after a refitting repair.
     * @param {boolean} [options.recoverDailyUses=true]            Recover uses for items that recharge on a new day.
     * @return {Array.<object>}                                    Array of item updates.
     * @protected
     */
    _getRepairItemUsesRecovery({
        recoverRechargeRepairUses = true,
        recoverRefittingRepairUses = true,
        recoverDailyUses = true
    } = {}) {
        let recovery = [];
        if (recoverRechargeRepairUses) recovery.push("recharge");
        if (recoverRefittingRepairUses) recovery.push("refitting");
        if (recoverDailyUses) recovery.push("day");

        let updates = [];
        for (let item of this.items) {
            if (recovery.includes(item.system.uses?.per)) {
                updates.push({"_id": item.id, "system.uses.value": item.system.uses.max});
            }
            if (recoverRefittingRepairUses && item.system.recharge?.value) {
                updates.push({"_id": item.id, "system.recharge.charged": true});
            }
        }

        return updates;
    }

    /* -------------------------------------------- */
    /*  Conversion & Transformation                 */
    /* -------------------------------------------- */

    /**
     * Options that determine what properties of the original actor are kept and which are replaced with
     * the target actor.
     *
     * @typedef {object} TransformationOptions
     * @property {boolean} [keepPhysical=false]    Keep physical abilities (str, dex, con)
     * @property {boolean} [keepMental=false]      Keep mental abilities (int, wis, cha)
     * @property {boolean} [keepSaves=false]       Keep saving throw proficiencies
     * @property {boolean} [keepSkills=false]      Keep skill proficiencies
     * @property {boolean} [mergeSaves=false]      Take the maximum of the save proficiencies
     * @property {boolean} [mergeSkills=false]     Take the maximum of the skill proficiencies
     * @property {boolean} [keepClass=false]       Keep proficiency bonus
     * @property {boolean} [keepFeats=false]       Keep features
     * @property {boolean} [keepPowers=false]      Keep powers
     * @property {boolean} [keepItems=false]       Keep items
     * @property {boolean} [keepBio=false]         Keep biography
     * @property {boolean} [keepVision=false]      Keep vision
     * @property {boolean} [transformTokens=true]  Transform linked tokens too
     */

    /**
     * Transform this Actor into another one.
     *
     * @param {Actor5e} target                      The target Actor.
     * @param {TransformationOptions} [options={}]  Options that determine how the transformation is performed.
     * @returns {Promise<Array<Token>>|null}        Updated token if the transformation was performed.
     */
    async transformInto(
        target,
        {
            keepPhysical = false,
            keepMental = false,
            keepSaves = false,
            keepSkills = false,
            mergeSaves = false,
            mergeSkills = false,
            keepClass = false,
            keepFeats = false,
            keepPowers = false,
            keepItems = false,
            keepBio = false,
            keepVision = false,
            transformTokens = true
        } = {}
    ) {
        // Ensure the player is allowed to polymorph
        const allowed = game.settings.get("sw5e", "allowPolymorphing");
        if (!allowed && !game.user.isGM) {
            return ui.notifications.warn(game.i18n.localize("SW5E.PolymorphWarn"));
        }

        // Get the original Actor data and the new source data
        const o = this.toObject();
        o.flags.sw5e = o.flags.sw5e || {};
        o.flags.sw5e.transformOptions = {mergeSkills, mergeSaves};
        const source = target.toObject();

        // Prepare new data to merge from the source
        const d = {
            type: o.type, // Remain the same actor type
            name: `${o.name} (${source.name})`, // Append the new shape to your old name
            system: source.system, // Get the systemdata model of your new form
            items: source.items, // Get the items of your new form
            effects: o.effects.concat(source.effects), // Combine active effects from both forms
            img: source.img, // New appearance
            ownership: o.ownership, // Use the original actor permissions
            folder: o.folder, // Be displayed in the same sidebar folder
            flags: o.flags // Use the original actor flags
        };

        // Specifically delete some data attributes
        delete d.system.resources; // Don't change your resource pools
        delete d.system.currency; // Don't lose currency
        delete d.system.bonuses; // Don't lose global bonuses

        // Specific additional adjustments
        d.system.details.alignment = o.system.details.alignment; // Don't change alignment
        d.system.attributes.exhaustion = o.system.attributes.exhaustion; // Keep your prior exhaustion level
        d.system.attributes.inspiration = o.system.attributes.inspiration; // Keep inspiration
        d.system.powers = o.system.powers; // Keep power slots
        d.system.attributes.ac.flat = target.system.attributes.ac.value; // Override AC

        // Token appearance updates
        d.prototypeToken = {name: d.name, texture: {}};
        for (const k of ["width", "height", "alpha", "lockRotation"]) {
            d.prototypeToken[k] = source.prototypeToken[k];
        }
        for (const k of ["offsetX", "offsetY", "scaleX", "scaleY", "src", "tint"]) {
            d.prototypeToken.texture[k] = source.prototypeToken.texture[k];
        }
        const vision = keepVision ? o.prototypeToken : source.prototypeToken;
        for (const k of ["dimSight", "brightSight", "dimLight", "brightLight", "vision", "sightAngle"]) {
            d.prototypeToken[k] = vision[k];
        }
        if (source.prototypeToken.randomImg) {
            const images = await target.getTokenImages();
            d.prototypeToken.texture.src = images[Math.floor(Math.random() * images.length)];
        }

        // Transfer ability scores
        const abilities = d.system.abilities;
        for (let k of Object.keys(abilities)) {
            const oa = o.system.abilities[k];
            const prof = abilities[k].proficient;
            if (keepPhysical && ["str", "dex", "con"].includes(k)) abilities[k] = oa;
            else if (keepMental && ["int", "wis", "cha"].includes(k)) abilities[k] = oa;
            if (keepSaves) abilities[k].proficient = oa.proficient;
            else if (mergeSaves) abilities[k].proficient = Math.max(prof, oa.proficient);
        }

        // Transfer skills
        if (keepSkills) d.system.skills = o.system.skills;
        else if (mergeSkills) {
            for (let [k, s] of Object.entries(d.system.skills)) {
                s.value = Math.max(s.value, o.system.skills[k].value);
            }
        }

        // Keep specific items from the original data
        d.items = d.items.concat(
            o.items.filter((i) => {
                if (["class", "archetype"].includes(i.type)) return keepClass;
                else if (i.type === "feat") return keepFeats;
                else if (i.type === "power") return keepPowers;
                else return keepItems;
            })
        );

        // Transfer classes for NPCs
        if (!keepClass && d.system.details.cr) {
            d.items.push({
                type: "class",
                name: game.i18n.localize("SW5E.PolymorphTmpClass"),
                data: {levels: d.system.details.cr}
            });
        }

        // Keep biography
        if (keepBio) d.system.details.biography = o.system.details.biography;

        // Keep senses
        if (keepVision) d.system.traits.senses = o.system.traits.senses;

        // Set new data flags
        if (!this.isPolymorphed || !d.flags.sw5e.originalActor) d.flags.sw5e.originalActor = this.id;
        d.flags.sw5e.isPolymorphed = true;

        // Update unlinked Tokens in place since they can simply be re-dropped from the base actor
        if (this.isToken) {
            const tokenData = d.prototypeToken;
            delete d.prototypeToken;
            tokenData.actorData = d;
            return this.token.update(tokenData);
        }

        // Close sheet for non-transformed Actor
        await this.sheet.close();

        /**
         * A hook event that fires just before the actor is transformed.
         * @function sw5e.transformActor
         * @memberof hookEvents
         * @param {Actor5e} actor                  The original actor before transformation.
         * @param {Actor5e} target                 The target actor into which to transform.
         * @param {object} data                    The data that will be used to create the new transformed actor.
         * @param {TransformationOptions} options  Options that determine how the transformation is performed.
         */
        Hooks.callAll("sw5e.transformActor", this, target, d, {
            keepPhysical,
            keepMental,
            keepSaves,
            keepSkills,
            mergeSaves,
            mergeSkills,
            keepClass,
            keepFeats,
            keepPowers,
            keepItems,
            keepBio,
            keepVision,
            transformTokens
        });

        // Create new Actor with transformed data
        const newActor = await this.constructor.create(d, {renderSheet: true});

        // Update placed Token instances
        if (!transformTokens) return;
        const tokens = this.getActiveTokens(true);
        const updates = tokens.map((t) => {
            const newTokenData = foundry.utils.deepClone(d.prototypeToken);
            newTokenData._id = t.id;
            newTokenData.actorId = newActor.id;
            newTokenData.actorLink = true;
            return newTokenData;
        });
        return canvas.scene?.updateEmbeddedDocuments("Token", updates);
    }

    /* -------------------------------------------- */

    /**
     * If this actor was transformed with transformTokens enabled, then its
     * active tokens need to be returned to their original state. If not, then
     * we can safely just delete this actor.
     * @returns {Promise<Actor>|null}  Original actor if it was reverted.
     */
    async revertOriginalForm() {
        if (!this.isPolymorphed) return;
        if (!this.isOwner) {
            return ui.notifications.warn(game.i18n.localize("SW5E.PolymorphRevertWarn"));
        }

        // If we are reverting an unlinked token, simply replace it with the base actor prototype
        if (this.isToken) {
            const baseActor = game.actors.get(this.token.actorId);
            const prototypeTokenData = await baseActor.getTokenData();
            const tokenUpdate = {actorData: {}};
            for (let k of [
                "width",
                "height",
                "scale",
                "img",
                "mirrorX",
                "mirrorY",
                "tint",
                "alpha",
                "lockRotation",
                "name"
            ]) {
                tokenUpdate[k] = prototypeTokenData[k];
            }
            await this.token.update(tokenUpdate, {recursive: false});
            await this.sheet.close();
            const actor = this.token.getActor();
            actor.sheet.render(true);
            return actor;
        }

        // Obtain a reference to the original actor
        const original = game.actors.get(this.getFlag("sw5e", "originalActor"));
        if (!original) return;

        // Get the Tokens which represent this actor
        if (canvas.ready) {
            const tokens = this.getActiveTokens(true);
            const tokenData = await original.getTokenData();
            const tokenUpdates = tokens.map((t) => {
                const update = duplicate(tokenData);
                update._id = t.id;
                delete update.x;
                delete update.y;
                return update;
            });
            canvas.scene.updateEmbeddedDocuments("Token", tokenUpdates);
        }

        // Delete the polymorphed version of the actor, if possible
        const isRendered = this.sheet.rendered;
        if (game.user.isGM) await this.delete();
        else if (isRendered) this.sheet.close();
        if (isRendered) original.sheet.render(isRendered);
        return original;
    }

    /* -------------------------------------------- */

    /**
     * Deploy an Actor into this one.
     *
     * @param {Actor} target The Actor to be deployed.
     * @param {string} toDeploy ID of the position to deploy in
     */
    async ssDeployCrew(target, toDeploy) {
        if (!target) return;

        const deployed = target.system.attributes.deployed;
        const otherShip = target.getStarship();
        if (otherShip) {
            if (otherShip.uuid === this.uuid) {
                if (deployed.deployments.includes(toDeploy)) return;
                else deployed.deployments.push(toDeploy);
            } else {
                await otherShip?.ssUndeployCrew(target, deployed.deployments);
                deployed.uuid = this.uuid;
            }
        } else {
            deployed.uuid = this.uuid;
            deployed.deployments = [toDeploy];
        }

        // Get the starship Actor data and the new crewmember data
        const ssDeploy = this.system.attributes.deployment;
        const charUUID = target.uuid;
        const deployment = ssDeploy[toDeploy];

        if (deployment.items) deployment.items.push(charUUID);
        else {
            if (deployment.value !== null) {
                const otherCrew = fromUuidSynchronous(deployment.value);
                if (otherCrew) await this.ssUndeployCrew(otherCrew, [toDeploy]);
            }
            deployment.value = charUUID;
        }
        if (ssDeploy.active.value === target.uuid) deployment.active = true;

        await this.update({"system.attributes.deployment": ssDeploy});
        await target.update({"system.attributes.deployed": deployed});
    }

    /* -------------------------------------------- */

    /**
     * Undeploys an actor from this starship
     *
     * @param {Actor} target The Actor to be undeployed.
     * @param {array} toUndeploy Array of ids of the positions to undeploy from, empty for all
     */
    async ssUndeployCrew(target, toUndeploy) {
        if (!target) return;
        if (!toUndeploy) toUndeploy = Object.keys(CONFIG.SW5E.ssCrewStationTypes);

        const ssDeploy = this.system.attributes.deployment;
        const deployed = target.system.attributes.deployed;

        for (const key of toUndeploy) {
            const deployment = ssDeploy[key];
            if (!deployment || !deployed.deployments.includes(key)) continue;
            else if (deployment.items) {
                deployment.items = deployment.items.filter((i) => i !== target.uuid);
            } else {
                deployment.value = null;
            }
            if (ssDeploy.active.value === target.uuid) deployment.active = false;
        }

        deployed.deployments = deployed.deployments.filter((i) => !toUndeploy.includes(i));
        if (!deployed.deployments.length) {
            deployed.uuid = null;
            if (ssDeploy.active.value === target.uuid) await this.toggleActiveCrew();
        }

        await this.update({"system.attributes.deployment": ssDeploy});
        await target.update({"system.attributes.deployed": deployed});
    }

    /* -------------------------------------------- */

    /**
     * Toggles if a crew member is active
     *
     * @param {string} target UUID of the target, if empty will set everyone as inactive
     */
    async toggleActiveCrew(target) {
        const deployments = this.system.attributes.deployment;
        const active = deployments.active;

        if (target === active.value) target = null;

        active.value = target;
        for (const key of Object.keys(CONFIG.SW5E.ssCrewStationTypes)) {
            const deployment = deployments[key];
            if (!target) {
                deployment.active = false;
            } else if (deployment.items) {
                deployment.active = deployment.items.includes(target);
            } else {
                deployment.active = deployment.value === target;
            }
        }

        await this.update({"system.attributes.deployment": deployments});
        return active.value;
    }

    /* -------------------------------------------- */

    /**
     * Gets the starship the actor is deployed into
     *
     * @returns Actor>|null  Original actor if it was reverted.
     */
    getStarship() {
        const starship = fromUuidSynchronous(this?.system?.attributes?.deployed?.uuid);
        if (starship && starship instanceof TokenDocument) return starship.actor;
        return starship;
    }

    /* -------------------------------------------- */

    /**
     * Add additional system-specific sidebar directory context menu options for SW5e Actor documents
     * @param {jQuery} html         The sidebar HTML
     * @param {Array} entryOptions  The default array of context menu options
     */
    static addDirectoryContextOptions(html, entryOptions) {
        entryOptions.push({
            name: "SW5E.PolymorphRestoreTransformation",
            icon: '<i class="fas fa-backward"></i>',
            callback: (li) => {
                const actor = game.actors.get(li.data("documentId"));
                return actor.revertOriginalForm();
            },
            condition: (li) => {
                const allowed = game.settings.get("sw5e", "allowPolymorphing");
                if (!allowed && !game.user.isGM) return false;
                const actor = game.actors.get(li.data("documentId"));
                return actor && actor.isPolymorphed;
            }
        });
    }

    /* -------------------------------------------- */

    /**
     * Format a type object into a string.
     * @param {object} typeData          The type data to convert to a string.
     * @returns {string}
     */
    static formatCreatureType(typeData) {
        if (typeof typeData === "string") return typeData; // Backwards compatibility
        let localizedType;
        if (typeData.value === "custom") {
            localizedType = typeData.custom;
        } else {
            let code = CONFIG.SW5E.creatureTypes[typeData.value];
            localizedType = game.i18n.localize(typeData.swarm ? `${code}Pl` : code);
        }
        let type = localizedType;
        if (typeData.swarm) {
            type = game.i18n.format("SW5E.CreatureSwarmPhrase", {
                size: game.i18n.localize(CONFIG.SW5E.actorSizes[typeData.swarm]),
                type: localizedType
            });
        }
        if (typeData.subtype) type = `${type} (${typeData.subtype})`;
        return type;
    }

    /* -------------------------------------------- */

    /**
     * Populate a proficiency object with a `selected` field containing a combination of
     * localizable group & individual proficiencies from `value` and the contents of `custom`.
     *
     * @param {object} data          Object containing proficiency data.
     * @param {string[]} data.value  Array of standard proficiency keys.
     * @param {string} data.custom   Semicolon-separated string of custom proficiencies.
     * @param {string} type          "armor", "weapon", or "tool"
     */
    static prepareProficiencies(data, type) {
        const profs = CONFIG.SW5E[`${type}Proficiencies`];
        const itemTypes = CONFIG.SW5E[`${type}Ids`];

        let values = [];
        if (data.value) values = data.value instanceof Array ? data.value : [data.value];

        data.selected = {};
        for (const key of values) {
            if (profs[key]) {
                data.selected[key] = profs[key];
            } else if (itemTypes && itemTypes[key]) {
                const item = ProficiencySelector.getBaseItem(itemTypes[key], {indexOnly: true});
                data.selected[key] = item.name;
            } else if (type === "tool" && CONFIG.SW5E.vehicleTypes[key]) {
                data.selected[key] = CONFIG.SW5E.vehicleTypes[key];
            }
        }

        // Add custom entries
        if (data.custom) data.custom.split(";").forEach((c, i) => (data.selected[`custom${i + 1}`] = c.trim()));
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
        this._displayScrollingDamage(options.dhp);

        // Get the changed attributes
        const keys = Object.keys(foundry.utils.flattenObject(data)).filter((k) => k !== "_id");
        const changed = new Set(keys);

        const starship = this.getStarship();
        if (starship) {
            const app = starship.apps[starship.sheet.appId];
            if (app) {
                starship.prepareData();
                app.render(true);
            }
        }

        // Additional options only apply to Actors which are not synthetic Tokens
        if (this.isToken) return;
    }

    /* -------------------------------------------- */

    /**
     * Follow-up actions taken after a set of embedded Documents in this parent Document are updated.
     * @param {string} embeddedName   The name of the embedded Document type
     * @param {Document[]} documents  An Array of updated Documents
     * @param {object[]} result       An Array of incremental data objects
     * @param {object} options        Options which modified the update operation
     * @param {string} userId         The ID of the User who triggered the operation
     * @memberof ClientDocumentMixin#
     */
    _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);

        const starship = this.getStarship();
        if (starship) {
            const app = starship.apps[starship.sheet.appId];
            if (app) {
                starship.prepareData();
                app.render(true);
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Display changes to health as scrolling combat text.
     * Adapt the font size relative to the Actor's HP total to emphasize more significant blows.
     * @param {number} dhp      The change in hit points that was applied
     * @private
     */
    _displayScrollingDamage(dhp) {
        if (!dhp) return;
        dhp = Number(dhp);
        const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
        for (const t of tokens) {
            const pct = Math.clamped(Math.abs(dhp) / this.system.attributes.hp.max, 0, 1);
            canvas.interface.createScrollingText(t.center, dhp.signedString(), {
                anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
                fontSize: 16 + 32 * pct, // Range between [16, 48]
                fill: CONFIG.SW5E.tokenHPColors[dhp < 0 ? "damage" : "healing"],
                stroke: 0x000000,
                strokeThickness: 4,
                jitter: 0.25
            });
        }
    }

    /* -------------------------------------------- */
    /*  DEPRECATED METHODS                          */
    /* -------------------------------------------- */

    /**
     * Given a list of items to add to the Actor, optionally prompt the user for which they would like to add.
     * @param {Item5e[]} items         The items being added to the Actor.
     * @param {boolean} [prompt=true]  Whether or not to prompt the user.
     * @returns {Promise<Item5e[]>}
     * @deprecated since sw5e 1.6, targeted for removal in 2.1
     */
    async addEmbeddedItems(items, prompt = true) {
        foundry.utils.logCompatibilityWarning("Actor5e#addEmbeddedItems has been deprecated.", {
            since: "SW5e 1.6",
            until: "SW5e 2.1"
        });
        let itemsToAdd = items;
        if (!items.length) return [];

        // Obtain the array of item creation data
        let toCreate = [];
        if (prompt) {
            const itemIdsToAdd = await SelectItemsPrompt.create(items, {
                hint: game.i18n.localize("SW5E.AddEmbeddedItemPromptHint")
            });
            for (let item of items) {
                if (itemIdsToAdd.includes(item.id)) toCreate.push(item.toObject());
            }
        } else toCreate = items.map((item) => item.toObject());

        // Create the requested items
        if (itemsToAdd.length === 0) return [];
        return Item5e.createDocuments(toCreate, {parent: this});
    }

    /* -------------------------------------------- */

    /**
     * Get a list of features to add to the Actor when a class item is updated.
     * Optionally prompt the user for which they would like to add.
     * @param {object} [options]
     * @param {string} [options.classIdentifier] Identifier slug of the class if it has been changed.
     * @param {string} [options.archetypeName]   Name of the selected archetype if it has been changed.
     * @param {number} [options.level]           New class level if it has been changed.
     * @returns {Promise<Item5e[]>}              Any new items that should be added to the actor.
     * @deprecated since sw5e 1.6, targeted for removal in 2.1
     */
    async getClassFeatures({classIdentifier, archetypeName, level} = {}) {
        foundry.utils.logCompatibilityWarning(
            "Actor5e#getClassFeatures has been deprecated. Please refer to the Advancement API for its replacement.",
            {since: "SW5e 1.6", until: "SW5e 2.1"}
        );
        const existing = new Set(this.items.map((i) => i.name));
        const features = await Actor5e.loadClassFeatures({classIdentifier, archetypeName, level});
        return features.filter((f) => !existing.has(f.name)) || [];
    }

    /* -------------------------------------------- */

    /**
     * Return the features which a character is awarded for each class level.
     * @param {object} [options]
     * @param {string} [options.classIdentifier] Identifier slug of the class being added or updated.
     * @param {string} [options.archetypeName]   Name of the archetype of the class being added, if any.
     * @param {number} [options.level]           The number of levels in the added class.
     * @param {number} [options.priorLevel]      The previous level of the added class.
     * @returns {Promise<Item5e[]>}              Items that should be added based on the changes made.
     * @deprecated since sw5e 1.6, targeted for removal in 2.1
     */
    static async loadClassFeatures({classIdentifier = "", archetypeName = "", level = 1, priorLevel = 0} = {}) {
        foundry.utils.logCompatibilityWarning(
            "Actor5e#loadClassFeatures has been deprecated. Please refer to the Advancement API for its replacement.",
            {since: "SW5e 1.6", until: "SW5e 2.1"}
        );
        archetypeName = archetypeName.slugify();

        // Get the configuration of features which may be added
        const clsConfig = CONFIG.SW5E.classFeatures[classIdentifier];
        if (!clsConfig) return [];

        // Acquire class features
        let ids = [];
        for (let [l, f] of Object.entries(clsConfig.features || {})) {
            l = parseInt(l);
            if (l <= level && l > priorLevel) ids = ids.concat(f);
        }

        // Acquire archetype features
        const archConfig = clsConfig.archetypes[archetypeName] || {};
        for (let [l, f] of Object.entries(archConfig.features || {})) {
            l = parseInt(l);
            if (l <= level && l > priorLevel) ids = ids.concat(f);
        }

        // Load item data for all identified features
        const features = [];
        for (let id of ids) {
            features.push(await fromUuid(id));
        }

        // Class powers should always be prepared
        for (const feature of features) {
            if (feature.type === "power") {
                const preparation = feature.system.preparation;
                preparation.mode = "always";
                preparation.prepared = true;
            }
        }
        return features;
    }

    /* -------------------------------------------- */

    /**
     * Determine a character's AC value from their equipped armor and shield.
     * @returns {object}
     * @private
     * @deprecated since sw5e 2.0, targeted for removal in 2.2
     */
    _computeArmorClass() {
        foundry.utils.logCompatibilityWarning(
            "Actor5e#_computeArmorClass has been renamed Actor5e#_prepareArmorClass.",
            {since: "SW5e 2.0", until: "SW5e 2.2"}
        );
        this._prepareArmorClass();
        return this.system.attributes.ac;
    }

    /* -------------------------------------------- */

    /**
     * Compute the level and percentage of encumbrance for an Actor.
     * @returns {object}  An object describing the character's encumbrance level
     * @private
     * @deprecated since sw5e 2.0, targeted for removal in 2.2
     */
    _computeEncumbrance() {
        foundry.utils.logCompatibilityWarning(
            "Actor5e#_computeEncumbrance has been renamed Actor5e#_prepareEncumbrance.",
            {since: "SW5e 2.0", until: "SW5e 2.2"}
        );
        this._prepareEncumbrance();
        return this.system.attributes.encumbrance;
    }

    /* -------------------------------------------- */

    /**
     * Calculate the initiative bonus to display on a character sheet.
     * @private
     * @deprecated since sw5e 2.0, targeted for removal in 2.2
     */
    _computeInitiativeModifier() {
        foundry.utils.logCompatibilityWarning(
            "Actor5e#_computeInitiativeModifier has been renamed Actor5e#_prepareInitiative.",
            {since: "SW5e 2.0", until: "SW5e 2.2"}
        );
        this._prepareInitiative();
    }

    /* -------------------------------------------- */

    /**
     * Prepare data related to the power-casting capabilities of the Actor.
     * Mutates the value of the system.powers object.
     * @private
     * @deprecated since sw5e 2.0, targeted for removal in 2.2
     */
    _computePowercastingProgression() {
        foundry.utils.logCompatibilityWarning(
            "Actor5e#_computePowercastingProgression has been renamed Actor5e#_preparePowercasting.",
            {since: "SW5e 2.0", until: "SW5e 2.2"}
        );
        this._preparePowercasting();
    }

    /* -------------------------------------------- */

    /**
     * Convert a bonus value to a simple integer for displaying on the sheet.
     * @param {number|string|null} bonus  Actor's bonus value.
     * @param {object} data               Actor data to use for replacing @ strings.
     * @returns {number}                  Simplified bonus as an integer.
     * @protected
     * @deprecated since sw5e 2.0, targeted for removal in 2.2
     */
    _simplifyBonus(bonus, data) {
        foundry.utils.logCompatibilityWarning(
            "Actor#_simplifyBonus has been made a utility function and can be accessed at sw5e.utils.simplifyBonus.",
            {since: "SW5e 2.0", until: "SW5e 2.2"}
        );
        return simplifyBonus(bonus, data);
    }
}
