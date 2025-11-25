import { create } from 'zustand';

interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner_id: string;
  member_ids: string[];
  created_at: string;
}

interface WorkspaceStore {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentWorkspace: null,
  workspaces: [],
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) => set((state) => ({ 
    workspaces: [...state.workspaces, workspace] 
  })),
  updateWorkspace: (workspaceId, updates) => set((state) => ({
    workspaces: state.workspaces.map((ws) =>
      ws._id === workspaceId ? { ...ws, ...updates } : ws
    ),
    currentWorkspace: state.currentWorkspace?._id === workspaceId
      ? { ...state.currentWorkspace, ...updates }
      : state.currentWorkspace,
  })),
}));
