import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  BattleCancelled as BattleCancelledEvent,
  BattleCreated as BattleCreatedEvent,
  BattleEnded as BattleEndedEvent,
  BattleQuit as BattleQuitEvent,
  CharacterProxyData as CharacterProxyDataEvent,
  DiceRolled as DiceRolledEvent,
  MoveSubmitted as MoveSubmittedEvent,
  NewBattle as NewBattleEvent,
  RoundEnded as RoundEndedEvent,
  SkillExecuted as SkillExecutedEvent,
  StatusEffectApplied as StatusEffectAppliedEvent,
  StatusEffectResolved as StatusEffectResolvedEvent,
} from "../generated/Battle/Battle";
import {
  Player,
  Battle,
  CharacterProxy,
  Character,
  Round,
  Move,
  ActiveEffect,
  Damage,
  Skill,
  StatusEffect,
} from "../generated/schema";

export function handleCharacterProxyData(event: CharacterProxyDataEvent): void {
  let characterProxyId =
    event.params.battleId.toString() + "-" + event.params.player.toHexString();

  let characterProxy = CharacterProxy.load(characterProxyId);
  if (characterProxy == null) {
    characterProxy = new CharacterProxy(characterProxyId);
  }

  let playerId = event.params.player.toHexString();
  log.info("Player ID: {}", [playerId]);
  let player = Player!.load(playerId);

  // Load the Character entity or create a new one if it doesn't exist
  let characterId = event.params.id.toString();
  let character = Character!.load(characterId);

  characterProxy.battleId = event.params.battleId;
  characterProxy.player = player!.id;
  characterProxy.character = character!.id; // Assign the Character entity to the character field
  characterProxy.owner = event.params.owner.toHexString();
  characterProxy.health = event.params.health;
  characterProxy.attack = event.params.attack;
  characterProxy.defense = event.params.defense;
  characterProxy.mana = event.params.mana;
  characterProxy.typeId = event.params.typeId;
  characterProxy.equippedSkills = event.params.equippedSkills;
  characterProxy.save();
}

export function handleBattleCreated(event: BattleCreatedEvent): void {
  let battleId = event.params.battleId.toString();

  let battle = Battle.load(battleId);
  if (battle == null) {
    battle = new Battle(battleId);
  }

  let creatorId = event.params.creator.toHexString();
  let creator = Player.load(creatorId);
  if (creator == null) {
    creator = new Player(creatorId);
    creator.totalDamageDealt = BigInt.fromI32(0);
    creator.totalDamageTaken = BigInt.fromI32(0);
    creator.wins = 0;
    creator.losses = 0;
    creator.save();
  }

  battle.name = "TBD";
  battle.creator = creator.id;
  battle.players = [creator.id]; // Assuming the creator is the first player
  battle.status = "Created"; // Assuming the status is "Created" when a battle is created
  battle.winner = null; // Initialize the winner field with null
  battle.loser = null; // Initialize the loser field with null
  battle.totalDamageDealt = [BigInt.fromI32(0)];
  battle.totalDamageTaken = [BigInt.fromI32(0)];
  battle.roundNumber = 1;

  // Assuming the characterId in the event is the ID of the character used by the creator
  let characterId = event.params.characterId.toString();
  let character = Character.load(characterId);
  if (character == null) {
    character = new Character(characterId);
    character.owner = creator.id;
    character.save();
  }

  let characterProxyId = battleId + "-" + creatorId;
  let characterProxy = CharacterProxy!.load(characterProxyId);

  battle.characters = [characterProxy!.id]; // This should be a string

  battle.save();
}

export function handleBattleCancelled(event: BattleCancelledEvent): void {
  let battleId = event.params.battleId.toString();

  let battle = Battle.load(battleId);
  if (battle != null) {
    battle.status = "Cancelled";
    battle.save();
  }
}

export function handleNewBattle(event: NewBattleEvent): void {
  let battleId = event.params.battleId.toString();

  let battle = Battle.load(battleId);
  if (battle == null) {
    battle = new Battle(battleId);
  }

  let player1Id = event.params.player1.toHexString();
  let player1 = Player.load(player1Id);
  if (player1 == null) {
    player1 = new Player(player1Id);
    player1.totalDamageDealt = BigInt.fromI32(0);
    player1.totalDamageTaken = BigInt.fromI32(0);
    player1.wins = 0;
    player1.losses = 0;
    player1.save();
  }

  let player2Id = event.params.player2.toHexString();
  let player2 = Player.load(player2Id);
  if (player2 == null) {
    player2 = new Player(player2Id);
    player2.totalDamageDealt = BigInt.fromI32(0);
    player2.totalDamageTaken = BigInt.fromI32(0);
    player2.wins = 0;
    player2.losses = 0;
    player2.save();
  }

  battle.name = event.params.battleName;
  battle.creator = player1.id;
  battle.players = [player1.id, player2.id];
  battle.status = "Created";
  battle.totalDamageDealt = [BigInt.fromI32(0), BigInt.fromI32(0)];
  battle.totalDamageTaken = [BigInt.fromI32(0), BigInt.fromI32(0)];
  battle.roundNumber = 1;

  battle.save();
}

