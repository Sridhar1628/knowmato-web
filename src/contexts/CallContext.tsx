'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from 'react';

import {
  useEffect
} from 'react';

import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';

interface CallContextType {
  isInCall: boolean;
  isMinimized: boolean;

  sessionId: number | null;

  remoteUid: number | null;

  joined: boolean;

  clientRef: React.MutableRefObject<IAgoraRTCClient | null>;

  micTrackRef: React.MutableRefObject<IMicrophoneAudioTrack | null>;

  cameraTrackRef: React.MutableRefObject<ICameraVideoTrack | null>;

  screenTrackRef: React.MutableRefObject<ILocalVideoTrack | null>;

  joinAgoraCall: (
    client: any,
    micTrack: any,
    cameraTrack: any
    ) => void;

    leaveAgoraCall: () => Promise<void>;

  connectionState:
    | 'disconnected'
    | 'connecting'
    | 'connected';

  startCall: (sessionId: number) => void;

  endCall: () => void;

  minimizeCall: () => void;

  restoreCall: () => void;

  setRemoteUid: (
    uid: number | null
  ) => void;

  setJoined: (
    value: boolean
  ) => void;

  setConnectionState: (
    value:
      | 'disconnected'
      | 'connecting'
      | 'connected'
  ) => void;
}

const CallContext =
  createContext<CallContextType | null>(
    null
  );

export function CallProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isInCall, setIsInCall] =
    useState(false);

  const [isMinimized, setIsMinimized] =
    useState(false);

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [remoteUid, setRemoteUid] =
    useState<number | null>(null);

    const [joined, setJoined] =
    useState(false);

    const [
    connectionState,
    setConnectionState
    ] = useState<
    'disconnected'
    | 'connecting'
    | 'connected'
    >('disconnected');

    const clientRef =
    useRef<IAgoraRTCClient | null>(
        null
    );

    const micTrackRef =
    useRef<IMicrophoneAudioTrack | null>(
        null
    );

    const cameraTrackRef =
    useRef<ICameraVideoTrack | null>(
        null
    );

    const screenTrackRef =
    useRef<ILocalVideoTrack | null>(
        null
    );

  const startCall = (
    sessionId: number
    ) => {

    localStorage.setItem(
        'active_call',
        JSON.stringify({
        sessionId,
        startedAt: Date.now(),
        })
    );

    setSessionId(sessionId);

    setIsInCall(true);

    setIsMinimized(false);
    };

  const endCall = () => {

    localStorage.removeItem(
    'active_call'
    );

    setIsInCall(false);

    setIsMinimized(false);

    setSessionId(null);

    setRemoteUid(null);

    setJoined(false);

    setConnectionState(
        'disconnected'
    );
    };

  const minimizeCall = () => {
    setIsMinimized(true);
  };

  const restoreCall = () => {
    setIsMinimized(false);
  };

  useEffect(() => {

    const storedCall =
        localStorage.getItem(
        'active_call'
        );

    if (!storedCall) return;

    try {

        const data =
        JSON.parse(storedCall);

        if (data?.sessionId) {

        setSessionId(
            data.sessionId
        );

        setIsInCall(true);

        }

    } catch (err) {

        console.log(
        'Failed to restore call:',
        err
        );

    }

    }, []);

    const joinAgoraCall = (
        client: any,
        micTrack: any,
        cameraTrack: any
        ) => {

        clientRef.current =
            client;

        micTrackRef.current =
            micTrack;

        cameraTrackRef.current =
            cameraTrack;

        setJoined(true);

        setConnectionState(
            'connected'
        );
    };

    const leaveAgoraCall =
        async () => {

            try {

            if (micTrackRef.current) {
                micTrackRef.current.stop();
                micTrackRef.current.close();
                }

                if (cameraTrackRef.current) {
                cameraTrackRef.current.stop();
                cameraTrackRef.current.close();
                }

                if (screenTrackRef.current) {
                screenTrackRef.current.stop();
                screenTrackRef.current.close();
                }

                if (clientRef.current) {
                clientRef.current.removeAllListeners();
                await clientRef.current.leave();
                }

            } catch (err) {

            console.error(
                'Agora cleanup error:',
                err
            );

            }

            clientRef.current = null;

            micTrackRef.current = null;

            cameraTrackRef.current = null;

            screenTrackRef.current = null;

            endCall();
        };

  return (
    <CallContext.Provider
      value={{
        isInCall,
        isMinimized,

        sessionId,

        remoteUid,

        joined,

        connectionState,

        startCall,

        endCall,

        minimizeCall,

        restoreCall,

        setRemoteUid,

        setJoined,

        setConnectionState,

        clientRef,

        micTrackRef,

        cameraTrackRef,

        screenTrackRef,

        joinAgoraCall,

        leaveAgoraCall,
        }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context =
    useContext(CallContext);

  if (!context) {
    throw new Error(
      'useCall must be used inside CallProvider'
    );
  }

  return context;
};