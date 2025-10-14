import React from 'react';
// Remove CSS import
// import '../styles/Analytics.css'; (removed)

const Analytics: React.FC = () => {
  return (
    <div className="bg-bg-primary min-h-screen p-8 text-text-primary">
      <h1 className="text-3xl font-bold text-accent-primary mb-6">Analytika</h1>
      <div className="analytics-content">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Celkové příjmy</h3>
            <p className="text-2xl font-bold text-accent-primary">0 Kč</p>
          </div>
          <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Celkové výdaje</h3>
            <p className="text-2xl font-bold text-accent-primary">0 Kč</p>
          </div>
          <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Úspory</h3>
            <p className="text-2xl font-bold text-accent-primary">0 Kč</p>
          </div>
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
          {/* Zde budou grafy */}
          <p className="text-text-secondary">Grafy se připravují...</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;