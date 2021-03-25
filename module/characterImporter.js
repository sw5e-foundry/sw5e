export default class CharacterImporter {
  // transform JSON from sw5e.com to Foundry friendly format
  // and insert new actor
  static async transform(rawCharacter) {
    const sourceCharacter = JSON.parse(rawCharacter); //source character

    const details = {
      species: sourceCharacter.attribs.find((e) => e.name == "race").current,
      background: sourceCharacter.attribs.find((e) => e.name == "background").current,
      alignment: sourceCharacter.attribs.find((e) => e.name == "alignment").current
    };

    const hp = {
      value: sourceCharacter.attribs.find((e) => e.name == "hp").current,
      min: 0,
      max: sourceCharacter.attribs.find((e) => e.name == "hp").current,
      temp: sourceCharacter.attribs.find((e) => e.name == "hp_temp").current
    };

    const ac = {
      value: sourceCharacter.attribs.find((e) => e.name == "ac").current
    };

    const abilities = {
      str: {
        value: sourceCharacter.attribs.find((e) => e.name == "strength").current,
        proficient: sourceCharacter.attribs.find((e) => e.name == "strength_save_prof").current ? 1 : 0
      },
      dex: {
        value: sourceCharacter.attribs.find((e) => e.name == "dexterity").current,
        proficient: sourceCharacter.attribs.find((e) => e.name == "dexterity_save_prof").current ? 1 : 0
      },
      con: {
        value: sourceCharacter.attribs.find((e) => e.name == "constitution").current,
        proficient: sourceCharacter.attribs.find((e) => e.name == "constitution_save_prof").current ? 1 : 0
      },
      int: {
        value: sourceCharacter.attribs.find((e) => e.name == "intelligence").current,
        proficient: sourceCharacter.attribs.find((e) => e.name == "intelligence_save_prof").current ? 1 : 0
      },
      wis: {
        value: sourceCharacter.attribs.find((e) => e.name == "wisdom").current,
        proficient: sourceCharacter.attribs.find((e) => e.name == "wisdom_save_prof").current ? 1 : 0
      },
      cha: {
        value: sourceCharacter.attribs.find((e) => e.name == "charisma").current,
        proficient: sourceCharacter.attribs.find((e) => e.name == "charisma_save_prof").current ? 1 : 0
      }
    };

    const targetCharacter = {
      name: sourceCharacter.name,
      type: "character",
      data: {
        abilities: abilities,
        details: details,
        attributes: {
          ac: ac,
          hp: hp
        }
      }
    };

    let actor = await Actor.create(targetCharacter);

    const profession = sourceCharacter.attribs.find((e) => e.name == "class").current;
    let professionLevel = sourceCharacter.attribs.find((e) => e.name == "class_display").current;
    professionLevel = parseInt(professionLevel.replace(/[^0-9]/g, "")); //remove a-z, leaving only integers
    this.addClasses(profession, professionLevel, actor);

    this.addSpecies(sourceCharacter.attribs.find((e) => e.name == "race").current, actor);
  }

  static async addClasses(profession, level, actor) {
    let classes = await game.packs.get("sw5e.classes").getContent();
    let assignedClass = classes.find((c) => c.name === profession);
    assignedClass.data.data.levels = level;
    await actor.createEmbeddedEntity("OwnedItem", assignedClass.data, { displaySheet: false });
  }

  static async addSpecies(race, actor) {
    let species = await game.packs.get("sw5e.species").getContent();
    let assignedSpecies = species.find((c) => c.name === race);

    await actor.createEmbeddedEntity("OwnedItem", assignedSpecies.data, { displaySheet: false });
  }

  static addImportButton(html) {
    const header = $("#actors").find("header.directory-header");
    const search = $("#actors").children().find("div.header-search");
    const newImportButtonDiv = $("#actors").children().find("div.header-actions").clone();
    const newSearch = search.clone();
    search.remove();
    newImportButtonDiv.attr("id", "character-sheet-import");
    header.append(newImportButtonDiv);
    newImportButtonDiv.children("button").remove();
    newImportButtonDiv.append(
      "<button class='create-entity' id='cs-import-button'><i class='fas fa-upload'></i> Import Character</button>"
    );
    newSearch.appendTo(header);

    let characterImportButton = $("#cs-import-button");
    characterImportButton.click((ev) => {
      let content =
        "<h1>Saved Character JSON Import</h1> " +
        '<label for="character-json">Paste character JSON here:</label> ' +
        "</br>" +
        '<textarea id="character-json" name="character-json" rows="10" cols="50"></textarea>';
      let importDialog = new Dialog({
        title: "Import Character from SW5e.com",
        content: content,
        buttons: {
          Import: {
            icon: '<i class="fas fa-file-import"></i>',
            label: "Import Character",
            callback: (e) => {
              let characterData = $("#character-json").val();
              console.log("Parsing Character JSON");
              CharacterImporter.transform(characterData);
            }
          },
          Cancel: {
            icon: '<i class="fas fa-times-circle"></i>',
            label: "Cancel",
            callback: () => {}
          }
        }
      });
      importDialog.render(true);
    });
  }
}
