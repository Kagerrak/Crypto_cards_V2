// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./StructsLibrary.sol";
import "./Character.sol"; // Assuming Character is the name of the contract that contains getCharacterInfo()
import "./Battle.sol";
import "./BattleEffects.sol";
import "./ICompositeTokens.sol";
import "./StatusEffectsLibrary.sol";

contract BattleHelper is Ownable {
    Character private characterContract;
    BattleSkills private battleSkillsContract;
    BattleEffects private battleEffectsContract;
    ICompositeTokens private compositeContract;
    Battle private battleContract;

    address public battleContractAddress;

    uint256 constant MAX_PERCENT = 100;

    using StatusEffectsLibrary for StructsLibrary.CharacterProxy;

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

    event DiceRolled(
        uint256 indexed battleId,
        address indexed player,
        uint256 round,
        uint256 diceNumber
    );

    event RoundEnded(
        uint256 indexed battleId,
        address[2] damagedPlayers,
        uint256[2] damageDealt,
        uint256[2] damageTaken,
        uint256 indexed round
    );

    event StatusEffectApplied(
        uint256 indexed battleId,
        uint256 round,
        address indexed character,
        string statusEffectName,
        uint256 duration
    );

    event SkillExecuted(
        uint256 indexed battleId,
        uint256 round,
        address indexed player,
        uint256 skillId,
        string skillName,
        uint256 totalDamage
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

    constructor(
        address _characterContractAddress,
        address _battleSkillsContractAddress,
        address _battleEffectsContractAddress,
        address _compositeTokensContractAddress
    ) {
        _setupOwner(msg.sender);
        characterContract = Character(_characterContractAddress);
        battleSkillsContract = BattleSkills(_battleSkillsContractAddress);
        battleEffectsContract = BattleEffects(_battleEffectsContractAddress);
        compositeContract = ICompositeTokens(_compositeTokensContractAddress);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return true;
    }

    // State variable for CharacterProxies
    mapping(bytes32 => mapping(address => StructsLibrary.CharacterProxy))
        private characterProxies;

    modifier onlyBattleContract() {
        require(
            msg.sender == battleContractAddress,
            "Caller is not the Battle contract"
        );
        _;
    }

    function setBattleContractAddress(
        address payable _battleContractAddress
    ) external onlyOwner {
        // Additional checks can be added here, such as only allowing the contract owner to set this.
        battleContractAddress = _battleContractAddress;
        battleContract = Battle(_battleContractAddress);
    }

    function createCharacterProxies(
        uint256 tokenId,
        address player,
        uint256 battleId
    ) external onlyBattleContract returns (uint256, uint256) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        CharData.CharBattleData memory battleData = characterContract
            .getCharacterInfo(tokenId);
        StructsLibrary.CharacterProxy storage p = characterProxies[battleKey][
            player
        ];

        p.id = tokenId;
        p.owner = player;
        p.stats.level = battleData.level;
        p.stats.dexterity = battleData.dexterity;
        p.stats.accuracy = battleData.accuracy;
        p.stats.health = battleData.health;
        p.stats.attack = battleData.attack;
        p.stats.defense = battleData.defense;
        p.stats.mana = battleData.mana;
        p.stats.typeId = battleData.typeId;
        p.equippedSkills = battleData.equippedSkills;

        // Log statements (if you are using a library for console.log)
        // console.log("Character proxy created for player", player);
        // console.log("Health:", p.stats.health);
        // console.log("Mana:", p.stats.mana);

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

        return (p.stats.health, p.stats.mana);
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

    function generateAndSetAttackMultiplier(
        uint256 battleId,
        address player,
        uint256 battleRound
    ) external onlyBattleContract {
        // Get CharacterProxy for the player in the specified battle
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        StructsLibrary.CharacterProxy storage p = characterProxies[battleKey][
            player
        ];

        // Generate attack multiplier
        uint256 attackMultiplier = _generateAttackMultiplier();

        // Set the attack multiplier in the CharacterProxy
        p.attackMultiplier = attackMultiplier;

        emit DiceRolled(battleId, player, battleRound, attackMultiplier); // Assuming battle.round is accessible; if not, it can be passed as a parameter.
    }

    function _generateAttackMultiplier() private view returns (uint256) {
        uint256 randomNumber = (uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)
            )
        ) % 20) + 1;
        return 1000 + randomNumber * 100;
    }

    function resolveRound(uint256 battleId) external onlyBattleContract {
        StructsLibrary.BattleData memory battle = battleContract.getBattle(
            battleId
        );

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

        // Set default moves if not submitted
        if (!battle.moveSubmitted[0]) {
            battle.moves[0] = uint256(StructsLibrary.Move.DO_NOTHING);
        }
        if (!battle.moveSubmitted[1]) {
            battle.moves[1] = uint256(StructsLibrary.Move.DO_NOTHING);
        }

        // Simplify stun logic
        if (proxyA.isStunned) {
            battle.moves[0] = uint256(StructsLibrary.Move.DO_NOTHING);
        }
        if (proxyB.isStunned) {
            battle.moves[1] = uint256(StructsLibrary.Move.DO_NOTHING);
        }

        // Handle moves
        battle = handleDefend(battle, proxyA, proxyB);

        // Handle ATTACK logic in a new separate function.
        if (
            !(battle.moves[0] == uint256(StructsLibrary.Move.USE_SKILL) &&
                battle.moves[1] == uint256(StructsLibrary.Move.USE_SKILL))
        ) {
            (damageDealt, damagedPlayers) = handleAttackLogic(
                battle,
                proxyA,
                proxyB
            );
        }

        // USE_SKILL logic here.
        if (battle.moves[0] == uint256(StructsLibrary.Move.USE_SKILL)) {
            (damagedPlayers[0], damageDealt[0]) = _executeSkill(
                battle,
                battle.round,
                proxyA,
                battle.skillIndices[0],
                proxyB,
                battle.moves[1], // passing opponent's move here
                1
            );
        }

        if (battle.moves[1] == uint256(StructsLibrary.Move.USE_SKILL)) {
            (damagedPlayers[1], damageDealt[1]) = _executeSkill(
                battle,
                battle.round,
                proxyB,
                battle.skillIndices[1],
                proxyA,
                battle.moves[0], // passing opponent's move here
                0
            );
        }

        // Handle status effect damage
        StatusEffectsLibrary.handleStatusEffectDamage(
            statusEffectDamage,
            proxyA,
            proxyB,
            damageDealt,
            damagedPlayers
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
            // Call _endBattle instead of setting the winner and battleStatus here.
            battleContract.endBattle(battleId, winner); // this function will handle state changes
            return;
        } else if (battle.round >= 12) {
            // Limit to 12 rounds
            address winner = proxyA.stats.health >= proxyB.stats.health
                ? battle.players[0]
                : battle.players[1];
            // Call _endBattle instead of setting the winner and battleStatus here.
            battleContract.endBattle(battleId, winner); // this function will handle state changes
            return;
        } else {
            // If no character has lost all their health, reset the move submissions for the next round.
            battle.moveSubmitted[0] = false;
            battle.moveSubmitted[1] = false;
            battle.round += 1;
            battleContract.setBattleData(battleId, battle); // Update the state in the Battle contract
        }
    }

    function _getCharacterProxy(
        uint256 battleId,
        address player
    ) private view returns (StructsLibrary.CharacterProxy storage) {
        bytes32 battleKey = keccak256(abi.encodePacked(battleId, player));
        return characterProxies[battleKey][player];
    }

    function _handleStatusEffect(
        uint256 battleId,
        uint256 round,
        StructsLibrary.CharacterProxy storage affectedPlayer,
        uint256 statusEffectId
    ) private {
        BattleEffects.StatusEffect memory statusEffect = battleEffectsContract
            .getStatusEffect(statusEffectId);

        affectedPlayer.applyStatusEffect(
            statusEffect.effectId,
            statusEffect.duration
        );

        emit StatusEffectApplied(
            battleId,
            round,
            affectedPlayer.owner,
            statusEffect.name,
            statusEffect.duration
        );
    }

    function _executeSkill(
        StructsLibrary.BattleData memory battle,
        uint256 round,
        StructsLibrary.CharacterProxy storage player,
        uint256 tokenId,
        StructsLibrary.CharacterProxy storage opponent,
        uint256 opponentMove,
        uint256 opponentIndex
    ) private returns (address, uint256) {
        uint256 battleSkillId;
        uint256 skillEffectId;

        // Check the tokenId to determine how to get the battleSkillId
        if (tokenId > 10000) {
            ICompositeTokens.CompositeTokenDetails
                memory compositeTokenDetails = compositeContract
                    .getCompositeTokenDetails(tokenId);
            battleSkillId = compositeTokenDetails.battleSkillId;
            skillEffectId = compositeTokenDetails.skillEffectId; // Get the skill effect ID here
        } else {
            battleSkillId = tokenId;
            skillEffectId = 0;
        }

        BattleSkills.Skill memory skill = battleSkillsContract.getSkill(
            battleSkillId
        );

        uint256 rawDamage = (player.attackMultiplier * skill.damage) / 1000;
        console.log(player.attackMultiplier);
        console.log(skill.damage);
        console.log(rawDamage);

        if (opponentMove == uint256(StructsLibrary.Move.DEFEND)) {
            rawDamage = rawDamage > opponent.stats.defense
                ? rawDamage - opponent.stats.defense
                : 0;
            battle.battleStats.damageReduced[opponentIndex] += opponent
                .stats
                .health > rawDamage
                ? rawDamage
                : opponent.stats.defense;
        }

        if (rawDamage > 0) {
            if (opponent.stats.health > rawDamage) {
                opponent.stats.health -= rawDamage;
                console.log(opponent.stats.health);
            } else {
                opponent.stats.health = 0;
            }
        }

        emit SkillExecuted(
            battle.battleId,
            round,
            player.owner,
            battleSkillId,
            skill.name,
            rawDamage
        );

        player.stats.mana -= skill.manaCost;

        if (skillEffectId != 0) {
            _handleStatusEffect(
                battle.battleId,
                round,
                battleEffectsContract.getStatusEffect(skillEffectId).isPositive
                    ? player
                    : opponent,
                skillEffectId
            );
        }

        return (rawDamage > 0 ? opponent.owner : address(0), rawDamage);
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
        ) = character.resolveStatusEffects(battleEffectsContract, round);

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

    function handleDefend(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    ) internal returns (StructsLibrary.BattleData memory) {
        // Handle defense action for player A
        if (battle.moves[0] == uint256(StructsLibrary.Move.DEFEND)) {
            proxyA.stats.mana += 3;
            battle.battleStats.manaRegenerated[0] += 3;
        }

        // Handle defense action for player B
        if (battle.moves[1] == uint256(StructsLibrary.Move.DEFEND)) {
            proxyB.stats.mana += 3;
            battle.battleStats.manaRegenerated[1] += 3;
        }

        return battle;
    }

    function handleAttackLogic(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    ) internal returns (uint256[2] memory, address[2] memory) {
        address[2] memory damagedPlayers;
        uint256[2] memory damageDealt;

        // Chance to hit calculations
        bool doesAHit = (random() % MAX_PERCENT) <
            calculateChanceToHit(proxyA, proxyB);
        bool doesBHit = (random() % MAX_PERCENT) <
            calculateChanceToHit(proxyB, proxyA);

        uint256 moveA = battle.moves[0];
        uint256 moveB = battle.moves[1];

        // Both players attack
        if (
            moveA == uint256(StructsLibrary.Move.ATTACK) &&
            moveB == uint256(StructsLibrary.Move.ATTACK)
        ) {
            (damageDealt, damagedPlayers) = handleAttackAttack(
                battle,
                proxyA,
                proxyB,
                doesAHit,
                doesBHit
            );
        }
        // Player 1 attacks, player 2 defends
        else if (
            moveA == uint256(StructsLibrary.Move.ATTACK) &&
            moveB == uint256(StructsLibrary.Move.DEFEND)
        ) {
            (damageDealt, damagedPlayers) = handleAttackDefend(
                battle,
                proxyA,
                proxyB,
                doesAHit
            );
        }
        // Player 2 attacks, player 1 defends
        else if (
            moveA == uint256(StructsLibrary.Move.DEFEND) &&
            moveB == uint256(StructsLibrary.Move.ATTACK)
        ) {
            (damageDealt, damagedPlayers) = handleDefendAttack(
                battle,
                proxyA,
                proxyB,
                doesBHit
            );
        }
        // Player 1 attacks, player 2 does nothing
        else if (
            moveA == uint256(StructsLibrary.Move.ATTACK) &&
            moveB == uint256(StructsLibrary.Move.DO_NOTHING)
        ) {
            (damageDealt, damagedPlayers) = handleAttackDoNothing(
                battle,
                proxyA,
                proxyB,
                doesAHit
            );
        }
        // Player 1 does nothing, player 2 attacks
        else if (
            moveA == uint256(StructsLibrary.Move.DO_NOTHING) &&
            moveB == uint256(StructsLibrary.Move.ATTACK)
        ) {
            (damageDealt, damagedPlayers) = handleDoNothingAttack(
                battle,
                proxyA,
                proxyB,
                doesBHit
            );
        }
        // Player 1 attacks, player 2 uses skill
        else if (
            moveA == uint256(StructsLibrary.Move.ATTACK) &&
            moveB == uint256(StructsLibrary.Move.USE_SKILL)
        ) {
            (damageDealt, damagedPlayers) = handleAttackSkill(
                battle,
                proxyA,
                proxyB,
                doesAHit
            );
        }
        // Player 1 uses skill, player 2 attacks
        else if (
            moveA == uint256(StructsLibrary.Move.USE_SKILL) &&
            moveB == uint256(StructsLibrary.Move.ATTACK)
        ) {
            (damageDealt, damagedPlayers) = handleSkillAttack(
                battle,
                proxyA,
                proxyB,
                doesBHit
            );
        }

        return (damageDealt, damagedPlayers);
    }

    function handleAttackAttack(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesAHit,
        bool doesBHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = doesAHit
            ? (proxyA.stats.attack * proxyA.attackMultiplier) / 1000
            : 0;
        uint256 damageB = doesBHit
            ? (proxyB.stats.attack * proxyB.attackMultiplier) / 1000
            : 0;

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

    function handleAttackDefend(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesAHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = doesAHit
            ? (proxyA.stats.attack * proxyA.attackMultiplier) / 1000
            : 0;

        if (proxyB.stats.defense < damageA) {
            uint256 damage = damageA - proxyB.stats.defense;
            proxyB.stats.health = proxyB.stats.health > damage
                ? proxyB.stats.health - damage
                : 0;
            damagedPlayers[0] = battle.players[1];
            damageDealt[0] = damage;
        }

        proxyA.stats.mana -= 3;

        return (damageDealt, damagedPlayers);
    }

    function handleDefendAttack(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesBHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageB = doesBHit
            ? (proxyB.stats.attack * proxyB.attackMultiplier) / 1000
            : 0;

        if (proxyA.stats.defense < damageB) {
            uint256 damage = damageB - proxyA.stats.defense;
            proxyA.stats.health = proxyA.stats.health > damage
                ? proxyA.stats.health - damage
                : 0;
            damagedPlayers[1] = battle.players[0];
            damageDealt[1] = damage;
        }

        proxyB.stats.mana -= 3;

        return (damageDealt, damagedPlayers);
    }

    function handleAttackDoNothing(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesAHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = doesAHit
            ? (proxyA.stats.attack * proxyA.attackMultiplier) / 1000
            : 0;

        proxyB.stats.health = proxyB.stats.health > damageA
            ? proxyB.stats.health - damageA
            : 0;
        damagedPlayers[0] = battle.players[1];
        damageDealt[0] = damageA;

        proxyA.stats.mana -= 3;

        return (damageDealt, damagedPlayers);
    }

    function handleDoNothingAttack(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesBHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageB = doesBHit
            ? (proxyB.stats.attack * proxyB.attackMultiplier) / 1000
            : 0;

        proxyA.stats.health = proxyA.stats.health > damageB
            ? proxyA.stats.health - damageB
            : 0;
        damagedPlayers[1] = battle.players[0];
        damageDealt[1] = damageB;

        proxyB.stats.mana -= 3;

        return (damageDealt, damagedPlayers);
    }

    function handleAttackSkill(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesAHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = doesAHit
            ? (proxyA.stats.attack * proxyA.attackMultiplier) / 1000
            : 0;

        proxyB.stats.health = proxyB.stats.health > damageA
            ? proxyB.stats.health - damageA
            : 0;
        damagedPlayers[0] = battle.players[1];
        damageDealt[0] = damageA;

        proxyA.stats.mana -= 3;

        // Here, you might want to also handle the effects of the skill used by proxyB.

        return (damageDealt, damagedPlayers);
    }

    function handleSkillAttack(
        StructsLibrary.BattleData memory battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        bool doesBHit
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageB = doesBHit
            ? (proxyB.stats.attack * proxyB.attackMultiplier) / 1000
            : 0;

        proxyA.stats.health = proxyA.stats.health > damageB
            ? proxyA.stats.health - damageB
            : 0;
        damagedPlayers[1] = battle.players[0];
        damageDealt[1] = damageB;

        proxyB.stats.mana -= 3;

        // Here, you might want to also handle the effects of the skill used by proxyA.

        return (damageDealt, damagedPlayers);
    }

    function calculateChanceToHit(
        StructsLibrary.CharacterProxy storage attacker,
        StructsLibrary.CharacterProxy storage defender
    ) internal view returns (uint256) {
        int256 differenceInLevels = int256(attacker.stats.level) -
            int256(defender.stats.level);

        int256 baseChance = differenceInLevels +
            int256(defender.stats.level * 2);

        int256 chanceToHit = baseChance +
            int256(attacker.stats.accuracy) -
            int256(defender.stats.dexterity);

        // Ensure the chance doesn't exceed 100% or drop below 0%
        if (chanceToHit > 100) {
            return 100;
        } else if (chanceToHit < 0) {
            return 0;
        } else {
            return uint256(chanceToHit);
        }
    }

    function random() internal view returns (uint256) {
        return
            uint256(
                keccak256(abi.encodePacked(block.prevrandao, block.timestamp))
            );
    }
}
