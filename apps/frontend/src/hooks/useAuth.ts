import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthContext();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.data.accessToken, data.data.refreshToken);
      // Add createdAt if missing
      const user = {
        ...data.data.user,
        createdAt: new Date().toISOString(),
      };
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showNotification('Uspešno ste se prijavili', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri prijavi',
        'error',
      );
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      showNotification('Uspešno ste se registrovali', 'success');
    },
    onError: (error: any) => {
      showNotification(
        error.response?.data?.message || 'Greška pri registraciji',
        'error',
      );
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthContext();
  const queryClient = useQueryClient();

  return () => {
    clearAuth();
    queryClient.clear();
  };
};
