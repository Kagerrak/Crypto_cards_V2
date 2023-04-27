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
        uint256 statusEffectId; // single status effect ID
    }

    struct StatusEffect {
        uint256 effectId;
        string name;
        uint256 duration;
        uint256 attackBoost;
        uint256 attackReduction;
        uint256 defenseBoost;
        uint256 defenseReduction;
        uint256 healPerTurn;
        uint256 damagePerTurn;
        bool isStun;
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
        uint256 _statusEffectId, // single status effect ID
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        mintTo(msg.sender, tokenId, _tokenURI, 1);
        skills[numSkills] = Skill(
            numSkills,
            _name,
            _damage,
            _manaCost,
            _statusEffectId
        );
        numSkills++;
    }

    function createStatusEffect(
        string memory _name,
        uint256 _duration,
        uint256 _attackBoost,
        uint256 _attackReduction,
        uint256 _defenseBoost,
        uint256 _defenseReduction,
        uint256 _healPerTurn,
        uint256 _damagePerTurn,
        bool _isStun
    ) public {
        statusEffects[numStatusEffects] = StatusEffect(
            numStatusEffects,
            _name,
            _duration,
            _attackBoost,
            _attackReduction,
            _defenseBoost,
            _defenseReduction,
            _healPerTurn,
            _damagePerTurn,
            _isStun
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
        uint256 _statusEffectId
    ) public {
        require(_skillId <= numSkills, "Skill does not exist");
        skills[_skillId].name = _name;
        skills[_skillId].damage = _damage;
        skills[_skillId].manaCost = _manaCost;
        skills[_skillId].statusEffectId = _statusEffectId;
    }

    function getRandomSkill(uint256 _enemyLevel) public view returns (uint256) {
        return
            (uint256(
                keccak256(abi.encodePacked(block.timestamp, _enemyLevel))
            ) % numSkills) + 1;
    }
}
