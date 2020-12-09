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

        

        const targetCharacter = {
            name: sourceCharacter.name,
            type: "character",
            data: {
                abilities: {
                    str: {
                        value: strength
                    },
                    dex: {
                        value: dexterity
                    },
                    con: {
                        value: constitution
                    },
                    int: {
                        value: intelligence
                    },
                    wis: {
                        value: wisdom
                    },
                    cha: {
                        value: charisma
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

        Actor.create(targetCharacter);
    }

    /** */
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
}