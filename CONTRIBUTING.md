# Contributing to sw5e-foundry/sw5e

Code and content contributions are accepted. Please feel free to submit issues to the issue tracker or submit merge
requests for code/content changes. Approval for such requests involves code and (if necessary) design review by the
Maintainers of this repo. Please reach out on the [SW5e Foundry Dev Discord](https://discord.gg/QMvJG6nHQD) with any 
questions.

Please ensure there is an open issue about whatever contribution you are submitting. Please also ensure your
contribution does not duplicate an existing one.

## Repo structure

This repository is structured slightly differently from a traditional FoundryVTT system like DnD5e:

### Code

With the exception of the entrypoint of the system, `sw5e.mjs`, the Javascript code for this project can be found in the
`module` directory.

### Less/CSS

CSS in this project is handled using [less](https://lesscss.org/), this is an extended version of css with some helpful
features like nesting. The contents of this folder is compiled down into several CSS files. This repository does not 
store the compiled css. 

### Packs

The compendium of this system can be found as separated json files in the `packs` directory. These are compiled into
`.db` files.

The images for each item in the compendium can be found in `static/packs`.

### Static files

Files that do not require any compilation steps, like images, json files, and fonts, are stored in the `static`
directory.

This directory contains the `system.json` and `template.json` files.

## Developer Tooling

This repository is not ready to use out of the box, a mandatory compilation step is required to build and copy the 
required content into the `dist` directory, where the final build is stored.

This repository leverages [gulp](https://gulpjs.com/) to run automated build tasks to compile into a usable system. 
In order to be able to use it, you will need to have [npm](https://www.npmjs.com/) and [nodejs](https://nodejs.org/en) 
installed on your system. Please note that we use some recent node features in our build process so compilation may not
work unless you are on a newer nodejs version (>=LTS 18).

With [npm](https://www.npmjs.com/) and [nodejs](https://nodejs.org/en) setup, you can use the following commands:

### `npm install`

Installs all dependencies needed to run developer tooling scripts.

### `npm run clean' / `gulp clean`

Clears out all the compiled files from the `dist` directory.

### `npm run build` / `gulp buildAll`

Runs all relevant build scripts:

- Converts LESS -> CSS
- Converts JSON -> DB (compendia)
- Minifies javascript
- Copies all required files from the `static` directory into the `dist` directory

### `npm run build:css` / `gulp buildCSS`

Converts the LESS in `./less` to the final css files.

### `npm run build:js` / `gulp buildJS`

Converts the javascript in the repo to the final `sw5e.js` and the dependencies into the final `vendor.js`.

### `npm run build:static` / `gulp copyStatic`

Copies the static files from `static` to the `dist` folder.

### `npm run build:watch` / `gulp`

Runs the all the relevant build scripts (just the same as `build`) then watches for changes to any files in the 
repository, where it will automatically recompile as necessary and update the files in the `dist` directory.

### Compendia as JSON

This repository includes some utilities which allow the Compendia included in the System to be maintained as JSON files.
his makes contributions which include changes to the compendia considerably easier to review.

#### Compiling Packs

Compile the source JSON files into compendium packs. Compiled packs can be found in `dist/packs/packs`

```text
npm run build:db
gulp compilePacks
```

- `gulp compilePacks` - Compile all JSON files into their LevelDB files.
- `gulp compilePacks --pack classes` - Only compile the specified pack.

#### Extracting Packs

Extract the contents of compendium packs in `dist/packs/packs` to JSON files in `packs`.

This is available for debug purposes only, you shouldn't ever need to use this.

```text
npm run build:json
gulp extractPacks
```

- `gulp extractPacks` - Extract all compendium LevelDB files into JSON files.
- `gulp extractPacks --pack classes` - Only extract the contents of the specified compendium.
- `gulp extractPacks --pack classes --name Barbarian` - Only extract a single item from the specified compendium.

#### Cleaning Packs

Cleans and formats source JSON files, removing unnecessary permissions and flags and adding the proper spacing.

```text
npm run build:cleanJson
gulp extractPacks
```

- `gulp cleanPacks` - Clean all source JSON files.
- `gulp cleanPacks --pack classes` - Only clean the source files for the specified compendium.
- `gulp cleanPacks --pack classes --name Barbarian` - Only clean a single item from the specified compendium.

## Issues

Check that your Issue isn't a duplicate (also check the closed issues, as sometimes work which has not been released
closes an issue).
Issues which are assigned to a Milestone are considered "Prioritized." This assignment is not permanent and issues might
be pushed out of milestones if the milestone is approaching a releaseable state without that work being done.

### Bugs

- Ensure that the bug is reproducible with no modules active. If the bug only happens when a module is active, report it
  to the module's author instead.
- Provide hosting details as they might be relevant.
- Provide clear step-by-step reproduction instructions, as well as what you expected to happen during those steps vs
  what actually happened.

### Feature Requests

Any feature request should be considered from the lens of "Does this belong in the core system?"

- Do the Rules as Written (RAW) support this feature? If so, provide some examples.
- Is the missing feature in the System Reference Document? If not, it might still be supportable, but it is worth
  mentioning in the request.
- Does this feature help a GM run a Star Wars fifth edition game in Foundry VTT?

## Content

All Content released with this system must come from the [SW5e website] (https://sw5e.com/).

If there is missing content, please open an issue detailing what is missing.

In general, content contributions will take the shape of fixing typos or bugs in the configuration of the existing items
in the included compendia JSON files, which are then compiled into the appropriate db file.

[//]: # (### Translations)

[//]: # ()
[//]: # (Non-English languages are not contained within the core dnd5e system, but instead they are managed by specialized )

[//]: # ([localization modules]&#40;https://foundryvtt.com/packages/tag/translation&#41;.)

[//]: # ()
[//]: # (Instead of opening an PR with translation files, create one of these modules &#40;or contribute to an existing one!&#41;.)

## Code

Here are some guidelines for contributing code to this project.

To contribute code, [fork this project](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and submit a 
[pull request (PR)](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-a-pull-request) 
against the correct development branch.

### Style

Please attempt to follow code style present throughout the project. An ESLint profile is included to help with 
maintaining a consistent code style. All warnings presented by the linter should be resolved before an PR is submitted.

- `gulp lint` or `npm run lint` - Run the linter and display any issues found.
- `gulp lint --fix` or `npm run lint:fix` - Automatically fix any code style issues that can be fixed.

### Linked Issues

Before (or alongside) submitting an PR, we ask that you open a feature request issue. This will let us discuss the 
approach and prioritization of the proposed change.

If you want to work on an existing issue, leave a comment saying you're going to work on the issue so that other
contributors know not to duplicate work. Similarly, if you see an issue is assigned to someone, that member of the
team has made it known they are working on it.

When you open an PR it is recommended to [link it to an open issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue). 
Include which issue it resolves by putting something like this in your description:

```text
Closes #32
```

### Priority of Review

Please appreciate that reviewing contributions constitutes a substantial amount of effort and our resources are limited.
As a result of this, Pull Requests are reviewed with a priority that roughly follows this:

#### High Priority

- Bug Fix
- Small Features related to issues assigned to the current milestone

#### Medium Priority

- Large Features related to issues assigned to the current milestone
- Small Features which are out of scope for the current milestone

#### Not Prioritized

- Large Features which are out of scope for the current milestone

### Pull Request Review Process

PRs have a few phases:

0. **Prioritization.** If the PR relates to the current milestone, it is assigned to that milestone.
1. **Initial Review from the 5e contributor team.** This lets us spread out the review work and catch some of the more 
obvious things that need to be fixed before final review. Generally this talks about code style and some methodology.
2. **Final Review from the Maintainers.** Atropos and Kim have final review and are the only ones with merge permission.

#### PR Size

Please understand that large and sprawling PRs are exceptionally difficult to review. As much as possible, break down
the work for a large feature into smaller steps. Even if multiple PRs are required for a single Issue, this will make it
considerably easier and therefore more likely that your contributions will be reviewed and merged in a timely manner.

## Releases

This repository includes a GitHub Actions configuration which automates the compilation and bundling required for a
release when a commit is made to `master`.

### Process for Release

Releases are automatically created when anything is merged into `master`, therefore the following steps should be taken
to prepare for a release before anything is merged into `master`.

1. [ ] Verify the `NEEDS_MIGRATION_VERSION` is correct.
2. [ ] Verify `CHANGELOG.md` is updated on the development branch being merged into `master` with a new version alongside 
       release notes.
3. [ ] Merge the development branch into `master`
4. [ ] Create an announcement in the SW5e Foundry Dev discord server for the new release

### Process for Beta
Pre-releases are automatically created when anything is merged into `beta`, therefore the following steps should be
taken to prepare for a release before anything is merged into `beta`.

1. [ ] Verify the `NEEDS_MIGRATION_VERSION` is correct.
2. [ ] Verify `CHANGELOG.md` is updated on the development branch being merged into `beta` with the changes under the
   `Unreleased` heading.
3. [ ] Merge the development branch into `beta`
4. [ ] Create an announcement in the SW5e Foundry Dev discord server for the new beta release

### Manually Creating a Release

For documentation’s sake, the process for creating a release manually will be documented here:
1. Build the project using gulp buildall --dist
2. Update the manifest and download entries in the `dist/system.json` file to the latest version number
3. Zip the contents of the `dist` folder in a zipfile named `system.zip`
4. Create a new release with the tag and name set to the latest version number, the description set to the contents of
   the release notes for this version in `CHANGELOG.md`, and attach the newly created `system.zip` and the modified 
   `dist/system.json` file to the release.
