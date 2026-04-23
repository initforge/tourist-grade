import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyRevenueRow } from '@shared/lib/bookingReports';

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function DailyRevenueLineChart({
  rows,
  emptyLabel,
}: {
  rows: DailyRevenueRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <div className="py-8 text-center text-sm text-[#2A2421]/40">{emptyLabel}</div>;
  }

  const chartWidth = Math.max(520, rows.length * 96);

  return (
    <div className="space-y-4 min-w-0">
      <div className="h-72 w-full min-w-0 overflow-x-auto overflow-y-hidden">
        <LineChart width={chartWidth} height={288} data={rows} margin={{ top: 16, right: 12, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="daily-revenue-stroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                <stop offset="100%" stopColor="#8C6B16" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E7E1D4" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11, fill: '#6A625C' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value: number) => `${Math.round(value / 1000000)}tr`}
              tick={{ fontSize: 11, fill: '#6A625C' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: '#D4AF37', strokeOpacity: 0.3 }}
              contentStyle={{
                borderRadius: 0,
                borderColor: '#D0C5AF',
                boxShadow: '0 8px 24px rgba(42, 36, 33, 0.08)',
              }}
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value ?? 0)) : `${Number(value ?? 0)} booking`,
                name === 'revenue' ? 'Doanh thu' : 'Số booking',
              ]}
              labelFormatter={(label) => `Ngày ${new Date(label).toLocaleDateString('vi-VN')}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="url(#daily-revenue-stroke)"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
            />
        </LineChart>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {rows.slice(-3).map((item) => (
          <div key={item.date} className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4">
            <p className="text-sm font-medium text-[#2A2421]">
              {new Date(item.date).toLocaleDateString('vi-VN')}
            </p>
            <p className="mt-1 text-[11px] text-[#2A2421]/50">{item.bookingCount} booking</p>
            <p className="mt-2 text-xs font-semibold text-[#D4AF37]">{formatCurrency(item.revenue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
