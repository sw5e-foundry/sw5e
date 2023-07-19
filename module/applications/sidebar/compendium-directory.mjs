import { CompendiumBrowser } from "../compendium/_module.mjs";

/**
 * An extension of the base CompendiumDirectory class to provide some 5e-specific functionality.
 * @extends {CompendiumDirectory}
 */
export default class CompendiumDirectory5e extends CompendiumDirectory {
  activateListeners(html) {
    super.activateListeners(html);

    const browseButton = CompendiumBrowser.browseButton;
    html.find("footer.directory-footer")?.append(browseButton)
  }
}
