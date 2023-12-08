import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserClassificationTab extends CompendiumBrowserTab {
    tabName = "classification";

    filterData;

    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/classification.hbs";

    /* MiniSearch */
    searchFields = ["name"];

    storeFields = [
      "type",
      "name",
      "img",
      "uuid",
      "class",
      "source"
    ];

    constructor(browser) {
      super(browser);

      // Set the filterData object of this tab
      this.filterData = this.prepareFilterData();
    }

    async loadData() {
      console.debug("SW5e System | Compendium Browser | Started loading classifications");

      const classifications = [];
      const itemTypes = CONFIG.SW5E.itemTypes.class;
      const sources = new Set();
      const classes = new Set();
      const commonFields = [
        "img",
        "type",
        "system.source"
      ];
      const specificFields = {
        archetype: [
          "system.classIdentifier"
        ]
      };
      const indexFields = [...new Set([
        ...commonFields,
        ...specificFields.archetype
      ])];

      for await (const { pack, index } of this.browser.packLoader.loadPacks(
        "Item",
        this.browser.loadedPacks("classification"),
        indexFields
      )) {
        console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
        for (const classificationData of index) {
          if (itemTypes.includes(classificationData.type)) {
            const _fields = [
              ...commonFields,
              ...(specificFields[classificationData.type] ?? [])
            ];
            if (!this.hasAllIndexFields(classificationData, _fields)) {
              console.warn(
                `Classification '${classificationData.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
              );
              continue;
            }

            classificationData.filters = {};

            // Prepare class
            const _class = classificationData.system.classIdentifier;
            const classSlug = sluggify(_class ?? "");
            if (_class) classes.add(_class);

            // Prepare source
            const source = classificationData.system.source.label ?? classificationData.system.source.custom ?? classificationData.system.source;
            const sourceSlug = sluggify(source ?? "");
            if (source) sources.add(source);

            // Only store essential data
            classifications.push({
              type: classificationData.type,
              name: classificationData.name,
              img: classificationData.img,
              uuid: `Compendium.${pack.collection}.${classificationData._id}`,
              class: classSlug,
              source: sourceSlug
            });
          }
        }
      }

      // Set indexData
      this.indexData = classifications;

      // Filters
      this.filterData.checkboxes.type.options = this.generateCheckboxOptions(itemTypes.reduce((obj, type) => {
        obj[type] = `ITEM.Type${type.capitalize()}`;
        return obj;
      }, {}));
      this.filterData.checkboxes.class.options = this.generateSourceCheckboxOptions(classes);
      this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

      console.debug("SW5e System | Compendium Browser | Finished loading classifications");
    }

    filterIndexData(entry) {
      const { checkboxes } = this.filterData;

      // Type
      if (checkboxes.type.selected.length) {
        if (!checkboxes.type.selected.includes(entry.type)) return false;
      }
      // Class
      if (checkboxes.class.selected.length) {
        if (!checkboxes.class.selected.includes(entry.class)) return false;
      }
      // Source
      if (checkboxes.source.selected.length) {
        if (!checkboxes.source.selected.includes(entry.source)) return false;
      }
      return true;
    }

    prepareFilterData() {
      return {
        checkboxes: {
          type: {
            isExpanded: true,
            label: "SW5E.CompendiumBrowser.FilterType",
            options: {},
            selected: []
          },
          class: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterClass",
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
        multiselects: {},
        order: {
          by: "name",
          direction: "asc",
          options: {
            name: "SW5E.CompendiumBrowser.SortyByNameLabel"
          }
        },
        ranges: {},
        sliders: {},
        search: {
          text: ""
        }
      };
    }
}
