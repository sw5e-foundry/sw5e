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
        // Categorize Items as actions, features, equipment and cargo
        const ssActions = {};
        for (const deploy of Object.keys(SW5E.deploymentTypes))
            ssActions[deploy] = {
                items: [],
                dataset: {type: "starshipaction", deployment: deploy}
            };
        const ssFeatures = {
            starshiptype: {
                label: "SW5E.ItemTypeStarship",
                items: [],
                hasActions: false,
                dataset: {type: "starship"},
                isStarship: true
            },
            passive: {label: game.i18n.localize("SW5E.Features"), items: [], dataset: {type: "feat"}},
            starshipfeatures: {
                label: game.i18n.localize("SW5E.StarshipfeaturePl"),
                items: [],
                hasActions: true,
                dataset: {type: "starshipfeature"}
            }
        };
        const ssEquipment = {
            weapons: {
                label: game.i18n.localize("SW5E.ItemTypeWeaponPl"),
                items: [],
                hasActions: true,
                dataset: {"type": "weapon", "weapon-type": "natural"}
            },
            equipment: {label: game.i18n.localize("SW5E.StarshipEquipment"), items: [], dataset: {type: "equipment"}},
            starshipmods: {
                label: game.i18n.localize("SW5E.StarshipmodPl"),
                items: [],
                hasActions: false,
                dataset: {type: "starshipmod"}
            }
        };
        const ssCargo = {
            weapon: {label: "SW5E.ItemTypeWeaponPl", items: [], dataset: {type: "weapon"}},
            equipment: {label: "SW5E.ItemTypeEquipmentPl", items: [], dataset: {type: "equipment"}},
            consumable: {label: "SW5E.ItemTypeConsumablePl", items: [], dataset: {type: "consumable"}},
            tool: {label: "SW5E.ItemTypeToolPl", items: [], dataset: {type: "tool"}},
            backpack: {label: "SW5E.ItemTypeContainerPl", items: [], dataset: {type: "backpack"}},
            modification: {label: "SW5E.ItemTypeModificationPl", items: [], dataset: {type: "modification"}},
            loot: {label: "SW5E.ItemTypeLootPl", items: [], dataset: {type: "loot"}}
        };

        // Start by classifying items into groups for rendering
        let [actions, features, equipment, cargo] = data.items.reduce(
            (arr, item) => {
                item.img = item.img || CONST.DEFAULT_TOKEN;
                item.isStack = Number.isNumeric(item.data.quantity) && item.data.quantity !== 1;
                item.hasUses = item.data.uses && item.data.uses.max > 0;
                item.isOnCooldown =
                    item.data.recharge && !!item.data.recharge.value && item.data.recharge.charged === false;
                item.isDepleted = item.isOnCooldown && item.data.uses.per && item.data.uses.value > 0;
                item.hasTarget = !!item.data.target && !["none", ""].includes(item.data.target.type);

                // Item toggle state
                this._prepareItemToggleState(item);

                if (item.type === "starshipaction") arr[0].push(item);
                else if (["feat", "starship", "starshipfeature"].includes(item.type)) arr[1].push(item);
                else if (item.data.equipped) arr[2].push(item);
                else arr[3].push(item);

                return arr;
            },
            [[], [], [], []]
        );

        // Apply item filters
        actions = this._filterItems(actions, this._filters.ssactions);
        features = this._filterItems(features, this._filters.features);
        equipment = this._filterItems(equipment, this._filters.ssequipment);
        cargo = this._filterItems(cargo, this._filters.inventory);

        // Organize Starship Actions
        for (const action of actions) ssActions[action.data.deployment].items.push(action);

        // Organize Starship Items and Features
        for (const feature of features) {
            if (feature.type === "feat") {
                if (feature.data.activation.type) ssFeatures.actions.items.push(feature);
                else ssFeatures.passive.items.push(feature);
            } else if (feature.type === "starship") {
                ssFeatures.starshiptype.items.push(feature);
            } else if (feature.type === "starshipfeature") {
                ssFeatures.starshipfeatures.items.push(feature);
            }
        }

        // Organize Starship Equipment
        for (const item of equipment) {
            if (item.type === "weapon") ssEquipment.weapons.items.push(item);
            else if (item.type === "starshipmod") ssEquipment.starshipmods.items.push(item);
            else ssEquipment.equipment.items.push(item);
        }

        // Organize Cargo
        for (const item of cargo) {
            item.data.quantity = item.data.quantity || 0;
            item.data.weight = item.data.weight || 0;
            item.totalWeight = (item.data.quantity * item.data.weight).toNearest(0.1);
            ssCargo[item.type].items.push(item);
        }

        // Assign and return
        data.actions = ssActions;
        data.features = Object.values(ssFeatures);
        data.inventory = Object.values(ssCargo);
        data.equipment = Object.values(ssEquipment);
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

        if (!this._filters.ssactions.has("activeDeploy")) data.showAllActions = true;
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

    /**
     * A helper method to establish the displayed preparation state for an item.
     * @param {Item5e} item  Item being prepared for display. *Will be mutated.*
     * @private
     */
    _prepareItemToggleState(item) {
        if (
            (
                item.type === "equipment" &&
                ["starship", "hyper", "powerc", "reactor", "ssshield"].includes(item.data.armor.type)
            ) || (
                item.type === "weapon" &&
                ["primary (starship)", "secondary (starship)", "tertiary (starship)", "quaternary (starship)"].includes(item.data.weaponType)
            ) || (
                item.type === "starshipmod"
            )
        ) {
            const isActive = getProperty(item.data, "equipped");
            item.toggleClass = isActive ? "active" : "";
            item.toggleTitle = game.i18n.localize(isActive ? "SW5E.Installed" : "SW5E.NotInstalled");
        }
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
        html.find(".powerslider").change("input", this._powerRoutingSliderUpdate.bind(this));
        // Recharge, Refitting and Regen Repairs
        html.find(".recharge-repair").click(this._onRechargeRepair.bind(this));
        html.find(".refitting-repair").click(this._onRefittingRepair.bind(this));
        html.find(".regen-repair").click(this._onRegenRepair.bind(this));
        // Rollable sheet actions
        html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
        // Deployment controls
        html.find(".deploy-control").click(this._onDeployControl.bind(this));
        // Item State Toggling
        html.find(".item-toggle").click(this._onToggleItem.bind(this));
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
            case "rollPowerDie":
                return this.actor.rollPowerDie({slot: event.target.dataset.location});
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
        this.actor.update({"data.attributes.fuel.value": this.actor.data.data.attributes.fuel.fuelCap});
    }

    /* -------------------------------------------- */

    /**
     * Handle a starship burning fuel
     * @param {Event} event     The original click event
     * @private
     */
    _onDecrementFuelLevel(event) {
        // event.preventDefault();
        this.actor.update({"data.attributes.fuel.value": this.actor.data.data.attributes.fuel.value - 1});
    }
    _powerRoutingSliderUpdate(input) {
        let symbol1 = "=";
        let symbol2 = "=";
        let effect1 = "neutral";
        let effect2 = "neutral";
        let coefficient = 1;
        switch (input.target.value) {
            case "0":
                input.target.value = 1;
                break;
            case "2":
                symbol1 = "↑";
                symbol2 = "↓";
                effect1 = "positive";
                effect2 = "negative";
                coefficient = 2;
                break;
        }
        const updates = {};

        for (const routing of Object.keys(CONFIG.SW5E.powerRoutingOpts)) {
            if (routing === input.target.dataset.id) {
                document.querySelector(`#${routing}slideroutput`).value = symbol1;
                document.querySelector(`#${routing}slideroutput`).title = game.i18n.localize(
                    CONFIG.SW5E.powerRoutingEffects[routing][effect1]
                );
                updates[`data.attributes.power.routing.${routing}`] = coefficient;
            } else {
                document.querySelector(`.powerslider.${routing}`).value = 2 - coefficient;
                document.querySelector(`#${routing}slideroutput`).value = symbol2;
                document.querySelector(`#${routing}slideroutput`).title = game.i18n.localize(
                    CONFIG.SW5E.powerRoutingEffects[routing][effect2]
                );
                updates[`data.attributes.power.routing.${routing}`] = 1 / coefficient;
            }
        }
        this.actor.update(updates);
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

    /**
     * Handle toggling the state of an Owned Item within the Actor.
     * @param {Event} event        The triggering click event.
     * @returns {Promise<Item5e>}  Item with the updates applied.
     * @private
     */
    _onToggleItem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const updates = [];
        const val = getProperty(item.data, "data.equipped");

        const {minCrew, installCost, installTime} = this.actor.getInstallationData(itemId);

        // TODO: Change this for a popup confirmation
        ui.notifications.info(game.i18n.format(val ? "SW5E.StarshipUninstallEquip" : "SW5E.StarshipInstallEquip", {
            minCrew: minCrew,
            installCost: installCost,
            installTime: installTime,
        }), {permanent: true});

        if (!val && item.type === "equipment") {
            for (const i of this.actor.data.items) {
                if (i.type === "equipment" && i.data.data.armor.type === item.data.data.armor.type && i.data.data.equipped) {
                    updates.push({"_id": i.id, "data.equipped": false});
                }
            }
        }
        updates.push({"_id": item.id, "data.equipped": !val});

        return this.actor.updateEmbeddedDocuments("Item", updates);
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

        // Only allow 1 starship type per starship
        const toDelete = [];
        if (itemData.type === "starship") {
            for (const item of this.actor.items) {
                if (item.type === "starship") toDelete.push(item.id);
            }
        }
        this.actor.deleteEmbeddedDocuments("Item", toDelete);

        // Default drop handling if levels were not added
        return super._onDropItemCreate(itemData);
    }
}
