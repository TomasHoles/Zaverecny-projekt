import React from 'react';
// Remove CSS import
// import '../styles/Transactions.css'; (removed)

const Transactions: React.FC = () => {
  return (
    <div className="bg-bg-primary min-h-screen p-8 text-text-primary">
      <h1 className="text-3xl font-bold text-accent-primary mb-6">Transakce</h1>
      <div className="transactions-content">
        <div className="mb-6 flex gap-4">
          <input 
            type="text" 
            placeholder="Hledat transakce..." 
            className="flex-1 p-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors" 
          />
          <select className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary transition-colors">
            <option value="all">Všechny transakce</option>
            <option value="income">Příjmy</option>
            <option value="expense">Výdaje</option>
          </select>
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
          {/* Zde bude seznam transakcí */}
          <p className="text-text-secondary">Zatím žádné transakce</p>
        </div>
      </div>
    </div>
  );
};

export default Transactions;