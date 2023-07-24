// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./CharData.sol";

interface IBattleItems {
    struct Item {
        string name;
        uint256 attack;
        uint256 defense;
        uint256 health;
        uint256 mana;
        CharData.ItemType itemType;
    }

    function getItem(uint256 _itemId) external view returns (Item memory);

    function createItem(
        string memory _name,
        uint256 _attack,
        uint256 _defense,
        uint256 _health,
        uint256 _mana,
        CharData.ItemType _itemType,
        string memory _tokenURI
    ) external;

    function mintItem(uint256 _itemId) external;

    function updateItem(
        uint256 _itemId,
        string memory _name,
        uint256 _attack,
        uint256 _defense,
        uint256 _health,
        uint256 _mana
    ) external;

    function getItemType(
        uint256 tokenId
    ) external view returns (CharData.ItemType);

    function getRandomItem() external view returns (uint256);

    function totalSupply(uint256 tokenId) external view returns (uint256);

    function balanceOf(
        address account,
        uint256 id
    ) external view returns (uint256);

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    function setApprovalForAll(address operator, bool approved) external;
}
