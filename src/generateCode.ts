import toast from "react-hot-toast";
import {
  APP_ERROR_WEB_SOCKET_CODE,
  USER_CLOSE_WEB_SOCKET_CODE,
} from "./constants";
import { FullGenerationSettings } from "./types";
import { CodeGenerationModel } from "./lib/models";
import { TFunction } from "i18next";

export function generateCode(
  wsRef: React.MutableRefObject<WebSocket | null>,
  params: FullGenerationSettings,
  onChange: (chunk: string) => void,
  onSetCode: (code: string) => void,
  onStatusUpdate: (status: string) => void,
  onCancel: () => void,
  onComplete: () => void,
  onError: (code: number) => void,
  t: TFunction
) { 
  // const wsUrl = (window.location.protocol === "https:" ? 'wss:' : 'ws') + "//" + window.location.hostname + "/api/generate-code";
  const wsUrl = import.meta.env.VITE_APP_302_WS_URL;

  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;
  if (params.codeGenerationModel.indexOf("gpt-4-turbo") > -1) params.codeGenerationModel = "gpt-4-turbo-2024-04-09" as CodeGenerationModel

  ws.addEventListener("open", () => {
    console.log(params);

    ws.send(JSON.stringify({ ...params }));
  });

  ws.addEventListener("message", async (event: MessageEvent) => {
    const response = JSON.parse(event.data);
    if (response.type === "chunk") {
      onChange(response.value);
    } else if (response.type === "status") {
      let value = response.value
      if (value === "生成代码中...") value = t('GeneratingCode')
      onStatusUpdate(value);
    } else if (response.type === "setCode") {
      onSetCode(response.value);
    } else if (response.type === "error") {
      if (typeof (response.value) === 'string' && response.value.indexOf("err_code") === -1) toast.error(response.value, { duration: 10000 });
      else {
        console.log('========= JSON.parse(JSON.stringify(response.value))', JSON.parse(JSON.stringify(response.value)));
        const errCode = JSON.parse(JSON.stringify(response.value)).err_code;
        onError(errCode)
      }
    }
  });

  ws.addEventListener("close", (event) => {
    console.log("Connection closed", event.code, event.reason);
    if (event.code === USER_CLOSE_WEB_SOCKET_CODE) {
      toast.success(t('CodeGenerationCancelled'), { duration: 4000 });
      onCancel();
    } else if (event.code === APP_ERROR_WEB_SOCKET_CODE) {
      console.error("Known server error", event);
      onCancel();
    } else if (event.code !== 1000) {
      console.error("Unknown server or connection error", event);
      toast.error(t('CodeGenerationError'), { duration: 4000 });
      onCancel();
    } else {
      onComplete();
    }
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error", error);
    toast.error(t('CodeGenerationError'), { duration: 4000 });
  });
}

// Export the type for use in other files
export type GenerateCodeFunction = typeof generateCode;
