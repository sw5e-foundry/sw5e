/**
 * A simple form to set actor movement speeds
 * @extends {DocumentSheet}
 */
export default class ActorMovementConfig extends DocumentSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sw5e"],
            template: "systems/sw5e/templates/apps/movement-config.html",
            width: 300,
            height: "auto"
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get title() {
        return `${game.i18n.localize("SW5E.MovementConfig")}: ${this.document.name}`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData(options) {
        const sourceMovement = foundry.utils.getProperty(this.document.data._source, "data.attributes.movement") || {};
        const data = {
            movement: foundry.utils.deepClone(sourceMovement),
            units: CONFIG.SW5E.movementUnits
        };
        for (let [k, v] of Object.entries(data.movement)) {
            if (["units", "hover"].includes(k)) continue;
            data.movement[k] = Number.isNumeric(v) ? v.toNearest(0.1) : 0;
        }
        return data;
    }
}
