// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "./ICompositeTokens.sol";
import "./IBattleItems.sol";
import "./IBattleSkills.sol";
import "./CharData.sol";
import "./ICharacter.sol";

interface IEquipManagement {
    function setCharacterContract(address _characterContractAddress) external;

    function equip(
        uint256 characterTokenId,
        uint256 tokenId,
        CharData.TokenType tokenType
    ) external;

    function unequip(
        uint256 characterTokenId,
        uint256 tokenId,
        CharData.TokenType tokenType
    ) external;

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
}
