import {simplifyRollFormula, d20Roll, damageRoll} from "../dice.js";
import {fromUuidSynchronous, fromUuidSafe} from "../helpers.js";
import AbilityUseDialog from "../apps/ability-use-dialog.js";
import Proficiency from "../actor/proficiency.js";

/**
 * Override and extend the basic Item implementation.
 * @extends {Item}
 */
export default class Item5e extends Item {
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
     * Which ability score modifier is used by this item.
     * @type {string|null}
     */
    get abilityMod() {
        const itemData = this.data.data;
        if (!("ability" in itemData)) return null;

        // Case 1 - defined directly by the item
        if (itemData.ability) return itemData.ability;
        // Case 2 - inferred from a parent actor
        else if (this.actor) {
            const actorData = this.actor.data.data;

            // Powers - Use Actor powercasting modifier based on power school
            if (this.data.type === "power") {
                let school = this.data.data.school;
                if (game.settings.get("sw5e", "simplifiedForcecasting") && ["lgt", "drk"].includes(school))
                    school = "uni";
                switch (school) {
                    case "lgt":
                        return "wis";
                    case "uni":
                        return actorData.abilities.wis.mod >= actorData.abilities.cha.mod ? "wis" : "cha";
                    case "drk":
                        return "cha";
                    case "tec":
                        return "int";
                }
                return "none";
            }

            // Tools - default to Intelligence
            else if (this.data.type === "tool") return "int";
            // Weapons
            else if (this.data.type === "weapon") {
                const wt = itemData.weaponType;

                // Weapons using the powercasting modifier
                // No current SW5e weapons use this, but it's worth checking just in case
                if (["mpak", "rpak"].includes(itemData.actionType)) {
                    return actorData.attributes.powercasting || "int";
                }

                // Finesse weapons - Str or Dex (PHB pg. 147)
                else if (itemData.properties.fin === true) {
                    return actorData.abilities.dex.mod >= actorData.abilities.str.mod ? "dex" : "str";
                }

                // Ranged weapons - Dex (PH p.194)
                else if (["simpleB", "martialB"].includes(wt)) return "dex";
            }
            return "str";
        }

        // Case 3 - unknown
        return null;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement an attack roll as part of its usage?
     * @type {boolean}
     */
    get hasAttack() {
        return ["mwak", "rwak", "mpak", "rpak"].includes(this.data.data.actionType);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a damage roll as part of its usage?
     * @type {boolean}
     */
    get hasDamage() {
        return !!(this.data.data.damage && this.data.data.damage.parts.length);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a versatile damage roll as part of its usage?
     * @type {boolean}
     */
    get isVersatile() {
        return !!(this.hasDamage && this.data.data.damage.versatile);
    }

    /* -------------------------------------------- */

    /**
     * Does the item provide an amount of healing instead of conventional damage?
     * @type {boolean}
     */
    get isHealing() {
        return this.data.data.actionType === "heal" && this.data.data.damage.parts.length;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item implement a saving throw as part of its usage?
     * @type {boolean}
     */
    get hasSave() {
        const save = this.data.data?.save || {};
        return !!(save.ability && save.scaling);
    }

    /* --------------------------------------------- */

    /**
     * Does the Item implement an ability check as part of its usage?
     * @type {boolean}
     */
    get hasAbilityCheck() {
        return this.data.data?.actionType === "abil" && this.data.data?.ability;
    }

    /* -------------------------------------------- */

    /**
     * Does the Item have a target?
     * @type {boolean}
     */
    get hasTarget() {
        const target = this.data.data.target;
        return target && !["none", ""].includes(target.type);
    }

    /* -------------------------------------------- */

    /**
     * Does the Item have an area of effect target?
     * @type {boolean}
     */
    get hasAreaTarget() {
        const target = this.data.data.target;
        return target && target.type in CONFIG.SW5E.areaTargetTypes;
    }

    /* -------------------------------------------- */

    /**
     * Is this Item limited in its ability to be used by charges or by recharge?
     * @type {boolean}
     */
    get hasLimitedUses() {
        let chg = this.data.data.recharge || {};
        let uses = this.data.data.uses || {};
        return !!chg.value || (uses.per && uses.max > 0);
    }

    /* -------------------------------------------- */

    /**
     * Is this item any of the armor subtypes?
     * @type {boolean}
     */
    get isArmor() {
        return this.data.data.armor?.type in CONFIG.SW5E.armorTypes;
    }

    /* -------------------------------------------- */

    /**
     * Should this item's active effects be suppressed.
     * @type {boolean}
     */
    get areEffectsSuppressed() {
        const requireEquipped =
            this.data.type !== "consumable" || ["rod", "trinket", "wand"].includes(this.data.data.consumableType);
        if (requireEquipped && this.data.data.equipped === false) return true;

        if (this.data.type === "modification" && (this.data.data.modifying === null || this.data.data.modifying.disabled)) return true;

        return this.data.data.attunement === CONFIG.SW5E.attunementTypes.REQUIRED;
    }

    /* -------------------------------------------- */
    /*  Data Preparation                            */
    /* -------------------------------------------- */

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareDerivedData() {
        super.prepareDerivedData();

        // Get the Item's data
        const itemData = this.data;
        const data = itemData.data;
        const C = CONFIG.SW5E;
        const labels = (this.labels = {});

        // Classes
        if (itemData.type === "class") {
            data.levels = Math.clamped(data.levels, 1, 20);
        }

        // Power Level,  School, and Components
        if (itemData.type === "power") {
            data.preparation.mode = data.preparation.mode || "prepared";
            labels.level = C.powerLevels[data.level];
            labels.school = C.powerSchools[data.school];
            labels.components = Object.entries(data.components).reduce((arr, c) => {
                if (c[1] !== true) return arr;
                arr.push(c[0].titleCase().slice(0, 1));
                return arr;
            }, []);
            labels.materials = data?.materials?.value ?? null;
        }

        // Feat Items
        else if (itemData.type === "feat") {
            const act = data.activation;
            if (act && act.type === C.abilityActivationTypes.legendary)
                labels.featType = game.i18n.localize("SW5E.LegendaryActionLabel");
            else if (act && act.type === C.abilityActivationTypes.lair)
                labels.featType = game.i18n.localize("SW5E.LairActionLabel");
            else if (act && act.type)
                labels.featType = game.i18n.localize(data.damage.length ? "SW5E.Attack" : "SW5E.Action");
            else labels.featType = game.i18n.localize("SW5E.Passive");
        }

        // TODO: Something with all this
        // Species Items
        else if (itemData.type === "species") {
            //  labels.species = C.species[data.species];
        }
        // Archetype Items
        else if (itemData.type === "archetype") {
            //  labels.archetype = C.archetype[data.archetype];
        }
        // Background Items
        else if (itemData.type === "background") {
            //  labels.background = C.background[data.background];
        }
        // Class Feature Items
        else if (itemData.type === "classfeature") {
            //  labels.classFeature = C.classFeature[data.classFeature];
        }
        // Deployment Items
        else if (itemData.type === "deployment") {
            //  labels.deployment = C.deployment[data.deployment];
        }
        // Venture Items
        else if (itemData.type === "venture") {
            //  labels.venture = C.venture[data.venture];
        }
        // Fighting Style Items
        else if (itemData.type === "fightingstyle") {
            //  labels.fightingstyle = C.fightingstyle[data.fightingstyle];
        }
        // Fighting Mastery Items
        else if (itemData.type === "fightingmastery") {
            //  labels.fightingmastery = C.fightingmastery[data.fightingmastery];
        }
        // Lightsaber Form Items
        else if (itemData.type === "lightsaberform") {
            //  labels.lightsaberform = C.lightsaberform[data.lightsaberform];
        }

        // Equipment Items
        else if (itemData.type === "equipment") {
            labels.armor = data.armor.value ? `${data.armor.value} ${game.i18n.localize("SW5E.AC")}` : "";
        }

        // Starship Modification Items
        else if (itemData.type === "starshipmod") {
            foundry.utils.setProperty(data, "baseCost.value", data?.baseCost?.value || CONFIG.SW5E.ssModSystemsBaseCost[data.system.value]);
        }

        // Activated Items
        if (data.hasOwnProperty("activation")) {
            // Ability Activation Label
            let act = data.activation || {};
            if (act) labels.activation = [act.cost, C.abilityActivationTypes[act.type]].filterJoin(" ");

            // Target Label
            let tgt = data.target || {};
            if (["none", "touch", "self"].includes(tgt.units)) tgt.value = null;
            if (["none", "self"].includes(tgt.type)) {
                tgt.value = null;
                tgt.units = null;
            }
            labels.target = [tgt.value, C.distanceUnits[tgt.units], C.targetTypes[tgt.type]].filterJoin(" ");

            // Range Label
            let rng = data.range || {};
            if (["none", "touch", "self"].includes(rng.units)) {
                rng.value = null;
                rng.long = null;
            }
            labels.range = [rng.value, rng.long ? `/ ${rng.long}` : null, C.distanceUnits[rng.units]].filterJoin(" ");

            // Duration Label
            let dur = data.duration || {};
            if (["inst", "perm"].includes(dur.units)) dur.value = null;
            labels.duration = [dur.value, C.timePeriods[dur.units]].filterJoin(" ");

            // Recharge Label
            let chg = data.recharge || {};
            labels.recharge = `${game.i18n.localize("SW5E.Recharge")} [${chg.value}${
                parseInt(chg.value) < 6 ? "+" : ""
            }]`;
        }

        // Item Actions
        if (data.hasOwnProperty("actionType")) {
            // Damage
            let dam = data.damage || {};
            if (dam.parts) {
                labels.damage = dam.parts
                    .map((d) => d[0])
                    .join(" + ")
                    .replace(/\+ -/g, "- ");
                labels.damageTypes = dam.parts.map((d) => C.damageTypes[d[1]]).join(", ");
            }
        }

        this.applyModifications();

        // If this item is owned, we prepareFinalAttributes() at the end of actor init
        if (!this.isEmbedded) this.prepareFinalAttributes();
    }

    /* -------------------------------------------- */

    /**
     * Apply modifications.
     */
    applyModifications() {
        this.overrides = {};

        // Get the Item's data
        const item = this;
        const itemData = item.data.data;
        const itemMods = itemData.modify;
        const changes = foundry.utils.flattenObject(itemMods?.changes ?? {});
        const overrides = {};

        if (!itemMods) return;

        // Calculate the type of item modifications accepted
        if (item.type === 'equipment') {
            if (itemData.armor?.type in CONFIG.SW5E.armorTypes) itemMods.type = 'armor';
            else if (itemData.armor?.type in CONFIG.SW5E.miscEquipmentTypes) itemMods.type = itemData.armor?.type;
            else itemMods.type = null;
        }
        else if (item.type === 'weapon') {
            if (itemData.weaponType?.endsWith('LW')) itemMods.type = 'lightweapon';
            else if (itemData.weaponType?.endsWith('VW')) itemMods.type = 'vibroweapon';
            else if (itemData.weaponType?.endsWith('B')) itemMods.type = 'blaster';
            else itemMods.type = 'vibroweapon';
        }
        else itemMods.type = null;

        if (game.settings.get("sw5e", "disableItemMods") || foundry.utils.isObjectEmpty(changes)) return;

        for (const change in changes) {
            // Handle type specific changes
            if (!itemMods.type in CONFIG.SW5E.modificationTypesEquipment &&
                change in ['armor.value', 'armor.dex', 'strength', 'stealth']) continue;
            overrides[`data.${change}`] = changes[change];
        }

        // Handle non-overwrite changes
        if ((itemData.attackBonus || '0') !== '0' && overrides['data.attackBonus']) {
            overrides['data.attackBonus'] = `${itemData.attackBonus} + ${overrides['data.attackBonus']}`;
        } 
        if (itemData.damage?.parts && overrides['data.damage.parts']) {
            overrides['data.damage.parts'] = itemData.damage.parts.concat(overrides['data.damage.parts']);
        }
        if (itemData.armor?.value && overrides['data.armor.value']) overrides['data.armor.value'] += itemData.armor.value;

        let props = null;
        if (item.type === 'weapon') props = CONFIG.SW5E.weaponProperties;
        if (item.type === 'equipment') {
            if (itemData.armor.type in CONFIG.SW5E.armorTypes) props = CONFIG.SW5E.armorProperties;
            if (itemData.armor.type in CONFIG.SW5E.castingEquipmentTypes) props = CONFIG.SW5E.castingProperties;
        }
        if (props) {
            for (const [prop, propData] of Object.entries(props)) {
                if (propData.type === "Number" && overrides[`data.properties.${prop}`]) {
                    if (itemData.properties[prop]) overrides[`data.properties.${prop}`] += Number(itemData.properties[prop]);
                    if (propData.min !== undefined) overrides[`data.properties.${prop}`] = Math.max(overrides[`data.properties.${prop}`], propData.min);
                    if (propData.max !== undefined) overrides[`data.properties.${prop}`] = Math.min(overrides[`data.properties.${prop}`], propData.max);
                }
            }
        }

        for (const prop of Object.keys(overrides)){
            foundry.utils.setProperty(this.data, prop, overrides[prop]);
        }
        this.overrides = foundry.utils.expandObject(overrides);
    }

    /* -------------------------------------------- */

    /**
     * Compute item attributes which might depend on prepared actor data. If this item is
     * embedded this method will be called after the actor's data is prepared. Otherwise it
     * will be called at the end of `Item5e#prepareDerivedData`.
     */
    prepareFinalAttributes() {
        // Proficiency
        if (this.type === "weapon" && this.data.data.weaponType in CONFIG.SW5E.weaponStarshipTypes) this.data.data.proficient = true;
        const isProficient = this.type === "power" || this.data.data.proficient; // Always proficient in power attacks.
        this.data.data.prof = new Proficiency(this.actor?.data.data.attributes.prof, isProficient);

        if (this.data.data.hasOwnProperty("actionType")) {
            // Ability checks
            this.labels.abilityCheck = game.i18n.format("SW5E.AbilityPromptTitle", {
                ability: CONFIG.SW5E.abilities[this.data.data?.ability]
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
     * @returns {{damageType: number, formula: string}[]}
     */
    getDerivedDamageLabel() {
        const itemData = this.data.data;
        if (!this.hasDamage || !itemData || !this.isEmbedded) return [];
        const rollData = this.getRollData();
        const derivedDamage = itemData.damage?.parts?.map((damagePart) => {
            let formula;
            try {
                const roll = new Roll(damagePart[0], rollData);
                formula = simplifyRollFormula(roll.formula, {preserveFlavor: true});
            } catch (err) {
                console.warn(`Unable to simplify formula for ${this.name}: ${err}`);
            }
            return {formula, damageType: damagePart[1]};
        });
        this.labels.derivedDamage = derivedDamage;
        return derivedDamage;
    }

    /* -------------------------------------------- */

    /**
     * Update the derived power DC for an item that requires a saving throw.
     * @returns {number|null}
     */
    getSaveDC() {
        if (!this.hasSave) return;
        const save = this.data.data?.save;

        // Actor power-DC based scaling
        if (save.scaling === "power") {
            switch (this.data.data.school) {
                case "lgt": {
                    save.dc = this.isEmbedded
                        ? getProperty(this.actor.data, "data.attributes.powerForceLightDC")
                        : null;
                    break;
                }
                case "uni": {
                    save.dc = this.isEmbedded ? getProperty(this.actor.data, "data.attributes.powerForceUnivDC") : null;
                    break;
                }
                case "drk": {
                    save.dc = this.isEmbedded ? getProperty(this.actor.data, "data.attributes.powerForceDarkDC") : null;
                    break;
                }
                case "tec": {
                    save.dc = this.isEmbedded ? getProperty(this.actor.data, "data.attributes.powerTechDC") : null;
                    break;
                }
            }
        }

        // Ability-score based scaling
        else if (save.scaling !== "flat") {
            save.dc = this.isEmbedded ? getProperty(this.actor.data, `data.abilities.${save.scaling}.dc`) : null;
        }

        // Update labels
        const abl = CONFIG.SW5E.abilities[save.ability];
        this.labels.save = game.i18n.format("SW5E.SaveDC", {dc: save.dc || "", ability: abl});
        return save.dc;
    }

    /* -------------------------------------------- */

    /**
     * Update a label to the Item detailing its total to hit bonus.
     * Sources:
     * - item document's innate attack bonus
     * - item's actor's proficiency bonus if applicable
     * - item's actor's global bonuses to the given item type
     * - item's ammunition if applicable
     *
     * @returns {{rollData: object, parts: string[]}|null}  Data used in the item's Attack roll.
     */
    getAttackToHit() {
        const itemData = this.data.data;
        if (!this.hasAttack || !itemData) return;
        const rollData = this.getRollData();

        // Use wisdom on attack rolls for starship weapons, unless an item specific ability is set
        if (rollData && !itemData.ability && (itemData.weaponType ?? "").search("(starship)") !== -1)
            rollData.mod = rollData.abilities.wis?.mod;

        // Define Roll bonuses
        const parts = [];

        // Include the item's innate attack bonus as the initial value and label
        if (itemData.attackBonus) {
            parts.push(itemData.attackBonus);
            this.labels.toHit = itemData.attackBonus;
        }

        // Take no further action for un-owned items
        if (!this.isEmbedded) return {rollData, parts};

        // Ability score modifier
        parts.push("@mod");

        // Add proficiency bonus if an explicit proficiency flag is present or for non-item features
        if (!["weapon", "consumable"].includes(this.data.type) || itemData.proficient) {
            parts.push("@prof");
            if (this.data.data.prof?.hasProficiency) {
                rollData.prof = this.data.data.prof.term;
            }
        }

        // Actor-level global bonus to attack rolls
        const actorBonus = this.actor.data.data.bonuses?.[itemData.actionType] || {};
        if (actorBonus.attack) parts.push(actorBonus.attack);

        // One-time bonus provided by consumed ammunition
        if (itemData.consume?.type === "ammo" && this.actor.items) {
            const ammoItemData = this.actor.items.get(itemData.consume.target)?.data;

            if (ammoItemData) {
                const ammoItemQuantity = ammoItemData.data.quantity;
                const ammoCanBeConsumed = ammoItemQuantity && ammoItemQuantity - (itemData.consume.amount ?? 0) >= 0;
                const ammoItemAttackBonus = ammoItemData.data.attackBonus;
                const ammoIsTypeConsumable =
                    ammoItemData.type === "consumable" && ammoItemData.data.consumableType === "ammo";
                if (ammoCanBeConsumed && ammoItemAttackBonus && ammoIsTypeConsumable) {
                    parts.push("@ammo");
                    rollData.ammo = ammoItemAttackBonus;
                }
            }
        }

        // Condense the resulting attack bonus formula into a simplified label
        const roll = new Roll(parts.join("+"), rollData);
        const formula = simplifyRollFormula(roll.formula);
        this.labels.toHit = !/^[+-]/.test(formula) ? `+ ${formula}` : formula;

        // Update labels and return the prepared roll data
        return {rollData, parts};
    }

    /* -------------------------------------------- */

    /**
     * Retrieve an item's critical hit threshold. Uses the smallest value from among the
     * following sources:
     * - item document
     * - item document's actor (if it has one)
     * - the constant '20' - item document's keen property (if it has one)
     *
     * @returns {number|null}  The minimum value that must be rolled to be considered a critical hit.
     */
    getCriticalThreshold() {
        const itemData = this.data.data;
        const actorFlags = this.actor.data.flags.sw5e || {};
        if (!this.hasAttack || !itemData) return;

        // Get the actor's critical threshold
        let actorThreshold = null;

        if (this.data.type === "weapon") {
            actorThreshold = actorFlags.weaponCriticalThreshold;
        } else if (this.data.type === "power") {
            actorThreshold = actorFlags.powerCriticalThreshold;
        }

        // Return the lowest of the the item and actor thresholds
        return Math.min(itemData.critical?.threshold ?? Math.max(20 - (itemData?.properties?.ken ?? 0), 1), actorThreshold ?? 20);
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
        const itemData = this.data.data;
        const actorFlags = this.actor.data.flags.sw5e || {};
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
     * Populates the max uses of an item. If the item is an owned item and the `max`
     * is not numeric, calculate based on actor data.
     */
    prepareMaxUses() {
        const data = this.data.data;
        if (!data.uses?.max) return;
        let max = data.uses.max;

        // If this is an owned item and the max is not numeric, we need to calculate it
        if (this.isEmbedded && !Number.isNumeric(max)) {
            if (this.actor.data === undefined) return;
            try {
                max = Roll.replaceFormulaData(max, this.actor.getRollData(), {missing: 0, warn: true});
                max = Roll.safeEval(max);
            } catch (e) {
                console.error("Problem preparing Max uses for", this.data.name, e);
                return;
            }
        }
        data.uses.max = Number(max);
    }

    /* -------------------------------------------- */

    /**
     * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
     * @param {object} [options]
     * @param {boolean} [options.configureDialog]     Display a configuration dialog for the item roll, if applicable?
     * @param {string} [options.rollMode]             The roll display mode with which to display (or not) the card
     * @param {boolean} [options.createMessage]       Whether to automatically create a chat message (if true) or simply
     *                                                return the prepared chat message data (if false).
     * @returns {Promise<ChatMessage|object|void>}
     */
    async roll({configureDialog = true, rollMode, createMessage = true} = {}) {
        let item = this;
        const id = this.data.data; // Item system data
        const actor = this.actor;
        const starship = actor.getStarship();
        const ad = actor.data.data; // Actor system data

        // Reference aspects of the item data necessary for usage
        const hasArea = this.hasAreaTarget; // Is the ability usage an AoE?
        const resource = id.consume || {}; // Resource consumption
        const resourceTarget = actor.items.get(resource.target);
        const recharge = id.recharge || {}; // Recharge mechanic
        const uses = id?.uses ?? {}; // Limited uses
        const isPower = this.type === "power"; // Does the item require a power slot?
        // TODO: Possibly Mod this to not consume slots based on class?
        // We could use this for feats and architypes that let a character cast one slot every rest or so
        const requirePowerSlot = isPower && id.level > 0 && CONFIG.SW5E.powerUpcastModes.includes(id.preparation.mode);

        // Define follow-up actions resulting from the item usage
        let createMeasuredTemplate = hasArea; // Trigger a template creation
        let consumeRecharge = !!recharge.value; // Consume recharge
        let consumeResource =
            !!resource.target &&
            (!item.hasAttack ||
                (resource.type !== "ammo" &&
                    !(resource.type === "charges" && resourceTarget?.data.data.consumableType === "ammo"))); // Consume a linked (non-ammo) resource
        let consumePowerSlot = requirePowerSlot; // Consume a power slot
        let consumeUsage = !!uses.per; // Consume limited uses
        let consumeQuantity = uses.autoDestroy; // Consume quantity of the item in lieu of uses
        let consumePowerLevel = null; // Consume a specific category of power slot
        if (requirePowerSlot) consumePowerLevel = id.preparation.mode === "pact" ? "pact" : `power${id.level}`;

        // Display a configuration dialog to customize the usage
        const needsConfiguration =
            createMeasuredTemplate ||
            consumeRecharge ||
            (consumeResource && !["simpleB", "martialB"].includes(id.weaponType)) ||
            consumePowerSlot ||
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

            // Handle power upcasting
            if (requirePowerSlot) {
                consumePowerLevel = `power${configuration.level}`;
                if (consumePowerSlot === false) consumePowerLevel = null;
                const upcastLevel = parseInt(configuration.level);
                if (upcastLevel !== id.level) {
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
        if (!foundry.utils.isObjectEmpty(resourceUpdates)) {
            const resource = actor.items.get(id.consume?.target);
            if (resource) await resource.update(resourceUpdates);
        }

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
     * @param {boolean} options.consumeQuantity       Consume quantity of the item if other consumption modes are not
     *                                                available?
     * @param {boolean} options.consumeRecharge       Whether the item consumes the recharge mechanic
     * @param {boolean} options.consumeResource       Whether the item consumes a limited resource
     * @param {string|null} options.consumePowerLevel The category of power slot to consume, or null
     * @param {boolean} options.consumeUsage          Whether the item consumes a limited usage
     * @returns {object|boolean}                      A set of data changes to apply when the item is used, or false
     * @private
     */
    _getUsageUpdates({consumeQuantity, consumeRecharge, consumeResource, consumePowerLevel, consumeUsage}) {
        // Reference item data
        const id = this.data.data;
        const actorUpdates = {};
        const itemUpdates = {};
        const resourceUpdates = {};
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

        // Consume Weapon Reload
        if (this.type === "weapon" && (id.properties.rel || id.properties.ovr)) {
            if (id.ammo.value <= 0) {
                if (id.properties.rel) ui.notifications.warn(game.i18n.format("SW5E.ItemReloadNeeded", {name: this.name}));
                else if (id.properties.ovr) ui.notifications.warn(game.i18n.format("SW5E.ItemCoolDownNeeded", {name: this.name}));
                return false;
            }
            itemUpdates["data.ammo.value"] = id.ammo.value - 1;
        }

        // Return the configured usage
        return {itemUpdates, actorUpdates, resourceUpdates, starshipUpdates};
    }

    /* -------------------------------------------- */

    /**
     * Handle update actions required when consuming an external resource
     * @param {object} itemUpdates        An object of data updates applied to this item
     * @param {object} actorUpdates       An object of data updates applied to the item owner (Actor)
     * @param {object} resourceUpdates    An object of data updates applied to a different resource item (Item)
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
                    ui.notifications.warn(game.i18n.format("SW5E.ConsumeWarningNotDeployed", {name: this.name, actor: actor.name}));
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
            }
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
                resourceUpdates["data.quantity"] = remaining;
                break;
            case "charges":
                const uses = resource.data.data.uses || {};
                const recharge = resource.data.data.recharge || {};
                if (uses.per && uses.max) resourceUpdates["data.uses.value"] = remaining;
                else if (recharge.value) resourceUpdates["data.recharge.charged"] = false;
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
            data: this.getChatData(),
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
                props.push(game.i18n.localize(CONFIG.SW5E.attunements[CONFIG.SW5E.attunementTypes.REQUIRED]));
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
        props.push(CONFIG.SW5E.abilities[data.ability] || null, CONFIG.SW5E.proficiencyLevels[data.proficient || 0]);
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
        props.push(labels.level, labels.components + (labels.materials ? ` (${labels.materials})` : ""));
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
        let ammoUpdate = null;
        const consume = itemData.consume;
        if (consume?.type === "ammo") {
            ammo = this.actor.items.get(consume.target);
            if (ammo?.data) {
                const q = ammo.data.data.quantity;
                const consumeAmount = consume.amount ?? 0;
                if (q && q - consumeAmount >= 0) {
                    this._ammo = ammo;
                    title += ` [${ammo.name}]`;
                }
            }

            // Get pending ammunition update
            const usage = this._getUsageUpdates({consumeResource: true});
            if (usage === false) return null;
            ammoUpdate = usage.resourceUpdates || {};
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
                ammoUpdate = usage.resourceUpdates || {};
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
        if (ammo && !foundry.utils.isObjectEmpty(ammoUpdate)) await ammo.update(ammoUpdate);
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
        const parts = ["@mod"];
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
            const checkBonusKey = `${abl}CheckBonus`;
            parts.push(`@${checkBonusKey}`);
            const checkBonus = getProperty(rollData, `abilities.${abl}.bonuses.check`);
            rollData[checkBonusKey] = Roll.replaceFormulaData(checkBonus, rollData);
        }

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
                messageData: {"flags.sw5e.roll": {type: "tool", itemId: this.id}}
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
        const rollData = this.actor.getRollData();
        rollData.item = foundry.utils.deepClone(this.data.data);

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
    /*  Event Handlers                              */
    /* -------------------------------------------- */

    /** @inheritdoc */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

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
        delete changes['_id'];
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static async _onCreateDocuments(items, context) {
        return await super._onCreateDocuments(items, context);
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        // The below options are only needed for character classes
        if (userId !== game.user.id) return;
        const isCharacterClass = this.parent && this.parent.type !== "vehicle" && this.type === "class";
        if (!isCharacterClass) return;

        // Assign a new primary class
        const pc = this.parent.items.get(this.parent.data.data.details.originalClass);
        if (!pc) this.parent._assignPrimaryClass();

        // Prompt to add new class features
        if (options.addFeatures === false) return;
        this.parent
            .getClassFeatures({
                className: this.name,
                archetypeName: this.data.data.archetype,
                level: this.data.data.levels
            })
            .then((features) => {
                return this.parent.addEmbeddedItems(features, options.promptAddFeatures);
            });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        const changes = foundry.utils.flattenObject(changed);
        delete changes['_id'];

        // If a temporary modification item changes it's data, update the data in the modified item
        if (this.type === "modification" && this.actor && this.data.data?.modifying?.id) {
            const modType = this.data.data?.modificationType === "augment" ? "augment" : "mod";
            this.actor.items.get(this.data.data.modifying.id)?.updModification(this.id, null, this.data.toObject());
        }

        // The below options are only needed for character classes
        if (userId !== game.user.id) return;
        const isCharacterClass = this.parent && this.parent.type !== "vehicle" && this.type === "class";
        if (!isCharacterClass) return;

        // Prompt to add new class features
        const addFeatures = changed.name || (changed.data && ["archetype", "levels"].some((k) => k in changed.data));
        if (!addFeatures || options.addFeatures === false) return;
        this.parent
            .getClassFeatures({
                className: changed.name || this.name,
                archetypeName: changed.data?.archetype || this.data.data.archetype,
                level: changed.data?.levels || this.data.data.levels
            })
            .then((features) => {
                return this.parent.addEmbeddedItems(features, options.promptAddFeatures);
            });
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDelete(options, userId) {
        super._onDelete(options, userId);

        // Assign a new primary class
        if (this.parent && this.type === "class" && userId === game.user.id) {
            if (this.id !== this.parent.data.data.details.originalClass) return;
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
        if (foundry.utils.getProperty(data, "data.modifying.disabled") !== false) updates["data.modifying.disabled"] = false;

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
        const actorData = actor.data.data;
        const ammo = wpnData.ammo.target ? actor.items.get(wpnData.ammo.target) : null;
        const ammoData = ammo?.data?.data;

        const reloadProp = wpnData.properties.rel ? "rel" : wpnData.properties.ovr ? "ovr" : null;
        const reloadMax = wpnData.properties[reloadProp];

        let toReload = reloadMax - wpnData.ammo.value;
        const wpnUpdates = {};
        const ammoUpdates = {};

        if (reloadProp === "rel") {
            if (!ammo) return;
            if (!wpnData.ammo.types.includes(ammoData.ammoType)) return;
            if (ammoData.quantity <= 0) return;

            switch (ammoData.ammoType) {
                case "cartridge":
                case "dart":
                case "missile":
                case "rocket":
                case "snare":
                case "torpedo":
                    toReload = Math.min(toReload, ammoData.quantity);
                    ammoUpdates["data.quantity"] = ammoData.quantity - toReload;
                    break;
                case "powerCell":
                case "flechetteClip":
                case "flechetteMag":
                case "powerGenerator":
                case "projectorCanister":
                case "projectorTank":
                    ammoUpdates["data.quantity"] = ammoData.quantity - 1;
                    break;
            }
        }
        if (toReload <= 0) return;
        wpnUpdates["data.ammo.value"] = wpnData.ammo.value + toReload;

        if (!foundry.utils.isObjectEmpty(ammoUpdates)) ammo?.update(ammoUpdates);
        if (!foundry.utils.isObjectEmpty(wpnUpdates)) this.update(wpnUpdates);
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
            "standard": 1,
            "premium": 2,
            "prototype": 3,
            "advanced": 4,
            "legendary": 5,
            "artifact": 6
        }

        if (["none", "enhanced"].includes(itemMods.chassis)) return ui.notifications.warn(game.i18n.format("SW5E.ErrorModNoChassis", {
            name: item.name,
        }));
        if (itemMods.chassis === "chassis" && (rarityMap[itemData.rarity]??0) < (rarityMap[modData.rarity]??0)) {
            return ui.notifications.warn(game.i18n.format( "SW5E.ErrorModWrongRarity", {
                name: item.name,
                rarity: itemData.rarity ?? "common",
            }));
        }

        if (!(itemMods.type in CONFIG.SW5E.modificationTypes)) return ui.notifications.warn(game.i18n.format("SW5E.ErrorModUnrecognizedType", {
            name: item.name,
            type: itemMods.type,
        }));

        if (!(modData.modificationType in CONFIG.SW5E.modificationTypes)) return ui.notifications.warn(game.i18n.format("SW5E.ErrorModUnrecognizedType", {
            name: mod.name,
            type: modData.modificationType,
        }));

        const modType = (modData.modificationType === "augment") ? "augment" : "mod";
        if (modType === "mod" && itemMods.type !== modData.modificationType) return ui.notifications.warn(game.i18n.format("SW5E.ErrorModWrongType", {
            modName: mod.name,
            modType: modData.modificationType,
            itemName: item.name,
            itemType: itemMods.type,
        }));

        const modCount = itemMods.items.filter(m => m.type === modType).length;
        if (modCount >= itemMods[`${modType}Slots`]) return ui.notifications.warn(game.i18n.format("SW5E.ErrorModNoSpace",{
            itemName: item.name,
            modName: mod.name,
            modType: modType,
        }));

        const updates = {};

        const data = mod.toObject();
        delete data._id;
        data.data.modifying.id = item.id;
        const obj = { data: data, name: mod.name, type: modType };

        if (this.actor) {
            const items = await Item5e.createDocuments([data], {parent: this.actor});
            if (items?.length) obj.id = items[0].id;
        }

        itemMods.items.push(obj);
        updates[`data.modify.items`] = itemMods.items;

        if (!foundry.utils.isObjectEmpty(updates)) await this.update(updates);

        await this.updModificationChanges();
    }

    async updModification(id=null, index=null, data=null) {
        if (id === null && index === null) return;

        const mods = this.data?.data?.modify?.items;
        if (mods) {
            if (id === null) id = mods[index].id;
            if (data === null) data = this.actor?.items?.get(id)?.toObject();
            if (data === null) return;

            if (index === null) index = mods.findIndex(m => m.id === id);
            if (index === -1) return;
            mods[index].data = data;
            mods[index].name = data.name;
            await this.update({[`data.modify.items`]: mods});
        }

        await this.updModificationChanges();
    }

    async delModification(id=null, index=null, deleteTempItem=true) {
        if (id === null && index === null) return;

        const mods = this.data?.data?.modify?.items;
        if (mods) {
            if (index === null) index = mods.findIndex(m => m.id === id);
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

    async tglModification(id=null, index=null) {
        if (id === null && index === null) return;

        const mods = this.data?.data?.modify?.items;
        if (mods) {
            if (index === null) index = mods.findIndex(m => m.id === id);
            if (index === -1) return;
            mods[index].disabled = !mods[index].disabled;
            await this.update({[`data.modify.items`]: mods});

            if (id === null) id = mods[index].id;
            await this.actor?.items?.get(id)?.update({"data.modifying.disabled": mods[index].disabled});
        }

        await this.updModificationChanges();
    }

    async updModificationChanges(){
        const changes = {};
        const itemMods = this.data.data.modify;
        if (!itemMods) return;

        // Precalculate valid properties
        let props = null;
        if (this.type === 'weapon') props = CONFIG.SW5E.weaponProperties;
        if (this.type === 'equipment') {
            if (itemData.armor.type in CONFIG.SW5E.armorTypes) props = CONFIG.SW5E.armorProperties;
            if (itemData.armor.type in CONFIG.SW5E.castingEquipmentTypes) props = CONFIG.SW5E.castingProperties;
        }

        const mods = itemMods.items;
        for (const mod of mods) {
            if (mod.disabled) continue;
            this._calcSingleModChanges(mod.data.data, changes, props);
        }

        if (itemMods.changes !== changes) {
            if (itemMods.changes !== null && itemMods.changes !== undefined && Object.keys(itemMods.changes).length !== 0) {
                await this.update({'data.modify.-=changes': null});
            }
            if (changes !== null && changes !== undefined && Object.keys(changes) !== 0){
                await this.update({'data.modify.changes': changes});
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
                }
                else if (propData.type === "Boolean" && mod.properties.indeterminate && mod.properties.indeterminate[prop] === false) {
                    changes[`properties.${prop}`] = mod.properties[prop];
                }
            }
        }
        else if (mod.properties?.indeterminate) {
            for (const prop of Object.keys(mod?.properties)) {
                if (prop === "indeterminate") continue;
                if (mod.properties.indeterminate[prop] === false) {
                    changes[`properties.${prop}`] = mod.properties[prop];
                }
            }
        }

        // Attack bonus
        if (mod.attackBonus && mod.attackBonus !== '0') {
            if (changes['attackBonus']) changes['attackBonus'] += ' + ';
            else changes['attackBonus'] = '';
            changes['attackBonus'] += mod.attackBonus.replace(/^\s*[+]\s*/, '');
        }
        // Damage rolls
        if (mod.damage?.parts?.length) {
            changes['damage.parts'] ||= [];
            changes['damage.parts'] = changes['damage.parts'].concat(mod.damage.parts);
        }

        // Armor Class
        if (mod.armor?.value) {
            changes['armor.value'] ||= 0;
            changes['armor.value'] += mod.armor.value;
        }
        // Dexterity Modifier
        if (mod.armor?.dex) changes['armor.dex'] = mod.armor.dex;
        // Strength Requirement
        if (mod.strength) changes['strength'] = mod.strength;
        // Stealth Disadvantage
        if (mod.indeterminate?.stealth === false) changes[`stealth`] = mod.stealth;
    }    
}
