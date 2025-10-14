import React from 'react';
// Remove CSS import
// import '../styles/Budgets.css'; (removed)

const Budgets: React.FC = () => {
  return (
    <div className="bg-bg-primary min-h-screen p-8 text-text-primary">
      <h1 className="text-3xl font-bold text-accent-primary mb-6">Rozpočty</h1>
      <div className="budgets-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Celkový rozpočet</h3>
            <p className="text-2xl font-bold text-accent-primary">0 Kč</p>
          </div>
          <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Zbývající rozpočet</h3>
            <p className="text-2xl font-bold text-accent-primary">0 Kč</p>
          </div>
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
          {/* Zde bude seznam rozpočtových kategorií */}
          <p className="text-text-secondary">Zatím žádné rozpočty</p>
        </div>
      </div>
    </div>
  );
};

export default Budgets;