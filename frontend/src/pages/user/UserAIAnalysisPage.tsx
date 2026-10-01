import React, { useEffect, useState } from 'react';
import { aiApi, statsApi } from '../../api/client';
import { AIAnalyzeResponse, UserDashboardStats } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Bot, AlertTriangle, Sparkles, RefreshCw, CheckCircle2, History } from 'lucide-react';

export const UserAIAnalysisPage: React.FC = () => {
  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalyzeResponse | null>(null);
  const [history, setHistory] = useState<AIAnalyzeResponse[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { success, error, warning } = useToast();

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setIsLoading(true);
    try {
      const data = await statsApi.getUserDashboard();
      setStats(data);
      if (data.room_id) {
        const hist = await aiApi.getHistory(data.room_id);
        setHistory(hist);
        if (hist.length > 0) {
          setAnalysisResult(hist[0]);
        }
      }
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải dữ liệu phân tích.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!stats?.room_id) return;
    setIsAnalyzing(true);
    try {
      const res = await aiApi.analyze({ room_id: stats.room_id });
      setAnalysisResult(res);
      if (res.is_anomaly) {
        warning(
          `Cảnh báo: Lượng tiêu thụ kỳ ${res.period} tăng trên 30%!`,
          'Phát hiện tiêu thụ bất thường'
        );
      } else {
        success('Phân tích hoàn tất. Mức sử dụng điện nước của bạn bình thường.');
      }
      // reload history
      const hist = await aiApi.getHistory(stats.room_id);
      setHistory(hist);
    } catch (e: any) {
      error(e.message || 'Không thể chạy phân tích AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu AI..." />;
  }

  if (!stats?.room_id) {
    return (
      <EmptyState
        title="Chưa liên kết phòng"
        description="Tài khoản chưa được liên kết với số phòng. Vui lòng liên hệ Quản lý."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bot className="w-7 h-7 text-purple-600" />
            <span>AI Phân Tích Tiêu Thụ Phòng {stats.room_code}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Trí tuệ nhân tạo phân tích số liệu sử dụng, phát hiện sớm dấu hiệu bất thường và hỗ trợ quản lý chi phí.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang phân tích...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Yêu cầu AI phân tích mới</span>
            </>
          )}
        </button>
      </div>

      {analysisResult ? (
        <div className="space-y-6">
          {/* Anomaly Notice */}
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
                    Lượng Tiêu Thụ Kỳ {analysisResult.period} Tăng Đột Biến!
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
                  {analysisResult.alert || 'Mức sử dụng điện nước của phòng nằm trong giới hạn an toàn.'}
                </p>
              </div>
            </div>
          )}

          {/* AI Insights Card */}
          <Card
            title={`Nhận xét từ AI Trợ Lý (Kỳ ${analysisResult.period})`}
            icon={<Bot className="w-4 h-4 text-purple-600" />}
          >
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {analysisResult.summary}
            </div>

            {analysisResult.recommendations && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lời khuyên tham khảo từ AI</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                  {analysisResult.recommendations}
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState
            title="Chưa có phân tích nào"
            description="Hãy nhấn 'Yêu cầu AI phân tích mới' để nhận báo cáo từ trí tuệ nhân tạo."
            icon={<Bot className="w-10 h-10 text-purple-400" />}
          />
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card
          title="Lịch sử các lần phân tích"
          subtitle="Nhấp vào để xem lại các đánh giá trước đây"
          icon={<History className="w-4 h-4 text-slate-500" />}
        >
          <div className="space-y-2.5">
            {history.map((h) => (
              <div
                key={h.id}
                onClick={() => setAnalysisResult(h)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  analysisResult?.id === h.id
                    ? 'border-purple-300 bg-purple-50/70 shadow-sm'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Kỳ {h.period}</span>
                  <Badge type={h.is_anomaly ? 'danger' : 'success'}>
                    {h.is_anomaly ? 'Bất thường (>30%)' : 'Bình thường'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{h.summary}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
