// Auto-generated configuration file during Hardhat contract deployment
// Do not edit manually unless changing network or redeploying

const CONTRACT_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_durationSeconds",
        "type": "uint256"
      },
      {
        "internalType": "string[]",
        "name": "_candidateNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "_candidateDescriptions",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "_candidateAvatars",
        "type": "string[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "avatarUrl",
        "type": "string"
      }
    ],
    "name": "CandidateAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      }
    ],
    "name": "ElectionTimeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "candidateName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newVoteCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "VotingStatusChanged",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_avatarUrl",
        "type": "string"
      }
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "candidates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "avatarUrl",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "candidatesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "electionDescription",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "electionTitle",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCandidates",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "avatarUrl",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "voteCount",
            "type": "uint256"
          }
        ],
        "internalType": "struct Voting.Candidate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_candidateId",
        "type": "uint256"
      }
    ],
    "name": "getCandidate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "avatarUrl",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getElectionSummary",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "totalCandidates",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalVotes",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "startTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "contractOwner",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "hasUserVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isVotingOpen",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_endTime",
        "type": "uint256"
      }
    ],
    "name": "setElectionTimestamps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_active",
        "type": "bool"
      }
    ],
    "name": "setVotingActive",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVotesCast",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_candidateId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "voterChoice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

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
