import Proficiency from "./proficiency.js";
import {d20Roll, damageRoll, attribDieRoll} from "../dice.js";
import SelectItemsPrompt from "../apps/select-items-prompt.js";
import ShortRestDialog from "../apps/short-rest.js";
import LongRestDialog from "../apps/long-rest.js";
import RechargeRepairDialog from "../apps/recharge-repair.js";
import RefittingRepairDialog from "../apps/refitting-repair.js";
import RegenRepairDialog from "../apps/regen-repair.js";
import AllocatePowerDice from "../apps/allocate-power-dice.js";
import ProficiencySelector from "../apps/proficiency-selector.js";
import {SW5E} from "../config.js";
import Item5e from "../item/entity.js";
import {fromUuidSynchronous} from "../helpers.js";

/**
 * Extend the base Actor class to implement additional system-specific logic for SW5e.
 * @extends {Actor}
 */
export default class Actor5e extends Actor {
    /**
     * The data source for Actor5e.classes allowing it to be lazily computed.
     * @type {object<string, Item5e>}
     * @private
     */
    _classes = undefined;

    /**
     * The data source for Actor5e.starships allowing it to be lazily computed.
     * @type {object<string, Item5e>}
     * @private
     */
    _starships = undefined;

    /* -------------------------------------------- */
    /*  Properties                                  */
    /* -------------------------------------------- */

