// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FlumeRegistry {
    struct Tool {
        address owner;
        address settlementWallet;
        uint256 pricePerCallUsdc; // 6 decimal places
        string metadataUri;
        bool active;
        uint256 registeredAt;
    }

    mapping(bytes32 => Tool) public tools;
    mapping(bytes32 => bytes32) public batchRoots; // batchId → merkle root

    event ToolRegistered(bytes32 indexed toolId, address owner, uint256 price);
    event ToolDeactivated(bytes32 indexed toolId);
    event SettlementAnchored(bytes32 indexed batchId, bytes32 merkleRoot, uint256 totalAmount);

    function registerTool(
        bytes32 toolId,
        address settlementWallet,
        uint256 pricePerCallUsdc,
        string calldata metadataUri
    ) external {
        // Phase 8 implementation
    }

    function deactivateTool(bytes32 toolId) external {
        // Phase 8 implementation
    }

    function anchorSettlement(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 totalAmount
    ) external {
        // Phase 8 implementation
    }

    function verifyPayment(
        bytes32 paymentId,
        bytes32[] calldata proof,
        bytes32 batchId
    ) external view returns (bool) {
        // Phase 8 implementation
        return false;
    }

    function getToolPrice(bytes32 toolId) external view returns (uint256) {
        return tools[toolId].pricePerCallUsdc;
    }
}
