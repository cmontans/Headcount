import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { orgNodes as seedOrg, budgets as seedBudgets, proposals as seedProposals, actuals as seedActuals } from '../data/seed';

const AppContext = createContext();

const initialState = {
  currentUser: seedOrg[0], // default to CEO
  orgNodes: seedOrg,
  budgets: seedBudgets,
  proposals: seedProposals,
  actuals: seedActuals,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    // --- Proposals (budget change requests) ---
    case 'ADD_PROPOSAL':
      return { ...state, proposals: [...state.proposals, { ...action.payload, id: uuid(), status: 'draft', createdAt: new Date().toISOString().slice(0, 10) }] };
    case 'UPDATE_PROPOSAL':
      return { ...state, proposals: state.proposals.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'DELETE_PROPOSAL':
      return { ...state, proposals: state.proposals.filter(p => p.id !== action.payload) };
    case 'SUBMIT_PROPOSAL':
      return { ...state, proposals: state.proposals.map(p => p.id === action.payload ? { ...p, status: 'pending_approval' } : p) };
    case 'APPROVE_PROPOSAL': {
      const proposal = state.proposals.find(p => p.id === action.payload.id);
      if (!proposal) return state;
      // Apply delta to the matching budget
      const updatedBudgets = state.budgets.map(b =>
        b.orgId === proposal.orgId ? { ...b, budgetedHC: b.budgetedHC + proposal.delta } : b
      );
      const updatedProposals = state.proposals.map(p =>
        p.id === action.payload.id ? { ...p, status: 'approved', approvedBy: action.payload.approvedBy } : p
      );
      return { ...state, proposals: updatedProposals, budgets: updatedBudgets };
    }
    case 'REJECT_PROPOSAL':
      return { ...state, proposals: state.proposals.map(p => p.id === action.payload.id ? { ...p, status: 'rejected', approvedBy: action.payload.rejectedBy } : p) };

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
    case 'DELETE_ORG_NODE': {
      const target = state.orgNodes.find(n => n.id === action.payload);
      if (!target) return state;
      const updated = state.orgNodes
        .map(n => n.parentId === target.id ? { ...n, parentId: target.parentId } : n)
        .filter(n => n.id !== action.payload);
      return { ...state, orgNodes: updated };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getChildren = useCallback((parentId) => state.orgNodes.filter(n => n.parentId === parentId), [state.orgNodes]);

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

  const getParent = useCallback((nodeId) => {
    const node = state.orgNodes.find(n => n.id === nodeId);
    return node ? state.orgNodes.find(n => n.id === node.parentId) || null : null;
  }, [state.orgNodes]);

  const getNode = useCallback((id) => state.orgNodes.find(n => n.id === id), [state.orgNodes]);

  // Actual headcount for an org unit: explicit actuals + 1 for the head of the unit
  const getActualCount = useCallback((orgId) => {
    const explicit = state.actuals.filter(a => a.orgId === orgId && a.status === 'active').length;
    return explicit + 1; // +1 for the head/manager of this org unit
  }, [state.actuals]);

  return (
    <AppContext.Provider value={{ ...state, dispatch, getChildren, getDescendantIds, getParent, getNode, getActualCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
