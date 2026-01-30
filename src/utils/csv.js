// CSV utility functions for Workday-compatible import/export

export function toCSV(headers, rows) {
  const escape = (val) => {
    const s = val == null ? '' : String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(headers.map(h => escape(row[h])).join(',')));
  return lines.join('\n');
}

export function parseCSV(text) {
  const lines = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field); field = ''; lines.push(current); current = [];
        if (ch === '\r') i++;
      } else { field += ch; }
    }
  }
  if (field || current.length) { current.push(field); lines.push(current); }
  if (!lines.length) return [];
  const headers = lines[0];
  return lines.slice(1).filter(r => r.some(c => c.trim())).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (row[i] || '').trim(); });
    return obj;
  });
}

export function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Entity-specific export functions
export function exportOrgNodes(orgNodes) {
  const headers = ['id', 'title', 'parentId'];
  return toCSV(headers, orgNodes);
}

export function exportBudgets(budgets, orgNodes) {
  const rows = budgets.map(b => ({
    id: b.id,
    orgId: b.orgId,
    orgTitle: orgNodes.find(n => n.id === b.orgId)?.title || '',
    year: b.year,
    budgetedHC: b.budgetedHC,
    notes: b.notes,
  }));
  return toCSV(['id', 'orgId', 'orgTitle', 'year', 'budgetedHC', 'notes'], rows);
}

export function exportActuals(actuals, orgNodes) {
  const rows = actuals.map(a => ({
    id: a.id,
    orgId: a.orgId,
    orgTitle: orgNodes.find(n => n.id === a.orgId)?.title || '',
    name: a.name,
    role: a.role,
    startDate: a.startDate,
    status: a.status,
    isHead: a.isHead ? 'true' : 'false',
  }));
  return toCSV(['id', 'orgId', 'orgTitle', 'name', 'role', 'startDate', 'status', 'isHead'], rows);
}

export function exportProposals(proposals, orgNodes) {
  const rows = proposals.map(p => ({
    id: p.id,
    orgId: p.orgId,
    orgTitle: orgNodes.find(n => n.id === p.orgId)?.title || '',
    title: p.title,
    delta: p.delta,
    justification: p.justification,
    status: p.status,
    requestedBy: p.requestedBy,
    approvedBy: p.approvedBy || '',
    createdAt: p.createdAt,
  }));
  return toCSV(['id', 'orgId', 'orgTitle', 'title', 'delta', 'justification', 'status', 'requestedBy', 'approvedBy', 'createdAt'], rows);
}

export function exportRequisitions(requisitions, orgNodes) {
  const rows = requisitions.map(r => ({
    id: r.id,
    orgId: r.orgId,
    orgTitle: orgNodes.find(n => n.id === r.orgId)?.title || '',
    role: r.role,
    type: r.type,
    justification: r.justification,
    replacingName: r.replacingName || '',
    status: r.status,
    requestedBy: r.requestedBy,
    approvedBy: r.approvedBy || '',
    createdAt: r.createdAt,
  }));
  return toCSV(['id', 'orgId', 'orgTitle', 'role', 'type', 'justification', 'replacingName', 'status', 'requestedBy', 'approvedBy', 'createdAt'], rows);
}
