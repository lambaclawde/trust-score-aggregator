import { useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const endpoints = [
  {
    method: 'GET',
    path: '/v1/agents/{id}',
    description: 'Get agent info by ID',
    tier: 'free',
    response: `{
  "id": "0x1234...",
  "owner": "0xabcd...",
  "metadata_uri": "ipfs://...",
  "block_number": 18500000,
  "created_at": "2024-01-15T..."
}`,
  },
  {
    method: 'GET',
    path: '/v1/agents/{id}/score',
    description: 'Get basic trust score',
    tier: 'free',
    response: `{
  "agent_id": "0x1234...",
  "score": 85.5,
  "feedback_count": 42
}`,
  },
  {
    method: 'GET',
    path: '/v1/agents/{id}/score/full',
    description: 'Get full score with category breakdown',
    tier: '0.0001 ETH',
    response: `{
  "agent_id": "0x1234...",
  "overall_score": 85.5,
  "feedback_count": 42,
  "positive_count": 38,
  "negative_count": 4,
  "categories": [
    { "category": "reliability", "score": 90.2, "count": 25 },
    { "category": "accuracy", "score": 78.4, "count": 17 }
  ],
  "computed_at": "2024-01-15T..."
}`,
  },
  {
    method: 'GET',
    path: '/v1/agents/{id}/feedback',
    description: 'Get feedback history for an agent',
    tier: 'free',
    response: `{
  "feedback": [
    {
      "id": "0xfeed...",
      "subject": "0x1234...",
      "author": "0xabcd...",
      "value": 100,
      "comment": "Great agent!",
      "timestamp": "2024-01-14T..."
    }
  ],
  "total": 42
}`,
  },
  {
    method: 'POST',
    path: '/v1/batch/scores',
    description: 'Get scores for multiple agents',
    tier: '0.0005 ETH',
    body: `{ "agent_ids": ["0x1234...", "0x5678..."] }`,
    response: `{
  "scores": [
    { "agent_id": "0x1234...", "score": 85.5, "feedback_count": 42 },
    { "agent_id": "0x5678...", "score": 72.1, "feedback_count": 18 }
  ],
  "not_found": []
}`,
  },
]

const oracleCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ITrustScoreOracle.sol";

contract MyProtocol {
    ITrustScoreOracle public oracle;

    constructor(address _oracle) {
        oracle = ITrustScoreOracle(_oracle);
    }

    function checkAgentTrust(bytes32 agentId) external payable {
        // Query costs 0.001 ETH
        (uint256 score, uint256 lastUpdated) =
            oracle.getScore{value: 0.001 ether}(agentId);

        // Score is 0-10000 (representing 0-100.00%)
        require(score >= 7000, "Agent trust score too low");

        // Proceed with interaction...
    }

    function batchCheck(bytes32[] calldata agents) external payable {
        uint256 fee = 0.001 ether * agents.length;
        require(msg.value >= fee, "Insufficient fee");

        (uint256[] memory scores,) =
            oracle.getScoreBatch{value: fee}(agents);

        // Process scores...
    }
}`

// x402 Pay-per-request pricing
const premiumEndpoints = [
  {
    name: 'Full Score',
    endpoint: '/v1/premium/agents/{id}/score/full',
    price: '0.0001',
    description: 'Complete score with category breakdown',
  },
  {
    name: 'Batch Scores',
    endpoint: '/v1/premium/batch/scores',
    price: '0.0005',
    description: 'Up to 50 agents per request',
  },
  {
    name: 'Leaderboard',
    endpoint: '/v1/premium/leaderboard',
    price: '0.0002',
    description: 'Ranked agents by trust score',
  },
  {
    name: 'Analytics',
    endpoint: '/v1/premium/agents/{id}/analytics',
    price: '0.0003',
    description: 'Detailed analytics and trends',
  },
]

const freeEndpoints = [
  '/v1/agents/{id} - Agent info',
  '/v1/agents/{id}/score - Basic score',
  '/v1/agents/{id}/feedback - Feedback history',
  '/v1/leaderboard - Basic leaderboard',
  '/v1/agents/stats - Global statistics',
]

export default function Docs() {
  const [activeTab, setActiveTab] = useState<'api' | 'oracle' | 'pricing'>('api')

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="badge badge-primary mb-4">Documentation</span>
        <h1 className="text-display-sm font-bold text-surface-900 dark:text-white mb-2">
          API & Integration Guide
        </h1>
        <p className="text-lg text-surface-600 dark:text-surface-400">
          Integrate trust scores into your application or smart contract.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2 mb-8 border-b border-surface-200 dark:border-surface-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { id: 'api', label: 'REST API', icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )},
          { id: 'oracle', label: 'On-chain Oracle', icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          )},
          { id: 'pricing', label: 'Pricing', icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )},
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-primary-600 dark:text-primary-400 border-primary-500'
                : 'text-surface-500 dark:text-surface-400 border-transparent hover:text-surface-900 dark:hover:text-white'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* REST API */}
      {activeTab === 'api' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Base URL</h3>
                <code className="text-primary-600 dark:text-primary-400 font-mono bg-primary-50 dark:bg-primary-950 px-3 py-1.5 rounded-lg">
                  https://api.trustscore.xyz/v1
                </code>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-3">
                  Premium endpoints require x402 payment. Include <code className="text-surface-700 dark:text-surface-300 font-mono">X-Payment: 0x&lt;tx_hash&gt;:1</code> header after sending ETH.
                  Free tier endpoints are accessible without payment up to 100 requests/day.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {endpoints.map((endpoint, i) => (
              <motion.div
                key={endpoint.path}
                className="card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50 dark:bg-surface-900/50">
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'px-2.5 py-1 rounded-lg text-xs font-mono font-semibold',
                      endpoint.method === 'GET'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    )}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm text-surface-700 dark:text-surface-300">{endpoint.path}</code>
                  </div>
                  <span className={clsx(
                    'badge',
                    endpoint.tier === 'free' ? 'badge-success' : 'badge-primary'
                  )}>
                    {endpoint.tier}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{endpoint.description}</p>
                  {endpoint.body && (
                    <div className="mb-4">
                      <p className="text-xs text-surface-500 dark:text-surface-500 uppercase tracking-wider font-semibold mb-2">Request Body</p>
                      <div className="code-block">
                        <code className="text-surface-700 dark:text-surface-300">{endpoint.body}</code>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-surface-500 dark:text-surface-500 uppercase tracking-wider font-semibold mb-2">Response</p>
                  <div className="code-block">
                    <code className="text-surface-700 dark:text-surface-300">{endpoint.response}</code>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Oracle */}
      {activeTab === 'oracle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">TrustScoreOracle Contract</h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  Query trust scores directly from your smart contracts. Each query costs <strong>0.001 ETH</strong> which
                  covers gas optimization and oracle maintenance.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-neutral">Mainnet</span>
                    <code className="text-primary-600 dark:text-primary-400 font-mono text-sm">Coming Soon</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-neutral">Sepolia</span>
                    <code className="text-primary-600 dark:text-primary-400 font-mono text-sm">Coming Soon</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50">
              <h3 className="font-semibold text-surface-900 dark:text-white">Example Integration</h3>
            </div>
            <div className="code-block rounded-none border-0">
              <pre className="text-sm overflow-x-auto">
                <code className="text-surface-700 dark:text-surface-300">{oracleCode}</code>
              </pre>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Available Functions</h3>
            <div className="space-y-6">
              <div>
                <code className="text-primary-600 dark:text-primary-400 font-mono text-sm">
                  getScore(bytes32 agentId) payable → (uint256 score, uint256 lastUpdated)
                </code>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                  Query score for a single agent. Requires 0.001 ETH. Returns score (0-10000) and last update timestamp.
                </p>
              </div>
              <div className="border-t border-surface-200 dark:border-surface-800 pt-6">
                <code className="text-primary-600 dark:text-primary-400 font-mono text-sm">
                  getScoreBatch(bytes32[] agentIds) payable → (uint256[] scores, uint256[] lastUpdates)
                </code>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                  Query scores for multiple agents. Requires 0.001 ETH per agent. More gas efficient than individual calls.
                </p>
              </div>
              <div className="border-t border-surface-200 dark:border-surface-800 pt-6">
                <code className="text-primary-600 dark:text-primary-400 font-mono text-sm">
                  getScoreView(bytes32 agentId) view → (uint256 score, uint256 lastUpdated, bool exists)
                </code>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                  View score without paying (no event emitted). Useful for off-chain reads or UI display.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* x402 Intro */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                  x402 Pay-Per-Request
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  No subscriptions, no API keys. Pay only for what you use with ETH micropayments.
                  Send payment, include the tx hash in your request, and get instant access.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="badge badge-success">No Monthly Fees</span>
                  <span className="badge badge-primary">Instant Access</span>
                  <span className="badge badge-neutral">ETH Payments</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Free Tier */}
            <motion.div
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Free Tier</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">100 requests/day</p>
                </div>
              </div>
              <ul className="space-y-2">
                {freeEndpoints.map((endpoint) => (
                  <li key={endpoint} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <code className="font-mono text-xs">{endpoint}</code>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Premium Pricing */}
            <motion.div
              className="card p-6 ring-2 ring-primary-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Premium Endpoints</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Pay per request</p>
                </div>
              </div>
              <div className="space-y-3">
                {premiumEndpoints.map((ep) => (
                  <div key={ep.endpoint} className="flex items-center justify-between py-2 border-b border-surface-200 dark:border-surface-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{ep.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{ep.description}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {ep.price} ETH
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* How it works */}
          <motion.div
            className="card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">How x402 Payments Work</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto mb-3">
                  <span className="font-bold">1</span>
                </div>
                <h4 className="font-medium text-surface-900 dark:text-white mb-2">Request Endpoint</h4>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Call premium endpoint, receive 402 with payment address and amount
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto mb-3">
                  <span className="font-bold">2</span>
                </div>
                <h4 className="font-medium text-surface-900 dark:text-white mb-2">Send Payment</h4>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Send ETH to payment address, wait for confirmation
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto mb-3">
                  <span className="font-bold">3</span>
                </div>
                <h4 className="font-medium text-surface-900 dark:text-white mb-2">Include TX Hash</h4>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Retry request with <code className="text-xs">X-Payment: 0x...txhash:1</code> header
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-surface-50 dark:bg-surface-900 rounded-lg">
              <p className="text-xs font-mono text-surface-600 dark:text-surface-400">
                <span className="text-surface-500 dark:text-surface-500"># Example request with payment</span><br />
                curl -H "X-Payment: 0xabc123...def:1" \<br />
                &nbsp;&nbsp;&nbsp;&nbsp; https://api.trustscore.xyz/v1/premium/leaderboard
              </p>
            </div>
          </motion.div>

          {/* On-chain Oracle */}
          <motion.div
            className="card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">On-chain Oracle</h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  For smart contract integrations, query the TrustScoreOracle directly on Ethereum.
                  Pay-per-query model built into the contract.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-surface-900 dark:text-white">0.001</span>
                  <span className="text-surface-500 dark:text-surface-400">ETH per on-chain query</span>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">Coming soon</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
