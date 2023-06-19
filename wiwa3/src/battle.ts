import {
  BattleCancelled as BattleCancelledEvent,
  BattleCreated as BattleCreatedEvent,
  BattleEnded as BattleEndedEvent,
  BattleQuit as BattleQuitEvent,
  CharacterProxyData as CharacterProxyDataEvent,
  DiceRolled as DiceRolledEvent,
  HealthUpdated as HealthUpdatedEvent,
  MoveSubmitted as MoveSubmittedEvent,
  NewBattle as NewBattleEvent,
  OwnerUpdated as OwnerUpdatedEvent,
  RoundEnded as RoundEndedEvent,
  SkillExecuted as SkillExecutedEvent,
  StatusEffectApplied as StatusEffectAppliedEvent,
  StatusEffectResolved as StatusEffectResolvedEvent,
} from "../generated/Battle/Battle";
import {
  Player,
  Character,
  Battle,
  Round,
  Move,
  StatusEffect,
  HealthUpdated,
  MoveSubmitted,
  NewBattle,
  OwnerUpdated,
  RoundEnded,
  SkillExecuted,
  StatusEffectApplied,
  StatusEffectResolved,
} from "../generated/schema";

export function handleBattleCancelled(event: BattleCancelledEvent): void {
  let entity = new BattleCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.player = event.params.player;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBattleCreated(event: BattleCreatedEvent): void {
  let entity = new BattleCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.creator = event.params.creator;
  entity.characterId = event.params.characterId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBattleEnded(event: BattleEndedEvent): void {
  let entity = new BattleEnded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleName = event.params.battleName;
  entity.battleId = event.params.battleId;
  entity.winner = event.params.winner;
  entity.loser = event.params.loser;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleBattleQuit(event: BattleQuitEvent): void {
  let entity = new BattleQuit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.round = event.params.round;
  entity.quitter = event.params.quitter;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleCharacterProxyData(event: CharacterProxyDataEvent): void {
  let entity = new CharacterProxyData(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.player = event.params.player;
  entity.Battle_id = event.params.id;
  entity.owner = event.params.owner;
  entity.health = event.params.health;
  entity.attack = event.params.attack;
  entity.defense = event.params.defense;
  entity.mana = event.params.mana;
  entity.typeId = event.params.typeId;
  entity.equippedSkills = event.params.equippedSkills;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleDiceRolled(event: DiceRolledEvent): void {
  let entity = new DiceRolled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.player = event.params.player;
  entity.round = event.params.round;
  entity.diceNumber = event.params.diceNumber;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleHealthUpdated(event: HealthUpdatedEvent): void {
  let entity = new HealthUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.player1 = event.params.player1;
  entity.health1 = event.params.health1;
  entity.player2 = event.params.player2;
  entity.health2 = event.params.health2;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMoveSubmitted(event: MoveSubmittedEvent): void {
  let entity = new MoveSubmitted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.player = event.params.player;
  entity.move = event.params.move;
  entity.round = event.params.round;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleNewBattle(event: NewBattleEvent): void {
  let entity = new NewBattle(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleName = event.params.battleName;
  entity.battleId = event.params.battleId;
  entity.player1 = event.params.player1;
  entity.player2 = event.params.player2;
  entity.characterId = event.params.characterId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnerUpdated(event: OwnerUpdatedEvent): void {
  let entity = new OwnerUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.prevOwner = event.params.prevOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleRoundEnded(event: RoundEndedEvent): void {
  let entity = new RoundEnded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.damagedPlayers = event.params.damagedPlayers;
  entity.damageDealt = event.params.damageDealt;
  entity.damageTaken = event.params.damageTaken;
  entity.round = event.params.round;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleSkillExecuted(event: SkillExecutedEvent): void {
  let entity = new SkillExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.round = event.params.round;
  entity.player = event.params.player;
  entity.skillName = event.params.skillName;
  entity.totalDamage = event.params.totalDamage;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleStatusEffectApplied(
  event: StatusEffectAppliedEvent
): void {
  let entity = new StatusEffectApplied(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.round = event.params.round;
  entity.character = event.params.character;
  entity.statusEffectName = event.params.statusEffectName;
  entity.duration = event.params.duration;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleStatusEffectResolved(
  event: StatusEffectResolvedEvent
): void {
  let entity = new StatusEffectResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.battleId = event.params.battleId;
  entity.player = event.params.player;
  entity.effectId = event.params.effectId;
  entity.effectName = event.params.effectName;
  entity.effectType = event.params.effectType;
  entity.effectValue = event.params.effectValue;
  entity.round = event.params.round;
  entity.duration = event.params.duration;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
