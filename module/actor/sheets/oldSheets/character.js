import ActorSheet5e from "./base.js";

/**
 * An Actor sheet for player character type actors in the SW5E system.
 * @extends {ActorSheet5e}
 */
export default class ActorSheet5eCharacter extends ActorSheet5e {
    /**
     * Define default rendering options for the NPC sheet
     * @returns {object}
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sw5e", "sheet", "actor", "character"],
            width: 720,
            height: 736
        });
    }

    /* -------------------------------------------- */

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     * @returns {object}  Prepared copy of the actor data ready to be displayed.
     */
    getData() {
        const sheetData = super.getData();

        // Temporary HP
        let hp = sheetData.data.attributes.hp;
        if (hp.temp === 0) delete hp.temp;
        if (hp.tempmax === 0) delete hp.tempmax;

        // Resources
        sheetData.resources = ["primary", "secondary", "tertiary"].reduce((arr, r) => {
            const res = sheetData.data.resources[r] || {};
            res.name = r;
            res.placeholder = game.i18n.localize(`SW5E.Resource${r.titleCase()}`);
            if (res && res.value === 0) delete res.value;
            if (res && res.max === 0) delete res.max;
            return arr.concat([res]);
        }, []);

        // Experience Tracking
        sheetData.disableExperience = game.settings.get("sw5e", "disableExperienceTracking");
        sheetData.classLabels = this.actor.itemTypes.class.map((c) => c.name).join(", ");
        sheetData.multiclassLabels = this.actor.itemTypes.class
            .map((c) => {
                return [c.data.data.archetype, c.name, c.data.data.levels].filterJoin(" ");
            })
            .join(", ");

        // Weight unit
        sheetData.weightUnit = game.settings.get("sw5e", "metricWeightUnits")
            ? game.i18n.localize("SW5E.AbbreviationKgs")
            : game.i18n.localize("SW5E.AbbreviationLbs");

        // Return data for rendering
        return sheetData;
    }

    /* -------------------------------------------- */

