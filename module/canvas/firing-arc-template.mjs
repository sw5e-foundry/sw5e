/**
 * A helper class for building MeasuredTemplates for 5e powers and abilities
 */
export default class FiringArcTemplate extends MeasuredTemplate {
  /**
   * Track the timestamp when the last mouse move event was captured.
   * @type {number}
   */
  #moveTime = 0;

  /* -------------------------------------------- */

  /**
   * The initially active CanvasLayer to re-activate after the workflow is complete.
   * @type {CanvasLayer}
   */
  #initialLayer;

  /* -------------------------------------------- */

  /**
   * Track the bound event handlers so they can be properly canceled later.
   * @type {object}
   */
  #events;

  /* -------------------------------------------- */

  /**
   * A factory method to create an FiringArcTemplate instance using
   * provided data from an Item5e instance and a Token5e Instance.
   * @param {Item5e} item               The Item object for which to construct the template
   * @param {object} [options={}] Options to modify the created template.
   * @returns {FiringArcTemplate|null}    The template object, or null if the item does not produce a template
   */
  static fromItem(item, options={}) {
    const token = options.token ?? item.actor?.sheet?.token;
    if (!token) return null;
    const arc = CONFIG.SW5E.weaponFiringArcs[item.system.firingArc];
    if (!arc?.shape) return null;

    const canvasUnit = canvas.dimensions.size;
    const halfShipSize = (token.width * canvasUnit) / 2;
    const range = options.longRange ? item.system.range.long : item.system.range.value;
    const distance = range + halfShipSize;
    const direction = (token.rotation + arc.direction) % 360;

    // Prepare template data
    const templateData = foundry.utils.mergeObject({
      t: arc.shape,
      angle: 90,
      user: game.user.id,
      distance,
      direction,
      x: Math.floor(token.x + halfShipSize),
      y: Math.floor(token.y + halfShipSize),
      fillColor: game.user.color,
      flags: { sw5e: { origin: item.uuid } }
    }, options);

    // Return the template constructed from the item data
    const cls = CONFIG.MeasuredTemplate.documentClass;
    const template = new cls(templateData, { parent: canvas.scene });
    const object = new this(template);
    object.item = item;
    object.actorSheet = item.actor?.sheet || null;
    object.token = token;
    return object;
  }

  /* -------------------------------------------- */

  /**
   * Creates a preview of the power template.
   * @returns {Promise}  A promise that resolves with the final measured template if created.
   */
  drawPreview() {
    const initialLayer = canvas.activeLayer;

    // Draw the template and switch to the template layer
    this.draw();
    this.layer.preview.addChild(this);

    // Activate interactivity
    return this.activatePreviewListeners(initialLayer);
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for the template preview
   * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
   * @returns {Promise}                 A promise that resolves with the final measured template if created.
   */
  activatePreviewListeners(initialLayer) {
    return new Promise((resolve, reject) => {
      this.#initialLayer = initialLayer;
      this.#events = {
        cancel: this._onCancelPlacement.bind(this),
        resolve,
        reject
      };
    });
  }

  /* -------------------------------------------- */

  /**
   * Shared code for when template placement ends by being confirmed or canceled.
   * @param {Event} event  Triggering event that ended the placement.
   */
  async _finishPlacement(event) {
    this.layer._onDragLeftCancel(event);
  }

  /* -------------------------------------------- */

  /**
   * Cancel placement when the right mouse button is clicked.
   * @param {Event} event  Triggering mouse event.
   */
  async _onCancelPlacement(event) {
    await this._finishPlacement(event);
  }
}
