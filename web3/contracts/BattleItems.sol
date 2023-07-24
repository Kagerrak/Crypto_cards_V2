// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";
import "./CharData.sol";

contract BattleItems is ERC1155Base {
    struct Item {
        string name;
        uint256 attack;
        uint256 defense;
        uint256 health;
        uint256 mana;
        CharData.ItemType itemType;
    }

    mapping(uint256 => Item) public items;
    uint256 private numItems;

    event NewItem(
        uint256 indexed itemId,
        string name,
        uint256 attack,
        uint256 defense,
        uint256 health,
        uint256 mana,
        CharData.ItemType itemType
    );
    event UpdatedItem(
        uint256 indexed itemId,
        string name,
        uint256 attack,
        uint256 defense,
        uint256 health,
        uint256 mana
    );

    constructor() ERC1155Base("ItemContract", "IC", address(0), 0) {
        nextTokenIdToMint_ = 1;
    }

    function createItem(
        string memory _name,
        uint256 _attack,
        uint256 _defense,
        uint256 _health,
        uint256 _mana,
        CharData.ItemType _itemType,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        numItems++;
        items[numItems] = Item(
            _name,
            _attack,
            _defense,
            _health,
            _mana,
            _itemType
        );

        mintTo(msg.sender, tokenId, _tokenURI, 1);

        // Emit the event
        emit NewItem(
            numItems,
            _name,
            _attack,
            _defense,
            _health,
            _mana,
            _itemType
        );
    }

    function mintItem(uint256 _itemId) public {
        require(_itemId <= numItems && _itemId != 0, "Item does not exist");
        uint256 tokenId = _itemId;
        _mint(msg.sender, tokenId, 1, "");
    }

    function getItem(uint256 _itemId) public view returns (Item memory) {
        return items[_itemId];
    }

    function updateItem(
        uint256 _itemId,
        string memory _name,
        uint256 _attack,
        uint256 _defense,
        uint256 _health,
        uint256 _mana
    ) public {
        require(_itemId <= numItems, "Item does not exist");
        items[_itemId].name = _name;
        items[_itemId].attack = _attack;
        items[_itemId].defense = _defense;
        items[_itemId].health = _health;
        items[_itemId].mana = _mana;
        // Emit the event
        emit UpdatedItem(_itemId, _name, _attack, _defense, _health, _mana);
    }

    function getItemType(
        uint256 tokenId
    ) public view returns (CharData.ItemType) {
        require(totalSupply[tokenId] > 0, "Invalid item token ID");
        return items[tokenId].itemType;
    }
}
