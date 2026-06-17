import { dashboardCache } from './dashboardCache';
import { notifyDashboard } from './dashboardRealtime';

export const updateDashboardCache = (
  event: string,
  data: any
) => {

  switch (event) {

    case 'WALLET_UPDATE':
      notifyDashboard();
      break;

    case 'PRESENCE_UPDATE':

      dashboardCache.onlineTutors =
        dashboardCache.onlineTutors.map(
          (tutor) =>
            tutor.id === data.user_id
              ? {
                  ...tutor,
                  is_online: data.is_online,
                }
              : tutor
        );

      notifyDashboard();

      break;

    case 'DOUBT_CREATED':

      dashboardCache.recentDoubts = [
        data,
        ...dashboardCache.recentDoubts,
      ].slice(0, 6);

      notifyDashboard();

      break;

    case 'DOUBT_UPDATED':

      dashboardCache.recentDoubts =
        dashboardCache.recentDoubts.map(
          (doubt) =>
            doubt.doubt_id === data.doubt_id
              ? {
                  ...doubt,
                  ...data,
                }
              : doubt
        );

      notifyDashboard();

      break;

    default:
      break;
  }
};