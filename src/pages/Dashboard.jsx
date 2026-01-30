import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { currentUser, proposals, budgets, actuals, getDescendantIds, getNode, getActualCount } = useApp();
  const scopeIds = getDescendantIds(currentUser.id);

  const scopeProposals = proposals.filter(p => scopeIds.includes(p.orgId));
  const scopeBudgets = budgets.filter(b => scopeIds.includes(b.orgId));

  const totalBudget = scopeBudgets.reduce((s, b) => s + b.budgetedHC, 0);
  const totalActuals = scopeIds.reduce((s, id) => s + getActualCount(id), 0);
  const totalPendingDelta = scopeProposals.filter(p => p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const totalDraftDelta = scopeProposals.filter(p => p.status === 'draft').reduce((s, p) => s + p.delta, 0);
  const pendingCount = scopeProposals.filter(p => p.status === 'pending_approval').length;
  const draftCount = scopeProposals.filter(p => p.status === 'draft').length;

  const teamIds = scopeIds.filter(id =>
    budgets.some(b => b.orgId === id) || actuals.some(a => a.orgId === id)
  );

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return '0';
  }

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
        <div className="kpi-card" style={{ background: (totalBudget - totalActuals) < 0 ? '#fee' : '#efe' }}>
          <div className="kpi-value">{totalBudget - totalActuals}</div>
          <div className="kpi-label">Open Positions</div>
        </div>
        <div className="kpi-card kpi-warn">
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-label">Pending Proposals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{draftCount}</div>
          <div className="kpi-label">Draft Proposals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{totalPendingDelta > 0 ? '+' : ''}{totalPendingDelta}</div>
          <div className="kpi-label">Pending Budget Impact</div>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Team Breakdown</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Budget</th>
            <th>Actuals</th>
            <th>Open Positions</th>
            <th>Pending Proposals</th>
            <th>Pending Impact</th>
          </tr>
        </thead>
        <tbody>
          {teamIds.map(id => {
            const node = getNode(id);
            const b = budgets.find(b => b.orgId === id);
            const bHC = b ? b.budgetedHC : 0;
            const aCount = getActualCount(id);
            const pendDelta = proposals.filter(p => p.orgId === id && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
            const pendNum = proposals.filter(p => p.orgId === id && p.status === 'pending_approval').length;
            const open = bHC - aCount;
            return (
              <tr key={id}>
                <td>{node?.name} — {node?.title}</td>
                <td>{bHC}</td>
                <td>{aCount}</td>
                <td className={open < 0 ? 'text-danger' : open > 0 ? 'text-success' : ''}>{open > 0 ? '+' : ''}{open}</td>
                <td>{pendNum}</td>
                <td>{formatDelta(pendDelta)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
