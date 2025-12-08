import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import Icon from './Icon';
import CategoryIcon from './CategoryIcon';
import '../styles/RecurringTransactions.css';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
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

const RecurringTransactions: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    category_id: '',
    frequency: 'MONTHLY' as RecurringTransaction['frequency'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_create: true,
    notify_before_days: 3,
  });

  useEffect(() => {
    if (user) {
      fetchRecurring();
      fetchCategories();
    }
  }, [user]);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions/recurring/');
      setRecurring(response.data);
    } catch (error) {
      console.error('Chyba při načítání opakujících se transakcí:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/transactions/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Chyba při načítání kategorií:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      if (editingId) {
        await api.put(`/transactions/recurring/${editingId}/`, payload);
        toast.success('Opakující se transakce byla upravena');
      } else {
        await api.post('/transactions/recurring/', payload);
        toast.success('Opakující se transakce byla vytvořena');
      }

      fetchRecurring();
      resetForm();
    } catch (error: any) {
      console.error('Chyba při ukládání:', error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || JSON.stringify(error.response?.data) 
        || 'Nepodařilo se uložit opakující se transakci';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Opravdu chcete smazat tuto opakující se transakci?')) {
      try {
        await api.delete(`/transactions/recurring/${id}/`);
        fetchRecurring();
      } catch (error) {
        console.error('Chyba při mazání:', error);
      }
    }
  };

  const handleEdit = (item: RecurringTransaction) => {
    setEditingId(item.id);
    setFormData({
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
    setShowForm(true);
  };

  const toggleStatus = async (id: number) => {
    try {
      await api.post(`/transactions/recurring/${id}/toggle_status/`);
      fetchRecurring();
    } catch (error) {
      console.error('Chyba při změně statusu:', error);
    }
  };

  const createTransactionNow = async (id: number) => {
    try {
      await api.post(`/transactions/recurring/${id}/create_transaction/`);
      toast.success('Transakce byla vytvořena!');
      fetchRecurring();
    } catch (error) {
      console.error('Chyba při vytváření transakce:', error);
      toast.error('Nepodařilo se vytvořit transakci');
    }
  };

  const processAllDue = async () => {
    try {
      const response = await api.post('/transactions/recurring/process_all_due/');
      toast.success(response.data.message || 'Všechny splatné transakce byly zpracovány');
      fetchRecurring();
    } catch (error) {
      console.error('Chyba při zpracování transakcí:', error);
      toast.error('Nepodařilo se zpracovat transakce');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      type: 'EXPENSE',
      category_id: '',
      frequency: 'MONTHLY',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_create: true,
      notify_before_days: 3,
    });
    setEditingId(null);
    setShowForm(false);
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
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Načítám opakující se transakce...</p>
      </div>
    );
  }

  return (
    <div className="recurring-page">
      <div className="recurring-header">
        <div>
          <h1 className="recurring-title">
            <Icon name="trending-up" size={32} />
            Opakující se transakce
          </h1>
          <p className="recurring-subtitle">
            Spravujte pravidelné příjmy a výdaje
          </p>
        </div>
        <div className="recurring-header-actions">
          <button
            className="btn-process-due"
            onClick={processAllDue}
            title="Zpracovat všechny splatné transakce"
          >
            <Icon name="zap" size={20} />
            Zpracovat splatné
          </button>
          <button
            className="btn-new-recurring"
            onClick={() => setShowForm(!showForm)}
          >
            <Icon name="plus" size={20} />
            {showForm ? 'Zrušit' : 'Nová opakující se transakce'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="recurring-form-container">
          <h2>{editingId ? 'Upravit transakci' : 'Nová transakce'}</h2>
          <form onSubmit={handleSubmit} className="recurring-form">
            <div className="form-row">
              <div className="form-group">
                <label>Název *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Např. Netflix předplatné"
                />
              </div>
              <div className="form-group">
                <label>Částka *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Popis</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Volitelný popis transakce"
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Typ *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                >
                  <option value="EXPENSE">Výdaj</option>
                  <option value="INCOME">Příjem</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kategorie</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Vyberte kategorii</option>
                  {categories
                    .filter(cat =>
                      (formData.type === 'EXPENSE' && cat.name !== 'Mzda' && cat.name !== 'Ostatní příjmy') ||
                      (formData.type === 'INCOME' && (cat.name === 'Mzda' || cat.name === 'Ostatní příjmy'))
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
                <label>Frekvence *</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringTransaction['frequency'] })}
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
                <label>Datum začátku *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datum konce (volitelné)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Upozornit předem (dny)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.notify_before_days}
                  onChange={(e) => setFormData({ ...formData, notify_before_days: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.auto_create}
                  onChange={(e) => setFormData({ ...formData, auto_create: e.target.checked })}
                />
                Automaticky vytvářet transakce
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? 'Uložit změny' : 'Vytvořit'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="recurring-list">
        {recurring.length === 0 ? (
          <div className="recurring-empty">
            <Icon name="trending-up" size={64} color="var(--text-secondary)" />
            <h3>Žádné opakující se transakce</h3>
            <p>Vytvořte první opakující se transakci pro pravidelné platby</p>
          </div>
        ) : (
          recurring.map((item) => (
            <div key={item.id} className={`recurring-item ${item.status.toLowerCase()}`}>
              <div className="recurring-item-header">
                <div className="recurring-item-title">
                  <CategoryIcon
                    iconName={item.category?.icon || 'repeat'}
                    color={item.category?.color || '#8b5cf6'}
                    size={32}
                  />
                  <div>
                    <h3>{item.name}</h3>
                    <p className="recurring-description">{item.description}</p>
                  </div>
                </div>
                <div className="recurring-item-amount" style={{
                  color: item.type === 'INCOME' ? '#10B981' : '#EF4444'
                }}>
                  {item.type === 'INCOME' ? '+' : '-'}{parseFloat(item.amount).toFixed(1)} {user?.currency_preference}
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
                  onClick={() => toggleStatus(item.id)}
                  disabled={item.status === 'COMPLETED'}
                  title={item.status === 'ACTIVE' ? 'Pozastavit' : 'Aktivovat'}
                >
                  {item.status === 'ACTIVE' ? '⏸️ Pozastavit' : '▶️ Aktivovat'}
                </button>
                <button
                  className="btn-action btn-edit"
                  onClick={() => handleEdit(item)}
                  title="Upravit"
                >
                  <Icon name="edit" size={16} />
                  Upravit
                </button>
                <button
                  className="btn-action btn-delete"
                  onClick={() => handleDelete(item.id)}
                  title="Smazat"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringTransactions;
