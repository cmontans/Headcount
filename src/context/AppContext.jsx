import { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { orgNodes as seedOrg, budgets as seedBudgets, proposals as seedProposals, actuals as seedActuals, requisitions as seedRequisitions, transfers as seedTransfers, challenges as seedChallenges } from '../data/seed';
import { inferOrgHierarchy } from '../utils/xlsx';

const AppContext = createContext();

const STORAGE_KEY = 'headcount_app_state';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // corrupted data — fall through to seed
  }
  return null;
}

function persistState(state) {
  try {
    const { auditLog, ...rest } = state;
    // Keep only last 500 audit entries to avoid exceeding localStorage quota
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, auditLog: auditLog.slice(0, 500) }));
  } catch (e) {
    // quota exceeded — silently fail
  }
}

// Current user is identified by the head actual of an org unit
const initialHead = seedActuals.find(a => a.orgId === seedOrg[0].id && a.isHead);

const seedState = {
  currentUserId: initialHead?.id || null,
  orgNodes: seedOrg,
  budgets: seedBudgets,
  proposals: seedProposals,
  actuals: seedActuals,
  requisitions: seedRequisitions,
  transfers: seedTransfers,
  challenges: seedChallenges,
  auditLog: [],
};

const initialState = loadPersistedState() || seedState;

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER': {
      const s = { ...state, currentUserId: action.payload };
      persistState(s);
      return s;
    }

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
      const approverOrg = action.payload.approvedBy;
      // Only apply delta to the target org's budget (no downstream propagation)
      const updatedBudgets = state.budgets.map(b =>
        b.orgId === proposal.orgId && b.year === proposal.year ? { ...b, budgetedHC: b.budgetedHC + proposal.delta } : b
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
      return {
        ...state, proposals: state.proposals.map(p =>
          p.id === action.payload.id
            ? { ...p, requestedBy: escalatorOrg, escalatedFrom: p.requestedBy, escalatedBy: action.payload.escalatedByOrg }
            : p
        )
      };
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

    // --- Budget Challenges ---
    case 'ADD_CHALLENGE':
      return { ...state, challenges: [...state.challenges, { ...action.payload, id: uuid(), status: 'pending', createdAt: new Date().toISOString().slice(0, 10) }] };
    case 'UPDATE_CHALLENGE':
      return { ...state, challenges: state.challenges.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case 'DELETE_CHALLENGE':
      return { ...state, challenges: state.challenges.filter(c => c.id !== action.payload) };
    case 'ACKNOWLEDGE_CHALLENGE': {
      const challenge = state.challenges.find(c => c.id === action.payload.id);
      if (!challenge) return state;
      const updatedBudgets = state.budgets.map(b =>
        b.orgId === challenge.targetOrgId && b.year === challenge.year ? { ...b, budgetedHC: b.budgetedHC - challenge.amount } : b
      );
      const updatedChallenges = state.challenges.map(c =>
        c.id === action.payload.id ? { ...c, status: 'acknowledged', acknowledgedBy: action.payload.acknowledgedBy } : c
      );
      return { ...state, challenges: updatedChallenges, budgets: updatedBudgets };
    }
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

    // --- XLSX Upsert Import (orgs + employees) ---
    case 'IMPORT_XLSX_ORGS_EMPLOYEES': {
      const { orgs, employees } = action.payload;
      let updatedOrgNodes = [...state.orgNodes];
      let updatedActuals = [...state.actuals];
      const orgIdMap = {}; // orgTitle -> internal id

      // Upsert orgs: match by title (case-insensitive)
      for (const org of orgs) {
        const existing = updatedOrgNodes.find(
          (n) => n.title.toLowerCase().trim() === org.title.toLowerCase().trim()
        );
        if (existing) {
          orgIdMap[org.title] = existing.id;
        } else {
          const newId = uuid();
          orgIdMap[org.title] = newId;
          updatedOrgNodes.push({ id: newId, title: org.title, parentId: null });
        }
      }

      // Infer parent-child hierarchy from org name prefixes
      // e.g. "TASTO5" becomes child of "TASTO"
      const hierarchyMap = inferOrgHierarchy(updatedOrgNodes, orgs);
      for (const [childTitle, parentTitle] of hierarchyMap) {
        const childId = orgIdMap[childTitle];
        const parentNode = updatedOrgNodes.find(
          (n) => n.title.toLowerCase().trim() === parentTitle.toLowerCase().trim()
        );
        if (childId && parentNode) {
          updatedOrgNodes = updatedOrgNodes.map((n) =>
            n.id === childId && !n.parentId ? { ...n, parentId: parentNode.id } : n
          );
        }
      }

      // Upsert employees: match by externalId first, then by name+org
      for (const emp of employees) {
        const orgId = orgIdMap[emp.orgTitle];
        if (!orgId) continue;

        const existingByExtId = emp.externalId
          ? updatedActuals.find((a) => a.externalId === emp.externalId)
          : null;
        const existingByName = !existingByExtId
          ? updatedActuals.find(
            (a) =>
              a.name.toLowerCase().trim() === emp.name.toLowerCase().trim() &&
              a.orgId === orgId
          )
          : null;
        const existing = existingByExtId || existingByName;

        if (existing) {
          // If marking as head, clear previous head in that org
          if (emp.isHead && !existing.isHead) {
            updatedActuals = updatedActuals.map((a) =>
              a.orgId === orgId && a.isHead && a.id !== existing.id
                ? { ...a, isHead: false }
                : a
            );
          }
          updatedActuals = updatedActuals.map((a) =>
            a.id === existing.id
              ? {
                ...a,
                name: emp.name,
                role: emp.role,
                orgId,
                externalId: emp.externalId,
                ...(emp.isHead ? { isHead: true } : {}),
              }
              : a
          );
        } else {
          // New employee — clear existing head if this one is head
          if (emp.isHead) {
            updatedActuals = updatedActuals.map((a) =>
              a.orgId === orgId && a.isHead ? { ...a, isHead: false } : a
            );
          }
          updatedActuals.push({
            id: uuid(),
            orgId,
            name: emp.name,
            role: emp.role,
            startDate: new Date().toISOString().slice(0, 10),
            status: 'active',
            isHead: emp.isHead,
            externalId: emp.externalId,
          });
        }
      }

      return { ...state, orgNodes: updatedOrgNodes, actuals: updatedActuals };
    }

    case 'AUTO_FILL_BUDGETS': {
      const year = new Date().getFullYear();
      let newBudgets = [...state.budgets];

      for (const org of state.orgNodes) {
        // Count active actuals for this org
        const count = state.actuals.filter(
          (a) => a.orgId === org.id && a.status === 'active'
        ).length;

        // Find existing budget
        const existingIdx = newBudgets.findIndex(
          (b) => b.orgId === org.id && b.year === year
        );

        if (existingIdx >= 0) {
          // Update existing
          newBudgets[existingIdx] = {
            ...newBudgets[existingIdx],
            budgetedHC: count,
          };
        } else {
          // Create new
          newBudgets.push({
            id: uuid(),
            orgId: org.id,
            year: year,
            budgetedHC: count,
            notes: 'Auto-generated from Actuals',
          });
        }
      }
      return { ...state, budgets: newBudgets };
    }
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

    case 'RESET_TO_SEED':
      // This is handled in auditReducer wrapper, but we include it here for completeness or direct calls
      return seedState;

    case 'CLEAR_ALL_DATA':
      return {
        ...state,
        currentUserId: null,
        orgNodes: [],
        budgets: [],
        proposals: [],
        actuals: [],
        requisitions: [],
        transfers: [],
        challenges: [],
        // auditLog is handled by wrapper or preserved depending on implementation, 
        // but generally we might want to keep the log of the deletion event.
        // The auditReducer wrapper creates the log entry *after* this reducer runs.
      };

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
  ADD_CHALLENGE: 'Issued budget challenge',
  UPDATE_CHALLENGE: 'Updated budget challenge',
  DELETE_CHALLENGE: 'Deleted budget challenge',
  ACKNOWLEDGE_CHALLENGE: 'Acknowledged budget challenge',
  IMPORT_ORG_NODES: 'Imported organization structure from CSV',
  IMPORT_BUDGETS: 'Imported budgets from CSV',
  IMPORT_ACTUALS: 'Imported actuals from CSV',
  IMPORT_PROPOSALS: 'Imported proposals from CSV',
  IMPORT_REQUISITIONS: 'Imported requisitions from CSV',
  IMPORT_XLSX_ORGS_EMPLOYEES: 'Imported organizations and employees from XLSX',
  ADD_ORG_NODE: 'Added organization unit',
  UPDATE_ORG_NODE: 'Updated organization unit',
  UPDATE_ORG_NODE: 'Updated organization unit',
  DELETE_ORG_NODE: 'Deleted organization unit',
  RESET_TO_SEED: 'Reset application to default seed data',
  CLEAR_ALL_DATA: 'Deleted ALL organizations and employees',
  AUTO_FILL_BUDGETS: 'Auto-set budgets to match actuals',
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
    case 'ADD_CHALLENGE':
    case 'UPDATE_CHALLENGE':
      return `Reduce ${action.payload.amount} HC from ${getOrgTitle(action.payload.targetOrgId)} (${action.payload.year})`;
    case 'DELETE_CHALLENGE': {
      const ch = state.challenges.find(x => x.id === action.payload);
      return ch ? `${ch.amount} HC from ${getOrgTitle(ch.targetOrgId)}` : '';
    }
    case 'ACKNOWLEDGE_CHALLENGE': {
      const ch = state.challenges.find(x => x.id === action.payload.id);
      return ch ? `${ch.amount} HC from ${getOrgTitle(ch.targetOrgId)} (${ch.year})` : '';
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
    case 'IMPORT_XLSX_ORGS_EMPLOYEES':
      return `${action.payload.orgs.length} organizations, ${action.payload.employees.length} employees`;
    default:
      return '';
  }
}

function auditReducer(state, action) {
  if (action.type === 'RESET_TO_SEED') {
    localStorage.removeItem(STORAGE_KEY);
    return seedState;
  }
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
  const finalState = { ...newState, auditLog: [entry, ...newState.auditLog] };
  persistState(finalState);
  return finalState;
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

  // Accumulated budget: own budget + all descendants' budgets for a given year
  const getAccumulatedBudget = useCallback((orgId, year) => {
    const descIds = getDescendantIds(orgId);
    return state.budgets
      .filter(b => descIds.includes(b.orgId) && b.year === year)
      .reduce((sum, b) => sum + b.budgetedHC, 0);
  }, [state.budgets, getDescendantIds]);

  // Accumulated actuals: own actuals + all descendants' actuals
  const getAccumulatedActuals = useCallback((orgId) => {
    const descIds = getDescendantIds(orgId);
    return state.actuals.filter(a => descIds.includes(a.orgId) && a.status === 'active').length;
  }, [state.actuals, getDescendantIds]);

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
      getAccumulatedBudget,
      getAccumulatedActuals,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
