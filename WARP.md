# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## About This Project

This is the **SW5e Game System** for Foundry Virtual Tabletop - an unofficial implementation of the Star Wars 5th Edition (SW5e) roleplaying game. This system provides character sheets, game mechanics, dice rolling, and comprehensive compendium content for running SW5e games in Foundry VTT.

**Important**: All development on this FoundryVTT System has been discontinued. The SW5e FoundryVTT Module is being worked on instead. See: https://github.com/sw5e-foundry/sw5e-module

## Prerequisites

- Node.js (>=LTS 18 required for build process)
- npm
- Foundry VTT (minimum v10.303, currently verified up to v11, migrating to v13)

## Common Development Commands

### Initial Setup
```bash
npm install  # Install all dependencies
```

### Build Commands
```bash
npm run build        # Full build (clean + compile everything)
npm run build:clean  # Clear dist directory
npm run build:css    # Compile LESS to CSS only
npm run build:js     # Compile JavaScript only
npm run build:static # Copy static files to dist
npm run build:db     # Compile JSON packs to DB files
npm run build:watch  # Build + watch for changes
```

### Development Workflow
```bash
npm run build:watch  # Recommended for active development - builds and watches for file changes
```

### Code Quality
```bash
npm run lint         # Run ESLint to check code style
npm run lint:fix     # Auto-fix code style issues where possible
```

### Compendium Pack Management
```bash
npm run build:db                        # Compile all JSON to DB files
gulp compilePacks --pack classes        # Compile specific pack only
npm run build:json                      # Extract DB files to JSON (debug only)
gulp extractPacks --pack classes        # Extract specific pack
npm run build:cleanJson                 # Clean and format JSON files
gulp cleanPacks --pack classes          # Clean specific pack
```

## Architecture Overview

This Foundry VTT system follows a modular architecture based on the D&D 5e system structure:

### Core Structure

- **`sw5e.mjs`**: Main entry point - initializes the system, registers configurations, and sets up Foundry VTT integration
- **`module/`**: Core JavaScript modules organized by functionality
- **`static/`**: Static assets that don't require compilation (images, fonts, templates, JSON files)
- **`less/`**: LESS/CSS source files (compiled to CSS)
- **`packs/`**: Compendium content as JSON files (compiled to .db files)
- **`dist/`**: Compiled output directory (generated, not committed to git)

### Module Architecture

The `module/` directory contains:
- **`applications/`**: UI components (actor sheets, item sheets, dialogs, etc.)
- **`canvas/`**: Canvas-related functionality (tokens, measurements)
- **`data/`**: Data models for actors, items, and journal entries
- **`dice/`**: Custom dice rolling implementations (D20Roll, DamageRoll, etc.)
- **`documents/`**: Document classes (Actor5e, Item5e, etc.)

### Key Configuration Files

- **`static/system.json`**: System manifest - defines the system metadata, compatibility, and pack structure
- **`static/template.json`**: Data templates for actors and items - defines the data structure
- **`module/config.mjs`**: System configuration constants and settings

### Build Process

Uses Gulp for build automation:
1. **CSS Compilation**: LESS files → CSS files
2. **JavaScript Bundling**: Module files → minified JavaScript
3. **Static Copy**: Static assets → dist directory
4. **Pack Compilation**: JSON files → NeDB database files

### Compatibility Layer

The system maintains compatibility with D&D 5e modules by:
- Providing `globalThis.dnd5e = globalThis.sw5e` namespace mapping
- Aliasing configuration objects (e.g., `CONFIG.DND5E = CONFIG.SW5E`)
- Converting power-related config to spell equivalents for module compatibility

### Actor and Item Types

**Actor Types**: character, npc, starship, vehicle, group
**Item Types**: weapon, equipment, consumable, tool, loot, class, power (spell equivalent), feat, species, backpack, archetype, classfeature, background, fightingmastery, fightingstyle, lightsaberform, deployment, starship components, modifications

### Data Models

Uses Foundry's data model system with custom implementations for:
- Character progression and abilities
- Star Wars-specific mechanics (Force/Tech points, lightsaber combat)
- Starship systems and combat
- Enhanced items and modifications

