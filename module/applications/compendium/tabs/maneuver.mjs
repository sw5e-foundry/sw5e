import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserManeuverTab extends CompendiumBrowserTab {
    tabName = "maneuver";

    filterData;

    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/maneuver.hbs";

    /* MiniSearch */
    searchFields = ["name"];

    storeFields = [
      "type",
      "name",
      "img",
      "uuid",
      "time",
      "category",
      "source"
    ];

    constructor(browser) {
      super(browser);

      // Set the filterData object of this tab
      this.filterData = this.prepareFilterData();
    }

    async loadData() {
      console.debug("SW5e System | Compendium Browser | Started loading maneuvers");

      const maneuvers = [];
      const sources = new Set();
      const indexFields = [
        "img",
        "system.activation",
        "system.maneuverType",
        "system.source"
      ];

      const data = this.browser.packLoader.loadPacks("Item", this.browser.loadedPacks("maneuver"), indexFields);
      for await (const { pack, index } of data) {
        console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
        for (const maneuverData of index) {
          maneuverData.filters = {};

          if (maneuverData.type === "maneuver") {
            if (!this.hasAllIndexFields(maneuverData, indexFields)) {
              console.warn(
                `Item '${maneuverData.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
              );
              continue;
            }

            // Prepare source
            const source = maneuverData.system.source.label ?? maneuverData.system.source.custom ?? maneuverData.system.source;
            const sourceSlug = sluggify(source);
            if (source) sources.add(source);

            maneuvers.push({
              type: maneuverData.type,
              name: maneuverData.name,
              img: maneuverData.img,
              uuid: `Compendium.${pack.collection}.${maneuverData._id}`,
              category: maneuverData.system.maneuverType,
              categoryLabel: CONFIG.SW5E.maneuverTypes[maneuverData.system.maneuverType],
              time: maneuverData.system.activation.type,
              timeLabel: CONFIG.SW5E.abilityActivationTypes[maneuverData.system.activation.type],
              source: sourceSlug
            });
          }
        }
      }
      // Set indexData
      this.indexData = maneuvers;

      // Filters
      this.filterData.checkboxes.category.options = this.generateCheckboxOptions(CONFIG.SW5E.maneuverTypes);
      this.filterData.checkboxes.time.options = this.generateCheckboxOptions(CONFIG.SW5E.abilityActivationTypes);
      this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

      console.debug("SW5e System | Compendium Browser | Finished loading maneuvers");
    }

    filterIndexData(entry) {
      const { checkboxes } = this.filterData;

      // Category
      if (checkboxes.category.selected.length) {
        if (!checkboxes.category.selected.includes(entry.category)) return false;
      }
      // Casting time
      if (checkboxes.time.selected.length) {
        if (!(checkboxes.time.selected.includes(entry.time))) return false;
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
          category: {
            isExpanded: true,
            label: "SW5E.CompendiumBrowser.FilterManeuverType",
            options: {},
            selected: []
          },
          time: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterCastingTime",
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
        selects: {},
        order: {
          by: "name",
          direction: "asc",
          options: {
            name: "SW5E.CompendiumBrowser.SortyByNameLabel"
          }
        },
        search: {
          text: ""
        }
      };
    }
}
