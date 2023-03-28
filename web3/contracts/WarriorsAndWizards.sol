// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/// @title WarriorsAndWizards
/// @notice This contract handles the token management and battle logic for the Warriors And Wizards game
/// @notice Version 1.0.0
/// @author EbisuDigital

contract WarriorsAndWizards is ERC1155, Ownable, ERC1155Supply {
    AggregatorV3Interface internal priceFeed;
    string public baseURI; // baseURI where token metadata is stored
    uint256 public totalSupply; // Total number of tokens minted

    uint256 public constant MODULO = 10;

    uint256 public feeCollected; // variable to track fee
    uint256 public leagueRewards; // variable to track league rewards
    mapping(address => uint256) public playerCredit; // mapping of player addresses to the number of player

    enum BattleStatus {
        PENDING,
        STARTED,
        ENDED
    }

    /// @dev GameToken struct to store player token info
    struct GameToken {
        string name; /// @param name battle card name; set by player
        uint256 id; /// @param id battle card token id; will be randomly generated
        uint256 attackStrength; /// @param attackStrength battle card attack; generated randomly
        uint256 defenseStrength; /// @param defenseStrength battle card defense; generated randomly
    }

    /// @dev GameCharacter struct to store game character info
    struct GameCharacter {
        uint256 tokenId; /// @param tokenId
        uint256 health; /// @param health awarded health points on mint token; set by admin
        uint256 mana; /// @param mana awarded mana points on mint token; set by admin
        uint256 attack; /// @param attack awarded attack points on mint token; set by admin
        uint256 defense; /// @param defense awarded defense attack points on mint token; set by admin
        uint256 fees; /// @param fees amount require to mint token; set by admin
        uint256 level; /// @param level token used at game level; set by admin
    }

    /// @dev Player struct to store player info
    struct Player {
        address playerAddress; /// @param playerAddress player wallet address
        string playerName; /// @param playerName player name; set by player during registration
        uint256 playerMana; /// @param playerMana player mana; affected by battle results
        uint256 playerHealth; /// @param playerHealth player health; affected by battle results
        bool inBattle; /// @param inBattle boolean to indicate if a player is in battle
    }

    /// @dev Battle struct to store battle info
    struct Battle {
        BattleStatus battleStatus; /// @param battleStatus enum to indicate battle status
        bytes32 battleHash; /// @param battleHash a hash of the battle name
        string name; /// @param name battle name; set by player who creates battle
        address[2] players; /// @param players address array representing players in this battle
        uint8[2] moves; /// @param moves uint array representing players' move
        address winner; /// @param winner winner address
    }

    mapping(address => uint256) public playerInfo; // Mapping of player addresses to player index in the players array
    mapping(address => uint256[]) public nftOwners; // Mapping of player addresses to player index in the players array
    mapping(address => uint256) public playerTokenInfo; // Mapping of player addresses to player token index in the gameTokens array
    mapping(string => uint256) public battleInfo; // Mapping of battle name to battle index in the battles array

    Player[] public players; // Array of players
    GameToken[] public gameTokens; // Array of game tokens
    GameCharacter[] public gameCharacters; // Array of game characters
    Battle[] public battles; // Array of battles

    function isPlayer(address addr) public view returns (bool) {
        if (playerInfo[addr] == 0) {
            return false;
        } else {
            return true;
        }
    }

    function getPlayer(address addr) public view returns (Player memory) {
        require(isPlayer(addr), "Player doesn't exist!");
        return players[playerInfo[addr]];
    }

    function getAllPlayers() public view returns (Player[] memory) {
        return players;
    }

    function isPlayerToken(address addr) public view returns (bool) {
        if (playerTokenInfo[addr] == 0) {
            return false;
        } else {
            return true;
        }
    }

    function getPlayerToken(address addr)
        public
        view
        returns (GameToken memory)
    {
        require(isPlayerToken(addr), "Game token doesn't exist!");
        return gameTokens[playerTokenInfo[addr]];
    }

    function getAllPlayerTokens() public view returns (GameToken[] memory) {
        return gameTokens;
    }

    function getAllCharacters() public view returns (GameCharacter[] memory) {
        return gameCharacters;
    }

    // Battle getter function
    function isBattle(string memory _name) public view returns (bool) {
        if (battleInfo[_name] == 0) {
            return false;
        } else {
            return true;
        }
    }

    function getBattle(string memory _name)
        public
        view
        returns (Battle memory)
    {
        require(isBattle(_name), "Battle doesn't exist!");
        return battles[battleInfo[_name]];
    }

    function getAllBattles() public view returns (Battle[] memory) {
        return battles;
    }

    function updateBattle(string memory _name, Battle memory _newBattle)
        private
    {
        require(isBattle(_name), "Battle doesn't exist");
        battles[battleInfo[_name]] = _newBattle;
    }

    // Events
    event NewPlayer(address indexed owner, string name);
    event NewBattle(
        string battleName,
        address indexed player1,
        address indexed player2
    );
    event BattleEnded(
        string battleName,
        address indexed winner,
        address indexed loser
    );
    event BattleMove(string indexed battleName, bool indexed isFirstMove);
    event NewGameToken(
        address indexed owner,
        uint256 id,
        uint256 attackStrength,
        uint256 defenseStrength
    );
    event NewCharacterMinted(
        address indexed owner,
        uint256 id,
        uint256 attackStrength,
        uint256 defenseStrength
    );
    event RoundEnded(address[2] damagedPlayers);
    event CharacterUpgraded(
        address indexed owner,
        uint256 tokenId,
        uint256 attack,
        uint256 defense,
        uint256 level
    );

    /// @dev Initializes the contract by setting a `metadataURI` to the token collection
    /// @param _metadataURI baseURI where token metadata is stored
    constructor(string memory _metadataURI) ERC1155(_metadataURI) {
        baseURI = _metadataURI; // Set baseURI
        priceFeed = AggregatorV3Interface(
            // fuji testnet
            // 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD
            // localhost
            0x5FbDB2315678afecb367f032d93F642f64180aa3
        );
        initialize();
        _initializeCharacters();
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function initialize() private {
        gameTokens.push(GameToken("", 0, 0, 0));
        players.push(Player(address(0), "", 0, 0, false));
        battles.push(
            Battle(
                BattleStatus.PENDING,
                bytes32(0),
                "",
                [address(0), address(0)],
                [0, 0],
                address(0)
            )
        );
    }

    function _initializeCharacters() private {
        gameCharacters.push(
            GameCharacter(1, 100, 50, 19, 15, 500000000000000000, 0)
        ); // DEVIL
        gameCharacters.push(
            GameCharacter(2, 100, 50, 17, 15, 500000000000000000, 0)
        ); // GRIFFIN
        gameCharacters.push(
            GameCharacter(3, 100, 50, 20, 14, 1000000000000000000, 0)
        ); // Wizard
        gameCharacters.push(
            GameCharacter(4, 100, 50, 25, 20, 1000000000000000000, 0)
        ); // Warrior
    }

    function addCharacter(GameCharacter calldata _character) public onlyOwner {
        uint256 tokenId = gameCharacters.length + 1;
        gameCharacters.push(
            GameCharacter(
                tokenId,
                _character.health,
                _character.mana,
                _character.attack,
                _character.defense,
                _character.fees,
                _character.level
            )
        );
    }

    function updateCharacter(GameCharacter calldata _character)
        public
        onlyOwner
    {
        uint256 tokenId = _character.tokenId - 1;
        gameCharacters[tokenId].health = _character.health;
        gameCharacters[tokenId].mana = _character.mana;
        gameCharacters[tokenId].attack = _character.attack;
        gameCharacters[tokenId].defense = _character.defense;
        gameCharacters[tokenId].fees = _character.fees; // wei
        gameCharacters[tokenId].level = _character.level;
    }

    function switchCharacter(uint256 _tokenId) public {
        require(isPlayerToken(msg.sender), "Game token doesn't exist!");
        require(balanceOf(msg.sender, _tokenId) > 0, "Character not minted.");
        gameTokens[playerTokenInfo[msg.sender]].id = _tokenId;
        gameTokens[playerTokenInfo[msg.sender]].attackStrength = gameCharacters[
            _tokenId - 1
        ].attack;
        gameTokens[playerTokenInfo[msg.sender]]
            .defenseStrength = gameCharacters[_tokenId - 1].defense;
        // players[playerInfo[msg.sender]].playerMana=gameCharacters[_tokenId].mana;
        // players[playerInfo[msg.sender]].playerHealth=gameCharacters[_tokenId].health;
        emit CharacterUpgraded(
            msg.sender,
            _tokenId,
            gameCharacters[_tokenId - 1].attack,
            gameCharacters[_tokenId - 1].defense,
            gameCharacters[_tokenId - 1].level
        ); // Emits Character Upgraded event
    }

    function mintCharacter(uint256 _tokenId) public payable {
        require(_tokenId <= gameCharacters.length, "Invalid tokenId.");
        require(isPlayer(msg.sender), "Please Register Player First"); // Require that the player is registered
        require(msg.value >= currentFee(_tokenId), "Token fee not matched");
        require(
            balanceOf(msg.sender, _tokenId) == 0,
            "Character already minted."
        );
        _mint(msg.sender, _tokenId, 1, "0x0");
        nftOwners[msg.sender].push(_tokenId);
        totalSupply++;
        uint256 attack = gameCharacters[_tokenId - 1].attack;
        uint256 defense = gameCharacters[_tokenId - 1].defense;
        emit NewCharacterMinted(msg.sender, _tokenId, attack, defense);
    }

    function levelCharacters(uint256 _level)
        public
        view
        returns (GameCharacter[] memory)
    {
        uint256 resultCount;
        for (uint256 i = 0; i < gameCharacters.length; i++) {
            if (gameCharacters[i].level == _level) {
                resultCount++;
            }
        }

        GameCharacter[] memory _levelCharacters = new GameCharacter[](
            resultCount
        ); // step 2 - create the fixed-length array
        uint256 j;

        for (uint256 i = 0; i < gameCharacters.length; i++) {
            if (gameCharacters[i].level == _level) {
                _levelCharacters[j] = gameCharacters[i]; // step 3 - fill the array
                j++;
            }
        }

        return _levelCharacters;
    }

    /// @dev Registers a player
    /// @param _name player name; set by player
    function registerPlayer(string memory _name, string memory _gameTokenName)
        external
    {
        require(!isPlayer(msg.sender), "Player already registered"); // Require that player is not already registered

        uint256 _id = players.length;

        GameCharacter[] memory _characters = levelCharacters(0);

        players.push(
            Player(
                msg.sender,
                _name,
                _characters[0].mana,
                _characters[0].health,
                false
            )
        ); // Adds player to players array

        playerInfo[msg.sender] = _id; // Creates player info mapping

        createRandomGameToken(_gameTokenName);

        emit NewPlayer(msg.sender, _name); // Emits NewPlayer event
    }

    /// @dev internal function to generate random number; used for Battle Card Attack and Defense Strength
    function _createRandomNum(uint256 _max, address _sender)
        internal
        view
        returns (uint256 randomValue)
    {
        uint256 randomNum = uint256(
            keccak256(
                abi.encodePacked(block.difficulty, block.timestamp, _sender)
            )
        );

        randomValue = randomNum % _max;
        if (randomValue == 0) {
            randomValue = _max / 2;
        }

        return randomValue;
    }

    /// @dev internal function to create a new Battle Card
    function _createGameToken(string memory _name)
        internal
        returns (GameToken memory)
    {
        GameCharacter[] memory _characters = levelCharacters(0);

        uint8 randIndex = uint8(
            uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) %
                100
        );
        randIndex = randIndex % uint8(_characters.length - 1);

        uint256 tokenId = _characters[randIndex].tokenId;
        uint256 attack = _characters[randIndex].attack;
        uint256 defense = _characters[randIndex].defense;

        GameToken memory newGameToken = GameToken(
            _name,
            tokenId,
            attack,
            defense
        );

        uint256 _id = gameTokens.length;
        gameTokens.push(newGameToken);
        playerTokenInfo[msg.sender] = _id;
        _mint(msg.sender, tokenId, 1, "0x0");
        totalSupply++;

        emit NewGameToken(msg.sender, tokenId, attack, defense);
        return newGameToken;
    }

    /// @dev Creates a new game token
    /// @param _name game token name; set by player
    function createRandomGameToken(string memory _name) public {
        require(!getPlayer(msg.sender).inBattle, "Player is in a battle"); // Require that player is not already in a battle
        require(isPlayer(msg.sender), "Please Register Player First"); // Require that the player is registered

        _createGameToken(_name); // Creates game token
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }

    /// @dev Creates a new battle
    /// @param _name battle name; set by player
    function createBattle(string memory _name)
        external
        payable
        returns (Battle memory)
    {
        require(isPlayer(msg.sender), "Please Register Player First"); // Require that the player is registered
        require(!isBattle(_name), "Battle already exists!"); // Require battle with same name should not exist
        bytes32 battleHash = keccak256(abi.encode(_name));

        Battle memory _battle = Battle(
            BattleStatus.PENDING, // Battle pending
            battleHash, // Battle hash
            _name, // Battle name
            [msg.sender, address(0)], // player addresses; player 2 empty until they joins battle
            [0, 0], // moves for each player
            address(0) // winner address; empty until battle ends
        );

        uint256 _id = battles.length;
        battleInfo[_name] = _id;
        battles.push(_battle);

        // Check if the player has credit
        if (playerCredit[msg.sender] > 0) {
            // Deduct credit from the player
            playerCredit[msg.sender] -= 1;
            return _battle;
        } else {
            // Collect battle fee
            require(msg.value >= battleFee(), "Battle fee not covered");
            // Collect 50% of the fee for the league rewards
            leagueRewards += msg.value / 2;
            // Collect 50% of the fee for the feeCollector
            feeCollected += msg.value / 2;
            return _battle;
        }
    }

    /**
     * @dev Allows player who created the battle to quit the battle and revert all changes made during the battle creation process
     * @param _name battle name
     */
    function cancelBattle(string memory _name) external {
        require(isPlayer(msg.sender), "Please Register Player First");
        require(isBattle(_name), "Battle does not exist!");
        require(
            battles[battleInfo[_name]].players[0] == msg.sender,
            "Sender is not a player in the battle"
        );

        uint256 battleIndex = battleInfo[_name];

        // Revert battle creation
        delete battleInfo[_name];

        // Remove the battle from the battles array
        delete battles[battleIndex];
        battles[battleIndex] = battles[battles.length - 1];
        battleInfo[battles[battleIndex].name] = battleIndex;
        battles.pop();

        // Add credit score to player
        playerCredit[msg.sender] += 1;
    }

    /// @dev Player joins battle
    /// @param _name battle name; name of battle player wants to join
    function joinBattle(string memory _name)
        external
        payable
        returns (Battle memory)
    {
        Battle memory _battle = getBattle(_name);
        require(msg.value >= battleFee(), "Battle fee not covered");
        require(
            _battle.battleStatus == BattleStatus.PENDING,
            "Battle already started!"
        ); // Require that battle has not started
        require(
            _battle.players[0] != msg.sender,
            "Only player two can join a battle"
        ); // Require that player 2 is joining the battle
        require(!getPlayer(msg.sender).inBattle, "Already in battle"); // Require that player is not already in a battle

        _battle.battleStatus = BattleStatus.STARTED;
        _battle.players[1] = msg.sender;
        updateBattle(_name, _battle);

        players[playerInfo[_battle.players[0]]].inBattle = true;
        players[playerInfo[_battle.players[1]]].inBattle = true;

        // Collect 50% of the fee for the league rewards
        leagueRewards += msg.value / 2;
        // Collect 50% of the fee for the feeCollector
        feeCollected += msg.value / 2;

        emit NewBattle(_battle.name, _battle.players[0], msg.sender); // Emits NewBattle event
        return _battle;
    }

    // Read battle move info for player 1 and player 2
    function getBattleMoves(string memory _battleName)
        public
        view
        returns (uint256 P1Move, uint256 P2Move)
    {
        Battle memory _battle = getBattle(_battleName);

        P1Move = _battle.moves[0];
        P2Move = _battle.moves[1];

        return (P1Move, P2Move);
    }

    function _registerPlayerMove(
        uint256 _player,
        uint8 _choice,
        string memory _battleName
    ) internal {
        require(
            _choice == 1 || _choice == 2,
            "Choice should be either 1 or 2!"
        );
        require(
            _choice == 1 ? getPlayer(msg.sender).playerMana >= 3 : true,
            "Mana not sufficient for attacking!"
        );
        battles[battleInfo[_battleName]].moves[_player] = _choice;
    }

    // User chooses attack or defense move for battle card
    function attackOrDefendChoice(uint8 _choice, string memory _battleName)
        external
    {
        Battle memory _battle = getBattle(_battleName);

        require(
            _battle.battleStatus == BattleStatus.STARTED,
            "Battle not started. Please tell another player to join the battle"
        ); // Require that battle has started
        require(
            _battle.battleStatus != BattleStatus.ENDED,
            "Battle has already ended"
        ); // Require that battle has not ended
        require(
            msg.sender == _battle.players[0] ||
                msg.sender == _battle.players[1],
            "You are not in this battle"
        ); // Require that player is in the battle

        require(
            _battle.moves[_battle.players[0] == msg.sender ? 0 : 1] == 0,
            "You have already made a move!"
        );

        _registerPlayerMove(
            _battle.players[0] == msg.sender ? 0 : 1,
            _choice,
            _battleName
        );

        _battle = getBattle(_battleName);
        uint256 _movesLeft = 2 -
            (_battle.moves[0] == 0 ? 0 : 1) -
            (_battle.moves[1] == 0 ? 0 : 1);
        emit BattleMove(_battleName, _movesLeft == 1 ? true : false);

        if (_movesLeft == 0) {
            _awaitBattleResults(_battleName);
        }
    }

    // Awaits battle results
    function _awaitBattleResults(string memory _battleName) internal {
        Battle memory _battle = getBattle(_battleName);

        require(
            msg.sender == _battle.players[0] ||
                msg.sender == _battle.players[1],
            "Only players in this battle can make a move"
        );

        require(
            _battle.moves[0] != 0 && _battle.moves[1] != 0,
            "Players still need to make a move"
        );

        _resolveBattle(_battle);
    }

    struct P {
        uint256 index;
        uint256 move;
        uint256 health;
        uint256 attack;
        uint256 defense;
    }

    /// @dev Resolve battle function to determine winner and loser of battle
    /// @param _battle battle; battle to resolve
    function _resolveBattle(Battle memory _battle) internal {
        P memory p1 = P(
            playerInfo[_battle.players[0]],
            _battle.moves[0],
            getPlayer(_battle.players[0]).playerHealth,
            getPlayerToken(_battle.players[0]).attackStrength,
            getPlayerToken(_battle.players[0]).defenseStrength
        );

        P memory p2 = P(
            playerInfo[_battle.players[1]],
            _battle.moves[1],
            getPlayer(_battle.players[1]).playerHealth,
            getPlayerToken(_battle.players[1]).attackStrength,
            getPlayerToken(_battle.players[1]).defenseStrength
        );

        address[2] memory _damagedPlayers = [address(0), address(0)];

        if (p1.move == 1 && p2.move == 1) {
            uint256 attack1 = (p1.attack / MODULO) *
                ((uint256(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            _battle.players[0]
                        )
                    )
                ) % 20) + 1);
            uint256 attack2 = (p2.attack / MODULO) *
                ((uint256(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            _battle.players[1]
                        )
                    )
                ) % 20) + 1);

            uint256 damage1 = attack2;
            uint256 damage2 = attack1;

            if (p1.health <= damage1) {
                _endBattle(_battle.players[0], _battle);
            } else if (p2.health <= damage2) {
                _endBattle(_battle.players[1], _battle);
            } else {
                players[p1.index].playerHealth -= damage1;
                players[p2.index].playerHealth -= damage2;

                players[p1.index].playerMana -= 3;
                players[p2.index].playerMana -= 3;

                // Both player's health damaged
                _damagedPlayers = _battle.players;
            }
        } else if (p1.move == 1 && p2.move == 2) {
            uint256 attack1 = (p2.attack / MODULO) *
                ((uint256(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            _battle.players[0]
                        )
                    )
                ) % 20) + 1);
            uint256 defense2 = (p2.defense / MODULO) *
                ((uint256(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            _battle.players[1]
                        )
                    )
                ) % 20) + 1);

            uint256 p2DefenseHealth = p2.health + defense2;

            if (p2DefenseHealth <= attack1) {
                _endBattle(_battle.players[0], _battle);
            } else {
                uint256 healthAfterAttack;

                if (p2DefenseHealth >= attack1) {
                    healthAfterAttack = p2.health;
                } else {
                    healthAfterAttack = p2DefenseHealth - attack1;

                    // Player 2 health damaged
                    _damagedPlayers[0] = _battle.players[1];
                }
                players[p2.index].playerHealth = healthAfterAttack;

                players[p1.index].playerMana -= 3;
                players[p2.index].playerMana += 3;
            }
        } else if (p1.move == 2 && p2.move == 1) {
            uint256 attack2 = (p2.attack / MODULO) *
                ((uint256(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            _battle.players[1]
                        )
                    )
                ) % 20) + 1);
            uint256 defense1 = (p1.defense / MODULO) *
                ((uint256(
                    keccak256(
                        abi.encodePacked(
                            block.difficulty,
                            block.timestamp,
                            _battle.players[0]
                        )
                    )
                ) % 20) + 1);

            uint256 p1DefenseHealth = p2.health + defense1;
            if (p1DefenseHealth <= attack2) {
                _endBattle(_battle.players[1], _battle);
            } else {
                uint256 healthAfterAttack;

                if (p1DefenseHealth >= attack2) {
                    healthAfterAttack = p1.health;
                } else {
                    healthAfterAttack = p1DefenseHealth - attack2;

                    // Player 1 health damaged
                    _damagedPlayers[0] = _battle.players[0];
                }
                players[p1.index].playerHealth = healthAfterAttack;

                players[p1.index].playerMana += 3;
                players[p2.index].playerMana -= 3;
            }
        } else if (p1.move == 2 && p2.move == 2) {
            players[p1.index].playerMana += 3;
            players[p2.index].playerMana += 3;
        }

        emit RoundEnded(_damagedPlayers);

        // Reset moves to 0
        _battle.moves[0] = 0;
        _battle.moves[1] = 0;
        updateBattle(_battle.name, _battle);
    }

    function quitBattle(string memory _battleName) public {
        Battle memory _battle = getBattle(_battleName);
        require(
            _battle.players[0] == msg.sender ||
                _battle.players[1] == msg.sender,
            "You are not in this battle!"
        );

        _battle.players[0] == msg.sender
            ? _endBattle(_battle.players[1], _battle)
            : _endBattle(_battle.players[0], _battle);
    }

    /// @dev internal function to end the battle
    /// @param battleEnder winner address
    /// @param _battle battle; taken from attackOrDefend function
    function _endBattle(address battleEnder, Battle memory _battle)
        internal
        returns (Battle memory)
    {
        require(
            _battle.battleStatus != BattleStatus.ENDED,
            "Battle already ended"
        ); // Require that battle has not ended

        _battle.battleStatus = BattleStatus.ENDED;
        _battle.winner = battleEnder;
        updateBattle(_battle.name, _battle);

        uint256 p1 = playerInfo[_battle.players[0]];
        uint256 p2 = playerInfo[_battle.players[1]];

        players[p1].inBattle = false;
        players[p1].playerHealth = 25;
        players[p1].playerMana = 10;

        players[p2].inBattle = false;
        players[p2].playerHealth = 25;
        players[p2].playerMana = 10;

        address _battleLoser = battleEnder == _battle.players[0]
            ? _battle.players[1]
            : _battle.players[0];

        emit BattleEnded(_battle.name, battleEnder, _battleLoser); // Emits BattleEnded event

        return _battle;
    }

    // Turns uint256 into string
    function uintToStr(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Token URI getter function
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return
            string(abi.encodePacked(baseURI, "/", uintToStr(tokenId), ".json"));
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    fallback() external payable {}

    receive() external payable {}

    /**
     * @notice get avax price in USD from chainlink
     * @return price int256 Price with 8 decimals.
     */
    function _getAvaxPrice() internal view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price);
    }

    /**
     * @notice Get current fee for battle.
     * @dev Current Fee is calculated with the current value of Avax in USD given by ChainLink.
     * @return price uint256 Fee value
     */
    function currentFee(uint256 tokenId) public view returns (uint256 price) {
        uint256 current = _getAvaxPrice();
        price = gameCharacters[tokenId - 1].fees;
        price = uint256((price * 10**8) / (current));
    }

    /**
     * @notice Get fee for battle.
     * @dev Battle Fee is calculated with the current value of Avax in USD given by ChainLink.
     * @return price uint256 Fee value
     */
    function battleFee() public view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        uint256 price = uint256(answer * 10000000000); // convert int256 value to uint256
        uint256 usdAmount = 0.05 * 10**18; // convert 0.05 USD to wei
        return uint256((usdAmount * (10**18)) / price); // convert wei to ether
    }

    // Withdraw collected fees
    function withdrawFee() public {
        require(msg.sender == owner(), "Only owner can withdraw fees");
        require(feeCollected > 0, "No fees to withdraw");
        (bool sent, ) = owner().call{value: feeCollected}("");
        require(sent, "Failed to send Ether");
        feeCollected = 0;
    }

    function distributeLeagueRewards(
        address payable _winner,
        address payable _top2,
        address payable _top3
    ) internal {
        require(isPlayer(_winner), "The winner is not a registered player");
        require(isPlayer(_top2), "The top 2 is not a registered player");
        require(isPlayer(_top3), "The top 3 is not a registered player");

        // Distribute league rewards
        uint256 top1Percent = (leagueRewards * 60) / 100;
        uint256 top2Percent = (leagueRewards * 30) / 100;
        uint256 top3Percent = (leagueRewards * 10) / 100;

        _winner.transfer(top1Percent);
        _top2.transfer(top2Percent);
        _top3.transfer(top3Percent);

        leagueRewards = 0;
    }
}
