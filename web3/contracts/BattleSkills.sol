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
        bool isPositive;
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

    event NewSkill(
        uint256 indexed skillId,
        string name,
        uint256 damage,
        uint256 manaCost,
        uint256 statusEffectId
    );
    event NewStatusEffect(
        uint256 indexed effectId,
        string name,
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

    constructor() ERC1155Base("BattleSkills", "BS", address(0), 0) {
        initializeStatusEffects(); // for testing
        //initializeSkills(); // for testing
    }

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
        // Emit the event
        emit NewSkill(numSkills, _name, _damage, _manaCost, _statusEffectId);
        numSkills++;
    }

    function createStatusEffect(
        string memory _name,
        uint256 _duration,
        bool _isPositive,
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
            _isPositive,
            _duration,
            _attackBoost,
            _attackReduction,
            _defenseBoost,
            _defenseReduction,
            _healPerTurn,
            _damagePerTurn,
            _isStun
        );
        // Emit the event
        emit NewStatusEffect(
            numStatusEffects,
            _name,
            _isPositive,
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

    function initializeStatusEffects() public {
        createStatusEffect("Stun", 1, false, 0, 0, 0, 0, 0, 0, true);
        createStatusEffect(
            "Damage Over Time",
            3,
            false,
            0,
            0,
            0,
            0,
            0,
            10,
            false
        );
        createStatusEffect("Reduce Attack", 3, false, 0, 10, 0, 0, 0, 0, false);
        createStatusEffect(
            "Reduce Defense",
            3,
            false,
            0,
            0,
            0,
            10,
            0,
            0,
            false
        );
        createStatusEffect("Boost Attack", 3, true, 10, 0, 0, 0, 0, 0, false);
        createStatusEffect("Heal Over Time", 3, true, 0, 0, 0, 0, 10, 0, false);
        createStatusEffect("Defense Boost", 3, true, 0, 0, 10, 0, 0, 0, false);
    }

    // function initializeSkills() public {
    //     createSkill("Stun Attack", 10, 5, 0, "https://example.com/skill/0");
    //     createSkill("Fireball", 20, 10, 1, "https://example.com/skill/1");
    //     createSkill("Weaken Attack", 15, 5, 2, "https://example.com/skill/2");
    //     createSkill("Weaken Defense", 15, 5, 3, "https://example.com/skill/3");
    //     createSkill("Power Strike", 25, 10, 4, "https://example.com/skill/4");
    //     createSkill("Healing Spell", 0, 10, 5, "https://example.com/skill/5");
    //     createSkill(
    //         "Defensive Stance",
    //         10,
    //         5,
    //         6,
    //         "https://example.com/skill/6"
    //     );
    // }

    function mintSkill(uint256 _skillId, address _caller) public {
        if (_skillId == 0) {
            require(numSkills > 0, "Skill does not exixt");
        }
        require(_skillId < numSkills, "Skill does not exist");
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
