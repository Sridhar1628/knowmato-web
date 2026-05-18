'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/services/apiService';

export default function TutorDoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    const res = await apiGet('doubts/');
    setDoubts(res.data || []);
  };

  const handleAccept = async (id: number) => {
    try {
      await apiPost(`doubts/${id}/accept/`, {});
      alert('Accepted!');
      fetchDoubts();
    } catch {
      alert('Error');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Available Doubts</h1>

      {doubts.map((d) => (
        <div key={d.id} className="border p-4 mb-3 rounded">
          <p>{d.text}</p>

          <button
            onClick={() => handleAccept(d.id)}
            className="bg-green-500 text-white px-3 py-1 mt-2 rounded"
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  );
}