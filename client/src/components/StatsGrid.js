import React from 'react';

const StatCard = ({ value, label }) => (
  <div className="stat-card">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const StatsGrid = ({ data }) => {
  const stats = [
    { value: data.word_count, label: 'Words' },
    { value: data.link_counts?.internal || 0, label: 'Internal Links' },
    { value: data.link_counts?.external || 0, label: 'External Links' },
    { value: data.images?.length || 0, label: 'Images' }
  ];

  return (
    <div className="stats-grid">
      {stats.map(({ value, label }) => (
        <StatCard key={label} value={value} label={label} />
      ))}
    </div>
  );
};

export default StatsGrid;
