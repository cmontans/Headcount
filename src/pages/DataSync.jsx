import { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from 'uuid';
import {
  downloadCSV, parseCSV,
  exportOrgNodes, exportBudgets, exportActuals, exportProposals, exportRequisitions,
} from '../utils/csv';

export default function DataSync() {
  const { orgNodes, budgets, actuals, proposals, requisitions, dispatch } = useApp();
  const fileRef = useRef();

  // --- Export handlers ---
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

  // --- Import handlers ---
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
        return rows.map(r => ({
          id: r.id || uuid(),
          title: r.title,
          parentId: r.parentId || null,
        }));
      case 'budgets':
        return rows.map(r => ({
          id: r.id || uuid(),
          orgId: r.orgId,
          year: parseInt(r.year) || new Date().getFullYear(),
          budgetedHC: parseInt(r.budgetedHC) || 0,
          notes: r.notes || '',
        }));
      case 'actuals':
        return rows.map(r => ({
          id: r.id || uuid(),
          orgId: r.orgId,
          name: r.name,
          role: r.role,
          startDate: r.startDate || '',
          status: r.status || 'active',
          isHead: r.isHead === 'true',
        }));
      case 'proposals':
        return rows.map(r => ({
          id: r.id || uuid(),
          orgId: r.orgId,
          title: r.title,
          delta: parseInt(r.delta) || 0,
          justification: r.justification || '',
          status: r.status || 'draft',
          requestedBy: r.requestedBy || '',
          approvedBy: r.approvedBy || null,
          createdAt: r.createdAt || new Date().toISOString().slice(0, 10),
        }));
      case 'requisitions':
        return rows.map(r => ({
          id: r.id || uuid(),
          orgId: r.orgId,
          role: r.role,
          type: r.type || 'new_position',
          justification: r.justification || '',
          replacingName: r.replacingName || null,
          status: r.status || 'draft',
          requestedBy: r.requestedBy || '',
          approvedBy: r.approvedBy || null,
          createdAt: r.createdAt || new Date().toISOString().slice(0, 10),
        }));
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
    <div className="page">
      <h2>Data Sync</h2>
      <p className="field-hint">Export data to CSV for Workday or other systems, or import CSV files to load data.</p>

      <h3>Export</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={handleExportAll}>Export All (5 files)</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Records</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entities.map(e => (
            <tr key={e.key}>
              <td>{e.label}</td>
              <td>{e.count}</td>
              <td>
                <button className="btn btn-sm btn-primary" onClick={() => handleExport(e.key)}>Export CSV</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '2rem' }}>Import</h3>
      <p className="field-hint">
        Importing a CSV will <strong>replace</strong> all existing data for that entity.
        Make sure the CSV headers match the exported format. Back up by exporting first.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Current Records</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entities.map(e => (
            <tr key={e.key}>
              <td>{e.label}</td>
              <td>{e.count}</td>
              <td>
                <button className="btn btn-sm btn-warning" onClick={() => handleImport(e.importKey)}>Import CSV</button>
              </td>
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

        <h4>CSV Format Reference</h4>
        <table className="table">
          <thead>
            <tr><th>Entity</th><th>Required Columns</th></tr>
          </thead>
          <tbody>
            <tr><td>Organization</td><td>id, title, parentId</td></tr>
            <tr><td>Budgets</td><td>orgId, year, budgetedHC, notes</td></tr>
            <tr><td>Actuals</td><td>orgId, name, role, startDate, status, isHead</td></tr>
            <tr><td>Proposals</td><td>orgId, title, delta, justification, status, requestedBy</td></tr>
            <tr><td>Requisitions</td><td>orgId, role, type, justification, status, requestedBy</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
