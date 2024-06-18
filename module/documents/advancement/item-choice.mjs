import ItemChoiceConfig from "../../applications/advancement/item-choice-config.mjs";
import ItemChoiceFlow from "../../applications/advancement/item-choice-flow.mjs";
import { ItemChoiceConfigurationData, ItemChoiceValueData } from "../../data/advancement/item-choice.mjs";
import ItemGrantAdvancement from "./item-grant.mjs";

/**
 * Advancement that presents the player with a choice of multiple items that they can take. Keeps track of which
 * items were selected at which levels.
 */
export default class ItemChoiceAdvancement extends ItemGrantAdvancement {

  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      dataModels: {
        configuration: ItemChoiceConfigurationData,
        value: ItemChoiceValueData
      },
      order: 50,
      icon: "systems/sw5e/icons/svg/item-choice.svg",
      title: game.i18n.localize("SW5E.AdvancementItemChoiceTitle"),
      hint: game.i18n.localize("SW5E.AdvancementItemChoiceHint"),
      multiLevel: true,
      apps: {
        config: ItemChoiceConfig,
        flow: ItemChoiceFlow
      }
    });
  }

  /* -------------------------------------------- */
  /*  Instance Properties                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return Array.from(Object.keys(this.configuration.choices));
  }

  /* -------------------------------------------- */
  /*  Display Methods                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  configuredForLevel(level) {
    return (this.value.added?.[level] !== undefined) || !this.configuration.choices[level]?.count;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  titleForLevel(level, { configMode = false } = {}) {
    const data = this.configuration.choices[level] ?? {};
    let tag;
    if (data.count) tag = game.i18n.format("SW5E.AdvancementItemChoiceChoose", { count: data.count });
    else if (data.replacement) tag = game.i18n.localize("SW5E.AdvancementItemChoiceReplacementTitle");
    else return this.title;
    return `${this.title} <em>(${tag})</em>`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  summaryForLevel(level, { configMode = false } = {}) {
    const items = this.value.added?.[level];
    if (!items || configMode) return "";
    return Object.values(items).reduce((html, uuid) => html + game.sw5e.utils.linkForUuid(uuid), "");
  }

  /* -------------------------------------------- */
  /*  Application Methods                         */
  /* -------------------------------------------- */

  /** @override */
  storagePath(level) {
    return `value.added.${level}`;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async apply(level, { replace: original, ...data }, retainedData = {}) {
    let replacement;
    if (retainedData.replaced) ({ original, replacement } = retainedData.replaced);

    const updates = await super.apply(level, data, retainedData);

    replacement ??= Object.keys(updates).pop();
    if (original && replacement) {
      const replacedLevel = Object.entries(this.value.added).reverse().reduce((level, [l, v]) => {
        if ((original in v) && (Number(l) > level)) return Number(l);
        return level;
      }, 0);
      if (Number.isFinite(replacedLevel)) {
        this.actor.items.delete(original);
        this.updateSource({ [`value.replaced.${level}`]: { level: replacedLevel, original, replacement } });
      }
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  restore(level, data) {
    const original = this.actor.items.get(data.replaced?.original);
    if (data.replaced && !original) data.items = data.items.filter(i => i._id !== data.replaced.replacement);

    super.restore(level, data);

    if (data.replaced) {
      if (!original) {
        throw new ItemChoiceAdvancement.ERROR(game.i18n.localize("SW5E.AdvancementItemChoiceNoOriginalError"));
      }
      this.actor.items.delete(data.replaced.original);
      this.updateSource({ [`value.replaced.${level}`]: data.replaced });
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async reverse(level) {
    const retainedData = await super.reverse(level);

    const replaced = retainedData.replaced = this.value.replaced[level];
    if (replaced) {
      const uuid = this.value.added[replaced.level][replaced.original];
      const itemData = await this.createItemData(uuid, replaced.original);
      if (itemData) {
        if (itemData.type === "power") {
          foundry.utils.mergeObject(itemData, this.configuration.power?.powerChanges ?? {});
        }
        this.actor.updateSource({ items: [itemData] });
        this.updateSource({ [`value.replaced.-=${level}`]: null });
      }
    }

    return retainedData;
  }

  /* -------------------------------------------- */

  /**
   * Verify that the provided item can be used with this advancement based on the configuration.
   * @param {Item5e} item                   Item that needs to be tested.
   * @param {object} config
   * @param {string} config.type            Type restriction on this advancement.
   * @param {object} config.restriction     Additional restrictions to be applied.
   * @param {boolean} [config.strict=true]  Should an error be thrown when an invalid type is encountered?
   * @returns {boolean}                     Is this type valid?
   * @throws An error if the item is invalid and strict is `true`.
   */
  _validateItemType(item, { type, restriction, strict = true } = {}) {
    super._validateItemType(item, { strict });
    type ??= this.configuration.type;
    restriction ??= this.configuration.restriction;

    // Type restriction is set and the item type does not match the selected type
    if (type && (type !== item.type)) {
      const typeLabel = game.i18n.localize(CONFIG.Item.typeLabels[restriction]);
      if (strict) throw new Error(game.i18n.format("SW5E.AdvancementItemChoiceTypeWarning", { type: typeLabel }));
      return false;
    }

    // If additional type restrictions applied, make sure they are valid
    if ((type === "feat") && restriction.type) {
      const typeConfig = CONFIG.SW5E.featureTypes[restriction.type];
      const subtype = typeConfig.subtypes?.[restriction.subtype];
      let errorLabel;
      if (restriction.type !== item.system.type.value) errorLabel = typeConfig.label;
      else if (subtype && (restriction.subtype !== item.system.type.subtype)) errorLabel = subtype;
      if (errorLabel) {
        if (strict) throw new Error(game.i18n.format("SW5E.AdvancementItemChoiceTypeWarning", { type: errorLabel }));
        return false;
      }
    }

    // If power level is restricted, ensure the power is of the appropriate level
    const l = parseInt(restriction.level);
    if ((type === "power") && !Number.isNaN(l) && (item.system.level !== l)) {
      const level = CONFIG.SW5E.powerLevels[l];
      if (strict) throw new Error(game.i18n.format("SW5E.AdvancementItemChoicePowerLevelSpecificWarning", { level }));
      return false;
    }

    return true;
  }
}
