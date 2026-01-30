import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { orgNodes as seedOrg, budgets as seedBudgets, requirements as seedReqs, actuals as seedActuals } from '../data/seed';

const AppContext = createContext();

const initialState = {
  currentUser: seedOrg[0], // default to CEO
  orgNodes: seedOrg,
  budgets: seedBudgets,
  requirements: seedReqs,
  actuals: seedActuals,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    // --- Requirements ---
    case 'ADD_REQUIREMENT':
      return { ...state, requirements: [...state.requirements, { ...action.payload, id: uuid(), status: 'draft', createdAt: new Date().toISOString().slice(0, 10) }] };
    case 'UPDATE_REQUIREMENT':
      return { ...state, requirements: state.requirements.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'DELETE_REQUIREMENT':
      return { ...state, requirements: state.requirements.filter(r => r.id !== action.payload) };
    case 'SUBMIT_REQUIREMENT':
      return { ...state, requirements: state.requirements.map(r => r.id === action.payload ? { ...r, status: 'pending_approval' } : r) };
    case 'APPROVE_REQUIREMENT':
      return { ...state, requirements: state.requirements.map(r => r.id === action.payload.id ? { ...r, status: 'approved', approvedBy: action.payload.approvedBy } : r) };
    case 'REJECT_REQUIREMENT':
      return { ...state, requirements: state.requirements.map(r => r.id === action.payload.id ? { ...r, status: 'rejected', approvedBy: action.payload.rejectedBy } : r) };

    // --- Budgets ---
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, { ...action.payload, id: uuid() }] };
    case 'UPDATE_BUDGET':
      return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };

    // --- Actuals ---
    case 'ADD_ACTUAL':
      return { ...state, actuals: [...state.actuals, { ...action.payload, id: uuid(), status: 'active' }] };
    case 'UPDATE_ACTUAL':
      return { ...state, actuals: state.actuals.map(a => a.id === action.payload.id ? { ...a, ...action.payload } : a) };
    case 'DELETE_ACTUAL':
      return { ...state, actuals: state.actuals.filter(a => a.id !== action.payload) };

    // --- Org ---
    case 'ADD_ORG_NODE':
      return { ...state, orgNodes: [...state.orgNodes, { ...action.payload, id: uuid() }] };
    case 'UPDATE_ORG_NODE':
      return { ...state, orgNodes: state.orgNodes.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n) };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Helper: get direct children of an org node
  const getChildren = useCallback((parentId) => state.orgNodes.filter(n => n.parentId === parentId), [state.orgNodes]);

  // Helper: get all descendant ids (inclusive)
  const getDescendantIds = useCallback((nodeId) => {
    const ids = [nodeId];
    const queue = [nodeId];
    while (queue.length) {
      const current = queue.shift();
      const kids = state.orgNodes.filter(n => n.parentId === current);
      kids.forEach(k => { ids.push(k.id); queue.push(k.id); });
    }
    return ids;
  }, [state.orgNodes]);

  // Helper: get parent (immediate superior) of a node
  const getParent = useCallback((nodeId) => {
    const node = state.orgNodes.find(n => n.id === nodeId);
    return node ? state.orgNodes.find(n => n.id === node.parentId) || null : null;
  }, [state.orgNodes]);

  const getNode = useCallback((id) => state.orgNodes.find(n => n.id === id), [state.orgNodes]);

  return (
    <AppContext.Provider value={{ ...state, dispatch, getChildren, getDescendantIds, getParent, getNode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
