'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCall } from '@/contexts/CallContext';

export default function FloatingCallWidget() {
  const router = useRouter();

  const {
    isInCall,
    isMinimized,
    sessionId,
    restoreCall,
    leaveAgoraCall,
    remoteUid,
    connectionState,
  } = useCall();

  const [seconds, setSeconds] =
    useState(0);

  useEffect(() => {
    if (!isInCall) return;

    const interval =
      setInterval(() => {
        setSeconds(
          prev => prev + 1
        );
      }, 1000);

    return () =>
      clearInterval(interval);
  }, [isInCall]);

  const formatTime = (
    totalSeconds: number
  ) => {
    const hrs =
      Math.floor(
        totalSeconds / 3600
      );

    const mins =
      Math.floor(
        (totalSeconds % 3600) /
          60
      );

    const secs =
      totalSeconds % 60;

    return `${hrs
      .toString()
      .padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (
    !isInCall ||
    !isMinimized
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed
        bottom-5
        right-5
        z-[9999]
        w-80
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-2xl
        p-4
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            Active Call
          </h3>

          <p className="text-xs text-gray-500">
            Session #{sessionId}
          </p>
        </div>

        <span
          className={`h-3 w-3 rounded-full ${
            connectionState ===
            'connected'
              ? 'bg-green-500'
              : connectionState ===
                'connecting'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
        />
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-gray-700">
          {formatTime(seconds)}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {remoteUid
            ? 'Participant Connected'
            : 'Waiting for participant'}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            restoreCall();

            router.replace(
              `/videocall/${sessionId}`
            );
          }}
          className="
            flex-1
            rounded-xl
            bg-indigo-600
            py-2
            text-white
            font-semibold
            hover:bg-indigo-700
          "
        >
          Return
        </button>

        <button
          onClick={async () => {
            await leaveAgoraCall();
          }}
          className="
            rounded-xl
            bg-red-600
            px-4
            py-2
            text-white
            font-semibold
            hover:bg-red-700
          "
        >
          End
        </button>
      </div>
    </div>
  );
}