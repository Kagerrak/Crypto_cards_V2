// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Character.sol";
import "./BattleSkills.sol";
import "hardhat/console.sol";

contract Battle {
    enum Move {
        ATTACK,
        DEFEND,
        USE_SKILL
    }

    struct BattleData {
        string name;
        address[2] players;
        uint256[2] characterIds;
        uint256[2] moves;
        bool isBattleStarted;
        bool isBattleEnded;
        address winner;
        uint256[2] initialHealth;
        bool[2] moveSubmitted;
    }

    struct CharacterProxy {
        address owner;
        uint256 health;
        uint256 attack;
        uint256 defense;
        uint256 mana;
    }

    mapping(uint256 => BattleData) public battles;
    mapping(address => uint256) public playerOngoingBattle;
    mapping(bytes32 => mapping(address => CharacterProxy))
        private characterProxies;
    uint256 public battleCounter;

    event BattleCreated(uint256 battleId, address creator, uint256 characterId);
    event BattleJoined(uint256 battleId, address joiner, uint256 characterId);
    event BattleCanceled(uint256 indexed battleId, address indexed player);
    event RoundEnded(address[2] damagedPlayers);
    event BattleEnded(address winner);
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

    modifier onlyParticipant(uint256 battleId) {
        require(
            msg.sender == battles[battleId].players[0] ||
                msg.sender == battles[battleId].players[1],
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
        p.owner = player;
        p.health = characterContract.getCharacterHealth(tokenId);
        p.attack = characterContract.getCharacterAttack(tokenId);
        p.defense = characterContract.getCharacterDefense(tokenId);
        p.mana = characterContract.getCharacterMana(tokenId);

        console.log("Character proxy created for player", player);
        console.log("Health:", p.health);
        console.log("Mana:", p.mana);

        BattleData storage battle = battles[battleId];
        if (player == battle.players[0]) {
            battle.initialHealth[0] = p.health;
        } else {
            battle.initialHealth[1] = p.health;
        }
    }

    function createBattle(uint256 characterTokenId) external {
        require(
            characterContract.ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );
        require(
            playerOngoingBattle[msg.sender] == 0,
            "Player already participating in another battle"
        );

        battleCounter++;
        uint256 battleId = battleCounter;

        battles[battleId].players[0] = msg.sender;
        battles[battleId].characterIds[0] = characterTokenId;

        playerOngoingBattle[msg.sender] = battleId;

        // Populate the CharacterProxy for player 1
        createCharacterProxies(characterTokenId, msg.sender, battleId);

        emit BattleCreated(battleId, msg.sender, characterTokenId);
    }

    function cancelBattle(uint256 battleId) external {
        BattleData storage battle = battles[battleId];
        require(
            battle.players[0] == msg.sender,
            "Not the creator of the battle"
        );
        require(!battle.isBattleStarted, "Cannot cancel a started battle");

        // Remove the ongoing battle for the player
        playerOngoingBattle[msg.sender] = 0;

        // Mark the battle as ended and set the winner to address(0)
        battle.isBattleEnded = true;
        battle.winner = address(0);

        emit BattleCanceled(battleId, msg.sender);
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
        require(!battle.isBattleStarted, "Battle has already started");
        require(
            battle.players[1] == address(0),
            "Battle already has two players"
        );

        battle.characterIds[1] = characterTokenId;
        battle.players[1] = msg.sender;
        battle.isBattleStarted = true;

        playerOngoingBattle[msg.sender] = battleId;

        // Populate the CharacterProxy for player 2
        createCharacterProxies(characterTokenId, msg.sender, battleId);

        emit BattleJoined(battleId, msg.sender, characterTokenId);
    }

    function submitMove(
        uint256 battleId,
        Move move
    ) external onlyParticipant(battleId) {
        BattleData storage battle = battles[battleId];
        require(battle.isBattleStarted, "Battle has not started");
        require(!battle.isBattleEnded, "Battle has ended");
        require(
            move == Move.ATTACK ||
                move == Move.DEFEND ||
                move == Move.USE_SKILL,
            "Invalid move: must be ATTACK, DEFEND, or USE_SKILL"
        );

        if (msg.sender == battle.players[0]) {
            require(
                !battle.moveSubmitted[0],
                "Move already submitted by player 1"
            );
            battle.moves[0] = uint256(move);
            battle.moveSubmitted[0] = true; // Set the flag
            emit MoveSubmitted(battleId, msg.sender, move);
        } else if (msg.sender == battle.players[1]) {
            require(
                !battle.moveSubmitted[1],
                "Move already submitted by player 2"
            );
            battle.moves[1] = uint256(move);
            battle.moveSubmitted[1] = true; // Set the flag
            emit MoveSubmitted(battleId, msg.sender, move);
        } else {
            revert("Not a participant of the battle");
        }

        // Add these lines
        console.log(
            "Character proxy health for player 1:",
            getCharacterHealth(battleId, battle.players[0])
        );
        console.log(
            "Character proxy health for player 2:",
            getCharacterHealth(battleId, battle.players[1])
        );

        // Check if both moves have been submitted
        if (battle.moveSubmitted[0] && battle.moveSubmitted[1]) {
            _resolveRound(battleId);
        }
    }

    function _resolveRound(uint256 battleId) private {
        BattleData storage battle = battles[battleId];

        bytes32 battleKeyA = keccak256(
            abi.encodePacked(battleId, battle.players[0])
        );
        bytes32 battleKeyB = keccak256(
            abi.encodePacked(battleId, battle.players[1])
        );

        CharacterProxy memory proxyA = characterProxies[battleKeyA][
            battle.players[0]
        ];
        CharacterProxy memory proxyB = characterProxies[battleKeyB][
            battle.players[1]
        ];

        // Handle different move combinations
        if (
            battle.moves[0] == uint256(Move.ATTACK) &&
            battle.moves[1] == uint256(Move.ATTACK)
        ) {
            // Both players attack
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
            proxyA.mana += 3;
            proxyB.mana += 3;
        } else if (
            battle.moves[0] == uint256(Move.ATTACK) &&
            battle.moves[1] == uint256(Move.DEFEND)
        ) {
            // Player 1 attacks, player 2 defends
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
            uint256 damageB = calculateAttackDamage(proxyB.attack);
            if (proxyA.defense < damageB) {
                uint256 damage = damageB - proxyA.defense;
                proxyA.health = proxyA.health > damage
                    ? proxyA.health - damage
                    : 0;
            }
            proxyA.mana += 3;
            proxyB.mana -= 3;
        }

        // USE_SKILL logic here.

        if (battle.moves[0] == uint256(Move.USE_SKILL)) {
            uint256 characterTokenId = battle.characterIds[0];
            uint256 skillId = characterContract.getEquippedSkill(
                characterTokenId
            );
            BattleSkills.Skill memory skill = battleSkillsContract.getSkill(
                skillId
            );
            uint256 totalDamage = calculateAttackDamage(
                proxyA.attack + skill.damage
            );
            proxyB.health = proxyB.health > totalDamage
                ? proxyB.health - totalDamage
                : 0;
        }

        if (battle.moves[1] == uint256(Move.USE_SKILL)) {
            uint256 characterTokenId = battle.characterIds[1];
            uint256 skillId = characterContract.getEquippedSkill(
                characterTokenId
            );
            BattleSkills.Skill memory skill = battleSkillsContract.getSkill(
                skillId
            );
            uint256 totalDamage = calculateAttackDamage(
                proxyB.attack + skill.damage
            );
            proxyA.health = proxyA.health > totalDamage
                ? proxyA.health - totalDamage
                : 0;
        }

        // Update CharacterProxy mappings
        characterProxies[battleKeyA][battle.players[0]] = proxyA;
        characterProxies[battleKeyB][battle.players[1]] = proxyB;

        // Emit HealthUpdated event
        emit HealthUpdated(
            battleId,
            battle.players[0],
            proxyA.health,
            battle.players[1],
            proxyB.health
        );

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

    function calculateAttackDamage(
        uint256 attack
    ) internal view returns (uint256) {
        uint256 damage = (attack / 10) *
            ((uint256(
                keccak256(
                    abi.encodePacked(
                        block.difficulty,
                        block.timestamp,
                        msg.sender
                    )
                )
            ) % 20) + 1);

        return damage;
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

    function _endBattle(uint256 battleId, address _winner) internal {
        BattleData storage battle = battles[battleId];
        battle.isBattleEnded = true;
        battle.winner = _winner;

        playerOngoingBattle[battle.players[0]] = 0;
        playerOngoingBattle[battle.players[1]] = 0;

        emit BattleEnded(_winner);
    }

    function getBattleParticipants(
        uint256 battleId
    ) external view returns (address[2] memory) {
        return battles[battleId].players;
    }

    function getCharacterProxy(
        uint256 battleId,
        address player
    ) public view returns (CharacterProxy memory) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        return characterProxies[battleKey][player];
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
}
