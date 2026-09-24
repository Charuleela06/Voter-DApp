const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("🚀 Deploying Upgraded Decentralized Voting Contract...");
  console.log("==================================================");

  // Election Metadata
  const electionTitle = "Kongu Engineering College - Student Council Election 2026";
  const electionDescription = "Official Blockchain-Based Decentralized Election for Student Body Representatives";
  
  // Current time & 7 days election duration
  const startTime = Math.floor(Date.now() / 1000);
  const durationSeconds = 7 * 24 * 60 * 60; // 7 days

  // Predefined Candidates
  const candidateNames = [
    "Alice Johnson",
    "Bob Smith",
    "Charlie Davis",
    "Diana Evans"
  ];

  const candidateDescriptions = [
    "Focusing on Student Welfare, Campus Wi-Fi & Tech Innovation",
    "Promoting Inter-College Sports, Fitness & Campus Recreation",
    "Building Web3, Blockchain & Open-Source Developer Guilds",
    "Championing AI Research, Data Science & Academic Excellence"
  ];

  const candidateAvatars = [
    "alice",
    "bob",
    "charlie",
    "diana"
  ];

  console.log(`Title: ${electionTitle}`);
  console.log("Candidates:");
  candidateNames.forEach((name, idx) => console.log(`  ${idx + 1}. ${name} - "${candidateDescriptions[idx]}"`));

  // Fetch Contract Factory
  const VotingFactory = await hre.ethers.getContractFactory("Voting");

  // Deploy contract
  console.log("\nDeploying Voting contract to local network...");
  const votingContract = await VotingFactory.deploy(
    electionTitle,
    electionDescription,
    startTime,
    durationSeconds,
    candidateNames,
    candidateDescriptions,
    candidateAvatars
  );

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

/**
 * Shared Election Result & Tie Calculation Utility
 * Used by both Voter Ballot (app.js) and Admin Portal (admin.js)
 */
` + calculateElectionResult.toString() + "\n";

  fs.writeFileSync(frontendConfigFile, configContent, "utf8");
  console.log(`\n📄 Exported frontend configuration file: ${frontendConfigFile}`);
  console.log("==================================================");
  console.log("🎉 Setup complete! Upgraded contract is live.");
  console.log("==================================================");
}

/**
 * Shared Election Result & Tie Calculation Utility
 * Used by both Voter Ballot (app.js) and Admin Portal (admin.js)
 */
function calculateElectionResult(candidatesList, totalVotesCount, isVotingActive, startTimestamp, endTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const isNotStarted = startTimestamp > 0 && now < startTimestamp;
  const isEnded = (endTimestamp > 0 && now >= endTimestamp) || !isVotingActive;
  const isInProgress = !isNotStarted && !isEnded;

  if (!candidatesList || candidatesList.length === 0) {
    return {
      isNotStarted: true,
      isEnded: false,
      isInProgress: false,
      statusText: "⏳ ELECTION NOT STARTED",
      statusDesc: "Results will appear after voting begins.",
      bannerType: "hidden",
      bannerTitle: "",
      bannerSub: "",
      hasWinner: false,
      isTie: false,
      winner: null,
      tiedCandidates: [],
      maxVotes: 0
    };
  }

  const maxVotes = Math.max(...candidatesList.map(c => Number(c.voteCount)));
  const topCandidates = candidatesList.filter(c => Number(c.voteCount) === maxVotes && maxVotes > 0);

  let bannerType = "hidden";
  let bannerTitle = "";
  let bannerSub = "";
  let hasWinner = false;
  let isTie = false;
  let winner = null;

  let statusText = "🟢 ELECTION IN PROGRESS";
  let statusDesc = "Live results based on votes recorded on the blockchain.";

  if (isNotStarted) {
    statusText = "⏳ ELECTION NOT STARTED";
    statusDesc = "Results will appear after voting begins.";
  } else if (isEnded) {
    statusText = "🏆 ELECTION COMPLETED – FINAL RESULT";
    statusDesc = "Final results based on votes recorded on the blockchain.";
  }

  if (totalVotesCount > 0 && maxVotes > 0) {
    if (topCandidates.length === 1) {
      winner = topCandidates[0];
      const percentage = ((winner.voteCount / totalVotesCount) * 100).toFixed(1);
      const voteText = winner.voteCount === 1 ? "1 vote" : `${winner.voteCount} votes`;

      if (isEnded) {
        hasWinner = true;
        bannerType = "winner";
        bannerTitle = `🏆 WINNER`;
        bannerSub = `${winner.name} — ${voteText} (${percentage}%)`;
      } else {
        bannerType = "live";
        bannerTitle = `📊 LIVE RESULTS`;
        bannerSub = `Leading Candidate: ${winner.name} — ${voteText} (${percentage}%)`;
      }
    } else if (topCandidates.length >= 2) {
      isTie = true;
      bannerType = "tie";
      const namesList = topCandidates.map(c => c.name);
      let namesFormatted = "";
      if (namesList.length === 2) {
        namesFormatted = `${namesList[0]} & ${namesList[1]}`;
      } else {
        namesFormatted = namesList.slice(0, -1).join(", ") + " & " + namesList[namesList.length - 1];
      }

      const voteText = maxVotes === 1 ? "1 vote" : `${maxVotes} votes`;
      const countWord = topCandidates.length === 2 ? "Both" : `All ${topCandidates.length}`;
      
      bannerTitle = `🤝 TIE RESULT`;
      bannerSub = `${namesFormatted} — ${countWord} candidates received ${voteText} each out of ${totalVotesCount} total votes cast.`;
    }
  }

  return {
    isNotStarted,
    isEnded,
    isInProgress,
    statusText,
    statusDesc,
    bannerType,
    bannerTitle,
    bannerSub,
    hasWinner,
    isTie,
    winner,
    tiedCandidates: topCandidates,
    maxVotes
  };
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
