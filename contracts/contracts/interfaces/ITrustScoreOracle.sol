// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title ITrustScoreOracle
 * @notice Interface for the Trust Score Oracle contract
 */
interface ITrustScoreOracle {
    /// @notice Emitted when a score is queried
    event ScoreQueried(bytes32 indexed agentId, address indexed querier, uint256 score);

    /// @notice Emitted when a score is updated
    event ScoreUpdated(bytes32 indexed agentId, uint256 oldScore, uint256 newScore);

    /// @notice Emitted when funds are withdrawn
    event FundsWithdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when query fee is updated
    event QueryFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @notice Get the trust score for an agent (paid query)
     * @param agentId The agent's identifier
     * @return score The trust score (0-10000, representing 0-100.00%)
     * @return lastUpdated Timestamp of last score update
     */
    function getScore(bytes32 agentId) external payable returns (uint256 score, uint256 lastUpdated);

    /**
     * @notice Get trust scores for multiple agents (paid batch query)
     * @param agentIds Array of agent identifiers
     * @return scores Array of trust scores
     * @return lastUpdates Array of last update timestamps
     */
    function getScoreBatch(bytes32[] calldata agentIds) external payable returns (uint256[] memory scores, uint256[] memory lastUpdates);

    /**
     * @notice Update the trust score for an agent (owner only)
     * @param agentId The agent's identifier
     * @param score The new trust score
     */
    function updateScore(bytes32 agentId, uint256 score) external;

    /**
     * @notice Batch update trust scores (owner only)
     * @param agentIds Array of agent identifiers
     * @param scores Array of new trust scores
     */
    function updateScoreBatch(bytes32[] calldata agentIds, uint256[] calldata scores) external;

    /**
     * @notice Withdraw accumulated fees to owner
     */
    function withdraw() external;

    /**
     * @notice Get the current query fee
     * @return The fee in wei
     */
    function queryFee() external view returns (uint256);

    /**
     * @notice Set a new query fee (owner only)
     * @param newFee The new fee in wei
     */
    function setQueryFee(uint256 newFee) external;
}
