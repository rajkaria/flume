import { expect } from "chai";
import { ethers } from "hardhat";

describe("FlumeRegistry", function () {
  async function deploy() {
    const [admin, relay, toolOwner, other] = await ethers.getSigners();
    const FlumeRegistry = await ethers.getContractFactory("FlumeRegistry");
    const registry = await FlumeRegistry.deploy(relay!.address);
    await registry.waitForDeployment();
    return { registry, admin: admin!, relay: relay!, toolOwner: toolOwner!, other: other! };
  }

  const toolId = ethers.keccak256(ethers.toUtf8Bytes("search"));

  describe("registerTool", function () {
    it("registers a tool", async function () {
      const { registry, toolOwner } = await deploy();
      await registry.connect(toolOwner).registerTool(
        toolId,
        toolOwner.address,
        5000, // 0.005 USDC (6 decimals)
        "ipfs://metadata"
      );
      const tool = await registry.tools(toolId);
      expect(tool.owner).to.equal(toolOwner.address);
      expect(tool.pricePerCallUsdc).to.equal(5000n);
      expect(tool.active).to.equal(true);
    });

    it("reverts on duplicate registration", async function () {
      const { registry, toolOwner } = await deploy();
      await registry.connect(toolOwner).registerTool(toolId, toolOwner.address, 5000, "");
      await expect(
        registry.connect(toolOwner).registerTool(toolId, toolOwner.address, 5000, "")
      ).to.be.revertedWith("tool already registered");
    });

    it("reverts on zero settlement wallet", async function () {
      const { registry, toolOwner } = await deploy();
      await expect(
        registry.connect(toolOwner).registerTool(toolId, ethers.ZeroAddress, 5000, "")
      ).to.be.revertedWith("invalid settlement wallet");
    });
  });

  describe("deactivateTool", function () {
    it("owner can deactivate", async function () {
      const { registry, toolOwner } = await deploy();
      await registry.connect(toolOwner).registerTool(toolId, toolOwner.address, 5000, "");
      await registry.connect(toolOwner).deactivateTool(toolId);
      const tool = await registry.tools(toolId);
      expect(tool.active).to.equal(false);
    });

    it("non-owner cannot deactivate", async function () {
      const { registry, toolOwner, other } = await deploy();
      await registry.connect(toolOwner).registerTool(toolId, toolOwner.address, 5000, "");
      await expect(
        registry.connect(other).deactivateTool(toolId)
      ).to.be.revertedWith("not tool owner");
    });
  });

  describe("anchorSettlement", function () {
    const batchId = ethers.keccak256(ethers.toUtf8Bytes("batch-1"));
    const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("root-1"));

    it("relay can anchor settlement", async function () {
      const { registry, relay } = await deploy();
      await registry.connect(relay).anchorSettlement(batchId, merkleRoot, 1000000);
      expect(await registry.batchRoots(batchId)).to.equal(merkleRoot);
    });

    it("non-relay cannot anchor", async function () {
      const { registry, other } = await deploy();
      await expect(
        registry.connect(other).anchorSettlement(batchId, merkleRoot, 1000000)
      ).to.be.revertedWith("not relay");
    });

    it("cannot anchor same batch twice", async function () {
      const { registry, relay } = await deploy();
      await registry.connect(relay).anchorSettlement(batchId, merkleRoot, 1000000);
      await expect(
        registry.connect(relay).anchorSettlement(batchId, merkleRoot, 1000000)
      ).to.be.revertedWith("batch already anchored");
    });
  });

  describe("getToolPrice", function () {
    it("returns correct price", async function () {
      const { registry, toolOwner } = await deploy();
      await registry.connect(toolOwner).registerTool(toolId, toolOwner.address, 5000, "");
      expect(await registry.getToolPrice(toolId)).to.equal(5000n);
    });
  });
});
