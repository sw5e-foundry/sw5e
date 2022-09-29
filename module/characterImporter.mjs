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
            img: sourceCharacter.avatar,
            system: {
                abilities: abilities,
                details: details,
                skills: skills,
                attributes: {
                    hp: hp
                }
            }
        };

        let actor = await Actor.create(targetCharacter);

        await this.addClasses(
            sourceCharacter.attribs
                .filter((e) => this.classOrMulticlass(e.name))
                .map((e) => {
                    return {
                        name: this.capitalize(e.current),
                        type: this.baseOrMulti(e.name),
                        level: this.getLevel(e, sourceCharacter),
                        arch: this.getSubclass(e, sourceCharacter)
                    };
                }),
            actor
        );

        await this.addSpecies(sourceCharacter.attribs.find((e) => e.name == "race").current, actor);

        await this.addBackground(sourceCharacter.attribs.find((e) => e.name == "background").current, actor);

        await this.addPowers(
            sourceCharacter.attribs
                .filter((e) => e.name.search(/repeating_power.+_powername/g) != -1)
                .map((e) => e.current),
            actor
        );

        await this.addItems(
            sourceCharacter.attribs
                .filter((e) => e.name.search(/repeating_(?:inventory|traits).+_(?:item)?name/g) != -1)
                .map((item) => {
                    const id = item.name.match(/-\w{19}/g);
                    return {
                        name: item.current,
                        quantity:
                            sourceCharacter.attribs.find((e) => e.name === `repeating_inventory_${id}_itemcount`)
                                ?.current ?? 1
                    };
                }),
            actor
        );
    }

    static async addClasses(classes, actor) {
        const classesPack = await game.packs.get("sw5e.classes").getDocuments();
        const archetypesPack = await game.packs.get("sw5e.archetypes").getDocuments();

        // Make sure the base class is added first
        const firstClassIdx = classes.findIndex((cls) => cls.type === "base_class");
        const firstClass = classes.splice(firstClassIdx, 1)[0];
        classes.unshift(firstClass);

        for (const cls of classes) {
            const compendiumClass = classesPack.find((o) => o.name === cls.name);
            if (compendiumClass) {
                const createdClass = (await actor.createEmbeddedDocuments("Item", [compendiumClass.system]))[0];
                await createdClass.update({"system.levels": cls.level});
            }
            const compendiumArch = archetypesPack.find((o) => o.name === cls.arch);
            if (compendiumArch) {
                await actor.createEmbeddedDocuments("Item", [compendiumArch.system]);
            }
        }
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
            let result = sourceCharacter.attribs.find((e) => e.name === "base_level")?.current;
            return parseInt(result);
        } else {
            let result = sourceCharacter.attribs.find((e) => e.name === `${item.name}_lvl`)?.current;
            return parseInt(result);
        }
    }

    static getSubclass(item, sourceCharacter) {
        if (item.name === "class") {
            let result = sourceCharacter.attribs.find((e) => e.name === "subclass")?.current;
            return result;
        } else {
            let result = sourceCharacter.attribs.find((e) => e.name === `${item.name}_subclass`)?.current;
            return result;
        }
    }

    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static async addSpecies(race, actor) {
        const species = await game.packs.get("sw5e.species").getDocuments();
        const assignedSpecies = species.find((c) => c.name === race);
        const activeEffects = [...assignedSpecies.system.effects][0].system.changes;
        const actorData = {system: {abilities: {...actor.system.abilities}}};

        activeEffects.map((effect) => {
            switch (effect.key) {
                case "system.abilities.str.value":
                    actorData.system.abilities.str.value -= effect.value;
                    break;

                case "system.abilities.dex.value":
                    actorData.system.abilities.dex.value -= effect.value;
                    break;

                case "system.abilities.con.value":
                    actorData.system.abilities.con.value -= effect.value;
                    break;

                case "system.abilities.int.value":
                    actorData.system.abilities.int.value -= effect.value;
                    break;

                case "system.abilities.wis.value":
                    actorData.system.abilities.wis.value -= effect.value;
                    break;

                case "system.abilities.cha.value":
                    actorData.system.abilities.cha.value -= effect.value;
                    break;

                default:
                    break;
            }
        });

        await actor.update(actorData);

        await actor.createEmbeddedDocuments("Item", [assignedSpecies.system]);
    }

    static async addBackground(bg, actor) {
        const bgs = await game.packs.get("sw5e.backgrounds").getDocuments();
        const packBg = bgs.find((c) => c.name === bg);
        if (packBg) {
            await actor.createEmbeddedDocuments("Item", [packBg.system]);
        }
    }

    static async addPowers(powers, actor) {
        const forcePowers = await game.packs.get("sw5e.forcepowers").getDocuments();
        const techPowers = await game.packs.get("sw5e.techpowers").getDocuments();

        for (const power of powers) {
            const createdPower = forcePowers.find((c) => c.name === power) || techPowers.find((c) => c.name === power);

            if (createdPower) {
                await actor.createEmbeddedDocuments("Item", [createdPower.system]);
            }
        }
    }

    static async addItems(items, actor) {
        const packItems = [
            ...(await game.packs.get("sw5e.lightweapons").getDocuments()),
            ...(await game.packs.get("sw5e.vibroweapons").getDocuments()),
            ...(await game.packs.get("sw5e.blasters").getDocuments()),
            ...(await game.packs.get("sw5e.armor").getDocuments()),
            ...(await game.packs.get("sw5e.adventuringgear").getDocuments()),
            ...(await game.packs.get("sw5e.ammo").getDocuments()),
            ...(await game.packs.get("sw5e.archetypes").getDocuments()),
            ...(await game.packs.get("sw5e.implements").getDocuments()),
            ...(await game.packs.get("sw5e.backgrounds").getDocuments()),
            ...(await game.packs.get("sw5e.invocations").getDocuments()),
            ...(await game.packs.get("sw5e.consumables").getDocuments()),
            ...(await game.packs.get("sw5e.enhanceditems").getDocuments()),
            ...(await game.packs.get("sw5e.explosives").getDocuments()),
            ...(await game.packs.get("sw5e.feats").getDocuments()),
            ...(await game.packs.get("sw5e.fightingstyles").getDocuments()),
            ...(await game.packs.get("sw5e.fightingmasteries").getDocuments()),
            ...(await game.packs.get("sw5e.gamingsets").getDocuments()),
            ...(await game.packs.get("sw5e.lightsaberform").getDocuments()),
            ...(await game.packs.get("sw5e.modifications").getDocuments()),
            ...(await game.packs.get("sw5e.kits").getDocuments()),
            ...(await game.packs.get("sw5e.maneuvers").getDocuments())
        ];

        for (const item of items) {
            const packItem = packItems.find((c) => c.name.toLowerCase() === item.name.toLowerCase());

            if (packItem) {
                if (item.quantity != 1) {
                    packItem.system.quantity = item.quantity;
                }

                await actor.createEmbeddedDocuments("Item", [packItem.system]);
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
