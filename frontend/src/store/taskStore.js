import { create } from 'zustand';
import axios from 'axios';

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  // UI state
  isTaskModalOpen: false,
  editingTask: null,
  defaultStatus: 'todo',

  // Computed: tasks grouped by status
  getColumns: () => {
    const tasks = get().tasks;
    return {
      todo: tasks.filter((t) => t.status === 'todo').sort((a, b) => a.position - b.position),
      in_progress: tasks.filter((t) => t.status === 'in_progress').sort((a, b) => a.position - b.position),
      done: tasks.filter((t) => t.status === 'done').sort((a, b) => a.position - b.position)
    };
  },

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const url = projectId ? `/api/tasks/project/${projectId}` : '/api/tasks';
      const { data } = await axios.get(url);
      set({ tasks: data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (taskData) => {
    set({ error: null });
    try {
      const { data } = await axios.post('/api/tasks', taskData);
      set((state) => ({
        tasks: [...state.tasks, data],
        isTaskModalOpen: false,
        editingTask: null
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create task' });
      throw error;
    }
  },

  updateTask: async (id, taskData) => {
    set({ error: null });
    try {
      const { data } = await axios.put(`/api/tasks/${id}`, taskData);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? data : t)),
        isTaskModalOpen: false,
        editingTask: null
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update task' });
      throw error;
    }
  },

  // Optimistic drag-and-drop move
  moveTask: async (taskId, newStatus, newPosition) => {
    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id === taskId ? { ...t, status: newStatus, position: newPosition } : t
      )
    }));

    try {
      const { data } = await axios.patch(`/api/tasks/${taskId}/move`, {
        status: newStatus,
        position: newPosition
      });
      // Replace with server response
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? data : t))
      }));
    } catch (error) {
      // Rollback on failure
      set({ tasks: previousTasks, error: 'Failed to move task' });
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    try {
      await axios.delete(`/api/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        isTaskModalOpen: false,
        editingTask: null
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete task' });
      throw error;
    }
  },

  // UI actions
  openTaskModal: (task = null, defaultStatus = 'todo') => {
    set({ isTaskModalOpen: true, editingTask: task, defaultStatus });
  },

  closeTaskModal: () => {
    set({ isTaskModalOpen: false, editingTask: null });
  }
}));

export default useTaskStore;
