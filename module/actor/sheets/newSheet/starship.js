import ActorSheet5e from "./base.js";

/**
 * An Actor sheet for starships in the SW5E system.
 * Extends the base ActorSheet5e class.
 * @extends {ActorSheet5e}
 */
export default class ActorSheet5eStarship extends ActorSheet5e {
    /** @override */
    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sw5e/templates/actors/newActor/limited-sheet.html";
        return `systems/sw5e/templates/actors/newActor/starship.html`;
    }
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sw5e", "sheet", "actor", "starship"],
            width: 800,
            height: 775,
            tabs: [
                {
                    navSelector: ".root-tabs",
                    contentSelector: ".sheet-body",
                    initial: "attributes"
                }
            ]
        });
    }

    /* -------------------------------------------- */

    /**
     * Organize Owned Items for rendering the starship sheet
     * @private
     */
    _prepareItems(data) {
        // Categorize Items as Features and Powers
        const features = {
            weapons: {
                label: game.i18n.localize("SW5E.ItemTypeWeaponPl"),
                items: [],
                hasActions: true,
                dataset: {"type": "weapon", "weapon-type": "natural"}
            },
            passive: {label: game.i18n.localize("SW5E.Features"), items: [], dataset: {type: "feat"}},
            equipment: {label: game.i18n.localize("SW5E.StarshipEquipment"), items: [], dataset: {type: "equipment"}},
            starshipfeatures: {
                label: game.i18n.localize("SW5E.StarshipfeaturePl"),
                items: [],
                hasActions: true,
                dataset: {type: "starshipfeature"}
            },
            starshipmods: {
                label: game.i18n.localize("SW5E.StarshipmodPl"),
                items: [],
                hasActions: false,
                dataset: {type: "starshipmod"}
            }
        };

        // Start by classifying items into groups for rendering
        let [other] = data.items.reduce(
            (arr, item) => {
                item.img = item.img || CONST.DEFAULT_TOKEN;
                item.isStack = Number.isNumeric(item.data.quantity) && item.data.quantity !== 1;
                item.hasUses = item.data.uses && item.data.uses.max > 0;
                item.isOnCooldown =
                    item.data.recharge && !!item.data.recharge.value && item.data.recharge.charged === false;
                item.isDepleted = item.isOnCooldown && item.data.uses.per && item.data.uses.value > 0;
                item.hasTarget = !!item.data.target && !["none", ""].includes(item.data.target.type);
                arr[0].push(item);
                return arr;
            },
            [[]]
        );

        // Apply item filters
        other = this._filterItems(other, this._filters.features);

        // Organize Features
        for (let item of other) {
            if (item.type === "weapon") features.weapons.items.push(item);
            else if (item.type === "feat") {
                if (item.data.activation.type) features.actions.items.push(item);
                else features.passive.items.push(item);
            } else if (item.type === "starshipfeature") {
                features.starshipfeatures.items.push(item);
            } else if (item.type === "starshipmod") {
                features.starshipmods.items.push(item);
            } else features.equipment.items.push(item);
        }

        // Assign and return
        data.features = Object.values(features);
    }

    /* -------------------------------------------- */

    /** @override */
    getData(options) {
        const data = super.getData(options);

        // Add Size info
        data.isTiny = data.actor.data.traits.size === "tiny";
        data.isSmall = data.actor.data.traits.size === "sm";
        data.isMedium = data.actor.data.traits.size === "med";
        data.isLarge = data.actor.data.traits.size === "lg";
        data.isHuge = data.actor.data.traits.size === "huge";
        data.isGargantuan = data.actor.data.traits.size === "grg";

        return data;
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".health .rollable").click(this._onRollHPFormula.bind(this));
        html.find(".refuel").click(this._onIncrementFuelLevel.bind(this));
        html.find(".burnfuel").click(this._onDecrementFuelLevel.bind(this));
        html.find("#engineslidervalue")[0].addEventListener("input", this._engineSliderUpdate.bind(this));
        html.find("#shieldslidervalue")[0].addEventListener("input", this._shieldSliderUpdate.bind(this));
        html.find("#weaponslidervalue")[0].addEventListener("input", this._weaponSliderUpdate.bind(this));
        // Recharge and Refitting Repairs
        html.find(".recharge-repair").click(this._onRechargeRepair.bind(this));
        html.find(".refitting-repair").click(this._onRefittingRepair.bind(this));
        // Rollable sheet actions
        html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
    }
    /* -------------------------------------------- */

    /**
     * Handle mouse click events for character sheet actions
     * @param {MouseEvent} event    The originating click event
     * @private
     */
    _onSheetAction(event) {
        event.preventDefault();
        const button = event.currentTarget;
        switch (button.dataset.action) {
            case "rollDestructionSave":
                return this.actor.rollDestructionSave({event: event});
            case "rollInitiative":
                return this.actor.rollInitiative({createCombatants: true});
        }
    }

    /* -------------------------------------------- */

    /**
     * Take a Recharge repair, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @private
     */
    async _onRechargeRepair(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.rechargeRepair();
    }

    /* -------------------------------------------- */

    /**
     * Take a refitting repair, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @private
     */
    async _onRefittingRepair(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.refittingRepair();
    }

    /* -------------------------------------------- */

    /**
     * Handle rolling NPC health values using the provided formula
     * @param {Event} event     The original click event
     * @private
     */
    _onRollHPFormula(event) {
        event.preventDefault();
        const formula = this.actor.data.data.attributes.hp.formula;
        if (!formula) return;
        const hp = new Roll(formula).roll().total;
        AudioHelper.play({src: CONFIG.sounds.dice});
        this.actor.update({"data.attributes.hp.value": hp, "data.attributes.hp.max": hp});
    }

    /* -------------------------------------------- */

    /**
     * Handle refueling a starship
     * @param {Event} event     The original click event
     * @private
     */
    _onIncrementFuelLevel(event) {
        // event.preventDefault();
        // const fuelcaparray = this.actor.data.effects.changes;
        // var fuelcappos = fuelcaparray.indexOf('fuel.cap');
        // const refuel = this.actor.data.effect.changes[fuelcappos].value;
        this.actor.update({"data.attributes.fuel.value": this.actor.data.data.attributes.fuel.cap});
    }

    /* -------------------------------------------- */

    /**
     * Handle a starship burning fuel
     * @param {Event} event     The original click event
     * @private
     */
    _onDecrementFuelLevel(event) {
        // event.preventDefault();
        // const fuelcaparray = this.actor.data.effects.changes;
        // var fuelcappos = fuelcaparray.indexOf('fuel.cap');
        // const refuel = this.actor.data.effect.changes[fuelcappos].value;
        this.actor.update({"data.attributes.fuel.value": this.actor.data.data.attributes.fuel.value - 1});
    }
    _engineSliderUpdate(input) {
        var symbol;
        var coefficient;
        switch (input.target.value) {
            case "0":
                symbol = "↓";
                coefficient = 0.5;
                break;
            case "1":
                symbol = "=";
                coefficient = 1;
                break;
            case "2":
                symbol = "↑";
                coefficient = 2;
        }
        let slideroutput = symbol;
        document.querySelector("#engineslideroutput").value = slideroutput;
        this.actor.update({"data.attributes.power.routing.engines": coefficient});
    }

    _shieldSliderUpdate(input) {
        var symbol;
        var coefficient;
        switch (input.target.value) {
            case "0":
                symbol = "↓";
                coefficient = 0.5;
                break;
            case "1":
                symbol = "=";
                coefficient = 1;
                break;
            case "2":
                symbol = "↑";
                coefficient = 2;
        }
        let slideroutput = symbol;
        document.querySelector("#shieldslideroutput").value = slideroutput;
        this.actor.update({"data.attributes.power.routing.shields": coefficient});
    }

    _weaponSliderUpdate(input) {
        var symbol;
        var coefficient;
        switch (input.target.value) {
            case "0":
                symbol = "↓";
                coefficient = 0.5;
                break;
            case "1":
                symbol = "=";
                coefficient = 1;
                break;
            case "2":
                symbol = "↑";
                coefficient = 2;
        }
        let slideroutput = symbol;
        document.querySelector("#weaponslideroutput").value = slideroutput;
        this.actor.update({"data.attributes.power.routing.weapons": coefficient});
    }

    /* -------------------------------------------- */

    /** @override */
    async _onDropItemCreate(itemData) {
        // Increment the number of tier of a starship instead of creating a new item
        if (itemData.type === "starship") {
            const tier = this.actor.itemTypes.starship.find((c) => c.name === itemData.name);
            let priorTier = tier?.data.data.tier ?? 0;
            if (!!tier) {
                const next = Math.min(priorTier + 1, 5);
                if (next > priorTier) {
                    itemData.tier = next;
                    return tier.update({"data.tier": next});
                }
            }
        }

        // Default drop handling if levels were not added
        return super._onDropItemCreate(itemData);
    }
}
