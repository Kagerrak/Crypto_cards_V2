import { BigInt } from "@graphprotocol/graph-ts";
import {
  BattleCancelled as BattleCancelledEvent,
  BattleCreated as BattleCreatedEvent,
  BattleEnded as BattleEndedEvent,
  DiceRolled as DiceRolledEvent,
  HealthUpdated as HealthUpdatedEvent,
  MoveSubmitted as MoveSubmittedEvent,
  NewBattle as NewBattleEvent,
  RoundEnded as RoundEndedEvent,
  StatusEffectsResolved as StatusEffectsResolvedEvent,
} from "../generated/Battle/Battle";
import { Player, Battle, Round, Move, StatusEffect } from "../generated/schema";

export function handleBattleCancelled(event: BattleCancelledEvent): void {
  let battle = Battle.load(event.params.battleId.toString());
  if (battle) {
    battle.status = "Cancelled";
    battle.save();
  }
}

export function handleBattleCreated(event: BattleCreatedEvent): void {
  let battle = new Battle(event.params.battleId.toString());
  battle.players = [event.params.creator.toHex()];
  battle.status = "Created";
  battle.save();
}

export function handleBattleEnded(event: BattleEndedEvent): void {
  let battle = Battle.load(event.params.battleId.toString());
  if (battle) {
    battle.status = "Ended";
    battle.winner = event.params.winner.toHex();
    battle.save();
  }
}

export function handleDiceRolled(event: DiceRolledEvent): void {
  // You might want to create a new entity to store dice roll results,
  // or you might want to add a field to the Battle or Move entities to store this information.
}

export function handleHealthUpdated(event: HealthUpdatedEvent): void {
  // You might want to create a new entity to store health updates,
  // or you might want to add fields to the Player or Battle entities to store this information.
}

export function handleMoveSubmitted(event: MoveSubmittedEvent): void {
  let move = new Move(event.params.battleId.toString());
  move.player = event.params.player.toHex();
  move.type = event.params.move.toString();
  move.save();
}

export function handleNewBattle(event: NewBattleEvent): void {
  let battle = Battle.load(event.params.battleId.toString());
  if (battle) {
    battle.players = [
      event.params.player1.toHex(),
      event.params.player2.toHex(),
    ];
    battle.save();
  }
}

export function handleRoundEnded(event: RoundEndedEvent): void {
  let round = new Round(event.params.battleId.toString());
  round.battle = event.params.battleId.toString();
  round.damagedPlayers = event.params.damagedPlayers.map((player) =>
    player.toHex()
  );
  round.save();
}

export function handleStatusEffectsResolved(
  event: StatusEffectsResolvedEvent
): void {
  let statusEffect = new StatusEffect(event.params.character.toHex());
  statusEffect.character = event.params.character.toHex();
  statusEffect.health = event.params.health;
  statusEffect.attack = event.params.attack;
  statusEffect.defense = event.params.defense;
  statusEffect.isStunned = event.params.isStunned;
  statusEffect.tookDamage = event.params.tookDamage;
  statusEffect.save();
}
