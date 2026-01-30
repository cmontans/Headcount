import { useState } from 'react';
import { useApp } from '../context/AppContext';

const emptyForm = { role: '', type: 'new_position', justification: '', replacingName: '', orgId: '' };

export default function Requisitions() {
  const { currentUserOrgId, requisitions, getDescendantIds, getNode, getHead, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUserOrgId);
  const visible = requisitions.filter(r => scopeIds.includes(r.orgId));

  function openNew() {
    setForm({ ...emptyForm, orgId: currentUserOrgId, requestedBy: currentUserOrgId });
    setEditId(null);
  }

  function openEdit(r) {
    setForm({ role: r.role, type: r.type, justification: r.justification, replacingName: r.replacingName || '', orgId: r.orgId, requestedBy: r.requestedBy });
    setEditId(r.id);
  }

  function save() {
    if (!form.role) return;
    const payload = { ...form, replacingName: form.type === 'substitution' ? form.replacingName : null };
    if (editId) {
      dispatch({ type: 'UPDATE_REQUISITION', payload: { id: editId, ...payload } });
    } else {
      dispatch({ type: 'ADD_REQUISITION', payload });
    }
    setForm(null);
    setEditId(null);
  }

  function submit(id) { dispatch({ type: 'SUBMIT_REQUISITION', payload: id }); }
  function remove(id) { dispatch({ type: 'DELETE_REQUISITION', payload: id }); }
  function open(id) { dispatch({ type: 'OPEN_REQUISITION', payload: id }); }
  function fill(id) { dispatch({ type: 'FILL_REQUISITION', payload: id }); }
  function cancel(id) { dispatch({ type: 'CANCEL_REQUISITION', payload: id }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;
  const typeBadge = (t) => <span className={`badge badge-${t}`}>{t === 'new_position' ? 'New Position' : 'Substitution'}</span>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Job Requisitions</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Requisition</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'New'} Job Requisition</h3>
            <label>Team / Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  const head = getHead(id);
                  return n ? <option key={id} value={id}>{n.title}{head ? ` (${head.name})` : ''}</option> : null;
                })}
              </select>
            </label>
            <label>Role / Position Title
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior React Developer" />
            </label>
            <label>Type
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="new_position">New Position</option>
                <option value="substitution">Substitution</option>
              </select>
            </label>
            {form.type === 'substitution' && (
              <label>Replacing (Name)
                <input value={form.replacingName} onChange={e => setForm({ ...form, replacingName: e.target.value })} placeholder="Name of person being replaced" />
              </label>
            )}
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
            <th>Role</th>
            <th>Type</th>
            <th>Replacing</th>
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
            const requestorHead = getHead(r.requestedBy);
            const approverHead = r.approvedBy ? getHead(r.approvedBy) : null;
            return (
              <tr key={r.id}>
                <td>{node?.title || r.orgId}</td>
                <td>{r.role}</td>
                <td>{typeBadge(r.type)}</td>
                <td>{r.replacingName || '—'}</td>
                <td>{statusBadge(r.status)}</td>
                <td>{requestorHead?.name || '—'}</td>
                <td>{approverHead?.name || '—'}</td>
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
                  {r.status === 'approved' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => open(r.id)}>Open</button>
                      <button className="btn btn-sm btn-danger" onClick={() => cancel(r.id)}>Cancel</button>
                    </>
                  )}
                  {r.status === 'open' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => fill(r.id)}>Mark Filled</button>
                      <button className="btn btn-sm btn-danger" onClick={() => cancel(r.id)}>Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="9" className="empty">No job requisitions in your scope</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
