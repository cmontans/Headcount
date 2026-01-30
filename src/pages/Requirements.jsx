import { useState } from 'react';
import { useApp } from '../context/AppContext';

const emptyForm = { title: '', count: 1, justification: '', orgId: '' };

export default function Requirements() {
  const { currentUser, requirements, orgNodes, getDescendantIds, getNode, dispatch } = useApp();
  const [form, setForm] = useState(null); // null = closed
  const [editId, setEditId] = useState(null);

  // Show requirements the current user owns (their subtree)
  const scopeIds = getDescendantIds(currentUser.id);
  const visible = requirements.filter(r => scopeIds.includes(r.orgId));

  function openNew() {
    setForm({ ...emptyForm, orgId: currentUser.id, requestedBy: currentUser.id });
    setEditId(null);
  }

  function openEdit(req) {
    setForm({ title: req.title, count: req.count, justification: req.justification, orgId: req.orgId, requestedBy: req.requestedBy });
    setEditId(req.id);
  }

  function save() {
    if (!form.title) return;
    if (editId) {
      dispatch({ type: 'UPDATE_REQUIREMENT', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_REQUIREMENT', payload: form });
    }
    setForm(null);
    setEditId(null);
  }

  function submit(id) {
    dispatch({ type: 'SUBMIT_REQUIREMENT', payload: id });
  }

  function remove(id) {
    dispatch({ type: 'DELETE_REQUIREMENT', payload: id });
  }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Headcount Requirements</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Requirement</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'New'} Requirement</h3>
            <label>Team / Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  return n ? <option key={id} value={id}>{n.name} — {n.title}</option> : null;
                })}
              </select>
            </label>
            <label>Position Title
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>Headcount Needed
              <input type="number" min="1" value={form.count} onChange={e => setForm({ ...form, count: parseInt(e.target.value) || 1 })} />
            </label>
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
            <th>Team</th>
            <th>Position</th>
            <th>Count</th>
            <th>Status</th>
            <th>Requested By</th>
            <th>Approved By</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(r => {
            const node = getNode(r.orgId);
            const requestor = getNode(r.requestedBy);
            const approver = r.approvedBy ? getNode(r.approvedBy) : null;
            return (
              <tr key={r.id}>
                <td>{node?.title || r.orgId}</td>
                <td>{r.title}</td>
                <td>{r.count}</td>
                <td>{statusBadge(r.status)}</td>
                <td>{requestor?.name || '—'}</td>
                <td>{approver?.name || '—'}</td>
                <td>{r.createdAt}</td>
                <td className="actions">
                  {r.status === 'draft' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn btn-sm btn-primary" onClick={() => submit(r.id)}>Submit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Delete</button>
                    </>
                  )}
                  {r.status === 'rejected' && (
                    <>
                      <button className="btn btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      <button className="btn btn-sm btn-primary" onClick={() => submit(r.id)}>Re-submit</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="8" className="empty">No requirements in your scope</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
