import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy FlumeRegistry
  const FlumeRegistry = await ethers.getContractFactory("FlumeRegistry");
  const registry = await FlumeRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("FlumeRegistry deployed to:", await registry.getAddress());

  // Deploy mock USDC for testnet (in production, use real USDC address)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  let usdcAddress: string;
  try {
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);
  } catch {
    // MockUSDC may not exist — use a placeholder
    usdcAddress = "0x0000000000000000000000000000000000000001";
    console.log("Using placeholder USDC address");
  }

  // Deploy EscrowVault
  const EscrowVault = await ethers.getContractFactory("EscrowVault");
  const escrow = await EscrowVault.deploy(usdcAddress);
  await escrow.waitForDeployment();
  console.log("EscrowVault deployed to:", await escrow.getAddress());

  // Deploy RevenueSplit
  const RevenueSplit = await ethers.getContractFactory("RevenueSplit");
  const split = await RevenueSplit.deploy(usdcAddress);
  await split.waitForDeployment();
  console.log("RevenueSplit deployed to:", await split.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
