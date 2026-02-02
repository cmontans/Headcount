import { v4 as uuid } from 'uuid';

// --- Organization hierarchy (tree of positions, not people) ---
const orgNodes = [
  // Organization 1: TechCorp
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
  // Organization 2: MediaGroup
  { id: 'v1', title: 'CEO MediaGroup', parentId: null },
  { id: 'v2', title: 'VP Content', parentId: 'v1' },
  { id: 'v3', title: 'VP Marketing', parentId: 'v1' },
  { id: 'v4', title: 'Dir. Editorial', parentId: 'v2' },
  { id: 'v5', title: 'Dir. Digital', parentId: 'v3' },
];

// --- Headcount budget per org node (annual) ---
// Intermediate/top orgs get budget=1 (just the head). Leaf orgs get team budgets.
// Values reflect current state after all confirmed events (approved proposals, accepted transfers, acknowledged challenges).
const b_u1 = uuid(), b_u2 = uuid(), b_u3 = uuid(), b_u4 = uuid(), b_u5 = uuid(), b_u6 = uuid(), b_u7 = uuid(), b_u8 = uuid(), b_u9 = uuid(), b_u10 = uuid();
const b_v1 = uuid(), b_v2 = uuid(), b_v3 = uuid(), b_v4 = uuid(), b_v5 = uuid();
const budgets = [
  // TechCorp — intermediate orgs (budget=1 for the head)
  { id: b_u1, orgId: 'u1', year: 2025, budgetedHC: 1, notes: 'CEO office' },
  { id: b_u2, orgId: 'u2', year: 2025, budgetedHC: 1, notes: 'VP Engineering office' },
  { id: b_u3, orgId: 'u3', year: 2025, budgetedHC: 1, notes: 'VP Sales office' },
  { id: b_u5, orgId: 'u5', year: 2025, budgetedHC: 1, notes: 'Dir. Frontend office' },
  { id: b_u6, orgId: 'u6', year: 2025, budgetedHC: 1, notes: 'Dir. Backend office' },
  // TechCorp — leaf orgs (team budgets, current after confirmed events)
  { id: b_u4, orgId: 'u4', year: 2025, budgetedHC: 9, notes: 'Finance team budget' },
  { id: b_u7, orgId: 'u7', year: 2025, budgetedHC: 12, notes: 'Sales West team budget' },
  { id: b_u8, orgId: 'u8', year: 2025, budgetedHC: 13, notes: 'Sales East team budget' },
  { id: b_u9, orgId: 'u9', year: 2025, budgetedHC: 9, notes: 'UI team budget' },
  { id: b_u10, orgId: 'u10', year: 2025, budgetedHC: 8, notes: 'Platform team budget' },
  // MediaGroup — intermediate orgs (budget=1)
  { id: b_v1, orgId: 'v1', year: 2025, budgetedHC: 1, notes: 'CEO MediaGroup office' },
  { id: b_v2, orgId: 'v2', year: 2025, budgetedHC: 1, notes: 'VP Content office' },
  { id: b_v3, orgId: 'v3', year: 2025, budgetedHC: 1, notes: 'VP Marketing office' },
  // MediaGroup — leaf orgs
  { id: b_v4, orgId: 'v4', year: 2025, budgetedHC: 10, notes: 'Editorial team budget' },
  { id: b_v5, orgId: 'v5', year: 2025, budgetedHC: 8, notes: 'Digital team budget' },
];

