import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  BattleCancelled,
  BattleCreated,
  BattleEnded,
  BattleQuit,
  CharacterProxyData,
  DiceRolled,
  HealthUpdated,
  MoveSubmitted,
  NewBattle,
  OwnerUpdated,
  RoundEnded,
  SkillExecuted,
  StatusEffectApplied,
  StatusEffectResolved
} from "../generated/Battle/Battle"

export function createBattleCancelledEvent(
  battleId: BigInt,
  player: Address
): BattleCancelled {
  let battleCancelledEvent = changetype<BattleCancelled>(newMockEvent())

  battleCancelledEvent.parameters = new Array()

  battleCancelledEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  battleCancelledEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )

  return battleCancelledEvent
}

export function createBattleCreatedEvent(
  battleId: BigInt,
  creator: Address,
  characterId: BigInt
): BattleCreated {
  let battleCreatedEvent = changetype<BattleCreated>(newMockEvent())

  battleCreatedEvent.parameters = new Array()

  battleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  battleCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  battleCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "characterId",
      ethereum.Value.fromUnsignedBigInt(characterId)
    )
  )

  return battleCreatedEvent
}

export function createBattleEndedEvent(
  battleName: string,
  battleId: BigInt,
  winner: Address,
  loser: Address
): BattleEnded {
  let battleEndedEvent = changetype<BattleEnded>(newMockEvent())

  battleEndedEvent.parameters = new Array()

  battleEndedEvent.parameters.push(
    new ethereum.EventParam("battleName", ethereum.Value.fromString(battleName))
  )
  battleEndedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  battleEndedEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner))
  )
  battleEndedEvent.parameters.push(
    new ethereum.EventParam("loser", ethereum.Value.fromAddress(loser))
  )

  return battleEndedEvent
}

export function createBattleQuitEvent(
  battleId: BigInt,
  round: BigInt,
  quitter: Address
): BattleQuit {
  let battleQuitEvent = changetype<BattleQuit>(newMockEvent())

  battleQuitEvent.parameters = new Array()

  battleQuitEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  battleQuitEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )
  battleQuitEvent.parameters.push(
    new ethereum.EventParam("quitter", ethereum.Value.fromAddress(quitter))
  )

  return battleQuitEvent
}

export function createCharacterProxyDataEvent(
  battleId: BigInt,
  player: Address,
  id: BigInt,
  owner: Address,
  health: BigInt,
  attack: BigInt,
  defense: BigInt,
  mana: BigInt,
  typeId: BigInt,
  equippedSkills: Array<BigInt>
): CharacterProxyData {
  let characterProxyDataEvent = changetype<CharacterProxyData>(newMockEvent())

  characterProxyDataEvent.parameters = new Array()

  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("health", ethereum.Value.fromUnsignedBigInt(health))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("attack", ethereum.Value.fromUnsignedBigInt(attack))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam(
      "defense",
      ethereum.Value.fromUnsignedBigInt(defense)
    )
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("mana", ethereum.Value.fromUnsignedBigInt(mana))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam("typeId", ethereum.Value.fromUnsignedBigInt(typeId))
  )
  characterProxyDataEvent.parameters.push(
    new ethereum.EventParam(
      "equippedSkills",
      ethereum.Value.fromUnsignedBigIntArray(equippedSkills)
    )
  )

  return characterProxyDataEvent
}

export function createDiceRolledEvent(
  battleId: BigInt,
  player: Address,
  round: BigInt,
  diceNumber: BigInt
): DiceRolled {
  let diceRolledEvent = changetype<DiceRolled>(newMockEvent())

  diceRolledEvent.parameters = new Array()

  diceRolledEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  diceRolledEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  diceRolledEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )
  diceRolledEvent.parameters.push(
    new ethereum.EventParam(
      "diceNumber",
      ethereum.Value.fromUnsignedBigInt(diceNumber)
    )
  )

  return diceRolledEvent
}

export function createHealthUpdatedEvent(
  battleId: BigInt,
  player1: Address,
  health1: BigInt,
  player2: Address,
  health2: BigInt
): HealthUpdated {
  let healthUpdatedEvent = changetype<HealthUpdated>(newMockEvent())

  healthUpdatedEvent.parameters = new Array()

  healthUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  healthUpdatedEvent.parameters.push(
    new ethereum.EventParam("player1", ethereum.Value.fromAddress(player1))
  )
  healthUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "health1",
      ethereum.Value.fromUnsignedBigInt(health1)
    )
  )
  healthUpdatedEvent.parameters.push(
    new ethereum.EventParam("player2", ethereum.Value.fromAddress(player2))
  )
  healthUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "health2",
      ethereum.Value.fromUnsignedBigInt(health2)
    )
  )

  return healthUpdatedEvent
}

