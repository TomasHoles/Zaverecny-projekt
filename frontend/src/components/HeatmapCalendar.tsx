import React, { useMemo } from 'react';
import '../styles/HeatmapCalendar.css';

interface Transaction {
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
}

interface HeatmapCalendarProps {
  transactions: Transaction[];
  months?: number;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ transactions, months = 3 }) => {
  const calendarData = useMemo(() => {
    const data: { [key: string]: { income: number; expense: number; net: number } } = {};
    
    transactions.forEach((transaction) => {
      const date = transaction.date.split('T')[0];
      if (!data[date]) {
        data[date] = { income: 0, expense: 0, net: 0 };
      }
      
      if (transaction.type === 'INCOME') {
        data[date].income += transaction.amount;
      } else {
        data[date].expense += transaction.amount;
      }
      data[date].net = data[date].income - data[date].expense;
    });
    
    return data;
  }, [transactions]);

  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    const daysCount = months * 30;
    
    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  const getIntensity = (net: number) => {
    if (net === 0) return 0;
    const absNet = Math.abs(net);
    if (absNet < 500) return 1;
    if (absNet < 1500) return 2;
    if (absNet < 3000) return 3;
    return 4;
  };

  const getColor = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = calendarData[dateStr];
    
    if (!dayData || (dayData.income === 0 && dayData.expense === 0)) {
      return 'var(--heatmap-empty)';
    }
    
    const intensity = getIntensity(dayData.net);
    
    if (dayData.net > 0) {
      // Income > Expenses (green)
      return `var(--heatmap-positive-${intensity})`;
    } else {
      // Expenses > Income (red)
      return `var(--heatmap-negative-${intensity})`;
    }
  };

  const getTooltip = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = calendarData[dateStr];
    
    if (!dayData || (dayData.income === 0 && dayData.expense === 0)) {
      return `${formatDate(date)}\nŽádné transakce`;
    }
    
    return `${formatDate(date)}\nPříjmy: ${dayData.income.toFixed(0)} Kč\nVýdaje: ${dayData.expense.toFixed(0)} Kč\nNet: ${dayData.net > 0 ? '+' : ''}${dayData.net.toFixed(0)} Kč`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
  };

  const days = getDaysArray();
  const weeks = [];
  
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="heatmap-calendar">
      <div className="heatmap-header">
        <h3>Aktivita transakcí</h3>
        <div className="heatmap-legend">
          <span>Méně</span>
          <div className="legend-colors">
            <div className="legend-square" style={{ background: 'var(--heatmap-empty)' }}></div>
            <div className="legend-square" style={{ background: 'var(--heatmap-positive-1)' }}></div>
            <div className="legend-square" style={{ background: 'var(--heatmap-positive-2)' }}></div>
            <div className="legend-square" style={{ background: 'var(--heatmap-positive-3)' }}></div>
            <div className="legend-square" style={{ background: 'var(--heatmap-positive-4)' }}></div>
          </div>
          <span>Více</span>
        </div>
      </div>
      
      <div className="heatmap-grid">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="heatmap-week">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="heatmap-day"
                style={{ backgroundColor: getColor(day) }}
                title={getTooltip(day)}
                data-tooltip={getTooltip(day)}
              >
                <span className="day-number">{day.getDate()}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapCalendar;
