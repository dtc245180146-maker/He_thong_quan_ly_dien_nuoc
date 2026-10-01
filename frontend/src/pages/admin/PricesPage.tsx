import React, { useEffect, useState } from 'react';
import { pricesApi } from '../../api/client';
import { PriceConfig } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Plus, Tag, Zap, Droplets, Edit2, Trash2, Calendar } from 'lucide-react';

export const PricesPage: React.FC = () => {
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'ELECTRICITY' | 'WATER'>('ELECTRICITY');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceConfig | null>(null);
  const [formData, setFormData] = useState({
    service_type: 'ELECTRICITY' as 'ELECTRICITY' | 'WATER',
    pricing_type: 'TIERED' as 'TIERED' | 'FIXED',
    tier_name: '',
    from_level: 0,
    to_level: '' as string | number,
    unit_price: 2000,
    effective_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<PriceConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setIsLoading(true);
    try {
      const data = await pricesApi.getAll();
      setPrices(data);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải bảng giá.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (p?: PriceConfig) => {
    if (p) {
      setEditingPrice(p);
      setFormData({
        service_type: p.service_type,
        pricing_type: p.pricing_type,
        tier_name: p.tier_name || '',
        from_level: p.from_level,
        to_level: p.to_level !== null && p.to_level !== undefined ? p.to_level : '',
        unit_price: p.unit_price,
        effective_date: p.effective_date,
        description: p.description || '',
      });
    } else {
      setEditingPrice(null);
      setFormData({
        service_type: activeTab,
        pricing_type: 'TIERED',
        tier_name: '',
        from_level: 0,
        to_level: '',
        unit_price: activeTab === 'ELECTRICITY' ? 2500 : 10000,
        effective_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.unit_price) <= 0) {
      error('Đơn giá phải lớn hơn 0.');
      return;
    }

    const toVal = formData.to_level === '' ? null : Number(formData.to_level);
    if (toVal !== null && toVal <= Number(formData.from_level)) {
      error('Mức tiêu thụ kết thúc phải lớn hơn mức bắt đầu.');
      return;
    }

    try {
      if (editingPrice) {
        await pricesApi.update(editingPrice.id, {
          tier_name: formData.tier_name,
          from_level: Number(formData.from_level),
          to_level: toVal,
          unit_price: Number(formData.unit_price),
          effective_date: formData.effective_date,
          description: formData.description,
        });
        success(`Cập nhật đơn giá thành công.`);
      } else {
        await pricesApi.create({
          service_type: formData.service_type,
          pricing_type: formData.pricing_type,
          tier_name: formData.tier_name,
          from_level: Number(formData.from_level),
          to_level: toVal,
          unit_price: Number(formData.unit_price),
          effective_date: formData.effective_date,
          description: formData.description,
          is_active: true,
        });
        success(`Thêm mới đơn giá thành công.`);
      }
      setIsModalOpen(false);
      loadPrices();
    } catch (e: any) {
      error(e.message || 'Lỗi khi lưu đơn giá.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await pricesApi.delete(deleteTarget.id);
      success(`Đã xóa bậc giá.`);
      setDeleteTarget(null);
      loadPrices();
    } catch (e: any) {
      error(e.message || 'Không thể xóa đơn giá.');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentPrices = prices.filter((p) => p.service_type === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Cấu Hình Đơn Giá Điện Nước</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết lập biểu giá bậc thang sinh hoạt hoặc đơn giá cố định để tính hóa đơn tự động.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Bậc Giá Mới</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ELECTRICITY')}
          className={`py-3 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'ELECTRICITY'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>Biểu giá Điện (VNĐ/kWh)</span>
        </button>
        <button
          onClick={() => setActiveTab('WATER')}
          className={`py-3 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'WATER'
              ? 'border-cyan-500 text-cyan-600 bg-cyan-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Droplets className="w-4 h-4 fill-cyan-500 text-cyan-500" />
          <span>Biểu giá Nước (VNĐ/m³)</span>
        </button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp cấu hình đơn giá..." />
        ) : currentPrices.length === 0 ? (
          <EmptyState
            title="Chưa có cấu hình giá"
            description="Hãy cấu hình đơn giá để hệ thống có thể tính tiền điện nước khi lập hóa đơn."
            action={
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Thiết lập đơn giá
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tên bậc / Gói giá</th>
                  <th className="py-3 px-4">Hình thức</th>
                  <th className="py-3 px-4">Khoảng tiêu thụ</th>
                  <th className="py-3 px-4">Đơn giá áp dụng</th>
                  <th className="py-3 px-4">Ngày áp dụng</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPrices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span>{p.tier_name || 'Bậc giá'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge type={p.pricing_type === 'TIERED' ? 'primary' : 'neutral'}>
                        {p.pricing_type === 'TIERED' ? 'Bậc thang' : 'Cố định'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {p.pricing_type === 'TIERED' ? (
                        <span>
                          {p.from_level} - {p.to_level !== null ? `${p.to_level} ` : 'trở lên '}
                          {p.service_type === 'ELECTRICITY' ? 'kWh' : 'm³'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Toàn bộ mức tiêu thụ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 text-base">
                      {p.unit_price.toLocaleString()} <span className="text-xs font-normal text-slate-500">VNĐ</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.effective_date}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{p.description || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Add / Edit Price */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPrice ? 'Chỉnh sửa đơn giá' : 'Thêm mới Cấu hình Đơn giá'}
        subtitle="Thiết lập mức giá và định mức tiêu thụ"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Dịch vụ <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.service_type}
                onChange={(e) =>
                  setFormData({ ...formData, service_type: e.target.value as 'ELECTRICITY' | 'WATER' })
                }
                disabled={!!editingPrice}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white disabled:bg-slate-100"
              >
                <option value="ELECTRICITY">Điện (kWh)</option>
                <option value="WATER">Nước (m³)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Phương thức tính <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.pricing_type}
                onChange={(e) =>
                  setFormData({ ...formData, pricing_type: e.target.value as 'TIERED' | 'FIXED' })
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="TIERED">Bậc thang (Lũy tiến)</option>
                <option value="FIXED">Giá cố định (Một giá)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Tên bậc / Gói giá <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tier_name}
              onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
              placeholder="VD: Bậc 1 (0 - 50 kWh), hoặc Giá trọ thỏa thuận"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {formData.pricing_type === 'TIERED' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Từ mức tiêu thụ</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.from_level}
                  onChange={(e) => setFormData({ ...formData, from_level: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Đến mức tiêu thụ (để trống nếu không giới hạn)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.to_level}
                  onChange={(e) => setFormData({ ...formData, to_level: e.target.value })}
                  placeholder="Vô cực nếu để trống"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Đơn giá (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ngày áp dụng</label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả / Căn cứ quyết định</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="VD: Biểu giá điện bán lẻ Quyết định số..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20"
            >
              {editingPrice ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xóa bậc giá ${deleteTarget?.tier_name}?`}
        message="Hành động này sẽ xóa cấu hình đơn giá đã chọn. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa đơn giá"
        isLoading={isDeleting}
      />
    </div>
  );
};
