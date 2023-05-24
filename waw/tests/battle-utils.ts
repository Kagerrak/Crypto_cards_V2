import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  BattleCancelled,
  BattleCreated,
  BattleEnded,
  DiceRolled,
  HealthUpdated,
  MoveSubmitted,
  NewBattle,
  OwnerUpdated,
  RoundEnded,
  StatusEffectsResolved
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

export function createDiceRolledEvent(diceNumber: BigInt): DiceRolled {
  let diceRolledEvent = changetype<DiceRolled>(newMockEvent())

  diceRolledEvent.parameters = new Array()

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
  move: i32
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

  return moveSubmittedEvent
}

export function createNewBattleEvent(
  battleName: string,
  battleId: BigInt,
  player1: Address,
  player2: Address
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
  damagedPlayers: Array<Address>
): RoundEnded {
  let roundEndedEvent = changetype<RoundEnded>(newMockEvent())

  roundEndedEvent.parameters = new Array()

  roundEndedEvent.parameters.push(
    new ethereum.EventParam(
      "damagedPlayers",
      ethereum.Value.fromAddressArray(damagedPlayers)
    )
  )

  return roundEndedEvent
}

export function createStatusEffectsResolvedEvent(
  character: Address,
  health: BigInt,
  attack: BigInt,
  defense: BigInt,
  isStunned: boolean,
  tookDamage: boolean
): StatusEffectsResolved {
  let statusEffectsResolvedEvent = changetype<StatusEffectsResolved>(
    newMockEvent()
  )

  statusEffectsResolvedEvent.parameters = new Array()

  statusEffectsResolvedEvent.parameters.push(
    new ethereum.EventParam("character", ethereum.Value.fromAddress(character))
  )
  statusEffectsResolvedEvent.parameters.push(
    new ethereum.EventParam("health", ethereum.Value.fromUnsignedBigInt(health))
  )
  statusEffectsResolvedEvent.parameters.push(
    new ethereum.EventParam("attack", ethereum.Value.fromUnsignedBigInt(attack))
  )
  statusEffectsResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "defense",
      ethereum.Value.fromUnsignedBigInt(defense)
    )
  )
  statusEffectsResolvedEvent.parameters.push(
    new ethereum.EventParam("isStunned", ethereum.Value.fromBoolean(isStunned))
  )
  statusEffectsResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "tookDamage",
      ethereum.Value.fromBoolean(tookDamage)
    )
  )

  return statusEffectsResolvedEvent
}
