import { NavLink } from 'react-router-dom';
import UserSwitcher from './UserSwitcher';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">HC Manager</div>
      <div className="navbar-links">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/org">Organization</NavLink>
        <NavLink to="/proposals">Budget Changes</NavLink>
        <NavLink to="/approvals">Approvals</NavLink>
        <NavLink to="/budget">Budget</NavLink>
        <NavLink to="/actuals">Actuals</NavLink>
        <NavLink to="/requisitions">Requisitions</NavLink>
        <NavLink to="/audit-log">Audit Log</NavLink>
        <NavLink to="/data-sync">Data Sync</NavLink>
        <NavLink to="/guide">Guide</NavLink>
      </div>
      <UserSwitcher />
    </nav>
  );
}
