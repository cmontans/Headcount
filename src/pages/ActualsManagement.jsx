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

/* ───── Approvals sub-section ───── */
function ApprovalsSection() {
  const { currentUserOrgId, proposals, requisitions, budgets, getChildren, getNode, getHead, getParent, getActualCount, dispatch } = useApp();

  const directReportIds = getChildren(currentUserOrgId).map(c => c.id);
  const parentOrg = getParent(currentUserOrgId);
  const canEscalate = !!parentOrg;

  const pendingProposals = proposals.filter(p => p.status === 'pending_approval' && directReportIds.includes(p.requestedBy));
  const myPendingProposals = proposals.filter(p => p.status === 'pending_approval' && p.requestedBy === currentUserOrgId);
  const pendingReqs = requisitions.filter(r => r.status === 'pending_approval' && directReportIds.includes(r.requestedBy));
  const myPendingReqs = requisitions.filter(r => r.status === 'pending_approval' && r.requestedBy === currentUserOrgId);

  function approveProposal(id) { dispatch({ type: 'APPROVE_PROPOSAL', payload: { id, approvedBy: currentUserOrgId } }); }
  function rejectProposal(id) { dispatch({ type: 'REJECT_PROPOSAL', payload: { id, rejectedBy: currentUserOrgId } }); }
  function escalateProposal(id) { dispatch({ type: 'ESCALATE_PROPOSAL', payload: { id, escalatedByOrg: currentUserOrgId } }); }
  function approveReq(id) { dispatch({ type: 'APPROVE_REQUISITION', payload: { id, approvedBy: currentUserOrgId } }); }
  function rejectReq(id) { dispatch({ type: 'REJECT_REQUISITION', payload: { id, rejectedBy: currentUserOrgId } }); }

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return <span>0</span>;
  }

  function getFundingInfo(r) {
    if (r.fundingType === 'budget') {
      const b = budgets.find(b => b.id === r.fundingId);
      if (!b) return <span className="text-muted">No budget linked</span>;
      const actual = getActualCount(b.orgId);
      const open = b.budgetedHC - actual;
      return (<div><strong>Budget {b.year}</strong><br />Budgeted: {b.budgetedHC} | Filled: {actual} | Open: <span className={open > 0 ? 'text-success' : open < 0 ? 'text-danger' : ''}>{open}</span></div>);
    }
    if (r.fundingType === 'proposal') {
      const p = proposals.find(p => p.id === r.fundingId);
      if (!p) return <span className="text-muted">No proposal linked</span>;
      return (<div><strong>{p.title}</strong><br />Status: <span className={`badge badge-${p.status}`}>{p.status.replace(/_/g, ' ')}</span> | Delta: {formatDelta(p.delta)}</div>);
    }
    return <span className="text-muted">—</span>;
  }

  return (
    <>
      <h3>Budget Change Proposals Awaiting Your Approval</h3>
      {pendingProposals.length === 0 ? (
        <p className="empty">No pending budget change proposals from your direct reports.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Requested By</th><th>Team</th><th>Proposal</th><th>Delta</th><th>Current Budget</th><th>After Approval</th><th>Justification</th><th>Escalated</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {pendingProposals.map(p => {
              const requestorHead = getHead(p.requestedBy);
              const team = getNode(p.orgId);
              const budget = budgets.find(b => b.orgId === p.orgId);
              const currentHC = budget ? budget.budgetedHC : 0;
              const escalatedFromNode = p.escalatedFrom ? getNode(p.escalatedFrom) : null;
              return (
                <tr key={p.id}>
                  <td>{requestorHead?.name || '—'}</td><td>{team?.title}</td><td>{p.title}</td><td>{formatDelta(p.delta)}</td>
                  <td>{currentHC}</td><td><strong>{currentHC + p.delta}</strong></td><td>{p.justification}</td>
                  <td>{escalatedFromNode ? <span className="badge badge-escalated">from {escalatedFromNode.title}</span> : '—'}</td>
                  <td>{p.createdAt}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-success" onClick={() => approveProposal(p.id)}>Approve</button>
                    {canEscalate && <button className="btn btn-sm btn-warning" onClick={() => escalateProposal(p.id)}>Escalate</button>}
                    <button className="btn btn-sm btn-danger" onClick={() => rejectProposal(p.id)}>Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Job Requisitions Awaiting Your Approval</h3>
      {pendingReqs.length === 0 ? (
        <p className="empty">No pending job requisitions from your direct reports.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Requested By</th><th>Team</th><th>Role</th><th>Type</th><th>Funding Source</th><th>Replacing</th><th>Justification</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {pendingReqs.map(r => {
              const requestorHead = getHead(r.requestedBy);
              const team = getNode(r.orgId);
              return (
                <tr key={r.id}>
                  <td>{requestorHead?.name || '—'}</td><td>{team?.title}</td><td>{r.role}</td>
                  <td><span className={`badge badge-${r.type}`}>{r.type === 'new_position' ? 'New Position' : 'Substitution'}</span></td>
                  <td>{getFundingInfo(r)}</td><td>{r.replacingName || '—'}</td><td>{r.justification}</td><td>{r.createdAt}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-success" onClick={() => approveReq(r.id)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => rejectReq(r.id)}>Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Your Submitted Budget Change Proposals (Pending)</h3>
      {myPendingProposals.length === 0 ? (
        <p className="empty">You have no pending budget change proposals.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Team</th><th>Proposal</th><th>Delta</th><th>Justification</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {myPendingProposals.map(p => {
              const team = getNode(p.orgId);
              return (<tr key={p.id}><td>{team?.title}</td><td>{p.title}</td><td>{formatDelta(p.delta)}</td><td>{p.justification}</td><td>{p.createdAt}</td><td><span className="badge badge-pending_approval">pending approval</span></td></tr>);
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Your Submitted Requisitions (Pending)</h3>
      {myPendingReqs.length === 0 ? (
        <p className="empty">You have no pending job requisitions.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Team</th><th>Role</th><th>Type</th><th>Funding Source</th><th>Justification</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {myPendingReqs.map(r => {
              const team = getNode(r.orgId);
              return (<tr key={r.id}><td>{team?.title}</td><td>{r.role}</td><td>{r.type === 'new_position' ? 'New Position' : 'Substitution'}</td><td>{getFundingInfo(r)}</td><td>{r.justification}</td><td>{r.createdAt}</td><td><span className="badge badge-pending_approval">pending approval</span></td></tr>);
            })}
          </tbody>
        </table>
      )}
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
const TABS = ['Actuals', 'Approvals', 'Requisitions'];

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
        {activeTab === 'Approvals' && <ApprovalsSection />}
        {activeTab === 'Requisitions' && <RequisitionsSection />}
      </div>
    </div>
  );
}