export function handleMoveSubmitted(event: MoveSubmittedEvent): void {
  let battleId = event.params.battleId.toString();
  let roundId = battleId + "-" + event.params.round.toString();

  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.battle = battleId;
    round.damagedPlayers = [];
    round.skillsUsed = [];
    round.save();
  }

  let playerId = event.params.player.toHexString();
  let moveId = roundId + "-" + playerId;
  let move = Move.load(moveId);
  if (move == null) {
    move = new Move(moveId);
    move.round = roundId;
    move.player = playerId;
  }

  // Convert the Move enum value to a MoveType
  let moveType: string = "DO_NOTHING";
  switch (event.params.move) {
    case 0:
      moveType = "ATTACK";
      break;
    case 1:
      moveType = "DEFEND";
      break;
    case 2:
      moveType = "USE_SKILL";
      break;
    // case 3 is not necessary because moveType is already initialized as "DO_NOTHING"
  }
  move.moveType = moveType;

  // Set the attackMultiplier to 1000
  move.attackMultiplier = BigInt.fromI32(1000);

  move.save();
}

export function handleDiceRolled(event: DiceRolledEvent): void {
  let battleId = event.params.battleId.toString();
  let roundId = battleId + "-" + event.params.round.toString();

  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.battle = battleId;
    round.damagedPlayers = [];
    round.skillsUsed = [];
    round.save();
  }

  let playerId = event.params.player.toHexString();
  let moveId = roundId + "-" + playerId;
  let move = Move.load(moveId);
  if (move != null) {
    move.attackMultiplier = event.params.diceNumber;
    move.save();
  }
}

export function handleSkillExecuted(event: SkillExecutedEvent): void {
  let battleId = event.params.battleId.toString();
  let roundId = battleId + "-" + event.params.round.toString();

  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.battle = battleId;
    round.damagedPlayers = [];
    round.skillsUsed = [];
    round.save();
  }

  let playerId = event.params.player.toHexString();
  let player = Player.load(playerId);
  if (player == null) {
    player = new Player(playerId);
    player.totalDamageDealt = BigInt.fromI32(0);
    player.totalDamageTaken = BigInt.fromI32(0);
    player.wins = 0;
    player.losses = 0;
    player.save();
  }

  let skill = Skill.load(event.params.skillId.toString());
  if (skill != null) {
    let skillsUsed = round.skillsUsed;
    if (skillsUsed == null) {
      skillsUsed = [];
    }
    skillsUsed.push(skill.id);
    round.skillsUsed = skillsUsed;
    round.save();
  }

  player.totalDamageDealt = player.totalDamageDealt.plus(
    event.params.totalDamage
  );
  player.save();
}

export function handleStatusEffectApplied(
  event: StatusEffectAppliedEvent
): void {
  let battleId = event.params.battleId.toString();
  let roundId = battleId + "-" + event.params.round.toString();

  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.battle = battleId;
    round.damagedPlayers = [];
    round.skillsUsed = [];
    round.save();
  }

  let characterProxyId = battleId + "-" + event.params.character.toHexString();
  let characterProxy = CharacterProxy.load(characterProxyId);
  if (characterProxy != null) {
    let statusEffect = StatusEffect.load(event.params.statusEffectName);
    if (statusEffect != null) {
      let activeEffectId = characterProxyId + "-" + statusEffect.id;
      let activeEffect = ActiveEffect.load(activeEffectId);
      if (activeEffect == null) {
        activeEffect = new ActiveEffect(activeEffectId);
        activeEffect.characterProxy = characterProxy.id; // Use the CharacterProxy's ID
        activeEffect.statusEffectId = BigInt.fromString(statusEffect.id); // Convert the StatusEffect's ID to a BigInt
        activeEffect.duration = event.params.duration;
        activeEffect.save();
      }
    }
  }
}

