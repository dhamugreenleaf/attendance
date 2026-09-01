import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi } from '../services/permission.api';

export const useMyPermissions = () => {
  return useQuery({
    queryKey: ['myPermissions'],
    queryFn: permissionApi.getMyPermissions,
  });
};

export const usePendingPermissions = () => {
  return useQuery({
    queryKey: ['pendingPermissions'],
    queryFn: permissionApi.getPendingPermissions,
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: permissionApi.createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPermissions'] });
    },
  });
};

export const useUpdatePermissionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => permissionApi.updatePermissionStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPermissions'] });
    },
  });
};
