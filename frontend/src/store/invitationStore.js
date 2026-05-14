import { create } from 'zustand';
import axios from 'axios';

const useInvitationStore = create((set) => ({
  invitations: [],
  inviteInfo: null,
  loading: false,
  error: null,

  sendInvite: async (projectId, email, role = 'member') => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post(`/api/projects/${projectId}/invite`, { email, role });
      set((state) => ({
        invitations: [data.invitation, ...state.invitations],
        loading: false
      }));
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send invitation';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  fetchInvitations: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get(`/api/projects/${projectId}/invitations`);
      set({ invitations: data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch invitations', loading: false });
    }
  },

  fetchInviteInfo: async (token) => {
    set({ loading: true, error: null, inviteInfo: null });
    try {
      const { data } = await axios.get(`/api/invite/info/${token}`);
      set({ inviteInfo: data, loading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to fetch invite info';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  acceptInvite: async (token) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post(`/api/invite/accept/${token}`);
      set({ loading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to accept invitation';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  rejectInvite: async (token) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post(`/api/invite/reject/${token}`);
      set({ loading: false });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reject invitation';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  resendInvite: async (projectId, inviteId) => {
    set({ error: null });
    try {
      const { data } = await axios.post(`/api/projects/${projectId}/invite/${inviteId}/resend`);
      set((state) => ({
        invitations: state.invitations.map((inv) =>
          inv._id === inviteId ? { ...inv, status: 'pending', expiresAt: data.invitation.expiresAt } : inv
        )
      }));
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend invitation';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
  clearInviteInfo: () => set({ inviteInfo: null })
}));

export default useInvitationStore;
