import { useState } from 'react';
import { useApp } from '../context/AppContext';

function OrgNode({ node, onEdit, onAdd, onDelete, selectedYear, editableIds }) {
  const { getChildren, proposals, budgets, requisitions, transfers, challenges, getActualCount, getHead, getAccumulatedBudget, getAccumulatedActuals } = useApp();
  const children = getChildren(node.id);
  const actualCount = getActualCount(node.id);
  const pendingDelta = proposals.filter(p => p.orgId === node.id && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const budget = budgets.find(b => b.orgId === node.id && b.year === selectedYear);
  const head = getHead(node.id);
  const canEdit = editableIds.includes(node.id);
  const [collapsed, setCollapsed] = useState(false);

  const openReqs = requisitions.filter(r => r.orgId === node.id && r.status === 'pending_approval').length;
  const pendingTransfers = transfers.filter(t => (t.toOrgId === node.id || t.fromOrgId === node.id) && t.year === selectedYear && t.status === 'pending_acceptance').length;
  const pendingChallenges = challenges.filter(c => c.targetOrgId === node.id && c.year === selectedYear && c.status === 'pending').length;

  const accBudget = getAccumulatedBudget(node.id, selectedYear);
  const accActuals = getAccumulatedActuals(node.id);

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
        <div className="org-stats">
          {budget && <span title="Own budget">B:{budget.budgetedHC}</span>}
          <span title="Own actuals">A:{actualCount}</span>
        </div>
        <div className="org-stats">
          <span title="Accumulated budget (own + descendants)" className="text-accent">&Sigma;B:{accBudget}</span>
          <span title="Accumulated actuals (own + descendants)" className="text-accent">&Sigma;A:{accActuals}</span>
          {pendingDelta !== 0 && <span title="Pending budget proposals" className="text-warning">P:{pendingDelta > 0 ? '+' : ''}{pendingDelta}</span>}
          {openReqs > 0 && <span title="Open requisitions" className="text-info">R:{openReqs}</span>}
          {pendingTransfers > 0 && <span title="Pending transfers" className="text-warning">T:{pendingTransfers}</span>}
          {pendingChallenges > 0 && <span title="Pending challenges" className="text-danger">C:{pendingChallenges}</span>}
          {collapsed && children.length > 0 && <span title="Hidden children" className="org-collapsed-hint">[{children.length}]</span>}
        </div>
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
          {children.map(c => <OrgNode key={c.id} node={c} onEdit={onEdit} onAdd={onAdd} onDelete={onDelete} selectedYear={selectedYear} editableIds={editableIds} />)}
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

  const years = [...new Set(budgets.map(b => b.year))].sort();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort();

  function openAdd(parentId) {
    setForm({ ...emptyForm, parentId });
    setEditId(null);
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="year-selector">
            Period:&nbsp;
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" onClick={() => openAdd(null)}>+ Add Organization</button>
          <button className="btn" onClick={() => { if (roots.length > 0) openAdd(roots[0].id); }}>+ Add Position</button>
        </div>
      </div>

      <div className="org-tree">
        {roots.map(root => (
          <OrgNode key={root.id} node={root} onEdit={openEdit} onAdd={openAdd} onDelete={handleDelete} selectedYear={selectedYear} editableIds={editableIds} />
        ))}
        {roots.length === 0 && <p className="empty">No organizations defined yet.</p>}
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
