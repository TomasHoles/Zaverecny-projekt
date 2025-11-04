import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { Transaction } from '../services/dashboardService';
import '../styles/Transactions.css';

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const stats = await dashboardService.getDashboardStats();
        setTransactions(stats.recent_transactions || []);
      } catch (err) {
        console.error('Chyba při načítání transakcí:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' ||
      transaction.type === filterType.toUpperCase();

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="transactions-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      {/* Hero Section */}
      <section className="transactions-hero">
        <div className="transactions-hero-content">
          <h1 className="transactions-title">Transakce</h1>
          <p className="transactions-subtitle">Přehled všech vašich finančních transakcí</p>
        </div>
      </section>

      {/* Filters */}
      <div className="transactions-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="Hledat transakce..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Všechny transakce</option>
          <option value="income">Příjmy</option>
          <option value="expense">Výdaje</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="transactions-container">
        <div className="transactions-section-card">
          <div className="section-header">
            <span>Seznam transakcí ({filteredTransactions.length})</span>
            <button className="add-transaction-btn">+ Přidat transakci</button>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="transactions-list">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <div className="transaction-info">
                      <p className="transaction-category">
                        {transaction.category?.name || 'Bez kategorie'}
                      </p>
                      <p className="transaction-date">{formatDate(transaction.date)}</p>
                    </div>
                    <p className={`transaction-amount ${
                      transaction.type === 'INCOME' ? 'income' : 'expense'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  {transaction.description && (
                    <p className="transaction-description">{transaction.description}</p>
                  )}
                  <div className="transaction-tags">
                    <span className={`transaction-badge ${
                      transaction.type === 'INCOME' ? 'income' : 'expense'
                    }`}>
                      {transaction.type === 'INCOME' ? 'Příjem' : 'Výdaj'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-title">Žádné transakce</h3>
              <p className="empty-state-text">
                {searchTerm || filterType !== 'all' 
                  ? 'Nebyla nalezena žádná transakce odpovídající vašim filtrům.'
                  : 'Zatím jste nepřidali žádné transakce.'}
              </p>
              <button className="filter-button">Přidat první transakci</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;