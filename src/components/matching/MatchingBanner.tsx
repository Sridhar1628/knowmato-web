'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next'; // ✅ added

import { RootState } from '@/redux/store';

const HEADER_HEIGHT = 80; // Adjust if your header height changes

const MatchingBanner = () => {
  const { t } = useTranslation(); // ✅
  const router = useRouter();
  const pathname = usePathname();

  const matching = useSelector(
    (state: RootState) => state.matching
  );

  console.log("🎯 Banner Redux:", matching);

  // Hide when there is no active matching
  if (!matching.isMatching || !matching.doubtId) {
    return null;
  }

  // Hide when already on the matching page
  if (pathname === '/student/matching') {
    return null;
  }

  const minutes = Math.floor(
    matching.remainingSeconds / 60
  );

  const seconds = matching.remainingSeconds % 60;

  const formattedTime = `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const isDecision =
    matching.status === 'decision';

  const handleClick = () => {
    router.push(
      `/student/matching?doubtId=${matching.doubtId}`
    );
  };

  return (
    <div
      onClick={handleClick}
      className="
        fixed
        left-1/2
        -translate-x-1/2
        z-[9999]
        w-[95%]
        max-w-2xl
        cursor-pointer
        rounded-2xl
        bg-violet-700
        text-white
        shadow-2xl
        transition-all
        duration-300
        hover:scale-[1.01]
      "
      style={{
        top: HEADER_HEIGHT + 16,
      }}
    >
      <div className="flex items-center justify-between p-5">

        <div className="flex-1 pr-4">

          <h3 className="text-lg font-bold">
            {isDecision
              ? t('matching.actionRequiredBannerTitle')
              : t('matching.findingTutorBannerTitle')}
          </h3>

          <p className="mt-1 text-sm text-violet-100">
            {isDecision
              ? t('matching.actionRequiredBannerDesc')
              : t('matching.findingTutorBannerDesc')}
          </p>

        </div>

        <div className="text-right">

          {isDecision ? (

            <div className="text-lg font-bold">
              {t('matching.returnButton')}
            </div>

          ) : (

            <>
              <div className="text-2xl font-extrabold">
                {formattedTime}
              </div>

              <div className="mt-1 text-sm font-medium">
                {t('matching.returnButton')}
              </div>
            </>

          )}

        </div>

      </div>
    </div>
  );
};

export default MatchingBanner;