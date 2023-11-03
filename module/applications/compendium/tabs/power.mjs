import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserPowerTab extends CompendiumBrowserTab {
    tabName = "power";

    filterData;

    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/power.hbs";

    /* MiniSearch */
    searchFields = ["name"];

    storeFields = [
      "type",
      "name",
      "img",
      "uuid",
      "level",
      "time",
      "school",
      "source",
      "components"
    ];

    constructor(browser) {
      super(browser);

      // Set the filterData object of this tab
      this.filterData = this.prepareFilterData();
    }

    async loadData() {
      console.debug("SW5e System | Compendium Browser | Started loading powers");

      const powers = [];
      const sources = new Set();
      const indexFields = [
        "img",
        "system.level",
        "system.activation",
        "system.school",
        "system.source",
        "system.components"
      ];

      const data = this.browser.packLoader.loadPacks("Item", this.browser.loadedPacks("power"), indexFields);
      for await (const { pack, index } of data) {
        console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
        for (const powerData of index) {
          powerData.filters = {};

          if (powerData.type === "power") {
            if (!this.hasAllIndexFields(powerData, indexFields)) {
              console.warn(
                `Item '${powerData.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
              );
              continue;
            }

            // Prepare source
            const source = powerData.system.source;
            const sourceSlug = sluggify(source);
            if (source) sources.add(source);

            powers.push({
              type: powerData.type,
              name: powerData.name,
              img: powerData.img,
              uuid: `Compendium.${pack.collection}.${powerData._id}`,
              level: powerData.system.level,
              levelLabel: CONFIG.SW5E.powerLevels[powerData.system.level],
              components: powerData.system.components,
              school: powerData.system.school,
              schoolLabel: CONFIG.SW5E.powerSchools[powerData.system.school],
              time: powerData.system.activation.type,
              timeLabel: CONFIG.SW5E.abilityActivationTypes[powerData.system.activation.type],
              source: sourceSlug
            });
          }
        }
      }
      // Set indexData
      this.indexData = powers;

      // Filters
      this.filterData.checkboxes.school.options = this.generateCheckboxOptions(CONFIG.SW5E.powerSchools);
      this.filterData.checkboxes.level.options = this.generateCheckboxOptions(CONFIG.SW5E.powerLevels);
      this.filterData.checkboxes.time.options = this.generateCheckboxOptions(CONFIG.SW5E.abilityActivationTypes);
      this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
      this.filterData.multiselects.components.options = this.generateMultiselectOptions({
        ...Object.fromEntries(Object.entries(CONFIG.SW5E.powerTags).filter(([k, v]) => v.filter).map(([k, v]) => [k, v.label]))
      });

      console.debug("SW5e System | Compendium Browser | Finished loading powers");
    }

    filterIndexData(entry) {
      const { checkboxes, multiselects } = this.filterData;

      // Level
      if (checkboxes.level.selected.length) {
        const levels = checkboxes.level.selected.map(level => Number(level));
        if (!levels.includes(entry.level)) return false;
      }
      // School
      if (checkboxes.school.selected.length) {
        if (!checkboxes.school.selected.includes(entry.school)) return false;
      }
      // Casting time
      if (checkboxes.time.selected.length) {
        if (!(checkboxes.time.selected.includes(entry.time))) return false;
      }
      // Source
      if (checkboxes.source.selected.length) {
        if (!checkboxes.source.selected.includes(entry.source)) return false;
      }
      // Components
      if (!this.filterTraits(entry.components, multiselects.components.selected, multiselects.components.conjunction, entry)) return false;
      return true;
    }

    prepareFilterData() {
      return {
        checkboxes: {
          level: {
            isExpanded: true,
            label: "SW5E.CompendiumBrowser.FilterLevels",
            options: {},
            selected: []
          },
          school: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterSchools",
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
        multiselects: {
          components: {
            conjunction: "and",
            label: "SW5E.CompendiumBrowser.FilterProperties",
            options: [],
            selected: []
          }
        },
        selects: {},
        order: {
          by: "level",
          direction: "asc",
          options: {
            name: "SW5E.CompendiumBrowser.SortyByNameLabel",
            level: "SW5E.CompendiumBrowser.SortyByLevelLabel"
          }
        },
        search: {
          text: ""
        }
      };
    }
}
