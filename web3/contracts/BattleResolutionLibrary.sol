// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./StructsLibrary.sol";

library BattleResolutionLibrary {
    using StructsLibrary for StructsLibrary.BattleData;
    using StructsLibrary for StructsLibrary.CharacterProxy;

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
                proxyB
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
                proxyB
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
                proxyB
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
                proxyB
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
                proxyB
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
                proxyB
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
                proxyB
            );
        }

        return (damageDealt, damagedPlayers);
    }

    function handleAttackAttack(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    )
        internal
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
    function handleAttackDefend(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    )
        internal
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
            battle.battleStats.damageReduced[1] += proxyB.stats.defense; // Update damageReduced for player 2
        }
        battle.battleStats.damageReduced[1] += damageA;
        proxyA.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
    }

    // Player 2 attacks, player 1 defends
    function handleDefendAttack(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    )
        internal
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
            battle.battleStats.damageReduced[0] += proxyA.stats.defense; // Update damageReduced for player 1
        }
        battle.battleStats.damageReduced[0] += damageB;
        proxyB.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
    }

    // Player 1 attacks, player 2 does nothing
    function handleAttackDoNothing(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    )
        internal
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
    function handleDoNothingAttack(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB
    )
        internal
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

    function handleAttackSkill(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage attacker,
        StructsLibrary.CharacterProxy storage skillUser
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageA = (attacker.stats.attack * attacker.attackMultiplier) /
            1000;
        skillUser.stats.health = skillUser.stats.health > damageA
            ? skillUser.stats.health - damageA
            : 0;
        damagedPlayers[0] = battle.players[1];
        damageDealt[0] = damageA;
        attacker.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
    }

    function handleSkillAttack(
        StructsLibrary.BattleData storage battle,
        StructsLibrary.CharacterProxy storage skillUser,
        StructsLibrary.CharacterProxy storage attacker
    )
        internal
        returns (
            uint256[2] memory damageDealt,
            address[2] memory damagedPlayers
        )
    {
        uint256 damageB = (attacker.stats.attack * attacker.attackMultiplier) /
            1000;
        skillUser.stats.health = skillUser.stats.health > damageB
            ? skillUser.stats.health - damageB
            : 0;
        damagedPlayers[1] = battle.players[0];
        damageDealt[1] = damageB;
        attacker.stats.mana -= 3;
        return (damageDealt, damagedPlayers);
    }
}