    /**
     * Organize and classify Owned Items for Character sheets
     * @param {object} data  Copy of the actor data being prepared for display. *Will be mutated.*
     * @private
     */
    _prepareItems(data) {
        // Categorize items as inventory, powerbook, features, and classes
        const inventory = {
            weapon: {label: "SW5E.ItemTypeWeaponPl", items: [], dataset: {type: "weapon"}},
            equipment: {label: "SW5E.ItemTypeEquipmentPl", items: [], dataset: {type: "equipment"}},
            consumable: {label: "SW5E.ItemTypeConsumablePl", items: [], dataset: {type: "consumable"}},
            tool: {label: "SW5E.ItemTypeToolPl", items: [], dataset: {type: "tool"}},
            backpack: {label: "SW5E.ItemTypeContainerPl", items: [], dataset: {type: "backpack"}},
            loot: {label: "SW5E.ItemTypeLootPl", items: [], dataset: {type: "loot"}}
        };

        // Partition items by category
        let [
            items,
            powers,
            feats,
            classes,
            species,
            archetypes,
            classfeatures,
            backgrounds,
            fightingstyles,
            fightingmasteries,
            lightsaberforms
        ] = data.items.reduce(
            (arr, item) => {
                // Item details
                item.img = item.img || CONST.DEFAULT_TOKEN;
                item.isStack = Number.isNumeric(item.data.quantity) && item.data.quantity !== 1;
                item.attunement = {
                    [CONFIG.SW5E.attunementTypes.REQUIRED]: {
                        icon: "fa-sun",
                        cls: "not-attuned",
                        title: "SW5E.AttunementRequired"
                    },
                    [CONFIG.SW5E.attunementTypes.ATTUNED]: {
                        icon: "fa-sun",
                        cls: "attuned",
                        title: "SW5E.AttunementAttuned"
                    }
                }[item.data.attunement];

                // Item usage
                item.hasUses = item.data.uses && item.data.uses.max > 0;
                item.isOnCooldown =
                    item.data.recharge && !!item.data.recharge.value && item.data.recharge.charged === false;
                item.isDepleted = item.isOnCooldown && item.data.uses.per && item.data.uses.value > 0;
                item.hasTarget = !!item.data.target && !["none", ""].includes(item.data.target.type);

                // Item toggle state
                this._prepareItemToggleState(item);

                // Primary Class
                if (item.type === "class")
                    item.isOriginalClass = item._id === this.actor.data.data.details.originalClass;

                // Classify items into types
                if (item.type === "power") arr[1].push(item);
                else if (item.type === "feat") arr[2].push(item);
                else if (item.type === "class") arr[3].push(item);
                else if (item.type === "species") arr[4].push(item);
                else if (item.type === "archetype") arr[5].push(item);
                else if (item.type === "classfeature") arr[6].push(item);
                else if (item.type === "background") arr[7].push(item);
                else if (item.type === "fightingstyle") arr[8].push(item);
                else if (item.type === "fightingmastery") arr[9].push(item);
                else if (item.type === "lightsaberform") arr[10].push(item);
                else if (Object.keys(inventory).includes(item.type)) arr[0].push(item);
                return arr;
            },
            [[], [], [], [], [], [], [], [], [], [], []]
        );

        // Apply active item filters
        items = this._filterItems(items, this._filters.inventory);
        powers = this._filterItems(powers, this._filters.powerbook);
        feats = this._filterItems(feats, this._filters.features);

        // Organize items
        for (let i of items) {
            i.data.quantity = i.data.quantity || 0;
            i.data.weight = i.data.weight || 0;
            i.totalWeight = (i.data.quantity * i.data.weight).toNearest(0.1);
            inventory[i.type].items.push(i);
        }

        // Organize Powerbook and count the number of prepared powers (excluding always, at will, etc...)
        const powerbook = this._preparePowerbook(data, powers);
        const nPrepared = powers.filter((s) => {
            return s.data.level > 0 && s.data.preparation.mode === "prepared" && s.data.preparation.prepared;
        }).length;

        // Organize Features
        const features = {
            classes: {
                label: "SW5E.ItemTypeClassPl",
                items: [],
                hasActions: false,
                dataset: {type: "class"},
                isClass: true
            },
            classfeatures: {
                label: "SW5E.ItemTypeClassFeats",
                items: [],
                hasActions: true,
                dataset: {type: "classfeature"},
                isClassfeature: true
            },
            archetype: {
                label: "SW5E.ItemTypeArchetype",
                items: [],
                hasActions: false,
                dataset: {type: "archetype"},
                isArchetype: true
            },
            species: {
                label: "SW5E.ItemTypeSpecies",
                items: [],
                hasActions: false,
                dataset: {type: "species"},
                isSpecies: true
            },
            background: {
                label: "SW5E.ItemTypeBackground",
                items: [],
                hasActions: false,
                dataset: {type: "background"},
                isBackground: true
            },
            fightingstyles: {
                label: "SW5E.ItemTypeFightingStylePl",
                items: [],
                hasActions: false,
                dataset: {type: "fightingstyle"},
                isFightingstyle: true
            },
            fightingmasteries: {
                label: "SW5E.ItemTypeFightingMasteryPl",
                items: [],
                hasActions: false,
                dataset: {type: "fightingmastery"},
                isFightingmastery: true
            },
            lightsaberforms: {
                label: "SW5E.ItemTypeLightsaberFormPl",
                items: [],
                hasActions: false,
                dataset: {type: "lightsaberform"},
                isLightsaberform: true
            },
            active: {
                label: "SW5E.FeatureActive",
                items: [],
                hasActions: true,
                dataset: {"type": "feat", "activation.type": "action"}
            },
            passive: {label: "SW5E.FeaturePassive", items: [], hasActions: false, dataset: {type: "feat"}}
        };
        for (let f of feats) {
            if (f.data.activation.type) features.active.items.push(f);
            else features.passive.items.push(f);
        }
        classes.sort((a, b) => b.data.levels - a.data.levels);
        features.classes.items = classes;
        features.classfeatures.items = classfeatures;
        features.archetype.items = archetypes;
        features.species.items = species;
        features.background.items = backgrounds;
        features.fightingstyles.items = fightingstyles;
        features.fightingmasteries.items = fightingmasteries;
        features.lightsaberforms.items = lightsaberforms;

        // Assign and return
        data.inventory = Object.values(inventory);
        data.powerbook = powerbook;
        data.preparedPowers = nPrepared;
        data.features = Object.values(features);
    }

