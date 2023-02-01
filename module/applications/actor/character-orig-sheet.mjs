import ActorSheetOrig5e from "./base-orig-sheet.mjs";
import AdvancementConfirmationDialog from "../../advancement/advancement-confirmation-dialog.mjs";
import AdvancementManager from "../../advancement/advancement-manager.mjs";

/**
 * An Actor sheet for player character type actors in the SW5E system.
 */
export default class ActorSheetOrig5eCharacter extends ActorSheetOrig5e {
    /** @inheritDoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sw5e", "sheet", "actor", "character"]
        });
    }

    /* -------------------------------------------- */
    /*  Context Preparation                         */
    /* -------------------------------------------- */

    /** @inheritDoc */
    async getData(options = {}) {
        const context = await super.getData(options);

        // Resources
        context.resources = ["primary", "secondary", "tertiary"].reduce((arr, r) => {
            const res = context.actor.system.resources[r] || {};
            res.name = r;
            res.placeholder = game.i18n.localize(`SW5E.Resource${r.titleCase()}`);
            if (res && res.value === 0) delete res.value;
            if (res && res.max === 0) delete res.max;
            return arr.concat([res]);
        }, []);

        const classes = this.actor.itemTypes.class;
        return foundry.utils.mergeObject(context, {
            disableExperience: game.settings.get("sw5e", "disableExperienceTracking"),
            classLabels: classes.map((c) => c.name).join(", "),
            multiclassLabels: classes
                .map((c) => [c.archetype?.name ?? "", c.name, c.system.levels].filterJoin(" "))
                .join(", "),
            weightUnit: game.i18n.localize(
                `SW5E.Abbreviation${game.settings.get("sw5e", "metricWeightUnits") ? "Kgs" : "Lbs"}`
            )
        });
    }

    /* -------------------------------------------- */

    /** @override */
    _prepareItems(context) {
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
        let {
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
        } = context.items.reduce(
            (obj, item) => {
                const {quantity, uses, recharge, target} = item.system;

                // Item details
                item.img = item.img || CONST.DEFAULT_TOKEN;
                item.isStack = Number.isNumeric(quantity) && quantity !== 1;
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
                }[item.system.attunement];

                // Item usage
                item.hasUses = uses && uses.max > 0;
                item.isOnCooldown = recharge && !!recharge.value && recharge.charged === false;
                item.isDepleted = item.isOnCooldown && uses.per && uses.value > 0;
                item.hasTarget = !!target && !["none", ""].includes(target.type);

                // Item toggle state
                this._prepareItemToggleState(item);

                // Classify items into types
                if (item.type === "power") obj.powers.push(item);
                else if (item.type === "feat") obj.feats.push(item);
                else if (item.type === "class") obj.classes.push(item);
                else if (item.type === "species") obj.species.push(item);
                else if (item.type === "archetype") obj.archetypes.push(item);
                else if (item.type === "classfeature") obj.classfeatures.push(item);
                else if (item.type === "background") obj.backgrounds.push(item);
                else if (item.type === "fightingstyle") obj.fightingstyles.push(item);
                else if (item.type === "fightingmastery") obj.fightingmasteries.push(item);
                else if (item.type === "lightsaberform") obj.lightsaberforms.push(item);
                else if (Object.keys(inventory).includes(item.type)) obj.items.push(item);
                return obj;
            },
            {
                items: [],
                powers: [],
                feats: [],
                classes: [],
                species: [],
                archetypes: [],
                classfeatures: [],
                backgrounds: [],
                fightingstyles: [],
                fightingmasteries: [],
                lightsaberforms: []
            }
        );

        // Apply active item filters
        items = this._filterItems(items, this._filters.inventory);
        powers = this._filterItems(powers, this._filters.powerbook);
        feats = this._filterItems(feats, this._filters.features);

        // Organize items
        for (let i of items) {
            i.system.quantity = i.system.quantity || 0;
            i.system.weight = i.system.weight || 0;
            i.totalWeight = (i.system.quantity * i.system.weight).toNearest(0.1);
            inventory[i.type].items.push(i);
        }

