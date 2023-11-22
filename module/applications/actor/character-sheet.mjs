import ActorSheet5e from "./base-sheet.mjs";
import ActorTypeConfig from "./type-config.mjs";
import AdvancementConfirmationDialog from "../advancement/advancement-confirmation-dialog.mjs";
import AdvancementManager from "../advancement/advancement-manager.mjs";

/**
 * An Actor sheet for player character type actors in the SW5E system.
 */
export default class ActorSheet5eCharacter extends ActorSheet5e {
  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["swalt", "sw5e", "sheet", "actor", "character"],
      blockFavTab: true,
      subTabs: null,
      width: 800,
      tabs: [
        {
          navSelector: ".root-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes"
        }
      ]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  static unsupportedItemTypes = new Set(["starshipsize", "starshipmod"]);

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options = {}) {
    const context = await super.getData(options);

    // Resources
    context.resources = ["primary", "secondary", "tertiary"].reduce((arr, r) => {
      const res = foundry.utils.mergeObject(context.actor.system.resources[r] || {}, {
        name: r,
        placeholder: game.i18n.localize(`SW5E.Resource${r.titleCase()}`)
      }, {inplace: false});
      if ( res.value === 0 ) delete res.value;
      if ( res.max === 0 ) delete res.max;
      return arr.concat([res]);
    }, []);

    // HTML enrichment
    for (const field of [
      "trait",
      "ideal",
      "bond",
      "flaw",
      "description",
      "notes"
    ]) {
      const value = context.system.details[field]?.value ?? context.system.details[field];
      context[`${field}HTML`] = await TextEditor.enrichHTML(value, {
        secrets: this.actor.isOwner,
        rollData: context.rollData,
        async: true,
        relativeTo: this.actor
      });
    }

    // Make the correct powerbook active when you open the tab
    context.activePowerbook = this.actor.caster[0] ?? "force";

    const classes = this.actor.itemTypes.class;
    return foundry.utils.mergeObject(context, {
      disableExperience: game.settings.get("sw5e", "disableExperienceTracking"),
      classLabels: classes.map(c => c.name).join(", "),
      multiclassLabels: classes.map(c => [c.archetype?.name ?? "", c.name, c.system.levels].filterJoin(" ")).join(", "),
      labels: {
        type: context.system.details.type.label
      },
      weightUnit: game.i18n.localize(
        `SW5E.Abbreviation${game.settings.get("sw5e", "metricWeightUnits") ? "Kg" : "Lbs"}`
      ),
      encumbrance: context.system.attributes.encumbrance
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(context) {
    const categories = this._prepareItemCategories({
      splitActive: true,
      featureTypes: Object.fromEntries(
        Object.entries(CONFIG.SW5E.featureTypes).map(([k, v]) => {
          if (k === "class") delete v.subtypes;
          return [k, v];
        })
      )
    });

    this._prepareItemsCategorized(context, categories);

    // Apply active item filters
    for (const itemType of Object.values(categories.inventory)) {
      itemType.items = this._filterItems(itemType.items, this._filters.inventory);
    }
    for (const featType of Object.values(categories.features)) {
      featType.items = this._filterItems(featType.items, this._filters.features);
    }
    categories.powers.for.items = this._filterItems(categories.powers.for.items, this._filters.forcePowerbook);
    categories.powers.tec.items = this._filterItems(categories.powers.tec.items, this._filters.techPowerbook);
    categories.maneuvers.items = this._filterItems(categories.maneuvers.items, this._filters.superiorityPowerbook);

    // Organize Powerbook and count the number of prepared powers (excluding always, at will, etc...)
    categories.powers.for.items = this._preparePowerbook(context, categories.powers.for.items, "uni");
    categories.powers.tec.items = this._preparePowerbook(context, categories.powers.tec.items, "tec");
    categories.maneuvers.items = this._prepareManeuvers(categories.maneuvers.items);

    // Sort classes and interleave matching archetypes, put unmatched archetypes into features so they don't disappear
    categories.class.class.items.sort((a, b) => b.system.levels - a.system.levels);
    const maxLevelDelta = CONFIG.SW5E.maxLevel - this.actor.system.details.level;
    categories.class.class.items = categories.class.class.items.reduce((arr, cls) => {
      const ctx = (context.itemContext[cls.id] ??= {});
      ctx.availableLevels = Array.fromRange(CONFIG.SW5E.maxLevel + 1)
        .slice(1)
        .map(level => {
          const delta = level - cls.system.levels;
          return { level, delta, disabled: delta > maxLevelDelta };
        });
      arr.push(cls);
      const identifier = cls.system.identifier || cls.name.slugify({ strict: true });
      const archetype = categories.class.archetype.items.findSplice(s => s.system.classIdentifier === identifier);
      if (archetype) arr.push(archetype);
      return arr;
    }, []);
    for (const archetype of categories.class.archetype.items) {
      categories.unsorted.items.push(archetype);
      const message = game.i18n.format("SW5E.ArchetypeMismatchWarn", {
        name: archetype.name,
        class: archetype.system.classIdentifier
      });
      context.warnings.push({ message, type: "warning" });
    }

    // Organize Starship Features
    categories.class.deployment.items.sort((a, b) => b.system.rank - a.system.rank);
    const maxRankDelta = CONFIG.SW5E.maxRank - this.actor.system.details.ranks;
    categories.class.deployment.items = categories.class.deployment.items.reduce((arr, dep) => {
      const ctx = (context.itemContext[dep.id] ??= {});
      ctx.availableRanks = Array.fromRange(CONFIG.SW5E.maxIndividualRank + 1)
        .slice(1)
        .map(rank => {
          const delta = rank - dep.system.rank;
          return { rank, delta, disabled: delta > maxRankDelta };
        });
      arr.push(dep);
      return arr;
    }, []);

    categories.ssfeatures = [
      categories.class.deployment,
      categories.features["feat.deployment"],
      categories.features["feat.deployment.venture"]
    ];

    // Organize Features
    categories.features = Object.values(categories.features).filter(f => f.dataset.featType !== "deployment");
    categories.features.unshift(categories.class.species);
    const classFeatures = categories.features.splice(
      categories.features.findIndex(f => f.dataset.featType === "class"),
      1
    );
    categories.features.unshift(...classFeatures);
    categories.features.unshift(categories.class.class);
    categories.features.unshift(categories.class.background);

    // Add unsorted items to the Inventory, to make them acessible
    categories.inventory.unsorted = categories.unsorted;

    // Assign and return
    context.inventoryFilters = true;
    context.inventory = Object.values(categories.inventory);
    context.forcePowerbook = categories.powers.for.items;
    context.techPowerbook = categories.powers.tec.items;
    context.superiorityPowerbook = categories.maneuvers.items;
    context.features = categories.features;
    context.ssfeatures = categories.ssfeatures;
  }

  /* -------------------------------------------- */

  /**
   * A helper method to establish the displayed preparation state for an item.
   * @param {Item5e} item     Item being prepared for display.
   * @param {object} context  Context data for display.
   * @protected
   */
  _prepareItemToggleState(item, context) {
    if (item.type === "power") {
      const prep = item.system.preparation || {};
      const isAlways = prep.mode === "always";
      const isPrepared = !!prep.prepared;
      context.toggleClass = isPrepared ? "active" : "";
      if (isAlways) context.toggleClass = "fixed";
      if (isAlways) context.toggleTitle = CONFIG.SW5E.powerPreparationModes.always;
      else if (isPrepared) context.toggleTitle = CONFIG.SW5E.powerPreparationModes.prepared;
      else context.toggleTitle = game.i18n.localize("SW5E.PowerUnprepared");
    } else {
      const isActive = !!item.system.equipped;
      context.toggleClass = isActive ? "active" : "";
      context.toggleTitle = game.i18n.localize(isActive ? "SW5E.Equipped" : "SW5E.Unequipped");
      context.canToggle = "equipped" in item.system;
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find(".level-selector").change(this._onLevelChange.bind(this));
    html.find(".item-toggle").click(this._onToggleItem.bind(this));
    html.find(".short-rest").click(this._onShortRest.bind(this));
    html.find(".long-rest").click(this._onLongRest.bind(this));
    html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));

    // Send Languages to Chat onClick
    html.find('[data-options="share-languages"]').click(event => {
      event.preventDefault();
      let langs = Array.from(this.actor.system.traits.languages.value)
        .map(l => CONFIG.SW5E.languages[l] || l)
        .join(", ");
      let custom = this.actor.system.traits.languages.custom;
      if (custom) langs += `, ${custom.replace(/;/g, ",")}`;
      let content = `
        <div class="sw5e chat-card item-card" data-actor-id="${this.actor.id}">
          <header class="card-header flexrow">
            <img src="${this.actor.img}" data-tooltip="${this.actor.name}" width="36" height="36"/>
            <h3 class="item-name">Known Languages</h3>
          </header>
          <div>${langs}</div>
        </div>
      `;

      // Send to Chat
      let rollBlind = false;
      let rollMode = game.settings.get("core", "rollMode");
      if (rollMode === "blindroll") rollBlind = true;
      let data = {
        user: game.user.id,
        content,
        blind: rollBlind,
        speaker: {
          actor: this.actor.id,
          token: this.actor.token,
          alias: this.actor.name
        },
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
      };

      if (["gmroll", "blindroll"].includes(rollMode)) data.whisper = ChatMessage.getWhisperRecipients("GM");
      else if (rollMode === "selfroll") data.whisper = [game.users.get(game.user.id)];

      ChatMessage.create(data);
    });

    // Item Delete Confirmation
    html.find(".item-delete").off("click");
    html.find(".item-delete").click(event => {
      let li = $(event.currentTarget).parents(".item");
      let itemId = li.attr("data-item-id");
      let item = this.actor.items.get(itemId);
      new Dialog({
        title: `Deleting ${item.name}`,
        content: `<p>Are you sure you want to delete ${item.name}?</p>`,
        buttons: {
          Yes: {
            icon: '<i class="fa fa-check"></i>',
            label: "Yes",
            callback: dlg => {
              item.delete();
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "No"
          }
        },
        default: "cancel"
      }).render(true);
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onConfigMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    if ( (event.currentTarget.dataset.action === "type") && (this.actor.system.details.species?.id) ) {
      new ActorTypeConfig(this.actor.system.details.species, { keyPath: "system.type" }).render(true);
    } else if ( event.currentTarget.dataset.action !== "type" ) {
      return super._onConfigMenu(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle mouse click events for character sheet actions.
   * @param {MouseEvent} event  The originating click event.
   * @returns {Promise}         Dialog or roll result.
   * @private
   */
  _onSheetAction(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch (button.dataset.action) {
      case "rollDeathSave":
        return this.actor.rollDeathSave({ event });
      case "rollInitiative":
        return this.actor.rollInitiativeDialog({ event });
    }
  }

  /* -------------------------------------------- */

  /**
   * Respond to a new level being selected from the level selector.
   * @param {Event} event                           The originating change.
   * @returns {Promise<AdvancementManager|Item5e>}  Manager if advancements needed, otherwise updated item.
   * @private
   */
  async _onLevelChange(event) {
    event.preventDefault();

    const delta = Number(event.target.value);
    const itemId = event.target.closest(".item")?.dataset.itemId;
    if (!delta || !itemId) return;
    const item = this.actor.items.get(itemId);

    let attr = null;
    if (item.type === "class") attr = "levels";
    else if (item.type === "deployment") attr = "rank";
    if (!attr) return ui.error(`Unexpected item.type '${item.type}'`);

    if (!game.settings.get("sw5e", "disableAdvancements")) {
      const manager = AdvancementManager.forLevelChange(this.actor, itemId, delta);
      if (manager.steps.length) {
        if (delta > 0) return manager.render(true);
        try {
          const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forLevelDown(item);
          if (shouldRemoveAdvancements) return manager.render(true);
        } catch(err) {
          return;
        }
      }
    }
    return item.update({ [`system.${attr}`]: item.system[attr] + delta });
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the state of an Owned Item within the Actor.
   * @param {Event} event        The triggering click event.
   * @returns {Promise<Item5e>}  Item with the updates applied.
   * @private
   */
  _onToggleItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const attr = item.type === "power" ? "system.preparation.prepared" : "system.equipped";
    return item.update({ [attr]: !foundry.utils.getProperty(item, attr) });
  }

  /* -------------------------------------------- */

  /**
   * Take a short rest, calling the relevant function on the Actor instance.
   * @param {Event} event             The triggering click event.
   * @returns {Promise<RestResult>}  Result of the rest action.
   * @private
   */
  async _onShortRest(event) {
    event.preventDefault();
    await this._onSubmit(event);
    return this.actor.shortRest();
  }

  /* -------------------------------------------- */

  /**
   * Take a long rest, calling the relevant function on the Actor instance.
   * @param {Event} event             The triggering click event.
   * @returns {Promise<RestResult>}  Result of the rest action.
   * @private
   */
  async _onLongRest(event) {
    event.preventDefault();
    await this._onSubmit(event);
    return this.actor.longRest();
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropSingleItem(itemData) {
    // Increment the number of class levels a character instead of creating a new item
    if (itemData.type === "class") {
      const charLevel = this.actor.system.details.level;
      itemData.system.levels = Math.min(itemData.system.levels, CONFIG.SW5E.maxLevel - charLevel);
      if (itemData.system.levels <= 0) {
        const err = game.i18n.format("SW5E.MaxCharacterLevelExceededWarn", { max: CONFIG.SW5E.maxLevel });
        ui.notifications.error(err);
        return false;
      }

      const cls = this.actor.itemTypes.class.find(c => c.identifier === itemData.system.identifier);
      if (cls) {
        const priorLevel = cls.system.levels;
        if (!game.settings.get("sw5e", "disableAdvancements")) {
          const manager = AdvancementManager.forLevelChange(this.actor, cls.id, itemData.system.levels);
          if (manager.steps.length) {
            manager.render(true);
            return false;
          }
        }
        cls.update({ "system.levels": priorLevel + itemData.system.levels });
        return false;
      }
    }

    // If a archetype is dropped, ensure it doesn't match another archetype with the same identifier
    else if (itemData.type === "archetype") {
      const other = this.actor.itemTypes.archetype.find(i => i.identifier === itemData.system.identifier);
      if (other) {
        const err = game.i18n.format("SW5E.ArchetypeDuplicateError", { identifier: other.identifier });
        ui.notifications.error(err);
        return false;
      }
      const cls = this.actor.itemTypes.class.find(i => i.identifier === itemData.system.classIdentifier);
      if (cls && cls.archetype) {
        const err = game.i18n.format("SW5E.ArchetypeAssignmentError", {
          class: cls.name,
          archetype: cls.archetype.name
        });
        ui.notifications.error(err);
        return false;
      }
    }
    return super._onDropSingleItem(itemData);
  }
}

/**
 * Adds the favorites tab
 * @param {ActorSheet5eCharacter} app
 * @param {jQuery} html
 * @param {object} context
 */
async function addFavorites(app, html, context) {
  // This function is adapted for the SwaltSheet from the Favorites Item
  // Tab Module created for Foundry VTT - by Felix Müller (Felix#6196 on Discord).
  // It is licensed under a Creative Commons Attribution 4.0 International License
  // and can be found at https://github.com/syl3r86/favtab.
  let favItems = [];
  let favFeats = [];
  let favPowers = {
    0: {
      isCantrip: true,
      powers: []
    },
    1: {
      powers: [],
      value: context.actor.system.powers.power1.value,
      max: context.actor.system.powers.power1.max
    },
    2: {
      powers: [],
      value: context.actor.system.powers.power2.value,
      max: context.actor.system.powers.power2.max
    },
    3: {
      powers: [],
      value: context.actor.system.powers.power3.value,
      max: context.actor.system.powers.power3.max
    },
    4: {
      powers: [],
      value: context.actor.system.powers.power4.value,
      max: context.actor.system.powers.power4.max
    },
    5: {
      powers: [],
      value: context.actor.system.powers.power5.value,
      max: context.actor.system.powers.power5.max
    },
    6: {
      powers: [],
      value: context.actor.system.powers.power6.value,
      max: context.actor.system.powers.power6.max
    },
    7: {
      powers: [],
      value: context.actor.system.powers.power7.value,
      max: context.actor.system.powers.power7.max
    },
    8: {
      powers: [],
      value: context.actor.system.powers.power8.value,
      max: context.actor.system.powers.power8.max
    },
    9: {
      powers: [],
      value: context.actor.system.powers.power9.value,
      max: context.actor.system.powers.power9.max
    }
  };

  let powerCount = 0;
  let items = context.actor.items;
  for (let item of items) {
    if (["class", "archetype", "species", "deployment", "background"].includes(item.type)) continue;
    if (item.flags.favtab === undefined || item.flags.favtab.isFavourite === undefined) {
      item.flags.favtab = {
        isFavourite: false
      };
    }
    let isFav = item.flags.favtab.isFavourite;
    if (app.options.editable) {
      let favBtn = $(
        `<a class="item-control item-toggle item-fav ${isFav ? "active" : ""}" data-fav="${isFav}" title="${
          isFav ? "Remove from Favourites" : "Add to Favourites"
        }"><i class="fas fa-star"></i></a>`
      );
      favBtn.click(ev => {
        app.actor.items.get(item.id).update({
          "flags.favtab.isFavourite": !item.flags.favtab.isFavourite
        });
      });
      html.find(`.item[data-item-id="${item.id}"]`).find(".item-controls").prepend(favBtn);
    }

    if (isFav) {
      item.powerComps = "";
      if (item.system.components) {
        let comps = item.system.components;
        let v = comps.vocal ? "V" : "";
        let s = comps.somatic ? "S" : "";
        let m = comps.material ? "M" : "";
        let c = !!comps.concentration;
        let r = !!comps.ritual;
        item.powerComps = `${v}${s}${m}`;
        item.powerCon = c;
        item.powerRit = r;
      }

      item.editable = app.options.editable;
      switch (item.type) {
        case "feat":
        case "maneuver":
          item.flags.favtab.sort ??= (favFeats.count + 1) * 100000; // Initial sort key if not present
          favFeats.push(item);
          break;
        case "power":
          if (item.system.preparation.mode) {
            item.powerPrepMode = ` (${CONFIG.SW5E.powerPreparationModes[item.system.preparation.mode]})`;
          }
          favPowers[item.system.level || 0].powers.push(item);
          powerCount++;
          break;
        default:
          item.flags.favtab.sort ??= (favItems.count + 1) * 100000; // Initial sort key if not present
          favItems.push(item);
          break;
      }
    }
  }

  // Alter core CSS to fit new button
  // if (app.options.editable) {
  //   html.find('.powerbook .item-controls').css('flex', '0 0 88px');
  //   html.find('.inventory .item-controls, .features .item-controls').css('flex', '0 0 90px');
  //   html.find('.favourite .item-controls').css('flex', '0 0 22px');
  // }

  let tabContainer = html.find(".favtabtarget");
  context.favItems = favItems.length > 0 ? favItems.sort((a, b) => a.flags.favtab.sort - b.flags.favtab.sort) : false;
  context.favFeats = favFeats.length > 0 ? favFeats.sort((a, b) => a.flags.favtab.sort - b.flags.favtab.sort) : false;
  context.favPowers = powerCount > 0 ? favPowers : false;
  context.editable = app.options.editable;

  await loadTemplates(["systems/sw5e/templates/actors/favTab/fav-item.hbs"]);
  let favtabHtml = $(await renderTemplate("systems/sw5e/templates/actors/favTab/template.hbs", context));
  favtabHtml.find(".item-name h4").click(event => app._onItemSummary(event));

  if (app.options.editable) {
    favtabHtml.find(".item-image").click(ev => app._onItemUse(ev));
    let handler = ev => app._onDragStart(ev);
    favtabHtml.find(".item").each((i, li) => {
      if (li.classList.contains("inventory-header")) return;
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", handler, false);
    });
    // FavtabHtml.find('.item-toggle').click(event => app._onToggleItem(event));
    favtabHtml.find(".item-edit").click(ev => {
      let itemId = $(ev.target).parents(".item")[0].dataset.itemId;
      app.actor.items.get(itemId).sheet.render(true);
    });
    favtabHtml.find(".item-fav").click(ev => {
      let itemId = $(ev.target).parents(".item")[0].dataset.itemId;
      let val = !app.actor.items.get(itemId).flags.favtab.isFavourite;
      app.actor.items.get(itemId).update({
        "flags.favtab.isFavourite": val
      });
    });

    // Sorting
    favtabHtml.find(".item").on("drop", ev => {
      ev.preventDefault();
      ev.stopPropagation();

      let dropData = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"));
      let uuidParts = dropData.uuid.split(".");
      let actorIndex = uuidParts.indexOf("Actor");
      let actorId = actorIndex === -1 ? undefined : uuidParts[actorIndex + 1];
      let itemIndex = uuidParts.indexOf("Item");
      let itemId = itemIndex === -1 ? undefined : uuidParts[itemIndex + 1];

      if (actorId !== app.actor.id || dropData.type === "power") return;

      let dragSource = app.actor.items.get(itemId);

      let list = null;
      if (["feat", "maneuver"].includes(dragSource.type)) list = favFeats;
      else list = favItems;

      let siblings = list.filter(i => i.id !== itemId);
      let targetId = ev.target.closest(".item").dataset.itemId;
      let dragTarget = siblings.find(s => s.id === targetId);

      if (dragTarget === undefined) return;
      const sortUpdates = SortingHelpers.performIntegerSort(dragSource, {
        target: dragTarget,
        siblings,
        sortKey: "flags.favtab.sort"
      });
      const updateData = sortUpdates.map(u => {
        const update = u.update;
        update._id = u.target.id;
        return update;
      });
      app.actor.updateEmbeddedDocuments("Item", updateData);
    });
  }
  tabContainer.append(favtabHtml);
  Hooks.callAll("renderedSwaltSheet", app, html, context);
}

/**
 * Adds sub tabs
 * @param {ActorSheet5eCharacter} app
 * @param {jQuery} html
 * @param {object} data
 */
async function addSubTabs(app, html, data) {
  if (data.options.subTabs == null) {
    // Let subTabs = []; //{subgroup: '', target: '', active: false}
    data.options.subTabs = {};
    html.find("[data-subgroup-selection] [data-subgroup]").each((idx, el) => {
      let subgroup = el.getAttribute("data-subgroup");
      let target = el.getAttribute("data-target");
      let targetObj = { target, active: el.classList.contains("active") };
      if (data.options.subTabs.hasOwnProperty(subgroup)) {
        data.options.subTabs[subgroup].push(targetObj);
      } else {
        data.options.subTabs[subgroup] = [];
        data.options.subTabs[subgroup].push(targetObj);
      }
    });
  }

  for (const group in data.options.subTabs) {
    data.options.subTabs[group].forEach(tab => {
      if (tab.active) {
        html.find(`[data-subgroup=${group}][data-target=${tab.target}]`).addClass("active");
      } else {
        html.find(`[data-subgroup=${group}][data-target=${tab.target}]`).removeClass("active");
      }
    });
  }

  html
    .find("[data-subgroup-selection]")
    .children()
    .on("click", event => {
      let subgroup = event.target.closest("[data-subgroup]").getAttribute("data-subgroup");
      let target = event.target.closest("[data-target]").getAttribute("data-target");
      html.find(`[data-subgroup=${subgroup}]`).removeClass("active");
      html.find(`[data-subgroup=${subgroup}][data-target=${target}]`).addClass("active");
      data.options.subTabs[subgroup].map(el => {
        el.active = el.target === target;
        return el;
      });
    });
}

Hooks.on("renderActorSheet5eCharacter", (app, html, data) => {
  addFavorites(app, html, data);
  addSubTabs(app, html, data);
});
