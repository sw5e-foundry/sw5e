import HitPointsConfig from "./hit-points-config.mjs";

/**
 * Configuration application for hull points.
 */
export default class HullPointsConfig extends HitPointsConfig {
  /** @inheritdoc */
  getData() {
    return foundry.utils.mergeObject(super.getData(), {
      label: "SW5E.HullDie"
    });
  }
}
