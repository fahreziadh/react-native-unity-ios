import UnityView from "@azesmway/react-native-unity";
import React, { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const MainPage = () => {
  const unityRef = useRef<UnityView>(null);

  useEffect(() => {
    if (unityRef?.current) {
      // const message: IMessage = {
      //   gameObject: 'gameObject',
      //   methodName: 'methodName',
      //   message: 'message',
      // };
      // unityRef.current.postMessage(
      //   message.gameObject,
      //   message.methodName,
      //   message.message
      // );
    }
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "blue" }}>
      <UnityView
        ref={unityRef}
        style={{ flex: 1, width: "100px", height: "100px" }}
      />
    </SafeAreaView>
  );
};

export default MainPage;
