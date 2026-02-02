
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

export default function Dashboard() {
  const { currentUser, currentUserOrgId, proposals, requisitions, budgets, actuals, transfers, challenges, getDescendantIds, getChildren, getNode, getActualCount, getHead, getAccumulatedBudget, getAccumulatedActuals } = useApp();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const scopeIds = getDescendantIds(currentUserOrgId);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  const scopeBudgets = budgets.filter(b => scopeIds.includes(b.orgId) && b.year === selectedYear);
  const scopeProposals = proposals.filter(p => scopeIds.includes(p.orgId) && p.year === selectedYear);
  const scopeReqs = requisitions.filter(r => scopeIds.includes(r.orgId));
  const scopeTransfers = transfers.filter(t => (scopeIds.includes(t.fromOrgId) || scopeIds.includes(t.toOrgId)) && t.year === selectedYear);
  const scopeChallenges = challenges.filter(c => scopeIds.includes(c.targetOrgId) && c.year === selectedYear && c.status === 'pending');

  const totalBudget = scopeBudgets.reduce((s, b) => s + b.budgetedHC, 0);
  const totalActuals = scopeIds.reduce((s, id) => s + getActualCount(id), 0);
  const totalChallenges = scopeChallenges.reduce((s, c) => s + c.amount, 0);

  // Accumulated Pending Delta: Proposals + Net Transfers
  const proposalPendingDelta = scopeProposals.filter(p => p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);

  const pendingTransfers = scopeTransfers.filter(t => t.status === 'pending_acceptance');
  // For total portfolio, we only care about transfers that cross the boundary of the portfolio (External <-> Internal)
  // OR usually simpler: Sum(In) - Sum(Out) for all scopeIds.
  //   If transfer is within scope (A->B both in scope), impact is 0.
  //   If A(in scope) -> C(out scope), impact is -amount.
  //   If C(out scope) -> A(in scope), impact is +amount.
  const transferNetImpact = pendingTransfers.reduce((net, t) => {
    const isFromInScope = scopeIds.includes(t.fromOrgId);
    const isToInScope = scopeIds.includes(t.toOrgId);
    if (isFromInScope && !isToInScope) return net - t.amount;
    if (!isFromInScope && isToInScope) return net + t.amount;
    return net;
  }, 0);

  const totalPendingDelta = proposalPendingDelta + transferNetImpact;

  const pendingCount = scopeProposals.filter(p => p.status === 'pending_approval').length + pendingTransfers.length;

  const openReqs = scopeReqs.filter(r => r.status === 'open').length;
  const pendingReqs = scopeReqs.filter(r => r.status === 'pending_approval').length;
  const filledReqs = scopeReqs.filter(r => r.status === 'filled').length;

  // Direct children for the breakdown table
  const directChildren = getChildren(currentUserOrgId);

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return '0';
  }

  const orgNode = getNode(currentUserOrgId);

  // Helper for "My Team" (Own) calculations
  const myBudget = budgets.find(b => b.orgId === currentUserOrgId && b.year === selectedYear)?.budgetedHC || 0;
  const myActuals = getActualCount(currentUserOrgId);
  const myOpen = myBudget - myActuals;

  // Calculate Own Metrics for KPI cards
  const myPendingProposals = proposals.filter(p => p.orgId === currentUserOrgId && p.year === selectedYear && p.status === 'pending_approval');
  const myProposalDelta = myPendingProposals.reduce((s, p) => s + p.delta, 0);

  const myPendingTransfers = transfers.filter(t => (t.fromOrgId === currentUserOrgId || t.toOrgId === currentUserOrgId) && t.year === selectedYear && t.status === 'pending_acceptance');
  const myTransferNetImpact = myPendingTransfers.reduce((net, t) => {
    // If I am sending, impact is negative. If receiving, impact is positive.
    if (t.fromOrgId === currentUserOrgId) return net - t.amount;
    if (t.toOrgId === currentUserOrgId) return net + t.amount;
    return net;
  }, 0);

  const myPendingDelta = myProposalDelta + myTransferNetImpact;
  const myPendingCount = myPendingProposals.length + myPendingTransfers.length;

  const myReqs = requisitions.filter(r => r.orgId === currentUserOrgId);
  const myOpenReqs = myReqs.filter(r => r.status === 'open').length;
  const myPendingReqs = myReqs.filter(r => r.status === 'pending_approval').length;
  const myChallenges = challenges.filter(c => c.targetOrgId === currentUserOrgId && c.year === selectedYear && c.status === 'pending').reduce((s, c) => s + c.amount, 0);

  // Calculate Deltas
  // New Formula: Budget - Challenges - Current Actuals - Open Requisitions
  const myDelta = myBudget - myChallenges - myActuals - myOpenReqs;
  const myPredictedDelta = myDelta + myPendingDelta - myPendingReqs;

  const totalDelta = totalBudget - totalChallenges - totalActuals - openReqs;
  const totalPredictedDelta = totalDelta + totalPendingDelta - pendingReqs;

  const hasSubordinates = directChildren.length > 0;

  function KPIGrid({ title, budget, actuals, openReqs, delta, pendingReqs, pendingDelta, predictedDelta, challenges }) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{title}</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">{budget}</div>
            <div className="kpi-label">Total Budget HC <br /><small>({selectedYear})</small></div>
          </div>
          <div className="kpi-card text-danger">
            <div className="kpi-value">-{challenges}</div>
            <div className="kpi-label">Challenges</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{actuals}</div>
            <div className="kpi-label">Current Actuals</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{openReqs}</div>
            <div className="kpi-label">Open Requisitions</div>
          </div>
          <div className="kpi-card" style={{ background: delta < 0 ? '#fee' : '#efe' }}>
            <div className="kpi-value">{delta > 0 ? '+' : ''}{delta}</div>
            <div className="kpi-label">Delta</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{pendingDelta > 0 ? '+' : ''}{pendingDelta}</div>
            <div className="kpi-label">Pending Budget Impact</div>
          </div>
          <div className="kpi-card kpi-warn">
            <div className="kpi-value">{pendingReqs}</div>
            <div className="kpi-label">Pending Requisitions</div>
          </div>
          <div className="kpi-card" style={{ background: predictedDelta < 0 ? '#fee' : '#efe' }}>
            <div className="kpi-value">{predictedDelta > 0 ? '+' : ''}{predictedDelta}</div>
            <div className="kpi-label">Predicted Delta</div>
          </div>
        </div>
      </div>
    );
  }

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

      {hasSubordinates && (
        <KPIGrid
          title="Portfolio Overview (Accumulated)"
          budget={totalBudget}
          actuals={totalActuals}
          delta={totalDelta}
          pendingCount={pendingCount}
          pendingDelta={totalPendingDelta}
          openReqs={openReqs}
          pendingReqs={pendingReqs}
          predictedDelta={totalPredictedDelta}
          challenges={totalChallenges}
        />
      )}

      <KPIGrid
        title="Direct Team Overview"
        budget={myBudget}
        actuals={myActuals}
        delta={myDelta}
        pendingCount={myPendingCount}
        pendingDelta={myPendingDelta}
        openReqs={myOpenReqs}
        pendingReqs={myPendingReqs}
        predictedDelta={myPredictedDelta}
        challenges={myChallenges}
      />

      <h3 style={{ marginTop: '2rem' }}>Organization Breakdown ({selectedYear})</h3>
      <table className="table">
        <thead>
          <tr>
            <th rowSpan={2} style={{ verticalAlign: 'bottom' }}>Team</th>
            <th rowSpan={2} style={{ verticalAlign: 'bottom' }}>Head</th>
            <th colSpan={3} className="text-center" style={{ borderBottom: '1px solid #ddd' }}>Direct Team (Own)</th>
            <th colSpan={3} className="text-center" style={{ borderBottom: '1px solid #ddd' }}>Total Portfolio (Accumulated)</th>
          </tr>
          <tr>
            <th>Budget</th>
            <th>Actuals</th>
            <th>Delta</th>
            <th>Budget</th>
            <th>Actuals</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Current User's Own Org */}
          <tr style={{ background: '#f9f9f9', fontWeight: 'bold' }}>
            <td>(My Team) {orgNode?.title}</td>
            <td>Me</td>
            <td>{myBudget}</td>
            <td>{myActuals}</td>
            <td className={myDelta < 0 ? 'text-danger' : myDelta > 0 ? 'text-success' : ''}>{myDelta > 0 ? '+' : ''}{myDelta}</td>
            <td className="text-muted" title="Reflected in total KPIs above">{totalBudget}</td>
            <td className="text-muted" title="Reflected in total KPIs above">{totalActuals}</td>
            <td className="text-muted" title="Reflected in total KPIs above">{(totalDelta) > 0 ? '+' : ''}{totalDelta}</td>
          </tr>

          {/* Subsequent Rows: Direct Subordinates */}
          {directChildren.map(child => {
            const head = getHead(child.id);
            const hasSubordinates = getChildren(child.id).length > 0;

            // Own metrics for child
            const childOwnBudget = budgets.find(b => b.orgId === child.id && b.year === selectedYear)?.budgetedHC || 0;
            const childOwnActuals = getActualCount(child.id);
            const childOwnOpenReqs = requisitions.filter(r => r.orgId === child.id && r.status === 'open').length;
            const childOwnChallenges = challenges.filter(c => c.targetOrgId === child.id && c.year === selectedYear && c.status === 'pending').reduce((s, c) => s + c.amount, 0);
            const childOwnDelta = childOwnBudget - childOwnChallenges - childOwnActuals - childOwnOpenReqs;

            // Accumulated metrics for child - only relevant if they have subordinates
            const childAccBudget = hasSubordinates ? getAccumulatedBudget(child.id, selectedYear) : 0;
            const childAccActuals = hasSubordinates ? getAccumulatedActuals(child.id) : 0;

            let childAccDelta = 0;
            if (hasSubordinates) {
              const childInfoIds = getDescendantIds(child.id);
              const childAccOpenReqs = requisitions.filter(r => childInfoIds.includes(r.orgId) && r.status === 'open').length;
              const childAccChallenges = challenges.filter(c => childInfoIds.includes(c.targetOrgId) && c.year === selectedYear && c.status === 'pending').reduce((s, c) => s + c.amount, 0);
              childAccDelta = childAccBudget - childAccChallenges - childAccActuals - childAccOpenReqs;
            }

            return (
              <tr key={child.id}>
                <td>{child.title}</td>
                <td>{head?.name || <em>Vacant</em>}</td>

                {/* Own */}
                <td>{childOwnBudget}</td>
                <td>{childOwnActuals}</td>
                <td className={childOwnDelta < 0 ? 'text-danger' : childOwnDelta > 0 ? 'text-success' : ''}>{childOwnDelta > 0 ? '+' : ''}{childOwnDelta}</td>

                {/* Accumulated */}
                {hasSubordinates ? (
                  <>
                    <td>{childAccBudget}</td>
                    <td>{childAccActuals}</td>
                    <td className={childAccDelta < 0 ? 'text-danger' : childAccDelta > 0 ? 'text-success' : ''}>{childAccDelta > 0 ? '+' : ''}{childAccDelta}</td>
                  </>
                ) : (
                  <>
                    <td className="text-muted">--</td>
                    <td className="text-muted">--</td>
                    <td className="text-muted">--</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
