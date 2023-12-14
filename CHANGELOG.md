# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Starship weapon firing arcs.
- When hovering over a weapon with a firing arc, a template will be rendered in the canvas, representing that fire arc.
- Starship Modification DataModel.
- Starship tokens can now track passive skill values, power dice, and fuel amount.
- (Dis)Advantage flags for starship skills.
- Enrichment lookup (`[[/skill skillName]]`) for starship skills.

### Changes

- Starship features compendium now has all the starship roles.
- Starship modifications compendium has been updated to match the website.

### Fixed

- Starship migration should once again work.
- Weapons should once again consume ammunition.
- Weapon properties should now longer be weirdly spaced out vertically.
- Character's bigraphy and description should no longer be invisible.
- Modifying a weapon's reload value in the character sheet should once again work.
- Supreme Accuracy/Aptitude/Durability should once again work.
- Starship speed units should be displayed correctly.
- NPC Powerbooks should now create items properly.
- NPC Powerbooks should now only the display the 'no powerlevel' message if the npc really has no powerlevel.
- Quantity of starship modifiations will be used for the modifications counter.
- Deployments and their features should now work properly on the NPC sheet.
- Uses for starship modifications should now appear in the inventory.
- "Apply damage with resistances" context button should once again work.

## [2.4.0.2.7.0] - 2033-11-30

### Added

- (Dis)advantage flags on saves against specific damage types.

### Changes

