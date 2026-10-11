"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SalesChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EFECE2" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6E6B62", fontFamily: "Cairo" }} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: "#6E6B62" }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
          <Tooltip cursor={{ fill: "rgba(255,210,31,.18)" }} itemStyle={{ color: "#131210", fontWeight: 700 }}
            contentStyle={{ borderRadius: 14, border: "1px solid #E9E6DA", fontFamily: "Cairo", direction: "rtl", boxShadow: "0 8px 24px -12px rgba(0,0,0,.2)" }}
            formatter={(v, k) => (k === "revenue" ? [`${Number(v).toLocaleString("en-US")} ل.س`, "المبيعات"] : [v, "الطلبات"])} labelStyle={{ fontWeight: 800 }} />
          <Bar dataKey="revenue" radius={[8, 8, 3, 3]} maxBarSize={36}>
            {data.map((d, i) => <Cell key={d.day} fill={i === data.length - 1 ? "#FFD21F" : "#131210"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
