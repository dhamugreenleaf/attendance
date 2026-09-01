import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../services/leave.api';

export const useMyLeaves = () => {
  return useQuery({
    queryKey: ['myLeaves'],
    queryFn: leaveApi.getMyLeaves,
  });
};

export const usePendingLeaves = () => {
  return useQuery({
    queryKey: ['pendingLeaves'],
    queryFn: leaveApi.getPendingLeaves,
  });
};

export const useCreateLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: leaveApi.createLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
    },
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => leaveApi.updateLeaveStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['pendingLeaves'] });
    },
  });
};
