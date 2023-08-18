// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

import "@thirdweb-dev/contracts/smart-wallet/non-upgradeable/Account.sol";

contract DappAccount is Account {
    address public whitelistedContract;

    modifier onlyWhitelistedContract() {
        require(
            msg.sender == whitelistedContract,
            "Not the whitelisted contract"
        );
        _;
    }

    constructor(
        IEntryPoint _entrypoint,
        address _factory
    ) Account(_entrypoint, _factory) {}

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this");
        _;
    }

    function setWhitelistedContractByFactory(
        address _whitelistedContract
    ) external onlyFactory {
        whitelistedContract = _whitelistedContract;
    }

    function execute(
        address _target,
        uint256 _value,
        bytes calldata _calldata
    ) external virtual override onlyAdminOrEntrypoint {
        require(
            _target == whitelistedContract ||
                msg.sender == address(entryPoint()) ||
                isAdmin(msg.sender),
            "Not authorized"
        );
        _registerOnFactory();
        _call(_target, _value, _calldata);
    }

    function executeBatch(
        address[] calldata _target,
        uint256[] calldata _value,
        bytes[] calldata _calldata
    ) external virtual override onlyAdminOrEntrypoint {
        require(
            msg.sender == address(entryPoint()) || isAdmin(msg.sender),
            "Not authorized"
        );
        _registerOnFactory();
        for (uint256 i = 0; i < _target.length; i++) {
            _call(_target[i], _value[i], _calldata[i]);
        }
    }
}
