'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
  X,
} from 'lucide-react';

import AlertService from '@/services/alertService';

import type {
  AlertButton,
  AlertType,
  ShowAlertParams,
} from './types';

interface AlertIconConfig {
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    strokeWidth?: number;
  }>;
  iconClass: string;
  iconBackground: string;
}

const iconConfig: Record<
  Exclude<AlertType, 'loading'>,
  AlertIconConfig
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    iconBackground:
      'bg-emerald-500/10 border-emerald-500/20',
  },

  error: {
    icon: AlertCircle,
    iconClass: 'text-red-400',
    iconBackground:
      'bg-red-500/10 border-red-500/20',
  },

  warning: {
    icon: TriangleAlert,
    iconClass: 'text-amber-400',
    iconBackground:
      'bg-amber-500/10 border-amber-500/20',
  },

  info: {
    icon: Info,
    iconClass: 'text-sky-400',
    iconBackground:
      'bg-sky-500/10 border-sky-500/20',
  },

  confirm: {
    icon: Info,
    iconClass: 'text-violet-400',
    iconBackground:
      'bg-violet-500/10 border-violet-500/20',
  },
};

export default function CustomAlert() {
  const [visible, setVisible] =
    useState(false);

  const [alert, setAlert] =
    useState<ShowAlertParams | null>(null);

  const firstButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const previousActiveElement =
    useRef<HTMLElement | null>(null);

  // =====================================================
  // SHOW
  // =====================================================

  const showAlert = useCallback(
    (params: ShowAlertParams) => {
      setAlert({
        ...params,
        buttons:
          params.buttons ?? [],
      });

      setVisible(true);
    },
    [],
  );

  // =====================================================
  // HIDE
  // =====================================================

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  // =====================================================
  // REGISTER SERVICE
  // =====================================================

  useEffect(() => {
    AlertService.register(
      showAlert,
      hideAlert,
    );

    return () => {
      AlertService.unregister();
    };
  }, [
    showAlert,
    hideAlert,
  ]);

  // =====================================================
  // FOCUS
  // =====================================================

  useEffect(() => {
    if (!visible) {
      return;
    }

    previousActiveElement.current =
      document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      firstButtonRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [visible]);

  // =====================================================
  // RESTORE FOCUS
  // =====================================================

  useEffect(() => {
    if (visible) {
      return;
    }

    const element =
      previousActiveElement.current;

    if (element) {
      window.setTimeout(() => {
        element.focus();
      }, 0);
    }

    previousActiveElement.current = null;
  }, [visible]);

  // =====================================================
  // ESCAPE
  // =====================================================

  useEffect(() => {
    if (!visible) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (alert?.type === 'loading') {
        return;
      }

      event.preventDefault();

      closeFromUI();
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    visible,
    alert?.type,
  ]);

  // =====================================================
  // UI CLOSE
  // =====================================================

  const closeFromUI = useCallback(() => {
    if (!visible) {
      return;
    }

    setVisible(false);
    setAlert(null);

    AlertService.onDialogClosed();
  }, [visible]);

  // =====================================================
  // BUTTON PRESS
  // =====================================================

  const handleButtonPress = (
    button: AlertButton,
  ) => {
    if (alert?.type === 'loading') {
      return;
    }

    /*
     * Execute the callback first.
     *
     * If the callback itself triggers another
     * AlertService call, the service will queue it
     * because the current alert is still active.
     *
     * Then we close the current alert and allow
     * AlertService to display the next queued alert.
     */
    try {
      button.onPress?.();
    } finally {
      closeFromUI();
    }
  };

  // =====================================================
  // BACKDROP
  // =====================================================

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event.target !== event.currentTarget
    ) {
      return;
    }

    /*
     * We intentionally do not close normal alerts
     * by clicking outside.
     *
     * This prevents accidental dismissal of
     * important success/error/confirmation alerts.
     */
  };

  const currentType =
    alert?.type ?? 'info';

  const isLoading =
    currentType === 'loading';

  const buttons =
    alert?.buttons ?? [];

  const iconData =
    currentType !== 'loading'
      ? iconConfig[currentType]
      : null;

  const Icon =
    iconData?.icon;

  return (
    <AnimatePresence>
      {visible && alert && (
        <motion.div
          key="custom-alert-overlay"
          role="presentation"
          className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
          onMouseDown={handleBackdropClick}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="knowmato-alert-title"
            aria-describedby="knowmato-alert-message"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#1f2937] shadow-2xl"
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 8,
            }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            {/* =================================================
                CLOSE BUTTON
                ================================================= */}

            {!isLoading && (
              <button
                type="button"
                aria-label="Close alert"
                onClick={closeFromUI}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <X
                  size={19}
                  strokeWidth={2}
                />
              </button>
            )}

            {/* =================================================
                CONTENT
                ================================================= */}

            <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
              {/* Icon / Loading */}

              <div className="flex justify-center">
                {isLoading ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10">
                    <Loader2
                      size={34}
                      strokeWidth={2}
                      className="animate-spin text-violet-400"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full border ${iconData?.iconBackground}`}
                  >
                    {Icon && (
                      <Icon
                        size={34}
                        strokeWidth={2}
                        className={iconData?.iconClass}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Title */}

              <h2
                id="knowmato-alert-title"
                className="mt-5 text-center text-xl font-bold tracking-tight text-white sm:text-2xl"
              >
                {alert.title}
              </h2>

              {/* Message */}

              <p
                id="knowmato-alert-message"
                className="mt-3 whitespace-pre-wrap text-center text-sm leading-6 text-white/65 sm:text-base"
              >
                {alert.message}
              </p>

              {/* =================================================
                  BUTTONS
                  ================================================= */}

              {!isLoading &&
                buttons.length > 0 && (
                  <div
                    className={`mt-7 grid gap-3 ${
                      buttons.length === 1
                        ? 'grid-cols-1'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {buttons.map(
                      (
                        button,
                        index,
                      ) => {
                        const style =
                          button.style ??
                          'default';

                        const isCancel =
                          style ===
                          'cancel';

                        const isDestructive =
                          style ===
                          'destructive';

                        const isFirst =
                          index === 0;

                        return (
                          <button
                            key={`${button.text}-${index}`}
                            ref={
                              isFirst
                                ? firstButtonRef
                                : undefined
                            }
                            type="button"
                            onClick={() =>
                              handleButtonPress(
                                button,
                              )
                            }
                            className={[
                              'min-h-12 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-[0.98]',
                              isDestructive
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-900/20 hover:from-red-400 hover:to-red-500'
                                : '',
                              isCancel
                                ? 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                : '',
                              !isCancel &&
                              !isDestructive
                                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/20 hover:from-violet-400 hover:to-indigo-500'
                                : '',
                            ].join(' ')}
                          >
                            {button.text}
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

              {/* =================================================
                  LOADING INDICATOR
                  ================================================= */}

              {isLoading && (
                <div
                  className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40"
                  aria-live="polite"
                >
                  <span>
                    Processing...
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}