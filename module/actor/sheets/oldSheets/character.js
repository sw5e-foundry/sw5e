import ActorSheet5e from "./base.js";
import { AdvancementConfirmationDialog } from "../../../advancement/advancement-confirmation-dialog.js";
import { AdvancementManager } from "../../../advancement/advancement-manager.js";


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
            classes: ["sw5e", "sheet", "actor", "character"]
        });
    }

    /* -------------------------------------------- */

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     * @returns {object}  Prepared copy of the actor data ready to be displayed.
     */
    getData() {
        const sheetData = super.getData();

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
        } = data.items.reduce(
            (obj, item) => {
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
            }, {
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
                lightsaberforms: [],
            }
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

        // Sort classes and interleave matching archetypes, put unmatched archetypes into features so they don't disappear
        classes.sort((a, b) => b.data.levels - a.data.levels);
        const maxLevelDelta = CONFIG.SW5E.maxLevel - this.actor.data.data.details.level;
        classes = classes.reduce((arr, cls) => {
            cls.availableLevels = Array.fromRange(CONFIG.SW5E.maxLevel + 1).slice(1).map(level => {
                const delta = level - cls.data.levels;
                return { level, delta, disabled: delta > maxLevelDelta };
            });
            arr.push(cls);
            const archetype = archetypes.findSplice(s => s.data.classIdentifier === cls.data.identifier);
            if ( archetype ) arr.push(archetype);
            return arr;
        }, []);
        for ( const archetype of archetypes ) {
            feats.push(archetype);
            this.actor._preparationWarnings.push(game.i18n.format("SW5E.ArchetypeMismatchWarn", {
                name: archetype.name,
                class: archetype.data.classIdentifier
            }));
        }

        // Organize Features
        const features = {
            background: {
                label: "SW5E.ItemTypeBackground", items: backgrounds,
                hasActions: false, dataset: {type: "background"}, isBackground: true
            },
            classes: {
                label: "SW5E.ItemTypeClassPl", items: classes,
                hasActions: false, dataset: {type: "class"}, isClass: true
            },
            classfeatures: {
                label: "SW5E.ItemTypeClassfeaturePL", items: classfeatures,
                hasActions: true, dataset: {type: "classfeature"}, isClassfeature: true
            },
            species: {
                label: "SW5E.ItemTypeSpecies", items: species,
                hasActions: false, dataset: {type: "species"}, isSpecies: true
            },
            fightingstyles: {
                label: "SW5E.ItemTypeFightingstylePl", items: fightingstyles,
                hasActions: false, dataset: {type: "fightingstyle"}, isFightingstyle: true
            },
            fightingmasteries: {
                label: "SW5E.ItemTypeFightingmasteryPl", items: fightingmasteries,
                hasActions: false, dataset: {type: "fightingmastery"}, isFightingmastery: true
            },
            lightsaberforms: {
                label: "SW5E.ItemTypeLightsaberformPl", items: lightsaberforms,
                hasActions: false, dataset: {type: "lightsaberform"}, isLightsaberform: true
            },
            active: {
                label: "SW5E.FeatureActive", items: [],
                hasActions: true, dataset: {type: "feat", "activation.type": "action"}
            },
            passive: {
                label: "SW5E.FeaturePassive", items: [],
                hasActions: false, dataset: {type: "feat"}
            }
        };

        for (let f of feats) {
            if (f.data.activation?.type) features.active.items.push(f);
            else features.passive.items.push(f);
        }

        // Assign and return
        data.inventory = Object.values(inventory);
        data.powerbook = powerbook;
        data.preparedPowers = nPrepared;
        data.features = Object.values(features);

        // Labels
        data.labels.background = backgrounds[0]?.name;
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

        // Manage Class Levels
        html.find(".level-selector").change(this._onLevelChange.bind(this));

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
     * Respond to a new level being selected from the level selector.
     * @param {Event} event                           The originating change.
     * @returns {Promise<AdvancementManager|Item5e>}  Manager if advancements needed, otherwise updated class item.
     * @private
     */
    async _onLevelChange(event) {
        event.preventDefault();
        const delta = Number(event.target.value);
        const classId = event.target.closest(".item")?.dataset.itemId;
        if ( !delta || !classId ) return;
        const classItem = this.actor.items.get(classId);
        if ( classItem.hasAdvancement && !game.settings.get("sw5e", "disableAdvancements") ) {
            const manager = AdvancementManager.forLevelChange(this.actor, classId, delta);
            if ( manager.steps.length ) {
                if ( delta > 0 ) return manager.render(true);
                try {
                    const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forLevelDown(classItem);
                    if ( shouldRemoveAdvancements ) return manager.render(true);
                } catch(err) {
                    return;
                }
            }
        }
        return classItem.update({"data.levels": classItem.data.data.levels + delta});
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
        if ( itemData.type === "class" ) {
            itemData.data.levels = Math.min(itemData.data.levels,
                CONFIG.SW5E.maxLevel - this.actor.data.data.details.level);
            if ( itemData.data.levels <= 0 ) return ui.notifications.error(
                game.i18n.format("SW5E.MaxCharacterLevelExceededWarn", {max: CONFIG.SW5E.maxLevel})
            );
            const cls = this.actor.itemTypes.class.find(c => c.identifier === itemData.data.identifier);
            if ( cls ) {
                const priorLevel = cls.data.data.levels;
                if ( cls.hasAdvancement && !game.settings.get("sw5e", "disableAdvancements") ) {
                    const manager = AdvancementManager.forLevelChange(this.actor, cls.id, itemData.data.levels);
                    if ( manager.steps.length ) return manager.render(true);
                }
                return cls.update({"data.levels": priorLevel + itemData.data.levels});
            }
        }
        // If a archetype is dropped, ensure it doesn't match another archetype with the same identifier
        else if ( itemData.type === "archetype" ) {
            const other = this.actor.itemTypes.archetype.find(i => i.identifier === itemData.data.identifier);
            if ( other ) {
                return ui.notifications.error(game.i18n.format("SW5E.ArchetypeDuplicateError", {
                    identifier: other.identifier
                }));
            }
            const cls = this.actor.itemTypes.class.find(i => i.identifier === itemData.data.classIdentifier);
            if ( cls && cls.archetype ) {
                return ui.notifications.error(game.i18n.format("SW5E.ArchetypeAssignmentError", {
                    class: cls.name, archetype: cls.archetype.name
                }));
            }
        }
    }
}