        // Organize Powerbook and count the number of prepared powers (excluding always, at will, etc...)
        const powerbook = this._preparePowerbook(context, powers);
        const nPrepared = powers.filter((power) => {
            const prep = power.system.preparation;
            return power.system.level > 0 && prep.mode === "prepared" && prep.prepared;
        }).length;

        // Sort classes and interleave matching archetypes, put unmatched archetypes into features so they don't disappear
        classes.sort((a, b) => b.system.levels - a.system.levels);
        const maxLevelDelta = CONFIG.SW5E.maxLevel - this.actor.system.details.level;
        classes = classes.reduce((arr, cls) => {
            cls.availableLevels = Array.fromRange(CONFIG.SW5E.maxLevel + 1)
                .slice(1)
                .map((level) => {
                    const delta = level - cls.system.levels;
                    return {level, delta, disabled: delta > maxLevelDelta};
                });
            arr.push(cls);
            const identifier = cls.system.identifier || cls.name.slugify({strict: true});
            const archetype = archetypes.findSplice((s) => s.system.classIdentifier === identifier);
            if (archetype) arr.push(archetype);
            return arr;
        }, []);
        for (const archetype of archetypes) {
            feats.push(archetype);
            const message = game.i18n.format("SW5E.ArchetypeMismatchWarn", {
                name: archetype.name, class: archetype.system.classIdentifier
            });
            context.warnings.push({ message, type: "warning" });
        }

        // Organize Features
        const features = {
            background: {
                label: "SW5E.ItemTypeBackground",
                items: backgrounds,
                hasActions: false,
                dataset: {type: "background"},
                isBackground: true
            },
            classes: {
                label: "SW5E.ItemTypeClassPl",
                items: classes,
                hasActions: false,
                dataset: {type: "class"},
                isClass: true
            },
            classfeatures: {
                label: "SW5E.ItemTypeClassfeaturePL",
                items: classfeatures,
                hasActions: true,
                dataset: {type: "classfeature"},
                isClassfeature: true
            },
            species: {
                label: "SW5E.ItemTypeSpecies",
                items: species,
                hasActions: false,
                dataset: {type: "species"},
                isSpecies: true
            },
            fightingstyles: {
                label: "SW5E.ItemTypeFightingstylePl",
                items: fightingstyles,
                hasActions: false,
                dataset: {type: "fightingstyle"},
                isFightingstyle: true
            },
            fightingmasteries: {
                label: "SW5E.ItemTypeFightingmasteryPl",
                items: fightingmasteries,
                hasActions: false,
                dataset: {type: "fightingmastery"},
                isFightingmastery: true
            },
            lightsaberforms: {
                label: "SW5E.ItemTypeLightsaberformPl",
                items: lightsaberforms,
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
            passive: {
                label: "SW5E.FeaturePassive",
                items: [],
                hasActions: false,
                dataset: {type: "feat"}
            }
        };

        for (const feat of feats) {
            if (feat.system.activation?.type) features.active.items.push(feat);
            else features.passive.items.push(feat);
        }

        // Assign and return
        context.inventory = Object.values(inventory);
        context.powerbook = powerbook;
        context.preparedPowers = nPrepared;
        context.features = Object.values(features);
        context.labels.background = backgrounds[0]?.name;
    }

    /* -------------------------------------------- */

