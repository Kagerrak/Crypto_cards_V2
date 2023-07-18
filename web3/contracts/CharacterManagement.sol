// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "./CharData.sol";
import "./IBattleSkills.sol";
import "./IBattleItems.sol";
import "./CMLib.sol";

contract CharacterManagement {
    using CharData for CharData.CharacterStats;
    using CharData for CharData.RecoveryStats;
    using CharData for CharData.CharacterType;
    using CMLib for CharData.CharacterStats;
    using CMLib for CharData.RecoveryStats;

    address private _owner;

    event CharacterXPUpdated(uint256 indexed tokenId, uint256 xp);

    event StaminaUpdated(uint256 indexed tokenId, uint256 stamina);

    event ManaUpdated(uint256 indexed tokenId, uint256 mana);

    event CharacterStatsUpdated(
        uint256 indexed tokenId,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality
    );

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

    mapping(uint256 => CharData.CharacterStats) public characterStats;
    mapping(uint256 => CharData.RecoveryStats) public characterRecoveryStats;
    mapping(uint256 => CharData.CharacterEquips) public characterEquips;

    uint256 public numCharacters = 0;
    CharData.CharacterStats[] public charStats;
    CharData.CharacterType[] public charTypes;
    uint256 private baseXP = 100;

    address internal battleContractAddress;

    function setBattleContract(address _address) internal virtual {
        battleContractAddress = _address;
    }

    modifier onlyBattleContract() {
        require(
            msg.sender == battleContractAddress,
            "Caller is not the Battle contract"
        );
        _;
    }

    /// @dev Reverts if caller is not the owner.
    modifier isOwner() {
        if (msg.sender != _owner) {
            revert("Not authorized");
        }
        _;
    }

    constructor(address _newOwner) {
        _owner = _newOwner;
        _initializeCharacters();
        initializeCharacterTypes();
    }

    // Character Initialization Functions
    function _initializeCharacters() private {
        charStats.push(
            CharData.CharacterStats(
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
            CharData.CharacterStats(
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
            CharData.CharacterStats(
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
            CharData.CharacterType(
                0,
                "Warrior",
                "ipfs://QmZzBmjrjn742Dx8wPHheq8XbzkowWS6xqvLHURTSvLQCo"
            )
        );
        charTypes.push(
            CharData.CharacterType(
                1,
                "Mage",
                "ipfs://QmTYEiXiTzBhYuwuQ7bjS5aqChrefEJZ37as8BDrKYxk1j"
            )
        );
        charTypes.push(
            CharData.CharacterType(
                2,
                "Rogue",
                "ipfs://QmUyWmpry8Sri9BmsHSQMDBPtnPZkoX6GS7w8ZizpnFX7v"
            )
        );
    }

    function _initializeCharacterStats(uint256 _typeId) internal {
        CharData.CharacterStats memory _stats = CharData.CharacterStats(
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

    function _initializeCharacterEquips() internal {
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

    function _initializeCharacterRecoveryStats(uint256 _typeId) internal {
        // Initialize the recovery stats for the new character
        CharData.RecoveryStats memory _recoveryStats = CharData.RecoveryStats(
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

    // Character Stats Management Functions
    function addStats(
        uint256 characterTokenId,
        uint256 strength,
        uint256 dexterity,
        uint256 intelligence,
        uint256 vitality
    ) external isOwner {
        CharData.CharacterStats storage charStat = characterStats[
            characterTokenId
        ];
        charStat.addStats(strength, dexterity, intelligence, vitality);
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
        CharData.CharacterStats storage hero = characterStats[characterTokenId];
        hero.gainXP(xp, baseXP);
        emit CharacterXPUpdated(characterTokenId, xp);
    }

    function consumeStamina(
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        heroRecovery.consumeStamina(amount);
        emit StaminaUpdated(tokenId, heroRecovery.stamina);
    }

    function consumeMana(
        uint256 tokenId,
        uint256 amount
    ) external onlyBattleContract {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        CharData.CharacterStats storage hero = characterStats[tokenId];
        heroRecovery.consumeMana(hero, amount);
        emit ManaUpdated(tokenId, hero.mana);
    }

    function getStamina(uint256 tokenId) public view returns (uint256) {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        uint256 elapsedTime = block.timestamp -
            heroRecovery.lastStaminaUpdateTime;
        uint256 recoveredStamina = (elapsedTime * 100) / (24 * 60 * 60); // Recover 100% in 24 hours
        uint256 currentStamina = heroRecovery.stamina + recoveredStamina;

        if (currentStamina > 100) {
            currentStamina = 100;
        }

        return currentStamina;
    }

    function addStamina(uint256 tokenId, uint256 amount) external isOwner {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];

        uint256 currentStamina = getStamina(tokenId);
        uint256 newStamina = currentStamina + amount;

        if (newStamina > 100) {
            newStamina = 100;
        }

        heroRecovery.stamina = newStamina;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function restoreStaminaToFull(uint256 tokenId) external isOwner {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        heroRecovery.stamina = 100;
        heroRecovery.lastStaminaUpdateTime = block.timestamp;
    }

    function getMana(uint256 tokenId) public view returns (uint256) {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        CharData.CharacterStats storage hero = characterStats[tokenId];
        uint256 elapsedTime = block.timestamp - heroRecovery.lastManaUpdateTime;
        uint256 recoveredMana = (elapsedTime * heroRecovery.maxMana) /
            (30 * 60); // Recover 100% in 30 minutes
        uint256 currentMana = hero.mana + recoveredMana;

        if (currentMana > heroRecovery.maxMana) {
            currentMana = heroRecovery.maxMana;
        }

        return currentMana;
    }

    function addMana(uint256 tokenId, uint256 amount) external isOwner {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        CharData.CharacterStats storage hero = characterStats[tokenId];

        hero.addMana(heroRecovery, amount);

        emit ManaUpdated(tokenId, characterStats[tokenId].mana);
    }

    function restoreManaToFull(uint256 tokenId) external isOwner {
        CharData.RecoveryStats storage heroRecovery = characterRecoveryStats[
            tokenId
        ];
        CharData.CharacterStats storage hero = characterStats[tokenId];
        hero.mana = hero.mana;
        heroRecovery.lastManaUpdateTime = block.timestamp;
    }

    function getCharacter(
        uint256 _tokenId
    ) public view returns (CharData.CharacterStats memory) {
        return characterStats[_tokenId];
    }

    function getCharacterInfo(
        uint256 tokenId
    )
        public
        view
        returns (
            uint256 health,
            uint256 attack,
            uint256 defense,
            uint256 mana,
            uint256 typeId,
            uint256[] memory equippedSkills
        )
    {
        CharData.CharacterStats storage hero = characterStats[tokenId];
        health = hero.health;
        attack = hero.attack;
        defense = hero.defense;
        mana = hero.getMana(tokenId);
        typeId = hero.typeId;
        equippedSkills = characterEquips[tokenId].equippedSkills;
    }

    function getRecoveryStats(
        uint256 tokenId
    ) public view returns (CharData.RecoveryStats memory) {
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
}
