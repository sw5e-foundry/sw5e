import ActorSheet5e from "./base-sheet.mjs";

/**
 * An Actor sheet for NPC type characters in the SW5E system.
 */
export default class ActorSheet5eNPC extends ActorSheet5e {
    /** @override */
    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sw5e/templates/actors/newActor/limited-sheet.hbs";
        return `systems/sw5e/templates/actors/newActor/npc-sheet.hbs`;
    }

    /** @inheritDoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sw5e", "sheet", "actor", "npc"],
            width: 800,
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

    /** @override */
    static unsupportedItemTypes = new Set([
        "background",
        "class",
        "archetype",
        "starship",
        "starshipaction",
        "starshipfeature",
        "starshipmod"
    ]);

    /* -------------------------------------------- */
    /*  Context Preparation                         */
    /* -------------------------------------------- */

    /** @inheritDoc */
    async getData(options) {
        const context = await super.getData(options);

        // Challenge Rating
        const cr = parseFloat(context.system.details.cr ?? 0);
        const crLabels = {0: "0", 0.125: "1/8", 0.25: "1/4", 0.5: "1/2"};

        return foundry.utils.mergeObject(context, {
            labels: {
                cr: cr >= 1 ? String(cr) : crLabels[cr] ?? 1,
                type: this.actor.constructor.formatCreatureType(context.system.details.type),
                armorType: this.getArmorLabel()
            }
        });
    }

    /* -------------------------------------------- */

    /** @override */
    _prepareItems(context) {
        // Categorize Items as Features and Powers
        const features = {
            weapons: {
                label: game.i18n.localize("SW5E.AttackPl"),
                items: [],
                hasActions: true,
                dataset: {"type": "weapon", "weapon-type": "natural"}
            },
            actions: {
                label: game.i18n.localize("SW5E.ActionPl"),
                items: [],
                hasActions: true,
                dataset: {"type": "feat", "activation.type": "action"}
            },
            passive: {label: game.i18n.localize("SW5E.Features"), items: [], dataset: {type: "feat"}},
            equipment: {label: game.i18n.localize("SW5E.Inventory"), items: [], dataset: {type: "loot"}}
        };

        // Start by classifying items into groups for rendering
        let [forcepowers, techpowers, deployments, deploymentfeatures, ventures, other, ssfeats] = context.items.reduce(
            (arr, item) => {
                const {quantity, uses, recharge, target, school} = item.system;
                item.img = item.img || CONST.DEFAULT_TOKEN;
                item.isStack = Number.isNumeric(quantity) && quantity !== 1;
                item.hasUses = uses && uses.max > 0;
                item.isOnCooldown = recharge && !!recharge.value && recharge.charged === false;
                item.isDepleted = item.isOnCooldown && uses.per && uses.value > 0;
                item.hasTarget = !!target && !["none", ""].includes(target.type);
                if (item.type === "power" && ["lgt", "drk", "uni"].includes(school)) arr[0].push(item);
                else if (item.type === "power" && ["tec"].includes(school)) arr[1].push(item);
                else if (item.type === "deployment") arr[2].push(item);
                else if (item.type === "deploymentfeature") arr[3].push(item);
                else if (item.type === "venture") arr[4].push(item);
                else arr[5].push(item);
                return arr;
            },
            [[], [], [], [], [], [], []]
        );

        // Apply item filters
        forcepowers = this._filterItems(forcepowers, this._filters.forcePowerbook);
        techpowers = this._filterItems(techpowers, this._filters.techPowerbook);
        ssfeats = this._filterItems(ssfeats, this._filters.ssfeatures);
        other = this._filterItems(other, this._filters.features);

        // Organize Powerbook
        const forcePowerbook = this._preparePowerbook(context, forcepowers, "uni");
        const techPowerbook = this._preparePowerbook(context, techpowers, "tec");

        // Organize Features
        for (let item of other) {
            if (item.type === "weapon") features.weapons.items.push(item);
            else if (item.type === "feat") {
                if (item.system.activation.type) features.actions.items.push(item);
                else features.passive.items.push(item);
            } else features.equipment.items.push(item);
        }
        // Organize Starship Features
        const ssfeatures = {
            deployments: {
                label: "SW5E.ItemTypeDeploymentPl",
                items: [],
                hasActions: false,
                dataset: {type: "deployment"},
                isDeployment: true
            },
            deploymentfeatures: {
                label: "SW5E.ItemTypeDeploymentfeaturePl",
                items: [],
                hasActions: true,
                dataset: {type: "deploymentfeature"},
                isDeploymentfeature: true
            },
            ventures: {
                label: "SW5E.ItemTypeVenturePl",
                items: [],
                hasActions: false,
                dataset: {type: "venture"},
                isVenture: true
            },
            active: {
                label: "SW5E.FeatureActive",
                items: [],
                hasActions: true,
                dataset: {"type": "feat", "activation.type": "action"}
            },
            passive: {label: "SW5E.FeaturePassive", items: [], hasActions: false, dataset: {type: "feat"}}
        };
        for (let ssf of ssfeats) {
            if (ssf.system.activation.type) ssfeatures.active.items.push(ssf);
            else ssfeatures.passive.items.push(ssf);
        }
        deployments.sort((a, b) => b.system.rank - a.system.rank);
        ssfeatures.deployments.items = deployments;
        ssfeatures.deploymentfeatures.items = deploymentfeatures;
        ssfeatures.ventures.items = ventures;

        // Assign and return
        context.features = Object.values(features);
        context.forcePowerbook = forcePowerbook;
        context.techPowerbook = techPowerbook;
        context.ssfeatures = Object.values(ssfeatures);
    }

    /* -------------------------------------------- */

    /**
     * Format NPC armor information into a localized string.
     * @returns {string}  Formatted armor label.
     */
    getArmorLabel() {
        const ac = this.actor.system.attributes.ac;
        const label = [];
        if (ac.calc === "default") label.push(this.actor.armor?.name || game.i18n.localize("SW5E.ArmorClassUnarmored"));
        else label.push(game.i18n.localize(CONFIG.SW5E.armorClasses[ac.calc].label));
        if (this.actor.shield) label.push(this.actor.shield.name);
        return label.filterJoin(", ");
    }

    /* -------------------------------------------- */
    /*  Object Updates                              */
    /* -------------------------------------------- */

    /** @inheritDoc */
    async _updateObject(event, formData) {
        // Format NPC Challenge Rating
        const crs = {"1/8": 0.125, "1/4": 0.25, "1/2": 0.5};
        let crv = "system.details.cr";
        let cr = formData[crv];
        cr = crs[cr] || parseFloat(cr);
        if (cr) formData[crv] = cr < 1 ? cr : parseInt(cr);

        // Parent ActorSheet update steps
        return super._updateObject(event, formData);
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /** @inheritDoc */
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".health .rollable").click(this._onRollHPFormula.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Handle rolling NPC health values using the provided formula.
     * @param {Event} event  The original click event.
     * @private
     */
    _onRollHPFormula(event) {
        event.preventDefault();
        const formula = this.actor.system.attributes.hp.formula;
        if (!formula) return;
        const hp = new Roll(formula).roll({async: false}).total;
        AudioHelper.play({src: CONFIG.sounds.dice});
        this.actor.update({"system.attributes.hp.value": hp, "system.attributes.hp.max": hp});
    }

    /* -------------------------------------------- */

    /** @override */
    async _onDropItemCreate(itemData) {
        // Increment the number of deployment ranks of a character instead of creating a new item
        if (itemData.type === "deployment") {
            const rnk = this.actor.itemTypes.deployment.find((c) => c.name === itemData.name)?.system?.rank ?? 999;
            if (rnk < 5) return rnk.update({"system.rank": rnk + 1});
        }

        // Create the owned item as normal
        return super._onDropItemCreate(itemData);
    }
}
