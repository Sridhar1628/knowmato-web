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

  isJoining: boolean;

  toggleMute: () => Promise<void>;

  toggleScreenShare: () => Promise<void>;

  isInitialized: boolean;

  isMuted: boolean;

  setIsMuted: (
      value: boolean
  ) => void;

  isScreenSharing: boolean;

  setIsScreenSharing: (
      value: boolean
  ) => void;

  setIsJoining: (
    value: boolean
  ) => void;

  setIsInitialized: (
    value: boolean
  ) => void;

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

  initializeAgora: (params: {
      appId: string;
      channel: string;
      token: string;
      uid: number;
  }) => Promise<void>;

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

  const [isJoining, setIsJoining] =
    useState(false);

  const [isInitialized, setIsInitialized] =
    useState(false);

  const [isMuted, setIsMuted] =
      useState(false);

  const [isScreenSharing, setIsScreenSharing] =
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

    setIsJoining(false);

    setIsInitialized(false);

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

  const toggleMute = async () => {

        if (!micTrackRef.current) return;

        const muted = !isMuted;

        await micTrackRef.current.setEnabled(!muted);

        setIsMuted(muted);

    };

    const toggleScreenShare = async () => {

      const client = clientRef.current;

      if (!client) return;

      const AgoraRTC = (await import(
          "agora-rtc-sdk-ng"
      )).default;

      try {

          if (!isScreenSharing) {

              const createdTrack =
                  await AgoraRTC.createScreenVideoTrack(
                      {},
                      "disable"
                  );

              const track =
                  Array.isArray(createdTrack)
                      ? createdTrack[0]
                      : createdTrack;

              screenTrackRef.current =
                  track;

              if (cameraTrackRef.current) {

                  await client.unpublish(
                      cameraTrackRef.current
                  );

              }

              await client.publish(track);

              setIsScreenSharing(true);

          } else {

              if (screenTrackRef.current) {

                  await client.unpublish(
                      screenTrackRef.current
                  );

                  screenTrackRef.current.stop();

                  screenTrackRef.current.close();

                  screenTrackRef.current = null;

              }

              setIsScreenSharing(false);

          }

      } catch (err) {

          console.error(
              "Screen Share Error:",
              err
          );

      }

  };

  const initializeAgora = async ({
      appId,
      channel,
      token,
      uid,
  }: {
      appId: string;
      channel: string;
      token: string;
      uid: number;
  }) => {

      if (clientRef.current) {
          return;
      }

      const AgoraRTC = (
          await import("agora-rtc-sdk-ng")
      ).default;

      const client =
          AgoraRTC.createClient({
              mode: "rtc",
              codec: "vp8",
          });

      clientRef.current = client;

      const tracks =
          await AgoraRTC.createMicrophoneAndCameraTracks();

      const micTrack = tracks[0];
      const cameraTrack = tracks[1];

      await cameraTrack.setEnabled(false);

      micTrackRef.current = micTrack;
      cameraTrackRef.current = cameraTrack;

      await client.join(
          appId,
          channel,
          token,
          uid
      );

      await client.publish([
          micTrack,
          cameraTrack,
      ]);

      setJoined(true);

      setConnectionState(
          "connected"
      );
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

        isJoining,

        isInitialized,

        setIsJoining,

        setIsInitialized,

        isMuted,
        setIsMuted,

        isScreenSharing,
        setIsScreenSharing,

        toggleMute,

        toggleScreenShare,

        initializeAgora,
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