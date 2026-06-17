import { dashboardCache } from './dashboardCache';

type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeDashboard = (
  listener: Listener
) => {

  listeners.add(listener);

  return () =>
    listeners.delete(listener);
};

export const notifyDashboard = () => {

  listeners.forEach(
    (listener) => listener()
  );
};

export const updateOnlineTutor = (
  userId: number,
  isOnline: boolean
) => {

  console.log(
    'BEFORE:',
    dashboardCache.onlineTutors
  );

  dashboardCache.onlineTutors =
    dashboardCache.onlineTutors.map(
      (tutor) => {

        console.log(
          'COMPARE',
          tutor.id,
          userId
        );

        if (tutor.id === userId) {

          console.log(
            'MATCH FOUND',
            tutor.display_name
          );

          return {
            ...tutor,
            is_online: isOnline,
          };
        }

        return tutor;
      }
    );

  console.log(
    'AFTER:',
    dashboardCache.onlineTutors
  );

  notifyDashboard();
};

export const updateRecentDoubt = (
  doubt: any
) => {

  const exists =
    dashboardCache.recentDoubts.find(
      (d) =>
        d.doubt_id ===
        doubt.doubt_id
    );

  if (exists) {

    dashboardCache.recentDoubts =
      dashboardCache.recentDoubts.map(
        (d) =>
          d.doubt_id === doubt.doubt_id
            ? {
                ...d,
                ...doubt,
              }
            : d
      );

  } else {

    dashboardCache.recentDoubts = [
      doubt,
      ...dashboardCache.recentDoubts,
    ].slice(0, 6);

  }

  notifyDashboard();
};