# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.4.2.4.0] - 2022-02-16

### Added

- Added CHANGELOG.MD file
- Added an ui to configure the following traits, with an override and bonuses per level and overall:
  - Force/Tech Points
  - Superiority Dice
  - Hull/Shield Points
- Added advancements to starships to automatically calculate hull and shield points.

### Changed

- Updated core to match [dnd5e 2.1.4](https://github.com/foundryvtt/dnd5e/releases/tag/release-2.1.4)
- The following item types were merged into `feat` as subcategories: `deploymentfeature`, `classfeature`, `fightingmastery`, `fightingstyle`, `lightsaberform`, `starshipaction`, `starshipfeature`, `venture`
- Starship Movement Calculations updated. To use the old rules, turn on `Old Starship Movement` configuration.

### Fixed

- Fixed select based special traits not providing options
- Fixed 'Add to Favourites' button not appearing
