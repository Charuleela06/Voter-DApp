/**
 * Decentralized Voting DApp - Main Frontend Application Logic
 * Powered by ethers.js v6 & MetaMask Web3 Provider
 */

// Application State
let provider = null;
let signer = null;
let userAddress = null;
let readOnlyContract = null;
let candidates = [];
let totalVotes = 0;
let hasVoted = false;
let isVotingActive = true;

// Direct local RPC provider for instant, fail-safe read operations
const localRpcProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

// DOM Element References
const btnConnectWallet = document.getElementById("btnConnectWallet");
const walletPill = document.getElementById("walletPill");
const walletAddressDisplay = document.getElementById("walletAddressDisplay");
const walletAvatar = document.getElementById("walletAvatar");
const btnCopyAddress = document.getElementById("btnCopyAddress");
const networkBadge = document.getElementById("networkBadge");
const networkName = document.getElementById("networkName");

const statCandidateCount = document.getElementById("statCandidateCount");
const statTotalVotes = document.getElementById("statTotalVotes");
const statVotingStatus = document.getElementById("statVotingStatus");
const statUserEligibility = document.getElementById("statUserEligibility");

const statusBanner = document.getElementById("statusBanner");
const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const statusMessage = document.getElementById("statusMessage");
const txHashWrapper = document.getElementById("txHashWrapper");
const txHashLink = document.getElementById("txHashLink");
const btnCloseStatus = document.getElementById("btnCloseStatus");

const candidateGrid = document.getElementById("candidateGrid");
const resultsBars = document.getElementById("resultsBars");
const btnRefresh = document.getElementById("btnRefresh");
const displayContractAddress = document.getElementById("displayContractAddress");

const btnHelpGuide = document.getElementById("btnHelpGuide");
const helpModal = document.getElementById("helpModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCloseModalBtn = document.getElementById("btnCloseModalBtn");

// Initialize DApp on Page Load
document.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  updateContractAddressDisplay();

  // Always instantiate read-only contract using direct local RPC
  if (typeof CONTRACT_ADDRESS !== "undefined" && CONTRACT_ADDRESS.length > 10) {
    readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, localRpcProvider);
  }

  // Check if MetaMask is installed
  if (typeof window.ethereum !== "undefined") {
    setupMetaMaskListeners();
    await checkConnectionAndLoad();
  } else {
    // If no MetaMask, still load candidates using local RPC!
    await loadContractData();
    showStatus(
      "info",
      "Read-Only Mode",
      "MetaMask extension not detected. Candidates loaded in read-only mode. Install MetaMask to cast votes."
    );
  }
});

/**
 * Register UI Event Listeners
 */
function initEventListeners() {
  btnConnectWallet.addEventListener("click", connectWallet);

  btnCopyAddress.addEventListener("click", () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      showStatus("info", "Address Copied", "Wallet address copied to clipboard!");
    }
  });

  btnRefresh.addEventListener("click", async () => {
    btnRefresh.disabled = true;
    showStatus("info", "Refreshing...", "Fetching latest vote counts from smart contract.");
    await loadContractData();
    btnRefresh.disabled = false;
  });

  btnCloseStatus.addEventListener("click", () => {
    statusBanner.classList.add("hidden");
  });

  // Modal handlers
  btnHelpGuide.addEventListener("click", () => helpModal.classList.remove("hidden"));
  btnCloseModal.addEventListener("click", () => helpModal.classList.add("hidden"));
  btnCloseModalBtn.addEventListener("click", () => helpModal.classList.add("hidden"));
  helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) helpModal.classList.add("hidden");
  });
}

/**
 * Display Contract Address in Info Footer
 */
function updateContractAddressDisplay() {
  if (typeof CONTRACT_ADDRESS !== "undefined" && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    displayContractAddress.innerText = CONTRACT_ADDRESS;
  } else {
    displayContractAddress.innerText = "Contract Not Deployed Yet";
  }
}

/**
 * Setup MetaMask Network & Account Change Listeners
 */
