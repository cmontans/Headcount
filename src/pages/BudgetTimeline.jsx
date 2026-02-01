import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

export default function BudgetTimeline() {
  const { currentUserOrgId, budgets, proposals, transfers, challenges, getDescendantIds, getNode, getHead } = useApp();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedOrg, setSelectedOrg] = useState(currentUserOrgId);

  const scopeIds = getDescendantIds(currentUserOrgId);
  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  // Build timeline events for the selected org and year
  function buildTimeline(orgId, year) {
    const events = [];

    // Budget baseline
    const budget = budgets.find(b => b.orgId === orgId && b.year === year);
    const baseHC = budget ? budget.budgetedHC : 0;

    // Approved proposals affecting this org
    proposals
      .filter(p => p.orgId === orgId && p.year === year && p.status === 'approved')
      .forEach(p => {
        events.push({
          date: p.createdAt,
          type: 'proposal',
          label: p.title,
          delta: p.delta,
          status: p.status,
          detail: `Proposal approved: ${p.delta > 0 ? '+' : ''}${p.delta} HC — ${p.justification}`,
        });
      });

    // Pending proposals
    proposals
      .filter(p => p.orgId === orgId && p.year === year && p.status === 'pending_approval')
      .forEach(p => {
        events.push({
          date: p.createdAt,
          type: 'proposal_pending',
          label: p.title,
          delta: p.delta,
          status: p.status,
          detail: `Proposal pending: ${p.delta > 0 ? '+' : ''}${p.delta} HC — ${p.justification}`,
        });
      });

    // Accepted transfers TO this org
    transfers
      .filter(t => t.toOrgId === orgId && t.year === year && t.status === 'accepted')
      .forEach(t => {
        const fromNode = getNode(t.fromOrgId);
        events.push({
          date: t.createdAt,
          type: 'transfer_in',
          label: `Transfer from ${fromNode?.title || t.fromOrgId}`,
          delta: t.amount,
          status: t.status,
          detail: `Received ${t.amount} HC from ${fromNode?.title} — ${t.reason}`,
        });
      });

    // Accepted transfers FROM this org
    transfers
      .filter(t => t.fromOrgId === orgId && t.year === year && t.status === 'accepted')
      .forEach(t => {
        const toNode = getNode(t.toOrgId);
        events.push({
          date: t.createdAt,
          type: 'transfer_out',
          label: `Transfer to ${toNode?.title || t.toOrgId}`,
          delta: -t.amount,
          status: t.status,
          detail: `Sent ${t.amount} HC to ${toNode?.title} — ${t.reason}`,
        });
      });

    // Pending transfers
    transfers
      .filter(t => (t.toOrgId === orgId || t.fromOrgId === orgId) && t.year === year && t.status === 'pending_acceptance')
      .forEach(t => {
        const isIncoming = t.toOrgId === orgId;
        const otherNode = getNode(isIncoming ? t.fromOrgId : t.toOrgId);
        events.push({
          date: t.createdAt,
          type: 'transfer_pending',
          label: `Pending transfer ${isIncoming ? 'from' : 'to'} ${otherNode?.title || ''}`,
          delta: isIncoming ? t.amount : -t.amount,
          status: t.status,
          detail: `Pending: ${t.amount} HC ${isIncoming ? 'from' : 'to'} ${otherNode?.title} — ${t.reason}`,
        });
      });

    // Acknowledged challenges
    challenges
      .filter(c => c.targetOrgId === orgId && c.year === year && c.status === 'acknowledged')
      .forEach(c => {
        const issuerNode = getNode(c.issuedBy);
        events.push({
          date: c.createdAt,
          type: 'challenge',
          label: `Challenge from ${issuerNode?.title || c.issuedBy}`,
          delta: -c.amount,
          status: c.status,
          detail: `Budget challenge acknowledged: -${c.amount} HC — ${c.reason}`,
        });
      });

    // Pending challenges
    challenges
      .filter(c => c.targetOrgId === orgId && c.year === year && c.status === 'pending')
      .forEach(c => {
        const issuerNode = getNode(c.issuedBy);
        events.push({
          date: c.createdAt,
          type: 'challenge_pending',
          label: `Pending challenge from ${issuerNode?.title || c.issuedBy}`,
          delta: -c.amount,
          status: c.status,
          detail: `Pending challenge: -${c.amount} HC — ${c.reason}`,
        });
      });

    events.sort((a, b) => a.date.localeCompare(b.date));
    return { baseHC, events };
  }

  const { baseHC, events } = buildTimeline(selectedOrg, selectedYear);

  // Compute running total — confirmed events change the budget, pending are projected
  let runningConfirmed = baseHC;
  let runningProjected = baseHC;
  const timelineRows = events.map(ev => {
    const isPending = ev.type.includes('pending');
    if (!isPending) {
      runningConfirmed += ev.delta;
      runningProjected += ev.delta;
    } else {
      runningProjected += ev.delta;
    }
    return { ...ev, confirmedTotal: runningConfirmed, projectedTotal: runningProjected, isPending };
  });

  // For the bar visualization, find the max value
  const allValues = [baseHC, ...timelineRows.map(r => Math.max(r.confirmedTotal, r.projectedTotal))];
  const maxVal = Math.max(...allValues, 1);

  const orgNode = getNode(selectedOrg);
  const orgHead = getHead(selectedOrg);

  const typeColors = {
    proposal: '#22c55e',
    proposal_pending: '#fbbf24',
    transfer_in: '#3b82f6',
    transfer_out: '#f97316',
    transfer_pending: '#fbbf24',
    challenge: '#ef4444',
    challenge_pending: '#fbbf24',
  };

  const typeLabels = {
    proposal: 'Proposal (approved)',
    proposal_pending: 'Proposal (pending)',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    transfer_pending: 'Transfer (pending)',
    challenge: 'Challenge (acknowledged)',
    challenge_pending: 'Challenge (pending)',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Budget Timeline</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="year-selector">
            Period:&nbsp;
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="year-selector">
            Organization:&nbsp;
            <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
              {scopeIds.map(id => {
                const n = getNode(id);
                const h = getHead(id);
                return n ? <option key={id} value={id}>{n.title}{h ? ` (${h.name})` : ''}</option> : null;
              })}
            </select>
          </label>
        </div>
      </div>

      <div className="timeline-summary">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">{baseHC}</div>
            <div className="kpi-label">Current Budget</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value" style={{ color: runningConfirmed !== baseHC ? (runningConfirmed > baseHC ? 'var(--success)' : 'var(--danger)') : undefined }}>
              {runningConfirmed}
            </div>
            <div className="kpi-label">After Confirmed</div>
          </div>
          {runningProjected !== runningConfirmed && (
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: '#f59e0b' }}>{runningProjected}</div>
              <div className="kpi-label">Projected (incl. pending)</div>
            </div>
          )}
          <div className="kpi-card">
            <div className="kpi-value">{events.length}</div>
            <div className="kpi-label">Budget Events</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.78rem' }}>
        {Object.entries(typeLabels).map(([key, label]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: typeColors[key], display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="empty">No budget events for {orgNode?.title || selectedOrg} in {selectedYear}.</p>
      ) : (
        <div className="timeline-container">
          {/* Baseline row */}
          <div className="timeline-row">
            <div className="timeline-date">Baseline</div>
            <div className="timeline-bar-area">
              <div className="timeline-bar" style={{ width: `${(baseHC / maxVal) * 100}%`, background: '#94a3b8' }}>
                <span className="timeline-bar-label">{baseHC} HC</span>
              </div>
            </div>
            <div className="timeline-info">Starting budget for {selectedYear}</div>
          </div>

          {timelineRows.map((row, i) => (
            <div key={i} className={`timeline-row ${row.isPending ? 'timeline-row-pending' : ''}`}>
              <div className="timeline-date">{row.date}</div>
              <div className="timeline-bar-area">
                <div
                  className="timeline-bar"
                  style={{
                    width: `${((row.isPending ? row.projectedTotal : row.confirmedTotal) / maxVal) * 100}%`,
                    background: typeColors[row.type] || '#94a3b8',
                    opacity: row.isPending ? 0.6 : 1,
                  }}
                >
                  <span className="timeline-bar-label">
                    {row.isPending ? row.projectedTotal : row.confirmedTotal} HC
                    ({row.delta > 0 ? '+' : ''}{row.delta})
                  </span>
                </div>
              </div>
              <div className="timeline-info">
                <span className="timeline-event-label">{row.label}</span>
                {row.isPending && <span className="badge badge-pending_approval" style={{ marginLeft: '0.5rem' }}>pending</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail table */}
      {events.length > 0 && (
        <>
          <h3 style={{ marginTop: '2rem' }}>Event Details</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Event</th>
                <th>Delta</th>
                <th>Budget After</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {timelineRows.map((row, i) => (
                <tr key={i} style={{ opacity: row.isPending ? 0.7 : 1 }}>
                  <td>{row.date}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: typeColors[row.type], display: 'inline-block' }} />
                      {typeLabels[row.type]}
                    </span>
                  </td>
                  <td>{row.label}</td>
                  <td>
                    <span className={row.delta > 0 ? 'text-success' : row.delta < 0 ? 'text-danger' : ''}>
                      {row.delta > 0 ? '+' : ''}{row.delta}
                    </span>
                  </td>
                  <td><strong>{row.isPending ? `${row.projectedTotal} (projected)` : row.confirmedTotal}</strong></td>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
