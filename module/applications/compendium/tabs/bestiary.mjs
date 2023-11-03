import { sluggify } from "../../../utils.mjs";
import { CompendiumBrowserTab } from "./base.mjs";

export class CompendiumBrowserBestiaryTab extends CompendiumBrowserTab {
    tabName = "bestiary";

    filterData;

    templatePath = "systems/sw5e/templates/apps/compendium-browser/partials/bestiary.hbs";

    /* MiniSearch */
    searchFields = ["name"];

    storeFields = [
      "type",
      "name",
      "img",
      "uuid",
      "cr",
      "actorSize",
      "alignment",
      "creatureType",
      "creatureSubtype",
      "source",
      "traits"
    ];

    constructor(browser) {
      super(browser);

      // Set the filterData object of this tab
      this.filterData = this.prepareFilterData();
    }

    async loadData() {
      console.debug("SW5e System | Compendium Browser | Started loading Bestiary actors");

      const bestiaryActors = [];
      const actorTypes = [
        "npc",
        "starship"
      ];
      const alignments = new Set();
      const creatureTypes = new Set();
      const creatureSubtypes = new Set();
      const sources = new Set();
      const indexFields = [
        "img",
        "system.details.cr",
        "system.traits.size",
        "system.details.source"
      ];
      const optionals = [
        "system.details.alignment",
        "system.details.type",
        "system.details.powerForceLevel",
        "system.details.powerTechLevel",
        "system.details.superiorityLevel",
        "system.resources"
      ];

      for await (const { pack, index } of this.browser.packLoader.loadPacks(
        "Actor",
        this.browser.loadedPacks("bestiary"),
        [...indexFields, ...optionals]
      )) {
        console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - ${index.size} entries found`);
        for (const actorData of index) {
          if (actorTypes.includes(actorData.type)) {
            if (!this.hasAllIndexFields(actorData, indexFields)) {
              console.warn(
                `Actor '${actorData.name}' does not have all required data fields. Consider unselecting pack '${pack.metadata.label}' in the compendium browser settings.`
              );
              continue;
            }

            // Prepare alignment
            const alignment = actorData.system.details.alignment;
            const alignmentSlug = sluggify(alignment);
            if (alignment) alignments.add(alignment);

            // Prepare creature type
            const creatureType = actorData.system.details.type.value;
            const typeSlug = sluggify(creatureType);
            if (creatureType) creatureTypes.add(creatureType);

            // Prepare creature subtype
            const creatureSubtype = actorData.system.details.type.subtype;
            const subtypeSlug = sluggify(creatureSubtype);
            if (creatureSubtype) creatureSubtypes.add(creatureSubtype);

            // Prepare source
            const source = actorData.system.details.source;
            const sourceSlug = sluggify(source);
            if (source) sources.add(source);

            // Prepare traits
            const traits = {
              isForceCaster: !!actorData.system.details.powerForceLevel,
              isTechCaster: !!actorData.system.details.powerTechLevel,
              isSuperiorityCaster: !!actorData.system.details.superiorityLevel,
              isSwarm: !!actorData.system.details.type.swarm,
              hasLairAct: !!actorData.system.resources.lair.value,
              hasLegAct: !!actorData.system.resources.legact.max,
              hasLegRes: !!actorData.system.resources.legres.max,
            };

            bestiaryActors.push({
              type: actorData.type,
              name: actorData.name,
              img: actorData.img,
              uuid: `Compendium.${pack.collection}.${actorData._id}`,
              cr: actorData.system.details.cr,
              actorSize: actorData.system.traits.size,
              alignment: alignmentSlug,
              creatureType: typeSlug,
              creatureSubtype: subtypeSlug,
              source: sourceSlug,
              traits: traits
            });
          }
        }
        console.debug(`SW5e System | Compendium Browser | ${pack.metadata.label} - Loaded`);
      }

      // Set indexData
      this.indexData = bestiaryActors;

      // Filters
      this.filterData.checkboxes.sizes.options = this.generateCheckboxOptions(CONFIG.SW5E.actorSizes);
      this.filterData.checkboxes.alignment.options = this.generateSourceCheckboxOptions(alignments);
      this.filterData.checkboxes.creatureType.options = this.generateSourceCheckboxOptions(creatureTypes);
      this.filterData.checkboxes.creatureSubtype.options = this.generateSourceCheckboxOptions(creatureSubtypes);
      this.filterData.checkboxes.source.options = this.generateSourceCheckboxOptions(sources);

      this.filterData.multiselects.traits.options = this.generateMultiselectOptions({
        isForceCaster: "SW5E.CompendiumBrowser.FilterForceCaster",
        isTechCaster: "SW5E.CompendiumBrowser.FilterTechCaster",
        isSuperiorityCaster: "SW5E.CompendiumBrowser.FilterSuperiorityCaster",
        isSwarm: "SW5E.CompendiumBrowser.FilterSwarm",
        hasLairAct: "SW5E.CompendiumBrowser.FilterLairAct",
        hasLegAct: "SW5E.CompendiumBrowser.FilterLegAct",
        hasLegRes: "SW5E.CompendiumBrowser.FilterLegRes",
      });

      console.debug("SW5e System | Compendium Browser | Finished loading Bestiary actors");
    }

    filterIndexData(entry) {
      const { checkboxes, multiselects, ranges } = this.filterData;

      // CR
      if (!(entry.cr >= ranges.cr.values.min && entry.cr <= ranges.cr.values.max)) return false;
      // Size
      if (checkboxes.sizes.selected.length) if (!checkboxes.sizes.selected.includes(entry.actorSize)) return false;
      // Alignment
      if (checkboxes.alignment.selected.length) if (!checkboxes.alignment.selected.includes(entry.alignment)) return false;
      // Creature Type
      if (checkboxes.creatureType.selected.length) if (!checkboxes.creatureType.selected.includes(entry.creatureType)) return false;
      // Creature Subtype
      if (checkboxes.creatureSubtype.selected.length) if (!checkboxes.creatureSubtype.selected.includes(entry.creatureSubtype)) return false;
      // Source
      if (checkboxes.source.selected.length) if (!checkboxes.source.selected.includes(entry.source)) return false;
      // Traits
      if (!this.filterTraits(entry.traits, multiselects.traits.selected, multiselects.traits.conjunction, entry)) return false;
      return true;
    }

    prepareFilterData() {
      return {
        checkboxes: {
          sizes: {
            isExpanded: true,
            label: "SW5E.CompendiumBrowser.FilterSizes",
            options: {},
            selected: []
          },
          alignment: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterAlignment",
            options: {},
            selected: []
          },
          creatureType: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterCreatureType",
            options: {},
            selected: []
          },
          creatureSubtype: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterCreatureSubtype",
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
          traits: {
            conjunction: "and",
            label: "SW5E.CompendiumBrowser.FilterTraits",
            options: [],
            selected: []
          }
        },
        order: {
          by: "cr",
          direction: "asc",
          options: {
            name: "SW5E.CompendiumBrowser.SortyByNameLabel",
            cr: "SW5E.CompendiumBrowser.SortyByCRLabel"
          }
        },
        ranges: {
          cr: {
            isExpanded: false,
            label: "SW5E.CompendiumBrowser.FilterCR",
            values: {
              min: 0,
              max: 30,
              lowerLimit: 0,
              upperLimit: 30,
            }
          }
        },
        search: {
          text: ""
        }
      };
    }
}
