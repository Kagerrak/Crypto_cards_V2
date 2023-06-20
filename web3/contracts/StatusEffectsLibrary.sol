// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./StructsLibrary.sol";
import "./BattleSkills.sol";

library StatusEffectsLibrary {
    using StructsLibrary for StructsLibrary.CharacterProxy;

    function boostAttack(
        StructsLibrary.CharacterProxy storage character,
        uint256 effectId,
        uint256 value
    ) internal {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.attack += value;
        }
    }

    function reduceAttack(
        StructsLibrary.CharacterProxy storage character,
        uint256 effectId,
        uint256 value
    ) internal {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.attack = character.stats.attack > value
                ? character.stats.attack - value
                : 0;
        }
    }

    function healOverTime(
        StructsLibrary.CharacterProxy storage character,
        uint256 value
    ) internal {
        character.stats.health += value;
    }

    function defenseBoost(
        StructsLibrary.CharacterProxy storage character,
        uint256 effectId,
        uint256 value
    ) internal {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.defense += value;
        }
    }

    function reduceDefense(
        StructsLibrary.CharacterProxy storage character,
        uint256 effectId,
        uint256 value
    ) internal {
        if (!character.appliedEffects[effectId]) {
            character.appliedEffects[effectId] = true;
            character.stats.defense = character.stats.defense > value
                ? character.stats.defense - value
                : 0;
        }
    }

    function damageOverTime(
        StructsLibrary.CharacterProxy storage character,
        uint256 value
    ) internal {
        character.stats.health = character.stats.health > value
            ? character.stats.health - value
            : 0;
    }

    function applyStatusEffect(
        StructsLibrary.CharacterProxy storage character,
        uint256 statusEffectId,
        uint256 duration
    ) internal {
        // Add the status effect to the character's activeEffectIds array
        character.activeEffectIds.push(statusEffectId);

        // Update the character's activeEffectDurations mapping with the new duration
        character.activeEffectDurations[statusEffectId] = duration;
    }

    function handleStatusEffectDamage(
        uint256[2] memory statusEffectDamage,
        StructsLibrary.CharacterProxy storage proxyA,
        StructsLibrary.CharacterProxy storage proxyB,
        uint256[2] memory damageDealt
    ) internal {
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

    function resolveStatusEffects(
        StructsLibrary.CharacterProxy storage character,
        BattleSkills battleSkillsContract,
        uint256 round
    )
        internal
        returns (
            uint256 totalDamage,
            bool isStunned,
            uint256[] memory effectIds,
            string[] memory effectNames,
            string[] memory effectTypes,
            uint256[] memory effectValues,
            uint256[] memory effectRounds,
            uint256[] memory effectDurations
        )
    {
        isStunned = false;
        totalDamage = 0;

        // Initialize arrays for event data
        effectIds = new uint256[](character.activeEffectIds.length);
        effectNames = new string[](character.activeEffectIds.length);
        effectTypes = new string[](character.activeEffectIds.length);
        effectValues = new uint256[](character.activeEffectIds.length);
        effectRounds = new uint256[](character.activeEffectIds.length);
        effectDurations = new uint256[](character.activeEffectIds.length);

        for (uint256 i = 0; i < character.activeEffectIds.length; i++) {
            uint256 effectId = character.activeEffectIds[i];
            BattleSkills.StatusEffect memory statusEffect = battleSkillsContract
                .getStatusEffect(effectId);

            if (
                statusEffect.isStun &&
                character.activeEffectDurations[effectId] > 0
            ) {
                isStunned = true;
                effectTypes[i] = "stun";
                effectValues[i] = 1;
            }

            // Decrement the duration of the status effect
            character.activeEffectDurations[effectId] -= 1;

            if (statusEffect.attackBoost > 0) {
                StatusEffectsLibrary.boostAttack(
                    character,
                    effectId,
                    statusEffect.attackBoost
                );
                effectTypes[i] = "attackBoost";
                effectValues[i] = statusEffect.attackBoost;
            }
            if (statusEffect.attackReduction > 0) {
                StatusEffectsLibrary.reduceAttack(
                    character,
                    effectId,
                    statusEffect.attackReduction
                );
                effectTypes[i] = "attackReduction";
                effectValues[i] = statusEffect.attackReduction;
            }
            if (statusEffect.defenseBoost > 0) {
                StatusEffectsLibrary.defenseBoost(
                    character,
                    effectId,
                    statusEffect.defenseBoost
                );
                effectTypes[i] = "defenseBoost";
                effectValues[i] = statusEffect.defenseBoost;
            }
            if (statusEffect.defenseReduction > 0) {
                StatusEffectsLibrary.reduceDefense(
                    character,
                    effectId,
                    statusEffect.defenseReduction
                );
                effectTypes[i] = "defenseReduction";
                effectValues[i] = statusEffect.defenseReduction;
            }
            if (statusEffect.healPerTurn > 0) {
                StatusEffectsLibrary.healOverTime(
                    character,
                    statusEffect.healPerTurn
                );
                effectTypes[i] = "healPerTurn";
                effectValues[i] = statusEffect.healPerTurn;
            }
            if (statusEffect.damagePerTurn > 0) {
                uint256 previousHealth = character.stats.health;
                StatusEffectsLibrary.damageOverTime(
                    character,
                    statusEffect.damagePerTurn
                );
                if (character.stats.health < previousHealth) {
                    totalDamage += previousHealth - character.stats.health;
                }
                effectTypes[i] = "damagePerTurn";
                effectValues[i] = statusEffect.damagePerTurn;
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

            // Store data for event
            effectIds[i] = effectId;
            effectNames[i] = statusEffect.name;
            effectRounds[i] = round;
            effectDurations[i] = character.activeEffectDurations[effectId];
        }

        // Update the character's stun status based on the isStunned flag
        character.isStunned = isStunned;

        return (
            totalDamage,
            isStunned,
            effectIds,
            effectNames,
            effectTypes,
            effectValues,
            effectRounds,
            effectDurations
        );
    }
}
