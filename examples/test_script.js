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
        }/*,
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
        }*/
    }
  };