// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RevenueSplit {
    struct Split {
        address[] recipients;
        uint256[] shares; // basis points (10000 = 100%)
        bool active;
    }

    IERC20 public immutable usdc;
    address public admin;
    mapping(bytes32 => Split) public splits;

    event SplitCreated(bytes32 indexed splitId, address[] recipients, uint256[] shares);
    event RevenueDistributed(bytes32 indexed splitId, uint256 totalAmount);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        admin = msg.sender;
    }

    function createSplit(
        bytes32 splitId,
        address[] calldata recipients,
        uint256[] calldata shares
    ) external {
        require(recipients.length == shares.length, "length mismatch");
        require(recipients.length > 0, "empty split");
        require(!splits[splitId].active, "split exists");

        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(recipients[i] != address(0), "zero address");
            totalShares += shares[i];
        }
        require(totalShares == 10000, "shares must total 10000");

        splits[splitId] = Split({
            recipients: recipients,
            shares: shares,
            active: true
        });

        emit SplitCreated(splitId, recipients, shares);
    }

    function distribute(bytes32 splitId, uint256 totalAmount) external {
        Split storage s = splits[splitId];
        require(s.active, "split not found");
        require(totalAmount > 0, "zero amount");

        usdc.transferFrom(msg.sender, address(this), totalAmount);

        for (uint256 i = 0; i < s.recipients.length; i++) {
            uint256 share = (totalAmount * s.shares[i]) / 10000;
            if (share > 0) {
                usdc.transfer(s.recipients[i], share);
            }
        }

        emit RevenueDistributed(splitId, totalAmount);
    }
}
