import { BigInt, log, Address } from "@graphprotocol/graph-ts";
import {
  CharacterRecoveryStats as CharacterRecoveryStatsEvent,
  CharacterStatsEvent as CharacterStatsEventEvent,
  CharacterStatsUpdated as CharacterStatsUpdatedEvent,
  CharacterXPUpdated as CharacterXPUpdatedEvent,
  ItemEquipped as ItemEquippedEvent,
  ItemUnequipped as ItemUnequippedEvent,
  ManaUpdated as ManaUpdatedEvent,
  NewCharacter as NewCharacterEvent,
  SkillEquipped as SkillEquippedEvent,
  SkillUnequipped as SkillUnequippedEvent,
  StaminaUpdated as StaminaUpdatedEvent,
} from "../generated/Character/Character";
import {
  Character as CharacterEntity,
  Player as PlayerEntity,
  CharacterSkill as CharacterSkillEntity,
  CharacterItem as CharacterItemEntity,
} from "../generated/schema";

export function handleNewCharacter(event: NewCharacterEvent): void {
  // Load the Player entity
  let player = PlayerEntity.load(event.params.player.toHexString());

  // If the Player entity does not exist, create it
  if (player == null) {
    player = new PlayerEntity(event.params.player.toHexString());

    // Initialize the Player entity's fields
    player.totalDamageDealt = BigInt.fromI32(0);
    player.totalDamageTaken = BigInt.fromI32(0);
    player.wins = 0;
    player.losses = 0;

    // Save the Player entity
    player.save();
  }

  // Create a new Character entity
  let character = new CharacterEntity(event.params.tokenId.toString());

  // Initialize all non-nullable fields
  character.typeId = event.params.typeId;
  character.owner = player.id;
  character.totalDamageDealt = BigInt.fromI32(0);
  character.totalDamageTaken = BigInt.fromI32(0);
  character.health = BigInt.fromI32(0);
  character.mana = BigInt.fromI32(0);
  character.attack = BigInt.fromI32(0);
  character.defense = BigInt.fromI32(0);
  character.strength = BigInt.fromI32(0);
  character.dexterity = BigInt.fromI32(0);
  character.intelligence = BigInt.fromI32(0);
  character.vitality = BigInt.fromI32(0);
  character.accuracy = BigInt.fromI32(0);
  character.statPoints = BigInt.fromI32(0);
  character.stamina = BigInt.fromI32(0);
  character.maxMana = BigInt.fromI32(0);
  character.lastStaminaUpdateTime = BigInt.fromI32(0);
  character.lastManaUpdateTime = BigInt.fromI32(0);
  character.experience = BigInt.fromI32(0); // Initialize experience to 0
  character.level = BigInt.fromI32(1); // Initialize level to 1
  character.wins = 0;
  character.losses = 0;

  // Save the Character entity
  character.save();
}

export function handleCharacterStatsEvent(
  event: CharacterStatsEventEvent
): void {
  // Load the Character entity
  let character = CharacterEntity.load(event.params.tokenId.toString());
  if (character == null) {
    throw new Error("Character entity not found");
  }

  // Update the Character entity's fields
  character.level = event.params.level;
  character.experience = event.params.experience;
  character.health = event.params.health;
  character.mana = event.params.mana;
  character.attack = event.params.attack;
  character.defense = event.params.defense;
  character.strength = event.params.strength;
  character.dexterity = event.params.dexterity;
  character.intelligence = event.params.intelligence;
  character.vitality = event.params.vitality;
  character.accuracy = event.params.accuracy;
  character.statPoints = event.params.statPoints;

  // Save the Character entity
  character.save();
}

export function handleCharacterRecoveryStats(
  event: CharacterRecoveryStatsEvent
): void {
  // Load the Character entity
  let character = CharacterEntity.load(event.params.tokenId.toString());
  if (character == null) {
    throw new Error("Character entity not found");
  }

  // Update the Character entity's fields
  character.stamina = event.params.stamina;
  character.maxMana = event.params.maxMana;
  character.lastStaminaUpdateTime = event.params.lastStaminaUpdateTime;
  character.lastManaUpdateTime = event.params.lastManaUpdateTime;

  // Save the Character entity
  character.save();
}

