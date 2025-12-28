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
    if (!transactions || transactions.length === 0) return [];
    
    // Zjisti časové období
    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    let groupedData: { [key: string]: { income: number; expense: number; label: string } } = {};
    
    if (daysDiff <= 60) {
      // Denní granularita pro krátké období (do 2 měsíců) - 30-60 sloupců
      transactions.forEach((transaction) => {
        const date = new Date(transaction.date);
        const dayKey = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
        
        if (!groupedData[dayKey]) {
          groupedData[dayKey] = { income: 0, expense: 0, label: dayLabel };
        }
        
        if (transaction.type === 'INCOME') {
          groupedData[dayKey].income += transaction.amount;
        } else {
          groupedData[dayKey].expense += transaction.amount;
        }
      });
    } else if (daysDiff <= 180) {
      // Týdenní granularita pro střední období (3-6 měsíců) - 12-25 týdnů
      transactions.forEach((transaction) => {
        const date = new Date(transaction.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
        const weekKey = weekStart.toISOString().split('T')[0];
        const weekNum = Math.ceil((date.getTime() - minDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const weekLabel = `T${weekNum}`;
        
        if (!groupedData[weekKey]) {
          groupedData[weekKey] = { income: 0, expense: 0, label: weekLabel };
        }
        
        if (transaction.type === 'INCOME') {
          groupedData[weekKey].income += transaction.amount;
        } else {
          groupedData[weekKey].expense += transaction.amount;
        }
      });
    } else {
      // Měsíční granularita pro dlouhé období (více než 6 měsíců) - 12+ měsíců
      transactions.forEach((transaction) => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' });
        
        if (!groupedData[monthKey]) {
          groupedData[monthKey] = { income: 0, expense: 0, label: monthLabel };
        }
        
        if (transaction.type === 'INCOME') {
          groupedData[monthKey].income += transaction.amount;
        } else {
          groupedData[monthKey].expense += transaction.amount;
        }
      });
    }
    
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
    
    // Sort periods
    const sortedKeys = Object.keys(groupedData).sort();
    
    sortedKeys.forEach((key) => {
      const { income, expense, label } = groupedData[key];
      
      if (income > 0) {
        data.push({
          name: `${label} Příjmy`,
          value: income,
          cumulative: cumulative + income,
          type: 'income',
          base: cumulative
        });
        cumulative += income;
      }
      
      if (expense > 0) {
        data.push({
          name: `${label} Výdaje`,
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
        return 'rgba(99, 102, 241, 0.8)';  // Fialová pro stav účtu
      case 'income':
        return 'rgba(16, 185, 129, 0.8)';  // Zelená pro příjmy
      case 'expense':
        return 'rgba(239, 68, 68, 0.8)';   // Červená pro výdaje
      default:
        return '#9ca3af';
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
          <div className="legend-color" style={{ background: 'rgba(16, 185, 129, 0.8)' }}></div>
          <span>Příjmy</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.8)' }}></div>
          <span>Výdaje</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(99, 102, 241, 0.8)' }}></div>
          <span>Stav účtu</span>
        </div>
      </div>
    </div>
  );
};

export default WaterfallChart;
