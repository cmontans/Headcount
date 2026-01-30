import { useApp } from '../context/AppContext';

export default function UserSwitcher() {
  const { currentUser, actuals, orgNodes, dispatch } = useApp();
  const heads = actuals.filter(a => a.isHead && a.status === 'active');

  return (
    <div className="user-switcher">
      <label>Acting as: </label>
      <select value={currentUser?.id || ''} onChange={e => dispatch({ type: 'SET_USER', payload: e.target.value })}>
        {heads.map(h => {
          const org = orgNodes.find(n => n.id === h.orgId);
          return <option key={h.id} value={h.id}>{h.name} — {org?.title || h.role}</option>;
        })}
      </select>
    </div>
  );
}
