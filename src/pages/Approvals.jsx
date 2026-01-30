import { useApp } from '../context/AppContext';

export default function Approvals() {
  const { currentUser, requirements, getChildren, getNode, dispatch } = useApp();

  // Current user can approve requests from their direct reports
  const directReportIds = getChildren(currentUser.id).map(c => c.id);

  // Also include requests from the current user's own node that need approval from their parent
  // The approver sees pending requests from their direct reports
  const pending = requirements.filter(r =>
    r.status === 'pending_approval' && directReportIds.includes(r.requestedBy)
  );

  // Also show requests where the current user themselves requested and it's pending (read-only)
  const myPending = requirements.filter(r =>
    r.status === 'pending_approval' && r.requestedBy === currentUser.id
  );

  function approve(id) {
    dispatch({ type: 'APPROVE_REQUIREMENT', payload: { id, approvedBy: currentUser.id } });
  }

  function reject(id) {
    dispatch({ type: 'REJECT_REQUIREMENT', payload: { id, rejectedBy: currentUser.id } });
  }

  return (
    <div className="page">
      <h2>Approval Queue</h2>

      <h3>Requests Awaiting Your Approval</h3>
      {pending.length === 0 ? (
        <p className="empty">No pending requests from your direct reports.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Requested By</th>
              <th>Team</th>
              <th>Position</th>
              <th>Count</th>
              <th>Justification</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(r => {
              const requestor = getNode(r.requestedBy);
              const team = getNode(r.orgId);
              return (
                <tr key={r.id}>
                  <td>{requestor?.name}</td>
                  <td>{team?.title}</td>
                  <td>{r.title}</td>
                  <td>{r.count}</td>
                  <td>{r.justification}</td>
                  <td>{r.createdAt}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-success" onClick={() => approve(r.id)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => reject(r.id)}>Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Your Submitted Requests (Pending)</h3>
      {myPending.length === 0 ? (
        <p className="empty">You have no pending submissions.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Position</th>
              <th>Count</th>
              <th>Justification</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myPending.map(r => {
              const team = getNode(r.orgId);
              return (
                <tr key={r.id}>
                  <td>{team?.title}</td>
                  <td>{r.title}</td>
                  <td>{r.count}</td>
                  <td>{r.justification}</td>
                  <td>{r.createdAt}</td>
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
