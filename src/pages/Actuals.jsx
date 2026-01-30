import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Actuals() {
  const { currentUser, actuals, getDescendantIds, getNode, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUser.id);
  const visible = actuals.filter(a => scopeIds.includes(a.orgId));

  function openNew() {
    setForm({ orgId: currentUser.id, name: '', role: '', startDate: new Date().toISOString().slice(0, 10) });
    setEditId(null);
  }

  function openEdit(a) {
    setForm({ orgId: a.orgId, name: a.name, role: a.role, startDate: a.startDate, status: a.status });
    setEditId(a.id);
  }

  function save() {
    if (!form.name || !form.role) return;
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
                  return n ? <option key={id} value={id}>{n.name} — {n.title}</option> : null;
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
            <th>Start Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(a => {
            const node = getNode(a.orgId);
            return (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.role}</td>
                <td>{node?.title || a.orgId}</td>
                <td>{a.startDate}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td className="actions">
                  <button className="btn btn-sm" onClick={() => openEdit(a)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: 'DELETE_ACTUAL', payload: a.id })}>Remove</button>
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="6" className="empty">No actuals in your scope</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
