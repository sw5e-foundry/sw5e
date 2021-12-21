/**
 * A helper Dialog subclass for completing a refitting repair
 * @extends {Dialog}
 */
export default class RefittingRepairDialog extends Dialog {
    constructor(actor, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.actor = actor;
    }

    /* -------------------------------------------- */

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/sw5e/templates/apps/refitting-repair.html",
            classes: ["sw5e", "dialog"]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        const variant = game.settings.get("sw5e", "restVariant");
        data.promptNewDay = variant !== "gritty"; // It's always a new day when resting 1 week
        data.newDay = variant === "normal"; // It's probably a new day when resting normally (8 hours)
        return data;
    }

    /* -------------------------------------------- */

    /**
     * A helper constructor function which displays the Refitting Repair confirmation dialog and returns a Promise once it's
     * workflow has been resolved.
     * @param {Actor5e} actor
     * @returns {Promise}
     */
    static async refittingRepairDialog({actor} = {}) {
        return new Promise((resolve, reject) => {
            const dlg = new this(actor, {
                title: `${game.i18n.localize("SW5E.Refitting Repair")}: ${actor.name}`,
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-wrench"></i>',
                        label: game.i18n.localize("SW5E.Repair"),
                        callback: (html) => {
                            let newDay = true;
                            if (game.settings.get("sw5e", "restVariant") !== "gritty") {
                                newDay = html.find('input[name="newDay"]')[0].checked;
                            }
                            resolve(newDay);
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
