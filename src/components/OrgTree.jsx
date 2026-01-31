import { useState } from 'react';
import { useApp } from '../context/AppContext';

function OrgNode({ node, onEdit, onAdd, onDelete, selectedYear }) {
  const { getChildren, proposals, budgets, getActualCount, getHead } = useApp();
  const children = getChildren(node.id);
  const actualCount = getActualCount(node.id);
  const pendingDelta = proposals.filter(p => p.orgId === node.id && p.year === selectedYear && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const budget = budgets.find(b => b.orgId === node.id && b.year === selectedYear);
  const head = getHead(node.id);

  return (
    <div className="org-node">
      <div className="org-card">
        <strong>{node.title}</strong>
        {head ? (
          <span className="org-head-name">{head.name}</span>
        ) : (
          <span className="org-head-vacant">Vacant</span>
        )}
        <div className="org-stats">
          {budget && <span title="Budget">B:{budget.budgetedHC}</span>}
          <span title="Actuals">A:{actualCount}</span>
          {pendingDelta !== 0 && <span title="Pending budget change">P:{pendingDelta > 0 ? '+' : ''}{pendingDelta}</span>}
        </div>
        <div className="org-card-actions">
          <button className="btn-icon" title="Edit" onClick={() => onEdit(node)}>&#9998;</button>
          <button className="btn-icon" title="Add child" onClick={() => onAdd(node.id)}>&#43;</button>
          {node.parentId !== null && (
            <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => onDelete(node)}>&#10005;</button>
          )}
        </div>
      </div>
      {children.length > 0 && (
        <div className="org-children">
          {children.map(c => <OrgNode key={c.id} node={c} onEdit={onEdit} onAdd={onAdd} onDelete={onDelete} selectedYear={selectedYear} />)}
        </div>
      )}
    </div>
  );
}

const emptyForm = { title: '', parentId: '' };

const currentYear = new Date().getFullYear();

export default function OrgTree() {
  const { orgNodes, budgets, getChildren, getDescendantIds, getHead, dispatch } = useApp();
  const root = orgNodes.find(n => n.parentId === null);
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
          <button className="btn btn-primary" onClick={() => openAdd(root?.id || null)}>+ Add Position</button>
        </div>
      </div>

      <div className="org-tree">
        {root && <OrgNode node={root} onEdit={openEdit} onAdd={openAdd} onDelete={handleDelete} selectedYear={selectedYear} />}
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
