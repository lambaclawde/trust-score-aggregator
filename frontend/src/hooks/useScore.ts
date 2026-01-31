import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useAgent(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => api.getAgent(agentId!),
    enabled: !!agentId,
    staleTime: 60000,
  })
}

export function useScore(agentId: string | undefined) {
  return useQuery({
    queryKey: ['score', agentId],
    queryFn: () => api.getScore(agentId!),
    enabled: !!agentId,
    staleTime: 30000,
  })
}

export function useFullScore(agentId: string | undefined) {
  return useQuery({
    queryKey: ['fullScore', agentId],
    queryFn: () => api.getFullScore(agentId!),
    enabled: !!agentId,
    staleTime: 30000,
  })
}

export function useFeedback(agentId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['feedback', agentId, limit],
    queryFn: () => api.getFeedback(agentId!, limit),
    enabled: !!agentId,
    staleTime: 30000,
  })
}

export function useRefreshScore(agentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.refreshScore(agentId),
    onSuccess: (data) => {
      queryClient.setQueryData(['fullScore', agentId], data)
      queryClient.setQueryData(['score', agentId], {
        agent_id: data.agent_id,
        score: data.overall_score,
        feedback_count: data.feedback_count,
      })
    },
  })
}

export function useAgents(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['agents', page, pageSize],
    queryFn: () => api.getAgents(page, pageSize),
    staleTime: 60000,
  })
}
