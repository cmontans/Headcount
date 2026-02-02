import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from 'uuid';
import {
  downloadCSV, parseCSV,
  exportOrgNodes, exportBudgets, exportActuals, exportProposals, exportRequisitions,
} from '../utils/csv';

const TABS = ['Audit Log', 'Data Sync', 'Guide'];

const ACTION_CATEGORIES = {
  'Proposals': ['ADD_PROPOSAL', 'UPDATE_PROPOSAL', 'DELETE_PROPOSAL', 'SUBMIT_PROPOSAL', 'APPROVE_PROPOSAL', 'REJECT_PROPOSAL'],
  'Requisitions': ['ADD_REQUISITION', 'UPDATE_REQUISITION', 'DELETE_REQUISITION', 'SUBMIT_REQUISITION', 'APPROVE_REQUISITION', 'REJECT_REQUISITION', 'OPEN_REQUISITION', 'FILL_REQUISITION', 'CANCEL_REQUISITION'],
  'Budget': ['ADD_BUDGET', 'UPDATE_BUDGET', 'DELETE_BUDGET'],
  'Actuals': ['ADD_ACTUAL', 'UPDATE_ACTUAL', 'DELETE_ACTUAL'],
  'Transfers': ['ADD_TRANSFER', 'UPDATE_TRANSFER', 'DELETE_TRANSFER', 'CANCEL_TRANSFER', 'ACCEPT_TRANSFER', 'REJECT_TRANSFER'],
  'Challenges': ['ADD_CHALLENGE', 'UPDATE_CHALLENGE', 'DELETE_CHALLENGE', 'ACKNOWLEDGE_CHALLENGE'],
  'Organization': ['ADD_ORG_NODE', 'UPDATE_ORG_NODE', 'DELETE_ORG_NODE'],
};

