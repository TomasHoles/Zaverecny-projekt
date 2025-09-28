import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Budget, BudgetCategory } from '../interfaces/budget';
import { Category } from '../interfaces/category';
import { budgetService } from '../services/budgets';
import { categoryService } from '../services/transactions';

const BudgetForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Partial<Budget>>({
    period: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM format
    categories: [],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await categoryService.getAll();
      setCategories(data);
      
      // Initialize budget categories with 0 amounts
      if (!id) {
        setFormData(prev => ({
          ...prev,
          categories: data.map(category => ({
            category_id: category.id,
            amount: 0,
            category: category,
          })),
        }));
      }
    };

    fetchCategories();

    if (id) {
      const fetchBudget = async () => {
        const data = await budgetService.getById(id);
        setFormData(data);
      };
      fetchBudget();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await budgetService.update(id, formData);
      } else {
        await budgetService.create(formData);
      }
      navigate('/budgets');
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const handleCategoryAmountChange = (categoryId: string, amount: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories?.map(cat =>
        cat.category_id === categoryId ? { ...cat, amount } : cat
      ),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Budget</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Period</label>
          <input
            type="month"
            value={formData.period}
            onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Category Budgets</h2>
          {formData.categories?.map((budgetCategory) => (
            <div key={budgetCategory.category_id} className="flex items-center space-x-4">
              <span className="w-1/3">{budgetCategory.category.name}</span>
              <input
                type="number"
                value={budgetCategory.amount}
                onChange={(e) => handleCategoryAmountChange(
                  budgetCategory.category_id,
                  parseFloat(e.target.value) || 0
                )}
                className="w-2/3 rounded-md border-gray-300 shadow-sm"
                min="0"
                step="0.01"
                required
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/budgets')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            {id ? 'Update' : 'Create'} Budget
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;