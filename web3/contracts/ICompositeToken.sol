// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface ICompositeTokens {
    enum TokenType {
        Item,
        Skill,
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

    struct CompositeTokenDetails {
        uint256 tokenId; // the ID of the composite token
        bytes32 compositeHash; // the compositeHash of the composite token
        uint256[] componentTokenIds; // the IDs of the tokens that compose the composite token
        address[] componentContracts; // the contracts of the tokens that compose the composite token
        TokenType tokenType; // the type of the primary token
        ItemType itemType; // the subtype of the primary token
    }

    function getCompositeTokenDetails(
        uint256 tokenId
    ) external view returns (CompositeTokenDetails memory);

    function getComponentTokenIds(
        uint256 tokenId
    ) external view returns (uint256[] memory);

    function getComponentContracts(
        uint256 tokenId
    ) external view returns (address[] memory);

    function totalSupply(uint256 tokenId) external view returns (uint256);

    function balanceOf(
        address owner,
        uint256 tokenId
    ) external view returns (uint256);

    function getTokenType(uint256 tokenId) external view returns (TokenType);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;
    // Add other function signatures as required
}
