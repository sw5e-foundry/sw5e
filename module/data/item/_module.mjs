import BackgroundData from "./background.mjs";
import ClassData from "./class.mjs";
import ConsumableData from "./consumable.mjs";
import ContainerData from "./container.mjs";
import EquipmentData from "./equipment.mjs";
import FeatData from "./feat.mjs";
import LootData from "./loot.mjs";
import SpeciesData from "./species.mjs";
import PowerData from "./power.mjs";
import ArchetypeData from "./archetype.mjs";
import ToolData from "./tool.mjs";
import WeaponData from "./weapon.mjs";

export {
  BackgroundData,
  ClassData,
  ConsumableData,
  ContainerData,
  EquipmentData,
  FeatData,
  LootData,
  SpeciesData,
  PowerData,
  ArchetypeData,
  ToolData,
  WeaponData
};
export {default as ItemTypeField} from "./fields/item-type-field.mjs";
export {default as SummonsField, SummonsData} from "./fields/summons-field.mjs";
export {default as ActionTemplate} from "./templates/action.mjs";
export {default as ActivatedEffectTemplate} from "./templates/activated-effect.mjs";
export {default as EquippableItemTemplate} from "./templates/equippable-item.mjs";
export {default as IdentifiableTemplate} from "./templates/identifiable.mjs";
export {default as ItemDescriptionTemplate} from "./templates/item-description.mjs";
export {default as ItemTypeTemplate} from "./templates/item-type.mjs";
export {default as MountableTemplate} from "./templates/mountable.mjs";
export {default as PhysicalItemTemplate} from "./templates/physical-item.mjs";
export * as startingEquipment from "./templates/starting-equipment.mjs";

export const config = {
  background: BackgroundData,
  container: ContainerData,
  class: ClassData,
  consumable: ConsumableData,
  equipment: EquipmentData,
  feat: FeatData,
  loot: LootData,
  species: SpeciesData,
  power: PowerData,
  archetype: ArchetypeData,
  tool: ToolData,
  weapon: WeaponData
};
