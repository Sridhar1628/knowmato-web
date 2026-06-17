'use client';

import { useRouter } from 'next/navigation';
import { useCall } from '@/contexts/CallContext';

export default function FloatingCallWidget() {
  const router = useRouter();

  const {
    isInCall,
    isMinimized,
    sessionId,
    restoreCall,
  } = useCall();

  if (!isInCall || !isMinimized) {
    return null;
  }

  return (
    <div
      className="
        fixed
        bottom-5
        right-5
        z-[9999]
        w-72
        rounded-2xl
        bg-white
        shadow-2xl
        border
        border-gray-200
        p-4
      "
    >
      <div className="flex items-center gap-2">
        <span className="text-green-500">
          📞
        </span>

        <div>
          <h3 className="font-semibold text-gray-900">
            Call in Progress
          </h3>

          <p className="text-sm text-gray-500">
            Session #{sessionId}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          restoreCall();

          router.push(
            `/videocall/${sessionId}`
          );
        }}
        className="
          mt-4
          w-full
          rounded-xl
          bg-indigo-600
          py-2
          text-white
          font-semibold
          hover:bg-indigo-700
        "
      >
        Return To Call
      </button>
    </div>
  );
}