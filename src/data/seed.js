import { v4 as uuid } from 'uuid';

// --- Organization hierarchy (tree) ---
// CEO -> VPs -> Directors -> Managers
const orgNodes = [
  { id: 'u1', name: 'Alice Chen', title: 'CEO', parentId: null },
  { id: 'u2', name: 'Bob Martinez', title: 'VP Engineering', parentId: 'u1' },
  { id: 'u3', name: 'Carol Smith', title: 'VP Sales', parentId: 'u1' },
  { id: 'u4', name: 'Dan Lee', title: 'VP Finance', parentId: 'u1' },
  { id: 'u5', name: 'Eve Johnson', title: 'Dir. Frontend', parentId: 'u2' },
  { id: 'u6', name: 'Frank Brown', title: 'Dir. Backend', parentId: 'u2' },
  { id: 'u7', name: 'Grace Kim', title: 'Dir. Sales West', parentId: 'u3' },
  { id: 'u8', name: 'Hank Davis', title: 'Dir. Sales East', parentId: 'u3' },
  { id: 'u9', name: 'Ivy Wang', title: 'Mgr. UI Team', parentId: 'u5' },
  { id: 'u10', name: 'Jake Patel', title: 'Mgr. Platform', parentId: 'u6' },
];

// --- Headcount budget per org node (annual) ---
const budgets = [
  { id: uuid(), orgId: 'u2', year: 2025, budgetedHC: 40, notes: 'Engineering org budget' },
  { id: uuid(), orgId: 'u3', year: 2025, budgetedHC: 25, notes: 'Sales org budget' },
  { id: uuid(), orgId: 'u4', year: 2025, budgetedHC: 10, notes: 'Finance org budget' },
  { id: uuid(), orgId: 'u5', year: 2025, budgetedHC: 15, notes: 'Frontend team budget' },
  { id: uuid(), orgId: 'u6', year: 2025, budgetedHC: 20, notes: 'Backend team budget' },
  { id: uuid(), orgId: 'u7', year: 2025, budgetedHC: 12, notes: 'Sales West budget' },
  { id: uuid(), orgId: 'u8', year: 2025, budgetedHC: 13, notes: 'Sales East budget' },
  { id: uuid(), orgId: 'u9', year: 2025, budgetedHC: 8, notes: 'UI team budget' },
  { id: uuid(), orgId: 'u10', year: 2025, budgetedHC: 10, notes: 'Platform team budget' },
];

// Proposals: requests to change the budget (delta = headcount change, positive or negative)
// status: draft | pending_approval | approved | rejected
const proposals = [
  { id: uuid(), orgId: 'u9', title: 'Hire Senior React Developers', delta: 2, justification: 'New product launch', status: 'approved', requestedBy: 'u9', approvedBy: 'u5', createdAt: '2025-01-10' },
  { id: uuid(), orgId: 'u9', title: 'Add UX Designer', delta: 1, justification: 'Improve design system', status: 'pending_approval', requestedBy: 'u9', approvedBy: null, createdAt: '2025-02-01' },
  { id: uuid(), orgId: 'u10', title: 'Add DevOps Engineer', delta: 1, justification: 'CI/CD improvements', status: 'approved', requestedBy: 'u10', approvedBy: 'u6', createdAt: '2025-01-15' },
  { id: uuid(), orgId: 'u6', title: 'Add Staff Backend Engineer', delta: 1, justification: 'Tech lead for new service', status: 'pending_approval', requestedBy: 'u6', approvedBy: null, createdAt: '2025-02-10' },
  { id: uuid(), orgId: 'u7', title: 'Expand Account Executive team', delta: 3, justification: 'Q2 expansion', status: 'draft', requestedBy: 'u7', approvedBy: null, createdAt: '2025-02-15' },
  { id: uuid(), orgId: 'u8', title: 'Reduce Sales East contractors', delta: -2, justification: 'Consolidating with in-house', status: 'draft', requestedBy: 'u8', approvedBy: null, createdAt: '2025-02-20' },
];

// Actuals – people currently filling positions
const actuals = [
  { id: uuid(), orgId: 'u9', name: 'Tom Harris', role: 'React Developer', startDate: '2024-06-01', status: 'active' },
  { id: uuid(), orgId: 'u9', name: 'Sara Lopez', role: 'React Developer', startDate: '2024-09-15', status: 'active' },
  { id: uuid(), orgId: 'u9', name: 'Mike Chen', role: 'React Developer', startDate: '2025-01-20', status: 'active' },
  { id: uuid(), orgId: 'u10', name: 'Nina Petrov', role: 'Platform Engineer', startDate: '2024-03-01', status: 'active' },
  { id: uuid(), orgId: 'u10', name: 'Oscar Reyes', role: 'DevOps Engineer', startDate: '2024-07-10', status: 'active' },
  { id: uuid(), orgId: 'u10', name: 'Paula Grant', role: 'Platform Engineer', startDate: '2025-02-01', status: 'active' },
  { id: uuid(), orgId: 'u6', name: 'Quinn Foster', role: 'Backend Engineer', startDate: '2023-11-01', status: 'active' },
  { id: uuid(), orgId: 'u7', name: 'Rachel Adams', role: 'Account Executive', startDate: '2024-01-15', status: 'active' },
  { id: uuid(), orgId: 'u7', name: 'Steve Ng', role: 'Account Executive', startDate: '2024-05-01', status: 'active' },
  { id: uuid(), orgId: 'u8', name: 'Tina Brooks', role: 'Account Executive', startDate: '2024-08-01', status: 'active' },
];

export { orgNodes, budgets, proposals, actuals };
