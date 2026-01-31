import { v4 as uuid } from 'uuid';

// --- Organization hierarchy (tree of positions, not people) ---
const orgNodes = [
  { id: 'u1', title: 'CEO', parentId: null },
  { id: 'u2', title: 'VP Engineering', parentId: 'u1' },
  { id: 'u3', title: 'VP Sales', parentId: 'u1' },
  { id: 'u4', title: 'VP Finance', parentId: 'u1' },
  { id: 'u5', title: 'Dir. Frontend', parentId: 'u2' },
  { id: 'u6', title: 'Dir. Backend', parentId: 'u2' },
  { id: 'u7', title: 'Dir. Sales West', parentId: 'u3' },
  { id: 'u8', title: 'Dir. Sales East', parentId: 'u3' },
  { id: 'u9', title: 'Mgr. UI Team', parentId: 'u5' },
  { id: 'u10', title: 'Mgr. Platform', parentId: 'u6' },
];

// --- Headcount budget per org node (annual) ---
const b_u2 = uuid(), b_u3 = uuid(), b_u4 = uuid(), b_u5 = uuid(), b_u6 = uuid(), b_u7 = uuid(), b_u8 = uuid(), b_u9 = uuid(), b_u10 = uuid();
const budgets = [
  { id: b_u2, orgId: 'u2', year: 2025, budgetedHC: 40, notes: 'Engineering org budget' },
  { id: b_u3, orgId: 'u3', year: 2025, budgetedHC: 25, notes: 'Sales org budget' },
  { id: b_u4, orgId: 'u4', year: 2025, budgetedHC: 10, notes: 'Finance org budget' },
  { id: b_u5, orgId: 'u5', year: 2025, budgetedHC: 15, notes: 'Frontend team budget' },
  { id: b_u6, orgId: 'u6', year: 2025, budgetedHC: 20, notes: 'Backend team budget' },
  { id: b_u7, orgId: 'u7', year: 2025, budgetedHC: 12, notes: 'Sales West budget' },
  { id: b_u8, orgId: 'u8', year: 2025, budgetedHC: 13, notes: 'Sales East budget' },
  { id: b_u9, orgId: 'u9', year: 2025, budgetedHC: 8, notes: 'UI team budget' },
  { id: b_u10, orgId: 'u10', year: 2025, budgetedHC: 10, notes: 'Platform team budget' },
];

// Budget Change Proposals: requests to change the budget (delta = headcount change, positive or negative)
// status: draft | pending_approval | approved | rejected
const p1 = uuid(), p2 = uuid(), p3 = uuid(), p4 = uuid(), p5 = uuid(), p6 = uuid();
const proposals = [
  { id: p1, orgId: 'u9', title: 'Hire Senior React Developers', delta: 2, year: 2025, justification: 'New product launch', status: 'approved', requestedBy: 'u9', approvedBy: 'u5', createdAt: '2025-01-10' },
  { id: p2, orgId: 'u9', title: 'Add UX Designer', delta: 1, year: 2025, justification: 'Improve design system', status: 'pending_approval', requestedBy: 'u9', approvedBy: null, createdAt: '2025-02-01' },
  { id: p3, orgId: 'u10', title: 'Add DevOps Engineer', delta: 1, year: 2025, justification: 'CI/CD improvements', status: 'approved', requestedBy: 'u10', approvedBy: 'u6', createdAt: '2025-01-15' },
  { id: p4, orgId: 'u6', title: 'Add Staff Backend Engineer', delta: 1, year: 2025, justification: 'Tech lead for new service', status: 'pending_approval', requestedBy: 'u6', approvedBy: null, createdAt: '2025-02-10' },
  { id: p5, orgId: 'u7', title: 'Expand Account Executive team', delta: 3, year: 2025, justification: 'Q2 expansion', status: 'draft', requestedBy: 'u7', approvedBy: null, createdAt: '2025-02-15' },
  { id: p6, orgId: 'u8', title: 'Reduce Sales East contractors', delta: -2, year: 2025, justification: 'Consolidating with in-house', status: 'draft', requestedBy: 'u8', approvedBy: null, createdAt: '2025-02-20' },
];

