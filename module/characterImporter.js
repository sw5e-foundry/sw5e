import Actor5e from "./actor/entity.js";
import ActorSheet5eCharacterNew from "./actor/sheets/newSheet/character.js";

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

      // v2 - skills and proficiencies
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

      const baseClassName = sourceCharacter.attribs.find(o => o.name == 'class').current;
      const baseClassLvl = sourceCharacter.attribs.find(o => o.name == 'base_level').current;

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

      const classes = await game.packs.get('sw5e.classes');
      const content = await classes.getContent();
      const scout = await content.find(o => o.name == 'Scout').clone();
      scout.data.data.levels = 5;
      targetCharacter.items = [scout];
      let actor = await Actor.create(targetCharacter);

      actor.data.data.skills.acr = sourceCharacter.attribs.find(o => o.name == 'acrobatics_bonus').current;
      actor.data.data.skills.ani = sourceCharacter.attribs.find(o => o.name == 'animal_handling_bonus').current;
      actor.data.data.skills.ath = sourceCharacter.attribs.find(o => o.name == 'athletics_bonus').current;
      actor.data.data.skills.dec = sourceCharacter.attribs.find(o => o.name == 'deception_bonus').current;
      actor.data.data.skills.ins = sourceCharacter.attribs.find(o => o.name == 'insight_bonus').current;
      actor.data.data.skills.itm = sourceCharacter.attribs.find(o => o.name == 'intimidation_bonus').current;
      actor.data.data.skills.inv = sourceCharacter.attribs.find(o => o.name == 'investigation_bonus').current;
      actor.data.data.skills.lor = sourceCharacter.attribs.find(o => o.name == 'lore_bonus').current;
      actor.data.data.skills.med = sourceCharacter.attribs.find(o => o.name == 'medicine_bonus').current;
      actor.data.data.skills.nat = sourceCharacter.attribs.find(o => o.name == 'nature_bonus').current;
      actor.data.data.skills.pil = sourceCharacter.attribs.find(o => o.name == 'piloting_bonus').current;
      actor.data.data.skills.prc = sourceCharacter.attribs.find(o => o.name == 'perception_bonus').current;
      actor.data.data.skills.prf = sourceCharacter.attribs.find(o => o.name == 'performance_bonus').current;
      actor.data.data.skills.per = sourceCharacter.attribs.find(o => o.name == 'persuasion_bonus').current;
      actor.data.data.skills.slt = sourceCharacter.attribs.find(o => o.name == 'sleight_of_hand_bonus').current;
      actor.data.data.skills.ste = sourceCharacter.attribs.find(o => o.name == 'stealth_bonus').current;
      actor.data.data.skills.sur = sourceCharacter.attribs.find(o => o.name == 'survival_bonus').current;
      actor.data.data.skills.tec = sourceCharacter.attribs.find(o => o.name == 'technology_bonus').current;

      //const baseClassName = sourceCharacter.attribs.find(o => o.name == 'class').current;
      //const baseClassLvl = sourceCharacter.attribs.find(o => o.name == 'base_level').current;

      function addInitialClassAndLevel(itemData){
        Actor5e.getClassFeatures(itemData).then(features => {
          actor.createEmbeddedEntity("OwnedItem", features);
        });
      }

      async function addSubsequentLevels(targetLvl, actor){
        actor.data.data.details.level = targetLvl;
        var x = await actor.items.find(x => x.name == 'Scout');
        x.data.data.levels = 6;


      }

      function addSubsequentLevelsOld(/*targetLvl,*/ itemData, actorClass, actor){
        //const lvl = actorClass.data.data.levels;
        //const newLvl = Math.min(lvl + 1, 20 + lvl - actor.data.data.details.level);
        //if ( !(lvl === newLvl) ) {
          actorClass.update({"data.levels": newLvl});
          itemData.data.levels = newLvl;
          Actor5e.getClassFeatures(itemData).then(features => {
            actor.createEmbeddedEntity("OwnedItem", features);
          });
        //}
        return
      }

      
      //const actorClass = await actor.itemTypes.class.find(c => c.name === itemData.name);
      //const classWasAlreadyPresent = !!actorClass;
      //const classes = await game.packs.get('sw5e.classes');
      //const content = await classes.getContent();
      //const scout = await content.find(o => o.name == 'Scout').clone();
      //scout.data.data.levels = 6;
      //let newActorSheet = new ActorSheet5eCharacterNew(actor);
      let sheet = new game.sw5e.applications.ActorSheet5eCharacterNew(actor);
      //addInitialClassAndLevel(scout);
      //sheet._onDropItem(false, scout);

      
      //addSubsequentLevels(scout, actor);
      
      // ActorSheet5eCharacterNew
      //async _onDropItemCreate(itemData) {
      // this is basically a direct copy of ActorSheet5eCharacterNew._onDropItemCreate()
      function addActorClassLevel(itemData, actor) {
        // Upgrade the number of class levels a character has and add features
        if ( itemData.type === "class" ) {
          const cls = actor.itemTypes.class.find(c => c.name === itemData.name);
          const classWasAlreadyPresent = !!cls;
          /*DEBUG*/
          console.log("SW5e | Character Importer: cls: " + cls);
          console.log("SW5e | Character Importer: classWasAlreadyPresent: " + classWasAlreadyPresent);
          /*DEBUG*/
          
          // Add new features for class level
          if ( !classWasAlreadyPresent ) {
            Actor5e.getClassFeatures(itemData).then(features => {
              actor.createEmbeddedEntity("OwnedItem", features);
            });
          }

          // If the actor already has the class, increment the level instead of creating a new item
          // then add new features as long as level increases
          if ( classWasAlreadyPresent ) {
            const lvl = cls.data.data.levels;
            const newLvl = Math.min(lvl + 1, 20 + lvl - actor.data.data.details.level);
            if ( !(lvl === newLvl) ) {
              cls.update({"data.levels": newLvl});
              itemData.data.levels = newLvl;
              Actor5e.getClassFeatures(itemData).then(features => {
                actor.createEmbeddedEntity("OwnedItem", features);
              });
            }
            return
          }
        }
        // from Actor5e._onDropItemCreate()
        return actor.createEmbeddedEntity("OwnedItem", itemData);
      }        



      function sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
          currentDate = Date.now();
        } while (currentDate - date < milliseconds);
      }
    
      /*
      await newActorSheet._onDropItemCreate(scout);
      await newActorSheet._onDropItemCreate(scout);
      await newActorSheet._onDropItemCreate(scout);
      */

      /*
      var newActor = game.actors.find(o => o.name === 'Strom Klovrah');
      var classes = await game.packs.get('sw5e.classes');
      var content = await classes.getContent();
      var scout = content.find(o => o.name == 'Scout');
      var newActorSheet = new game.sw5e.applications.ActorSheet5eCharacterNew(newActor);
      await newActorSheet._onDropItemCreate(scout);
      await newActorSheet.close();
      var newActorSheet = new game.sw5e.applications.ActorSheet5eCharacterNew(newActor);
      await newActorSheet._onDropItemCreate(scout);
      await newActorSheet.close();
      var newActorSheet = new game.sw5e.applications.ActorSheet5eCharacterNew(newActor);
      await newActorSheet._onDropItemCreate(scout);
      await newActorSheet.close();
      */
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