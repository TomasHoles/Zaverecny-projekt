import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import '../styles/WaterfallChart.css';

interface Transaction {
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category?: string;
}

interface WaterfallChartProps {
  transactions: Transaction[];
  startBalance?: number;
}

interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: 'start' | 'income' | 'expense' | 'end';
  base: number;
}

const WaterfallChart: React.FC<WaterfallChartProps> = ({ transactions, startBalance = 0 }) => {
  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'INCOME') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });
    
    const data: WaterfallData[] = [];
    let cumulative = startBalance;
    
    // Starting balance
    data.push({
      name: 'Začátek',
      value: startBalance,
      cumulative: startBalance,
      type: 'start',
      base: 0
    });
    
    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    
    sortedMonths.forEach((monthKey) => {
      const { income, expense } = monthlyData[monthKey];
      const net = income - expense;
      
      // Format month name
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('cs-CZ', { 
        month: 'short',
        year: '2-digit'
      });
      
      if (income > 0) {
        data.push({
          name: `${monthName} Příjmy`,
          value: income,
          cumulative: cumulative + income,
          type: 'income',
          base: cumulative
        });
        cumulative += income;
      }
      
      if (expense > 0) {
        data.push({
          name: `${monthName} Výdaje`,
          value: -expense,
          cumulative: cumulative - expense,
          type: 'expense',
          base: cumulative - expense
        });
        cumulative -= expense;
      }
    });
    
    // Ending balance
    data.push({
      name: 'Konec',
      value: cumulative,
      cumulative: cumulative,
      type: 'end',
      base: 0
    });
    
    return data;
  }, [transactions, startBalance]);

  const getBarColor = (type: string) => {
    switch (type) {
      case 'start':
      case 'end':
        return 'var(--waterfall-total)';
      case 'income':
        return 'var(--waterfall-income)';
      case 'expense':
        return 'var(--waterfall-expense)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as WaterfallData;
      return (
        <div className="waterfall-tooltip">
          <p className="label">{data.name}</p>
          <p className="value" style={{ color: getBarColor(data.type) }}>
            {data.value >= 0 ? '+' : ''}{data.value.toFixed(0)} Kč
          </p>
          <p className="cumulative">
            Celkem: {data.cumulative.toFixed(0)} Kč
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="waterfall-chart-container">
      <div className="waterfall-header">
        <h3>Cash Flow Waterfall</h3>
        <div className="waterfall-summary">
          <div className="summary-item">
            <span className="summary-label">Začátek:</span>
            <span className="summary-value start">{startBalance.toFixed(0)} Kč</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Konec:</span>
            <span className="summary-value end">
              {chartData[chartData.length - 1]?.cumulative.toFixed(0) || '0'} Kč
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Změna:</span>
            <span className={`summary-value ${
              (chartData[chartData.length - 1]?.cumulative || 0) - startBalance >= 0 ? 'positive' : 'negative'
            }`}>
              {((chartData[chartData.length - 1]?.cumulative || 0) - startBalance >= 0 ? '+' : '')}
              {((chartData[chartData.length - 1]?.cumulative || 0) - startBalance).toFixed(0)} Kč
            </span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)' }}
            tickFormatter={(value) => `${value.toFixed(0)} Kč`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="var(--text-secondary)" strokeDasharray="3 3" />
          <Bar 
            dataKey="value"
            stackId="a"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="waterfall-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--waterfall-income)' }}></div>
          <span>Příjmy</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--waterfall-expense)' }}></div>
          <span>Výdaje</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--waterfall-total)' }}></div>
          <span>Stav účtu</span>
        </div>
      </div>
    </div>
  );
};

export default WaterfallChart;
