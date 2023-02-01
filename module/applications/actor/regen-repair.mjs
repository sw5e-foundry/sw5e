/**
 * A helper Dialog subclass for completing a regen repair
 *
 * @param {Actor5e} actor           Actor that is taking the regen repair.
 * @param {object} [dialogData={}]  An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}]     Dialog rendering options.
 */
export default class RegenRepairDialog extends Dialog {
    constructor(actor, dialogData = {}, options = {}) {
        super(dialogData, options);

        /**
         * Store a reference to the Actor document which is repairing
         * @type {Actor}
         */
        this.actor = actor;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/sw5e/templates/apps/regen-repair.hbs",
            classes: ["sw5e", "dialog"]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        const attr = this.actor.system.attributes;
        if (attr.hp.temp == attr.hp.tempmax || attr.shld.depleted || Number(attr.shld.dice) == 0) {
            data.useShieldDie = false;
        } else {
            data.useShieldDie = true;
        }
        return data;
    }

    /* -------------------------------------------- */

    /**
     * A helper constructor function which displays the regen repair confirmation dialog and returns a Promise once it's
     * workflow has been resolved.
     * @param {object} [options={}]
     * @param {Actor5e} [options.actor]  Actor that is taking the regen repair.
     * @returns {Promise}                Promise that resolves when the repair is completed or rejects when canceled.
     */
    static async regenRepairDialog({actor} = {}) {
        return new Promise((resolve, reject) => {
            const dlg = new this(actor, {
                title: `${game.i18n.localize("SW5E.RegenRepair")}: ${actor.name}`,
                buttons: {
                    regen: {
                        icon: '<i class="fas fa-wrench"></i>',
                        label: game.i18n.localize("SW5E.Regen"),
                        callback: (html) => {
                            const useShieldDie = html.find('input[name="useShieldDie"]')[0].checked;
                            resolve(useShieldDie);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("Cancel"),
                        callback: reject
                    }
                },
                default: "regen",
                close: reject
            });
            dlg.render(true);
        });
    }
}
