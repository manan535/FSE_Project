import { create } from 'zustand';
import axios from 'axios';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get('/api/projects');
      set({ projects: data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch projects', loading: false });
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post('/api/projects', projectData);
      set((state) => ({
        projects: [{ ...data, taskCounts: { todo: 0, in_progress: 0, done: 0, total: 0 } }, ...state.projects],
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create project', loading: false });
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    set({ error: null });
    try {
      const { data } = await axios.put(`/api/projects/${id}`, projectData);
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? { ...data, taskCounts: p.taskCounts } : p)),
        currentProject: state.currentProject?._id === id ? { ...data, taskCounts: state.currentProject.taskCounts } : state.currentProject
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update project' });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ error: null });
    try {
      await axios.delete(`/api/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete project' });
      throw error;
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get(`/api/projects/${id}`);
      set({ currentProject: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch project', loading: false });
      throw error;
    }
  }
}));

export default useProjectStore;
