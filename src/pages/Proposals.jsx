import { useState } from 'react';
import { useApp } from '../context/AppContext';

const emptyForm = { title: '', delta: 1, justification: '', orgId: '' };

export default function Proposals() {
  const { currentUser, proposals, budgets, getDescendantIds, getNode, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const scopeIds = getDescendantIds(currentUser.id);
  const visible = proposals.filter(p => scopeIds.includes(p.orgId));

  function openNew() {
    setForm({ ...emptyForm, orgId: currentUser.id, requestedBy: currentUser.id });
    setEditId(null);
  }

  function openEdit(p) {
    setForm({ title: p.title, delta: p.delta, justification: p.justification, orgId: p.orgId, requestedBy: p.requestedBy });
    setEditId(p.id);
  }

  function save() {
    if (!form.title) return;
    if (editId) {
      dispatch({ type: 'UPDATE_PROPOSAL', payload: { id: editId, ...form } });
    } else {
      dispatch({ type: 'ADD_PROPOSAL', payload: form });
    }
    setForm(null);
    setEditId(null);
  }

  function submit(id) {
    dispatch({ type: 'SUBMIT_PROPOSAL', payload: id });
  }

  function remove(id) {
    dispatch({ type: 'DELETE_PROPOSAL', payload: id });
  }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return <span>0</span>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Headcount Proposals</h2>
        <button className="btn btn-primary" onClick={openNew}>+ New Proposal</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'New'} Proposal</h3>
            <label>Team / Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })}>
                {scopeIds.map(id => {
                  const n = getNode(id);
                  return n ? <option key={id} value={id}>{n.name} — {n.title}</option> : null;
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
              const budget = budgets.find(b => b.orgId === form.orgId);
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
            <th>Team</th>
            <th>Proposal</th>
            <th>Delta</th>
            <th>Status</th>
            <th>Requested By</th>
            <th>Approved By</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(p => {
            const node = getNode(p.orgId);
            const requestor = getNode(p.requestedBy);
            const approver = p.approvedBy ? getNode(p.approvedBy) : null;
            return (
              <tr key={p.id}>
                <td>{node?.title || p.orgId}</td>
                <td>{p.title}</td>
                <td>{formatDelta(p.delta)}</td>
                <td>{statusBadge(p.status)}</td>
                <td>{requestor?.name || '—'}</td>
                <td>{approver?.name || '—'}</td>
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
          {visible.length === 0 && <tr><td colSpan="8" className="empty">No proposals in your scope</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
