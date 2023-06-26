import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Approval,
  ApprovalForAll,
  CharacterRecoveryStats,
  CharacterStatsEvent,
  CharacterStatsUpdated,
  CharacterXPUpdated,
  ClassEquipped,
  ClassUnequipped,
  ContractURIUpdated,
  DefaultRoyalty,
  ItemEquipped,
  ItemUnequipped,
  ManaUpdated,
  NewCharacter,
  OperatorRestriction,
  OwnerUpdated,
  RoyaltyForToken,
  SkillEquipped,
  SkillUnequipped,
  StaminaUpdated,
  Transfer
} from "../generated/Character/Character"

export function createApprovalEvent(
  owner: Address,
  approved: Address,
  tokenId: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromAddress(approved))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return approvalEvent
}

export function createApprovalForAllEvent(
  owner: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createCharacterRecoveryStatsEvent(
  tokenId: BigInt,
  stamina: BigInt,
  maxMana: BigInt,
  lastStaminaUpdateTime: BigInt,
  lastManaUpdateTime: BigInt
): CharacterRecoveryStats {
  let characterRecoveryStatsEvent = changetype<CharacterRecoveryStats>(
    newMockEvent()
  )

  characterRecoveryStatsEvent.parameters = new Array()

  characterRecoveryStatsEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  characterRecoveryStatsEvent.parameters.push(
    new ethereum.EventParam(
      "stamina",
      ethereum.Value.fromUnsignedBigInt(stamina)
    )
  )
  characterRecoveryStatsEvent.parameters.push(
    new ethereum.EventParam(
      "maxMana",
      ethereum.Value.fromUnsignedBigInt(maxMana)
    )
  )
  characterRecoveryStatsEvent.parameters.push(
    new ethereum.EventParam(
      "lastStaminaUpdateTime",
      ethereum.Value.fromUnsignedBigInt(lastStaminaUpdateTime)
    )
  )
  characterRecoveryStatsEvent.parameters.push(
    new ethereum.EventParam(
      "lastManaUpdateTime",
      ethereum.Value.fromUnsignedBigInt(lastManaUpdateTime)
    )
  )

  return characterRecoveryStatsEvent
}

export function createCharacterStatsEventEvent(
  tokenId: BigInt,
  level: BigInt,
  experience: BigInt,
  health: BigInt,
  mana: BigInt,
  attack: BigInt,
  defense: BigInt,
  strength: BigInt,
  dexterity: BigInt,
  intelligence: BigInt,
  vitality: BigInt,
  accuracy: BigInt,
  statPoints: BigInt
): CharacterStatsEvent {
  let characterStatsEventEvent = changetype<CharacterStatsEvent>(newMockEvent())

  characterStatsEventEvent.parameters = new Array()

  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam("level", ethereum.Value.fromUnsignedBigInt(level))
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "experience",
      ethereum.Value.fromUnsignedBigInt(experience)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam("health", ethereum.Value.fromUnsignedBigInt(health))
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam("mana", ethereum.Value.fromUnsignedBigInt(mana))
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam("attack", ethereum.Value.fromUnsignedBigInt(attack))
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "defense",
      ethereum.Value.fromUnsignedBigInt(defense)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "strength",
      ethereum.Value.fromUnsignedBigInt(strength)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "dexterity",
      ethereum.Value.fromUnsignedBigInt(dexterity)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "intelligence",
      ethereum.Value.fromUnsignedBigInt(intelligence)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "vitality",
      ethereum.Value.fromUnsignedBigInt(vitality)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "accuracy",
      ethereum.Value.fromUnsignedBigInt(accuracy)
    )
  )
  characterStatsEventEvent.parameters.push(
    new ethereum.EventParam(
      "statPoints",
      ethereum.Value.fromUnsignedBigInt(statPoints)
    )
  )

  return characterStatsEventEvent
}

export function createCharacterStatsUpdatedEvent(
  tokenId: BigInt,
  strength: BigInt,
  dexterity: BigInt,
  intelligence: BigInt,
  vitality: BigInt
): CharacterStatsUpdated {
  let characterStatsUpdatedEvent = changetype<CharacterStatsUpdated>(
    newMockEvent()
  )

  characterStatsUpdatedEvent.parameters = new Array()

  characterStatsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  characterStatsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "strength",
      ethereum.Value.fromUnsignedBigInt(strength)
    )
  )
  characterStatsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "dexterity",
      ethereum.Value.fromUnsignedBigInt(dexterity)
    )
  )
  characterStatsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "intelligence",
      ethereum.Value.fromUnsignedBigInt(intelligence)
    )
  )
  characterStatsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "vitality",
      ethereum.Value.fromUnsignedBigInt(vitality)
    )
  )

  return characterStatsUpdatedEvent
}

