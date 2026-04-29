import { useMemo, useState } from 'react';
import { message } from 'antd';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { type TourInstance, type TourProgram } from '@entities/tour-program/data/tourProgram';
import { createTourInstance, deleteTourInstance, patchTourInstance } from '@shared/lib/api/tourInstances';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useAuthStore } from '@shared/store/useAuthStore';
import { PageSearchInput } from '@shared/ui/PageSearchInput';

type SubTab = 'quy_tac' | 'cho_duyet_ban';
type ProgramStatusLabel = 'Cảnh báo' | 'Đã đủ';

type PreviewRow = {
  id: string;
  departureDate: string;
  endDate: string;
  dayType: string;
  expectedGuests: number;
  costPerAdult: number;
  sellPrice: number;
  profitPercent: number;
  bookingDeadline: string;
  conflictLabel: string;
  conflictDetails: string[];
  checked: boolean;
};

type RuleEditorState = {
  mode: 'create' | 'edit';
  requestId?: string;
  programId: string;
  programName: string;
  type: TourProgram['tourType'];
  departurePoint: string;
  sightseeingSpots: string[];
  durationLabel: string;
  statusLabel: ProgramStatusLabel;
  minimumCoverageMonths: number;
  minStartDate: string;
  startDate: string;
  endDate: string;
  startError: string;
  endError: string;
  selectionError?: string;
  managerRequestNote?: string;
  rows: PreviewRow[];
};

type ActiveProgramRow = {
  program: TourProgram;
  farthestRequested?: TourInstance;
  nearestUpcomingRequested?: TourInstance;
  assessedCoverageMonths: number;
  availableCoverageMonths: number;
  minimumCoverageMonths: number;
  statusLabel: ProgramStatusLabel;
  statusSince: string;
  latestRequestCreatedAt: string;
};

const REQUEST_PIPELINE_STATUSES = new Set(['cho_duyet_ban', 'yeu_cau_chinh_sua', 'dang_mo_ban']);
const REQUEST_STATUSES = new Set(['cho_duyet_ban', 'yeu_cau_chinh_sua', 'dang_mo_ban', 'cho_nhan_dieu_hanh', 'cho_du_toan', 'cho_duyet_du_toan', 'san_sang_trien_khai', 'dang_trien_khai', 'cho_quyet_toan', 'hoan_thanh']);
const WEEKDAY_VALUES = ['cn', 't2', 't3', 't4', 't5', 't6', 't7'] as const;
const YEAR_ROUND_START_ERROR = 'tour phải tạo ít nhất trước 1 tháng';
const END_DATE_ERROR = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';

function parseDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = parseDateKey(value);
  if (!date) return '';
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function addCalendarMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addMonthsToKey(value: string, months: number) {
  const date = parseDateKey(value);
  if (!date) return '';
  return toDateKey(addCalendarMonths(date, months));
}

