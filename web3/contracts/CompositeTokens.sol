// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";
import "./BattleSkills.sol";
import "./BattleItems.sol";
import "./BattleEffects.sol";
import "./CharData.sol";

contract CompositeTokens is ERC1155Base {
    uint256 private _compositeCount = 10001;
    mapping(uint256 => CompositeTokenDetails) private _compositeTokenDetails;
    mapping(bytes32 => uint256) private _hashToTokenId;

    enum CompositeType {
        SkillWithEffect,
        ItemWithSkill,
        ItemWithEffect,
        ItemWithEffectAndSkill,
        ItemWithEffectAndSkillWithEffect
    }

    struct CompositeTokenDetails {
        uint256 tokenId;
        bytes32 compositeHash;
        CompositeType compositeType;
        CharData.TokenType tokenType;
        uint256 itemId;
        uint256 itemEffectId;
        uint256 battleSkillId;
        uint256 skillEffectId;
        uint256 compositeItemId;
        uint256 compositeSkillId;
    }

    BattleSkills public battleSkills;
    BattleItems public battleItems;
    BattleEffects public battleEffects;

    constructor(
        address _battleSkillsAddress,
        address _battleItemsAddress,
        address _battleEffectsAddress
    ) ERC1155Base("CompositeTokens", "CT", address(0), 0) {
        battleSkills = BattleSkills(_battleSkillsAddress);
        battleItems = BattleItems(_battleItemsAddress);
        battleEffects = BattleEffects(_battleEffectsAddress);
        nextTokenIdToMint_ = 10001;
    }

    function mintCompositeToken(
        uint256 tokenId1,
        uint256 tokenId2,
        CompositeType _compositeType
    ) public {
        (address contract1, address contract2) = getContracts(_compositeType);
        require(
            ERC1155(contract1).balanceOf(msg.sender, tokenId1) > 0,
            "Not the owner of the token1"
        );
        require(
            ERC1155(contract2).balanceOf(msg.sender, tokenId2) > 0,
            "Not the owner of the token2"
        );

        // Burn the original tokens based on the composite type
        if (_compositeType == CompositeType.SkillWithEffect) {
            BattleSkills(contract1).burnSkill(tokenId1, msg.sender);
            BattleEffects(contract2).burnEffect(tokenId2, msg.sender);
        } else if (_compositeType == CompositeType.ItemWithSkill) {
            BattleItems(contract1).burnItem(tokenId1, msg.sender);
            BattleSkills(contract2).burnSkill(tokenId2, msg.sender);
        } else if (_compositeType == CompositeType.ItemWithEffect) {
            BattleItems(contract1).burnItem(tokenId1, msg.sender);
            BattleEffects(contract2).burnEffect(tokenId2, msg.sender);
        } else if (
            _compositeType == CompositeType.ItemWithEffectAndSkill ||
            _compositeType == CompositeType.ItemWithEffectAndSkillWithEffect
        ) {
            // Assuming CompositeTokens has a burn method
            burnComposite(tokenId1, msg.sender);
            burnComposite(tokenId1, msg.sender);
        } else {
            revert("Invalid composite type");
        }

        bytes32 compositeHash = keccak256(
            abi.encodePacked(contract1, tokenId1, contract2, tokenId2)
        );
        uint256 existingTokenId = _hashToTokenId[compositeHash];

        // If this combination of tokens has been used before, mint the existing token
        if (existingTokenId != 0) {
            _mint(msg.sender, existingTokenId, 1, "");
            return;
        }

        CompositeTokenDetails memory details = getDetails(
            _compositeType,
            contract1,
            contract2,
            tokenId1,
            tokenId2
        );

        uint256 tokenId = type(uint256).max;

        _compositeTokenDetails[_compositeCount] = details;
        _hashToTokenId[compositeHash] = _compositeCount;

        // Get the URI of the first token
        string memory uri = ERC1155(contract1).uri(tokenId1);

        mintTo(msg.sender, tokenId, uri, 1);
        _compositeCount++;
    }

    function burnComposite(uint256 _compositeId, address _caller) internal {
        require(
            _compositeId <= _compositeCount && _compositeId != 0,
            "Invalid skill ID"
        );
        require(
            balanceOf[_caller][_compositeId] > 0,
            "Caller does not own this skill"
        );
        _burn(_caller, _compositeId, 1);
    }

    function burnCompositeToken(uint256 tokenId) public {
        uint256 balance = balanceOf[msg.sender][tokenId];
        require(balance > 0, "You must own the token to burn it");

        _burn(msg.sender, tokenId, 1);

        CompositeTokenDetails memory details = getCompositeTokenDetails(
            tokenId
        );

        // Mint the original tokens
        if (details.itemId != 0) {
            BattleItems(address(battleItems)).mintItem(
                details.itemId,
                msg.sender
            );
        }
        if (details.battleSkillId != 0) {
            BattleSkills(address(battleSkills)).mintSkill(
                details.battleSkillId,
                msg.sender
            );
        }
        if (details.itemEffectId != 0) {
            BattleEffects(address(battleEffects)).mintEffect(
                details.itemEffectId,
                msg.sender
            );
        }
        if (details.skillEffectId != 0) {
            BattleEffects(address(battleEffects)).mintEffect(
                details.skillEffectId,
                msg.sender
            );
        }
    }

    function getDetails(
        CompositeType _compositeType,
        address contract1,
        address contract2,
        uint256 tokenId1,
        uint256 tokenId2
    ) private view returns (CompositeTokenDetails memory) {
        if (_compositeType == CompositeType.SkillWithEffect) {
            return
                CompositeTokenDetails({
                    tokenId: _compositeCount,
                    compositeHash: keccak256(
                        abi.encodePacked(tokenId1, tokenId2)
                    ),
                    compositeType: _compositeType,
                    tokenType: CharData.TokenType.CompositeSkill,
                    itemId: 0,
                    itemEffectId: 0,
                    battleSkillId: contract1 == address(battleSkills)
                        ? tokenId1
                        : tokenId2,
                    skillEffectId: contract2 == address(battleEffects)
                        ? tokenId2
                        : tokenId1,
                    compositeItemId: 0,
                    compositeSkillId: 0
                });
        } else if (_compositeType == CompositeType.ItemWithSkill) {
            return
                CompositeTokenDetails({
                    tokenId: _compositeCount,
                    compositeHash: keccak256(
                        abi.encodePacked(tokenId1, tokenId2)
                    ),
                    compositeType: _compositeType,
                    tokenType: CharData.TokenType.CompositeItem,
                    itemId: contract1 == address(battleItems)
                        ? tokenId1
                        : tokenId2,
                    itemEffectId: 0,
                    battleSkillId: contract2 == address(battleSkills)
                        ? tokenId2
                        : tokenId1,
                    skillEffectId: 0,
                    compositeItemId: 0,
                    compositeSkillId: 0
                });
        } else if (_compositeType == CompositeType.ItemWithEffect) {
            return
                CompositeTokenDetails({
                    tokenId: _compositeCount,
                    compositeHash: keccak256(
                        abi.encodePacked(tokenId1, tokenId2)
                    ),
                    compositeType: _compositeType,
                    tokenType: CharData.TokenType.CompositeItem,
                    itemId: contract1 == address(battleItems)
                        ? tokenId1
                        : tokenId2,
                    itemEffectId: contract2 == address(battleEffects)
                        ? tokenId2
                        : tokenId1,
                    battleSkillId: 0,
                    skillEffectId: 0,
                    compositeItemId: 0,
                    compositeSkillId: 0
                });
        } else if (
            _compositeType == CompositeType.ItemWithEffectAndSkill ||
            _compositeType == CompositeType.ItemWithEffectAndSkillWithEffect
        ) {
            CompositeTokenDetails memory oldDetails1 = _compositeTokenDetails[
                tokenId1
            ];
            CompositeTokenDetails memory oldDetails2 = _compositeTokenDetails[
                tokenId2
            ];
            return
                CompositeTokenDetails({
                    tokenId: _compositeCount,
                    compositeHash: keccak256(
                        abi.encodePacked(tokenId1, tokenId2)
                    ),
                    compositeType: _compositeType,
                    tokenType: oldDetails1.itemId != 0
                        ? CharData.TokenType.CompositeItem
                        : CharData.TokenType.CompositeSkill,
                    itemId: oldDetails1.itemId != 0
                        ? oldDetails1.itemId
                        : oldDetails2.itemId,
                    itemEffectId: oldDetails1.itemEffectId != 0
                        ? oldDetails1.itemEffectId
                        : oldDetails2.itemEffectId,
                    battleSkillId: oldDetails1.battleSkillId != 0
                        ? oldDetails1.battleSkillId
                        : oldDetails2.battleSkillId,
                    skillEffectId: oldDetails1.skillEffectId != 0
                        ? oldDetails1.skillEffectId
                        : oldDetails2.skillEffectId,
                    compositeItemId: contract1 == address(this)
                        ? tokenId1
                        : tokenId2,
                    compositeSkillId: contract1 == address(this)
                        ? tokenId2
                        : tokenId1
                });
        } else {
            revert("Invalid composite type");
        }
    }

    function getContracts(
        CompositeType _compositeType
    ) internal view returns (address contract1, address contract2) {
        if (_compositeType == CompositeType.SkillWithEffect) {
            return (address(battleSkills), address(battleEffects));
        } else if (_compositeType == CompositeType.ItemWithSkill) {
            return (address(battleItems), address(battleSkills));
        } else if (_compositeType == CompositeType.ItemWithEffect) {
            return (address(battleItems), address(battleEffects));
        } else if (
            _compositeType == CompositeType.ItemWithEffectAndSkill ||
            _compositeType == CompositeType.ItemWithEffectAndSkillWithEffect
        ) {
            return (address(this), address(this));
        } else {
            revert("Invalid composite type");
        }
    }

    function getTokenType(
        uint256 tokenId
    ) external view returns (CharData.TokenType) {
        CompositeTokenDetails
            memory compositeTokenDetails = getCompositeTokenDetails(tokenId);
        CompositeType _compositeType = compositeTokenDetails.compositeType;
        return getTokenType(_compositeType); // Calls the internal function
    }

    function getTokenType(
        CompositeType _compositeType
    ) internal pure returns (CharData.TokenType) {
        if (_compositeType == CompositeType.SkillWithEffect) {
            return CharData.TokenType.CompositeSkill;
        } else {
            return CharData.TokenType.CompositeItem;
        }
    }

    function getCompositeTokenDetails(
        uint256 tokenId
    ) public view returns (CompositeTokenDetails memory) {
        return _compositeTokenDetails[tokenId];
    }

    function getCompositeType(
        uint256 tokenId
    ) public view returns (CompositeType) {
        return _compositeTokenDetails[tokenId].compositeType;
    }

    function getCompositeTokenCount() public view returns (uint256) {
        return _compositeCount;
    }
}