export function createCharacterXPUpdatedEvent(
  tokenId: BigInt,
  xp: BigInt
): CharacterXPUpdated {
  let characterXpUpdatedEvent = changetype<CharacterXPUpdated>(newMockEvent())

  characterXpUpdatedEvent.parameters = new Array()

  characterXpUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  characterXpUpdatedEvent.parameters.push(
    new ethereum.EventParam("xp", ethereum.Value.fromUnsignedBigInt(xp))
  )

  return characterXpUpdatedEvent
}

export function createClassEquippedEvent(
  characterTokenId: BigInt,
  classId: BigInt
): ClassEquipped {
  let classEquippedEvent = changetype<ClassEquipped>(newMockEvent())

  classEquippedEvent.parameters = new Array()

  classEquippedEvent.parameters.push(
    new ethereum.EventParam(
      "characterTokenId",
      ethereum.Value.fromUnsignedBigInt(characterTokenId)
    )
  )
  classEquippedEvent.parameters.push(
    new ethereum.EventParam(
      "classId",
      ethereum.Value.fromUnsignedBigInt(classId)
    )
  )

  return classEquippedEvent
}

export function createClassUnequippedEvent(
  characterTokenId: BigInt,
  classId: BigInt
): ClassUnequipped {
  let classUnequippedEvent = changetype<ClassUnequipped>(newMockEvent())

  classUnequippedEvent.parameters = new Array()

  classUnequippedEvent.parameters.push(
    new ethereum.EventParam(
      "characterTokenId",
      ethereum.Value.fromUnsignedBigInt(characterTokenId)
    )
  )
  classUnequippedEvent.parameters.push(
    new ethereum.EventParam(
      "classId",
      ethereum.Value.fromUnsignedBigInt(classId)
    )
  )

  return classUnequippedEvent
}

export function createContractURIUpdatedEvent(
  prevURI: string,
  newURI: string
): ContractURIUpdated {
  let contractUriUpdatedEvent = changetype<ContractURIUpdated>(newMockEvent())

  contractUriUpdatedEvent.parameters = new Array()

  contractUriUpdatedEvent.parameters.push(
    new ethereum.EventParam("prevURI", ethereum.Value.fromString(prevURI))
  )
  contractUriUpdatedEvent.parameters.push(
    new ethereum.EventParam("newURI", ethereum.Value.fromString(newURI))
  )

  return contractUriUpdatedEvent
}

export function createDefaultRoyaltyEvent(
  newRoyaltyRecipient: Address,
  newRoyaltyBps: BigInt
): DefaultRoyalty {
  let defaultRoyaltyEvent = changetype<DefaultRoyalty>(newMockEvent())

  defaultRoyaltyEvent.parameters = new Array()

  defaultRoyaltyEvent.parameters.push(
    new ethereum.EventParam(
      "newRoyaltyRecipient",
      ethereum.Value.fromAddress(newRoyaltyRecipient)
    )
  )
  defaultRoyaltyEvent.parameters.push(
    new ethereum.EventParam(
      "newRoyaltyBps",
      ethereum.Value.fromUnsignedBigInt(newRoyaltyBps)
    )
  )

  return defaultRoyaltyEvent
}

export function createItemEquippedEvent(
  characterTokenId: BigInt,
  itemTokenId: BigInt
): ItemEquipped {
  let itemEquippedEvent = changetype<ItemEquipped>(newMockEvent())

  itemEquippedEvent.parameters = new Array()

  itemEquippedEvent.parameters.push(
    new ethereum.EventParam(
      "characterTokenId",
      ethereum.Value.fromUnsignedBigInt(characterTokenId)
    )
  )
  itemEquippedEvent.parameters.push(
    new ethereum.EventParam(
      "itemTokenId",
      ethereum.Value.fromUnsignedBigInt(itemTokenId)
    )
  )

  return itemEquippedEvent
}

export function createItemUnequippedEvent(
  characterTokenId: BigInt,
  itemTokenId: BigInt
): ItemUnequipped {
  let itemUnequippedEvent = changetype<ItemUnequipped>(newMockEvent())

  itemUnequippedEvent.parameters = new Array()

  itemUnequippedEvent.parameters.push(
    new ethereum.EventParam(
      "characterTokenId",
      ethereum.Value.fromUnsignedBigInt(characterTokenId)
    )
  )
  itemUnequippedEvent.parameters.push(
    new ethereum.EventParam(
      "itemTokenId",
      ethereum.Value.fromUnsignedBigInt(itemTokenId)
    )
  )

  return itemUnequippedEvent
}

