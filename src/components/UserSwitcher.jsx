import { useApp } from '../context/AppContext';

export default function UserSwitcher() {
  const { currentUser, orgNodes, dispatch } = useApp();
  return (
    <div className="user-switcher">
      <label>Acting as: </label>
      <select value={currentUser.id} onChange={e => dispatch({ type: 'SET_USER', payload: orgNodes.find(n => n.id === e.target.value) })}>
        {orgNodes.map(n => (
          <option key={n.id} value={n.id}>{n.name} — {n.title}</option>
        ))}
      </select>
    </div>
  );
}
