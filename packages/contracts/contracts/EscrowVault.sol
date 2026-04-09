// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EscrowVault {
    struct Escrow {
        address caller;
        address toolOwner;
        uint256 amount;
        bytes32 toolId;
        uint256 createdAt;
        bool released;
        bool refunded;
    }

    IERC20 public immutable usdc;
    address public admin;
    mapping(bytes32 => Escrow) public escrows;

    event EscrowCreated(bytes32 indexed escrowId, address caller, address toolOwner, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, address toolOwner, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address caller, uint256 amount);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        admin = msg.sender;
    }

    function createEscrow(
        bytes32 escrowId,
        address toolOwner,
        uint256 amount,
        bytes32 toolId
    ) external {
        require(escrows[escrowId].caller == address(0), "escrow exists");
        require(amount > 0, "zero amount");

        usdc.transferFrom(msg.sender, address(this), amount);

        escrows[escrowId] = Escrow({
            caller: msg.sender,
            toolOwner: toolOwner,
            amount: amount,
            toolId: toolId,
            createdAt: block.timestamp,
            released: false,
            refunded: false
        });

        emit EscrowCreated(escrowId, msg.sender, toolOwner, amount);
    }

    function release(bytes32 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.caller == msg.sender || msg.sender == admin, "not authorized");
        require(!e.released && !e.refunded, "already finalized");

        e.released = true;
        usdc.transfer(e.toolOwner, e.amount);

        emit EscrowReleased(escrowId, e.toolOwner, e.amount);
    }

    function refund(bytes32 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(msg.sender == admin, "not admin");
        require(!e.released && !e.refunded, "already finalized");

        e.refunded = true;
        usdc.transfer(e.caller, e.amount);

        emit EscrowRefunded(escrowId, e.caller, e.amount);
    }
}
