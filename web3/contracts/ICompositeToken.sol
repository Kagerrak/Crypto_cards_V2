// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./CharData.sol";

interface ICompositeTokens {
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

    function getTokenType(
        uint256 tokenId
    ) external view returns (CharData.TokenType);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;

    function setApprovalForAll(address operator, bool approved) external;
    // Add other function signatures as required
}
