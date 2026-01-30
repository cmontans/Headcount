import { useApp } from '../context/AppContext';

export default function Approvals() {
  const { currentUserOrgId, proposals, requisitions, budgets, getChildren, getNode, getHead, dispatch } = useApp();

  const directReportIds = getChildren(currentUserOrgId).map(c => c.id);

  const pendingProposals = proposals.filter(p =>
    p.status === 'pending_approval' && directReportIds.includes(p.requestedBy)
  );

  const myPendingProposals = proposals.filter(p =>
    p.status === 'pending_approval' && p.requestedBy === currentUserOrgId
  );

  const pendingReqs = requisitions.filter(r =>
    r.status === 'pending_approval' && directReportIds.includes(r.requestedBy)
  );

  const myPendingReqs = requisitions.filter(r =>
    r.status === 'pending_approval' && r.requestedBy === currentUserOrgId
  );

  function approveProposal(id) {
    dispatch({ type: 'APPROVE_PROPOSAL', payload: { id, approvedBy: currentUserOrgId } });
  }

  function rejectProposal(id) {
    dispatch({ type: 'REJECT_PROPOSAL', payload: { id, rejectedBy: currentUserOrgId } });
  }

  function approveReq(id) {
    dispatch({ type: 'APPROVE_REQUISITION', payload: { id, approvedBy: currentUserOrgId } });
  }

  function rejectReq(id) {
    dispatch({ type: 'REJECT_REQUISITION', payload: { id, rejectedBy: currentUserOrgId } });
  }

  function formatDelta(d) {
    if (d > 0) return <span className="text-success">+{d}</span>;
    if (d < 0) return <span className="text-danger">{d}</span>;
    return <span>0</span>;
  }

  return (
    <div className="page">
      <h2>Approval Queue</h2>

      <h3>Budget Change Proposals Awaiting Your Approval</h3>
      {pendingProposals.length === 0 ? (
        <p className="empty">No pending budget change proposals from your direct reports.</p>
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
            {pendingProposals.map(p => {
              const requestorHead = getHead(p.requestedBy);
              const team = getNode(p.orgId);
              const budget = budgets.find(b => b.orgId === p.orgId);
              const currentHC = budget ? budget.budgetedHC : 0;
              return (
                <tr key={p.id}>
                  <td>{requestorHead?.name || '—'}</td>
                  <td>{team?.title}</td>
                  <td>{p.title}</td>
                  <td>{formatDelta(p.delta)}</td>
                  <td>{currentHC}</td>
                  <td><strong>{currentHC + p.delta}</strong></td>
                  <td>{p.justification}</td>
                  <td>{p.createdAt}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-success" onClick={() => approveProposal(p.id)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => rejectProposal(p.id)}>Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Job Requisitions Awaiting Your Approval</h3>
      {pendingReqs.length === 0 ? (
        <p className="empty">No pending job requisitions from your direct reports.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Requested By</th>
              <th>Team</th>
              <th>Role</th>
              <th>Type</th>
              <th>Replacing</th>
              <th>Justification</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingReqs.map(r => {
              const requestorHead = getHead(r.requestedBy);
              const team = getNode(r.orgId);
              return (
                <tr key={r.id}>
                  <td>{requestorHead?.name || '—'}</td>
                  <td>{team?.title}</td>
                  <td>{r.role}</td>
                  <td><span className={`badge badge-${r.type}`}>{r.type === 'new_position' ? 'New Position' : 'Substitution'}</span></td>
                  <td>{r.replacingName || '—'}</td>
                  <td>{r.justification}</td>
                  <td>{r.createdAt}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-success" onClick={() => approveReq(r.id)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => rejectReq(r.id)}>Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '2rem' }}>Your Submitted Budget Change Proposals (Pending)</h3>
      {myPendingProposals.length === 0 ? (
        <p className="empty">You have no pending budget change proposals.</p>
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
            {myPendingProposals.map(p => {
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

      <h3 style={{ marginTop: '2rem' }}>Your Submitted Requisitions (Pending)</h3>
      {myPendingReqs.length === 0 ? (
        <p className="empty">You have no pending job requisitions.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Role</th>
              <th>Type</th>
              <th>Justification</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myPendingReqs.map(r => {
              const team = getNode(r.orgId);
              return (
                <tr key={r.id}>
                  <td>{team?.title}</td>
                  <td>{r.role}</td>
                  <td>{r.type === 'new_position' ? 'New Position' : 'Substitution'}</td>
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
