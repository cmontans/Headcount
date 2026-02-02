import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

/* ───── Proposals sub-section ───── */
function ProposalsSection({ selectedYear }) {
  const { currentUserOrgId, proposals, budgets, getDescendantIds, getNode, getHead, getAccumulatedBudget, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUserOrgId);
  const visible = proposals.filter(p => scopeIds.includes(p.orgId) && p.year === selectedYear);

  const emptyForm = { title: '', delta: 1, justification: '', orgId: '' };

  function openNew() {
    setForm({ ...emptyForm, orgId: currentUserOrgId, requestedBy: currentUserOrgId, year: selectedYear });
    setEditId(null);
  }
  function openEdit(p) {
    setForm({ title: p.title, delta: p.delta, justification: p.justification, orgId: p.orgId, requestedBy: p.requestedBy, year: p.year });
    setEditId(p.id);
  }
  function save() {
    if (!form.title) return;
    if (editId) dispatch({ type: 'UPDATE_PROPOSAL', payload: { id: editId, ...form } });
    else dispatch({ type: 'ADD_PROPOSAL', payload: form });
    setForm(null); setEditId(null);
  }
  function submit(id) { dispatch({ type: 'SUBMIT_PROPOSAL', payload: id }); }
  function remove(id) { dispatch({ type: 'DELETE_PROPOSAL', payload: id }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;
  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return <span>0</span>;
  }

  return (
    <>
      <div className="section-header">
        <h3>Budget Change Proposals</h3>
        <button className="btn btn-primary" onClick={openNew}>+ New Proposal</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'New'} Budget Change Proposal</h3>
            <label>Team / Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  const head = getHead(id);
                  return n ? <option key={id} value={id}>{n.title}{head ? ` (${head.name})` : ''}</option> : null;
                })}
              </select>
            </label>
            <label>Proposal Title
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hire 2 Frontend Engineers" />
            </label>
            <label>Budget Change (delta)
              <input type="number" value={form.delta} onChange={e => setForm({ ...form, delta: parseInt(e.target.value) || 0 })} />
              <span className="field-hint">Positive = increase headcount budget, negative = decrease</span>
            </label>
            {form.orgId && (() => {
              const budget = budgets.find(b => b.orgId === form.orgId && b.year === form.year);
              if (!budget) return null;
              return (
                <div className="budget-preview">
                  Current budget: <strong>{budget.budgetedHC}</strong> &rarr; After approval: <strong>{budget.budgetedHC + (form.delta || 0)}</strong>
                </div>
              );
            })()}
            <label>Justification
              <textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Team</th><th>Proposal</th><th>Delta</th><th>Budget</th><th>&Sigma; Budget</th><th>Status</th><th>Requested By</th><th>Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(p => {
            const node = getNode(p.orgId);
            const requestorHead = getHead(p.requestedBy);
            const budget = budgets.find(b => b.orgId === p.orgId && b.year === p.year);
            const accBudget = getAccumulatedBudget(p.orgId, p.year);
            return (
              <tr key={p.id}>
                <td>{node?.title || p.orgId}</td>
                <td>{p.title}</td>
                <td>{formatDelta(p.delta)}</td>
                <td>{budget ? budget.budgetedHC : '—'}</td>
                <td className="text-accent">{accBudget}</td>
                <td>{statusBadge(p.status)}</td>
                <td>{requestorHead?.name || '—'}</td>
                <td>{p.createdAt}</td>
                <td className="actions">
                  {p.status === 'draft' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-primary" onClick={() => submit(p.id)}>Submit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}>Delete</button>
                    </>
                  )}
                  {p.status === 'rejected' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-primary" onClick={() => submit(p.id)}>Re-submit</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="9" className="empty">No budget change proposals in your scope</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ───── Transfers sub-section ───── */
function TransfersSection({ selectedYear }) {
  const { currentUserOrgId, transfers, budgets, orgNodes, getDescendantIds, getNode, getHead, getAccumulatedBudget, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUserOrgId);
  const visible = transfers.filter(t => t.year === selectedYear && (scopeIds.includes(t.fromOrgId) || scopeIds.includes(t.toOrgId)));
  const incoming = transfers.filter(t => t.status === 'pending_acceptance' && t.year === selectedYear && scopeIds.includes(t.toOrgId));

  function openNew() {
    setForm({ fromOrgId: currentUserOrgId, toOrgId: '', amount: 1, year: selectedYear, reason: '', proposedBy: currentUserOrgId });
    setEditId(null);
  }
  function openEdit(t) {
    setForm({ fromOrgId: t.fromOrgId, toOrgId: t.toOrgId, amount: t.amount, year: t.year, reason: t.reason, proposedBy: t.proposedBy });
    setEditId(t.id);
  }
  function save() {
    if (!form.toOrgId || !form.amount) return;
    if (form.fromOrgId === form.toOrgId) { alert('Sender and receiver must be different.'); return; }
    if (editId) dispatch({ type: 'UPDATE_TRANSFER', payload: { id: editId, ...form } });
    else dispatch({ type: 'ADD_TRANSFER', payload: form });
    setForm(null); setEditId(null);
  }
  function cancel(id) { dispatch({ type: 'CANCEL_TRANSFER', payload: id }); }
  function remove(id) { dispatch({ type: 'DELETE_TRANSFER', payload: id }); }
  function accept(id) { dispatch({ type: 'ACCEPT_TRANSFER', payload: { id, acceptedBy: currentUserOrgId } }); }
  function reject(id) { dispatch({ type: 'REJECT_TRANSFER', payload: { id, rejectedBy: currentUserOrgId } }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;

  return (
    <>
      <div className="section-header">
        <h3>Budget Transfers</h3>
        <button className="btn btn-primary" onClick={openNew}>+ Propose Transfer</button>
      </div>

      {incoming.length > 0 && (
        <>
          <h4>Incoming Transfer Requests</h4>
          <table className="table">
            <thead>
              <tr><th>From</th><th>To</th><th>Amount</th><th>Reason</th><th>Proposed By</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {incoming.map(t => {
                const fromNode = getNode(t.fromOrgId);
                const toNode = getNode(t.toOrgId);
                const proposerHead = getHead(t.proposedBy);
                const fromBudget = budgets.find(b => b.orgId === t.fromOrgId && b.year === t.year);
                const toBudget = budgets.find(b => b.orgId === t.toOrgId && b.year === t.year);
                return (
                  <tr key={t.id}>
                    <td>{fromNode?.title} ({fromBudget ? fromBudget.budgetedHC : '?'} HC)</td>
                    <td>{toNode?.title} ({toBudget ? toBudget.budgetedHC : '?'} HC)</td>
                    <td><strong>{t.amount}</strong></td>
                    <td>{t.reason}</td>
                    <td>{proposerHead?.name || '—'}</td>
                    <td>{t.createdAt}</td>
                    <td className="actions">
                      <button className="btn btn-sm btn-success" onClick={() => accept(t.id)}>Accept</button>
                      <button className="btn btn-sm btn-danger" onClick={() => reject(t.id)}>Reject</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'Propose'} Budget Transfer</h3>
            <label>From (your org unit)
              <select value={form.fromOrgId} onChange={e => setForm({ ...form, fromOrgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  const head = getHead(id);
                  const b = budgets.find(b => b.orgId === id && b.year === form.year);
                  return n ? <option key={id} value={id}>{n.title}{head ? ` (${head.name})` : ''}{b ? ` [${b.budgetedHC} HC]` : ''}</option> : null;
                })}
              </select>
            </label>
            <label>To (receiving org unit)
              <select value={form.toOrgId} onChange={e => setForm({ ...form, toOrgId: e.target.value })}>
                <option value="">— Select —</option>
                {orgNodes.filter(n => !scopeIds.includes(n.id)).map(n => {
                  const head = getHead(n.id);
                  const b = budgets.find(b => b.orgId === n.id && b.year === form.year);
                  return <option key={n.id} value={n.id}>{n.title}{head ? ` (${head.name})` : ''}{b ? ` [${b.budgetedHC} HC]` : ''}</option>;
                })}
              </select>
            </label>
            <label>Amount (HC to transfer)
              <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
            </label>
            {form.fromOrgId && (() => {
              const b = budgets.find(b => b.orgId === form.fromOrgId && b.year === form.year);
              if (!b) return null;
              return (
                <div className="budget-preview">
                  Sender budget: <strong>{b.budgetedHC}</strong> → After transfer: <strong>{b.budgetedHC - (form.amount || 0)}</strong>
                </div>
              );
            })()}
            <label>Reason
              <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Why is this transfer needed?" />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Update' : 'Propose Transfer'}</button>
            </div>
          </div>
        </div>
      )}

      <table className="table" style={{ marginTop: incoming.length > 0 ? '1rem' : 0 }}>
        <thead>
          <tr><th>From</th><th>&Sigma; From</th><th>To</th><th>&Sigma; To</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {visible.map(t => {
            const fromNode = getNode(t.fromOrgId);
            const toNode = getNode(t.toOrgId);
            const accFrom = getAccumulatedBudget(t.fromOrgId, t.year);
            const accTo = getAccumulatedBudget(t.toOrgId, t.year);
            const isMine = scopeIds.includes(t.fromOrgId);
            return (
              <tr key={t.id}>
                <td>{fromNode?.title}</td>
                <td className="text-accent">{accFrom}</td>
                <td>{toNode?.title}</td>
                <td className="text-accent">{accTo}</td>
                <td><strong>{t.amount}</strong></td>
                <td>{t.reason}</td>
                <td>{statusBadge(t.status)}</td>
                <td>{t.createdAt}</td>
                <td className="actions">
                  {t.status === 'pending_acceptance' && isMine && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => cancel(t.id)}>Cancel</button>
                    </>
                  )}
                  {t.status === 'pending_acceptance' && !isMine && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => accept(t.id)}>Accept</button>
                      <button className="btn btn-sm btn-danger" onClick={() => reject(t.id)}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="9" className="empty">No budget transfers for this period</td></tr>}

        </tbody>
      </table>
    </>
  );
}

/* ───── Challenges sub-section ───── */
function ChallengesSection({ selectedYear }) {
  const { currentUserOrgId, challenges, budgets, getDescendantIds, getNode, getHead, getActualCount, getAccumulatedBudget, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const subordinateIds = getDescendantIds(currentUserOrgId).filter(id => id !== currentUserOrgId);
  const issuedChallenges = challenges.filter(c => c.issuedBy === currentUserOrgId && c.year === selectedYear);
  const receivedChallenges = challenges.filter(c => c.targetOrgId === currentUserOrgId && c.year === selectedYear);

  function openNew() {
    setForm({ targetOrgId: subordinateIds[0] || '', amount: 1, year: selectedYear, reason: '' });
    setEditId(null);
  }
  function openEdit(c) {
    setForm({ targetOrgId: c.targetOrgId, amount: c.amount, year: c.year, reason: c.reason });
    setEditId(c.id);
  }
  function save() {
    if (!form.targetOrgId || form.amount <= 0) return;
    if (editId) dispatch({ type: 'UPDATE_CHALLENGE', payload: { id: editId, ...form } });
    else dispatch({ type: 'ADD_CHALLENGE', payload: { ...form, issuedBy: currentUserOrgId } });
    setForm(null); setEditId(null);
  }
  function remove(id) { dispatch({ type: 'DELETE_CHALLENGE', payload: id }); }
  function acknowledge(id) { dispatch({ type: 'ACKNOWLEDGE_CHALLENGE', payload: { id, acknowledgedBy: currentUserOrgId } }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;

  return (
    <>
      <div className="section-header">
        <h3>Budget Challenges</h3>
        {subordinateIds.length > 0 && (
          <button className="btn btn-primary" onClick={openNew}>+ Issue Challenge</button>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'Issue'} Budget Challenge</h3>
            <label>Target Organization
              <select value={form.targetOrgId} onChange={e => setForm({ ...form, targetOrgId: e.target.value })}>
                {subordinateIds.map(id => {
                  const n = getNode(id);
                  const head = getHead(id);
                  const budget = budgets.find(b => b.orgId === id && b.year === form.year);
                  return n ? <option key={id} value={id}>{n.title}{head ? ` (${head.name})` : ''}{budget ? ` — ${budget.budgetedHC} HC` : ''}</option> : null;
                })}
              </select>
            </label>
            {form.targetOrgId && (() => {
              const budget = budgets.find(b => b.orgId === form.targetOrgId && b.year === form.year);
              if (!budget) return null;
              const actual = getActualCount(form.targetOrgId);
              return (
                <div className="budget-preview">
                  Current budget: <strong>{budget.budgetedHC}</strong> | Filled: {actual} | After challenge: <strong>{budget.budgetedHC - (form.amount || 0)}</strong>
                </div>
              );
            })()}
            <label>Reduction Amount (HC)
              <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
            </label>
            <label>Reason
              <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Explain why this budget reduction is needed" />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {receivedChallenges.length > 0 && (
        <>
          <h4>Challenges Received</h4>
          <table className="table">
            <thead>
              <tr><th>Issued By</th><th>Reduction</th><th>Budget</th><th>&Sigma; Budget</th><th>After</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {receivedChallenges.map(c => {
                const issuerHead = getHead(c.issuedBy);
                const issuerNode = getNode(c.issuedBy);
                const budget = budgets.find(b => b.orgId === c.targetOrgId && b.year === c.year);
                const currentHC = budget ? budget.budgetedHC : 0;
                const accBudget = getAccumulatedBudget(c.targetOrgId, c.year);
                return (
                  <tr key={c.id}>
                    <td>{issuerHead?.name || '—'} ({issuerNode?.title})</td>
                    <td><span className="text-danger">-{c.amount}</span></td>
                    <td>{currentHC}</td>
                    <td className="text-accent">{accBudget}</td>
                    <td><strong>{currentHC - c.amount}</strong></td>
                    <td>{c.reason}</td>
                    <td>{statusBadge(c.status)}</td>
                    <td>{c.createdAt}</td>
                    <td className="actions">
                      {c.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => acknowledge(c.id)}>Acknowledge</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <h4 style={{ marginTop: receivedChallenges.length > 0 ? '1rem' : 0 }}>Challenges Issued</h4>
      <table className="table">
        <thead>
          <tr><th>Target Org</th><th>Reduction</th><th>Budget</th><th>&Sigma; Budget</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {issuedChallenges.map(c => {
            const targetNode = getNode(c.targetOrgId);
            const targetHead = getHead(c.targetOrgId);
            const budget = budgets.find(b => b.orgId === c.targetOrgId && b.year === c.year);
            const accBudget = getAccumulatedBudget(c.targetOrgId, c.year);
            return (
              <tr key={c.id}>
                <td>{targetNode?.title}{targetHead ? ` (${targetHead.name})` : ''}</td>
                <td><span className="text-danger">-{c.amount}</span></td>
                <td>{budget ? budget.budgetedHC : '—'}</td>
                <td className="text-accent">{accBudget}</td>
                <td>{c.reason}</td>
                <td>{statusBadge(c.status)}</td>
                <td>{c.createdAt}</td>
                <td className="actions">
                  {c.status === 'pending' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {issuedChallenges.length === 0 && <tr><td colSpan="8" className="empty">No challenges issued for this period</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ───── Timeline sub-section ───── */
function TimelineSection({ selectedYear }) {
  const { currentUserOrgId, budgets, proposals, transfers, challenges, getDescendantIds, getNode, getHead } = useApp();
  const [selectedOrg, setSelectedOrg] = useState(currentUserOrgId);

  const scopeIds = getDescendantIds(currentUserOrgId);

  function buildTimeline(orgId, year) {
    const events = [];
    const budget = budgets.find(b => b.orgId === orgId && b.year === year);
    const currentHC = budget ? budget.budgetedHC : 0;

    // Collect confirmed events to reverse-compute the baseline
    const confirmedDeltas = [];

    proposals.filter(p => p.orgId === orgId && p.year === year && p.status === 'approved').forEach(p => {
      confirmedDeltas.push(p.delta);
      events.push({ date: p.createdAt, type: 'proposal', label: p.title, delta: p.delta, status: p.status, detail: `Proposal approved: ${p.delta > 0 ? '+' : ''}${p.delta} HC — ${p.justification}` });
    });
    proposals.filter(p => p.orgId === orgId && p.year === year && p.status === 'pending_approval').forEach(p => {
      events.push({ date: p.createdAt, type: 'proposal_pending', label: p.title, delta: p.delta, status: p.status, detail: `Proposal pending: ${p.delta > 0 ? '+' : ''}${p.delta} HC — ${p.justification}` });
    });
    transfers.filter(t => t.toOrgId === orgId && t.year === year && t.status === 'accepted').forEach(t => {
      const fromNode = getNode(t.fromOrgId);
      confirmedDeltas.push(t.amount);
      events.push({ date: t.createdAt, type: 'transfer_in', label: `Transfer from ${fromNode?.title || t.fromOrgId}`, delta: t.amount, status: t.status, detail: `Received ${t.amount} HC from ${fromNode?.title} — ${t.reason}` });
    });
    transfers.filter(t => t.fromOrgId === orgId && t.year === year && t.status === 'accepted').forEach(t => {
      const toNode = getNode(t.toOrgId);
      confirmedDeltas.push(-t.amount);
      events.push({ date: t.createdAt, type: 'transfer_out', label: `Transfer to ${toNode?.title || t.toOrgId}`, delta: -t.amount, status: t.status, detail: `Sent ${t.amount} HC to ${toNode?.title} — ${t.reason}` });
    });
    transfers.filter(t => (t.toOrgId === orgId || t.fromOrgId === orgId) && t.year === year && t.status === 'pending_acceptance').forEach(t => {
      const isIncoming = t.toOrgId === orgId;
      const otherNode = getNode(isIncoming ? t.fromOrgId : t.toOrgId);
      events.push({ date: t.createdAt, type: 'transfer_pending', label: `Pending transfer ${isIncoming ? 'from' : 'to'} ${otherNode?.title || ''}`, delta: isIncoming ? t.amount : -t.amount, status: t.status, detail: `Pending: ${t.amount} HC ${isIncoming ? 'from' : 'to'} ${otherNode?.title} — ${t.reason}` });
    });
    challenges.filter(c => c.targetOrgId === orgId && c.year === year && c.status === 'acknowledged').forEach(c => {
      const issuerNode = getNode(c.issuedBy);
      confirmedDeltas.push(-c.amount);
      events.push({ date: c.createdAt, type: 'challenge', label: `Challenge from ${issuerNode?.title || c.issuedBy}`, delta: -c.amount, status: c.status, detail: `Budget challenge acknowledged: -${c.amount} HC — ${c.reason}` });
    });
    challenges.filter(c => c.targetOrgId === orgId && c.year === year && c.status === 'pending').forEach(c => {
      const issuerNode = getNode(c.issuedBy);
      events.push({ date: c.createdAt, type: 'challenge_pending', label: `Pending challenge from ${issuerNode?.title || c.issuedBy}`, delta: -c.amount, status: c.status, detail: `Pending challenge: -${c.amount} HC — ${c.reason}` });
    });

    // baseHC = original budget before any confirmed events were applied
    const baseHC = currentHC - confirmedDeltas.reduce((s, d) => s + d, 0);

    events.sort((a, b) => a.date.localeCompare(b.date));
    return { baseHC, currentHC, events };
  }

  const { baseHC, currentHC, events } = buildTimeline(selectedOrg, selectedYear);

  let runningConfirmed = baseHC;
  let runningProjected = baseHC;
  const timelineRows = events.map(ev => {
    const isPending = ev.type.includes('pending');
    if (!isPending) { runningConfirmed += ev.delta; runningProjected += ev.delta; } else { runningProjected += ev.delta; }
    return { ...ev, confirmedTotal: runningConfirmed, projectedTotal: runningProjected, isPending };
  });

  const allValues = [baseHC, ...timelineRows.map(r => Math.max(r.confirmedTotal, r.projectedTotal))];
  const maxVal = Math.max(...allValues, 1);

  const typeColors = { proposal: '#22c55e', proposal_pending: '#fbbf24', transfer_in: '#3b82f6', transfer_out: '#f97316', transfer_pending: '#fbbf24', challenge: '#ef4444', challenge_pending: '#fbbf24' };
  const typeLabels = { proposal: 'Proposal (approved)', proposal_pending: 'Proposal (pending)', transfer_in: 'Transfer In', transfer_out: 'Transfer Out', transfer_pending: 'Transfer (pending)', challenge: 'Challenge (acknowledged)', challenge_pending: 'Challenge (pending)' };

  return (
    <>
      <div className="section-header">
        <h3>Budget Timeline</h3>
        <label className="year-selector">
          Organization:&nbsp;
          <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
            {scopeIds.map(id => {
              const n = getNode(id); const h = getHead(id);
              return n ? <option key={id} value={id}>{n.title}{h ? ` (${h.name})` : ''}</option> : null;
            })}
          </select>
        </label>
      </div>

      <div className="timeline-summary">
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-value">{baseHC}</div><div className="kpi-label">Baseline Budget</div></div>
          <div className="kpi-card"><div className="kpi-value">{currentHC}</div><div className="kpi-label">Current Budget</div></div>
          {runningProjected !== runningConfirmed && <div className="kpi-card"><div className="kpi-value" style={{ color: '#f59e0b' }}>{runningProjected}</div><div className="kpi-label">Projected (incl. pending)</div></div>}
          <div className="kpi-card"><div className="kpi-value">{events.length}</div><div className="kpi-label">Budget Events</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.78rem' }}>
        {Object.entries(typeLabels).map(([key, label]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: typeColors[key], display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="empty">No budget events for {getNode(selectedOrg)?.title || selectedOrg} in {selectedYear}.</p>
      ) : (
        <div className="timeline-container">
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
                <div className="timeline-bar" style={{ width: `${((row.isPending ? row.projectedTotal : row.confirmedTotal) / maxVal) * 100}%`, background: typeColors[row.type] || '#94a3b8', opacity: row.isPending ? 0.6 : 1 }}>
                  <span className="timeline-bar-label">{row.isPending ? row.projectedTotal : row.confirmedTotal} HC ({row.delta > 0 ? '+' : ''}{row.delta})</span>
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

      {events.length > 0 && (
        <>
          <h3 style={{ marginTop: '2rem' }}>Event Details</h3>
          <table className="table">
            <thead><tr><th>Date</th><th>Type</th><th>Event</th><th>Delta</th><th>Budget After</th><th>Details</th></tr></thead>
            <tbody>
              {timelineRows.map((row, i) => (
                <tr key={i} style={{ opacity: row.isPending ? 0.7 : 1 }}>
                  <td>{row.date}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: typeColors[row.type], display: 'inline-block' }} />{typeLabels[row.type]}</span></td>
                  <td>{row.label}</td>
                  <td><span className={row.delta > 0 ? 'text-success' : row.delta < 0 ? 'text-danger' : ''}>{row.delta > 0 ? '+' : ''}{row.delta}</span></td>
                  <td><strong>{row.isPending ? `${row.projectedTotal} (projected)` : row.confirmedTotal}</strong></td>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

/* ───── My Budget sub-section ───── */
function MyBudgetSection({ selectedYear }) {
  const { currentUserOrgId, budgets, proposals, getDescendantIds, getNode, getHead, getActualCount, getAccumulatedBudget, getAccumulatedActuals, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUserOrgId).filter(id => id !== currentUserOrgId);
  const visible = budgets.filter(b => scopeIds.includes(b.orgId) && b.year === selectedYear);

  function openNew() {
    setForm({ orgId: scopeIds[0] || '', year: selectedYear, budgetedHC: 0, notes: '' });
    setEditId(null);
  }
  function openEdit(b) {
    setForm({ orgId: b.orgId, year: b.year, budgetedHC: b.budgetedHC, notes: b.notes });
    setEditId(b.id);
  }
  function save() {
    if (editId) dispatch({ type: 'UPDATE_BUDGET', payload: { id: editId, ...form } });
    else dispatch({ type: 'ADD_BUDGET', payload: form });
    setForm(null); setEditId(null);
  }
  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return '0';
  }

  return (
    <>
      <div className="section-header">
        <h3>Headcount Budget</h3>
        <button className="btn btn-primary" onClick={openNew}>+ New Budget Entry</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'New'} Budget</h3>
            <label>Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  const head = getHead(id);
                  return n ? <option key={id} value={id}>{n.title}{head ? ` (${head.name})` : ''}</option> : null;
                })}
              </select>
            </label>
            <label>Year
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} />
            </label>
            <label>Budgeted Headcount
              <input type="number" min="0" value={form.budgetedHC} onChange={e => setForm({ ...form, budgetedHC: parseInt(e.target.value) || 0 })} />
            </label>
            <label>Notes
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Org Unit</th><th>Year</th><th>Budgeted HC</th><th>Actuals</th><th>Open</th><th>Pending</th><th>&Sigma; Budget</th><th>&Sigma; Actuals</th><th>Notes</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(b => {
            const node = getNode(b.orgId);
            const actualCount = getActualCount(b.orgId);
            const pendingDelta = proposals.filter(p => p.orgId === b.orgId && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
            const open = b.budgetedHC - actualCount;
            const accBudget = getAccumulatedBudget(b.orgId, selectedYear);
            const accActuals = getAccumulatedActuals(b.orgId);
            return (
              <tr key={b.id}>
                <td>{node?.title || b.orgId}</td>
                <td>{b.year}</td>
                <td>{b.budgetedHC}</td>
                <td>{actualCount}</td>
                <td className={open < 0 ? 'text-danger' : open > 0 ? 'text-success' : ''}>{open > 0 ? '+' : ''}{open}</td>
                <td>{formatDelta(pendingDelta)}</td>
                <td className="text-accent">{accBudget}</td>
                <td className="text-accent">{accActuals}</td>
                <td>{b.notes}</td>
                <td className="actions">
                  <button className="btn btn-sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: 'DELETE_BUDGET', payload: b.id })}>Delete</button>
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="10" className="empty">No budget entries in your scope</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ───── Main page with tabs ───── */
const TABS = ['My Budget', 'Proposals', 'Transfers', 'Challenges', 'Timeline'];

export default function BudgetManagement() {
  const { budgets } = useApp();
  const [activeTab, setActiveTab] = useState('My Budget');
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  return (
    <div className="page">
      <div className="page-header">
        <h2>Budget Management</h2>
        <label className="year-selector">
          Period:&nbsp;
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'My Budget' && <MyBudgetSection selectedYear={selectedYear} />}
        {activeTab === 'Proposals' && <ProposalsSection selectedYear={selectedYear} />}
        {activeTab === 'Transfers' && <TransfersSection selectedYear={selectedYear} />}
        {activeTab === 'Challenges' && <ChallengesSection selectedYear={selectedYear} />}
        {activeTab === 'Timeline' && <TimelineSection selectedYear={selectedYear} />}
      </div>
    </div>
  );
}
