// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library StructsLibrary {
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
}
