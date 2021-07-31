/**
 * A helper Dialog subclass for rolling Hull Dice on a recharge repair
 * @extends {Dialog}
 */
export default class RechargeRepairDialog extends Dialog {
    constructor(actor, dialogData = {}, options = {}) {
        super(dialogData, options);

        /**
         * Store a reference to the Actor entity which is repairing
         * @type {Actor}
         */
        this.actor = actor;

        /**
         * Track the most recently used HD denomination for re-rendering the form
         * @type {string}
         */
        this._denom = null;
    }

    /* -------------------------------------------- */

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/sw5e/templates/apps/recharge-repair.html",
            classes: ["sw5e", "dialog"]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();

        // Determine Hull Dice
        data.availableHD = this.actor.data.items.reduce((hd, item) => {
            if (item.type === "starship") {
                const d = item.data.data;
                const denom = d.hullDice || "d6";
                const available =
                    parseInt(d.hullDiceStart || 1) + parseInt(d.tier || 0) - parseInt(d.hullDiceUsed || 0);
                hd[denom] = denom in hd ? hd[denom] + available : available;
            }
            return hd;
        }, {});
        data.canRoll = this.actor.data.data.attributes.hull.dice > 0;
        data.denomination = this._denom;

        // Determine rest type
        const variant = game.settings.get("sw5e", "restVariant");
        data.promptNewDay = variant !== "epic"; // It's never a new day when only repairing 1 minute
        data.newDay = false; // It may be a new day, but not by default
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        let btn = html.find("#roll-hulld");
        btn.click(this._onRollHullDie.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Handle rolling a Hull Die as part of a Recharge Repair action
     * @param {Event} event     The triggering click event
     * @private
     */
    async _onRollHullDie(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        this._denom = btn.form.hulld.value;
        await this.actor.rollHullDie(this._denom);
        this.render();
    }

    /* -------------------------------------------- */

    /**
     * A helper constructor function which displays the Recharge Repair dialog and returns a Promise once it's workflow has
     * been resolved.
     * @param {Actor5e} actor
     * @return {Promise}
     */
    static async rechargeRepairDialog({actor} = {}) {
        return new Promise((resolve, reject) => {
            const dlg = new this(actor, {
                title: game.i18n.localize("SW5E.Recharge Repair"),
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: game.i18n.localize("SW5E.Repair"),
                        callback: (html) => {
                            let newDay = false;
                            if (game.settings.get("sw5e", "restVariant") === "gritty")
                                newDay = html.find('input[name="newDay"]')[0].checked;
                            resolve(newDay);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("Cancel"),
                        callback: reject
                    }
                },
                close: reject
            });
            dlg.render(true);
        });
    }
}
