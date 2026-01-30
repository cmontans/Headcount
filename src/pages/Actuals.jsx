import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Actuals() {
  const { currentUserOrgId, actuals, getDescendantIds, getNode, getHead, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const scopeIds = getDescendantIds(currentUserOrgId);
  const visible = actuals.filter(a => scopeIds.includes(a.orgId));

  function openNew() {
    setForm({ orgId: currentUserOrgId, name: '', role: '', startDate: new Date().toISOString().slice(0, 10), isHead: false });
    setEditId(null);
  }

  function openEdit(a) {
    setForm({ orgId: a.orgId, name: a.name, role: a.role, startDate: a.startDate, status: a.status, isHead: a.isHead || false });
    setEditId(a.id);
  }

  function save() {
    if (!form.name || !form.role) return;
    // If marking as head, unmark any existing head for that org unit
    if (form.isHead) {
      const existingHead = actuals.find(a => a.orgId === form.orgId && a.isHead && a.id !== editId);
      if (existingHead) {
        dispatch({ type: 'UPDATE_ACTUAL', payload: { id: existingHead.id, isHead: false } });
      }
    }
    if (editId) {
      dispatch({ type: 'UPDATE_ACTUAL', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_ACTUAL', payload: form });
    }
    setForm(null);
    setEditId(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Headcount Actuals</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Add Person</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'Add'} Person</h3>
            <label>Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  const head = getHead(id);
                  return n ? <option key={id} value={id}>{n.title}{head ? ` (${head.name})` : ''}</option> : null;
                })}
              </select>
            </label>
            <label>Name
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>Role
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </label>
            <label>Start Date
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.isHead} onChange={e => setForm({ ...form, isHead: e.target.checked })} />
              Head of this organization unit
            </label>
            {form.isHead && (() => {
              const existingHead = actuals.find(a => a.orgId === form.orgId && a.isHead && a.id !== editId);
              if (!existingHead) return null;
              return (
                <div className="budget-preview" style={{ background: '#fef3c7', color: '#92400e' }}>
                  This will replace <strong>{existingHead.name}</strong> as head of this unit.
                </div>
              );
            })()}
            {editId && (
              <label>Status
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="departed">Departed</option>
                </select>
              </label>
            )}
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
            <th>Name</th>
            <th>Role</th>
            <th>Team</th>
            <th>Head</th>
            <th>Start Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(a => {
            const node = getNode(a.orgId);
            return (
              <tr key={a.id} className={a.isHead ? 'row-head' : ''}>
                <td>{a.name}</td>
                <td>{a.role}</td>
                <td>{node?.title || a.orgId}</td>
                <td>{a.isHead ? <span className="badge badge-head">Head</span> : '—'}</td>
                <td>{a.startDate}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td className="actions">
                  <button className="btn btn-sm" onClick={() => openEdit(a)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: 'DELETE_ACTUAL', payload: a.id })}>Remove</button>
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="7" className="empty">No actuals in your scope</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
