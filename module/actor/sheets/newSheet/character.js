import ActorSheet5e from "./base.js";
import { AdvancementConfirmationDialog } from "../../../advancement/advancement-confirmation-dialog.js";
import { AdvancementManager } from "../../../advancement/advancement-manager.js";


/**
 * An Actor sheet for player character type actors in the SW5E system.
 * @extends {ActorSheet5e}
 */
export default class ActorSheet5eCharacterNew extends ActorSheet5e {
    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sw5e/templates/actors/newActor/limited-sheet.html";
        return "systems/sw5e/templates/actors/newActor/character-sheet.html";
    }
    /**
     * Define default rendering options for the NPC sheet.
     * @returns {object}
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["swalt", "sw5e", "sheet", "actor", "character"],
            blockFavTab: true,
            subTabs: null,
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
            modification: {label: "SW5E.ItemTypeModificationPl", items: [], dataset: {type: "modification"}},
            loot: {label: "SW5E.ItemTypeLootPl", items: [], dataset: {type: "loot"}}
        };

        // Partition items by category
        let {
            items,
            forcepowers,
            techpowers,
            feats,
            classes,
            deployments,
            deploymentfeatures,
            ventures,
            species,
            archetypes,
            classfeatures,
            backgrounds,
            fightingstyles,
            fightingmasteries,
            lightsaberforms,
            ssfeats
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
                if (item.type === "power" && ["lgt", "drk", "uni"].includes(item.data.school)) obj.forcepowers.push(item);
                else if (item.type === "power" && ["tec"].includes(item.data.school)) obj.techpowers.push(item);
                else if (item.type === "feat") obj.feats.push(item);
                else if (item.type === "class") obj.classes.push(item);
                else if (item.type === "deployment") obj.deployments.push(item);
                else if (item.type === "deploymentfeature") obj.deploymentfeatures.push(item);
                else if (item.type === "venture") obj.ventures.push(item);
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
                forcepowers: [],
                techpowers: [],
                feats: [],
                classes: [],
                deployments: [],
                deploymentfeatures: [],
                ventures: [],
                species: [],
                archetypes: [],
                classfeatures: [],
                backgrounds: [],
                fightingstyles: [],
                fightingmasteries: [],
                lightsaberforms: [],
                ssfeats: [],
            }
        );

        // Apply active item filters
        items = this._filterItems(items, this._filters.inventory);
        forcepowers = this._filterItems(forcepowers, this._filters.forcePowerbook);
        techpowers = this._filterItems(techpowers, this._filters.techPowerbook);
        feats = this._filterItems(feats, this._filters.features);
        ssfeats = this._filterItems(ssfeats, this._filters.ssfeatures);

        // Organize items
        for (let i of items) {
            i.data.quantity = i.data.quantity || 0;
            i.data.weight = i.data.weight || 0;
            i.totalWeight = (i.data.quantity * i.data.weight).toNearest(0.1);
            inventory[i.type].items.push(i);
        }

        // Organize Powerbook and count the number of prepared powers (excluding always, at will, etc...)
        const forcePowerbook = this._preparePowerbook(data, forcepowers, "uni");
        const techPowerbook = this._preparePowerbook(data, techpowers, "tec");

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

        // Organize Starship Features
        deployments.sort((a, b) => b.data.rank - a.data.rank);
        const maxRankDelta = CONFIG.SW5E.maxRank - this.actor.data.data.details.ranks;
        deployments = deployments.reduce((arr, dep) => {
            dep.availableRanks = Array.fromRange(CONFIG.SW5E.maxIndividualRank + 1).slice(1).map(rank => {
                const delta = rank - dep.data.rank;
                return { rank, delta, disabled: delta > maxRankDelta };
            });
            arr.push(dep);
            return arr;
        }, []);
        const ssfeatures = {
            deployments: {
                label: "SW5E.ItemTypeDeploymentPl", items: deployments,
                hasActions: false, dataset: {type: "deployment"}, isDeployment: true
            },
            deploymentfeatures: {
                label: "SW5E.ItemTypeDeploymentfeaturePl", items: deploymentfeatures,
                hasActions: true, dataset: {type: "deploymentfeature"}, isDeploymentfeature: true
            },
            ventures: {
                label: "SW5E.ItemTypeVenturePl", items: ventures,
                hasActions: false, dataset: {type: "venture"}, isVenture: true
            }
        };

        // Assign and return
        data.inventory = Object.values(inventory);
        data.forcePowerbook = forcePowerbook;
        data.techPowerbook = techPowerbook;
        data.features = Object.values(features);
        data.ssfeatures = Object.values(ssfeatures);

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

        // Manage Class Levels and Deployment Ranks
        html.find(".level-selector").change(this._onLevelChange.bind(this));

        // Inventory Functions
        // html.find(".currency-convert").click(this._onConvertCurrency.bind(this));

        // Item State Toggling
        html.find(".item-toggle").click(this._onToggleItem.bind(this));

        // Short and Long Rest
        html.find(".short-rest").click(this._onShortRest.bind(this));
        html.find(".long-rest").click(this._onLongRest.bind(this));

        // Rollable sheet actions
        html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));

        // Send Languages to Chat onClick
        html.find('[data-options="share-languages"]').click((event) => {
            event.preventDefault();
            let langs = this.actor.data.data.traits.languages.value
                .map((l) => CONFIG.SW5E.languages[l] || l)
                .join(", ");
            let custom = this.actor.data.data.traits.languages.custom;
            if (custom) langs += ", " + custom.replace(/;/g, ",");
            let content = `
        <div class="sw5e chat-card item-card" data-acor-id="${this.actor.data._id}">
          <header class="card-header flexrow">
            <img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
            <h3>Known Languages</h3>
          </header>
          <div class="card-content">${langs}</div>
        </div>
      `;

            // Send to Chat
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (rollMode === "blindroll") rollBlind = true;
            let data = {
                user: game.user.data._id,
                content: content,
                blind: rollBlind,
                speaker: {
                    actor: this.actor.data._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            };

            if (["gmroll", "blindroll"].includes(rollMode)) data["whisper"] = ChatMessage.getWhisperRecipients("GM");
            else if (rollMode === "selfroll") data["whisper"] = [game.users.get(game.user.data._id)];

            ChatMessage.create(data);
        });

        // Item Delete Confirmation
        html.find(".item-delete").off("click");
        html.find(".item-delete").click((event) => {
            let li = $(event.currentTarget).parents(".item");
            let itemId = li.attr("data-item-id");
            let item = this.actor.items.get(itemId);
            new Dialog({
                title: `Deleting ${item.data.name}`,
                content: `<p>Are you sure you want to delete ${item.data.name}?</p>`,
                buttons: {
                    Yes: {
                        icon: '<i class="fa fa-check"></i>',
                        label: "Yes",
                        callback: (dlg) => {
                            item.delete();
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "No"
                    }
                },
                default: "cancel"
            }).render(true);
        });
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
        if ( !delta || !itemId ) return;
        const item = this.actor.items.get(itemId);

        let attr = null;
        if (item.type === "class") attr = "levels";
        else if (item.type === "deployment") attr = "rank";
        if (!attr) return ui.error(`Unexpected item.type '${item.type}'`);

        if ( item.hasAdvancement && !game.settings.get("sw5e", "disableAdvancements") ) {
            const manager = AdvancementManager.forLevelChange(this.actor, itemId, delta);
            if ( manager.steps.length ) {
                if ( delta > 0 ) return manager.render(true);
                try {
                    const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forLevelDown(item);
                    if ( shouldRemoveAdvancements ) return manager.render(true);
                } catch(err) {
                    return;
                }
            }
        }
        return item.update({[`data.${attr}`]: item.data.data[attr] + delta});
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
            console.debug('character.js | _onDropItemCreate');
            console.debug('itemData.data.levels', itemData.data.levels);
            console.debug('CONFIG.SW5E.maxLevel', CONFIG.SW5E.maxLevel);
            console.debug('this.actor.data.data.details.level', this.actor.data.data.details.level);
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

        // Default drop handling if levels were not added
        return super._onDropItemCreate(itemData);
    }
}


async function addFavorites(app, html, data) {
    // Thisfunction is adapted for the SwaltSheet from the Favorites Item
    // Tab Module created for Foundry VTT - by Felix Müller (Felix#6196 on Discord).
    // It is licensed under a Creative Commons Attribution 4.0 International License
    // and can be found at https://github.com/syl3r86/favtab.
    let favItems = [];
    let favFeats = [];
    let favPowers = {
        0: {
            isCantrip: true,
            powers: []
        },
        1: {
            powers: [],
            value: data.actor.data.powers.power1.value,
            max: data.actor.data.powers.power1.max
        },
        2: {
            powers: [],
            value: data.actor.data.powers.power2.value,
            max: data.actor.data.powers.power2.max
        },
        3: {
            powers: [],
            value: data.actor.data.powers.power3.value,
            max: data.actor.data.powers.power3.max
        },
        4: {
            powers: [],
            value: data.actor.data.powers.power4.value,
            max: data.actor.data.powers.power4.max
        },
        5: {
            powers: [],
            value: data.actor.data.powers.power5.value,
            max: data.actor.data.powers.power5.max
        },
        6: {
            powers: [],
            value: data.actor.data.powers.power6.value,
            max: data.actor.data.powers.power6.max
        },
        7: {
            powers: [],
            value: data.actor.data.powers.power7.value,
            max: data.actor.data.powers.power7.max
        },
        8: {
            powers: [],
            value: data.actor.data.powers.power8.value,
            max: data.actor.data.powers.power8.max
        },
        9: {
            powers: [],
            value: data.actor.data.powers.power9.value,
            max: data.actor.data.powers.power9.max
        }
    };

    let powerCount = 0;
    let items = data.actor.items;
    for (let item of items) {
        if (item.type == "class") continue;
        if (item.flags.favtab === undefined || item.flags.favtab.isFavourite === undefined) {
            item.flags.favtab = {
                isFavourite: false
            };
        }
        let isFav = item.flags.favtab.isFavourite;
        if (app.options.editable) {
            let favBtn = $(
                `<a class="item-control item-toggle item-fav ${isFav ? "active" : ""}" data-fav="${isFav}" title="${
                    isFav ? "Remove from Favourites" : "Add to Favourites"
                }"><i class="fas fa-star"></i></a>`
            );
            favBtn.click((ev) => {
                app.actor.items.get(item.data._id).update({
                    "flags.favtab.isFavourite": !item.flags.favtab.isFavourite
                });
            });
            html.find(`.item[data-item-id="${item.data._id}"]`).find(".item-controls").prepend(favBtn);
        }

        if (isFav) {
            item.powerComps = "";
            if (item.data.components) {
                let comps = item.data.components;
                let v = comps.vocal ? "V" : "";
                let s = comps.somatic ? "S" : "";
                let m = comps.material ? "M" : "";
                let c = !!comps.concentration;
                let r = !!comps.ritual;
                item.powerComps = `${v}${s}${m}`;
                item.powerCon = c;
                item.powerRit = r;
            }

            item.editable = app.options.editable;
            switch (item.type) {
                case "feat":
                    if (item.flags.favtab.sort === undefined) {
                        item.flags.favtab.sort = (favFeats.count + 1) * 100000; // initial sort key if not present
                    }
                    favFeats.push(item);
                    break;
                case "power":
                    if (item.data.preparation.mode) {
                        item.powerPrepMode = ` (${CONFIG.SW5E.powerPreparationModes[item.data.preparation.mode]})`;
                    }
                    if (item.data.level) {
                        favPowers[item.data.level].powers.push(item);
                    } else {
                        favPowers[0].powers.push(item);
                    }
                    powerCount++;
                    break;
                default:
                    if (item.flags.favtab.sort === undefined) {
                        item.flags.favtab.sort = (favItems.count + 1) * 100000; // initial sort key if not present
                    }
                    favItems.push(item);
                    break;
            }
        }
    }

    // Alter core CSS to fit new button
    // if (app.options.editable) {
    //   html.find('.powerbook .item-controls').css('flex', '0 0 88px');
    //   html.find('.inventory .item-controls, .features .item-controls').css('flex', '0 0 90px');
    //   html.find('.favourite .item-controls').css('flex', '0 0 22px');
    // }

    let tabContainer = html.find(".favtabtarget");
    data.favItems = favItems.length > 0 ? favItems.sort((a, b) => a.flags.favtab.sort - b.flags.favtab.sort) : false;
    data.favFeats = favFeats.length > 0 ? favFeats.sort((a, b) => a.flags.favtab.sort - b.flags.favtab.sort) : false;
    data.favPowers = powerCount > 0 ? favPowers : false;
    data.editable = app.options.editable;

    await loadTemplates(["systems/sw5e/templates/actors/newActor/item.hbs"]);
    let favtabHtml = $(await renderTemplate("systems/sw5e/templates/actors/newActor/template.hbs", data));
    favtabHtml.find(".item-name h4").click((event) => app._onItemSummary(event));

    if (app.options.editable) {
        favtabHtml.find(".item-image").click((ev) => app._onItemRoll(ev));
        let handler = (ev) => app._onDragStart(ev);
        favtabHtml.find(".item").each((i, li) => {
            if (li.classList.contains("inventory-header")) return;
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });
        //favtabHtml.find('.item-toggle').click(event => app._onToggleItem(event));
        favtabHtml.find(".item-edit").click((ev) => {
            let itemId = $(ev.target).parents(".item")[0].dataset.itemId;
            app.actor.items.get(itemId).sheet.render(true);
        });
        favtabHtml.find(".item-fav").click((ev) => {
            let itemId = $(ev.target).parents(".item")[0].dataset.itemId;
            let val = !app.actor.items.get(itemId).data.flags.favtab.isFavourite;
            app.actor.items.get(itemId).update({
                "flags.favtab.isFavourite": val
            });
        });

        // Sorting
        favtabHtml.find(".item").on("drop", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            let dropData = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"));
            // if (dropData.actorId !== app.actor.id || dropData.data.type === 'power') return;
            if (dropData.actorId !== app.actor.id) return;
            let list = null;
            if (dropData.data.type === "feat") list = favFeats;
            else list = favItems;
            let dragSource = list.find((i) => i.data._id === dropData.data._id);
            let siblings = list.filter((i) => i.data._id !== dropData.data._id);
            let targetId = ev.target.closest(".item").dataset.itemId;
            let dragTarget = siblings.find((s) => s.data._id === targetId);

            if (dragTarget === undefined) return;
            const sortUpdates = SortingHelpers.performIntegerSort(dragSource, {
                target: dragTarget,
                siblings: siblings,
                sortKey: "flags.favtab.sort"
            });
            const updateData = sortUpdates.map((u) => {
                const update = u.update;
                update._id = u.target.data._id;
                return update;
            });
            app.actor.updateEmbeddedDocuments("Item", updateData);
        });
    }
    tabContainer.append(favtabHtml);
    // if(app.options.editable) {
    //   let handler = ev => app._onDragItemStart(ev);
    //   tabContainer.find('.item').each((i, li) => {
    //     if (li.classList.contains("inventory-header")) return;
    //     li.setAttribute("draggable", true);
    //     li.addEventListener("dragstart", handler, false);
    //   });
    //}
    // try {
    //   if (game.modules.get("betterrolls5e") && game.modules.get("betterrolls5e").active) BetterRolls.addItemContent(app.object, favtabHtml, ".item .item-name h4", ".item-properties", ".item > .rollable div");
    // }
    // catch (err) {
    //   // Better Rolls not found!
    // }
    Hooks.callAll("renderedSwaltSheet", app, html, data);
}

async function addSubTabs(app, html, data) {
    if (data.options.subTabs == null) {
        //let subTabs = []; //{subgroup: '', target: '', active: false}
        data.options.subTabs = {};
        html.find("[data-subgroup-selection] [data-subgroup]").each((idx, el) => {
            let subgroup = el.getAttribute("data-subgroup");
            let target = el.getAttribute("data-target");
            let targetObj = {target: target, active: el.classList.contains("active")};
            if (data.options.subTabs.hasOwnProperty(subgroup)) {
                data.options.subTabs[subgroup].push(targetObj);
            } else {
                data.options.subTabs[subgroup] = [];
                data.options.subTabs[subgroup].push(targetObj);
            }
        });
    }

    for (const group in data.options.subTabs) {
        data.options.subTabs[group].forEach((tab) => {
            if (tab.active) {
                html.find(`[data-subgroup=${group}][data-target=${tab.target}]`).addClass("active");
            } else {
                html.find(`[data-subgroup=${group}][data-target=${tab.target}]`).removeClass("active");
            }
        });
    }

    html.find("[data-subgroup-selection]")
        .children()
        .on("click", (event) => {
            let subgroup = event.target.closest("[data-subgroup]").getAttribute("data-subgroup");
            let target = event.target.closest("[data-target]").getAttribute("data-target");
            html.find(`[data-subgroup=${subgroup}]`).removeClass("active");
            html.find(`[data-subgroup=${subgroup}][data-target=${target}]`).addClass("active");
            let tabId = data.options.subTabs[subgroup].find((tab) => {
                return tab.target == target;
            });
            data.options.subTabs[subgroup].map((el) => {
                el.active = el.target == target;
                return el;
            });
        });
}

Hooks.on("renderActorSheet5eCharacterNew", (app, html, data) => {
    addFavorites(app, html, data);
    addSubTabs(app, html, data);
});
