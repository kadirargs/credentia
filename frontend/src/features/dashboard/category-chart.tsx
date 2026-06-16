"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";

type CategoryDatum = {
  category: string;
  amount: number;
  color: string;
};

export function CategoryChart({ data }: { data: CategoryDatum[] }) {
  const { formatCurrency } = useCurrencyFormatter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" style={{ width: "100%", height: 290 }} />;
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={290}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" innerRadius={68} outerRadius={112} paddingAngle={3}>
            {data.map((entry) => (
              <Cell fill={entry.color} key={entry.category} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
