import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowser } from "../_module.mjs";
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
        "category",
        "school",
        "traditions",
        "traits",
        "rarity",
        "source",
    ];

    constructor(browser) {
        super(browser);

        // Set the filterData object of this tab
        this.filterData = this.prepareFilterData();
    }

    async loadData() {
        console.debug("SW5e System | Compendium Browser | Started loading powers");

        const powers = [];
        const times = new Set();
        const sources = new Set();
        const indexFields = [
            "img",
            "system.level.value",
            "system.category.value",
            "system.traditions.value",
            "system.time",
            "system.school.value",
            "system.traits",
            "system.source.value",
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
                    // Set category of cantrips to "cantrip" until migration can be done
                    if (powerData.system.traits.value.includes("cantrip")) {
                        powerData.system.category.value = "cantrip";
                    }

                    // recording casting times
                    let time = powerData.system.time.value;
                    if (time) {
                        if (time.includes("reaction")) time = "reaction";
                        times.add(time);
                        powerData.system.time.value = sluggify(time);
                    }

                    // format casting time
                    if (powerData.system.time.value === "reaction") {
                        powerData.system.time.img = getActionIcon("reaction");
                    } else if (powerData.system.time.value === "free") {
                        powerData.system.time.img = getActionIcon("free");
                    } else {
                        powerData.system.time.img = getActionIcon(powerData.system.time.value);
                    }

                    if (powerData.system.time.img === "systems/sw5e/icons/actions/Empty.webp") {
                        powerData.system.time.img = "systems/sw5e/icons/actions/LongerAction.webp";
                    }

                    // Prepare source
                    const source = powerData.system.source.value;
                    if (source) {
                        sources.add(source);
                        powerData.system.source.value = sluggify(source);
                    }

                    powers.push({
                        type: powerData.type,
                        name: powerData.name,
                        img: powerData.img,
                        uuid: `Compendium.${pack.collection}.${powerData._id}`,
                        level: powerData.system.level.value,
                        time: powerData.system.time,
                        category: powerData.system.category.value,
                        school: powerData.system.school.value,
                        traditions: powerData.system.traditions.value,
                        traits: powerData.system.traits.value,
                        rarity: powerData.system.traits.rarity,
                        source: powerData.system.source.value,
                    });
                }
            }
        }
        // Set indexData
        this.indexData = powers;

        // Filters
        this.filterData.checkboxes.category.options = this.generateCheckboxOptions(CONFIG.SW5E.powerCategories);
        this.filterData.checkboxes.category.options.cantrip = {
            label: "SW5E.PowerCantripLabel",
            selected: false,
        };
        this.filterData.checkboxes.traditions.options = this.generateCheckboxOptions(CONFIG.SW5E.magicTraditions);
        // Special case for power levels
        for (let i = 1; i <= 10; i++) {
            this.filterData.checkboxes.level.options[`${i}`] = {
                label: game.i18n.localize(`SW5E.PowerLevel${i}`),
                selected: false,
            };
        }
        this.filterData.checkboxes.school.options = this.generateCheckboxOptions(CONFIG.SW5E.magicSchools);
        this.filterData.checkboxes.rarity.options = this.generateCheckboxOptions(CONFIG.SW5E.rarityTraits, false);
        this.filterData.multiselects.traits.options = this.generateMultiselectOptions(CONFIG.SW5E.powerTraits);
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

        this.filterData.selects.timefilter.options = [...times].sort().reduce(
            (result, time) => ({
                ...result,
                [sluggify(time)]: time,
            }),
            {}
        );

        console.debug("SW5e System | Compendium Browser | Finished loading powers");
    }

    filterIndexData(entry) {
        const { checkboxes, multiselects, selects } = this.filterData;

        // Level
        if (checkboxes.level.selected.length) {
            const levels = checkboxes.level.selected.map((level) => Number(level));
            if (!levels.includes(entry.level)) return false;
        }
        // Casting time
        if (selects.timefilter.selected) {
            if (!(selects.timefilter.selected === entry.time.value)) return false;
        }
        // Category
        if (checkboxes.category.selected.length) {
            if (!checkboxes.category.selected.includes(entry.category)) return false;
        }
        // Traditions
        if (checkboxes.traditions.selected.length) {
            if (!this.arrayIncludes(checkboxes.traditions.selected, entry.traditions)) return false;
        }
        // Traits
        if (!this.filterTraits(entry.traits, multiselects.traits.selected, multiselects.traits.conjunction))
            return false;
        // School
        if (checkboxes.school.selected.length) {
            if (!checkboxes.school.selected.includes(entry.school)) return false;
        }
        // Rarity
        if (checkboxes.rarity.selected.length) {
            if (!checkboxes.rarity.selected.includes(entry.rarity)) return false;
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
                    label: "SW5E.CompendiumBrowser.FilterPowerCategories",
                    options: {},
                    selected: [],
                },
                traditions: {
                    isExpanded: true,
                    label: "SW5E.CompendiumBrowser.FilterTraditions",
                    options: {},
                    selected: [],
                },
                level: {
                    isExpanded: true,
                    label: "SW5E.CompendiumBrowser.FilterLevels",
                    options: {},
                    selected: [],
                },
                school: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterSchools",
                    options: {},
                    selected: [],
                },
                rarity: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterRarities",
                    options: {},
                    selected: [],
                },
                source: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterSource",
                    options: {},
                    selected: [],
                },
            },
            multiselects: {
                traits: {
                    conjunction: "and",
                    label: "SW5E.CompendiumBrowser.FilterTraits",
                    options: [],
                    selected: [],
                },
            },
            selects: {
                timefilter: {
                    label: "SW5E.CompendiumBrowser.FilterCastingTime",
                    options: {},
                    selected: "",
                },
            },
            order: {
                by: "level",
                direction: "asc",
                options: {
                    name: "SW5E.CompendiumBrowser.SortyByNameLabel",
                    level: "SW5E.CompendiumBrowser.SortyByLevelLabel",
                },
            },
            search: {
                text: "",
            },
        };
    }
}