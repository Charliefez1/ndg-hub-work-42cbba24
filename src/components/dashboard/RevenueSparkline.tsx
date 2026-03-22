import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { formatGBP } from '@/lib/format';

interface RevenueSparklineProps {
  invoices: { status: string; total: number; paid_date: string | null }[] | undefined;
}

export function RevenueSparkline({ invoices }: RevenueSparklineProps) {
  const data = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();

    // Initialise last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    for (const inv of invoices ?? []) {
      if (inv.status !== 'paid' || !inv.paid_date) continue;
      const key = inv.paid_date.slice(0, 7);
      if (key in months) {
        months[key] += Number(inv.total);
      }
    }

    return Object.entries(months).map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
      amount,
    }));
  }, [invoices]);

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex flex-col h-full">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Revenue (6mo)</p>
      <p className="text-2xl font-bold mt-1.5 tracking-tight">{formatGBP(total)}</p>
      <div className="flex-1 mt-2 min-h-[40px]">
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              formatter={(val: number) => [formatGBP(val), 'Revenue']}
              labelStyle={{ fontSize: 11 }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--success))"
              fill="url(#revGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
