import ActorSheet5e from "./base.js";
import {SW5E} from "../../../config.js";
import {fromUuidSynchronous} from "../../../helpers.js";

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

    /* -------------------------------------------- */

    constructor(...args) {
        super(...args);

        this._filters.features.add("activeDeploy");
    }

    /* -------------------------------------------- */

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
        const starshipactions = {};
        for (const deploy of Object.keys(SW5E.deploymentTypes))
            starshipactions[deploy] = {
                items: [],
                dataset: {type: "starshipaction", deployment: deploy}
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
            } else if (item.type === "starshipaction") {
                starshipactions[item.data.deployment].items.push(item);
            } else if (item.type === "starshipfeature") {
                features.starshipfeatures.items.push(item);
            } else if (item.type === "starshipmod") {
                features.starshipmods.items.push(item);
            } else features.equipment.items.push(item);
        }

        // Assign and return
        data.features = Object.values(features);
        data.starshipactions = starshipactions;
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

        if (!this._filters.features.has("activeDeploy")) data.showAllActions = true;
        if (
            Object.entries(this.actor.data.data.attributes.deployment).filter(
                ([key, deploy]) => key != "active" && (deploy.uuid || deploy.items?.length)
            ).length == 0
        ) {
            data.showAllDeployments = true;
        }

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
        // Recharge, Refitting and Regen Repairs
        html.find(".recharge-repair").click(this._onRechargeRepair.bind(this));
        html.find(".refitting-repair").click(this._onRefittingRepair.bind(this));
        html.find(".regen-repair").click(this._onRegenRepair.bind(this));
        // Rollable sheet actions
        html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
        // Deployment controls
        html.find(".deploy-control").click(this._onDeployControl.bind(this));
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
     * Take a regen repair, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @private
     */
    async _onRegenRepair(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.regenRepair();
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
        const hp = new Roll(formula).roll({async: false}).total;
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

    /**
     * Handle control events from a deployed actor
     * @param {Event} event     The original click event
     * @private
     */
    _onDeployControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const li = a.closest("li");
        const key = li.dataset.key;
        const uuid = li.dataset.uuid;
        const deployments = this.actor.data.data.attributes.deployment;
        const deployment = deployments[key];
        switch (a.dataset.action) {
            case "delete":
                if (deployment.items) {
                    const aux1 = deployment.items.filter((e) => e.uuid == uuid);
                    const aux2 = deployment.items.filter((e) => e.uuid != uuid);
                    if (aux1.length && aux1[0].active) deployment.active = false;
                    deployment.items = aux2;
                } else for (const k in deployment) deployment[k] = null;
                const actor = fromUuidSynchronous(uuid);
                if (actor) {
                    const deployed = actor.data.data.attributes.deployed;
                    deployed.deployments = deployed.deployments.filter((e) => e != key);
                    if (!deployed.deployments.length) actor.undeployFromStarship();
                }
                break;
            case "toggle":
                for (const [key, deployment] of Object.entries(deployments)) {
                    if (key == "active") continue;
                    if (deployment.items) {
                        deployment.active = false;
                        for (const deploy of Object.values(deployment.items)) {
                            if (deploy.uuid == uuid) {
                                deploy.active = !deploy.active;
                                deployment.active = deploy.active;
                            } else deploy.active = false;
                        }
                    } else {
                        if (deployment.uuid == uuid) deployment.active = !deployment.active;
                        else deployment.active = false;
                    }
                }
        }
        this.actor.update({"data.attributes.deployment": deployments});
        this.actor.updateActiveDeployment();
    }

    /* -------------------------------------------- */

    /** @override */
    async _onDropActor(event, data) {
        // Get the target actor
        let sourceActor = null;
        if (data.pack) {
            const pack = game.packs.find((p) => p.collection === data.pack);
            sourceActor = await pack.getDocument(data.id);
        } else {
            sourceActor = game.actors.get(data.id);
        }
        if (!sourceActor) return;

        if (!SW5E.deployableTypes.includes(sourceActor.type))
            return ui.notifications.warn(
                game.i18n.format("SW5E.DeploymentInvalidActorType", {
                    actorType: game.i18n.localize(CONFIG.Actor.typeLabels[sourceActor.type])
                })
            );

        // Pre-select the deployment slot with the highest rank
        const preselected = Object.entries(sourceActor.data.data.attributes.rank ?? {}).reduce(
            (prev, cur) => (cur[0] == "total" ? prev : cur[1] > prev[1] ? cur : prev),
            ["passenger", 0]
        )[0];
        const iscrew = preselected != "passenger" ? "crew" : "";

        // Create and render the Dialog
        // Define a function to record starship deployment selections
        const rememberOptions = (html) => {
            let values = [];
            html.find("input").each((i, el) => {
                if (el.checked) values.push(el.name);
            });
            return values;
        };
        return new Dialog(
            {
                title:
                    game.i18n.localize("SW5E.DeploymentPromptTitle") +
                    " " +
                    sourceActor.data.name +
                    " into " +
                    this.actor.data.name,
                content: {
                    i18n: SW5E.deploymentTypes,
                    isToken: this.actor.isToken,
                    preselected: preselected,
                    iscrew: iscrew
                },
                default: "accept",
                buttons: {
                    deploy: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("SW5E.DeploymentAcceptSettings"),
                        callback: (html) => this.actor.deployInto(sourceActor, rememberOptions(html))
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("Cancel")
                    }
                }
            },
            {
                classes: ["dialog", "sw5e"],
                width: 600,
                template: "systems/sw5e/templates/apps/deployment-prompt.html"
            }
        ).render(true);
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
