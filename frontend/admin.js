/**
 * Admin Portal JavaScript Logic - admin.js
 * Dedicated Web3 interface for Contract Owner Admin Functions
 */

let provider = null;
let signer = null;
let userAddress = null;
let readOnlyContract = null;
let contractOwner = null;
let currentStartTimestamp = 0;
let currentEndTimestamp = 0;
let totalVotes = 0;
let isVotingActive = true;

const localRpcProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

// DOM Elements
const btnConnectWallet = document.getElementById("btnConnectWallet");
const walletPill = document.getElementById("walletPill");
const walletAddressDisplay = document.getElementById("walletAddressDisplay");
const walletAvatar = document.getElementById("walletAvatar");
const btnCopyAddress = document.getElementById("btnCopyAddress");

const networkDot = document.getElementById("networkDot");
const networkName = document.getElementById("networkName");

const electionTitleDisplay = document.getElementById("electionTitleDisplay");
const electionDescDisplay = document.getElementById("electionDescDisplay");
const adminAccessIndicator = document.getElementById("adminAccessIndicator");
const adminAccessText = document.getElementById("adminAccessText");

const adminNoticeBox = document.getElementById("adminNoticeBox");
const adminNoticeText = document.getElementById("adminNoticeText");
const adminControlsArea = document.getElementById("adminControlsArea");

const btnAdminStart = document.getElementById("btnAdminStart");
const btnAdminStop = document.getElementById("btnAdminStop");

// 12-Hour Schedule Elements with AM/PM
const formSetSchedule = document.getElementById("formSetSchedule");
const startDateInput = document.getElementById("startDateInput");
const startHourInput = document.getElementById("startHourInput");
const startMinInput = document.getElementById("startMinInput");
const startAmPmInput = document.getElementById("startAmPmInput");

const endDateInput = document.getElementById("endDateInput");
const endHourInput = document.getElementById("endHourInput");
const endMinInput = document.getElementById("endMinInput");
const endAmPmInput = document.getElementById("endAmPmInput");

// Candidate Elements
const formAddCandidate = document.getElementById("formAddCandidate");
const inputCandName = document.getElementById("inputCandName");
const inputCandDesc = document.getElementById("inputCandDesc");
const selectCandAvatar = document.getElementById("selectCandAvatar");

const adminCandList = document.getElementById("adminCandList");
const displayContractAddress = document.getElementById("displayContractAddress");
const displayContractOwner = document.getElementById("displayContractOwner");

const statusBanner = document.getElementById("statusBanner");
const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const statusMessage = document.getElementById("statusMessage");
const txHashWrapper = document.getElementById("txHashWrapper");
const txHashLink = document.getElementById("txHashLink");
const btnCloseStatus = document.getElementById("btnCloseStatus");

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initEventListeners();

  if (typeof CONTRACT_ADDRESS !== "undefined" && CONTRACT_ADDRESS.length > 10) {
    displayContractAddress.innerText = CONTRACT_ADDRESS;
    readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, localRpcProvider);
  }

  if (typeof window.ethereum !== "undefined") {
    setupMetaMaskListeners();
    await checkConnectionAndLoad();
  } else {
    await loadContractData();
    showStatus("info", "Read-Only Mode", "MetaMask extension not detected. Connect owner wallet to perform admin actions.");
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

function initEventListeners() {
  btnConnectWallet.addEventListener("click", connectWallet);

  btnCopyAddress.addEventListener("click", () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      showStatus("info", "Address Copied", "Wallet address copied to clipboard!");
    }
  });

  btnCloseStatus.addEventListener("click", () => {
    statusBanner.classList.add("hidden");
  });

  btnAdminStart.addEventListener("click", () => handleAdminToggleStatus(true));
  btnAdminStop.addEventListener("click", () => handleAdminToggleStatus(false));
  formSetSchedule.addEventListener("submit", handleAdminSetSchedule);
  formAddCandidate.addEventListener("submit", handleAdminAddCandidate);

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

  window.ethereum.on("chainChanged", () => {
    window.location.reload();
  });
}

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

    return true;
  } catch (error) {
    console.error("Web3 init error:", error);
    return false;
  }
}

