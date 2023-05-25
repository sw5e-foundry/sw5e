import Actor5e from "../../documents/actor/actor.mjs";
import Proficiency from "../../documents/actor/proficiency.mjs";
import JournalEditor from "./journal-editor.mjs";

/**
 * Journal entry page that displays an automatically generated summary of a class along with additional description.
 */
export default class JournalClassPageSheet extends JournalPageSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    const options = foundry.utils.mergeObject(super.defaultOptions, {
      dragDrop: [{dropSelector: ".drop-target"}],
      submitOnChange: true
    });
    options.classes.push("class-journal");
    return options;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get template() {
    return `systems/sw5e/templates/journal/page-class-${this.isEditable ? "edit" : "view"}.hbs`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  toc = {};

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = super.getData(options);
    context.system = context.document.system;

    context.title = Object.fromEntries(
      Array.fromRange(4, 1).map(n => [`level${n}`, context.data.title.level + n - 1])
    );

    const linked = await fromUuid(this.document.system.item);
    context.archetypes = await this._getArchetypes(this.document.system.archetypeItems);

    if ( !linked ) return context;
    context.linked = {
      document: linked,
      name: linked.name,
      lowercaseName: linked.name.toLowerCase()
    };

    context.advancement = this._getAdvancement(linked);
    context.enriched = await this._getDescriptions(context.document);
    context.table = await this._getTable(linked);
    context.optionalTable = await this._getOptionalTable(linked);
    context.features = await this._getFeatures(linked);
    context.optionalFeatures = await this._getFeatures(linked, true);
    context.archetypes?.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare features granted by various advancement types.
   * @param {Item5e} item  Class item belonging to this journal.
   * @returns {object}     Prepared advancement section.
   */
  _getAdvancement(item) {
    const advancement = {};

    const hp = item.advancement.byType.HitPoints?.[0];
    if ( hp ) {
      advancement.hp = {
        hitDice: `1${hp.hitDie}`,
        max: hp.hitDieValue,
        average: Math.floor(hp.hitDieValue / 2) + 1
      };
    }

    return advancement;
  }

  /* -------------------------------------------- */

  /**
   * Enrich all of the entries within the descriptions object on the sheet's system data.
   * @param {JournalEntryPage} page  Journal page being enriched.
   * @returns {Promise<object>}      Object with enriched descriptions.
   */
  async _getDescriptions(page) {
    const descriptions = await Promise.all(Object.entries(page.system.description ?? {})
      .map(async ([id, text]) => {
        const enriched = await TextEditor.enrichHTML(text, {
          relativeTo: this.object,
          secrets: this.object.isOwner,
          async: true
        });
        return [id, enriched];
      })
    );
    return Object.fromEntries(descriptions);
  }

  /* -------------------------------------------- */

  /**
   * Prepare table based on non-optional GrantItem advancement & ScaleValue advancement.
   * @param {Item5e} item              Class item belonging to this journal.
   * @param {number} [initialLevel=1]  Level at which the table begins.
   * @returns {object}                 Prepared table.
   */
  async _getTable(item, initialLevel=1) {
    const hasFeatures = !!item.advancement.byType.ItemGrant;
    const scaleValues = (item.advancement.byType.ScaleValue ?? []);
    const powerProgression = await this._getPowerProgression(item);

    const headers = [[{content: game.i18n.localize("SW5E.Level")}]];
    if ( item.type === "class" ) headers[0].push({content: game.i18n.localize("SW5E.ProficiencyBonus")});
    if ( hasFeatures ) headers[0].push({content: game.i18n.localize("SW5E.Features")});
    headers[0].push(...scaleValues.map(a => ({content: a.title})));
    if ( powerProgression ) {
      if ( powerProgression.headers.length > 1 ) {
        headers[0].forEach(h => h.rowSpan = 2);
        headers[0].push(...powerProgression.headers[0]);
        headers[1] = powerProgression.headers[1];
      } else {
        headers[0].push(...powerProgression.headers[0]);
      }
    }

    const cols = [{ class: "level", span: 1 }];
    if ( item.type === "class" ) cols.push({class: "prof", span: 1});
    if ( hasFeatures ) cols.push({class: "features", span: 1});
    if ( scaleValues.length ) cols.push({class: "scale", span: scaleValues.length});
    if ( powerProgression ) cols.push(...powerProgression.cols);

    const makeLink = async uuid => (await fromUuid(uuid))?.toAnchor({classes: ["content-link"]}).outerHTML;

    const rows = [];
    for ( const level of Array.fromRange((CONFIG.SW5E.maxLevel - (initialLevel - 1)), initialLevel) ) {
      const features = [];
      for ( const advancement of item.advancement.byLevel[level] ) {
        switch ( advancement.constructor.typeName ) {
          case "ItemGrant":
            if ( advancement.configuration.optional ) continue;
            features.push(...await Promise.all(advancement.configuration.items.map(makeLink)));
            break;
        }
      }

      // Level & proficiency bonus
      const cells = [{class: "level", content: level.ordinalString()}];
      if ( item.type === "class" ) cells.push({class: "prof", content: `+${Proficiency.calculateMod(level)}`});
      if ( hasFeatures ) cells.push({class: "features", content: features.join(", ")});
      scaleValues.forEach(s => cells.push({class: "scale", content: s.valueForLevel(level)?.display}));
      const powerCells = powerProgression?.rows[rows.length];
      if ( powerCells ) cells.push(...powerCells);

      // Skip empty rows on archetypes
      if ( (item.type === "archetype") && !features.length && !scaleValues.length && !powerCells ) continue;

      rows.push(cells);
    }

    return { headers, cols, rows };
  }

  /* -------------------------------------------- */

  /**
   * Build out the power progression data.
   * @param {Item5e} item  Class item belonging to this journal.
   * @returns {object}     Prepared power progression table.
   */
  async _getPowerProgression(item) {
    const powercasting = foundry.utils.deepClone(item.powercasting);
    if ( !powercasting || (powercasting.progression === "none") ) return null;

    const table = { rows: [] };

    if ( powercasting.type === "leveled" ) {
      const powers = {};
      const maxPowerLevel = CONFIG.SW5E.SPELL_SLOT_TABLE[CONFIG.SW5E.SPELL_SLOT_TABLE.length - 1].length;
      Array.fromRange(maxPowerLevel, 1).forEach(l => powers[`power${l}`] = {});

      let largestSlot;
      for ( const level of Array.fromRange(CONFIG.SW5E.maxLevel, 1).reverse() ) {
        const progression = { slot: 0 };
        powercasting.levels = level;
        Actor5e.computeClassProgression(progression, item, { powercasting });
        Actor5e.preparePowercastingSlots(powers, "leveled", progression);

        if ( !largestSlot ) largestSlot = Object.entries(powers).reduce((slot, [key, data]) => {
          if ( !data.max ) return slot;
          const level = parseInt(key.slice(5));
          if ( !Number.isNaN(level) && (level > slot) ) return level;
          return slot;
        }, -1);

        table.rows.push(Array.fromRange(largestSlot, 1).map(powerLevel => {
          return {class: "power-slots", content: powers[`power${powerLevel}`]?.max || "&mdash;"};
        }));
      }

      // Prepare headers & columns
      table.headers = [
        [{content: game.i18n.localize("JOURNALENTRYPAGE.SW5E.Class.PowerSlotsPerPowerLevel"), colSpan: largestSlot}],
        Array.fromRange(largestSlot, 1).map(powerLevel => ({content: powerLevel.ordinalString()}))
      ];
      table.cols = [{class: "powercasting", span: largestSlot}];
      table.rows.reverse();
    }

    else if ( powercasting.type === "pact" ) {
      const powers = { pact: {} };

      table.headers = [[
        { content: game.i18n.localize("JOURNALENTRYPAGE.SW5E.Class.PowerSlots") },
        { content: game.i18n.localize("JOURNALENTRYPAGE.SW5E.Class.PowerSlotLevel") }
      ]];
      table.cols = [{class: "powercasting", span: 2}];

      // Loop through each level, gathering "Power Slots" & "Slot Level" for each one
      for ( const level of Array.fromRange(CONFIG.SW5E.maxLevel, 1) ) {
        const progression = { pact: 0 };
        powercasting.levels = level;
        Actor5e.computeClassProgression(progression, item, { powercasting });
        Actor5e.preparePowercastingSlots(powers, "pact", progression);
        table.rows.push([
          { class: "power-slots", content: `${powers.pact.max}` },
          { class: "slot-level", content: powers.pact.level.ordinalString() }
        ]);
      }
    }

    else {
      /**
       * A hook event that fires to generate the table for custom powercasting types.
       * The actual hook names include the powercasting type (e.g. `sw5e.buildPsionicPowercastingTable`).
       * @param {object} table                          Table definition being built. *Will be mutated.*
       * @param {Item5e} item                           Class for which the powercasting table is being built.
       * @param {PowercastingDescription} powercasting  Powercasting descriptive object.
       * @function sw5e.buildPowercastingTable
       * @memberof hookEvents
       */
      Hooks.callAll(
        `sw5e.build${powercasting.type.capitalize()}PowercastingTable`, table, item, powercasting
      );
    }

    return table;
  }

  /* -------------------------------------------- */

  /**
   * Prepare options table based on optional GrantItem advancement.
   * @param {Item5e} item    Class item belonging to this journal.
   * @returns {object|null}  Prepared optional features table.
   */
  async _getOptionalTable(item) {
    const headers = [[
      { content: game.i18n.localize("SW5E.Level") },
      { content: game.i18n.localize("SW5E.Features") }
    ]];

    const cols = [
      { class: "level", span: 1 },
      { class: "features", span: 1 }
    ];

    const makeLink = async uuid => (await fromUuid(uuid))?.toAnchor({classes: ["content-link"]}).outerHTML;

    const rows = [];
    for ( const level of Array.fromRange(CONFIG.SW5E.maxLevel, 1) ) {
      const features = [];
      for ( const advancement of item.advancement.byLevel[level] ) {
        switch ( advancement.constructor.typeName ) {
          case "ItemGrant":
            if ( !advancement.configuration.optional ) continue;
            features.push(...await Promise.all(advancement.configuration.items.map(makeLink)));
            break;
        }
      }
      if ( !features.length ) continue;

      // Level & proficiency bonus
      const cells = [
        { class: "level", content: level.ordinalString() },
        { class: "features", content: features.join(", ") }
      ];
      rows.push(cells);
    }
    if ( !rows.length ) return null;

    return { headers, cols, rows };
  }

  /* -------------------------------------------- */

  /**
   * Fetch data for each class feature listed.
   * @param {Item5e} item               Class or archetype item belonging to this journal.
   * @param {boolean} [optional=false]  Should optional features be fetched rather than required features?
   * @returns {object[]}   Prepared features.
   */
  async _getFeatures(item, optional=false) {
    const prepareFeature = async uuid => {
      const document = await fromUuid(uuid);
      return {
        document,
        name: document.name,
        description: await TextEditor.enrichHTML(document.system.description.value, {
          relativeTo: item, secrets: false, async: true
        })
      };
    };

    let features = [];
    for ( const advancement of item.advancement.byType.ItemGrant ?? [] ) {
      if ( !!advancement.configuration.optional !== optional ) continue;
      features.push(...advancement.configuration.items.map(prepareFeature));
    }
    features = await Promise.all(features);
    return features;
  }

  /* -------------------------------------------- */

  /**
   * Fetch each archetype and their features.
   * @param {string[]} uuids   UUIDs for the archetypes to fetch.
   * @returns {object[]|null}  Prepared archetypes.
   */
  async _getArchetypes(uuids) {
    const prepareArchetype = async uuid => {
      const document = await fromUuid(uuid);
      return this._getArchetype(document);
    };

    const archetypes = await Promise.all(uuids.map(prepareArchetype));
    return archetypes.length ? archetypes : null;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data for the provided archetype.
   * @param {Item5e} item  Archetype item being prepared.
   * @returns {object}     Presentation data for this archetype.
   */
  async _getArchetype(item) {
    const initialLevel = Object.entries(item.advancement.byLevel).find(([lvl, d]) => d.length)?.[0] ?? 1;
    return {
      document: item,
      name: item.name,
      description: await TextEditor.enrichHTML(item.system.description.value, {
        relativeTo: item, secrets: false, async: true
      }),
      features: await this._getFeatures(item),
      table: await this._getTable(item, parseInt(initialLevel))
    };
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _renderInner(...args) {
    const html = await super._renderInner(...args);
    this.toc = JournalEntryPage.buildTOC(html.get());
    return html;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].querySelectorAll(".item-delete").forEach(e => {
      e.addEventListener("click", this._onDeleteItem.bind(this));
    });
    html[0].querySelectorAll(".launch-text-editor").forEach(e => {
      e.addEventListener("click", this._onLaunchTextEditor.bind(this));
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle deleting a dropped item.
   * @param {Event} event  The triggering click event.
   * @returns {JournalClassSummary5ePageSheet}
   */
  async _onDeleteItem(event) {
    event.preventDefault();
    const container = event.currentTarget.closest("[data-item-uuid]");
    const uuidToDelete = container?.dataset.itemUuid;
    if ( !uuidToDelete ) return;
    switch (container.dataset.itemType) {
      case "class":
        await this.document.update({"system.item": ""});
        return this.render();
      case "archetype":
        const itemSet = this.document.system.archetypeItems;
        itemSet.delete(uuidToDelete);
        await this.document.update({"system.archetypeItems": Array.from(itemSet)});
        return this.render();
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle launching the individual text editing window.
   * @param {Event} event  The triggering click event.
   */
  _onLaunchTextEditor(event) {
    event.preventDefault();
    const textKeyPath = event.currentTarget.dataset.target;
    const label = event.target.closest(".form-group").querySelector("label");
    const editor = new JournalEditor(this.document, { textKeyPath, title: label?.innerText });
    editor.render(true);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    if ( data?.type !== "Item" ) return false;
    const item = await Item.implementation.fromDropData(data);
    switch ( item.type ) {
      case "class":
        await this.document.update({"system.item": item.uuid});
        return this.render();
      case "archetype":
        const itemSet = this.document.system.archetypeItems;
        itemSet.add(item.uuid);
        await this.document.update({"system.archetypeItems": Array.from(itemSet)});
        return this.render();
      default:
        return false;
    }
  }
}
