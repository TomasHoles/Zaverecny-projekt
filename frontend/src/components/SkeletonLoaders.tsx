import React from 'react';
import Skeleton from './Skeleton';
import '../styles/Skeleton.css';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <Skeleton width="250px" height="2rem" variant="rounded" />
          <Skeleton width="300px" height="1rem" variant="rounded" style={{ marginTop: '0.5rem' }} />
        </div>
        <Skeleton width="180px" height="48px" variant="rounded" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="stats-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton-stat-icon" />
            <div className="skeleton-stat-content">
              <Skeleton width="120px" height="1rem" />
              <Skeleton width="140px" height="1.75rem" />
            </div>
          </div>
        ))}
      </div>

      {/* KPI Grid Skeleton */}
      <div className="skeleton-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card">
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="60%" height="2rem" />
            <Skeleton width="80%" height="0.875rem" />
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="dashboard-content-grid">
        <div className="skeleton-card">
          <Skeleton width="180px" height="1.5rem" />
          <div className="skeleton-list" style={{ marginTop: '1rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-transaction-item">
                <div className="skeleton-transaction-left">
                  <div className="skeleton-transaction-icon" />
                  <div className="skeleton-transaction-info">
                    <Skeleton width="140px" height="1rem" />
                    <Skeleton width="100px" height="0.875rem" />
                  </div>
                </div>
                <Skeleton width="100px" height="1.25rem" />
              </div>
            ))}
          </div>
        </div>

        <div className="skeleton-card">
          <Skeleton width="200px" height="1.5rem" />
          <div className="skeleton-list" style={{ marginTop: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-budget-item">
                <div className="skeleton-budget-header">
                  <Skeleton width="150px" height="1.25rem" />
                  <Skeleton width="80px" height="1rem" />
                </div>
                <div className="skeleton-budget-progress">
                  <div className="skeleton-progress-bar" />
                  <Skeleton width="100%" height="0.875rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TransactionsSkeleton: React.FC = () => {
  return (
    <div className="transactions-page">
      <section className="transactions-hero">
        <div className="transactions-hero-content">
          <Skeleton width="200px" height="2.5rem" variant="rounded" />
          <Skeleton width="300px" height="1rem" variant="rounded" style={{ marginTop: '0.5rem' }} />
        </div>
      </section>

      <div className="transactions-tabs">
        <Skeleton width="150px" height="48px" variant="rounded" />
        <Skeleton width="200px" height="48px" variant="rounded" />
      </div>

      <div className="transactions-filters">
        <div className="filter-row">
          <Skeleton width="100%" height="48px" variant="rounded" />
          <Skeleton width="150px" height="48px" variant="rounded" />
          <Skeleton width="200px" height="48px" variant="rounded" />
        </div>
      </div>

      <div className="transactions-container">
        <div className="transactions-section-card">
          <div className="section-header">
            <Skeleton width="180px" height="1.5rem" />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Skeleton width="100px" height="40px" variant="rounded" />
              <Skeleton width="100px" height="40px" variant="rounded" />
              <Skeleton width="150px" height="40px" variant="rounded" />
            </div>
          </div>

          <div className="skeleton-list">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton-transaction-item">
                <div className="skeleton-transaction-left">
                  <div className="skeleton-transaction-icon" />
                  <div className="skeleton-transaction-info">
                    <Skeleton width="160px" height="1rem" />
                    <Skeleton width="120px" height="0.875rem" />
                  </div>
                </div>
                <Skeleton width="120px" height="1.5rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BudgetsSkeleton: React.FC = () => {
  return (
    <div className="budgets-page">
      <section className="budgets-hero">
        <div className="budgets-hero-content">
          <Skeleton width="180px" height="2.5rem" variant="rounded" />
          <Skeleton width="350px" height="1rem" variant="rounded" style={{ marginTop: '0.5rem' }} />
        </div>
      </section>

      <div className="budgets-summary">
        <Skeleton width="100%" height="150px" variant="rounded" />
      </div>

      <div className="budgets-container">
        <div className="section-header">
          <Skeleton width="200px" height="1.5rem" />
          <Skeleton width="150px" height="40px" variant="rounded" />
        </div>

        <div className="skeleton-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-budget-item">
              <div className="skeleton-budget-header">
                <Skeleton width="150px" height="1.25rem" />
                <Skeleton width="100px" height="1rem" />
              </div>
              <Skeleton width="100px" height="0.875rem" />
              <div className="skeleton-budget-progress">
                <div className="skeleton-progress-bar" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <Skeleton width="60px" height="1rem" />
                  <Skeleton width="100px" height="0.875rem" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const GoalsSkeleton: React.FC = () => {
  return (
    <div className="goals-page">
      <section className="goals-hero">
        <div className="goals-hero-content">
          <Skeleton width="200px" height="2.5rem" variant="rounded" />
          <Skeleton width="400px" height="1rem" variant="rounded" style={{ marginTop: '0.5rem' }} />
        </div>
      </section>

      <div className="goals-container">
        <div className="section-header">
          <Skeleton width="150px" height="1.5rem" />
          <Skeleton width="120px" height="40px" variant="rounded" />
        </div>

        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Skeleton width="40px" height="40px" variant="circular" />
                <Skeleton width="80px" height="24px" variant="rounded" />
              </div>
              <Skeleton width="180px" height="1.5rem" />
              <Skeleton width="100%" height="0.875rem" />
              <div style={{ marginTop: '1rem' }}>
                <div className="skeleton-progress-bar" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <Skeleton width="80px" height="1rem" />
                  <Skeleton width="100px" height="0.875rem" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
