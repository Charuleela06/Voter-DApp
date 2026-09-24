// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Decentralized Voting System
 * @notice Upgraded College Mini-Project Smart Contract for Blockchain-Based Elections.
 * @dev Enforces 1-wallet-1-vote, scheduled election start/end times, admin access control, and candidate management.
 */
contract Voting {
    // Candidate structure with description and avatar image identifier
    struct Candidate {
        uint256 id;
        string name;
        string description;
        string avatarUrl;
        uint256 voteCount;
    }

    // Owner of the voting contract
    address public owner;

    // Election Metadata
    string public electionTitle;
    string public electionDescription;

    // Scheduled Start and End Timestamps (Unix epoch seconds)
    uint256 public startTime;
    uint256 public endTime;

    // Total counts
    uint256 public candidatesCount;
    uint256 public totalVotesCast;

    // Manual election active toggle (controlled by contract owner)
    bool public votingActive;

    // Array containing all registered candidates
    Candidate[] public candidates;

    // Mapping from candidate ID (1-indexed) to candidates array index (0-indexed)
    mapping(uint256 => uint256) private candidateIdToIndex;

    // Mapping tracking whether an Ethereum wallet address has voted
    mapping(address => bool) public hasVoted;

    // Mapping storing the candidate ID voted for by a wallet address
    mapping(address => uint256) public voterChoice;

    // Web3 Events
    event Voted(
        address indexed voter,
        uint256 indexed candidateId,
        string candidateName,
        uint256 newVoteCount,
        uint256 timestamp
    );

    event VotingStatusChanged(bool indexed isActive);
    event ElectionTimeUpdated(uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed candidateId, string name, string description, string avatarUrl);

    // Modifier to restrict functions to contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    /**
     * @dev Constructor initializes the election title, schedule, and initial candidates.
     */
    constructor(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _durationSeconds,
        string[] memory _candidateNames,
        string[] memory _candidateDescriptions,
        string[] memory _candidateAvatars
    ) {
        require(bytes(_title).length > 0, "Election title is required");
        require(_candidateNames.length > 0, "At least one candidate is required");
        require(
            _candidateNames.length == _candidateDescriptions.length &&
            _candidateNames.length == _candidateAvatars.length,
            "Candidate array lengths must match"
        );

        owner = msg.sender;
        electionTitle = _title;
        electionDescription = _description;
        votingActive = true;

        // If startTime is 0, default to current block timestamp
        startTime = _startTime == 0 ? block.timestamp : _startTime;
        endTime = startTime + (_durationSeconds == 0 ? 7 days : _durationSeconds);

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            _addCandidateInternal(
                _candidateNames[i],
                _candidateDescriptions[i],
                _candidateAvatars[i]
            );
        }
    }

    /**
     * @dev Internal helper function to register a candidate.
     */
    function _addCandidateInternal(
        string memory _name,
        string memory _description,
        string memory _avatarUrl
    ) private {
        candidatesCount++;
        Candidate memory newCandidate = Candidate({
            id: candidatesCount,
            name: _name,
            description: _description,
            avatarUrl: _avatarUrl,
            voteCount: 0
        });
        candidates.push(newCandidate);
        candidateIdToIndex[candidatesCount] = candidates.length - 1;

        emit CandidateAdded(candidatesCount, _name, _description, _avatarUrl);
    }

    /**
     * @notice Allows owner to register a new candidate before voting begins.
     */
    function addCandidate(
        string memory _name,
        string memory _description,
        string memory _avatarUrl
    ) external onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(totalVotesCast == 0, "Cannot add candidates after voting has started");
        
        _addCandidateInternal(_name, _description, _avatarUrl);
    }

    /**
     * @notice Casts a vote for a candidate specified by ID.
     * @param _candidateId Candidate ID (1-indexed).
     */
    function vote(uint256 _candidateId) external {
        // Security Rule 1: Check manual active toggle
        require(votingActive, "Voting is currently closed by election administrator");

        // Security Rule 2: Check scheduled timing window
        require(block.timestamp >= startTime, "Voting has not started yet");
        require(block.timestamp <= endTime, "Voting period has ended");

        // Security Rule 3: 1 Wallet = 1 Vote check
        require(!hasVoted[msg.sender], "You have already voted! Each wallet can vote only once.");

        // Security Rule 4: Validate candidate ID bounds
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID selected");

        // Fetch candidate array index
        uint256 index = candidateIdToIndex[_candidateId];

        // Increment candidate vote count and global vote counter
        candidates[index].voteCount += 1;
        totalVotesCast += 1;

        // Record voter status
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _candidateId;

        // Emit real-time Web3 event
        emit Voted(
            msg.sender,
            _candidateId,
            candidates[index].name,
            candidates[index].voteCount,
            block.timestamp
        );
    }

    /**
     * @notice Helper function to check if voting is currently open based on status and timestamps.
     */
    function isVotingOpen() public view returns (bool) {
        return votingActive && block.timestamp >= startTime && block.timestamp <= endTime;
    }

    /**
     * @notice Fetches all candidates with their details and current vote counts.
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Fetches a single candidate by ID.
     */
    function getCandidate(uint256 _candidateId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory description,
            string memory avatarUrl,
            uint256 voteCount
        )
    {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        uint256 index = candidateIdToIndex[_candidateId];
        Candidate memory c = candidates[index];
        return (c.id, c.name, c.description, c.avatarUrl, c.voteCount);
    }

    /**
     * @notice Checks if a wallet address has voted.
     */
    function hasUserVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }

    /**
     * @notice Returns comprehensive election details for the dashboard.
     */
    function getElectionSummary()
        external
        view
        returns (
            string memory title,
            string memory description,
            uint256 totalCandidates,
            uint256 totalVotes,
            bool isActive,
            uint256 startTimestamp,
            uint256 endTimestamp,
            address contractOwner
        )
    {
        return (
            electionTitle,
            electionDescription,
            candidatesCount,
            totalVotesCast,
            isVotingOpen(),
            startTime,
            endTime,
            owner
        );
    }

    /**
     * @notice Toggle manual voting active status (Owner only).
     */
    function setVotingActive(bool _active) external onlyOwner {
        votingActive = _active;
        emit VotingStatusChanged(_active);
    }

    /**
     * @notice Update election start and end timestamps (Owner only).
     */
    function setElectionTimestamps(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_endTime > _startTime, "End time must be after start time");
        startTime = _startTime;
        endTime = _endTime;
        emit ElectionTimeUpdated(_startTime, _endTime);
    }
}
