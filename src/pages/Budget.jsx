import { useState } from 'react';
import { useApp } from '../context/AppContext';

const currentYear = new Date().getFullYear();

export default function Budget() {
  const { currentUserOrgId, budgets, proposals, getDescendantIds, getNode, getHead, getActualCount, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const scopeIds = getDescendantIds(currentUserOrgId).filter(id => id !== currentUserOrgId);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

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
    if (editId) {
      dispatch({ type: 'UPDATE_BUDGET', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_BUDGET', payload: form });
    }
    setForm(null);
    setEditId(null);
  }

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return '0';
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Headcount Budget</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="year-selector">
            Period:&nbsp;
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" onClick={openNew}>+ New Budget Entry</button>
        </div>
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
            <th>Org Unit</th>
            <th>Year</th>
            <th>Budgeted HC</th>
            <th>Current Actuals</th>
            <th>Open Positions</th>
            <th>Pending Impact</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(b => {
            const node = getNode(b.orgId);
            const actualCount = getActualCount(b.orgId);
            const pendingDelta = proposals.filter(p => p.orgId === b.orgId && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
            const open = b.budgetedHC - actualCount;
            return (
              <tr key={b.id}>
                <td>{node?.title || b.orgId}</td>
                <td>{b.year}</td>
                <td>{b.budgetedHC}</td>
                <td>{actualCount}</td>
                <td className={open < 0 ? 'text-danger' : open > 0 ? 'text-success' : ''}>{open > 0 ? '+' : ''}{open}</td>
                <td>{formatDelta(pendingDelta)}</td>
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
