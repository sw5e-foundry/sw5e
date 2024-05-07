/**
 * An abstract class containing common functionality between actor sheet configuration apps.
 * @extends {DocumentSheet}
 * @abstract
 */
export default class BaseConfigSheet extends DocumentSheet {

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      sheetConfig: false
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);
    if ( this.isEditable ) {
      for ( const override of this._getActorOverrides() ) {
        html.find(`input[name="${override}"],select[name="${override}"]`).each((i, el) => {
          el.disabled = true;
          el.dataset.tooltip = "SW5E.ActiveEffectOverrideWarning";
        });
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Retrieve the list of fields that are currently modified by Active Effects on the Actor.
   * @returns {string[]}
   * @protected
   */
  _getActorOverrides() {
    return Object.keys(foundry.utils.flattenObject(this.object.overrides || {}));
  }

  /* -------------------------------------------- */

  /**
   * Helper method to add choices that have been overridden.
   * @param {string} prefix       The initial form prefix under which the choices are grouped.
   * @param {string} path         Path in actor data.
   * @param {string[]} overrides  The list of fields that are currently modified by Active Effects. *Will be mutated.*
   * @internal
   */
  _addOverriddenChoices(prefix, path, overrides) {
    const source = new Set(foundry.utils.getProperty(this.document._source, path) ?? []);
    const current = foundry.utils.getProperty(this.document, path) ?? new Set();
    const delta = current.symmetricDifference(source);
    for ( const choice of delta ) overrides.push(`${prefix}.${choice}`);
  }
}
