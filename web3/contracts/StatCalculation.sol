// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library StatCalculation {
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

    function calculateExperienceRequired(
        uint256 level,
        uint256 baseXP
    ) public pure returns (uint256) {
        return baseXP * level;
    }

    function levelFromXP(
        uint256 totalXP,
        uint256 baseXP
    ) public pure returns (uint256) {
        uint256 currentLevel = 1;

        while (totalXP >= calculateExperienceRequired(currentLevel, baseXP)) {
            totalXP -= calculateExperienceRequired(currentLevel, baseXP);
            currentLevel += 1;
        }

        return currentLevel;
    }

    function addStats(
        CharacterStats storage charStat,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality
    ) public {
        uint256 totalStatPointsToSpend = strength +
            dexterity +
            intelligence +
            vitality;

        require(
            totalStatPointsToSpend <= charStat.statPoints,
            "Stat points to spend should not exceed available stat points"
        );

        charStat.strength += strength;
        charStat.dexterity += dexterity;
        charStat.intelligence += intelligence;
        charStat.vitality += vitality;

        charStat.health += vitality * 5;
        charStat.mana += intelligence * 5;
        charStat.accuracy += dexterity * 5;
        charStat.attack += strength * 5;
        charStat.statPoints -= totalStatPointsToSpend;
    }

    function levelUp(CharacterStats storage hero, uint256 baseXP) internal {
        uint256 currentLevel = hero.level;
        uint256 currentXP = hero.experience;

        uint256 newLevel = levelFromXP(currentXP, baseXP);
        require(
            newLevel > currentLevel,
            "Not enough experience points to level up"
        );

        hero.level = newLevel;
        hero.statPoints += 5 * (newLevel - currentLevel);
    }

    function gainXP(
        CharacterStats storage hero,
        uint256 xp,
        uint256 baseXP
    ) external {
        hero.experience += xp;

        uint256 newLevel = levelFromXP(hero.experience, baseXP);
        if (newLevel > hero.level) {
            levelUp(hero, baseXP);
        }
    }

    function getStamina(
        RecoveryStats storage heroRecovery
    ) public view returns (uint256) {
        uint256 elapsedTime = block.timestamp -
            heroRecovery.lastStaminaUpdateTime;
        uint256 recoveredStamina = (elapsedTime * 100) / (24 * 60 * 60); // Recover 100% in 24 hours
        uint256 currentStamina = heroRecovery.stamina + recoveredStamina;

        if (currentStamina > 100) {
            currentStamina = 100;
        }

        return currentStamina;
    }

    function consumeStamina(
        RecoveryStats storage heroRecovery,
        uint256 amount
    ) public {
        uint256 currentStamina = getStamina(heroRecovery);
        require(currentStamina >= amount, "Not enough stamina");

        heroRecovery.stamina = currentStamina - amount;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function addStamina(
        RecoveryStats storage heroRecovery,
        uint256 amount
    ) public {
        uint256 currentStamina = getStamina(heroRecovery);
        uint256 newStamina = currentStamina + amount;

        if (newStamina > 100) {
            newStamina = 100;
        }

        heroRecovery.stamina = newStamina;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function restoreStaminaToFull(RecoveryStats storage heroRecovery) public {
        heroRecovery.stamina = 100;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function getMana(
        RecoveryStats storage heroRecovery,
        CharacterStats storage hero
    ) public view returns (uint256) {
        uint256 elapsedTime = block.timestamp - heroRecovery.lastManaUpdateTime;
        uint256 recoveredMana = (elapsedTime * heroRecovery.maxMana) /
            (30 * 60); // Recover 100% in 30 minutes
        uint256 currentMana = hero.mana + recoveredMana;

        if (currentMana > heroRecovery.maxMana) {
            currentMana = heroRecovery.maxMana;
        }

        return currentMana;
    }

    function consumeMana(
        RecoveryStats storage heroRecovery,
        CharacterStats storage hero,
        uint256 amount
    ) public {
        uint256 currentMana = getMana(heroRecovery, hero);
        require(currentMana >= amount, "Not enough mana");

        hero.mana = currentMana - amount;
        heroRecovery.lastManaUpdateTime = block.timestamp;
    }

    function addMana(
        RecoveryStats storage heroRecovery,
        CharacterStats storage hero,
        uint256 amount
    ) public {
        uint256 maxMana = hero.mana;
        uint256 currentMana = getMana(heroRecovery, hero);
        uint256 newMana = currentMana + amount;

        if (newMana > maxMana) {
            newMana = maxMana;
        }

        hero.mana = newMana;
        heroRecovery.lastManaUpdateTime = block.timestamp;
    }

    function restoreManaToFull(
        RecoveryStats storage heroRecovery,
        CharacterStats storage hero
    ) public {
        hero.mana = hero.mana;
        heroRecovery.lastManaUpdateTime = block.timestamp;
    }
}
