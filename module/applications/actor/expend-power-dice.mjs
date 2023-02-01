/**
 * A helper Dialog subclass for allocating power dice
 * @extends {Dialog}
 */
export default class ExpendPowerDiceDialog extends Dialog {
    constructor(actor, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.actor = actor;
    }

    /* -------------------------------------------- */

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/sw5e/templates/apps/expend-power-dice.hbs",
            classes: ["sw5e", "dialog"]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        const power = this.actor.system.attributes.power;
        const slots = CONFIG.SW5E.powerDieSlots;

        data.slots = {};

        for (const [id, str] of Object.entries(slots)) {
            data.slots[id] = {
                id: id,
                str: str,
                disabled: power[id].value < 1
            };
        }

        return data;
    }

    /* -------------------------------------------- */

    /**
     * A helper constructor function which displays the power dice allocation confirmation dialog and returns a Promise once it's
     * workflow has been resolved.
     * @returns {Promise}
     */
    static async expendPowerDice(actor) {
        return new Promise((resolve, reject) => {
            const dlg = new this(actor, {
                title: `${game.i18n.localize("SW5E.ExpendPowerDice")}: ${actor.name}`,
                buttons: {
                    expend: {
                        icon: '<i class="fas fa-wrench"></i>',
                        label: game.i18n.localize("SW5E.ExpendPowerDice"),
                        callback: (html) => {
                            const chosen = html.find(`select[name="slot"]`)[0];
                            resolve(chosen.value);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("Cancel"),
                        callback: reject
                    }
                },
                default: "expend",
                close: reject
            });
            dlg.render(true);
        });
    }
}
