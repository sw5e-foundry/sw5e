/**
 * A helper Dialog subclass for completing a refitting repair.
 *
 * @param {Actor5e} actor           Actor that is taking the refitting repair.
 * @param {object} [dialogData={}]  An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}]     Dialog rendering options.
 */
export default class RefittingRepairDialog extends Dialog {
  constructor(actor, dialogData = {}, options = {}) {
    super(dialogData, options);
    this.actor = actor;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/sw5e/templates/apps/refitting-repair.hbs",
      classes: ["sw5e", "dialog"]
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  getData() {
    const context = super.getData();
    const variant = game.settings.get("sw5e", "restVariant");
    context.isGroup = this.actor.type === "group";
    context.promptNewDay = variant !== "gritty"; // It's always a new day when repairing 1 week
    context.newDay = variant === "normal"; // It's probably a new day when repariting normally (8 hours)
    return context;
  }

  /* -------------------------------------------- */

  /**
   * A helper constructor function which displays the Refitting Repair confirmation dialog
   * and returns a Promise once it's workflow has been resolved.
   * @param {object} [options={}]
   * @param {Actor5e} [options.actor]  Actor that is taking the refitting repair.
   * @returns {Promise}                Promise that resolves when the repair is completed or rejects when canceled.
   */
  static async refittingRepairDialog({ actor } = {}) {
    return new Promise((resolve, reject) => {
      const dlg = new this(actor, {
        title: `${game.i18n.localize("SW5E.RefittingRepair")}: ${actor.name}`,
        buttons: {
          rest: {
            icon: '<i class="fas fa-wrench"></i>',
            label: game.i18n.localize("SW5E.Repair"),
            callback: html => {
              const formData = new FormDataExtended(html.find("form")[0]);
              resolve(formData.object);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("Cancel"),
            callback: reject
          }
        },
        default: "repair",
        close: reject
      });
      dlg.render(true);
    });
  }
}
