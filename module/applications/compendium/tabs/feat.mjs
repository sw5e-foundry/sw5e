import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowser } from "../_module.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserFeatTab extends CompendiumBrowserTab {
    tabName = "feat";
    filterData;
    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/feat.hbs";

    /* MiniSearch */
    searchFields = ["name"];
    storeFields = ["type", "name", "img", "uuid", "level", "featType", "skills", "traits", "rarity", "source"];

    constructor(browser) {
        super(browser);

        // Set the filterData object of this tab
        this.filterData = this.prepareFilterData();
    }

    async loadData() {
        console.debug("SW5e System | Compendium Browser | Started loading feats");

        const feats = [];
        const sources = new Set();
        const indexFields = [
            "img",
            "system.prerequisites.value",
            "system.actionType.value",
            "system.actions.value",
            "system.featType.value",
            "system.level.value",
            "system.traits",
            "system.source.value",
        ];

        const translatedSkills = Object.entries(CONFIG.SW5E.skillList).reduce(
            (result, [key, value]) => {
                return {
                    ...result,
                    [key]: game.i18n.localize(value).toLocaleLowerCase(game.i18n.lang),
                };
            },
            {}
        );
        const skillList = Object.entries(translatedSkills);

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

                    // Prerequisites are strings that could contain translated skill names
                    const prereqs = featData.system.prerequisites.value;
                    const prerequisitesArr = prereqs.map((prerequisite) =>
                        prerequisite?.value ? prerequisite.value.toLowerCase() : ""
                    );
                    const skills = new Set();
                    for (const prereq of prerequisitesArr) {
                        for (const [key, value] of skillList) {
                            // Check the string for the english translation key or a translated skill name
                            if (prereq.includes(key) || prereq.includes(value)) {
                                // Alawys record the translation key to enable filtering
                                skills.add(key);
                            }
                        }
                    }

                    // Prepare source
                    const source = featData.system.source.value;
                    if (source) {
                        sources.add(source);
                        featData.system.source.value = sluggify(source);
                    }

                    // Only store essential data
                    feats.push({
                        type: featData.type,
                        name: featData.name,
                        img: featData.img,
                        uuid: `Compendium.${pack.collection}.${featData._id}`,
                        level: featData.system.level.value,
                        featType: featData.system.featType.value,
                        skills: [...skills],
                        traits: featData.system.traits.value,
                        rarity: featData.system.traits.rarity,
                        source: featData.system.source.value,
                    });
                }
            }
        }

        // Set indexData
        this.indexData = feats;

        // Filters
        this.filterData.checkboxes.feattype.options = this.generateCheckboxOptions(CONFIG.SW5E.featTypes);
        this.filterData.checkboxes.skills.options = this.generateCheckboxOptions(CONFIG.SW5E.skillList);
        this.filterData.checkboxes.rarity.options = this.generateCheckboxOptions(CONFIG.SW5E.rarityTraits);
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);
        this.filterData.multiselects.traits.options = this.generateMultiselectOptions({ ...CONFIG.SW5E.featTraits });

        console.debug("SW5e System | Compendium Browser | Finished loading feats");
    }

    filterIndexData(entry) {
        const { checkboxes, multiselects, sliders } = this.filterData;

        // Level
        if (!(entry.level >= sliders.level.values.min && entry.level <= sliders.level.values.max)) return false;
        // Feat types
        if (checkboxes.feattype.selected.length) {
            if (!checkboxes.feattype.selected.includes(entry.featType)) return false;
        }
        // Skills
        if (checkboxes.skills.selected.length) {
            if (!this.arrayIncludes(checkboxes.skills.selected, entry.skills)) return false;
        }
        // Traits
        if (!this.filterTraits(entry.traits, multiselects.traits.selected, multiselects.traits.conjunction))
            return false;
        // Source
        if (checkboxes.source.selected.length) {
            if (!checkboxes.source.selected.includes(entry.source)) return false;
        }
        // Rarity
        if (checkboxes.rarity.selected.length) {
            if (!checkboxes.rarity.selected.includes(entry.rarity)) return false;
        }
        return true;
    }

    prepareFilterData() {
        return {
            checkboxes: {
                feattype: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterCategory",
                    options: {},
                    selected: [],
                },
                skills: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterSkills",
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
            order: {
                by: "level",
                direction: "asc",
                options: {
                    name: "SW5E.CompendiumBrowser.SortyByNameLabel",
                    level: "SW5E.CompendiumBrowser.SortyByLevelLabel",
                },
            },
            sliders: {
                level: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterLevels",
                    values: {
                        lowerLimit: 0,
                        upperLimit: 20,
                        min: 0,
                        max: 20,
                        step: 1,
                    },
                },
            },
            search: {
                text: "",
            },
        };
    }
}