import { useApp } from '../context/AppContext';

export default function Approvals() {
  const { currentUser, proposals, budgets, getChildren, getNode, dispatch } = useApp();

  const directReportIds = getChildren(currentUser.id).map(c => c.id);

  const pending = proposals.filter(p =>
    p.status === 'pending_approval' && directReportIds.includes(p.requestedBy)
  );

  const myPending = proposals.filter(p =>
    p.status === 'pending_approval' && p.requestedBy === currentUser.id
  );

  function approve(id) {
    dispatch({ type: 'APPROVE_PROPOSAL', payload: { id, approvedBy: currentUser.id } });
  }

  function reject(id) {
    dispatch({ type: 'REJECT_PROPOSAL', payload: { id, rejectedBy: currentUser.id } });
  }

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return <span>0</span>;
  }

  return (
    <div className="page">
      <h2>Approval Queue</h2>

      <h3>Proposals Awaiting Your Approval</h3>
      {pending.length === 0 ? (
        <p className="empty">No pending proposals from your direct reports.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Requested By</th>
              <th>Team</th>
              <th>Proposal</th>
              <th>Delta</th>
              <th>Current Budget</th>
              <th>After Approval</th>
              <th>Justification</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(p => {
              const requestor = getNode(p.requestedBy);
              const team = getNode(p.orgId);
              const budget = budgets.find(b => b.orgId === p.orgId);
              const currentHC = budget ? budget.budgetedHC : 0;
              return (
                <tr key={p.id}>
                  <td>{requestor?.name}</td>
                  <td>{team?.title}</td>
                  <td>{p.title}</td>
                  <td>{formatDelta(p.delta)}</td>
                  <td>{currentHC}</td>
                  <td><strong>{currentHC + p.delta}</strong></td>
                  <td>{p.justification}</td>
                  <td>{p.createdAt}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-success" onClick={() => approve(p.id)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => reject(p.id)}>Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Your Submitted Proposals (Pending)</h3>
      {myPending.length === 0 ? (
        <p className="empty">You have no pending proposals.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Proposal</th>
              <th>Delta</th>
              <th>Justification</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myPending.map(p => {
              const team = getNode(p.orgId);
              return (
                <tr key={p.id}>
                  <td>{team?.title}</td>
                  <td>{p.title}</td>
                  <td>{formatDelta(p.delta)}</td>
                  <td>{p.justification}</td>
                  <td>{p.createdAt}</td>
                  <td><span className="badge badge-pending_approval">pending approval</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
