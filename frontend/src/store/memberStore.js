import { create } from 'zustand';
import axios from 'axios';

const useMemberStore = create((set) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async (workspaceId) => {
    if (!workspaceId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get(`/api/workspaces/${workspaceId}/members`);
      // Extract user data from membership objects
      const members = data.map((m) => ({
        _id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role
      }));
      set({ members, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch members', loading: false });
    }
  }
}));

export default useMemberStore;
