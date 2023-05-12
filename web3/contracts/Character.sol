// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";

import "./BattleSkills.sol";
import "./BattleItems.sol";
import "./Class.sol";
import "hardhat/console.sol";

import "@thirdweb-dev/contracts/openzeppelin-presets/utils/ERC1155/ERC1155Holder.sol";
import "@thirdweb-dev/contracts/lib/TWStrings.sol";

contract Character is ERC721Base, ERC1155Holder {
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Base, ERC1155Receiver) returns (bool) {
        return
            ERC721Base.supportsInterface(interfaceId) ||
            ERC1155Receiver.supportsInterface(interfaceId);
    }

    using TWStrings for uint256;

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
        uint256[] equippedSkills;
        mapping(BattleItems.ItemType => uint256) equippedItems;
        uint256 equippedClass;
    }

    struct CharacterType {
        uint256 typeId;
        string characterType;
        string uri;
    }

    struct RecoveryStats {
        uint256 stamina;
        uint256 maxMana;
        uint256 lastStaminaUpdateTime;
        uint256 lastManaUpdateTime;
    }

    uint256 private baseXP = 100;

    event NewCharacter(uint256 indexed tokenId, uint256 indexed typeId);

    mapping(uint256 => CharacterStats) public characterStats;
    mapping(uint256 => CharacterEquips) public characterEquips;
    mapping(uint256 => RecoveryStats) private characterRecoveryStats;
    mapping(uint256 => string) private fullURI;

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
                "ipfs://QmZzBmjrjn742Dx8wPHheq8XbzkowWS6xqvLHURTSvLQCo"
            )
        );
        charTypes.push(
            CharacterType(
                1,
                "Mage",
                "ipfs://QmTYEiXiTzBhYuwuQ7bjS5aqChrefEJZ37as8BDrKYxk1j"
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

    function getCharacterType(uint256 tokenId) public view returns (uint256) {
        CharacterStats storage hero = characterStats[tokenId];
        return hero.typeId;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        string memory fullUriForToken = fullURI[_tokenId];
        if (bytes(fullUriForToken).length > 0) {
            return fullUriForToken;
        }

        string memory batchUri = _getBaseURI(_tokenId);
        return string(abi.encodePacked(batchUri, _tokenId.toString()));
    }

    function _setTokenURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) internal override onlyOwner {
        fullURI[_tokenId] = _tokenURI;
    }

    function newCharacter(uint256 _typeId) public {
        require(_typeId < charTypes.length, "Invalid character type ID");

        // Mint the new token with the specified owner and quantity
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

        // Initialize no items equipped
        characterEquips[numCharacters].equippedItems[
            BattleItems.ItemType.Headgear
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            BattleItems.ItemType.Weapon
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            BattleItems.ItemType.BodyArmor
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            BattleItems.ItemType.Pants
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            BattleItems.ItemType.Footwear
        ] = 999999;

        // Initialize character recovery stats
        characterRecoveryStats[numCharacters] = RecoveryStats(
            100,
            charStats[_typeId].mana,
            block.timestamp,
            block.timestamp
        );

        // Increment the token ID counter for the next mint
        numCharacters++;

        // Emit the new character event
        emit NewCharacter(numCharacters - 1, _typeId);
    }

    function calculateExperienceRequired(
        uint256 level
    ) public view returns (uint256) {
        return baseXP * level;
    }

    function levelFromXP(uint256 totalXP) private view returns (uint256) {
        uint256 currentLevel = 1;

        // Keep subtracting the XP required for each level from the total XP until the remaining XP is not enough for the next level
        while (totalXP >= calculateExperienceRequired(currentLevel)) {
            totalXP -= calculateExperienceRequired(currentLevel);
            currentLevel += 1;
        }

        // Return the current level
        return currentLevel;
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

        CharacterStats storage charStat = characterStats[characterTokenId];

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
        characterRecoveryStats[characterTokenId].maxMana += intelligence * 5;
        charStat.accuracy += dexterity * 5;
        charStat.attack += strength * 5;
        charStat.statPoints -= totalStatPointsToSpend;
    }

    function _levelUp(uint256 characterTokenId) internal {
        CharacterStats storage hero = characterStats[characterTokenId];
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

    function gainXP(
        uint256 characterTokenId,
        uint256 xp
    ) external onlyBattleContract {
        CharacterStats storage hero = characterStats[characterTokenId];
        hero.experience += xp;

        uint256 newLevel = levelFromXP(hero.experience);
        if (newLevel > hero.level) {
            _levelUp(characterTokenId);
        }
    }

    function getStamina(uint256 tokenId) public view returns (uint256) {
        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];
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
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        uint256 currentStamina = getStamina(tokenId);
        require(currentStamina >= amount, "Not enough stamina");

        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];
        heroRecovery.stamina = currentStamina - amount;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
        console.log("stamina consumed ", heroRecovery.stamina);
    }

    function addStamina(uint256 tokenId, uint256 amount) external onlyOwner {
        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];

        uint256 currentStamina = getStamina(tokenId);
        uint256 newStamina = currentStamina + amount;

        if (newStamina > 100) {
            newStamina = 100;
        }

        heroRecovery.stamina = newStamina;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function restoreStaminaToFull(uint256 tokenId) external {
        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];
        heroRecovery.stamina = 100;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function getMana(uint256 tokenId) public view returns (uint256) {
        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];
        uint256 elapsedTime = block.timestamp - heroRecovery.lastManaUpdateTime;
        uint256 recoveredMana = (elapsedTime * heroRecovery.maxMana) /
            (30 * 60); // Recover 100% in 30 minutes
        uint256 currentMana = characterStats[tokenId].mana + recoveredMana;

        if (currentMana > heroRecovery.maxMana) {
            currentMana = heroRecovery.maxMana;
        }

        return currentMana;
    }

    function consumeMana(
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        uint256 currentMana = getMana(tokenId);
        require(currentMana >= amount, "Not enough mana");

        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];
        characterStats[tokenId].mana = currentMana - amount;
        heroRecovery.lastManaUpdateTime = block.timestamp;
        console.log("mana consumed ", characterStats[tokenId].mana);
    }

    function addMana(uint256 tokenId, uint256 amount) external onlyOwner {
        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];

        uint256 maxMana = characterStats[tokenId].mana;
        uint256 currentMana = getMana(tokenId);
        uint256 newMana = currentMana + amount;

        if (newMana > maxMana) {
            newMana = maxMana;
        }

        characterStats[tokenId].mana = newMana;
        heroRecovery.lastManaUpdateTime = block.timestamp;
    }

    function restoreManaToFull(uint256 tokenId) external {
        RecoveryStats storage heroRecovery = characterRecoveryStats[tokenId];
        characterStats[tokenId].mana = characterStats[tokenId].mana;
        heroRecovery.lastManaUpdateTime = block.timestamp;
    }

    function equipItem(uint256 characterTokenId, uint256 tokenId) public {
        // Check if the character token ID exists
        require(characterTokenId < numCharacters, "Invalid character token ID");

        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        // Check if the item tokenId is valid and the caller is the owner of the item
        require(battleItems.totalSupply(tokenId) > 0, "Invalid item token ID");
        require(
            battleItems.balanceOf(msg.sender, tokenId) > 0,
            "Not the owner of the item"
        );

        // Get the ItemType of the item
        BattleItems.ItemType itemType = battleItems.getItemType(tokenId);

        // Check if the item is not already equipped in the specified slot
        require(
            characterEquips[characterTokenId].equippedItems[itemType] !=
                tokenId,
            "Item already equipped"
        );

        // Unequip the previous item
        uint256 previousTokenId = characterEquips[characterTokenId]
            .equippedItems[itemType];
        if (previousTokenId != 999999) {
            unequipItem(characterTokenId, previousTokenId);
        }

        // Equip the item
        characterEquips[characterTokenId].equippedItems[itemType] = tokenId;
        battleItems.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");

        // Get stats of the new item
        BattleItems.Item memory newItem = battleItems.getItem(tokenId);

        // Update character stats based on the new item
        characterStats[characterTokenId].attack += newItem.attack;
        characterStats[characterTokenId].defense += newItem.defense;
        characterStats[characterTokenId].health += newItem.health;
        characterStats[characterTokenId].mana += newItem.skill;
    }

    function unequipItem(uint256 characterTokenId, uint256 itemTokenId) public {
        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        BattleItems.Item memory itemToUnequip = battleItems.getItem(
            itemTokenId
        );
        BattleItems.ItemType itemType = itemToUnequip.itemType;

        // Check if the item is equipped
        require(
            characterEquips[characterTokenId].equippedItems[itemType] ==
                itemTokenId,
            "Item not equipped"
        );

        // Remove item stats from the character
        characterStats[characterTokenId].attack -= itemToUnequip.attack;
        characterStats[characterTokenId].defense -= itemToUnequip.defense;
        characterStats[characterTokenId].health -= itemToUnequip.health;
        characterStats[characterTokenId].mana -= itemToUnequip.skill;

        // Unequip the item
        characterEquips[characterTokenId].equippedItems[itemType] = 999999;
        battleItems.safeTransferFrom(
            address(this),
            msg.sender,
            itemTokenId,
            1,
            ""
        );
    }

    function equipSkill(uint256 characterTokenId, uint256 skillId) public {
        // Check if the character token ID exists
        require(characterTokenId < numCharacters, "Invalid character token ID");

        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        // Check if the skill exists
        require(battleSkills.totalSupply(skillId) > 0, "Invalid skill ID");

        // Check if the skill is owned by the caller
        require(
            battleSkills.balanceOf(msg.sender, skillId) > 0,
            "Not the owner of the skill"
        );

        // Check if the skill is not already equipped
        uint256[] storage equippedSkills = characterEquips[characterTokenId]
            .equippedSkills;
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            require(equippedSkills[i] != skillId, "Skill already equipped");
        }

        // Transfer the skill to the contract and add it to the equippedSkills array
        battleSkills.safeTransferFrom(
            msg.sender,
            address(this),
            skillId,
            1,
            ""
        );
        equippedSkills.push(skillId);
    }

    function unequipSkill(uint256 characterTokenId, uint256 skillId) public {
        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        // Check if the skill is equipped
        uint256[] storage equippedSkills = characterEquips[characterTokenId]
            .equippedSkills;
        uint256 skillIndex = equippedSkills.length;
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            if (equippedSkills[i] == skillId) {
                skillIndex = i;
                break;
            }
        }

        // Check if the skill was found
        require(skillIndex < equippedSkills.length, "Skill not found");

        // Transfer the skill back to the owner and remove it from the equippedSkills array
        battleSkills.safeTransferFrom(
            address(this),
            msg.sender,
            skillId,
            1,
            ""
        );
        equippedSkills[skillIndex] = equippedSkills[equippedSkills.length - 1];
        equippedSkills.pop();
    }

    function equipClass(uint256 characterTokenId, uint256 classId) public {
        // Check if the character token ID exists
        require(characterTokenId < numCharacters, "Invalid character token ID");

        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

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
        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

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

    function getRecoveryStats(
        uint256 tokenId
    ) public view returns (RecoveryStats memory) {
        require(
            characterRecoveryStats[tokenId].lastStaminaUpdateTime != 0,
            "Token ID not found"
        );
        return characterRecoveryStats[tokenId];
    }

    function getEquippedItem(
        uint256 characterTokenId,
        BattleItems.ItemType itemType
    ) external view returns (uint256) {
        return characterEquips[characterTokenId].equippedItems[itemType];
    }

    function getEquippedSkills(
        uint256 characterTokenId
    ) external view returns (uint256[] memory) {
        return characterEquips[characterTokenId].equippedSkills;
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
