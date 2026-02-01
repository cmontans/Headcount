import { NavLink } from 'react-router-dom';
import UserSwitcher from './UserSwitcher';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">HC Manager</div>
      <div className="navbar-links">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/org">Organization</NavLink>
        <NavLink to="/budget-management">Budget Mgmt</NavLink>
        <NavLink to="/actuals-management">Actuals Mgmt</NavLink>
        <NavLink to="/budget-timeline">Timeline</NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </div>
      <UserSwitcher />
    </nav>
  );
}
