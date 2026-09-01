import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../services/team.api';

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: teamApi.getTeams,
  });
};

export const useTeam = (id) => {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamApi.getTeamById(id),
    enabled: !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamApi.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => teamApi.updateTeam(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamApi.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};
