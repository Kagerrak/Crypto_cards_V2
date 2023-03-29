// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";
import "hardhat/console.sol";

contract BattleSkills is ERC1155Base {
    struct Skill {
        uint256 skillId;
        string name;
        uint256 damage;
        uint256 manaCost;
        uint256[] statusEffects; // array of status effect IDs
    }

    struct StatusEffect {
        uint256 effectId;
        string name;
        uint256 duration;
        bool isPositive; // true if the effect is positive, false if it is negative
        uint256 damageOverTime; // amount of damage inflicted over time (if any)
        uint256 stunDuration; // duration of stun effect (if any)
        uint256 defenseBoost; // amount of defense boost (if any)
        uint256 healAmount; // amount of health restored (if any)
        // add other fields as needed
    }

    mapping(uint256 => Skill) public skills;
    mapping(uint256 => StatusEffect) public statusEffects;
    uint256 public numSkills;
    uint256 public numStatusEffects;

    constructor() ERC1155Base("BattleSkills", "BS", address(0), 0) {}

    function createSkill(
        string memory _name,
        uint256 _damage,
        uint256 _manaCost,
        uint256[] memory _statusEffects,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        mintTo(msg.sender, tokenId, _tokenURI, 1);
        skills[numSkills] = Skill(
            numSkills,
            _name,
            _damage,
            _manaCost,
            _statusEffects
        );
        numSkills++;
    }

    function createStatusEffect(
        string memory _name,
        uint256 _duration,
        bool _isPositive,
        uint256 _damageOverTime,
        uint256 _stunDuration,
        uint256 _defenseBoost,
        uint256 _healAmount
    ) public {
        statusEffects[numStatusEffects] = StatusEffect(
            numStatusEffects,
            _name,
            _duration,
            _isPositive,
            _damageOverTime,
            _stunDuration,
            _defenseBoost,
            _healAmount
        );
        numStatusEffects++;
    }

    function mintSkill(uint256 _skillId, address _caller) public {
        require(_skillId <= numSkills, "Skill does not exist");
        uint256 tokenId = _skillId;
        _mint(_caller, tokenId, 1, "");
    }

    function getSkill(uint256 _skillId) public view returns (Skill memory) {
        return skills[_skillId];
    }

    function getStatusEffect(
        uint256 _effectId
    ) public view returns (StatusEffect memory) {
        return statusEffects[_effectId];
    }

    function updateSkill(
        uint256 _skillId,
        string memory _name,
        uint256 _damage,
        uint256 _manaCost,
        uint256[] memory _statusEffects
    ) public {
        require(_skillId <= numSkills, "Skill does not exist");
        skills[_skillId].name = _name;
        skills[_skillId].damage = _damage;
        skills[_skillId].manaCost = _manaCost;
        skills[_skillId].statusEffects = _statusEffects;
    }

    function getRandomSkill(uint256 _enemyLevel) public view returns (uint256) {
        return
            (uint256(
                keccak256(abi.encodePacked(block.timestamp, _enemyLevel))
            ) % numSkills) + 1;
    }
}
