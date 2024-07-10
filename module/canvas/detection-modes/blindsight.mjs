/**
 * The detection mode for Blindsight.
 */
export class DetectionModeBlindsight extends DetectionMode {
  constructor() {
    super( {
      id: "blindsight",
      label: "SW5E.SenseBlindsight",
      type: DetectionMode.DETECTION_TYPES.OTHER,
      walls: true,
      angle: false
    } );
  }

  /** @override */
  static getDetectionFilter() {
    return this._detectionFilter ??= OutlineOverlayFilter.create( {
      outlineColor: [1, 1, 1, 1],
      knockout: true,
      wave: true
    } );
  }

  /** @override */
  _canDetect( visionSource, target ) {
    // Blindsight can detect anything.
    return true;
  }

  /** @override */
  _testLOS( visionSource, mode, target, test ) {
    const polygonBackend = foundry.utils.isNewerVersion( game.version, 11 )
      ? CONFIG.Canvas.polygonBackends.sight
      : CONFIG.Canvas.losBackend;
    return !polygonBackend.testCollision(
      { x: visionSource.x, y: visionSource.y },
      test.point,
      {
        type: "sight",
        mode: "any",
        source: visionSource,
        // Blindsight is restricted by total cover and therefore cannot see
        // through windows. So we do not want blindsight to see through
        // a window as we get close to it. That's why we ignore thresholds.
        // We make the assumption that all windows are configured as threshold
        // walls. A move-based visibility check would also be an option to check
        // for total cover, but this would have the undesirable side effect that
        // blindsight wouldn't work through fences, portcullises, etc.
        useThreshold: false
      }
    );
  }
}

CONFIG.Canvas.detectionModes.blindsight = new DetectionModeBlindsight();