function updateNetworkBadge(network) {
  if (network.chainId === 31337n || network.chainId === 31337) {
    networkDot.className = "status-dot connected";
    networkName.innerText = "System Online";
  } else {
    networkDot.className = "status-dot warning";
    networkName.innerText = `Chain ID ${network.chainId} (Switch Needed)`;
  }
}

async function checkConnectionAndLoad() {
  await initWeb3Provider();
  await loadContractData();
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is required.");
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
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: NETWORK_CONFIG.chainId }],
        });
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      signer = await provider.getSigner();
      updateWalletUI(true);
      await loadContractData();

      showStatus("success", "Wallet Connected", `Connected to ${truncateAddress(userAddress)}`);
    }
  } catch (error) {
    console.error("Connect error:", error);
    showStatus("error", "Connection Failed", error.message);
  } finally {
    btnConnectWallet.disabled = false;
    btnConnectWallet.innerText = "Connect Wallet";
  }
}

async function loadContractData() {
  try {
    if (!readOnlyContract) return;

    const [title, desc, cnt, totalVotesCast, active, start, end, ownerAddr] = await readOnlyContract.getElectionSummary();
    
    contractOwner = ownerAddr;
    currentStartTimestamp = Number(start);
    currentEndTimestamp = Number(end);
    totalVotes = Number(totalVotesCast);
    isVotingActive = Boolean(active);

    if (displayContractOwner) displayContractOwner.innerText = contractOwner;
    if (electionTitleDisplay) electionTitleDisplay.innerText = title;
    if (electionDescDisplay) electionDescDisplay.innerText = desc;

    // Populate 12-hour AM/PM pickers with current contract timestamps
    if (startDateInput) {
      populate12HourPicker(currentStartTimestamp, startDateInput, startHourInput, startMinInput, startAmPmInput);
    }
    if (endDateInput) {
      populate12HourPicker(currentEndTimestamp, endDateInput, endHourInput, endMinInput, endAmPmInput);
    }

    updateAdminAccessUI();

    const rawCandidates = await readOnlyContract.getAllCandidates();
    renderAdminCandList(rawCandidates);
    renderAdminElectionResults(rawCandidates);

  } catch (error) {
    console.error("Load contract data error:", error);
  }
}

function updateAdminAccessUI() {
  if (!contractOwner) return;

  const isOwner = userAddress && userAddress.toLowerCase() === contractOwner.toLowerCase();

  if (isOwner) {
    adminAccessIndicator.className = "status-indicator active";
    adminAccessText.innerText = "● Owner Wallet Connected";
    adminNoticeBox.classList.add("hidden");
    adminControlsArea.classList.remove("disabled-area");
  } else {
    adminAccessIndicator.className = "status-indicator closed";
    adminAccessText.innerText = "🔴 Admin Access Restricted";
    adminNoticeBox.classList.remove("hidden");
    adminControlsArea.classList.add("disabled-area");

    if (userAddress) {
      adminNoticeText.innerText = `Only the designated Election Admin wallet can perform admin management.`;
    } else {
      adminNoticeText.innerText = `Please connect the Election Admin wallet to perform admin management.`;
    }
  }
}

function renderAdminCandList(candList) {
  if (candList.length === 0) {
    adminCandList.innerHTML = `<p style="color: var(--text-muted)">No candidates registered.</p>`;
    return;
  }

  adminCandList.innerHTML = candList.map((c) => `
    <div class="result-row">
      <div class="result-info">
        <span>Candidate #${c.id}: ${escapeHtml(c.name)} - "${escapeHtml(c.description)}"</span>
        <span>${c.voteCount} Votes</span>
      </div>
    </div>
  `).join("");
}

async function handleAdminToggleStatus(activate) {
  try {
    if (!signer) {
      showStatus("warning", "Admin Error", "Please connect contract owner wallet.");
      return;
    }

    showStatus("info", "Updating Election Status...", `Please confirm transaction in MetaMask to ${activate ? "open" : "close"} voting.`);

    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contractWithSigner.setVotingActive(activate);
    await tx.wait();

    showStatus("success", "Status Updated", `Voting status changed to: ${activate ? "ACTIVE" : "CLOSED"}`);
    await loadContractData();

  } catch (err) {
    console.error("Admin toggle status error:", err);
    showStatus("error", "Admin Action Failed", err.reason || err.message);
  }
}

