import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { QrCode, ScanLine, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import { api } from '../lib/api';
import type { DashboardSummary } from '../lib/types';

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card glow>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-text-muted mb-1.5">{label}</div>
          <div className="text-2xl font-semibold font-mono tabular-nums">{value}</div>
        </div>
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center border"
          style={{ backgroundColor: `${accent}1A`, borderColor: `${accent}4D`, color: accent }}
        >
          <Icon size={17} />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardSummary>('/api/v1/dashboard/summary')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="text-sm text-verify-danger bg-verify-danger/10 border border-verify-danger/30 rounded-lg px-4 py-3">
        Không tải được số liệu: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <Loader2 size={16} className="animate-spin" /> Đang tải dashboard...
      </div>
    );
  }

  // Gop du lieu dailySeries (moi ngay nhieu dong theo result) thanh 1 dong/ngay
  // de ve chart, chi lay valid_first cho duong xu huong chinh.
  const chartData = Object.values(
    data.dailySeries.reduce<Record<string, { day: string; validFirst: number; duplicate: number }>>(
      (acc, row) => {
        const key = new Date(row.day).toISOString().slice(0, 10);
        if (!acc[key]) acc[key] = { day: key, validFirst: 0, duplicate: 0 };
        if (row.result === 'valid_first') acc[key].validFirst += row.count;
        if (row.result === 'duplicate') acc[key].duplicate += row.count;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => a.day.localeCompare(b.day));

  const suspicionPct = (data.last30Days.suspicionRatio * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">Tổng quan tiêu thụ & tín hiệu gian lận (30 ngày gần nhất)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={QrCode} label="Tổng số mã đã sinh" value={data.totalCodes.toLocaleString()} accent="#3ECFFF" />
        <StatCard icon={ScanLine} label="Đã quét hợp lệ (30 ngày)" value={data.last30Days.validFirst.toLocaleString()} accent="#00E5A0" />
        <StatCard icon={AlertTriangle} label="Tỷ lệ nghi vấn" value={`${suspicionPct}%`} accent="#FFB020" />
        <StatCard icon={Ban} label="Mã đã thu hồi" value={data.revokedCodes.toLocaleString()} accent="#FF4D6D" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Lượt quét hợp lệ theo ngày (14 ngày gần nhất)</h2>
        </div>
        {chartData.length === 0 ? (
          <div className="text-sm text-text-muted py-10 text-center">
            Chưa có dữ liệu quét. Hãy sinh mã và thử quét thử qua API để thấy biểu đồ.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="validGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#8A95A6" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8A95A6" fontSize={12} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                contentStyle={{
                  background: '#131924',
                  border: '1px solid #232C3D',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="validFirst" stroke="#00E5A0" fill="url(#validGradient)" strokeWidth={2} name="Hợp lệ" />
              <Area type="monotone" dataKey="duplicate" stroke="#FFB020" fill="transparent" strokeWidth={1.5} name="Trùng lặp" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-text-muted mb-1">Sản phẩm</div>
          <div className="text-xl font-semibold font-mono">{data.productCount}</div>
        </Card>
        <Card>
          <div className="text-xs text-text-muted mb-1">Lô sản xuất</div>
          <div className="text-xl font-semibold font-mono">{data.batchCount}</div>
        </Card>
        <Card>
          <div className="text-xs text-text-muted mb-1">Mã chưa quét</div>
          <div className="text-xl font-semibold font-mono">{data.unscannedCodes.toLocaleString()}</div>
        </Card>
      </div>
    </div>
  );
}
