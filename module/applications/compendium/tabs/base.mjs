import { sluggify } from "../../../utils.mjs";
import MiniSearch from "minisearch";

export class CompendiumBrowserTab {
    /** A reference to the parent CompendiumBrowser */
    browser;

    /** The filter schema for this tab; The tabs filters are rendered based on this.*/
    filterData;

    /** An unmodified copy of this.filterData */
    defaultFilterData;

    /** The full CompendiumIndex of this tab */
    indexData = [];

    /** Is this tab initialized? */
    isInitialized = false;

    /** The total count of items in the currently filtered index */
    totalItemCount = 0;

    /** The initial display limit for this tab; Scrolling is currently hardcoded to +100 */
    scrollLimit = 100;

    /** The name of this tab */
    tabName;

    /** A DOMParser instance */
    #domParser = new DOMParser();

    /** The path to the result list template of this tab */
    templatePath;

    /** Minisearch */
    searchEngine;

    /** Names of the document fields to be indexed. */
    searchFields = [];

    /** Names of fields to store, so that search results would include them.
     *  By default none, so resuts would only contain the id field. */
    storeFields = [];

    constructor(browser) {
      this.browser = browser;
    }

    /** Initialize this this tab */
    async init() {
      // Load the index and populate filter data
      await this.loadData();
      // Initialize MiniSearch
      this.searchEngine = new MiniSearch({
        fields: this.searchFields,
        idField: "uuid",
        storeFields: this.storeFields,
        searchOptions: { combineWith: "AND", prefix: true }
      });
      this.searchEngine.addAll(this.indexData);
      // Set defaultFilterData for resets
      this.defaultFilterData = deepClone(this.filterData);
      // Initialization complete
      this.isInitialized = true;
    }

    /** Open this tab
     * @param filter An optional initial filter for this tab
     */
    async open(filter) {
      if (filter) {
        if (!this.isInitialized) throw Error(`Tried to pass an initial filter to uninitialized tab "${this.tabName}"`);
        this.filterData = filter;
      }
      await this.browser.loadTab(this.tabName);
    }

    /**
     * Filter indexData and return slice based on current scrollLimit
     * @param start
     */
    getIndexData(start) {
      if (!this.isInitialized) throw Error(`Compendium Browser Tab "${this.tabName}" is not initialized!`);

      const currentIndex = (() => {
        const searchText = this.filterData.search.text;
        if (searchText) {
          const searchResult = this.searchEngine.search(searchText);
          return this.sortResult(searchResult.filter(this.filterIndexData.bind(this)));
        }
        return this.sortResult(this.indexData.filter(this.filterIndexData.bind(this)));
      })();
      this.totalItemCount = currentIndex.length;
      return currentIndex.slice(start, this.scrollLimit);
    }

    /** Returns a clean copy of the filterData for this tab. Initializes the tab if necessary. */
    async getFilterData() {
      if (!this.isInitialized) await this.init();
      return deepClone(this.defaultFilterData);
    }

    /** Reset all filters */
    resetFilters() {
      this.filterData = deepClone(this.defaultFilterData);
    }

    /**
     * Check this tabs type
     * @param {...any} types
     */
    isOfType(...types) {
      return types.some(t => this.tabName === t);
    }

    /** Load and prepare the compendium index and set filter options */
    loadData() {}

    /** Prepare the the filterData object of this tab */
    prepareFilterData() {}

    /**
     * Filter indexData
     * @param _entry
     */
    filterIndexData(_entry) {
      return true;
    }

    filterTraits(traits, selected, condition) {
      const selectedTraits = selected.filter(s => !s.not).map(s => s.value);
      const notTraits = selected.filter(t => t.not).map(s => s.value);
      if (selectedTraits.length || notTraits.length) {
        if (notTraits.some(t => traits[t])) return false;
        const fullfilled = condition === "and"
          ? selectedTraits.every(t => traits[t])
          : selectedTraits.some(t => traits[t]);
        if (!fullfilled) return false;
      }
      return true;
    }

    async renderResults(start) {
      if (!this.templatePath) throw Error(`Tab "${this.tabName}" has no valid template path.`);
      const indexData = this.getIndexData(start);
      const liElements = [];
      for (const entry of indexData) {
        const htmlString = await renderTemplate(this.templatePath, {
          entry,
          filterData: this.filterData
        });
        const html = this.#domParser.parseFromString(htmlString, "text/html");
        liElements.push(html.body.firstElementChild);
      }
      return liElements;
    }

    /**
     * Sort result array by name, level or price
     * @param result
     */
    sortResult(result) {
      const { order } = this.filterData;
      const lang = game.i18n.lang;
      const sorted = result.sort((entryA, entryB) => {
        switch (order.by) {
          case "name":
            return entryA.name.localeCompare(entryB.name, lang);
          case "level":
          case "price":
          case "cr":
            return (entryA[order.by] ?? 0) - (entryB[order.by] ?? 0) || entryA.name.localeCompare(entryB.name, lang);
          default:
            return 0;
        }
      });
      return order.direction === "asc" ? sorted : sorted.reverse();
    }

    /**
     * Return new range filter values based on input
     * @param _name
     * @param lower
     * @param upper
     */
    parseRangeFilterInput(_name, lower, upper) {
      return {
        min: Number(lower) || 0,
        max: Number(upper) || 0,
        inputMin: lower,
        inputMax: upper
      };
    }

    /**
     * Check if an array includes any keys of another array
     * @param array
     * @param other
     */
    arrayIncludes(array, other) {
      return other.some(value => array.includes(value));
    }

    /**
     * Generates a localized and sorted CheckBoxOptions object from config data
     * @param configData
     * @param sort
     */
    generateCheckboxOptions(configData, sort = true) {
      // Localize labels for sorting
      const localized = Object.entries(configData).reduce(
        (result, [key, label]) => ({
          ...result,
          [key]: game.i18n.localize(label)
        }),
        {}
      );
        // Return localized and sorted CheckBoxOptions
      return Object.entries(sort ? this.sortedConfig(localized) : localized).reduce(
        (result, [key, label]) => ({
          ...result,
          [key]: {
            label,
            selected: false
          }
        }),
        {}
      );
    }

    generateMultiselectOptions(optionsRecord, sort = true) {
      const options = Object.entries(optionsRecord).map(([value, label]) => ({
        value,
        label: game.i18n.localize(label)
      }));
      if (sort) options.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

      return options;
    }

    /**
     * Generates a sorted CheckBoxOptions object from a sources Set
     * @param sources
     */
    generateSourceCheckboxOptions(sources) {
      return [...sources].sort().reduce(
        (result, source) => ({
          ...result,
          [sluggify(source)]: {
            label: source,
            selected: false
          }
        }),
        {}
      );
    }

    /**
     * Provide a best-effort sort of an object (e.g. CONFIG.sw5e.monsterTraits)
     * @param obj
     */
    sortedConfig(obj) {
      return Object.fromEntries(
        [...Object.entries(obj)].sort((entryA, entryB) => entryA[1].localeCompare(entryB[1], game.i18n.lang))
      );
    }

    /**
     * Ensure all index fields are present in the index data
     * @param data
     * @param indexFields
     */
    hasAllIndexFields(data, indexFields) {
      for (const field of indexFields) if (getProperty(data, field) === undefined) return false;
      return true;
    }
}
