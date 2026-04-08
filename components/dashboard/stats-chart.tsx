"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function StatsChart({
  data
}: {
  data: { variant: string; conversionRate: number; visitors: number }[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="variant" stroke="#6b6b63" />
          <YAxis stroke="#6b6b63" tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Bar dataKey="conversionRate" fill="#135c43" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