/* ───────── Audit Log Section ───────── */
function AuditLogSection() {
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
    <>
      <div className="section-header">
        <h3>Audit Log</h3>
        <label>Filter:&nbsp;
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="All">All</option>
            {Object.keys(ACTION_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="empty">No audit entries yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>{getUserName(entry.userId)}</td>
                <td><code>{entry.action}</code></td>
                <td>{entry.description}</td>
                <td>{entry.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ───────── Data Sync Section ───────── */
function DataSyncSection() {
  const { orgNodes, budgets, actuals, proposals, requisitions, dispatch } = useApp();

  function handleExport(entity) {
    const map = {
      org: () => downloadCSV('org_nodes.csv', exportOrgNodes(orgNodes)),
      budgets: () => downloadCSV('budgets.csv', exportBudgets(budgets, orgNodes)),
      actuals: () => downloadCSV('actuals.csv', exportActuals(actuals, orgNodes)),
      proposals: () => downloadCSV('proposals.csv', exportProposals(proposals, orgNodes)),
      requisitions: () => downloadCSV('requisitions.csv', exportRequisitions(requisitions, orgNodes)),
    };
    map[entity]();
  }

  function handleExportAll() {
    handleExport('org');
    setTimeout(() => handleExport('budgets'), 100);
    setTimeout(() => handleExport('actuals'), 200);
    setTimeout(() => handleExport('proposals'), 300);
    setTimeout(() => handleExport('requisitions'), 400);
  }

  function handleImport(entity) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rows = parseCSV(ev.target.result);
        if (!rows.length) { alert('No data found in CSV.'); return; }
        try {
          const data = transformImport(entity, rows);
          dispatch({ type: `IMPORT_${entity.toUpperCase()}`, payload: data });
          alert(`Successfully imported ${data.length} ${entity} records.`);
        } catch (err) {
          alert(`Import error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function transformImport(entity, rows) {
    switch (entity) {
      case 'org_nodes':
        return rows.map(r => ({ id: r.id || uuid(), title: r.title, parentId: r.parentId || null }));
      case 'budgets':
        return rows.map(r => ({ id: r.id || uuid(), orgId: r.orgId, year: parseInt(r.year) || new Date().getFullYear(), budgetedHC: parseInt(r.budgetedHC) || 0, notes: r.notes || '' }));
      case 'actuals':
        return rows.map(r => ({ id: r.id || uuid(), orgId: r.orgId, name: r.name, role: r.role, startDate: r.startDate || '', status: r.status || 'active', isHead: r.isHead === 'true' }));
      case 'proposals':
        return rows.map(r => ({ id: r.id || uuid(), orgId: r.orgId, title: r.title, delta: parseInt(r.delta) || 0, justification: r.justification || '', status: r.status || 'draft', requestedBy: r.requestedBy || '', approvedBy: r.approvedBy || null, createdAt: r.createdAt || new Date().toISOString().slice(0, 10) }));
      case 'requisitions':
        return rows.map(r => ({ id: r.id || uuid(), orgId: r.orgId, role: r.role, type: r.type || 'new_position', justification: r.justification || '', replacingName: r.replacingName || null, status: r.status || 'draft', requestedBy: r.requestedBy || '', approvedBy: r.approvedBy || null, createdAt: r.createdAt || new Date().toISOString().slice(0, 10) }));
      default:
        throw new Error('Unknown entity: ' + entity);
    }
  }

  const entities = [
    { key: 'org', importKey: 'org_nodes', label: 'Organization Structure', count: orgNodes.length },
    { key: 'budgets', importKey: 'budgets', label: 'Budgets', count: budgets.length },
    { key: 'actuals', importKey: 'actuals', label: 'Actuals (Employees)', count: actuals.length },
    { key: 'proposals', importKey: 'proposals', label: 'Budget Change Proposals', count: proposals.length },
    { key: 'requisitions', importKey: 'requisitions', label: 'Job Requisitions', count: requisitions.length },
  ];

  return (
    <>
      <h3>Export</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={handleExportAll}>Export All (5 files)</button>
      </div>
      <table className="table">
        <thead><tr><th>Data</th><th>Records</th><th>Actions</th></tr></thead>
        <tbody>
          {entities.map(e => (
            <tr key={e.key}>
              <td>{e.label}</td>
              <td>{e.count}</td>
              <td><button className="btn btn-sm btn-primary" onClick={() => handleExport(e.key)}>Export CSV</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '2rem' }}>Import</h3>
      <p className="field-hint">Importing a CSV will <strong>replace</strong> all existing data for that entity. Back up by exporting first.</p>
      <table className="table">
        <thead><tr><th>Data</th><th>Current Records</th><th>Actions</th></tr></thead>
        <tbody>
          {entities.map(e => (
            <tr key={e.key}>
              <td>{e.label}</td>
              <td>{e.count}</td>
              <td><button className="btn btn-sm btn-warning" onClick={() => handleImport(e.importKey)}>Import CSV</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '2rem' }}>Workday Integration Guide</h3>
      <div className="sync-guide">
        <h4>Export from Workday → Import here</h4>
        <ol>
          <li>In Workday, run a custom report (RaaS) for Organizations, Workers, or Positions</li>
          <li>Export as CSV</li>
          <li>Map the Workday columns to match our CSV format (see exported files for headers)</li>
          <li>Use the Import buttons above to load the data</li>
        </ol>
        <h4>Export from here → Import to Workday</h4>
        <ol>
          <li>Use the Export buttons above to download CSV files</li>
          <li>Use Workday's EIB (Enterprise Interface Builder) to create an inbound integration</li>
          <li>Map our CSV fields to Workday fields</li>
          <li>Run the integration to load data into Workday</li>
        </ol>
      </div>
    </>
  );
}

/* ───────── Guide Section ───────── */
function GuideSection() {
  return (
    <div className="user-guide">
      <p>Welcome to <strong>HC Manager</strong> — a headcount management tool for hierarchical organizations.</p>

      <nav className="guide-toc">
        <h4>Table of Contents</h4>
        <ol>
          <li><a href="#overview">Overview</a></li>
          <li><a href="#user-switcher">User Switcher</a></li>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#organization">Organization Hierarchy</a></li>
          <li><a href="#budget">Budget Management</a></li>
          <li><a href="#proposals">Budget Change Proposals</a></li>
          <li><a href="#approvals">Approval Workflow</a></li>
          <li><a href="#actuals">Actuals (Employees)</a></li>
          <li><a href="#requisitions">Job Requisitions</a></li>
          <li><a href="#glossary">Glossary</a></li>
        </ol>
      </nav>

      <section id="overview">
        <h4>1. Overview</h4>
        <p>HC Manager lets you manage your organization's headcount planning across these key areas:</p>
        <ul>
          <li><strong>Organization Hierarchy</strong> — Define your org structure as a tree of positions</li>
          <li><strong>Budget</strong> — Set headcount targets per org unit per year</li>
          <li><strong>Budget Change Proposals</strong> — Request increases or decreases to budgeted headcount</li>
          <li><strong>Actuals</strong> — Track who is currently filling positions</li>
          <li><strong>Job Requisitions</strong> — Request new hires or substitutions</li>
          <li><strong>Approval Workflow</strong> — Approve, escalate, or reject proposals and requisitions</li>
          <li><strong>Audit Log</strong> — Track every action performed in the system</li>
          <li><strong>Data Sync</strong> — Import/export CSV files for Workday or other HR systems</li>
        </ul>
        <p>Every user is a <strong>head of an organization unit</strong>. The current user can only view and manage data within their subtree.</p>
      </section>

      <section id="user-switcher">
        <h4>2. User Switcher</h4>
        <p>Located in the top-right corner. Select a user to simulate acting as that person. The entire application is scoped to the selected user's org subtree.</p>
      </section>

      <section id="dashboard">
        <h4>3. Dashboard</h4>
        <p>High-level overview with KPI cards: Total Budgeted HC, Total Actuals, Variance, Pending Proposals, Open Requisitions, and more. Below the KPIs, a team breakdown table shows budget vs. actuals for each org unit.</p>
      </section>

      <section id="organization">
        <h4>4. Organization Hierarchy</h4>
        <p>Visual tree of your org structure. Each node shows the position title and head's name. You can add, edit, reparent, and delete org units. Org nodes are positions, not people.</p>
      </section>

      <section id="budget">
        <h4>5. Budget Management</h4>
        <p>Shows headcount budget per org unit. Includes Proposals (formal budget change requests), Transfers (peer-to-peer headcount moves), and Challenges (superior-to-subordinate reduction targets).</p>
      </section>

      <section id="proposals">
        <h4>6. Budget Change Proposals</h4>
        <p>Lifecycle: Draft → Pending Approval → Approved/Rejected. When approved, budget delta propagates downstream from approver to requester.</p>
      </section>

      <section id="approvals">
        <h4>7. Approval Workflow</h4>
        <p>Proposals can be approved, escalated, or rejected. Requisitions can be approved or rejected. The page shows items from direct reports and your own pending submissions.</p>
      </section>

      <section id="actuals">
        <h4>8. Actuals (Employees)</h4>
        <p>Track people in your organization with name, role, org unit, start date, status, and head designation. Only one head per org unit.</p>
      </section>

      <section id="requisitions">
        <h4>9. Job Requisitions</h4>
        <p>Lifecycle: Draft → Pending → Approved → Open → Filled/Cancelled. Types: New Position or Substitution.</p>
      </section>

      <section id="glossary">
        <h4>10. Glossary</h4>
        <table className="table">
          <thead><tr><th>Term</th><th>Definition</th></tr></thead>
          <tbody>
            <tr><td>Org Unit</td><td>A position in the hierarchy (e.g., "VP Engineering")</td></tr>
            <tr><td>Head</td><td>The person currently leading an org unit</td></tr>
            <tr><td>Budgeted HC</td><td>Approved headcount for an org unit in a given year</td></tr>
            <tr><td>Delta</td><td>Change in headcount requested by a proposal (+/-)</td></tr>
            <tr><td>Escalate</td><td>Pass a pending proposal up the hierarchy</td></tr>
            <tr><td>Downstream Propagation</td><td>Budget delta applied from approver down to requester</td></tr>
            <tr><td>Variance</td><td>Budget minus actuals</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ───────── Main Admin Page ───────── */
export default function Admin() {
  const [activeTab, setActiveTab] = useState('Audit Log');
  const { dispatch } = useApp();

  function handleReset() {
    if (window.confirm('Reset all data to default seed values? This cannot be undone.')) {
      dispatch({ type: 'RESET_TO_SEED' });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Administration</h2>
        <button className="btn btn-danger" onClick={handleReset}>Reset to Defaults</button>
      </div>
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 'Audit Log' && <AuditLogSection />}
        {activeTab === 'Data Sync' && <DataSyncSection />}
        {activeTab === 'Guide' && <GuideSection />}
      </div>
    </div>
  );
}
