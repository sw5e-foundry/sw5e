# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added configuration to toggle consumption of ammo by NPCs.
- Item reload ui on NPC sheet.
- More Feat subtypes.
- Added 'spell' equivalent of 'power' attributes in CONFIG, for module compatibility.
- Species DataModel.

### Changes

- Updated compendiums with website data.

### Fixed

- Broken character item preparation.
- Superiority data not available in rollData.
- Not being able to add modifications to chassis.
- NPC Hit Point config not openning.
- 'Led by the force' initiative bonus now correctly rounds up.

## [2.1.4.2.4.0] - 2022-03-07

### Added

- Added CHANGELOG.MD file.
- Added an ui to configure the following traits, with an override and bonuses per level and overall:
  - Force/Tech Points
  - Superiority Dice
  - Hull/Shield Points
- Added advancements to starships to automatically calculate hull and shield points.

### Changed

- Updated core to match [dnd5e 2.1.5](https://github.com/foundryvtt/dnd5e/releases/tag/release-2.1.5).
- The following item types were merged into `feat` as subcategories: `deploymentfeature`, `classfeature`, `fightingmastery`, `fightingstyle`, `lightsaberform`, `starshipaction`, `starshipfeature`, `venture`.
- Starship Movement Calculations updated. To use the old rules, turn on `Old Starship Movement` configuration.
- Drake's Shipyard and the other Starship Compendiums updated with the new reload system.
- Moved weapon 'reload' on the actor's inventory to the context menu.

### Fixed

- Select based special traits not providing options.
- 'Add to Favourites' button not appearing.
- Weapons that don't have an attack roll (burst and rapid properties) now correctly consume ammo.
- NPC Sheets not working from compendium.
- Item descriptions not being editable.
