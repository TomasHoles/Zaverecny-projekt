import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '../interfaces/category';
import { Budget } from '../interfaces/budget';
import { transactionService } from '../services/transactions';
import { budgetService } from '../services/budgets';

const Dashboard: React.FC = () => {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent transactions
        const transactions = await transactionService.getAll();
        setRecentTransactions(transactions.slice(0, 5)); // Show only 5 most recent

        // Fetch current month's budget
        const budgets = await budgetService.getAll();
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const current = budgets.find(b => b.period === currentMonth);
        setCurrentBudget(current || null);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link to="/transactions" className="text-blue-500 hover:text-blue-600">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {recentTransactions.map(transaction => (
            <div key={transaction.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{transaction.category.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()}
                </div>
              </div>
              <div className={transaction.type === 'EXPENSE' ? 'text-red-500' : 'text-green-500'}>
                {transaction.type === 'EXPENSE' ? '-' : '+'}
                ${transaction.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Budget */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Budget</h2>
          <Link to="/budgets" className="text-blue-500 hover:text-blue-600">
            Manage Budgets
          </Link>
        </div>
        {currentBudget ? (
          <div className="space-y-4">
            {currentBudget.categories.map(category => (
              <div key={category.id} className="flex justify-between items-center">
                <span>{category.category.name}</span>
                <span>${category.amount}</span>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total Budget</span>
                <span>
                  ${currentBudget.categories.reduce((sum, cat) => sum + cat.amount, 0)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No budget set for current month</p>
            <Link
              to="/budgets/new"
              className="mt-2 inline-block text-blue-500 hover:text-blue-600"
            >
              Create Budget
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;