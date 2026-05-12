import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const token = ref<string | null>(api.getToken());
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function register(userData: any) {
    loading.value = true;
    error.value = null;
    try {
      const response: any = await api.post('/auth/register', userData);
      token.value = response.token;
      user.value = response.user;
      isAuthenticated.value = true;
      api.setToken(response.token);
      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const response: any = await api.post('/auth/login', { email, password });
      token.value = response.token;
      user.value = response.user;
      isAuthenticated.value = true;
      api.setToken(response.token);
      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    if (!token.value) return;
    loading.value = true;
    try {
      user.value = await api.get('/auth/me');
      isAuthenticated.value = true;
    } catch (err) {
      logout();
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    isAuthenticated.value = false;
    api.setToken(null);
  }

  async function updateProfile(profileData: any) {
    loading.value = true;
    try {
      user.value = await api.put('/auth/profile', profileData);
      return user.value;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  if (token.value) {
    fetchUser();
  }

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    fetchUser,
    updateProfile,
  };
});
