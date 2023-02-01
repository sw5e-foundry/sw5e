/**
 * A type of Roll specific to an attribute-based recovery roll in the SW5e system.
 * @param {string} formula                  The string formula to parse
 * @param {object} data                     The data object against which to parse attributes within the formula
 * @param {object} [options={}]             Extra optional arguments which describe or modify the AttribDieRoll
 * @param {number} [options.advantageMode]  What advantage modifier to apply to the roll (none, advantage, disadvantage)
 */
export default class AttribDieRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        if (!this.options.configured) this.configureModifiers();
    }

    /* -------------------------------------------- */

    /**
     * Create a D20Roll from a standard Roll instance.
     * @param {Roll} roll
     * @returns {AttribDieRoll}
     */
    static fromRoll(roll) {
        const newRoll = new this(roll.formula, roll.data, roll.options);
        Object.assign(newRoll, roll);
        return newRoll;
    }

    /* -------------------------------------------- */

    /**
     * Advantage mode of an SW5e AttribDieRoll roll
     * @enum {number}
     */
    static ADV_MODE = {
        NORMAL: 0,
        ADVANTAGE: 1,
        DISADVANTAGE: -1
    };

    /* -------------------------------------------- */

    /**
     * The HTML template path used to configure evaluation of this Roll
     * @type {string}
     */
    static EVALUATION_TEMPLATE = "systems/sw5e/templates/chat/roll-dialog.hbs";

    /* -------------------------------------------- */

    /**
     * A convenience reference for whether this AttribDieRoll has advantage
     * @type {boolean}
     */
    get hasAdvantage() {
        return this.options.advantageMode === AttribDieRoll.ADV_MODE.ADVANTAGE;
    }

    /* -------------------------------------------- */

    /**
     * A convenience reference for whether this AttribDieRoll has disadvantage
     * @type {boolean}
     */
    get hasDisadvantage() {
        return this.options.advantageMode === AttribDieRoll.ADV_MODE.DISADVANTAGE;
    }

    /* -------------------------------------------- */
    /*  Attribute Die Roll Methods                            */
    /* -------------------------------------------- */

    /**
     * Apply optional modifiers which customize the behavior of the AttribDieRoll terms
     * @private
     */
    configureModifiers() {
        const die = this.terms[0];
        die.modifiers = [];

        // Handle Advantage or Disadvantage
        if (this.hasAdvantage) {
            die.number = 2;
            die.modifiers.push("kh");
            die.options.advantage = true;
        } else if (this.hasDisadvantage) {
            die.number = 2;
            die.modifiers.push("kl");
            die.options.disadvantage = true;
        } else die.number = 1;

        // Re-compile the underlying formula
        this._formula = this.constructor.getFormula(this.terms);

        // Mark configuration as complete
        this.options.configured = true;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    async toMessage(messageData = {}, options = {}) {
        // Evaluate the roll now so we have the results available
        if (!this._evaluated) await this.evaluate({async: true});

        // Add appropriate advantage mode message flavor and sw5e roll flags
        messageData.flavor = messageData.flavor || this.options.flavor;
        if (this.hasAdvantage) messageData.flavor += ` (${game.i18n.localize("SW5E.Advantage")})`;
        else if (this.hasDisadvantage) messageData.flavor += ` (${game.i18n.localize("SW5E.Disadvantage")})`;

        // Record the preferred rollMode
        options.rollMode = options.rollMode ?? this.options.rollMode;
        return super.toMessage(messageData, options);
    }

    /* -------------------------------------------- */
    /*  Configuration Dialog                        */
    /* -------------------------------------------- */

    /**
     * Create a Dialog prompt used to configure evaluation of an existing AttribDieRoll instance.
     * @param {object} data                     Dialog configuration data
     * @param {string} [data.title]             The title of the shown dialog window
     * @param {number} [data.defaultRollMode]   The roll mode that the roll mode select element should default to
     * @param {number} [data.defaultAction]     The button marked as default
     * @param {boolean} [data.chooseModifier]   Choose which ability modifier should be applied to the roll?
     * @param {string} [data.defaultAbility]    For tool rolls, the default ability modifier applied to the roll
     * @param {string} [data.template]          A custom path to an HTML template to use instead of the default
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<AttibDieRoll|null>}    A resulting AttribDieRoll object constructed with the dialog, or null if the dialog was closed
     */
    async configureDialog(
        {
            title,
            defaultRollMode,
            defaultAction = AttribDieRoll.ADV_MODE.NORMAL,
            chooseModifier = false,
            defaultAbility,
            template
        } = {},
        options = {}
    ) {
        // Render the Dialog inner HTML
        const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
            formula: `${this.formula} + @bonus`,
            defaultRollMode,
            rollModes: CONFIG.Dice.rollModes,
            chooseModifier,
            defaultAbility,
            abilities: CONFIG.SW5E.abilities
        });

        let defaultButton = "normal";
        switch (defaultAction) {
            case AttribDieRoll.ADV_MODE.ADVANTAGE:
                defaultButton = "advantage";
                break;
            case AttribDieRoll.ADV_MODE.DISADVANTAGE:
                defaultButton = "disadvantage";
                break;
        }

        // Create the Dialog window and await submission of the form
        return new Promise((resolve) => {
            new Dialog(
                {
                    title,
                    content,
                    buttons: {
                        advantage: {
                            label: game.i18n.localize("SW5E.Advantage"),
                            callback: (html) => resolve(this._onDialogSubmit(html, AttribDieRoll.ADV_MODE.ADVANTAGE))
                        },
                        normal: {
                            label: game.i18n.localize("SW5E.Normal"),
                            callback: (html) => resolve(this._onDialogSubmit(html, AttribDieRoll.ADV_MODE.NORMAL))
                        },
                        disadvantage: {
                            label: game.i18n.localize("SW5E.Disadvantage"),
                            callback: (html) => resolve(this._onDialogSubmit(html, AttribDieRoll.ADV_MODE.DISADVANTAGE))
                        }
                    },
                    default: defaultButton,
                    close: () => resolve(null)
                },
                options
            ).render(true);
        });
    }

    /* -------------------------------------------- */

    /**
     * Handle submission of the Roll evaluation configuration Dialog
     * @param {jQuery} html            The submitted dialog content
     * @param {number} advantageMode   The chosen advantage mode
     * @returns {AttribDieRoll}        This Attribute Die roll.
     * @private
     */
    _onDialogSubmit(html, advantageMode) {
        const form = html[0].querySelector("form");

        // Append a situational bonus term
        if (form.bonus.value) {
            const bonus = new Roll(form.bonus.value, this.data);
            if (!(bonus.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({operator: "+"}));
            this.terms = this.terms.concat(bonus.terms);
        }

        // Customize the modifier
        if (form.ability?.value) {
            const abl = this.data.abilities[form.ability.value];
            this.terms.findSplice((t) => t.term === "@mod", new NumericTerm({number: abl.mod}));
            this.options.flavor += ` (${CONFIG.SW5E.abilities[form.ability.value]})`;
        }

        // Apply advantage or disadvantage
        this.options.advantageMode = advantageMode;
        this.options.rollMode = form.rollMode.value;
        this.configureModifiers();
        return this;
    }
}
