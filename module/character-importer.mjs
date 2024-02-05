import AdvancementManager from "./applications/advancement/advancement-manager.mjs";

export default class CharacterImporter {
  // Transform JSON from sw5e.com to Foundry friendly format
  // and insert new actor

  _itemsWithAdvancement = [];

  _actor = null;

  async transform(rawCharacter) {
    const sourceCharacter = JSON.parse(rawCharacter); // Source character

    const details = {
      species: sourceCharacter.attribs.find(e => e.name === "race").current,
      background: sourceCharacter.attribs.find(e => e.name === "background").current,
      alignment: sourceCharacter.attribs.find(e => e.name === "alignment").current
    };

    const hp = {
      value: sourceCharacter.attribs.find(e => e.name === "hp").current,
      min: 0,
      max: sourceCharacter.attribs.find(e => e.name === "hp").current,
      temp: sourceCharacter.attribs.find(e => e.name === "hp_temp").current
    };

    const abilities = {
      str: {
        value: sourceCharacter.attribs.find(e => e.name === "strength").current,
        proficient: sourceCharacter.attribs.find(e => e.name === "strength_save_prof").current ? 1 : 0
      },
      dex: {
        value: sourceCharacter.attribs.find(e => e.name === "dexterity").current,
        proficient: sourceCharacter.attribs.find(e => e.name === "dexterity_save_prof").current ? 1 : 0
      },
      con: {
        value: sourceCharacter.attribs.find(e => e.name === "constitution").current,
        proficient: sourceCharacter.attribs.find(e => e.name === "constitution_save_prof").current ? 1 : 0
      },
      int: {
        value: sourceCharacter.attribs.find(e => e.name === "intelligence").current,
        proficient: sourceCharacter.attribs.find(e => e.name === "intelligence_save_prof").current ? 1 : 0
      },
      wis: {
        value: sourceCharacter.attribs.find(e => e.name === "wisdom").current,
        proficient: sourceCharacter.attribs.find(e => e.name === "wisdom_save_prof").current ? 1 : 0
      },
      cha: {
        value: sourceCharacter.attribs.find(e => e.name === "charisma").current,
        proficient: sourceCharacter.attribs.find(e => e.name === "charisma_save_prof").current ? 1 : 0
      }
    };

    /* ----------------------------------------------------------------- */
    /*  character.system.skills.<skill_name>.value is all that matters
        /*  values can be 0, 0.5, 1 or 2
        /*  0 = regular
        /*  0.5 = half-proficient
        /*  1 = proficient
        /*  2 = expertise
        /*  foundry takes care of calculating the rest
        /* ----------------------------------------------------------------- */
    const skills = {
      acr: {
        value: sourceCharacter.attribs.find(e => e.name === "acrobatics_type").current
      },
      ani: {
        value: sourceCharacter.attribs.find(e => e.name === "animal_handling_type").current
      },
      ath: {
        value: sourceCharacter.attribs.find(e => e.name === "athletics_type").current
      },
      dec: {
        value: sourceCharacter.attribs.find(e => e.name === "deception_type").current
      },
      ins: {
        value: sourceCharacter.attribs.find(e => e.name === "insight_type").current
      },
      inv: {
        value: sourceCharacter.attribs.find(e => e.name === "investigation_type").current
      },
      itm: {
        value: sourceCharacter.attribs.find(e => e.name === "intimidation_type").current
      },
      lor: {
        value: sourceCharacter.attribs.find(e => e.name === "lore_type").current
      },
      med: {
        value: sourceCharacter.attribs.find(e => e.name === "medicine_type").current
      },
      nat: {
        value: sourceCharacter.attribs.find(e => e.name === "nature_type").current
      },
      per: {
        value: sourceCharacter.attribs.find(e => e.name === "persuasion_type").current
      },
      pil: {
        value: sourceCharacter.attribs.find(e => e.name === "piloting_type").current
      },
      prc: {
        value: sourceCharacter.attribs.find(e => e.name === "perception_type").current
      },
      prf: {
        value: sourceCharacter.attribs.find(e => e.name === "performance_type").current
      },
      slt: {
        value: sourceCharacter.attribs.find(e => e.name === "sleight_of_hand_type").current
      },
      ste: {
        value: sourceCharacter.attribs.find(e => e.name === "stealth_type").current
      },
      sur: {
        value: sourceCharacter.attribs.find(e => e.name === "survival_type").current
      },
      tec: {
        value: sourceCharacter.attribs.find(e => e.name === "technology_type").current
      }
    };
    for (const id of Object.keys(skills)) skills[id] =
      globalThis.sw5e.dataModels.actor.CharacterData._initialSkillValue(id, skills[id]);

    const targetCharacter = {
      name: sourceCharacter.name,
      type: "character",
      img: sourceCharacter.avatar,
      system: {
        abilities,
        details,
        skills,
        attributes: {
          hp
        }
      }
    };

    this._actor = await Actor.create(targetCharacter);

    await this.addClasses(
      sourceCharacter.attribs
        .filter(e => CharacterImporter.classOrMulticlass(e.name))
        .map(e => {
          return {
            name: CharacterImporter.capitalize(e.current),
            type: CharacterImporter.baseOrMulti(e.name),
            level: CharacterImporter.getLevel(e, sourceCharacter),
            arch: CharacterImporter.getSubclass(e, sourceCharacter)
          };
        })
    );

    await this.addSpecies(sourceCharacter.attribs.find(e => e.name === "race").current);

    await this.addBackground(sourceCharacter.attribs.find(e => e.name === "background").current);

    await this.addPowers(
      sourceCharacter.attribs.filter(e => e.name.search(/repeating_power.+_powername/g) !== -1).map(e => e.current)
    );

    await this.addItems(
      sourceCharacter.attribs
        .filter(e => e.name.search(/repeating_(?:inventory|traits).+_(?:item)?name/g) !== -1)
        .map(item => {
          const id = item.name.match(/-\w{19}/g);
          return {
            name: item.current,
            quantity: sourceCharacter.attribs.find(e => e.name === `repeating_inventory_${id}_itemcount`)?.current ?? 1
          };
        })
    );

    await this.addProficiencies(
      sourceCharacter.attribs
        .filter(e => e.name.search(/repeating_proficiencies.+_name/g) !== -1)
        .map(prof => {
          const id = prof.name.match(/-\w{19}/g);
          const type =
            sourceCharacter.attribs.find(e => e.name === `repeating_proficiencies_${id}_prof_type`)?.current
            ?? "LANGUAGE";
          return {
            name: prof.current,
            type
          };
        })
    );

    await this.addAdvancements();
  }

