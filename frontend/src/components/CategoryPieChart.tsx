import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import '../styles/CategoryPieChart.css';

interface Transaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category?: string;
}

interface CategoryPieChartProps {
  transactions: Transaction[];
  type?: 'INCOME' | 'EXPENSE';
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: any;
}

const EXPENSE_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Deep Orange
];

const INCOME_COLORS = [
  '#10B981', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions, type = 'EXPENSE' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    const filteredTransactions = transactions.filter(t => t.type === type);
    
    filteredTransactions.forEach((transaction) => {
      const category = transaction.category || 'Ostatní';
      categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
    });
    
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    const colors = type === 'EXPENSE' ? EXPENSE_COLORS : INCOME_COLORS;
    
    const data: CategoryData[] = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: (value / total) * 100,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    return { data, total };
  }, [transactions, type]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="var(--text-primary)" fontSize="1.5rem" fontWeight="700">
          {payload.value.toFixed(0)} Kč
        </text>
        <text x={cx} y={cy + 20} dy={8} textAnchor="middle" fill="var(--text-secondary)" fontSize="0.875rem">
          {payload.name}
        </text>
        <text x={cx} y={cy + 40} dy={8} textAnchor="middle" fill="var(--text-secondary)" fontSize="0.875rem">
          ({payload.percentage.toFixed(1)}%)
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  if (chartData.data.length === 0) {
    return (
      <div className="category-pie-chart">
        <div className="pie-header">
          <h3>{type === 'EXPENSE' ? 'Rozdělení výdajů' : 'Rozdělení příjmů'}</h3>
        </div>
        <div className="pie-empty">
          <p>Žádné transakce k zobrazení</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-pie-chart">
      <div className="pie-header">
        <h3>{type === 'EXPENSE' ? 'Rozdělení výdajů' : 'Rozdělení příjmů'}</h3>
        <div className="pie-total">
          <span className="total-label">Celkem:</span>
          <span className="total-value">{chartData.total.toFixed(0)} Kč</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            activeShape={activeIndex !== null ? renderActiveShape : undefined}
            data={chartData.data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="pie-legend">
        {chartData.data.map((entry, index) => (
          <div
            key={index}
            className={`legend-item ${activeIndex === index ? 'active' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="legend-color" style={{ background: entry.color }}></div>
            <div className="legend-info">
              <span className="legend-name">{entry.name}</span>
              <span className="legend-value">
                {entry.value.toFixed(0)} Kč ({entry.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart;