    /**
     * A helper method to establish the displayed preparation state for an item.
     * @param {Item5e} item  Item being prepared for display. *Will be mutated.*
     * @private
     */
    _prepareItemToggleState(item) {
        if (item.type === "power") {
            const prep = item.system.preparation || {};
            const isAlways = prep.mode === "always";
            const isPrepared = !!prep.prepared;
            item.toggleClass = isPrepared ? "active" : "";
            if (isAlways) item.toggleClass = "fixed";
            if (isAlways) item.toggleTitle = CONFIG.SW5E.powerPreparationModes.always;
            else if (isPrepared) item.toggleTitle = CONFIG.SW5E.powerPreparationModes.prepared;
            else item.toggleTitle = game.i18n.localize("SW5E.PowerUnprepared");
        } else {
            const isActive = !!item.system.equipped;
            item.toggleClass = isActive ? "active" : "";
            item.toggleTitle = game.i18n.localize(isActive ? "SW5E.Equipped" : "SW5E.Unequipped");
        }
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /** @inheritDoc */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;
        html.find(".level-selector").change(this._onLevelChange.bind(this));
        html.find(".item-toggle").click(this._onToggleItem.bind(this));
        html.find(".short-rest").click(this._onShortRest.bind(this));
        html.find(".long-rest").click(this._onLongRest.bind(this));
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
     * Respond to a new level being selected from the level selector.
     * @param {Event} event                           The originating change.
     * @returns {Promise<AdvancementManager|Item5e>}  Manager if advancements needed, otherwise updated item.
     * @private
     */
    async _onLevelChange(event) {
        event.preventDefault();
        const delta = Number(event.target.value);
        const itemId = event.target.closest(".item")?.dataset.itemId;
        if (!delta || !itemId) return;
        const item = this.actor.items.get(itemId);

        let attr = null;
        if (item.type === "class") attr = "levels";
        else if (item.type === "deployment") attr = "rank";
        if (!attr) return ui.error(`Unexpected item.type '${item.type}'`);

        if (!game.settings.get("sw5e", "disableAdvancements")) {
            const manager = AdvancementManager.forLevelChange(this.actor, itemId, delta);
            if (manager.steps.length) {
                if (delta > 0) return manager.render(true);
                try {
                    const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forLevelDown(item);
                    if (shouldRemoveAdvancements) return manager.render(true);
                } catch (err) {
                    return;
                }
            }
        }
        return item.update({[`system.${attr}`]: item.system[attr] + delta});
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
        const attr = item.type === "power" ? "system.preparation.prepared" : "system.equipped";
        return item.update({[attr]: !foundry.utils.getProperty(item, attr)});
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
    async _onDropSingleItem(itemData) {
        // Increment the number of class levels a character instead of creating a new item
        if (itemData.type === "class") {
            const charLevel = this.actor.system.details.level;
            itemData.system.levels = Math.min(itemData.system.levels, CONFIG.SW5E.maxLevel - charLevel);
            if (itemData.system.levels <= 0) {
                const err = game.i18n.format("SW5E.MaxCharacterLevelExceededWarn", {max: CONFIG.SW5E.maxLevel});
                ui.notifications.error(err);
                return false;
            }

            const cls = this.actor.itemTypes.class.find((c) => c.identifier === itemData.system.identifier);
            if (cls) {
                const priorLevel = cls.system.levels;
                if (!game.settings.get("sw5e", "disableAdvancements")) {
                    const manager = AdvancementManager.forLevelChange(this.actor, cls.id, itemData.system.levels);
                    if (manager.steps.length) {
                        manager.render(true);
                        return false;
                    }
                }
                cls.update({"system.levels": priorLevel + itemData.system.levels});
                return false;
            }
        }

        // If a archetype is dropped, ensure it doesn't match another archetype with the same identifier
        else if (itemData.type === "archetype") {
            const other = this.actor.itemTypes.archetype.find((i) => i.identifier === itemData.system.identifier);
            if (other) {
                const err = game.i18n.format("SW5E.ArchetypeDuplicateError", {identifier: other.identifier});
                ui.notifications.error(err);
                return false;
            }
            const cls = this.actor.itemTypes.class.find((i) => i.identifier === itemData.system.classIdentifier);
            if (cls && cls.archetype) {
                const err = game.i18n.format("SW5E.ArchetypeAssignmentError", {
                    class: cls.name,
                    archetype: cls.archetype.name
                });
                ui.notifications.error(err);
                return false;
            }
        }
        return super._onDropSingleItem(itemData);
    }
}
