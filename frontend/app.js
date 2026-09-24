/**
 * Upgraded Decentralized Voting DApp - Main Voter Application Logic
 * Powered by ethers.js v6 & MetaMask Web3 Provider
 */

// Global Application State
let provider = null;
let signer = null;
let userAddress = null;
let readOnlyContract = null;

let candidates = [];
let totalVotes = 0;
let hasVoted = false;
let isVotingActive = true;
let contractOwner = null;
let startTimestamp = 0;
let endTimestamp = 0;
let countdownInterval = null;

// Direct local RPC provider for fail-safe, instant state reading
const localRpcProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

// DOM Elements References
const btnConnectWallet = document.getElementById("btnConnectWallet");
const walletPill = document.getElementById("walletPill");
const walletAddressDisplay = document.getElementById("walletAddressDisplay");
const walletAvatar = document.getElementById("walletAvatar");
const btnCopyAddress = document.getElementById("btnCopyAddress");

const networkBadge = document.getElementById("networkBadge");
const networkDot = document.getElementById("networkDot");
const networkName = document.getElementById("networkName");

const electionTitleDisplay = document.getElementById("electionTitleDisplay");
const electionDescDisplay = document.getElementById("electionDescDisplay");
const votingStatusIndicator = document.getElementById("votingStatusIndicator");
const votingStatusText = document.getElementById("votingStatusText");
const displayStartTime = document.getElementById("displayStartTime");
const displayEndTime = document.getElementById("displayEndTime");

const timerDays = document.getElementById("timerDays");
const timerHours = document.getElementById("timerHours");
const timerMinutes = document.getElementById("timerMinutes");
const timerSeconds = document.getElementById("timerSeconds");

const statCandidateCount = document.getElementById("statCandidateCount");
const statTotalVotes = document.getElementById("statTotalVotes");
const statWalletsVoted = document.getElementById("statWalletsVoted");
const statUserEligibility = document.getElementById("statUserEligibility");

const statusBanner = document.getElementById("statusBanner");
const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const statusMessage = document.getElementById("statusMessage");
const txHashWrapper = document.getElementById("txHashWrapper");
const txHashLink = document.getElementById("txHashLink");
const btnCloseStatus = document.getElementById("btnCloseStatus");
const alreadyVotedBanner = document.getElementById("alreadyVotedBanner");

const candidateGrid = document.getElementById("candidateGrid");
const resultsBars = document.getElementById("resultsBars");
const resTotalVotes = document.getElementById("resTotalVotes");
const resCandidates = document.getElementById("resCandidates");
const resWallets = document.getElementById("resWallets");
const activityList = document.getElementById("activityList");

const btnRefresh = document.getElementById("btnRefresh");
const displayContractAddress = document.getElementById("displayContractAddress");
const displayContractOwner = document.getElementById("displayContractOwner");

// Confirmation Modal Elements
const voteConfirmModal = document.getElementById("voteConfirmModal");
const btnCloseConfirmModal = document.getElementById("btnCloseConfirmModal");
const btnCloseConfirmModalBtn = document.getElementById("btnCloseConfirmModalBtn");
const btnCopyTxHash = document.getElementById("btnCopyTxHash");
const modalCandName = document.getElementById("modalCandName");
const modalVoterAddr = document.getElementById("modalVoterAddr");
const modalTxHash = document.getElementById("modalTxHash");
const modalBlockNum = document.getElementById("modalBlockNum");

// Help Modal Elements
const btnHelpGuide = document.getElementById("btnHelpGuide");
const helpModal = document.getElementById("helpModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCloseModalBtn = document.getElementById("btnCloseModalBtn");

// Avatar Colors Generator for Candidate Cards
const AVATAR_COLORS = {
  alice: { bg: "#4f46e5", icon: "fa-user-tie" },
  bob: { bg: "#0891b2", icon: "fa-user-astronaut" },
  charlie: { bg: "#7c3aed", icon: "fa-user-ninja" },
  diana: { bg: "#059669", icon: "fa-user-graduate" },
  general: { bg: "#d97706", icon: "fa-user" }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initEventListeners();
  updateContractAddressDisplay();

  // Instantiate read-only contract using direct local RPC
  if (typeof CONTRACT_ADDRESS !== "undefined" && CONTRACT_ADDRESS.length > 10) {
    readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, localRpcProvider);
  }

  // Check if MetaMask is installed
  if (typeof window.ethereum !== "undefined") {
    setupMetaMaskListeners();
    await checkConnectionAndLoad();
  } else {
    await loadContractData();
    showStatus(
      "warning",
      "MetaMask Extension Required",
      "MetaMask extension is not detected in your browser. Candidates loaded in preview mode. Please install MetaMask to cast your vote."
    );
  }
});

