# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changes

- The starship actions compendium has been updated to match the website. (Credits to GreyCouncil#8804).
- Backdrop Icons were moved to `packs/Icons/ItemBackdrop`.
- Some items that were previously loot (rations, spikes) have been made consumables.
- Some items that were previously equipment (life support except suits, respirators and rations) have been made loot.

### Fixed

- The popup when deleting items from a PC sheet no longer refers to the item as 'undefined'.
- The popup when deleting crew from a Starship sheet no longer refers to the actor as 'undefined'.
- Old archetypes should no longer have model validation issues.
- Deployment description is once again visible and editable.
- Character description is once again editable.
- Starships can once again be created on fresh worlds.
- Starship repair should once again work.
- The character sheet can once again be openned if you have a mismatched archetype.
- Feats can once again be created on fresh worlds.
- The website character importer now properly triggers all advancements.
- Modifications can once again modify boolean properties.
- Deprecated item types no longer show up to be created.

## [v2.1.5.2.4.4]

### Added

- Item Icons now have their background automatically updated to match their rarity.

## [v2.1.5.2.4.3]

### Fixed

- Starship repairs not working.
- Archetype casting not working.
- Most NPCs in the compendium should now have their Damage Resistances, Immunities and Languages in the proper fields, instead of 'Custom'.

## [v2.1.5.2.4.2]

### Added

- Species DataModel.

### Changes

- Updated compendiums with website data.

### Fixed

- Not being able to add modifications to chassis.
- NPC Hit Point config not openning.
- 'Led by the force' initiative bonus now correctly rounds up.
- Not being able to remove deployed actors, or change who is deployed as pilot.
- Starship recharge not reseting shield.
- Compendiums disappearing when any actor was deployed.
- Broken Feature Links.
- 'Item uses' resource consumption fix.

## [v2.1.4.2.4.1] - 2023-03-20

### Added

- Added configuration to toggle consumption of ammo by NPCs.
- Item reload ui on NPC sheet.
- More Feat subtypes.
- Added 'spell' equivalent of 'power' attributes in CONFIG, for module compatibility.

### Fixed

- Broken character item preparation.
- Superiority data not available in rollData.

## [2.1.5.2.4.0] - 2022-03-07

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
