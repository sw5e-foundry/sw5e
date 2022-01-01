/**
 * A helper Dialog subclass for allocating power dice
 * @extends {Dialog}
 */
export default class AllocatePowerDice extends Dialog {
    constructor(actor, powerDice, slots, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.actor = actor;
        this.powerDice = powerDice;
        this.slots = slots;
    }

    /* -------------------------------------------- */

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/sw5e/templates/apps/allocate-power-dice.html",
            classes: ["sw5e", "dialog"]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        const power = this.actor.data.data.attributes.power;
        data.powerDice = this.powerDice;
        data.slots = {};
        for (const slot of this.slots) {
            data.slots[slot] = power[slot].value == power[slot].max;
        }
        return data;
    }

    /* -------------------------------------------- */

    /**
     * A helper constructor function which displays the power dice allocation confirmation dialog and returns a Promise once it's
     * workflow has been resolved.
     * @returns {Promise}
     */
    static async allocatePowerDice(actor, powerDice, slots) {
        return new Promise((resolve, reject) => {
            const dlg = new this(actor, powerDice, slots, {
                title: `${game.i18n.localize("SW5E.AllocatePowerDice")}: ${actor.name}`,
                buttons: {
                    allocate: {
                        icon: '<i class="fas fa-wrench"></i>',
                        label: game.i18n.localize("SW5E.AllocatePowerDice"),
                        callback: (html) => {
                            const power = actor.data.data.attributes.power;
                            const allocation = [];
                            for (const slot of slots) {
                                const wasAllocated = power[slot].value == power[slot].max;
                                const allocated = html.find(`input[name="${slot}"]`)[0].checked;
                                if (allocated && !wasAllocated) allocation.push(slot);
                            }
                            if (allocation.length == powerDice) resolve(allocation);
                            else throw Error(`You need to allocate ${powerDice} power dice.`);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("Cancel"),
                        callback: reject
                    }
                },
                default: "allocate",
                close: reject
            });
            dlg.render(true);
        });
    }
}
