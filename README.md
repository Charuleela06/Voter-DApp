# Decentralized Voting System using Blockchain 🗳️⚡

> A complete, beginner-friendly **Decentralized Voting DApp** built as a college mini-project using **Solidity**, **Hardhat**, **ethers.js v6**, **MetaMask**, and **Vanilla HTML/CSS/JS**.

---

## 📌 Project Overview

Traditional voting systems rely on centralized databases, which can be vulnerable to single points of failure, administrative tampering, or data opacity. 

This **Decentralized Voting System** replaces centralized servers with an **Ethereum Smart Contract (`Voting.sol`)**. Every vote cast by a user triggers a cryptographically signed blockchain transaction through **MetaMask**. The smart contract enforces strict voting rules (e.g., **1 wallet = 1 vote**) and immutably records vote tallies on-chain.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Smart Contract** | Solidity (`^0.8.24`) | Handles candidate storage, vote casting logic, double-vote prevention, and event logging. |
| **Blockchain Dev Framework** | Hardhat | Local EVM blockchain node, compilation, unit testing suite, and contract deployment. |
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+) | Modern, glassmorphic, responsive user interface with real-time analytics. |
| **Web3 Library** | ethers.js (v6) | Connects browser UI to MetaMask wallet provider and Solidity contract ABI. |
| **Wallet Integration** | MetaMask | Client-side self-custody wallet for transaction signing and account switching. |

---

## 📁 Project Structure

```text
decentralized-voting/
│
├── blockchain/
│   ├── contracts/
│   │   └── Voting.sol            # Solidity Smart Contract logic
│   ├── scripts/
│   │   └── deploy.js             # Deployment script (deploys contract & updates frontend ABI/address)
│   ├── test/
│   │   └── Voting.test.js        # Hardhat unit tests (10 passing test cases)
│   ├── hardhat.config.js         # Hardhat network & Solidity compiler config
│   └── package.json              # Node dependencies for blockchain development
│
├── frontend/
│   ├── index.html                # Main DApp HTML structure & dashboard
│   ├── style.css                 # Custom glassmorphic dark design system
│   ├── app.js                    # ethers.js Web3 integration & UI logic
│   └── contractConfig.js         # Auto-generated contract address & ABI configuration
│
└── README.md                     # Comprehensive College Mini-Project Guide
```

---

## 🚀 Step-by-Step Execution Guide

### **Step 1: Install Dependencies**
Open terminal inside the `blockchain` directory and install required packages:
```bash
cd blockchain
npm install
```

### **Step 2: Compile the Solidity Smart Contract**
Compile `Voting.sol` using Hardhat:
```bash
npm run compile
```
* **What this does:** Compiles Solidity code into EVM bytecode and generates ABI JSON artifacts in `blockchain/artifacts/`.

### **Step 3: Run Smart Contract Unit Tests**
Verify contract security rules and edge cases:
```bash
npm test
```
* **Expected Output:** 10 passing tests covering contract initialization, successful vote casting, double voting rejection, invalid candidate ID rejection, and admin controls.

### **Step 4: Start Local Hardhat Blockchain Node**
Launch a local Ethereum RPC node listening at `http://127.0.0.1:8545`:
```bash
npx hardhat node
```
* **Keep this terminal window running.** Hardhat provides 20 pre-funded test accounts with 10,000 ETH each.

### **Step 5: Deploy Contract to Local Blockchain**
In a new terminal window, execute the deployment script:
```bash
cd blockchain
npm run deploy:local
```
* **What this does:** Deploys `Voting.sol` to the local network and automatically generates/updates `frontend/contractConfig.js` with the deployed address and complete contract ABI.

### **Step 6: Launch Frontend Application**
Start the frontend local HTTP web server:
```bash
npx http-server frontend -p 3000 --cors
```
Open your browser and navigate to `http://127.0.0.1:3000`.

---

## 🦊 Configuring MetaMask for Local Hardhat Network

To test voting via MetaMask on your local machine:

### 1. Add Custom Hardhat RPC Network to MetaMask
1. Open **MetaMask** extension &gt; click Network dropdown &gt; **Add Network** &gt; **Add a network manually**.
2. Enter the following details:
   - **Network Name:** `Hardhat Localhost`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Click **Save** and switch to `Hardhat Localhost`.

### 2. Import Test Accounts into MetaMask
To simulate multiple users voting in your college demo:
1. In MetaMask, click Account Selector &gt; **Add Account or Hardware Wallet** &gt; **Import Account**.
2. Select **Private Key** and paste one of Hardhat's default test private keys:
   - **Voter Account #0:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - **Voter Account #1:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - **Voter Account #2:** `0x5de4111ffa1ea8d2a5e045f0962d300a1172d28735a79a32c270f90a576e4136`
3. You will immediately see `10000 ETH` test balance!

---

## 🔄 User Workflow & Demonstration Steps

1. **Connect Wallet:** Click **Connect Wallet** in the top navigation bar to connect MetaMask.
2. **View Candidates:** The candidate list (Alice, Bob, Charlie, Diana) is loaded live from the smart contract state.
3. **Cast Vote:** Select a candidate and click **Cast Vote**. MetaMask will pop up requesting transaction approval.
4. **Transaction Mining:** Confirm the transaction in MetaMask. The status banner updates live while waiting for block confirmation.
5. **Double-Voting Rejection Test:** Try clicking **Cast Vote** again with the same account. The UI badge updates to `Voted ✓`, and the smart contract rejects duplicate votes on-chain.
6. **Multi-User Demonstration:** Switch accounts in MetaMask to Account #1 or #2, click **Connect Wallet**, and cast a vote from the new address to demonstrate real-time vote count accumulation!

---

## 💡 College Mini-Project Defense / Presentation Notes

### Q1: How does this DApp prevent double voting?
**Answer:** The smart contract maintains a Solidity mapping `mapping(address => bool) public hasVoted`. When `vote(candidateId)` is called, the contract checks `require(!hasVoted[msg.sender])`. If `msg.sender` has already voted, the EVM transaction immediately reverts, ensuring no wallet can vote twice even if someone bypasses the frontend UI.

### Q2: Is vote data stored in a database like MySQL or MongoDB?
**Answer:** No centralized database is used. All candidate lists, vote counts, and voter records reside permanently in Ethereum contract storage variables (`Candidate[] public candidates`). Read operations call `view` functions directly on the Hardhat RPC node.

### Q3: How does the frontend update when another user votes?
**Answer:** `Voting.sol` emits a Web3 event `event Voted(...)` whenever a vote succeeds. In `app.js`, we subscribe to this event using `votingContract.on("Voted", ...)`, which automatically triggers real-time UI refreshes when new blocks are mined.

---

## 📜 License
This project is open-source under the MIT License for educational and college mini-project demonstration purposes.