export function handleStatusEffectResolved(
  event: StatusEffectResolvedEvent
): void {
  let effectId = event.params.effectId.toString();
  let battleId = event.params.battleId.toString();
  let playerId = event.params.player.toHexString();
  let characterProxyId = battleId + "-" + playerId;
  let characterProxy = CharacterProxy.load(characterProxyId);
  if (characterProxy == null || characterProxy.activeEffects == null) {
    // Handle error: CharacterProxy not found or activeEffects is null
    return;
  }

  // Find the ActiveEffect entity
  let effectFound = false;
  let activeEffects = characterProxy.activeEffects;
  if (activeEffects) {
    for (let i = 0; i < activeEffects.length; i++) {
      let activeEffectId = activeEffects[i];
      let activeEffect = ActiveEffect.load(activeEffectId);
      if (
        activeEffect != null &&
        activeEffect.statusEffectId == event.params.effectId
      ) {
        // Update the ActiveEffect entity
        activeEffect.duration = event.params.duration;
        activeEffect.save();
        effectFound = true;
        break;
      }
    }
  }

  if (!effectFound) {
    throw new Error(
      `ActiveEffect with ID ${effectId} not found for CharacterProxy with ID ${characterProxyId}`
    );
  }
}

export function handleRoundEnded(event: RoundEndedEvent): void {
  let battleId = event.params.battleId.toString();
  let roundId = battleId + "-" + event.params.round.toString();

  let round = Round.load(roundId);
  if (round == null) {
    round = new Round(roundId);
    round.battle = battleId;
    round.damagedPlayers = []; // Initialize as an empty array
    round.skillsUsed = [];
    round.save();
  }
  // Load the Battle entity
  let battle = Battle.load(battleId);
  if (battle == null) {
    // Handle error: Battle not found
    return;
  }

  // Update damaged players
  let damagedPlayers = event.params.damagedPlayers;
  for (let i = 0; i < damagedPlayers.length; i++) {
    let playerId = damagedPlayers[i].toHexString();
    let player = Player.load(playerId);
    if (round != null && player != null) {
      round.damagedPlayers.push(playerId); // No need for null check here
    }
  }

  // Update damage dealt and taken
  let damageDealt = event.params.damageDealt;
  let damageTaken = event.params.damageTaken;
  for (let i = 0; i < damageDealt.length; i++) {
    let playerId = damagedPlayers[i].toHexString();
    let damageId = roundId + "-" + playerId;
    let damage = Damage.load(damageId);
    if (damage == null) {
      damage = new Damage(damageId);
      damage.round = roundId;
      damage.player = playerId;
      damage.damageDealt = BigInt.fromI32(0);
      damage.damageTaken = BigInt.fromI32(0);
    }
    damage.damageDealt = damage.damageDealt.plus(damageDealt[i]);
    damage.damageTaken = damage.damageTaken.plus(damageTaken[i]);
    damage.save();

    // Update total damage dealt and taken in the Battle entity
    battle.totalDamageDealt[i] = battle.totalDamageDealt[i].plus(
      damageDealt[i]
    );
    battle.totalDamageTaken[i] = battle.totalDamageTaken[i].plus(
      damageTaken[i]
    );
  }

  round.save();
  battle.save();
}

export function handleBattleEnded(event: BattleEndedEvent): void {
  let battleId = event.params.battleId.toString();
  let battle = Battle.load(battleId);
  if (battle == null) {
    // Handle error: Battle not found
    return;
  }

  // Update the Battle entity
  battle.winner = event.params.winner.toHexString();
  battle.loser = event.params.loser.toHexString();
  battle.status = "Ended";
  battle.save();

  // Update the Player entities
  if (battle.winner != null) {
    let winner = Player.load(battle.winner!);
    if (winner != null) {
      winner.wins = (winner.wins || 0) + 1;
      winner.save();
    }
  }
  if (battle.loser != null) {
    let loser = Player.load(battle.loser!);
    if (loser != null) {
      loser.losses = (loser.losses || 0) + 1;
      loser.save();
    }
  }

  // Update the Character entities
  let characters = battle.characters;
  if (characters != null) {
    for (let i = 0; i < characters.length; i++) {
      let characterProxyId = characters[i];
      let characterProxy = CharacterProxy.load(characterProxyId);
      if (characterProxy != null) {
        let character = Character.load(characterProxy.character);
        if (character != null) {
          if (character.owner == battle.winner) {
            character.wins = (character.wins || 0) + 1;
          } else if (character.owner == battle.loser) {
            character.losses = (character.losses || 0) + 1;
          }
          character.save();
        }
      }
    }
  }
}

export function handleBattleQuit(event: BattleQuitEvent): void {}
