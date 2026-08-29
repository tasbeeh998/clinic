import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Wallet, AlertCircle, ReceiptText, ClipboardList, UsersRound, CalendarDays } from 'lucide-react';
import { reportsService } from '../services/reports.service';

const COLORS = ['#102F63', '#173B78', '#4B5694', '#8991A6', '#C4362B', '#C98200'];

const PAYMENT_METHOD_LABELS: Record<string, string> = { CASH: 'كاش', VISA: 'فيزا', KNET: 'كي نت', OTHER: 'أخرى' };
const PAYMENT_STATUS_LABELS: Record<string, string> = { UNPAID: 'غير مدفوعة', PARTIALLY_PAID: 'مدفوعة جزئيًا', PAID: 'مدفوعة بالكامل' };
const VISIT_TYPE_LABELS: Record<string, string> = { CHECKUP: 'كشف', FOLLOW_UP: 'متابعة', OTHER: 'أخرى' };
const APPT_STATUS_LABELS: Record<string, string> = { BOOKED: 'محجوز', CONFIRMED: 'مؤكد', DONE: 'مكتمل', CANCELLED: 'ملغي', NO_SHOW: 'لم يحضر' };

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function KpiCard({ icon: Icon, label, value, suffix }: { icon: typeof TrendingUp; label: string; value: string | number; suffix?: string }) {
  return (
    <div className="ui-card p-4">
      <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
        <Icon size={15} strokeWidth={1.75} />
        {label}
      </div>
      <div className="text-xl font-bold text-[#102F63]">
        {value}{suffix && <span className="text-sm text-[#94A3B8] font-normal"> {suffix}</span>}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [from, setFrom] = useState(todayMinus(29));
  const [to, setTo] = useState(today());

  const summary = useQuery({ queryKey: ['reports-summary', from, to], queryFn: () => reportsService.getSummary(from, to) });
  const revenueTimeseries = useQuery({ queryKey: ['reports-revenue-ts', from, to], queryFn: () => reportsService.getRevenueTimeseries(from, to) });
  const paymentMethods = useQuery({ queryKey: ['reports-payment-methods', from, to], queryFn: () => reportsService.getPaymentMethods(from, to) });
  const invoiceStatus = useQuery({ queryKey: ['reports-invoice-status', from, to], queryFn: () => reportsService.getInvoiceStatusBreakdown(from, to) });
  const serviceUsage = useQuery({ queryKey: ['reports-service-usage', from, to], queryFn: () => reportsService.getServiceUsage(from, to) });
  const visitTypes = useQuery({ queryKey: ['reports-visit-types', from, to], queryFn: () => reportsService.getVisitTypes(from, to) });
  const appointmentStatus = useQuery({ queryKey: ['reports-appt-status', from, to], queryFn: () => reportsService.getAppointmentStatus(from, to) });
  const outstanding = useQuery({ queryKey: ['reports-outstanding'], queryFn: () => reportsService.getOutstandingInvoices(1, 8) });

  const s = summary.data;

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#102F63]">التقارير والتحليلات</h1>
          <p className="text-sm text-[#64748B] mt-1">تحليلات شاملة لأداء العيادة ومؤشرات النمو المالية</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ui-input w-auto" />
          <span className="text-[#94A3B8] text-sm">إلى</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ui-input w-auto" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <KpiCard icon={TrendingUp} label="إجمالي الإيرادات" value={s ? s.totalRevenue.toFixed(0) : '—'} suffix="د.ك" />
        <KpiCard icon={Wallet} label="إجمالي المدفوعات" value={s ? s.totalCollected.toFixed(0) : '—'} suffix="د.ك" />
        <KpiCard icon={AlertCircle} label="صافي الأرباح" value={s ? (s.totalRevenue - s.outstandingAmount).toFixed(0) : '—'} suffix="د.ك" />
        <KpiCard icon={UsersRound} label="عدد المرضى" value={s ? s.newPatients : '—'} />
        <KpiCard icon={CalendarDays} label="إجمالي المواعيد" value={s ? s.totalAppointments : '—'} />
        <KpiCard icon={ClipboardList} label="إجمالي الزيارات" value={s ? s.totalVisits : '—'} />
        <KpiCard icon={ReceiptText} label="الفواتير الصادرة" value={s ? s.totalInvoices : '—'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="ui-card p-5 lg:col-span-2">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">الإيرادات والمدفوعات</h2>
          {revenueTimeseries.isLoading ? (
            <div className="ui-skeleton h-64 rounded-lg" />
          ) : revenueTimeseries.data && revenueTimeseries.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueTimeseries.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="الإيرادات" stroke="#102F63" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="collected" name="المدفوعات" stroke="#4B5694" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="ui-empty-state">لا توجد بيانات في هذه الفترة</div>
          )}
        </div>

        {/* Payment methods donut */}
        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">طرق الدفع</h2>
          {paymentMethods.isLoading ? (
            <div className="ui-skeleton h-64 rounded-lg" />
          ) : paymentMethods.data && paymentMethods.data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={paymentMethods.data} dataKey="amount" nameKey="method" innerRadius={45} outerRadius={75}>
                    {paymentMethods.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} د.ك`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {paymentMethods.data.map((row, i) => (
                  <div key={row.method} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {PAYMENT_METHOD_LABELS[row.method] || row.method}
                    </span>
                    <span className="font-medium text-[#1F2430]">{row.amount.toFixed(2)} د.ك</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="ui-empty-state">لا توجد مدفوعات في هذه الفترة</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Service usage table */}
        <div className="ui-card p-5 lg:col-span-2 overflow-x-auto">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">أعلى الخدمات من حيث الإيرادات</h2>
          {serviceUsage.isLoading ? (
            <div className="ui-skeleton h-40 rounded-lg" />
          ) : serviceUsage.data && serviceUsage.data.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#94A3B8] text-xs border-b border-[#E2E8F0]">
                  <th className="text-right py-2 font-medium">الخدمة</th>
                  <th className="text-center py-2 font-medium">عدد المرات</th>
                  <th className="text-left py-2 font-medium">الإيرادات (د.ك)</th>
                </tr>
              </thead>
              <tbody>
                {serviceUsage.data.map((row) => (
                  <tr key={row.serviceName} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="py-2.5 text-[#1F2430]">{row.serviceName}</td>
                    <td className="py-2.5 text-center text-[#64748B]">{row.timesUsed}</td>
                    <td className="py-2.5 text-left font-medium text-[#1F2430]">{row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="ui-empty-state">لا توجد بيانات في هذه الفترة</div>
          )}
        </div>

        {/* Invoice status donut */}
        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">توزيع الفواتير حسب الحالة</h2>
          {invoiceStatus.isLoading ? (
            <div className="ui-skeleton h-48 rounded-lg" />
          ) : invoiceStatus.data && invoiceStatus.data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={invoiceStatus.data} dataKey="count" nameKey="paymentStatus" innerRadius={40} outerRadius={70}>
                    {invoiceStatus.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {invoiceStatus.data.map((row, i) => (
                  <div key={row.paymentStatus} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {PAYMENT_STATUS_LABELS[row.paymentStatus] || row.paymentStatus}
                    </span>
                    <span className="font-medium text-[#1F2430]">{row.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="ui-empty-state">لا توجد فواتير في هذه الفترة</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Visit types */}
        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">أنواع الزيارات</h2>
          {visitTypes.data && visitTypes.data.length > 0 ? (
            <div className="space-y-2">
              {visitTypes.data.map((row) => (
                <div key={row.type} className="flex items-center justify-between text-sm">
                  <span className="text-[#1F2430]">{VISIT_TYPE_LABELS[row.type] || row.type}</span>
                  <span className="font-medium text-[#102F63]">{row.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-empty-state">لا توجد زيارات في هذه الفترة</div>
          )}
        </div>

        {/* Appointment status */}
        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">حالة المواعيد</h2>
          {appointmentStatus.data && appointmentStatus.data.length > 0 ? (
            <div className="space-y-2">
              {appointmentStatus.data.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-[#1F2430]">{APPT_STATUS_LABELS[row.status] || row.status}</span>
                  <span className="font-medium text-[#102F63]">{row.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-empty-state">لا توجد مواعيد في هذه الفترة</div>
          )}
        </div>

        {/* Outstanding invoices */}
        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4">أعلى الفواتير المستحقة</h2>
          {outstanding.data && outstanding.data.data.length > 0 ? (
            <div className="space-y-2">
              {outstanding.data.data.slice(0, 6).map((row) => (
                <div key={row.id} className="flex items-center justify-between text-sm border-b border-[#E2E8F0] last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="text-[#1F2430]">{row.patient.fullNameAr}</div>
                    <div className="text-xs text-[#94A3B8]">{row.invoiceNumber}</div>
                  </div>
                  <span className="font-medium text-[#C4362B]">{parseFloat(row.remaining).toFixed(2)} د.ك</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-empty-state">لا توجد مستحقات حاليًا</div>
          )}
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] text-center">جميع التقارير يتم احتسابها بناءً على البيانات الفعلية المسجلة في النظام.</p>
    </div>
  );
}
