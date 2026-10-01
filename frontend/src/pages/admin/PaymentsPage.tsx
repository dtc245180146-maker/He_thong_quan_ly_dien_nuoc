import React, { useEffect, useState } from 'react';
import { paymentsApi, invoicesApi } from '../../api/client';
import { Payment, Invoice } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CreditCard, DollarSign, Calendar, CheckCircle2, AlertCircle, Plus, Home } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'DEBT' | 'HISTORY'>('DEBT');
  const [isLoading, setIsLoading] = useState(true);

  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState('CHUYỂN KHOẢN');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');

  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [paymentsData, invoicesData] = await Promise.all([
        paymentsApi.getAll(),
        invoicesApi.getAll(),
      ]);
      setPayments(paymentsData);
      setUnpaidInvoices(invoicesData.filter((i) => i.status !== 'PAID'));
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải dữ liệu thanh toán.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPayModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setAmount(inv.remaining_amount);
    setMethod('CHUYỂN KHOẢN');
    setCode('');
    setNotes('');
    setIsPayModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (amount <= 0) {
      error('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }
    if (amount > selectedInvoice.remaining_amount) {
      error(`Số tiền thanh toán vượt quá nợ còn lại (${selectedInvoice.remaining_amount.toLocaleString()}đ).`);
      return;
    }

    try {
      await paymentsApi.create({
        invoice_id: selectedInvoice.id,
        amount: Number(amount),
        payment_method: method,
        transaction_code: code,
        notes: notes,
      });
      success(`Đã ghi nhận thanh toán ${amount.toLocaleString()} VNĐ cho ${selectedInvoice.invoice_code}`);
      setIsPayModalOpen(false);
      loadData();
    } catch (e: any) {
      error(e.message || 'Lỗi khi ghi nhận thanh toán.');
    }
  };

  const totalDebt = unpaidInvoices.reduce((acc, i) => acc + i.remaining_amount, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Thanh Toán & Quản Lý Công Nợ</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi danh sách các hóa đơn còn nợ và ghi nhận các giao dịch thanh toán tiền điện nước.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Tổng công nợ chưa thu</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {totalDebt.toLocaleString()} <span className="text-sm font-normal">VNĐ</span>
            </div>
            <span className="text-xs text-rose-700 font-medium">
              Từ {unpaidInvoices.length} hóa đơn chưa tất toán
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-600">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tổng tiền đã thu thực tế</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {totalCollected.toLocaleString()} <span className="text-sm font-normal">VNĐ</span>
            </div>
            <span className="text-xs text-emerald-700 font-medium">
              Đã ghi nhận qua {payments.length} lượt giao dịch
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('DEBT')}
          className={`py-3 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'DEBT'
              ? 'border-rose-500 text-rose-600 bg-rose-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>Hóa đơn chờ thanh toán ({unpaidInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-3 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'HISTORY'
              ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <span>Lịch sử các lần thu tiền ({payments.length})</span>
        </button>
      </div>

      {/* Tab 1: Unpaid Invoices */}
      {activeTab === 'DEBT' && (
        <Card>
          {isLoading ? (
            <LoadingSpinner text="Đang nạp danh sách nợ..." />
          ) : unpaidInvoices.length === 0 ? (
            <EmptyState
              title="Không có công nợ"
              description="Tuyệt vời! Tất cả các hộ/phòng đều đã hoàn tất thanh toán hóa đơn."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hóa đơn / Phòng</th>
                    <th className="py-3 px-4">Kỳ hóa đơn</th>
                    <th className="py-3 px-4">Tổng hóa đơn</th>
                    <th className="py-3 px-4">Đã trả</th>
                    <th className="py-3 px-4">Số nợ còn lại</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thu tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div>{inv.invoice_code}</div>
                        <div className="text-xs text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                          <Home className="w-3.5 h-3.5" />
                          <span>{inv.room_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{inv.period}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {inv.total_amount.toLocaleString()}đ
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold text-xs">
                        {inv.paid_amount.toLocaleString()}đ
                      </td>
                      <td className="py-3 px-4 font-black text-rose-600 text-sm">
                        {inv.remaining_amount.toLocaleString()}đ
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={inv.status}>
                          {inv.status === 'PARTIALLY_PAID' ? 'Còn nợ một phần' : 'Chưa thanh toán'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenPayModal(inv)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thu tiền</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Payments History */}
      {activeTab === 'HISTORY' && (
        <Card>
          {isLoading ? (
            <LoadingSpinner text="Đang nạp lịch sử giao dịch..." />
          ) : payments.length === 0 ? (
            <EmptyState
              title="Chưa có giao dịch"
              description="Hiện chưa có bản ghi thanh toán nào được thực hiện."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Hóa đơn liên quan</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Số tiền thanh toán</th>
                    <th className="py-3 px-4">Hình thức</th>
                    <th className="py-3 px-4">Mã giao dịch / Ghi chú</th>
                    <th className="py-3 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(p.payment_date).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{p.invoice_code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.room_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                        +{p.amount.toLocaleString()} VNĐ
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {p.transaction_code ? <b>{p.transaction_code}</b> : p.notes || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Thành công</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Ghi nhận thanh toán: ${selectedInvoice.invoice_code}`}
          subtitle={`Phòng ${selectedInvoice.room_code} | Số nợ còn: ${selectedInvoice.remaining_amount.toLocaleString()} VNĐ`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                max={selectedInvoice.remaining_amount}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-base font-black text-emerald-700 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phương thức thanh toán</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="CHUYỂN KHOẢN">Chuyển khoản ngân hàng</option>
                <option value="TIỀN MẶT">Tiền mặt tại văn phòng</option>
                <option value="VÍ ĐIỆN TỬ">Ví điện tử</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mã tham chiếu / Giao dịch</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: FT26278819..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Cư dân nộp tiền mặt kỳ..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
              >
                Lưu Giao Dịch
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