function endOfMonth(value: string) {
  const date = parseDateKey(value);
  if (!date) return '';
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function maxDateKey(left: string, right: string) {
  return left >= right ? left : right;
}

function formatDate(value?: string) {
  const date = parseDateKey(value);
  return date ? date.toLocaleDateString('vi-VN') : '-';
}

function formatMoney(value: number) {
  return Math.round(value).toLocaleString('vi-VN');
}

function roundToThousand(value: number) {
  return Math.round(value / 1000) * 1000;
}

function monthsBetween(start?: string, end?: string) {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  if (!startDate || !endDate || endDate < startDate) return 0;
  return Number((((endDate.getTime() - startDate.getTime()) / 86400000) / 30).toFixed(1));
}

function formatMonths(value: number) {
  return `${value.toFixed(1)} tháng`;
}

function getWeekStartKey(value: string) {
  const date = parseDateKey(value);
  if (!date) return '';
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function getNextDepartureAfter(program: TourProgram, afterDate?: string) {
  const anchor = parseDateKey(afterDate);
  if (!anchor) return '';

  if ((program.selectedDates?.length ?? 0) > 0) {
    const futureHolidayDate = [...(program.selectedDates ?? [])]
      .sort((left, right) => left.localeCompare(right))
      .find(date => date > (afterDate ?? ''));
    return futureHolidayDate ?? addDays(afterDate!, 1);
  }

  const weekdaySet = new Set(program.weekdays ?? []);
  const cursor = new Date(anchor);
  cursor.setDate(cursor.getDate() + 1);

  for (let index = 0; index < 400; index += 1) {
    const weekdayValue = WEEKDAY_VALUES[cursor.getDay()];
    if (weekdaySet.size === 0 || weekdaySet.has(weekdayValue)) {
      return toDateKey(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return addDays(afterDate!, 7);
}

function buildDepartureDates(program: TourProgram, startDate: string, endDate: string) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start || !end || end < start) return [];

  if ((program.selectedDates?.length ?? 0) > 0) {
    return [...(program.selectedDates ?? [])]
      .filter(date => date >= startDate && date <= endDate)
      .sort((left, right) => left.localeCompare(right));
  }

  const weekdaySet = new Set(program.weekdays ?? []);
  const cursor = new Date(start);
  const dates: string[] = [];
  while (cursor <= end && dates.length < 48) {
    const weekdayValue = WEEKDAY_VALUES[cursor.getDay()];
    if (weekdaySet.size === 0 || weekdaySet.has(weekdayValue)) {
      dates.push(toDateKey(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function buildConflictDetails(instances: TourInstance[], programId: string, departureDate: string, endDate: string) {
  const start = parseDateKey(departureDate);
  const end = parseDateKey(endDate);
  if (!start || !end) return [];

  const labels = new Set<string>();
  instances.forEach(instance => {
    if (instance.programId === programId || instance.status === 'da_huy') return;
    const instanceStart = parseDateKey(instance.departureDate);
    if (!instanceStart) return;
    const instanceEnd = parseDateKey(addDays(instance.departureDate, 2)) ?? instanceStart;
    const overlaps = instanceStart <= end && instanceEnd >= start;
    if (overlaps) {
      labels.add(`${instance.programName} - ${formatDate(instance.departureDate)}`);
    }
  });
  return [...labels];
}

function buildPreviewRows(program: TourProgram, instances: TourInstance[], startDate: string, endDate: string, existingRows: PreviewRow[] = []) {
  const dates = buildDepartureDates(program, startDate, endDate);
  const rowsByDeparture = new Map(existingRows.map(row => [row.departureDate, row]));

  return dates.map((departureDate, index) => {
    const previousRow = rowsByDeparture.get(departureDate);
    const endDateKey = addDays(departureDate, Math.max(0, program.duration.days - 1));
    const conflictDetails = buildConflictDetails(instances, program.id, departureDate, endDateKey);
    const costPerAdult = previousRow?.costPerAdult ?? roundToThousand(program.pricingConfig.netPrice ?? 0);
    const sellPrice = previousRow?.sellPrice ?? roundToThousand(program.pricingConfig.sellPriceAdult ?? 0);
    const profitPercent = costPerAdult > 0
      ? Number((((sellPrice - costPerAdult) / costPerAdult) * 100).toFixed(1))
      : 0;

    return {
      id: previousRow?.id ?? `T${String(index + 1).padStart(3, '0')}`,
      departureDate,
      endDate: previousRow?.endDate ?? endDateKey,
      dayType: previousRow?.dayType ?? (
        program.tourType === 'mua_le'
          ? 'Mùa lễ'
          : (() => {
              const date = parseDateKey(departureDate);
              if (!date) return 'Ngày thường';
              return date.getDay() === 0 || date.getDay() === 6 ? 'Cuối tuần' : 'Ngày thường';
            })()
      ),
      expectedGuests: previousRow?.expectedGuests ?? Math.max(1, program.pricingConfig.minParticipants ?? 1),
      costPerAdult,
      sellPrice,
      profitPercent,
      bookingDeadline: previousRow?.bookingDeadline ?? addDays(departureDate, -Math.max(0, program.bookingDeadline ?? 0)),
      conflictLabel: `${conflictDetails.length} chương trình trùng thời điểm`,
      conflictDetails,
      checked: previousRow?.checked ?? true,
    };
  });
}

function buildDefaultEndDate(startDate: string, statusLabel: ProgramStatusLabel, minimumCoverageMonths: number) {
  if (!startDate) return '';
  if (statusLabel === 'Cảnh báo') {
    return addMonthsToKey(startDate, Math.max(1, minimumCoverageMonths));
  }
  return endOfMonth(addMonthsToKey(startDate, 1));
}

function validateDateRange(startDate: string, endDate: string, minStartDate: string) {
  const startError = startDate && startDate < minStartDate ? YEAR_ROUND_START_ERROR : '';
  const endError = endDate && startDate && endDate < startDate ? END_DATE_ERROR : '';
  return { startError, endError };
}

function buildCreateEditor(row: ActiveProgramRow, instances: TourInstance[], todayPlusOneMonth: string): RuleEditorState {
  const nextAfterFarthest = row.farthestRequested ? getNextDepartureAfter(row.program, row.farthestRequested.departureDate) : '';
  const startDate = maxDateKey(todayPlusOneMonth, nextAfterFarthest || todayPlusOneMonth);
  const endDate = buildDefaultEndDate(startDate, row.statusLabel, row.minimumCoverageMonths);
  const rows = buildPreviewRows(row.program, instances, startDate, endDate);

  return {
    mode: 'create',
    programId: row.program.id,
    programName: row.program.name,
    type: row.program.tourType,
    departurePoint: row.program.departurePoint,
    sightseeingSpots: row.program.sightseeingSpots,
    durationLabel: `${row.program.duration.days} ngày ${row.program.duration.nights} đêm`,
    statusLabel: row.statusLabel,
    minimumCoverageMonths: row.minimumCoverageMonths,
    minStartDate: todayPlusOneMonth,
    startDate,
    endDate,
    startError: '',
    endError: '',
    selectionError: '',
    rows,
  };
}

function buildEditEditor(instance: TourInstance, program: TourProgram, instances: TourInstance[], todayPlusOneMonth: string): RuleEditorState {
  const startDate = instance.departureDate;
  const endDate = addMonthsToKey(startDate, 1);
  const rows = buildPreviewRows(program, instances, startDate, endDate, [{
    id: instance.id,
    departureDate: instance.departureDate,
    endDate: addDays(instance.departureDate, Math.max(0, program.duration.days - 1)),
    dayType: program.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm',
    expectedGuests: Math.max(1, instance.expectedGuests),
    costPerAdult: roundToThousand(program.pricingConfig.netPrice ?? instance.priceAdult),
    sellPrice: roundToThousand(instance.priceAdult),
    profitPercent: program.pricingConfig.netPrice > 0
      ? Number((((instance.priceAdult - program.pricingConfig.netPrice) / program.pricingConfig.netPrice) * 100).toFixed(1))
      : 0,
    bookingDeadline: instance.bookingDeadline,
    conflictLabel: '0 chương trình trùng thời điểm',
    conflictDetails: [],
    checked: true,
  }]);

  return {
    mode: 'edit',
    requestId: instance.id,
    programId: program.id,
    programName: program.name,
    type: program.tourType,
    departurePoint: instance.departurePoint,
    sightseeingSpots: instance.sightseeingSpots,
    durationLabel: `${program.duration.days} ngày ${program.duration.nights} đêm`,
    statusLabel: 'Đã đủ',
    minimumCoverageMonths: Math.max(1, program.coverageMonths ?? 1),
    minStartDate: todayPlusOneMonth,
    startDate,
    endDate,
    startError: '',
    endError: '',
    selectionError: '',
    managerRequestNote: instance.status === 'yeu_cau_chinh_sua'
      ? (instance.cancelReason || 'Quản lý yêu cầu chỉnh sửa lại danh sách tour dự kiến trước khi duyệt bán.')
      : '',
    rows,
  };
}

function applyEditorDates(editor: RuleEditorState, instances: TourInstance[], program: TourProgram, nextStartDate: string, nextEndDate: string) {
  const { startError, endError } = validateDateRange(nextStartDate, nextEndDate, editor.minStartDate);
  return {
    ...editor,
    startDate: nextStartDate,
      endDate: nextEndDate,
      startError,
      endError,
      selectionError: '',
      rows: startError || endError || !nextStartDate || !nextEndDate
        ? []
        : buildPreviewRows(program, instances, nextStartDate, nextEndDate, editor.rows),
  };
}

function saveGeneratedRows(rows: PreviewRow[], editor: RuleEditorState, program: TourProgram): TourInstance[] {
  const createdAt = new Date().toISOString();
  return rows
    .filter(row => row.checked)
    .map((row, index) => ({
      id: editor.requestId && index === 0 ? editor.requestId : `REQ-${program.id}-${row.departureDate}`,
      programId: program.id,
      programName: program.name,
      departureDate: row.departureDate,
      status: 'cho_duyet_ban' as const,
      departurePoint: program.departurePoint,
      sightseeingSpots: program.sightseeingSpots,
      transport: program.transport,
      arrivalPoint: program.arrivalPoint,
      expectedGuests: row.expectedGuests,
      priceAdult: row.sellPrice,
      priceChild: roundToThousand(row.sellPrice * 0.75),
      priceInfant: 0,
      minParticipants: program.pricingConfig.minParticipants,
      bookingDeadline: row.bookingDeadline,
      createdBy: program.createdBy,
      createdAt,
      warningDate: editor.statusLabel === 'Cảnh báo' ? createdAt : undefined,
      cancelReason: editor.managerRequestNote || undefined,
    }));
}

export default function TourGenerationRules() {
  const tourPrograms = useAppDataStore(state => state.tourPrograms);
  const storeTourInstances = useAppDataStore(state => state.tourInstances);
  const setTourInstances = useAppDataStore(state => state.setTourInstances);
  const token = useAuthStore(state => state.accessToken);
  const todayPlusOneMonth = useMemo(() => toDateKey(addCalendarMonths(new Date(), 1)), []);
  const [subTab, setSubTab] = useState<SubTab>('quy_tac');
  const [searchQuery, setSearchQuery] = useState('');
  const [localRequests, setLocalRequests] = useState<TourInstance[]>(
    () => storeTourInstances.filter(instance => instance.status === 'cho_duyet_ban' || instance.status === 'yeu_cau_chinh_sua'),
  );
  const [viewModal, setViewModal] = useState<TourInstance | null>(null);
  const [editor, setEditor] = useState<RuleEditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TourInstance | null>(null);

  const allInstances = useMemo(() => {
    const merged = new Map<string, TourInstance>();
    [...storeTourInstances, ...localRequests].forEach(instance => {
      merged.set(instance.id, instance);
    });
    return [...merged.values()];
  }, [localRequests, storeTourInstances]);

  const activePrograms = useMemo<ActiveProgramRow[]>(() => {
    const todayKey = toDateKey(new Date());

    return tourPrograms
      .filter(program => program.status === 'active')
      .map(program => {
        const requestRows = allInstances
          .filter(instance => instance.programId === program.id && REQUEST_STATUSES.has(instance.status) && instance.departureDate >= todayKey)
          .sort((left, right) => left.departureDate.localeCompare(right.departureDate));
        const sellingWeeks = new Set(
          requestRows
            .filter(instance => REQUEST_PIPELINE_STATUSES.has(instance.status))
            .map(instance => getWeekStartKey(instance.departureDate)),
        );
        const nearestUpcomingRequested = requestRows[0];
        const farthestRequested = requestRows.at(-1);
        const assessedCoverageMonths = monthsBetween(nearestUpcomingRequested?.departureDate, farthestRequested?.departureDate);
        const availableCoverageMonths = Number((sellingWeeks.size / 4).toFixed(1));
        const minimumCoverageMonths = Math.max(1, program.coverageMonths ?? 1);
        const statusLabel: ProgramStatusLabel = assessedCoverageMonths < minimumCoverageMonths ? 'Cảnh báo' : 'Đã đủ';
        const statusSince = statusLabel === 'Cảnh báo'
          ? (
              requestRows
                .map(instance => instance.warningDate || instance.createdAt)
                .filter(Boolean)
                .sort((left, right) => left.localeCompare(right))[0] || program.updatedAt
            )
          : (
              requestRows
                .map(instance => instance.createdAt)
                .filter(Boolean)
                .sort((left, right) => right.localeCompare(left))[0] || program.createdAt
            );
        const latestRequestCreatedAt = requestRows
          .map(instance => instance.createdAt)
          .filter(Boolean)
          .sort((left, right) => right.localeCompare(left))[0] || program.createdAt;

        return {
          program,
          farthestRequested,
          nearestUpcomingRequested,
          assessedCoverageMonths,
          availableCoverageMonths,
          minimumCoverageMonths,
          statusLabel,
          statusSince,
          latestRequestCreatedAt,
        };
      })
      .sort((left, right) => {
        if (left.statusLabel !== right.statusLabel) {
          return left.statusLabel === 'Cảnh báo' ? -1 : 1;
        }
        if (left.statusLabel === 'Cảnh báo') {
          return left.statusSince.localeCompare(right.statusSince);
        }
        return left.latestRequestCreatedAt.localeCompare(right.latestRequestCreatedAt);
      });
  }, [allInstances, tourPrograms]);

  const pendingApprovalItems = useMemo(
    () => localRequests.filter(instance => instance.status === 'cho_duyet_ban' || instance.status === 'yeu_cau_chinh_sua'),
    [localRequests],
  );

  const filteredActivePrograms = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return activePrograms;
    return activePrograms.filter(row => [
      row.program.id,
      row.program.name,
      row.program.departurePoint,
      row.program.sightseeingSpots.join(' '),
      row.statusLabel,
    ].join(' ').toLowerCase().includes(keyword));
  }, [activePrograms, searchQuery]);

  const filteredPendingApprovalInstances = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return pendingApprovalItems;
    return pendingApprovalItems.filter(instance => {
      const program = tourPrograms.find(item => item.id === instance.programId);
      return [
        instance.id,
        instance.programName,
        instance.departureDate,
        instance.createdAt,
        program?.tourType,
      ].join(' ').toLowerCase().includes(keyword);
    });
  }, [pendingApprovalItems, searchQuery, tourPrograms]);

  const selectedCount = editor?.rows.filter(row => row.checked).length ?? 0;
  const unselectedCount = editor ? editor.rows.length - selectedCount : 0;

  const handleSendOrSave = async () => {
    if (!editor) return;
    const program = tourPrograms.find(item => item.id === editor.programId);
    if (!program) return;
    if (!editor.startDate || !editor.endDate || editor.startError || editor.endError || selectedCount === 0) {
      setEditor(current => current ? {
        ...current,
        startError: current.startDate ? current.startError : 'Vui lòng chọn Sinh từ ngày',
        endError: current.endDate ? current.endError : 'Vui lòng chọn Đến ngày',
        selectionError: selectedCount === 0 ? 'Vui lòng chọn ít nhất một tour để gửi duyệt' : '',
      } : current);
      return;
    }

    const nextRequests = saveGeneratedRows(editor.rows, editor, program);
    if (!token) return;

    try {
      const persistedRows = await Promise.all(nextRequests.map((instance, index) => (
        editor.mode === 'edit' && editor.requestId && index === 0
          ? patchTourInstance(token, editor.requestId, instance)
          : createTourInstance(token, instance)
      )));

      const mergedRows = (() => {
        const nextMap = new Map(localRequests.map(item => [item.id, item]));
        persistedRows.forEach(({ tourInstance }) => nextMap.set(tourInstance.id, tourInstance));
        return [...nextMap.values()];
      })();

      setLocalRequests(mergedRows);
      setTourInstances([
        ...storeTourInstances.filter(instance => !mergedRows.some(request => request.id === instance.id)),
        ...mergedRows,
      ]);
      setEditor(null);
      setSubTab('cho_duyet_ban');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể lưu yêu cầu chờ duyệt bán');
    }
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-32">
      <main className="p-8 max-w-7xl mx-auto">
        <Breadcrumb
          className="mb-4 text-xs"
          items={[
            { title: <Link to="/coordinator/tour-rules" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Quản lý Tour</Link> },
            { title: <span className="text-[var(--color-primary)]/30">Quy tắc tạo tour</span> },
          ]}
        />

        <div className="mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 block mb-1">Khu vực điều phối</span>
          <h1 className="font-serif text-3xl text-primary">Quản lý Tour</h1>
          <p className="text-sm text-primary/50 mt-2">
            Rà soát thời gian mở bán của chương trình tour và tạo các đợt khởi hành mới theo đúng rule nghiệp vụ.
          </p>
        </div>

        <div className="flex gap-0 mb-0 border-b border-outline-variant/30 bg-white rounded-t-sm overflow-hidden">
          <button
            onClick={() => setSubTab('quy_tac')}
            className={`px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
              subTab === 'quy_tac'
                ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            Quy tắc tạo tour
          </button>
          <button
            onClick={() => setSubTab('cho_duyet_ban')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
              subTab === 'cho_duyet_ban'
                ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            Chờ duyệt bán
            {pendingApprovalItems.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono">
                {pendingApprovalItems.length}
              </span>
            )}
          </button>
        </div>

        <PageSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={subTab === 'quy_tac'
            ? 'Tìm theo chương trình tour, điểm khởi hành, trạng thái...'
            : 'Tìm theo mã yêu cầu, chương trình tour, ngày khởi hành...'}
          className="my-6"
        />

        {subTab === 'quy_tac' && (
          <div className="bg-white border-x border-b border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px]">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                    {[
                      'Chương trình tour',
                      'Loại tour',
                      'Ngày khởi hành gần nhất sắp tới',
                      'Ngày khởi hành xa nhất đã có yêu cầu',
                      'Thời gian mở bán đã tính',
                      'Thời gian mở bán khả dụng',
                      'Thời gian mở bán tối thiểu',
                      'Trạng thái',
                      'Thao tác',
                    ].map(header => (
                      <th key={header} className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivePrograms.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center text-sm text-primary/40">
                        Chưa có chương trình tour phù hợp.
                      </td>
                    </tr>
                  )}
                  {filteredActivePrograms.map((row, index) => (
                    <tr key={row.program.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/20'}>
                      <td className="px-5 py-4 text-sm font-medium text-primary">{row.program.name}</td>
                      <td className="px-5 py-4 text-sm">{row.program.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'}</td>
                      <td className="px-5 py-4 text-sm">{formatDate(row.nearestUpcomingRequested?.departureDate)}</td>
                      <td className="px-5 py-4 text-sm">{formatDate(row.farthestRequested?.departureDate)}</td>
                      <td className="px-5 py-4 text-sm">{formatMonths(row.assessedCoverageMonths)}</td>
                      <td className="px-5 py-4 text-sm">{formatMonths(row.availableCoverageMonths)}</td>
                      <td className="px-5 py-4 text-sm">{formatMonths(row.minimumCoverageMonths)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                          row.statusLabel === 'Cảnh báo' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setEditor(buildCreateEditor(row, allInstances, todayPlusOneMonth))}
                          className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors"
                        >
                          Tạo tour
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'cho_duyet_ban' && (
          <div className="bg-white border-x border-b border-outline-variant/30 overflow-hidden">
            {filteredPendingApprovalInstances.length === 0 ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-primary/10 block mb-3">inbox</span>
                <p className="text-sm text-primary/40">Không có tour nào chờ duyệt bán</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                      {['Mã yêu cầu', 'Tên chương trình', 'Loại tour', 'Ngày KH gần nhất', 'Số tour yêu cầu', 'Ngày tạo', ''].map(header => (
                        <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-5 py-3.5 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingApprovalInstances.map((instance, index) => {
                      const program = tourPrograms.find(item => item.id === instance.programId);
                      return (
                        <tr key={instance.id} className={`border-b border-outline-variant/20 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/30'}`}>
                          <td className="px-5 py-4 font-mono text-xs">{instance.id}</td>
                          <td className="px-5 py-4 text-sm font-medium">{instance.programName}</td>
                          <td className="px-5 py-4 text-xs">
                            <span className={`text-[10px] px-2 py-0.5 font-label uppercase tracking-wider ${
                              program?.tourType === 'mua_le' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {program?.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm">{formatDate(instance.departureDate)}</td>
                          <td className="px-5 py-4 text-sm">1 tour</td>
                          <td className="px-5 py-4 text-sm">{formatDate(instance.createdAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setViewModal(instance)} className="px-3 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors">
                                Xem
                              </button>
                              <button
                                onClick={() => {
                                  if (!program) return;
                                  setEditor(buildEditEditor(instance, program, allInstances, todayPlusOneMonth));
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
                              >
                                Sửa
                              </button>
                              <button onClick={() => setDeleteTarget(instance)} className="px-3 py-1.5 border border-red-300 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors">
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {viewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setViewModal(null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="tour-detail-title" className="relative w-full max-w-5xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 id="tour-detail-title" className="font-serif text-xl text-primary">Chi tiết tour</h3>
                  <p className="text-xs text-primary/50 mt-0.5">Mã yêu cầu: <span className="font-mono">{viewModal.id}</span></p>
                </div>
                <button onClick={() => setViewModal(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="overflow-x-auto border border-outline-variant/30">
                  <table className="w-full min-w-[920px]">
                    <thead>
                      <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                        {['Mã tour', 'Ngày khởi hành', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn/người lớn', 'Lợi nhuận', 'Giá bán', 'Hạn đặt tour'].map(header => (
                          <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(tourPrograms.find(item => item.id === viewModal.programId)
                        ? buildPreviewRows(
                          tourPrograms.find(item => item.id === viewModal.programId)!,
                          allInstances,
                          viewModal.departureDate,
                          addMonthsToKey(viewModal.departureDate, 1),
                        )
                        : []
                      ).map(row => (
                        <tr key={row.id} className="border-b border-outline-variant/20 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(row.departureDate)}</td>
                          <td className="px-4 py-3 text-sm">{row.dayType}</td>
                          <td className="px-4 py-3 text-sm">{row.expectedGuests}</td>
                          <td className="px-4 py-3 text-sm">{formatMoney(row.costPerAdult)}đ</td>
                          <td className="px-4 py-3 text-sm">{row.profitPercent}%</td>
                          <td className="px-4 py-3 text-sm">{formatMoney(row.sellPrice)}đ</td>
                          <td className="px-4 py-3 text-sm">{formatDate(row.bookingDeadline)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="delete-pending-title" className="relative w-full max-w-md bg-white shadow-2xl">
              <div className="px-6 py-5">
                <h3 id="delete-pending-title" className="font-serif text-xl text-primary mb-2">Xóa yêu cầu chờ duyệt bán</h3>
                <p className="text-sm text-primary/60">Yêu cầu cho {deleteTarget.programName} sẽ bị gỡ khỏi danh sách chờ duyệt bán.</p>
              </div>
              <div className="border-t border-outline-variant/30 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-xs uppercase tracking-widest border border-outline-variant/50 text-primary/60">
                  Hủy bỏ
                </button>
                <button
                  onClick={async () => {
                    if (!token) return;
                    try {
                      await deleteTourInstance(token, deleteTarget.id);
                      const nextRequests = localRequests.filter(instance => instance.id !== deleteTarget.id);
                      setLocalRequests(nextRequests);
                      setTourInstances(storeTourInstances.filter(instance => instance.id !== deleteTarget.id));
                      setDeleteTarget(null);
                    } catch (error) {
                      message.error(error instanceof Error ? error.message : 'Không thể xóa yêu cầu chờ duyệt bán');
                    }
                  }}
                  className="px-4 py-2 text-xs uppercase tracking-widest border border-red-300 text-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {editor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setEditor(null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="tour-rule-editor-title" className="relative w-full max-w-6xl bg-white shadow-2xl max-h-[88vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 id="tour-rule-editor-title" className="font-serif text-2xl text-primary">
                    {editor.mode === 'create' ? 'Sinh tour' : 'Sửa yêu cầu chờ duyệt bán'}
                  </h3>
                  <p className="text-xs text-primary/50 mt-0.5">{editor.programName}</p>
                </div>
                <button onClick={() => setEditor(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Tên chương trình', value: editor.programName },
                    { label: 'Loại tour', value: editor.type === 'mua_le' ? 'Mùa lễ' : 'Quanh năm' },
                    { label: 'Điểm khởi hành', value: editor.departurePoint },
                    { label: 'Điểm tham quan', value: editor.sightseeingSpots.join(', ') },
                    { label: 'Thời lượng tour', value: editor.durationLabel },
                    { label: 'Trạng thái', value: editor.statusLabel },
                  ].map(item => (
                    <div key={item.label} className="bg-[var(--color-surface)] p-3">
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-xl">
                  <label className="text-sm text-primary/70">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Sinh từ ngày</span>
                    <input
                      type="date"
                      min={editor.minStartDate}
                      value={editor.startDate}
                      onChange={event => {
                        const nextStartDate = event.target.value;
                        setEditor(current => {
                          if (!current) return current;
                          const nextEndDate = current.endDate && nextStartDate > current.endDate ? '' : current.endDate;
                          const program = tourPrograms.find(item => item.id === current.programId);
                          return program ? applyEditorDates(current, allInstances, program, nextStartDate, nextEndDate) : current;
                        });
                      }}
                      className="w-full border border-outline-variant/50 px-4 py-2.5 outline-none"
                    />
                    {editor.startError && <p className="mt-2 text-xs text-red-600">{editor.startError}</p>}
                  </label>
                  <label className="text-sm text-primary/70">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Đến ngày</span>
                    <input
                      type="date"
                      min={editor.startDate || editor.minStartDate}
                      value={editor.endDate}
                      onChange={event => {
                        const nextEndDate = event.target.value;
                        setEditor(current => {
                          if (!current) return current;
                          const program = tourPrograms.find(item => item.id === current.programId);
                          return program ? applyEditorDates(current, allInstances, program, current.startDate, nextEndDate) : current;
                        });
                      }}
                      className="w-full border border-outline-variant/50 px-4 py-2.5 outline-none"
                    />
                    {editor.endError && <p className="mt-2 text-xs text-red-600">{editor.endError}</p>}
                  </label>
                </div>

                {editor.mode === 'edit' && editor.managerRequestNote && (
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
                    <div className="border border-orange-200 bg-orange-50 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-orange-700 font-bold mb-2">Yêu cầu chỉnh sửa từ quản lý</p>
                      <p className="text-sm text-orange-900">{editor.managerRequestNote}</p>
                    </div>
                    <div className="border border-outline-variant/30 bg-[var(--color-surface)] p-4 text-sm text-primary/60">
                      Danh sách tour dự kiến bên phải đang dùng dữ liệu đã nhập trước đó. Chỉ sửa những dòng thực sự cần cập nhật theo yêu cầu của quản lý.
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-primary mb-3">Preview danh sách tour</p>
                  <div className="overflow-x-auto border border-outline-variant/30">
                    <table className="w-full min-w-[1320px]">
                      <thead>
                        <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                          {['Mã tour', 'Ngày khởi hành', 'Ngày kết thúc', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn', 'Giá bán', 'Lợi nhuận', 'Hạn đặt tour', 'Cùng thời điểm', 'Tạo'].map(header => (
                            <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3 whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editor.rows.map(row => (
                          <tr key={row.id} className={`border-b border-outline-variant/20 last:border-0 ${row.checked ? 'bg-white' : 'bg-gray-100 text-gray-400'}`}>
                            <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row.departureDate)}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row.endDate)}</td>
                            <td className="px-4 py-3 text-sm">{row.dayType}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={1}
                                value={row.expectedGuests}
                                disabled={!row.checked}
                                onChange={event => setEditor(current => current ? ({
                                  ...current,
                                  selectionError: '',
                                  rows: current.rows.map(item => item.id === row.id ? { ...item, expectedGuests: Math.max(1, Number(event.target.value) || 1) } : item),
                                }) : current)}
                                className="w-24 border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm">{formatMoney(row.costPerAdult)}</td>
                            <td className="px-4 py-3 text-sm">{formatMoney(row.sellPrice)}</td>
                            <td className="px-4 py-3 text-sm">{row.profitPercent}%</td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={row.bookingDeadline}
                                disabled={!row.checked}
                                onChange={event => setEditor(current => current ? ({
                                  ...current,
                                  selectionError: '',
                                  rows: current.rows.map(item => item.id === row.id ? { ...item, bookingDeadline: event.target.value } : item),
                                }) : current)}
                                className="border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {row.conflictDetails.length > 0 ? (
                                <span className="underline decoration-dotted cursor-help" title={row.conflictDetails.join('\n')}>
                                  {row.conflictLabel}
                                </span>
                              ) : row.conflictLabel}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.checked}
                                aria-label={`${editor.mode === 'create' ? 'Tạo' : 'Chọn'} ${row.id}`}
                                onChange={() => setEditor(current => current ? ({
                                  ...current,
                                  selectionError: '',
                                  rows: current.rows.map(item => item.id === row.id ? { ...item, checked: !item.checked } : item),
                                }) : current)}
                                className="accent-[var(--color-secondary)] w-4 h-4"
                              />
                            </td>
                          </tr>
                        ))}
                        {editor.rows.length === 0 && (
                          <tr>
                            <td colSpan={11} className="px-4 py-10 text-center text-sm text-primary/40">
                              Chọn khoảng thời gian hợp lệ để sinh preview tour dự kiến.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border border-t-0 border-outline-variant/30 bg-[var(--color-surface)] px-4 py-3 text-sm text-primary/70">
                    <span>Đã chọn: {selectedCount} tour</span>
                    <span>Chưa chọn: {unselectedCount} tour</span>
                  </div>
                  {editor.selectionError && (
                    <p className="mt-3 text-xs text-red-600">{editor.selectionError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditor(null)}
                    className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSendOrSave}
                    className="flex-1 py-3 font-sans uppercase tracking-wider text-xs font-bold transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {editor.mode === 'create' ? 'Gửi duyệt' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
