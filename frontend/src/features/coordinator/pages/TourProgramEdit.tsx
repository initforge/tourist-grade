import { Navigate, useParams } from 'react-router-dom';
import TourProgramWizard from './TourProgramWizard';
import { useAppDataStore } from '@shared/store/useAppDataStore';

export default function TourProgramEdit() {
  const { id } = useParams<{ id: string }>();
  const program = useAppDataStore(state => state.tourPrograms.find(item => item.id === id));

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
