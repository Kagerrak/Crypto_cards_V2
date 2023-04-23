// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";

import "./BattleSkills.sol";
import "./BattleItems.sol";
import "./Class.sol";
import "hardhat/console.sol";

import "@thirdweb-dev/contracts/openzeppelin-presets/utils/ERC1155/ERC1155Holder.sol";

contract Character is ERC721Base, ERC1155Holder {
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Base, ERC1155Receiver) returns (bool) {
        return
            ERC721Base.supportsInterface(interfaceId) ||
            ERC1155Receiver.supportsInterface(interfaceId);
    }

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

    struct CharacterEquips {
        uint256 equippedSkill;
        uint256 equippedItem;
        uint256 equippedClass;
    }

    struct CharacterType {
        uint256 typeId;
        string characterType;
        string uri;
    }

    struct CharacterStamina {
        uint256 stamina;
        uint256 lastStaminaUpdateTime;
    }

    uint256 private baseXP = 100;
    uint256 private growthFactor = 150; // Representing 1.5 in fixed point (multiplied by 100)

    event NewCharacter(uint256 indexed tokenId, uint256 indexed typeId);

    mapping(uint256 => CharacterStats) private characterStats;
    mapping(uint256 => CharacterEquips) private characterEquips;
    mapping(uint256 => CharacterStamina) private characterStamina;
    // mapping(uint256 => CharacterType) private characterTypes;

    BattleSkills public battleSkills;
    BattleItems public battleItems;
    CharacterClass public characterClasses;

    address public battleContractAddress;

    function setBattleSkills(address _address) public onlyOwner {
        battleSkills = BattleSkills(_address);
    }

    function setBattleItems(address _address) public onlyOwner {
        battleItems = BattleItems(_address);
    }

    function setClassContract(address _address) public onlyOwner {
        characterClasses = CharacterClass(_address);
    }

    function setBattleContract(address _address) public onlyOwner {
        battleContractAddress = _address;
    }

    modifier onlyBattleContract() {
        require(
            msg.sender == battleContractAddress,
            "Caller is not the Battle contract"
        );
        _;
    }

    function _initializeCharacters() private {
        charStats.push(
            CharacterStats(
                0,
                1,
                0,
                100,
                100,
                10,
                100,
                100,
                100,
                100,
                100,
                100,
                5,
                0
            )
        );
        charStats.push(
            CharacterStats(
                0,
                1,
                0,
                100,
                100,
                10,
                100,
                100,
                100,
                100,
                100,
                100,
                5,
                1
            )
        );
        charStats.push(
            CharacterStats(
                0,
                1,
                0,
                100,
                100,
                100,
                100,
                100,
                100,
                100,
                100,
                100,
                5,
                2
            )
        );
    }

    function initializeCharacterTypes() private {
        charTypes.push(
            CharacterType(
                0,
                "Warrior",
                "ipfs://QmUyWmpry8Sri9BmsHSQMDBPtnPZkoX6GS7w8ZizpnFX7v"
            )
        );
        charTypes.push(
            CharacterType(
                1,
                "Mage",
                "ipfs://QmUyWmpry8Sri9BmsHSQMDBPtnPZkoX6GS7w8ZizpnFX7v"
            )
        );
        charTypes.push(
            CharacterType(
                2,
                "Rogue",
                "ipfs://QmUyWmpry8Sri9BmsHSQMDBPtnPZkoX6GS7w8ZizpnFX7v"
            )
        );
    }

    uint256 public numCharacters = 0;
    CharacterStats[] public charStats;
    CharacterType[] public charTypes;

    constructor() ERC721Base("Character", "CNFT", msg.sender, 0) {
        _initializeCharacters();
        initializeCharacterTypes();
    }

    function getCharacter(
        uint256 _tokenId
    ) public view returns (CharacterStats memory) {
        return characterStats[_tokenId];
    }

    function getCharacterLevel(uint256 tokenId) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.level;
    }

    function getCharacterAttack(uint256 tokenId) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.attack;
    }

    function getCharacterDefense(
        uint256 tokenId
    ) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.defense;
    }

    function getCharacterHealth(uint256 tokenId) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.health;
    }

    function getCharacterMana(uint256 tokenId) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.mana;
    }

    function getCharacterType(uint256 tokenId) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.typeId;
    }

    function newCharacter(uint256 _typeId) public {
        require(_typeId < charTypes.length, "Invalid character type ID");

        // Mint the new token with the specified owner and token ID
        _safeMint(msg.sender, 1);

        // Set the token URI for the new token
        console.log(charTypes[_typeId].uri);
        console.log(numCharacters);
        _setTokenURI(numCharacters, charTypes[_typeId].uri);

        // Initialize the character stats and equipment
        CharacterStats memory _stats = CharacterStats(
            numCharacters,
            charStats[_typeId].level,
            charStats[_typeId].experience,
            charStats[_typeId].health,
            charStats[_typeId].mana,
            charStats[_typeId].attack,
            charStats[_typeId].defense,
            charStats[_typeId].strength,
            charStats[_typeId].dexterity,
            charStats[_typeId].intelligence,
            charStats[_typeId].vitality,
            charStats[_typeId].accuracy,
            charStats[_typeId].statPoints,
            _typeId
        );
        characterStats[numCharacters] = _stats;
        characterEquips[numCharacters].equippedSkill = 9999;
        characterEquips[numCharacters].equippedItem = 9999;
        characterStamina[numCharacters] = CharacterStamina(
            100,
            block.timestamp
        );

        // Increment the token ID counter for the next mint
        numCharacters++;

        // Emit the new character event
        emit NewCharacter(numCharacters - 1, _typeId);
    }

    function xpForLevel(uint256 level) private pure returns (uint256) {
        return (baseXP * (level ** growthFactor)) / 100;
    }

    function levelFromXP(uint256 xp) private view returns (uint256) {
        uint256 level = 1;
        while (xp >= xpForLevel(level)) {
            xp -= xpForLevel(level);
            level += 1;
        }
        return level;
    }

    function addStats(
        uint256 characterTokenId,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality
    ) public {
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Caller is not the owner of the character"
        );

        require(
            (strength + dexterity + intelligence + vitality == 5),
            "Use all the stat points"
        );

        CharacterStats storage charStat = characterStats[characterTokenId];
        charStat.strength += strength;
        charStat.dexterity += dexterity;
        charStat.intelligence += intelligence;
        charStat.vitality += vitality;

        charStat.health += vitality * 5;
        charStat.mana += intelligence * 5;
        charStat.accuracy += dexterity * 5;
        charStat.attack += strength * 5;
        charStat.statPoints = 0;
    }

    function levelUp(uint256 characterTokenId) public {
        CharacterStats storage hero = characterStats[characterTokenId];
        require(
            hero.statPoints == 0,
            "Must use up all stat points before leveling up"
        );
        require(ownerOf(characterTokenId) == msg.sender, "Caller is not owner");

        uint256 currentLevel = hero.level;
        uint256 currentXP = hero.experience;

        uint256 newLevel = levelFromXP(currentXP);
        require(
            newLevel > currentLevel,
            "Not enough experience points to level up"
        );

        hero.level = newLevel;
        hero.statPoints += 5 * (newLevel - currentLevel);
    }

    function gainXP(uint256 characterTokenId, uint256 xp) public {
        require(ownerOf(characterTokenId) == msg.sender, "Caller is not owner");

        CharacterStats storage hero = characterStats[characterTokenId];
        hero.experience += xp;

        uint256 newLevel = levelFromXP(hero.experience);
        if (newLevel > hero.level) {
            hero.statPoints += 5 * (newLevel - hero.level);
            hero.level = newLevel;
        }
    }

    function getStamina(uint256 tokenId) public view returns (uint256) {
        CharacterStamina storage heroStamina = characterStamina[tokenId];
        uint256 elapsedTime = block.timestamp -
            heroStamina.lastStaminaUpdateTime;
        uint256 recoveredStamina = (elapsedTime * 100) / (24 * 60 * 60); // Recover 100% in 24 hours
        uint256 currentStamina = heroStamina.stamina + recoveredStamina;

        if (currentStamina > 100) {
            currentStamina = 100;
        }

        return currentStamina;
    }

    function consumeStamina(
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        uint256 currentStamina = getStamina(tokenId);
        require(currentStamina >= amount, "Not enough stamina");

        CharacterStamina storage heroStamina = characterStamina[tokenId];
        heroStamina.stamina = currentStamina - amount;
        heroStamina.lastStaminaUpdateTime = block.timestamp;
    }

    function equipItem(uint256 characterTokenId, uint256 tokenId) public {
        // Allow token ID 0 as a valid item ID
        require(battleItems.totalSupply(tokenId) > 0, "Invalid item token ID");

        // Check if the item is owned by the caller
        require(
            battleItems.balanceOf(msg.sender, tokenId) > 0,
            "Not the owner of the item"
        );

        // Check if the item is not already equipped
        require(
            characterEquips[characterTokenId].equippedItem != tokenId,
            "Item already equipped"
        );

        // Unequip the previous item
        uint256 previousTokenId = characterEquips[characterTokenId]
            .equippedItem;
        if (
            (previousTokenId != 0 && previousTokenId != 9999) ||
            (previousTokenId == 0 && tokenId != 9999)
        ) {
            battleItems.safeTransferFrom(
                address(this),
                msg.sender,
                previousTokenId,
                1,
                ""
            );
        }

        // Equip the item
        characterEquips[characterTokenId].equippedItem = tokenId;
        battleItems.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
    }

    function unequipItem(uint256 characterTokenId) external {
        // Check if there is an item equipped
        uint256 equippedTokenId = characterEquips[characterTokenId]
            .equippedItem;
        require(equippedTokenId != 9999, "No item equipped");

        // Unequip the item
        characterEquips[characterTokenId].equippedItem = 9999;
        battleItems.safeTransferFrom(
            address(this),
            msg.sender,
            equippedTokenId,
            1,
            ""
        );
    }

    function equipSkill(uint256 characterTokenId, uint256 skillId) public {
        // Check if the skill exists
        require(battleSkills.totalSupply(skillId) > 0, "Invalid skill ID");

        // Check if the skill is owned by the caller
        require(
            battleSkills.balanceOf(msg.sender, skillId) > 0,
            "Not the owner of the skill"
        );

        // Check if the skill is not already equipped
        require(
            characterEquips[characterTokenId].equippedSkill != skillId ||
                (skillId == 0 &&
                    characterEquips[characterTokenId].equippedSkill != 9999),
            "Skill already equipped"
        );

        // Unequip the previous skill
        uint256 previousSkillId = characterEquips[characterTokenId]
            .equippedSkill;
        if (
            (previousSkillId != 0 && previousSkillId != 9999) ||
            (previousSkillId == 0 && skillId != 9999)
        ) {
            battleSkills.safeTransferFrom(
                address(this),
                msg.sender,
                previousSkillId,
                1,
                ""
            );
        }

        // Equip the skill
        characterEquips[characterTokenId].equippedSkill = skillId;
        battleSkills.safeTransferFrom(
            msg.sender,
            address(this),
            skillId,
            1,
            ""
        );
    }

    function unequipSkill(uint256 characterTokenId) external {
        // Check if there is a skill equipped
        uint256 equippedSkillId = characterEquips[characterTokenId]
            .equippedSkill;
        require(equippedSkillId != 9999, "No skill equipped");

        // Unequip the skill
        characterEquips[characterTokenId].equippedSkill = 9999;
        battleSkills.safeTransferFrom(
            address(this),
            msg.sender,
            equippedSkillId,
            1,
            ""
        );
    }

    function equipClass(uint256 characterTokenId, uint256 classId) public {
        // Check if the class exists
        require(characterClasses.totalSupply(classId) > 0, "Invalid class ID");

        // Check if the class is owned by the caller
        require(
            characterClasses.balanceOf(msg.sender, classId) > 0,
            "Not the owner of the class"
        );

        // Check if the class is not already equipped
        require(
            characterEquips[characterTokenId].equippedClass != classId,
            "Class already equipped"
        );

        // Unequip the previous class
        uint256 previousClassId = characterEquips[characterTokenId]
            .equippedClass;
        if (previousClassId != 0) {
            characterClasses.safeTransferFrom(
                address(this),
                msg.sender,
                previousClassId,
                1,
                ""
            );
        }

        // Equip the class
        characterEquips[characterTokenId].equippedClass = classId;
        characterClasses.safeTransferFrom(
            msg.sender,
            address(this),
            classId,
            1,
            ""
        );
    }

    function unequipClass(uint256 characterTokenId) external {
        // Check if there is a class equipped
        uint256 equippedClassId = characterEquips[characterTokenId]
            .equippedClass;
        require(equippedClassId != 0, "No class equipped");

        // Unequip the class
        characterEquips[characterTokenId].equippedClass = 0;
        characterClasses.safeTransferFrom(
            address(this),
            msg.sender,
            equippedClassId,
            1,
            ""
        );
    }

    function getEquippedItem(
        uint256 characterTokenId
    ) external view returns (uint256) {
        return characterEquips[characterTokenId].equippedItem;
    }

    function getEquippedSkill(
        uint256 characterTokenId
    ) external view returns (uint256) {
        return characterEquips[characterTokenId].equippedSkill;
    }

    function getEquippedClass(
        uint256 characterTokenId
    ) external view returns (uint256) {
        return characterEquips[characterTokenId].equippedClass;
    }

    function mintNewCharacterWithItemAndEquip(
        uint256 _typeId,
        uint256 _skillTokenId
    ) external {
        // Mint a new character
        newCharacter(_typeId);

        // Mint a new item
        battleSkills.mintSkill(_skillTokenId, msg.sender);

        // Equip the item to the new character
        equipSkill(numCharacters - 1, _skillTokenId);
    }
}
