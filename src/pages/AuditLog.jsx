import { useState } from 'react';
import { useApp } from '../context/AppContext';

const ACTION_CATEGORIES = {
  'Proposals': ['ADD_PROPOSAL', 'UPDATE_PROPOSAL', 'DELETE_PROPOSAL', 'SUBMIT_PROPOSAL', 'APPROVE_PROPOSAL', 'REJECT_PROPOSAL'],
  'Requisitions': ['ADD_REQUISITION', 'UPDATE_REQUISITION', 'DELETE_REQUISITION', 'SUBMIT_REQUISITION', 'APPROVE_REQUISITION', 'REJECT_REQUISITION', 'OPEN_REQUISITION', 'FILL_REQUISITION', 'CANCEL_REQUISITION'],
  'Budget': ['ADD_BUDGET', 'UPDATE_BUDGET', 'DELETE_BUDGET'],
  'Actuals': ['ADD_ACTUAL', 'UPDATE_ACTUAL', 'DELETE_ACTUAL'],
  'Organization': ['ADD_ORG_NODE', 'UPDATE_ORG_NODE', 'DELETE_ORG_NODE'],
};

export default function AuditLog() {
  const { auditLog, actuals } = useApp();
  const [filterCategory, setFilterCategory] = useState('All');

  const filtered = filterCategory === 'All'
    ? auditLog
    : auditLog.filter(e => ACTION_CATEGORIES[filterCategory]?.includes(e.action));

  function getUserName(userId) {
    const actual = actuals.find(a => a.id === userId);
    return actual?.name || '—';
  }

  return (
    <div className="page">
      <h2>Audit Log</h2>

      <div className="toolbar">
        <label>Filter by category:&nbsp;
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="All">All</option>
            {Object.keys(ACTION_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No audit entries yet. Actions will be recorded as you use the application.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>{getUserName(entry.userId)}</td>
                <td><code>{entry.action}</code></td>
                <td>{entry.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
