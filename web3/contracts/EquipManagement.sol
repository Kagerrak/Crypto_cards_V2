// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ICompositeToken.sol";
import "./IBattleItems.sol";
import "./IBattleSkills.sol";
import "./CharData.sol";

contract EquipManagement {
    using CharData for CharData.CharacterEquips;

    enum TokenType {
        Item,
        Skill,
        CompositeItem,
        CompositeSkill
    }

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

    IBattleItems public battleItems;
    IBattleSkills public battleSkills;
    ICompositeTokens public compositeTokens;

    function equipInternal(
        CharData.CharacterEquips storage character,
        uint256 characterTokenId,
        uint256 tokenId,
        TokenType tokenType
    ) internal {
        if (tokenId > 10000) {
            require(
                tokenType == TokenType.CompositeItem ||
                    tokenType == TokenType.CompositeSkill,
                "Invalid composite token type"
            );
            _equipCompositeToken(
                character,
                msg.sender,
                address(this),
                tokenId,
                compositeTokens
            );
        } else {
            if (tokenType == TokenType.Item) {
                _equipItem(
                    character,
                    msg.sender,
                    address(this),
                    tokenId,
                    battleItems
                );
            } else if (tokenType == TokenType.Skill) {
                _equipSkill(
                    character,
                    msg.sender,
                    address(this),
                    tokenId,
                    battleSkills
                );
            } else {
                revert("Invalid token type");
            }
        }

        // Emit the appropriate event
        if (tokenType == TokenType.Skill) {
            emit SkillEquipped(characterTokenId, tokenId);
        } else if (
            tokenType == TokenType.Item || tokenType == TokenType.CompositeItem
        ) {
            emit ItemEquipped(characterTokenId, tokenId);
        }
    }

    function _equipSkill(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 skillId,
        IBattleSkills _battleSkills
    ) internal {
        // Check if the skill exists
        require(_battleSkills.doesSkillExist(skillId), "Invalid skill ID");

        // Check if the skill is owned by the caller
        require(
            _battleSkills.balanceOf(owner, skillId) > 0,
            "Not the owner of the skill"
        );

        // Check if the skill is not already equipped
        for (uint256 i = 0; i < character.equippedSkills.length; i++) {
            require(
                character.equippedSkills[i] != skillId,
                "Skill already equipped"
            );
        }

        // Transfer the skill to the contract and add it to the equippedSkills array
        _battleSkills.safeTransferFrom(owner, contractAddress, skillId, 1, "");
        character.equippedSkills.push(skillId);
    }

    function _equipItem(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 itemTokenId,
        IBattleItems _battleItems
    ) internal {
        // Check if the item tokenId is valid and the caller is the owner of the item
        require(
            _battleItems.totalSupply(itemTokenId) > 0,
            "Invalid item token ID"
        );
        require(
            _battleItems.balanceOf(owner, itemTokenId) > 0,
            "Not the owner of the item"
        );

        // Get the ItemType of the item
        IBattleItems.ItemType itemType = _battleItems.getItemType(itemTokenId);

        // Check if the item is not already equipped in the specified slot
        require(
            character.equippedItems[itemType] != itemTokenId,
            "Item already equipped"
        );

        // Equip the item
        character.equippedItems[itemType] = itemTokenId;
        _battleItems.safeTransferFrom(
            owner,
            contractAddress,
            itemTokenId,
            1,
            ""
        );
    }

    function _equipCompositeToken(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 compositeTokenId,
        ICompositeTokens _compositeTokens
    ) internal {
        // Check if the composite token exists and the caller is the owner of the composite token
        require(
            _compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );
        require(
            _compositeTokens.balanceOf(owner, compositeTokenId) > 0,
            "Not the owner of the composite token"
        );

        // Get the TokenType of the composite token
        TokenType tokenType = convertTokenType(
            _compositeTokens.getTokenType(compositeTokenId)
        );

        // Ensure the composite token type is appropriate
        require(
            tokenType == TokenType.Item || tokenType == TokenType.Skill,
            "Invalid composite token type"
        );

        if (tokenType == TokenType.Item) {
            _equipCompositeItem(
                character,
                owner,
                contractAddress,
                compositeTokenId,
                _compositeTokens
            );
        } else if (tokenType == TokenType.Skill) {
            _equipCompositeSkill(
                character,
                owner,
                contractAddress,
                compositeTokenId,
                _compositeTokens
            );
        }
    }

    function _equipCompositeItem(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 compositeTokenId,
        ICompositeTokens _compositeTokens
    ) internal {
        // Check if the composite token is valid and the caller is the owner of the token
        require(
            _compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );
        require(
            _compositeTokens.balanceOf(owner, compositeTokenId) > 0,
            "Not the owner of the composite token"
        );

        // Get the ItemType of the composite token
        IBattleItems.ItemType itemType = convertItemType(
            _compositeTokens.getCompositeTokenDetails(compositeTokenId).itemType
        );

        // Check if the composite token is not already equipped
        require(
            character.equippedItems[itemType] != compositeTokenId,
            "Composite token already equipped"
        );

        // Equip the composite token
        character.equippedItems[itemType] = compositeTokenId;
        _compositeTokens.safeTransferFrom(
            owner,
            contractAddress,
            compositeTokenId,
            1,
            ""
        );
    }

    function _equipCompositeSkill(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 compositeTokenId,
        ICompositeTokens _compositeTokens
    ) internal {
        // Check if the composite token is valid and the caller is the owner of the token
        require(
            _compositeTokens.totalSupply(compositeTokenId) > 0,
            "Invalid composite token ID"
        );
        require(
            _compositeTokens.balanceOf(owner, compositeTokenId) > 0,
            "Not the owner of the composite token"
        );

        // Check if the composite token is not already equipped
        for (uint256 i = 0; i < character.equippedSkills.length; i++) {
            require(
                character.equippedSkills[i] != compositeTokenId,
                "Composite skill token already equipped"
            );
        }

        // Equip the composite skill token
        character.equippedSkills.push(compositeTokenId);
        _compositeTokens.safeTransferFrom(
            owner,
            contractAddress,
            compositeTokenId,
            1,
            ""
        );
    }

    function unequipInternal(
        CharData.CharacterEquips storage character,
        uint256 characterTokenId,
        uint256 tokenId,
        TokenType tokenType
    ) internal {
        if (tokenId > 10000) {
            require(
                tokenType == TokenType.CompositeItem ||
                    tokenType == TokenType.CompositeSkill,
                "Invalid composite token type"
            );
            _unequipCompositeToken(
                character,
                msg.sender,
                address(this),
                tokenId,
                compositeTokens
            );
        } else {
            if (tokenType == TokenType.Item) {
                _unequipItem(
                    character,
                    msg.sender,
                    address(this),
                    tokenId,
                    battleItems
                );
            } else if (tokenType == TokenType.Skill) {
                _unequipSkill(
                    character,
                    msg.sender,
                    address(this),
                    tokenId,
                    battleSkills
                );
            } else {
                revert("Invalid token type");
            }
        }

        // Emit the appropriate event
        if (tokenType == TokenType.Skill) {
            emit SkillUnequipped(characterTokenId, tokenId);
        } else if (
            tokenType == TokenType.Item || tokenType == TokenType.CompositeItem
        ) {
            emit ItemUnequipped(characterTokenId, tokenId);
        }
    }

    function _unequipSkill(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 skillId,
        IBattleSkills _battleSkills
    ) internal {
        uint256[] storage equippedSkills = character.equippedSkills;
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            if (equippedSkills[i] == skillId) {
                equippedSkills[i] = equippedSkills[equippedSkills.length - 1];
                equippedSkills.pop();
                _battleSkills.safeTransferFrom(
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
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 itemTokenId,
        IBattleItems _battleItems
    ) internal {
        IBattleItems.ItemType itemType = _battleItems.getItemType(itemTokenId);
        require(
            character.equippedItems[itemType] == itemTokenId,
            "Item not equipped"
        );
        character.equippedItems[itemType] = 0;
        _battleItems.safeTransferFrom(
            contractAddress,
            owner,
            itemTokenId,
            1,
            ""
        );
    }

    function _unequipCompositeToken(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 compositeTokenId,
        ICompositeTokens _compositeTokens
    ) internal {
        TokenType tokenType = convertTokenType(
            _compositeTokens.getTokenType(compositeTokenId)
        );
        if (tokenType == TokenType.Item) {
            _unequipCompositeItem(
                character,
                owner,
                contractAddress,
                compositeTokenId,
                _compositeTokens
            );
        } else if (tokenType == TokenType.Skill) {
            _unequipCompositeSkill(
                character,
                owner,
                contractAddress,
                compositeTokenId,
                _compositeTokens
            );
        } else {
            revert("Invalid composite token type");
        }
    }

    function _unequipCompositeItem(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 compositeTokenId,
        ICompositeTokens _compositeTokens
    ) internal {
        IBattleItems.ItemType itemType = convertItemType(
            _compositeTokens.getCompositeTokenDetails(compositeTokenId).itemType
        );
        require(
            character.equippedItems[itemType] == compositeTokenId,
            "Composite item not equipped"
        );
        character.equippedItems[itemType] = 0;
        _compositeTokens.safeTransferFrom(
            contractAddress,
            owner,
            compositeTokenId,
            1,
            ""
        );
    }

    function _unequipCompositeSkill(
        CharData.CharacterEquips storage character,
        address owner,
        address contractAddress,
        uint256 compositeTokenId,
        ICompositeTokens _compositeTokens
    ) internal {
        uint256[] storage equippedSkills = character.equippedSkills;
        for (uint256 i = 0; i < equippedSkills.length; i++) {
            if (equippedSkills[i] == compositeTokenId) {
                equippedSkills[i] = equippedSkills[equippedSkills.length - 1];
                equippedSkills.pop();
                _compositeTokens.safeTransferFrom(
                    contractAddress,
                    owner,
                    compositeTokenId,
                    1,
                    ""
                );
                return;
            }
        }

        revert("Composite skill not equipped");
    }

    function convertTokenType(
        ICompositeTokens.TokenType tokenType
    ) private pure returns (TokenType) {
        if (tokenType == ICompositeTokens.TokenType.Item) {
            return TokenType.Item;
        } else if (tokenType == ICompositeTokens.TokenType.Skill) {
            return TokenType.Skill;
        } else {
            revert("Invalid composite token type");
        }
    }

    function convertItemType(
        ICompositeTokens.ItemType compositeItemType
    ) private pure returns (IBattleItems.ItemType) {
        if (compositeItemType == ICompositeTokens.ItemType.Weapon) {
            return IBattleItems.ItemType.Weapon;
        } else if (compositeItemType == ICompositeTokens.ItemType.Headgear) {
            return IBattleItems.ItemType.Headgear;
        } else if (compositeItemType == ICompositeTokens.ItemType.BodyArmor) {
            return IBattleItems.ItemType.BodyArmor;
        } else if (compositeItemType == ICompositeTokens.ItemType.Pants) {
            return IBattleItems.ItemType.Pants;
        } else if (compositeItemType == ICompositeTokens.ItemType.Footwear) {
            return IBattleItems.ItemType.Footwear;
        } else {
            revert("Invalid composite item type");
        }
    }
}
