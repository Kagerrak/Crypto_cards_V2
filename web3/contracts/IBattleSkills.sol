// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IBattleSkills {
    function totalSupply(uint256 _tokenId) external view returns (uint256);

    function balanceOf(
        address _owner,
        uint256 _tokenId
    ) external view returns (uint256);

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        uint256 _amount,
        bytes calldata _data
    ) external;

    function mintSkill(uint256 _skillTokenId, address _to) external;

    function getSkill(
        uint256 _skillId
    )
        external
        view
        returns (
            uint256 skillId,
            string memory name,
            uint256 damage,
            uint256 manaCost,
            uint256 statusEffectId
        );

    function getStatusEffect(
        uint256 _effectId
    )
        external
        view
        returns (
            uint256 effectId,
            string memory name,
            bool isPositive,
            uint256 duration,
            uint256 attackBoost,
            uint256 attackReduction,
            uint256 defenseBoost,
            uint256 defenseReduction,
            uint256 healPerTurn,
            uint256 damagePerTurn,
            bool isStun
        );

    function updateSkill(
        uint256 _skillId,
        string memory _name,
        uint256 _damage,
        uint256 _manaCost,
        uint256 _statusEffectId
    ) external;

    function getRandomSkill(
        uint256 _enemyLevel
    ) external view returns (uint256);
}
