import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for item grants.
 */
export default class ItemGrantConfig extends AdvancementConfig {

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e", "advancement", "item-grant"],
      dragDrop: [{ dropSelector: ".drop-target" }],
      dropKeyPath: "items",
      template: "systems/sw5e/templates/advancement/item-grant-config.hbs"
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  getData(options={}) {
    const context = super.getData(options);
    const indexes = context.configuration.items.map(i => fromUuidSync(i.uuid));
    context.abilities = Object.entries(CONFIG.SW5E.abilities).reduce((obj, [k, c]) => {
      obj[k] = { label: c.label, selected: context.configuration.power?.ability.has(k) ? "selected" : "" };
      return obj;
    }, {});
    context.showContainerWarning = indexes.some(i => i?.type === "container");
    context.showPowerConfig = indexes.some(i => i?.type === "power");
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async prepareConfigurationUpdate(configuration) {
    if ( configuration.power ) configuration.power.ability ??= [];
    return configuration;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _validateDroppedItem(event, item) {
    this.advancement._validateItemType(item);
  }
}
