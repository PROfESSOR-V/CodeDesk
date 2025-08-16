import React, { useMemo, useState } from 'react';
import { useTheme } from "../context/ThemeContext.jsx";

/**
 * ContributionHeatmap component
 *
 * Props:
 *  - activity: Array of objects with shape { date: 'YYYY-MM-DD', count: number }
 *
 * Renders a GitHub-style contribution heatmap with:
 *  • Total submissions, active days & max streak counters
 *  • Year selector (Current = last 12 months)
 *  • Month-wise grid with Tailwind classes
 */
const ContributionHeatmap = ({ activity = [] }) => {
  const { darkMode } = useTheme();

  /* ------------------------------
   * 1. Prepare a Map for O(1) lookups
   * ---------------------------- */
  const contributionsMap = useMemo(() => {
    const map = new Map();
    activity.forEach(({ date, count }) => {
      if (date) map.set(date, count);
    });
    return map;
  }, [activity]);

  /* ------------------------------
   * 2. Local state – selected period
   * ---------------------------- */
  const currentYear = new Date().getFullYear();
  const yearOptions = ['current', ...Array.from({ length: 5 }, (_, i) => currentYear - i)];
  const [selectedYear, setSelectedYear] = useState('current');

  /* ------------------------------
   * 3. Derived data for selected period
   * ---------------------------- */
  const today = useMemo(() => new Date(), []);

  const periodContributions = useMemo(() => {
    const map = new Map();

    if (selectedYear === 'current') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setDate(oneYearAgo.getDate() + 1);

      contributionsMap.forEach((cnt, dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        if (d >= oneYearAgo && d <= today) map.set(dateStr, cnt);
      });
    } else {
      contributionsMap.forEach((cnt, dateStr) => {
        if (dateStr.startsWith(String(selectedYear))) map.set(dateStr, cnt);
      });
    }
    return map;
  }, [selectedYear, contributionsMap, today]);

  /* ------------------------------
   * 4. Stats helpers
   * ---------------------------- */
  const totalSubmissions = useMemo(
    () => Array.from(periodContributions.values()).reduce((s, c) => s + c, 0),
    [periodContributions]
  );
  const activeDays = periodContributions.size;

  const maxStreak = useMemo(() => {
    if (periodContributions.size === 0) return 0;
    const sorted = Array.from(periodContributions.keys()).sort();
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24);
      if (diff === 1) cur += 1;
      else cur = 1;
      if (cur > max) max = cur;
    }
    return max;
  }, [periodContributions]);

  /* ------------------------------
   * 5. Color helper
   * ---------------------------- */
  const getColorClass = (count) => {
    if (!count) return darkMode ? 'bg-gray-700' : 'bg-gray-200';
    if (count <= 5) return 'bg-green-200';
    if (count <= 12) return 'bg-green-400';
    if (count <= 20) return 'bg-green-600';
    return 'bg-green-800';
  };

  /* ------------------------------
   * 6. Render month blocks
   * ---------------------------- */
  const renderMonthBlock = (idx) => {
    const monthOffset = 11 - idx;
    let monthDate;
    if (selectedYear === 'current') {
      monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    } else {
      monthDate = new Date(parseInt(selectedYear, 10), 11 - idx, 1);
    }

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let j = 0; j < firstDay.getDay(); j++) {
      cells.push(<div key={`pad-${j}`} style={{ visibility: 'hidden' }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      if (cellDate > today) continue;
      const iso = cellDate.toISOString().slice(0, 10);
      const cnt = periodContributions.get(iso) || 0;
      cells.push(
        <div
          key={iso}
          className={`heatmap-cell ${getColorClass(cnt)}`}
          title={`${cnt} submission${cnt === 1 ? '' : 's'} on ${cellDate.toDateString()}`}
        />
      );
    }

    return (
      <div key={idx} className="flex flex-col items-center">
        <div className={`text-xs mb-2 text-center w-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {monthDate.toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="grid grid-rows-7 grid-flow-col gap-0.5 month-grid">{cells}</div>
      </div>
    );
  };

  /* ------------------------------
   * 7. Render JSX
   * ---------------------------- */
  return (
    <div className={`rounded-lg shadow-sm border p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
      {/* Header – stats & selector */}
      <div className="flex justify-between items-center mb-4 text-sm flex-wrap gap-2">
        <div className="flex items-center">
          <span className={`text-base font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {totalSubmissions.toLocaleString()} submissions
          </span>
        </div>
        <div className="flex items-center space-x-4 text-gray-500">
          <span>
            Active days:{' '}
            <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{activeDays.toLocaleString()}</span>
          </span>
          <span>
            Max streak:{' '}
            <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{maxStreak}</span>
          </span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-auto p-1.5 ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : ''}`}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y === 'current' ? 'Current' : y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex justify-between items-start overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        {Array.from({ length: 12 }).map((_, idx) => renderMonthBlock(idx))}
      </div>

      {/* Legend */}
      <div className="flex justify-end items-center mt-4 text-xs">
        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-200 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-400 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-600 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-800 mx-1" />
        <span className={`${darkMode ? 'text-gray-200' : 'text-gray-500'}`}>More</span>
      </div>

      {/* Inline styles for cell hover */}
      <style>{`
        .heatmap-cell {
          width: 11px;
          height: 11px;
          border-radius: 2px;
          transition: transform 0.2s ease-in-out;
        }
        .heatmap-cell:hover {
          transform: scale(1.2);
          border: 1px solid ${darkMode ? '#E2E8F0' : '#2d3748'};
        }
        .month-grid { grid-auto-flow: column; }
      `}</style>
    </div>
  );
};

export default ContributionHeatmap;
