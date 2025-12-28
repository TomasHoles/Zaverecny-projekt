/**
 * HeatmapCalendar.tsx - Heatmap kalendář finanční aktivity
 * 
 * @author Tomáš Holes
 * @description Vizualizace denní finanční aktivity ve stylu GitHub contributions
 */
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import '../styles/HeatmapCalendar.css';

interface DayData {
  date: string;
  income: number;
  expenses: number;
  transaction_count: number;
  balance: number;
}

interface HeatmapCalendarProps {
  months?: number;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ months = 3 }) => {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchHeatmapData();
  }, [months]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/heatmap/?months=${months}`);
      setData(response.data.daily_data || []);
    } catch (error) {
      console.error('Chyba při načítání heatmap dat:', error);
      generateEmptyData();
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyData = () => {
    const days: DayData[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0],
        income: 0,
        expenses: 0,
        transaction_count: 0,
        balance: 0
      });
    }
    setData(days);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Najít max hodnoty pro normalizaci
  const maxAmount = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.income + d.expenses), 1);
  }, [data]);

  // Získat barvu podle aktivity
  const getLevel = (day: DayData): number => {
    if (day.transaction_count === 0) return 0;
    const total = day.income + day.expenses;
    const ratio = total / maxAmount;
    if (ratio < 0.2) return 1;
    if (ratio < 0.4) return 2;
    if (ratio < 0.6) return 3;
    return 4;
  };

  const getColorType = (day: DayData): string => {
    if (day.transaction_count === 0) return 'empty';
    if (day.balance > 0) return 'positive';
    if (day.balance < 0) return 'negative';
    return 'neutral';
  };

  // Organizovat data do sloupců (každý sloupec = 1 týden)
  const { columns, monthLabels } = useMemo(() => {
    if (data.length === 0) return { columns: [], monthLabels: [] };

    const cols: (DayData | null)[][] = [];
    const labels: { text: string; col: number }[] = [];
    
    const dataMap = new Map<string, DayData>();
    data.forEach(d => dataMap.set(d.date, d));

    const firstDate = new Date(data[0].date);
    const lastDate = new Date(data[data.length - 1].date);
    
    // Zarovnat na pondělí
    const startDate = new Date(firstDate);
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToMonday);

    let currentDate = new Date(startDate);
    let currentCol: (DayData | null)[] = [];
    let lastMonth = '';

    while (currentDate <= lastDate || currentCol.length > 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr) || null;
      
      // Měsíční label
      const month = currentDate.toLocaleDateString('cs-CZ', { month: 'short' });
      if (month !== lastMonth) {
        lastMonth = month;
        if (currentDate.getDate() <= 7) {
          labels.push({ text: month, col: cols.length });
        }
      }

      currentCol.push(currentDate <= lastDate ? dayData : null);

      if (currentCol.length === 7) {
        cols.push(currentCol);
        currentCol = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
      
      if (currentDate > lastDate && currentCol.length === 0) break;
    }

    if (currentCol.length > 0) {
      while (currentCol.length < 7) currentCol.push(null);
      cols.push(currentCol);
    }

    return { columns: cols, monthLabels: labels };
  }, [data]);

  const stats = useMemo(() => {
    const totalTransactions = data.reduce((sum, d) => sum + d.transaction_count, 0);
    const activeDays = data.filter(d => d.transaction_count > 0).length;
    return { totalTransactions, activeDays };
  }, [data]);

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredDay(day);
  };

  if (loading) {
    return (
      <div className="heatmap-card">
        <div className="heatmap-header">
          <h3>Kalendář aktivity</h3>
        </div>
        <div className="heatmap-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <h3>Kalendář aktivity</h3>
        <div className="heatmap-stats">
          <span><strong>{stats.totalTransactions}</strong> transakcí</span>
          <span className="dot">•</span>
          <span><strong>{stats.activeDays}</strong> aktivních dní</span>
        </div>
      </div>

      <div className="heatmap-wrapper">
        {/* Dny vlevo */}
        <div className="heatmap-weekdays">
          <span></span>
          <span>Po</span>
          <span></span>
          <span>St</span>
          <span></span>
          <span>Pá</span>
          <span></span>
        </div>

        <div className="heatmap-scroll">
          {/* Měsíce nahoře */}
          <div className="heatmap-months">
            {monthLabels.map((label, idx) => (
              <span key={idx} style={{ left: `${label.col * 15}px` }}>{label.text}</span>
            ))}
          </div>

          {/* Grid */}
          <div className="heatmap-grid">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="heatmap-column">
                {col.map((day, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`heatmap-cell ${day ? `${getColorType(day)} level-${getLevel(day)}` : 'null'}`}
                    onMouseEnter={(e) => day && day.transaction_count > 0 && handleMouseEnter(day, e)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="heatmap-footer">
        <div className="heatmap-legend">
          <span>Méně</span>
          <div className="legend-cell empty"></div>
          <div className="legend-cell negative level-1"></div>
          <div className="legend-cell negative level-3"></div>
          <div className="legend-cell neutral level-2"></div>
          <div className="legend-cell positive level-2"></div>
          <div className="legend-cell positive level-4"></div>
          <span>Více</span>
        </div>
        <div className="heatmap-legend-labels">
          <span className="negative-label">● Výdaje převažují</span>
          <span className="positive-label">● Příjmy převažují</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div 
          className="heatmap-tooltip"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="tooltip-title">{formatDateLong(hoveredDay.date)}</div>
          <div className="tooltip-rows">
            <div className="tooltip-row">
              <span className="label">Příjmy</span>
              <span className="value positive">{formatCurrency(hoveredDay.income)}</span>
            </div>
            <div className="tooltip-row">
              <span className="label">Výdaje</span>
              <span className="value negative">{formatCurrency(hoveredDay.expenses)}</span>
            </div>
            <div className="tooltip-row total">
              <span className="label">Bilance</span>
              <span className={`value ${hoveredDay.balance >= 0 ? 'positive' : 'negative'}`}>
                {hoveredDay.balance >= 0 ? '+' : ''}{formatCurrency(hoveredDay.balance)}
              </span>
            </div>
          </div>
          <div className="tooltip-footer">{hoveredDay.transaction_count} transakcí</div>
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;
