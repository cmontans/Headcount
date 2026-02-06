import * as XLSX from 'xlsx';

/**
 * Read an XLSX file and return the first sheet's data as an array of row arrays.
 * @param {File} file
 * @returns {Promise<{sheetName: string, rows: Array<Array<string>>}>}
 */
export function readXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        resolve({ sheetName, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse the "Organization" column value.
 * Format: "Org Title (Head Name (HeadExternalId))"
 * @param {string} value
 * @returns {{ orgTitle: string, headName: string, headExternalId: string } | null}
 */
export function parseOrgColumn(value) {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();
  // Match: "Org Title (Head Name (12345))" and allow trailing text
  const match = s.match(/^(.+?)\s*\((.+?)\s*\((\d+)\)\).*$/);
  if (!match) return null;
  return {
    orgTitle: match[1].trim(),
    headName: match[2].trim(),
    headExternalId: match[3],
  };
}

/**
 * Parse the "Position and Job" column value.
 * Format: "Role - Employee Name (ExternalId)"
 * Handles regular dash, en-dash, and em-dash.
 * @param {string} value
 * @returns {{ role: string, name: string, externalId: string } | null}
 */
export function parsePositionColumn(value) {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();
  // Match: "Role - Employee Name (12345)" (supports -, –, —) and ignores trailing text
  const match = s.match(/^(.+?)\s*[-–—]\s*(.+?)\s*\((\d+)\).*$/);
  if (!match) return null;
  return {
    role: match[1].trim(),
    name: match[2].trim(),
    externalId: match[3],
  };
}

/**
 * Parse XLSX sheet data into organizations and employees for upsert.
 * Expects columns: "Organization" and "Position and Job - All Staffing Models"
 *
 * @param {Array<Array<string>>} rows - Raw sheet data (array of row arrays)
 * @returns {{ orgs: Array, employees: Array, errors: Array<string> }}
 */
export function parseOrgEmployeeData(rows) {
  const errors = [];
  const orgMap = new Map(); // orgTitle -> { orgTitle, headName, headExternalId }
  const employees = [];

  // Find the header row by looking for "Organization" column
  let headerRowIdx = -1;
  let orgColIdx = -1;
  let posColIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim();
      if (cell === 'organization' && orgColIdx < 0) {
        headerRowIdx = i;
        orgColIdx = j;
      }
      if (cell.includes('position') && posColIdx < 0) {
        posColIdx = j;
      }
    }
    if (headerRowIdx >= 0) break;
  }

  if (headerRowIdx < 0 || orgColIdx < 0) {
    errors.push('Could not find "Organization" header column in the first 10 rows.');
    return { orgs: [], employees: [], errors };
  }
  if (posColIdx < 0) {
    errors.push('Could not find "Position and Job" header column in the first 10 rows.');
    return { orgs: [], employees: [], errors };
  }

  // Parse data rows
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const orgRaw = String(row[orgColIdx] || '').trim();
    const posRaw = String(row[posColIdx] || '').trim();

    if (!orgRaw && !posRaw) continue; // skip empty rows

    const orgParsed = parseOrgColumn(orgRaw);
    if (!orgParsed) {
      if (orgRaw) errors.push(`Row ${i + 1}: Could not parse organization: "${orgRaw.slice(0, 80)}..."`);
      continue;
    }

    // Track unique orgs
    if (!orgMap.has(orgParsed.orgTitle)) {
      orgMap.set(orgParsed.orgTitle, orgParsed);
    }

    // Parse employee from position column
    const posParsed = parsePositionColumn(posRaw);
    if (posParsed) {
      employees.push({
        orgTitle: orgParsed.orgTitle,
        name: posParsed.name,
        role: posParsed.role,
        externalId: posParsed.externalId,
        isHead: false, // will be updated below
      });
    } else if (posRaw) {
      errors.push(`Row ${i + 1}: Could not parse position: "${posRaw.slice(0, 80)}..."`);
    }
  }

  // Mark employees whose externalId matches the org head's externalId
  for (const emp of employees) {
    const org = orgMap.get(emp.orgTitle);
    if (org && emp.externalId === org.headExternalId) {
      emp.isHead = true;
    }
  }

  // Build orgs array and ensure head employees exist
  const orgs = [];
  for (const [title, orgData] of orgMap) {
    orgs.push({
      title: orgData.orgTitle,
      headName: orgData.headName,
      headExternalId: orgData.headExternalId,
    });

    // Add head as employee if not already present in the employee list
    const headInList = employees.find(
      (e) => e.externalId === orgData.headExternalId
    );
    if (!headInList) {
      employees.push({
        orgTitle: title,
        name: orgData.headName,
        role: orgData.orgTitle,
        externalId: orgData.headExternalId,
        isHead: true,
      });
    }
  }

  return { orgs, employees, errors };
}

/**
 * Infer parent-child relationships between orgs based on name prefix matching.
 * If org B's title starts with org A's title, then B is a child of A.
 * When multiple prefix matches exist, the longest (most specific) match wins.
 *
 * Example: "TASTO5" is child of "TASTO", "TASTO5A" is child of "TASTO5".
 *
 * @param {Array<{title: string}>} allOrgs - All known orgs (existing + imported)
 * @param {Array<{title: string}>} targetOrgs - Orgs to assign parents to
 * @returns {Map<string, string>} Map of childOrgTitle -> parentOrgTitle
 */
export function inferOrgHierarchy(allOrgs, targetOrgs) {
  const parentMap = new Map();

  // Helper to extract code (first word)
  // Splits by whitespace to get the first token
  const getCode = (t) => t.trim().split(/\s+/)[0].toLowerCase();

  // Collect all unique titles (lowercased for comparison, original for output)
  const allTitles = allOrgs.map((o) => ({
    original: o.title,
    lower: o.title.toLowerCase().trim(),
    code: getCode(o.title),
  }));

  for (const org of targetOrgs) {
    const titleLower = org.title.toLowerCase().trim();
    const orgCode = getCode(org.title);

    let bestMatch = null;
    let bestMatchLen = 0; // Length of the matching segment (either full title or code)

    for (const candidate of allTitles) {
      // 1. Full Title Prefix Match (Strict)
      // Example: "Engineering" -> "Engineering Team"
      if (candidate.lower.length < titleLower.length && titleLower.startsWith(candidate.lower)) {
        if (candidate.lower.length > bestMatchLen) {
          bestMatch = candidate.original;
          bestMatchLen = candidate.lower.length;
        }
      }

      // 2. Code Prefix Match (Strict)
      // Example: "TASTO" (tasto) -> "TASTO1..." (tasto1)
      // Check if candidate's code is a prefix of org's code
      if (candidate.code.length < orgCode.length && orgCode.startsWith(candidate.code)) {
        if (candidate.code.length > bestMatchLen) {
          bestMatch = candidate.original;
          bestMatchLen = candidate.code.length;
        }
      }
    }

    if (bestMatch) {
      parentMap.set(org.title, bestMatch);
    }
  }

  return parentMap;
}
