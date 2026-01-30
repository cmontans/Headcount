import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { currentUser, requirements, budgets, actuals, getDescendantIds, getNode } = useApp();
  const scopeIds = getDescendantIds(currentUser.id);

  const scopeReqs = requirements.filter(r => scopeIds.includes(r.orgId));
  const scopeBudgets = budgets.filter(b => scopeIds.includes(b.orgId));
  const scopeActuals = actuals.filter(a => scopeIds.includes(a.orgId) && a.status === 'active');

  const totalBudget = scopeBudgets.reduce((s, b) => s + b.budgetedHC, 0);
  const totalActuals = scopeActuals.length;
  const totalApproved = scopeReqs.filter(r => r.status === 'approved').reduce((s, r) => s + r.count, 0);
  const totalPending = scopeReqs.filter(r => r.status === 'pending_approval').reduce((s, r) => s + r.count, 0);
  const totalDraft = scopeReqs.filter(r => r.status === 'draft').reduce((s, r) => s + r.count, 0);

  // Per-team breakdown
  const teamIds = scopeIds.filter(id => {
    return budgets.some(b => b.orgId === id) || actuals.some(a => a.orgId === id);
  });

  return (
    <div className="page">
      <h2>Dashboard — {currentUser.name} ({currentUser.title})</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{totalBudget}</div>
          <div className="kpi-label">Total Budget HC</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{totalActuals}</div>
          <div className="kpi-label">Current Actuals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{totalApproved}</div>
          <div className="kpi-label">Approved Reqs</div>
        </div>
        <div className="kpi-card kpi-warn">
          <div className="kpi-value">{totalPending}</div>
          <div className="kpi-label">Pending Approval</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{totalDraft}</div>
          <div className="kpi-label">Drafts</div>
        </div>
        <div className="kpi-card" style={{ background: (totalBudget - totalActuals - totalApproved) < 0 ? '#fee' : '#efe' }}>
          <div className="kpi-value">{totalBudget - totalActuals - totalApproved}</div>
          <div className="kpi-label">Remaining Capacity</div>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Team Breakdown</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Budget</th>
            <th>Actuals</th>
            <th>Approved Reqs</th>
            <th>Pending</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {teamIds.map(id => {
            const node = getNode(id);
            const b = budgets.find(b => b.orgId === id);
            const bHC = b ? b.budgetedHC : 0;
            const aCount = actuals.filter(a => a.orgId === id && a.status === 'active').length;
            const appr = requirements.filter(r => r.orgId === id && r.status === 'approved').reduce((s, r) => s + r.count, 0);
            const pend = requirements.filter(r => r.orgId === id && r.status === 'pending_approval').reduce((s, r) => s + r.count, 0);
            const rem = bHC - aCount - appr;
            return (
              <tr key={id}>
                <td>{node?.name} — {node?.title}</td>
                <td>{bHC}</td>
                <td>{aCount}</td>
                <td>{appr}</td>
                <td>{pend}</td>
                <td className={rem < 0 ? 'text-danger' : rem > 0 ? 'text-success' : ''}>{rem > 0 ? '+' : ''}{rem}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
