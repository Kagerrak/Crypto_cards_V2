// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "./ICompositeTokens.sol";
import "./IBattleItems.sol";
import "./IBattleSkills.sol";
import "./CharData.sol";
import "./ICharacter.sol";
import "hardhat/console.sol";

contract EquipManagement {
    address private _owner;

    modifier isOwner() {
        if (msg.sender != _owner) {
            revert("Not authorized");
        }
        _;
    }

    using CharData for CharData.CharacterEquips;

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

    IBattleItems private battleItems;
    IBattleSkills private battleSkills;
    ICompositeTokens private compositeTokens;
    ICharacter public characterContract;

    constructor(
        address _battleItemsAddress,
        address _battleSkillsAddress,
        address _compositeTokensAddress
    ) {
        _owner = msg.sender;
        battleItems = IBattleItems(_battleItemsAddress);
        battleSkills = IBattleSkills(_battleSkillsAddress);
        compositeTokens = ICompositeTokens(_compositeTokensAddress);
    }

    function setCharacterContract(
        address _characterContractAddress
    ) external isOwner {
        require(
            address(characterContract) == address(0),
            "Character contract address is already set"
        );
        characterContract = ICharacter(_characterContractAddress);
    }

    function equip(
        uint256 characterTokenId,
        uint256 tokenId,
        CharData.TokenType tokenType
    ) external {
        require(
            characterContract.ownerOf(characterTokenId) == msg.sender,
            "Not Owner!"
        );
        if (tokenId > 10000) {
            require(
                tokenType == CharData.TokenType.CompositeItem ||
                    tokenType == CharData.TokenType.CompositeSkill,
                "Invalid composite token type"
            );
            _equipCompositeToken(
                characterTokenId,
                msg.sender,
                address(characterContract),
                tokenId
            );
        } else {
            if (tokenType == CharData.TokenType.Item) {
                _equipItem(
                    characterTokenId,
                    msg.sender,
                    address(characterContract),
                    tokenId
                );
            } else if (tokenType == CharData.TokenType.Skill) {
                _equipSkill(
                    characterTokenId,
                    msg.sender,
                    address(characterContract),
                    tokenId
                );
            } else {
                revert("Invalid token type");
            }
        }

        // Emit the appropriate event
        if (tokenType == CharData.TokenType.Skill) {
            emit SkillEquipped(characterTokenId, tokenId);
        } else if (
            tokenType == CharData.TokenType.Item ||
            tokenType == CharData.TokenType.CompositeItem
        ) {
            emit ItemEquipped(characterTokenId, tokenId);
        }
    }

    function _equipSkill(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 skillId
    ) internal {
        // Check if the skill exists
        require(battleSkills.doesSkillExist(skillId), "Invalid skill ID");

        // Check if the skill is owned by the caller
        require(
            battleSkills.balanceOf(owner, skillId) > 0,
            "Not the owner of the skill"
        );

        uint256[] memory equippedSkills = characterContract
            .getCharacterEquippedSkills(characterTokenId);

        // Check if the skill is not already equipped
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            require(equippedSkills[i] != skillId, "Skill already equipped");
        }

        // Transfer the skill to the contract and add it to the equippedSkills array
        battleSkills.safeTransferFrom(owner, contractAddress, skillId, 1, "");
        characterContract.equipSkill(characterTokenId, skillId);
    }

    function _equipItem(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 itemTokenId
    ) internal {
        // Check if the item tokenId is valid and the caller is the owner of the item
        require(
            battleItems.totalSupply(itemTokenId) > 0,
            "Invalid item token ID"
        );
        require(
            battleItems.balanceOf(owner, itemTokenId) > 0,
            "Not the owner of the item"
        );

        // Get the ItemType of the item
        CharData.ItemType itemType = battleItems.getItemType(itemTokenId);

        uint256 equippedItem = characterContract.getCharacterEquippedItem(
            characterTokenId,
            itemType
        );

        // Check if the item is not already equipped in the specified slot
        if (equippedItem != 0) {
            require(equippedItem != itemTokenId, "Item already equipped");

            if (equippedItem > 10000) {
                _unequipCompositeItem(
                    characterTokenId,
                    owner,
                    contractAddress,
                    equippedItem
                );
            } else {
                _unequipItem(
                    characterTokenId,
                    owner,
                    contractAddress,
                    equippedItem
                );
            }
        }

        // Equip the item
        characterContract.equipItem(characterTokenId, itemTokenId, itemType);
        battleItems.safeTransferFrom(
            owner,
            contractAddress,
            itemTokenId,
            1,
            ""
        );
    }

    function _equipCompositeToken(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 compositeTokenId
    ) internal {
        // Check if the composite token exists and the caller is the owner of the composite token
        require(
            compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );
        require(
            compositeTokens.balanceOf(owner, compositeTokenId) > 0,
            "Not the owner of the composite token"
        );

        // Get the TokenType of the composite token
        CharData.TokenType tokenType = compositeTokens.getTokenType(
            compositeTokenId
        );

        // Ensure the composite token type is appropriate
        require(
            tokenType == CharData.TokenType.CompositeItem ||
                tokenType == CharData.TokenType.CompositeSkill,
            "Invalid composite token type"
        );

        if (tokenType == CharData.TokenType.CompositeItem) {
            _equipCompositeItem(
                characterTokenId,
                owner,
                contractAddress,
                compositeTokenId
            );
        } else if (tokenType == CharData.TokenType.CompositeSkill) {
            _equipCompositeSkill(
                characterTokenId,
                owner,
                contractAddress,
                compositeTokenId
            );
        }
    }

    function _equipCompositeItem(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 compositeTokenId
    ) internal {
        // Check if the composite token is valid and the caller is the owner of the token
        require(
            compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );
        require(
            compositeTokens.balanceOf(owner, compositeTokenId) > 0,
            "Not the owner of the composite token"
        );

        // Get the details of the composite token
        ICompositeTokens.CompositeTokenDetails
            memory compositeTokenDetails = compositeTokens
                .getCompositeTokenDetails(compositeTokenId);

        // Get the itemType using the itemId from the composite token
        IBattleItems.Item memory itemDetails = battleItems.getItem(
            compositeTokenDetails.itemId
        );
        CharData.ItemType itemType = itemDetails.itemType;

        uint256 equippedItem = characterContract.getCharacterEquippedItem(
            characterTokenId,
            itemType
        );

        // Check if the composite token is not already equipped
        // Check if the item is not already equipped in the specified slot
        if (equippedItem != 0) {
            require(equippedItem != compositeTokenId, "Item already equipped");

            if (equippedItem > 10000) {
                _unequipCompositeItem(
                    characterTokenId,
                    owner,
                    contractAddress,
                    equippedItem
                );
            } else {
                _unequipItem(
                    characterTokenId,
                    owner,
                    contractAddress,
                    equippedItem
                );
            }
        }

        // Equip the composite token
        characterContract.equipItem(
            characterTokenId,
            compositeTokenId,
            itemType
        );
        compositeTokens.safeTransferFrom(
            owner,
            contractAddress,
            compositeTokenId,
            1,
            ""
        );
    }

    function _equipCompositeSkill(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 compositeTokenId
    ) internal {
        // Check if the composite token is valid and the caller is the owner of the token
        require(
            compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );
        require(
            compositeTokens.balanceOf(owner, compositeTokenId) > 0,
            "Not the owner of the composite token"
        );

        uint256[] memory equippedSkills = characterContract
            .getCharacterEquippedSkills(characterTokenId);

        // Check if the composite token is not already equipped
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            require(
                equippedSkills[i] != compositeTokenId,
                "Composite skill token already equipped"
            );
        }

        // Equip the composite skill token
        characterContract.equipSkill(characterTokenId, compositeTokenId);
        compositeTokens.safeTransferFrom(
            owner,
            contractAddress,
            compositeTokenId,
            1,
            ""
        );
    }

    function unequip(
        uint256 characterTokenId,
        uint256 tokenId,
        CharData.TokenType tokenType
    ) external {
        require(
            characterContract.ownerOf(characterTokenId) == msg.sender,
            "Not Owner!"
        );
        if (tokenId > 10000) {
            require(
                tokenType == CharData.TokenType.CompositeItem ||
                    tokenType == CharData.TokenType.CompositeSkill,
                "Invalid composite token type"
            );
            _unequipCompositeToken(
                characterTokenId,
                msg.sender,
                address(characterContract),
                tokenId
            );
        } else {
            if (tokenType == CharData.TokenType.Item) {
                _unequipItem(
                    characterTokenId,
                    msg.sender,
                    address(characterContract),
                    tokenId
                );
            } else if (tokenType == CharData.TokenType.Skill) {
                _unequipSkill(
                    characterTokenId,
                    msg.sender,
                    address(characterContract),
                    tokenId
                );
            } else {
                revert("Invalid token type");
            }
        }

        // Emit the appropriate event
        if (tokenType == CharData.TokenType.Skill) {
            emit SkillUnequipped(characterTokenId, tokenId);
        } else if (
            tokenType == CharData.TokenType.Item ||
            tokenType == CharData.TokenType.CompositeItem
        ) {
            emit ItemUnequipped(characterTokenId, tokenId);
        }
    }

    function _unequipSkill(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 skillId
    ) internal {
        uint256[] memory equippedSkills = characterContract
            .getCharacterEquippedSkills(characterTokenId);
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            if (equippedSkills[i] == skillId) {
                characterContract.unequipSkill(characterTokenId, skillId);
                battleSkills.safeTransferFrom(
                    contractAddress,
                    owner,
                    skillId,
                    1,
                    ""
                );
                return;
            }
        }
        revert("Skill not equipped");
    }

    function _unequipItem(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 itemTokenId
    ) internal {
        // Check if the item tokenId is valid and the caller is the owner of the item
        require(
            battleItems.totalSupply(itemTokenId) > 0,
            "Invalid item token ID"
        );

        // Get the ItemType of the item
        CharData.ItemType itemType = battleItems.getItemType(itemTokenId);

        uint256 equippedItem = characterContract.getCharacterEquippedItem(
            characterTokenId,
            itemType
        );

        // Check if the item is equipped in the specified slot
        require(equippedItem == itemTokenId, "Item not equipped");

        // Unequip the item
        characterContract.unequipItem(characterTokenId, itemType);
        battleItems.safeTransferFrom(
            contractAddress,
            owner,
            itemTokenId,
            1,
            ""
        );
    }

    function _unequipCompositeToken(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 compositeTokenId
    ) internal {
        CharData.TokenType tokenType = compositeTokens.getTokenType(
            compositeTokenId
        );
        if (tokenType == CharData.TokenType.CompositeItem) {
            _unequipCompositeItem(
                characterTokenId,
                owner,
                contractAddress,
                compositeTokenId
            );
        } else if (tokenType == CharData.TokenType.CompositeSkill) {
            _unequipCompositeSkill(
                characterTokenId,
                owner,
                contractAddress,
                compositeTokenId
            );
        } else {
            revert("Invalid composite token type");
        }
    }

    function _unequipCompositeItem(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 compositeTokenId
    ) internal {
        // Check if the composite token is valid and the caller is the owner of the token
        require(
            compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );

        // Get the details of the composite token
        ICompositeTokens.CompositeTokenDetails
            memory compositeTokenDetails = compositeTokens
                .getCompositeTokenDetails(compositeTokenId);

        // Get the itemType using the itemId from the composite token
        IBattleItems.Item memory itemDetails = battleItems.getItem(
            compositeTokenDetails.itemId
        );
        CharData.ItemType itemType = itemDetails.itemType;

        // Check if the composite token is equipped
        require(
            characterContract.getCharacterEquippedItem(
                characterTokenId,
                itemType
            ) == compositeTokenId,
            "Composite token not equipped"
        );

        // Unequip the composite item
        characterContract.unequipItem(characterTokenId, itemType);
        compositeTokens.safeTransferFrom(
            contractAddress,
            owner,
            compositeTokenId,
            1,
            ""
        );
    }

    function _unequipCompositeSkill(
        uint256 characterTokenId,
        address owner,
        address contractAddress,
        uint256 compositeTokenId
    ) internal {
        uint256[] memory equippedSkills = characterContract
            .getCharacterEquippedSkills(characterTokenId);
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            if (equippedSkills[i] == compositeTokenId) {
                characterContract.unequipSkill(
                    characterTokenId,
                    compositeTokenId
                );
                compositeTokens.safeTransferFrom(
                    contractAddress,
                    owner,
                    compositeTokenId,
                    1,
                    ""
                );
                return;
            }
        }
        revert("Skill not equipped");
    }
}
