export default function UserGuide() {
  return (
    <div className="page user-guide">
      <h2>User Guide</h2>
      <p>Welcome to <strong>HC Manager</strong> — a headcount management tool for hierarchical organizations. This guide covers all features and workflows.</p>

      <nav className="guide-toc">
        <h3>Table of Contents</h3>
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
          <li><a href="#audit-log">Audit Log</a></li>
          <li><a href="#data-sync">Data Sync (CSV Import/Export)</a></li>
          <li><a href="#workday">Workday Integration</a></li>
          <li><a href="#glossary">Glossary</a></li>
        </ol>
      </nav>

      <section id="overview">
        <h3>1. Overview</h3>
        <p>HC Manager lets you manage your organization's headcount planning across these key areas:</p>
        <ul>
          <li><strong>Organization Hierarchy</strong> — Define your org structure as a tree of positions</li>
          <li><strong>Budget</strong> — Set headcount targets (budgetedHC) per org unit per year</li>
          <li><strong>Budget Change Proposals</strong> — Request increases or decreases to budgeted headcount</li>
          <li><strong>Actuals</strong> — Track who is currently filling positions</li>
          <li><strong>Job Requisitions</strong> — Request new hires or substitutions for specific roles</li>
          <li><strong>Approval Workflow</strong> — Approve, escalate, or reject proposals and requisitions</li>
          <li><strong>Audit Log</strong> — Track every action performed in the system</li>
          <li><strong>Data Sync</strong> — Import/export CSV files for Workday or other HR systems</li>
        </ul>
        <p>Every user in the system is a <strong>head of an organization unit</strong>. The current user can only view and manage data within their subtree (their org unit and all units below it).</p>
      </section>

      <section id="user-switcher">
        <h3>2. User Switcher</h3>
        <p>The user switcher is located in the top-right corner of the navigation bar. It shows all active employees who are heads of an org unit.</p>
        <ul>
          <li>Select a user to simulate acting as that person</li>
          <li>The entire application is scoped to the selected user's org subtree</li>
          <li>Example: Selecting the "VP Engineering" will show only Engineering-related data (frontend, backend, UI team, platform, etc.)</li>
          <li>Selecting "CEO" shows the entire organization</li>
        </ul>
      </section>

      <section id="dashboard">
        <h3>3. Dashboard</h3>
        <p>The Dashboard provides a high-level overview with KPI cards:</p>
        <ul>
          <li><strong>Total Budgeted HC</strong> — Sum of all budgeted headcount in your subtree</li>
          <li><strong>Total Actuals</strong> — Number of active employees in your subtree</li>
          <li><strong>Variance</strong> — Difference between budget and actuals (positive = open positions)</li>
          <li><strong>Pending Proposals</strong> — Budget change proposals awaiting approval</li>
          <li><strong>Pending Budget Impact</strong> — Net headcount change if all pending proposals are approved</li>
          <li><strong>Open Requisitions</strong> — Job requisitions currently open for candidates</li>
          <li><strong>Pending Requisitions</strong> — Requisitions awaiting approval</li>
          <li><strong>Filled Requisitions</strong> — Successfully filled requisitions</li>
        </ul>
        <p>Below the KPIs, a team breakdown table shows budget vs. actuals for each org unit in your subtree.</p>
      </section>

      <section id="organization">
        <h3>4. Organization Hierarchy</h3>
        <p>The Organization page displays your org structure as a visual tree.</p>
        <h4>Viewing</h4>
        <ul>
          <li>Each node shows the <strong>position title</strong> and the <strong>head's name</strong> (or "Vacant" if no head is assigned)</li>
          <li>The tree starts from the current user's org unit</li>
        </ul>
        <h4>Editing</h4>
        <ul>
          <li><strong>Add child</strong> — Click the "+" button on any node to add a child org unit</li>
          <li><strong>Edit</strong> — Click the edit (pencil) icon to change the position title</li>
          <li><strong>Reparent</strong> — In the edit dialog, change the parent to move a unit in the hierarchy. Circular references are prevented</li>
          <li><strong>Delete</strong> — Remove an org unit. Children are automatically reparented to the deleted unit's parent</li>
        </ul>
        <p><strong>Important:</strong> Org nodes are positions, not people. People are tracked in Actuals.</p>
      </section>

      <section id="budget">
        <h3>5. Budget Management</h3>
        <p>The Budget page shows the headcount budget for each org unit in your subtree.</p>
        <ul>
          <li><strong>Budgeted HC</strong> — The approved number of headcount for an org unit</li>
          <li><strong>Actual HC</strong> — Current active employees</li>
          <li><strong>Variance</strong> — Budget minus actuals</li>
          <li>You can directly edit budget entries (year, budgetedHC, notes)</li>
          <li>To request a change to the budget, use Budget Change Proposals instead</li>
        </ul>
      </section>

      <section id="proposals">
        <h3>6. Budget Change Proposals</h3>
        <p>Proposals are formal requests to increase or decrease the headcount budget for a specific org unit.</p>
        <h4>Fields</h4>
        <ul>
          <li><strong>Title</strong> — Short description (e.g., "Hire 3 Senior Engineers")</li>
          <li><strong>Delta</strong> — Number of headcount to add (positive) or remove (negative)</li>
          <li><strong>Target Org</strong> — The org unit the budget change applies to</li>
          <li><strong>Justification</strong> — Business reason for the change</li>
        </ul>
        <h4>Lifecycle</h4>
        <ol>
          <li><strong>Draft</strong> — Created but not yet submitted. Can be edited or deleted</li>
          <li><strong>Pending Approval</strong> — Submitted and waiting for the immediate superior to review</li>
          <li><strong>Approved</strong> — The budget is updated. The delta is applied to the requesting org and all orgs between it and the approver (downstream propagation)</li>
          <li><strong>Rejected</strong> — The proposal was denied</li>
        </ol>
        <h4>Budget Propagation</h4>
        <p>When a proposal is approved, the budget delta is applied to every org unit in the chain from the <strong>requesting org up to and including the approver's org</strong>. For example, if the UI Team manager requests +2 and the VP Engineering approves (after escalation from Dir. Frontend), the budget increases for: UI Team, Dir. Frontend, and VP Engineering.</p>
      </section>

      <section id="approvals">
        <h3>7. Approval Workflow</h3>
        <p>The Approvals page shows items pending your review from your direct reports.</p>
        <h4>Budget Change Proposals — Three Options</h4>
        <ul>
          <li><strong>Approve</strong> — Accept the proposal. Budget is updated downstream from your org to the requester's org</li>
          <li><strong>Escalate</strong> — Pass the decision up to your own superior. The proposal moves to the next level in the hierarchy. Your superior then has the same three options. The "Escalated" column shows where the proposal originally came from</li>
          <li><strong>Reject</strong> — Deny the proposal. No budget change occurs</li>
        </ul>
        <h4>Job Requisitions — Two Options</h4>
        <ul>
          <li><strong>Approve</strong> — The requisition can proceed to the "open" stage</li>
          <li><strong>Reject</strong> — The requisition is denied</li>
        </ul>
        <p>The page also shows your own pending submissions (proposals and requisitions you submitted that are waiting for your superior's review).</p>
      </section>

      <section id="actuals">
        <h3>8. Actuals (Employees)</h3>
        <p>The Actuals page tracks all people in your organization.</p>
        <h4>Fields</h4>
        <ul>
          <li><strong>Name</strong> — Employee's full name</li>
          <li><strong>Role</strong> — Job title / function</li>
          <li><strong>Org Unit</strong> — Which org unit they belong to</li>
          <li><strong>Start Date</strong> — When they joined</li>
          <li><strong>Status</strong> — Active or Departed</li>
          <li><strong>Is Head</strong> — Checkbox indicating if this person is the head of their org unit. Only one head per org unit is allowed. Setting a new head automatically unmarks the previous one</li>
        </ul>
        <p><strong>Important:</strong> Heads are the users who can log in and manage their subtree. The User Switcher only shows active heads.</p>
      </section>

      <section id="requisitions">
        <h3>9. Job Requisitions</h3>
        <p>Requisitions are requests to fill a specific position — either a new hire or a substitution for a departing employee.</p>
        <h4>Fields</h4>
        <ul>
          <li><strong>Role</strong> — The position to fill (e.g., "Senior React Developer")</li>
          <li><strong>Type</strong> — "New Position" or "Substitution"</li>
          <li><strong>Replacing</strong> — (Substitution only) The name of the person being replaced</li>
          <li><strong>Org Unit</strong> — Where the position will be filled</li>
          <li><strong>Justification</strong> — Business reason</li>
        </ul>
        <h4>Lifecycle</h4>
        <ol>
          <li><strong>Draft</strong> — Created but not submitted. Can be edited or deleted</li>
          <li><strong>Pending Approval</strong> — Submitted to the immediate superior</li>
          <li><strong>Approved</strong> — Approved by the superior. Can now be opened for candidates</li>
          <li><strong>Open</strong> — Actively seeking candidates</li>
          <li><strong>Filled</strong> — A candidate was hired (end state)</li>
          <li><strong>Cancelled</strong> — The requisition was cancelled (end state)</li>
          <li><strong>Rejected</strong> — Denied by the approver (end state)</li>
        </ol>
      </section>

      <section id="audit-log">
        <h3>10. Audit Log</h3>
        <p>Every significant action in the system is automatically recorded in the Audit Log.</p>
        <ul>
          <li><strong>Timestamp</strong> — When the action occurred</li>
          <li><strong>User</strong> — Who performed the action</li>
          <li><strong>Action</strong> — The technical action code (e.g., APPROVE_PROPOSAL)</li>
          <li><strong>Description</strong> — Human-readable description</li>
          <li><strong>Details</strong> — Contextual information (org name, delta values, employee names, etc.)</li>
        </ul>
        <p>You can filter by category: Proposals, Requisitions, Budget, Actuals, or Organization.</p>
        <p>Tracked actions include: creating, updating, deleting, submitting, approving, rejecting, escalating proposals and requisitions, modifying budgets and actuals, and editing org structure. CSV imports are also logged.</p>
      </section>

      <section id="data-sync">
        <h3>11. Data Sync (CSV Import/Export)</h3>
        <p>The Data Sync page allows you to export and import data via CSV files, enabling integration with Workday or other HR systems.</p>
        <h4>Export</h4>
        <ul>
          <li>Export individual entities or all 5 at once (Organization, Budgets, Actuals, Proposals, Requisitions)</li>
          <li>CSV files include human-readable org titles alongside IDs for easy mapping</li>
          <li>Use "Export All" to download all 5 files at once</li>
        </ul>
        <h4>Import</h4>
        <ul>
          <li>Import replaces all existing data for that entity — always export a backup first</li>
          <li>CSV headers must match the export format</li>
          <li>The system generates new IDs for rows that don't include an "id" column</li>
          <li>All imports are recorded in the Audit Log</li>
        </ul>
        <h4>Recommended Sync Workflow</h4>
        <ol>
          <li>Export all data as backup</li>
          <li>Prepare your updated CSV (from Workday or manual edits)</li>
          <li>Import the updated CSV</li>
          <li>Verify the data in the relevant pages</li>
          <li>Check the Audit Log to confirm the import was recorded</li>
        </ol>
      </section>

      <section id="workday">
        <h3>12. Workday Integration</h3>
        <p>HC Manager supports flat-file (CSV) integration with Workday. Here's how to set it up:</p>

        <h4>Exporting from Workday to HC Manager</h4>
        <ol>
          <li>In Workday, create Custom Reports (RaaS) for the data you need:
            <ul>
              <li><strong>Organizations</strong> — Report with columns: ID, Name, Parent Organization ID</li>
              <li><strong>Workers</strong> — Report with: Organization ID, Worker Name, Job Title, Hire Date, Status, Is Manager</li>
              <li><strong>Positions/Budgets</strong> — Report with: Organization ID, Year, Headcount Budget</li>
              <li><strong>Job Requisitions</strong> — Report with: Organization ID, Role, Type, Status, etc.</li>
            </ul>
          </li>
          <li>Export each report as CSV</li>
          <li>Rename columns to match HC Manager's format (see the CSV Format Reference on the Data Sync page)</li>
          <li>Import into HC Manager using the Data Sync page</li>
        </ol>

        <h4>Exporting from HC Manager to Workday</h4>
        <ol>
          <li>Export the desired data from the Data Sync page</li>
          <li>In Workday, set up an EIB (Enterprise Interface Builder) for inbound integration</li>
          <li>Map HC Manager's CSV columns to Workday fields</li>
          <li>Run the EIB to load data</li>
        </ol>

        <h4>Column Mapping Reference</h4>
        <table className="table">
          <thead>
            <tr><th>HC Manager</th><th>Workday Equivalent</th></tr>
          </thead>
          <tbody>
            <tr><td>orgNodes.title</td><td>Organization Name</td></tr>
            <tr><td>orgNodes.parentId</td><td>Superior Organization ID</td></tr>
            <tr><td>actuals.name</td><td>Worker Name</td></tr>
            <tr><td>actuals.role</td><td>Job Profile / Position Title</td></tr>
            <tr><td>actuals.startDate</td><td>Hire Date</td></tr>
            <tr><td>actuals.status</td><td>Worker Status (Active/Terminated)</td></tr>
            <tr><td>actuals.isHead</td><td>Is Manager</td></tr>
            <tr><td>budgets.budgetedHC</td><td>Position Budget / Headcount Plan</td></tr>
            <tr><td>requisitions.role</td><td>Job Requisition Title</td></tr>
            <tr><td>requisitions.type</td><td>Requisition Type</td></tr>
            <tr><td>requisitions.status</td><td>Requisition Status</td></tr>
          </tbody>
        </table>
      </section>

      <section id="glossary">
        <h3>13. Glossary</h3>
        <table className="table">
          <thead>
            <tr><th>Term</th><th>Definition</th></tr>
          </thead>
          <tbody>
            <tr><td>Org Unit</td><td>A position in the organization hierarchy (e.g., "VP Engineering"). Represents a role, not a person</td></tr>
            <tr><td>Head</td><td>The person (actual) currently leading an org unit. Marked with isHead = true</td></tr>
            <tr><td>Budgeted HC</td><td>The approved number of headcount (employees) for an org unit in a given year</td></tr>
            <tr><td>Actual</td><td>A person currently filling a position in the organization</td></tr>
            <tr><td>Delta</td><td>The change in headcount requested by a budget change proposal. Positive = increase, negative = decrease</td></tr>
            <tr><td>Proposal</td><td>A formal request to change the headcount budget for an org unit</td></tr>
            <tr><td>Requisition</td><td>A request to fill a specific position (new hire or substitution)</td></tr>
            <tr><td>Escalate</td><td>Pass a pending proposal to the next level up in the hierarchy for decision</td></tr>
            <tr><td>Downstream Propagation</td><td>When a budget change is approved, the delta is applied from the approver's org down to the requester's org</td></tr>
            <tr><td>Subtree</td><td>An org unit and all units below it in the hierarchy. Each user sees data only within their subtree</td></tr>
            <tr><td>Variance</td><td>The difference between budgeted headcount and actual headcount</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
