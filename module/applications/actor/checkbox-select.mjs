/**
 * A helper Dialog subclass for allocating power dice
 * @extends {Dialog}
 */
export default class CheckboxSelectDialog extends Dialog {
    constructor(checkboxes, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.checkboxes = checkboxes;
    }

    /* -------------------------------------------- */

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/sw5e/templates/apps/checkbox-select.hbs",
            classes: ["sw5e", "dialog"]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.checkboxes = this.checkboxes;
        return data;
    }

    /**
     * A helper factory method to create simple confirmation dialog windows which consist of simple yes/no prompts.
     * If you require more flexibility, a custom Dialog instance is preferred.
     *
     * @param {object} config                               Confirmation dialog configuration
     * @param {string} config.title                         The window title
     * @param {string} config.content                       The message
     * @param {Object{string, string}]} config.checkboxes   Selectable options list
     * @param {Array.<string>} [config.defaultSelect=[]]    Array with the ids of pre-selected checkboxes
     * @param {Array.<string>} [config.disabled=[]]         Array with the ids of read-only checkboxes
     * @param {string} config.confirmLabel                  The confirmation button's text
     * @param {Function} [config.render]                    A function to call when the dialog is rendered
     * @param {boolean} [config.rejectClose=false]          Reject the Promise if the Dialog is closed without making a choice.
     * @param {Object} [config.options={}]                  Additional rendering options passed to the Dialog
     *
     * @return {Promise<*>}                                 A promise which resolves once the user makes a choice or closes the window
     *
     * @example
     * let d = CheckboxSelect.checkboxSelect({
     *  title: "What do you want in your pizza?",
     *  content: "<p>Choose wisely.</p>",
     *  checkboxes: { cheese: "Cheese", pepperoni: "Pepperoni", icecream: "Ice Cream"}
     *  defaultSelect: [ "cheese", "pepperoni" ]
     * });
     */
    static async checkboxSelect({
        title,
        content,
        checkboxes,
        defaultSelect = [],
        disabled = [],
        confirmLabel = "Confirm",
        render,
        rejectClose = false,
        options = {}
    } = {}) {
        return new Promise((resolve, reject) => {
            const select = {};
            for (const key of Object.keys(checkboxes)) {
                select[key] = {
                    label: game.i18n.localize(checkboxes[key]),
                    selected: defaultSelect.includes(key),
                    disabled: disabled.includes(key)
                };
            }
            const dialog = new this(
                select,
                {
                    title: title,
                    content: content,
                    buttons: {
                        ok: {
                            icon: '<i class="fas fa-check"></i>',
                            label: game.i18n.localize(confirmLabel),
                            callback: (html) => {
                                const boxes = html[0].querySelectorAll("input");
                                const result = [];
                                for (const box of boxes) if (box.checked) result.push(box.name);
                                resolve(result);
                            }
                        }
                    },
                    render: render,
                    close: () => {
                        if (rejectClose) reject("The selection Dialog was closed without a choice being made");
                        else resolve(null);
                    }
                },
                options
            );
            dialog.render(true);
        });
    }
}
