import {
  NewItem as NewItemEvent,
  UpdatedItem as UpdatedItemEvent,
} from "../generated/ItemContract/ItemContract";
import { Item } from "../generated/schema";

export function handleNewItem(event: NewItemEvent): void {
  let entity = new Item(event.params.itemId.toString());

  entity.id = event.params.itemId.toString();
  entity.name = event.params.name;
  entity.attack = event.params.attack;
  entity.defense = event.params.defense;
  entity.health = event.params.health;
  entity.mana = event.params.mana;
  entity.skill = event.params.skill;
  entity.itemType = event.params.itemType.toString();

  entity.save();
}

export function handleUpdatedItem(event: UpdatedItemEvent): void {
  let itemId = event.params.itemId.toString();
  let entity = Item.load(itemId);
  if (entity == null) {
    entity = new Item(itemId);
  }
  entity.name = event.params.name;
  entity.attack = event.params.attack;
  entity.defense = event.params.defense;
  entity.health = event.params.health;
  entity.mana = event.params.mana;
  entity.skill = event.params.skill;

  entity.save();
}