// Budget Change Proposals: requests to change the budget (delta = headcount change, positive or negative)
// status: draft | pending_approval | approved | rejected
// All proposals target leaf orgs only.
const p1 = uuid(), p2 = uuid(), p3 = uuid(), p4 = uuid(), p5 = uuid(), p6 = uuid();
const proposals = [
  { id: p1, orgId: 'u9', title: 'Hire Senior React Developers', delta: 2, year: 2025, justification: 'New product launch', status: 'approved', requestedBy: 'u9', approvedBy: 'u5', createdAt: '2025-01-10' },
  { id: p2, orgId: 'u9', title: 'Add UX Designer', delta: 1, year: 2025, justification: 'Improve design system', status: 'pending_approval', requestedBy: 'u9', approvedBy: null, createdAt: '2025-02-01' },
  { id: p3, orgId: 'u10', title: 'Add DevOps Engineer', delta: 1, year: 2025, justification: 'CI/CD improvements', status: 'approved', requestedBy: 'u10', approvedBy: 'u6', createdAt: '2025-01-15' },
  { id: p4, orgId: 'u10', title: 'Add Staff Backend Engineer', delta: 1, year: 2025, justification: 'Tech lead for new service', status: 'pending_approval', requestedBy: 'u10', approvedBy: null, createdAt: '2025-02-10' },
  { id: p5, orgId: 'u7', title: 'Expand Account Executive team', delta: 3, year: 2025, justification: 'Q2 expansion', status: 'draft', requestedBy: 'u7', approvedBy: null, createdAt: '2025-02-15' },
  { id: p6, orgId: 'u8', title: 'Reduce Sales East contractors', delta: -2, year: 2025, justification: 'Consolidating with in-house', status: 'draft', requestedBy: 'u8', approvedBy: null, createdAt: '2025-02-20' },
  { id: uuid(), orgId: 'u9', title: 'Add QA Engineer to UI Team', delta: 1, year: 2025, justification: 'Quality issues on recent releases', status: 'pending_approval', requestedBy: 'u9', approvedBy: null, createdAt: '2025-03-01' },
  { id: uuid(), orgId: 'u10', title: 'Reduce Platform contractors', delta: -1, year: 2025, justification: 'Automation replaced manual infra work', status: 'approved', requestedBy: 'u10', approvedBy: 'u6', createdAt: '2025-02-05' },
  { id: uuid(), orgId: 'v4', title: 'Hire investigative journalist', delta: 1, year: 2025, justification: 'Expanding investigative coverage', status: 'pending_approval', requestedBy: 'v4', approvedBy: null, createdAt: '2025-02-28' },
  { id: uuid(), orgId: 'v5', title: 'Add Social Media Manager', delta: 1, year: 2025, justification: 'Growing digital audience engagement', status: 'approved', requestedBy: 'v5', approvedBy: 'v3', createdAt: '2025-01-20' },
  { id: uuid(), orgId: 'u7', title: 'Sales West restructuring', delta: -1, year: 2025, justification: 'Merging regional account roles', status: 'rejected', requestedBy: 'u7', approvedBy: null, createdAt: '2025-01-30' },
];

