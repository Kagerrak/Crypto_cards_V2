// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "./Character.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";
import "./StructsLibrary.sol";
import "./BattleResolutionLibrary.sol";
import "./StatusEffectsLibrary.sol";

contract Battle is Ownable {
    function _canSetOwner() internal view virtual override returns (bool) {
        return true;
    }

    AggregatorV3Interface internal priceFeed;
    uint256 public feeCollected; // variable to track fee
    uint256 public leagueRewards; // variable to track league rewards
    uint256 public staminaCost = 10;

    using BattleResolutionLibrary for StructsLibrary.BattleData;
    using BattleResolutionLibrary for StructsLibrary.CharacterProxy;
    using StatusEffectsLibrary for StructsLibrary.BattleData;
    using StatusEffectsLibrary for StructsLibrary.CharacterProxy;

    mapping(uint256 => StructsLibrary.BattleData) public battles;
    uint256[] public activeBattlesId;
    mapping(uint256 => uint256) private battleIdToActiveIndex;

    mapping(address => uint256) public playerOngoingBattle;
    mapping(bytes32 => mapping(address => StructsLibrary.CharacterProxy))
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
        StructsLibrary.Move move,
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
        uint256 skillId,
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

        StructsLibrary.CharacterProxy storage p = characterProxies[battleKey][
            player
        ];
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

        StructsLibrary.BattleData storage battle = battles[battleId];
        if (player == battle.players[0]) {
            battle.battleStats.initialHealth[0] = p.stats.health;
            battle.battleStats.initialMana[0] = p.stats.mana; // Populate initialMana for player 1
        } else {
            battle.battleStats.initialHealth[1] = p.stats.health;
            battle.battleStats.initialMana[1] = p.stats.mana; // Populate initialMana for player 2
        }

        emit CharacterProxyData(
            battleId,
            player,
            p.id,
            p.owner,
            p.stats.health,
            p.stats.attack,
            p.stats.defense,
            p.stats.mana,
            p.stats.typeId,
            p.equippedSkills
        );
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

        StructsLibrary.BattleData memory newBattle = StructsLibrary.BattleData({
            battleId: battleCounter,
            name: _name,
            players: [msg.sender, address(0)],
            characterIds: [_characterTokenId, 0],
            moves: [uint256(0), uint256(0)],
            skillIndices: [uint256(0), uint256(0)],
            battleStatus: StructsLibrary.BattleStatus.PENDING,
            winner: address(0),
            battleStats: StructsLibrary.BattleStats({
                initialHealth: [uint256(0), uint256(0)],
                initialMana: [uint256(0), uint256(0)],
                totalDamageDealt: [uint256(0), uint256(0)],
                totalDamageTaken: [uint256(0), uint256(0)],
                damageReduced: [uint256(0), uint256(0)], // New field
                healthRegenerated: [uint256(0), uint256(0)], // New field
                manaRegenerated: [uint256(0), uint256(0)], // New field
                expReceived: [uint256(0), uint256(0)], // New field
                leagueBattlePointsEarned: [uint256(0), uint256(0)] // New field
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
        StructsLibrary.BattleData storage battle = battles[_battleId];

        require(
            battle.players[0] == msg.sender,
            "Only the creator can cancel the battle"
        );
        require(
            battle.battleStatus == StructsLibrary.BattleStatus.PENDING,
            "Cannot cancel a started battle"
        );

        battle.battleStatus = StructsLibrary.BattleStatus.ENDED;
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

        StructsLibrary.BattleData storage battle = battles[battleId];
        require(
            battle.battleStatus == StructsLibrary.BattleStatus.PENDING,
            "Battle has already started"
        );
        require(
            battle.players[1] == address(0),
            "Battle already has two players"
        );

        battle.characterIds[1] = characterTokenId;
        battle.players[1] = msg.sender;
        battle.battleStatus = StructsLibrary.BattleStatus.STARTED;

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
        StructsLibrary.Move move,
        uint256 skillId
    ) external onlyParticipant(battleId) {
        StructsLibrary.BattleData storage battle = battles[battleId];
        require(
            battle.battleStatus == StructsLibrary.BattleStatus.STARTED,
            "Battle has not started or has already ended"
        );
        require(
            move == StructsLibrary.Move.ATTACK ||
                move == StructsLibrary.Move.DEFEND ||
                move == StructsLibrary.Move.USE_SKILL ||
                move == StructsLibrary.Move.DO_NOTHING,
            "Invalid move: must be ATTACK, DEFEND, USE_SKILL, or DO_NOTHING"
        );

        uint256 playerIndex = (msg.sender == battle.players[0]) ? 0 : 1;
        require(
            !battle.moveSubmitted[playerIndex],
            "Move already submitted by player"
        );

        // Fetch the player's CharacterProxy
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, msg.sender));
        StructsLibrary.CharacterProxy storage p = characterProxies[battleKey][
            msg.sender
        ];

        // Emit the MoveSubmitted event first
        emit MoveSubmitted(battleId, msg.sender, move, battle.round);

        // Generate and store the attack multiplier only if the move is not DEFEND or DO_NOTHING
        if (
            move != StructsLibrary.Move.DEFEND &&
            move != StructsLibrary.Move.DO_NOTHING
        ) {
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
        if (move == StructsLibrary.Move.USE_SKILL) {
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
        if (move == StructsLibrary.Move.USE_SKILL) {
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

    function _resolveRound(
        uint256 battleId,
        uint256 _skillId0,
        uint256 _skillId1
    ) private {
        StructsLibrary.BattleData storage battle = battles[battleId];

        StructsLibrary.CharacterProxy storage proxyA = _getCharacterProxy(
            battleId,
            battle.players[0]
        );
        StructsLibrary.CharacterProxy storage proxyB = _getCharacterProxy(
            battleId,
            battle.players[1]
        );

        address[2] memory damagedPlayers;
        uint256[2] memory damageDealt;

        uint256[2] memory statusEffectDamage;

        // Call the resolveStatusEffects function from the StatusEffectsLibrary
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
            battle.moves[0] = uint256(StructsLibrary.Move.DO_NOTHING);
        }
        if (proxyB.isStunned) {
            battle.moves[1] = uint256(StructsLibrary.Move.DO_NOTHING);
        }

        // Handle moves
        battle.handleDefend(proxyA, proxyB);

        // Handle ATTACK logic in a new separate function.
        if (
            !(battle.moves[0] == uint256(StructsLibrary.Move.USE_SKILL) &&
                battle.moves[1] == uint256(StructsLibrary.Move.USE_SKILL))
        ) {
            (damageDealt, damagedPlayers) = battle.handleAttackLogic(
                proxyA,
                proxyB
            );
        }

        // USE_SKILL logic here.
        if (battle.moves[0] == uint256(StructsLibrary.Move.USE_SKILL)) {
            (damagedPlayers[0], damageDealt[0]) = _executeSkill(
                battle.battleId,
                battle.round,
                proxyA,
                _skillId0,
                proxyB,
                battle.moves[1] // passing opponent's move here
            );
        }

        if (battle.moves[1] == uint256(StructsLibrary.Move.USE_SKILL)) {
            (damagedPlayers[1], damageDealt[1]) = _executeSkill(
                battle.battleId,
                battle.round,
                proxyB,
                _skillId1,
                proxyA,
                battle.moves[0] // passing opponent's move here
            );
        }

        // Handle status effect damage
        StatusEffectsLibrary.handleStatusEffectDamage(
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

    function _getCharacterProxy(
        uint256 battleId,
        address player
    ) private view returns (StructsLibrary.CharacterProxy storage) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        return characterProxies[battleKey][player];
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
        StructsLibrary.CharacterProxy storage player,
        uint256 skillId,
        StructsLibrary.CharacterProxy storage opponent,
        uint256 opponentMove
    ) private returns (address, uint256) {
        BattleSkills.Skill memory skill = battleSkillsContract.getSkill(
            skillId
        );
        uint256 rawDamage = (player.attackMultiplier * skill.damage) / 1000;
        uint256 totalDamage = rawDamage;

        if (opponentMove == uint256(StructsLibrary.Move.DEFEND)) {
            totalDamage = rawDamage > opponent.stats.defense
                ? rawDamage - opponent.stats.defense
                : 0;
            battles[battleId].battleStats.damageReduced[
                opponent.owner == battles[battleId].players[0] ? 0 : 1
            ] += rawDamage - totalDamage; // Update damageReduced for the opponent
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
            skillId,
            skill.name,
            totalDamage
        );

        BattleSkills.StatusEffect memory statusEffect = battleSkillsContract
            .getStatusEffect(skill.statusEffectId);

        if (statusEffect.isPositive) {
            player.applyStatusEffect(
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
            opponent.applyStatusEffect(
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

    function _resolveStatusEffects(
        uint256 battleId,
        uint256 round,
        StructsLibrary.CharacterProxy storage character
    ) private returns (uint256) {
        (
            uint256 totalDamage,
            bool isStunned,
            uint256[] memory effectIds,
            string[] memory effectNames,
            string[] memory effectTypes,
            uint256[] memory effectValues,
            uint256[] memory effectRounds,
            uint256[] memory effectDurations
        ) = character.resolveStatusEffects(battleSkillsContract, round);

        for (uint256 i = 0; i < effectIds.length; i++) {
            if (
                isStunned &&
                keccak256(abi.encodePacked(effectTypes[i])) ==
                keccak256(abi.encodePacked("stun"))
            ) {
                emit StatusEffectResolved(
                    battleId,
                    character.owner,
                    effectIds[i],
                    effectNames[i],
                    effectTypes[i],
                    effectValues[i],
                    effectRounds[i],
                    effectDurations[i]
                );
            }
        }
        return (totalDamage);
    }

    function quitBattle(uint256 _battleId) public {
        require(
            battles[_battleId].players[0] != address(0),
            "Battle not found!"
        );

        StructsLibrary.BattleData memory _battle = battles[_battleId];
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
        StructsLibrary.BattleData storage battle = battles[_battleId];
        battle.winner = _winner;
        battle.battleStatus = StructsLibrary.BattleStatus.ENDED;

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

            // Update expReceived field
            battle.battleStats.expReceived[winnerIndex] = 100;
            battle.battleStats.expReceived[loserIndex] = 30;
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
        StructsLibrary.BattleData storage battle,
        uint256 winnerIndex,
        uint256 loserIndex
    ) internal {
        // Calculate used mana for each player's character
        address winner = battle.players[winnerIndex];
        address loser = battle.players[loserIndex];

        uint256 usedManaWinner = battle.battleStats.initialMana[winnerIndex] -
            characterProxies[keccak256(abi.encodePacked(_battleId, winner))][
                winner
            ].stats.mana;
        uint256 usedManaLoser = battle.battleStats.initialMana[loserIndex] -
            characterProxies[keccak256(abi.encodePacked(_battleId, loser))][
                loser
            ].stats.mana;

        // Consume used mana for each player's character
        characterContract.consumeMana(
            battle.characterIds[winnerIndex],
            usedManaWinner
        );
        characterContract.consumeMana(
            battle.characterIds[loserIndex],
            usedManaLoser
        );
    }

    function getBattle(
        uint256 _battleId
    ) external view returns (StructsLibrary.BattleData memory) {
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
    ) public view returns (StructsLibrary.CharacterProxyView memory) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        StructsLibrary.CharacterProxy storage proxy = characterProxies[
            battleKey
        ][player];

        StructsLibrary.CharacterProxyView memory proxyView = StructsLibrary
            .CharacterProxyView({
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
        StructsLibrary.CharacterProxy storage proxy = characterProxies[
            battleKey
        ][player];

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
        StructsLibrary.BattleData storage battle = battles[battleId];
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
