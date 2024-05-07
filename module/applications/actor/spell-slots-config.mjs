import DialogMixin from "../dialog-mixin.mjs";

export default class ActorPowerSlotsConfig extends DialogMixin(DocumentSheet) {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e2", "dialog"],
      template: "systems/sw5e/templates/apps/power-slots-config.hbs",
      width: 450,
      height: "auto",
      sheetConfig: false,
      submitOnClose: true,
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  get title() {
    return `${game.i18n.localize("SW5E.PowerSlotsConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options={}) {
    const source = this.document._source.system.powers;
    const { powers } = this.document.system;
    const overrides = Array.fromRange(Object.keys(CONFIG.SW5E.powerLevels).length - 1, 1).map(level => ({
      value: source[`power${level}`]?.override,
      label: CONFIG.SW5E.powerLevels[level],
      name: `system.powers.power${level}.override`,
      placeholder: powers[`power${level}`]?.max ?? 0
    }));

    for ( const k of Object.keys(CONFIG.SW5E.powercastingTypes) ) {
      const hasPower = this.document.items.some(i => i.type === "power" && i.system.preparation.mode === k);
      if ( parseInt(powers[k]?.level) || hasPower ) overrides.push({
        label: CONFIG.SW5E.powerPreparationModes[k].label,
        value: source[k]?.override,
        name: `system.powers.${k}.override`,
        placeholder: powers[k]?.max ?? 0
      });
    }

    return { overrides };
  }
}