/**
 * Theme System Logic (Dark & Light Theme)
 */
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  const btnThemeToggle = document.getElementById("btnThemeToggle");
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");
  
  if (themeIcon && themeLabel) {
    if (theme === "light") {
      themeIcon.className = "fa-solid fa-sun";
      themeLabel.innerText = "Light Mode";
    } else {
      themeIcon.className = "fa-solid fa-moon";
      themeLabel.innerText = "Dark Mode";
    }
  }
}

/**
 * Event Listeners Registration
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
    showStatus("info", "Refreshing...", "Fetching latest election state from smart contract.");
    await loadContractData();
    btnRefresh.disabled = false;
  });

  btnCloseStatus.addEventListener("click", () => {
    statusBanner.classList.add("hidden");
  });

  // Modal Handlers
  btnHelpGuide.addEventListener("click", () => helpModal.classList.remove("hidden"));
  btnCloseModal.addEventListener("click", () => helpModal.classList.add("hidden"));
  btnCloseModalBtn.addEventListener("click", () => helpModal.classList.add("hidden"));

  btnCloseConfirmModal.addEventListener("click", () => voteConfirmModal.classList.add("hidden"));
  btnCloseConfirmModalBtn.addEventListener("click", () => voteConfirmModal.classList.add("hidden"));

  btnCopyTxHash.addEventListener("click", () => {
    const hashText = modalTxHash.innerText;
    if (hashText) {
      navigator.clipboard.writeText(hashText);
      showStatus("info", "Transaction Hash Copied", "Transaction hash copied to clipboard!");
    }
  });

  // Technical Specs Modal Handlers
  const btnDevSpecs = document.getElementById("btnDevSpecs");
  const btnFooterTechSpecs = document.getElementById("btnFooterTechSpecs");
  const techSpecsModal = document.getElementById("techSpecsModal");
  const btnCloseTechSpecsModal = document.getElementById("btnCloseTechSpecsModal");
  const btnCloseTechSpecsBtn = document.getElementById("btnCloseTechSpecsBtn");

  if (btnDevSpecs && techSpecsModal) {
    btnDevSpecs.addEventListener("click", () => techSpecsModal.classList.remove("hidden"));
  }
  if (btnFooterTechSpecs && techSpecsModal) {
    btnFooterTechSpecs.addEventListener("click", () => techSpecsModal.classList.remove("hidden"));
  }
  if (btnCloseTechSpecsModal && techSpecsModal) {
    btnCloseTechSpecsModal.addEventListener("click", () => techSpecsModal.classList.add("hidden"));
  }
  if (btnCloseTechSpecsBtn && techSpecsModal) {
    btnCloseTechSpecsBtn.addEventListener("click", () => techSpecsModal.classList.add("hidden"));
  }
}

/**
 * Display Contract Address & Owner in Technical Details
 */
function updateContractAddressDisplay() {
  if (typeof CONTRACT_ADDRESS !== "undefined" && CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    if (displayContractAddress) displayContractAddress.innerText = CONTRACT_ADDRESS;
  } else {
    if (displayContractAddress) displayContractAddress.innerText = "Contract Not Deployed Yet";
  }
}

/**
 * Setup MetaMask Change Listeners
 */