async function handleAdminSetSchedule(e) {
  e.preventDefault();
  try {
    const startUnix = parse12HourDateTime(startDateInput.value, startHourInput.value, startMinInput.value, startAmPmInput.value);
    const endUnix = parse12HourDateTime(endDateInput.value, endHourInput.value, endMinInput.value, endAmPmInput.value);

    if (isNaN(startUnix) || isNaN(endUnix)) {
      showStatus("error", "Invalid Input", "Please enter valid dates, hours (1-12), and minutes (0-59).");
      return;
    }

    if (endUnix <= startUnix) {
      showStatus("error", "Invalid Schedule", "End Date & Time must be after Start Date & Time.");
      return;
    }

    if (!signer) {
      showStatus("warning", "Admin Error", "Please connect contract owner wallet.");
      return;
    }

    showStatus("info", "Updating Schedule on Blockchain...", "Please confirm transaction in MetaMask to set new election timestamps.");

    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contractWithSigner.setElectionTimestamps(startUnix, endUnix);
    await tx.wait();

    showStatus("success", "Schedule Updated! 🎉", "New election start and end timestamps recorded on the smart contract.");
    await loadContractData();

  } catch (err) {
    console.error("Admin schedule error:", err);
    showStatus("error", "Schedule Update Failed", err.reason || err.message);
  }
}

async function handleAdminAddCandidate(e) {
  e.preventDefault();
  try {
    const name = inputCandName.value.trim();
    const desc = inputCandDesc.value.trim();
    const avatar = selectCandAvatar.value;

    if (!name || !desc) return;

    if (!signer) {
      showStatus("warning", "Admin Error", "Please connect contract owner wallet.");
      return;
    }

    showStatus("info", "Adding Candidate...", `Please confirm transaction in MetaMask to register ${name}.`);

    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contractWithSigner.addCandidate(name, desc, avatar);
    await tx.wait();

    showStatus("success", "Candidate Registered! 🎉", `Successfully registered ${name} on the smart contract.`);
    formAddCandidate.reset();
    await loadContractData();

  } catch (err) {
    console.error("Admin add candidate error:", err);
    showStatus("error", "Candidate Registration Failed", err.reason || err.message);
  }
}

function populate12HourPicker(timestampSeconds, dateInput, hourInput, minInput, amPmInput) {
  if (!timestampSeconds) return;
  const d = new Date(timestampSeconds * 1000);
  const pad = (n) => (n < 10 ? `0${n}` : n);
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  dateInput.value = `${yyyy}-${mm}-${dd}`;

  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  hourInput.value = hours;
  minInput.value = pad(d.getMinutes());
  amPmInput.value = ampm;
}

function parse12HourDateTime(dateStr, hour12, min, amPm) {
  let h = parseInt(hour12, 10);
  if (amPm === "PM" && h < 12) h += 12;
  if (amPm === "AM" && h === 12) h = 0;
  const pad = (n) => (n < 10 ? `0${n}` : n);
  const isoString = `${dateStr}T${pad(h)}:${pad(parseInt(min, 10))}:00`;
  return Math.floor(new Date(isoString).getTime() / 1000);
}

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

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039}' }[m];
  });
}

/**
 * Render Election Results Section in Admin Portal
 */
