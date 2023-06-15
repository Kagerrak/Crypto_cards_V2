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

    struct BattleStats {
        uint256[2] initialHealth;
        uint256[2] initialMana; // Initial mana for each player's character
        uint256[2] totalDamageDealt;
        uint256[2] totalDamageTaken;
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
        bool[2] moveSubmitted;
        uint256 round;
        BattleStats battleStats;
    }

    struct CharacterStats {
        uint256 health;
        uint256 attack;
        uint256 defense;
        uint256 mana;
        uint256 typeId;
    }

    struct CharacterProxy {
        uint256 id;
        address owner;
        CharacterStats stats;
        uint256[] equippedSkills; // Array of equipped skill IDs
        uint256[] activeEffectIds; // Array of active status effect IDs
        mapping(uint256 => uint256) activeEffectDurations; // Mapping from effectId to duration
        mapping(uint256 => bool) appliedEffects;
        bool isStunned;
        uint256 attackMultiplier; // Store the attack multiplier here
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

    event CharacterProxyData(
        uint256 battleId,
        address player,
        uint256 id,
        address owner,
        uint256 health,
        uint256 attack,
        uint256 defense,
        uint256 mana,
        uint256 typeId,
        uint256[] equippedSkills
    );

    event BattleCreated(
        uint256 indexed battleId,
        address indexed creator,
        uint256 characterId
    );
    event NewBattle(
        string battleName,
        uint256 indexed battleId,
        address indexed player1,
        address indexed player2,
        uint256 characterId
    );
    event BattleCancelled(uint256 indexed battleId, address indexed player);
    event RoundEnded(
        uint256 indexed battleId,
        address[2] damagedPlayers,
        uint256[2] damageDealt,
        uint256[2] damageTaken,
        uint256 indexed round
    );
    event BattleEnded(
        string battleName,
        uint256 indexed battleId,
        address indexed winner,
        address indexed loser
    );
    event MoveSubmitted(
        uint256 indexed battleId,
        address indexed player,
        Move move,
        uint256 round
    );
    event HealthUpdated(
        uint256 indexed battleId,
        address indexed player1,
        uint256 health1,
        address indexed player2,
        uint256 health2
    );
    event DiceRolled(
        uint256 indexed battleId,
        address indexed player,
        uint256 round,
        uint256 diceNumber
    );
    event SkillExecuted(
        uint256 indexed battleId,
        uint256 round,
        address indexed player,
        string skillName,
        uint256 totalDamage
    );

    event StatusEffectApplied(
        uint256 indexed battleId,
        uint256 round,
        address indexed character,
        string statusEffectName,
        uint256 duration
    );

    event BattleQuit(
        uint256 indexed battleId,
        uint256 round,
        address indexed quitter
    );

    event StatusEffectResolved(
        uint256 indexed battleId,
        address indexed player,
        uint256 effectId,
        string effectName,
        string effectType,
        uint256 effectValue,
        uint256 round,
        uint256 duration
    );

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
        p.stats.health = characterContract.getCharacterHealth(tokenId);
        p.stats.attack = characterContract.getCharacterAttack(tokenId);
        p.stats.defense = characterContract.getCharacterDefense(tokenId);
        p.stats.mana = characterContract.getMana(tokenId);
        p.stats.typeId = characterContract.getCharacterType(tokenId);
        p.equippedSkills = characterContract.getEquippedSkills(tokenId);

        console.log("Character proxy created for player", player);
        console.log("Health:", p.stats.health);
        console.log("Mana:", p.stats.mana);

        BattleData storage battle = battles[battleId];
        if (player == battle.players[0]) {
            battle.battleStats.initialHealth[0] = p.stats.health;
            battle.battleStats.initialMana[0] = p.stats.mana; // Populate initialMana for player 1
        } else {
            battle.battleStats.initialHealth[1] = p.stats.health;
            battle.battleStats.initialMana[1] = p.stats.mana; // Populate initialMana for player 2
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
            battleStats: BattleStats({
                initialHealth: [uint256(0), uint256(0)],
                initialMana: [uint256(0), uint256(0)],
                totalDamageDealt: [uint256(0), uint256(0)],
                totalDamageTaken: [uint256(0), uint256(0)]
            }),
            moveSubmitted: [false, false],
            round: 1
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

        emit NewBattle(
            battle.name,
            battleId,
            battle.players[0],
            msg.sender,
            characterTokenId
        );
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

        // Emit the MoveSubmitted event first
        emit MoveSubmitted(battleId, msg.sender, move, battle.round);

        // Generate and store the attack multiplier only if the move is not DEFEND or DO_NOTHING
        if (move != Move.DEFEND && move != Move.DO_NOTHING) {
            p.attackMultiplier = _generateAttackMultiplier();

            // Emit the DiceRolled event with the generated attackMultiplier
            emit DiceRolled(
                battleId,
                msg.sender,
                battle.round,
                p.attackMultiplier
            );
        }

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

        // Check if both moves have been submitted
        if (battle.moveSubmitted[0] && battle.moveSubmitted[1]) {
            _resolveRound(
                battleId,
                battle.skillIndices[0],
                battle.skillIndices[1]
            );
        }
    }

    function _handleMoves(
        uint256 moveA,
        uint256 moveB,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB
    ) private {
        if (moveA == uint256(Move.DEFEND)) {
            proxyA.stats.mana += 3;
        }
        if (moveB == uint256(Move.DEFEND)) {
            proxyB.stats.mana += 3;
        }
    }

    function _resolveRound(
        uint256 battleId,
        uint256 _skillId0,
        uint256 _skillId1
    ) private {
        BattleData storage battle = battles[battleId];

        CharacterProxy storage proxyA = _getCharacterProxy(
            battleId,
            battle.players[0]
        );
        CharacterProxy storage proxyB = _getCharacterProxy(
            battleId,
            battle.players[1]
        );

        address[2] memory damagedPlayers;
        uint256[2] memory damageDealt;

        uint256[2] memory statusEffectDamage;

        statusEffectDamage[0] = _resolveStatusEffects(
            battleId,
            battle.round,
            proxyA
        );
        statusEffectDamage[1] = _resolveStatusEffects(
            battleId,
            battle.round,
            proxyB
        );

        // Simplify stun logic
        if (proxyA.isStunned) {
            battle.moves[0] = uint256(Move.DO_NOTHING);
        }
        if (proxyB.isStunned) {
            battle.moves[1] = uint256(Move.DO_NOTHING);
        }

        // Handle moves
        _handleMoves(battle.moves[0], battle.moves[1], proxyA, proxyB);

        // Handle ATTACK logic in a new separate function.
        (damageDealt, damagedPlayers) = _handleAttackLogic(
            battle,
            proxyA,
            proxyB,
            _skillId0,
            _skillId1
        );

        // Handle status effect damage
        _handleStatusEffectDamage(
            statusEffectDamage,
            proxyA,
            proxyB,
            damageDealt
        );

        // Reset multiplier
        proxyA.attackMultiplier = 1;
        proxyB.attackMultiplier = 1;

        // Update total damage dealt and taken
        battle.battleStats.totalDamageDealt[0] += damageDealt[0];
        battle.battleStats.totalDamageDealt[1] += damageDealt[1];
        battle.battleStats.totalDamageTaken[0] += damageDealt[1]; // Player 0 takes the damage dealt by player 1
        battle.battleStats.totalDamageTaken[1] += damageDealt[0]; // Player 1 takes the damage dealt by player 0

        emit RoundEnded(
            battleId,
            damagedPlayers,
            damageDealt,
            [damageDealt[1], damageDealt[0]], // Damage taken is the damage dealt by the opponent
            battle.round
        );

        // Check if the battle has ended and declare a winner
        if (proxyA.stats.health == 0 || proxyB.stats.health == 0) {
            address winner = proxyA.stats.health > proxyB.stats.health
                ? battle.players[0]
                : battle.players[1];
            _endBattle(battleId, winner);
            return;
        } else {
            // If no character has lost all their health, reset the move submissions for the next round.
            battle.moveSubmitted[0] = false;
            battle.moveSubmitted[1] = false;
            battle.round += 1;
        }
    }

    function _handleAttackLogic(
        BattleData storage battle,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB,
        uint256 _skillId0,
        uint256 _skillId1
    ) private returns (uint256[2] memory, address[2] memory) {
        address[2] memory damagedPlayers;
        uint256[2] memory damageDealt;

        uint256 moveA = battle.moves[0];
        uint256 moveB = battle.moves[1];

        // Both players attack
        if (moveA == uint256(Move.ATTACK) && moveB == uint256(Move.ATTACK)) {
            (damageDealt, damagedPlayers) = _handleAttackAttack(
                battle,
                proxyA,
                proxyB
            );
        }
        // Player 1 attacks, player 2 defends
        else if (
            moveA == uint256(Move.ATTACK) && moveB == uint256(Move.DEFEND)
        ) {
            (damageDealt, damagedPlayers) = _handleAttackDefend(
                battle,
                proxyA,
                proxyB
            );
        }
        // Player 2 attacks, player 1 defends
        else if (
            moveA == uint256(Move.DEFEND) && moveB == uint256(Move.ATTACK)
        ) {
            (damageDealt, damagedPlayers) = _handleDefendAttack(
                battle,
                proxyA,
                proxyB
            );
        }
        // Player 1 attacks, player 2 does nothing
        else if (
            moveA == uint256(Move.ATTACK) && moveB == uint256(Move.DO_NOTHING)
        ) {
            (damageDealt, damagedPlayers) = _handleAttackDoNothing(
                battle,
                proxyA,
                proxyB
            );
        }
        // Player 1 does nothing, player 2 attacks
        else if (
            moveA == uint256(Move.DO_NOTHING) && moveB == uint256(Move.ATTACK)
        ) {
            (damageDealt, damagedPlayers) = _handleDoNothingAttack(
                battle,
                proxyA,
                proxyB
            );
        }

        // USE_SKILL logic here.
        if (moveA == uint256(Move.USE_SKILL)) {
            (damagedPlayers[0], damageDealt[0]) = _executeSkill(
                battle.battleId,
                battle.round,
                proxyA,
                _skillId0,
                proxyB,
                moveB // passing opponent's move here
            );
        }

        if (moveB == uint256(Move.USE_SKILL)) {
            (damagedPlayers[1], damageDealt[1]) = _executeSkill(
                battle.battleId,
                battle.round,
                proxyB,
                _skillId1,
                proxyA,
                moveA // passing opponent's move here
            );
        }
        return (damageDealt, damagedPlayers);
    }

    function _handleStatusEffectDamage(
        uint256[2] memory statusEffectDamage,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB,
        uint256[2] memory damageDealt
    ) private {
        // Apply status effects damage to health
        if (proxyA.stats.health > statusEffectDamage[0]) {
            proxyA.stats.health -= statusEffectDamage[0];
        } else {
            proxyA.stats.health = 0;
        }

        if (proxyB.stats.health > statusEffectDamage[1]) {
            proxyB.stats.health -= statusEffectDamage[1];
        } else {
            proxyB.stats.health = 0;
        }

        // Add the statusEffectDamage to damageDealt
        damageDealt[0] += statusEffectDamage[0];
        damageDealt[1] += statusEffectDamage[1];
    }

    function _getCharacterProxy(
        uint256 battleId,
        address player
    ) private view returns (CharacterProxy storage) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        return characterProxies[battleKey][player];
    }

    // Both players attack
    function _handleAttackAttack(
        BattleData storage battle,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB
    )
        private
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = (proxyA.stats.attack * proxyA.attackMultiplier) /
            1000;
        uint256 damageB = (proxyB.stats.attack * proxyB.attackMultiplier) /
            1000;
        proxyB.stats.health = proxyB.stats.health > damageA
            ? proxyB.stats.health - damageA
            : 0;
        proxyA.stats.health = proxyA.stats.health > damageB
            ? proxyA.stats.health - damageB
            : 0;
        proxyA.stats.mana -= 3;
        proxyB.stats.mana -= 3;
        damagedPlayers = [battle.players[0], battle.players[1]];
        damageDealt = [damageA, damageB];
        return (damageDealt, damagedPlayers);
    }

    // Player 1 attacks, player 2 defends
    function _handleAttackDefend(
        BattleData storage battle,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB
    )
        private
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        damageDealt = [uint256(0), uint256(0)]; // Initialize to zeros
        uint256 damageA = (proxyA.stats.attack * proxyA.attackMultiplier) /
            1000;
        if (proxyB.stats.defense < damageA) {
            uint256 damage = damageA - proxyB.stats.defense;
            proxyB.stats.health = proxyB.stats.health > damage
                ? proxyB.stats.health - damage
                : 0;
            damagedPlayers[0] = battle.players[1];
            damageDealt[0] = damage;
        }
        proxyA.stats.mana -= 3;
        proxyB.stats.mana += 3;
        return (damageDealt, damagedPlayers);
    }

    // Player 2 attacks, player 1 defends
    function _handleDefendAttack(
        BattleData storage battle,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB
    )
        private
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        damageDealt = [uint256(0), uint256(0)]; // Initialize to zeros
        uint256 damageB = (proxyB.stats.attack * proxyB.attackMultiplier) /
            1000;
        if (proxyA.stats.defense < damageB) {
            uint256 damage = damageB - proxyA.stats.defense;
            proxyA.stats.health = proxyA.stats.health > damage
                ? proxyA.stats.health - damage
                : 0;
            damagedPlayers[0] = battle.players[0];
            damageDealt[1] = damage;
        }
        proxyA.stats.mana += 3;
        proxyB.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
    }

    // Player 1 attacks, player 2 does nothing
    function _handleAttackDoNothing(
        BattleData storage battle,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB
    )
        private
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = (proxyA.stats.attack * proxyA.attackMultiplier) /
            1000;
        proxyB.stats.health = proxyB.stats.health > damageA
            ? proxyB.stats.health - damageA
            : 0;
        damagedPlayers[0] = battle.players[1];
        damageDealt[0] = damageA;
        proxyA.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
    }

    // Player 1 does nothing, player 2 attacks
    function _handleDoNothingAttack(
        BattleData storage battle,
        CharacterProxy storage proxyA,
        CharacterProxy storage proxyB
    )
        private
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageB = (proxyB.stats.attack * proxyB.attackMultiplier) /
            1000;
        proxyA.stats.health = proxyA.stats.health > damageB
            ? proxyA.stats.health - damageB
            : 0;
        damagedPlayers[0] = battle.players[0];
        damageDealt[1] = damageB;
        proxyB.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
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

    function _generateAttackMultiplier() private view returns (uint256) {
        uint256 randomNumber = (uint256(
            keccak256(
                abi.encodePacked(block.difficulty, block.timestamp, msg.sender)
            )
        ) % 20) + 1;
        return 1000 + randomNumber * 100;
    }

    function _executeSkill(
        uint256 battleId,
        uint256 round,
        CharacterProxy storage player,
        uint256 skillId,
        CharacterProxy storage opponent,
        uint256 opponentMove
    ) private returns (address, uint256) {
        BattleSkills.Skill memory skill = battleSkillsContract.getSkill(
            skillId
        );
        uint256 rawDamage = (player.attackMultiplier * skill.damage) / 1000;
        uint256 totalDamage = rawDamage;

        if (opponentMove == uint256(Move.DEFEND)) {
            totalDamage = rawDamage > opponent.stats.defense
                ? rawDamage - opponent.stats.defense
                : 0;
        }

        address damagedPlayer = address(0);

        if (totalDamage > 0) {
            opponent.stats.health = opponent.stats.health > totalDamage
                ? opponent.stats.health - totalDamage
                : 0;
            damagedPlayer = opponent.owner;
        }

        emit SkillExecuted(
            battleId,
            round,
            player.owner,
            skill.name,
            totalDamage
        );

        BattleSkills.StatusEffect memory statusEffect = battleSkillsContract
            .getStatusEffect(skill.statusEffectId);

        if (statusEffect.isPositive) {
            _applyStatusEffect(
                player,
                skill.statusEffectId,
                statusEffect.duration
            );
            // Emit the StatusEffectApplied event
            emit StatusEffectApplied(
                battleId,
                round,
                opponent.owner,
                statusEffect.name,
                statusEffect.duration
            );
        } else {
            _applyStatusEffect(
                opponent,
                skill.statusEffectId,
                statusEffect.duration
            );
            // Emit the StatusEffectApplied event
            emit StatusEffectApplied(
                battleId,
                round,
                opponent.owner,
                statusEffect.name,
                statusEffect.duration
            );
        }

        player.stats.mana -= skill.manaCost;

        return (damagedPlayer, totalDamage);
    }

    function _boostAttack(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 attackBoost
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.attack += attackBoost;
        }
    }

    function _reduceAttack(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 attackReduction
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.attack = character.stats.attack > attackReduction
                ? character.stats.attack - attackReduction
                : 0;
        }
    }

    function _healOverTime(
        CharacterProxy storage character,
        uint256 healPerTurn
    ) private {
        character.stats.health += healPerTurn;
    }

    function _defenseBoost(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 defenseBoost
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.defense += defenseBoost;
        }
    }

    function _reduceDefense(
        CharacterProxy storage character,
        uint256 effectId,
        uint256 defenseReduction
    ) private {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.defense = character.stats.defense > defenseReduction
                ? character.stats.defense - defenseReduction
                : 0;
        }
    }

    function _damageOverTime(
        CharacterProxy storage character,
        uint256 damagePerTurn
    ) private {
        character.stats.health = character.stats.health > damagePerTurn
            ? character.stats.health - damagePerTurn
            : 0;
    }

    function _resolveStatusEffects(
        uint256 battleId,
        uint256 round,
        CharacterProxy storage character
    ) private returns (uint256) {
        bool isStunned = false;
        uint256 totalDamage = 0;

        for (uint256 i = 0; i < character.activeEffectIds.length; i++) {
            uint256 effectId = character.activeEffectIds[i];
            BattleSkills.StatusEffect memory statusEffect = battleSkillsContract
                .getStatusEffect(effectId);

            if (
                statusEffect.isStun &&
                character.activeEffectDurations[effectId] > 0
            ) {
                isStunned = true;
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "stun",
                    1,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }

            // Decrement the duration of the status effect
            character.activeEffectDurations[effectId] -= 1;

            if (statusEffect.attackBoost > 0) {
                _boostAttack(character, effectId, statusEffect.attackBoost);
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "attackBoost",
                    statusEffect.attackBoost,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }
            if (statusEffect.attackReduction > 0) {
                _reduceAttack(
                    character,
                    effectId,
                    statusEffect.attackReduction
                );
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "attackReduction",
                    statusEffect.attackReduction,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }
            if (statusEffect.defenseBoost > 0) {
                _defenseBoost(character, effectId, statusEffect.defenseBoost);
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "defenseBoost",
                    statusEffect.defenseBoost,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }
            if (statusEffect.defenseReduction > 0) {
                _reduceDefense(
                    character,
                    effectId,
                    statusEffect.defenseReduction
                );
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "defenseReduction",
                    statusEffect.defenseReduction,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }
            if (statusEffect.healPerTurn > 0) {
                _healOverTime(character, statusEffect.healPerTurn);
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "healPerTurn",
                    statusEffect.healPerTurn,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }
            if (statusEffect.damagePerTurn > 0) {
                uint256 previousHealth = character.stats.health;
                _damageOverTime(character, statusEffect.damagePerTurn);
                if (character.stats.health < previousHealth) {
                    totalDamage += previousHealth - character.stats.health;
                }
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectId,
                    statusEffect.name,
                    "damagePerTurn",
                    statusEffect.damagePerTurn,
                    round,
                    character.activeEffectDurations[effectId]
                );
            }

            if (character.activeEffectDurations[effectId] == 0) {
                if (statusEffect.attackBoost > 0) {
                    character.stats.attack -= statusEffect.attackBoost;
                    character.appliedEffects[effectId] = false;
                }
                if (statusEffect.attackReduction > 0) {
                    character.stats.attack += statusEffect.attackReduction;
                    character.appliedEffects[effectId] = false;
                }
                if (statusEffect.defenseBoost > 0) {
                    character.stats.defense -= statusEffect.defenseBoost;
                    character.appliedEffects[effectId] = false;
                }
                if (statusEffect.defenseReduction > 0) {
                    character.stats.defense += statusEffect.defenseReduction;
                    character.appliedEffects[effectId] = false;
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

        return totalDamage;
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

        emit BattleQuit(_battleId, _battle.round, msg.sender);

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
        ][player1].stats.health;
        uint256 player2Health = characterProxies[
            keccak256(abi.encodePacked(_battleId, player2))
        ][player2].stats.health;
        bool battleFought = player1Health == 0 || player2Health == 0;

        // If the battle was actually fought, grant experience points to the winner and the loser
        if (battleFought) {
            characterContract.gainXP(battle.characterIds[winnerIndex], 100);
            characterContract.gainXP(battle.characterIds[loserIndex], 30);
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
        uint256 usedManaPlayer1 = battle.battleStats.initialMana[0] -
            characterProxies[keccak256(abi.encodePacked(_battleId, player1))][
                player1
            ].stats.mana;
        uint256 usedManaPlayer2 = battle.battleStats.initialMana[1] -
            characterProxies[keccak256(abi.encodePacked(_battleId, player2))][
                player2
            ].stats.mana;

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

    function getBattleSummary(
        uint256 _battleId
    )
        public
        view
        returns (
            uint256 round,
            uint256[2] memory damageTaken,
            uint256[2] memory damageDealt,
            uint256[2] memory manaConsumed,
            address winner,
            address loser
        )
    {
        BattleData storage battle = battles[_battleId];

        round = battle.round;
        damageTaken = battle.battleStats.totalDamageTaken;
        damageDealt = battle.battleStats.totalDamageDealt;

        address player1 = battle.players[0];
        address player2 = battle.players[1];

        uint256 initialManaPlayer1 = battle.battleStats.initialMana[0];
        uint256 initialManaPlayer2 = battle.battleStats.initialMana[1];

        uint256 usedManaPlayer1 = initialManaPlayer1 -
            characterProxies[keccak256(abi.encodePacked(_battleId, player1))][
                player1
            ].stats.mana;
        uint256 usedManaPlayer2 = initialManaPlayer2 -
            characterProxies[keccak256(abi.encodePacked(_battleId, player2))][
                player2
            ].stats.mana;

        manaConsumed = [usedManaPlayer1, usedManaPlayer2];

        winner = battle.winner;
        loser = winner == player1 ? player2 : player1;

        return (round, damageTaken, damageDealt, manaConsumed, winner, loser);
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
            health: proxy.stats.health,
            attack: proxy.stats.attack,
            defense: proxy.stats.defense,
            mana: proxy.stats.mana,
            typeId: proxy.stats.typeId,
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
            ].stats.health;
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
