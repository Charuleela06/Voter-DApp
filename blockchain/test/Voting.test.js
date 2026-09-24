const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized Voting System (Voting.sol)", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  const candidateNames = ["Alice Smith", "Bob Johnson", "Charlie Davis"];

  beforeEach(async function () {
    // Get test signers from Hardhat
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy contract before each test suite execution
    const VotingFactory = await ethers.getContractFactory("Voting");
    votingContract = await VotingFactory.deploy(candidateNames);
    await votingContract.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("Should set the correct contract owner", async function () {
      expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("Should initialize candidates correctly", async function () {
      const candidatesCount = await votingContract.candidatesCount();
      expect(candidatesCount).to.equal(3);

      const allCandidates = await votingContract.getAllCandidates();
      expect(allCandidates.length).to.equal(3);
      expect(allCandidates[0].name).to.equal("Alice Smith");
      expect(allCandidates[1].name).to.equal("Bob Johnson");
      expect(allCandidates[2].name).to.equal("Charlie Davis");
      expect(allCandidates[0].voteCount).to.equal(0);
    });

    it("Should set initial election status to active", async function () {
      expect(await votingContract.votingActive()).to.be.true;
    });
  });

  describe("Vote Casting", function () {
    it("Should allow a wallet to cast a vote for a candidate", async function () {
      // Voter1 votes for Candidate 1 (Alice Smith)
      await expect(votingContract.connect(voter1).vote(1))
        .to.emit(votingContract, "Voted")
        .withArgs(voter1.address, 1, "Alice Smith", 1, (ts) => ts > 0);

      // Verify vote count updated
      const candidate = await votingContract.getCandidate(1);
      expect(candidate.voteCount).to.equal(1);

      // Verify voter status updated
      expect(await votingContract.hasUserVoted(voter1.address)).to.be.true;
      expect(await votingContract.totalVotesCast()).to.equal(1);
    });

    it("Should accumulate multiple votes correctly from different wallets", async function () {
      await votingContract.connect(voter1).vote(1);
      await votingContract.connect(voter2).vote(1);
      await votingContract.connect(voter3).vote(2);

      const candidate1 = await votingContract.getCandidate(1);
      const candidate2 = await votingContract.getCandidate(2);

      expect(candidate1.voteCount).to.equal(2);
      expect(candidate2.voteCount).to.equal(1);
      expect(await votingContract.totalVotesCast()).to.equal(3);
    });
  });

  describe("Security & Validation Rules", function () {
    it("Should REJECT double voting from the same wallet", async function () {
      // Voter1 votes first time
      await votingContract.connect(voter1).vote(1);

      // Voter1 attempts to vote a second time -> should revert
      await expect(
        votingContract.connect(voter1).vote(2)
      ).to.be.revertedWith("You have already voted! Each wallet can vote only once.");
    });

    it("Should REJECT vote for candidate ID 0", async function () {
      await expect(
        votingContract.connect(voter1).vote(0)
      ).to.be.revertedWith("Invalid candidate ID.");
    });

    it("Should REJECT vote for out-of-bounds candidate ID", async function () {
      await expect(
        votingContract.connect(voter1).vote(99)
      ).to.be.revertedWith("Invalid candidate ID.");
    });

    it("Should REJECT votes when voting is closed by admin", async function () {
      // Admin closes voting
      await votingContract.connect(owner).setVotingActive(false);

      await expect(
        votingContract.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting is currently closed");
    });
  });

  describe("Admin / Owner Controls", function () {
    it("Should allow only owner to toggle voting active status", async function () {
      await votingContract.connect(owner).setVotingActive(false);
      expect(await votingContract.votingActive()).to.be.false;

      // Non-owner attempt should fail
      await expect(
        votingContract.connect(voter1).setVotingActive(true)
      ).to.be.revertedWith("Only contract owner can perform this action");
    });
  });
});
