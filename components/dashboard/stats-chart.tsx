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
          <CartesianGrid vertical={false} stroke="#ece7f7" strokeDasharray="4 4" />
          <XAxis dataKey="variant" stroke="#7b748c" tickLine={false} axisLine={false} />
          <YAxis stroke="#7b748c" tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Bar dataKey="conversionRate" fill="#ff5864" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