## Development Notes

- **Module Compatibility**: System provides D&D 5e compatibility layer for third-party modules
- **Migration System**: Includes data migration system for version updates
- **Localization**: Supports Babele for translations (translations managed separately)
- **Content Source**: All content must come from the official SW5e website (https://sw5e.com/)
- **Code Style**: Uses ESLint configuration - all warnings should be resolved before PR submission
- **Node Version**: Requires Node.js LTS 18+ for build tools to work properly

## Repository Structure Notes

- **No compiled files in git**: CSS, minified JS, and compiled DB files are generated during build
- **JSON-based compendia**: Compendium content stored as JSON for easier contribution and review
- **Static assets separate**: Images, fonts, templates stored in `static/` directory
- **Module-based organization**: JavaScript organized in logical modules under `module/`

## Release Process

- **Automatic releases**: GitHub Actions builds and releases when merged to `master`
- **Beta releases**: Available when merged to `beta` branch
- **Manual build**: Use `gulp buildall --dist` for manual building

## FoundryVTT v13 Migration

**Current Status**: System is compatible with FoundryVTT v11, needs migration to v13.

**Key Areas for Migration**:
- Update `static/system.json` compatibility version from v11 to v13
- Review and update data model implementations for v13 changes
- Test and update JavaScript API usage for any v13 breaking changes
- Verify CSS/styling compatibility with v13 UI changes
- Update dependencies and build process if needed
- Test compendium pack compatibility

**Migration Resources**:
- FoundryVTT API documentation and migration guides
- FoundryVTT API Guide (GamerFlix): https://github.com/GamerFlix/foundryvtt-api-guide
- Official FoundryVTT changelog for breaking changes between v11 and v13
- Community migration examples and best practices

## DnD5e Parity Notes

This system intentionally mirrors the DnD5e codebase structure where practical:
- Directory layout: module/{applications, canvas, data, dice, documents} matches DnD5e
- UI overrides: SW5e provides custom combat and compendium sidebar classes; no custom ChatLog or ItemDirectory at present
- Token/Canvas: SW5e includes a custom Token class and diagonal measurement override; no custom TokenRuler or TokenLayer class detected
- Dice: SW5e wires custom dice (D20, Damage, Attrib) similarly to DnD5e’s approach
- Sheets: Registers Actor/Item sheets and a JournalEntryPage sheet; broader DnD5e registrations (JournalEntry, RegionBehavior, TokenConfig) are only appropriate if/when SW5e provides the corresponding classes

When updating, prefer the patterns used by DnD5e 5.1.x (Foundry v13) unless SW5e-specific mechanics require deviation.

## Compendium packs (YAML sources)

- Location: source files live under `packs/_source/<pack-name>/**/*.yml`. The compiled packs are written to `dist/packs/packs/*.db` and referenced by `static/system.json`.
- Editing: create or edit `.yml` files in the appropriate `packs/_source/<pack-name>` folder. Organize entries with meaningful subfolders (e.g., by item type/subtype, power level, creature type). File names should be slugified (lowercase, hyphens).
- Commands:
  - Clean YAML (normalize metadata/flags): `npm run build:cleanSource`
  - Compile YAML to packs (LevelDB or NeDB based on flags): `npm run build:db`
  - Extract from compiled packs back to YAML sources: `npm run build:source`
  - One-time migration from legacy JSON (if ever needed): `npm run packs:migrate:yaml`

Notes:
- Do not edit compiled DBs in `dist/`. Make changes in `packs/_source` and recompile.
- Optional selective operations (example):
  - Compile only a specific pack: `npm run build:db -- --pack classes`
  - Extract only a specific pack or entry: `npm run build:source -- --pack classes --name Barbarian`

## Important Files for AI Agents

- **`gulpfile.js`**: Build system configuration and task definitions
- **`module/config.mjs`**: Core system configuration and constants
- **`sw5e.mjs`**: System initialization and Foundry integration
- **`static/system.json`**: System manifest and metadata
- **`static/template.json`**: Data structure definitions
