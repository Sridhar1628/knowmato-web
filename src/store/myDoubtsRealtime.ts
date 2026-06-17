// src/store/myDoubtsRealtime.ts

import { myDoubtsCache } from './myDoubtsCache';

type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeMyDoubts = (
  listener: Listener
) => {
  listeners.add(listener);

  return (): void => {
    listeners.delete(listener);
  };
};

const notify = () => {

  listeners.forEach(
    listener => listener()
  );

};

export const updateDoubt = (
  doubt: any
) => {

  const exists =
    myDoubtsCache.doubts.find(
      item =>
        item.doubt_id ===
        doubt.doubt_id
    );

  if (exists) {

    myDoubtsCache.doubts =
      myDoubtsCache.doubts.map(
        item =>

          item.doubt_id ===
          doubt.doubt_id

            ? {
                ...item,
                ...doubt,
              }

            : item
      );

  } else {

    myDoubtsCache.doubts = [

      doubt,

      ...myDoubtsCache.doubts,

    ];

    myDoubtsCache.totalCount += 1;

  }

  notify();

};

export const removeDoubt = (
  doubtId: number
) => {

  myDoubtsCache.doubts =
    myDoubtsCache.doubts.filter(
      doubt =>
        doubt.doubt_id !==
        doubtId
    );

  notify();

};