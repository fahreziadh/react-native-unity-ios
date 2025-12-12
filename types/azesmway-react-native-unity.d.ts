declare module "@azesmway/react-native-unity" {
  import * as React from "react";
  import type { ViewProps } from "react-native";

  export type UnityViewMessageEvent = {
    nativeEvent: {
      message: string;
    };
  };

  export interface UnityViewProps extends ViewProps {
    androidKeepPlayerMounted?: boolean;
    fullScreen?: boolean;
    onUnityMessage?: (event: UnityViewMessageEvent) => void;
    onPlayerUnload?: (event: UnityViewMessageEvent) => void;
    onPlayerQuit?: (event: UnityViewMessageEvent) => void;
  }

  export default class UnityView extends React.Component<UnityViewProps> {
    postMessage(gameObject: string, methodName: string, message: string): void;
    unloadUnity(): void;
    pauseUnity(pause: boolean): void;
    resumeUnity(): void;
    windowFocusChanged(hasFocus?: boolean): void;
  }
}


