export default class CharacterImporter {

  // transform JSON from sw5e.com to Foundry friendly format
  // and insert new actor
  static async transform(rawCharacter){
    const sourceCharacter = JSON.parse(rawCharacter);
    
    const details = {
      species: sourceCharacter.attribs.find(e => e.name == "race").current,
      background: sourceCharacter.attribs.find(e => e.name == "background").current,
      alignment: sourceCharacter.attribs.find(e => e.name == "alignment").current
    }
    
    const hp = {
      value: sourceCharacter.attribs.find(e => e.name == "hp").current,
      min: 0,
      max: sourceCharacter.attribs.find(e => e.name == "hp").current,
      temp: sourceCharacter.attribs.find(e => e.name == "hp_temp").current
    };

    const ac = {
      value: sourceCharacter.attribs.find(e => e.name == "ac").current
    };

    const abilities = {
      str: {
        value: sourceCharacter.attribs.find(e => e.name == "strength").current,
        proficient: sourceCharacter.attribs.find(e => e.name == 'strength_save_prof').current ? 1 : 0
      },
      dex: {
        value: sourceCharacter.attribs.find(e => e.name == "dexterity").current,
        proficient: sourceCharacter.attribs.find(e => e.name == 'dexterity_save_prof').current ? 1 : 0
      },
      con: {
        value: sourceCharacter.attribs.find(e => e.name == "constitution").current,
        proficient: sourceCharacter.attribs.find(e => e.name == 'constitution_save_prof').current ? 1 : 0
      },
      int: {
        value: sourceCharacter.attribs.find(e => e.name == "intelligence").current,
        proficient: sourceCharacter.attribs.find(e => e.name == 'intelligence_save_prof').current ? 1 : 0
      },
      wis: {
        value: sourceCharacter.attribs.find(e => e.name == "wisdom").current,
        proficient: sourceCharacter.attribs.find(e => e.name == 'wisdom_save_prof').current ? 1 : 0
      },
      cha: {
        value: sourceCharacter.attribs.find(e => e.name == "charisma").current,
        proficient: sourceCharacter.attribs.find(e => e.name == 'charisma_save_prof').current ? 1 : 0
      },
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
        value: sourceCharacter.attribs.find(e => e.name == 'acrobatics_type').current
      },
      ani: {
        value: sourceCharacter.attribs.find(e => e.name == 'animal_handling_type').current
      },
      ath: {
        value: sourceCharacter.attribs.find(e => e.name == 'athletics_type').current
      },
      dec: {
        value: sourceCharacter.attribs.find(e => e.name == 'deception_type').current
      },
      ins: {
        value: sourceCharacter.attribs.find(e => e.name == 'insight_type').current
      },
      inv: {
        value: sourceCharacter.attribs.find(e => e.name == 'investigation_type').current
      },
      itm: {
        value: sourceCharacter.attribs.find(e => e.name == 'intimidation_type').current
      },
      lor: {
        value: sourceCharacter.attribs.find(e => e.name == 'lore_type').current
      },
      med: {
        value: sourceCharacter.attribs.find(e => e.name == 'medicine_type').current
      },
      nat: {
        value: sourceCharacter.attribs.find(e => e.name == 'nature_type').current
      },
      per: {
        value: sourceCharacter.attribs.find(e => e.name == 'persuasion_type').current
      },
      pil: {
        value: sourceCharacter.attribs.find(e => e.name == 'piloting_type').current
      },
      prc: {
        value: sourceCharacter.attribs.find(e => e.name == 'perception_type').current
      },
      prf: {
        value: sourceCharacter.attribs.find(e => e.name == 'performance_type').current
      },
      slt: {
        value: sourceCharacter.attribs.find(e => e.name == 'sleight_of_hand_type').current
      },
      ste: {
        value: sourceCharacter.attribs.find(e => e.name == 'stealth_type').current
      },
      sur: {
        value: sourceCharacter.attribs.find(e => e.name == 'survival_type').current
      },
      tec: {
        value: sourceCharacter.attribs.find(e => e.name == 'technology_type').current
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
        },
        skills: skills
      }
    };

    let actor = await Actor.create(targetCharacter);

    //add class and level
    const profession = sourceCharacter.attribs.find(e => e.name == "class").current;
    let professionLevel = sourceCharacter.attribs.find(e => e.name == "class_display").current;
    professionLevel = parseInt( professionLevel.replace(/[^0-9]/g,'') ); //remove a-z, leaving only integers
    CharacterImporter.addClasses(profession, professionLevel, actor);
  }

  //currently only works with 1 class 
  static async addClasses(profession, level, actor){
    let classes = await game.packs.get('sw5e.classes').getContent();
    let assignedClass = classes.find( c => c.name === profession );
    assignedClass.data.data.levels = level;
    await actor.createEmbeddedEntity("OwnedItem", assignedClass.data, { displaySheet: false });
  }

  static addImportButton(html){
    const header = $("#actors").find("header.directory-header");
    const search = $("#actors").children().find("div.header-search");
    const newImportButtonDiv = $("#actors").children().find("div.header-actions").clone();
    const newSearch = search.clone();
    search.remove();
    newImportButtonDiv.attr('id', 'character-sheet-import');
    header.append(newImportButtonDiv);
    newImportButtonDiv.children("button").remove();
    newImportButtonDiv.append("<button class='create-entity' id='cs-import-button'><i class='fas fa-upload'></i> Import Character</button>");
    newSearch.appendTo(header);

    let characterImportButton = $("#cs-import-button");
    characterImportButton.click(ev => { 
      let content = '<h1>Saved Character JSON Import</h1> '
        + '<label for="character-json">Paste character JSON here:</label> '
        + '</br>'
        + '<textarea id="character-json" name="character-json" rows="10" cols="50"></textarea>';
      let importDialog = new Dialog({
        title: "Import Character from SW5e.com",
        content: content,
        buttons: {
          "Import": {
            icon: '<i class="fas fa-file-import"></i>',
            label: "Import Character",
            callback: (e) => {
              let characterData = $('#character-json').val();
              console.log('Parsing Character JSON');
              CharacterImporter.transform(characterData);
            }   
          },
          "Cancel": {
            icon: '<i class="fas fa-times-circle"></i>',
            label: "Cancel",
            callback: () => {},
          }
        }
      })
      importDialog.render(true);
    });
  } 
}