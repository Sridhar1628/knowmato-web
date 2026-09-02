export type AlertType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'confirm'
  | 'loading';

export type AlertButtonStyle =
  | 'default'
  | 'cancel'
  | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface ShowAlertParams {
  type?: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
}

export interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
}