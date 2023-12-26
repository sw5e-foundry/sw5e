import ActorSheet5e from "./base-sheet.mjs";
import AdvancementConfirmationDialog from "../advancement/advancement-confirmation-dialog.mjs";
import AdvancementManager from "../advancement/advancement-manager.mjs";

/**
 * An Actor sheet for NPC type characters in the SW5E system.
 */
export default class ActorSheet5eNPC extends ActorSheet5e {
  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited) return "systems/sw5e/templates/actors/newActor/limited-sheet.hbs";
    return "systems/sw5e/templates/actors/newActor/npc-sheet.hbs";
  }

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e", "sheet", "actor", "npc"],
      width: 800,
      tabs: [
        {
          navSelector: ".root-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes"
        }
      ]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  static unsupportedItemTypes = new Set([
    "background",
    "class",
    "archetype",
    "species",
    "starshipsize",
    "starshipmod"
  ]);

  /* -------------------------------------------- */
  /*  Context Preparation                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData(options) {
    const context = await super.getData(options);

    // Challenge Rating
    const cr = parseFloat(context.system.details.cr ?? 0);
    const crLabels = { 0: "0", 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" };

    return foundry.utils.mergeObject(context, {
      labels: {
        cr: cr >= 1 ? String(cr) : crLabels[cr] ?? 1,
        type: context.system.details.type.label,
        armorType: this.getArmorLabel()
      }
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(context) {
    // Categorize Items as Features and Powers
    const features = {
      weapons: {
        label: game.i18n.localize("SW5E.AttackPl"),
        items: [],
        hasActions: true,
        required: true,
        dataset: { type: "weapon", "weapon-type": "natural" }
      },
      actions: {
        label: game.i18n.localize("SW5E.ActionPl"),
        items: [],
        hasActions: true,
        required: true,
        dataset: { type: "feat", featureType: "monster", "activation.type": "action" }
      },
      passive: { label: game.i18n.localize("SW5E.Features"), items: [], required: true, dataset: { type: "feat", featureType: "monster" } },
      equipment: { label: game.i18n.localize("SW5E.Inventory"), items: [], required: true, dataset: { type: "loot" } }
    };
    const ssfeatures = {
      deployments: {
        label: "ITEM.TypeDeploymentPl",
        items: [],
        hasActions: false,
        dataset: { type: "deployment" }
      },
      deploymentfeatures: {
        label: "SW5E.Feature.Deployment",
        items: [],
        hasActions: true,
        dataset: { type: "feat", featType: "deploymentFeature" }
      },
      ventures: {
        label: "SW5E.DeploymentFeature.Venture",
        items: [],
        hasActions: false,
        dataset: { type: "feat", featType: "deploymentFeature", featSubType: "venture" }
      }
    };

    // Start by classifying items into groups for rendering
    let {forcepowers, techpowers, deployments, deploymentfeatures, ventures, other} = context.items.reduce(
      (obj, item) => {
        const { quantity, uses, recharge, target } = item.system;

        // Item details
        const ctx = context.itemContext[item.id] ??= {};
        ctx.isStack = Number.isNumeric(quantity) && (quantity !== 1);
        ctx.id = item.id;

        // Prepare data needed to display expanded sections
        ctx.isExpanded = this._expanded.has(item.id);

        // Item usage
        ctx.hasUses = uses && (uses.max > 0);
        ctx.isOnCooldown = recharge && !!recharge.value && (recharge.charged === false);
        ctx.isDepleted = item.isOnCooldown && (uses.per && (uses.value > 0));
        ctx.hasTarget = !!target && !(["none", ""].includes(target.type));

        // Item toggle state
        ctx.canToggle = false;

        // Item Weight
        if ("weight" in item.system) ctx.totalWeight = ((item.system.quantity ?? 1) * item.system.weight).toNearest(0.1);

        // Item properties
        ctx.propertiesList = item.propertiesList;
        ctx.isStarshipItem = item.isStarshipItem;
        item.sheet._getWeaponReloadProperties(ctx);

        // Categorize the item
        if (item.type === "power" && ["lgt", "drk", "uni"].includes(item.system.school)) obj.forcepowers.push(item);
        else if (item.type === "power" && ["tec"].includes(item.system.school)) obj.techpowers.push(item);
        else if (item.type === "deployment") obj.deployments.push(item);
        else if (item.type === "feat") {
          if (item.system.type.value === "deployment") {
            if (item.system.type.subtype === "venture") obj.ventures.push(item);
            else obj.deploymentfeatures.push(item);
          }
          else obj.other.push(item);
        }
        else obj.other.push(item);
        return obj;
      },
      {
        forcepowers: [],
        techpowers: [],
        deployments: [],
        deploymentfeatures: [],
        ventures: [],
        other: []
      }
    );

    // Apply item filters
    forcepowers = this._filterItems(forcepowers, this._filters.forcePowerbook);
    techpowers = this._filterItems(techpowers, this._filters.techPowerbook);
    deploymentfeatures = this._filterItems(deploymentfeatures, this._filters.ssfeatures);
    ventures = this._filterItems(ventures, this._filters.ssfeatures);
    other = this._filterItems(other, this._filters.features);

    // Organize Powerbook
    const forcePowerbook = this._preparePowerbook(context, forcepowers, "uni");
    const techPowerbook = this._preparePowerbook(context, techpowers, "tec");

    // Organize Features
    for (let item of other) {
      if (item.type === "weapon") features.weapons.items.push(item);
      else if (item.type === "feat") {
        if (item.system.activation.type) features.actions.items.push(item);
        else features.passive.items.push(item);
      } else features.equipment.items.push(item);
    }

    // Organize Starship Features
    deployments.sort((a, b) => b.system.rank - a.system.rank);
    const maxRankDelta = CONFIG.SW5E.maxRank - this.actor.system.details.ranks;
    deployments = deployments.reduce((arr, dep) => {
      const ctx = (context.itemContext[dep.id] ??= {});
      ctx.availableRanks = Array.fromRange(CONFIG.SW5E.maxIndividualRank + 1)
        .slice(1)
        .map(rank => {
          const delta = rank - dep.system.rank;
          return { rank, delta, disabled: delta > maxRankDelta };
        });
      arr.push(dep);
      return arr;
    }, []);

    ssfeatures.deployments.items = deployments;
    ssfeatures.deploymentfeatures.items = deploymentfeatures;
    ssfeatures.ventures.items = ventures;

    // Assign and return
    context.inventoryFilters = true;
    context.features = Object.values(features);
    context.forcePowerbook = forcePowerbook;
    context.techPowerbook = techPowerbook;
    context.ssfeatures = Object.values(ssfeatures);
  }

  /* -------------------------------------------- */

  /**
   * Format NPC armor information into a localized string.
   * @returns {string}  Formatted armor label.
   */
  getArmorLabel() {
    const ac = this.actor.system.attributes.ac;
    const label = [];
    if (ac.calc === "default") label.push(this.actor.armor?.name || game.i18n.localize("SW5E.ArmorClassUnarmored"));
    else label.push(game.i18n.localize(CONFIG.SW5E.armorClasses[ac.calc].label));
    if (this.actor.shield) label.push(this.actor.shield.name);
    return label.filterJoin(", ");
  }

  /* -------------------------------------------- */
  /*  Object Updates                              */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _updateObject(event, formData) {
    // Format NPC Challenge Rating
    const crs = { "1/8": 0.125, "1/4": 0.25, "1/2": 0.5 };
    let crv = "system.details.cr";
    let cr = formData[crv];
    cr = crs[cr] || parseFloat(cr);
    if (cr) formData[crv] = cr < 1 ? cr : parseInt(cr);

    // Parent ActorSheet update steps
    return super._updateObject(event, formData);
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find(".level-selector").change(this._onLevelChange.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Respond to a new level being selected from the level selector.
   * @param {Event} event                           The originating change.
   * @returns {Promise<AdvancementManager|Item5e>}  Manager if advancements needed, otherwise updated item.
   * @private
   */
  async _onLevelChange(event) {
    event.preventDefault();

    const delta = Number(event.target.value);
    const itemId = event.target.closest(".item")?.dataset.itemId;
    if (!delta || !itemId) return;
    const item = this.actor.items.get(itemId);

    let attr = null;
    if (item.type === "deployment") attr = "rank";
    if (!attr) return ui.error(`Unexpected item.type '${item.type}'`);

    if (!game.settings.get("sw5e", "disableAdvancements")) {
      const manager = AdvancementManager.forLevelChange(this.actor, itemId, delta);
      if (manager.steps.length) {
        if (delta > 0) return manager.render(true);
        try {
          const shouldRemoveAdvancements = await AdvancementConfirmationDialog.forLevelDown(item);
          if (shouldRemoveAdvancements) return manager.render(true);
        } catch(err) {
          return;
        }
      }
    }
    return item.update({ [`system.${attr}`]: item.system[attr] + delta });
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDropItemCreate(itemData) {
    // Increment the number of deployment ranks of a character instead of creating a new item
    if (itemData.type === "deployment") {
      const rnk = this.actor.itemTypes.deployment.find(c => c.name === itemData.name)?.system?.rank ?? 999;
      if (rnk < 5) return rnk.update({ "system.rank": rnk + 1 });
    }

    // Create the owned item as normal
    return super._onDropItemCreate(itemData);
  }
}