    /**
     * A mapping of classes belonging to this Actor.
     * @type {object<string, Item5e>}
     */
    get classes() {
        if (this._classes !== undefined) return this._classes;
        if (!["character", "npc"].includes(this.data.type)) return (this._classes = {});
        return (this._classes = this.items
            .filter((item) => item.type === "class")
            .reduce((obj, cls) => {
                obj[cls.name.slugify({strict: true})] = cls;
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
        if (this.data.type !== "starship") return (this._starships = {});
        return (this._starships = this.items
            .filter((item) => item.type === "starship")
            .reduce((obj, sship) => {
                obj[sship.name.slugify({strict: true})] = sship;
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
    /*  Methods                                     */
    /* -------------------------------------------- */

    /** @override */
    prepareData() {
        this._preparationWarnings = [];
        super.prepareData();

        // Iterate over owned items and recompute attributes that depend on prepared actor data
        this.items.forEach((item) => item.prepareFinalAttributes());
    }

    /* -------------------------------------------- */

    /** @override */
    prepareBaseData() {
        this._prepareBaseArmorClass(this.data);
        switch (this.data.type) {
            case "character":
                return this._prepareCharacterData(this.data);
            case "npc":
                return this._prepareNPCData(this.data);
            case "starship":
                return this._prepareStarshipData(this.data);
            case "vehicle":
                return this._prepareVehicleData(this.data);
        }
    }

    /* --------------------------------------------- */

    /** @override */
    applyActiveEffects() {
        // The Active Effects do not have access to their parent at preparation time so we wait until this stage to
        // determine whether they are suppressed or not.
        this.effects.forEach((e) => e.determineSuppression());
        return super.applyActiveEffects();
    }

    /* -------------------------------------------- */

    /** @override */
    prepareDerivedData() {
        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags.sw5e || {};
        const bonuses = getProperty(data, "bonuses.abilities") || {};

        // Retrieve data for polymorphed actors
        let originalSaves = null;
        let originalSkills = null;
        if (this.isPolymorphed) {
            const transformOptions = this.getFlag("sw5e", "transformOptions");
            const original = game.actors?.get(this.getFlag("sw5e", "originalActor"));
            if (original) {
                if (transformOptions.mergeSaves) {
                    originalSaves = original.data.data.abilities;
                }
                if (transformOptions.mergeSkills) {
                    originalSkills = original.data.data.skills;
                }
            }
        }

        // Ability modifiers and saves
        const bonusData = this.getRollData();
        const joat = flags.jackOfAllTrades;
        const dcBonus = this._simplifyBonus(data.bonuses?.power?.dc, bonusData);
        const saveBonus = this._simplifyBonus(bonuses.save, bonusData);
        const checkBonus = this._simplifyBonus(bonuses.check, bonusData);
        for (let [id, abl] of Object.entries(data.abilities)) {
            abl.mod = Math.floor((abl.value - 10) / 2);
            const isRA = this._isRemarkableAthlete(id);
            abl.checkProf = new Proficiency(data.attributes.prof, isRA || joat ? 0.5 : 0, !isRA);
            const saveBonusAbl = this._simplifyBonus(abl.bonuses?.save, bonusData);
            abl.saveBonus = saveBonusAbl + saveBonus;

            abl.saveProf = new Proficiency(data.attributes.prof, abl.proficient);
            const checkBonusAbl = this._simplifyBonus(abl.bonuses?.check, bonusData);
            abl.checkBonus = checkBonusAbl + checkBonus;

            abl.save = abl.mod + abl.saveBonus;
            if (Number.isNumeric(abl.saveProf.term)) abl.save += abl.saveProf.flat;
            abl.dc = 8 + abl.mod + data.attributes.prof + dcBonus;

            // If we merged saves when transforming, take the highest bonus here.
            if (originalSaves && abl.proficient) {
                abl.save = Math.max(abl.save, originalSaves[id].save);
            }
        }

        // Inventory encumbrance
        data.attributes.encumbrance = this._computeEncumbrance(actorData);

        // Prepare Starship Data
        if (actorData.type === "starship") this._computeStarshipData(actorData, data);

        // Prepare skills
        this._prepareSkills(actorData, bonusData, bonuses, checkBonus, originalSkills);

        // Reset class store to ensure it is updated with any changes
        this._classes = undefined;

        // Determine Initiative Modifier
        this._computeInitiativeModifier(actorData, checkBonus, bonusData);

        // Cache labels
        this.labels = {};
        if (this.type === "npc") {
            this.labels.creatureType = this.constructor.formatCreatureType(data.details.type);
        }

        // Prepare power-casting data
        this._computeDerivedPowercasting(this.data);

        // Prepare armor class data
        const ac = this._computeArmorClass(data);
        this.armor = ac.equippedArmor || null;
        this.shield = ac.equippedShield || null;
        if (ac.warnings) this._preparationWarnings.push(...ac.warnings);
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

    /** @inheritdoc */
    getRollData() {
        const data = super.getRollData();
        data.prof = new Proficiency(this.data.data.attributes.prof, 1);
        data.classes = Object.entries(this.classes).reduce((obj, e) => {
            const [slug, cls] = e;
            obj[slug] = cls.data.data;
            return obj;
        }, {});
        return data;
    }

    /* -------------------------------------------- */

    /**
     * Given a list of items to add to the Actor, optionally prompt the
     * user for which they would like to add.
     * @param {Item5e[]} items         The items being added to the Actor.
     * @param {boolean} [prompt=true]  Whether or not to prompt the user.
     * @returns {Promise<Item5e[]>}
     */
    async addEmbeddedItems(items, prompt = true) {
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
        } else {
            toCreate = items.map((item) => item.toObject());
        }

        // Create the requested items
        if (itemsToAdd.length === 0) return [];
        return Item5e.createDocuments(toCreate, {parent: this});
    }

    /* -------------------------------------------- */

    /**
     * Get a list of features to add to the Actor when a class item is updated.
     * Optionally prompt the user for which they would like to add.
     * @param {object} [options]
     * @param {string} [options.className]      Name of the class if it has been changed.
     * @param {string} [options.archetypeName]  Name of the selected archetype if it has been changed.
     * @param {number} [options.level]          New class level if it has been changed.
     * @returns {Promise<Item5e[]>}             Any new items that should be added to the actor.
     */
    async getClassFeatures({className, archetypeName, level} = {}) {
        const existing = new Set(this.items.map((i) => i.name));
        const features = await Actor5e.loadClassFeatures({className, archetypeName, level});
        return features.filter((f) => !existing.has(f.name)) || [];
    }

    /* -------------------------------------------- */

    /**
     * Return the features which a character is awarded for each class level.
     * @param {object} [options]
     * @param {string} [options.className]      Name of the class being added or updated.
     * @param {string} [options.archetypeName]  Name of the archetype of the class being added, if any.
     * @param {number} [options.level]          The number of levels in the added class.
     * @param {number} [options.priorLevel]     The previous level of the added class.
     * @returns {Promise<Item5e[]>}             Items that should be added based on the changes made.
     */
    static async loadClassFeatures({className = "", archetypeName = "", level = 1, priorLevel = 0} = {}) {
        className = className.toLowerCase();
        archetypeName = archetypeName.slugify();

        // Get the configuration of features which may be added
        const clsConfig = CONFIG.SW5E.classFeatures[className];
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
                const preparation = feature.data.data.preparation;
                preparation.mode = "always";
                preparation.prepared = true;
            }
        }
        return features;
    }

    /* -------------------------------------------- */
    /*  Data Preparation Helpers                    */
    /* -------------------------------------------- */

    /**
     * Perform any Character specific preparation.
     * @param {object} actorData  Copy of the data for the actor being prepared. *Will be mutated.*
     */
    _prepareCharacterData(actorData) {
        const data = actorData.data;

        // Determine character level and available hit dice based on owned Class items
        const [level, hd] = this.items.reduce(
            (arr, item) => {
                if (item.type === "class") {
                    const classLevels = parseInt(item.data.data.levels) || 1;
                    arr[0] += classLevels;
                    arr[1] += classLevels - (parseInt(item.data.data.hitDiceUsed) || 0);
                }
                return arr;
            },
            [0, 0]
        );
        data.details.level = level;
        data.attributes.hd = hd;

        // Character proficiency bonus
        data.attributes.prof = Math.floor((level + 7) / 4);

        // Experience required for next level
        const xp = data.details.xp;
        xp.max = this.getLevelExp(level || 1);
        const prior = this.getLevelExp(level - 1 || 0);
        const required = xp.max - prior;
        const pct = Math.round(((xp.value - prior) * 100) / required);
        xp.pct = Math.clamped(pct, 0, 100);

        // Determine character rank based on owned Deployment items
        const [rank] = this.items.reduce(
            (arr, item) => {
                if (item.type === "deployment") {
                    const rankLevels = parseInt(item.data.data.rank) || 0;
                    arr[0] += rankLevels;
                    switch (item.data.name) {
                        case "Coordinator":
                            data.attributes.rank.coord = rankLevels;
                            break;
                        case "Gunner":
                            data.attributes.rank.gunner = rankLevels;
                            break;
                        case "Mechanic":
                            data.attributes.rank.mechanic = rankLevels;
                            break;
                        case "Operator":
                            data.attributes.rank.operator = rankLevels;
                            break;
                        case "Pilot":
                            data.attributes.rank.pilot = rankLevels;
                            break;
                        case "Technician":
                            data.attributes.rank.technician = rankLevels;
                            break;
                    }
                }
                return arr;
            },
            [0]
        );
        data.attributes.rank.total = rank;

        // Prestige required for next Rank
        const prestige = data.details.prestige;
        prestige.max = this.getRankExp(rank + 1 || 0);
        const rankPrior = this.getRankExp(rank || 0);
        const rankRequired = prestige.max - rankPrior;
        const rankPct = Math.round(((prestige.value - rankPrior) * 100) / rankRequired);
        prestige.pct = Math.clamped(rankPct, 0, 100);

        // Add base Powercasting attributes
        this._computeBasePowercasting(actorData);
    }

    /* -------------------------------------------- */

    /**
     * Perform any NPC specific preparation.
     * @param {object} actorData  Copy of the data for the actor being prepared. *Will be mutated.*
     */
    _prepareNPCData(actorData) {
        const data = actorData.data;

        // Kill Experience
        data.details.xp.value = this.getCRExp(data.details.cr);

        // Proficiency
        data.attributes.prof = Math.floor((Math.max(data.details.cr, 1) + 7) / 4);

        this._computeBasePowercasting(actorData);

        // Powercaster Level
        if (data.attributes.powercasting && !Number.isNumeric(data.details.powerLevel)) {
            data.details.powerLevel = Math.max(data.details.cr, 1);
        }
    }

    /* -------------------------------------------- */

    /**
     * Perform any Vehicle specific preparation.
     * @param {object} actorData  Copy of the data for the actor being prepared. *Will be mutated.*
     * @private
     */
    _prepareVehicleData(actorData) {}

    /* -------------------------------------------- */

    /**
     * Perform any Starship specific preparation.
     * @param {object} actorData  Copy of the data for the actor being prepared. *Will be mutated.*
     * @private
     */
    _prepareStarshipData(actorData) {
        const data = actorData.data;
        data.attributes.prof = 0;
        // Determine Starship size-based properties based on owned Starship item
        const size = actorData.items.filter((i) => i.type === "starship");
        if (size.length !== 0) {
            const sizeData = size[0].data.data;
            const tiers = parseInt(sizeData.tier) || 0;
            data.traits.size = sizeData.size; // needs to be the short code
            data.details.tier = tiers;
            data.attributes.ac.value = 10 + Math.max(tiers - 1, 0);
            data.attributes.hull.die = sizeData.hullDice;
            if (["huge", "grg"].includes(sizeData.size)) {
                data.attributes.hull.dicemax = sizeData.hullDiceStart + 2 * tiers;
                data.attributes.shld.dicemax = sizeData.shldDiceStart + 2 * tiers;
            } else {
                data.attributes.hull.dicemax = sizeData.hullDiceStart + tiers;
                data.attributes.shld.dicemax = sizeData.shldDiceStart + tiers;
            }
            data.attributes.hull.dice = data.attributes.hull.dicemax - (parseInt(sizeData.hullDiceUsed) || 0);
            data.attributes.shld.die = sizeData.shldDice;
            data.attributes.shld.dice = data.attributes.shld.dicemax - (parseInt(sizeData.shldDiceUsed) || 0);
            sizeData.pwrDice = SW5E.powerDieTypes[tiers];
            data.attributes.power.die = sizeData.pwrDice;
            data.attributes.cost.baseBuild = sizeData.buildBaseCost;
            data.attributes.workforce.minBuild = sizeData.buildMinWorkforce;
            data.attributes.workforce.max = data.attributes.workforce.minBuild * 5;
            data.attributes.cost.baseUpgrade = SW5E.baseUpgradeCost[tiers];
            data.attributes.cost.multUpgrade = sizeData.upgrdCostMult;
            data.attributes.workforce.minUpgrade = sizeData.upgrdMinWorkforce;
            data.attributes.equip.size.crewMinWorkforce = parseInt(sizeData.crewMinWorkforce) || 1;
            data.attributes.mods.capLimit = sizeData.modBaseCap;
            data.attributes.mods.suites.cap = sizeData.modMaxSuiteCap;
            data.attributes.cost.multModification = sizeData.modCostMult;
            data.attributes.workforce.minModification = sizeData.modMinWorkforce;
            data.attributes.cost.multEquip = sizeData.equipCostMult;
            data.attributes.workforce.minEquip = sizeData.equipMinWorkforce;
            data.attributes.equip.size.cargoCap = sizeData.cargoCap;
            data.attributes.fuel.cost = sizeData.fuelCost;
            data.attributes.fuel.cap = sizeData.fuelCap;
            data.attributes.equip.size.foodCap = sizeData.foodCap;
        }

        // Determine Starship armor-based properties based on owned Starship item
        const armor = actorData.items.filter((i) => i.type === "equipment" && i.data.data.armor.type === "ssarmor"); // && (i.data.equipped === true)));
        if (armor.length !== 0) {
            const armorData = armor[0].data.data;
            data.attributes.equip.armor.dr = parseInt(armorData.dmgred.value) || 0;
            data.attributes.equip.armor.maxDex = armorData.armor.dex;
            data.attributes.equip.armor.stealthDisadv = armorData.stealth;
        } else {
            // no armor installed
            data.attributes.equip.armor.dr = 0;
            data.attributes.equip.armor.maxDex = 99;
            data.attributes.equip.armor.stealthDisadv = false;
        }

        // Determine Starship hyperdrive-based properties based on owned Starship item
        const hyperdrive = actorData.items.filter((i) => i.type === "equipment" && i.data.data.armor.type === "hyper"); // && (i.data.equipped === true)));
        if (hyperdrive.length !== 0) {
            const hdData = hyperdrive[0].data.data;
            data.attributes.equip.hyperdrive.class = parseFloat(hdData.hdclass.value) || null;
        } else {
            // no hyperdrive installed
            data.attributes.equip.hyperdrive.class = null;
        }

        // Determine Starship power coupling-based properties based on owned Starship item
        const pwrcpl = actorData.items.filter((i) => i.type === "equipment" && i.data.data.armor.type === "powerc"); // && (i.data.equipped === true)));
        if (pwrcpl.length !== 0) {
            const pwrcplData = pwrcpl[0].data.data;
            data.attributes.equip.powerCoupling.centralCap = parseInt(pwrcplData.cscap.value) || 0;
            data.attributes.equip.powerCoupling.systemCap = parseInt(pwrcplData.sscap.value) || 0;
        } else {
            // no power coupling installed
            data.attributes.equip.powerCoupling.centralCap = 0;
            data.attributes.equip.powerCoupling.systemCap = 0;
        }

        data.attributes.power.central.max = 0;
        data.attributes.power.comms.max = 0;
        data.attributes.power.engines.max = 0;
        data.attributes.power.shields.max = 0;
        data.attributes.power.sensors.max = 0;
        data.attributes.power.weapons.max = 0;

        // Determine Starship reactor-based properties based on owned Starship item
        const reactor = actorData.items.filter((i) => i.type === "equipment" && i.data.data.armor.type === "reactor"); // && (i.data.equipped === true)));
        if (reactor.length !== 0) {
            const reactorData = reactor[0].data.data;
            data.attributes.equip.reactor.fuelMult = parseFloat(reactorData.fuelcostsmod.value) || 0;
            data.attributes.equip.reactor.powerRecDie = reactorData.powdicerec.value;
        } else {
            // no reactor installed
            data.attributes.equip.reactor.fuelMult = 1;
            data.attributes.equip.reactor.powerRecDie = "1d1";
        }

        // Determine Starship shield-based properties based on owned Starship item
        const shields = actorData.items.filter((i) => i.type === "equipment" && i.data.data.armor.type === "ssshield"); // && (i.data.equipped === true)));
        if (shields.length !== 0) {
            const shieldsData = shields[0].data.data;
            data.attributes.equip.shields.capMult = parseFloat(shieldsData.capx.value) || 1;
            data.attributes.equip.shields.regenRateMult = parseFloat(shieldsData.regrateco.value) || 1;
        } else {
            // no shields installed
            data.attributes.equip.shields.capMult = 1;
            data.attributes.equip.shields.regenRateMult = 1;
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare skill checks.
     * @param {object} actorData       Copy of the data for the actor being prepared. *Will be mutated.*
     * @param {object} bonusData       Data produced by `getRollData` to be applied to bonus formulas.
     * @param {object} bonuses         Global bonus data.
     * @param {number} checkBonus      Global ability check bonus.
     * @param {object} originalSkills  A transformed actor's original actor's skills.
     * @private
     */
    _prepareSkills(actorData, bonusData, bonuses, checkBonus, originalSkills) {
        if (actorData.type === "vehicle") return;

        const data = actorData.data;
        const flags = actorData.flags.sw5e || {};

        // Skill modifiers
        const feats = SW5E.characterFlags;
        const joat = flags.jackOfAllTrades;
        const observant = flags.observantFeat;
        const skillBonus = this._simplifyBonus(bonuses.skill, bonusData);
        for (let [id, skl] of Object.entries(data.skills)) {
            skl.value = Math.clamped(Number(skl.value).toNearest(0.5), 0, 2) ?? 0;
            const baseBonus = this._simplifyBonus(skl.bonuses?.check, bonusData);
            let roundDown = true;

            // Remarkable Athlete
            if (this._isRemarkableAthlete(skl.ability) && skl.value < 0.5) {
                skl.value = 0.5;
                roundDown = false;
            }

            // Jack of All Trades
            else if (joat && skl.value < 0.5) {
                skl.value = 0.5;
            }

            // Polymorph Skill Proficiencies
            if (originalSkills) {
                skl.value = Math.max(skl.value, originalSkills[id].value);
            }

            // Compute modifier
            const checkBonusAbl = this._simplifyBonus(data.abilities[skl.ability]?.bonuses?.check, bonusData);
            skl.bonus = baseBonus + checkBonus + checkBonusAbl + skillBonus;
            skl.mod = data.abilities[skl.ability].mod;
            skl.prof = new Proficiency(data.attributes.prof, skl.value, roundDown);
            skl.proficient = skl.value;
            skl.total = skl.mod + skl.bonus;
            if (Number.isNumeric(skl.prof.term)) skl.total += skl.prof.flat;

            // Compute passive bonus
            const passive = observant && feats.observantFeat.skills.includes(id) ? 5 : 0;
            const passiveBonus = this._simplifyBonus(skl.bonuses?.passive, bonusData);
            skl.passive = 10 + skl.mod + skl.bonus + skl.prof.flat + passive + passiveBonus;
        }
    }

    /* -------------------------------------------- */

    /**
     * Convert a bonus value to a simple integer for displaying on the sheet.
     * @param {number|string|null} bonus  Actor's bonus value.
     * @param {object} data               Actor data to use for replacing @ strings.
     * @returns {number}                  Simplified bonus as an integer.
     * @protected
     */
    _simplifyBonus(bonus, data) {
        if (!bonus) return 0;
        if (Number.isNumeric(bonus)) return Number(bonus);
        try {
            const roll = new Roll(bonus, data);
            if (!roll.isDeterministic) return 0;
            roll.evaluate({async: false});
            return roll.total;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }

    /* -------------------------------------------- */

    /**
     * Initialize derived AC fields for Active Effects to target.
     * @param {object} actorData  Copy of the data for the actor being prepared. *Will be mutated.*
     * @private
     */
    _prepareBaseArmorClass(actorData) {
        const ac = actorData.data.attributes.ac;
        ac.base = 10;
        ac.shield = ac.bonus = ac.cover = 0;
        this.armor = null;
        this.shield = null;
    }

    /* -------------------------------------------- */

    /**
     * Calculate the initiative bonus to display on a character sheet
     *
     * @param {object} actorData         The actor data being prepared.
     * @param {number} globalCheckBonus  The simplified global ability check bonus for this actor
     * @param {object} bonusData         Actor data to use for replacing formula variables in bonuses
     */
    _computeInitiativeModifier(actorData, globalCheckBonus, bonusData) {
        const data = actorData.data;
        const flags = actorData.flags.sw5e || {};
        const init = data.attributes.init;

        // Initiative modifiers
        const joat = flags.jackOfAllTrades;
        const athlete = flags.remarkableAthlete;
        const dexCheckBonus = this._simplifyBonus(data.abilities.dex.bonuses?.check, bonusData);

        // Compute initiative modifier
        init.mod = data.abilities.dex.mod;
        init.prof = new Proficiency(data.attributes.prof, joat || athlete ? 0.5 : 0, !athlete);
        init.value = init.value ?? 0;
        init.bonus = init.value + (flags.initiativeAlert ? 5 : 0);
        init.total = init.mod + init.bonus + dexCheckBonus + globalCheckBonus;
        if (Number.isNumeric(init.prof.term)) init.total += init.prof.flat;
    }

    /**
     * Prepare data related to the power-casting capabilities of the Actor.
     * @param {object} actorData  Copy of the data for the actor being prepared. *Will be mutated.*
     * @private
     */
    _computeBasePowercasting(actorData) {
        if (actorData.type === "vehicle" || actorData.type === "starship") return;
        const ad = actorData.data;
        const powers = ad.powers;
        const isNPC = actorData.type === "npc";

        // Translate the list of classes into force and tech power-casting progression
        const forceProgression = {
            classes: 0,
            levels: 0,
            multi: 0,
            maxClass: "none",
            maxClassPriority: 0,
            maxClassLevels: 0,
            maxClassPowerLevel: 0,
            powersKnown: 0,
            points: 0
        };
        const techProgression = {
            classes: 0,
            levels: 0,
            multi: 0,
            maxClass: "none",
            maxClassPriority: 0,
            maxClassLevels: 0,
            maxClassPowerLevel: 0,
            powersKnown: 0,
            points: 0
        };

        // Tabulate the total power-casting progression
        const classes = this.data.items.filter((i) => i.type === "class");
        let priority = 0;
        for (let cls of classes) {
            const d = cls.data.data;
            if (d.powercasting.progression === "none") continue;
            const levels = d.levels;
            const prog = d.powercasting.progression;
            // TODO: Consider a more dynamic system
            switch (prog) {
                case "consular":
                    priority = 3;
                    forceProgression.levels += levels;
                    forceProgression.multi += (SW5E.powerMaxLevel["consular"][19] / 9) * levels;
                    forceProgression.classes++;
                    // see if class controls high level forcecasting
                    if (levels >= forceProgression.maxClassLevels && priority > forceProgression.maxClassPriority) {
                        forceProgression.maxClass = "consular";
                        forceProgression.maxClassLevels = levels;
                        forceProgression.maxClassPriority = priority;
                        forceProgression.maxClassPowerLevel =
                            SW5E.powerMaxLevel["consular"][Math.clamped(levels - 1, 0, 20)];
                    }
                    // calculate points and powers known
                    forceProgression.powersKnown += SW5E.powersKnown["consular"][Math.clamped(levels - 1, 0, 20)];
                    forceProgression.points += SW5E.powerPoints["consular"][Math.clamped(levels - 1, 0, 20)];
                    break;
                case "engineer":
                    priority = 2;
                    techProgression.levels += levels;
                    techProgression.multi += (SW5E.powerMaxLevel["engineer"][19] / 9) * levels;
                    techProgression.classes++;
                    // see if class controls high level techcasting
                    if (levels >= techProgression.maxClassLevels && priority > techProgression.maxClassPriority) {
                        techProgression.maxClass = "engineer";
                        techProgression.maxClassLevels = levels;
                        techProgression.maxClassPriority = priority;
                        techProgression.maxClassPowerLevel =
                            SW5E.powerMaxLevel["engineer"][Math.clamped(levels - 1, 0, 20)];
                    }
                    techProgression.powersKnown += SW5E.powersKnown["engineer"][Math.clamped(levels - 1, 0, 20)];
                    techProgression.points += SW5E.powerPoints["engineer"][Math.clamped(levels - 1, 0, 20)];
                    break;
                case "guardian":
                    priority = 1;
                    forceProgression.levels += levels;
                    forceProgression.multi += (SW5E.powerMaxLevel["guardian"][19] / 9) * levels;
                    forceProgression.classes++;
                    // see if class controls high level forcecasting
                    if (levels >= forceProgression.maxClassLevels && priority > forceProgression.maxClassPriority) {
                        forceProgression.maxClass = "guardian";
                        forceProgression.maxClassLevels = levels;
                        forceProgression.maxClassPriority = priority;
                        forceProgression.maxClassPowerLevel =
                            SW5E.powerMaxLevel["guardian"][Math.clamped(levels - 1, 0, 20)];
                    }
                    forceProgression.powersKnown += SW5E.powersKnown["guardian"][Math.clamped(levels - 1, 0, 20)];
                    forceProgression.points += SW5E.powerPoints["guardian"][Math.clamped(levels - 1, 0, 20)];
                    break;
                case "scout":
                    priority = 1;
                    techProgression.levels += levels;
                    techProgression.multi += (SW5E.powerMaxLevel["scout"][19] / 9) * levels;
                    techProgression.classes++;
                    // see if class controls high level techcasting
                    if (levels >= techProgression.maxClassLevels && priority > techProgression.maxClassPriority) {
                        techProgression.maxClass = "scout";
                        techProgression.maxClassLevels = levels;
                        techProgression.maxClassPriority = priority;
                        techProgression.maxClassPowerLevel =
                            SW5E.powerMaxLevel["scout"][Math.clamped(levels - 1, 0, 20)];
                    }
                    techProgression.powersKnown += SW5E.powersKnown["scout"][Math.clamped(levels - 1, 0, 20)];
                    techProgression.points += SW5E.powerPoints["scout"][Math.clamped(levels - 1, 0, 20)];
                    break;
                case "sentinel":
                    priority = 2;
                    forceProgression.levels += levels;
                    forceProgression.multi += (SW5E.powerMaxLevel["sentinel"][19] / 9) * levels;
                    forceProgression.classes++;
                    // see if class controls high level forcecasting
                    if (levels >= forceProgression.maxClassLevels && priority > forceProgression.maxClassPriority) {
                        forceProgression.maxClass = "sentinel";
                        forceProgression.maxClassLevels = levels;
                        forceProgression.maxClassPriority = priority;
                        forceProgression.maxClassPowerLevel =
                            SW5E.powerMaxLevel["sentinel"][Math.clamped(levels - 1, 0, 20)];
                    }
                    forceProgression.powersKnown += SW5E.powersKnown["sentinel"][Math.clamped(levels - 1, 0, 20)];
                    forceProgression.points += SW5E.powerPoints["sentinel"][Math.clamped(levels - 1, 0, 20)];
                    break;
            }
        }

        if (isNPC) {
            // EXCEPTION: NPC with an explicit power-caster level
            if (ad.details.powerForceLevel) {
                forceProgression.levels = ad.details.powerForceLevel;
                ad.attributes.force.level = forceProgression.levels;
                forceProgression.maxClass = ad.attributes.powercasting;
                forceProgression.maxClassPowerLevel =
                    SW5E.powerMaxLevel[forceProgression.maxClass][Math.clamped(forceProgression.levels - 1, 0, 20)];
            }
            if (ad.details.powerTechLevel) {
                techProgression.levels = ad.details.powerTechLevel;
                ad.attributes.tech.level = techProgression.levels;
                techProgression.maxClass = ad.attributes.powercasting;
                techProgression.maxClassPowerLevel =
                    SW5E.powerMaxLevel[techProgression.maxClass][Math.clamped(techProgression.levels - 1, 0, 20)];
            }
        } else {
            // EXCEPTION: multi-classed progression uses multi rounded down rather than levels
            if (forceProgression.classes > 1) {
                forceProgression.levels = Math.floor(forceProgression.multi);
                forceProgression.maxClassPowerLevel = SW5E.powerMaxLevel["multi"][forceProgression.levels - 1];
            }
            if (techProgression.classes > 1) {
                techProgression.levels = Math.floor(techProgression.multi);
                techProgression.maxClassPowerLevel = SW5E.powerMaxLevel["multi"][techProgression.levels - 1];
            }
        }

        // Look up the number of slots per level from the powerLimit table
        let forcePowerLimit = Array.from(SW5E.powerLimit["none"]);
        for (let i = 0; i < forceProgression.maxClassPowerLevel; i++) {
            forcePowerLimit[i] = SW5E.powerLimit[forceProgression.maxClass][i];
        }

        for (let [n, lvl] of Object.entries(powers)) {
            let i = parseInt(n.slice(-1));
            if (Number.isNaN(i)) continue;
            if (Number.isNumeric(lvl.foverride)) lvl.fmax = Math.max(parseInt(lvl.foverride), 0);
            else lvl.fmax = forcePowerLimit[i - 1] || 0;
            if (isNPC) {
                lvl.fvalue = lvl.fmax;
            } else {
                lvl.fvalue = Math.min(parseInt(lvl.fvalue || lvl.value || lvl.fmax), lvl.fmax);
            }
        }

        let techPowerLimit = Array.from(SW5E.powerLimit["none"]);
        for (let i = 0; i < techProgression.maxClassPowerLevel; i++) {
            techPowerLimit[i] = SW5E.powerLimit[techProgression.maxClass][i];
        }

        for (let [n, lvl] of Object.entries(powers)) {
            let i = parseInt(n.slice(-1));
            if (Number.isNaN(i)) continue;
            if (Number.isNumeric(lvl.toverride)) lvl.tmax = Math.max(parseInt(lvl.toverride), 0);
            else lvl.tmax = techPowerLimit[i - 1] || 0;
            if (isNPC) {
                lvl.tvalue = lvl.tmax;
            } else {
                lvl.tvalue = Math.min(parseInt(lvl.tvalue || lvl.value || lvl.tmax), lvl.tmax);
            }
        }

        // Set Force and tech power for PC Actors
        if (!isNPC) {
            if (forceProgression.levels) {
                ad.attributes.force.known.max = forceProgression.powersKnown;
                ad.attributes.force.points.max = forceProgression.points;
                ad.attributes.force.level = forceProgression.levels;
            }
            if (techProgression.levels) {
                ad.attributes.tech.known.max = techProgression.powersKnown;
                ad.attributes.tech.points.max = techProgression.points;
                ad.attributes.tech.level = techProgression.levels;
            }
        }

        // Tally Powers Known and check for migration first to avoid errors
        let hasKnownPowers = actorData?.data?.attributes?.force?.known?.value !== undefined;
        if (hasKnownPowers) {
            const knownPowers = this.data.items.filter((i) => i.type === "power");
            let knownForcePowers = 0;
            let knownTechPowers = 0;
            for (let knownPower of knownPowers) {
                const d = knownPower.data;
                switch (d.data.school) {
                    case "lgt":
                    case "uni":
                    case "drk": {
                        knownForcePowers++;
                        break;
                    }
                    case "tec": {
                        knownTechPowers++;
                        break;
                    }
                }
            }
            ad.attributes.force.known.value = knownForcePowers;
            ad.attributes.tech.known.value = knownTechPowers;
        }
    }

    /* -------------------------------------------- */

    /**
     * Determine a character's AC value from their equipped armor and shield.
     * @param {object} data  Copy of the data for the actor being prepared. *Will be mutated.*
     * @returns {{
     *   calc: string,
     *   value: number,
     *   base: number,
     *   shield: number,
     *   bonus: number,
     *   cover: number,
     *   flat: number,
     *   equippedArmor: Item5e,
     *   equippedShield: Item5e,
     *   warnings: string[]
     * }}
     * @private
     */
    _computeArmorClass(data) {
        // Get AC configuration and apply automatic migrations for older data structures
        const ac = data.attributes.ac;
        ac.warnings = [];
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
                const armor = equip.data.data.armor;
                if (!equip.data.data.equipped || !armorTypes.has(armor?.type)) return obj;
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
                return ac;

            // Natural AC (includes bonuses)
            case "natural":
                ac.base = Number(ac.flat);
                break;

            // Equipment-based AC
            case "default":
                if (armors.length) {
                    if (armors.length > 1) ac.warnings.push("SW5E.WarnMultipleArmor");
                    const armorData = armors[0].data.data.armor;
                    const isHeavy = armorData.type === "heavy";
                    ac.dex = isHeavy ? 0 : Math.min(armorData.dex ?? Infinity, data.abilities.dex.mod);
                    ac.base = (armorData.value ?? 0) + ac.dex;
                    ac.equippedArmor = armors[0];
                } else {
                    ac.dex = data.abilities.dex.mod;
                    ac.base = 10 + ac.dex;
                }
                break;

            // Formula-based AC
            default:
                let formula = ac.calc === "custom" ? ac.formula : cfg.formula;
                const rollData = this.getRollData();
                try {
                    const replaced = Roll.replaceFormulaData(formula, rollData);
                    ac.base = Roll.safeEval(replaced);
                } catch (err) {
                    ac.warnings.push("SW5E.WarnBadACFormula");
                    const replaced = Roll.replaceFormulaData(CONFIG.SW5E.armorClasses.default.formula, rollData);
                    ac.base = Roll.safeEval(replaced);
                }
                break;
        }

        // Equipped Shield
        if (shields.length) {
            if (shields.length > 1) ac.warnings.push("SW5E.WarnMultipleShields");
            ac.shield = shields[0].data.data.armor.value ?? 0;
            ac.equippedShield = shields[0];
        }

        // Compute total AC and return
        ac.value = ac.base + ac.shield + ac.bonus + ac.cover;
        return ac;
    }

    /* -------------------------------------------- */

    /**
     * Prepare data related to the power-casting capabilities of the Actor
     * @private
     */
    _computeDerivedPowercasting(actorData) {
        if (!(actorData.type === "character" || actorData.type === "npc")) return;

        const ad = actorData.data;

        // Powercasting DC for Actors and NPCs
        // TODO: Consider an option for using the variant rule of all powers use the same value
        ad.attributes.powerForceLightDC = 8 + ad.abilities.wis.mod + ad.attributes.prof ?? 10;
        ad.attributes.powerForceDarkDC = 8 + ad.abilities.cha.mod + ad.attributes.prof ?? 10;
        ad.attributes.powerForceUnivDC =
            Math.max(ad.attributes.powerForceLightDC, ad.attributes.powerForceDarkDC) ?? 10;
        ad.attributes.powerTechDC = 8 + ad.abilities.int.mod + ad.attributes.prof ?? 10;

        if (game.settings.get("sw5e", "simplifiedForcecasting")) {
            ad.attributes.powerForceLightDC = ad.attributes.powerForceUnivDC;
            ad.attributes.powerForceDarkDC = ad.attributes.powerForceUnivDC;
        }

        if (actorData.type !== "character") return;

        // Set Force and tech bonus points for PC Actors
        if (!!ad.attributes.force.level) {
            ad.attributes.force.points.max += Math.max(ad.abilities.wis.mod, ad.abilities.cha.mod);
        }
        if (!!ad.attributes.tech.level) {
            ad.attributes.tech.points.max += ad.abilities.int.mod;
        }
    }

    /* -------------------------------------------- */

    /**
     * Compute the level and percentage of encumbrance for an Actor.
     *
     * Optionally include the weight of carried currency across all denominations by applying the standard rule
     * from the PHB pg. 143
     * @param {object} actorData      The data object for the Actor being rendered
     * @returns {{max: number, value: number, pct: number}}  An object describing the character's encumbrance level
     * @private
     */
    _computeEncumbrance(actorData) {
        // TODO: Maybe add an option for variant encumbrance
        // Get the total weight from items
        const physicalItems = ["weapon", "equipment", "consumable", "tool", "backpack", "loot"];
        let weight = actorData.items.reduce((weight, i) => {
            if (!physicalItems.includes(i.type)) return weight;
            const q = i.data.data.quantity || 0;
            const w = i.data.data.weight || 0;
            return weight + q * w;
        }, 0);

        // [Optional] add Currency Weight (for non-transformed actors)
        if (game.settings.get("sw5e", "currencyWeight") && actorData.data.currency) {
            const currency = actorData.data.currency;
            const numCoins = Object.values(currency).reduce((val, denom) => (val += Math.max(denom, 0)), 0);

            const currencyPerWeight = game.settings.get("sw5e", "metricWeightUnits")
                ? CONFIG.SW5E.encumbrance.currencyPerWeight.metric
                : CONFIG.SW5E.encumbrance.currencyPerWeight.imperial;

            weight += numCoins / currencyPerWeight;
        }

        // Determine the encumbrance size class
        let mod =
            {
                tiny: 0.5,
                sm: 1,
                med: 1,
                lg: 2,
                huge: 4,
                grg: 8
            }[actorData.data.traits.size] || 1;
        if (this.getFlag("sw5e", "powerfulBuild")) mod = Math.min(mod * 2, 8);

        // Compute Encumbrance percentage
        weight = weight.toNearest(0.1);

        const strengthMultiplier = game.settings.get("sw5e", "metricWeightUnits")
            ? CONFIG.SW5E.encumbrance.strMultiplier.metric
            : CONFIG.SW5E.encumbrance.strMultiplier.imperial;

        const max = (actorData.data.abilities.str.value * strengthMultiplier * mod).toNearest(0.1);
        const pct = Math.clamped((weight * 100) / max, 0, 100);
        return {value: weight.toNearest(0.1), max, pct, encumbered: pct > 200 / 3};
    }

    _computeStarshipData(actorData, data) {
        // Calculate AC
        data.attributes.ac.value += Math.min(data.abilities.dex.mod, data.attributes.equip.armor.maxDex);

        // Set Power Die Storage
        data.attributes.power.central.max += data.attributes.equip.powerCoupling.centralCap;
        data.attributes.power.comms.max += data.attributes.equip.powerCoupling.systemCap;
        data.attributes.power.engines.max += data.attributes.equip.powerCoupling.systemCap;
        data.attributes.power.shields.max += data.attributes.equip.powerCoupling.systemCap;
        data.attributes.power.sensors.max += data.attributes.equip.powerCoupling.systemCap;
        data.attributes.power.weapons.max += data.attributes.equip.powerCoupling.systemCap;

        // Find Size info of Starship
        const size = actorData.items.filter((i) => i.type === "starship");
        if (size.length === 0) return;
        const sizeData = size[0].data.data;

        // Prepare Hull Points
        data.attributes.hp.max =
            sizeData.hullDiceRolled.reduce((a, b) => a + b, 0) + data.abilities.con.mod * data.attributes.hull.dicemax;
        if (data.attributes.hp.value === null) data.attributes.hp.value = data.attributes.hp.max;

        // Prepare Shield Points
        data.attributes.hp.tempmax =
            (sizeData.shldDiceRolled.reduce((a, b) => a + b, 0) +
                data.abilities.str.mod * data.attributes.shld.dicemax) *
            data.attributes.equip.shields.capMult;
        if (data.attributes.hp.temp === null) data.attributes.hp.temp = data.attributes.hp.tempmax;

        // Prepare Speeds
        data.attributes.movement.space =
            sizeData.baseSpaceSpeed + 50 * (data.abilities.str.mod - data.abilities.con.mod);
        data.attributes.movement.turn = Math.min(
            data.attributes.movement.space,
            Math.max(50, sizeData.baseTurnSpeed - 50 * (data.abilities.dex.mod - data.abilities.con.mod))
        );

        // Prepare Max Suites
        data.attributes.mods.suites.max =
            sizeData.modMaxSuitesBase + sizeData.modMaxSuitesMult * data.abilities.con.mod;

        // Prepare Hardpoints
        data.attributes.mods.hardpoints.max = sizeData.hardpointMult * Math.max(1, data.abilities.str.mod);

        //Prepare Fuel
        data.attributes.fuel = this._computeFuel(actorData);
    }

    /* -------------------------------------------- */
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    _computeFuel(actorData) {
        const fuel = actorData.data.attributes.fuel;
        // Compute Fuel percentage
        const pct = Math.clamped((fuel.value.toNearest(0.1) * 100) / fuel.cap, 0, 100);
        return {...fuel, pct, fueled: pct > 0};
    }

    /** @inheritdoc */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        const sourceId = this.getFlag("core", "sourceId");
        if (sourceId?.startsWith("Compendium.")) return;

        // Some sensible defaults for convenience
        // Token size category
        const s = CONFIG.SW5E.tokenSizes[this.data.data.traits.size || "med"];
        this.data.token.update({width: s, height: s});

        // Player character configuration
        if (this.type === "character") {
            this.data.token.update({vision: true, actorLink: true, disposition: 1});
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);

        // Apply changes in Actor size to Token width/height
        const newSize = foundry.utils.getProperty(changed, "data.traits.size");
        if (newSize && newSize !== foundry.utils.getProperty(this.data, "data.traits.size")) {
            let size = CONFIG.SW5E.tokenSizes[newSize];
            if (!foundry.utils.hasProperty(changed, "token.width")) {
                changed.token = changed.token || {};
                changed.token.height = size;
                changed.token.width = size;
            }
        }

        // Reset death save counters
        const isDead = this.data.data.attributes.hp.value <= 0;
        if (isDead && foundry.utils.getProperty(changed, "data.attributes.hp.value") > 0) {
            foundry.utils.setProperty(changed, "data.attributes.death.success", 0);
            foundry.utils.setProperty(changed, "data.attributes.death.failure", 0);
        }
    }

    /* -------------------------------------------- */

    /**
     * Assign a class item as the original class for the Actor based on which class has the most levels.
     * @returns {Promise<Actor5e>}  Instance of the updated actor.
     * @protected
     */
    _assignPrimaryClass() {
        const classes = this.itemTypes.class.sort((a, b) => b.data.data.levels - a.data.data.levels);
        const newPC = classes[0]?.id || "";
        return this.update({"data.details.originalClass": newPC});
    }

    /* -------------------------------------------- */
    /*  Gameplay Mechanics                          */
    /* -------------------------------------------- */

    /** @override */
    async modifyTokenAttribute(attribute, value, isDelta, isBar) {
        if (attribute === "attributes.hp") {
            const hp = getProperty(this.data.data, attribute);
            const delta = isDelta ? -1 * value : hp.value + hp.temp - value;
            return this.applyDamage(delta);
        }
        return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }

    /* -------------------------------------------- */

    /**
     * Apply a certain amount of damage or healing to the health pool for Actor
     * @param {number} amount       An amount of damage (positive) or healing (negative) to sustain
     * @param {number} multiplier   A multiplier which allows for resistance, vulnerability, or healing
     * @returns {Promise<Actor5e>}  A Promise which resolves once the damage has been applied
     */
    async applyDamage(amount = 0, multiplier = 1) {
        amount = Math.floor(parseInt(amount) * multiplier);
        const hp = this.data.data.attributes.hp;

        // Deduct damage from temp HP first
        const tmp = parseInt(hp.temp) || 0;
        const dt = amount > 0 ? Math.min(tmp, amount) : 0;

        // Remaining goes to health
        const tmpMax = parseInt(hp.tempmax) || 0;
        const dh = Math.clamped(hp.value - (amount - dt), 0, hp.max + tmpMax);

        // Update the Actor
        const updates = {
            "data.attributes.hp.temp": tmp - dt,
            "data.attributes.hp.value": dh
        };

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
        return allowed !== false ? this.update(updates, {dhp: -amount}) : this;
    }

    /* -------------------------------------------- */

    /**
     * Determine whether the provided ability is usable for remarkable athlete.
     *
     * @param {string} ability  Ability type to check.
     * @returns {boolean}       Whether the actor has the remarkable athlete flag and the ability is physical.
     * @private
     */
    _isRemarkableAthlete(ability) {
        return (
            this.getFlag("sw5e", "remarkableAthlete") &&
            SW5E.characterFlags.remarkableAthlete.abilities.includes(ability)
        );
    }

    /* -------------------------------------------- */

    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {object} options      Options which configure how the skill check is rolled
     * @returns {Promise<Roll>}     A Promise which resolves to the created Roll instance
     */
    rollSkill(skillId, options = {}) {
        const skl = this.data.data.skills[skillId];
        const abl = this.data.data.abilities[skl.ability];
        const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};

        const parts = [];
        const data = this.getRollData();

        // Add ability modifier
        parts.push("@mod");
        data.mod = skl.mod;

        // Include proficiency bonus
        if (skl.prof.hasProficiency) {
            parts.push("@prof");
            data.prof = skl.prof.term;
        }

        // Global ability check bonus
        if (bonuses.check) {
            parts.push("@checkBonus");
            data.checkBonus = Roll.replaceFormulaData(bonuses.check, data);
        }

        // Ability-specific check bonus
        if (abl?.bonuses?.check) {
            const checkBonusKey = `${skl.ability}CheckBonus`;
            parts.push(`@${checkBonusKey}`);
            data[checkBonusKey] = Roll.replaceFormulaData(abl.bonuses.check, data);
        }

        // Skill-specific skill bonus
        if (skl.bonuses?.check) {
            const checkBonusKey = `${skillId}CheckBonus`;
            parts.push(`@${checkBonusKey}`);
            data[checkBonusKey] = Roll.replaceFormulaData(skl.bonuses.check, data);
        }

        // Global skill check bonus
        if (bonuses.skill) {
            parts.push("@skillBonus");
            data.skillBonus = Roll.replaceFormulaData(bonuses.skill, data);
        }

        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts?.length > 0) {
            parts.push(...options.parts);
        }

        // Reliable Talent applies to any skill check we have full or better proficiency in
        const reliableTalent = skl.value >= 1 && this.getFlag("sw5e", "reliableTalent");

        // Roll and return
        const rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: `${game.i18n.format("SW5E.SkillPromptTitle", {
                skill: CONFIG.SW5E.skills[skillId] || CONFIG.SW5E.starshipSkills[skillId]
            })}: ${this.name}`,
            halflingLucky: this.getFlag("sw5e", "halflingLucky"),
            reliableTalent: reliableTalent,
            messageData: {
                "speaker": options.speaker || ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "skill", skillId}
            }
        });
        return d20Roll(rollData);
    }

    /* -------------------------------------------- */

    /**
     * Roll a generic ability test or saving throw.
     * Prompt the user for input on which variety of roll they want to do.
     * @param {string} abilityId    The ability id (e.g. "str")
     * @param {object} options      Options which configure how ability tests or saving throws are rolled
     */
    rollAbility(abilityId, options = {}) {
        const label = CONFIG.SW5E.abilities[abilityId];
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
     * @returns {Promise<Roll>}     A Promise which resolves to the created Roll instance
     */
    rollAbilityTest(abilityId, options = {}) {
        const label = CONFIG.SW5E.abilities[abilityId];
        const abl = this.data.data.abilities[abilityId];

        const parts = [];
        const data = this.getRollData();

        // Add ability modifier
        parts.push("@mod");
        data.mod = abl.mod;

        // Include proficiency bonus
        if (abl.checkProf.hasProficiency) {
            parts.push("@prof");
            data.prof = abl.checkProf.term;
        }

        // Add ability-specific check bonus
        if (abl.bonuses?.check) {
            const checkBonusKey = `${abilityId}CheckBonus`;
            parts.push(`@${checkBonusKey}`);
            data[checkBonusKey] = Roll.replaceFormulaData(abl.bonuses.check, data);
        }

        // Add global actor bonus
        const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};
        if (bonuses.check) {
            parts.push("@checkBonus");
            data.checkBonus = Roll.replaceFormulaData(bonuses.check, data);
        }

        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts?.length > 0) {
            parts.push(...options.parts);
        }

        // Roll and return
        const rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: `${game.i18n.format("SW5E.AbilityPromptTitle", {ability: label})}: ${this.name}`,
            halflingLucky: this.getFlag("sw5e", "halflingLucky"),
            messageData: {
                "speaker": options.speaker || ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "ability", abilityId}
            }
        });
        return d20Roll(rollData);
    }

    /* -------------------------------------------- */

    /**
     * Roll an Ability Saving Throw
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} abilityId    The ability ID (e.g. "str")
     * @param {object} options      Options which configure how ability tests are rolled
     * @returns {Promise<Roll>}     A Promise which resolves to the created Roll instance
     */
    rollAbilitySave(abilityId, options = {}) {
        const label = CONFIG.SW5E.abilities[abilityId];
        const abl = this.data.data.abilities[abilityId];

        const parts = [];
        const data = this.getRollData();

        // Add ability modifier
        parts.push("@mod");
        data.mod = abl.mod;

        // Include proficiency bonus
        if (abl.saveProf.hasProficiency) {
            parts.push("@prof");
            data.prof = abl.saveProf.term;
        }

        // Include ability-specific saving throw bonus
        if (abl.bonuses?.save) {
            const saveBonusKey = `${abilityId}SaveBonus`;
            parts.push(`@${saveBonusKey}`);
            data[saveBonusKey] = Roll.replaceFormulaData(abl.bonuses.save, data);
        }

        // Include a global actor ability save bonus
        const bonuses = getProperty(this.data.data, "bonuses.abilities") || {};
        if (bonuses.save) {
            parts.push("@saveBonus");
            data.saveBonus = Roll.replaceFormulaData(bonuses.save, data);
        }

        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts?.length > 0) {
            parts.push(...options.parts);
        }

        // Roll and return
        const rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: `${game.i18n.format("SW5E.SavePromptTitle", {ability: label})}: ${this.name}`,
            halflingLucky: this.getFlag("sw5e", "halflingLucky"),
            messageData: {
                "speaker": options.speaker || ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "save", abilityId}
            }
        });
        return d20Roll(rollData);
    }

    /* -------------------------------------------- */

    /**
     * Perform a death saving throw, rolling a d20 plus any global save bonuses
     * @param {object} options        Additional options which modify the roll
     * @returns {Promise<Roll|null>}  A Promise which resolves to the Roll instance
     */
    async rollDeathSave(options = {}) {
        // Display a warning if we are not at zero HP or if we already have reached 3
        const death = this.data.data.attributes.death;
        if (this.data.data.attributes.hp.value > 0 || death.failure >= 3 || death.success >= 3) {
            ui.notifications.warn(game.i18n.localize("SW5E.DeathSaveUnnecessary"));
            return null;
        }

        // Evaluate a global saving throw bonus
        const parts = [];
        const data = this.getRollData();
        const speaker = options.speaker || ChatMessage.getSpeaker({actor: this});

        // Include a global actor ability save bonus
        const bonuses = foundry.utils.getProperty(this.data.data, "bonuses.abilities") || {};
        if (bonuses.save) {
            parts.push("@saveBonus");
            data.saveBonus = Roll.replaceFormulaData(bonuses.save, data);
        }

        // Evaluate the roll
        const rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: `${game.i18n.localize("SW5E.DeathSavingThrow")}: ${this.name}`,
            halflingLucky: this.getFlag("sw5e", "halflingLucky"),
            targetValue: 10,
            messageData: {
                "speaker": speaker,
                "flags.sw5e.roll": {type: "death"}
            }
        });
        const roll = await d20Roll(rollData);
        if (!roll) return null;

        // Take action depending on the result
        const success = roll.total >= 10;
        const d20 = roll.dice[0].total;

        let chatString;

        // Save success
        if (success) {
            let successes = (death.success || 0) + 1;

            // Critical Success = revive with 1hp
            if (d20 === 20) {
                await this.update({
                    "data.attributes.death.success": 0,
                    "data.attributes.death.failure": 0,
                    "data.attributes.hp.value": 1
                });
                chatString = "SW5E.DeathSaveCriticalSuccess";
            }

            // 3 Successes = survive and reset checks
            else if (successes === 3) {
                await this.update({
                    "data.attributes.death.success": 0,
                    "data.attributes.death.failure": 0
                });
                chatString = "SW5E.DeathSaveSuccess";
            }

            // Increment successes
            else await this.update({"data.attributes.death.success": Math.clamped(successes, 0, 3)});
        }

        // Save failure
        else {
            let failures = (death.failure || 0) + (d20 === 1 ? 2 : 1);
            await this.update({"data.attributes.death.failure": Math.clamped(failures, 0, 3)});
            if (failures >= 3) {
                // 3 Failures = death
                chatString = "SW5E.DeathSaveFailure";
            }
        }

        // Display success/failure chat message
        if (chatString) {
            let chatData = {content: game.i18n.format(chatString, {name: this.name}), speaker};
            ChatMessage.applyRollMode(chatData, roll.options.rollMode);
            await ChatMessage.create(chatData);
        }

        // Return the rolled result
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a hit die of the appropriate type, gaining hit points equal to the die roll plus your CON modifier
     * @param {string} [denomination]   The hit denomination of hit die to roll. Example "d8".
     *                                  If no denomination is provided, the first available HD will be used
     * @param {boolean} [dialog]        Show a dialog prompt for configuring the hit die roll?
     * @returns {Promise<Roll|null>}    The created Roll instance, or null if no hit die was rolled
     */
    async rollHitDie(denomination, {dialog = true} = {}) {
        // If no denomination was provided, choose the first available
        let cls = null;
        if (!denomination) {
            cls = this.itemTypes.class.find((c) => c.data.data.hitDiceUsed < c.data.data.levels);
            if (!cls) return null;
            denomination = cls.data.data.hitDice;
        }

        // Otherwise locate a class (if any) which has an available hit die of the requested denomination
        else {
            cls = this.items.find((i) => {
                const d = i.data.data;
                return d.hitDice === denomination && (d.hitDiceUsed || 0) < (d.levels || 1);
            });
        }

        // If no class is available, display an error notification
        if (!cls) {
            ui.notifications.error(game.i18n.format("SW5E.HitDiceWarn", {name: this.name, formula: denomination}));
            return null;
        }

        // Prepare roll data
        const parts = [`1${denomination}`, "@abilities.con.mod"];
        const title = `${game.i18n.localize("SW5E.HitDiceRoll")}: ${this.name}`;
        const rollData = foundry.utils.deepClone(this.data.data);

        // Call the roll helper utility
        const roll = await damageRoll({
            event: new Event("hitDie"),
            parts: parts,
            data: rollData,
            title: title,
            allowCritical: false,
            fastForward: !dialog,
            dialogOptions: {width: 350},
            messageData: {
                "speaker": ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "hitDie"}
            }
        });
        if (!roll) return null;

        // Adjust actor data
        await cls.update({"data.hitDiceUsed": cls.data.data.hitDiceUsed + 1});
        const hp = this.data.data.attributes.hp;
        const dhp = Math.min(hp.max + (hp.tempmax ?? 0) - hp.value, roll.total);
        await this.update({"data.attributes.hp.value": hp.value + dhp});
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a hull die of the appropriate type, gaining hull points equal to the die roll plus your CON modifier
     * @param {string} [denomination]   The hit denomination of hull die to roll. Example "d8".
     *                                  If no denomination is provided, the first available HD will be used
     * @param {string} [numDice]        How many dice to roll?
     * @param {string} [keep]           Which dice to keep? Example "kh1".
     * @param {boolean} [dialog]        Show a dialog prompt for configuring the hull die roll?
     * @return {Promise<Roll|null>}     The created Roll instance, or null if no hull die was rolled
     */
    async rollHullDie(denomination, numDice = "1", keep = "", {dialog = true} = {}) {
        // If no denomination was provided, choose the first available
        let sship = null;
        const hullMult = ["huge", "grg"].includes(this.data.data.traits.size) ? 2 : 1;
        if (!denomination) {
            sship = this.itemTypes.starship.find(
                (s) => s.data.data.hullDiceUsed < s.data.data.tier * hullMult + s.data.data.hullDiceStart
            );
            if (!sship) return null;
            denomination = sship.data.data.hullDice;
        }

        // Otherwise locate a starship (if any) which has an available hit die of the requested denomination
        else {
            sship = this.items.find((i) => {
                const d = i.data.data;
                return (
                    d.hullDice === denomination && (d.hullDiceUsed || 0) < (d.tier * hullMult || 0) + d.hullDiceStart
                );
            });
        }

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
        const parts = [`${numDice}${denomination}${keep}`, "@abilities.con.mod"];
        const title = game.i18n.localize("SW5E.HullDiceRoll");
        const rollData = foundry.utils.deepClone(this.data.data);

        // Call the roll helper utility
        const roll = await attribDieRoll({
            event: new Event("hullDie"),
            parts: parts,
            data: rollData,
            title: title,
            fastForward: !dialog,
            dialogOptions: {width: 350},
            messageData: {
                "speaker": ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "hullDie"}
            }
        });

        if (!roll) return null;

        // Adjust actor data
        await sship.update({
            "data.hullDiceUsed": sship.data.data.hullDiceUsed + 1
        });
        const hp = this.data.data.attributes.hp;
        const dhp = Math.min(hp.max - hp.value, roll.total);
        await this.update({"data.attributes.hp.value": hp.value + dhp});
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a shield die of the appropriate type, gaining shield points equal to the die roll
     * multiplied by the shield regeneration coefficient
     * @param {string} [denomination]   The denomination of shield die to roll. Example "d8".
     *                                  If no denomination is provided, the first available SD will be used
     * @param {boolean} [natural]       Natural ship shield regeneration (true) or user action (false)?
     * @param {string} [numDice]        How many dice to roll?
     * @param {string} [keep]           Which dice to keep? Example "kh1".
     * @param {boolean} [dialog]        Show a dialog prompt for configuring the shield die roll?
     * @return {Promise<Roll|null>}     The created Roll instance, or null if no shield die was rolled
     */
    async rollShieldDie(denomination, natural = false, numDice = "1", keep = "", {dialog = true} = {}) {
        // If no denomination was provided, choose the first available
        let sship = null;
        const shldMult = ["huge", "grg"].includes(this.data.data.traits.size) ? 2 : 1;
        if (!denomination) {
            sship = this.itemTypes.starship.find(
                (s) => s.data.data.shldDiceUsed < s.data.data.tier * shldMult + s.data.data.shldDiceStart
            );
            if (!sship) return null;
            denomination = sship.data.data.shldDice;
        }

        // Otherwise locate a starship (if any) which has an available shield die of the requested denomination
        else {
            sship = this.items.find((i) => {
                const d = i.data.data;
                return (
                    d.shldDice === denomination && (d.shldDiceUsed || 0) < (d.tier * shldMult || 0) + d.shldDiceStart
                );
            });
        }

        // If no starship is available, display an error notification
        if (!sship) {
            ui.notifications.error(
                game.i18n.format("SW5E.ShldDiceWarn", {
                    name: this.name,
                    formula: denomination
                })
            );
            return null;
        }

        // if natural regeneration roll max
        if (natural) {
            numdice = denomination.substring(1);
            denomination = "";
            keep = "";
        }

        // Prepare roll data
        const parts = [`${numDice}${denomination}${keep} * @attributes.regenRate`];
        const title = game.i18n.localize("SW5E.ShieldDiceRoll");
        const rollData = foundry.utils.deepClone(this.data.data);

        // Call the roll helper utility
        const roll = await attribDieRoll({
            event: new Event("shldDie"),
            parts: parts,
            data: rollData,
            title: title,
            fastForward: !dialog,
            dialogOptions: {width: 350},
            messageData: {
                "speaker": ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "shldDie"}
            }
        });

        if (!roll) return null;

        // Adjust actor data
        await sship.update({
            "data.shldDiceUsed": sship.data.data.shldDiceUsed + 1
        });
        const hp = this.data.data.attributes.hp;
        const dhp = Math.min(hp.tempmax - hp.temp, roll.total);
        await this.update({"data.attributes.hp.temp": hp.temp + dhp});
        return roll;
    }

    /* -------------------------------------------- */

    /**
     * Roll a power die recovery of the appropriate type, gaining power dice equal to the roll
     *
     * @param {string} [formula]        Formula from reactor to use for power die recovery
     * @param {boolean} [dialog]        Show a dialog prompt for configuring the power die roll?
     * @return {Promise<Roll|null>}     The created Roll instance, or null if no power die was rolled
     */
    async rollPowerDieRecovery(formula, {dialog = true} = {}) {
        // if no formula check starship for equipped reactor
        if (!formula) {
            formula = this.data.data.attributes.equip.reactor.powerRecDie;
        }

        // Prepare roll data
        const parts = [formula];
        const title = game.i18n.localize("SW5E.PowerDiceRecovery");
        const rollData = foundry.utils.deepClone(this.data.data);

        // Call the roll helper utility
        const roll = await attribDieRoll({
            event: new Event("pwrDieRec"),
            parts: parts,
            data: rollData,
            title: title,
            fastForward: !dialog,
            dialogOptions: {width: 350},
            messageData: {
                "speaker": ChatMessage.getSpeaker({actor: this}),
                "flags.sw5e.roll": {type: "pwrDieRec"}
            }
        });

        if (!roll) return null;

        // Adjust actor data
        //TODO: Make a new dialog box to allocate power dice
        return roll;
    }

    /* -------------------------------------------- */

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
     */

    /* -------------------------------------------- */

    /**
     * Take a short rest, possibly spending hit dice and recovering resources, item uses, and tech slots & points.
     *
     * @param {object} [options]
     * @param {boolean} [options.dialog=true]         Present a dialog window which allows for rolling hit dice as part
     *                                                of the Short Rest and selecting whether a new day has occurred.
     * @param {boolean} [options.chat=true]           Summarize the results of the rest workflow as a chat message.
     * @param {boolean} [options.autoHD=false]        Automatically spend Hit Dice if you are missing 3 or more hit points.
     * @param {boolean} [options.autoHDThreshold=3]   A number of missing hit points which would trigger an automatic HD roll.
     * @returns {Promise<RestResult>}                 A Promise which resolves once the short rest workflow has completed.
     */
    async shortRest({dialog = true, chat = true, autoHD = false, autoHDThreshold = 3} = {}) {
        // Take note of the initial hit points and number of hit dice the Actor has
        const hd0 = this.data.data.attributes.hd;
        const hp0 = this.data.data.attributes.hp.value;
        let newDay = false;

        // Display a Dialog for rolling hit dice
        if (dialog) {
            try {
                newDay = await ShortRestDialog.shortRestDialog({actor: this, canRoll: hd0 > 0});
            } catch (err) {
                return;
            }
        }

        // Automatically spend hit dice
        else if (autoHD) {
            await this.autoSpendHitDice({threshold: autoHDThreshold});
        }

        return this._rest(
            chat,
            newDay,
            false,
            this.data.data.attributes.hd - hd0,
            this.data.data.attributes.hp.value - hp0,
            this.data.data.attributes.tech.points.max - this.data.data.attributes.tech.points.value
        );
    }

    /* -------------------------------------------- */

    /**
     * Take a long rest, recovering hit points, hit dice, resources, item uses, and tech & force power points & slots.
     *
     * @param {object} [options]
     * @param {boolean} [options.dialog=true]  Present a confirmation dialog window whether or not to take a long rest.
     * @param {boolean} [options.chat=true]    Summarize the results of the rest workflow as a chat message.
     * @param {boolean} [options.newDay=true]  Whether the long rest carries over to a new day.
     * @returns {Promise<RestResult>}          A Promise which resolves once the long rest workflow has completed.
     */
    async longRest({dialog = true, chat = true, newDay = true} = {}) {
        // Maybe present a confirmation dialog
        if (dialog) {
            try {
                newDay = await LongRestDialog.longRestDialog({actor: this});
            } catch (err) {
                return;
            }
        }

        return this._rest(
            chat,
            newDay,
            true,
            0,
            0,
            this.data.data.attributes.tech.points.max - this.data.data.attributes.tech.points.value,
            this.data.data.attributes.force.points.max - this.data.data.attributes.force.points.value
        );
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
                ...this._getRestPowerRecovery({recoverForcePowers: longRest})
            },
            updateItems: [
                ...hitDiceUpdates,
                ...this._getRestItemUsesRecovery({recoverLongRestUses: longRest, recoverDailyUses: newDay})
            ],
            longRest,
            newDay
        };

        // Perform updates
        await this.update(result.updateData);
        await this.updateEmbeddedDocuments("Item", result.updateItems);

        // Display a Chat Message summarizing the rest effects
        if (chat) await this._displayRestResultMessage(result, longRest);

        // Call restCompleted hook so that modules can easily perform actions when actors finish a rest
        Hooks.callAll("restCompleted", this, result);

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

        let restFlavor;
        let message;

        // Summarize the rest duration
        switch (game.settings.get("sw5e", "restVariant")) {
            case "normal":
                restFlavor = longRest && newDay ? "SW5E.LongRestOvernight" : `SW5E.${length}RestNormal`;
                break;
            case "gritty":
                restFlavor = !longRest && newDay ? "SW5E.ShortRestOvernight" : `SW5E.${length}RestGritty`;
                break;
            case "epic":
                restFlavor = `SW5E.${length}RestEpic`;
                break;
        }

        // Determine the chat message to display
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
     *
     * @param {object} [options]
     * @param {number} [options.threshold=3]  A number of missing hit points which would trigger an automatic HD roll.
     * @returns {Promise<number>}             Number of hit dice spent.
     */
    async autoSpendHitDice({threshold = 3} = {}) {
        const max = this.data.data.attributes.hp.max + this.data.data.attributes.hp.tempmax;

        let diceRolled = 0;
        while (this.data.data.attributes.hp.value + threshold <= max) {
            const r = await this.rollHitDie(undefined, {dialog: false});
            if (r === null) break;
            diceRolled += 1;
        }

        return diceRolled;
    }

    /* -------------------------------------------- */

    /**
     * Recovers actor hit points and eliminates any temp HP.
     *
     * @param {object} [options]
     * @param {boolean} [options.recoverTemp=true]     Reset temp HP to zero.
     * @param {boolean} [options.recoverTempMax=true]  Reset temp max HP to zero.
     * @returns {object}                               Updates to the actor and change in hit points.
     * @protected
     */
    _getRestHitPointRecovery({recoverTemp = true, recoverTempMax = true} = {}) {
        const data = this.data.data;
        let updates = {};
        let max = data.attributes.hp.max;

        if (recoverTempMax) {
            updates["data.attributes.hp.tempmax"] = 0;
        } else {
            max += data.attributes.hp.tempmax;
        }
        updates["data.attributes.hp.value"] = max;
        if (recoverTemp) {
            updates["data.attributes.hp.temp"] = 0;
        }

        return {updates, hitPointsRecovered: max - data.attributes.hp.value};
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
        for (let [k, r] of Object.entries(this.data.data.resources)) {
            if (
                Number.isNumeric(r.max) &&
                ((recoverShortRestResources && r.sr) || (recoverLongRestResources && r.lr))
            ) {
                updates[`data.resources.${k}.value`] = Number(r.max);
            }
        }
        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Recovers power slots.
     *
     * @param longRest = true  It's a long rest
     * @returns {object}       Updates to the actor.
     * @protected
     */
    _getRestPowerRecovery({recoverTechPowers = true, recoverForcePowers = true} = {}) {
        let updates = {};

        if (recoverTechPowers) {
            updates["data.attributes.tech.points.value"] = this.data.data.attributes.tech.points.max;
            updates["data.attributes.tech.points.temp"] = 0;
            updates["data.attributes.tech.points.tempmax"] = 0;

            for (let [k, v] of Object.entries(this.data.data.powers)) {
                updates[`data.powers.${k}.tvalue`] = Number.isNumeric(v.toverride) ? v.toverride : v.tmax ?? 0;
            }
        }

        if (recoverForcePowers) {
            updates["data.attributes.force.points.value"] = this.data.data.attributes.force.points.max;
            updates["data.attributes.force.points.temp"] = 0;
            updates["data.attributes.force.points.tempmax"] = 0;

            for (let [k, v] of Object.entries(this.data.data.powers)) {
                updates[`data.powers.${k}.fvalue`] = Number.isNumeric(v.foverride) ? v.foverride : v.fmax ?? 0;
            }
        }

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
    _getRestHitDiceRecovery({maxHitDice = undefined} = {}) {
        // Determine the number of hit dice which may be recovered
        if (maxHitDice === undefined) {
            maxHitDice = Math.max(Math.floor(this.data.data.details.level / 2), 1);
        }

        // Sort classes which can recover HD, assuming players prefer recovering larger HD first.
        const sortedClasses = Object.values(this.classes).sort((a, b) => {
            return (parseInt(b.data.data.hitDice.slice(1)) || 0) - (parseInt(a.data.data.hitDice.slice(1)) || 0);
        });

        let updates = [];
        let hitDiceRecovered = 0;
        for (let item of sortedClasses) {
            const d = item.data.data;
            if (hitDiceRecovered < maxHitDice && d.hitDiceUsed > 0) {
                let delta = Math.min(d.hitDiceUsed || 0, maxHitDice - hitDiceRecovered);
                hitDiceRecovered += delta;
                updates.push({"_id": item.id, "data.hitDiceUsed": d.hitDiceUsed - delta});
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
     * @returns {Array<object>}                              Array of item updates.
     * @protected
     */
    _getRestItemUsesRecovery({recoverShortRestUses = true, recoverLongRestUses = true, recoverDailyUses = true} = {}) {
        let recovery = [];
        if (recoverShortRestUses) recovery.push("sr");
        if (recoverLongRestUses) recovery.push("lr");
        if (recoverDailyUses) recovery.push("day");

        let updates = [];
        for (let item of this.items) {
            const d = item.data.data;
            if (d.uses && recovery.includes(d.uses.per)) {
                updates.push({"_id": item.id, "data.uses.value": d.uses.max});
            }
            if (recoverLongRestUses && d.recharge && d.recharge.value) {
                updates.push({"_id": item.id, "data.recharge.charged": true});
            }
        }

        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Results from a repair operation.
     *
     * @typedef {object} RepairResult
     * @property {number} dhp                  Hull points recovered during the repair.
     * @property {number} dhd                  Hull dice recovered or spent during the repair.
     * @property {object} updateData           Updates applied to the actor.
     * @property {Array.<object>} updateItems  Updates applied to actor's items.
     * @property {boolean} newDay              Whether a new day occurred during the repair.
     */

    /* -------------------------------------------- */

    /**
     * Take a recharge repair, possibly spending hull dice and recovering resources, and item uses.
     *
     * @param {object} [options]
     * @param {boolean} [options.dialog=true]         Present a dialog window which allows for rolling hull dice as part
     *                                                of the Recharge Repair and selecting whether a new day has occurred.
     * @param {boolean} [options.chat=true]           Summarize the results of the repair workflow as a chat message.
     * @param {boolean} [options.autoHD=false]        Automatically spend Hull Dice if you are missing 3 or more hit points.
     * @param {boolean} [options.autoHDThreshold=3]   A number of missing hull points which would trigger an automatic HD roll.
     * @return {Promise.<RepairResult>}               A Promise which resolves once the recharge repair workflow has completed.
     */
    async rechargeRepair({dialog = true, chat = true, autoHD = false, autoHDThreshold = 3} = {}) {
        // Take note of the initial hull points and number of hull dice the Actor has
        const hd0 = this.data.data.attributes.hull.dice;
        const hp0 = this.data.data.attributes.hp.value;
        const regenShld = !this.data.data.attributes.shld.depleted;
        let newDay = false;

        // Display a Dialog for rolling hull dice
        if (dialog) {
            try {
                newDay = await RechargeRepairDialog.rechargeRepairDialog({
                    actor: this,
                    canRoll: hd0 > 0
                });
            } catch (err) {
                return;
            }
        }

        // Automatically spend hit dice
        else if (autoHD) {
            await this.autoSpendHitDice({threshold: autoHDThreshold});
        }

        return this._repair(
            chat,
            newDay,
            false,
            this.data.data.attributes.hull.dice - hd0,
            this.data.data.attributes.hp.value - hp0,
            regenShld
        );
    }

    /* -------------------------------------------- */

    /**
     * Take a refitting repair, recovering hull points, hull dice, resources, and item uses.
     *
     * @param {object} [options]
     * @param {boolean} [options.dialog=true]  Present a confirmation dialog window whether or not to take a refitting repair.
     * @param {boolean} [options.chat=true]    Summarize the results of the repair workflow as a chat message.
     * @param {boolean} [options.newDay=true]  Whether the refitting repair carries over to a new day.
     * @return {Promise.<RepairResult>}        A Promise which resolves once the refitting repair workflow has completed.
     */
    async refittingRepair({dialog = true, chat = true, newDay = true} = {}) {
        // Maybe present a confirmation dialog
        if (dialog) {
            try {
                newDay = await RefittingRepairDialog.refittingRepairDialog({actor: this});
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
        // Maybe present a confirmation dialog
        if (dialog) {
            try {
                useShieldDie = await RegenRepairDialog.regenRepairDialog({actor: this});
            } catch (err) {
                return;
            }
        }

        const attr = this.data.data.attributes;
        const equip = attr.equip;
        const roll = new Roll(equip?.reactor?.powerRecDie ?? '');
        const size = this.data.items.filter((i) => i.type === "starship");

        const update = {};
        const itemUpdate = {};
        const messageData = {};

        if (useShieldDie) {
            if (!size) return ui.notifications.error(game.i18n.localize("SW5E.NoStarshipSize"));
            const sizeData = size[0].data.data;
            const shields = attr.shld;
            if (!shields.depleted && attr.hp.temp < attr.hp.tempmax && shields.dice) {
                const dieMax = Number(shields.die.substring(1));
                const regenRate = equip?.shields?.regenRateMult ?? 1;
                const regen = Math.floor(dieMax * regenRate);
                const actualRegen = Math.min(regen, attr.hp.tempmax - attr.hp.temp);

                update['data.attributes.hp.temp'] = attr.hp.temp + actualRegen;
                itemUpdate['data.shldDiceUsed'] = (sizeData.shldDiceUsed ?? 0) + 1;
                update['data.attributes.shld.dice'] = shields.dice - 1;
                messageData.sp = actualRegen;
            }
        }

        const pd = attr.power;
        const pdMissing = {};
        const slots = ['central', 'comms', 'engines', 'sensors', 'shields', 'weapons'];
        for (const slot of slots) {
            pdMissing[slot] = pd[slot].max - Number(pd[slot].value);
            pdMissing.total = (pdMissing.total ?? 0) + pdMissing[slot];
        }

        if (pdMissing.total) {
            const minRegen = (await roll.clone().evaluate({minimize: true})).total;
            if (pdMissing.total <= minRegen) {
                for (const slot of slots) update[`data.attributes.power.${slot}.value`] = pd[slot].max;
                messageData.pd = pdMissing.total;
            } else {
                const regen = (await roll.evaluate()).total;
                if (pdMissing.total <= regen) {
                    for (const slot of slots) update[`data.attributes.power.${slot}.value`] = pd[slot].max;
                    messageData.pd = pdMissing.total;
                } else if (pdMissing.central >= regen){
                    update['data.attributes.power.central.value'] = String(Number(pd.central.value) + regen);
                    messageData.pd = regen;
                } else {
                    update['data.attributes.power.central.value'] = pd.central.max;
                    try {
                        const allocation = await AllocatePowerDice.allocatePowerDice(this, regen - pdMissing.central, slots);
                        for (const slot of allocation) update[`data.attributes.power.${slot}.value`] = Number(pd[slot].value) + 1;
                        messageData.pd = allocation.length + pdMissing.central;
                    } catch (err) {
                        return;
                    }
                }
            }
        }

        if (foundry.utils.isObjectEmpty(update) && foundry.utils.isObjectEmpty(itemUpdate)) return;

        if (!foundry.utils.isObjectEmpty(update)) this.update(update);
        if (!foundry.utils.isObjectEmpty(itemUpdate) && size) size[0].update(itemUpdate);

        let message = "SW5E.RegenRepairResult";
        if (messageData.sp) message += "S";
        if (messageData.pd) message += "P";

        // Create a chat message
        let chatData = {
            user: game.user.id,
            speaker: {actor: this, alias: this.name}
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));

        if (roll._evaluated && !roll.isDeterministic) {
            chatData.flavor = game.i18n.format(message, {
                name: this.name,
                shieldPoints: messageData.sp,
                powerDice: messageData.pd,
            });
            return roll.toMessage(chatData);
        }

        chatData.flavor = game.i18n.localize("SW5E.RegenRepair");
        chatData.content = game.i18n.format(message, {
                name: this.name,
                shieldPoints: messageData.sp,
                powerDice: messageData.pd,
            })
        return ChatMessage.create(chatData);
    }

    /* -------------------------------------------- */

    /**
     * Perform all of the changes needed for a recharge or refitting repair.
     *
     * @param {boolean} chat             Summarize the results of the repair workflow as a chat message.
     * @param {boolean} newDay           Has a new day occurred during this repair?
     * @param {boolean} refittingRepair  Is this a refitting repair?
     * @param {number} [dhd=0]           Number of hit dice spent during so far during the repair.
     * @param {number} [dhp=0]           Number of hit points recovered so far during the repair.
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

        // Perform updates
        await this.update(result.updateData);
        await this.updateEmbeddedDocuments("Item", result.updateItems);

        // Display a Chat Message summarizing the repair effects
        if (chat) await this._displayRepairResultMessage(result, refittingRepair);

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
    async _displayRepairResultMessage(result, refittingRepair = false) {
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

    /* -------------------------------------------- */

    /**
     * Automatically spend hull dice to recover hit points up to a certain threshold.
     *
     * @param {object} [options]
     * @param {number} [options.threshold=3]  A number of missing hull points which would trigger an automatic HD roll.
     * @return {Promise.<number>}             Number of hull dice spent.
     */
    async autoSpendHullDice({threshold = 3} = {}) {
        const max = this.data.data.attributes.hp.max;

        let diceRolled = 0;
        while (this.data.data.attributes.hp.value + threshold <= max) {
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
        const data = this.data.data;
        let updates = {};
        const max = data.attributes.hp.max;

        updates["data.attributes.hp.value"] = max;

        return {updates, hullPointsRecovered: max - data.attributes.hp.value};
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
        const data = this.data.data;
        let updates = {};
        const max = data.attributes.hp.tempmax;

        updates["data.attributes.hp.temp"] = max;

        updates["data.attributes.shld.depleted"] = false;

        return {updates, shldPointsRecovered: max - data.attributes.hp.temp};
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
        const data = this.data.data;
        let updates = {};
        const centralMax = data.attributes.power.central.max;
        const commsMax = data.attributes.power.comms.max;
        const enginesMax = data.attributes.power.engines.max;
        const shieldsMax = data.attributes.power.shields.max;
        const sensorsMax = data.attributes.power.sensors.max;
        const weaponsMax = data.attributes.power.weapons.max;

        updates["data.attributes.power.central.value"] = centralMax;
        updates["data.attributes.power.comms.value"] = commsMax;
        updates["data.attributes.power.engines.value"] = enginesMax;
        updates["data.attributes.power.shields.value"] = shieldsMax;
        updates["data.attributes.power.sensors.value"] = sensorsMax;
        updates["data.attributes.power.weapons.value"] = weaponsMax;

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
        if (maxHullDice === undefined) {
            maxHullDice = this.data.data.attributes.hull.dicemax;
        }

        // Sort starship sizes which can recover HD, assuming players prefer recovering larger HD first.
        const starship = Object.values(this.starships).sort((a, b) => {
            return (parseInt(b.data.data.hullDice.slice(1)) || 0) - (parseInt(a.data.data.hullDice.slice(1)) || 0);
        });

        let updates = [];
        let hullDiceRecovered = 0;
        for (let item of starship) {
            const d = item.data.data;
            if (hullDiceRecovered < maxHullDice && d.hullDiceUsed > 0) {
                let delta = Math.min(d.hullDiceUsed || 0, maxHullDice - hullDiceRecovered);
                hullDiceRecovered += delta;
                updates.push({
                    "_id": item.id,
                    "data.hullDiceUsed": d.hullDiceUsed - delta
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
        const maxShldDice = this.data.data.attributes.shld.dicemax;

        // Sort starship sizes which can recover SD, assuming players prefer recovering larger SD first.
        const starship = Object.values(this.starships).sort((a, b) => {
            return (parseInt(b.data.data.shldDice.slice(1)) || 0) - (parseInt(a.data.data.shldDice.slice(1)) || 0);
        });

        let updates = [];
        let shldDiceRecovered = 0;
        for (let item of starship) {
            const d = item.data.data;
            if (shldDiceRecovered < maxShldDice && d.shldDiceUsed > 0) {
                let delta = Math.min(d.shldDiceUsed || 0, maxShldDice - shldDiceRecovered);
                shldDiceRecovered += delta;
                updates.push({
                    "_id": item.id,
                    "data.shldDiceUsed": d.shldDiceUsed - delta
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
            const d = item.data.data;
            if (d.uses && recovery.includes(d.uses.per)) {
                updates.push({"_id": item.id, "data.uses.value": d.uses.max});
            }
            if (recoverRefittingRepairUses && d.recharge && d.recharge.value) {
                updates.push({"_id": item.id, "data.recharge.charged": true});
            }
        }

        return updates;
    }

    /* -------------------------------------------- */

    /**
     * Deploy an Actor into this one.
     *
     * @param {Actor} target The Actor to be deployed.
     * @param {array} deployments Array of the positions to deploy in
     */
    deployInto(target, deployments) {
        // Get the starship Actor data and the new char data
        const ssDeploy = this.data.data.attributes.deployment;
        const charUUID = target.uuid;
        const charName = target.data.name;
        const charDeployments = [];

        for (const [key, name] of Object.entries(SW5E.deploymentTypes)) {
            const deployment = ssDeploy[key];
            let charRank = target.data.data.attributes.rank;
            let charProf = 0;

            if (charRank === undefined || charRank.total > 0) charProf = target.data.data.attributes.prof;
            if (!["active", "crew", "passenger"].includes(deployment)) charRank = charRank ? charRank[deployment] : 0;

            const deploymentData = {uuid: charUUID, name: charName, rank: charRank, prof: charProf};

            if (deployment.items) {
                for (let i = 0; i < deployment.items.length; i++) {
                    if (deployment.items[i].uuid == charUUID) {
                        charDeployments.push(key);
                        deployment.items[i] = deploymentData;
                        if (deployments.includes(key)) {
                            ui.notifications.warn(
                                game.i18n.format("SW5E.DeploymentAlreadyDeployed", {
                                    actor: charName,
                                    deployment: game.i18n.localize(name)
                                })
                            );
                        }
                    }
                }
                if (deployments.includes(key) && !charDeployments.includes(key)) {
                    charDeployments.push(key);
                    deployment.items.push(deploymentData);
                }
            } else {
                if (deployment.uuid == charUUID) {
                    charDeployments.push(key);
                    ssDeploy[key] = deploymentData;
                    if (deployments.includes(key)) {
                        ui.notifications.warn(
                            game.i18n.format("SW5E.DeploymentAlreadyDeployed", {
                                actor: charName,
                                deployment: game.i18n.localize(name)
                            })
                        );
                    }
                } else if (deployments.includes(key)) {
                    charDeployments.push(key);
                    ssDeploy[key] = deploymentData;
                }
            }
        }

        this.update({"data.attributes.deployment": ssDeploy});

        if (target.data.data.attributes.deployed?.uuid && target.data.data.attributes.deployed?.uuid != this.uuid)
            target.undeployFromStarship();
        target.update({
            "data.attributes.deployed": {
                uuid: this.uuid,
                name: this.data.name,
                deployments: charDeployments
            }
        });

        this.updateActiveDeployment();
    }

    /**
     * Transform this Actor into another one.
     *
     * @param {Actor5e} target            The target Actor.
     * @param {object} [options]
     * @param {boolean} [options.keepPhysical]    Keep physical abilities (str, dex, con)
     * @param {boolean} [options.keepMental]      Keep mental abilities (int, wis, cha)
     * @param {boolean} [options.keepSaves]       Keep saving throw proficiencies
     * @param {boolean} [options.keepSkills]      Keep skill proficiencies
     * @param {boolean} [options.mergeSaves]      Take the maximum of the save proficiencies
     * @param {boolean} [options.mergeSkills]     Take the maximum of the skill proficiencies
     * @param {boolean} [options.keepClass]       Keep proficiency bonus
     * @param {boolean} [options.keepFeats]       Keep features
     * @param {boolean} [options.keepPowers]      Keep powers
     * @param {boolean} [options.keepItems]       Keep items
     * @param {boolean} [options.keepBio]         Keep biography
     * @param {boolean} [options.keepVision]      Keep vision
     * @param {boolean} [options.transformTokens] Transform linked tokens too
     * @returns {Promise<Array<Token>>|null}      Updated token if the transformation was performed.
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
        const o = this.toJSON();
        o.flags.sw5e = o.flags.sw5e || {};
        o.flags.sw5e.transformOptions = {mergeSkills, mergeSaves};
        const source = target.toJSON();

        // Prepare new data to merge from the source
        const d = {
            type: o.type, // Remain the same actor type
            name: `${o.name} (${source.name})`, // Append the new shape to your old name
            data: source.data, // Get the data model of your new form
            items: source.items, // Get the items of your new form
            effects: o.effects.concat(source.effects), // Combine active effects from both forms
            img: source.img, // New appearance
            permission: o.permission, // Use the original actor permissions
            folder: o.folder, // Be displayed in the same sidebar folder
            flags: o.flags // Use the original actor flags
        };

        // Specifically delete some data attributes
        delete d.data.resources; // Don't change your resource pools
        delete d.data.currency; // Don't lose currency
        delete d.data.bonuses; // Don't lose global bonuses

        // Specific additional adjustments
        d.data.details.alignment = o.data.details.alignment; // Don't change alignment
        d.data.attributes.exhaustion = o.data.attributes.exhaustion; // Keep your prior exhaustion level
        d.data.attributes.inspiration = o.data.attributes.inspiration; // Keep inspiration
        d.data.powers = o.data.powers; // Keep power slots
        d.data.attributes.ac.flat = target.data.data.attributes.ac.value; // Override AC

        // Token appearance updates
        d.token = {name: d.name};
        for (let k of ["width", "height", "scale", "img", "mirrorX", "mirrorY", "tint", "alpha", "lockRotation"]) {
            d.token[k] = source.token[k];
        }
        const vision = keepVision ? o.token : source.token;
        for (let k of ["dimSight", "brightSight", "dimLight", "brightLight", "vision", "sightAngle"]) {
            d.token[k] = vision[k];
        }
        if (source.token.randomImg) {
            const images = await target.getTokenImages();
            d.token.img = images[Math.floor(Math.random() * images.length)];
        }

        // Transfer ability scores
        const abilities = d.data.abilities;
        for (let k of Object.keys(abilities)) {
            const oa = o.data.abilities[k];
            const prof = abilities[k].proficient;
            if (keepPhysical && ["str", "dex", "con"].includes(k)) abilities[k] = oa;
            else if (keepMental && ["int", "wis", "cha"].includes(k)) abilities[k] = oa;
            if (keepSaves) abilities[k].proficient = oa.proficient;
            else if (mergeSaves) abilities[k].proficient = Math.max(prof, oa.proficient);
        }

        // Transfer skills
        if (keepSkills) d.data.skills = o.data.skills;
        else if (mergeSkills) {
            for (let [k, s] of Object.entries(d.data.skills)) {
                s.value = Math.max(s.value, o.data.skills[k].value);
            }
        }

        // Keep specific items from the original data
        d.items = d.items.concat(
            o.items.filter((i) => {
                if (i.type === "class") return keepClass;
                else if (i.type === "feat") return keepFeats;
                else if (i.type === "power") return keepPowers;
                else return keepItems;
            })
        );

        // Transfer classes for NPCs
        if (!keepClass && d.data.details.cr) {
            d.items.push({
                type: "class",
                name: game.i18n.localize("SW5E.PolymorphTmpClass"),
                data: {levels: d.data.details.cr}
            });
        }

        // Keep biography
        if (keepBio) d.data.details.biography = o.data.details.biography;

        // Keep senses
        if (keepVision) d.data.traits.senses = o.data.traits.senses;

        // Set new data flags
        if (!this.isPolymorphed || !d.flags.sw5e.originalActor) d.flags.sw5e.originalActor = this.id;
        d.flags.sw5e.isPolymorphed = true;

        // Update unlinked Tokens in place since they can simply be re-dropped from the base actor
        if (this.isToken) {
            const tokenData = d.token;
            tokenData.actorData = d;
            delete tokenData.actorData.token;
            return this.token.update(tokenData);
        }

        // Update regular Actors by creating a new Actor with the Polymorphed data
        await this.sheet.close();
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
        const newActor = await this.constructor.create(d, {renderSheet: true});

        // Update placed Token instances
        if (!transformTokens) return;
        const tokens = this.getActiveTokens(true);
        const updates = tokens.map((t) => {
            const newTokenData = foundry.utils.deepClone(d.token);
            newTokenData._id = t.data._id;
            newTokenData.actorId = newActor.id;
            newTokenData.actorLink = true;
            return newTokenData;
        });
        return canvas.scene?.updateEmbeddedDocuments("Token", updates);
    }

    /* -------------------------------------------- */

    /**
     * Updates a starship's record of it's active deployed character.
     */
    updateActiveDeployment() {
        const deployments = this.data.data.attributes.deployment;
        const active = {};
        for (const [key, deployment] of Object.entries(deployments)) {
            if (key == "active") continue;
            if (deployment.items) {
                for (const deploy of Object.values(deployment.items)) {
                    if (deploy.active) active[key] = deploy;
                }
            } else if (deployment.active) active[key] = deployment;
        }
        deployments.active = {
            uuid: null,
            name: null,
            maxrank: 0,
            prof: 0,
            deployments: []
        };
        for (const [key, deploy] of Object.entries(active)) {
            deployments.active.uuid = deploy.uuid;
            deployments.active.name = deploy.name;
            if (typeof deploy.rank == typeof 0)
                deployments.active.maxrank = Math.max(deployments.active.maxrank, deploy.rank);
            deployments.active.prof = deploy.prof;
            deployments.active.deployments.push(key);
        }
        this.update({"data.attributes.deployment": deployments});
        return deployments.active;
    }

    /* -------------------------------------------- */

    /**
     * Undeploys the actor from it's currently deployed starship
     */
    undeployFromStarship() {
        const deployed = this.data.data.attributes.deployed;
        let starship = fromUuidSynchronous(deployed.uuid);

        if (starship && starship instanceof TokenDocument) starship = starship.actor;
        if (starship) {
            const ssDeploy = starship.data.data.attributes.deployment;

            for (const [key, deployment] of Object.entries(ssDeploy)) {
                if (key == "active") continue;
                if (deployment.items) deployment.items = deployment.items.filter((e) => e.uuid != this.uuid);
                else if (deployment.uuid == this.uuid) for (const k in deployment) deployment[k] = null;
            }
            starship.update({"data.attributes.deployment": ssDeploy});
            starship.updateActiveDeployment();
        }

        this.update({
            "data.attributes.deployed": {
                uuid: null,
                name: null,
                deployments: []
            }
        });
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
            const baseActor = game.actors.get(this.token.data.actorId);
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
     * Add additional system-specific sidebar directory context menu options for SW5e Actor documents
     * @param {jQuery} html         The sidebar HTML
     * @param {Array} entryOptions  The default array of context menu options
     */
    static addDirectoryContextOptions(html, entryOptions) {
        const useEntity = foundry.utils.isNewerVersion("9", game.version ?? game.data.version);
        const idAttr = useEntity ? "entityId" : "documentId";
        entryOptions.push({
            name: "SW5E.PolymorphRestoreTransformation",
            icon: '<i class="fas fa-backward"></i>',
            callback: (li) => {
                const actor = game.actors.get(li.data(idAttr));
                return actor.revertOriginalForm();
            },
            condition: (li) => {
                const allowed = game.settings.get("sw5e", "allowPolymorphing");
                if (!allowed && !game.user.isGM) return false;
                const actor = game.actors.get(li.data(idAttr));
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
        if (data.value) {
            values = data.value instanceof Array ? data.value : [data.value];
        }

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
        if (data.custom) {
            data.custom.split(";").forEach((c, i) => (data.selected[`custom${i + 1}`] = c.trim()));
        }
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

        // Additional options only apply to Actors which are not synthetic Tokens
        if (this.isToken) return;

        // Check for updates on deployed actors
        const uuid = this.data.data.attributes.deployed?.uuid;
        if (uuid) {
            for (const change of changed) {
                const arr = change.split(".");
                if (change == "name" || (arr[0] == "data" && arr[1] == "attributes" && arr[2] == "rank")) {
                    const starship = fromUuidSynchronous(uuid);
                    starship.deployInto(this, []);
                    break;
                }
            }
        }
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

        // Check for leveling up actors that are deployed
        const uuid = this.data.data.attributes.deployed?.uuid;
        if (uuid) {
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];
                const changes = result[i];
                if (doc.data.type == "class" && "data" in changes && "levels" in changes.data) {
                    const starship = fromUuidSynchronous(uuid);
                    starship.deployInto(this, []);
                    break;
                }
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
        for (let t of tokens) {
            if (!t?.hud?.createScrollingText) continue; // This is undefined prior to v9-p2
            const pct = Math.clamped(Math.abs(dhp) / this.data.data.attributes.hp.max, 0, 1);
            t.hud.createScrollingText(dhp.signedString(), {
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
     * Retrieve the power save DC for the provided ability.
     * @param {string} ability  Ability key as defined in `CONFIG.SW5E.abilities`.
     * @returns {number}        Power save DC for provided ability.
     * @deprecated since sw5e 0.97
     */
    getPowerDC(ability) {
        console.warn(
            "The Actor5e#getPowerDC(ability) method has been deprecated in favor of Actor5e#data.data.abilities[ability].dc"
        );
        return this.data.data.abilities[ability]?.dc;
    }

    /* -------------------------------------------- */

    /**
     * Cast a Power, consuming a power slot of a certain level
     * @param {Item5e} item   The power being cast by the actor
     * @param {Event} event   The originating user interaction which triggered the cast
     * @returns {Promise<ChatMessage|object|void>}  Dialog if `configureDialog` is true, else prepared dialog data.
     * @deprecated since sw5e 1.2.0
     */
    async usePower(item, {configureDialog = true} = {}) {
        console.warn("The Actor5e#usePower method has been deprecated in favor of Item5e#roll");
        if (item.data.type !== "power") throw new Error("Wrong Item type");
        return item.roll();
    }
}
