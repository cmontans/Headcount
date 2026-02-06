import { useState } from 'react';
import { useApp } from '../context/AppContext';

function OrgNode({ node, onEdit, onAdd, onDelete, selectedYear, editableIds, viewMode }) {
  const { getChildren, getDescendantIds, proposals, budgets, requisitions, transfers, challenges, getActualCount, getHead, getAccumulatedBudget, getAccumulatedActuals } = useApp();
  const children = getChildren(node.id);
  const actualCount = getActualCount(node.id);
  const pendingDelta = proposals.filter(p => p.orgId === node.id && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const budget = budgets.find(b => b.orgId === node.id && b.year === selectedYear);
  const head = getHead(node.id);
  const canEdit = editableIds.includes(node.id);
  const [collapsed, setCollapsed] = useState(false);

  // Correctly filter for OPEN requisitions (status === 'open')
  const openReqs = requisitions.filter(r => r.orgId === node.id && r.status === 'open').length;
  const pendingReqs = requisitions.filter(r => r.orgId === node.id && r.status === 'pending_approval').length;

  // Net pending transfer impact (positive = incoming HC, negative = outgoing HC)
  const pendingTransferDelta = transfers.filter(t => t.year === selectedYear && t.status === 'pending_acceptance')
    .reduce((sum, t) => {
      if (t.toOrgId === node.id) return sum + t.amount;
      if (t.fromOrgId === node.id) return sum - t.amount;
      return sum;
    }, 0);
  const pendingChallenges = challenges.filter(c => c.targetOrgId === node.id && c.year === selectedYear && c.status === 'pending').reduce((s, c) => s + c.amount, 0);

  const accBudget = getAccumulatedBudget(node.id, selectedYear);
  const accActuals = getAccumulatedActuals(node.id);

  // Accumulated indicators across descendants
  const descIds = getDescendantIds(node.id);
  const accPendingDelta = proposals.filter(p => descIds.includes(p.orgId) && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const accOpenReqs = requisitions.filter(r => descIds.includes(r.orgId) && r.status === 'open').length;
  const accPendingReqs = requisitions.filter(r => descIds.includes(r.orgId) && r.status === 'pending_approval').length;

  const accTransferDelta = transfers.filter(t => t.year === selectedYear && t.status === 'pending_acceptance')
    .reduce((sum, t) => {
      const fromIn = descIds.includes(t.fromOrgId);
      const toIn = descIds.includes(t.toOrgId);
      // Only count transfers that cross the boundary (one side in, one side out)
      if (fromIn && !toIn) return sum - t.amount;
      if (toIn && !fromIn) return sum + t.amount;
      return sum; // both inside = internal reallocation, net zero
    }, 0);
  const accChallenges = challenges.filter(c => descIds.includes(c.targetOrgId) && c.year === selectedYear && c.status === 'pending').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="org-node">
      <div className="org-card">
        {children.length > 0 && (
          <button className="btn-collapse" title={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
        )}
        <strong>{node.title}</strong>
        {head ? (
          <span className="org-head-name">{head.name}</span>
        ) : (
          <span className="org-head-vacant">Vacant</span>
        )}
        {viewMode === 'individual' && (() => {
          const budgetHC = budget ? budget.budgetedHC : 0;
          const delta = budgetHC - pendingChallenges - actualCount - openReqs;
          return (
            <div className="org-stats">
              {budget && <span title="Own budget">B:{budgetHC}</span>}
              {pendingChallenges > 0 && <span title="Pending challenges" className="text-danger">C:-{pendingChallenges}</span>}
              <span title="Own actuals">A:{actualCount}</span>
              {openReqs > 0 && <span title="Open requisitions" className="text-info">R:{openReqs}</span>}
              <span title="Delta (budget - challenges - actuals - open reqs)" className={delta < 0 ? 'text-danger' : delta > 0 ? 'text-success' : ''}>&Delta;:{delta > 0 ? '+' : ''}{delta}</span>
              {pendingDelta !== 0 && <span title="Pending budget proposals" className="text-warning">P:{pendingDelta > 0 ? '+' : ''}{pendingDelta}</span>}
              {pendingTransferDelta !== 0 && <span title="Pending transfers (net HC impact)" className={pendingTransferDelta > 0 ? 'text-info' : 'text-warning'}>T:{pendingTransferDelta > 0 ? '+' : ''}{pendingTransferDelta}</span>}
              {pendingReqs > 0 && <span title="Pending requisitions" className="text-warning">PR:{pendingReqs}</span>}
            </div>
          );
        })()}
        {viewMode === 'accumulated' && (() => {
          const accDelta = accBudget - accChallenges - accActuals - accOpenReqs;
          return (
            <div className="org-stats">
              <span title="Accumulated budget (own + descendants)">&Sigma;B:{accBudget}</span>
              {accChallenges > 0 && <span title="Accumulated pending challenges" className="text-danger">C:-{accChallenges}</span>}
              <span title="Accumulated actuals (own + descendants)">&Sigma;A:{accActuals}</span>
              {accOpenReqs > 0 && <span title="Accumulated open requisitions" className="text-info">R:{accOpenReqs}</span>}
              <span title="Accumulated delta (budget - challenges - actuals - open reqs)" className={accDelta < 0 ? 'text-danger' : accDelta > 0 ? 'text-success' : ''}>&Delta;:{accDelta > 0 ? '+' : ''}{accDelta}</span>
              {accPendingDelta !== 0 && <span title="Accumulated pending proposals" className="text-warning">P:{accPendingDelta > 0 ? '+' : ''}{accPendingDelta}</span>}
              {accTransferDelta !== 0 && <span title="Accumulated pending transfers (net HC impact)" className={accTransferDelta > 0 ? 'text-info' : 'text-warning'}>T:{accTransferDelta > 0 ? '+' : ''}{accTransferDelta}</span>}
              {accPendingReqs > 0 && <span title="Accumulated pending requisitions" className="text-warning">PR:{accPendingReqs}</span>}
            </div>
          );
        })()}
        {collapsed && children.length > 0 && <div className="org-stats"><span title="Hidden children" className="org-collapsed-hint">[{children.length}]</span></div>}
        {canEdit && (
          <div className="org-card-actions">
            <button className="btn-icon" title="Edit" onClick={() => onEdit(node)}>&#9998;</button>
            <button className="btn-icon" title="Add child" onClick={() => onAdd(node.id)}>&#43;</button>
            <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => onDelete(node)}>&#10005;</button>
          </div>
        )}
      </div>
      {children.length > 0 && !collapsed && (
        <div className="org-children">
          {children.map(c => <OrgNode key={c.id} node={c} onEdit={onEdit} onAdd={onAdd} onDelete={onDelete} selectedYear={selectedYear} editableIds={editableIds} viewMode={viewMode} />)}
        </div>
      )}
    </div>
  );
}

const emptyForm = { title: '', parentId: '' };

const currentYear = new Date().getFullYear();

export default function OrgTree() {
  const { currentUserOrgId, orgNodes, budgets, getChildren, getDescendantIds, getHead, dispatch } = useApp();
  const roots = orgNodes.filter(n => n.parentId === null);
  const editableIds = getDescendantIds(currentUserOrgId).filter(id => id !== currentUserOrgId);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' | 'accumulated'
  const [zoom, setZoom] = useState(1);

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  function openAdd(parentId) {
    setForm({ ...emptyForm, parentId });
    setEditId(null);
  }

  function handleZoom(delta) {
    setZoom(z => Math.max(0.2, Math.min(2, z + delta)));
  }

  function handleZoomReset() {
    setZoom(1);
  }

  function openEdit(node) {
    setForm({ title: node.title, parentId: node.parentId || '' });
    setEditId(node.id);
  }

  function save() {
    if (!form.title) return;
    if (editId) {
      const descIds = getDescendantIds(editId);
      if (form.parentId && descIds.includes(form.parentId)) {
        alert('Cannot move a node under its own descendant.');
        return;
      }
      dispatch({ type: 'UPDATE_ORG_NODE', payload: { id: editId, title: form.title, parentId: form.parentId || null } });
    } else {
      dispatch({ type: 'ADD_ORG_NODE', payload: { title: form.title, parentId: form.parentId || null } });
    }
    setForm(null);
    setEditId(null);
  }

  function handleDelete(node) {
    const children = getChildren(node.id);
    setConfirmDelete({ node, childCount: children.length });
  }

  function doDelete() {
    dispatch({ type: 'DELETE_ORG_NODE', payload: confirmDelete.node.id });
    setConfirmDelete(null);
  }

  function getParentOptions() {
    if (!editId) return orgNodes;
    const descIds = getDescendantIds(editId);
    return orgNodes.filter(n => !descIds.includes(n.id));
  }

  function orgLabel(n) {
    const head = getHead(n.id);
    return head ? `${n.title} (${head.name})` : n.title;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Organization Hierarchy</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="year-selector">
            Period:&nbsp;
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <div className="view-toggle">
            <button className={`btn btn-sm ${viewMode === 'individual' ? 'btn-primary' : ''}`} onClick={() => setViewMode('individual')}>Individual</button>
            <button className={`btn btn-sm ${viewMode === 'accumulated' ? 'btn-primary' : ''}`} onClick={() => setViewMode('accumulated')}>Accumulated</button>
          </div>
          <div className="zoom-controls">
            <button className="btn btn-sm" onClick={() => handleZoom(-0.1)} title="Zoom Out">-</button>
            <span style={{ margin: '0 0.5rem', minWidth: '3rem', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn btn-sm" onClick={() => handleZoom(0.1)} title="Zoom In">+</button>
            <button className="btn btn-sm" onClick={handleZoomReset} title="Reset Zoom">R</button>
          </div>
          <button className="btn btn-primary" onClick={() => openAdd(null)}>+ Add Organization</button>
          <button className="btn" onClick={() => { if (roots.length > 0) openAdd(roots[0].id); }}>+ Add Position</button>
        </div>
      </div>

      <div className="org-legend">
        {viewMode === 'individual' ? (
          <>
            <span><strong>B</strong> Budget</span>
            <span className="text-danger"><strong>C</strong> Challenges</span>
            <span><strong>A</strong> Actuals</span>
          </>
        ) : (
          <>
            <span><strong>&Sigma;B</strong> Accumulated Budget</span>
            <span className="text-danger"><strong>C</strong> Challenges</span>
            <span><strong>&Sigma;A</strong> Accumulated Actuals</span>
          </>
        )}
        <span className="text-info"><strong>R</strong> Open Reqs</span>
        <span><strong>&Delta;</strong> Delta</span>
        <span className="text-warning"><strong>P</strong> Pending Proposals</span>
        <span className="text-warning"><strong>T</strong> Pending Transfers</span>
        <span className="text-warning"><strong>PR</strong> Pending Reqs</span>
      </div>

      <div className="org-tree-wrapper" style={{ overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', height: 'calc(100vh - 200px)' }}>
        <div className="org-tree" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 'fit-content' }}>
          {roots.map(root => (
            <OrgNode key={root.id} node={root} onEdit={openEdit} onAdd={openAdd} onDelete={handleDelete} selectedYear={selectedYear} editableIds={editableIds} viewMode={viewMode} />
          ))}
          {roots.length === 0 && <p className="empty">No organizations defined yet.</p>}
        </div>
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'Add'} Position</h3>
            <label>Title / Role
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. VP Engineering" />
            </label>
            <label>Reports To
              <select value={form.parentId || ''} onChange={e => setForm({ ...form, parentId: e.target.value || null })}>
                <option value="">— None (root) —</option>
                {getParentOptions().map(n => (
                  <option key={n.id} value={n.id}>{orgLabel(n)}</option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Position</h3>
            <p>
              Remove <strong>{confirmDelete.node.title}</strong>?
            </p>
            {confirmDelete.childCount > 0 && (
              <p className="delete-warning">
                This position has {confirmDelete.childCount} direct report{confirmDelete.childCount > 1 ? 's' : ''}.
                They will be reassigned to <strong>{orgNodes.find(n => n.id === confirmDelete.node.parentId)?.title || 'no parent'}</strong>.
              </p>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={doDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