// Actuals – people currently filling positions. isHead marks the org unit head.
const actuals = [
  { id: uuid(), orgId: 'u1', name: 'Alice Chen', role: 'CEO', startDate: '2020-01-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u2', name: 'Bob Martinez', role: 'VP Engineering', startDate: '2021-03-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u3', name: 'Carol Smith', role: 'VP Sales', startDate: '2021-06-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u4', name: 'Dan Lee', role: 'VP Finance', startDate: '2022-01-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u5', name: 'Eve Johnson', role: 'Dir. Frontend', startDate: '2022-04-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u6', name: 'Frank Brown', role: 'Dir. Backend', startDate: '2022-02-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u7', name: 'Grace Kim', role: 'Dir. Sales West', startDate: '2022-07-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u8', name: 'Hank Davis', role: 'Dir. Sales East', startDate: '2022-09-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u9', name: 'Ivy Wang', role: 'Mgr. UI Team', startDate: '2023-01-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u10', name: 'Jake Patel', role: 'Mgr. Platform', startDate: '2023-03-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u9', name: 'Tom Harris', role: 'React Developer', startDate: '2024-06-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u9', name: 'Sara Lopez', role: 'React Developer', startDate: '2024-09-15', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u9', name: 'Mike Chen', role: 'React Developer', startDate: '2025-01-20', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Nina Petrov', role: 'Platform Engineer', startDate: '2024-03-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Oscar Reyes', role: 'DevOps Engineer', startDate: '2024-07-10', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Paula Grant', role: 'Platform Engineer', startDate: '2025-02-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u6', name: 'Quinn Foster', role: 'Backend Engineer', startDate: '2023-11-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u7', name: 'Rachel Adams', role: 'Account Executive', startDate: '2024-01-15', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u7', name: 'Steve Ng', role: 'Account Executive', startDate: '2024-05-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u8', name: 'Tina Brooks', role: 'Account Executive', startDate: '2024-08-01', status: 'active', isHead: false },
];

// Job Requisitions: requests to fill a specific position (new or substitution)
// type: new_position | substitution
// fundingType: 'budget' (existing approved budget) | 'proposal' (linked to a budget change proposal)
// fundingId: id of the budget entry or proposal
// status: draft | pending_approval | approved | rejected | open | filled | cancelled
const requisitions = [
  { id: uuid(), orgId: 'u9', role: 'Senior React Developer', type: 'new_position', fundingType: 'proposal', fundingId: p1, justification: 'Approved in budget expansion', replacingName: null, status: 'open', requestedBy: 'u9', approvedBy: 'u5', createdAt: '2025-01-15' },
  { id: uuid(), orgId: 'u10', role: 'DevOps Engineer', type: 'new_position', fundingType: 'proposal', fundingId: p3, justification: 'CI/CD pipeline ownership', replacingName: null, status: 'filled', requestedBy: 'u10', approvedBy: 'u6', createdAt: '2025-01-20' },
  { id: uuid(), orgId: 'u9', role: 'React Developer', type: 'substitution', fundingType: 'budget', fundingId: b_u9, justification: 'Replacing departed team member', replacingName: 'John Doe', status: 'pending_approval', requestedBy: 'u9', approvedBy: null, createdAt: '2025-02-05' },
  { id: uuid(), orgId: 'u7', role: 'Account Executive', type: 'new_position', fundingType: 'proposal', fundingId: p5, justification: 'Territory expansion Q2', replacingName: null, status: 'draft', requestedBy: 'u7', approvedBy: null, createdAt: '2025-02-18' },
  { id: uuid(), orgId: 'u6', role: 'Backend Engineer', type: 'substitution', fundingType: 'budget', fundingId: b_u6, justification: 'Replacing engineer moving to Platform team', replacingName: 'Alex Turner', status: 'approved', requestedBy: 'u6', approvedBy: 'u2', createdAt: '2025-02-12' },
];

// Budget Transfers: org-to-org budget reallocation
// status: pending_acceptance | accepted | rejected | cancelled
const transfers = [
  { id: uuid(), fromOrgId: 'u8', toOrgId: 'u7', amount: 2, year: 2025, reason: 'Sales East over-staffed, Sales West expanding', status: 'pending_acceptance', proposedBy: 'u8', acceptedBy: null, createdAt: '2025-02-25' },
  { id: uuid(), fromOrgId: 'u6', toOrgId: 'u5', amount: 1, year: 2025, reason: 'Backend lending 1 HC to Frontend for shared project', status: 'accepted', proposedBy: 'u6', acceptedBy: 'u5', createdAt: '2025-01-28' },
];

export { orgNodes, budgets, proposals, actuals, requisitions, transfers };
