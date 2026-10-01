import React, { useEffect, useState } from 'react';
import { invoicesApi, roomsApi, paymentsApi } from '../../api/client';
import { Invoice, InvoiceDetail, Room } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Plus,
  FileText,
  DollarSign,
  Calendar,
  Home,
  CheckCircle2,
  Trash2,
  Eye,
  CreditCard,
  Zap,
  Droplets,
  Printer
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    room_id: 0,
    period: new Date().toISOString().substring(0, 7),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    other_fees: 0,
    notes: '',
  });

  // Invoice Detail Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Quick Payment Modal State inside Invoice Detail
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('CHUYỂN KHOẢN');
  const [payNotes, setPayNotes] = useState<string>('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invoicesData, roomsData] = await Promise.all([
        invoicesApi.getAll(),
        roomsApi.getAll(),
      ]);
      setInvoices(invoicesData);
      setRooms(roomsData);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải danh sách hóa đơn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      room_id: rooms.length > 0 ? rooms[0].id : 0,
      period: new Date().toISOString().substring(0, 7),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      other_fees: 0,
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.room_id) {
      error('Vui lòng chọn phòng cần lập hóa đơn.');
      return;
    }
    if (!createForm.period) {
      error('Vui lòng chọn kỳ hóa đơn.');
      return;
    }

    try {
      const newInv = await invoicesApi.create({
        room_id: Number(createForm.room_id),
        period: createForm.period,
        due_date: createForm.due_date,
        other_fees: Number(createForm.other_fees),
        notes: createForm.notes,
      });
      success(`Lập hóa đơn ${newInv.invoice_code} thành công.`);
      setIsCreateModalOpen(false);
      loadData();
    } catch (e: any) {
      error(e.message || 'Không thể lập hóa đơn.');
    }
  };

  const handleViewDetail = async (id: number) => {
    setIsLoadingDetail(true);
    try {
      const detail = await invoicesApi.getById(id);
      setSelectedInvoice(detail);
      setPayAmount(detail.remaining_amount);
    } catch (e: any) {
      error(e.message || 'Lỗi khi xem chi tiết hóa đơn.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (payAmount <= 0) {
      error('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }

    try {
      await paymentsApi.create({
        invoice_id: selectedInvoice.id,
        amount: Number(payAmount),
        payment_method: payMethod,
        notes: payNotes,
      });
      success('Ghi nhận thanh toán thành công!');
      setIsPayModalOpen(false);
      // Reload detail and list
      await handleViewDetail(selectedInvoice.id);
      loadData();
    } catch (e: any) {
      error(e.message || 'Lỗi khi thanh toán.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await invoicesApi.delete(deleteTarget.id);
      success(`Đã xóa hóa đơn ${deleteTarget.invoice_code}.`);
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      error(e.message || 'Không thể xóa hóa đơn.');
    } finally {
      setIsDeleting(false);
    }
  };

  const periods = Array.from(new Set(invoices.map((i) => i.period))).sort().reverse();

  const filteredInvoices = invoices.filter((inv) => {
    const matchesRoom = selectedRoom === 'ALL' || inv.room_id.toString() === selectedRoom;
    const matchesPeriod = selectedPeriod === 'ALL' || inv.period === selectedPeriod;
    const matchesStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
    return matchesRoom && matchesPeriod && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Quản Lý & Lập Hóa Đơn</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tính toán hóa đơn tự động theo chỉ số và biểu giá bậc thang. Theo dõi tình trạng thanh toán và công nợ.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lập Hóa Đơn Kỳ Mới</span>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Phòng:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="py-1 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Tất cả phòng</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.room_code} - {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Kỳ hóa đơn:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="py-1 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Tất cả các kỳ</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  Kỳ {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PARTIALLY_PAID">Còn nợ (Thanh toán 1 phần)</option>
              <option value="PAID">Đã thanh toán đủ</option>
            </select>
          </div>

          <div className="ml-auto text-slate-400 font-medium text-[11px]">
            Tổng số: <b>{filteredInvoices.length}</b> hóa đơn
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp danh sách hóa đơn..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            title="Chưa có hóa đơn nào"
            description="Hãy nhấn 'Lập Hóa Đơn Kỳ Mới' sau khi đã nhập đầy đủ chỉ số cho phòng."
            action={
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Lập hóa đơn
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã hóa đơn</th>
                  <th className="py-3 px-4">Phòng / Kỳ</th>
                  <th className="py-3 px-4">Điện (kWh / Tiền)</th>
                  <th className="py-3 px-4">Nước (m³ / Tiền)</th>
                  <th className="py-3 px-4">Tổng tiền (VNĐ)</th>
                  <th className="py-3 px-4">Đã thu / Còn nợ</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                          <FileText className="w-4 h-4" />
                        </span>
                        <span>{inv.invoice_code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.room_code}</span>
                      </div>
                      <span className="text-xs text-slate-400">Kỳ {inv.period}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-amber-700">{inv.electricity_usage} kWh</span>
                      <div className="font-medium text-slate-600">{inv.electricity_cost.toLocaleString()}đ</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-cyan-700">{inv.water_usage} m³</span>
                      <div className="font-medium text-slate-600">{inv.water_cost.toLocaleString()}đ</div>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      {inv.total_amount.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="text-emerald-700 font-semibold">
                        Thu: {inv.paid_amount.toLocaleString()}đ
                      </div>
                      {inv.remaining_amount > 0 ? (
                        <div className="text-rose-600 font-bold">Nợ: {inv.remaining_amount.toLocaleString()}đ</div>
                      ) : (
                        <div className="text-slate-400">Hết nợ</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={inv.status}>
                        {inv.status === 'PAID'
                          ? 'Đã thanh toán'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'Còn nợ'
                          : 'Chưa thanh toán'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetail(inv.id)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                        {inv.paid_amount === 0 && (
                          <button
                            onClick={() => setDeleteTarget(inv)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Create Invoice */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lập Hóa Đơn Tiền Điện Nước"
        subtitle="Hệ thống tự động tra cứu chỉ số kỳ đã nhập và tính toán theo bảng giá hiệu lực"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Chọn Hộ / Phòng <span className="text-rose-500">*</span>
              </label>
              <select
                value={createForm.room_id}
                onChange={(e) => setCreateForm({ ...createForm, room_id: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                required
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Kỳ tính hóa đơn (YYYY-MM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={createForm.period}
                onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Hạn thanh toán</label>
              <input
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phí phát sinh khác (nếu có)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={createForm.other_fees}
                onChange={(e) => setCreateForm({ ...createForm, other_fees: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú trên hóa đơn</label>
            <input
              type="text"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="VD: Thu tiền định kỳ đầu tháng"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 leading-relaxed">
            <b>Lưu ý nghiệp vụ:</b> Hệ thống sẽ kiểm tra xem phòng đã có bản ghi chỉ số cho kỳ này chưa và
            tính tiền theo đúng các bậc thang đã thiết lập. Không cho phép tạo trùng hóa đơn cùng phòng và cùng kỳ.
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận & Lập Hóa Đơn</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail & Breakdown Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Chi tiết Hóa Đơn: ${selectedInvoice.invoice_code}`}
          subtitle={`Phòng ${selectedInvoice.room_code} - Kỳ hóa đơn ${selectedInvoice.period}`}
          maxWidth="2xl"
        >
          <div className="space-y-5" id="printable-invoice">
            {/* Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Ngày phát hành</span>
                <span className="text-xs font-bold text-slate-800">{selectedInvoice.issue_date}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Hạn thanh toán</span>
                <span className="text-xs font-bold text-slate-800">{selectedInvoice.due_date || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Tổng thanh toán</span>
                <span className="text-xs font-black text-slate-900">
                  {selectedInvoice.total_amount.toLocaleString()} VNĐ
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Trạng thái</span>
                <Badge status={selectedInvoice.status}>
                  {selectedInvoice.status === 'PAID'
                    ? 'Đã thanh toán'
                    : selectedInvoice.status === 'PARTIALLY_PAID'
                    ? 'Còn nợ'
                    : 'Chưa thanh toán'}
                </Badge>
              </div>
            </div>

            {/* Electricity Breakdown */}
            <div className="rounded-2xl border border-amber-200 p-4 bg-amber-50/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>Tiền Điện: {selectedInvoice.electricity_usage} kWh</span>
                </div>
                <span className="font-black text-amber-900 text-base">
                  {selectedInvoice.electricity_cost.toLocaleString()} VNĐ
                </span>
              </div>
              {selectedInvoice.electricity_details && selectedInvoice.electricity_details.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs text-left bg-white rounded-xl overflow-hidden border border-amber-100">
                    <thead className="bg-amber-100/60 text-amber-950 font-bold">
                      <tr>
                        <th className="py-2 px-3">Bậc giá</th>
                        <th className="py-2 px-3">Khoảng</th>
                        <th className="py-2 px-3">Đơn giá</th>
                        <th className="py-2 px-3">Số lượng dùng</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {selectedInvoice.electricity_details.map((t, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-medium text-slate-700">{t.tier_name}</td>
                          <td className="py-1.5 px-3 text-slate-500">
                            {t.from_level} - {t.to_level !== null ? t.to_level : '∞'} kWh
                          </td>
                          <td className="py-1.5 px-3 font-mono">{t.unit_price.toLocaleString()}đ</td>
                          <td className="py-1.5 px-3 font-bold font-mono">{t.usage_in_tier} kWh</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-800">
                            {t.cost.toLocaleString()}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Water Breakdown */}
            <div className="rounded-2xl border border-cyan-200 p-4 bg-cyan-50/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-cyan-900 text-sm">
                  <Droplets className="w-4 h-4 fill-cyan-500 text-cyan-500" />
                  <span>Tiền Nước: {selectedInvoice.water_usage} m³</span>
                </div>
                <span className="font-black text-cyan-900 text-base">
                  {selectedInvoice.water_cost.toLocaleString()} VNĐ
                </span>
              </div>
              {selectedInvoice.water_details && selectedInvoice.water_details.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs text-left bg-white rounded-xl overflow-hidden border border-cyan-100">
                    <thead className="bg-cyan-100/60 text-cyan-950 font-bold">
                      <tr>
                        <th className="py-2 px-3">Bậc giá</th>
                        <th className="py-2 px-3">Khoảng</th>
                        <th className="py-2 px-3">Đơn giá</th>
                        <th className="py-2 px-3">Số lượng dùng</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-50">
                      {selectedInvoice.water_details.map((t, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-medium text-slate-700">{t.tier_name}</td>
                          <td className="py-1.5 px-3 text-slate-500">
                            {t.from_level} - {t.to_level !== null ? t.to_level : '∞'} m³
                          </td>
                          <td className="py-1.5 px-3 font-mono">{t.unit_price.toLocaleString()}đ</td>
                          <td className="py-1.5 px-3 font-bold font-mono">{t.usage_in_tier} m³</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-800">
                            {t.cost.toLocaleString()}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total Balance & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-slate-900 text-white gap-3">
              <div>
                <div className="text-xs text-slate-400">Tình trạng công nợ hóa đơn</div>
                <div className="text-lg font-black mt-0.5">
                  Đã trả: {selectedInvoice.paid_amount.toLocaleString()}đ |{' '}
                  <span className={selectedInvoice.remaining_amount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    Còn nợ: {selectedInvoice.remaining_amount.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {selectedInvoice.remaining_amount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Thu Tiền / Thanh Toán</span>
                </button>
              )}
            </div>

            {/* Payments History */}
            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Lịch sử các lần thanh toán
                </h4>
                <div className="space-y-1.5">
                  {selectedInvoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-slate-800">{p.amount.toLocaleString()} VNĐ</span>
                          <span className="text-[11px] text-slate-400 ml-2">({p.payment_method})</span>
                        </div>
                      </div>
                      <span className="text-slate-400">{new Date(p.payment_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Record Payment Sub-Modal */}
      {isPayModalOpen && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Ghi nhận thanh toán: ${selectedInvoice?.invoice_code}`}
          subtitle={`Số tiền còn nợ hiện tại: ${selectedInvoice?.remaining_amount.toLocaleString()} VNĐ`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                max={selectedInvoice?.remaining_amount}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-base font-black text-emerald-700 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phương thức thanh toán</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="CHUYỂN KHOẢN">Chuyển khoản ngân hàng (QR Code / Mobile Banking)</option>
                <option value="TIỀN MẶT">Tiền mặt tại văn phòng</option>
                <option value="VÍ ĐIỆN TỬ">Ví điện tử (Momo, ZaloPay...)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú giao dịch</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="VD: Người nộp, mã giao dịch ngân hàng..."
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
                Xác Nhận Thu Tiền
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xóa hóa đơn ${deleteTarget?.invoice_code}?`}
        message="Hành động này sẽ xóa hóa đơn chưa thanh toán. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa hóa đơn"
        isLoading={isDeleting}
      />
    </div>
  );
};
