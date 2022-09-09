import AdvancementManager from "../../advancement/advancement-manager.mjs";
import ProficiencySelector from "../proficiency-selector.mjs";
import TraitSelector from "../trait-selector.mjs";
import CheckboxSelect from "../actor/checkbox-select.js";
import ActiveEffect5e from "../../documents/active-effect.mjs";
import Item5e from "../../documents/item.js";

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
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
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
        const context = await super.getData(options);
        const item = context.item;
        const source = item.toObject();
        const isMountable = this._isItemMountable(item);

        // Possibly Don't need this?
        const actor = item.actor;

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
            descriptionHTML: await TextEditor.enrichHTML(item.system.description.value, {
                secrets: item.isOwner,
                async: true,
                relativeTo: this.item
            }),

            // Action Details
            hasAttackRoll: item.hasAttack,
            isHealing: item.system.actionType === "heal",
            isFlatDC: item.system.save.scaling === "flat",
            isLine: ["line", "wall"].includes(item.system.target?.type),
            critical: item.system.critical,

            // Vehicles
            wpnType: item.system?.weaponType ?? "",
            armorType: item.system?.armor?.type ?? "",
            ammoType: item.system?.consumableType === "ammo" ? item.system?.ammoType ?? "" : "",
            isStarshipWeapon: wpnType in CONFIG.SW5E.weaponStarshipTypes,
            isStarshipAmmo: ammoType in CONFIG.SW5E.ammoStarshipTypes,
            isStarshipArmor: armorType === "starship",
            isStarshipShield: armorType === "ssshield",
            isStarshipHyperdrive: armorType === "hyper",
            isStarshipPowerCoupling: armorType === "powerc",
            isStarshipReactor: armorType === "reactor",
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
            if (itemData.data.armor.type in CONFIG.SW5E.armorTypes) data.equipProperties = CONFIG.SW5E.armorProperties;
            if (itemData.data.armor.type in CONFIG.SW5E.castingEquipmentTypes)
                data.equipProperties = CONFIG.SW5E.castingProperties;
        }

        // Modification Properties
        if (this.item.type === "modification") {
            data.isEquipMod = itemData.data.modificationType in CONFIG.SW5E.modificationTypesEquipment;
            data.isWpnMod = itemData.data.modificationType in CONFIG.SW5E.modificationTypesWeapon;
            data.isCastMod = itemData.data.modificationType in CONFIG.SW5E.modificationTypesCasting;
            data.wpnProperties = CONFIG.SW5E.weaponFullCharacterProperties;
        }

        // Modifiable items
        if (itemData.data.modify) {
            if (itemData.data.modify.type)
                data.config.modSlots = CONFIG.SW5E.modificationSlots[itemData.data.modify.type];
            data.mods = itemData.data.modify.items;
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

        // Set up config with proper power components
        context.config = foundry.utils.mergeObject(
            CONFIG.SW5E,
            {
                powerComponents: {...CONFIG.SW5E.powerComponents, ...CONFIG.SW5E.powerTags}
            },
            {inplace: false}
        );

        return context;
    }

    /* -------------------------------------------- */

    /**
     * Get the display object used to show the advancement tab.
     * @param {Item5e} item  The item for which the advancement is being prepared.
     * @returns {object}     Object with advancement data grouped by levels.
     */
    _getItemAdvancement(item) {
        const configMode = !item.parent || this.advancementConfigurationMode;
        const maxLevel = !configMode ? item.curAdvancementLevel : -1;
        const data = {};

        // Improperly configured advancements
        if (item.advancement.needingConfiguration.length) {
            data.unconfigured = {
                items: item.advancement.needingConfiguration.map((advancement) => ({
                    id: advancement.id,
                    order: advancement.constructor.order,
                    title: advancement.title,
                    icon: advancement.icon,
                    classRestriction: advancement.data.classRestriction,
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
            data[level] = {
                items: items.sort((a, b) => a.order.localeCompare(b.order)),
                configured: level > maxLevel ? false : items.some((a) => !a.configured) ? "partial" : "full"
            };
        }

        return data;
    }

    /* -------------------------------------------- */

    /**
     * Get the base weapons and tools based on the selected type.
     *
     * @param {object} item        Item data for the item being displayed
     * @returns {Promise<object>}  Object with base items for this type formatted for selectOptions.
     * @protected
     */
    async _getItemBaseTypes(item) {
        const type = item.type === "equipment" ? "armor" : item.type;
        const typeProperty = type === "armor" ? "armor.type" : `${type}Type`;
        const baseType = foundry.utils.getProperty(item.data, typeProperty);

        const ids = CONFIG.SW5E[`${baseType === "shield" ? "shield" : type}Ids`];
        if (ids === undefined) return {};

        const items = await Object.entries(ids).reduce(async (acc, [name, id]) => {
            let baseItem = await ProficiencySelector.getBaseItem(id);

            // For some reason, loading a compendium item after the cache is generated deletes that item's data from the cache
            if (!baseItem?.data) baseItem = (await ProficiencySelector.getBaseItem(id, {fullItem: true}))?.data;

            const obj = await acc;
            if (!baseItem) return obj;

            if (baseType !== foundry.utils.getProperty(baseItem.data, typeProperty)) return obj;
            obj[name] = baseItem.name.replace(/\s*\([^)]*\)/g, ""); // Remove '(Rapid)' and '(Burst)' tags from item names
            return obj;
        }, {});

        return Object.fromEntries(Object.entries(items).sort((lhs, rhs) => lhs[1].localeCompare(rhs[1])));
    }

    /* -------------------------------------------- */

    /**
     * Get the valid item consumption targets which exist on the actor
     * @param {object} item          Item data for the item being displayed
     * @returns {{string: string}}   An object of potential consumption targets
     * @private
     */
    _getItemConsumptionTargets(item) {
        const consume = item.data.consume || {};
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
                    if (i.data.data.consumableType === "ammo") {
                        ammo[i.id] = `${i.name} (${i.data.data.quantity})`;
                    }
                    return ammo;
                },
                {[item._id]: `${item.name} (${item.data.quantity})`}
            );
        }

        // Attributes
        else if (consume.type === "attribute") {
            const attributes = TokenDocument.implementation.getConsumedAttributes(actor.data.data);
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
                if (["consumable", "loot"].includes(i.data.type) && !i.data.data.activation) {
                    obj[i.id] = `${i.name} (${i.data.data.quantity})`;
                }
                return obj;
            }, {});
        }

        // Charges
        else if (consume.type === "charges") {
            return actor.items.reduce((obj, i) => {
                // Limited-use items
                const uses = i.data.data.uses || {};
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
                const recharge = i.data.data.recharge || {};
                if (recharge.value) obj[i.id] = `${i.name} (${game.i18n.format("SW5E.Recharge")})`;
                return obj;
            }, {});
        } else return {};
    }

    /* -------------------------------------------- */

    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet.
     * @param {object} item    Copy of the item data being prepared for display.
     * @returns {string|null}  Item status string if applicable to item's type.
     * @private
     */
    _getItemStatus(item) {
        switch (item.type) {
            case "class":
                return game.i18n.format("SW5E.LevelCount", {ordinal: item.data.levels.ordinalString()});
            case "equipment":
            case "weapon":
                return game.i18n.localize(item.data.equipped ? "SW5E.Equipped" : "SW5E.Unequipped");
            case "power":
                return CONFIG.SW5E.powerPreparationModes[item.data.preparation];
            case "tool":
                return game.i18n.localize(item.data.proficient ? "SW5E.Proficient" : "SW5E.NotProficient");
        }
    }

    /* -------------------------------------------- */

    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab.
     * @param {object} item  Copy of the item data being prepared for display.
     * @returns {string[]}   List of property labels to be shown.
     * @private
     */
    _getItemProperties(item) {
        const props = [];
        const labels = this.item.labels;

        if (item.type === "weapon") {
            const properties = CONFIG.SW5E.weaponProperties;
            props.push(
                ...Object.entries(item.data.properties)
                    .filter((e) => ![false, undefined, null, 0].includes(e[1]))
                    .map((e) => {
                        if (e[0] in properties) return game.i18n.format(properties[e[0]].full, {value: e[1]});
                        else {
                            ui.notifications.warn(
                                game.i18n.format("SW5E.WarnInvalidProperty", {weapon: item.name, property: e[0]})
                            );
                            return e[0];
                        }
                    })
            );
        } else if (item.type === "power") {
            props.push(labels.materials, ...labels.components.tags);
        } else if (item.type === "equipment") {
            props.push(CONFIG.SW5E.equipmentTypes[item.data.armor.type]);
            if (this.item.isArmor || this._isItemMountable(item)) props.push(labels.armor);
            if (item.data.properties)
                props.push(
                    ...Object.entries(item.data.properties)
                        .filter((e) => ![false, undefined, null, 0].includes(e[1]))
                        .map((e) => game.i18n.format(CONFIG.SW5E.armorProperties[e[0]].full, {value: e[1]}))
                );
        } else if (item.type === "feat") {
            props.push(labels.featType);
            //TODO: Work out these
        } else if (item.type === "species") {
            //props.push(labels.species);
        } else if (item.type === "archetype") {
            //props.push(labels.archetype);
        } else if (item.type === "background") {
            //props.push(labels.background);
        } else if (item.type === "classfeature") {
            //props.push(labels.classfeature);
        } else if (item.type === "deployment") {
            //props.push(labels.deployment);
        } else if (item.type === "venture") {
            //props.push(labels.venture);
        } else if (item.type === "fightingmastery") {
            //props.push(labels.fightingmastery);
        } else if (item.type === "fightingstyle") {
            //props.push(labels.fightingstyle);
        } else if (item.type === "lightsaberform") {
            //props.push(labels.lightsaberform);
        } else if (item.type === "maneuver") {
            // props.push(labels.maneuverType);
        }

        // Action type
        if (item.data.actionType) {
            props.push(CONFIG.SW5E.itemActionTypes[item.data.actionType]);
        }

        // Action usage
        if (item.type !== "weapon" && item.data.activation && !isObjectEmpty(item.data.activation)) {
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
        const itemData = this.item.data;
        const actor = this.item.actor;

        obj.hasReload = !!itemData.data.ammo.max;
        obj.reloadUsesAmmo = itemData.data?.ammo?.types?.length;
        obj.reloadFull =
            itemData.data?.ammo?.value === itemData.data?.ammo?.max ||
            (obj.reloadUsesAmmo && !itemData.data?.ammo?.target);
        if (obj.hasReload) {
            if (actor && obj.reloadUsesAmmo) {
                obj.reloadAmmo = actor.itemTypes.consumable.reduce((ammo, i) => {
                    if (
                        i.data?.data?.consumableType === "ammo" &&
                        itemData.data?.ammo?.types.includes(i.data?.data?.ammoType)
                    ) {
                        ammo[i.id] = `${i.name} (${i.data.data.quantity})`;
                    }
                    return ammo;
                }, {});
            } else obj.reloadAmmo = {};
            if (itemData.data?.properties?.rel) {
                obj.reloadActLabel = "SW5E.WeaponReload";
                obj.reloadLabel = "SW5E.WeaponReload";
            } else if (itemData.data?.properties?.ovr) {
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
        const data = item.data;
        return (
            (item.type === "weapon" && data.weaponType === "siege") ||
            (item.type === "equipment" && data.armor.type === "vehicle")
        );
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    setPosition(position = {}) {
        if (!(this._minimized || position.height)) {
            position.height = this._tabs[0].active === "details" ? "auto" : this.options.height;
        }
        return super.setPosition(position);
    }

    /* -------------------------------------------- */
    /*  Form Submission                             */
    /* -------------------------------------------- */

    /** @inheritdoc */
    _getSubmitData(updateData = {}) {
        // Create the expanded update data object
        const fd = new FormDataExtended(this.form, {editors: this.editors});
        let data = fd.toObject();
        if (updateData) data = mergeObject(data, updateData);
        else data = expandObject(data);

        // Handle Damage array
        const damage = data.data?.damage;
        if (damage) damage.parts = Object.values(damage?.parts || {}).map((d) => [d[0] || "", d[1] || ""]);

        // Check max uses formula
        if (data.data?.uses?.max) {
            const maxRoll = new Roll(data.data.uses.max);
            if (!maxRoll.isDeterministic) {
                data.data.uses.max = this.object.data._source.data.uses.max;
                this.form.querySelector("input[name='data.uses.max']").value = data.data.uses.max;
                return ui.notifications.error(
                    game.i18n.format("SW5E.FormulaCannotContainDiceError", {
                        name: game.i18n.localize("SW5E.LimitedUses")
                    })
                );
            }
        }

        // Check class identifier
        if (data.data.identifier) {
            const dataRgx = new RegExp(/^([a-z0-9_-]+)$/i);
            const match = data.data.identifier.match(dataRgx);
            if (!match) {
                data.data.identifier = this.object.data._source.data.identifier;
                this.form.querySelector("input[name='data.identifier']").value = data.data.identifier;
                return ui.notifications.error(game.i18n.localize("SW5E.IdentifierError"));
            }
        }

        // Flatten the submission data
        data = flattenObject(data);

        // Prevent submitting overridden values
        const overrides = foundry.utils.flattenObject(this.item.overrides);
        for (let k of Object.keys(overrides)) {
            delete data[k];
        }

        return data;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _renderInner(...args) {
        const html = await super._renderInner(...args);
        const els = this.form.getElementsByClassName("tristate-checkbox");
        for (const el of els) {
            const indet_path = el.name.replace(/(\w+)[.](\w+)$/, "$1.indeterminate.$2");
            el.indeterminate = foundry.utils.getProperty(this.item.data, indet_path) != false;
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
            html.find(".advancement .item-control").click(this._onAdvancementAction.bind(this));
            // TODO: Remove this when UUID links are supported in v10
            html.find(".actor-item-link").click(this._onClickContentLink.bind(this));
            html.find(".tristate-checkbox").click(async (ev) => {
                ev.preventDefault();

                const update = {};

                const path = ev.target.name;
                const indet_path = path.replace(/(\w+)[.](\w+)$/, "$1.indeterminate.$2");

                const val = foundry.utils.getProperty(this.item.data, path);
                const indet_val = foundry.utils.getProperty(this.item.data, indet_path) != false;

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
        if ("data.damage.parts" in flattenObject(this.item.overrides))
            return ui.notifications.warn(
                `Can't change ${this.item.name}'s damage formulas while there is a mod affecting those.`
            );

        // Add new damage component
        if (a.classList.contains("add-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const damage = this.item.data.data.damage;
            return this.item.update({"data.damage.parts": damage.parts.concat([["", ""]])});
        }

        // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = foundry.utils.deepClone(this.item.data.data.damage);
            damage.parts.splice(Number(li.dataset.damagePart), 1);
            return this.item.update({"data.damage.parts": damage.parts});
        }
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
                break;
            case "skills":
                const skills = this.item.data.data.skills;
                const choiceSet = skills.choices?.length ? skills.choices : Object.keys(CONFIG.SW5E.skills);
                options.choices = Object.fromEntries(
                    Object.entries(CONFIG.SW5E.skills).filter(([skill]) => choiceSet.includes(skill))
                );
                options.maximum = skills.number;
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
            const data = foundry.utils.duplicate(item.data.data.modify.items[Number(index)].data);
            data.data.fakeItem = this.item.uuid;
            const mod = new Item5e(data);
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
        const wpnData = wpn?.data?.data;
        const oldLoad = wpnData?.ammo?.value;
        const oldAmmoID = wpnData?.ammo?.target;

        const target = event.currentTarget;
        const index = target.selectedIndex;
        const newAmmoID = target[index].value;

        if (newAmmoID !== oldAmmoID) await wpn.update({"data.ammo.target": newAmmoID});

        const oldAmmo = wpn?.actor?.items?.get(oldAmmoID);
        const oldAmmoData = oldAmmo?.data?.data;

        if (oldAmmo && oldLoad !== 0) {
            const ammoUpdates = {};
            switch (oldAmmoData?.ammoType) {
                case "cartridge":
                case "dart":
                case "missile":
                case "rocket":
                case "snare":
                case "torpedo":
                    ammoUpdates["data.quantity"] = oldAmmoData?.quantity + oldLoad;
                    break;
                case "powerCell":
                case "flechetteClip":
                case "flechetteMag":
                case "powerGenerator":
                case "projectorCanister":
                case "projectorTank":
                    if (oldLoad === wpnData?.properties?.rel) ammoUpdates["data.quantity"] = oldAmmoData?.quantity + 1;
                    else {
                        const confirm = await Dialog.confirm({
                            title: game.i18n.localize("SW5E.WeaponAmmoConfirmEjectTitle"),
                            content: game.i18n.localize("SW5E.WeaponAmmoConfirmEjectContent"),
                            defaultYes: true
                        });
                        if (!confirm) return await wpn?.update({"data.ammo.target": oldAmmoID});
                    }
                    break;
            }
            if (!foundry.utils.isObjectEmpty(ammoUpdates)) await oldAmmo?.update(ammoUpdates);
        }
        await wpn.update({"data.ammo.value": 0});
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
        const target = this.item.data?.data?.ammo?.target;
        if (target) {
            const ammo = this.item.actor?.items?.get(target);
            if (ammo) disabled.push(ammo.data?.data.ammoType);
        }
        const result = await CheckboxSelect.checkboxSelect({
            title: game.i18n.localize("SW5E.WeaponAmmoConfigureTitle"),
            content: game.i18n.localize("SW5E.WeaponAmmoConfigureContent"),
            checkboxes: CONFIG.SW5E.ammoTypes,
            defaultSelect: this.item.data?.data?.ammo?.types,
            disabled: disabled
        });
        if (result) this.item.update({"data.ammo.types": result});
    }

    /* -------------------------------------------- */

    /**
     * Handle creating the advancement selection window when the add button is pressed.
     * @param {Event} event  The click event which originated the creation.
     * @returns {Promise}
     */
    _onAdvancementAction(event) {
        const cl = event.currentTarget.classList;
        if (cl.contains("item-add")) return game.sw5e.advancement.AdvancementSelection.createDialog(this.item);

        if (cl.contains("modify-choices")) {
            const level = event.currentTarget.closest("li")?.dataset.level;
            const manager = AdvancementManager.forModifyChoices(this.item.actor, this.item.id, Number(level));
            if (manager.steps.length) manager.render(true);
            return;
        }

        if (cl.contains("toggle-configuration")) {
            this.advancementConfigurationMode = !this.advancementConfigurationMode;
            return this.render();
        }

        const id = event.currentTarget.closest("li.item")?.dataset.id;
        const advancement = this.item.advancement.byId[id];
        if (!advancement) return;

        if (cl.contains("item-edit")) {
            const config = new advancement.constructor.metadata.apps.config(advancement);
            return config.render(true);
        } else if (cl.contains("item-delete")) {
            return this.item.deleteAdvancement(id);
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle clicking on "actor-item-link" content links. Note: This method will be removed in 1.7 when it can
     * be replaced by UUID links in core.
     * @param {Event} event  Triggering click event.
     * @private
     */
    _onClickContentLink(event) {
        event.stopPropagation();
        const actor = game.actors.get(event.target.dataset.actor);
        const item = actor?.items.get(event.target.dataset.id);
        item?.sheet.render(true);
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _onSubmit(...args) {
        if (this._tabs[0].active === "details") this.position.height = "auto";
        await super._onSubmit(...args);
    }

    /* -------------------------------------------- */
    /*  Drag and Drop                               */
    /* -------------------------------------------- */

    /** @inheritdoc */
    _canDragDrop(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async _onDrop(event) {
        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (err) {
            return false;
        }
        const item = this.item;

        /**
         * A hook event that fires when some useful data is dropped onto an ItemSheet.
         * @function dropItemSheetData
         * @memberof hookEvents
         * @param {Item} item        The Item
         * @param {ItemSheet} sheet  The ItemSheet application
         * @param {object} data      The data that has been dropped onto the sheet
         * @param {event} event      The event that triggered the drop
         */
        const allowed = Hooks.call("dropItemSheetData", item, this, data, event);
        if (allowed === false) return;

        // Handle different data types
        switch (data.type) {
            case "Item":
                return await this._onDropItem(event, data);
        }
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
}
