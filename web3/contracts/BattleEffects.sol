// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";

contract BattleEffects is ERC1155Base {
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

    mapping(uint256 => StatusEffect) public statusEffects;
    uint256 public numStatusEffects;

    constructor() ERC1155Base("StatusEffectNFT", "SE", address(0), 0) {}

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
        bool _isStun,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        mintTo(msg.sender, tokenId, _tokenURI, 1);
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
        numStatusEffects++;
    }

    function getStatusEffect(
        uint256 _effectId
    ) public view returns (StatusEffect memory) {
        return statusEffects[_effectId];
    }
}