function setupMetaMaskListeners() {
  window.ethereum.on("accountsChanged", async (accounts) => {
    console.log("MetaMask account changed:", accounts);
    if (accounts.length === 0) {
      userAddress = null;
      signer = null;
      updateWalletUI(false);
    } else {
      userAddress = accounts[0];
      await initWeb3Provider();
    }
    await loadContractData();
  });

  window.ethereum.on("chainChanged", (_chainId) => {
    console.log("MetaMask chain changed:", _chainId);
    window.location.reload();
  });
}

/**
 * Initialize Web3 Provider & Signer for MetaMask
 */
async function initWeb3Provider() {
  try {
    if (typeof window.ethereum === "undefined") return false;

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    updateNetworkBadge(network);

    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length > 0) {
      userAddress = accounts[0];
      signer = await provider.getSigner();
      updateWalletUI(true);
    } else {
      updateWalletUI(false);
    }

    if (readOnlyContract) {
      subscribeToContractEvents();
    }

    return true;
  } catch (error) {
    console.error("Error initializing Web3 provider:", error);
    return false;
  }
}

/**
 * Update Top Network Badge State
 */
function updateNetworkBadge(network) {
  const dot = networkBadge.querySelector(".status-dot");
  if (network.chainId === 31337n || network.chainId === 31337) {
    dot.className = "status-dot connected";
    networkName.innerText = "Hardhat Localhost (31337)";
  } else {
    dot.className = "status-dot warning";
    networkName.innerText = `MetaMask Chain ID: ${network.chainId}`;
  }
}

/**
 * Check existing wallet connection status on page load
 */
async function checkConnectionAndLoad() {
  await initWeb3Provider();
  await loadContractData();
}

/**
 * Explicit User Action: Connect MetaMask Wallet
 */
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed in your browser. Please install MetaMask to continue.");
      return;
    }

    btnConnectWallet.disabled = true;
    btnConnectWallet.innerText = "Connecting...";

    // Request account access from MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    
    if (accounts.length > 0) {
      userAddress = accounts[0];
      
      // Check network chain ID and prompt switch to Hardhat network if needed
      provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 31337n && network.chainId !== 31337) {
        showStatus("warning", "Switching Network...", "Switching MetaMask to Hardhat Localhost (Chain ID 31337)...");
        await promptAddHardhatNetwork();
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      signer = await provider.getSigner();
      updateWalletUI(true);
      await loadContractData();

      showStatus("success", "Wallet Connected", `Connected to ${truncateAddress(userAddress)}`);
    }
  } catch (error) {
    console.error("User denied account access or error occurred:", error);
    showStatus("error", "Connection Failed", error.message || "Failed to connect MetaMask.");
  } finally {
    btnConnectWallet.disabled = false;
    btnConnectWallet.innerText = "Connect Wallet";
  }
}

/**
 * Prompt MetaMask to Add / Switch to Hardhat Localhost Network
 */
async function promptAddHardhatNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_CONFIG.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902 || (switchError.data && switchError.data.originalError && switchError.data.originalError.code === 4902)) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK_CONFIG],
        });
      } catch (addError) {
        console.error("Could not add Hardhat network to MetaMask:", addError);
      }
    }
  }
}

/**
 * Load Candidate & Voting Data Directly from Smart Contract
 */
