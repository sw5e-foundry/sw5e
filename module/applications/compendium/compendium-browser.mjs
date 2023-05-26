import { Progress } from "./progress.mjs";
import { fontAwesomeIcon, htmlQueryAll, objectHasKey, isObject, getSelectedOrOwnActors } from "../../utils.mjs"
import * as browserTabs from "./tabs/_module.mjs";
import Tagify from '@yaireo/tagify';

class PackLoader {
  loadedPacks = { Actor: {}, Item: {} };

  /**
   * Loads compendium packs.
   * @param {string} documentType         "Actor" or "Item".
   * @param {string[]} packs              ID of packs to load.
   * @param {string[]} indexFields        Document fields to include in the index.
   * @yields The data of each loaded pack.
   */
  async *loadPacks(documentType, packs, indexFields) {
    this.loadedPacks[documentType] ??= {};

    const progress = new Progress({ steps: packs.length });
    for (const packId of packs) {
      let data = this.loadedPacks[documentType][packId];
      if (data) {
        const { pack } = data;
        progress.advance(game.i18n.format("SW5E.CompendiumBrowser.ProgressBar.LoadingPack", { pack: pack?.metadata.label ?? "" }));
      } else {
        const pack = game.packs.get(packId);
        if (!pack) {
          progress.advance("");
          continue;
        }
        progress.advance(game.i18n.format("SW5E.CompendiumBrowser.ProgressBar.LoadingPack", { pack: pack.metadata.label }));
        if (pack.documentName === documentType) {
          const index = await pack.getIndex({ fields: indexFields });
          const firstResult = index.contents.at(0) ?? {};
          // Every result should have the "system" property otherwise the indexFields were wrong for that pack
          if (firstResult.system) {
            // this.setModuleArt(packId, index);
            data = { pack, index };
            this.loadedPacks[documentType][packId] = data;
          } else {
            ui.notifications.warn(
              game.i18n.format("SW5E.CompendiumBrowser.ProgressBar.WarnPackNotLoaded", { pack: pack.collection })
            );
            continue;
          }
        } else {
          continue;
        }
      }

      yield data;
    }
    progress.close("SW5E.CompendiumBrowser.ProgressBar.LoadingComplete");
  }

  // /**
  //  * Set art provided by a module if any is available
  //  * @param {string} packName
  //  * @param {object} index
  //  */
  // setModuleArt(packName, index) {
  //     if (!packName.startsWith("sw5e.")) return;
  //     for (const record of index) {
  //         const uuid: CompendiumUUID = `Compendium.${packName}.${record._id}`;
  //         const actorArt = game.sw5e.system.moduleArt.map.get(uuid)?.img;
  //         record.img = actorArt ?? record.img;
  //     }
  // }
}

export default class CompendiumBrowser extends Application {
  settings;
  dataTabsList = [ "equipment" ];
  navigationTab;
  tabs;

  packLoader = new PackLoader();
  activeTab;

  constructor(options = {}) {
    super(options);

    this.settings = {} ?? game.settings.get("sw5e", "compendiumBrowserPacks");
    this.navigationTab = this.hookTab();
    this.tabs = {
      // action: new browserTabs.Actions(this),
      // bestiary: new browserTabs.Bestiary(this),
      equipment: new browserTabs.Equipment(this),
      // feat: new browserTabs.Feats(this),
      // hazard: new browserTabs.Hazards(this),
      // power: new browserTabs.Powers(this),
    };

    this.initCompendiumList();
  }