function renderAdminElectionResults(rawCandidates) {
  if (!rawCandidates) return;

  const candidateList = rawCandidates.map((c) => ({
    id: Number(c.id),
    name: c.name,
    description: c.description || "",
    voteCount: Number(c.voteCount),
  }));

  const totalVotesCount = candidateList.reduce((acc, c) => acc + c.voteCount, 0);

  const result = calculateElectionResult(
    candidateList,
    totalVotesCount,
    isVotingActive,
    currentStartTimestamp,
    currentEndTimestamp
  );

  // Update Section Header Subtitle & Status Badge
  const adminResultsStateDesc = document.getElementById("adminResultsStateDesc");
  const adminResultsStatusText = document.getElementById("adminResultsStatusText");
  const adminResultsStatusBadge = document.getElementById("adminResultsStatusBadge");

  if (adminResultsStateDesc) adminResultsStateDesc.innerText = result.statusDesc;
  if (adminResultsStatusText) adminResultsStatusText.innerText = result.statusText;
  if (adminResultsStatusBadge) {
    if (result.isEnded) {
      adminResultsStatusBadge.className = "status-indicator closed";
    } else if (result.isInProgress) {
      adminResultsStatusBadge.className = "status-indicator active";
    } else {
      adminResultsStatusBadge.className = "status-indicator warning";
    }
  }

  // Update Summary Metrics
  const adminResTotalVotes = document.getElementById("adminResTotalVotes");
  const adminResCandidates = document.getElementById("adminResCandidates");
  const adminResWallets = document.getElementById("adminResWallets");

  if (adminResTotalVotes) adminResTotalVotes.innerText = totalVotesCount.toString();
  if (adminResCandidates) adminResCandidates.innerText = candidateList.length.toString();
  if (adminResWallets) adminResWallets.innerText = totalVotesCount.toString();

  // Update Winner / Tie Banner
  const adminWinnerBanner = document.getElementById("adminWinnerBanner");
  const adminWinnerBannerTitle = document.getElementById("adminWinnerBannerTitle");
  const adminWinnerBannerSub = document.getElementById("adminWinnerBannerSub");
  const adminWinnerIcon = document.getElementById("adminWinnerIcon");
  const adminWinnerBadgeLabel = document.getElementById("adminWinnerBadgeLabel");

  if (result.bannerType !== "hidden") {
    if (adminWinnerBanner) adminWinnerBanner.classList.remove("hidden");
    if (adminWinnerBannerTitle) adminWinnerBannerTitle.innerText = result.bannerTitle;
    if (adminWinnerBannerSub) adminWinnerBannerSub.innerText = result.bannerSub;

    if (result.isTie) {
      if (adminWinnerBanner) adminWinnerBanner.className = "winner-banner tie";
      if (adminWinnerIcon) adminWinnerIcon.innerHTML = `<i class="fa-solid fa-handshake"></i>`;
      if (adminWinnerBadgeLabel) adminWinnerBadgeLabel.innerText = "🤝 TIE RESULT";
    } else {
      if (adminWinnerBanner) adminWinnerBanner.className = "winner-banner";
      if (adminWinnerIcon) adminWinnerIcon.innerHTML = `<i class="fa-solid fa-trophy"></i>`;
      if (adminWinnerBadgeLabel) adminWinnerBadgeLabel.innerText = result.isEnded ? "🏆 WINNER" : "📊 LIVE RESULTS";
    }
  } else if (adminWinnerBanner) {
    adminWinnerBanner.classList.add("hidden");
  }

  // Render Candidate Results Breakdown Bars (Ordered by Candidate ID #1, #2, #3...)
  const adminResultsBars = document.getElementById("adminResultsBars");
  if (!adminResultsBars) return;

  if (candidateList.length === 0) {
    adminResultsBars.innerHTML = `<p style="color: var(--text-muted)">No candidate results available.</p>`;
    return;
  }

  adminResultsBars.innerHTML = candidateList.map((c) => {
    const percentage = totalVotesCount > 0 ? ((c.voteCount / totalVotesCount) * 100).toFixed(1) : "0.0";
    const voteText = c.voteCount === 1 ? "1 vote" : `${c.voteCount} votes`;
    const isWinnerRow = result.hasWinner && result.winner && c.id === result.winner.id;
    const winnerBadge = isWinnerRow ? ` <span title="Winner" style="color: #f59e0b; font-weight:800; margin-left:6px;">🏆 WINNER</span>` : "";

    return `
      <div class="result-row ${isWinnerRow ? "winner-row" : ""}">
        <div class="result-info">
          <span>Candidate #${c.id} – ${escapeHtml(c.name)}${winnerBadge}</span>
          <span>${voteText} (${percentage}%)</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}
