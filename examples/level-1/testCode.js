export default class CharacterImporter {
    // transform JSON from sw5e.com to Foundry friendly format
    // and insert new actor
    static transform(rawCharacter){
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

        // v2 - import skills and proficiencies
        const targetCharacter = {
            name: sourceCharacter.name,
            type: "character",
            data: {
                abilities: {
                    str: {
                        value: strength,
                        proficient: CharacterImporter.isProficient('strength_save', sourceCharacter)
                    },
                    dex: {
                        value: dexterity,
                        proficient: CharacterImporter.isProficient('dexterity_save', sourceCharacter)
                    },
                    con: {
                        value: constitution,
                        proficient: CharacterImporter.isProficient('constitution_save', sourceCharacter)
                    },
                    int: {
                        value: intelligence,
                        proficient: CharacterImporter.isProficient('intelligence_save', sourceCharacter)
                    },
                    wis: {
                        value: wisdom,
                        proficient: CharacterImporter.isProficient('wisdom_save', sourceCharacter)
                    },
                    cha: {
                        value: charisma,
                        proficient: CharacterImporter.isProficient('charisma_save', sourceCharacter)
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
                }/*,
                skills: {
                    "acr": {
                      value: CharacterImporter.fetchSkill('acrobatics', sourceCharacter),
                      "ability": "dex"
                    },
                    "ani": {
                      value: CharacterImporter.fetchSkill('animal_handling', sourceCharacter),
                      "ability": "wis"
                    },
                    "ath": {
                      value: CharacterImporter.fetchSkill('athletics', sourceCharacter),
                      "ability": "str"
                    },
                    "dec": {
                      value: CharacterImporter.fetchSkill('deception', sourceCharacter),
                      "ability": "cha"
                    },
                    "ins": {
                      value: CharacterImporter.fetchSkill('insight', sourceCharacter),
                      "ability": "wis"
                    },
                    "itm": {
                      value: CharacterImporter.fetchSkill('intimidation', sourceCharacter),
                      "ability": "cha"
                    },
                    "inv": {
                      value: CharacterImporter.fetchSkill('investigation', sourceCharacter),
                      "ability": "int"
                    },
                    "lor": {
                      value: CharacterImporter.fetchSkill('lore', sourceCharacter),
                      "ability": "int"
                    },
                    "med": {
                      value: CharacterImporter.fetchSkill('medicine', sourceCharacter),
                      "ability": "wis"
                    },
                    "nat": {
                      value: CharacterImporter.fetchSkill('nature', sourceCharacter),
                      "ability": "int"
                    },
                    "pil": {
                      value: CharacterImporter.fetchSkill('piloting', sourceCharacter),
                      "ability": "int"
                    },
                    "prc": {
                      value: CharacterImporter.fetchSkill('perception', sourceCharacter),
                      "ability": "wis"
                    },
                    "prf": {
                      value: CharacterImporter.fetchSkill('performance', sourceCharacter),
                      "ability": "cha"
                    },
                    "per": {
                      value: CharacterImporter.fetchSkill('persusasion', sourceCharacter),
                      "ability": "cha"
                    },
                    "slt": {
                      value: CharacterImporter.fetchSkill('sleight_of_hand', sourceCharacter),
                      "ability": "dex"
                    },
                    "ste": {
                      value: CharacterImporter.fetchSkill('stealth', sourceCharacter),
                      "ability": "dex"
                    },
                    "sur": {
                      value: CharacterImporter.fetchSkill('survival', sourceCharacter),
                      "ability": "wis"
                    },
                    "tec": {
                      value: CharacterImporter.fetchSkill('technology', sourceCharacter),
                      "ability": "int"
                    }
                }*/
            }
        };        

        Actor.create(targetCharacter);
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
            console.log("FISH: character import button pressed. 2")
            let files = [];
            let contentOld = '<h1>Saved Character JSON Import</h1> '
                + '<input class="file-picker" type="file" id="sw5e-character-json" accept=".json" multiple name="sw5e-character-json">'
                + '<hr>'
                + '<div class="sw5e-file-import"></div>';
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
    
    static isProficient(ability, sourceCharacter){
        let abilitySaveProf = ability + "_save_prof";
        let prof = sourceCharacter.attribs.find(o => o.name == abilitySaveProf).current;
        if (prof == "(@{pb})") {
            console.log("DEBUG Prof: true");
            return 1
        } else {
            console.log("DEBUG Prof: false");
            return 0
        }
    }

    static fetchSkill(skill, source){
      return source.attribs.find(o => o.name == skill+'_mod').current;
    }

}