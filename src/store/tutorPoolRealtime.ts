import {
  tutorPoolCache,
  PoolDoubt,
} from "./tutorPoolCache";

type Listener = () => void;

const listeners = new Set<Listener>();

// ------------------------------------------
// Subscribe
// ------------------------------------------

export const subscribeTutorPool = (
  listener: Listener
) => {

  listeners.add(listener);

  return () => listeners.delete(listener);

};

// ------------------------------------------
// Notify
// ------------------------------------------

export const notifyTutorPool = () => {

  listeners.forEach(listener => listener());

};

// ------------------------------------------
// Replace All Data
// ------------------------------------------

export const setTutorPool = (

  openDoubts: PoolDoubt[],

  acceptedDoubts: PoolDoubt[]

) => {

  tutorPoolCache.openDoubts = openDoubts;

  tutorPoolCache.acceptedDoubts = acceptedDoubts;

  tutorPoolCache.loaded = true;

  tutorPoolCache.loading = false;

  tutorPoolCache.timers = {};

  openDoubts.forEach(doubt => {

    tutorPoolCache.timers[doubt.doubt_id] =
      doubt.expires_in;

  });

  notifyTutorPool();

};

// ------------------------------------------
// Add New Doubt
// ------------------------------------------

export const addPoolDoubt = (
  doubt: PoolDoubt
) => {

  const exists =
    tutorPoolCache.openDoubts.find(

      d => d.doubt_id === doubt.doubt_id

    );

  if (exists) return;

  tutorPoolCache.openDoubts = [

    doubt,

    ...tutorPoolCache.openDoubts,

  ];

  tutorPoolCache.timers[doubt.doubt_id] =
    doubt.expires_in;

  notifyTutorPool();

};

// ------------------------------------------
// Accept Doubt
// ------------------------------------------

export const acceptPoolDoubt = (

  doubtId: number,

  sessionId: number

) => {

  const doubt =
    tutorPoolCache.openDoubts.find(

      d => d.doubt_id === doubtId

    );

  if (!doubt) return;

  tutorPoolCache.openDoubts =
    tutorPoolCache.openDoubts.filter(

      d => d.doubt_id !== doubtId

    );

  delete tutorPoolCache.timers[doubtId];

  tutorPoolCache.acceptedDoubts = [

    {

      ...doubt,

      status: "assigned",

      session_id: sessionId,

    },

    ...tutorPoolCache.acceptedDoubts,

  ];

  notifyTutorPool();

};

// ------------------------------------------
// Remove Doubt
// ------------------------------------------

export const removePoolDoubt = (
  doubtId: number
) => {

  tutorPoolCache.openDoubts =
    tutorPoolCache.openDoubts.filter(

      d => d.doubt_id !== doubtId

    );

  tutorPoolCache.acceptedDoubts =
    tutorPoolCache.acceptedDoubts.filter(

      d => d.doubt_id !== doubtId

    );

  delete tutorPoolCache.timers[doubtId];

  notifyTutorPool();

};

// ------------------------------------------
// Update Timer
// ------------------------------------------

export const tickPoolTimers = () => {

  Object.keys(
    tutorPoolCache.timers
  ).forEach(id => {

    const key = Number(id);

    tutorPoolCache.timers[key] = Math.max(

      0,

      tutorPoolCache.timers[key] - 1

    );

    if (

      tutorPoolCache.timers[key] === 0

    ) {

      removePoolDoubt(key);

    }

  });

  notifyTutorPool();

};

// ------------------------------------------
// Clear
// ------------------------------------------

export const clearTutorPool = () => {

  tutorPoolCache.openDoubts = [];

  tutorPoolCache.acceptedDoubts = [];

  tutorPoolCache.timers = {};

  tutorPoolCache.loaded = false;

  tutorPoolCache.loading = false;

  notifyTutorPool();

};