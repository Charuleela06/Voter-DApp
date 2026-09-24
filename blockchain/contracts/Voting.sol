// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Decentralized Voting System
 * @notice College Mini-Project: A simple, transparent smart contract for casting and counting votes on Ethereum.
 * @dev Stores candidates, records votes per wallet address, prevents double-voting, and emits real-time events.
 */
contract Voting {
    // Structure to represent a Candidate
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // Owner of the voting contract
    address public owner;

    // Total number of candidates created
    uint256 public candidatesCount;

    // Total number of votes cast overall
    uint256 public totalVotesCast;

    // Status of the election (active or closed)
    bool public votingActive;

    // Dynamic array containing all candidates
    Candidate[] public candidates;

    // Mapping from candidate ID (1-indexed) to array index (0-indexed)
    mapping(uint256 => uint256) private candidateIdToIndex;

    // Mapping to track whether an Ethereum address has cast a vote
    mapping(address => bool) public hasVoted;

    // Mapping to store which candidate an address voted for (optional transparency helper)
    mapping(address => uint256) public voterChoice;

    // Event emitted whenever a vote is successfully cast on the blockchain
    event Voted(
        address indexed voter,
        uint256 indexed candidateId,
        string candidateName,
        uint256 newVoteCount,
        uint256 timestamp
    );

    // Event emitted when election status changes
    event VotingStatusChanged(bool indexed isActive);

    // Custom modifier to restrict access to contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    /**
     * @dev Constructor initializes the election with predefined candidate names.
     * @param candidateNames List of candidate names to register upon deployment.
     */
    constructor(string[] memory candidateNames) {
        require(candidateNames.length > 0, "At least one candidate is required");
        owner = msg.sender;
        votingActive = true;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            _addCandidate(candidateNames[i]);
        }
    }

    /**
     * @dev Internal function to register a new candidate.
     * @param _name Name of the candidate.
     */
    function _addCandidate(string memory _name) private {
        candidatesCount++;
        Candidate memory newCandidate = Candidate({
            id: candidatesCount,
            name: _name,
            voteCount: 0
        });
        candidates.push(newCandidate);
        candidateIdToIndex[candidatesCount] = candidates.length - 1;
    }

    /**
     * @notice Casts a vote for a candidate specified by ID.
     * @dev Enforces 1 vote per wallet, valid candidate ID, and active election status.
     * @param _candidateId The ID of the candidate (1, 2, 3, etc.).
     */
    function vote(uint256 _candidateId) external {
        // Rule 1: Check if election is active
        require(votingActive, "Voting is currently closed");

        // Rule 2: Check if voter has already cast a vote
        require(!hasVoted[msg.sender], "You have already voted! Each wallet can vote only once.");

        // Rule 3: Validate candidate ID bounds
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");

        // Fetch candidate index in array
        uint256 index = candidateIdToIndex[_candidateId];

        // Increment candidate vote count and global vote counter
        candidates[index].voteCount += 1;
        totalVotesCast += 1;

        // Mark sender wallet address as having voted
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _candidateId;

        // Emit real-time Web3 event for frontend UI updates
        emit Voted(
            msg.sender,
            _candidateId,
            candidates[index].name,
            candidates[index].voteCount,
            block.timestamp
        );
    }

    /**
     * @notice Fetches all candidates with their current details and vote counts.
     * @return An array of Candidate structs.
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Fetches single candidate details by candidate ID.
     * @param _candidateId Candidate ID.
     * @return id Candidate ID.
     * @return name Candidate Name.
     * @return voteCount Current vote count.
     */
    function getCandidate(uint256 _candidateId) external view returns (uint256 id, string memory name, uint256 voteCount) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        uint256 index = candidateIdToIndex[_candidateId];
        Candidate memory c = candidates[index];
        return (c.id, c.name, c.voteCount);
    }

    /**
     * @notice Checks if a given wallet address has already voted.
     * @param _voter Wallet address to check.
     * @return True if voted, false otherwise.
     */
    function hasUserVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }

    /**
     * @notice Fetches summary stats for the voting dashboard.
     * @return totalCandidates Total number of candidates.
     * @return totalVotes Total votes cast.
     * @return isActive Current status of voting.
     */
    function getElectionSummary() external view returns (uint256 totalCandidates, uint256 totalVotes, bool isActive) {
        return (candidatesCount, totalVotesCast, votingActive);
    }

    /**
     * @notice Toggle voting status (Owner only feature for project demo).
     * @param _active True to open voting, false to close.
     */
    function setVotingActive(bool _active) external onlyOwner {
        votingActive = _active;
        emit VotingStatusChanged(_active);
    }
}
