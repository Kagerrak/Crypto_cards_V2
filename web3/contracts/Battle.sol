// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import "./Character.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";
import "./StructsLibrary.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "./BattleHelper.sol";

contract Battle is Ownable, AutomationCompatibleInterface {
    function _canSetOwner() internal view virtual override returns (bool) {
        return true;
    }

    AggregatorV3Interface internal priceFeed;
    uint256 public feeCollected; // variable to track fee
    uint256 public leagueRewards; // variable to track league rewards
    uint256 public staminaCost = 10;

    mapping(uint256 => StructsLibrary.BattleData) public battles;
    uint256[] public activeBattlesId;
    mapping(uint256 => uint256) private battleIdToActiveIndex;

    mapping(address => uint256) public playerOngoingBattle;
    uint256 public battleCounter;

    mapping(address => uint256) public playerCredit; // mapping of player addresses to the number of player

    event BattleCreated(
        uint256 indexed battleId,
        address indexed creator,
        uint256 characterId
    );
    event NewBattle(
        string battleName,
        uint256 indexed battleId,
        address indexed player1,
        address indexed player2,
        uint256 characterId
    );
    event BattleCancelled(uint256 indexed battleId, address indexed player);

    event BattleEnded(
        string battleName,
        uint256 indexed battleId,
        address indexed winner,
        address indexed loser
    );
    event MoveSubmitted(
        uint256 indexed battleId,
        address indexed player,
        StructsLibrary.Move move,
        uint256 round
    );

    event BattleQuit(
        uint256 indexed battleId,
        uint256 round,
        address indexed quitter
    );

    modifier onlyParticipant(uint256 battleId) {
        address player0 = battles[battleId].players[0];
        address player1 = battles[battleId].players[1];

        require(
            msg.sender == player0 || msg.sender == player1,
            "Only participants"
        );
        _;
    }

    // Modifier to allow only the BattleHelper contract to execute certain functions
    modifier onlyBattleHelper() {
        require(
            msg.sender == address(battleHelper),
            "Only BattleHelper can call this function"
        );
        _;
    }

    Character private characterContract;
    BattleHelper private battleHelper;

    constructor(address _characterContractAddress) {
        _setupOwner(msg.sender);
        characterContract = Character(_characterContractAddress);
    }

    function setBattleHelperContractAddress(
        address _battleHelperContractAddress
    ) external onlyOwner {
        battleHelper = BattleHelper(_battleHelperContractAddress);
    }

    function createBattle(
        string memory _name,
        uint256 _characterTokenId
    ) external {
        require(
            characterContract.ownerOf(_characterTokenId) == msg.sender,
            "Not the owner of the character"
        );
        require(
            playerOngoingBattle[msg.sender] == 0,
            "Player in another battle"
        );

        uint256 battleId = battleCounter;

        StructsLibrary.BattleData memory newBattle = StructsLibrary.BattleData({
            battleId: battleCounter,
            name: _name,
            players: [msg.sender, address(0)],
            characterIds: [_characterTokenId, 0],
            moves: [uint256(0), uint256(0)],
            skillIndices: [uint256(0), uint256(0)],
            battleStatus: StructsLibrary.BattleStatus.PENDING,
            winner: address(0),
            battleStats: StructsLibrary.BattleStats({
                initialHealth: [uint256(0), uint256(0)],
                initialMana: [uint256(0), uint256(0)],
                totalDamageDealt: [uint256(0), uint256(0)],
                totalDamageTaken: [uint256(0), uint256(0)],
                damageReduced: [uint256(0), uint256(0)], // New field
                healthRegenerated: [uint256(0), uint256(0)], // New field
                manaRegenerated: [uint256(0), uint256(0)], // New field
                expReceived: [uint256(0), uint256(0)], // New field
                leagueBattlePointsEarned: [uint256(0), uint256(0)] // New field
            }),
            moveSubmitted: [false, false],
            round: 1,
            roundStartTime: block.timestamp
        });

        battles[battleId] = newBattle;
        activeBattlesId.push(battleId);
        battleIdToActiveIndex[battleId] = activeBattlesId.length - 1;
        playerOngoingBattle[msg.sender] = battleId;

        // Populate the CharacterProxy for player 1 using BattleHelper
        (uint256 health, uint256 mana) = battleHelper.createCharacterProxies(
            _characterTokenId,
            msg.sender,
            battleId
        );

        // Update the initial health and mana for player 1 in the battle
        battles[battleId].battleStats.initialHealth[0] = health;
        battles[battleId].battleStats.initialMana[0] = mana;

        // Consume stamina for player 1
        characterContract.consumeStamina(_characterTokenId, staminaCost);

        emit BattleCreated(battleId, msg.sender, _characterTokenId);
        battleCounter++;
    }

    function cancelBattle(uint256 _battleId) external {
        StructsLibrary.BattleData storage battle = battles[_battleId];

        require(
            battle.players[0] == msg.sender,
            "Only the creator can cancel the battle"
        );
        require(
            battle.battleStatus == StructsLibrary.BattleStatus.PENDING,
            "Cannot cancel a started battle"
        );

        battle.battleStatus = StructsLibrary.BattleStatus.ENDED;
        playerOngoingBattle[msg.sender] = 0;

        // Remove battle from the activeBattlesId array
        uint256 index = battleIdToActiveIndex[_battleId];
        uint256 lastIndex = activeBattlesId.length - 1;
        uint256 lastBattleId = activeBattlesId[lastIndex];

        activeBattlesId[index] = lastBattleId;
        battleIdToActiveIndex[lastBattleId] = index;
        activeBattlesId.pop();
        delete battleIdToActiveIndex[_battleId];

        // // Add credit score to player
        // playerCredit[msg.sender] += 1;

        emit BattleCancelled(_battleId, msg.sender);
    }

    function joinBattle(uint256 battleId, uint256 characterTokenId) external {
        require(
            characterContract.ownerOf(characterTokenId) == msg.sender,
            "Not the owner of the character"
        );
        require(
            playerOngoingBattle[msg.sender] == 0,
            "Player already participating in another battle"
        );

        StructsLibrary.BattleData storage battle = battles[battleId];
        require(
            battle.battleStatus == StructsLibrary.BattleStatus.PENDING,
            "Battle has already started"
        );
        require(
            battle.players[1] == address(0),
            "Battle already has two players"
        );

        battle.characterIds[1] = characterTokenId;
        battle.players[1] = msg.sender;
        battle.battleStatus = StructsLibrary.BattleStatus.STARTED;
        battle.roundStartTime = block.timestamp;

        playerOngoingBattle[msg.sender] = battleId;

        // Populate the CharacterProxy for player 2 using BattleHelper
        (uint256 health, uint256 mana) = battleHelper.createCharacterProxies(
            characterTokenId,
            msg.sender,
            battleId
        );

        // Update the initial health and mana for player 2 in the battle
        battle.battleStats.initialHealth[1] = health;
        battle.battleStats.initialMana[1] = mana;

        // Consume stamina for player 2
        characterContract.consumeStamina(characterTokenId, staminaCost);

        emit NewBattle(
            battle.name,
            battleId,
            battle.players[0],
            msg.sender,
            characterTokenId
        );
    }

    function submitMove(
        uint256 battleId,
        StructsLibrary.Move move,
        uint256 skillId
    ) external onlyParticipant(battleId) {
        StructsLibrary.BattleData storage battle = battles[battleId];
        require(
            battle.battleStatus == StructsLibrary.BattleStatus.STARTED,
            "Battle has not started or has already ended"
        );
        require(
            move == StructsLibrary.Move.ATTACK ||
                move == StructsLibrary.Move.DEFEND ||
                move == StructsLibrary.Move.USE_SKILL ||
                move == StructsLibrary.Move.DO_NOTHING,
            "Invalid move: must be ATTACK, DEFEND, USE_SKILL, or DO_NOTHING"
        );

        uint256 playerIndex = (msg.sender == battle.players[0]) ? 0 : 1;
        require(
            !battle.moveSubmitted[playerIndex],
            "Move already submitted by player"
        );

        // Fetch the player's CharacterProxy
        StructsLibrary.CharacterProxyView memory p = battleHelper
            .getCharacterProxy(battleId, msg.sender);

        // Emit the MoveSubmitted event first
        emit MoveSubmitted(battleId, msg.sender, move, battle.round);

        // Generate and store the attack multiplier only if the move is not DEFEND or DO_NOTHING
        if (
            move != StructsLibrary.Move.DEFEND &&
            move != StructsLibrary.Move.DO_NOTHING
        ) {
            battleHelper.generateAndSetAttackMultiplier(
                battleId,
                msg.sender,
                battle.round
            );
        }

        // Check if the submitted skill is equipped
        if (move == StructsLibrary.Move.USE_SKILL) {
            bool skillEquipped = false;
            for (uint256 i = 0; i < p.equippedSkills.length; i++) {
                if (p.equippedSkills[i] == skillId) {
                    skillEquipped = true;
                    break;
                }
            }
            require(skillEquipped, "Submitted skill is not equipped");
        }

        battle.moves[playerIndex] = uint256(move);
        battle.moveSubmitted[playerIndex] = true; // Set the flag

        // Update skillIndices array if the move is USE_SKILL
        if (move == StructsLibrary.Move.USE_SKILL) {
            battle.skillIndices[playerIndex] = skillId;
        }
        console.log("move submitted");
    }

    // Chainlink Keeper-compatible checkUpkeep function
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory activeBattles = getActiveBattlesId();
        uint256[] memory upkeepNeededFor = new uint256[](activeBattles.length);
        uint256 counter = 0;

        for (uint256 i = 0; i < activeBattles.length; i++) {
            uint256 battleId = activeBattles[i];
            StructsLibrary.BattleData storage battle = battles[battleId];
            if (
                battle.battleStatus == StructsLibrary.BattleStatus.STARTED &&
                ((battle.moveSubmitted[0] && battle.moveSubmitted[1]) ||
                    (block.timestamp >= battle.roundStartTime + 60)) // 60 seconds = 1 minute
            ) {
                upkeepNeededFor[counter] = battleId;
                counter++;
            }
        }

        uint256[] memory trimmedUpkeepNeededFor = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            trimmedUpkeepNeededFor[i] = upkeepNeededFor[i];
        }

        upkeepNeeded = counter > 0;
        performData = abi.encode(trimmedUpkeepNeededFor);
        return (upkeepNeeded, performData);
    }

    // Chainlink Keeper-compatible performUpkeep function
    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory battleIds = abi.decode(performData, (uint256[]));
        for (uint256 i = 0; i < battleIds.length; i++) {
            uint256 battleId = battleIds[i];
            StructsLibrary.BattleData storage battle = battles[battleId];
            if (
                battle.battleStatus == StructsLibrary.BattleStatus.STARTED &&
                ((battle.moveSubmitted[0] && battle.moveSubmitted[1]) ||
                    (block.timestamp >= battle.roundStartTime + 60)) // 60 seconds = 1 minute
            ) {
                // Logic to resolve the battle round
                battleHelper.resolveRound(battleId);

                // Reset the timer for the next round
                battle.roundStartTime = block.timestamp;
            }
        }
    }

    function _generateAttackMultiplier() private view returns (uint256) {
        uint256 randomNumber = (uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)
            )
        ) % 20) + 1;
        return 1000 + randomNumber * 100;
    }

    function endBattle(
        uint256 _battleId,
        address _winner
    ) public onlyBattleHelper {
        _endBattle(_battleId, _winner);
    }

    function _endBattle(uint256 _battleId, address _winner) internal {
        StructsLibrary.BattleData storage battle = battles[_battleId];

        // Only set these if they have not been set yet.
        if (battle.battleStatus != StructsLibrary.BattleStatus.ENDED) {
            battle.winner = _winner;
            battle.battleStatus = StructsLibrary.BattleStatus.ENDED;
        }

        // Additional code to update mappings or perform other tasks
        _updateBattleIdMapping(_battleId);

        // Update the playerOngoingBattle mapping for both players
        address player1 = battle.players[0];
        address player2 = battle.players[1];
        playerOngoingBattle[player1] = 0;
        playerOngoingBattle[player2] = 0;

        // Determine the loser
        address _loser = (_winner == player1) ? player2 : player1;
        uint256 winnerIndex = (_winner == player1) ? 0 : 1;
        uint256 loserIndex = (_loser == player1) ? 0 : 1;

        // Optional: Consume used mana or perform other tasks
        // _consumeUsedMana(_battleId, battle, winnerIndex, loserIndex);

        // Get CharacterProxy data for each player
        StructsLibrary.CharacterProxyView memory player1Proxy = battleHelper
            .getCharacterProxy(_battleId, player1);
        StructsLibrary.CharacterProxyView memory player2Proxy = battleHelper
            .getCharacterProxy(_battleId, player2);

        // Check if the health of one of the players is 0, indicating the battle was fought
        uint256 player1Health = player1Proxy.health;
        uint256 player2Health = player2Proxy.health;
        bool battleFought = (player1Health == 0) || (player2Health == 0);

        // If the battle was fought, grant experience points
        if (battleFought) {
            characterContract.gainXP(battle.characterIds[winnerIndex], 100);
            characterContract.gainXP(battle.characterIds[loserIndex], 30);

            // Update expReceived field in battleStats
            battle.battleStats.expReceived[winnerIndex] = 100;
            battle.battleStats.expReceived[loserIndex] = 30;
        }

        // Emit the BattleEnded event
        emit BattleEnded(battle.name, _battleId, _winner, _loser);
    }

    function quitBattle(uint256 _battleId) public {
        require(
            battles[_battleId].players[0] != address(0),
            "Battle not found!"
        );

        StructsLibrary.BattleData memory _battle = battles[_battleId];
        require(
            _battle.players[0] == msg.sender ||
                _battle.players[1] == msg.sender,
            "You are not in this battle!"
        );

        emit BattleQuit(_battleId, _battle.round, msg.sender);

        _battle.players[0] == msg.sender
            ? _endBattle(_battleId, _battle.players[1])
            : _endBattle(_battleId, _battle.players[0]);
    }

    function _updateBattleIdMapping(uint256 _battleId) internal {
        uint256 index = battleIdToActiveIndex[_battleId];
        uint256 lastIndex = activeBattlesId.length - 1;
        uint256 lastBattleId = activeBattlesId[lastIndex];

        activeBattlesId[index] = lastBattleId;
        battleIdToActiveIndex[lastBattleId] = index;
        activeBattlesId.pop();
        delete battleIdToActiveIndex[_battleId];
    }

    function _consumeUsedMana(
        uint256 _battleId,
        StructsLibrary.BattleData storage battle,
        uint256 winnerIndex,
        uint256 loserIndex
    ) internal {
        // Calculate used mana for each player's character
        address winner = battle.players[winnerIndex];
        address loser = battle.players[loserIndex];

        uint256 usedManaWinner = battle.battleStats.initialMana[winnerIndex] -
            battleHelper.getCharacterProxy(_battleId, winner).mana;
        uint256 usedManaLoser = battle.battleStats.initialMana[loserIndex] -
            battleHelper.getCharacterProxy(_battleId, loser).mana;

        // Consume used mana for each player's character
        characterContract.consumeMana(
            battle.characterIds[winnerIndex],
            usedManaWinner
        );
        characterContract.consumeMana(
            battle.characterIds[loserIndex],
            usedManaLoser
        );
    }

    // Setter for moveSubmitted field in BattleData
    function setMoveSubmitted(
        uint256 battleId,
        uint256 playerIndex,
        bool value
    ) external onlyBattleHelper {
        battles[battleId].moveSubmitted[playerIndex] = value;
    }

    function getBattle(
        uint256 _battleId
    ) external view returns (StructsLibrary.BattleData memory) {
        return battles[_battleId];
    }

    // TO DO ADD AUTH LOGIC
    function setBattleData(
        uint256 battleId,
        StructsLibrary.BattleData calldata data
    ) external onlyBattleHelper {
        // Authorization checks or other logic
        battles[battleId] = data;
    }

    function getActiveBattlesId() public view returns (uint256[] memory) {
        return activeBattlesId;
    }

    function getActiveBattlesCount() external view returns (uint256) {
        return activeBattlesId.length;
    }

    function getBattleParticipants(
        uint256 battleId
    ) external view returns (address[2] memory) {
        return battles[battleId].players;
    }

    function getBattleMoves(
        uint256 battleId
    ) external view returns (uint256[2] memory) {
        StructsLibrary.BattleData storage battle = battles[battleId];
        return [battle.moves[0], battle.moves[1]];
    }

    // function getCharacterHealth(
    //     uint256 battleId,
    //     address player
    // ) public view returns (uint256) {
    //     return
    //         characterProxies[keccak256(abi.encodePacked(battleId, player))][
    //             player
    //         ].stats.health;
    // }

    function updateStaminaCost(uint256 newCost) external onlyOwner {
        staminaCost = newCost;
    }

    function battleFee() public view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        uint256 price = uint256(answer * 10000000000); // convert int256 value to uint256
        uint256 usdAmount = 0.05 * 10 ** 18; // convert 0.05 USD to wei
        return uint256((usdAmount * (10 ** 18)) / price); // convert wei to ether
    }

    function storeStamina(uint256 _tokenId1, uint256 _tokenId2) public {
        characterContract.restoreStaminaToFull(_tokenId1);
        characterContract.restoreStaminaToFull(_tokenId2);
    }

    fallback() external payable {}

    receive() external payable {}
}