export function handleCharacterStatsUpdated(
  event: CharacterStatsUpdatedEvent
): void {
  // Load the Character entity
  let character = CharacterEntity.load(event.params.tokenId.toString());

  // If the Character entity does not exist, create it
  if (character == null) {
    character = new CharacterEntity(event.params.tokenId.toString());
  }

  // Update the Character entity's fields
  character.strength = event.params.strength;
  character.dexterity = event.params.dexterity;
  character.intelligence = event.params.intelligence;
  character.vitality = event.params.vitality;

  // Save the Character entity
  character.save();
}

export function handleCharacterXPUpdated(event: CharacterXPUpdatedEvent): void {
  // Load or create the Character entity
  let character = CharacterEntity.load(event.params.tokenId.toHexString());
  if (character == null) {
    character = new CharacterEntity(event.params.tokenId.toString());
  }

  // Update the Character entity's fields
  character.experience = event.params.xp;

  // Save the Character entity
  character.save();
}

export function handleItemEquipped(event: ItemEquippedEvent): void {
  // Create a new CharacterItem entity
  let characterItem = new CharacterItemEntity(
    event.params.characterTokenId.toString() +
      "-" +
      event.params.itemTokenId.toString()
  );

  // Update the CharacterItem entity's fields
  characterItem.character = event.params.characterTokenId.toString();
  characterItem.item = event.params.itemTokenId.toString();
  characterItem.quantity = BigInt.fromI32(1); // Assuming each equip event represents a single item

  // Save the CharacterItem entity
  characterItem.save();
}
export function handleItemUnequipped(event: ItemUnequippedEvent): void {
  // Load the CharacterItem entity
  let characterItem = CharacterItemEntity.load(
    event.params.characterTokenId.toString() +
      "-" +
      event.params.itemTokenId.toString()
  );

  // Decrease the quantity of the item
  if (characterItem != null) {
    characterItem.quantity = characterItem.quantity.minus(BigInt.fromI32(1));

    // If the quantity is not 0, save the updated entity
    if (!characterItem.quantity.equals(BigInt.fromI32(0))) {
      characterItem.save();
    }
  }
}

export function handleManaUpdated(event: ManaUpdatedEvent): void {
  // Load the Character entity
  let character = CharacterEntity.load(event.params.tokenId.toString());

  // If the Character entity does not exist, create it
  if (character == null) {
    character = new CharacterEntity(event.params.tokenId.toString());
  }

  // Update the Character entity's mana field
  character.mana = event.params.mana;

  // Save the Character entity
  character.save();
}

export function handleSkillEquipped(event: SkillEquippedEvent): void {
  // Create a new CharacterSkill entity
  let characterSkill = new CharacterSkillEntity(
    event.params.characterTokenId.toString() +
      "-" +
      event.params.skillId.toString()
  );

  // Update the CharacterSkill entity's fields
  characterSkill.character = event.params.characterTokenId.toString();
  characterSkill.skill = event.params.skillId.toString();
  characterSkill.quantity = BigInt.fromI32(1); // Assuming each equip event represents a single skill

  // Save the CharacterSkill entity
  characterSkill.save();
}

export function handleSkillUnequipped(event: SkillUnequippedEvent): void {
  // Load the CharacterSkill entity
  let characterSkill = CharacterSkillEntity.load(
    event.params.characterTokenId.toString() +
      "-" +
      event.params.skillId.toString()
  );

  // Decrease the quantity of the skill
  if (characterSkill != null) {
    characterSkill.quantity = characterSkill.quantity.minus(BigInt.fromI32(1));

    // If the quantity is not 0, save the updated entity
    if (!characterSkill.quantity.equals(BigInt.fromI32(0))) {
      characterSkill.save();
    }
  }
}

export function handleStaminaUpdated(event: StaminaUpdatedEvent): void {
  // Load the Character entity
  let character = CharacterEntity.load(event.params.tokenId.toString());

  // If the Character entity does not exist, create it
  if (character == null) {
    character = new CharacterEntity(event.params.tokenId.toString());
  }

  // Update the Character entity's stamina field
  character.stamina = event.params.stamina;

  // Save the Character entity
  character.save();
}
