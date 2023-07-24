// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

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

    constructor() ERC1155Base("StatusEffectNFT", "SE", address(0), 0) {
        nextTokenIdToMint_ = 1;
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
        bool _isStun,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        numStatusEffects++;
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
        mintTo(msg.sender, tokenId, _tokenURI, 1);
    }

    function mintStatusEffect(uint256 _effectId, address _caller) public {
        require(
            _effectId <= numStatusEffects && _effectId != 0,
            "Invalid effect ID"
        );
        uint256 tokenId = _effectId;
        _mint(_caller, tokenId, 1, "");
    }

    function getStatusEffect(
        uint256 _effectId
    ) public view returns (StatusEffect memory) {
        return statusEffects[_effectId];
    }
}
