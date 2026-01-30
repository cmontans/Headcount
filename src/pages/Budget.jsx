import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Budget() {
  const { currentUser, budgets, actuals, requirements, getDescendantIds, getNode, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUser.id);
  const visible = budgets.filter(b => scopeIds.includes(b.orgId));

  function openNew() {
    setForm({ orgId: currentUser.id, year: 2025, budgetedHC: 0, notes: '' });
    setEditId(null);
  }

  function openEdit(b) {
    setForm({ orgId: b.orgId, year: b.year, budgetedHC: b.budgetedHC, notes: b.notes });
    setEditId(b.id);
  }

  function save() {
    if (editId) {
      dispatch({ type: 'UPDATE_BUDGET', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_BUDGET', payload: form });
    }
    setForm(null);
    setEditId(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Headcount Budget</h2>
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
                  return n ? <option key={id} value={id}>{n.name} — {n.title}</option> : null;
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
            <th>Org Unit</th>
            <th>Year</th>
            <th>Budgeted HC</th>
            <th>Current Actuals</th>
            <th>Approved Reqs</th>
            <th>Variance</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(b => {
            const node = getNode(b.orgId);
            const actualCount = actuals.filter(a => a.orgId === b.orgId && a.status === 'active').length;
            const approvedReqs = requirements.filter(r => r.orgId === b.orgId && r.status === 'approved').reduce((s, r) => s + r.count, 0);
            const variance = b.budgetedHC - actualCount - approvedReqs;
            return (
              <tr key={b.id}>
                <td>{node?.title || b.orgId}</td>
                <td>{b.year}</td>
                <td>{b.budgetedHC}</td>
                <td>{actualCount}</td>
                <td>{approvedReqs}</td>
                <td className={variance < 0 ? 'text-danger' : variance > 0 ? 'text-success' : ''}>{variance > 0 ? '+' : ''}{variance}</td>
                <td>{b.notes}</td>
                <td className="actions">
                  <button className="btn btn-sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: 'DELETE_BUDGET', payload: b.id })}>Delete</button>
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="8" className="empty">No budget entries in your scope</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
