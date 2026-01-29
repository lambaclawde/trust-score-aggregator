// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/ITrustScoreOracle.sol";

/**
 * @title TrustScoreOracle
 * @notice On-chain oracle for ERC-8004 agent trust scores with paid queries
 * @dev UUPS upgradeable pattern, revenue flows to contract owner
 */
contract TrustScoreOracle is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ITrustScoreOracle
{
    /// @notice Score data for an agent
    struct AgentScore {
        uint256 score;       // Trust score (0-10000 = 0-100.00%)
        uint256 lastUpdated; // Timestamp of last update
        bool exists;         // Whether score exists
    }

    /// @notice Mapping of agent ID to score data
    mapping(bytes32 => AgentScore) public scores;

    /// @notice Fee required per query (default 0.001 ETH)
    uint256 public queryFee;

    /// @notice Total revenue accumulated
    uint256 public totalRevenue;

    /// @notice Total queries processed
    uint256 public totalQueries;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param owner_ The contract owner address
     * @param queryFee_ Initial query fee in wei
     */
    function initialize(address owner_, uint256 queryFee_) public initializer {
        __Ownable_init(owner_);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        queryFee = queryFee_;
    }

    /**
     * @notice Get the trust score for an agent (paid query)
     * @param agentId The agent's identifier
     * @return score The trust score
     * @return lastUpdated Timestamp of last update
     */
    function getScore(bytes32 agentId) external payable nonReentrant returns (uint256 score, uint256 lastUpdated) {
        require(msg.value >= queryFee, "Insufficient fee");

        AgentScore storage agentScore = scores[agentId];

        totalRevenue += msg.value;
        totalQueries += 1;

        emit ScoreQueried(agentId, msg.sender, agentScore.score);

        // Refund excess payment
        if (msg.value > queryFee) {
            (bool success, ) = msg.sender.call{value: msg.value - queryFee}("");
            require(success, "Refund failed");
        }

        return (agentScore.score, agentScore.lastUpdated);
    }

    /**
     * @notice Get trust scores for multiple agents (paid batch query)
     * @param agentIds Array of agent identifiers
     * @return scoresArray Array of trust scores
     * @return lastUpdates Array of last update timestamps
     */
    function getScoreBatch(bytes32[] calldata agentIds) external payable nonReentrant returns (uint256[] memory scoresArray, uint256[] memory lastUpdates) {
        uint256 totalFee = queryFee * agentIds.length;
        require(msg.value >= totalFee, "Insufficient fee for batch");

        scoresArray = new uint256[](agentIds.length);
        lastUpdates = new uint256[](agentIds.length);

        for (uint256 i = 0; i < agentIds.length; i++) {
            AgentScore storage agentScore = scores[agentIds[i]];
            scoresArray[i] = agentScore.score;
            lastUpdates[i] = agentScore.lastUpdated;

            emit ScoreQueried(agentIds[i], msg.sender, agentScore.score);
        }

        totalRevenue += totalFee;
        totalQueries += agentIds.length;

        // Refund excess payment
        if (msg.value > totalFee) {
            (bool success, ) = msg.sender.call{value: msg.value - totalFee}("");
            require(success, "Refund failed");
        }

        return (scoresArray, lastUpdates);
    }

    /**
     * @notice Update the trust score for an agent (owner only)
     * @param agentId The agent's identifier
     * @param score The new trust score (0-10000)
     */
    function updateScore(bytes32 agentId, uint256 score) external onlyOwner {
        require(score <= 10000, "Score must be <= 10000");

        uint256 oldScore = scores[agentId].score;

        scores[agentId] = AgentScore({
            score: score,
            lastUpdated: block.timestamp,
            exists: true
        });

        emit ScoreUpdated(agentId, oldScore, score);
    }

    /**
     * @notice Batch update trust scores (owner only)
     * @param agentIds Array of agent identifiers
     * @param newScores Array of new trust scores
     */
    function updateScoreBatch(bytes32[] calldata agentIds, uint256[] calldata newScores) external onlyOwner {
        require(agentIds.length == newScores.length, "Array length mismatch");

        for (uint256 i = 0; i < agentIds.length; i++) {
            require(newScores[i] <= 10000, "Score must be <= 10000");

            uint256 oldScore = scores[agentIds[i]].score;

            scores[agentIds[i]] = AgentScore({
                score: newScores[i],
                lastUpdated: block.timestamp,
                exists: true
            });

            emit ScoreUpdated(agentIds[i], oldScore, newScores[i]);
        }
    }

    /**
     * @notice Withdraw accumulated fees to owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @notice Set a new query fee (owner only)
     * @param newFee The new fee in wei
     */
    function setQueryFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = queryFee;
        queryFee = newFee;

        emit QueryFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Check if an agent has a score
     * @param agentId The agent's identifier
     * @return Whether the agent has a recorded score
     */
    function hasScore(bytes32 agentId) external view returns (bool) {
        return scores[agentId].exists;
    }

    /**
     * @notice Get score without paying (view only, no event)
     * @param agentId The agent's identifier
     * @return score The trust score
     * @return lastUpdated Timestamp of last update
     * @return exists Whether score exists
     */
    function getScoreView(bytes32 agentId) external view returns (uint256 score, uint256 lastUpdated, bool exists) {
        AgentScore storage agentScore = scores[agentId];
        return (agentScore.score, agentScore.lastUpdated, agentScore.exists);
    }

    /**
     * @notice Authorize contract upgrades (owner only)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
