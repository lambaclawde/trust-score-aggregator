const API_BASE = import.meta.env.VITE_API_URL || '/api'

export interface Agent {
  id: string
  owner: string
  metadata_uri: string | null
  block_number: number
  created_at: string
}

export interface SimpleScore {
  agent_id: string
  score: number
  feedback_count: number
}

export interface CategoryScore {
  category: string
  score: number
  count: number
}

export interface FullScore {
  agent_id: string
  overall_score: number
  feedback_count: number
  positive_count: number
  negative_count: number
  categories: CategoryScore[]
  computed_at: string
}

export interface Feedback {
  id: string
  subject: string
  author: string
  tag1: string | null
  value: number
  value_decimals: number
  comment: string | null
  revoked: boolean
  timestamp: string
  block_number: number
}

export interface AgentListResponse {
  agents: Agent[]
  total: number
  page: number
  page_size: number
}

export interface FeedbackListResponse {
  feedback: Feedback[]
  total: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }

    return res.json()
  }

  async getAgents(page = 1, pageSize = 20): Promise<AgentListResponse> {
    return this.fetch(`/agents?page=${page}&page_size=${pageSize}`)
  }

  async getAgent(id: string): Promise<Agent> {
    return this.fetch(`/agents/${id}`)
  }

  async getScore(agentId: string): Promise<SimpleScore> {
    return this.fetch(`/agents/${agentId}/score`)
  }

  async getFullScore(agentId: string): Promise<FullScore> {
    return this.fetch(`/agents/${agentId}/score/full`)
  }

  async getFeedback(agentId: string, limit = 50): Promise<FeedbackListResponse> {
    return this.fetch(`/agents/${agentId}/feedback?limit=${limit}`)
  }

  async refreshScore(agentId: string): Promise<FullScore> {
    return this.fetch(`/agents/${agentId}/score/refresh`, { method: 'POST' })
  }
}

export const api = new ApiClient(API_BASE)
