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

  isRemoteScreenSharing: boolean;

  setIsRemoteScreenSharing: (
      value: boolean
  ) => void;

  showNotification: (
      title: string,
      body: string
  ) => void;


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

  const callInitializedRef =
    useRef(false);

  const [
      isRemoteScreenSharing,
      setIsRemoteScreenSharing,
  ] = useState(false);


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

    useEffect(() => {

      const visibilityChanged = () => {

          if (
              document.hidden
          ) {

          } else {
          }

      };

      document.addEventListener(
          "visibilitychange",
          visibilityChanged
      );

      return () => {

          document.removeEventListener(
              "visibilitychange",
              visibilityChanged
          );

      };

  }, []);

    useEffect(() => {

        if (
            typeof window === "undefined"
        ) return;

        if (
            !("Notification" in window)
        ) return;

        if (
            Notification.permission === "default"
        ) {

            Notification.requestPermission();

        }

    }, []);

    useEffect(() => {

      const handleOffline = () => {

          setConnectionState(
              "disconnected"
          );

      };

      const handleOnline = async () => {

          if (
              clientRef.current
          ) {

              return;
          }

          setConnectionState(
              "connecting"
          );

      };

      window.addEventListener(
          "offline",
          handleOffline
      );

      window.addEventListener(
          "online",
          handleOnline
      );

      return () => {

          window.removeEventListener(
              "offline",
              handleOffline
          );

          window.removeEventListener(
              "online",
              handleOnline
          );

      };

  }, []);

  const startCall = (
    sessionId: number
    ) => {

    localStorage.setItem(
      "active_call",
      JSON.stringify({

          sessionId,

          startedAt: Date.now(),

          minimized: false,

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

      showNotification(

          "📞 Call Running",

          "Your KnowMato session is still active."

      );

      const data = JSON.parse(
          localStorage.getItem("active_call") || "{}"
      );

      localStorage.setItem(
          "active_call",
          JSON.stringify({

              ...data,

              minimized: true,

          })
      );


  };

  const restoreCall = () => {

      setIsMinimized(false);

      const data = JSON.parse(
          localStorage.getItem("active_call") || "{}"
      );

      localStorage.setItem(
          "active_call",
          JSON.stringify({

              ...data,

              minimized: false,

          })
      );

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

        callInitializedRef.current = false;


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

              callInitializedRef.current = false;

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

    const stopScreenShare = async () => {

      const client = clientRef.current;

      if (!client) return;

      if (!screenTrackRef.current) return;

      await client.unpublish([
          screenTrackRef.current,
      ]);

      try {

          screenTrackRef.current.close();

      } catch (e) {

          console.log(e);

      }

      screenTrackRef.current = null;

      setIsScreenSharing(false);

  };

    const toggleScreenShare = async () => {

      console.log("Publishing Screen Track");
      console.log(screenTrackRef.current);
      console.log(document.getElementById("local-screen-container"));

      console.log("🖥️ Screen share started");

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

              track.on(
                "track-ended",
                async () => {

                    console.log(
                        "🖥️ Screen share stopped by browser"
                    );

                    await stopScreenShare();

                }
            );


              await client.publish(track);

              console.log(
                  "✅ Published screen track:",
                  track.getTrackId()
              );

              console.log(
                  "Video Enabled:",
                  track.enabled
              );

              console.log(
                  "Ready State:",
                  track.getMediaStreamTrack().readyState
              );

              const container = document.getElementById("local-screen-container");

                if (container) {
                    track.play(container);
                } else {
                    console.error("local-screen-container not found");
                }

              setIsScreenSharing(true);

          } else {

              await stopScreenShare();

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

      if (callInitializedRef.current) {
          console.log("Agora already initialized");
          return;
      }

      callInitializedRef.current = true;

      const AgoraRTC = (
          await import("agora-rtc-sdk-ng")
      ).default;

      if (
          clientRef.current
      ) {

          console.log(
              "♻️ Reusing Agora client"
          );

          return;

      }

      const client =
          AgoraRTC.createClient({
              mode: "rtc",
              codec: "vp8",
          });

      clientRef.current = client;

      client.on(
          "user-unpublished",
          (
              user: any,
              mediaType: "video" | "audio"
          ) => {

              if (mediaType === "video") {

                  user.videoTrack?.stop();

                  setIsRemoteScreenSharing(false);

              }

          }
      );

      client.on(
        "user-published",
        async (user: any, mediaType: "video" | "audio") => {

          console.log("Remote published");
          console.log(user.videoTrack);
          console.log(document.getElementById("remote-video-container"));

            await client.subscribe(
                user,
                mediaType
            );

            if (
                !remoteUid
            ) {

                setRemoteUid(
                    Number(user.uid)
                );

                showNotification(

                    "👤 Participant Connected",

                    "The other participant joined the session."

                );

            }

            if (mediaType === "video") {

              setIsRemoteScreenSharing(true);

              showNotification(
                  "🖥️ Screen Sharing",
                  "The participant started sharing their screen."
              );

              user.videoTrack?.play(
                  "remote-video-container"
              );

          }

            if (
                mediaType === "audio"
            ) {
                user.audioTrack?.play();
            }

        }
    );

    client.on(
      "user-left",
      () => {

          console.log(
              "👋 Remote user left"
          );

          showNotification(

              "👋 Participant Left",

              "The participant left the session."

          );

          setRemoteUid(null);

          setIsRemoteScreenSharing(
              false
          );

      }
  );

    client.on(
        "connection-state-change",
        (state: string) => {

            switch (state) {

                case "CONNECTED":
                    setConnectionState("connected");
                    break;

                case "CONNECTING":
                    setConnectionState("connecting");
                    break;

                default:
                    setConnectionState("disconnected");

            }

        }
    );

      const micTrack =
          await AgoraRTC.createMicrophoneAudioTrack();

      micTrackRef.current = micTrack;

      cameraTrackRef.current = null;

      await client.join(
          appId,
          channel,
          token,
          uid
      );

      await client.publish([
          micTrack
      ]);

      setJoined(true);

      setConnectionState(
          "connected"
      );
  };

  const showNotification = (
      title: string,
      body: string
  ) => {

      if (
          typeof window === "undefined"
      ) return;

      if (
          !("Notification" in window)
      ) return;

      if (
          Notification.permission !== "granted"
      ) return;

      const notification =
          new Notification(
              title,
              {
                  body,
                  icon: "/logo.png",
                  tag: "knowMato-call",
                  requireInteraction: true,
              }
          );

      notification.onclick = () => {

          window.focus();

          if (sessionId) {

              window.location.href =
                  `/videocall/${sessionId}`;

          }

      };

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

        isRemoteScreenSharing,

        setIsRemoteScreenSharing,

        showNotification,

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