- Updated core to match [dnd5e 2.4.0](https://github.com/foundryvtt/dnd5e/releases/tag/release-2.4.0).
- Resource Consumption dialog when casting a power now hides # of slots you have 1000 of.
- Resource Consumption dialog when casting a power now displays a warning if you don't have enough power points.
- Resource Consumption dialog when casting a power now has a toggle on wheter to spend power points.
- Casting a power no longer spends 'slots' you have 1000 of.

### Fixed

- SW5E specific (dis)advantage flags should now work properly with midi-qol.
- Fixed Old NPC sheet not working on actors with damage resistance bypasses.

### Removed

- Character flag `sonicSensitivity`.

## [2.3.1.2.6.5] - 2023-11-15

### Added

- Weapon classes (`carbine`, `polearm`, `sidearm`...).
- Compendium Browser 'Classification' tab.
- Mastery, High Mastery, and Grand Mastery proficiency will now set the default roll mode and add the additional rolls when appropriate.
- Character flags `dangerSense`, `halflingLucky`, `sonicSensitivity`, `twoLivered`.
- Various advantage and disadvantage character flags, similar to midi-qol. For a full list type `CONFIG.SW5E.midiFlags` in the console.
- When the system grants (dis)advantage on a roll, a tooltip will mention where it is coming from.
- Active Effects on most class features.

### Changes

- Art updates.
- Compendium updates.
- All feats should now have proper active effects. (Thanks to `Florenc#5173`)
- All species should now have their ability score improvements granted by advancements instead of active effects.
- Character flags that grant advantage on saving throws against force/tech powers should now work.
- `Free Power` renamed to `Ignores Powers Known`.

### Fixed

- Rolling power die in Starship Sheet should once again work.
- Errors about reading JSON during migration.
- When making a roll with `Advantage` or `Disadvantage` as the default, the button should now have the proper color.

### Removed

- The following character flags, which had no effect: `agressive`, `amphibious`, `armorIntegration`, `businessSavy`, `canibalize`, `crudeWeaponSpecialist`, `defiant`, `detailOriented`, `enthrallingPheromones`, `foreignBiology`, `furyOfTheSmall`, `grovelCowerAndBeg`, `heatAdaptation`, `inscrutable`, `keenSenses`, `longLimbed`, `maintanenceMode`, `maskOfTheWild`, `multipleHearts`, `naturallyStealthy`, `nimbleAgility`, `nibleEscape`, `nimbleness`, `precognition`, `programmer`, `rapidReconstruction`, `rapidlyRegenerative`, `regenerative`, `savageAttacks`, `shapechanger`, `strongLegged`, `sunlightSensitivity`, `tinker`, `toughness`, `trance`, `unarmedCombatant`, `unsettlingVisage`.

## [2.3.1.2.6.4] - 2023-10-16

### Changes

- Art updates.

### Fixed

- Old NPCs armor class will be properly migrated.
- Class overview journal should once again work.
- Clothing equipment should now have the proper artwork.
- Website Importer should once again work.
- Currency should no longer be reset after any update.
- JournalEntry migration should once again work.

## [2.3.1.2.6.3] - 2023-10-04

### Added

- #748 'Powercasting Checkbox- "Does not count against powers known"'.
- Compendium Folders.
- Bolstering and Surging properties on equipped focuses now properly add force/tech points.
- Compendium Browser 'Powers', 'Maneuvers', and 'Features' tabs.

### Changes

- Split the 'Favorites and Notes' subtab of the 'Core' tab.
- Notes have been merged into a single note, with proper editor support.
- Updated Compendium Browser to match [pf2e 2.4.4](https://github.com/foundryvtt/pf2e/releases/tag/5.4.4).

### Fixed

- Force/Tech/Superiority points bonuses should now accept non-numeric values, like `@abilities.cha.mod`.
- Skill bonuses on the NPC sheet should be properly aligned.
- #737 'Powercasting Issues'.
- Warning about migration issues related to NPC's CR.
- Compendium browser 'Equipment' tab should now open again.
- Species features no longer have 'None (Species name)' as their requirement.

## [2.3.1.2.6.1] - 2023-09-01

### Added

- "ASI and a Feat" variant rule.

### Changes

- Updated core to match [dnd5e 2.3.1](https://github.com/foundryvtt/dnd5e/releases/tag/release-2.3.1).
- Compendium Updates.
    - Classes now have 'Choose Item' advancements for Invocations and Archetypes.
    - Classes now have 'Ability Score Improvement' advancements.
    - Backgrounds now have 'Choose Item' advancements for feats.

### Fixed

- #705 'All Starships are displayed as "Medium" regardless of Stats'.
- #707 'Issue with character import'.
- #722 'Item proficiency label not showing correctly on character sheet'.
- #728 'Editing and Rolling Starship Skills throwing errors'.
- #733 'Imported Character Traits (armorProf, languages, weaponProf) showing as [object Set]'.
- Starship shield regen now correctly uses the maximum value instead of rolling.
- NPC sheet now properly displays temp and +max HP.
- 'Power Slot' overrides should now work with active effects. DAE seems to break this.
- 'Deployments' now have a DataModel, and thus should be able to receive advancements.
- 'Buy Item' on the compendium browser should now work properly.

## [2.2.2.2.5.0] - 2023-08-04

### Changes

- Updated core to match [dnd5e 2.2.2](https://github.com/foundryvtt/dnd5e/releases/tag/release-2.2.2).

## [2.1.5.2.4.8] - 2023-07-19

### Fixed

- Icon Backdrops should work correctly on linux.
- Removing a deployed actor should once again work properly.
- Backpacks with no rarity no longer show '&Nbsp;'.
- Website character importer should now have the correct abilities for each skill.
- Website character importer should now work with profiencies like `all martial vibroweapons with the finesse property` (treated as `all martial vibroweapons`).
- Module Art Config button should now work.
- Datamodel issues on starship creation.
- Species characteristics should once again be editable.

### Changes

- Compendium Updates.
- The deployment features compendium has been updated to match the website. (Credits to GreyCouncil#8804).


## [2.1.5.2.4.7] - 2023-06-9

### Fixed

- Migration should now properly work for deprecated item types.

## [2.1.5.2.4.6] - 2023-06-06

### Added

- Trait to decrease the cost casting force/tech powers.
- Support for Supreme Accuracy / Aptitude / Durability traits.
- Trait the multiplies the character's carrying capacity.
- Compendium Browser.

### Changes

- The starship actions, armor, equipment, features, and weapons compendiums have been updated to match the website. (Credits to `GreyCouncil#8804`).
- Backdrop Icons were moved to `packs/Icons/ItemBackdrop`.
- Some items that were previously loot (rations, spikes) have been made consumables.
- Some items that were previously equipment (life support except suits, respirators and rations) have been made loot.
- Innate powers no longer count towards your known powers.
- When opening the powerbooks tab, the selected subtab will be one you have levels or powers known.
- Project Restructure. The entire `sw5e` project has undergone an internal restructuring, more closely matching the `dnd5e` system. As part of this, the system is now provided as a single, rolled-up file to end users. This means that if your module was previously importing individual files or classes from the sw5e system directory, those imports will no longer work. All of the public classes are available on the `sw5e` object, however, and this object should be available to your module code immediately, without any need for hooks.
- All weapon icons have been updated to work with the item rarities backdrop.
- Duplicated icons have been removed, and unused icons have been moved to a 'deprecated' folder and will be removed on a further update.
- Items now show a foreground symbol over their icon when they are made a chassis.

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
- Huge and Gargantuan ships should now have the proper amount of hull and shield dice at higher levels.
- Deployments can once again be ranked up.
- Shield Damage Resistances/Immunities/Vulnerabilities should once again be editable.

## [2.1.5.2.4.5] - 2023-05-02

### Added

- Item Icons now have their background automatically updated to match their rarity.

## [2.1.5.2.4.3] - 2023-04-28

### Fixed

- Starship repairs not working.
- Archetype casting not working.
- Most NPCs in the compendium should now have their Damage Resistances, Immunities and Languages in the proper fields, instead of 'Custom'.

## [2.1.5.2.4.2] - 2023-04-04

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

## [2.1.4.2.4.1] - 2023-03-20

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
