import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

export default function Challenges() {
  const { currentUserOrgId, challenges, budgets, getDescendantIds, getChildren, getNode, getHead, getActualCount, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const subordinateIds = getDescendantIds(currentUserOrgId).filter(id => id !== currentUserOrgId);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  // Challenges I issued to my subordinates
  const issuedChallenges = challenges.filter(c => c.issuedBy === currentUserOrgId && c.year === selectedYear);

  // Challenges issued to me by my superior
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
    if (editId) {
      dispatch({ type: 'UPDATE_CHALLENGE', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_CHALLENGE', payload: { ...form, issuedBy: currentUserOrgId } });
    }
    setForm(null);
    setEditId(null);
  }

  function remove(id) { dispatch({ type: 'DELETE_CHALLENGE', payload: id }); }
  function acknowledge(id) { dispatch({ type: 'ACKNOWLEDGE_CHALLENGE', payload: { id, acknowledgedBy: currentUserOrgId } }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Budget Challenges</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="year-selector">
            Period:&nbsp;
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          {subordinateIds.length > 0 && (
            <button className="btn btn-primary" onClick={openNew}>+ Issue Challenge</button>
          )}
        </div>
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

      <h3>Challenges Received</h3>
      {receivedChallenges.length === 0 ? (
        <p className="empty">No budget challenges assigned to you for {selectedYear}.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Issued By</th>
              <th>Reduction</th>
              <th>Current Budget</th>
              <th>After Challenge</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivedChallenges.map(c => {
              const issuerHead = getHead(c.issuedBy);
              const issuerNode = getNode(c.issuedBy);
              const budget = budgets.find(b => b.orgId === c.targetOrgId && b.year === c.year);
              const currentHC = budget ? budget.budgetedHC : 0;
              return (
                <tr key={c.id}>
                  <td>{issuerHead?.name || '—'} ({issuerNode?.title})</td>
                  <td><span className="text-danger">-{c.amount}</span></td>
                  <td>{currentHC}</td>
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
      )}

      <h3 style={{ marginTop: '2rem' }}>Challenges Issued</h3>
      {issuedChallenges.length === 0 ? (
        <p className="empty">You have not issued any budget challenges for {selectedYear}.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Target Org</th>
              <th>Reduction</th>
              <th>Current Budget</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issuedChallenges.map(c => {
              const targetNode = getNode(c.targetOrgId);
              const targetHead = getHead(c.targetOrgId);
              const budget = budgets.find(b => b.orgId === c.targetOrgId && b.year === c.year);
              return (
                <tr key={c.id}>
                  <td>{targetNode?.title}{targetHead ? ` (${targetHead.name})` : ''}</td>
                  <td><span className="text-danger">-{c.amount}</span></td>
                  <td>{budget ? budget.budgetedHC : '—'}</td>
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
          </tbody>
        </table>
      )}
    </div>
  );
}
