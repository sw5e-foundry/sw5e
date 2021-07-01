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

    /* ----------------------------------------------------------------- */
    /*  character.data.skills.<skill_name>.value is all that matters
    /*  values can be 0, 0.5, 1 or 2
    /*  0 = regular
    /*  0.5 = half-proficient
    /*  1 = proficient
    /*  2 = expertise
    /*  foundry takes care of calculating the rest
    /* ----------------------------------------------------------------- */
    const skills = {
      acr: {
        value: sourceCharacter.attribs.find((e) => e.name == "acrobatics_type").current
      },
      ani: {
        value: sourceCharacter.attribs.find((e) => e.name == "animal_handling_type").current
      },
      ath: {
        value: sourceCharacter.attribs.find((e) => e.name == "athletics_type").current
      },
      dec: {
        value: sourceCharacter.attribs.find((e) => e.name == "deception_type").current
      },
      ins: {
        value: sourceCharacter.attribs.find((e) => e.name == "insight_type").current
      },
      inv: {
        value: sourceCharacter.attribs.find((e) => e.name == "investigation_type").current
      },
      itm: {
        value: sourceCharacter.attribs.find((e) => e.name == "intimidation_type").current
      },
      lor: {
        value: sourceCharacter.attribs.find((e) => e.name == "lore_type").current
      },
      med: {
        value: sourceCharacter.attribs.find((e) => e.name == "medicine_type").current
      },
      nat: {
        value: sourceCharacter.attribs.find((e) => e.name == "nature_type").current
      },
      per: {
        value: sourceCharacter.attribs.find((e) => e.name == "persuasion_type").current
      },
      pil: {
        value: sourceCharacter.attribs.find((e) => e.name == "piloting_type").current
      },
      prc: {
        value: sourceCharacter.attribs.find((e) => e.name == "perception_type").current
      },
      prf: {
        value: sourceCharacter.attribs.find((e) => e.name == "performance_type").current
      },
      slt: {
        value: sourceCharacter.attribs.find((e) => e.name == "sleight_of_hand_type").current
      },
      ste: {
        value: sourceCharacter.attribs.find((e) => e.name == "stealth_type").current
      },
      sur: {
        value: sourceCharacter.attribs.find((e) => e.name == "survival_type").current
      },
      tec: {
        value: sourceCharacter.attribs.find((e) => e.name == "technology_type").current
      }
    };

    const targetCharacter = {
      name: sourceCharacter.name,
      type: "character",
      data: {
        abilities: abilities,
        details: details,
        skills: skills,
        attributes: {
          hp: hp
        }
      }
    };

    let actor = await Actor.create(targetCharacter);
    CharacterImporter.addProfessions(sourceCharacter, actor);
  }

  // Parse all classes and add them to already created actor.
  // "class" is a reserved word, therefore I use profession where I can.
  static async addProfessions(sourceCharacter, actor) {
    let result = [];

    // parse all class and multiclassX items
    // couldn't get Array.filter to work here for some reason
    // result = array of objects. each object is a separate class
    sourceCharacter.attribs.forEach((e) => {
      if (CharacterImporter.classOrMulticlass(e.name)) {
        var t = {
          profession: CharacterImporter.capitalize(e.current),
          type: CharacterImporter.baseOrMulti(e.name),
          level: CharacterImporter.getLevel(e, sourceCharacter)
        };
        result.push(t);
      }
    });

    // pull classes directly from system compendium and add them to current actor
    const professionsPack = await game.packs.get("sw5e.classes").getContent();
    result.forEach((prof) => {
      let assignedProfession = professionsPack.find((o) => o.name === prof.profession);
      assignedProfession.data.data.levels = prof.level;
      actor.createEmbeddedEntity("OwnedItem", assignedProfession.data, { displaySheet: false });
    });

    this.addSpecies(sourceCharacter.attribs.find((e) => e.name == "race").current, actor);

    this.addPowers(
      sourceCharacter.attribs.filter((e) => e.name.search(/repeating_power.+_powername/g) != -1).map((e) => e.current),
      actor
    );

    const discoveredItems = sourceCharacter.attribs.filter(
      (e) => e.name.search(/repeating_inventory.+_itemname/g) != -1
    );
    const items = discoveredItems.map((item) => {
      const id = item.name.match(/-\w{19}/g);

      return {
        name: item.current,
        quantity: sourceCharacter.attribs.find((e) => e.name === `repeating_inventory_${id}_itemcount`).current
      };
    });

    this.addItems(items, actor);
  }

  static async addClasses(profession, level, actor) {
    let classes = await game.packs.get("sw5e.classes").getContent();
    let assignedClass = classes.find((c) => c.name === profession);
    assignedClass.data.data.levels = level;
    await actor.createEmbeddedEntity("OwnedItem", assignedClass.data, { displaySheet: false });
  }

  static classOrMulticlass(name) {
    return name === "class" || (name.includes("multiclass") && name.length <= 12);
  }

  static baseOrMulti(name) {
    if (name === "class") {
      return "base_class";
    } else {
      return "multi_class";
    }
  }

  static getLevel(item, sourceCharacter) {
    if (item.name === "class") {
      let result = sourceCharacter.attribs.find((e) => e.name === "base_level").current;
      return parseInt(result);
    } else {
      let result = sourceCharacter.attribs.find((e) => e.name === `${item.name}_lvl`).current;
      return parseInt(result);
    }
  }

  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static async addSpecies(race, actor) {
    const species = await game.packs.get("sw5e.species").getContent();
    const assignedSpecies = species.find((c) => c.name === race);
    const activeEffects = assignedSpecies.data.effects[0].changes;
    const actorData = { data: { abilities: { ...actor.data.data.abilities } } };

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
      const createdPower = forcePowers.find((c) => c.name === power) || techPowers.find((c) => c.name === power);

      if (createdPower) {
        await actor.createEmbeddedEntity("OwnedItem", createdPower.data, { displaySheet: false });
      }
    }
  }

  static async addItems(items, actor) {
    const weapons = await game.packs.get("sw5e.weapons").getContent();
    const armors = await game.packs.get("sw5e.armor").getContent();
    const adventuringGear = await game.packs.get("sw5e.adventuringgear").getContent();

    for (const item of items) {
      const createdItem =
        weapons.find((c) => c.name.toLowerCase() === item.name.toLowerCase()) ||
        armors.find((c) => c.name.toLowerCase() === item.name.toLowerCase()) ||
        adventuringGear.find((c) => c.name.toLowerCase() === item.name.toLowerCase());

      if (createdItem) {
        if (item.quantity != 1) {
          createdItem.data.data.quantity = item.quantity;
        }

        await actor.createEmbeddedEntity("OwnedItem", createdItem.data, { displaySheet: false });
      }
    }
  }

  static addImportButton(html) {
    const actionButtons = html.find(".header-actions");
    actionButtons[0].insertAdjacentHTML(
      "afterend",
      `<div class="header-actions action-buttons flexrow"><button class="create-entity cs-import-button"><i class="fas fa-upload"></i> Import Character</button></div>`
    );

    let characterImportButton = $(".cs-import-button");
    characterImportButton.click(() => {
      let content = `<h1>Saved Character JSON Import</h1>
        <label for="character-json">Paste character JSON here:</label>
        </br>
        <textarea id="character-json" name="character-json" rows="10" cols="50"></textarea>`;
      let importDialog = new Dialog({
        title: "Import Character from SW5e.com",
        content: content,
        buttons: {
          Import: {
            icon: `<i class="fas fa-file-import"></i>`,
            label: "Import Character",
            callback: () => {
              let characterData = $("#character-json").val();
              console.log("Parsing Character JSON");
              CharacterImporter.transform(characterData);
            }
          },
          Cancel: {
            icon: `<i class="fas fa-times-circle"></i>`,
            label: "Cancel",
            callback: () => {}
          }
        }
      });
      importDialog.render(true);
    });
  }
}
