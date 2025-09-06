import React, { useMemo, useState } from 'react';

/**
 * ContributionHeatmap component
 *
 * Props:
 *  - activity: Array of objects with shape { date: 'YYYY-MM-DD', count: number }
 *
 * Features:
 *  • Total submissions, active days & max streak counters
 *  • Year selector (current = rolling last 12 months)
 *  • Month-wise grid built with pure Tailwind CSS
 *  • Light & Dark mode support
 */
const ContributionHeatmap = ({ activity = [] }) => {

  /* ------------------------------------------------------------
   * 1. Prepare a Map for O(1) look-ups (date -> count)
   * ---------------------------------------------------------- */
  const contributionsMap = useMemo(() => {
    const map = new Map();
    activity.forEach(({ date,count }) => {
      if (date) map.set(date, count);
    });
    return map;
  }, [activity]);

  console.log("map: ",contributionsMap)

  /* ------------------------------------------------------------
   * 2. Local state – currently selected year
   * ---------------------------------------------------------- */
  const currentYear = new Date().getFullYear();
  const yearOptions = ['current', ...Array.from({ length: 5 }, (_, i) => currentYear - i)];
  const [selectedYear, setSelectedYear] = useState('current');

  /* ------------------------------------------------------------
   * 3. Derived data for the selected period
   * ---------------------------------------------------------- */
  const today = useMemo(() => new Date(), []);

  const periodContributions = useMemo(() => {
    const map = new Map();

    if (selectedYear === 'current') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setDate(oneYearAgo.getDate() + 1); // include today

      contributionsMap.forEach((cnt, dateStr) => {
        const d = new Date(dateStr + 'T00:00:00'); // ISO format
        if (d >= oneYearAgo && d <= today) map.set(dateStr, cnt);
      });
    } else {
      contributionsMap.forEach((cnt, dateStr) => {
        if (dateStr.startsWith(String(selectedYear))) map.set(dateStr, cnt);
      });
    }
    return map;
  }, [selectedYear, contributionsMap, today]);

  console.log("period cotri :",periodContributions)

  /* ------------------------------------------------------------
   * 4. Stats helpers
   * ---------------------------------------------------------- */
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
      cur = diff === 1 ? cur + 1 : 1;
      if (cur > max) max = cur;
    }
    return max;
  }, [periodContributions]);

  /* ------------------------------------------------------------
   * 5. Color helper – return Tailwind class based on count
   * ---------------------------------------------------------- */
  const getColorClass = (count) => {
    if (!count) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 5) return 'bg-green-200 dark:bg-green-800';
    if (count <= 12) return 'bg-green-400 dark:bg-green-600';
    if (count <= 20) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-400';
  };

  /* ------------------------------------------------------------
   * 6. Render helpers – build month blocks
   * ---------------------------------------------------------- */
  const renderMonthBlock = (idx) => {
    // idx 0 = oldest, idx 11 = current month
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

    // Add leading blank cells to align weekday
    for (let j = 0; j < firstDay.getDay(); j++) {
      cells.push(<div key={`pad-${j}`} style={{ visibility: 'hidden' }} />);
    }

    // Add actual contribution cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      
      if (cellDate > today) continue; // don't render future dates
      const iso = cellDate.toISOString()

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
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center w-full">
          {monthDate.toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="grid grid-rows-7 grid-flow-col gap-0.5 month-grid">{cells}</div>
      </div>
    );
  };

  /* ------------------------------------------------------------
   * 7. Final JSX – layout
   * ---------------------------------------------------------- */
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header – stats & year selector */}
      <div className="flex justify-between items-center mb-4 text-sm flex-wrap gap-2">
        <div className="flex items-center">
          <span className="text-base font-semibold text-gray-800 dark:text-white">
            {totalSubmissions.toLocaleString()} submissions
          </span>
        </div>
        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
          <span>
            Active days: <span className="text-gray-800 dark:text-white font-medium">{activeDays.toLocaleString()}</span>
          </span>
          <span>
            Max streak: <span className="text-gray-800 dark:text-white font-medium">{maxStreak}</span>
          </span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-auto p-1.5"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y === 'current' ? 'Current' : y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap grid – 12 months */}
      <div className="flex justify-between items-start overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        {Array.from({ length: 12 }).map((_, idx) => renderMonthBlock(idx))}
      </div>

      {/* Legend */}
      <div className="flex justify-end items-center mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500 mx-1" />
        <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-400 mx-1" />
        <span>More</span>
      </div>

      {/* Inline styles for heatmap cells */}
      <style>{`
        .heatmap-cell {
          width: 11px;
          height: 11px;
          border-radius: 2px;
          transition: transform 0.2s ease-in-out;
        }
        .heatmap-cell:hover {
          transform: scale(1.2);
          border: 1px solid #2d3748; /* gray-800 for hover */
        }
        .month-grid { grid-auto-flow: column; }
      `}</style>
    </div>
  );
};

export default ContributionHeatmap;
