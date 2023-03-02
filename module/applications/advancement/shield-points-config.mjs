import HitPointsConfig from "./hit-points-config.mjs";

/**
 * Configuration application for shield points.
 */
export default class ShieldPointsConfig extends HitPointsConfig {
  /** @inheritdoc */
  getData() {
    return foundry.utils.mergeObject(super.getData(), {
      label: "SW5E.ShieldDie"
    });
  }
}