    /* -------------------------------------------- */

    /**
     * A helper method to establish the displayed preparation state for an item.
     * @param {Item5e} item  Item being prepared for display. *Will be mutated.*
     * @private
     */
    _prepareItemToggleState(item) {
        if (item.type === "power") {
            const isAlways = getProperty(item.data, "preparation.mode") === "always";
            const isPrepared = getProperty(item.data, "preparation.prepared");
            item.toggleClass = isPrepared ? "active" : "";
            if (isAlways) item.toggleClass = "fixed";
            if (isAlways) item.toggleTitle = CONFIG.SW5E.powerPreparationModes.always;
            else if (isPrepared) item.toggleTitle = CONFIG.SW5E.powerPreparationModes.prepared;
            else item.toggleTitle = game.i18n.localize("SW5E.PowerUnprepared");
        } else {
            const isActive = getProperty(item.data, "equipped");
            item.toggleClass = isActive ? "active" : "";
            item.toggleTitle = game.i18n.localize(isActive ? "SW5E.Equipped" : "SW5E.Unequipped");
        }
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers
  /* -------------------------------------------- */

    /**
     * Activate event listeners using the prepared sheet HTML.
     * @param {jQuery} html   The prepared HTML object ready to be rendered into the DOM.
     */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;

        // Item State Toggling
        html.find(".item-toggle").click(this._onToggleItem.bind(this));

        // Short and Long Rest
        html.find(".short-rest").click(this._onShortRest.bind(this));
        html.find(".long-rest").click(this._onLongRest.bind(this));

        // Rollable sheet actions
        html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Handle mouse click events for character sheet actions.
     * @param {MouseEvent} event  The originating click event.
     * @returns {Promise}         Dialog or roll result.
     * @private
     */
    _onSheetAction(event) {
        event.preventDefault();
        const button = event.currentTarget;
        switch (button.dataset.action) {
            case "rollDeathSave":
                return this.actor.rollDeathSave({event: event});
            case "rollInitiative":
                return this.actor.rollInitiative({createCombatants: true});
        }
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
        const attr = item.data.type === "power" ? "data.preparation.prepared" : "data.equipped";
        return item.update({[attr]: !getProperty(item.data, attr)});
    }

    /* -------------------------------------------- */

    /**
     * Take a short rest, calling the relevant function on the Actor instance.
     * @param {Event} event             The triggering click event.
     * @returns {Promise<RestResult>}  Result of the rest action.
     * @private
     */
    async _onShortRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.shortRest();
    }

    /* -------------------------------------------- */

    /**
     * Take a long rest, calling the relevant function on the Actor instance.
     * @param {Event} event             The triggering click event.
     * @returns {Promise<RestResult>}  Result of the rest action.
     * @private
     */
    async _onLongRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.longRest();
    }

    /* -------------------------------------------- */

    /** @override */
    async _onDropItemCreate(itemData) {
        // Increment the number of class levels a character instead of creating a new item
        if (itemData.type === "class") {
            const cls = this.actor.itemTypes.class.find((c) => c.name === itemData.name);
            let priorLevel = cls?.data.data.levels ?? 0;
            if (cls) {
                const next = Math.min(priorLevel + 1, 20 + priorLevel - this.actor.data.data.details.level);
                if (next > priorLevel) {
                    itemData.levels = next;
                    return cls.update({"data.levels": next});
                }
            }
        }

        // Default drop handling if levels were not added
        return super._onDropItemCreate(itemData);
    }
}
