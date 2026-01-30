import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { orgNodes as seedOrg, budgets as seedBudgets, proposals as seedProposals, actuals as seedActuals, requisitions as seedRequisitions } from '../data/seed';

const AppContext = createContext();

// Current user is identified by the head actual of an org unit
const initialHead = seedActuals.find(a => a.orgId === seedOrg[0].id && a.isHead);

const initialState = {
  currentUserId: initialHead?.id || null, // actual id of the acting user
  orgNodes: seedOrg,
  budgets: seedBudgets,
  proposals: seedProposals,
  actuals: seedActuals,
  requisitions: seedRequisitions,
  auditLog: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUserId: action.payload };

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
      // Collect the target org and all its ancestors
      const affectedOrgIds = [];
      let current = proposal.orgId;
      while (current) {
        affectedOrgIds.push(current);
        const node = state.orgNodes.find(n => n.id === current);
        current = node?.parentId || null;
      }
      const updatedBudgets = state.budgets.map(b =>
        affectedOrgIds.includes(b.orgId) ? { ...b, budgetedHC: b.budgetedHC + proposal.delta } : b
      );
      const updatedProposals = state.proposals.map(p =>
        p.id === action.payload.id ? { ...p, status: 'approved', approvedBy: action.payload.approvedBy } : p
      );
      return { ...state, proposals: updatedProposals, budgets: updatedBudgets };
    }
    case 'ESCALATE_PROPOSAL': {
      // Move the proposal up: the current approver's org becomes the new requestedBy,
      // so the proposal appears in the next-level superior's approval queue
      const escalatorOrg = action.payload.escalatedByOrg;
      const escalatorNode = state.orgNodes.find(n => n.id === escalatorOrg);
      const parentOrgId = escalatorNode?.parentId || null;
      if (!parentOrgId) return state; // already at top, cannot escalate
      return { ...state, proposals: state.proposals.map(p =>
        p.id === action.payload.id
          ? { ...p, requestedBy: escalatorOrg, escalatedFrom: p.requestedBy, escalatedBy: action.payload.escalatedByOrg }
          : p
      ) };
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

    // --- Requisitions ---
    case 'ADD_REQUISITION':
      return { ...state, requisitions: [...state.requisitions, { ...action.payload, id: uuid(), status: 'draft', createdAt: new Date().toISOString().slice(0, 10) }] };
    case 'UPDATE_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'DELETE_REQUISITION':
      return { ...state, requisitions: state.requisitions.filter(r => r.id !== action.payload) };
    case 'SUBMIT_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload ? { ...r, status: 'pending_approval' } : r) };
    case 'APPROVE_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload.id ? { ...r, status: 'approved', approvedBy: action.payload.approvedBy } : r) };
    case 'REJECT_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload.id ? { ...r, status: 'rejected', approvedBy: action.payload.rejectedBy } : r) };
    case 'OPEN_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload ? { ...r, status: 'open' } : r) };
    case 'FILL_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload ? { ...r, status: 'filled' } : r) };
    case 'CANCEL_REQUISITION':
      return { ...state, requisitions: state.requisitions.map(r => r.id === action.payload ? { ...r, status: 'cancelled' } : r) };

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

const AUDITED_ACTIONS = {
  ADD_PROPOSAL: 'Created budget change proposal',
  UPDATE_PROPOSAL: 'Updated budget change proposal',
  DELETE_PROPOSAL: 'Deleted budget change proposal',
  SUBMIT_PROPOSAL: 'Submitted budget change proposal for approval',
  APPROVE_PROPOSAL: 'Approved budget change proposal',
  REJECT_PROPOSAL: 'Rejected budget change proposal',
  ESCALATE_PROPOSAL: 'Escalated budget change proposal to superior',
  ADD_BUDGET: 'Created budget entry',
  UPDATE_BUDGET: 'Updated budget entry',
  DELETE_BUDGET: 'Deleted budget entry',
  ADD_ACTUAL: 'Added employee',
  UPDATE_ACTUAL: 'Updated employee record',
  DELETE_ACTUAL: 'Deleted employee record',
  ADD_REQUISITION: 'Created job requisition',
  UPDATE_REQUISITION: 'Updated job requisition',
  DELETE_REQUISITION: 'Deleted job requisition',
  SUBMIT_REQUISITION: 'Submitted job requisition for approval',
  APPROVE_REQUISITION: 'Approved job requisition',
  REJECT_REQUISITION: 'Rejected job requisition',
  OPEN_REQUISITION: 'Opened job requisition for candidates',
  FILL_REQUISITION: 'Marked job requisition as filled',
  CANCEL_REQUISITION: 'Cancelled job requisition',
  ADD_ORG_NODE: 'Added organization unit',
  UPDATE_ORG_NODE: 'Updated organization unit',
  DELETE_ORG_NODE: 'Deleted organization unit',
};

function auditReducer(state, action) {
  const newState = reducer(state, action);
  const description = AUDITED_ACTIONS[action.type];
  if (!description) return newState;
  const entry = {
    id: uuid(),
    action: action.type,
    description,
    userId: state.currentUserId,
    payload: action.payload,
    timestamp: new Date().toISOString(),
  };
  return { ...newState, auditLog: [entry, ...newState.auditLog] };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(auditReducer, initialState);

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

  // Count active actuals for an org unit (heads are counted like anyone else)
  const getActualCount = useCallback((orgId) => {
    return state.actuals.filter(a => a.orgId === orgId && a.status === 'active').length;
  }, [state.actuals]);

  // Get the head (person) of an org unit
  const getHead = useCallback((orgId) => {
    return state.actuals.find(a => a.orgId === orgId && a.isHead && a.status === 'active') || null;
  }, [state.actuals]);

  // Current user derived from currentUserId
  const currentUser = state.actuals.find(a => a.id === state.currentUserId) || null;
  // The org unit the current user heads
  const currentUserOrgId = currentUser?.orgId || null;

  return (
    <AppContext.Provider value={{
      ...state,
      currentUser,
      currentUserOrgId,
      dispatch,
      getChildren,
      getDescendantIds,
      getParent,
      getNode,
      getActualCount,
      getHead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
