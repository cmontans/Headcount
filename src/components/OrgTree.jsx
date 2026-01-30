import { useApp } from '../context/AppContext';

function OrgNode({ node }) {
  const { getChildren, actuals, requirements, budgets } = useApp();
  const children = getChildren(node.id);
  const actualCount = actuals.filter(a => a.orgId === node.id && a.status === 'active').length;
  const approvedReqs = requirements.filter(r => r.orgId === node.id && r.status === 'approved').reduce((s, r) => s + r.count, 0);
  const budget = budgets.find(b => b.orgId === node.id);

  return (
    <div className="org-node">
      <div className="org-card">
        <strong>{node.name}</strong>
        <span className="org-title">{node.title}</span>
        <div className="org-stats">
          {budget && <span title="Budget">B:{budget.budgetedHC}</span>}
          <span title="Actuals">A:{actualCount}</span>
          <span title="Approved reqs">R:{approvedReqs}</span>
        </div>
      </div>
      {children.length > 0 && (
        <div className="org-children">
          {children.map(c => <OrgNode key={c.id} node={c} />)}
        </div>
      )}
    </div>
  );
}

export default function OrgTree() {
  const { orgNodes } = useApp();
  const root = orgNodes.find(n => n.parentId === null);
  return (
    <div className="page">
      <h2>Organization Hierarchy</h2>
      <div className="org-tree">
        {root && <OrgNode node={root} />}
      </div>
    </div>
  );
}
