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

    this.addPowers(
      sourceCharacter.attribs.filter((e) => e.name.search(/repeating_power.+_powername/g) != -1).map((e) => e.current),
      actor
    );

    this.addItems(
      sourceCharacter.attribs
        .filter((e) => e.name.search(/repeating_inventory.+_itemname/g) != -1)
        .map((e) => e.current),
      actor
    );
  }

  static async addClasses(profession, level, actor) {
    let classes = await game.packs.get("sw5e.classes").getContent();
    let assignedClass = classes.find((c) => c.name === profession);
    assignedClass.data.data.levels = level;
    await actor.createEmbeddedEntity("OwnedItem", assignedClass.data, { displaySheet: false });
  }

  static async addSpecies(race, actor) {
    const species = await game.packs.get("sw5e.species").getContent();
    const assignedSpecies = species.find((c) => c.name === race);
    const activeEffects = assignedSpecies.data.effects[0].changes;
    const actorData = { data: { ...actor.data.abilities } };

    activeEffects.map((effect) => {
      switch (effect.key) {
        case "data.abilities.str.value":
          actorData.data.abilities.str.value -= effect.value;
          break;

        case "data.abilities.dex.value":
          actorData.data.abilities.dex.value -= effect.value;
          break;

        case "data.abilities.con.value":
          actorData.data.abilities.con.value -= effect.value;
          break;

        case "data.abilities.int.value":
          actorData.data.abilities.int.value -= effect.value;
          break;

        case "data.abilities.wis.value":
          actorData.data.abilities.wis.value -= effect.value;
          break;

        case "data.abilities.cha.value":
          actorData.data.abilities.cha.value -= effect.value;
          break;

        default:
          break;
      }
    });

    actor.update(actorData);

    await actor.createEmbeddedEntity("OwnedItem", assignedSpecies.data, { displaySheet: false });
  }

  static async addPowers(powers, actor) {
    const forcePowers = await game.packs.get("sw5e.forcepowers").getContent();
    const techPowers = await game.packs.get("sw5e.techpowers").getContent();

    for (const power of powers) {
      const forcePower = forcePowers.find((c) => c.name === power);
      const techPower = techPowers.find((c) => c.name === power);

      if (forcePower) {
        await actor.createEmbeddedEntity("OwnedItem", forcePower.data, { displaySheet: false });
      } else if (techPower) {
        await actor.createEmbeddedEntity("OwnedItem", techPower.data, { displaySheet: false });
      }
    }
  }

  static async addItems(items, actor) {
    const weapons = await game.packs.get("sw5e.weapons").getContent();
    const armors = await game.packs.get("sw5e.armor").getContent();
    const adventuringGears = await game.packs.get("sw5e.adventuringgear").getContent();

    for (const item of items) {
      const weapon = weapons.find((c) => c.name.toLowerCase() === item.toLowerCase());
      const armor = armors.find((c) => c.name.toLowerCase() === item.toLowerCase());
      const gear = adventuringGears.find((c) => c.name.toLowerCase() === item.toLowerCase());

      if (weapon) {
        await actor.createEmbeddedEntity("OwnedItem", weapon.data, { displaySheet: false });
      } else if (armor) {
        await actor.createEmbeddedEntity("OwnedItem", armor.data, { displaySheet: false });
      } else if (gear) {
        await actor.createEmbeddedEntity("OwnedItem", gear.data, { displaySheet: false });
      }
    }
  }

  static addImportButton() {
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
    characterImportButton.click(() => {
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
            callback: () => {
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
