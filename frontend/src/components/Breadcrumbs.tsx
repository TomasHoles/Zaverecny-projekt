import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import '../styles/Breadcrumbs.css';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbNameMap: { [key: string]: string } = {
    'dashboard': 'Přehled',
    'overview': 'Přehled',
    'transactions': 'Transakce',
    'budgets': 'Rozpočty',
    'goals': 'Cíle',
    'analytics': 'Analytika',
    'profile': 'Profil',
    'settings': 'Nastavení',
    'notifications': 'Notifikace',
  };

  if (pathnames.length === 0 || location.pathname === '/') {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home size={16} />
            <span>Domů</span>
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const name = breadcrumbNameMap[value] || value;

          return (
            <li key={to} className="breadcrumb-item">
              <ChevronRight size={14} className="breadcrumb-separator" />
              {last ? (
                <span className="breadcrumb-current">{name}</span>
              ) : (
                <Link to={to} className="breadcrumb-link">
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
