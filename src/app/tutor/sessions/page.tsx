'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/services/apiService';
import { useRouter } from 'next/navigation';

export default function TutorSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const res = await apiGet('sessions/my-sessions/');
    setSessions(res.data || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">My Sessions</h1>

      {sessions.map((s) => (
        <div
          key={s.session_id}
          onClick={() => router.push(`/chat/${s.session_id}`)}
          className="border p-3 mb-2 cursor-pointer"
        >
          {s.doubt} - {s.status}
        </div>
      ))}
    </div>
  );
}