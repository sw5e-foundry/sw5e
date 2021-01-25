export default class CharacterImporter {

  // transform JSON from sw5e.com to Foundry friendly format
  // and insert new actor
  static async transform(rawCharacter){
    const sourceCharacter = JSON.parse(rawCharacter);
    
    // v1 - just import the very basics: name, species, hp, ac and abilities
    const name = sourceCharacter.name;
    const species = sourceCharacter.attribs.find(o => o.name == "race").current;
    const hp = sourceCharacter.attribs.find(o => o.name == "hp").current;
    const hpTemp = sourceCharacter.attribs.find(o => o.name == "hp_temp").current;
    const ac = sourceCharacter.attribs.find(o => o.name == "ac").current;
    const strength = sourceCharacter.attribs.find(o => o.name == "strength").current;
    const dexterity = sourceCharacter.attribs.find(o => o.name == "dexterity").current;
    const constitution = sourceCharacter.attribs.find(o => o.name == "constitution").current;
    const intelligence = sourceCharacter.attribs.find(o => o.name == "intelligence").current;
    const wisdom = sourceCharacter.attribs.find(o => o.name == "wisdom").current;
    const charisma = sourceCharacter.attribs.find(o => o.name == "charisma").current;
    const strengthSaveProf = sourceCharacter.attribs.find(o => o.name == 'strength_save_prof').current ? 1 : 0;
    const dexteritySaveProf = sourceCharacter.attribs.find(o => o.name == 'dexterity_save_prof').current ? 1 : 0;
    const constitutionSaveProf = sourceCharacter.attribs.find(o => o.name == 'constitution_save_prof').current ? 1 : 0;
    const intelligenceSaveProf = sourceCharacter.attribs.find(o => o.name == 'intelligence_save_prof').current ? 1 : 0;
    const wisdomSaveProf = sourceCharacter.attribs.find(o => o.name == 'wisdom_save_prof').current ? 1 : 0;
    const charismaSaveProf = sourceCharacter.attribs.find(o => o.name == 'charisma_save_prof').current ? 1 : 0;
    // v2 skills
    // broken

    // v3 classes
    const profession = sourceCharacter.attribs.find(o => o.name == "class").current;
    let professionLevel = sourceCharacter.attribs.find(o => o.name == "class_display").current;
    professionLevel = parseInt( professionLevel.replace(/[^0-9]/g,'') );

    const targetCharacter = {
      name: name,
      type: "character",
      data: {
        abilities: {
          str: {
            value: strength,
            proficient: strengthSaveProf
          },
          dex: {
            value: dexterity,
            proficient: dexteritySaveProf
          },
          con: {
            value: constitution,
            proficient: constitutionSaveProf
          },
          int: {
            value: intelligence,
            proficient: intelligenceSaveProf
          },
          wis: {
            value: wisdom,
            proficient: wisdomSaveProf
          },
          cha: {
            value: charisma,
            proficient: charismaSaveProf
          },
        },
        attributes: {
          ac: {
            value: ac
          },
          hp: {
            value: hp,
            min: 0,
            max: hp,
            temp: hpTemp
          }
        }
      }
    };
    
    let actor = await Actor.create(targetCharacter);
    addClasses(profession, professionLevel, actor);
  }

  async addClasses(profession, level, actor){
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