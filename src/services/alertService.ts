import type {
  AlertButton,
  ShowAlertParams,
} from '@/components/common/CustomAlert/types';

class AlertServiceClass {
  private showAlertHandler:
    | ((params: ShowAlertParams) => void)
    | null = null;

  private hideAlertHandler:
    | (() => void)
    | null = null;

  private queue: ShowAlertParams[] = [];

  private isShowing = false;

  // =====================================================
  // REGISTER
  // =====================================================

  register(
    showHandler: (params: ShowAlertParams) => void,
    hideHandler: () => void,
  ): void {
    this.showAlertHandler = showHandler;
    this.hideAlertHandler = hideHandler;
  }

  // =====================================================
  // UNREGISTER
  // =====================================================

  unregister(): void {
    this.showAlertHandler = null;
    this.hideAlertHandler = null;
    this.queue = [];
    this.isShowing = false;
  }

  // =====================================================
  // SHOW
  // =====================================================

  show(params: ShowAlertParams): void {
    if (!this.showAlertHandler) {
      console.warn(
        '⚠️ AlertService is not registered. Make sure <CustomAlert /> is mounted.',
      );
      return;
    }

    if (this.isShowing) {
      this.queue.push(params);
      return;
    }

    this.isShowing = true;

    this.showAlertHandler(params);
  }

  // =====================================================
  // SUCCESS
  // =====================================================

  success(
    title: string,
    message: string,
  ): void {
    this.show({
      type: 'success',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    });
  }

  // =====================================================
  // ERROR
  // =====================================================

  error(
    title: string,
    message: string,
  ): void {
    this.show({
      type: 'error',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    });
  }

  // =====================================================
  // WARNING
  // =====================================================

  warning(
title: string, message: string, p0: ({ text: string; style: string; onPress?: undefined; } | { text: string; style: string; onPress: () => void; })[],
  ): void {
    this.show({
      type: 'warning',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    });
  }

  // =====================================================
  // INFO
  // =====================================================

  info(
    title: string,
    message: string,
    buttons?: AlertButton[],
  ): void {
    this.show({
      type: 'info',
      title,
      message,
      buttons:
        buttons && buttons.length > 0
          ? buttons
          : [
              {
                text: 'OK',
                style: 'default',
              },
            ],
    });
  }

  // =====================================================
  // LOADING
  // =====================================================

  loading(
    message = 'Please wait...',
  ): void {
    this.show({
      type: 'loading',
      title: 'Please Wait',
      message,
      buttons: [],
    });
  }

  // =====================================================
  // HIDE LOADING
  // =====================================================

  hideLoading(): void {
    this.closeCurrent();
  }

  // =====================================================
  // CONFIRM
  // =====================================================

  confirm(
    title: string,
    message: string,
    onConfirmOrButtons:
      | (() => void)
      | AlertButton[],
    confirmText = 'Yes',
    cancelText = 'Cancel',
  ): void {
    let buttons: AlertButton[];

    if (Array.isArray(onConfirmOrButtons)) {
      buttons = onConfirmOrButtons.map(
        (button) => ({
          text: button.text,
          style:
            button.style ?? 'default',
          onPress:
            typeof button.onPress === 'function'
              ? button.onPress
              : undefined,
        }),
      );
    } else {
      buttons = [
        {
          text: cancelText,
          style: 'cancel',
        },
        {
          text: confirmText,
          style: 'destructive',
          onPress: onConfirmOrButtons,
        },
      ];
    }

    this.show({
      type: 'confirm',
      title,
      message,
      buttons,
    });
  }

  // =====================================================
  // CLOSE CURRENT
  // =====================================================

  private closeCurrent(): void {
    if (!this.isShowing) {
      return;
    }

    this.hideAlertHandler?.();

    this.isShowing = false;

    this.showNext();
  }

  // =====================================================
  // ALERT CLOSED BY UI
  // =====================================================

  onDialogClosed(): void {
    if (!this.isShowing) {
      return;
    }

    this.isShowing = false;

    this.showNext();
  }

  // =====================================================
  // SHOW NEXT
  // =====================================================

  private showNext(): void {
    if (this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();

    if (
      next &&
      this.showAlertHandler
    ) {
      this.isShowing = true;

      this.showAlertHandler(next);
    }
  }
}

// =======================================================
// SINGLETON INSTANCE
// =======================================================

const AlertService =
  new AlertServiceClass();

export default AlertService;