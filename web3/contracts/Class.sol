// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";

contract CharacterClass is ERC1155Base {
    struct Class {
        string name;
        uint256 strength;
        uint256 dexterity;
        uint256 intelligence;
        uint256 vitality;
        uint256 accuracy;
    }

    mapping(uint256 => Class) public classes;
    uint256 public numClasses;

    constructor() ERC1155Base("ClassContract", "CC", address(0), 0) {}

    function createClass(
        string memory _name,
        uint256 _strength,
        uint256 _dexterity,
        uint256 _intelligence,
        uint256 _vitality,
        uint256 _accuracy,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        mintTo(msg.sender, tokenId, _tokenURI, 1);
        numClasses++;
        classes[numClasses] = Class(
            _name,
            _strength,
            _dexterity,
            _intelligence,
            _vitality,
            _accuracy
        );
    }

    function mintClass(uint256 _classId) public {
        require(_classId <= numClasses, "Class does not exist");
        uint256 tokenId = _classId;
        _mint(msg.sender, tokenId, 1, "");
    }

    function getClass(uint256 _classId) public view returns (Class memory) {
        return classes[_classId];
    }

    function updateClass(
        uint256 _classId,
        string memory _name,
        uint256 _strength,
        uint256 _dexterity,
        uint256 _intelligence,
        uint256 _vitality,
        uint256 _accuracy
    ) public {
        require(_classId <= numClasses, "Class does not exist");
        classes[_classId].name = _name;
        classes[_classId].strength = _strength;
        classes[_classId].dexterity = _dexterity;
        classes[_classId].intelligence = _intelligence;
        classes[_classId].vitality = _vitality;
        classes[_classId].accuracy = _accuracy;
    }

    function getRandomClass() public view returns (uint256) {
        return
            (uint256(keccak256(abi.encodePacked(block.timestamp))) %
                numClasses) + 1;
    }
}
