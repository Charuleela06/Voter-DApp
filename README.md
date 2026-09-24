# 🗳️ Decentralized Voting System using Blockchain (DApp)

> A production-grade, highly responsive, secure **Decentralized Voting Web3 Application (DApp)** designed for educational college mini-projects, built using **Solidity (`v0.8.24`)**, **Hardhat**, **ethers.js v6**, **MetaMask**, and **Vanilla HTML5/CSS3/JavaScript**.

---

## 📸 Overview & Key Highlights

- **Dual-Portal Interface:** Separate Voter Portal (`index.html`) and Admin Portal (`admin.html`).
- **Dynamic Light & Dark Theme:** Built-in theme switcher persistent across page reloads via `localStorage`.
- **On-Chain Security:** 1 Wallet = 1 Vote enforced strictly at the EVM level (`require(!hasVoted[msg.sender])`).
- **Scheduled Elections:** Dynamic startTime & endTime validation with ticking live countdown timers.
- **Live On-Chain Election Results:** Instant tallying, vote share progress percentage bars, participating wallet counters, and automatic single winner / tie announcement banners.
- **Owner Admin Management:** Candidate registration and election scheduling restricted by smart contract `onlyOwner` modifier.

---

## 🏗️ System Architecture & Web3 Data Flow

```text
  +-------------------------------------------------------------------------+
  |                             USER INTERFACE                              |
  |   Voter Portal (index.html)     <--------->     Admin Portal (admin.html)|
  |   (HTML5, Glassmorphic CSS3, Vanilla JS ES6+, Light/Dark Theme Engine)  |
  +-------------------------------------------------------------------------+
                                       |
                                       v (1) Web3 Calls & Transaction Signing
  +-------------------------------------------------------------------------+
  |                     ETHERS.JS V6 & METAMASK WALLET                      |
  |   - Browser Provider / Signer Integration                               |
  |   - Cryptographic EIP-1193 Transaction Signing                          |
  +-------------------------------------------------------------------------+
                                       |
                                       v (2) JSON-RPC Encrypted Protocol
  +-------------------------------------------------------------------------+
  |                     LOCAL HARDHAT ETHEREUM NODE                         |
  |   - RPC Endpoint: http://127.0.0.1:8545                                 |
  |   - Network Chain ID: 31337 (0x7a69)                                    |
  +-------------------------------------------------------------------------+
                                       |
                                       v (3) EVM State Execution & Validation
  +-------------------------------------------------------------------------+
  |                     VOTING.SOL SMART CONTRACT                           |
  |   - State Mapping: mapping(address => bool) public hasVoted             |
  |   - Array Storage: Candidate[] public candidates                        |
  |   - Access Modifier: modifier onlyOwner()                               |
  |   - Timing Checks: require(block.timestamp >= startTime && <= endTime)  |
  +-------------------------------------------------------------------------+
```

---

## 📁 Complete Project Directory Structure

```text
DApp/
├── blockchain/                      # Smart Contract & Hardhat Backend
│   ├── contracts/
│   │   └── Voting.sol               # Core Solidity smart contract logic
│   ├── scripts/
│   │   └── deploy.js                # Hardhat deployment & auto-config script
│   ├── test/
│   │   └── Voting.test.js           # 16-step automated Hardhat unit test suite
│   ├── hardhat.config.js            # Hardhat configuration (Solidity 0.8.24)
│   └── package.json                 # Hardhat dependencies & scripts
│
├── frontend/                        # Web3 Client Interface
│   ├── index.html                   # Voter Portal Dashboard
│   ├── admin.html                   # Admin Management Portal
│   ├── app.js                       # Voter Portal logic & Web3 event handlers
│   ├── admin.js                     # Admin Portal logic & contract execution
│   ├── contractConfig.js            # Auto-generated contract ABI & deployment address
│   └── style.css                    # Glassmorphic Dark/Light CSS design system
│
└── README.md                        # Complete project documentation & presentation guide
```

---

## 📌 Feature Deep Dive

### 1. 🌓 Light / Dark Theme Engine
- Integrated theme switcher button in the top navigation header on both `index.html` and `admin.html`.
- Smooth color transition utilizing CSS custom variables HSL design tokens.
- Remembers user selection in browser `localStorage`.

