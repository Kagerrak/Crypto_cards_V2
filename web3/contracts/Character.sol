// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";

import "./ICompositeToken.sol";
import "hardhat/console.sol";
import "./EquipManagement.sol";
import "./CharacterManagement.sol";
import "./Class.sol";

import "@thirdweb-dev/contracts/openzeppelin-presets/utils/ERC1155/ERC1155Holder.sol";
import "@thirdweb-dev/contracts/lib/TWStrings.sol";

contract Character is
    ERC721Base,
    ERC1155Holder,
    EquipManagement,
    CharacterManagement
{
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Base, ERC1155Receiver) returns (bool) {
        return
            ERC721Base.supportsInterface(interfaceId) ||
            ERC1155Receiver.supportsInterface(interfaceId);
    }

    using TWStrings for uint256;

    // enum TokenType { Item, Skill, CompositeItem, CompositeSkill }

    event NewCharacter(
        address indexed player,
        uint256 indexed tokenId,
        uint256 typeId
    );

    event ClassEquipped(
        uint256 indexed characterTokenId,
        uint256 indexed classId
    );

    event ClassUnequipped(
        uint256 indexed characterTokenId,
        uint256 indexed classId
    );

    mapping(uint256 => string) private fullURI;
    CharacterClass public characterClasses;

    function setBattleSkills(address _address) public onlyOwner {
        battleSkills = IBattleSkills(_address);
    }

    function setBattleItems(address _address) public onlyOwner {
        battleItems = IBattleItems(_address);
    }

    function setClassContract(address _address) public onlyOwner {
        characterClasses = CharacterClass(_address);
    }

    function setCompositeTokens(address _address) public onlyOwner {
        compositeTokens = ICompositeTokens(_address);
    }

    constructor()
        ERC721Base("Character", "CNFT", msg.sender, 0)
        CharacterManagement(msg.sender)
    {}

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        string memory fullUriForToken = fullURI[_tokenId];
        if (bytes(fullUriForToken).length > 0) {
            return fullUriForToken;
        }

        string memory batchUri = _getBaseURI(_tokenId);
        return string(abi.encodePacked(batchUri, _tokenId.toString()));
    }

    function _setTokenURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) internal override {
        fullURI[_tokenId] = _tokenURI;
    }

    function updateURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) public onlyOwner {
        _setTokenURI(_tokenId, _tokenURI);
    }

    function newCharacter(uint256 _typeId) public {
        require(_typeId < charTypes.length, "Invalid character type ID");

        // Mint the new token with the specified owner and quantity
        _safeMint(msg.sender, 1);

        // Set the token URI for the new token
        console.log(charTypes[_typeId].uri);
        console.log(numCharacters);
        _setTokenURI(numCharacters, charTypes[_typeId].uri);

        // Emit the new character event
        emit NewCharacter(msg.sender, numCharacters, _typeId);

        // Initialize the character stats and equipment
        _initializeCharacterStats(_typeId);
        _initializeCharacterEquips();
        _initializeCharacterRecoveryStats(_typeId);

        // Increment the token ID counter for the next mint
        numCharacters++;
    }

    function equip(
        uint256 characterTokenId,
        uint256 tokenId,
        TokenType tokenType
    ) public {
        equipInternal(
            characterEquips[characterTokenId],
            characterTokenId,
            tokenId,
            tokenType
        );
    }

    function unequip(
        uint256 characterTokenId,
        uint256 tokenId,
        TokenType tokenType
    ) public {
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );
        unequipInternal(
            characterEquips[characterTokenId],
            characterTokenId,
            tokenId,
            tokenType
        );
    }

    function equipClass(uint256 characterTokenId, uint256 classId) public {
        // Check if the character token ID exists
        require(characterTokenId < numCharacters, "Invalid character token ID");

        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        // Check if the class exists
        require(characterClasses.totalSupply(classId) > 0, "Invalid class ID");

        // Check if the class is owned by the caller
        require(
            characterClasses.balanceOf(msg.sender, classId) > 0,
            "Not the owner of the class"
        );

        // Check if the class is not already equipped
        require(
            characterEquips[characterTokenId].equippedClass != classId,
            "Class already equipped"
        );

        // Unequip the previous class
        uint256 previousClassId = characterEquips[characterTokenId]
            .equippedClass;
        if (previousClassId != 0) {
            characterClasses.safeTransferFrom(
                address(this),
                msg.sender,
                previousClassId,
                1,
                ""
            );
        }

        // Equip the class
        characterEquips[characterTokenId].equippedClass = classId;
        characterClasses.safeTransferFrom(
            msg.sender,
            address(this),
            classId,
            1,
            ""
        );
        emit ClassEquipped(characterTokenId, classId);
    }

    function unequipClass(uint256 characterTokenId) external {
        // Check if the caller is the owner of the character
        require(
            ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );

        // Check if there is a class equipped
        uint256 equippedClassId = characterEquips[characterTokenId]
            .equippedClass;
        require(equippedClassId != 0, "No class equipped");

        // Unequip the class
        emit ClassUnequipped(characterTokenId, equippedClassId);
        characterEquips[characterTokenId].equippedClass = 0;
        characterClasses.safeTransferFrom(
            address(this),
            msg.sender,
            equippedClassId,
            1,
            ""
        );
    }

    function getEquippedClass(
        uint256 characterTokenId
    ) external view returns (uint256) {
        return characterEquips[characterTokenId].equippedClass;
    }

    function mintNewCharacterWithItemAndEquip(
        uint256 _typeId,
        uint256 _skillTokenId
    ) external {
        // Mint a new character
        newCharacter(_typeId);

        // Mint a new item
        battleSkills.mintSkill(_skillTokenId, msg.sender);

        // Equip the item to the new character
        equip(numCharacters - 1, _skillTokenId, TokenType.Skill);
    }
}
