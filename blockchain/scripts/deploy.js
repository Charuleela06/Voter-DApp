const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 Starting Decentralized Voting Contract Deployment...");
  console.log("==================================================");

  // Predefined candidates for college mini-project demonstration
  const initialCandidates = [
    "Alice Smith (Cybersecurity Club)",
    "Bob Johnson (AI & Robotics Society)",
    "Charlie Davis (Web3 & Blockchain Guild)",
    "Diana Evans (Data Science Forum)"
  ];

  console.log("Candidate List for Election:");
  initialCandidates.forEach((name, idx) => console.log(`  ${idx + 1}. ${name}`));

  // Fetch Contract Factory
  const VotingFactory = await hre.ethers.getContractFactory("Voting");

  // Deploy contract with candidate names
  console.log("\nDeploying Voting contract to local network...");
  const votingContract = await VotingFactory.deploy(initialCandidates);

  // Wait for deployment confirmation
  await votingContract.waitForDeployment();

  const contractAddress = await votingContract.getAddress();
  console.log(`\n✅ Contract deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}`);

  // Fetch Artifact JSON for ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/Voting.sol/Voting.json"
  );
  const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const contractAbi = artifactJson.abi;

  // Generate frontend configuration file
  const frontendConfigDir = path.join(__dirname, "../../frontend");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  const frontendConfigFile = path.join(frontendConfigDir, "contractConfig.js");

  const configContent = `// Auto-generated configuration file during Hardhat contract deployment
// Do not edit manually unless changing network or redeploying

const CONTRACT_ADDRESS = "${contractAddress}";

const CONTRACT_ABI = ${JSON.stringify(contractAbi, null, 2)};

const NETWORK_CONFIG = {
  chainId: "0x7a69", // 31337 in Hex
  chainName: "Hardhat Localhost",
  rpcUrl: "http://127.0.0.1:8545",
  nativeCurrency: {
    name: "Test Ether",
    symbol: "ETH",
    decimals: 18
  }
};

if (typeof module !== "undefined") {
  module.exports = { CONTRACT_ADDRESS, CONTRACT_ABI, NETWORK_CONFIG };
}
`;

  fs.writeFileSync(frontendConfigFile, configContent, "utf8");
  console.log(`\n📄 Exported frontend configuration file: ${frontendConfigFile}`);
  console.log("==================================================");
  console.log("🎉 Setup complete! You can now start the frontend application.");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
