// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";

contract Boss is ERC721Base {
    struct BossCharacterStruct {
        uint256 tokenId;
        uint256 level;
        uint256 health;
        uint256 attack;
        uint256 bossSkill;
    }

    function _initializeBossCharacters() private {
        initialBossCharacter.push(BossCharacterStruct(0, 10, 5000, 2000, 1000));
    }

    uint256 public numBossCharacters = 0;
    BossCharacterStruct[] public initialBossCharacter;
    mapping(uint256 => BossCharacterStruct) public bossCharacters;

    constructor() ERC721Base("BossCharacter", "BNFT", msg.sender, 0) {
        _initializeBossCharacters();
    }

    function getBossCharacter(uint256 _tokenId)
        public
        view
        returns (BossCharacterStruct memory)
    {
        return bossCharacters[_tokenId];
    }

    function getBossCharacterLevel(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        BossCharacterStruct storage boss = bossCharacters[tokenId];
        return boss.level;
    }

    function getBossCharacterAttack(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        BossCharacterStruct storage boss = bossCharacters[tokenId];
        return boss.attack;
    }

    function getBossCharacterHealth(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        BossCharacterStruct storage boss = bossCharacters[tokenId];
        return boss.health;
    }

    function getBossCharacterSkill(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        BossCharacterStruct storage boss = bossCharacters[tokenId];
        return boss.bossSkill;
    }

    function newBossCharacter() public {
        BossCharacterStruct memory newBossChar = initialBossCharacter[0];
        uint256 tokenId = numBossCharacters;
        _mint(msg.sender, tokenId);
        _setTokenURI(
            tokenId,
            "ipfs://QmUyWmpry8Sri9BmsHSQMDBPtnPZkoX6GS7w8ZizpnFX7v"
        );
        bossCharacters[tokenId] = newBossChar;
        numBossCharacters++;
    }
}