async function loadContractData() {
  try {
    if (!readOnlyContract) {
      renderNoContractState();
      return;
    }

    // 1. Fetch Election Summary using direct local RPC provider
    const [cnt, totalVotesCast, active] = await readOnlyContract.getElectionSummary();
    totalVotes = Number(totalVotesCast);
    isVotingActive = Boolean(active);

    statCandidateCount.innerText = cnt.toString();
    statTotalVotes.innerText = totalVotes.toString();
    statVotingStatus.innerText = isVotingActive ? "Active 🟢" : "Closed 🔴";
    statVotingStatus.className = `metric-value ${isVotingActive ? "status-active" : "status-closed"}`;

    // 2. Check if current user wallet has voted
    if (userAddress) {
      hasVoted = await readOnlyContract.hasUserVoted(userAddress);
      if (hasVoted) {
        statUserEligibility.innerText = "Voted ✓";
        statUserEligibility.style.color = "var(--success)";
      } else {
        statUserEligibility.innerText = "Eligible to Vote";
        statUserEligibility.style.color = "var(--secondary)";
      }
    } else {
      hasVoted = false;
      statUserEligibility.innerText = "Connect Wallet";
      statUserEligibility.style.color = "var(--text-muted)";
    }

    // 3. Fetch All Candidates
    const rawCandidates = await readOnlyContract.getAllCandidates();
    candidates = rawCandidates.map((c) => ({
      id: Number(c.id),
      name: c.name,
      voteCount: Number(c.voteCount),
    }));

    // 4. Render UI Components
    renderCandidateCards();
    renderResultsAnalytics();

  } catch (error) {
    console.error("Failed to load contract data:", error);
    candidateGrid.innerHTML = `
      <div class="loading-spinner-container">
        <p style="color: var(--danger)">⚠️ Error loading contract data. Please make sure Hardhat local node is running and contract is deployed.</p>
        <code style="margin-top:8px">${error.message || error}</code>
      </div>
    `;
  }
}

/**
 * Render Candidate Cards Grid
 */
function renderCandidateCards() {
  if (candidates.length === 0) {
    candidateGrid.innerHTML = `<p style="color: var(--text-muted)">No candidates found in contract.</p>`;
    return;
  }

  candidateGrid.innerHTML = candidates
    .map((candidate) => {
      const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
      
      let btnDisabled = false;
      let btnText = "Cast Vote";
      let btnClass = "btn-primary";

      if (!userAddress) {
        btnDisabled = false; // Allow clicking to prompt wallet connection!
        btnText = "Connect & Vote";
        btnClass = "btn-primary";
      } else if (hasVoted) {
        btnDisabled = true;
        btnText = "Already Voted";
        btnClass = "btn-secondary";
      } else if (!isVotingActive) {
        btnDisabled = true;
        btnText = "Voting Closed";
        btnClass = "btn-secondary";
      }

      return `
        <div class="candidate-card ${hasVoted ? 'voted-card' : ''}" id="candidate-card-${candidate.id}">
          <div class="candidate-header">
            <div class="candidate-avatar">#${candidate.id}</div>
            <div class="candidate-info">
              <span class="candidate-id">Candidate ID: ${candidate.id}</span>
              <h4>${escapeHtml(candidate.name)}</h4>
            </div>
          </div>

          <div class="vote-count-box">
            <div class="vote-number">${candidate.voteCount}</div>
            <div class="vote-label">Current Votes</div>
          </div>

          <div class="progress-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="progress-text">
              <span>Share: ${percentage}%</span>
              <span>${candidate.voteCount} / ${totalVotes}</span>
            </div>
          </div>

          <button 
            class="btn ${btnClass} btn-vote" 
            onclick="handleVote(${candidate.id})"
            ${btnDisabled ? "disabled" : ""}
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            ${btnText}
          </button>
        </div>
      `;
    })
    .join("");
}

/**
 * Render Live Results Leaderboard Progress Bars
 */
