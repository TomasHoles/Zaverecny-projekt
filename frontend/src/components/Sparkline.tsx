import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showArea?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  fillColor = 'rgba(59, 130, 246, 0.1)',
  showArea = true
}) => {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = showArea
    ? `0,${height} ${points} ${width},${height}`
    : '';

  return (
    <svg width={width} height={height} className="sparkline">
      {showArea && (
        <polygon
          points={areaPoints}
          fill={fillColor}
          stroke="none"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
