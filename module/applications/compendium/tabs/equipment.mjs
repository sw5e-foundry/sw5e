import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowser } from "../_module.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserEquipmentTab extends CompendiumBrowserTab {
    tabName = "equipment";

    filterData;

    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/equipment.hbs";

    /* MiniSearch */
    searchFields = ["name", "uuid"];

    storeFields = [
      "type",
      "name",
      "img",
      "uuid",
      "category",
      "subcategory",
      "price",
      "rarity",
      "source",
      "properties"
    ];

    constructor(browser) {
      super(browser);

      // Set the filterData object of this tab
      this.filterData = this.prepareFilterData();
    }

    async loadData() {
      console.log("SW5e System | Compendium Browser | Started loading inventory items");

      const inventoryItems = [];
      const itemTypes = CONFIG.SW5E.itemTypes.inventory;
      // Define index fields for different types of equipment
      const fields = ["img", "system.source"];
      const rarity = {
        default: "system.rarity",
        starshipmod: false
      };
      const price = {
        default: "system.price.value",
        starshipmod: "system.basecost.value"
      };
      const properties = {
        weapon: "system.properties",
        equipment: "system.properties"
      };
      const category = {
        consumable: "system.consumableType",
        equipment: "system.armor.type",
        modification: "system.modificationType",
        starshipmod: "system.system.value",
        tool: "system.toolType",
        weapon: "system.weaponType"
      };
      const subcategory = {
        consumable: "system.ammoType",
        weapon: "system.weaponClass"
      };
      const optional = {
        weapon: ["system.weaponClass"]
      };
      const indexFields = [...new Set([
        ...fields,
        ...Object.values(rarity),
        ...Object.values(price),
        ...Object.values(properties),
        ...Object.values(category),
        ...Object.values(subcategory)
      ])].filter(v => !!v);
      const sources = new Set();

      for await (const { pack, index } of this.browser.packLoader.loadPacks(
        "Item",
        this.browser.loadedPacks("equipment"),
        indexFields
      )) {
        console.log(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
        for (const itemData of index) {
          if (itemTypes.includes(itemData.type)) {
            const _fields = [
              ...fields,
              rarity[itemData.type] ?? rarity.default,
              price[itemData.type] ?? price.default,
              properties[itemData.type],
              category[itemData.type],
              subcategory[itemData.type]
            ].filter(f => !!f && !(optional[itemData.type]??[]).includes(f));
            if (!this.hasAllIndexFields(itemData, _fields)) {
              console.warn(
                `Item '${itemData.name}' does not have all required data fields.`
                            + ` Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
                            + ` Fields: ${_fields}`
              );
              for (const field of _fields) if (getProperty(itemData, field) === undefined) console.log(`Missing ${field}`);
              continue;
            }

            // Add properties into the correct format for filtering
            if (itemData?.system?.itemTypes?.value === undefined) itemData.system.itemTypes = { value: itemData.type };
            if (itemData?.system?.rarity?.value === undefined) itemData.system.rarity = { value: itemData.system.rarity };
            if (itemData?.system?.source?.value === undefined) itemData.system.source = { value: itemData.system.source };
            if (itemData?.system?.category?.value === undefined) itemData.system.category = { value: (itemData.type in category) ? foundry.utils.getProperty(itemData, category[itemData.type]) : null };
            if (itemData?.system?.subcategory?.value === undefined) itemData.system.subcategory = { value: (itemData.type in subcategory) ? foundry.utils.getProperty(itemData, subcategory[itemData.type]) : null };
            itemData.filters = {};

            // Prepare source
            const source = itemData.system.source.value;
            if (source) {
              sources.add(source);
              itemData.system.source.value = sluggify(source);
            }

            inventoryItems.push({
              type: itemData.type,
              name: itemData.name,
              img: itemData.img,
              uuid: `Compendium.${pack.collection}.${itemData._id}`,
              category: itemData.system.category.value ?? null,
              subcategory: itemData.system.subcategory.value ?? null,
              price: foundry.utils.getProperty(itemData, price[itemData.type] ?? price.default) ?? null,
              rarity: itemData.system.rarity.value ?? "",
              source: itemData.system.source.value ?? "",
              properties: itemData.system.properties ?? {}
            });
          }
        }
      }

      // Set indexData
      this.indexData = inventoryItems;

      // Filters
      this.filterData.checkboxes.consumableTypes.options = this.generateCheckboxOptions(CONFIG.SW5E.consumableTypes);
      this.filterData.checkboxes.consumableSubtypes.options = this.generateCheckboxOptions(CONFIG.SW5E.ammoTypes);
      this.filterData.checkboxes.equipmentTypes.options = this.generateCheckboxOptions(CONFIG.SW5E.equipmentTypes);
      this.filterData.checkboxes.modificationTypes.options = this.generateCheckboxOptions(CONFIG.SW5E.modificationTypes);
      this.filterData.checkboxes.starshipmodTypes.options = this.generateCheckboxOptions(CONFIG.SW5E.ssModSystems);
      this.filterData.checkboxes.toolTypes.options = this.generateCheckboxOptions(CONFIG.SW5E.toolTypes);
      this.filterData.checkboxes.weaponTypes.options = this.generateCheckboxOptions(CONFIG.SW5E.weaponTypes);
      this.filterData.checkboxes.weaponClasses.options = this.generateCheckboxOptions(CONFIG.SW5E.weaponClasses);

      this.filterData.multiselects.properties.options = this.generateMultiselectOptions({
        ...Object.fromEntries(Object.entries(CONFIG.SW5E.equipmentProperties).map(([k, v]) => [k, v.name])),
        ...Object.fromEntries(Object.entries(CONFIG.SW5E.weaponProperties).map(([k, v]) => [k, v.name]))
      });

      this.filterData.checkboxes.itemtypes.options = this.generateCheckboxOptions(CONFIG.SW5E.itemTypes.inventory.reduce((obj, type) => {
        obj[type] = `ITEM.Type${type.capitalize()}`;
        return obj;
      }, {}));
      this.filterData.checkboxes.rarity.options = this.generateCheckboxOptions(CONFIG.SW5E.itemRarity, false);
      this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

      console.log("SW5e System | Compendium Browser | Finished loading inventory items");
    }

    filterIndexData(entry) {
      const { checkboxes, multiselects, ranges } = this.filterData;

      // Price
      if (!(entry.price >= ranges.price.values.min && entry.price <= ranges.price.values.max)) return false;
      // Item type
      if (checkboxes.itemtypes.selected.length > 0 && !checkboxes.itemtypes.selected.includes(entry.type)) return false;
      // Consumable categories
      if (checkboxes.consumableTypes.selected.length > 0 && !checkboxes.consumableTypes.selected.includes(entry.category)) return false;
      // Consumable subcategories
      if (checkboxes.consumableSubtypes.selected.length > 0 && !checkboxes.consumableSubtypes.selected.includes(entry.subcategory)) return false;
      // Equipment categories
      if (checkboxes.equipmentTypes.selected.length > 0 && !checkboxes.equipmentTypes.selected.includes(entry.category)) return false;
      // Modification categories
      if (checkboxes.modificationTypes.selected.length > 0 && !checkboxes.modificationTypes.selected.includes(entry.category)) return false;
      // Starship Modification categories
      if (checkboxes.starshipmodTypes.selected.length > 0 && !checkboxes.starshipmodTypes.selected.includes(entry.category)) return false;
      // Tool categories
      if (checkboxes.toolTypes.selected.length > 0 && !checkboxes.toolTypes.selected.includes(entry.category)) return false;
      // Weapon categories
      if (checkboxes.weaponTypes.selected.length > 0 && !checkboxes.weaponTypes.selected.includes(entry.category)) return false;
      // Weapon subcategories
      if (checkboxes.weaponClasses.selected.length > 0 && !checkboxes.weaponClasses.selected.includes(entry.subcategory)) return false;
      // Source
      if (checkboxes.source.selected.length > 0 && !checkboxes.source.selected.includes(entry.source)) return false;
      // Rarity
      if (checkboxes.rarity.selected.length > 0 && !checkboxes.rarity.selected.includes(entry.rarity)) return false;
      // Properties
      if (!this.filterTraits(entry.properties, multiselects.properties.selected, multiselects.properties.conjunction, entry)) return false;
      return true;
    }

    parseRangeFilterInput(name, lower, upper) {
      if (name === "price") {
        return {
          min: Number(lower.replace(/[.,]/g, "") || 0),
          max: Number(upper.replace(/[.,]/g, "") || 20_000_000),
          inputMin: lower,
          inputMax: upper
        };
      }
      return super.parseRangeFilterInput(name, lower, upper);
    }

    prepareFilterData() {
      return {
        checkboxes: {
          itemtypes: {
            isExpanded: true,
            label: "SW5E.CompendiumBrowser.FilterInventoryTypes",
            options: {},
            selected: []
          },
          rarity: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterRarities",
            options: {},
            selected: []
          },
          consumableTypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterConsumableFilters",
            options: {},
            selected: []
          },
          consumableSubtypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterAmmoFilters",
            options: {},
            selected: []
          },
          equipmentTypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterEquipmentFilters",
            options: {},
            selected: []
          },
          modificationTypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterModificationFilters",
            options: {},
            selected: []
          },
          starshipmodTypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterSSModFilters",
            options: {},
            selected: []
          },
          toolTypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterToolFilters",
            options: {},
            selected: []
          },
          weaponTypes: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterWeaponTypeFilters",
            options: {},
            selected: []
          },
          weaponClasses: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterWeaponClassFilters",
            options: {},
            selected: []
          },
          source: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterSource",
            options: {},
            selected: []
          }
        },
        multiselects: {
          properties: {
            conjunction: "and",
            label: "SW5E.CompendiumBrowser.FilterProperties",
            options: [],
            selected: []
          }
        },
        order: {
          by: "name",
          direction: "asc",
          options: {
            name: "SW5E.CompendiumBrowser.SortyByNameLabel",
            price: "SW5E.CompendiumBrowser.SortyByPriceLabel"
          }
        },
        ranges: {
          price: {
            changed: false,
            isExpanded: false,
            label: "SW5E.Price",
            values: {
              min: 0,
              max: 20_000_000,
              inputMin: "",
              inputMax: ""
            }
          }
        },
        search: {
          text: ""
        }
      };
    }
}
