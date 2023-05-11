// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Character.sol";
import "./BattleSkills.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";

contract Battle is Ownable {
    function _canSetOwner() internal view virtual override returns (bool) {
        return true;
    }

    AggregatorV3Interface internal priceFeed;
    uint256 public feeCollected; // variable to track fee
    uint256 public leagueRewards; // variable to track league rewards
    uint256 public staminaCost = 25;

    enum Move {
        ATTACK,
        DEFEND,
        USE_SKILL,
        DO_NOTHING
    }

    enum BattleStatus {
        PENDING,
        STARTED,
        ENDED
    }

    struct BattleData {
        uint256 battleId;
        string name;
        address[2] players;
        uint256[2] characterIds;
        uint256[2] moves;
        uint256[2] skillIndices; // Indices of chosen skills in the equippedSkills array
        BattleStatus battleStatus;
        address winner;
        uint256[2] initialHealth;
        uint256[2] initialMana; // Initial mana for each player's character
        bool[2] moveSubmitted;
    }

    struct CharacterProxy {
        uint256 id;
        address owner;
        uint256 health;
        uint256 attack;
        uint256 defense;
        uint256 mana;
        uint256 typeId;
        uint256[] equippedSkills; // Array of equipped skill IDs
        uint256[] activeEffectIds; // Array of active status effect IDs
        mapping(uint256 => uint256) activeEffectDurations; // Mapping from effectId to duration
        mapping(uint256 => bool) appliedEffects;
        bool isStunned;
    }

    struct CharacterProxyView {
        uint256 id;
        address owner;
        uint256 health;
        uint256 attack;
        uint256 defense;
        uint256 mana;
        uint256 typeId;
        uint256[] equippedSkills;
    }

    mapping(uint256 => BattleData) public battles;
    uint256[] public activeBattlesId;
    mapping(uint256 => uint256) private battleIdToActiveIndex;

    mapping(address => uint256) public playerOngoingBattle;
    mapping(bytes32 => mapping(address => CharacterProxy))
        private characterProxies;
    uint256 public battleCounter;

    mapping(address => uint256) public playerCredit; // mapping of player addresses to the number of player

    event BattleCreated(uint256 battleId, address creator, uint256 characterId);
    event NewBattle(
        string battleName,
        uint256 battleId,
        address indexed player1,
        address indexed player2
    );
    event BattleCancelled(uint256 indexed battleId, address indexed player);
    event RoundEnded(address[2] damagedPlayers);
    event BattleEnded(
        string battleName,
        uint256 battleId,
        address indexed winner,
        address indexed loser
    );
    event MoveSubmitted(
        uint256 indexed battleId,
        address indexed player,
        Move move
    );
    event HealthUpdated(
        uint256 battleId,
        address player1,
        uint256 health1,
        address player2,
        uint256 health2
    );
    event DiceRolled(uint256 diceNumber);

    modifier onlyParticipant(uint256 battleId) {
        console.log(battles[battleId].players[0]);
        console.log(battles[battleId].players[1]);
        address player0 = battles[battleId].players[0];
        address player1 = battles[battleId].players[1];

        require(
            msg.sender == player0 || msg.sender == player1,
            "Only participants can call this function"
        );
        _;
    }

    Character private characterContract;
    BattleSkills private battleSkillsContract;

    constructor(
        address _characterContractAddress,
        address _battleSkillsContractAddress
    ) {
        characterContract = Character(_characterContractAddress);
        battleSkillsContract = BattleSkills(_battleSkillsContractAddress);
    }

    function createCharacterProxies(
        uint256 tokenId,
        address player,
        uint256 battleId
    ) private {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));

        CharacterProxy storage p = characterProxies[battleKey][player];
        p.id = tokenId;
        p.owner = player;
        p.health = characterContract.getCharacterHealth(tokenId);
        p.attack = characterContract.getCharacterAttack(tokenId);
        p.defense = characterContract.getCharacterDefense(tokenId);
        p.mana = characterContract.getMana(tokenId);
        p.typeId = characterContract.getCharacterType(tokenId);

        console.log("Character proxy created for player", player);
        console.log("Health:", p.health);
        console.log("Mana:", p.mana);

        BattleData storage battle = battles[battleId];
        if (player == battle.players[0]) {
            battle.initialHealth[0] = p.health;
            battle.initialMana[0] = p.mana; // Populate initialMana for player 1
        } else {
            battle.initialHealth[1] = p.health;
            battle.initialMana[1] = p.mana; // Populate initialMana for player 2
        }
    }

    function createBattle(
        string memory _name,
        uint256 _characterTokenId
    ) external {
        require(
            characterContract.ownerOf(_characterTokenId) == msg.sender,
            "Not the owner of the character"
        );
        require(
            playerOngoingBattle[msg.sender] == 0,
            "Player already participating in another battle"
        );

        uint256 battleId = battleCounter;

        BattleData memory newBattle = BattleData({
            battleId: battleCounter,
            name: _name,
            players: [msg.sender, address(0)],
            characterIds: [_characterTokenId, 0],
            moves: [uint256(0), uint256(0)],
            skillIndices: [uint256(0), uint256(0)],
            battleStatus: BattleStatus.PENDING,
            winner: address(0),
            initialHealth: [uint256(0), uint256(0)],
            initialMana: [uint256(0), uint256(0)], // Add initialMana field to the memory struct
            moveSubmitted: [false, false]
        });

        battles[battleId] = newBattle;
        activeBattlesId.push(battleId);
        battleIdToActiveIndex[battleId] = activeBattlesId.length - 1;

        playerOngoingBattle[msg.sender] = battleId;

        // Populate the CharacterProxy for player 1
        createCharacterProxies(_characterTokenId, msg.sender, battleId);

        // Consume stamina for player 1
        characterContract.consumeStamina(_characterTokenId, staminaCost);

        emit BattleCreated(battleId, msg.sender, _characterTokenId);
        battleCounter++;
    }

    function cancelBattle(uint256 _battleId) external {
        BattleData storage battle = battles[_battleId];

        require(
            battle.players[0] == msg.sender,
            "Only the creator can cancel the battle"
        );
        require(
            battle.battleStatus == BattleStatus.PENDING,
            "Cannot cancel a started battle"
        );

        battle.battleStatus = BattleStatus.ENDED;
        playerOngoingBattle[msg.sender] = 0;

        // Remove battle from the activeBattlesId array
        uint256 index = battleIdToActiveIndex[_battleId];
        uint256 lastIndex = activeBattlesId.length - 1;
        uint256 lastBattleId = activeBattlesId[lastIndex];

        activeBattlesId[index] = lastBattleId;
        battleIdToActiveIndex[lastBattleId] = index;
        activeBattlesId.pop();
        delete battleIdToActiveIndex[_battleId];

        // // Add credit score to player
        // playerCredit[msg.sender] += 1;

        emit BattleCancelled(_battleId, msg.sender);
    }

    function joinBattle(uint256 battleId, uint256 characterTokenId) external {
        require(
            characterContract.ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );
        require(
            playerOngoingBattle[msg.sender] == 0,
            "Player already participating in another battle"
        );

        BattleData storage battle = battles[battleId];
        require(
            battle.battleStatus == BattleStatus.PENDING,
            "Battle has already started"
        );
        require(
            battle.players[1] == address(0),
            "Battle already has two players"
        );

        battle.characterIds[1] = characterTokenId;
        battle.players[1] = msg.sender;
        battle.battleStatus = BattleStatus.STARTED;

        playerOngoingBattle[msg.sender] = battleId;

        // Populate the CharacterProxy for player 2
        createCharacterProxies(characterTokenId, msg.sender, battleId);

        // Consume stamina for player 2
        characterContract.consumeStamina(characterTokenId, staminaCost);

        // // Collect 50% of the fee for the league rewards
        // leagueRewards += msg.value / 2;
        // // Collect 50% of the fee for the feeCollector
        // feeCollected += msg.value / 2;

        emit NewBattle(battle.name, battleId, battle.players[0], msg.sender);
    }

    function submitMove(
        uint256 battleId,
        Move move,
        uint256 skillId
    ) external onlyParticipant(battleId) {
        BattleData storage battle = battles[battleId];
        require(
            battle.battleStatus == BattleStatus.STARTED,
            "Battle has not started or has already ended"
        );
        require(
            move == Move.ATTACK ||
                move == Move.DEFEND ||
                move == Move.USE_SKILL ||
                move == Move.DO_NOTHING,
            "Invalid move: must be ATTACK, DEFEND, USE_SKILL, or DO_NOTHING"
        );

        uint256 playerIndex = (msg.sender == battle.players[0]) ? 0 : 1;
        require(
            !battle.moveSubmitted[playerIndex],
            "Move already submitted by player"
        );

        // Fetch the player's CharacterProxy
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, msg.sender));
        CharacterProxy storage p = characterProxies[battleKey][msg.sender];

        // Check if the submitted skill is equipped
        if (move == Move.USE_SKILL) {
            bool skillEquipped = false;
            for (uint256 i = 0; i < p.equippedSkills.length; i++) {
                if (p.equippedSkills[i] == skillId) {
                    skillEquipped = true;
                    break;
                }
            }
            require(skillEquipped, "Submitted skill is not equipped");
        }

        battle.moves[playerIndex] = uint256(move);
        battle.moveSubmitted[playerIndex] = true; // Set the flag

        // Update skillIndices array if the move is USE_SKILL
        if (move == Move.USE_SKILL) {
            battle.skillIndices[playerIndex] = skillId;
        }

        emit MoveSubmitted(battleId, msg.sender, move);

        // Check if both moves have been submitted
        if (battle.moveSubmitted[0] && battle.moveSubmitted[1]) {
            _resolveRound(
                battleId,
                battle.skillIndices[0],
                battle.skillIndices[1]
            );
        }
    }

    function _resolveRound(
        uint256 battleId,
        uint256 _skillId0,
        uint256 _skillId1
    ) private {
        BattleData storage battle = battles[battleId];

        bytes32 battleKeyA = keccak256(
            abi.encodePacked(battleId, battle.players[0])
        );
        bytes32 battleKeyB = keccak256(
            abi.encodePacked(battleId, battle.players[1])
        );

        CharacterProxy storage proxyA = characterProxies[battleKeyA][
            battle.players[0]
        ];
        CharacterProxy storage proxyB = characterProxies[battleKeyB][
            battle.players[1]
        ];

        _resolveStatusEffects(proxyA);
        console.log("proxyA");
        _resolveStatusEffects(proxyB);
        console.log("proxyB");

        if (proxyA.isStunned) {
            battle.moves[0] = uint256(Move.DO_NOTHING);
            console.log("Player 1 is stunned, miss a turn");
        }
        if (proxyB.isStunned) {
            battle.moves[1] = uint256(Move.DO_NOTHING);
            console.log("Player 2 is stunned, miss a turn");
        }

        // Handle different move combinations
        if (
            battle.moves[0] == uint256(Move.ATTACK) &&
            battle.moves[1] == uint256(Move.ATTACK)
        ) {
            // Both players attack
            console.log("Both players attack");
            uint256 damageA = calculateAttackDamage(proxyA.attack);
            uint256 damageB = calculateAttackDamage(proxyB.attack);
            proxyB.health = proxyB.health > damageA
                ? proxyB.health - damageA
                : 0;
            proxyA.health = proxyA.health > damageB
                ? proxyA.health - damageB
                : 0;
            proxyA.mana -= 3;
            proxyB.mana -= 3;
        } else if (
            battle.moves[0] == uint256(Move.DEFEND) &&
            battle.moves[1] == uint256(Move.DEFEND)
        ) {
            // Both players defend
            // No action required
            console.log("Both players defend");
            proxyA.mana += 3;
            proxyB.mana += 3;
        } else if (
            battle.moves[0] == uint256(Move.ATTACK) &&
            battle.moves[1] == uint256(Move.DEFEND)
        ) {
            // Player 1 attacks, player 2 defends
            console.log("Player 1 attacks, player 2 defends");
            uint256 damageA = calculateAttackDamage(proxyA.attack);
            if (proxyB.defense < damageA) {
                uint256 damage = damageA - proxyB.defense;
                proxyB.health = proxyB.health > damage
                    ? proxyB.health - damage
                    : 0;
            }
            proxyA.mana -= 3;
            proxyB.mana += 3;
        } else if (
            battle.moves[0] == uint256(Move.DEFEND) &&
            battle.moves[1] == uint256(Move.ATTACK)
        ) {
            // Player 2 attacks, player 1 defends
            console.log("Player 2 attacks, player 1 defends");
            uint256 damageB = calculateAttackDamage(proxyB.attack);
            if (proxyA.defense < damageB) {
                uint256 damage = damageB - proxyA.defense;
                proxyA.health = proxyA.health > damage
                    ? proxyA.health - damage
                    : 0;
            }
            proxyA.mana += 3;
            proxyB.mana -= 3;
        } else if (
            battle.moves[0] == uint256(Move.ATTACK) &&
            battle.moves[1] == uint256(Move.DO_NOTHING)
        ) {
            // Player 1 attacks, player 2 does nothing
            console.log("Player 1 attacks, player 2 does nothing");

            uint256 damageA = calculateAttackDamage(proxyA.attack);
            proxyB.health = proxyB.health > damageA
                ? proxyB.health - damageA
                : 0;
            proxyA.mana -= 3;
        } else if (
            battle.moves[0] == uint256(Move.DO_NOTHING) &&
            battle.moves[1] == uint256(Move.ATTACK)
        ) {
            // Player 1 does nothing, player 2 attacks
            console.log("Player 1 does nothing, player 2 attacks");

            uint256 damageB = calculateAttackDamage(proxyB.attack);
            proxyA.health = proxyA.health > damageB
                ? proxyA.health - damageB
                : 0;
            proxyB.mana -= 3;
        } else if (
            battle.moves[0] == uint256(Move.DEFEND) &&
            battle.moves[1] == uint256(Move.DO_NOTHING)
        ) {
            // Player 1 defends, player 2 does nothing
            console.log("Player 1 defends, player 2 does nothing");

            proxyA.mana += 3;
        } else if (
            battle.moves[0] == uint256(Move.DO_NOTHING) &&
            battle.moves[1] == uint256(Move.DEFEND)
        ) {
            // Player 1 does nothing, player 2 defends
            console.log("Player 1 defends, player 2 does nothing");

            proxyB.mana += 3;
        }

        // USE_SKILL logic here.
        if (battle.moves[0] == uint256(Move.USE_SKILL)) {
            _executeSkill(proxyA, _skillId0, proxyB);
        } else if (battle.moves[0] == uint256(Move.DO_NOTHING)) {
            // Player 1 does nothing
        }

        if (battle.moves[1] == uint256(Move.USE_SKILL)) {
            _executeSkill(proxyB, _skillId1, proxyA);
        } else if (battle.moves[1] == uint256(Move.DO_NOTHING)) {
            // Player 2 does nothing
        }

        // Emit HealthUpdated event
        emit HealthUpdated(
            battleId,
            battle.players[0],
            proxyA.health,
            battle.players[1],
            proxyB.health
        );
        console.log("Player 1 Health: ", proxyA.health);
        console.log("Player 2 Health: ", proxyB.health);

        console.log("Player 1 Mana: ", proxyA.mana);
        console.log("Player 2 Mana: ", proxyB.mana);

        // Check if the battle has ended and declare a winner
        if (proxyA.health == 0 || proxyB.health == 0) {
            address winner = proxyA.health > proxyB.health
                ? battle.players[0]
                : battle.players[1];
            _endBattle(battleId, winner);
        } else {
            // If no character has lost all their health, reset the move submissions for the next round.
            battle.moveSubmitted[0] = false;
            battle.moveSubmitted[1] = false;
        }
    }

    function _applyStatusEffect(
        CharacterProxy storage character,
        uint256 statusEffectId,
        uint256 duration
    ) private {
        // Add the status effect to the character's activeEffectIds array
        character.activeEffectIds.push(statusEffectId);

        // Update the character's activeEffectDurations mapping with the new duration
        character.activeEffectDurations[statusEffectId] = duration;
    }

    function calculateAttackDamage(uint256 attack) public returns (uint256) {
        uint256 randomNumber = (uint256(
            keccak256(
                abi.encodePacked(block.difficulty, block.timestamp, msg.sender)
            )
        ) % 20) + 1;

        // Emit the DiceRolled event with the generated randomNumber
        emit DiceRolled(randomNumber);
        console.log("Dice Rolled: ", randomNumber);

        uint256 damage = (attack * (1000 + (randomNumber * 100))) / 1000;
        console.log("Calculated Damage: ", damage);
        return damage;
    }

    function _executeSkill(
        CharacterProxy storage player,
        uint256 skillId,
        CharacterProxy storage opponent
    ) private {
        BattleSkills.Skill memory skill = battleSkillsContract.getSkill(
            skillId
        );
        uint256 totalDamage = calculateAttackDamage(skill.damage);
        opponent.health = opponent.health > totalDamage
            ? opponent.health - totalDamage
            : 0;

        BattleSkills.StatusEffect memory statusEffect = battleSkillsContract
            .getStatusEffect(skill.statusEffectId);

        if (statusEffect.isPositive) {
            _applyStatusEffect(
                player,
                skill.statusEffectId,
                statusEffect.duration
            );
            console.log(
                "Positive status effect applied to player:",
                statusEffect.name
            );
        } else {
            _applyStatusEffect(
                opponent,
                skill.statusEffectId,
                statusEffect.duration
            );
            console.log(
                "Negative status effect applied to opponent:",
                statusEffect.name
            );
        }
        player.mana -= skill.manaCost;
    }

    function _boostAttack(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 attackBoost
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.attack += attackBoost;
        }
    }

    function _reduceAttack(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 attackReduction
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.attack = character.attack > attackReduction
                ? character.attack - attackReduction
                : 0;
        }
    }

    function _healOverTime(
        CharacterProxy storage character,
        uint256 healPerTurn
    ) private {
        character.health += healPerTurn;
    }

    function _defenseBoost(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 defenseBoost
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.defense += defenseBoost;
        }
    }

    function _reduceDefense(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 defenseReduction
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.defense = character.defense > defenseReduction
                ? character.defense - defenseReduction
                : 0;
        }
    }

    function _damageOverTime(
        CharacterProxy storage character,
        uint256 damagePerTurn
    ) private {
        character.health = character.health > damagePerTurn
            ? character.health - damagePerTurn
            : 0;
    }

    function _resolveStatusEffects(CharacterProxy storage character) private {
        bool isStunned = false;

        for (uint256 i = 0; i < character.activeEffectIds.length; i++) {
            uint256 effectId = character.activeEffectIds[i];
            BattleSkills.StatusEffect memory statusEffect = battleSkillsContract
                .getStatusEffect(effectId);

            if (statusEffect.attackBoost > 0) {
                _boostAttack(character, effectId, statusEffect.attackBoost);

                console.log("Attack boosted by: ", statusEffect.attackBoost);
                console.log(
                    "Previous Attack: ",
                    character.attack - statusEffect.attackBoost
                );
                console.log("Current Attack: ", character.attack);
            }
            if (statusEffect.attackReduction > 0) {
                _reduceAttack(
                    character,
                    effectId,
                    statusEffect.attackReduction
                );

                console.log(
                    "Attack reduced by: ",
                    statusEffect.attackReduction
                );
                console.log(
                    "Previous Attack: ",
                    character.attack + statusEffect.attackReduction
                );
                console.log("Current Attack: ", character.attack);
            }
            if (statusEffect.defenseBoost > 0) {
                _defenseBoost(character, effectId, statusEffect.defenseBoost);

                console.log("Defense boosted by: ", statusEffect.defenseBoost);
                console.log(
                    "Previous Defense : ",
                    character.defense - statusEffect.defenseBoost
                );
                console.log("Current Defense : ", character.defense);
            }
            if (statusEffect.defenseReduction > 0) {
                _reduceDefense(
                    character,
                    effectId,
                    statusEffect.defenseReduction
                );

                console.log(
                    "Defense reduced by: ",
                    statusEffect.defenseReduction
                );
                console.log(
                    "Previous Defense: ",
                    character.defense + statusEffect.defenseBoost
                );
                console.log("Current Defense: ", character.defense);
            }
            if (statusEffect.healPerTurn > 0) {
                _healOverTime(character, statusEffect.healPerTurn);
                console.log("Health healed by: ", statusEffect.healPerTurn);
                console.log("Current Health: ", character.health);
            }
            if (statusEffect.isStun) {
                if (character.activeEffectDurations[effectId] > 0) {
                    isStunned = true;
                }
            }
            if (statusEffect.damagePerTurn > 0) {
                _damageOverTime(character, statusEffect.damagePerTurn);
                console.log("Health reduced by: ", statusEffect.damagePerTurn);
                console.log("Current Health: ", character.health);
            }

            // Decrement the duration of the status effect
            character.activeEffectDurations[effectId] -= 1;

            if (character.activeEffectDurations[effectId] == 0) {
                if (statusEffect.attackBoost > 0) {
                    character.attack -= statusEffect.attackBoost;
                    character.appliedEffects[effectId] = false;
                    console.log(
                        "Attack Boost Ended Current Attack",
                        character.attack
                    );
                }
                if (statusEffect.attackReduction > 0) {
                    character.attack += statusEffect.attackReduction;
                    character.appliedEffects[effectId] = false;
                    console.log(
                        "Attack Reduction Ended Current Attack",
                        character.attack
                    );
                }
                if (statusEffect.defenseBoost > 0) {
                    character.defense -= statusEffect.defenseBoost;
                    character.appliedEffects[effectId] = false;
                    console.log(
                        "Defense Boost Ended Current Defense",
                        character.defense
                    );
                }
                if (statusEffect.defenseReduction > 0) {
                    character.defense += statusEffect.defenseReduction;
                    console.log(
                        "Defense Reduction Ended Current Defense",
                        character.defense
                    );
                }

                // Remove the status effect from the activeEffectIds array
                if (character.activeEffectIds.length > 1) {
                    character.activeEffectIds[i] = character.activeEffectIds[
                        character.activeEffectIds.length - 1
                    ];
                }
                character.activeEffectIds.pop();
                if (i > 0) {
                    i--; // Decrement the loop counter to account for the removed element
                }
            }
        }

        // Update the character's stun status based on the isStunned flag
        character.isStunned = isStunned;
    }

    function quitBattle(uint256 _battleId) public {
        require(
            battles[_battleId].players[0] != address(0),
            "Battle not found!"
        );

        BattleData memory _battle = battles[_battleId];
        require(
            _battle.players[0] == msg.sender ||
                _battle.players[1] == msg.sender,
            "You are not in this battle!"
        );

        _battle.players[0] == msg.sender
            ? _endBattle(_battleId, _battle.players[1])
            : _endBattle(_battleId, _battle.players[0]);
    }

    function _endBattle(uint256 _battleId, address _winner) internal {
        BattleData storage battle = battles[_battleId];
        battle.winner = _winner;
        battle.battleStatus = BattleStatus.ENDED;

        _updateBattleIdMapping(_battleId);

        // Update the playerOngoingBattle mapping for both players
        address player1 = battle.players[0];
        address player2 = battle.players[1];
        playerOngoingBattle[player1] = 0;
        playerOngoingBattle[player2] = 0;

        // Determine the loser
        address _loser = _winner == player1 ? player2 : player1;
        uint256 winnerIndex = _winner == player1 ? 0 : 1;
        uint256 loserIndex = _loser == player1 ? 0 : 1;

        _consumeUsedMana(_battleId, battle, winnerIndex, loserIndex);

        // Check if the health of one of the players is 0, indicating the battle was fought
        uint256 player1Health = characterProxies[
            keccak256(abi.encodePacked(_battleId, player1))
        ][player1].health;
        uint256 player2Health = characterProxies[
            keccak256(abi.encodePacked(_battleId, player2))
        ][player2].health;
        bool battleFought = player1Health == 0 || player2Health == 0;

        // If the battle was actually fought, grant experience points to the winner and the loser
        if (battleFought) {
            characterContract.gainXP(battle.characterIds[winnerIndex], 100);
            characterContract.gainXP(battle.characterIds[loserIndex], 30);
            console.log("Exp gained: ", battle.characterIds[winnerIndex], 100);
            console.log("Exp gained: ", battle.characterIds[loserIndex], 30);
        }

        // Emit the updated BattleEnded event
        emit BattleEnded(battle.name, _battleId, _winner, _loser);
    }

    function _updateBattleIdMapping(uint256 _battleId) internal {
        uint256 index = battleIdToActiveIndex[_battleId];
        uint256 lastIndex = activeBattlesId.length - 1;
        uint256 lastBattleId = activeBattlesId[lastIndex];

        activeBattlesId[index] = lastBattleId;
        battleIdToActiveIndex[lastBattleId] = index;
        activeBattlesId.pop();
        delete battleIdToActiveIndex[_battleId];
    }

    function _consumeUsedMana(
        uint256 _battleId,
        BattleData storage battle,
        uint256 winnerIndex,
        uint256 loserIndex
    ) internal {
        // Calculate used mana for each player's character
        address player1 = battle.players[0];
        address player2 = battle.players[1];
        uint256 usedManaPlayer1 = battle.initialMana[0] -
            characterProxies[keccak256(abi.encodePacked(_battleId, player1))][
                player1
            ].mana;
        uint256 usedManaPlayer2 = battle.initialMana[1] -
            characterProxies[keccak256(abi.encodePacked(_battleId, player2))][
                player2
            ].mana;

        // Consume used mana for each player's character
        characterContract.consumeMana(
            battle.characterIds[winnerIndex],
            usedManaPlayer1
        );
        characterContract.consumeMana(
            battle.characterIds[loserIndex],
            usedManaPlayer2
        );
    }

    function getBattle(
        uint256 _battleId
    ) external view returns (BattleData memory) {
        return battles[_battleId];
    }

    function getActiveBattlesId() public view returns (uint256[] memory) {
        return activeBattlesId;
    }

    function getActiveBattlesCount() external view returns (uint256) {
        return activeBattlesId.length;
    }

    function getBattleParticipants(
        uint256 battleId
    ) external view returns (address[2] memory) {
        return battles[battleId].players;
    }

    function getCharacterProxy(
        uint256 battleId,
        address player
    ) public view returns (CharacterProxyView memory) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        CharacterProxy storage proxy = characterProxies[battleKey][player];

        CharacterProxyView memory proxyView = CharacterProxyView({
            id: proxy.id,
            owner: proxy.owner,
            health: proxy.health,
            attack: proxy.attack,
            defense: proxy.defense,
            mana: proxy.mana,
            typeId: proxy.typeId,
            equippedSkills: proxy.equippedSkills
        });

        return proxyView;
    }

    function getCharacterProxyActiveEffects(
        uint256 battleId,
        address player
    )
        public
        view
        returns (uint256[] memory effectIds, uint256[] memory durations)
    {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        CharacterProxy storage proxy = characterProxies[battleKey][player];

        // Get the number of active effects
        uint256 activeEffectsCount = proxy.activeEffectIds.length;

        // Create arrays for effectIds and durations
        effectIds = new uint256[](activeEffectsCount);
        durations = new uint256[](activeEffectsCount);

        // Fill the arrays with the active effectIds and their durations
        for (uint256 i = 0; i < activeEffectsCount; i++) {
            uint256 effectId = proxy.activeEffectIds[i];
            effectIds[i] = effectId;
            durations[i] = proxy.activeEffectDurations[effectId];
        }

        return (effectIds, durations);
    }

    function getBattleMoves(
        uint256 battleId
    ) external view returns (uint256[2] memory) {
        BattleData storage battle = battles[battleId];
        return [battle.moves[0], battle.moves[1]];
    }

    function getCharacterHealth(
        uint256 battleId,
        address player
    ) public view returns (uint256) {
        return
            characterProxies[keccak256(abi.encodePacked(battleId, player))][
                player
            ].health;
    }

    function updateStaminaCost(uint256 newCost) external onlyOwner {
        staminaCost = newCost;
    }

    /**
     * @notice Get fee for battle.
     * @dev Battle Fee is calculated with the current value of Avax in USD given by ChainLink.
     * @return price uint256 Fee value
     */
    function battleFee() public view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        uint256 price = uint256(answer * 10000000000); // convert int256 value to uint256
        uint256 usdAmount = 0.05 * 10 ** 18; // convert 0.05 USD to wei
        return uint256((usdAmount * (10 ** 18)) / price); // convert wei to ether
    }

    function storeStamina(uint256 _tokenId1, uint256 _tokenId2) public {
        characterContract.restoreStaminaToFull(_tokenId1);
        characterContract.restoreStaminaToFull(_tokenId2);
    }

    fallback() external payable {}

    receive() external payable {}
}
