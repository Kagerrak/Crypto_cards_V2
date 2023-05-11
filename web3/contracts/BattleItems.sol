// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";

contract BattleItems is ERC1155Base {
    enum ItemType {
        Weapon,
        Headgear,
        BodyArmor,
        Pants,
        Footwear
    }

    struct Item {
        string name;
        uint256 attack;
        uint256 defense;
        uint256 health;
        uint256 mana;
        uint256 skill;
        ItemType itemType;
    }

    mapping(uint256 => Item) public items;
    uint256 public numItems;

    constructor() ERC1155Base("ItemContract", "IC", address(0), 0) {}

    function createItem(
        string memory _name,
        uint256 _attack,
        uint256 _defense,
        uint256 _health,
        uint256 _mana,
        uint256 _skill,
        ItemType _itemType,
        string memory _tokenURI
    ) public {
        uint256 tokenId = type(uint256).max; // pass type(uint256).max as the tokenId argument
        mintTo(msg.sender, tokenId, _tokenURI, 1);
        items[numItems] = Item(
            _name,
            _attack,
            _defense,
            _health,
            _mana,
            _skill,
            _itemType
        );
        numItems++;
    }

    function mintItem(uint256 _itemId) public {
        if (_itemId == 0) {
            require(numItems > 0, "Item does not exixt");
        }
        require(_itemId < numItems, "Item does not exist");
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
        uint256 _mana,
        uint256 _skill
    ) public {
        require(_itemId <= numItems, "Item does not exist");
        items[_itemId].name = _name;
        items[_itemId].attack = _attack;
        items[_itemId].defense = _defense;
        items[_itemId].health = _health;
        items[_itemId].mana = _mana;
        items[_itemId].skill = _skill;
    }

    function getItemType(uint256 tokenId) public view returns (ItemType) {
        require(totalSupply[tokenId] > 0, "Invalid item token ID");
        return items[tokenId].itemType;
    }

    function getRandomItem() public view returns (uint256) {
        return
            (uint256(keccak256(abi.encodePacked(block.timestamp))) % numItems) +
            1;
    }
}
