// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./StructsLibrary.sol";

library BattleResolutionLibrary {
    using StructsLibrary for StructsLibrary.BattleData;
    using StructsLibrary for StructsLibrary.CharacterProxy;

    // Constants
    uint256 constant MAX_PERCENT = 100; // Represents 100% in our calculations

    function handleDefend(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    ) internal {
        if (battle.moves[0] == uint256(StructsLibrary.Move.DEFEND)) {
            proxyA.stats.mana += 3;
            battle.battleStats.manaRegenerated[0] += 3;
        }
        if (battle.moves[1] == uint256(StructsLibrary.Move.DEFEND)) {
            proxyB.stats.mana += 3;
            battle.battleStats.manaRegenerated[1] += 3;
        }
    }

    function handleAttackLogic(
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
        StructsLibrary.BattleData storage battle,
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
                keccak256(abi.encodePacked(block.difficulty, block.timestamp))
            );
    }
}
