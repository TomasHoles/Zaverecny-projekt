import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Budget } from '../interfaces/budget';
import { budgetService } from '../services/budgets';

const BudgetList: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const data = await budgetService.getAll();
        setBudgets(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch budgets');
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Link
          to="/budgets/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Budget
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <div key={budget.id} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{budget.period}</h2>
            <div className="space-y-2">
              {budget.categories.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span>{category.category.name}</span>
                  <span>${category.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total Budget</span>
                <span>
                  ${budget.categories.reduce((sum, cat) => sum + cat.amount, 0)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={`/budgets/${budget.id}`}
                className="text-blue-500 hover:text-blue-600"
              >
                Edit Budget
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetList;