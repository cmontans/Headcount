import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

export default function Dashboard() {
  const { currentUser, currentUserOrgId, proposals, requisitions, budgets, actuals, getDescendantIds, getNode, getActualCount, getHead } = useApp();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const scopeIds = getDescendantIds(currentUserOrgId);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  const scopeBudgets = budgets.filter(b => scopeIds.includes(b.orgId) && b.year === selectedYear);
  const scopeProposals = proposals.filter(p => scopeIds.includes(p.orgId) && p.year === selectedYear);
  const scopeReqs = requisitions.filter(r => scopeIds.includes(r.orgId));

  const totalBudget = scopeBudgets.reduce((s, b) => s + b.budgetedHC, 0);
  const totalActuals = scopeIds.reduce((s, id) => s + getActualCount(id), 0);
  const totalPendingDelta = scopeProposals.filter(p => p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const pendingCount = scopeProposals.filter(p => p.status === 'pending_approval').length;
  const draftCount = scopeProposals.filter(p => p.status === 'draft').length;

  const openReqs = scopeReqs.filter(r => r.status === 'open').length;
  const pendingReqs = scopeReqs.filter(r => r.status === 'pending_approval').length;
  const filledReqs = scopeReqs.filter(r => r.status === 'filled').length;

  const teamIds = scopeIds.filter(id =>
    budgets.some(b => b.orgId === id && b.year === selectedYear) || actuals.some(a => a.orgId === id)
  );

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return '0';
  }

  const orgNode = getNode(currentUserOrgId);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard — {currentUser?.name} ({orgNode?.title})</h2>
        <label className="year-selector">
          Period:&nbsp;
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{totalBudget}</div>
          <div className="kpi-label">Total Budget HC ({selectedYear})</div>
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
          <div className="kpi-label">Pending Budget Changes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{draftCount}</div>
          <div className="kpi-label">Draft Budget Changes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{totalPendingDelta > 0 ? '+' : ''}{totalPendingDelta}</div>
          <div className="kpi-label">Pending Budget Impact</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{openReqs}</div>
          <div className="kpi-label">Open Requisitions</div>
        </div>
        <div className="kpi-card kpi-warn">
          <div className="kpi-value">{pendingReqs}</div>
          <div className="kpi-label">Pending Requisitions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{filledReqs}</div>
          <div className="kpi-label">Filled Requisitions</div>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem' }}>Team Breakdown ({selectedYear})</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Head</th>
            <th>Budget</th>
            <th>Actuals</th>
            <th>Open Positions</th>
            <th>Pending Budget Changes</th>
            <th>Pending Impact</th>
          </tr>
        </thead>
        <tbody>
          {teamIds.map(id => {
            const node = getNode(id);
            const head = getHead(id);
            const b = budgets.find(b => b.orgId === id && b.year === selectedYear);
            const bHC = b ? b.budgetedHC : 0;
            const aCount = getActualCount(id);
            const pendDelta = proposals.filter(p => p.orgId === id && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
            const pendNum = proposals.filter(p => p.orgId === id && p.year === selectedYear && p.status === 'pending_approval').length;
            const open = bHC - aCount;
            return (
              <tr key={id}>
                <td>{node?.title}</td>
                <td>{head?.name || <em>Vacant</em>}</td>
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
