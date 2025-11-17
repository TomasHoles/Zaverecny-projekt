import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Icon from './Icon';
import { GoalsSkeleton } from './SkeletonLoaders';
import EmptyState from './EmptyState';
import '../styles/Goals.css';

interface Goal {
  id: number;
  name: string;
  description: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
  icon: string;
  color: string;
  progress_percentage: number;
  remaining_amount: number;
  is_achieved: boolean;
  created_at: string;
  contributions: Contribution[];
}

interface Contribution {
  id: number;
  amount: number;
  date: string;
  note: string;
}

interface GoalSummary {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target_amount: number;
  total_saved_amount: number;
  overall_progress: number;
  goals: Goal[];
}

const Goals: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal_type: 'SAVINGS',
    target_amount: '',
    target_date: '',
    icon: 'target',
    color: '#FF4742'
  });

  const [contributionData, setContributionData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const goalTypes = [
    { value: 'SAVINGS', label: 'Úspory', icon: 'savings' },
    { value: 'PURCHASE', label: 'Nákup', icon: 'shopping-cart' },
    { value: 'EMERGENCY_FUND', label: 'Nouzový fond', icon: 'shield' },
    { value: 'INVESTMENT', label: 'Investice', icon: 'trending-up' },
    { value: 'DEBT_PAYMENT', label: 'Splacení dluhu', icon: 'credit-card' },
    { value: 'OTHER', label: 'Jiné', icon: 'more-horizontal' }
  ];

  const iconOptions = [
    'target', 'home', 'car', 'plane', 'gift', 'laptop',
    'smartphone', 'heart', 'star', 'trophy', 'umbrella', 'book'
  ];

  const colorOptions = [
    '#FF4742', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    fetchGoals();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      
      // Načíst souhrn
      const summaryResponse = await api.get('/goals/goals/summary/');
      setSummary(summaryResponse.data);
      
      // Načíst všechny cíle
      const allGoalsResponse = await api.get('/goals/goals/');
      setAllGoals(allGoalsResponse.data);
      
    } catch (error) {
      console.error('Chyba při načítání cílů:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Bez termínu';
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const handleOpenModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        description: goal.description,
        goal_type: goal.goal_type,
        target_amount: goal.target_amount.toString(),
        target_date: goal.target_date || '',
        icon: goal.icon,
        color: goal.color
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        description: '',
        goal_type: 'SAVINGS',
        target_amount: '',
        target_date: '',
        icon: 'target',
        color: '#FF4742'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target_amount) {
      alert('Vyplňte název a cílovou částku');
      return;
    }

    try {
      const goalData = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date || null
      };

      if (editingGoal) {
        await api.patch(`/goals/goals/${editingGoal.id}/`, goalData);
      } else {
        await api.post('/goals/goals/', goalData);
      }

      handleCloseModal();
      fetchGoals();
    } catch (error: any) {
      console.error('Chyba při ukládání cíle:', error);
      alert('Nepodařilo se uložit cíl');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tento cíl?')) return;

    try {
      await api.delete(`/goals/goals/${id}/`);
      fetchGoals();
    } catch (error) {
      console.error('Chyba při mazání cíle:', error);
      alert('Nepodařilo se smazat cíl');
    }
  };

  const handleOpenContribution = (goal: Goal) => {
    setSelectedGoal(goal);
    setContributionData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setShowContributionModal(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoal || !contributionData.amount) {
      alert('Vyplňte částku příspěvku');
      return;
    }

    try {
      await api.post(`/goals/goals/${selectedGoal.id}/add_contribution/`, {
        amount: parseFloat(contributionData.amount),
        date: contributionData.date,
        note: contributionData.note
      });

      setShowContributionModal(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Chyba při přidávání příspěvku:', error);
      alert('Nepodařilo se přidat příspěvek');
    }
  };

  const getFilteredGoals = () => {
    if (filter === 'active') {
      return allGoals.filter(g => g.status === 'ACTIVE');
    } else if (filter === 'completed') {
      return allGoals.filter(g => g.status === 'COMPLETED');
    }
    return allGoals;
  };

  if (loading) {
    return <GoalsSkeleton />;
  }

  const filteredGoals = getFilteredGoals();

  return (
    <div className="goals-page">
      {/* Header */}
      <div className="goals-header">
        <div>
          <h1 className="goals-title">Finanční cíle</h1>
          <p className="goals-subtitle">Plánujte a sledujte své finanční cíle</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Nový cíl
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="goals-summary">
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#3B82F620' }}>
              <Icon name="target" size={24} color="#3B82F6" />
            </div>
            <div className="summary-content">
              <p className="summary-label">Aktivní cíle</p>
              <p className="summary-value">{summary.active_goals}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#10B98120' }}>
              <Icon name="check-circle" size={24} color="#10B981" />
            </div>
            <div className="summary-content">
              <p className="summary-label">Dokončené</p>
              <p className="summary-value">{summary.completed_goals}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#F59E0B20' }}>
              <Icon name="dollar-sign" size={24} color="#F59E0B" />
            </div>
            <div className="summary-content">
              <p className="summary-label">Celková cílová částka</p>
              <p className="summary-value">{formatCurrency(summary.total_target_amount)}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#10B98120' }}>
              <Icon name="trending-up" size={24} color="#10B981" />
            </div>
            <div className="summary-content">
              <p className="summary-label">Celkový pokrok</p>
              <p className="summary-value">{summary.overall_progress.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="goals-filters">
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Aktivní
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Dokončené
        </button>
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Všechny
        </button>
      </div>

      {/* Goals Grid */}
      <div className="goals-grid">
        {filteredGoals.length === 0 ? (
          <EmptyState
            illustration="goals"
            title="Žádné cíle"
            description="Zatím nemáte žádné finanční cíle. Nastavte si svůj první cíl a začněte šetřit na to, na čem vám záleží."
            actionText="Vytvořit první cíl"
            onAction={() => handleOpenModal()}
          />
        ) : (
          filteredGoals.map(goal => (
            <div key={goal.id} className="goal-card" style={{ borderColor: goal.color }}>
              <div className="goal-card-header">
                <div className="goal-icon" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                  <Icon name={goal.icon} size={24} />
                </div>
                <div className="goal-actions">
                  {goal.status === 'ACTIVE' && (
                    <button 
                      className="icon-btn"
                      onClick={() => handleOpenContribution(goal)}
                      title="Přidat příspěvek"
                    >
                      +
                    </button>
                  )}
                  <button 
                    className="icon-btn"
                    onClick={() => handleOpenModal(goal)}
                    title="Upravit"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={() => handleDelete(goal.id)}
                    title="Smazat"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>

              <h3 className="goal-name">{goal.name}</h3>
              {goal.description && <p className="goal-description">{goal.description}</p>}

              <div className="goal-amounts">
                <div>
                  <p className="amount-label">Aktuální</p>
                  <p className="amount-value" style={{ color: goal.color }}>
                    {formatCurrency(goal.current_amount)}
                  </p>
                </div>
                <div>
                  <p className="amount-label">Cíl</p>
                  <p className="amount-value">{formatCurrency(goal.target_amount)}</p>
                </div>
              </div>

              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${Math.min(goal.progress_percentage, 100)}%`,
                    backgroundColor: goal.color
                  }}
                ></div>
              </div>
              <p className="progress-text">
                {goal.progress_percentage.toFixed(0)}% • zbývá {formatCurrency(goal.remaining_amount)}
              </p>

              {goal.target_date && (
                <p className="goal-deadline">
                  Termín: {formatDate(goal.target_date)}
                </p>
              )}

              {goal.status === 'COMPLETED' && (
                <div className="goal-completed-badge">
                  Dokončeno
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal pro vytvoření/úpravu cíle */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGoal ? 'Upravit cíl' : 'Nový cíl'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Název cíle *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Např. Nový počítač, Dovolená..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Popis</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Volitelný popis cíle"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Typ cíle</label>
                  <select
                    value={formData.goal_type}
                    onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                  >
                    {goalTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Cílová částka *</label>
                  <input
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="10000"
                    min="0"
                    step="100"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Termín dosažení</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ikona</label>
                <div className="icon-picker">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      <Icon name={icon} size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Barva</label>
                <div className="color-picker">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Zrušit
                </button>
                <button type="submit" className="btn-primary">
                  {editingGoal ? 'Uložit změny' : 'Vytvořit cíl'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pro přidání příspěvku */}
      {showContributionModal && selectedGoal && (
        <div className="modal-overlay" onClick={() => setShowContributionModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Přidat příspěvek</h2>
              <button className="close-btn" onClick={() => setShowContributionModal(false)}>×</button>
            </div>

            <div className="contribution-goal-info">
              <p className="contribution-goal-name">{selectedGoal.name}</p>
              <p className="contribution-progress">
                {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}
              </p>
            </div>

            <form onSubmit={handleContributionSubmit}>
              <div className="form-group">
                <label>Částka *</label>
                <input
                  type="number"
                  value={contributionData.amount}
                  onChange={(e) => setContributionData({ ...contributionData, amount: e.target.value })}
                  placeholder="1000"
                  min="0"
                  step="100"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Datum</label>
                <input
                  type="date"
                  value={contributionData.date}
                  onChange={(e) => setContributionData({ ...contributionData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Poznámka</label>
                <input
                  type="text"
                  value={contributionData.note}
                  onChange={(e) => setContributionData({ ...contributionData, note: e.target.value })}
                  placeholder="Volitelná poznámka"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowContributionModal(false)}>
                  Zrušit
                </button>
                <button type="submit" className="btn-primary">
                  Přidat příspěvek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
