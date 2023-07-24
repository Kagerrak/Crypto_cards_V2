// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./CharData.sol";

interface ICharacter {
    function getCharacterEquippedItem(
        uint256 characterTokenId,
        CharData.ItemType itemType
    ) external view returns (uint256);

    function getCharacterEquippedSkills(
        uint256 characterTokenId
    ) external view returns (uint256[] memory);

    function getCharacterEquippedClass(
        uint256 characterTokenId
    ) external view returns (uint256);

    function ownerOf(uint256 characterTokenId) external view returns (address);

    function equipSkill(uint256 characterTokenId, uint256 skillId) external;

    function equipItem(
        uint256 characterTokenId,
        uint256 itemId,
        CharData.ItemType itemType
    ) external;

    function unequipSkill(uint256 characterTokenId, uint256 skillId) external;

    function unequipItem(
        uint256 characterTokenId,
        CharData.ItemType itemType
    ) external;
}
