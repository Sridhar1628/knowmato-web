import { CurrentAffair } from '@/services/v1Service';

export interface DashboardCacheState {

  loaded: boolean;

  lastFetched: number;

  currentPrice: number | null;

  onlineTutors: any[];

  currentAffairs: CurrentAffair[];

  recentDoubts: any[];

}

export const dashboardCache: DashboardCacheState = {

  loaded: false,

  lastFetched: 0,

  currentPrice: null,

  onlineTutors: [],

  currentAffairs: [],

  recentDoubts: [],

};