import ItemGrantFlow from "./item-grant-flow.mjs";

/**
 * Inline application that presents the player with a choice of items.
 */
export default class ItemChoiceFlow extends ItemGrantFlow {

  /**
   * Currently selected ability.
   * @type {string}
   */
  ability;

  /**
   * Set of selected UUIDs.
   * @type {Set<string>}
   */
  selected;

  /**
   * Cached items from the advancement's pool.
   * @type {Item5e[]}
   */
  pool;

  /**
   * UUID of item to be replaced.
   * @type {string}
   */
  replacement;

  /**
   * List of dropped items.
   * @type {Item5e[]}
   */
  dropped;

  /* -------------------------------------------- */

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      dragDrop: [{ dropSelector: ".drop-target" }],
      template: "systems/sw5e/templates/advancement/item-choice-flow.hbs"
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async retainData(data) {
    await super.retainData(data);
    this.replacement = data.replaced?.original;
    this.selected = new Set(data.items.map(i => foundry.utils.getProperty(i, "flags.sw5e.sourceId")));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getContext() {
    const context = {};
    this.selected ??= new Set(Object.values(this.advancement.value.added?.[this.level] ?? {}));
    this.pool ??= await Promise.all(this.advancement.configuration.pool.map(i => fromUuid(i.uuid)));
    if (!this.dropped) {
      this.dropped = [];
      for (const data of this.retainedData?.items ?? []) {
        const uuid = foundry.utils.getProperty(data, "flags.sw5e.sourceId");
        if (this.pool.find(i => uuid === i.uuid)) continue;
        const item = await fromUuid(uuid);
        item.dropped = true;
        this.dropped.push(item);
      }
    }

    const levelConfig = this.advancement.configuration.choices[this.level];
    let max = levelConfig.count ?? 0;
    context.replaceable = levelConfig.replacement;
    context.noReplacement = !this.advancement.actor.items.has(this.replacement);
    if ( context.replaceable && !context.noReplacement ) max++;
    if ( this.selected.size > max ) {
      const [kept, lost] = Array.from(Array.from(this.selected).entries()).reduce(([kept, lost], [index, value]) => {
        if ( index < max ) kept.push(value);
        else lost.push(value);
        return [kept, lost];
      }, [[], []]);
      this.selected = new Set(kept);
      this.dropped = this.dropped.filter(i => !lost.includes(i.uuid));
    }
    context.choices = { max, current: this.selected.size, full: this.selected.size >= max };

    context.previousLevels = {};
    const previouslySelected = new Set();
    for ( const level of Array.fromRange(this.level - 1, 1) ) {
      const added = this.advancement.value.added[level];
      if ( added ) context.previousLevels[level] = Object.entries(added).map(([id, uuid]) => {
        const item = fromUuidSync(uuid);
        previouslySelected.add(uuid);
        return {
          ...item, id, uuid,
          checked: id === this.replacement,
          replaced: false
        };
      });
      const replaced = this.advancement.value.replaced[level];
      if ( replaced ) {
        const match = context.previousLevels[replaced.level].find(v => v.id === replaced.original);
        if ( match ) {
          match.replaced = true;
          previouslySelected.delete(match.uuid);
        }
      }
    }

    context.items = [...this.pool, ...this.dropped].reduce((items, i) => {
      if ( i ) {
        i.checked = this.selected.has(i.uuid);
        i.disabled = !i.checked && context.choices.full;
        const validLevel = (i.system.prerequisites?.level ?? -Infinity) <= this.level;
        if ( !previouslySelected.has(i.uuid) && validLevel ) items.push(i);
      }
      return items;
    }, []);

    context.abilities = this.getSelectAbilities();
    context.abilities.disabled = previouslySelected.size;
    this.ability ??= context.abilities.selected;

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-delete").click(this._onItemDelete.bind(this));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onChangeInput(event) {
    if ( event.target.type === "checkbox" ) {
      if ( event.target.checked ) this.selected.add(event.target.name);
    else this.selected.delete(event.target.name);
    }
    else if ( event.target.type === "radio" ) this.replacement = event.target.value;
    else if ( event.target.name === "ability" ) this.ability = event.target.value;
    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Handle deleting a dropped item.
   * @param {Event} event  The originating click event.
   * @protected
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const uuidToDelete = event.currentTarget.closest(".item-name")?.querySelector("input")?.name;
    if (!uuidToDelete) return;
    this.dropped.findSplice(i => i.uuid === uuidToDelete);
    this.selected.delete(uuidToDelete);
    this.render();
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDrop(event) {
    const levelConfig = this.advancement.configuration.choices[this.level];
    let max = levelConfig.count ?? 0;
    if ( levelConfig.replacement && this.advancement.actor.items.has(this.replacement) ) max++;
    if ( this.selected.size >= max ) return false;

    // Try to extract the data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch(err) {
      return false;
    }

    if (data.type !== "Item") return false;
    const item = await Item.implementation.fromDropData(data);

    try {
      this.advancement._validateItemType(item);
    } catch(err) {
      ui.notifications.error(err.message);
      return null;
    }

    // If the item is already been marked as selected, no need to go further
    if (this.selected.has(item.uuid)) return false;

    // Check to ensure the dropped item hasn't been selected at a lower level
    for (const [level, data] of Object.entries(this.advancement.value.added ?? {})) {
      if (level >= this.level) continue;
      if (Object.values(data).includes(item.uuid)) {
        ui.notifications.error("SW5E.AdvancementItemChoicePreviouslyChosenWarning", {localize: true});
        return null;
      }
    }

    // If a feature has a level pre-requisite, make sure it is less than or equal to current level
    if ( (item.system.prerequisites?.level ?? -Infinity) > this.level ) {
      ui.notifications.error(game.i18n.format("SW5E.AdvancementItemChoiceFeatureLevelWarning", {
        level: item.system.prerequisites.level
      }));
      return null;
    }

    // If power level is restricted to available level, ensure the power is of the appropriate level
    const powerLevel = this.advancement.configuration.restriction.level;
    if (this.advancement.configuration.type === "power" && powerLevel === "available") {
      const maxSlot = this._maxPowerSlotLevel();
      if ( item.system.level > maxSlot ) {
        ui.notifications.error(game.i18n.format("SW5E.AdvancementItemChoicePowerLevelAvailableWarning", {
          level: CONFIG.SW5E.powerLevels[maxSlot]
        }));
        return null;
      }
    }

    // Mark the item as selected
    this.selected.add(item.uuid);

    // If the item doesn't already exist in the pool, add it
    if (!this.pool.find(i => i.uuid === item.uuid)) {
      this.dropped.push(item);
      item.dropped = true;
    }

    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Determine the maximum power slot level for the actor to which this advancement is being applied.
   * @returns {number}
   */
  _maxPowerSlotLevel() {
    // TODO SW5E: Adapt this to work with force and tech powers
    // const powercasting = this.advancement.item.powercasting;
    // let powers;

    // // For advancements on classes or archetypes, use the largest slot available for that class
    // if (powercasting) {
    //   const progression = { slot: 0, pact: {} };
    //   const maxPowerLevel = CONFIG.SW5E.SPELL_SLOT_TABLE[CONFIG.SW5E.SPELL_SLOT_TABLE.length - 1].length;
    //   powers = Object.fromEntries(Array.fromRange(maxPowerLevel, 1).map(l => [`power${l}`, {}]));
    //   Actor5e.computeClassProgression(progression, this.advancement.item, { powercasting });
    //   Actor5e.preparePowercastingSlots(powers, powercasting.type, progression);
    // }

    // // For all other items, use the largest slot possible
    // else powers = this.advancement.actor.system.powers;

    const attr = this.advancement.actor.system.attributes;
    const largestSlot = Math.max(attr.force.maxPowerLevel, attr.tech.maxPowerLevel);
    return largestSlot;
  }
}