  async addClasses(classes) {
    const packClasses = await game.packs.get("sw5e.classes").getDocuments();
    const packArchs = await game.packs.get("sw5e.archetypes").getDocuments();

    // Make sure the base class is added first
    const firstClassIdx = classes.findIndex(cls => cls.type === "base_class");
    const firstClass = classes.splice(firstClassIdx, 1)[0];
    classes.unshift(firstClass);

    const toCreate = [];
    for (const cls of classes) {
      const packClass = packClasses.find(o => o.name === cls.name)?.toObject();
      if (packClass) {
        packClass.system.levels = cls.level;
        toCreate.push(packClass);
      }
      const packArch = packArchs.find(o => o.name === cls.arch)?.toObject();
      if (packArch) toCreate.push(packArch);
    }
    await this._actor.createEmbeddedDocuments("Item", toCreate.filter(this.checkAdvancement.bind(this)));
  }

  static classOrMulticlass(name) {
    return name === "class" || name.match(/multiclass\d+$/);
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
      let result = sourceCharacter.attribs.find(e => e.name === "base_level")?.current;
      return parseInt(result);
    } else {
      let result = sourceCharacter.attribs.find(e => e.name === `${item.name}_lvl`)?.current;
      return parseInt(result);
    }
  }

  static getSubclass(item, sourceCharacter) {
    if (item.name === "class") {
      let result = sourceCharacter.attribs.find(e => e.name === "subclass")?.current;
      return result;
    } else {
      let result = sourceCharacter.attribs.find(e => e.name === `${item.name}_subclass`)?.current;
      return result;
    }
  }

  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static addValue(obj, value) {
    if (obj.value instanceof Set) obj.value.add(value);
    else if (!obj.value.includes(value)) obj.value.push(value);
  }

  static addCustom(obj, value) {
    if (obj.custom) obj.custom = `${obj.custom}; ${value}`;
    else obj.custom = value;
  }

  async addSpecies(race) {
    const species = await game.packs.get("sw5e.species").getDocuments();
    const assignedSpecies = species.find(c => c.name === race)?.toObject();

    if (assignedSpecies) {
      const activeEffects = [...assignedSpecies.effects][0]?.changes ?? [];
      const actorData = { system: { abilities: { ...this._actor.system.abilities } } };

      for (const effect of activeEffects) {
        const attr = effect.key.match(/system\.abilities\.(str|dex|con|int|wis|cha)\.value/)?.[1];
        if (attr) actorData.system.abilities[attr].value -= effect.value;
      }

      await this._actor.update(actorData);

      await this._actor.createEmbeddedDocuments("Item", [assignedSpecies].filter(this.checkAdvancement.bind(this)));
    }
  }

  async addBackground(bg) {
    const bgs = await game.packs.get("sw5e.backgrounds").getDocuments();
    const packBg = bgs.find(c => c.name === bg)?.toObject();
    if (packBg) {
      await this._actor.createEmbeddedDocuments("Item", [packBg].filter(this.checkAdvancement.bind(this)));
    }
  }

  async addPowers(powers) {
    const packPowers = [
      ...(await game.packs.get("sw5e.forcepowers").getDocuments()),
      ...(await game.packs.get("sw5e.techpowers").getDocuments())
    ];
    const toCreate = [];

    for (const power of powers) {
      const packPower = packPowers.find(c => c.name === power)?.toObject();
      if (packPower) toCreate.push(packPower);
    }

    await this._actor.createEmbeddedDocuments("Item", toCreate.filter(this.checkAdvancement.bind(this)));
  }

  async addItems(items) {
    const packItems = [
      ...(await game.packs.get("sw5e.lightweapons").getDocuments()),
      ...(await game.packs.get("sw5e.vibroweapons").getDocuments()),
      ...(await game.packs.get("sw5e.blasters").getDocuments()),
      ...(await game.packs.get("sw5e.armor").getDocuments()),
      ...(await game.packs.get("sw5e.adventuringgear").getDocuments()),
      ...(await game.packs.get("sw5e.ammo").getDocuments()),
      ...(await game.packs.get("sw5e.implements").getDocuments()),
      ...(await game.packs.get("sw5e.invocations").getDocuments()),
      ...(await game.packs.get("sw5e.consumables").getDocuments()),
      ...(await game.packs.get("sw5e.enhanceditems").getDocuments()),
      ...(await game.packs.get("sw5e.explosives").getDocuments()),
      ...(await game.packs.get("sw5e.feats").getDocuments()),
      ...(await game.packs.get("sw5e.fightingstyles").getDocuments()),
      ...(await game.packs.get("sw5e.fightingmasteries").getDocuments()),
      ...(await game.packs.get("sw5e.gamingsets").getDocuments()),
      ...(await game.packs.get("sw5e.lightsaberforms").getDocuments()),
      ...(await game.packs.get("sw5e.modifications").getDocuments()),
      ...(await game.packs.get("sw5e.kits").getDocuments()),
      ...(await game.packs.get("sw5e.maneuvers").getDocuments())
    ];
    const toCreate = [];

    for (const item of items) {
      const packItem = packItems.find(c => c.name.toLowerCase() === item.name.toLowerCase())?.toObject();

      if (packItem) {
        packItem.system.quantity = item.quantity;
        toCreate.push(packItem);
      }
    }

    await this._actor.createEmbeddedDocuments("Item", toCreate.filter(this.checkAdvancement.bind(this)));
  }

  async addProficiencies(profs) {
    const updates = {};

    const armorProf = this._actor.system.traits.armorProf;
    const languages = this._actor.system.traits.languages;
    const weaponProf = this._actor.system.traits.weaponProf;

    // #733: Convert values from Set to Array for actor.update()
    armorProf.value = Array.from(armorProf.value);
    languages.value = Array.from(languages.value);
    weaponProf.value = Array.from(weaponProf.value);

    for (const prof of profs) {
      let name = prof.name;
      switch (prof.type) {
        case "WEAPON":
        case "OTHER":
          name = name.toLowerCase().replace(/\s/g, "");
          const match = name.match(/(all|simple|martial|exotic)(blaster|vibroweapon|lightweapon)s/);
          if (match) {
            const weapons = {
              blaster: ["smb", "mrb", "exb"],
              vibroweapon: ["svb", "mvb", "evw"],
              lightweapon: ["slw", "mlw", "elw"]
            };
            const which = match[1];
            const wpnType = match[2];
            let toAdd = weapons[wpnType];
            if (which === "all") toAdd = [toAdd[0], toAdd[1]];
            else if (which === "simple") toAdd = [toAdd[0]];
            else if (which === "martial") toAdd = [toAdd[1]];
            else if (which === "exotic") toAdd = [toAdd[2]];
            else toAdd = [];
            for (const wpnProf of toAdd) CharacterImporter.addValue(weaponProf, wpnProf);
          } else if (name in CONFIG.SW5E.weaponIds) {
            CharacterImporter.addValue(weaponProf, name);
          } else {
            CharacterImporter.addCustom(weaponProf, prof.name);
          }
          break;
        case "ARMOR":
          name = name.toLowerCase().replace(/\s|armor/g, "");
          if (name in CONFIG.SW5E.armorProficienciesMap) {
            CharacterImporter.addValue(armorProf, CONFIG.SW5E.armorProficienciesMap[name]);
          } else {
            CharacterImporter.addCustom(armorProf, prof.name);
          }
          break;
        case "LANGUAGE":
          name = name
            .toLowerCase()
            .replace(/galactic /g, "")
            .replace(/\s/g, "-");
          if (name in CONFIG.SW5E.languages) {
            CharacterImporter.addValue(languages, name);
          } else {
            CharacterImporter.addCustom(languages, prof.name);
          }
          break;
      }
    }

    updates["system.traits.armorProf"] = armorProf;
    updates["system.traits.languages"] = languages;
    updates["system.traits.weaponProf"] = weaponProf;

    await this._actor.update(updates);
  }

  checkAdvancement(item) {
    // Bypass normal creation flow for any items with advancement
    if (item?.system?.advancement?.length && !game.settings.get("sw5e", "disableAdvancements")) {
      this._itemsWithAdvancement.push(item);
      return false;
    }
    return true;
  }

  async addAdvancements() {
    let actor = this._actor;
    let manager = null;
    for (const item of this._itemsWithAdvancement) {
      if (!item) return;
      if (!manager) manager = AdvancementManager.forNewItem(actor, item);
      else manager.addNewItem(item);

      // Make sure classes are at the proper level
      if (item.type === "class") {
        const classId = item.system.identifier;
        const classLvl = item.system.levels;
        const clonedItem = manager.clone.items.find(i => i.type === "class" && i.system.identifier === classId);
        const levelDelta = classLvl - 1;
        if (!clonedItem || levelDelta < 1) continue;
        manager.createLevelChangeSteps(clonedItem, levelDelta);
      }
    }
    if (manager?.steps?.length) manager.render(true);
  }

  static addImportButton(html) {
    const actionButtons = html.find(".header-actions");
    actionButtons[0].insertAdjacentHTML(
      "afterend",
      "<div class=\"header-actions action-buttons flexrow\"><button class=\"create-entity cs-import-button\"><i class=\"fas fa-upload\"></i> Import Character</button></div>"
    );

    let characterImportButton = $(".cs-import-button");
    characterImportButton.click(() => {
      let content = `<h1>Saved Character JSON Import</h1>
        <label for="character-json">Paste character JSON here:</label>
        </br>
        <textarea id="character-json" name="character-json" rows="10" cols="50"></textarea>`;
      let importDialog = new Dialog({
        title: "Import Character from SW5e.com",
        content,
        buttons: {
          Import: {
            icon: "<i class=\"fas fa-file-import\"></i>",
            label: "Import Character",
            callback: () => {
              let characterData = $("#character-json").val();
              console.log("Parsing Character JSON");
              const ci = new CharacterImporter();
              ci.transform(characterData);
            }
          },
          Cancel: {
            icon: "<i class=\"fas fa-times-circle\"></i>",
            label: "Cancel",
            callback: () => { }
          }
        }
      });
      importDialog.render(true);
    });
  }
}