function setupMetaMaskListeners() {
  window.ethereum.on("accountsChanged", async (accounts) => {
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
  if (network.chainId === 31337n || network.chainId === 31337) {
    networkDot.className = "status-dot connected";
    networkName.innerText = "System Online";
  } else {
    networkDot.className = "status-dot warning";
    networkName.innerText = `Chain ID ${network.chainId} (Switch Needed)`;
  }
}

/**
 * Initial connection check on page load
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

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    
    if (accounts.length > 0) {
      userAddress = accounts[0];
      
      provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 31337n && network.chainId !== 31337) {
        showStatus("warning", "Wrong Network", "Switching MetaMask to Hardhat Localhost (Chain ID 31337)...");
        await promptAddHardhatNetwork();
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      signer = await provider.getSigner();
      updateWalletUI(true);
      await loadContractData();

      showStatus("success", "Wallet Connected", `Connected to ${truncateAddress(userAddress)}`);
    }
  } catch (error) {
    console.error("Connection error:", error);
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

    // 1. Fetch Election Summary from Contract
    const [title, desc, cnt, totalVotesCast, active, start, end, ownerAddr] = await readOnlyContract.getElectionSummary();
    
    totalVotes = Number(totalVotesCast);
    isVotingActive = Boolean(active);
    startTimestamp = Number(start);
    endTimestamp = Number(end);
    contractOwner = ownerAddr;

    // 2. Update Election Header Details
    if (title && electionTitleDisplay) electionTitleDisplay.innerText = title;
    if (desc && electionDescDisplay) electionDescDisplay.innerText = desc;
    if (displayContractOwner) displayContractOwner.innerText = contractOwner;

    if (displayStartTime) displayStartTime.innerText = formatDate(startTimestamp);
    if (displayEndTime) displayEndTime.innerText = formatDate(endTimestamp);

    // Update Status Indicator Pill
    if (votingStatusIndicator && votingStatusText) {
      if (isVotingActive) {
        votingStatusIndicator.className = "status-indicator active";
        votingStatusText.innerText = "● ACTIVE";
      } else {
        votingStatusIndicator.className = "status-indicator closed";
        votingStatusText.innerText = "🔴 VOTING CLOSED";
      }
    }

    // Start Live Countdown Timer
    startCountdownTimer();

    // 3. Update Metrics Summary
    if (statCandidateCount) statCandidateCount.innerText = cnt.toString();
    if (statTotalVotes) statTotalVotes.innerText = totalVotes.toString();
    if (statWalletsVoted) statWalletsVoted.innerText = totalVotes.toString();

    if (resTotalVotes) resTotalVotes.innerText = totalVotes.toString();
    if (resCandidates) resCandidates.innerText = cnt.toString();
    if (resWallets) resWallets.innerText = totalVotes.toString();

    // 4. Check User Voting Eligibility
    if (userAddress) {
      hasVoted = await readOnlyContract.hasUserVoted(userAddress);
      if (hasVoted) {
        statUserEligibility.innerText = "Voted ✓";
        statUserEligibility.style.color = "var(--success)";
        alreadyVotedBanner.classList.remove("hidden");
      } else {
        statUserEligibility.innerText = "Eligible to Vote";
        statUserEligibility.style.color = "var(--secondary)";
        alreadyVotedBanner.classList.add("hidden");
      }
    } else {
      hasVoted = false;
      statUserEligibility.innerText = "Connect Wallet";
      statUserEligibility.style.color = "var(--text-muted)";
      alreadyVotedBanner.classList.add("hidden");
    }

    // 5. Fetch Candidates
    const rawCandidates = await readOnlyContract.getAllCandidates();
    candidates = rawCandidates.map((c) => ({
      id: Number(c.id),
      name: c.name,
      description: c.description || "Candidate for Student Council",
      avatarUrl: c.avatarUrl || "general",
      voteCount: Number(c.voteCount),
    }));

    // 6. Render UI
    renderCandidateCards();
    renderResultsAnalytics();
    await loadActivityLog();

  } catch (error) {
    console.error("Failed to load contract data:", error);
    candidateGrid.innerHTML = `
      <div class="loading-spinner-container">
        <p style="color: var(--danger)">⚠️ Error loading contract data. Please verify Hardhat local node is running.</p>
        <code style="margin-top:8px">${error.message || error}</code>
      </div>
    `;
  }
}

/**
 * Start Live Countdown Timer
 */
function startCountdownTimer() {
  if (countdownInterval) clearInterval(countdownInterval);

  function updateTimer() {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTimestamp - now;

    if (remaining <= 0 || !isVotingActive) {
      if (timerDays) timerDays.innerText = "00";
      if (timerHours) timerHours.innerText = "00";
      if (timerMinutes) timerMinutes.innerText = "00";
      if (timerSeconds) timerSeconds.innerText = "00";
      
      if (votingStatusIndicator) votingStatusIndicator.className = "status-indicator closed";
      if (votingStatusText) votingStatusText.innerText = "🔴 VOTING CLOSED";

      renderResultsAnalytics();
      renderCandidateCards();
      return;
    }

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = Math.floor(remaining % 60);

    timerDays.innerText = padZero(days);
    timerHours.innerText = padZero(hours);
    timerMinutes.innerText = padZero(minutes);
    timerSeconds.innerText = padZero(seconds);
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

/**
 * Render Candidate Ballot Cards Grid (Req #3 & Req #15)
 */
function renderCandidateCards() {
  if (candidates.length === 0) {
    candidateGrid.innerHTML = `<p style="color: var(--text-muted)">No candidates registered yet.</p>`;
    return;
  }

  candidateGrid.innerHTML = candidates
    .map((candidate) => {
      const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
      const progressWidth = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : 0;
      
      const avatarStyle = AVATAR_COLORS[candidate.avatarUrl.toLowerCase()] || AVATAR_COLORS.general;

      let btnDisabled = false;
      let btnText = "CAST VOTE";
      let btnClass = "btn-primary";

      if (!userAddress) {
        btnDisabled = false;
        btnText = "Connect to Vote";
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
        <div class="candidate-card" id="candidate-card-${candidate.id}">
          <div class="card-top">
            <div class="cand-img-wrapper" style="background: ${avatarStyle.bg}">
              <div class="cand-avatar-img">
                <i class="fa-solid ${avatarStyle.icon}"></i>
              </div>
            </div>
            <span class="cand-id-badge">Candidate #${candidate.id}</span>
            <h4 class="cand-name">${escapeHtml(candidate.name)}</h4>
            <p class="cand-motto">"${escapeHtml(candidate.description)}"</p>
          </div>

          <div class="vote-stat-box">
            <div class="vote-stat-num">${candidate.voteCount}</div>
            <div class="vote-stat-lbl">Votes Received</div>
          </div>

          <div class="progress-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${progressWidth}%"></div>
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
            aria-label="Vote for ${escapeHtml(candidate.name)}"
          >
            <i class="fa-solid fa-check-to-slot"></i>
            ${btnText}
          </button>
        </div>
      `;
    })
    .join("");
}

/**
 * Render Live Results Leaderboard (Req #10)
 */
function renderResultsAnalytics() {
  if (!candidates || candidates.length === 0) {
    if (resultsBars) resultsBars.innerHTML = `<p style="color: var(--text-muted)">No candidate analytics available.</p>`;
    return;
  }

  const result = calculateElectionResult(candidates, totalVotes, isVotingActive, startTimestamp, endTimestamp);

  const winnerBanner = document.getElementById("winnerBanner");
  const winnerBannerTitle = document.getElementById("winnerBannerTitle");
  const winnerBannerSub = document.getElementById("winnerBannerSub");

  if (result.bannerType !== "hidden") {
    if (winnerBanner) {
      winnerBanner.classList.remove("hidden");
      if (result.isTie) {
        winnerBanner.className = "winner-banner tie";
      } else {
        winnerBanner.className = "winner-banner";
      }
    }
    if (winnerBannerTitle) winnerBannerTitle.innerText = result.bannerTitle;
    if (winnerBannerSub) winnerBannerSub.innerText = result.bannerSub;
  } else if (winnerBanner) {
    winnerBanner.classList.add("hidden");
  }

  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  if (resultsBars) {
    resultsBars.innerHTML = sorted
      .map((candidate) => {
        const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
        const voteText = candidate.voteCount === 1 ? "1 vote" : `${candidate.voteCount} votes`;
        const isWinnerRow = result.hasWinner && result.winner && candidate.id === result.winner.id;
        const crownBadge = isWinnerRow ? ` <span title="Winner" style="color: #f59e0b; font-weight:800; margin-left:6px;">👑 WINNER</span>` : "";

        return `
          <div class="result-row ${isWinnerRow ? "winner-row" : ""}">
            <div class="result-info">
              <span>Candidate #${candidate.id} - ${escapeHtml(candidate.name)}${crownBadge}</span>
              <span>${voteText} (${percentage}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }
}

/**
 * Query On-Chain Event Logs for Blockchain Activity Feed (Req #9)
 */
async function loadActivityLog() {
  try {
    if (!readOnlyContract) return;

    const filter = readOnlyContract.filters.Voted();
    const events = await readOnlyContract.queryFilter(filter, -100);

    if (events.length === 0) {
      activityList.innerHTML = `<p class="no-activity">No vote transactions recorded on-chain yet.</p>`;
      return;
    }

    events.reverse();

    activityList.innerHTML = events.slice(0, 5).map((evt) => {
      const { voter, candidateId, candidateName, newVoteCount } = evt.args;
      return `
        <div class="activity-item">
          <div class="activity-left">
            <div class="act-icon"><i class="fa-solid fa-cube"></i></div>
            <div>
              <div><strong>${truncateAddress(voter)}</strong> voted for <strong>${escapeHtml(candidateName)}</strong> (ID #${candidateId})</div>
              <div style="font-size:0.75rem; color:var(--text-muted)">Tx: ${truncateAddress(evt.transactionHash)} • Block #${evt.blockNumber}</div>
            </div>
          </div>
          <span class="badge badge-accent">Confirmed</span>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.warn("Could not fetch activity log:", err);
  }
}

/**
 * Handle Casting a Vote
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
      showStatus("error", "Vote Rejected", "This wallet address has already cast a vote in this election.");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    let network = await provider.getNetwork();

    if (network.chainId !== 31337n && network.chainId !== 31337) {
      showStatus("warning", "Wrong Network", "Switching MetaMask to Hardhat Localhost (Chain ID 31337)...");
      await promptAddHardhatNetwork();
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    signer = await provider.getSigner();

    const btnTarget = document.querySelector(`#candidate-card-${candidateId} .btn-vote`);
    if (btnTarget) {
      btnTarget.disabled = true;
      btnTarget.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Casting Vote...`;
    }

    showStatus("info", "Waiting for MetaMask...", `Please confirm transaction in MetaMask to vote for Candidate #${candidateId}.`);

    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const tx = await contractWithSigner.vote(candidateId);

    showStatus("info", "Transaction Submitted", "Waiting for blockchain block confirmation...", tx.hash);

    const receipt = await tx.wait();

    const targetCand = candidates.find(c => c.id === candidateId);
    showVoteConfirmationModal(
      targetCand ? targetCand.name : `Candidate #${candidateId}`,
      userAddress,
      receipt.hash,
      receipt.blockNumber
    );

    showStatus("success", "Vote Confirmed! 🎉", `Your vote for Candidate #${candidateId} was successfully recorded on-chain.`, receipt.hash);

    await loadContractData();

  } catch (error) {
    console.error("Voting error:", error);
    let errorMsg = "Transaction failed or was rejected in MetaMask.";

    if (error.reason) {
      errorMsg = error.reason;
    } else if (error.message && error.message.includes("user rejected")) {
      errorMsg = "Transaction cancelled: You rejected the transaction in MetaMask.";
    }

    showStatus("error", "Vote Failed", errorMsg);
    await loadContractData();
  }
}

/**
 * Display Vote Confirmation Modal
 */
function showVoteConfirmationModal(candName, voterAddr, txHash, blockNum) {
  modalCandName.innerText = candName;
  modalVoterAddr.innerText = truncateAddress(voterAddr);
  modalTxHash.innerText = txHash;
  modalBlockNum.innerText = `#${blockNum}`;
  voteConfirmModal.classList.remove("hidden");
}

/**
 * Real-Time Web3 Event Subscriptions
 */
function subscribeToContractEvents() {
  if (!readOnlyContract) return;

  try {
    readOnlyContract.removeAllListeners("Voted");
    readOnlyContract.on("Voted", (voter, candidateId, candidateName, newVoteCount, timestamp) => {
      console.log(`[Web3 Event] New Vote Cast! Voter: ${voter}, Candidate: ${candidateName}`);
      loadContractData();
    });
  } catch (err) {
    console.warn("Could not subscribe to events:", err);
  }
}

/**
 * UI Utility Helpers
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

function formatDate(timestampSeconds) {
  if (!timestampSeconds) return "N/A";
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function padZero(num) {
  return num < 10 ? `0${num}` : num;
}

function showStatus(type, title, message, txHash = null) {
  statusBanner.className = `status-banner ${type}`;
  statusBanner.classList.remove("hidden");

  const icons = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };

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
