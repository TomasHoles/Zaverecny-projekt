import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { BudgetOverview, Budget } from '../services/dashboardService';
import api from '../services/api';
import { Plus, Trash2, Edit2, Wallet, PieChart, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { BudgetsSkeleton } from './SkeletonLoaders';
import EmptyState from './EmptyState';
import CategoryIcon from './CategoryIcon';
import '../styles/Budgets.css';

interface Category {
  id: number;
  name: string;
  icon: string;
  category_type: string;
}

const Budgets: React.FC = () => {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'MONTHLY',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getBudgetOverview();
        setBudgetData(data);
      } catch (err) {
        console.error('Chyba při načítání rozpočtů:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await api.get('/transactions/categories/');
        setCategories(response.data.filter((cat: Category) => cat.category_type === 'EXPENSE'));
      } catch (err) {
        console.error('Chyba při načítání kategorií:', err);
      }
    };

    fetchBudgets();
    fetchCategories();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Překročeno';
    if (percentage >= 80) return 'Pozor';
    return 'V pořádku';
  };

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      // Editace existujícího rozpočtu
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        amount: budget.amount.toString(),
        category: budget.category || '',
        period: budget.period || 'MONTHLY',
        start_date: '', // Budget nemá start_date v interface, nastavíme prázdné nebo bychom museli upravit interface
        end_date: ''
      });
    } else {
      // Nový rozpočet
      setEditingBudget(null);
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      setFormData({
        name: '',
        amount: '',
        category: '',
        period: 'MONTHLY',
        start_date: firstDay.toISOString().split('T')[0],
        end_date: lastDay.toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleOpenNewBudgetModal = () => {
    handleOpenModal();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setFormData({
      name: '',
      amount: '',
      category: '',
      period: 'MONTHLY',
      start_date: '',
      end_date: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validace
    if (!formData.name || !formData.amount || !formData.start_date || !formData.end_date) {
      alert('Vyplňte prosím všechna povinná pole');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert('Částka musí být větší než 0');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('Datum konce musí být později než datum začátku');
      return;
    }

    try {
      const budgetPayload: any = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        period: formData.period,
        is_active: true
      };

      // Přidat kategorii pouze pokud je vybrána
      if (formData.category) {
        budgetPayload.category = parseInt(formData.category);
      }

      if (editingBudget) {
        // Editace existujícího rozpočtu
        await api.put(`/budgets/budgets/${editingBudget.id}/`, budgetPayload);
        alert('Rozpočet byl úspěšně aktualizován!');
      } else {
        // Vytvoření nového rozpočtu
        await api.post('/budgets/budgets/', budgetPayload);
        alert('Rozpočet byl úspěšně vytvořen!');
      }

      // Obnovit data rozpočtů
      const data = await dashboardService.getBudgetOverview();
      setBudgetData(data);

      handleCloseModal();
    } catch (err: any) {
      console.error('Chyba při ukládání rozpočtu:', err);
      let errorMessage = 'Nepodařilo se uložit rozpočet.\n\n';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          errorMessage += Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
        } else {
          errorMessage += errors;
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Zkuste to znovu.';
      }
      alert(errorMessage);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await api.delete(`/budgets/budgets/${id}/`);

      // Obnovit data rozpočtů
      const data = await dashboardService.getBudgetOverview();
      setBudgetData(data);

      setShowDeleteConfirm(null);
      alert('Rozpočet byl úspěšně smazán!');
    } catch (err: any) {
      console.error('Chyba při mazání rozpočtu:', err);
      alert('Nepodařilo se smazat rozpočet. Zkuste to prosím znovu.');
    }
  };

  if (loading) {
    return (
      <div className="budgets-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <BudgetsSkeleton />
      </div>
    );
  }

  // Zobrazí pouze lokalizovaný název kategorie za prvním spojovníkem (např. "food - Jídlo a nápoje" -> "Jídlo a nápoje")
  const displayCategoryName = (rawName: string) => {
    if (!rawName) return rawName;
    const match = rawName.match(/^\s*[^-]+-\s*(.+)$/);
    return match ? match[1].trim() : rawName.trim();
  };

  return (
    <div className="budgets-page">
      {/* Hero Section */}
      <div className="budgets-hero">
        <div>
          <h1 className="budgets-title">Rozpočty</h1>
          <p className="budgets-subtitle">Správa a sledování vašich rozpočtů</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="budgets-summary">
        <div className="summary-card">
          <h3 className="summary-label">Celkový rozpočet</h3>
          <p className="summary-value" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(budgetData?.total_budget || 0)}
          </p>
          <p className="summary-description">Součet všech rozpočtů</p>
        </div>

        <div className="summary-card">
          <h3 className="summary-label">Celkem utraceno</h3>
          <p className="summary-value" style={{ color: '#FF4742' }}>
            {formatCurrency(budgetData?.total_spent || 0)}
          </p>
          <p className="summary-description">
            {budgetData?.total_budget
              ? `${((budgetData.total_spent / budgetData.total_budget) * 100).toFixed(1)}% celkového rozpočtu`
              : 'Z celkového rozpočtu'}
          </p>
        </div>

        <div className="summary-card">
          <h3 className="summary-label">Zbývající rozpočet</h3>
          <p className="summary-value" style={{
            color: (budgetData?.total_budget || 0) - (budgetData?.total_spent || 0) >= 0
              ? '#4ADE80'
              : '#FF4742'
          }}>
            {formatCurrency((budgetData?.total_budget || 0) - (budgetData?.total_spent || 0))}
          </p>
          <p className="summary-description">Dostupné k utracení</p>
        </div>
      </div>

      {/* Budgets List */}
      <div className="budgets-container">
        <div className="section-header">
          <span>Vaše rozpočty ({budgetData?.budgets?.length || 0})</span>
          <button className="add-budget-btn" onClick={handleOpenNewBudgetModal}>
            <Plus size={18} />
            Přidat rozpočet
          </button>
        </div>

        {budgetData?.budgets && budgetData.budgets.length > 0 ? (
          <div className="budgets-grid">
            {budgetData.budgets.map((budget: Budget) => {
              const status = getBudgetStatus(budget.percentage_used);

              return (
                <div key={budget.id} className="budget-card">
                  <div className="budget-header">
                    <div className="budget-info">
                      <div className="budget-icon">
                        <CategoryIcon 
                          iconName={budget.category_icon || 'wallet'} 
                          color={budget.category_color || '#8b5cf6'} 
                          size={24} 
                        />
                      </div>
                      <div>
                        <h3>{budget.name}</h3>
                        <p className="budget-category">{budget.category || 'Obecný rozpočet'}</p>
                      </div>
                    </div>
                    <div className="budget-stats">
                      <p className={`budget-percentage ${status}`}>
                        {budget.percentage_used.toFixed(0)}%
                      </p>
                      <p className="budget-status">{getStatusText(budget.percentage_used)}</p>
                    </div>
                  </div>

                  <div className="budget-amounts">
                    <p className="amount-spent">
                      Utraceno: <strong>{formatCurrency(budget.spent)}</strong>
                    </p>
                    <p className="amount-limit">
                      Limit: <strong>{formatCurrency(budget.amount)}</strong>
                    </p>
                  </div>

                  <div className="budget-progress">
                    <div className="progress-bar-container">
                      <div
                        className={`progress-bar-fill ${status}`}
                        style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="budget-remaining">
                    Zbývá: <strong>{formatCurrency(budget.remaining)}</strong>
                  </p>

                  <div className="budget-actions">
                    <button
                      className="budget-action-btn edit"
                      onClick={() => handleOpenModal(budget)}
                    >
                      <Edit2 size={14} /> Upravit
                    </button>
                    <button
                      className="budget-action-btn delete"
                      onClick={() => setShowDeleteConfirm(budget.id)}
                    >
                      <Trash2 size={14} /> Smazat
                    </button>
                  </div>

                  {/* Potvrzovací dialog pro mazání */}
                  {showDeleteConfirm === budget.id && (
                    <div className="delete-confirm-budget">
                      <p>Opravdu chcete smazat tento rozpočet?</p>
                      <div className="delete-confirm-actions">
                        <button
                          className="btn-confirm-delete"
                          onClick={() => handleDeleteBudget(budget.id)}
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
              );
            })}
          </div>
        ) : (
          <EmptyState
            illustration="budgets"
            title="Žádné rozpočty"
            description="Zatím jste nevytvořili žádný rozpočet. Začněte sledovat své výdaje a kontrolovat finance vytvořením prvního rozpočtu."
            actionText="Vytvořit první rozpočet"
            onAction={handleOpenNewBudgetModal}
          />
        )}
      </div>

      {/* Modal pro přidání rozpočtu */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Upravit rozpočet' : 'Přidat nový rozpočet'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Název rozpočtu *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="např. Potraviny, Doprava..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Částka *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Kategorie</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Všechny kategorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {displayCategoryName(cat.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="period">Období</label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                >
                  <option value="MONTHLY">Měsíční</option>
                  <option value="YEARLY">Roční</option>
                  <option value="CUSTOM">Vlastní</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Začátek *</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">Konec *</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Zrušit
                </button>
                <button type="submit" className="btn-submit">
                  {editingBudget ? 'Uložit změny' : 'Vytvořit rozpočet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;