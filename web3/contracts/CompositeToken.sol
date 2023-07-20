// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";

import "./BattleSkills.sol";
import "./BattleItems.sol";
import "./BattleEffects.sol"; // assuming BattleEffects is your ERC1155 contract for effects
import "@thirdweb-dev/contracts/openzeppelin-presets/utils/ERC1155/ERC1155Holder.sol";

contract CompositeTokens is ERC1155Base, ERC1155Holder {
    uint256 private _compositeCount = 10001;
    mapping(uint256 => CompositeTokenDetails) private _compositeTokenDetails; // map from tokenId to composite token details

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC1155Base, ERC1155Receiver)
        returns (bool)
    {
        return
            ERC1155Base.supportsInterface(interfaceId) ||
            ERC1155Receiver.supportsInterface(interfaceId);
    }

    enum TokenType {
        Skill,
        Item,
        Effect
    }
    enum ItemType {
        Weapon,
        Headgear,
        BodyArmor,
        Pants,
        Footwear
    }

    struct CompositeTokenDetails {
        uint256 tokenId; // the ID of the composite token
        bytes32 compositeHash; // the compositeHash of the composite token
        uint256[] componentTokenIds; // the IDs of the tokens that compose the composite token
        address[] componentContracts; // the contracts of the tokens that compose the composite token
        TokenType tokenType; // the type of the primary token
        ItemType itemType; // the subtype of the primary token
    }

    BattleSkills public battleSkills;
    BattleItems public battleItems;
    BattleEffects public battleEffects; // Added this line

    constructor(
        address _battleSkillsAddress,
        address _battleItemsAddress,
        address _battleEffectsAddress // Added this parameter
    ) ERC1155Base("CompositeTokens", "CT", address(0), 0) {
        battleSkills = BattleSkills(_battleSkillsAddress);
        battleItems = BattleItems(_battleItemsAddress);
        battleEffects = BattleEffects(_battleEffectsAddress);

        nextTokenIdToMint_ = 10001;
    }

    function mintCompositeToken(
        uint256[] memory tokenIds,
        address[] memory contracts,
        string memory _tokenURI,
        TokenType _tokenType,
        ItemType _itemType
    ) public {
        require(
            tokenIds.length == contracts.length,
            "Must provide a contract for every tokenId"
        );
        require(
            tokenIds.length >= 1 && tokenIds.length <= 3,
            "Can only combine 1 to 3 tokens"
        );

        bytes32 compositeHash = keccak256(
            abi.encodePacked(tokenIds, contracts)
        );

        // Check ownership of the tokens and mint the composite token
        uint256 statusEffectCount = 0;
        uint256 skillCount = 0;
        uint256 itemCount = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                ERC1155(contracts[i]).balanceOf(msg.sender, tokenIds[i]) > 0,
                "Not the owner of the token"
            );
            ERC1155(contracts[i]).safeTransferFrom(
                msg.sender,
                address(this),
                tokenIds[i],
                1,
                ""
            );

            if (contracts[i] == address(battleSkills)) {
                skillCount++;
            } else if (contracts[i] == address(battleItems)) {
                itemCount++;
            } else if (contracts[i] == address(battleEffects)) {
                statusEffectCount++;
            }
        }

        require(statusEffectCount <= 1, "Can only equip one status effect");
        require(
            !(itemCount > 0 && skillCount == 0),
            "Cannot equip a status effect to an item without a skill"
        );

        uint256 tokenId = type(uint256).max;

        // Store the composite token details
        CompositeTokenDetails memory details = CompositeTokenDetails({
            tokenId: _compositeCount,
            compositeHash: compositeHash,
            componentTokenIds: tokenIds,
            componentContracts: contracts,
            tokenType: _tokenType,
            itemType: _itemType
        });

        _compositeTokenDetails[tokenId] = details;

        mintTo(msg.sender, tokenId, _tokenURI, 1);

        _compositeCount++;
    }

    function getTokenType(uint256 tokenId) public view returns (TokenType) {
        CompositeTokenDetails memory details = getCompositeTokenDetails(
            tokenId
        );
        return details.tokenType;
    }

    function getCompositeTokenDetails(
        uint256 tokenId
    ) public view returns (CompositeTokenDetails memory) {
        return _compositeTokenDetails[tokenId];
    }

    function getComponentTokenIds(
        uint256 tokenId
    ) public view returns (uint256[] memory) {
        return _compositeTokenDetails[tokenId].componentTokenIds;
    }

    function getComponentContracts(
        uint256 tokenId
    ) public view returns (address[] memory) {
        return _compositeTokenDetails[tokenId].componentContracts;
    }

    function getCompositeTokenCount() public view returns (uint256) {
        return _compositeCount;
    }
}
