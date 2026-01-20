// src/components/reservoirs/HavlenaChart.tsx

import React from 'react';
import { 
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, Label 
} from 'recharts';

// Definisi Tipe Data Props Chart
interface ChartProps {
  data: {
    x_points: number[];
    y_points: number[];
    regression_line: number[];
  };
  scenario: string;
}

export const HavlenaChart: React.FC<ChartProps> = ({ data, scenario }) => {
  // 1. Transformasi Data: Array terpisah -> Array of Objects
  const chartData = data.x_points.map((x, i) => ({
    x_val: x,
    y_actual: data.y_points[i],
    y_reg: data.regression_line[i]
  }));

  // 2. Label Sumbu Dinamis
  const getLabels = (scen: string) => {
    switch (scen) {
      case "F vs Eo": return { x: "Eo (Expansion)", y: "F (Withdrawal)" };
      case "F vs (Eo + mEg)": return { x: "Eo + mEg", y: "F" };
      case "F/Eo vs Eg/Eo": return { x: "Eg / Eo", y: "F / Eo" };
      case "F vs Total Expansion": return { x: "Total Expansion (Et)", y: "F" };
      default: return { x: "X", y: "Y" };
    }
  };
  const labels = getLabels(scenario);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
        
        <XAxis type="number" dataKey="x_val" domain={['auto', 'auto']}>
           <Label value={labels.x} offset={0} position="bottom" />
        </XAxis>
        
        <YAxis type="number" domain={['auto', 'auto']}>
           <Label value={labels.y} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
        </YAxis>
        
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend verticalAlign="top" height={36}/>
        
        <Scatter name="Production Data" dataKey="y_actual" fill="#0d6efd" shape="circle" />
        <Line type="monotone" dataKey="y_reg" stroke="#dc3545" dot={false} strokeWidth={2} name="Regression Line" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};