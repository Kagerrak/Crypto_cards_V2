// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";

import "./BattleSkills2.sol";
import "./BattleItems2.sol";
import "./Class.sol";
import "./StatCalculation.sol";
import "./IBattleSkills.sol";
import "./IBattleItems.sol";
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
    using StatCalculation for StatCalculation.CharacterStats;
    using StatCalculation for StatCalculation.RecoveryStats;

    struct CharacterEquips {
        uint256[] equippedSkills;
        mapping(IBattleItems.ItemType => uint256) equippedItems;
        uint256 equippedClass;
    }

    struct CharacterType {
        uint256 typeId;
        string characterType;
        string uri;
    }

    uint256 private baseXP = 100;

    event NewCharacter(uint256 indexed tokenId, uint256 typeId);
    event CharacterStatsEvent(
        uint256 indexed tokenId,
        uint256 level,
        uint256 experience,
        uint256 health,
        uint256 mana,
        uint256 attack,
        uint256 defense,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality,
        uint256 accuracy,
        uint256 statPoints
    );
    event CharacterRecoveryStats(
        uint256 indexed tokenId,
        uint256 stamina,
        uint256 maxMana,
        uint256 lastStaminaUpdateTime,
        uint256 lastManaUpdateTime
    );

    event CharacterStatsUpdated(
        uint256 indexed tokenId,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality
    );

    event CharacterXPUpdated(uint256 indexed tokenId, uint256 xp);

    event ItemEquipped(
        uint256 indexed characterTokenId,
        uint256 indexed itemTokenId
    );

    event ItemUnequipped(
        uint256 indexed characterTokenId,
        uint256 indexed itemTokenId
    );

    event SkillEquipped(
        uint256 indexed characterTokenId,
        uint256 indexed skillId
    );

    event SkillUnequipped(
        uint256 indexed characterTokenId,
        uint256 indexed skillId
    );

    event ClassEquipped(
        uint256 indexed characterTokenId,
        uint256 indexed classId
    );

    event ClassUnequipped(
        uint256 indexed characterTokenId,
        uint256 indexed classId
    );

    event StaminaUpdated(uint256 indexed tokenId, uint256 stamina);

    event ManaUpdated(uint256 indexed tokenId, uint256 mana);

    mapping(uint256 => StatCalculation.CharacterStats) public characterStats;
    mapping(uint256 => StatCalculation.RecoveryStats)
        private characterRecoveryStats;
    mapping(uint256 => CharacterEquips) public characterEquips;
    mapping(uint256 => string) private fullURI;

    IBattleSkills public battleSkills;
    IBattleItems public battleItems;
    CharacterClass public characterClasses;

    address public battleContractAddress;

    function setBattleSkills(address _address) public onlyOwner {
        battleSkills = IBattleSkills(_address);
    }

    function setBattleItems(address _address) public onlyOwner {
        battleItems = IBattleItems(_address);
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
            StatCalculation.CharacterStats(
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
            StatCalculation.CharacterStats(
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
            StatCalculation.CharacterStats(
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
    StatCalculation.CharacterStats[] public charStats;
    CharacterType[] public charTypes;

    constructor() ERC721Base("Character", "CNFT", msg.sender, 0) {
        _initializeCharacters();
        initializeCharacterTypes();
    }

    function getCharacter(
        uint256 _tokenId
    ) public view returns (StatCalculation.CharacterStats memory) {
        return characterStats[_tokenId];
    }

    function getCharacterLevel(uint256 tokenId) public view returns (uint256) {
        StatCalculation.CharacterStats memory hero = characterStats[tokenId];
        return hero.level;
    }

    function getCharacterAttack(uint256 tokenId) public view returns (uint256) {
        StatCalculation.CharacterStats memory hero = characterStats[tokenId];
        return hero.attack;
    }

    function getCharacterDefense(
        uint256 tokenId
    ) public view returns (uint256) {
        StatCalculation.CharacterStats memory hero = characterStats[tokenId];
        return hero.defense;
    }

    function getCharacterHealth(uint256 tokenId) public view returns (uint256) {
        StatCalculation.CharacterStats memory hero = characterStats[tokenId];
        return hero.health;
    }

    function getCharacterType(uint256 tokenId) public view returns (uint256) {
        StatCalculation.CharacterStats memory hero = characterStats[tokenId];
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
    ) internal override {
        fullURI[_tokenId] = _tokenURI;
    }

    function updateURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) public onlyOwner {
        _setTokenURI(_tokenId, _tokenURI);
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
        _initializeCharacterStats(_typeId);
        _initializeCharacterEquips();
        _initializeCharacterRecoveryStats(_typeId);

        // Increment the token ID counter for the next mint
        numCharacters++;

        // Emit the new character event
        emit NewCharacter(numCharacters, _typeId);
    }

    function _initializeCharacterStats(uint256 _typeId) private {
        StatCalculation.CharacterStats memory _stats = StatCalculation
            .CharacterStats(
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
        emit CharacterStatsEvent(
            numCharacters,
            _stats.level,
            _stats.experience,
            _stats.health,
            _stats.mana,
            _stats.attack,
            _stats.defense,
            _stats.strength,
            _stats.dexterity,
            _stats.intelligence,
            _stats.vitality,
            _stats.accuracy,
            _stats.statPoints
        );
    }

    function _initializeCharacterEquips() private {
        characterEquips[numCharacters].equippedItems[
            IBattleItems.ItemType.Headgear
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            IBattleItems.ItemType.Weapon
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            IBattleItems.ItemType.BodyArmor
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            IBattleItems.ItemType.Pants
        ] = 999999;
        characterEquips[numCharacters].equippedItems[
            IBattleItems.ItemType.Footwear
        ] = 999999;
    }

    function _initializeCharacterRecoveryStats(uint256 _typeId) private {
        // Initialize the recovery stats for the new character
        StatCalculation.RecoveryStats memory _recoveryStats = StatCalculation
            .RecoveryStats(
                100,
                charStats[_typeId].mana,
                block.timestamp,
                block.timestamp
            );
        characterRecoveryStats[numCharacters] = _recoveryStats;
        emit CharacterRecoveryStats(
            numCharacters,
            _recoveryStats.stamina,
            _recoveryStats.maxMana,
            _recoveryStats.lastStaminaUpdateTime,
            _recoveryStats.lastManaUpdateTime
        );
    }

    function calculateExperienceRequired(
        uint256 level
    ) public view returns (uint256) {
        return baseXP * level;
    }

    function addStats(
        uint256 characterTokenId,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality
    ) external {
        StatCalculation.CharacterStats storage hero = characterStats[
            characterTokenId
        ];
        hero.addStats(strength, dexterity, intelligence, vitality);
        emit CharacterStatsUpdated(
            characterTokenId,
            strength,
            dexterity,
            intelligence,
            vitality
        );
    }

    function gainXP(
        uint256 characterTokenId,
        uint256 xp
    ) external onlyBattleContract {
        StatCalculation.CharacterStats storage hero = characterStats[
            characterTokenId
        ];
        hero.gainXP(xp, baseXP);
        emit CharacterXPUpdated(characterTokenId, xp);
    }

    function getStamina(uint256 tokenId) public view returns (uint256) {
        return characterRecoveryStats[tokenId].getStamina();
    }

    function consumeStamina(
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        characterRecoveryStats[tokenId].consumeStamina(amount);
        emit StaminaUpdated(tokenId, characterRecoveryStats[tokenId].stamina);
    }

    function addStamina(uint256 tokenId, uint256 amount) external onlyOwner {
        characterRecoveryStats[tokenId].addStamina(amount);
    }

    function restoreStaminaToFull(uint256 tokenId) external {
        characterRecoveryStats[tokenId].restoreStaminaToFull();
    }

    function getMana(uint256 tokenId) public view returns (uint256) {
        return characterRecoveryStats[tokenId].getMana(characterStats[tokenId]);
    }

    function consumeMana(
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        characterRecoveryStats[tokenId].consumeMana(
            characterStats[tokenId],
            amount
        );
    }

    function addMana(uint256 tokenId, uint256 amount) external onlyOwner {
        characterRecoveryStats[tokenId].addMana(
            characterStats[tokenId],
            amount
        );
        emit ManaUpdated(tokenId, characterStats[tokenId].mana);
    }

    function restoreManaToFull(uint256 tokenId) external {
        characterRecoveryStats[tokenId].restoreManaToFull(
            characterStats[tokenId]
        );
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
        IBattleItems.ItemType itemType = battleItems.getItemType(tokenId);

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
        IBattleItems.Item memory newItem = battleItems.getItem(tokenId);

        // Update character stats based on the new item
        characterStats[characterTokenId].attack += newItem.attack;
        characterStats[characterTokenId].defense += newItem.defense;
        characterStats[characterTokenId].health += newItem.health;
        characterStats[characterTokenId].mana += newItem.skill;
        emit ItemEquipped(characterTokenId, tokenId);
    }

    function unequipItem(uint256 characterTokenId, uint256 itemTokenId) public {
        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        IBattleItems.Item memory itemToUnequip = battleItems.getItem(
            itemTokenId
        );
        IBattleItems.ItemType itemType = itemToUnequip.itemType;

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
        emit ItemUnequipped(characterTokenId, itemTokenId);
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
        emit SkillEquipped(characterTokenId, skillId);
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
        emit SkillUnequipped(characterTokenId, skillId);
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
        emit ClassEquipped(characterTokenId, classId);
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
        emit ClassUnequipped(characterTokenId, equippedClassId);
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
    ) public view returns (StatCalculation.RecoveryStats memory) {
        require(
            characterRecoveryStats[tokenId].lastStaminaUpdateTime != 0,
            "Token ID not found"
        );
        return characterRecoveryStats[tokenId];
    }

    function getEquippedItem(
        uint256 characterTokenId,
        IBattleItems.ItemType itemType
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
