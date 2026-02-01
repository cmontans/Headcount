import { useState } from 'react';
import { useApp } from '../context/AppContext';

/* ───── Actuals sub-section ───── */
function ActualsSection() {
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
    if (form.isHead) {
      const existingHead = actuals.find(a => a.orgId === form.orgId && a.isHead && a.id !== editId);
      if (existingHead) dispatch({ type: 'UPDATE_ACTUAL', payload: { id: existingHead.id, isHead: false } });
    }
    if (editId) dispatch({ type: 'UPDATE_ACTUAL', payload: { id: editId, ...form } });
    else dispatch({ type: 'ADD_ACTUAL', payload: form });
    setForm(null); setEditId(null);
  }

  return (
    <>
      <div className="section-header">
        <h3>Headcount Actuals</h3>
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
            <label>Name <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Role <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></label>
            <label>Start Date <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.isHead} onChange={e => setForm({ ...form, isHead: e.target.checked })} />
              Head of this organization unit
            </label>
            {form.isHead && (() => {
              const existingHead = actuals.find(a => a.orgId === form.orgId && a.isHead && a.id !== editId);
              if (!existingHead) return null;
              return <div className="budget-preview" style={{ background: '#fef3c7', color: '#92400e' }}>This will replace <strong>{existingHead.name}</strong> as head of this unit.</div>;
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
        <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Head</th><th>Start Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {visible.map(a => {
            const node = getNode(a.orgId);
            return (
              <tr key={a.id} className={a.isHead ? 'row-head' : ''}>
                <td>{a.name}</td><td>{a.role}</td><td>{node?.title || a.orgId}</td>
                <td>{a.isHead ? <span className="badge badge-head">Head</span> : '—'}</td>
                <td>{a.startDate}</td><td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
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
    </>
  );
}

/* ───── Requisitions sub-section ───── */
function RequisitionsSection() {
  const { currentUserOrgId, requisitions, budgets, proposals, getDescendantIds, getNode, getHead, getActualCount, dispatch } = useApp();
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const emptyForm = { role: '', type: 'new_position', justification: '', replacingName: '', orgId: '', fundingType: 'budget', fundingId: '' };
  const scopeIds = getDescendantIds(currentUserOrgId);
  const visible = requisitions.filter(r => scopeIds.includes(r.orgId));

  function openNew() { setForm({ ...emptyForm, orgId: currentUserOrgId, requestedBy: currentUserOrgId }); setEditId(null); }
  function openEdit(r) {
    setForm({ role: r.role, type: r.type, justification: r.justification, replacingName: r.replacingName || '', orgId: r.orgId, requestedBy: r.requestedBy, fundingType: r.fundingType || 'budget', fundingId: r.fundingId || '' });
    setEditId(r.id);
  }
  function save() {
    if (!form.role || !form.fundingId) return;
    const payload = { ...form, replacingName: form.type === 'substitution' ? form.replacingName : null };
    if (editId) dispatch({ type: 'UPDATE_REQUISITION', payload: { id: editId, ...payload } });
    else dispatch({ type: 'ADD_REQUISITION', payload });
    setForm(null); setEditId(null);
  }
  function submit(id) { dispatch({ type: 'SUBMIT_REQUISITION', payload: id }); }
  function remove(id) { dispatch({ type: 'DELETE_REQUISITION', payload: id }); }
  function open(id) { dispatch({ type: 'OPEN_REQUISITION', payload: id }); }
  function fill(id) { dispatch({ type: 'FILL_REQUISITION', payload: id }); }
  function cancel(id) { dispatch({ type: 'CANCEL_REQUISITION', payload: id }); }

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;
  const typeBadge = (t) => <span className={`badge badge-${t}`}>{t === 'new_position' ? 'New Position' : 'Substitution'}</span>;

  const fundingBudgets = form ? budgets.filter(b => b.orgId === form.orgId) : [];
  const fundingProposals = form ? proposals.filter(p => p.orgId === form.orgId && (p.status === 'approved' || p.status === 'pending_approval')) : [];

  function getFundingLabel(r) {
    if (r.fundingType === 'budget') {
      const b = budgets.find(b => b.id === r.fundingId);
      if (!b) return '—';
      const actual = getActualCount(b.orgId);
      return `Budget ${b.year} (${actual}/${b.budgetedHC} filled)`;
    }
    if (r.fundingType === 'proposal') {
      const p = proposals.find(p => p.id === r.fundingId);
      if (!p) return '—';
      return `${p.title} (${p.status.replace(/_/g, ' ')}, ${p.delta > 0 ? '+' : ''}${p.delta})`;
    }
    return '—';
  }

  return (
    <>
      <div className="section-header">
        <h3>Job Requisitions</h3>
        <button className="btn btn-primary" onClick={openNew}>+ New Requisition</button>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'New'} Job Requisition</h3>
            <label>Team / Org Unit
              <select value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value, fundingId: '' })}>
                {scopeIds.map(id => {
                  const n = getNode(id); const head = getHead(id);
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
            <label>Funding Source
              <select value={form.fundingType} onChange={e => setForm({ ...form, fundingType: e.target.value, fundingId: '' })}>
                <option value="budget">Existing Budget</option>
                <option value="proposal">Budget Change Proposal</option>
              </select>
            </label>
            <label>{form.fundingType === 'budget' ? 'Select Budget' : 'Select Proposal'}
              <select value={form.fundingId} onChange={e => setForm({ ...form, fundingId: e.target.value })}>
                <option value="">-- Select --</option>
                {form.fundingType === 'budget' ? (
                  fundingBudgets.map(b => {
                    const actual = getActualCount(b.orgId); const open = b.budgetedHC - actual;
                    return <option key={b.id} value={b.id}>{b.year} — {b.budgetedHC} HC ({open > 0 ? open + ' open' : 'fully staffed'}){b.notes ? ` — ${b.notes}` : ''}</option>;
                  })
                ) : (
                  fundingProposals.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.status.replace(/_/g, ' ')}, {p.delta > 0 ? '+' : ''}{p.delta} HC)</option>
                  ))
                )}
              </select>
            </label>
            <label>Justification <textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} /></label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.fundingId}>Save</button>
            </div>
          </div>
        </div>
      )}

      <table className="table">
        <thead><tr><th>Team</th><th>Role</th><th>Type</th><th>Funding Source</th><th>Replacing</th><th>Status</th><th>Requested By</th><th>Approved By</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {visible.map(r => {
            const node = getNode(r.orgId);
            const requestorHead = getHead(r.requestedBy);
            const approverHead = r.approvedBy ? getHead(r.approvedBy) : null;
            return (
              <tr key={r.id}>
                <td>{node?.title || r.orgId}</td><td>{r.role}</td><td>{typeBadge(r.type)}</td><td>{getFundingLabel(r)}</td>
                <td>{r.replacingName || '—'}</td><td>{statusBadge(r.status)}</td><td>{requestorHead?.name || '—'}</td><td>{approverHead?.name || '—'}</td><td>{r.createdAt}</td>
                <td className="actions">
                  {r.status === 'draft' && (<><button className="btn btn-sm" onClick={() => openEdit(r)}>Edit</button><button className="btn btn-sm btn-primary" onClick={() => submit(r.id)}>Submit</button><button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Delete</button></>)}
                  {r.status === 'rejected' && (<><button className="btn btn-sm" onClick={() => openEdit(r)}>Edit</button><button className="btn btn-sm btn-primary" onClick={() => submit(r.id)}>Re-submit</button></>)}
                  {r.status === 'approved' && (<><button className="btn btn-sm btn-success" onClick={() => open(r.id)}>Open</button><button className="btn btn-sm btn-danger" onClick={() => cancel(r.id)}>Cancel</button></>)}
                  {r.status === 'open' && (<><button className="btn btn-sm btn-success" onClick={() => fill(r.id)}>Mark Filled</button><button className="btn btn-sm btn-danger" onClick={() => cancel(r.id)}>Cancel</button></>)}
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && <tr><td colSpan="10" className="empty">No job requisitions in your scope</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ───── Main page with tabs ───── */
const TABS = ['Actuals', 'Requisitions'];

export default function ActualsManagement() {
  const [activeTab, setActiveTab] = useState('Actuals');

  return (
    <div className="page">
      <h2>Actuals Management</h2>

      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'Actuals' && <ActualsSection />}
        {activeTab === 'Requisitions' && <RequisitionsSection />}
      </div>
    </div>
  );
}
