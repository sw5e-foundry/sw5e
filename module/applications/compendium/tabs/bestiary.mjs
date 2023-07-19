import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowser } from "../_module.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserBestiaryTab extends CompendiumBrowserTab {
    tabName = "bestiary";
    filterData;
    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/bestiary.hbs";

    index = [
        "img",
        "system.details.level.value",
        "system.details.alignment.value",
        "system.details.source.value",
        "system.traits",
    ];

    /* MiniSearch */
    searchFields = ["name"];
    storeFields = [
        "type",
        "name",
        "img",
        "uuid",
        "level",
        "alignment",
        "actorSize",
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
        console.debug("SW5e System | Compendium Browser | Started loading Bestiary actors");

        const bestiaryActors = [];
        const sources = new Set();
        const indexFields = [...this.index, "system.details.isComplex"];

        for await (const { pack, index } of this.browser.packLoader.loadPacks(
            "Actor",
            this.browser.loadedPacks("bestiary"),
            indexFields
        )) {
            console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
            for (const actorData of index) {
                if (actorData.type === "npc") {
                    if (!this.hasAllIndexFields(actorData, this.index)) {
                        console.warn(
                            `Actor '${actorData.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
                        );
                        continue;
                    }
                    // Prepare source
                    const source = actorData.system.details.source.value;
                    if (source) {
                        sources.add(source);
                        actorData.system.details.source.value = sluggify(source);
                    }

                    bestiaryActors.push({
                        type: actorData.type,
                        name: actorData.name,
                        img: actorData.img,
                        uuid: `Compendium.${pack.collection}.${actorData._id}`,
                        level: actorData.system.details.level.value,
                        alignment: actorData.system.details.alignment.value,
                        actorSize: actorData.system.traits.size.value,
                        traits: actorData.system.traits.value,
                        rarity: actorData.system.traits.rarity,
                        source: actorData.system.details.source.value,
                    });
                }
            }
            console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - Loaded`);
        }

        // Set indexData
        this.indexData = bestiaryActors;

        // Filters
        this.filterData.checkboxes.sizes.options = this.generateCheckboxOptions(CONFIG.SW5E.actorSizes);
        this.filterData.checkboxes.alignments.options = this.generateCheckboxOptions(CONFIG.SW5E.alignments, false);
        this.filterData.multiselects.traits.options = this.generateMultiselectOptions(CONFIG.SW5E.monsterTraits);
        this.filterData.checkboxes.rarity.options = this.generateCheckboxOptions(CONFIG.SW5E.rarityTraits, false);
        this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

        console.debug("SW5e System | Compendium Browser | Finished loading Bestiary actors");
    }

    filterIndexData(entry) {
        const { checkboxes, multiselects, sliders } = this.filterData;

        // Level
        if (!(entry.level >= sliders.level.values.min && entry.level <= sliders.level.values.max)) return false;
        // Size
        if (checkboxes.sizes.selected.length) if (!checkboxes.sizes.selected.includes(entry.actorSize)) return false;
        // Alignment
        if (checkboxes.alignments.selected.length) if (!checkboxes.alignments.selected.includes(entry.alignment)) return false;
        // Traits
        if (!this.filterTraits(entry.traits, multiselects.traits.selected, multiselects.traits.conjunction)) return false;
        // Source
        if (checkboxes.source.selected.length) if (!checkboxes.source.selected.includes(entry.source)) return false;
        // Rarity
        if (checkboxes.rarity.selected.length) if (!checkboxes.rarity.selected.includes(entry.rarity)) return false;
        return true;
    }

    prepareFilterData() {
        return {
            checkboxes: {
                sizes: {
                    isExpanded: true,
                    label: "SW5E.CompendiumBrowser.FilterSizes",
                    options: {},
                    selected: [],
                },
                alignments: {
                    isExpanded: false,
                    label: "SW5E.CompendiumBrowser.FilterAlignments",
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
                        lowerLimit: -1,
                        upperLimit: 25,
                        min: -1,
                        max: 25,
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