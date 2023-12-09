import ArchetypeData from "./archetype.mjs";
import BackgroundData from "./background.mjs";
import ClassData from "./class.mjs";
import ConsumableData from "./consumable.mjs";
import ContainerData from "./container.mjs";
import DeploymentData from "./deployment.mjs";
import EquipmentData from "./equipment.mjs";
import FeatData from "./feat.mjs";
import LootData from "./loot.mjs";
import ManeuverData from "./maneuver.mjs";
import ModificationData from "./modification.mjs";
import PowerData from "./power.mjs";
import SpeciesData from "./species.mjs";
import StarshipModData from "./starshipmod.mjs";
import StarshipSizeData from "./starship-size.mjs";
import ToolData from "./tool.mjs";
import WeaponData from "./weapon.mjs";

export {
  ArchetypeData,
  BackgroundData,
  ClassData,
  DeploymentData,
  ConsumableData,
  ContainerData,
  EquipmentData,
  FeatData,
  LootData,
  ManeuverData,
  ModificationData,
  PowerData,
  SpeciesData,
  StarshipModData,
  StarshipSizeData,
  ToolData,
  WeaponData
};
export { default as ActionTemplate } from "./templates/action.mjs";
export { default as ActivatedEffectTemplate } from "./templates/activated-effect.mjs";
export { default as EquippableItemTemplate } from "./templates/equippable-item.mjs";
export { default as ItemDescriptionTemplate } from "./templates/item-description.mjs";
export { default as MountableTemplate } from "./templates/mountable.mjs";
export { default as PhysicalItemTemplate } from "./templates/physical-item.mjs";

export const config = {
  archetype: ArchetypeData,
  background: BackgroundData,
  backpack: ContainerData,
  class: ClassData,
  consumable: ConsumableData,
  deployment: DeploymentData,
  equipment: EquipmentData,
  feat: FeatData,
  loot: LootData,
  modification: ModificationData,
  maneuver: ManeuverData,
  power: PowerData,
  tool: ToolData,
  species: SpeciesData,
  starshipmod: StarshipModData,
  starshipsize: StarshipSizeData,
  weapon: WeaponData
};
