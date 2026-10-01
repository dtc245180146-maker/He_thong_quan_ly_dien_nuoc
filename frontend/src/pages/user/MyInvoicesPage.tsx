import React, { useEffect, useState } from 'react';
import { invoicesApi } from '../../api/client';
import { Invoice, InvoiceDetail } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { FileText, Eye, Zap, Droplets, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

export const MyInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { error } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await invoicesApi.getAll();
      setInvoices(data);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải danh sách hóa đơn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const detail = await invoicesApi.getById(id);
      setSelectedInvoice(detail);
    } catch (e: any) {
      error(e.message || 'Không thể xem chi tiết hóa đơn.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-sky-600" />
          <span>Hóa Đơn Tiền Điện Nước Của Bạn</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tra cứu chi tiết các kỳ hóa đơn, mức tiêu thụ điện nước và tình trạng thanh toán.
        </p>
      </div>

      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp danh sách hóa đơn..." />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="Chưa có hóa đơn nào"
            description="Phòng của bạn hiện chưa phát sinh hóa đơn nào."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kỳ hóa đơn</th>
                  <th className="py-3 px-4">Mã hóa đơn</th>
                  <th className="py-3 px-4">Điện năng (kWh)</th>
                  <th className="py-3 px-4">Khối lượng nước (m³)</th>
                  <th className="py-3 px-4">Tổng tiền (VNĐ)</th>
                  <th className="py-3 px-4">Tình trạng thanh toán</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-mono text-xs border border-sky-100">
                        {inv.period}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600 text-xs">
                      {inv.invoice_code}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-amber-700">
                      {inv.electricity_usage} kWh ({inv.electricity_cost.toLocaleString()}đ)
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-cyan-700">
                      {inv.water_usage} m³ ({inv.water_cost.toLocaleString()}đ)
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      {inv.total_amount.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={inv.status}>
                        {inv.status === 'PAID'
                          ? 'Đã thanh toán đủ'
                          : inv.status === 'PARTIALLY_PAID'
                          ? `Còn nợ: ${inv.remaining_amount.toLocaleString()}đ`
                          : 'Chưa thanh toán'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewDetail(inv.id)}
                        className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem hóa đơn</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Hóa Đơn Điện Nước: ${selectedInvoice.invoice_code}`}
          subtitle={`Kỳ ${selectedInvoice.period} | Hạn nộp: ${selectedInvoice.due_date || 'Theo thông báo'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Electricity */}
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200">
              <div className="flex items-center justify-between font-bold text-amber-900 text-sm mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Tiền Điện: {selectedInvoice.electricity_usage} kWh
                </span>
                <span className="text-base font-black">
                  {selectedInvoice.electricity_cost.toLocaleString()} VNĐ
                </span>
              </div>
              {selectedInvoice.electricity_details && selectedInvoice.electricity_details.length > 0 && (
                <table className="w-full text-xs text-left bg-white rounded-xl overflow-hidden border border-amber-100 mt-2">
                  <thead className="bg-amber-100/60 text-amber-950 font-bold">
                    <tr>
                      <th className="py-1.5 px-3">Bậc giá</th>
                      <th className="py-1.5 px-3">Đơn giá</th>
                      <th className="py-1.5 px-3">Số kWh</th>
                      <th className="py-1.5 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {selectedInvoice.electricity_details.map((t, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-3 text-slate-700">{t.tier_name}</td>
                        <td className="py-1.5 px-3 font-mono">{t.unit_price.toLocaleString()}đ</td>
                        <td className="py-1.5 px-3 font-bold">{t.usage_in_tier} kWh</td>
                        <td className="py-1.5 px-3 text-right font-bold">{t.cost.toLocaleString()}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Water */}
            <div className="p-4 rounded-2xl bg-cyan-50/40 border border-cyan-200">
              <div className="flex items-center justify-between font-bold text-cyan-900 text-sm mb-2">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 fill-cyan-500 text-cyan-500" />
                  Tiền Nước: {selectedInvoice.water_usage} m³
                </span>
                <span className="text-base font-black">
                  {selectedInvoice.water_cost.toLocaleString()} VNĐ
                </span>
              </div>
              {selectedInvoice.water_details && selectedInvoice.water_details.length > 0 && (
                <table className="w-full text-xs text-left bg-white rounded-xl overflow-hidden border border-cyan-100 mt-2">
                  <thead className="bg-cyan-100/60 text-cyan-950 font-bold">
                    <tr>
                      <th className="py-1.5 px-3">Bậc giá</th>
                      <th className="py-1.5 px-3">Đơn giá</th>
                      <th className="py-1.5 px-3">Số m³</th>
                      <th className="py-1.5 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-50">
                    {selectedInvoice.water_details.map((t, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-3 text-slate-700">{t.tier_name}</td>
                        <td className="py-1.5 px-3 font-mono">{t.unit_price.toLocaleString()}đ</td>
                        <td className="py-1.5 px-3 font-bold">{t.usage_in_tier} m³</td>
                        <td className="py-1.5 px-3 text-right font-bold">{t.cost.toLocaleString()}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Total Balance */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Tổng tiền cần thanh toán</span>
                <span className="text-xl font-black text-white">
                  {selectedInvoice.total_amount.toLocaleString()} VNĐ
                </span>
              </div>
              <div className="text-right">
                <Badge status={selectedInvoice.status}>
                  {selectedInvoice.status === 'PAID'
                    ? 'Đã thanh toán đủ'
                    : selectedInvoice.status === 'PARTIALLY_PAID'
                    ? 'Còn nợ'
                    : 'Chưa thanh toán'}
                </Badge>
                {selectedInvoice.remaining_amount > 0 && (
                  <div className="text-xs text-rose-400 font-bold mt-1">
                    Còn nợ: {selectedInvoice.remaining_amount.toLocaleString()}đ
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
