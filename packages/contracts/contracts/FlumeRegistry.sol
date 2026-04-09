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
    mapping(bytes32 => bytes32) public batchRoots;
    address public relay;
    address public admin;

    event ToolRegistered(bytes32 indexed toolId, address owner, uint256 price);
    event ToolDeactivated(bytes32 indexed toolId);
    event SettlementAnchored(bytes32 indexed batchId, bytes32 merkleRoot, uint256 totalAmount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    modifier onlyRelay() {
        require(msg.sender == relay || msg.sender == admin, "not relay");
        _;
    }

    constructor(address _relay) {
        admin = msg.sender;
        relay = _relay;
    }

    function registerTool(
        bytes32 toolId,
        address settlementWallet,
        uint256 pricePerCallUsdc,
        string calldata metadataUri
    ) external {
        require(tools[toolId].owner == address(0), "tool already registered");
        require(settlementWallet != address(0), "invalid settlement wallet");

        tools[toolId] = Tool({
            owner: msg.sender,
            settlementWallet: settlementWallet,
            pricePerCallUsdc: pricePerCallUsdc,
            metadataUri: metadataUri,
            active: true,
            registeredAt: block.timestamp
        });

        emit ToolRegistered(toolId, msg.sender, pricePerCallUsdc);
    }

    function deactivateTool(bytes32 toolId) external {
        require(tools[toolId].owner == msg.sender, "not tool owner");
        require(tools[toolId].active, "already inactive");

        tools[toolId].active = false;
        emit ToolDeactivated(toolId);
    }

    function anchorSettlement(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 totalAmount
    ) external onlyRelay {
        require(batchRoots[batchId] == bytes32(0), "batch already anchored");

        batchRoots[batchId] = merkleRoot;
        emit SettlementAnchored(batchId, merkleRoot, totalAmount);
    }

    function verifyPayment(
        bytes32 leaf,
        bytes32[] calldata proof,
        bytes32 batchId
    ) external view returns (bool) {
        bytes32 root = batchRoots[batchId];
        require(root != bytes32(0), "batch not found");

        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    function getToolPrice(bytes32 toolId) external view returns (uint256) {
        return tools[toolId].pricePerCallUsdc;
    }

    function setRelay(address _relay) external onlyAdmin {
        relay = _relay;
    }
}
