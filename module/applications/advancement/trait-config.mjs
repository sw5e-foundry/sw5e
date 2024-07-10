import AdvancementConfig from "./advancement-config.mjs";
import * as Trait from "../../documents/actor/trait.mjs";
import { filteredKeys } from "../../utils.mjs";

/**
 * Configuration application for traits.
 */
export default class TraitConfig extends AdvancementConfig {
  constructor( ...args ) {
    super( ...args );
    this.selected = ( this.config.choices.length && !this.config.grants.size ) ? 0 : -1;
    this.trait = this.types.first() ?? "skills";
  }

  /* -------------------------------------------- */

  /**
   * Shortcut to the configuration data on the advancement.
   * @type {object}
   */
  get config() {
    return this.advancement.configuration;
  }

  /* -------------------------------------------- */

  /**
   * Index of the selected configuration, `-1` means `grants` array, any other number is equal
   * to an index in `choices` array.
   * @type {number}
   */
  selected;

  /* -------------------------------------------- */

  /**
   * Trait type to display in the selector interface.
   * @type {string}
   */
  trait;

  /* -------------------------------------------- */

  /**
   * List of trait types for the current selected configuration.
   * @type {Set<string>}
   */
  get types() {
    const pool = this.selected === -1 ? this.config.grants : this.config.choices[this.selected].pool;
    return this.advancement.representedTraits( [pool] );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      classes: ["sw5e", "advancement", "traits", "two-column"],
      template: "systems/sw5e/templates/advancement/trait-config.hbs",
      width: 640
    } );
  }

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData() {
    const context = super.getData();

    context.grants = {
      label: Trait.localizedList( { grants: this.config.grants } ) || "—",
      data: this.config.grants,
      selected: this.selected === -1
    };
    context.choices = this.config.choices.map( ( choice, index ) => ( {
      label: Trait.choiceLabel( choice, { only: true } ).capitalize() || "—",
      data: choice,
      selected: this.selected === index
    } ) );
    const chosen = ( this.selected === -1 ) ? context.grants.data : context.choices[this.selected].data.pool;
    context.count = context.choices[this.selected]?.data.count;
    context.selectedIndex = this.selected;

    context.validTraitTypes = Object.entries( CONFIG.SW5E.traits ).reduce( ( obj, [key, config] ) => {
      if ( ( this.config.mode === "default" ) || config.expertise ) obj[key] = config.labels.title;
      return obj;
    }, {} );

    const rep = this.advancement.representedTraits();
    const traitConfig = rep.size === 1 ? CONFIG.SW5E.traits[rep.first()] : null;
    if ( traitConfig ) {
      context.default.title = traitConfig.labels.title;
      context.default.icon = traitConfig.icon;
    } else {
      context.default.title = game.i18n.localize( "SW5E.TraitGenericPlural.other" );
      context.default.icon = this.advancement.constructor.metadata.icon;
    }
    context.default.hint = Trait.localizedList( { grants: this.config.grants, choices: this.config.choices } );

    context.choiceOptions = await Trait.choices( this.trait, { chosen, prefixed: true, any: this.selected !== -1 } );
    context.selectedTraitHeader = `${CONFIG.SW5E.traits[this.trait].labels.localization}.other`;
    context.selectedTrait = this.trait;

    return context;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners( html ) {
    super.activateListeners( html );

    this.form.querySelectorAll( "[data-action]" ).forEach( a => a.addEventListener( "click", this._onAction.bind( this ) ) );

    // Handle selecting & disabling category children when a category is selected
    for ( const checkbox of html[0].querySelectorAll( ".trait-selector input:checked" ) ) {
      const toCheck = checkbox.name.endsWith( "*" )
        ? checkbox.closest( "ol" ).querySelectorAll( `input:not([name="${checkbox.name}"])` )
        : checkbox.closest( "li" ).querySelector( "ol" )?.querySelectorAll( "input" );
      toCheck?.forEach( i => i.checked = i.disabled = true );
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle clicks to the Add and Remove buttons above the list.
   * @param {Event} event  Triggering click.
   */
  async _onAction( event ) {
    event.preventDefault();
    switch ( event.currentTarget.dataset.action ) {
      case "add-choice":
        this.config.choices.push( { count: 1 } );
        this.selected = this.config.choices.length - 1;
        break;

      case "remove-choice":
        const input = event.currentTarget.closest( "li" ).querySelector( "[name='selectedIndex']" );
        const selectedIndex = Number( input.value );
        this.config.choices.splice( selectedIndex, 1 );
        if ( selectedIndex <= this.selected ) this.selected -= 1;
        break;

      default:
        return;
    }

    await this.advancement.update( { configuration: await this.prepareConfigurationUpdate() } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput( event ) {
    // Display new set of trait choices
    if ( event.target.name === "selectedTrait" ) {
      this.trait = event.target.value;
      return this.render();
    }

    // Change selected configuration set
    else if ( event.target.name === "selectedIndex" ) {
      this.selected = Number( event.target.value ?? -1 );
      const types = this.types;
      if ( types.size && !types.has( this.trait ) ) this.trait = types.first();
      return this.render();
    }

    // If mode is changed from default to one of the others, change selected type if current type is not valid
    if ( ( event.target.name === "configuration.mode" )
      && ( event.target.value !== "default" )
      && ( this.config.mode === "default" ) ) {
      const validTraitTypes = filteredKeys( CONFIG.SW5E.traits, c => c.expertise );
      if ( !validTraitTypes.includes( this.trait ) ) this.trait = validTraitTypes[0];
    }

    super._onChangeInput( event );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async prepareConfigurationUpdate( configuration={} ) {
    const choicesCollection = foundry.utils.deepClone( this.config.choices );

    if ( configuration.checked ) {
      const prefix = `${this.trait}:`;
      const filteredSelected = filteredKeys( configuration.checked );

      // Update grants
      if ( this.selected === -1 ) {
        const filteredPrevious = this.config.grants.filter( k => !k.startsWith( prefix ) );
        configuration.grants = [...filteredPrevious, ...filteredSelected];
      }

      // Update current choice pool
      else {
        const current = choicesCollection[this.selected];
        const filteredPrevious = current.pool.filter( k => !k.startsWith( prefix ) );
        current.pool = [...filteredPrevious, ...filteredSelected];
      }
      delete configuration.checked;
    }

    if ( configuration.count ) {
      choicesCollection[this.selected].count = configuration.count;
      delete configuration.count;
    }

    // TODO: Remove when https://github.com/foundryvtt/foundryvtt/issues/7706 is resolved
    choicesCollection.forEach( c => {
      if ( !c.pool ) return;
      c.pool = Array.from( c.pool );
    } );
    configuration.choices = choicesCollection;
    configuration.grants ??= Array.from( this.config.grants );

    // If one of the expertise modes is selected, filter out any traits that are not of a valid type
    if ( ( configuration.mode ?? this.config.mode ) !== "default" ) {
      const validTraitTypes = filteredKeys( CONFIG.SW5E.traits, c => c.expertise );
      configuration.grants = configuration.grants.filter( k => validTraitTypes.some( t => k.startsWith( t ) ) );
      configuration.choices.forEach( c => c.pool = c.pool?.filter( k => validTraitTypes.some( t => k.startsWith( t ) ) ) );
    }

    return configuration;
  }
}