export function createManaUpdatedEvent(
  tokenId: BigInt,
  mana: BigInt
): ManaUpdated {
  let manaUpdatedEvent = changetype<ManaUpdated>(newMockEvent())

  manaUpdatedEvent.parameters = new Array()

  manaUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  manaUpdatedEvent.parameters.push(
    new ethereum.EventParam("mana", ethereum.Value.fromUnsignedBigInt(mana))
  )

  return manaUpdatedEvent
}

export function createNewCharacterEvent(
  player: Address,
  tokenId: BigInt,
  typeId: BigInt
): NewCharacter {
  let newCharacterEvent = changetype<NewCharacter>(newMockEvent())

  newCharacterEvent.parameters = new Array()

  newCharacterEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  newCharacterEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  newCharacterEvent.parameters.push(
    new ethereum.EventParam("typeId", ethereum.Value.fromUnsignedBigInt(typeId))
  )

  return newCharacterEvent
}

export function createOperatorRestrictionEvent(
  restriction: boolean
): OperatorRestriction {
  let operatorRestrictionEvent = changetype<OperatorRestriction>(newMockEvent())

  operatorRestrictionEvent.parameters = new Array()

  operatorRestrictionEvent.parameters.push(
    new ethereum.EventParam(
      "restriction",
      ethereum.Value.fromBoolean(restriction)
    )
  )

  return operatorRestrictionEvent
}

export function createOwnerUpdatedEvent(
  prevOwner: Address,
  newOwner: Address
): OwnerUpdated {
  let ownerUpdatedEvent = changetype<OwnerUpdated>(newMockEvent())

  ownerUpdatedEvent.parameters = new Array()

  ownerUpdatedEvent.parameters.push(
    new ethereum.EventParam("prevOwner", ethereum.Value.fromAddress(prevOwner))
  )
  ownerUpdatedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownerUpdatedEvent
}

export function createRoyaltyForTokenEvent(
  tokenId: BigInt,
  royaltyRecipient: Address,
  royaltyBps: BigInt
): RoyaltyForToken {
  let royaltyForTokenEvent = changetype<RoyaltyForToken>(newMockEvent())

  royaltyForTokenEvent.parameters = new Array()

  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "royaltyRecipient",
      ethereum.Value.fromAddress(royaltyRecipient)
    )
  )
  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "royaltyBps",
      ethereum.Value.fromUnsignedBigInt(royaltyBps)
    )
  )

  return royaltyForTokenEvent
}

export function createSkillEquippedEvent(
  characterTokenId: BigInt,
  skillId: BigInt
): SkillEquipped {
  let skillEquippedEvent = changetype<SkillEquipped>(newMockEvent())

  skillEquippedEvent.parameters = new Array()

  skillEquippedEvent.parameters.push(
    new ethereum.EventParam(
      "characterTokenId",
      ethereum.Value.fromUnsignedBigInt(characterTokenId)
    )
  )
  skillEquippedEvent.parameters.push(
    new ethereum.EventParam(
      "skillId",
      ethereum.Value.fromUnsignedBigInt(skillId)
    )
  )

  return skillEquippedEvent
}

export function createSkillUnequippedEvent(
  characterTokenId: BigInt,
  skillId: BigInt
): SkillUnequipped {
  let skillUnequippedEvent = changetype<SkillUnequipped>(newMockEvent())

  skillUnequippedEvent.parameters = new Array()

  skillUnequippedEvent.parameters.push(
    new ethereum.EventParam(
      "characterTokenId",
      ethereum.Value.fromUnsignedBigInt(characterTokenId)
    )
  )
  skillUnequippedEvent.parameters.push(
    new ethereum.EventParam(
      "skillId",
      ethereum.Value.fromUnsignedBigInt(skillId)
    )
  )

  return skillUnequippedEvent
}

export function createStaminaUpdatedEvent(
  tokenId: BigInt,
  stamina: BigInt
): StaminaUpdated {
  let staminaUpdatedEvent = changetype<StaminaUpdated>(newMockEvent())

  staminaUpdatedEvent.parameters = new Array()

  staminaUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  staminaUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "stamina",
      ethereum.Value.fromUnsignedBigInt(stamina)
    )
  )

  return staminaUpdatedEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  tokenId: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return transferEvent
}
