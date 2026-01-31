import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { orgNodes as seedOrg, budgets as seedBudgets, proposals as seedProposals, actuals as seedActuals, requisitions as seedRequisitions, transfers as seedTransfers } from '../data/seed';

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
  transfers: seedTransfers,
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
      // Collect orgs from the approver down to the requesting org
      const approverOrg = action.payload.approvedBy;
      const affectedOrgIds = [];
      let current = proposal.orgId;
      while (current) {
        affectedOrgIds.push(current);
        if (current === approverOrg) break;
        const node = state.orgNodes.find(n => n.id === current);
        current = node?.parentId || null;
      }
      const updatedBudgets = state.budgets.map(b =>
        affectedOrgIds.includes(b.orgId) && b.year === proposal.year ? { ...b, budgetedHC: b.budgetedHC + proposal.delta } : b
      );
      const updatedProposals = state.proposals.map(p =>
        p.id === action.payload.id ? { ...p, status: 'approved', approvedBy: approverOrg } : p
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

    // --- Budget Transfers ---
    case 'ADD_TRANSFER':
      return { ...state, transfers: [...state.transfers, { ...action.payload, id: uuid(), status: 'pending_acceptance', createdAt: new Date().toISOString().slice(0, 10) }] };
    case 'UPDATE_TRANSFER':
      return { ...state, transfers: state.transfers.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'DELETE_TRANSFER':
      return { ...state, transfers: state.transfers.filter(t => t.id !== action.payload) };
    case 'CANCEL_TRANSFER':
      return { ...state, transfers: state.transfers.map(t => t.id === action.payload ? { ...t, status: 'cancelled' } : t) };
    case 'ACCEPT_TRANSFER': {
      const transfer = state.transfers.find(t => t.id === action.payload.id);
      if (!transfer) return state;
      const updatedBudgets = state.budgets.map(b => {
        if (b.orgId === transfer.fromOrgId && b.year === transfer.year) return { ...b, budgetedHC: b.budgetedHC - transfer.amount };
        if (b.orgId === transfer.toOrgId && b.year === transfer.year) return { ...b, budgetedHC: b.budgetedHC + transfer.amount };
        return b;
      });
      const updatedTransfers = state.transfers.map(t =>
        t.id === action.payload.id ? { ...t, status: 'accepted', acceptedBy: action.payload.acceptedBy } : t
      );
      return { ...state, transfers: updatedTransfers, budgets: updatedBudgets };
    }
    case 'REJECT_TRANSFER':
      return { ...state, transfers: state.transfers.map(t => t.id === action.payload.id ? { ...t, status: 'rejected', acceptedBy: action.payload.rejectedBy } : t) };

    // --- Bulk Import ---
    case 'IMPORT_ORG_NODES':
      return { ...state, orgNodes: action.payload };
    case 'IMPORT_BUDGETS':
      return { ...state, budgets: action.payload };
    case 'IMPORT_ACTUALS':
      return { ...state, actuals: action.payload };
    case 'IMPORT_PROPOSALS':
      return { ...state, proposals: action.payload };
    case 'IMPORT_REQUISITIONS':
      return { ...state, requisitions: action.payload };

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
  ADD_TRANSFER: 'Proposed budget transfer',
  UPDATE_TRANSFER: 'Updated budget transfer',
  DELETE_TRANSFER: 'Deleted budget transfer',
  CANCEL_TRANSFER: 'Cancelled budget transfer',
  ACCEPT_TRANSFER: 'Accepted budget transfer',
  REJECT_TRANSFER: 'Rejected budget transfer',
  IMPORT_ORG_NODES: 'Imported organization structure from CSV',
  IMPORT_BUDGETS: 'Imported budgets from CSV',
  IMPORT_ACTUALS: 'Imported actuals from CSV',
  IMPORT_PROPOSALS: 'Imported proposals from CSV',
  IMPORT_REQUISITIONS: 'Imported requisitions from CSV',
  ADD_ORG_NODE: 'Added organization unit',
  UPDATE_ORG_NODE: 'Updated organization unit',
  DELETE_ORG_NODE: 'Deleted organization unit',
};

function buildDetail(state, action) {
  const getOrgTitle = (id) => state.orgNodes.find(n => n.id === id)?.title || id;
  const getActualName = (id) => state.actuals.find(a => a.id === id)?.name || id;

  switch (action.type) {
    case 'ADD_PROPOSAL':
    case 'UPDATE_PROPOSAL':
      return `"${action.payload.title}" (delta: ${action.payload.delta > 0 ? '+' : ''}${action.payload.delta}) for ${getOrgTitle(action.payload.orgId)}`;
    case 'DELETE_PROPOSAL': {
      const p = state.proposals.find(x => x.id === action.payload);
      return p ? `"${p.title}" for ${getOrgTitle(p.orgId)}` : '';
    }
    case 'SUBMIT_PROPOSAL': {
      const p = state.proposals.find(x => x.id === action.payload);
      return p ? `"${p.title}" (delta: ${p.delta > 0 ? '+' : ''}${p.delta}) for ${getOrgTitle(p.orgId)}` : '';
    }
    case 'APPROVE_PROPOSAL':
    case 'REJECT_PROPOSAL': {
      const p = state.proposals.find(x => x.id === action.payload.id);
      return p ? `"${p.title}" (delta: ${p.delta > 0 ? '+' : ''}${p.delta}) for ${getOrgTitle(p.orgId)}` : '';
    }
    case 'ESCALATE_PROPOSAL': {
      const p = state.proposals.find(x => x.id === action.payload.id);
      return p ? `"${p.title}" from ${getOrgTitle(p.requestedBy)} to ${getOrgTitle(action.payload.escalatedByOrg)}'s superior` : '';
    }
    case 'ADD_BUDGET':
    case 'UPDATE_BUDGET':
      return `${getOrgTitle(action.payload.orgId)}: budgetedHC = ${action.payload.budgetedHC}`;
    case 'DELETE_BUDGET': {
      const b = state.budgets.find(x => x.id === action.payload);
      return b ? `${getOrgTitle(b.orgId)}` : '';
    }
    case 'ADD_ACTUAL':
    case 'UPDATE_ACTUAL':
      return `${action.payload.name} in ${getOrgTitle(action.payload.orgId)}${action.payload.isHead ? ' (head)' : ''}`;
    case 'DELETE_ACTUAL': {
      const a = state.actuals.find(x => x.id === action.payload);
      return a ? `${a.name} from ${getOrgTitle(a.orgId)}` : '';
    }
    case 'ADD_REQUISITION':
    case 'UPDATE_REQUISITION':
      return `"${action.payload.role}" (${action.payload.type === 'new_position' ? 'new position' : 'substitution'}) for ${getOrgTitle(action.payload.orgId)}`;
    case 'DELETE_REQUISITION': {
      const r = state.requisitions.find(x => x.id === action.payload);
      return r ? `"${r.role}" for ${getOrgTitle(r.orgId)}` : '';
    }
    case 'SUBMIT_REQUISITION':
    case 'OPEN_REQUISITION':
    case 'FILL_REQUISITION':
    case 'CANCEL_REQUISITION': {
      const r = state.requisitions.find(x => x.id === action.payload);
      return r ? `"${r.role}" for ${getOrgTitle(r.orgId)}` : '';
    }
    case 'APPROVE_REQUISITION':
    case 'REJECT_REQUISITION': {
      const r = state.requisitions.find(x => x.id === action.payload.id);
      return r ? `"${r.role}" (${r.type === 'new_position' ? 'new position' : 'substitution'}) for ${getOrgTitle(r.orgId)}` : '';
    }
    case 'ADD_ORG_NODE':
    case 'UPDATE_ORG_NODE':
      return `"${action.payload.title}"`;
    case 'DELETE_ORG_NODE': {
      const n = state.orgNodes.find(x => x.id === action.payload);
      return n ? `"${n.title}"` : '';
    }
    case 'ADD_TRANSFER':
    case 'UPDATE_TRANSFER':
      return `${action.payload.amount} HC from ${getOrgTitle(action.payload.fromOrgId)} to ${getOrgTitle(action.payload.toOrgId)} (${action.payload.year})`;
    case 'DELETE_TRANSFER':
    case 'CANCEL_TRANSFER': {
      const t = state.transfers.find(x => x.id === (action.payload.id || action.payload));
      return t ? `${t.amount} HC from ${getOrgTitle(t.fromOrgId)} to ${getOrgTitle(t.toOrgId)}` : '';
    }
    case 'ACCEPT_TRANSFER':
    case 'REJECT_TRANSFER': {
      const t = state.transfers.find(x => x.id === action.payload.id);
      return t ? `${t.amount} HC from ${getOrgTitle(t.fromOrgId)} to ${getOrgTitle(t.toOrgId)} (${t.year})` : '';
    }
    case 'IMPORT_ORG_NODES':
      return `${action.payload.length} organization units`;
    case 'IMPORT_BUDGETS':
      return `${action.payload.length} budget entries`;
    case 'IMPORT_ACTUALS':
      return `${action.payload.length} employee records`;
    case 'IMPORT_PROPOSALS':
      return `${action.payload.length} proposals`;
    case 'IMPORT_REQUISITIONS':
      return `${action.payload.length} requisitions`;
    default:
      return '';
  }
}

function auditReducer(state, action) {
  const detail = AUDITED_ACTIONS[action.type] ? buildDetail(state, action) : '';
  const newState = reducer(state, action);
  const description = AUDITED_ACTIONS[action.type];
  if (!description) return newState;
  const entry = {
    id: uuid(),
    action: action.type,
    description,
    detail,
    userId: state.currentUserId,
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
