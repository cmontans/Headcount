import { useState } from 'react';
import { useApp } from '../context/AppContext';

function OrgNode({ node, onEdit, onAdd, onDelete }) {
  const { getChildren, proposals, budgets, getActualCount } = useApp();
  const children = getChildren(node.id);
  const actualCount = getActualCount(node.id);
  const pendingDelta = proposals.filter(p => p.orgId === node.id && p.status === 'pending_approval').reduce((s, p) => s + p.delta, 0);
  const budget = budgets.find(b => b.orgId === node.id);

  return (
    <div className="org-node">
      <div className="org-card">
        <strong>{node.name}</strong>
        <span className="org-title">{node.title}</span>
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
          {children.map(c => <OrgNode key={c.id} node={c} onEdit={onEdit} onAdd={onAdd} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

const emptyForm = { name: '', title: '', parentId: '' };

export default function OrgTree() {
  const { orgNodes, getChildren, getDescendantIds, dispatch } = useApp();
  const root = orgNodes.find(n => n.parentId === null);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function openAdd(parentId) {
    setForm({ ...emptyForm, parentId });
    setEditId(null);
  }

  function openEdit(node) {
    setForm({ name: node.name, title: node.title, parentId: node.parentId || '' });
    setEditId(node.id);
  }

  function save() {
    if (!form.name || !form.title) return;
    if (editId) {
      // Prevent making a node its own descendant
      const descIds = getDescendantIds(editId);
      if (form.parentId && descIds.includes(form.parentId)) {
        alert('Cannot move a node under its own descendant.');
        return;
      }
      dispatch({ type: 'UPDATE_ORG_NODE', payload: { id: editId, name: form.name, title: form.title, parentId: form.parentId || null } });
    } else {
      dispatch({ type: 'ADD_ORG_NODE', payload: { name: form.name, title: form.title, parentId: form.parentId || null } });
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

  // For the parent dropdown, exclude the node itself and its descendants (when editing)
  function getParentOptions() {
    if (!editId) return orgNodes;
    const descIds = getDescendantIds(editId);
    return orgNodes.filter(n => !descIds.includes(n.id));
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Organization Hierarchy</h2>
        <button className="btn btn-primary" onClick={() => openAdd(root?.id || null)}>+ Add Position</button>
      </div>

      <div className="org-tree">
        {root && <OrgNode node={root} onEdit={openEdit} onAdd={openAdd} onDelete={handleDelete} />}
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit' : 'Add'} Position</h3>
            <label>Name
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Person's name" />
            </label>
            <label>Title / Role
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. VP Engineering" />
            </label>
            <label>Reports To
              <select value={form.parentId || ''} onChange={e => setForm({ ...form, parentId: e.target.value || null })}>
                <option value="">— None (root) —</option>
                {getParentOptions().map(n => (
                  <option key={n.id} value={n.id}>{n.name} — {n.title}</option>
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
              Remove <strong>{confirmDelete.node.name}</strong> ({confirmDelete.node.title})?
            </p>
            {confirmDelete.childCount > 0 && (
              <p className="delete-warning">
                This position has {confirmDelete.childCount} direct report{confirmDelete.childCount > 1 ? 's' : ''}.
                They will be reassigned to <strong>{orgNodes.find(n => n.id === confirmDelete.node.parentId)?.name || 'no parent'}</strong>.
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
