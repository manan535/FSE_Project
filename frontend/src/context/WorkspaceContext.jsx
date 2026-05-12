import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/workspaces/my');
      setWorkspaces(data);
      
      if (user?.currentWorkspace) {
        const current = data.find(w => w._id === user.currentWorkspace);
        if (current) {
          setCurrentWorkspace(current);
          axios.defaults.headers.common['x-workspace-id'] = current._id;
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (workspaceData) => {
    // Support both old (string name) and new (object with branding) signatures
    const payload = typeof workspaceData === 'string'
      ? { name: workspaceData }
      : workspaceData;

    const { data } = await axios.post('/api/tenant/create', payload);
    await fetchWorkspaces();
    await switchWorkspace(data._id);
    return data;
  };

  const switchWorkspace = async (workspaceId) => {
    const { data } = await axios.post('/api/workspaces/switch', { workspaceId });
    setCurrentWorkspace(data);
    axios.defaults.headers.common['x-workspace-id'] = data._id;
    return data;
  };

  const joinWorkspace = async (inviteCode) => {
    const { data } = await axios.post('/api/workspaces/join', { inviteCode });
    await fetchWorkspaces();
    await switchWorkspace(data._id);
    return data;
  };

  const value = {
    currentWorkspace,
    workspaces,
    loading,
    createWorkspace,
    switchWorkspace,
    joinWorkspace,
    fetchWorkspaces
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};