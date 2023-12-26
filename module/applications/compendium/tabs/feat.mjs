import { sluggify, getComposedRegex } from "../../../utils.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserFeatTab extends CompendiumBrowserTab {
    tabName = "feat";

    filterData;

    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/feat.hbs";

    /* MiniSearch */
    searchFields = ["name"];

    storeFields = [
      "type",
      "name",
      "img",
      "uuid",
      "level",
      "class",
      "category",
      "subcategory",
      "source"
    ];

    constructor(browser) {
      super(browser);

      // Set the filterData object of this tab
      this.filterData = this.prepareFilterData();
    }

    async loadData() {
      console.debug("SW5e System | Compendium Browser | Started loading feats");

      const feats = [];
      const pos_pattern = getComposedRegex(
        "i",
        /^(?<level_a>\d+)(?:st|nd|rd|th) (?:level|rank|tier)/,
        /^At least (?<level_b>\d+) (?:levels|ranks|tiers) in (?<class_b>.*)$/,
        /^(?<class_c>[^,\d]+) (?<level_c>\d+)(?:st|nd|rd|th)?(?: level| rank| tier)?(?:,|$)/,
        /^(?<class_d>[^,\d]+)(?:,|$)/
      );
      const neg_pattern = /(strength|dexterity|constitution|intelligence|wisdom|charisma|ability to cast|type|size|no levels in)/i;
      const sources = new Set();
      const classes = new Set();
      const indexFields = [
        "img",
        "system.activation",
        "system.requirements",
        "system.type",
        "system.source"
      ];

      for await (const { pack, index } of this.browser.packLoader.loadPacks(
        "Item",
        this.browser.loadedPacks("feat"),
        indexFields
      )) {
        console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
        for (const featData of index) {
          if (featData.type === "feat") {
            featData.filters = {};
            if (!this.hasAllIndexFields(featData, indexFields)) {
              console.warn(
                `Feat '${featData.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
              );
              continue;
            }

            const match = featData.system.requirements?.match(pos_pattern);
            const neg = neg_pattern.test(featData.system.requirements);
            const p_class = neg ? undefined : (match?.groups?.class_a ?? match?.groups?.class_b ?? match?.groups?.class_c ?? match?.groups?.class_d);
            const p_level = neg ? undefined : (match?.groups?.level_a ?? match?.groups?.level_b ?? match?.groups?.level_c ?? match?.groups?.level_d);
            if (p_class) classes.add(p_class);

            // Prepare source
            const source = featData.system.source.label ?? featData.system.source.custom ?? featData.system.source;
            const sourceSlug = sluggify(source ?? "");
            if (source) sources.add(source);

            // Only store essential data
            feats.push({
              type: featData.type,
              name: featData.name,
              img: featData.img,
              uuid: `Compendium.${pack.collection}.${featData._id}`,
              class: sluggify(p_class ?? ""),
              level: p_level,
              category: featData.system.type.value,
              subcategory: featData.system.type.subtype,
              source: sourceSlug
            });
          }
        }
      }

      // Set indexData
      this.indexData = feats;

      // Filters
      this.filterData.checkboxes.category.options = this.generateCheckboxOptions(
        Object.fromEntries(Object.entries(CONFIG.SW5E.featureTypes).map(([k, v]) => [k, v.label]))
      );
      this.filterData.checkboxes.subcategory.options = this.generateCheckboxOptions(
        Object.fromEntries(Object.values(CONFIG.SW5E.featureTypes).map(v => Object.entries(v.subtypes ?? {})).flat())
      );
      this.filterData.checkboxes.class.options = this.generateSourceCheckboxOptions(classes);
      this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

      console.debug("SW5e System | Compendium Browser | Finished loading feats");
    }

    filterIndexData(entry) {
      const { checkboxes, ranges } = this.filterData;

      // Category
      if (checkboxes.category.selected.length) {
        if (!checkboxes.category.selected.includes(entry.category)) return false;
      }
      // Subcategory
      if (checkboxes.subcategory.selected.length) {
        if (!checkboxes.subcategory.selected.includes(entry.subcategory)) return false;
      }
      // Level
      if (!((entry.level ?? 0) >= ranges.level.values.min && (entry.level ?? 0) <= ranges.level.values.max)) return false;
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

    parseRangeFilterInput(name, lower, upper) {
      if (name === "price") {
        lower ??= 0;
        upper ??= 20;
      }
      return super.parseRangeFilterInput(name, lower, upper);
    }

    prepareFilterData() {
      return {
        checkboxes: {
          category: {
            isExpanded: true,
            label: "SW5E.CompendiumBrowser.FilterCategory",
            options: {},
            selected: []
          },
          subcategory: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterSubcategory",
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
          by: "level",
          direction: "asc",
          options: {
            name: "SW5E.CompendiumBrowser.SortyByNameLabel",
            level: "SW5E.CompendiumBrowser.SortyByLevelLabel"
          }
        },
        ranges: {
          level: {
            changed: false,
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterLevels",
            values: {
              min: 0,
              max: 20,
              inputMin: "",
              inputMax: ""
            }
          }
        },
        sliders: {},
        search: {
          text: ""
        }
      };
    }
}