function renderResultsAnalytics() {
  if (candidates.length === 0) {
    resultsBars.innerHTML = `<p style="color: var(--text-muted)">No analytics available yet.</p>`;
    return;
  }

  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  resultsBars.innerHTML = sorted
    .map((candidate) => {
      const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
      return `
        <div class="result-row">
          <div class="result-info">
            <span>${escapeHtml(candidate.name)}</span>
            <span>${candidate.voteCount} Votes (${percentage}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * Core Blockchain Interaction: Cast a Vote
 */
async function handleVote(candidateId) {
  try {
    if (!window.ethereum) {
      alert("MetaMask is required to cast votes.");
      return;
    }

    if (!userAddress) {
      await connectWallet();
      if (!userAddress) return;
    }

    if (hasVoted) {
      showStatus("error", "Vote Rejected", "Your wallet address has already cast a vote in this election.");
      return;
    }

    // Verify network is Hardhat Localhost (Chain ID 31337)
    provider = new ethers.BrowserProvider(window.ethereum);
    let network = await provider.getNetwork();

    if (network.chainId !== 31337n && network.chainId !== 31337) {
      showStatus("warning", "Switching Network...", "Switching MetaMask to Hardhat Localhost (Chain ID 31337)...");
      await promptAddHardhatNetwork();
      provider = new ethers.BrowserProvider(window.ethereum);
      network = await provider.getNetwork();
    }

    signer = await provider.getSigner();

    // Attach contract instance to Signer connected to local chain
    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    showStatus(
      "info",
      "Waiting for MetaMask Confirmation",
      `Please confirm the transaction in MetaMask to vote for Candidate #${candidateId}.`
    );

    // Trigger Smart Contract Transaction through MetaMask
    const tx = await contractWithSigner.vote(candidateId);

    showStatus(
      "info",
      "Transaction Submitted",
      "Waiting for block confirmation on the blockchain...",
      tx.hash
    );

    // Wait for transaction to be mined in a block
    const receipt = await tx.wait();

    showStatus(
      "success",
      "Vote Successfully Recorded! 🎉",
      `Your vote for Candidate #${candidateId} has been confirmed on the blockchain!`,
      receipt.hash
    );

    // Reload contract data to reflect new vote counts
    await loadContractData();

  } catch (error) {
    console.error("Voting error:", error);
    let errorMsg = "Transaction failed or was rejected by user.";
    
    if (error.reason) {
      errorMsg = error.reason;
    } else if (error.data && error.data.message) {
      errorMsg = error.data.message;
    } else if (error.message && error.message.includes("user rejected")) {
      errorMsg = "Transaction was canceled in MetaMask by user.";
    }

    showStatus("error", "Voting Failed", errorMsg);
  }
}

/**
 * Subscribe to Web3 Real-time Smart Contract Events
 */
function subscribeToContractEvents() {
  if (!readOnlyContract) return;

  try {
    readOnlyContract.removeAllListeners("Voted");
    readOnlyContract.on("Voted", (voter, candidateId, candidateName, newVoteCount, timestamp) => {
      console.log(`[Web3 Event] New Vote Cast! Voter: ${voter}, Candidate: ${candidateName}, New Votes: ${newVoteCount}`);
      loadContractData();
    });
  } catch (err) {
    console.warn("Could not subscribe to contract events:", err);
  }
}

/**
 * UI Helper Functions
 */
function updateWalletUI(isConnected) {
  if (isConnected && userAddress) {
    btnConnectWallet.classList.add("hidden");
    walletPill.classList.remove("hidden");
    walletAddressDisplay.innerText = truncateAddress(userAddress);
    walletAvatar.innerText = userAddress.substring(2, 4).toUpperCase();
  } else {
    btnConnectWallet.classList.remove("hidden");
    walletPill.classList.add("hidden");
  }
}

function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

function showStatus(type, title, message, txHash = null) {
  statusBanner.className = `status-banner ${type}`;
  statusBanner.classList.remove("hidden");

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  statusIcon.innerText = icons[type] || "⚡";
  statusTitle.innerText = title;
  statusMessage.innerText = message;

  if (txHash) {
    txHashWrapper.classList.remove("hidden");
    txHashLink.innerText = txHash;
    txHashLink.href = "#";
  } else {
    txHashWrapper.classList.add("hidden");
  }
}

function renderNoContractState() {
  candidateGrid.innerHTML = `
    <div class="loading-spinner-container">
      <p style="color: var(--warning)">⚠️ Smart Contract Not Deployed</p>
      <p style="font-size:0.85rem">Please run <code>npx hardhat run scripts/deploy.js --network localhost</code> in the blockchain directory.</p>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
