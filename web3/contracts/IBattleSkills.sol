// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IBattleSkills {
    struct Skill {
        uint256 skillId;
        string name;
        uint256 damage;
        uint256 manaCost;
    }

    function createSkill(
        string memory _name,
        uint256 _damage,
        uint256 _manaCost,
        string memory _tokenURI
    ) external;

    function getSkill(uint256 _skillId) external view returns (Skill memory);

    function mintSkill(uint256 _skillId, address _caller) external;

    function burnSkill(uint256 _skillId, address _caller) external;

    function updateSkill(
        uint256 _skillId,
        string memory _name,
        uint256 _damage,
        uint256 _manaCost
    ) external;

    function doesSkillExist(uint256 skillId) external view returns (bool);

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

    function setApprovalForAll(address operator, bool approved) external;
}
