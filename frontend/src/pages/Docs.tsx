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
    tier: 'paid',
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
    tier: 'paid',
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
pragma solidity ^0.8.20;

import "./ITrustScoreOracle.sol";

contract MyContract {
    ITrustScoreOracle public oracle;

    constructor(address _oracle) {
        oracle = ITrustScoreOracle(_oracle);
    }

    function checkTrust(bytes32 agentId) external payable {
        // Query costs 0.001 ETH
        (uint256 score, uint256 lastUpdated) = oracle.getScore{value: 0.001 ether}(agentId);

        // Score is 0-10000 (representing 0-100.00%)
        require(score >= 7000, "Agent trust score too low");

        // Proceed with interaction...
    }
}`

const tiers = [
  { name: 'Free', price: '$0', requests: '100/day', features: ['Basic score lookup', 'Agent info', 'Feedback history'] },
  { name: 'Basic', price: '$29/mo', requests: '10,000/day', features: ['Everything in Free', 'Full score breakdown', 'Batch queries', 'Priority support'] },
  { name: 'Premium', price: '$199/mo', requests: '100,000/day', features: ['Everything in Basic', 'Custom webhooks', 'Dedicated support', 'SLA guarantee'] },
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
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-gray-400">
          Integrate trust scores into your application or smart contract.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2 mb-8 border-b border-surface-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { id: 'api', label: 'REST API' },
          { id: 'oracle', label: 'On-chain Oracle' },
          { id: 'pricing', label: 'Pricing' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-white border-accent-500'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            )}
          >
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
            <h3 className="text-lg font-semibold mb-2">Base URL</h3>
            <code className="text-accent-400 font-mono">https://api.trustscore.xyz/v1</code>
            <p className="text-sm text-gray-400 mt-2">
              All requests require an <code className="text-gray-300">X-API-Key</code> header for paid endpoints.
            </p>
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
                <div className="px-6 py-4 border-b border-surface-600 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-mono font-medium',
                      endpoint.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    )}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm">{endpoint.path}</code>
                  </div>
                  <span className={clsx(
                    'badge',
                    endpoint.tier === 'free' ? 'badge-success' : 'badge-warning'
                  )}>
                    {endpoint.tier}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-400 mb-4">{endpoint.description}</p>
                  {endpoint.body && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Request Body</p>
                      <pre className="bg-surface-900 rounded-lg p-4 text-sm overflow-x-auto">
                        <code className="text-gray-300">{endpoint.body}</code>
                      </pre>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Response</p>
                  <pre className="bg-surface-900 rounded-lg p-4 text-sm overflow-x-auto">
                    <code className="text-gray-300">{endpoint.response}</code>
                  </pre>
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
            <h3 className="text-lg font-semibold mb-2">TrustScoreOracle Contract</h3>
            <p className="text-gray-400 mb-4">
              Query trust scores directly from your smart contracts. Each query costs 0.001 ETH.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Mainnet:</span>
                <code className="text-accent-400 font-mono">TBD (after deployment)</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Sepolia:</span>
                <code className="text-accent-400 font-mono">TBD (after deployment)</code>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-600">
              <h3 className="font-semibold">Example Integration</h3>
            </div>
            <pre className="p-6 text-sm overflow-x-auto bg-surface-900">
              <code className="text-gray-300">{oracleCode}</code>
            </pre>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Available Functions</h3>
            <div className="space-y-4">
              <div>
                <code className="text-accent-400 font-mono text-sm">getScore(bytes32 agentId) payable → (uint256 score, uint256 lastUpdated)</code>
                <p className="text-sm text-gray-400 mt-1">Query score for a single agent. Requires 0.001 ETH.</p>
              </div>
              <div>
                <code className="text-accent-400 font-mono text-sm">getScoreBatch(bytes32[] agentIds) payable → (uint256[] scores, uint256[] lastUpdates)</code>
                <p className="text-sm text-gray-400 mt-1">Query scores for multiple agents. Requires 0.001 ETH per agent.</p>
              </div>
              <div>
                <code className="text-accent-400 font-mono text-sm">getScoreView(bytes32 agentId) view → (uint256 score, uint256 lastUpdated, bool exists)</code>
                <p className="text-sm text-gray-400 mt-1">View score without paying (no event emitted).</p>
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
        >
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                className={clsx(
                  'card p-6',
                  i === 1 && 'ring-2 ring-accent-600'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {i === 1 && (
                  <span className="badge badge-success mb-4">Popular</span>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                </div>
                <p className="text-sm text-gray-400 mb-6">{tier.requests}</p>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={clsx(
                  'w-full mt-6',
                  i === 1 ? 'btn-primary' : 'btn-secondary'
                )}>
                  {i === 0 ? 'Get Started' : 'Subscribe'}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 card p-6">
            <h3 className="text-lg font-semibold mb-4">On-chain Queries</h3>
            <p className="text-gray-400 mb-4">
              For smart contract integrations, query the TrustScoreOracle directly on Ethereum.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">0.001</span>
                <span className="text-gray-400">ETH</span>
              </div>
              <span className="text-gray-500">per query</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
