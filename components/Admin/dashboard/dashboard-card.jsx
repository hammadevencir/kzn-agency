'use client';

import React from 'react';
import { YellowChartIcon, BlueChartIcon, OrangeChartIcon, GreenChartIcon } from '@/components/icons';

const DashboardCard = ({ 
  title, 
  value, 
  showGraph = false, 
  graphColor = 'yellow',
  className = '' 
}) => {
  const getGraphSvg = (color) => {
    const graphs = {
      yellow: <YellowChartIcon width={100} height={44} />,
      blue: <BlueChartIcon width={100} height={44} />,
      orange: <OrangeChartIcon width={100} height={44} />,
      green: <GreenChartIcon width={100} height={44} />
    };
    return graphs[color] || graphs.yellow;
  };

  return (
    <div className={`bg-[#161D26] p-4 border-quaternary/20 rounded-lg border ${className}`} style={{ minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flexShrink: 0 }}>
          <h3 style={{ whiteSpace: 'nowrap' }} className="text-[14px] font-light text-quaternary mb-3">{title}</h3>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        {showGraph && (
          <div style={{ flexShrink: 1, overflow: 'hidden', minWidth: 0 }}>
            {getGraphSvg(graphColor)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;