// Actuals – people currently filling positions. isHead marks the org unit head.
// Intermediate orgs have only the head (1 person). Leaf orgs have teams.
const actuals = [
  // TechCorp — heads of intermediate orgs (1 person each)
  { id: uuid(), orgId: 'u1', name: 'Alice Chen', role: 'CEO', startDate: '2020-01-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u2', name: 'Bob Martinez', role: 'VP Engineering', startDate: '2021-03-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u3', name: 'Carol Smith', role: 'VP Sales', startDate: '2021-06-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u5', name: 'Eve Johnson', role: 'Dir. Frontend', startDate: '2022-04-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u6', name: 'Frank Brown', role: 'Dir. Backend', startDate: '2022-02-01', status: 'active', isHead: true },
  // TechCorp — leaf org teams
  { id: uuid(), orgId: 'u4', name: 'Dan Lee', role: 'VP Finance', startDate: '2022-01-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u7', name: 'Grace Kim', role: 'Dir. Sales West', startDate: '2022-07-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u7', name: 'Rachel Adams', role: 'Account Executive', startDate: '2024-01-15', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u7', name: 'Steve Ng', role: 'Account Executive', startDate: '2024-05-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u8', name: 'Hank Davis', role: 'Dir. Sales East', startDate: '2022-09-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u8', name: 'Tina Brooks', role: 'Account Executive', startDate: '2024-08-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u9', name: 'Ivy Wang', role: 'Mgr. UI Team', startDate: '2023-01-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u9', name: 'Tom Harris', role: 'React Developer', startDate: '2024-06-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u9', name: 'Sara Lopez', role: 'React Developer', startDate: '2024-09-15', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u9', name: 'Mike Chen', role: 'React Developer', startDate: '2025-01-20', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Jake Patel', role: 'Mgr. Platform', startDate: '2023-03-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'u10', name: 'Nina Petrov', role: 'Platform Engineer', startDate: '2024-03-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Oscar Reyes', role: 'DevOps Engineer', startDate: '2024-07-10', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Paula Grant', role: 'Platform Engineer', startDate: '2025-02-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'u10', name: 'Quinn Foster', role: 'Backend Engineer', startDate: '2023-11-01', status: 'active', isHead: false },
  // MediaGroup — heads of intermediate orgs
  { id: uuid(), orgId: 'v1', name: 'Laura Vega', role: 'CEO MediaGroup', startDate: '2019-06-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'v2', name: 'Marco Rossi', role: 'VP Content', startDate: '2021-01-15', status: 'active', isHead: true },
  { id: uuid(), orgId: 'v3', name: 'Sophie Dupont', role: 'VP Marketing', startDate: '2021-04-01', status: 'active', isHead: true },
  // MediaGroup — leaf org teams
  { id: uuid(), orgId: 'v4', name: 'Kenji Tanaka', role: 'Dir. Editorial', startDate: '2022-03-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'v4', name: 'Nina Costa', role: 'Senior Editor', startDate: '2023-05-01', status: 'active', isHead: false },
  { id: uuid(), orgId: 'v5', name: 'Priya Sharma', role: 'Dir. Digital', startDate: '2022-08-01', status: 'active', isHead: true },
  { id: uuid(), orgId: 'v5', name: 'Alex Turner', role: 'Digital Strategist', startDate: '2023-09-15', status: 'active', isHead: false },
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
  { id: uuid(), orgId: 'u10', role: 'Platform Engineer', type: 'substitution', fundingType: 'budget', fundingId: b_u10, justification: 'Replacing engineer moving to another team', replacingName: 'Alex Turner', status: 'approved', requestedBy: 'u10', approvedBy: 'u6', createdAt: '2025-02-12' },
];

// Budget Transfers: org-to-org budget reallocation (leaf orgs only)
// status: pending_acceptance | accepted | rejected | cancelled
const transfers = [
  { id: uuid(), fromOrgId: 'u8', toOrgId: 'u7', amount: 2, year: 2025, reason: 'Sales East over-staffed, Sales West expanding', status: 'pending_acceptance', proposedBy: 'u8', acceptedBy: null, createdAt: '2025-02-25' },
  { id: uuid(), fromOrgId: 'u10', toOrgId: 'u9', amount: 1, year: 2025, reason: 'Platform lending 1 HC to UI Team for shared project', status: 'accepted', proposedBy: 'u10', acceptedBy: 'u9', createdAt: '2025-01-28' },
  { id: uuid(), fromOrgId: 'u4', toOrgId: 'u7', amount: 1, year: 2025, reason: 'Finance rebalancing HC toward Sales West for Q3 push', status: 'accepted', proposedBy: 'u4', acceptedBy: 'u7', createdAt: '2025-01-15' },
  { id: uuid(), fromOrgId: 'u9', toOrgId: 'u10', amount: 2, year: 2025, reason: 'UI Team lending capacity for platform API migration', status: 'pending_acceptance', proposedBy: 'u9', acceptedBy: null, createdAt: '2025-03-01' },
  { id: uuid(), fromOrgId: 'v5', toOrgId: 'v4', amount: 1, year: 2025, reason: 'Digital shifting 1 HC to Editorial for launch campaign', status: 'accepted', proposedBy: 'v5', acceptedBy: 'v4', createdAt: '2025-02-10' },
  { id: uuid(), fromOrgId: 'u7', toOrgId: 'u8', amount: 1, year: 2025, reason: 'Sales West supporting East region ramp-up', status: 'rejected', proposedBy: 'u7', acceptedBy: null, rejectedBy: 'u8', createdAt: '2025-02-05' },
];

// Budget Challenges: a superior places a budget reduction target on a subordinate (leaf orgs only)
// status: pending | acknowledged
const challenges = [
  { id: uuid(), targetOrgId: 'u8', amount: 2, year: 2025, reason: 'Reduce contractor spend in Sales East', issuedBy: 'u3', acknowledgedBy: null, status: 'pending', createdAt: '2025-02-20' },
  { id: uuid(), targetOrgId: 'u9', amount: 1, year: 2025, reason: 'Optimize UI team size after project completion', issuedBy: 'u5', acknowledgedBy: 'u9', status: 'acknowledged', createdAt: '2025-01-25' },
  { id: uuid(), targetOrgId: 'u4', amount: 2, year: 2025, reason: 'Finance cost optimization — automate reporting roles', issuedBy: 'u1', acknowledgedBy: null, status: 'pending', createdAt: '2025-03-01' },
  { id: uuid(), targetOrgId: 'u7', amount: 1, year: 2025, reason: 'Align Sales West with revised territory targets', issuedBy: 'u3', acknowledgedBy: 'u7', status: 'acknowledged', createdAt: '2025-02-01' },
  { id: uuid(), targetOrgId: 'u10', amount: 2, year: 2025, reason: 'Platform team automation reduces need for manual ops', issuedBy: 'u6', acknowledgedBy: null, status: 'pending', createdAt: '2025-03-05' },
  { id: uuid(), targetOrgId: 'v4', amount: 1, year: 2025, reason: 'Editorial efficiency gains from AI tooling', issuedBy: 'v2', acknowledgedBy: 'v4', status: 'acknowledged', createdAt: '2025-02-15' },
];

export { orgNodes, budgets, proposals, actuals, requisitions, transfers, challenges };