  /** @inheritdoc */
  get title() {
    return game.i18n.localize("SW5E.CompendiumBrowser.Title");
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "compendium-browser",
      classes: [],
      template: "systems/sw5e/templates/apps/compendium-browser/compendium-browser.hbs",
      width: 800,
      height: 700,
      resizable: true,
      dragDrop: [{ dragSelector: "ul.item-list > li.item" }],
      tabs: [
        {
          navSelector: "nav",
          contentSelector: "section.content",
          initial: "landing-page",
        },
      ],
      scrollY: [".control-area", ".item-list"],
    });
  }

  // /** @inheritdoc */
  // async render(force, options) {
  //   return super.render(force, options);
  // }

  /** Reset initial filtering */
  async close(options) {
    for (const tab of Object.values(this.tabs)) tab.filterData.search.text = "";
    await super.close(options);
  }

  hookTab() {
    const navigationTab = this._tabs[0];
    const tabCallback = navigationTab.callback;
    navigationTab.callback = async (event, tabs, active) => {
      tabCallback?.(event, tabs, active);
      await this.loadTab(active);
    };
    return navigationTab;
  }

  initCompendiumList() {
    const settings = {
      bestiary: {},
      shipyard: {},

      equipment: {},
      class: {},
      other: {},
      feat: {},
    };

    // NPCs and Hazards are all loaded by default other packs can be set here.
    const loadDefault = {
      "sw5e.adventuringgear": true,
      "sw5e.ammo": true,
      "sw5e.archetypefeatures": true,
      "sw5e.archetypes": true,
      "sw5e.armor": true,
      // "sw5e.armorproperties": true,
      "sw5e.backgrounds": true,
      "sw5e.blasters": true,
      "sw5e.classes": true,
      "sw5e.classfeatures": true,
      "sw5e.conditions": true,
      "sw5e.consumables": true,
      "sw5e.deploymentfeatures": true,
      "sw5e.deployments": true,
      "sw5e.enhanceditems": true,
      "sw5e.explosives": true,
      "sw5e.feats": true,
      "sw5e.fightingstyles": true,
      "sw5e.fightingmasteries": true,
      "sw5e.fistoscodex": true,
      "sw5e.forcepowers": true,
      "sw5e.gamingsets": true,
      "sw5e.implements": true,
      "sw5e.invocations": true,
      "sw5e.kits": true,
      "sw5e.lightsaberform": true,
      "sw5e.lightweapons": true,
      "sw5e.maneuvers": true,
      "sw5e.monsters": true,
      "sw5e.monstertraits": true,
      "sw5e.monsters_temp": false,
      "sw5e.modifications": true,
      "sw5e.musicalinstruments": true,
      "sw5e.species": true,
      "sw5e.speciesfeatures": true,
      "sw5e.shipyard": true,
      "sw5e.starshipactions": true,
      "sw5e.starshiparmor": true,
      "sw5e.starshipequipment": true,
      "sw5e.starshipfeatures": true,
      "sw5e.starshipmodifications": true,
      "sw5e.starships": true,
      "sw5e.starshipweapons": true,
      // "sw5e.tables": true,
      "sw5e.techpowers": true,
      "sw5e.ventures": true,
      "sw5e.vibroweapons": true,
      // "sw5e.weaponproperties": true,
    };

    for (const pack of game.packs) {
      const types = new Set(pack.index.map((entry) => entry.type));
      types.delete(undefined);
      if (types.size === 0) continue;

      if (types.has("npc")) {
        const load = this.settings.bestiary?.[pack.collection]?.load ?? true;
        settings.bestiary[pack.collection] = {
          load,
          name: pack.metadata.label,
        };
      }
      if (types.has("starship")) {
        const load = this.settings.shipyard?.[pack.collection]?.load ?? true;
        settings.shipyard[pack.collection] = {
          load,
          name: pack.metadata.label,
        };
      }

      let t = CONFIG.SW5E.itemTypes.inventory.find((type) => types.has(type));
      if (t !== undefined) {
        const load = this.settings.equipment?.[pack.collection]?.load ?? !!loadDefault[pack.collection];
        settings.equipment[pack.collection] = {
          load,
          name: pack.metadata.label,
        };
        continue;
      }

      t = CONFIG.SW5E.itemTypes.class.find((type) => types.has(type));
      if (t !== undefined) {
        const load = this.settings.class?.[pack.collection]?.load ?? !!loadDefault[pack.collection];
        settings.class[pack.collection] = {
          load,
          name: pack.metadata.label,
        };
      }

      t = CONFIG.SW5E.itemTypes.other.find((type) => types.has(type));
      if (t !== undefined) {
        const load = this.settings.other?.[pack.collection]?.load ?? !!loadDefault[pack.collection];
        settings.other[pack.collection] = {
          load,
          name: pack.metadata.label,
        };
      }

      if (types.has("feat")) {
        const load = this.settings.feat?.[pack.collection]?.load ?? !!loadDefault[pack.collection];
        settings.feat[pack.collection] = {
          load,
          name: pack.metadata.label,
        };
      }
    }

    for (const tab of this.dataTabsList) {
      settings[tab] = Object.fromEntries(
        Object.entries(settings[tab]).sort(([_collectionA, dataA], [_collectionB, dataB]) => {
          return (dataA?.name ?? "") > (dataB?.name ?? "") ? 1 : -1;
        })
      );
    }

    this.settings = settings;
  }

  /**
   * Opens a tab, optionally setting the filter.
   * @param {string} tabName
   * @param {string} [filter]
   */
  async openTab(tabName, filter) {
    this.activeTab = tabName;
    if (tabName !== "settings" && filter) return this.tabs[tabName].open(filter);
    return this.loadTab(tabName);
  }

  async openPowerTab(entry, maxLevel = 10) {
    const powerTab = this.tabs.power;
    const filter = await powerTab.getFilterData();
    const { category, level, traditions } = filter.checkboxes;

    if (entry.isRitual || entry.isFocusPool) {
      category.options[entry.category].selected = true;
      category.selected.push(entry.category);
    }

    if (maxLevel) {
      const levels = Array.from(Array(maxLevel).keys()).map((l) => String(l + 1));
      for (const l of levels) {
        level.options[l].selected = true;
        level.selected.push(l);
      }
      if (entry.isPrepared || entry.isSpontaneous || entry.isInnate) {
        category.options["power"].selected = true;
        category.selected.push("power");
      }
    }

    if (entry.tradition && !entry.isFocusPool && !entry.isRitual) {
      traditions.options[entry.tradition].selected = true;
      traditions.selected.push(entry.tradition);
    }

    powerTab.open(filter);
  }

  async loadTab(tabName) {
    this.activeTab = tabName;
    // Settings tab
    if (tabName === "settings") {
      await this.render(true);
      return;
    }

    if (!this.dataTabsList.includes(tabName)) return ui.notifications.error(`Unknown tab "${tabName}"`);

    const currentTab = this.tabs[tabName];

    // Initialize Tab if it is not already initialzed
    if (!currentTab.isInitialized) await currentTab.init();

    await this.render(true, { focus: true });
  }

  loadedPacks(tab) {
    if (tab === "settings") return [];
    return Object.entries(this.settings[tab] ?? []).flatMap(([collection, info]) => {
      return info?.load ? [collection] : [];
    });
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    html = html[0];
    const activeTabName = this.activeTab;

    // Set the navigation tab. This is only needed when the browser is openend
    // with CompendiumBrowserTab#open
    if (this.navigationTab.active !== activeTabName) this.navigationTab.activate(activeTabName);

    // Settings Tab
    if (activeTabName === "settings") {
      const form = html.querySelector(".compendium-browser-settings form");
      if (form) {
        form.querySelector("button.save-settings")?.addEventListener("click", async () => {
          const formData = new FormData(form);
          for (const [t, packs] of Object.entries(this.settings)) {
            for (const [key, pack] of Object.entries(packs)) {
              pack.load = formData.has(`${t}-${key}`);
            }
          }
          await game.settings.set("sw5e", "compendiumBrowserPacks", this.settings);
          for (const tab of Object.values(this.tabs)) {
            if (tab.isInitialized) {
              await tab.init();
              tab.scrollLimit = 100;
            }
          }
          this.render(true);
        });
      }
      return;
    }

    // Other tabs
    const currentTab = this.tabs[activeTabName];
    const controlArea = html.querySelector("div.control-area");
    if (!controlArea) return;

    // Search field
    const search = controlArea.querySelector("input[name=textFilter]");
    if (search) {
      search.addEventListener("input", () => {
        currentTab.filterData.search.text = search.value;
        this.clearScrollLimit();
        this.renderResultList({ replace: true });
      });
    }

    // Sort item list
    const sortContainer = controlArea.querySelector("div.sortcontainer");
    if (sortContainer) {
      const order = sortContainer.querySelector("select.order");
      if (order) {
        order.addEventListener("change", () => {
          const orderBy = order.value ?? "name";
          currentTab.filterData.order.by = orderBy;
          this.clearScrollLimit(true);
        });
      }
      const directionAnchor = sortContainer.querySelector("a.direction");
      if (directionAnchor) {
        directionAnchor.addEventListener("click", () => {
          const direction = (directionAnchor.dataset.direction) ?? "asc";
          currentTab.filterData.order.direction = direction === "asc" ? "desc" : "asc";
          this.clearScrollLimit(true);
        });
      }
    }

    if (activeTabName === "power") {
      const timeFilter = controlArea.querySelector("select[name=timefilter]");
      if (timeFilter) {
        timeFilter.addEventListener("change", () => {
          if (!currentTab.isOfType("power")) return;
          const filterData = currentTab.filterData;
          if (!filterData.selects?.timefilter) return;
          filterData.selects.timefilter.selected = timeFilter.value;
          this.clearScrollLimit(true);
        });
      }
    }

    // Clear all filters button
    controlArea.querySelector("button.clear-filters")?.addEventListener("click", () => {
      this.resetFilters();
      this.clearScrollLimit(true);
    });

    // Filters
    const filterContainers = controlArea.querySelectorAll("div.filtercontainer");
    for (const container of Array.from(filterContainers)) {
      const { filterType, filterName } = container.dataset;
      // Clear this filter button
      container
        .querySelector("button[data-action=clear-filter]")
        ?.addEventListener("click", (event) => {
          event.stopImmediatePropagation();
          switch (filterType) {
            case "checkboxes": {
              const checkboxes = currentTab.filterData.checkboxes;
              if (objectHasKey(checkboxes, filterName)) {
                for (const option of Object.values(checkboxes[filterName].options)) {
                  option.selected = false;
                }
                checkboxes[filterName].selected = [];
                this.render(true);
              }
              break;
            }
            case "ranges": {
              if (currentTab.isOfType("equipment")) {
                const ranges = currentTab.filterData.ranges;
                if (objectHasKey(ranges, filterName)) {
                  ranges[filterName].values = currentTab.defaultFilterData.ranges[filterName].values;
                  ranges[filterName].changed = false;
                  this.render(true);
                }
              }
            }
          }
        });

      // Toggle visibility of filter container
      const title = container.querySelector("div.title");
      title?.addEventListener("click", () => {
        const toggleFilter = (filter) => {
          filter.isExpanded = !filter.isExpanded;
          const contentElement = title.nextElementSibling;
          if (contentElement instanceof HTMLElement) {
            filter.isExpanded
              ? (contentElement.style.display = "")
              : (contentElement.style.display = "none");
          }
        };
        switch (filterType) {
          case "checkboxes": {
            if (objectHasKey(currentTab.filterData.checkboxes, filterName)) {
              toggleFilter(currentTab.filterData.checkboxes[filterName]);
            }
            break;
          }
          case "ranges": {
            if (!currentTab.isOfType("equipment")) return;
            if (objectHasKey(currentTab.filterData.ranges, filterName)) {
              toggleFilter(currentTab.filterData.ranges[filterName]);
            }
            break;
          }
          case "sliders": {
            if (!currentTab.isOfType("bestiary", "equipment", "feat", "hazard")) return;
            if (objectHasKey(currentTab.filterData.sliders, filterName)) {
              toggleFilter(currentTab.filterData.sliders[filterName]);
            }
            break;
          }
        }
      });

      if (filterType === "checkboxes") {
        container.querySelectorAll("input[type=checkbox]").forEach((checkboxElement) => {
          checkboxElement.addEventListener("click", () => {
            if (objectHasKey(currentTab.filterData.checkboxes, filterName)) {
              const optionName = checkboxElement.name;
              const checkbox = currentTab.filterData.checkboxes[filterName];
              const option = checkbox.options[optionName];
              option.selected = !option.selected;
              option.selected
                ? checkbox.selected.push(optionName)
                : (checkbox.selected = checkbox.selected.filter((name) => name !== optionName));
              this.clearScrollLimit(true);
            }
          });
        });
      }

      if (filterType === "ranges") {
        container.querySelectorAll("input[name*=Bound]").forEach((range) => {
          range.addEventListener("keyup", (event) => {
            if (!currentTab.isOfType("equipment")) return;
            if (event.key !== "Enter") return;
            const ranges = currentTab.filterData.ranges;
            if (ranges && objectHasKey(ranges, filterName)) {
              const range = ranges[filterName];
              const lowerBound = container.querySelector("input[name*=lowerBound]")?.value ?? "";
              const upperBound = container.querySelector("input[name*=upperBound]")?.value ?? "";
              const values = currentTab.parseRangeFilterInput(filterName, lowerBound, upperBound);
              range.values = values;
              range.changed = true;
              this.clearScrollLimit(true);
            }
          });
        });
      }

      if (filterType === "multiselects") {
        // Multiselects using tagify
        const multiselects = currentTab.filterData.multiselects;
        if (!multiselects) continue;
        if (objectHasKey(multiselects, filterName)) {
          const multiselect = container.querySelector(
            `input[name=${filterName}][data-tagify-select]`
          );
          if (!multiselect) continue;
          const data = multiselects[filterName];

          const tagify = new Tagify(multiselect, {
            enforceWhitelist: true,
            keepInvalidTags: false,
            editTags: false,
            tagTextProp: "label",
            dropdown: {
              enabled: 0,
              fuzzySearch: false,
              mapValueTo: "label",
              maxItems: data.options.length,
              searchKeys: ["label"],
            },
            whitelist: data.options,
            transformTag(tagData) {
              const selected = data.selected.find((s) => s.value === tagData.value);
              if (selected?.not) tagData.class = "conjunction-not";
            },
          });

          tagify.on("click", (event) => {
            const target = event.detail.event.target;
            if (!target) return;

            const value = event.detail.data.value;
            const selected = data.selected.find((s) => s.value === value);
            if (selected) {
              const current = !!selected.not;
              selected.not = !current;
              this.render();
            }
          });
          tagify.on("change", (event) => {
            const selections = JSON.parse(event.detail.value || "[]");
            const isValid =
              Array.isArray(selections) &&
              selections.every(s => isObject(s) && typeof s.value === "string");

            if (isValid) {
              data.selected = selections;
              this.render();
            }
          });

          for (const element of htmlQueryAll(container, `input[name=${filterName}-filter-conjunction]`)) {
            element.addEventListener("change", () => {
              const value = element.value;
              if (value === "and" || value === "or") {
                data.conjunction = value;
                this.render();
              }
            });
          }
        }
      }

      if (filterType === "sliders") {
        // Slider filters
        if (!currentTab.isOfType("bestiary", "equipment", "feat", "hazard")) return;
        const sliders = currentTab.filterData.sliders;
        if (!sliders) continue;

        if (objectHasKey(sliders, filterName)) {
          const sliderElement = container.querySelector(`div.slider-${filterName}`);
          if (!sliderElement) continue;
          const data = sliders[filterName];

          const slider = noUiSlider.create(sliderElement, {
            range: {
              min: data.values.lowerLimit,
              max: data.values.upperLimit,
            },
            start: [data.values.min, data.values.max],
            tooltips: {
              to(value) {
                return Math.floor(value).toString();
              },
            },
            connect: [false, true, false],
            behaviour: "snap",
            step: data.values.step,
          });

          slider.on("change", (values) => {
            const [min, max] = values.map((value) => Number(value));
            data.values.min = min;
            data.values.max = max;

            const minLabel = html.find(`label.${name}-min-label`);
            const maxLabel = html.find(`label.${name}-max-label`);
            minLabel.text(min);
            maxLabel.text(max);

            this.clearScrollLimit(true);
          });

          // Set styling
          sliderElement.querySelectorAll(".noUi-handle").forEach((element) => {
            element.classList.add("handle");
          });
          sliderElement.querySelectorAll(".noUi-connect").forEach((element) => {
            element.classList.add("range_selected");
          });
        }
      }
    }

    const list = html.querySelector(".tab.active ul.item-list");
    if (!list) return;
    list.addEventListener("scroll", () => {
      if (list.scrollTop + list.clientHeight >= list.scrollHeight - 5) {
        const currentValue = currentTab.scrollLimit;
        const maxValue = currentTab.totalItemCount ?? 0;
        if (currentValue < maxValue) {
          currentTab.scrollLimit = Math.clamped(currentValue + 100, 100, maxValue);
          this.renderResultList({ list, start: currentValue });
        }
      }
    });

    // Initial result list render
    this.renderResultList({ list });
  }

  /**
   * Append new results to the result list
   * @param options Render options
   * @param options.list The result list HTML element
   * @param options.start The index position to start from
   * @param options.replace Replace the current list with the new results?
   */
  async renderResultList({ list, start = 0, replace = false }) {
    const currentTab = this.activeTab !== "settings" ? this.tabs[this.activeTab] : null;
    const html = this.element[0];
    if (!currentTab) return;

    if (!list) {
      const listElement = html.querySelector(".tab.active ul.item-list");
      if (!listElement) return;
      list = listElement;
    }

    // Get new results from index
    const newResults = await currentTab.renderResults(start);
    // Add listeners to new results only
    this.activateResultListeners(newResults);
    // Add the results to the DOM
    const fragment = document.createDocumentFragment();
    fragment.append(...newResults);
    if (replace) list.replaceChildren(fragment);
    else list.append(fragment);
    // Re-apply drag drop handler
    for (const dragDropHandler of this._dragDrop) dragDropHandler.bind(html);
  }

  /** Activate click listeners on loaded actors and items */
  activateResultListeners(liElements = []) {
    for (const liElement of liElements) {
      const { entryUuid } = liElement.dataset;
      if (!entryUuid) continue;

      const nameAnchor = liElement.querySelector("div.name > a");
      if (nameAnchor) {
        nameAnchor.addEventListener("click", async () => {
          const doc = await fromUuid(entryUuid);
          doc?.sheet?.render(true);
        });
      }

      if (this.activeTab === "equipment") {
        // Add an item to selected tokens' actors' inventories
        liElement
          .querySelector("a[data-action=take-item]")
          ?.addEventListener("click", () => {
            this.takePhysicalItem(entryUuid);
          });

        // Attempt to buy an item with the selected tokens' actors'
        liElement.querySelector("a[data-action=buy-item]")?.addEventListener("click", () => {
          this.buyPhysicalItem(entryUuid);
        });
      }
    }
  }

  async takePhysicalItem(uuid) {
    const actors = getSelectedOrOwnActors(["character", "npc"]);
    const item = await this.getPhysicalItem(uuid);

    if (actors.length === 0) return ui.notifications.error(game.i18n.format("SW5E.ErrorMessage.NoTokenSelected"));

    for (const actor of actors) await actor.createEmbeddedDocuments("Item", [item.toObject()]);

    if (actors.length === 1 && game.user.character && actors[0] === game.user.character) {
      ui.notifications.info(
        game.i18n.format("SW5E.CompendiumBrowser.AddedItemToCharacter", {
          item: item.name,
          character: game.user.character.name,
        })
      );
    } else ui.notifications.info(game.i18n.format("SW5E.CompendiumBrowser.AddedItem", { item: item.name }));
  }

  async buyPhysicalItem(uuid) {
    const actors = getSelectedOrOwnActors(["character", "npc"]);
    const item = await this.getPhysicalItem(uuid);

    if (actors.length === 0) return ui.notifications.error(game.i18n.format("SW5E.ErrorMessage.NoTokenSelected"));

    let purchasesSucceeded = 0;

    for (const actor of actors) {
      if (await actor.removeCurrency(item.price.value)) {
        purchasesSucceeded = purchasesSucceeded + 1;
        await actor.createEmbeddedDocuments("Item", [item.toObject()]);
      }
    }

    if (actors.length === 1) {
      if (purchasesSucceeded === 1) {
        ui.notifications.info(
          game.i18n.format("SW5E.CompendiumBrowser.BoughtItemWithCharacter", {
            item: item.name,
            character: actors[0].name,
          })
        );
      } else {
        ui.notifications.warn(
          game.i18n.format("SW5E.CompendiumBrowser.FailedToBuyItemWithCharacter", {
            item: item.name,
            character: actors[0].name,
          })
        );
      }
    } else {
      if (purchasesSucceeded === actors.length) {
        ui.notifications.info(
          game.i18n.format("SW5E.CompendiumBrowser.BoughtItemWithAllCharacters", {
            item: item.name,
          })
        );
      } else {
        ui.notifications.warn(
          game.i18n.format("SW5E.CompendiumBrowser.FailedToBuyItemWithSomeCharacters", {
            item: item.name,
          })
        );
      }
    }
  }

  async getPhysicalItem(uuid) {
    const item = await fromUuid(uuid);
    if (!item) throw Error("Unexpected failure retrieving compendium item");
    if (!CONFIG.SW5E.itemTypes.inventory.includes(item.type)) throw Error(`Item "${item.name}" is not a physical item.`);
    // if (!(item instanceof PhysicalItemsw5e || item instanceof Kitsw5e)) {
    //   throw Error("Unexpected failure retrieving compendium item");
    // }

    return item;
  }

  _canDragStart() {
    return true;
  }

  _canDragDrop() {
    return true;
  }

  /** Set drag data and lower opacity of the application window to reveal any tokens */
  _onDragStart(event) {
    this.element.animate({ opacity: 0.125 }, 250);

    const item = $(event.currentTarget)[0];
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: item.dataset.type,
        uuid: item.dataset.entryUuid,
      })
    );
    item.addEventListener(
      "dragend",
      () => {
        window.setTimeout(() => {
          this.element.animate({ opacity: 1 }, 250, () => {
            this.element.css({ pointerEvents: "" });
          });
        }, 500);
      },
      { once: true }
    );
  }

  _onDragOver(event) {
    super._onDragOver(event);
    this.element.css({ pointerEvents: "none" });
  }

  getData() {
    const activeTab = this.activeTab;
    // Settings
    if (activeTab === "settings") return {
      user: game.user,
      settings: this.settings,
    };
    // Active tab
    const tab = this.tabs[activeTab];
    if (tab) return {
      user: game.user,
      [activeTab]: { filterData: tab.filterData },
      scrollLimit: tab.scrollLimit,
    };
    // No active tab
    return { user: game.user };
  }

  resetFilters() {
    const activeTab = this.activeTab;
    if (activeTab !== "settings") {
      this.tabs[activeTab].resetFilters();
    }
  }

  clearScrollLimit(render = false) {
    const tab = this.activeTab;
    if (tab === "settings") return;

    const list = this.element[0].querySelector(".tab.active ul.item-list");
    if (!list) return;
    list.scrollTop = 0;
    this.tabs[tab].scrollLimit = 100;

    if (render) this.render();
  }

  /** Returns a button to open the compendium browser */
  static browseButton() {
    const browseButton = document.createElement("button");
    browseButton.type = "button";
    browseButton.append(
      fontAwesomeIcon("search", { fixedWidth: true }),
      " ",
      game.i18n.localize("SW5E.CompendiumBrowser.Title")
    );
    browseButton.addEventListener("click", () => { game.sw5e.compendiumBrowser.render(true, { focus: true }); });
    return browseButton;
  }
}
