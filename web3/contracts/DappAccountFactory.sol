// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

// Utils
import "./BaseAccountFactory.sol";
import "@thirdweb-dev/contracts/smart-wallet/utils/BaseAccount.sol";
import "@thirdweb-dev/contracts/openzeppelin-presets/proxy/Clones.sol";

// Extensions
import "@thirdweb-dev/contracts/dynamic-contracts/extension/PermissionsEnumerable.sol";
import "@thirdweb-dev/contracts/dynamic-contracts/extension/ContractMetadata.sol";

// Interface
import "@thirdweb-dev/contracts/smart-wallet/interfaces/IEntrypoint.sol";

// Smart wallet implementation
import {DappAccount} from "./DappAccount.sol";

//   $$\     $$\       $$\                 $$\                         $$\
//   $$ |    $$ |      \__|                $$ |                        $$ |
// $$$$$$\   $$$$$$$\  $$\  $$$$$$\   $$$$$$$ |$$\  $$\  $$\  $$$$$$\  $$$$$$$\
// \_$$  _|  $$  __$$\ $$ |$$  __$$\ $$  __$$ |$$ | $$ | $$ |$$  __$$\ $$  __$$\
//   $$ |    $$ |  $$ |$$ |$$ |  \__|$$ /  $$ |$$ | $$ | $$ |$$$$$$$$ |$$ |  $$ |
//   $$ |$$\ $$ |  $$ |$$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$   ____|$$ |  $$ |
//   \$$$$  |$$ |  $$ |$$ |$$ |      \$$$$$$$ |\$$$$$\$$$$  |\$$$$$$$\ $$$$$$$  |
//    \____/ \__|  \__|\__|\__|       \_______| \_____\____/  \_______|\_______/

contract DappAccountFactory is
    BaseAccountFactory,
    ContractMetadata,
    PermissionsEnumerable
{
    /*///////////////////////////////////////////////////////////////
                                State
    //////////////////////////////////////////////////////////////*/
    address public defaultWhitelistedContract;

    /*///////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    constructor(
        IEntryPoint _entrypoint
    )
        BaseAccountFactory(
            address(new DappAccount(_entrypoint, address(this))),
            address(_entrypoint)
        )
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /*///////////////////////////////////////////////////////////////
                        External functions
    //////////////////////////////////////////////////////////////*/

    function createAccount(
        address _admin,
        bytes calldata _data
    ) public virtual override returns (address) {
        address accountAddress = super.createAccount(_admin, _data);
        DappAccount(payable(accountAddress)).setWhitelistedContractByFactory(
            defaultWhitelistedContract
        );
        return accountAddress;
    }

    function setDefaultWhitelistedContract(
        address _whitelistedContract
    ) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        defaultWhitelistedContract = _whitelistedContract;
    }

    /*///////////////////////////////////////////////////////////////
                        Internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Called in `createAccount`. Initializes the account contract created in `createAccount`.
    function _initializeAccount(
        address _account,
        address _admin,
        bytes calldata _data
    ) internal override {
        DappAccount(payable(_account)).initialize(_admin, _data);
    }

    /// @dev Returns whether contract metadata can be set in the given execution context.
    function _canSetContractURI()
        internal
        view
        virtual
        override
        returns (bool)
    {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
