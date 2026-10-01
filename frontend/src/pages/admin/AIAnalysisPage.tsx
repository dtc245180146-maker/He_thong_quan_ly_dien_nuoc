import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aiApi, roomsApi } from '../../api/client';
import { Room, AIAnalyzeResponse, AIStatusResponse } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Bot,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  History,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Home,
  Calendar
} from 'lucide-react';

export const AIAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get('room_id') ? Number(searchParams.get('room_id')) : 0;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(initialRoomId);
  const [targetPeriod, setTargetPeriod] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);

  // Current Analysis Result
  const [analysisResult, setAnalysisResult] = useState<AIAnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // History State
  const [history, setHistory] = useState<AIAnalyzeResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      loadRoomHistory(selectedRoomId);
    }
  }, [selectedRoomId]);

  const loadInitialData = async () => {
    try {
      const [roomsData, statusData] = await Promise.all([
        roomsApi.getAll(),
        aiApi.getStatus(),
      ]);
      setRooms(roomsData);
      setAiStatus(statusData);

      if (!selectedRoomId && roomsData.length > 0) {
        setSelectedRoomId(roomsData[0].id);
      }
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải dữ liệu khởi tạo.');
    }
  };

  const loadRoomHistory = async (roomId: number) => {
    setIsLoadingHistory(true);
    try {
      const historyData = await aiApi.getHistory(roomId);
      setHistory(historyData);
      if (historyData.length > 0 && !analysisResult) {
        setAnalysisResult(historyData[0]);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedRoomId) {
      error('Vui lòng chọn phòng cần phân tích.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await aiApi.analyze({
        room_id: selectedRoomId,
        period: targetPeriod || undefined,
      });

      setAnalysisResult(result);
      if (result.is_anomaly) {
        warning(
          `Cảnh báo: Phát hiện mức tiêu thụ tăng trên 30% tại phòng ${result.room_code}!`,
          'Phát hiện tiêu thụ bất thường'
        );
      } else {
        success('Phân tích hoàn tất. Mức tiêu thụ nằm trong giới hạn bình thường.');
      }
      loadRoomHistory(selectedRoomId);
    } catch (e: any) {
      error(e.message || 'Không thể thực hiện phân tích AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedRoomObj = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-purple-600" />
            <span>AI Phân Tích & Cảnh Báo Tiêu Thụ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ứng dụng trí tuệ nhân tạo để phát hiện biến động bất thường (&gt;30%) và nhận xét xu hướng tiêu thụ điện nước.
          </p>
        </div>

        {/* AI Status Badge */}
        {aiStatus && (
          <div className="p-3 rounded-2xl bg-white border border-purple-200/80 shadow-sm flex items-center space-x-3 text-xs self-start sm:self-auto">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">
                AI Provider: <span className="text-purple-700 uppercase">{aiStatus.provider}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Mô hình: {aiStatus.model} | {aiStatus.is_configured ? 'Đã kích hoạt' : 'Mock Heuristic'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel: Select Room & Period */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Chọn Hộ / Phòng cần phân tích
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedRoomId(id);
                setAnalysisResult(null);
              }}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 font-medium"
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
              Kỳ muốn phân tích (để trống để lấy kỳ mới nhất)
            </label>
            <input
              type="month"
              value={targetPeriod}
              onChange={(e) => setTargetPeriod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
            />
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI đang phân tích...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Thực Hiện Phân Tích AI</span>
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Main Analysis Display */}
      {analysisResult ? (
        <div className="space-y-6">
          {/* Anomaly Banner if > 30% */}
          {analysisResult.is_anomaly ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white shadow-xl">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white flex-shrink-0">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    CẢNH BÁO BẤT THƯỜNG (&gt; 30%)
                  </span>
                  <h3 className="text-lg sm:text-xl font-black">
                    Phát Hiện Tiêu Thụ Tăng Đột Biến Tại {analysisResult.room_code}
                  </h3>
                  <div className="text-xs sm:text-sm text-rose-100 mt-2 whitespace-pre-line leading-relaxed">
                    {analysisResult.alert}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3.5 text-emerald-900">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  TRẠNG THÁI TIÊU THỤ BÌNH THƯỜNG
                </span>
                <p className="text-xs sm:text-sm font-medium mt-0.5">
                  {analysisResult.alert || 'Không phát hiện dấu hiệu tăng bất thường trên 30% trong kỳ này.'}
                </p>
              </div>
            </div>
          )}

          {/* AI Insights Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card
                title={`Nhận xét xu hướng sử dụng (Kỳ ${analysisResult.period})`}
                subtitle={`Phòng ${analysisResult.room_code} - ${analysisResult.room_name}`}
                icon={<Bot className="w-4 h-4 text-purple-600" />}
                action={
                  <span className="text-[11px] text-slate-400 font-mono">
                    Provider: {analysisResult.provider}
                  </span>
                }
              >
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {analysisResult.summary}
                </div>

                {analysisResult.recommendations && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Khuyến nghị từ AI</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                      {analysisResult.recommendations}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Stats of Analysis */}
            <div>
              <Card
                title="Thông tin phân tích"
                icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
              >
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Đối tượng:</span>
                    <span className="font-bold text-slate-800">{analysisResult.room_code}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Kỳ đánh giá:</span>
                    <span className="font-bold text-slate-800">{analysisResult.period}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Số kỳ đối chiếu:</span>
                    <span className="font-bold text-slate-800">
                      {analysisResult.input_history_count || '3-6'} kỳ gần nhất
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Thời điểm phân tích:</span>
                    <span className="font-medium text-slate-600">
                      {new Date(analysisResult.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Toàn vẹn dữ liệu:</span>
                    <span className="font-bold text-emerald-600">Bảo toàn 100% gốc</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Chưa chạy phân tích"
            description="Chọn phòng và nhấn 'Thực Hiện Phân Tích AI' để xem nhận xét và phát hiện bất thường."
            icon={<Bot className="w-10 h-10 text-purple-400" />}
          />
        </Card>
      )}

      {/* History of Past Analyses */}
      <Card
        title="Lịch sử các lần phân tích AI"
        subtitle={`Các báo cáo phân tích trước đó của phòng ${selectedRoomObj?.room_code || ''}`}
        icon={<History className="w-4 h-4 text-slate-500" />}
      >
        {isLoadingHistory ? (
          <LoadingSpinner text="Đang nạp lịch sử phân tích..." />
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Chưa có lượt phân tích nào trước đây cho phòng này.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setAnalysisResult(item)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  analysisResult?.id === item.id
                    ? 'border-purple-300 bg-purple-50/60 shadow-sm'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">Kỳ {item.period}</span>
                    <Badge type={item.is_anomaly ? 'danger' : 'success'}>
                      {item.is_anomaly ? 'Bất thường (>30%)' : 'Bình thường'}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
