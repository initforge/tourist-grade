import { Navigate, useParams } from 'react-router-dom';
import TourProgramWizard from './TourProgramWizard';
import { useAppDataStore } from '@shared/store/useAppDataStore';

export default function TourProgramEdit() {
  const { id } = useParams<{ id: string }>();
  const program = useAppDataStore(state => state.tourPrograms.find(item => item.id === id));
  const protectedReady = useAppDataStore(state => state.protectedReady);
  const protectedLoading = useAppDataStore(state => state.protectedLoading);

  if ((protectedLoading || !protectedReady) && !program) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary/30">progress_activity</span>
          <p className="text-sm text-primary/60">Đang tải dữ liệu chương trình tour...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return <Navigate to="/coordinator/tour-programs" replace />;
  }

  return (
    <TourProgramWizard
      initialProgram={program}
      headerTitle="Chỉnh sửa chương trình tour"
      persistMode="edit"
    />
  );
}
