require("@nomicfoundation/hardhat-toolbox");

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    arc: {
      url: process.env.ARC_RPC_URL || "https://rpc.arc.io",
      accounts: process.env.ARC_PRIVATE_KEY ? [process.env.ARC_PRIVATE_KEY] : [],
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://testnet-rpc.arc.io",
      accounts: process.env.ARC_PRIVATE_KEY ? [process.env.ARC_PRIVATE_KEY] : [],
    },
  },
};
