const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized Voting System (Voting.sol)", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  const electionTitle = "Kongu Engineering College - Student Council Election 2026";
  const electionDescription = "Official Blockchain Voting";
  const candidateNames = ["Alice Johnson", "Bob Smith", "Charlie Davis"];
  const candidateDescriptions = ["Student Welfare", "Campus Sports", "Web3 Guild"];
  const candidateAvatars = ["alice", "bob", "charlie"];

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    const currentBlockTime = (await ethers.provider.getBlock("latest")).timestamp;
    const startTime = currentBlockTime;
    const durationSeconds = 86400; // 24 hours

    const VotingFactory = await ethers.getContractFactory("Voting");
    votingContract = await VotingFactory.deploy(
      electionTitle,
      electionDescription,
      startTime,
      durationSeconds,
      candidateNames,
      candidateDescriptions,
      candidateAvatars
    );
    await votingContract.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("Should set the correct contract owner", async function () {
      expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("Should set election title and description correctly", async function () {
      expect(await votingContract.electionTitle()).to.equal(electionTitle);
      expect(await votingContract.electionDescription()).to.equal(electionDescription);
    });

    it("Should initialize candidates with descriptions and avatars correctly", async function () {
      const candidatesCount = await votingContract.candidatesCount();
      expect(candidatesCount).to.equal(3);

      const allCandidates = await votingContract.getAllCandidates();
      expect(allCandidates.length).to.equal(3);
      expect(allCandidates[0].name).to.equal("Alice Johnson");
      expect(allCandidates[0].description).to.equal("Student Welfare");
      expect(allCandidates[0].avatarUrl).to.equal("alice");
      expect(allCandidates[0].voteCount).to.equal(0);
    });

    it("Should set initial election status to open", async function () {
      expect(await votingContract.isVotingOpen()).to.be.true;
    });
  });

  describe("Vote Casting", function () {
    it("Should allow an eligible wallet to cast a vote", async function () {
      await expect(votingContract.connect(voter1).vote(1))
        .to.emit(votingContract, "Voted")
        .withArgs(voter1.address, 1, "Alice Johnson", 1, (ts) => ts > 0);

      const candidate = await votingContract.getCandidate(1);
      expect(candidate.voteCount).to.equal(1);

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
      await votingContract.connect(voter1).vote(1);

      await expect(
        votingContract.connect(voter1).vote(2)
      ).to.be.revertedWith("You have already voted! Each wallet can vote only once.");
    });

    it("Should REJECT vote for candidate ID 0", async function () {
      await expect(
        votingContract.connect(voter1).vote(0)
      ).to.be.revertedWith("Invalid candidate ID selected");
    });

    it("Should REJECT vote for out-of-bounds candidate ID", async function () {
      await expect(
        votingContract.connect(voter1).vote(99)
      ).to.be.revertedWith("Invalid candidate ID selected");
    });

    it("Should REJECT votes when voting is manually closed by owner", async function () {
      await votingContract.connect(owner).setVotingActive(false);

      await expect(
        votingContract.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting is currently closed by election administrator");
    });
  });

  describe("Scheduled Election Timing", function () {
    it("Should REJECT voting before start time", async function () {
      const futureStart = (await ethers.provider.getBlock("latest")).timestamp + 3600;
      const VotingFactory = await ethers.getContractFactory("Voting");
      const futureContract = await VotingFactory.deploy(
        electionTitle,
        electionDescription,
        futureStart,
        3600,
        candidateNames,
        candidateDescriptions,
        candidateAvatars
      );
      await futureContract.waitForDeployment();

      await expect(
        futureContract.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting has not started yet");
    });

    it("Should REJECT voting after end time", async function () {
      const currentBlockTime = (await ethers.provider.getBlock("latest")).timestamp;
      await votingContract.connect(owner).setElectionTimestamps(currentBlockTime - 7200, currentBlockTime - 3600);

      await expect(
        votingContract.connect(voter1).vote(1)
      ).to.be.revertedWith("Voting period has ended");
    });
  });

  describe("Admin / Owner Controls & Candidate Management", function () {
    it("Should allow owner to toggle voting active status", async function () {
      await votingContract.connect(owner).setVotingActive(false);
      expect(await votingContract.isVotingOpen()).to.be.false;

      await expect(
        votingContract.connect(voter1).setVotingActive(true)
      ).to.be.revertedWith("Only contract owner can perform this action");
    });

    it("Should allow owner to add a candidate before voting begins", async function () {
      await expect(
        votingContract.connect(owner).addCandidate("Diana Prince", "Data Science & AI", "diana")
      )
        .to.emit(votingContract, "CandidateAdded")
        .withArgs(4, "Diana Prince", "Data Science & AI", "diana");

      expect(await votingContract.candidatesCount()).to.equal(4);
    });

    it("Should REJECT candidate addition by non-owner", async function () {
      await expect(
        votingContract.connect(voter1).addCandidate("Eve Adams", "Security", "eve")
      ).to.be.revertedWith("Only contract owner can perform this action");
    });

    it("Should REJECT candidate addition after votes have been cast", async function () {
      await votingContract.connect(voter1).vote(1);

      await expect(
        votingContract.connect(owner).addCandidate("Frank Castle", "Ethics", "frank")
      ).to.be.revertedWith("Cannot add candidates after voting has started");
    });
  });
});
