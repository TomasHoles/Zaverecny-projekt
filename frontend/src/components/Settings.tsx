import React, { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, 
    Wallet, 
    Plus, 
    Edit2, 
    Trash2, 
    Star, 
    CreditCard,
    PiggyBank,
    Banknote,
    Building,
    Coins,
    TrendingUp,
    Landmark,
    Check,
    X,
    Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import accountService, { FinancialAccount, CreateAccountData, AccountOptions } from '../services/accountService';
import '../styles/Settings.css';

// Mapování ikon na Lucide komponenty
const iconMap: { [key: string]: React.ReactNode } = {
    'wallet': <Wallet size={20} />,
    'credit-card': <CreditCard size={20} />,
    'piggy-bank': <PiggyBank size={20} />,
    'landmark': <Landmark size={20} />,
    'banknote': <Banknote size={20} />,
    'coins': <Coins size={20} />,
    'trending-up': <TrendingUp size={20} />,
    'building': <Building size={20} />,
};

const Settings: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
    const [accountOptions, setAccountOptions] = useState<AccountOptions | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreateAccountData>({
        name: '',
        account_type: 'CHECKING',
        initial_balance: 0,
        currency: user?.currency_preference || 'CZK',
        color: '#3B82F6',
        icon: 'wallet',
        is_active: true,
        is_default: false,
        include_in_total: true,
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [accountsData, optionsData] = await Promise.all([
                accountService.getAccounts(),
                accountService.getAccountOptions()
            ]);
            setAccounts(accountsData);
            setAccountOptions(optionsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Nepodařilo se načíst data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: user?.currency_preference || 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const openAddModal = () => {
        setEditingAccount(null);
        setFormData({
            name: '',
            account_type: 'CHECKING',
            initial_balance: 0,
            currency: user?.currency_preference || 'CZK',
            color: '#3B82F6',
            icon: 'wallet',
            is_active: true,
            is_default: false,
            include_in_total: true,
            description: ''
        });
        setShowModal(true);
    };

    const openEditModal = (account: FinancialAccount) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            account_type: account.account_type,
            initial_balance: account.initial_balance,
            currency: account.currency,
            color: account.color,
            icon: account.icon,
            is_active: account.is_active,
            is_default: account.is_default,
            include_in_total: account.include_in_total,
            description: account.description
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Zadejte název účtu');
            return;
        }

        try {
            setSaving(true);
            if (editingAccount) {
                await accountService.updateAccount(editingAccount.id, formData);
                toast.success('Účet byl úspěšně upraven');
            } else {
                await accountService.createAccount(formData);
                toast.success('Účet byl úspěšně vytvořen');
            }
            closeModal();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Nepodařilo se uložit účet');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (account: FinancialAccount) => {
        if (!window.confirm(`Opravdu chcete smazat účet "${account.name}"?`)) {
            return;
        }

        try {
            await accountService.deleteAccount(account.id);
            toast.success('Účet byl smazán');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Nepodařilo se smazat účet');
        }
    };

    const handleSetDefault = async (account: FinancialAccount) => {
        try {
            await accountService.setDefaultAccount(account.id);
            toast.success(`Účet "${account.name}" byl nastaven jako výchozí`);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Nepodařilo se nastavit výchozí účet');
        }
    };

    if (loading) {
        return (
            <div className="settings-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader size={40} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="settings-container">
            <div className="settings-header">
                <div className="settings-title">
                    <SettingsIcon size={28} />
                    <h1>Nastavení</h1>
                </div>
                <p className="settings-subtitle">Spravujte své finanční účty a preference</p>
            </div>

            {/* Finanční účty sekce */}
            <section className="settings-section">
                <div className="section-header">
                    <div className="section-title">
                        <Wallet size={22} />
                        <h2>Finanční účty</h2>
                    </div>
                    <button className="btn-add" onClick={openAddModal}>
                        <Plus size={18} />
                        Přidat účet
                    </button>
                </div>

                {accounts.length === 0 ? (
                    <div className="empty-state">
                        <Wallet size={48} />
                        <h3>Zatím nemáte žádné účty</h3>
                        <p>Přidejte svůj první finanční účet pro sledování financí</p>
                        <button className="btn-primary" onClick={openAddModal}>
                            <Plus size={18} />
                            Přidat první účet
                        </button>
                    </div>
                ) : (
                    <div className="accounts-grid">
                        {accounts.map(account => (
                            <div 
                                key={account.id} 
                                className={`account-card ${!account.is_active ? 'inactive' : ''}`}
                                style={{ borderColor: account.color }}
                            >
                                <div className="account-header">
                                    <div 
                                        className="account-icon" 
                                        style={{ backgroundColor: account.color }}
                                    >
                                        {iconMap[account.icon] || <Wallet size={20} />}
                                    </div>
                                    <div className="account-info">
                                        <h3>{account.name}</h3>
                                        <span className="account-type">{account.account_type_display}</span>
                                    </div>
                                    {account.is_default && (
                                        <div className="default-badge" title="Výchozí účet">
                                            <Star size={16} fill="#ccff00" />
                                        </div>
                                    )}
                                </div>

                                <div className="account-balance">
                                    <span className="balance-label">Aktuální zůstatek</span>
                                    <span className={`balance-amount ${account.current_balance >= 0 ? 'positive' : 'negative'}`}>
                                        {formatCurrency(account.current_balance)}
                                    </span>
                                </div>

                                <div className="account-details">
                                    <div className="detail-item">
                                        <span>Počáteční zůstatek:</span>
                                        <span>{formatCurrency(account.initial_balance)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span>Zahrnout do celku:</span>
                                        <span>{account.include_in_total ? 'Ano' : 'Ne'}</span>
                                    </div>
                                </div>

                                <div className="account-actions">
                                    {!account.is_default && (
                                        <button 
                                            className="btn-icon" 
                                            onClick={() => handleSetDefault(account)}
                                            title="Nastavit jako výchozí"
                                        >
                                            <Star size={16} />
                                        </button>
                                    )}
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => openEditModal(account)}
                                        title="Upravit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        className="btn-icon danger" 
                                        onClick={() => handleDelete(account)}
                                        title="Smazat"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal pro přidání/úpravu účtu */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAccount ? 'Upravit účet' : 'Nový účet'}</h2>
                            <button className="btn-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Název účtu *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="např. Běžný účet Fio"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Typ účtu</label>
                                    <select
                                        value={formData.account_type}
                                        onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                    >
                                        {accountOptions?.types.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Počáteční zůstatek</label>
                                    <input
                                        type="number"
                                        value={formData.initial_balance}
                                        onChange={e => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Barva</label>
                                    <div className="color-picker">
                                        {accountOptions?.colors.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                                                style={{ backgroundColor: color.value }}
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                title={color.label}
                                            >
                                                {formData.color === color.value && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Ikona</label>
                                    <div className="icon-picker">
                                        {accountOptions?.icons.map(icon => (
                                            <button
                                                key={icon.value}
                                                type="button"
                                                className={`icon-option ${formData.icon === icon.value ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, icon: icon.value })}
                                                title={icon.label}
                                            >
                                                {iconMap[icon.value] || <Wallet size={18} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Popis (volitelné)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Poznámka k účtu..."
                                    rows={2}
                                />
                            </div>

                            <div className="form-checkboxes">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span>Aktivní účet</span>
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.include_in_total}
                                        onChange={e => setFormData({ ...formData, include_in_total: e.target.checked })}
                                    />
                                    <span>Zahrnout do celkového zůstatku</span>
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_default}
                                        onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                                    />
                                    <span>Nastavit jako výchozí účet</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Zrušit
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader size={16} className="animate-spin" />
                                            Ukládám...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            {editingAccount ? 'Uložit změny' : 'Vytvořit účet'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
