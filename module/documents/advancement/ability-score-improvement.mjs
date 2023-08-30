import Advancement from "./advancement.mjs";
import AbilityScoreImprovementConfig from "../../applications/advancement/ability-score-improvement-config.mjs";
import AbilityScoreImprovementFlow from "../../applications/advancement/ability-score-improvement-flow.mjs";
import {
  AbilityScoreImprovementConfigurationData,
  AbilityScoreImprovementValueData
} from "../../data/advancement/ability-score-improvement.mjs";

/**
 * Advancement that presents the player with the option of improving their ability scores or selecting a feat.
 */
export default class AbilityScoreImprovementAdvancement extends Advancement {

  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      dataModels: {
        configuration: AbilityScoreImprovementConfigurationData,
        value: AbilityScoreImprovementValueData
      },
      order: 20,
      icon: "systems/sw5e/icons/svg/ability-score-improvement.svg",
      title: game.i18n.localize("SW5E.AdvancementAbilityScoreImprovementTitle"),
      hint: game.i18n.localize("SW5E.AdvancementAbilityScoreImprovementHint"),
      validItemTypes: new Set(["background", "class", "species"]),
      apps: {
        config: AbilityScoreImprovementConfig,
        flow: AbilityScoreImprovementFlow
      }
    });
  }

  /* -------------------------------------------- */
  /*  Instance Properties                         */
  /* -------------------------------------------- */

  /**
   * Does this advancement allow feats, or just ability score improvements?
   * @type {boolean}
   */
  get allowFeat() {
    return (this.item.type === "class") && game.settings.get("sw5e", "allowFeats");
  }

  /* -------------------------------------------- */

  /**
   * Does this advancement allow feats and ASI?
   * @type {boolean}
   */
  get allowFeatAndASI() {
    return this.allowFeat && game.settings.get("sw5e", "allowFeatsAndASI");
  }

  /* -------------------------------------------- */

  /**
   * Information on the ASI points available.
   * @type {{ assigned: number, total: number }}
   */
  get points() {
    return {
      assigned: Object.entries(this.value.assignments ?? {}).reduce((n, [abl, c]) => {
        if ( this.canImprove(abl) ) n += c;
        return n;
      }, 0),
      total: this.configuration.points + Object.entries(this.configuration.fixed).reduce((t, [abl, v]) => {
        if ( this.canImprove(abl) ) t += v;
        return t;
      }, 0)
    };
  }

  /* -------------------------------------------- */
  /*  Instance Methods                            */
  /* -------------------------------------------- */

  /**
   * Is this ability allowed to be improved?
   * @param {string} ability  The ability key.
   * @returns {boolean}
   */
  canImprove(ability) {
    return CONFIG.SW5E.abilities[ability]?.improvement !== false;
  }

  /* -------------------------------------------- */
  /*  Display Methods                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  titleForLevel(level, { configMode=false }={}) {
    if ( this.value.selected !== "feat" ) return this.title;
    return game.i18n.localize("SW5E.Feature.Feat");
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  summaryForLevel(level, { configMode=false }={}) {
    let html = "";

    if ( (["feat", "asi+feat"].includes(this.value.type)) && this.value.feat ) {
      const id = Object.keys(this.value.feat)[0];
      const feat = this.actor.items.get(id);
      if ( feat ) html += feat.toAnchor({classes: ["content-link"]}).outerHTML;
    }

    if ( (["asi", "asi+feat"].includes(this.value.type)) && this.value.assignments ) {
      const formatter = new Intl.NumberFormat(game.i18n.lang, { signDisplay: "always" });
      html += Object.entries(this.value.assignments).reduce((asi_html, [key, value]) => {
        const name = CONFIG.SW5E.abilities[key]?.label ?? key;
        asi_html += `<span class="tag">${name} <strong>${formatter.format(value)}</strong></span>\n`;
        return asi_html;
      }, "");
    }
    return html;
  }

  /* -------------------------------------------- */
  /*  Application Methods                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async apply(level, data) {
    const updates = {};

    if ( ["asi", "asi+feat"].includes(data.type) ) {
      const assignments = foundry.utils.mergeObject(this.configuration.fixed, data.assignments, {inplace: false});
      for ( const key of Object.keys(assignments) ) {
        const ability = this.actor.system.abilities[key];
        if ( !ability || !this.canImprove(key) ) continue;
        assignments[key] = Math.min(assignments[key], ability.max - ability.value);
        if ( assignments[key] ) updates[`system.abilities.${key}.value`] = ability.value + assignments[key];
        else delete assignments[key];
      }
      data.assignments = assignments;
      if ( data.type === "asi" ) data.feat = null;
    }

    if ( ["feat", "asi+feat"].includes(data.type) ) {
      let itemData = data.retainedItems?.[data.featUuid];
      if ( !itemData ) {
        const source = await fromUuid(data.featUuid);
        if ( source ) {
          itemData = source.clone({
            _id: foundry.utils.randomID(),
            "flags.sw5e.sourceId": data.featUuid,
            "flags.sw5e.advancementOrigin": `${this.item.id}.${this.id}`
          }, {keepId: true}).toObject();
        }
      }
      if ( data.type === "feat" ) data.assignments = null;
      if ( itemData ) {
        data.feat = { [itemData._id]: data.featUuid };
        updates[items] = [itemData];
      }
    }

    this.actor.updateSource(updates);
    this.updateSource({value: data});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  restore(level, data) {
    data.featUuid = Object.values(data.feat ?? {})[0];
    this.apply(level, data);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  reverse(level) {
    const source = this.value.toObject();

    if ( ["asi", "asi+feat"].includes(this.value.type) ) {
      const updates = {};
      for ( const [key, change] of Object.entries(this.value.assignments ?? {}) ) {
        const ability = this.actor.system.abilities[key];
        if ( !ability || !this.canImprove(key) ) continue;
        updates[`system.abilities.${key}.value`] = ability.value - change;
      }
      this.actor.updateSource(updates);
    }

    if ( ["feat", "asi+feat"].includes(this.value.type) ) {
      const [id, uuid] = Object.entries(this.value.feat ?? {})[0] ?? [];
      const item = this.actor.items.get(id);
      if ( item ) source.retainedItems = {[uuid]: item.toObject()};
      this.actor.items.delete(id);
    }

    this.updateSource({ "value.assignments": null, "value.feat": null });
    return source;
  }
}
