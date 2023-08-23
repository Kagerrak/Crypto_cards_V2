// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IBattleItems.sol";

library CharData {
    struct CharacterStats {
        uint256 tokenId;
        uint256 level;
        uint256 experience;
        uint256 health;
        uint256 mana;
        uint256 attack;
        uint256 defense;
        uint256 strength;
        uint256 dexterity;
        uint256 intelligence;
        uint256 vitality;
        uint256 accuracy;
        uint256 statPoints;
        uint256 typeId;
    }

    struct RecoveryStats {
        uint256 stamina;
        uint256 maxMana;
        uint256 lastStaminaUpdateTime;
        uint256 lastManaUpdateTime;
    }

    struct CharacterEquips {
        uint256[] equippedSkills;
        mapping(ItemType => uint256) equippedItems;
        uint256 equippedClass;
    }

    struct CharacterType {
        uint256 typeId;
        string characterType;
        string uri;
    }

    struct CharBattleData {
        uint256 level;
        uint256 dexterity;
        uint256 accuracy;
        uint256 health;
        uint256 attack;
        uint256 defense;
        uint256 mana;
        uint256 typeId;
        uint256[] equippedSkills;
    }

    enum TokenType {
        Item,
        Skill,
        Effect,
        CompositeItem,
        CompositeSkill
    }

    enum ItemType {
        Weapon,
        Headgear,
        BodyArmor,
        Pants,
        Footwear
    }
}
