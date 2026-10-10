import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMoneyCompact, STAGE_COLOR, STAGE_LABEL } from '../../lib/format';
import type { DashboardSummary } from '../../lib/types';
import { EmptyState } from '../ui/States';

interface Props {
  data: DashboardSummary['pipelineByStage'];
}

export function PipelineChart({ data }: Props) {
  const rows = data.map((d) => ({ ...d, label: STAGE_LABEL[d.stage] }));
  if (rows.every((r) => r.value === 0)) {
    return <EmptyState icon={<BarChart3 />} message="No pipeline value yet." className="py-10" />;
  }

  return (
    <div className="h-64 w-full" role="img" aria-label={`Pipeline value by stage: ${rows.map((r) => `${r.label} ${formatMoney(r.value)}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#e8edf3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7d8fa9', fontSize: 13 }} />
          <YAxis
            tickFormatter={(v: number) => formatMoneyCompact(v)}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: '#7d8fa9', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: '#f6f9fc' }}
            formatter={(value, _name, item) => [
              `${formatMoney(Number(value))} · ${(item?.payload as { count?: number })?.count ?? 0} deals`,
              'Value',
            ]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 8px 24px rgba(16,42,74,.08)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {rows.map((r) => (
              <Cell key={r.stage} fill={STAGE_COLOR[r.stage]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
