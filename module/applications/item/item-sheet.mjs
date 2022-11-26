import AdvancementManager from "../../advancement/advancement-manager.mjs";
import ProficiencySelector from "../proficiency-selector.mjs";
import TraitSelector from "../trait-selector.mjs";
import CheckboxSelect from "../actor/checkbox-select.mjs";
import ActiveEffect5e from "../../documents/active-effect.mjs";
import Item5e from "../../documents/item.mjs";

/**
 * Override and extend the core ItemSheet implementation to handle specific item types.
 */
export default class ItemSheet5e extends ItemSheet {
    constructor(...args) {
        super(...args);

        // Expand the default size of the class sheet
        if (this.object.type === "class") {
            this.options.width = this.position.width = 600;
            this.options.height = this.position.height = 680;
        } else if (this.object.type === "archetype") {
            this.options.height = this.position.height = 540;
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 560,
            height: 400,
            classes: ["sw5e", "sheet", "item"],
            resizable: true,
            scrollY: [".tab.details"],
            tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
            dragDrop: [{dragSelector: "[data-effect-id]", dropSelector: ".effects-list"}, {dragSelector: ".item-list .item", dropSelector: null}],
        });
    }

    /* -------------------------------------------- */

    /**
     * Whether advancements on embedded items should be configurable.
     * @type {boolean}
     */
    advancementConfigurationMode = false;

    /* -------------------------------------------- */

    /** @inheritdoc */
    get template() {
        return `systems/sw5e/templates/items/${this.item.type}.hbs`;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    get isEditable() {
        // TODO: Remove this and make fake modification items update their data on the modified item
        if (this.item.system.fakeItem) return false;
        return super.isEditable;
    }

    /* -------------------------------------------- */
    /*  Context Preparation                         */
    /* -------------------------------------------- */

    /** @override */
    async getData(options) {
        let context = await super.getData(options);
        const item = context.item;
        const source = item.toObject();
        const isMountable = this._isItemMountable(item);

        // Possibly Don't need this?
        const actor = item.actor;

        let wpnType, armorType, ammoType;
        let isStarshipAmmo, isStarshipArmor, isStarshipShield, isStarshipReactor, isStarshipHyperdrive, isStarshipWeapon, isStarshipEquipment, isStarshipPowerCoupling;

        foundry.utils.mergeObject(context, {
            source: source.system,
            system: item.system,
            labels: item.labels,
            isEmbedded: item.isEmbedded,
            advancementEditable: (this.advancementConfigurationMode || !item.isEmbedded) && context.editable,

            // Item Type, Status, and Details
            itemType: game.i18n.localize(`ITEM.Type${item.type.titleCase()}`),
            itemStatus: this._getItemStatus(),
            itemProperties: this._getItemProperties(),
            baseItems: await this._getItemBaseTypes(),
            isPhysical: item.system.hasOwnProperty("quantity"),

            // Enrich HTML description
            descriptionHTML: await TextEditor.enrichHTML(item.system.description?.value, {
                secrets: item.isOwner,
                async: true,
                relativeTo: this.item
            }),

            // Enrich HTML invocations
            invocationsHTML: await TextEditor.enrichHTML(item.system.invocations?.value, {
                secrets: item.isOwner,
                async: true,
                relativeTo: this.item
            }),

            // Enrich HTML flavor
            atFlavorTextHTML: await TextEditor.enrichHTML(item.system.atFlavorText?.value, {
                secrets: item.isOwner,
                async: true,
                relativeTo: this.item
            }),

            // Enrich HTML Traits
            traitsHTML: await TextEditor.enrichHTML(item.system.traits?.value, {
                secrets: item.isOwner,
                async: true,
                relativeTo: this.item
            }),

            // Action Details
            hasAttackRoll: item.hasAttack,
            isHealing: item.system.actionType === "heal",
            isFlatDC: item.system.save?.scaling === "flat",
            isLine: ["line", "wall"].includes(item.system.target?.type),
            critical: item.system.critical,

            // Vehicles
            wpnType: wpnType = item.system?.weaponType ?? "",
            armorType: armorType = item.system?.armor?.type ?? "",
            ammoType: ammoType = item.system?.consumableType === "ammo" ? item.system?.ammoType ?? "" : "",
            isStarshipWeapon: isStarshipWeapon = (wpnType in CONFIG.SW5E.weaponStarshipTypes),
            isStarshipAmmo: isStarshipAmmo = (ammoType in CONFIG.SW5E.ammoStarshipTypes),
            isStarshipArmor: isStarshipArmor = (armorType === "starship"),
            isStarshipShield: isStarshipShield = (armorType === "ssshield"),
            isStarshipHyperdrive: isStarshipHyperdrive = (armorType === "hyper"),
            isStarshipPowerCoupling: isStarshipPowerCoupling = (armorType === "powerc"),
            isStarshipReactor: isStarshipReactor = (armorType === "reactor"),
            isStarshipEquipment:
                isStarshipArmor ||
                isStarshipShield ||
                isStarshipHyperdrive ||
                isStarshipPowerCoupling ||
                isStarshipReactor,
            isCrewed: item.system.activation?.type === "crew",
            isMountable,

            // Armor Class
            isArmor: item.isArmor,
            hasAC: item.isArmor || isMountable,
            hasDexModifier: item.isArmor && item.system.armor?.type !== "shield",

            // Advancement
            advancement: this._getItemAdvancement(item),

            // Prepare Active Effects
            effects: ActiveEffect5e.prepareActiveEffectCategories(item.effects)
        });

        // Set up config with proper power components
        context.config = foundry.utils.mergeObject(
            CONFIG.SW5E,
            {
                powerComponents: {...CONFIG.SW5E.powerComponents, ...CONFIG.SW5E.powerTags}
            },
            {inplace: false}
        );

        //TODO: See if there is a way to get it into merge object for consistency
        // Weapon Properties
        if (item.consumableType === "ammo") {
            context.wpnProperties = context.isStarshipAmmo
                ? CONFIG.SW5E.weaponFullStarshipProperties
                : CONFIG.SW5E.weaponFullCharacterProperties;
        }
        if (item.type === "weapon") {
            context.wpnProperties = context.isStarshipWeapon
                ? CONFIG.SW5E.weaponFullStarshipProperties
                : CONFIG.SW5E.weaponFullCharacterProperties;
            context = this._getWeaponReloadProperties(context);
        }

        // Armor Class
        if (item.type === "equipment") {
            if (item.system.armor.type in CONFIG.SW5E.armorTypes) context.equipProperties = CONFIG.SW5E.armorProperties;
            if (item.system.armor.type in CONFIG.SW5E.castingEquipmentTypes)
                context.equipProperties = CONFIG.SW5E.castingProperties;
        }

        // Modification Properties
        if (this.item.type === "modification") {
            context.isEquipMod = item.system.modificationType in CONFIG.SW5E.modificationTypesEquipment;
            context.isWpnMod = item.system.modificationType in CONFIG.SW5E.modificationTypesWeapon;
            context.isCastMod = item.system.modificationType in CONFIG.SW5E.modificationTypesCasting;
            context.isCreatureMod = item.system.modificationType in CONFIG.SW5E.modificationTypesCreature;
            context.isAugment = item.system.modificationType === "augment";
            context.usesSlot = !(context.isCreatureMod || context.isAugment);
            context.wpnProperties = CONFIG.SW5E.weaponFullCharacterProperties;
        }

        // Modifiable items
        if (item.system.modify) {
            if (item.system.modify.type)
                context.config.modSlots = CONFIG.SW5E.modificationSlots[item.system.modify.type];
            context.mods = item.system.modify.items;
        }

        // Potential consumption targets
        context.abilityConsumptionTargets = this._getItemConsumptionTargets(item);

        /** @deprecated */
        Object.defineProperty(context, "data", {
            get() {
                const msg = `You are accessing the "data" attribute within the rendering context provided by the ItemSheet5e 
          class. This attribute has been deprecated in favor of "system" and will be removed in a future release`;
                foundry.utils.logCompatibilityWarning(msg, {since: "SW5e 2.0", until: "SW5e 2.2"});
                return context.system;
            }
        });

        return context;
    }

    /* -------------------------------------------- */

    /**
     * Get the display object used to show the advancement tab.
     * @param {Item5e} item  The item for which the advancement is being prepared.
     * @returns {object}     Object with advancement data grouped by levels.
     */
    _getItemAdvancement(item) {
        const advancement = {};
        const configMode = !item.parent || this.advancementConfigurationMode;
        const maxLevel = !configMode ? item.curAdvancementLevel : -1;

        // Improperly configured advancements
        if (item.advancement.needingConfiguration.length) {
            advancement.unconfigured = {
                items: item.advancement.needingConfiguration.map((a) => ({
                    id: a.id,
                    order: a.constructor.order,
                    title: a.title,
                    icon: a.icon,
                    classRestriction: a.data.classRestriction,
                    configured: false
                })),
                configured: "partial"
            };
        }

        // All other advancements by level
        for (let [level, advancements] of Object.entries(item.advancement.byLevel)) {
            if (!configMode) advancements = advancements.filter((a) => a.appliesToClass);
            const items = advancements.map((advancement) => ({
                id: advancement.id,
                order: advancement.sortingValueForLevel(level),
                title: advancement.titleForLevel(level, {configMode}),
                icon: advancement.icon,
                classRestriction: advancement.data.classRestriction,
                summary: advancement.summaryForLevel(level, {configMode}),
                configured: advancement.configuredForLevel(level)
            }));
            if (!items.length) continue;
            advancement[level] = {
                items: items.sort((a, b) => a.order.localeCompare(b.order)),
                configured: level > maxLevel ? false : items.some((a) => !a.configured) ? "partial" : "full"
            };
        }
        return advancement;
    }

    /* -------------------------------------------- */

    /**
     * Get the base weapons and tools based on the selected type.
     * @returns {Promise<object>}  Object with base items for this type formatted for selectOptions.
     * @protected
     */
    async _getItemBaseTypes() {
        const type = this.item.type === "equipment" ? "armor" : this.item.type;

        const typeProperty = type === "armor" ? "armor.type" : `${type}Type`;
        const baseType = foundry.utils.getProperty(this.item.system, typeProperty);

        const baseIds = CONFIG.SW5E[`${baseType === "shield" ? "shield" : type}Ids`];
        if (baseIds === undefined) return {};

        const items = {};
        for (const [name, id] of Object.entries(baseIds)) {
            let baseItem = await ProficiencySelector.getBaseItem(id);
            /** */
            // For some reason, loading a compendium item after the cache is generated deletes that item's data from the cache
            if (!baseItem) baseItem = (await ProficiencySelector.getBaseItem(id, {fullItem: true}));

            if (!baseItem) continue;

            if (baseType !== foundry.utils.getProperty(baseItem.system, typeProperty)) continue;
            items[name] = baseItem.name.replace(/\s*\([^)]*\)/g, ""); // Remove '(Rapid)' and '(Burst)' tags from item names
        }
        return Object.fromEntries(Object.entries(items).sort((lhs, rhs) => lhs[1].localeCompare(rhs[1])));
    }

    /* -------------------------------------------- */

    /**
     * Get the valid item consumption targets which exist on the actor
     * @returns {Object<string>}   An object of potential consumption targets
     * @private
     */
    _getItemConsumptionTargets() {
        const consume = this.item.system.consume || {};
        if (!consume.type) return [];

        // Consume types not reliant on actor

        // Power Dice
        if (consume.type === "powerdice") {
            return Object.keys(CONFIG.SW5E.powerDieSlots).reduce((obj, pd) => {
                obj[`attributes.power.${pd}.value`] = game.i18n.localize(CONFIG.SW5E.powerDieSlots[pd]);
                return obj;
            }, {});
        }

        const actor = this.item.actor;
        if (!actor) return {};

        // Consume types reliant on actor

        // Ammunition
        if (consume.type === "ammo") {
            return actor.itemTypes.consumable.reduce(
                (ammo, i) => {
                    if (i.system.consumableType === "ammo") ammo[i.id] = `${i.name} (${i.system.quantity})`;
                    return ammo;
                },
                {[this.item.id]: `${this.item.name} (${this.item.system.quantity})`}
            );
        }

        // Attributes
        else if (consume.type === "attribute") {
            const attributes = TokenDocument.implementation.getConsumedAttributes(actor.system);
            attributes.bar.forEach((a) => a.push("value"));
            return attributes.bar.concat(attributes.value).reduce((obj, a) => {
                let k = a.join(".");
                obj[k] = k;
                return obj;
            }, {});
        }

        // Hit Dice
        else if (consume.type === "hitDice") {
            return {
                smallest: game.i18n.localize("SW5E.ConsumeHitDiceSmallest"),
                ...CONFIG.SW5E.hitDieTypes.reduce((obj, hd) => {
                    obj[hd] = hd;
                    return obj;
                }, {}),
                largest: game.i18n.localize("SW5E.ConsumeHitDiceLargest")
            };
        }

        // Materials
        else if (consume.type === "material") {
            return actor.items.reduce((obj, i) => {
                if (["consumable", "loot"].includes(i.type) && !i.system.activation) {
                    obj[i.id] = `${i.name} (${i.system.quantity})`;
                }
                return obj;
            }, {});
        }

        // Charges
        else if (consume.type === "charges") {
            return actor.items.reduce((obj, i) => {
                // Limited-use items
                const uses = i.system.uses || {};
                if (uses.per && uses.max) {
                    const label =
                        uses.per === "charges"
                            ? ` (${game.i18n.format("SW5E.AbilityUseChargesLabel", {value: uses.value})})`
                            : ` (${game.i18n.format("SW5E.AbilityUseConsumableLabel", {
                                  max: uses.max,
                                  per: uses.per
                              })})`;
                    obj[i.id] = i.name + label;
                }

                // Recharging items
                const recharge = i.system.recharge || {};
                if (recharge.value) obj[i.id] = `${i.name} (${game.i18n.format("SW5E.Recharge")})`;
                return obj;
            }, {});
        } else return {};
    }

    /* -------------------------------------------- */

    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet.
     * @returns {string|null}  Item status string if applicable to item's type.
     * @private
     */
    _getItemStatus() {
        switch (this.item.type) {
            case "class":
                return game.i18n.format("SW5E.LevelCount", {ordinal: this.item.system.levels.ordinalString()});
            case "equipment":
            case "weapon":
                return game.i18n.localize(this.item.system.equipped ? "SW5E.Equipped" : "SW5E.Unequipped");
            case "power":
                return CONFIG.SW5E.powerPreparationModes[this.item.system.preparation];
            case "tool":
                return game.i18n.localize(this.item.system.proficient ? "SW5E.Proficient" : "SW5E.NotProficient");
        }
    }

    /* -------------------------------------------- */

    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab.
     * @returns {string[]}   List of property labels to be shown.
     * @private
     */
    _getItemProperties() {
        const props = [];
        const labels = this.item.labels;
        switch (this.item.type) {
            case "equipment":
                props.push(CONFIG.SW5E.equipmentTypes[this.item.system.armor.type]);
                if (this.item.isArmor || this._isItemMountable(this.item)) props.push(labels.armor);
                if (this.item.system.properties)
                    props.push(
                        ...Object.entries(this.item.system.properties)
                            .filter((e) => ![false, undefined, null, 0].includes(e[1]))
                            .map((e) => game.i18n.format(CONFIG.SW5E.armorProperties[e[0]]?.full, {value: e[1]}))
                    );
                break;
            case "feat":
                props.push(labels.featType);
                break;
            case "power":
                props.push(labels.materials, ...labels.components.tags);
                break;
            case "weapon":
                for (const [k, v] of Object.entries(this.item.system.properties)) {
                    if (v === true) props.push(CONFIG.SW5E.weaponProperties[k]);
                }
                break;

            //TODO: Work out these
            case "species":
                //props.push(labels.species);
                break;
            case "archetype":
                //props.push(labels.archetype);
                break;
            case "background":
                //props.push(labels.background);
                break;
            case "classfeature":
                //props.push(labels.classfeature);
                break;
            case "deployment":
                //props.push(labels.deployment);
                break;
            case "venture":
                //props.push(labels.venture);
                break;
            case "fightingmastery":
                //props.push(labels.fightingmastery);
                break;
            case "fightingstyle":
                //props.push(labels.fightingstyle);
                break;
            case "lightsaberform":
                //props.push(labels.lightsaberform);
                break;
            case "maneuver":
                // props.push(labels.maneuverType);
                break;
        }

        // Action type
        if (this.item.system.actionType) {
            props.push(CONFIG.SW5E.itemActionTypes[this.item.system.actionType]);
        }

        // Action usage
        if (this.item.type !== "weapon" && !foundry.utils.isEmpty(this.item.system.activation)) {
            props.push(labels.activation, labels.range, labels.target, labels.duration);
        }
        return props.filter((p) => !!p);
    }

    /* -------------------------------------------- */

    /**
     * Prepare the weapon reload properties
     * @param {object}    [obj]   The data object to apply the changes to
     * @returns {object}          The modified data object
     * @private
     */
    _getWeaponReloadProperties(obj = {}) {
        const itemSysdata = this.item.system;
        const actor = this.item.actor;

        obj.hasReload = !!(itemSysdata.ammo?.max);
        obj.reloadUsesAmmo = itemSysdata.ammo?.types?.length;
        obj.reloadFull = itemSysdata.ammo?.value === itemSysdata.ammo?.max || (obj.reloadUsesAmmo && !itemSysdata.ammo?.target);
        if (obj.hasReload) {
            if (actor && obj.reloadUsesAmmo) {
                obj.reloadAmmo = actor.itemTypes.consumable.reduce((ammo, i) => {
                    if (i.system.consumableType === "ammo" && itemSysdata.ammo?.types.includes(i.system.ammoType)) {
                        ammo[i.id] = `${i.name} (${i.system.quantity})`;
                    }
                    return ammo;
                }, {});
            } else obj.reloadAmmo = {};
            if (itemSysdata.properties?.rel) {
                obj.reloadActLabel = "SW5E.WeaponReload";
                obj.reloadLabel = "SW5E.WeaponReload";
            } else if (itemSysdata.properties?.ovr) {
                obj.reloadActLabel = "SW5E.WeaponCoolDown";
                obj.reloadLabel = "SW5E.WeaponOverheat";
            }
        }
        return obj;
    }

    /* -------------------------------------------- */

    /**
     * Is this item a separate large object like a siege engine or vehicle component that is
     * usually mounted on fixtures rather than equipped, and has its own AC and HP.
     * @param {object} item  Copy of item data being prepared for display.
     * @returns {boolean}    Is item siege weapon or vehicle equipment?
     * @private
     */
    _isItemMountable(item) {
        return (
            (item.type === "weapon" && item.system.weaponType === "siege") ||
            (item.type === "equipment" && item.system.armor.type === "vehicle")
        );
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    setPosition(position = {}) {
        if (!(this._minimized || position.height)) {
            position.height = this._tabs[0].active === "details" ? "auto" : this.options.height;
        }
        return super.setPosition(position);
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async activateEditor(name, options = {}, initialContent = "") {
        options.relativeLinks = true;
        options.plugins = {
            menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
                compact: true,
                destroyOnSave: true,
                onSave: () => this.saveEditor(name, {remove: true})
            })
        };
        return super.activateEditor(name, options, initialContent);
    }

    /* -------------------------------------------- */
    /*  Form Submission                             */
    /* -------------------------------------------- */

    /** @inheritDoc */
    _getSubmitData(updateData = {}) {
        let formData = foundry.utils.expandObject(super._getSubmitData(updateData));

        // Handle Damage array
        const damage = formData.system?.damage;
        if (damage) damage.parts = Object.values(damage?.parts || {}).map((d) => [d[0] || "", d[1] || ""]);

        // Check max uses formula
        const uses = formData.system?.uses;
        if (uses?.max) {
            const maxRoll = new Roll(uses.max);
            if (!maxRoll.isDeterministic) {
                uses.max = this.item._source.system.uses.max;
                this.form.querySelector("input[name='system.uses.max']").value = uses.max;
                return ui.notifications.error(
                    game.i18n.format("SW5E.FormulaCannotContainDiceError", {
                        name: game.i18n.localize("SW5E.LimitedUses")
                    })
                );
            }
        }

        // Check class identifier
        if (formData.system.identifier) {
            const dataRgx = new RegExp(/^([a-z0-9_-]+)$/i);
            const match = formData.system.identifier.match(dataRgx);
            if (!match) {
                formData.system.identifier = this.item._source.system.identifier;
                this.form.querySelector("input[name='system.identifier']").value = formData.system.identifier;
                return ui.notifications.error(game.i18n.localize("SW5E.IdentifierError"));
            }
        }

        // Flatten the submission data
        formData = foundry.utils.flattenObject(formData);

        // Prevent submitting overridden values
        const overrides = foundry.utils.flattenObject(this.item.overrides);
        for (let k of Object.keys(overrides)) {
            delete formData[k];
        }
        delete formData.overridesCalculated;

        return formData;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _renderInner(...args) {
        const html = await super._renderInner(...args);
        const els = this.form.getElementsByClassName("tristate-checkbox");
        for (const el of els) {
            const indet_path = el.name.replace(/(\w+)[.](\w+)$/, "$1.indeterminate.$2");
            el.indeterminate = foundry.utils.getProperty(this.item, indet_path) != false;
        }
        return html;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);
        if (this.isEditable) {
            html.find(".damage-control").click(this._onDamageControl.bind(this));
            html.find(".trait-selector.class-skills").click(this._onConfigureTraits.bind(this));
            html.find(".effect-control").click((ev) => {
                if (this.item.isOwned)
                    return ui.notifications.warn(
                        "Managing Active Effects within an Owned Item is not currently supported and will be added in a subsequent update."
                    );
                ActiveEffect5e.onManageActiveEffect(ev, this.item);
            });
            html.find(".advancement .item-control").click((event) => {
                const t = event.currentTarget;
                if (t.dataset.action) this._onAdvancementAction(t, t.dataset.action);
            });
            html.find(".tristate-checkbox").click(async (ev) => {
                ev.preventDefault();

                const update = {};

                const path = ev.target.name;
                const indet_path = path.replace(/(\w+)[.](\w+)$/, "$1.indeterminate.$2");

                const val = foundry.utils.getProperty(this.item, path);
                const indet_val = foundry.utils.getProperty(this.item, indet_path) != false;

                if (indet_val) {
                    update[path] = false;
                    update[indet_path] = false;
                } else {
                    update[path] = !val;
                    update[indet_path] = val;
                }

                await this.item.update(update);
            });
            html.find(".modification-link").click(this._onOpenItemModification.bind(this));
            html.find(".modification-control").click(this._onManageItemModification.bind(this));
            html.find(".weapon-configure-ammo").click(this._onWeaponConfigureAmmo.bind(this));
            html.find(".weapon-reload").click(this._onWeaponReload.bind(this));
            html.find(".weapon-select-ammo").change(this._onWeaponSelectAmmo.bind(this));
        }
        // Advancement context menu
        const contextOptions = this._getAdvancementContextMenuOptions();
        /**
         * A hook event that fires when the context menu for the advancements list is constructed.
         * @function sw5e.getItemAdvancementContext
         * @memberof hookEvents
         * @param {jQuery} html                      The HTML element to which the context options are attached.
         * @param {ContextMenuEntry[]} entryOptions  The context menu entries.
         */
        Hooks.call("sw5e.getItemAdvancementContext", html, contextOptions);
        if (contextOptions) new ContextMenu(html, ".advancement-item", contextOptions);
    }

    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options which should be applied for advancement entries.
     * @returns {ContextMenuEntry[]}  Context menu entries.
     * @protected
     */
    _getAdvancementContextMenuOptions() {
        const condition = (li) => (this.advancementConfigurationMode || !this.isEmbedded) && this.isEditable;
        return [
            {
                name: "SW5E.AdvancementControlEdit",
                icon: "<i class='fas fa-edit fa-fw'></i>",
                condition,
                callback: (li) => this._onAdvancementAction(li[0], "edit")
            },
            {
                name: "SW5E.AdvancementControlDuplicate",
                icon: "<i class='fas fa-copy fa-fw'></i>",
                condition: li => {
                    const id = li[0].closest(".advancement-item")?.dataset.id;
                    const advancement = this.item.advancement.byId[id];
                    return condition(li) && advancement?.constructor.availableForItem(this.item);
                },
                callback: (li) => this._onAdvancementAction(li[0], "duplicate")
            },
            {
                name: "SW5E.AdvancementControlDelete",
                icon: "<i class='fas fa-trash fa-fw' style='color: rgb(255, 65, 65);'></i>",
                condition,
                callback: (li) => this._onAdvancementAction(li[0], "delete")
            }
        ];
    }

    /* -------------------------------------------- */

    /**
     * Add or remove a damage part from the damage formula.
     * @param {Event} event             The original click event.
     * @returns {Promise<Item5e>|null}  Item with updates applied.
     * @private
     */
    async _onDamageControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Don't allow adding or removing damage parts while there is a mod affecting those, to avoid duplication
        if ("system.damage.parts" in flattenObject(this.item.overrides))
            return ui.notifications.warn(
                `Can't change ${this.item.name}'s damage formulas while there is a mod affecting those.`
            );

        // Add new damage component
        if (a.classList.contains("add-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const damage = this.item.system.damage;
            return this.item.update({"system.damage.parts": damage.parts.concat([["", ""]])});
        }

        // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = foundry.utils.deepClone(this.item.system.damage);
            damage.parts.splice(Number(li.dataset.damagePart), 1);
            return this.item.update({"system.damage.parts": damage.parts});
        }
    }
    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;
        if ( event.target.classList.contains("content-link") ) return;

        // Create drag data
        let dragData;

        // Active Effect
        if ( li.dataset.effectId ) {
            const effect = this.item.effects.get(li.dataset.effectId);
            dragData = effect.toDragData();
        }

        if ( !dragData ) return;

        // Set data transfer
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = this.item;

        /**
         * A hook event that fires when some useful data is dropped onto an ItemSheet5e.
         * @function sw5e.dropItemSheetData
         * @memberof hookEvents
         * @param {Item5e} item                  The Item5e
         * @param {ItemSheet5e} sheet            The ItemSheet5e application
         * @param {object} data                  The data that has been dropped onto the sheet
         * @returns {boolean}                    Explicitly return `false` to prevent normal drop handling.
         */
        const allowed = Hooks.call("sw5e.dropItemSheetData", item, this, data);
        if ( allowed === false ) return;

        switch ( data.type ) {
            case "ActiveEffect":
                return this._onDropActiveEffect(event, data);
            case "Item":
                return this._onDropItem(event, data);
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle the dropping of ActiveEffect data onto an Item Sheet
     * @param {DragEvent} event                  The concluding DragEvent which contains drop data
     * @param {object} data                      The data transfer extracted from the event
     * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
     * @protected
     */
    async _onDropActiveEffect(event, data) {
        const effect = await ActiveEffect.implementation.fromDropData(data);
        if ( !this.item.isOwner || !effect ) return false;
        if ( (this.item.uuid === effect.parent.uuid) || (this.item.uuid === effect.origin) ) return false;
        return ActiveEffect.create({
            ...effect.toObject(),
            origin: this.item.uuid,
        }, {parent: this.item});
    }

    /* -------------------------------------------- */

    /**
     * Handle dropping of an item reference or item data onto an Item Sheet
     * @param {DragEvent} event     The concluding DragEvent which contains drop data
     * @param {Object} data         The data transfer extracted from the event
     * @return {Promise<Object>}    A data object which describes the result of the drop
     * @private
     */
    async _onDropItem(event, data) {
        const entity = await Item.fromDropData(data);
        if (entity) this.item.addModification(entity.uuid);
        return;
    }

    /* -------------------------------------------- */

    /**
     * Handle spawning the TraitSelector application for selection various options.
     * @param {Event} event   The click event which originated the selection.
     * @private
     */
    _onConfigureTraits(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const options = {
            name: a.dataset.target,
            title: a.parentElement.innerText,
            choices: [],
            allowCustom: false
        };
        switch (a.dataset.options) {
            case "saves":
                options.choices = CONFIG.SW5E.abilities;
                options.valueKey = null;
                break;
            case "skills.choices":
                options.choices = CONFIG.SW5E.skills;
                options.valueKey = null;
                options.labelKey = "label";
                break;
            case "skills":
                //TODO: Add the ability to give starship skills?
                const skills = this.item.system.skills;
                const choices = skills.choices?.length ? skills.choices : Object.keys(CONFIG.SW5E.skills);
                options.choices = Object.fromEntries(
                    Object.entries(CONFIG.SW5E.skills).filter(([s]) => choices.includes(s))
                );
                options.maximum = skills.number;
                options.labelKey = "label";
                break;
        }
        new TraitSelector(this.item, options).render(true);
    }

    /* -------------------------------------------- */

    /**
     * Handle opening item modifications.
     * @param {Event} event   The click event
     * @private
     */
    _onOpenItemModification(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const li = a.closest("li");
        const id = li.dataset.id;
        const index = li.dataset.index;
        const item = this.item;
        const actor = item.actor;

        if (actor && id) {
            const item = actor.items.get(id);
            return item?.sheet?.render(true);
        }

        if (item && index !== null) {
            const fakeItem = foundry.utils.duplicate(item.system.modify.items[Number(index)]);
            fakeItem.system.fakeItem = this.item.uuid;
            fakeItem.type = "modification";
            const mod = new Item5e(fakeItem);
            return mod.sheet.render(true);
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle deleting and toggling item modifications.
     * @param {Event} event   The click event
     * @private
     */
    _onManageItemModification(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const li = a.closest("li");
        const action = a.dataset.action;
        const id = li.dataset.id;
        const index = li.dataset.index;
        const item = this.item;
        const actor = item.actor;

        switch (action) {
            case "delete":
                this.item.delModification(id, index);
                break;
            case "toggle":
                this.item.tglModification(id, index);
                break;
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle reloading weapons.
     * @param {Event} event   The click event
     * @private
     */
    _onWeaponReload(event) {
        event.preventDefault();
        if (!event.target.attributes.disabled) this.item.reloadWeapon();
    }

    /* -------------------------------------------- */

    /**
     * Handle weapon ammo selection.
     * @param {Event} event   The change event
     * @private
     */
    async _onWeaponSelectAmmo(event) {
        event.preventDefault();

        const wpn = this.item;
        const wpnSysdata = wpn?.system;
        const oldLoad = wpnSysdata?.ammo?.value;
        const oldAmmoID = wpnSysdata?.ammo?.target;

        const target = event.currentTarget;
        const index = target.selectedIndex;
        const newAmmoID = target[index].value;

        if (newAmmoID !== oldAmmoID) await wpn.update({"system.ammo.target": newAmmoID});

        const oldAmmo = wpn?.actor?.items?.get(oldAmmoID);
        const oldAmmoSysdata = oldAmmo?.system;

        if (oldAmmo && oldLoad !== 0) {
            const ammoUpdates = {};
            switch (oldAmmoSysdata?.ammoType) {
                case "cartridge":
                case "dart":
                case "missile":
                case "rocket":
                case "snare":
                case "torpedo":
                    ammoUpdates["system.quantity"] = oldAmmoSysdata?.quantity + oldLoad;
                    break;
                case "powerCell":
                case "flechetteClip":
                case "flechetteMag":
                case "powerGenerator":
                case "projectorCanister":
                case "projectorTank":
                    if (oldLoad === wpnSysdata?.properties?.rel) ammoUpdates["system.quantity"] = oldAmmoSysdata?.quantity + 1;
                    else {
                        const confirm = await Dialog.confirm({
                            title: game.i18n.localize("SW5E.WeaponAmmoConfirmEjectTitle"),
                            content: game.i18n.localize("SW5E.WeaponAmmoConfirmEjectContent"),
                            defaultYes: true
                        });
                        if (!confirm) return await wpn?.update({"system.ammo.target": oldAmmoID});
                    }
                    break;
            }
            if (!foundry.utils.isEmpty(ammoUpdates)) await oldAmmo?.update(ammoUpdates);
        }
        await wpn.update({"system.ammo.value": 0});
    }

    /* -------------------------------------------- */

    /**
     * Handle configuration of valid ammo types for a weapon.
     * @param {Event} event   The click event
     * @private
     */
    async _onWeaponConfigureAmmo(event) {
        event.preventDefault();
        const disabled = [];
        const target = this.item.system?.ammo?.target;
        if (target) {
            const ammo = this.item.actor?.items?.get(target);
            if (ammo) disabled.push(ammo.system.ammoType);
        }
        const result = await CheckboxSelect.checkboxSelect({
            title: game.i18n.localize("SW5E.WeaponAmmoConfigureTitle"),
            content: game.i18n.localize("SW5E.WeaponAmmoConfigureContent"),
            checkboxes: CONFIG.SW5E.ammoTypes,
            defaultSelect: this.item.system.ammo?.types,
            disabled: disabled
        });
        if (result) this.item.update({"system.ammo.types": result});
    }

    /* -------------------------------------------- */

    /**
     * Handle one of the advancement actions from the buttons or context menu.
     * @param {Element} target  Button or context menu entry that triggered this action.
     * @param {string} action   Action being triggered.
     * @returns {Promise}
     */
    _onAdvancementAction(target, action) {
        const id = target.closest(".advancement-item")?.dataset.id;
        const advancement = this.item.advancement.byId[id];
        if (["edit", "delete", "duplicate"].includes(action) && !advancement) return;
        switch (action) {
            case "add":
                return game.sw5e.advancement.AdvancementSelection.createDialog(this.item);
            case "edit":
                return new advancement.constructor.metadata.apps.config(advancement).render(true);
            case "delete":
                return this.item.deleteAdvancement(id);
            case "duplicate":
                return this.item.duplicateAdvancement(id);
            case "modify-choices":
                const level = target.closest("li")?.dataset.level;
                const manager = AdvancementManager.forModifyChoices(this.item.actor, this.item.id, Number(level));
                if (manager.steps.length) manager.render(true);
                return;
            case "toggle-configuration":
                this.advancementConfigurationMode = !this.advancementConfigurationMode;
                return this.render();
        }
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _onSubmit(...args) {
        if (this._tabs[0].active === "details") this.position.height = "auto";
        await super._onSubmit(...args);
    }

    /* -------------------------------------------- */
}
