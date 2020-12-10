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

      // v2 - skills and proficiencies
      const strengthSaveProf = sourceCharacter.attribs.find(o => o.name == 'strength_save_prof').current ? 1 : 0;
      const dexteritySaveProf = sourceCharacter.attribs.find(o => o.name == 'dexterity_save_prof').current ? 1 : 0;
      const constitutionSaveProf = sourceCharacter.attribs.find(o => o.name == 'constitution_save_prof').current ? 1 : 0;
      const intelligenceSaveProf = sourceCharacter.attribs.find(o => o.name == 'intelligence_save_prof').current ? 1 : 0;
      const wisdomSaveProf = sourceCharacter.attribs.find(o => o.name == 'wisdom_save_prof').current ? 1 : 0;
      const charismaSaveProf = sourceCharacter.attribs.find(o => o.name == 'charisma_save_prof').current ? 1 : 0;

      const acrobaticsSkill = sourceCharacter.attribs.find(o => o.name == 'acrobatics_bonus').current;
      const animalHandlingSkill = sourceCharacter.attribs.find(o => o.name == 'animal_handling_bonus').current;
      const athleticsSkill = sourceCharacter.attribs.find(o => o.name == 'athletics_bonus').current;
      const deceptionSkill = sourceCharacter.attribs.find(o => o.name == 'deception_bonus').current;
      const insightSkill = sourceCharacter.attribs.find(o => o.name == 'insight_bonus').current;
      const intimidationSkill = sourceCharacter.attribs.find(o => o.name == 'intimidation_bonus').current;
      const investigationSkill = sourceCharacter.attribs.find(o => o.name == 'investigation_bonus').current;
      const loreSkill = sourceCharacter.attribs.find(o => o.name == 'lore_bonus').current;
      const medicineSkill = sourceCharacter.attribs.find(o => o.name == 'medicine_bonus').current;
      const natureSkill = sourceCharacter.attribs.find(o => o.name == 'nature_bonus').current;
      const pilotingSkill = sourceCharacter.attribs.find(o => o.name == 'piloting_bonus').current;
      const perceptionSkill = sourceCharacter.attribs.find(o => o.name == 'perception_bonus').current;
      const performanceSkill = sourceCharacter.attribs.find(o => o.name == 'performance_bonus').current;
      const persuasionSkill = sourceCharacter.attribs.find(o => o.name == 'persuasion_bonus').current;
      const sleightOfHandSkill = sourceCharacter.attribs.find(o => o.name == 'sleight_of_hand_bonus').current;
      const stealthSkill = sourceCharacter.attribs.find(o => o.name == 'stealth_bonus').current;
      const survivalSkill = sourceCharacter.attribs.find(o => o.name == 'survival_bonus').current;
      const technologySkill = sourceCharacter.attribs.find(o => o.name == 'technology_bonus').current;

      const targetCharacter = {
          name: sourceCharacter.name,
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
              },
                skills: {
                    acr: {
                      value: acrobaticsSkill,
                      ability: "dex"
                    },
                    ani: {
                      value: animalHandlingSkill,
                      ability: "wis"
                    },
                    ath: {
                      value: athleticsSkill,
                      ability: "str"
                    },
                    dec: {
                      value: deceptionSkill,
                      ability: "cha"
                    },
                    ins: {
                      value: insightSkill,
                      ability: "wis"
                    },
                    itm: {
                      value: intimidationSkill,
                      ability: "cha"
                    },
                    inv: {
                      value: investigationSkill,
                      ability: "int"
                    },
                    lor: {
                      value: loreSkill,
                      ability: "int"
                    },
                    med: {
                      value: medicineSkill,
                      ability: "wis"
                    },
                    nat: {
                      value: natureSkill,
                      ability: "int"
                    },
                    pil: {
                      value: pilotingSkill,
                      ability: "int"
                    },
                    prc: {
                      value: perceptionSkill,
                      ability: "wis"
                    },
                    prf: {
                      value: performanceSkill,
                      ability: "cha"
                    },
                    per: {
                      value: persuasionSkill,
                      ability: "cha"
                    },
                    slt: {
                      value: sleightOfHandSkill,
                      ability: "dex"
                    },
                    ste: {
                      value: stealthSkill,
                      ability: "dex"
                    },
                    sur: {
                      value: survivalSkill,
                      ability: "wis"
                    },
                    tec: {
                      value: technologySkill,
                      ability: "int"
                    }
                }
          }
      };        

      let newActor = await Actor.create(targetCharacter);
      let actor = await game.actors.get(newActor.id);
      let classes = await game.packs.get('sw5e.classes');
      let content = await classes.getContent();
      let scout = content.find(o => o.name == 'Scout');
      console.log(actor);
      console.log(classes);
      console.log(content);
      console.log(Object.entries(actor.apps))
      console.log(Object.keys(actor.apps))
      console.log(Object.values(actor.apps))
      //actor.apps[46]._onDropItemCreate(scout);
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