export function createMoveSubmittedEvent(
  battleId: BigInt,
  player: Address,
  move: i32,
  round: BigInt
): MoveSubmitted {
  let moveSubmittedEvent = changetype<MoveSubmitted>(newMockEvent())

  moveSubmittedEvent.parameters = new Array()

  moveSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  moveSubmittedEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  moveSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "move",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(move))
    )
  )
  moveSubmittedEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )

  return moveSubmittedEvent
}

export function createNewBattleEvent(
  battleName: string,
  battleId: BigInt,
  player1: Address,
  player2: Address,
  characterId: BigInt
): NewBattle {
  let newBattleEvent = changetype<NewBattle>(newMockEvent())

  newBattleEvent.parameters = new Array()

  newBattleEvent.parameters.push(
    new ethereum.EventParam("battleName", ethereum.Value.fromString(battleName))
  )
  newBattleEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  newBattleEvent.parameters.push(
    new ethereum.EventParam("player1", ethereum.Value.fromAddress(player1))
  )
  newBattleEvent.parameters.push(
    new ethereum.EventParam("player2", ethereum.Value.fromAddress(player2))
  )
  newBattleEvent.parameters.push(
    new ethereum.EventParam(
      "characterId",
      ethereum.Value.fromUnsignedBigInt(characterId)
    )
  )

  return newBattleEvent
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

export function createRoundEndedEvent(
  battleId: BigInt,
  damagedPlayers: Array<Address>,
  damageDealt: Array<BigInt>,
  damageTaken: Array<BigInt>,
  round: BigInt
): RoundEnded {
  let roundEndedEvent = changetype<RoundEnded>(newMockEvent())

  roundEndedEvent.parameters = new Array()

  roundEndedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  roundEndedEvent.parameters.push(
    new ethereum.EventParam(
      "damagedPlayers",
      ethereum.Value.fromAddressArray(damagedPlayers)
    )
  )
  roundEndedEvent.parameters.push(
    new ethereum.EventParam(
      "damageDealt",
      ethereum.Value.fromUnsignedBigIntArray(damageDealt)
    )
  )
  roundEndedEvent.parameters.push(
    new ethereum.EventParam(
      "damageTaken",
      ethereum.Value.fromUnsignedBigIntArray(damageTaken)
    )
  )
  roundEndedEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )

  return roundEndedEvent
}

export function createSkillExecutedEvent(
  battleId: BigInt,
  round: BigInt,
  player: Address,
  skillId: BigInt,
  skillName: string,
  totalDamage: BigInt
): SkillExecuted {
  let skillExecutedEvent = changetype<SkillExecuted>(newMockEvent())

  skillExecutedEvent.parameters = new Array()

  skillExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  skillExecutedEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )
  skillExecutedEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  skillExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "skillId",
      ethereum.Value.fromUnsignedBigInt(skillId)
    )
  )
  skillExecutedEvent.parameters.push(
    new ethereum.EventParam("skillName", ethereum.Value.fromString(skillName))
  )
  skillExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "totalDamage",
      ethereum.Value.fromUnsignedBigInt(totalDamage)
    )
  )

  return skillExecutedEvent
}

export function createStatusEffectAppliedEvent(
  battleId: BigInt,
  round: BigInt,
  character: Address,
  statusEffectName: string,
  duration: BigInt
): StatusEffectApplied {
  let statusEffectAppliedEvent = changetype<StatusEffectApplied>(newMockEvent())

  statusEffectAppliedEvent.parameters = new Array()

  statusEffectAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  statusEffectAppliedEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )
  statusEffectAppliedEvent.parameters.push(
    new ethereum.EventParam("character", ethereum.Value.fromAddress(character))
  )
  statusEffectAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "statusEffectName",
      ethereum.Value.fromString(statusEffectName)
    )
  )
  statusEffectAppliedEvent.parameters.push(
    new ethereum.EventParam(
      "duration",
      ethereum.Value.fromUnsignedBigInt(duration)
    )
  )

  return statusEffectAppliedEvent
}

export function createStatusEffectResolvedEvent(
  battleId: BigInt,
  player: Address,
  effectId: BigInt,
  effectName: string,
  effectType: string,
  effectValue: BigInt,
  round: BigInt,
  duration: BigInt
): StatusEffectResolved {
  let statusEffectResolvedEvent = changetype<StatusEffectResolved>(
    newMockEvent()
  )

  statusEffectResolvedEvent.parameters = new Array()

  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "battleId",
      ethereum.Value.fromUnsignedBigInt(battleId)
    )
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "effectId",
      ethereum.Value.fromUnsignedBigInt(effectId)
    )
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam("effectName", ethereum.Value.fromString(effectName))
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam("effectType", ethereum.Value.fromString(effectType))
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "effectValue",
      ethereum.Value.fromUnsignedBigInt(effectValue)
    )
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam("round", ethereum.Value.fromUnsignedBigInt(round))
  )
  statusEffectResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "duration",
      ethereum.Value.fromUnsignedBigInt(duration)
    )
  )

  return statusEffectResolvedEvent
}
