// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";

contract BattleSkills is ERC1155Base {
    struct Skill {
        uint256 skillId;
        string name;
        uint256 damage;
        uint256 manaCost;
    }

    mapping(uint256 => Skill) public skills;
    uint256 public numSkills;

    // Define the events
    event SkillCreated(
        uint256 skillId,
        string name,
        uint256 damage,
        uint256 manaCost
    );
    event SkillUpdated(
        uint256 skillId,
        string name,
        uint256 damage,
        uint256 manaCost
    );
    event SkillMinted(uint256 skillId, address caller);

    constructor() ERC1155Base(msg.sender, "BattleSkills", "BS", address(0), 0) {
        nextTokenIdToMint_ = 1;
    }

    function createSkill(
        string memory _name,
        uint256 _damage,
        uint256 _manaCost,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        numSkills++;
        mintTo(msg.sender, tokenId, _tokenURI, 1);
        skills[numSkills] = Skill(numSkills, _name, _damage, _manaCost);

        // Emit the SkillCreated event
        emit SkillCreated(numSkills, _name, _damage, _manaCost);
    }

    function getSkill(uint256 _skillId) public view returns (Skill memory) {
        return skills[_skillId];
    }

    function mintSkill(uint256 _skillId, address _caller) public {
        require(_skillId <= numSkills && _skillId != 0, "Invalid skill ID");
        uint256 tokenId = _skillId;
        _mint(_caller, tokenId, 1, "");

        // Emit the SkillMinted event
        emit SkillMinted(_skillId, _caller);
    }

    function burnSkill(uint256 _skillId, address _caller) public {
        require(_skillId <= numSkills && _skillId != 0, "Invalid skill ID");
        require(
            balanceOf[_caller][_skillId] > 0,
            "Caller does not own this skill"
        );
        _burn(_caller, _skillId, 1);
    }

    function updateSkill(
        uint256 _skillId,
        string memory _name,
        uint256 _damage,
        uint256 _manaCost
    ) public {
        require(_skillId <= numSkills, "Skill does not exist");
        skills[_skillId].name = _name;
        skills[_skillId].damage = _damage;
        skills[_skillId].manaCost = _manaCost;

        // Emit the SkillUpdated event
        emit SkillUpdated(_skillId, _name, _damage, _manaCost);
    }

    function doesSkillExist(uint256 skillId) public view returns (bool) {
        // This checks if the name of the skill is not an empty string.
        // Adjust this according to how you define a skill to exist.
        return bytes(skills[skillId].name).length > 0;
    }
}