### 2. 🗳️ Voter Portal (`index.html`)
- **Header Bar:** Navigation links, live network connection indicator (`Network: Hardhat Localhost`), shortened wallet address display (`0x71A4...92F8`), and one-click copy address button.
- **Election Announcement Banner:** Displays election title, description, start timestamp, end timestamp, and live status badge (`🟢 ELECTION IN PROGRESS` or `🔴 VOTING CLOSED`).
- **Live Countdown Timer:** Displays ticking days, hours, minutes, and seconds (`02d : 14h : 37m : 21s`) synchronized with smart contract block timestamps.
- **Interactive Candidate Grid:** Responsive candidate cards featuring avatars, candidate IDs, slogans/descriptions, current vote count, percentage share bars, and a `[ CAST VOTE ]` button with loading state feedback.
- **On-Chain Double Vote Shield:** Instantly detects if the connected wallet has voted and locks interface buttons with a clean notice (`✓ Vote Already Cast`).
- **Vote Confirmation Modal:** Triggers on successful vote transaction with checkmark animation, selected candidate details, wallet address, block number, transaction hash, and a copy tx hash button.

### 3. 👑 Admin Management Portal (`admin.html`)
- **Access Control Shield:** Auto-detects connected wallet address against contract `owner()`. If non-owner accesses the page, displays an `Admin Access Required` protection card and disables owner-only controls.
- **Election Status Toggle:** One-click manual start and stop election buttons sending `setVotingActive(bool)` transactions to the blockchain.
- **Election Schedule Manager:** Interface allowing admins to pick Start Date/Time and End Date/Time (12-hour AM/PM format), converting them into EVM Unix timestamps passed directly to `setElectionSchedule()`.
- **Candidate Registration:** Form to dynamically register candidates (*Name*, *Motto/Description*, *Avatar Icon*) prior to voting commencement.

### 4. 📊 Live Election Results & Winner Calculation
- Real-time vote calculation reading directly from EVM storage without intermediate databases.
- Summary statistical metrics: **Total Votes Recorded**, **Registered Candidates**, and **Unique Participating Wallets**.
- Animated percentage progress bars for candidate vote share.
- **Smart Winner / Tie Announcement Banner:**
  - **In Progress:** Displays live status and dynamic counts.
  - **Single Winner:** Displays `🏆 Winner: [Candidate Name] with X Votes!` when voting ends.
  - **Tie Outcome:** Displays `🤝 Election Ended in a Tie between [Candidate A] and [Candidate B]`.

### 5. 🔍 Technical Specs Modal
- Accessible via the "Technical Specs" footer button on both pages.
- Details Smart Contract info (Contract Name, Address, Owner Wallet Address, Chain ID `31337`, RPC Endpoint) and security architecture highlights.

---

## 📜 Smart Contract Architecture (`Voting.sol`)

### Contract Details
- **Solidity Version:** `^0.8.24`
- **License:** `MIT`

### Data Structures & State Variables
```solidity
struct Candidate {
    uint256 id;
    string name;
    string description;
    string avatarKey;
    uint256 voteCount;
}

address public owner;
string public electionTitle;
string public electionDescription;
uint256 public startTime;
uint256 public endTime;
bool public isVotingActive;

Candidate[] public candidates;
mapping(address => bool) public hasVoted;
address[] public votedWallets;
```

### Events Emitted
```solidity
event VoteCast(uint256 indexed candidateId, address indexed voter);
event ElectionStatusChanged(bool isActive);
event CandidateAdded(uint256 indexed candidateId, string name);
event ElectionScheduleUpdated(uint256 startTime, uint256 endTime);
```

### Function Reference Table

| Function Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `vote(uint256 candidateId)` | Write | Any Wallet | Casts vote for candidate ID. Validates non-voted status and timing. |
| `setVotingActive(bool isActive)` | Write | `onlyOwner` | Manually starts or stops the election. |
| `setElectionSchedule(uint256, uint256)` | Write | `onlyOwner` | Sets contract `startTime` and `endTime` Unix timestamps. |
| `addCandidate(string, string, string)` | Write | `onlyOwner` | Registers a new candidate before voting begins. |
| `getAllCandidates()` | View | Public | Returns array of all registered candidates and vote counts. |
| `getElectionDetails()` | View | Public | Returns title, description, startTime, endTime, and active status. |
| `hasAddressVoted(address voter)` | View | Public | Returns `true` if target wallet address has already voted. |
| `getParticipatingWalletsCount()` | View | Public | Returns count of unique wallet addresses that have cast votes. |

---

## 🛠️ Technology Stack & Dependencies

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Smart Contract** | Solidity | `^0.8.24` | Core immutable business logic and EVM state storage. |
| **Development Environment** | Hardhat | `^2.22.0` | Local EVM blockchain server, compilation, & testing framework. |
| **Web3 Library** | ethers.js | `v6.13.0` | Client-side provider/signer, JSON-RPC communication, contract ABI calls. |
| **Browser Wallet** | MetaMask | Extension | Client-side cryptographic transaction signing and account management. |
| **Frontend UI** | HTML5 / CSS3 / JS | Vanilla ES6+ | Responsive Web UI, HSL color tokens, Flexbox/Grid, Glassmorphic UI. |
| **Web Server** | http-server | Node CLI | Static HTTP web server for hosting frontend files locally. |

