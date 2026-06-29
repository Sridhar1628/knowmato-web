import { Suspense } from 'react';
import StudentChatHistoryScreen from './StudentChatHistoryScreen';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentChatHistoryScreen />
    </Suspense>
  );
}