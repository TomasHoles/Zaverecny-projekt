import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { Transaction } from '../services/dashboardService';
import api from '../services/api';
import CategoryIcon from './CategoryIcon';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import Icon from './Icon';
import { TransactionsSkeleton } from './SkeletonLoaders';
import EmptyState from './EmptyState';
import '../styles/Transactions.css';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  category_type: 'EXPENSE' | 'INCOME' | 'BOTH';
}

interface TransactionFormData {
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  description: string;
}

interface RecurringTransaction {
  id: number;
  name: string;
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: Category | null;
  category_id: number | null;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  auto_create: boolean;
  notify_before_days: number;
  created_at: string;
  updated_at: string;
}

interface RecurringFormData {
  name: string;
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category_id: string;
  frequency: RecurringTransaction['frequency'];
  start_date: string;
  end_date: string;
  auto_create: boolean;
  notify_before_days: number;
}

interface ApiResponse {
  data: Transaction;
}

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'recurring'>('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Debug logging pro transactions state
  useEffect(() => {
    console.log('[Transactions] State změněn:', {
      count: transactions.length,
      transactions: transactions.slice(0, 3) // First 3 transactions
    });
  }, [transactions]);

  // Debug logging pro categories state
  useEffect(() => {
    console.log('[Categories] State změněn:', {
      count: categories.length,
      categories: categories
    });
  }, [categories]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('-date');
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    type: 'EXPENSE',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Recurring transactions state
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [recurringFormData, setRecurringFormData] = useState<RecurringFormData>({
    name: '',
    description: '',
    amount: '',
    type: 'EXPENSE',
    category_id: '',
    frequency: 'MONTHLY',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_create: false,
    notify_before_days: 3,
  });

  // Debounce pro vyhledávání (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Sestavení query parametrů pro API
        const params = new URLSearchParams();
        
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (filterType !== 'all') params.append('type', filterType);
        if (filterCategory !== 'all') params.append('category', filterCategory);
        if (filterDateFrom) params.append('date_from', filterDateFrom);
        if (filterDateTo) params.append('date_to', filterDateTo);
        if (sortBy) params.append('ordering', sortBy);
        
        const queryString = params.toString();
        const endpoint = `/transactions/transactions/${queryString ? '?' + queryString : ''}`;
        
        const [transactionsData, categoriesData] = await Promise.all([
          api.get<Transaction[]>(endpoint),
          api.get<Category[]>('/transactions/categories/')
        ]);
        
        console.log('[API] Načtená data:', {
          endpoint,
          transactionsCount: transactionsData.data?.length || 0,
          transactions: transactionsData.data,
          categoriesCount: categoriesData.data?.length || 0,
          categories: categoriesData.data
        });
        
        setTransactions(transactionsData.data || []);
        
        // Pokud uživatel nemá žádné kategorie, vytvoř výchozí
        const loadedCategories = categoriesData.data || [];
        console.log('[Categories] Načtené před zpracováním:', loadedCategories);
        
        if (loadedCategories.length === 0) {
          try {
            await api.post('/transactions/categories/create_defaults/');
            const newCategoriesData = await api.get<Category[]>('/transactions/categories/');
            setCategories(newCategoriesData.data || []);
          } catch (err) {
            console.error('Chyba při vytváření výchozích kategorií:', err);
            setCategories([]);
          }
        } else {
          setCategories(loadedCategories);
        }
        
        // Načtení recurring transactions (volitelné - endpoint nemusí existovat)
        try {
          const recurringData = await api.get<RecurringTransaction[]>('/transactions/recurring-transactions/');
          setRecurring(recurringData.data || []);
        } catch (err) {
          // Endpoint neexistuje nebo jiná chyba - nevadí
          setRecurring([]);
        }
      } catch (err) {
        console.error('Chyba při načítání dat:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchTerm, filterType, filterCategory, filterDateFrom, filterDateTo, sortBy]);

  const fetchRecurring = async () => {
    try {
      const response = await api.get('/transactions/recurring-transactions/');
      setRecurring(response.data);
    } catch (error) {
      console.error('Chyba při načítání opakujících se transakcí:', error);
    }
  };

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

  // Filtruj kategorie podle typu transakce
  const getFilteredCategories = () => {
    const filtered = categories.filter(cat => 
      cat.category_type === formData.type || cat.category_type === 'BOTH'
    );
    console.log('[Categories] Filtrované kategorie:', {
      type: formData.type,
      allCategories: categories.length,
      filteredCount: filtered.length,
      filtered: filtered
    });
    return filtered;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Pokud měníme typ transakce, resetujeme vybranou kategorii
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value as 'INCOME' | 'EXPENSE',
        category: '' // Resetujeme kategorii
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.date) {
      alert('Vyplňte prosím všechna povinná pole');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: parseInt(formData.category),
        date: formData.date,
        description: formData.description,
      };

      let response: ApiResponse;
      if (editingTransaction) {
        // Editace existující transakce
        response = await api.put(`/transactions/transactions/${editingTransaction.id}/`, payload);
        
        // Aktualizujeme transakci v seznamu
        setTransactions(prev => prev.map(t => 
          t.id === editingTransaction.id ? response.data : t
        ));
        
        alert('Transakce byla úspěšně aktualizována!');
      } else {
        // Vytvoření nové transakce
        response = await api.post('/transactions/transactions/', payload);
        
        // Přidáme novou transakci do seznamu
        setTransactions(prev => [response.data, ...prev]);
        
        alert('Transakce byla úspěšně přidána!');
      }
      
      // Resetujeme formulář
      setFormData({
        amount: '',
        type: 'EXPENSE',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      
      setShowModal(false);
      setEditingTransaction(null);
    } catch (err: any) {
      console.error('Chyba při ukládání transakce:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.category_id?.[0] ||
                          err.response?.data?.message ||
                          'Nepodařilo se uložit transakci';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      type: (transaction.type === 'TRANSFER' ? 'EXPENSE' : transaction.type) as 'INCOME' | 'EXPENSE',
      category: transaction.category?.id.toString() || '',
      date: transaction.date,
      description: transaction.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/transactions/transactions/${id}/`);
      
      // Odebereme transakci ze seznamu
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      setShowDeleteConfirm(null);
      alert('Transakce byla úspěšně smazána!');
    } catch (err: any) {
      console.error('Chyba při mazání transakce:', err);
      alert('Nepodařilo se smazat transakci. Zkuste to prosím znovu.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setFormData({
      amount: '',
      type: 'EXPENSE',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSortBy('-date');
  };

  // Recurring transaction handlers
  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...recurringFormData,
        category_id: recurringFormData.category_id ? parseInt(recurringFormData.category_id) : null,
      };

      if (editingRecurring) {
        await api.put(`/transactions/recurring-transactions/${editingRecurring.id}/`, payload);
      } else {
        await api.post('/transactions/recurring-transactions/', payload);
      }

      await fetchRecurring();
      handleCloseRecurringModal();
    } catch (error) {
      console.error('Chyba při ukládání:', error);
      alert('Nepodařilo se uložit opakující se transakci');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecurring = async (id: number) => {
    if (window.confirm('Opravdu chcete smazat tuto opakující se transakci?')) {
      try {
        await api.delete(`/transactions/recurring-transactions/${id}/`);
        await fetchRecurring();
      } catch (error) {
        console.error('Chyba při mazání:', error);
      }
    }
  };

  const handleEditRecurring = (item: RecurringTransaction) => {
    setEditingRecurring(item);
    setRecurringFormData({
      name: item.name,
      description: item.description,
      amount: item.amount,
      type: item.type,
      category_id: item.category_id?.toString() || '',
      frequency: item.frequency,
      start_date: item.start_date,
      end_date: item.end_date || '',
      auto_create: item.auto_create,
      notify_before_days: item.notify_before_days,
    });
    setShowRecurringModal(true);
  };

  const toggleRecurringStatus = async (id: number) => {
    try {
      await api.post(`/transactions/recurring-transactions/${id}/toggle_status/`);
      await fetchRecurring();
    } catch (error) {
      console.error('Chyba při změně statusu:', error);
    }
  };

  const createTransactionNow = async (id: number) => {
    try {
      await api.post(`/transactions/recurring-transactions/${id}/create_transaction/`);
      alert('Transakce vytvořena!');
      await fetchRecurring();
      // Refresh transactions list
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      const queryString = params.toString();
      const endpoint = `/transactions/transactions/${queryString ? '?' + queryString : ''}`;
      const response = await api.get<Transaction[]>(endpoint);
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Chyba při vytváření transakce:', error);
    }
  };

  const handleCloseRecurringModal = () => {
    setShowRecurringModal(false);
    setEditingRecurring(null);
    setRecurringFormData({
      name: '',
      description: '',
      amount: '',
      type: 'EXPENSE',
      category_id: '',
      frequency: 'MONTHLY',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_create: false,
      notify_before_days: 3,
    });
  };

  const getFrequencyLabel = (frequency: RecurringTransaction['frequency']) => {
    const labels = {
      DAILY: 'Denně',
      WEEKLY: 'Týdně',
      BIWEEKLY: 'Každé 2 týdny',
      MONTHLY: 'Měsíčně',
      QUARTERLY: 'Čtvrtletně',
      YEARLY: 'Ročně',
    };
    return labels[frequency];
  };

  const getStatusLabel = (status: RecurringTransaction['status']) => {
    const labels = {
      ACTIVE: 'Aktivní',
      PAUSED: 'Pozastaveno',
      COMPLETED: 'Dokončeno',
    };
    return labels[status];
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return <TransactionsSkeleton />;
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

      {/* Tab Navigation */}
      <div className="transactions-tabs">
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <Icon name="wallet" size={20} />
          Transakce ({transactions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          <Icon name="trending-up" size={20} />
          Opakující se ({recurring.length})
        </button>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Filters */}
          <div className="transactions-filters">
        <div className="filter-row">
          <input
            type="text"
            className="filter-input search-input"
            placeholder="Hledat v popisu nebo kategorii..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Všechny typy</option>
            <option value="INCOME">Příjmy</option>
            <option value="EXPENSE">Výdaje</option>
            <option value="TRANSFER">Převody</option>
          </select>

          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Všechny kategorie</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <div className="date-filter-group">
            <label htmlFor="date-from">Od:</label>
            <input
              type="date"
              id="date-from"
              className="filter-input date-input"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>

          <div className="date-filter-group">
            <label htmlFor="date-to">Do:</label>
            <input
              type="date"
              id="date-to"
              className="filter-input date-input"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>

          <select
            className="filter-select sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="-date">Nejnovější</option>
            <option value="date">Nejstarší</option>
            <option value="-amount">Nejvyšší částka</option>
            <option value="amount">Nejnižší částka</option>
          </select>

          <button 
            className="reset-filters-btn"
            onClick={handleResetFilters}
            title="Vymazat všechny filtry"
          >
            Reset
          </button>
        </div>

        {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterDateFrom || filterDateTo) && (
          <div className="active-filters-info">
            Nalezeno: <strong>{transactions.length}</strong> transakcí
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="transactions-container">
        <div className="transactions-section-card">
          <div className="section-header">
            <span>Seznam transakcí ({transactions.length})</span>
            <div className="header-actions">
              <button 
                className="import-btn"
                onClick={() => setShowImportModal(true)}
                title="Importovat transakce z CSV"
              >
                <Icon name="upload" size={16} />
                Import
              </button>
              <button 
                className="export-btn"
                onClick={() => setShowExportModal(true)}
              >
                <Icon name="download" size={16} />
                Export
              </button>
              <button 
                className="add-transaction-btn"
                onClick={() => setShowModal(true)}
              >
                + Přidat transakci
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <div className="transaction-info">
                      <div className="transaction-category-icon">
                        <CategoryIcon 
  iconName={transaction.category?.icon && transaction.category?.icon !== '' ? transaction.category.icon : 'wallet'} 
  color={transaction.category?.color || '#6B7280'}
  size={20}
/>
                      </div>
                      <div>
                        <p className="transaction-category">
                          {transaction.category?.name || 'Bez kategorie'}
                        </p>
                        <p className="transaction-date">{formatDate(transaction.date)}</p>
                      </div>
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
                  <div className="transaction-footer">
                    <div className="transaction-tags">
                      <span className={`transaction-badge ${
                        transaction.type === 'INCOME' ? 'income' : 'expense'
                      }`}>
                        {transaction.type === 'INCOME' ? 'Příjem' : 'Výdaj'}
                      </span>
                    </div>
                    <div className="transaction-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(transaction)}
                        title="Upravit transakci"
                      >
                        Upravit
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => setShowDeleteConfirm(transaction.id)}
                        title="Smazat transakci"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>

                  {/* Potvrzovací dialog pro mazání */}
                  {showDeleteConfirm === transaction.id && (
                    <div className="delete-confirm">
                      <p>Opravdu chcete smazat tuto transakci?</p>
                      <div className="delete-confirm-actions">
                        <button 
                          className="btn-confirm-delete"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Ano, smazat
                        </button>
                        <button 
                          className="btn-cancel-delete"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="transactions"
              title={searchTerm || filterType !== 'all' ? 'Žádné výsledky' : 'Žádné transakce'}
              description={
                searchTerm || filterType !== 'all'
                  ? 'Nebyla nalezena žádná transakce odpovídající vašim filtrům. Zkuste změnit kritéria vyhledávání.'
                  : 'Zatím jste nepřidali žádné transakce. Začněte sledovat své finance přidáním první transakce.'
              }
              actionText="Přidat transakci"
              onAction={() => setShowModal(true)}
              secondaryActionText={searchTerm || filterType !== 'all' ? 'Vymazat filtry' : undefined}
              onSecondaryAction={searchTerm || filterType !== 'all' ? handleResetFilters : undefined}
            />
          )}
        </div>
      </div>

      {/* Modal pro přidání/editaci transakce */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTransaction ? 'Upravit transakci' : 'Nová transakce'}</h2>
              <button 
                className="modal-close"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-group">
                <label htmlFor="type">Typ transakce *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="EXPENSE">Výdaj</option>
                  <option value="INCOME">Příjem</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Částka (Kč) *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Kategorie *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Vyberte kategorii</option>
                  {getFilteredCategories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {getFilteredCategories().length === 0 && (
                  <p className="form-hint" style={{ color: '#FF6B6B', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Pro tento typ transakce nejsou k dispozici žádné kategorie
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="date">Datum *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Popis</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Nepovinný popis transakce..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Ukládám...' : editingTransaction ? 'Uložit změny' : 'Přidat transakci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      ) : (
        <>
          {/* Recurring Transactions Section */}
          <div className="recurring-container">
            <div className="recurring-section-card">
              <div className="section-header">
                <span>Opakující se transakce ({recurring.length})</span>
                <button 
                  className="add-transaction-btn"
                  onClick={() => setShowRecurringModal(true)}
                >
                  + Přidat opakující se transakci
                </button>
              </div>

              {recurring.length > 0 ? (
                <div className="recurring-list">
                  {recurring.map((item) => (
                    <div key={item.id} className={`recurring-item ${item.status.toLowerCase()}`}>
                      <div className="recurring-item-header">
                        <div className="recurring-item-title">
                          {item.category && (
                            <CategoryIcon
                              iconName={item.category.icon}
                              color={item.category.color}
                              size={32}
                            />
                          )}
                          <div>
                            <h3>{item.name}</h3>
                            <p className="recurring-description">{item.description}</p>
                          </div>
                        </div>
                        <div className="recurring-item-amount" style={{
                          color: item.type === 'INCOME' ? '#10B981' : '#EF4444'
                        }}>
                          {item.type === 'INCOME' ? '+' : '-'}{parseFloat(item.amount).toFixed(2)} {user?.currency_preference}
                        </div>
                      </div>

                      <div className="recurring-item-details">
                        <div className="detail-item">
                          <span className="detail-label">Frekvence:</span>
                          <span className="detail-value">{getFrequencyLabel(item.frequency)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Další splatnost:</span>
                          <span className="detail-value">
                            {new Date(item.next_due_date).toLocaleDateString('cs-CZ')}
                            <span className="days-until">
                              ({getDaysUntil(item.next_due_date) >= 0 
                                ? `za ${getDaysUntil(item.next_due_date)} dní` 
                                : `${Math.abs(getDaysUntil(item.next_due_date))} dní zpožděno`})
                            </span>
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span className={`status-badge status-${item.status.toLowerCase()}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        {item.auto_create && (
                          <div className="detail-item">
                            <span className="detail-label">Auto:</span>
                            <span className="detail-value">Automatické vytváření</span>
                          </div>
                        )}
                      </div>

                      <div className="recurring-item-actions">
                        <button
                          className="btn-action btn-create"
                          onClick={() => createTransactionNow(item.id)}
                          title="Vytvořit transakci nyní"
                          disabled={item.status === 'COMPLETED'}
                        >
                          <Icon name="plus" size={16} />
                          Vytvořit nyní
                        </button>
                        <button
                          className="btn-action btn-toggle"
                          onClick={() => toggleRecurringStatus(item.id)}
                          disabled={item.status === 'COMPLETED'}
                          title={item.status === 'ACTIVE' ? 'Pozastavit' : 'Aktivovat'}
                        >
                          {item.status === 'ACTIVE' ? '⏸️ Pozastavit' : '▶️ Aktivovat'}
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditRecurring(item)}
                          title="Upravit"
                        >
                          Upravit
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteRecurring(item.id)}
                          title="Smazat"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recurring-empty">
                  <Icon name="trending-up" size={64} color="var(--text-secondary)" />
                  <h3>Žádné opakující se transakce</h3>
                  <p>Vytvořte první opakující se transakci pro pravidelné platby</p>
                </div>
              )}
            </div>
          </div>

          {/* Recurring Transaction Modal */}
          {showRecurringModal && (
            <div className="modal-overlay" onClick={handleCloseRecurringModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{editingRecurring ? 'Upravit opakující se transakci' : 'Nová opakující se transakce'}</h2>
                <form onSubmit={handleRecurringSubmit} className="transaction-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="recurring-name">Název *</label>
                      <input
                        type="text"
                        id="recurring-name"
                        value={recurringFormData.name}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                        required
                        placeholder="Např. Netflix předplatné"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="recurring-amount">Částka *</label>
                      <input
                        type="number"
                        id="recurring-amount"
                        step="0.01"
                        value={recurringFormData.amount}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="recurring-description">Popis</label>
                    <textarea
                      id="recurring-description"
                      value={recurringFormData.description}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, description: e.target.value })}
                      placeholder="Volitelný popis transakce"
                      rows={2}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="recurring-type">Typ *</label>
                      <select
                        id="recurring-type"
                        value={recurringFormData.type}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                      >
                        <option value="EXPENSE">Výdaj</option>
                        <option value="INCOME">Příjem</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="recurring-category">Kategorie</label>
                      <select
                        id="recurring-category"
                        value={recurringFormData.category_id}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, category_id: e.target.value })}
                      >
                        <option value="">Vyberte kategorii</option>
                        {categories
                          .filter(cat => 
                            (recurringFormData.type === 'EXPENSE' && cat.name !== 'Mzda' && cat.name !== 'Ostatní příjmy') ||
                            (recurringFormData.type === 'INCOME' && (cat.name === 'Mzda' || cat.name === 'Ostatní příjmy'))
                          )
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="recurring-frequency">Frekvence *</label>
                      <select
                        id="recurring-frequency"
                        value={recurringFormData.frequency}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: e.target.value as RecurringTransaction['frequency'] })}
                      >
                        <option value="DAILY">Denně</option>
                        <option value="WEEKLY">Týdně</option>
                        <option value="BIWEEKLY">Každé 2 týdny</option>
                        <option value="MONTHLY">Měsíčně</option>
                        <option value="QUARTERLY">Čtvrtletně</option>
                        <option value="YEARLY">Ročně</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="recurring-start-date">Datum začátku *</label>
                      <input
                        type="date"
                        id="recurring-start-date"
                        value={recurringFormData.start_date}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, start_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="recurring-end-date">Datum konce (volitelné)</label>
                      <input
                        type="date"
                        id="recurring-end-date"
                        value={recurringFormData.end_date}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, end_date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="recurring-notify">Upozornit předem (dny)</label>
                      <input
                        type="number"
                        id="recurring-notify"
                        min="0"
                        max="30"
                        value={recurringFormData.notify_before_days}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, notify_before_days: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={recurringFormData.auto_create}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, auto_create: e.target.checked })}
                      />
                      Automaticky vytvářet transakce
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={handleCloseRecurringModal}
                      disabled={submitting}
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? 'Ukládám...' : editingRecurring ? 'Uložit změny' : 'Vytvořit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={async () => {
          // Refresh transactions after successful import
          try {
            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterType !== 'all') params.append('type', filterType);
            if (filterCategory !== 'all') params.append('category', filterCategory);
            if (filterDateFrom) params.append('date_from', filterDateFrom);
            if (filterDateTo) params.append('date_to', filterDateTo);
            if (sortBy) params.append('ordering', sortBy);
            
            const queryString = params.toString();
            const endpoint = `/transactions/transactions/${queryString ? '?' + queryString : ''}`;
            
            const [transactionsData, categoriesData] = await Promise.all([
              api.get<Transaction[]>(endpoint),
              api.get<Category[]>('/transactions/categories/')
            ]);
            
            setTransactions(transactionsData.data || []);
            setCategories(categoriesData.data || []);
          } catch (err) {
            console.error('Chyba při načítání transakcí:', err);
          }
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportType="transactions"
      />
    </div>
  );
};

export default Transactions;