---

## 🚀 Step-by-Step Setup & Running Guide

### **Prerequisites**
- [Node.js (v18+ recommended)](https://nodejs.org/)
- [MetaMask Extension](https://metamask.io/) installed in your browser.

---

### **Step 1: Install Dependencies**
Open terminal in the project root:
```bash
cd blockchain
npm install
```

---

### **Step 2: Run Smart Contract Unit Tests**
Verify contract integrity before deployment:
```bash
npm test
```
* **Expected Output:** `16 passing` unit tests covering all functions, modifiers, time checks, and double-voting prevention.

---

### **Step 3: Start Local Hardhat Blockchain Node**
In your first terminal window:
```bash
cd blockchain
npx hardhat node
```
* Starts a local Ethereum RPC node listening at `http://127.0.0.1:8545` (Chain ID: `31337`).
* Displays 20 pre-funded test accounts with 10,000 ETH each and their corresponding private keys.

---

### **Step 4: Deploy Smart Contract to Local Node**
In a second terminal window:
```bash
cd blockchain
npm run deploy:local
```
* Compiles `Voting.sol`.
* Deploys the contract to local Hardhat node (`0x123...`).
* Auto-exports updated ABI and contract address directly into `frontend/contractConfig.js`.

---

### **Step 5: Launch Frontend HTTP Web Server**
In a third terminal window:
```bash
npx http-server frontend -p 3000 --cors
```
Open your browser and navigate to:
- **Voter Portal:** `http://127.0.0.1:3000`
- **Admin Portal:** `http://127.0.0.1:3000/admin.html`

---

## 🦊 MetaMask Setup & Hardhat Integration

### 1. Add Hardhat Custom RPC Network
1. Open MetaMask extension.
2. Click Network Dropdown -> **Add Network** -> **Add a network manually**.
3. Fill in the network details:
   - **Network Name:** ``
   - **New RPC URL:** ``
   - **Chain ID:** ``
   - **Currency Symbol:** ``
4. Click **Save**.

### 2. Import Hardhat Test Accounts
Import private keys from the Hardhat node terminal:
- **Account #0 (Deployer / Contract Owner / Admin):**

- **Account #1 (Voter A):**

- **Account #2 (Voter B):**

Hardhat provides pre-funded local test accounts for development. Their private keys are displayed by the local Hardhat node and must only be used on the local Hardhat network.
---

## 🎓 College Viva / Technical Defense Q&A

### Q1: Is this voting application completely anonymous?
**Answer:** Public Ethereum blockchains are **pseudonymous**, not completely anonymous. Every transaction is tied to a public wallet address (`msg.sender`). While real names are not stored on-chain, wallet addresses are visible. For complete vote privacy in production, zero-knowledge proofs (zk-SNARKs) or ring signatures can be integrated.

### Q2: Why is double-voting prevented on the smart contract rather than just the frontend?
**Answer:** Frontend checks (such as disabling UI buttons or saving state in local browser storage) can be easily bypassed by sending direct JSON-RPC calls or using custom scripts. Smart contracts execute on every node in the blockchain network; enforcing `require(!hasVoted[msg.sender])` inside `Voting.sol` guarantees EVM-level execution security that cannot be tampered with.

### Q3: How does the admin access control work?
**Answer:** When `Voting.sol` is deployed, `msg.sender` (the deployer wallet) is stored in the immutable `owner` state variable. Admin functions like `addCandidate` and `setVotingActive` utilize the `onlyOwner` modifier (`require(msg.sender == owner, "Only contract owner can call this")`). If any non-owner address attempts to execute these functions, the EVM immediately reverts the transaction.

### Q4: How are live countdown timers synchronized with the blockchain?
**Answer:** Blockchain smart contracts do not have internal timer loops or cron jobs. Instead, `Voting.sol` stores Unix timestamps for `startTime` and `endTime`. The smart contract checks `block.timestamp` during vote execution. The frontend periodically fetches these timestamps and compares them with the browser clock to display an active countdown timer.

### Q5: What is the purpose of ethers.js v6 in this project?
**Answer:** `ethers.js v6` acts as the bridge between the JavaScript frontend UI and the Ethereum EVM node. It wraps window.ethereum (MetaMask) as a BrowserProvider, handles contract ABI serialization/deserialization, signs transactions using private keys, and reads contract storage states asynchronously.

---

## ⚠️ Educational Scope & Disclaimer

This project is built as an **Educational College Mini-Project** demonstrating Web3 DApp development, smart contract security, EVM state management, and modern responsive frontend design. Test private keys included in documentation are for local development on Hardhat Localhost (`Chain ID 31337`) only.
