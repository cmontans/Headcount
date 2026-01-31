import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

export default function Transfers() {
  const { currentUserOrgId, transfers, budgets, orgNodes, getDescendantIds, getNode, getHead, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const scopeIds = getDescendantIds(currentUserOrgId);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  // Show transfers where the current user's subtree is sender or receiver
  const visible = transfers.filter(t =>
    t.year === selectedYear && (scopeIds.includes(t.fromOrgId) || scopeIds.includes(t.toOrgId))
  );

  // Incoming: transfers TO my org or subtree that need acceptance
  const incoming = transfers.filter(t =>
    t.status === 'pending_acceptance' && t.year === selectedYear && scopeIds.includes(t.toOrgId)
  );

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
    if (editId) {
      dispatch({ type: 'UPDATE_TRANSFER', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_TRANSFER', payload: form });
    }
    setForm(null);
    setEditId(null);
  }

  function cancel(id) { dispatch({ type: 'CANCEL_TRANSFER', payload: id }); }
  function remove(id) { dispatch({ type: 'DELETE_TRANSFER', payload: id }); }
  function accept(id) { dispatch({ type: 'ACCEPT_TRANSFER', payload: { id, acceptedBy: currentUserOrgId } }); }
  function reject(id) { dispatch({ type: 'REJECT_TRANSFER', payload: { id, rejectedBy: currentUserOrgId } }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Budget Transfers</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="year-selector">
            Period:&nbsp;
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" onClick={openNew}>+ Propose Transfer</button>
        </div>
      </div>

      {incoming.length > 0 && (
        <>
          <h3>Incoming Transfer Requests</h3>
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Proposed By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
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

      <h3 style={{ marginTop: incoming.length > 0 ? '2rem' : 0 }}>All Transfers ({selectedYear})</h3>
      <table className="table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Proposed By</th>
            <th>Accepted By</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(t => {
            const fromNode = getNode(t.fromOrgId);
            const toNode = getNode(t.toOrgId);
            const proposerHead = getHead(t.proposedBy);
            const accepterHead = t.acceptedBy ? getHead(t.acceptedBy) : null;
            const isMine = scopeIds.includes(t.fromOrgId);
            return (
              <tr key={t.id}>
                <td>{fromNode?.title}</td>
                <td>{toNode?.title}</td>
                <td><strong>{t.amount}</strong></td>
                <td>{t.reason}</td>
                <td>{statusBadge(t.status)}</td>
                <td>{proposerHead?.name || '—'}</td>
                <td>{accepterHead?.name || '—'}</td>
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
    </div>
  );
}
