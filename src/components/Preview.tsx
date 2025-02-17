import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import useThrottle from "../hooks/useThrottle";
import { cn } from "@/lib/utils";
import EditPopup from "./select-and-edit/EditPopup";
import { useTranslation } from "react-i18next";

interface Props {
  code: string;
  device: "mobile" | "desktop";
  region: number;
  inSelectAndEditMode: boolean;
  generateMode: "prompt" | "image"
  doUpdate: (updateInstruction: string, selectedElement?: HTMLElement) => void;
  setUpdateInstruction: (text: string) => void;
  setInSelectAndEditMode: (flag: boolean) => void;
  generateCodeHandle: (type: 'upd' | 'create', prompt: string) => void;
}

function Preview({
  code,
  device,
  region,
  doUpdate,
  inSelectAndEditMode,
  setInSelectAndEditMode,
  setUpdateInstruction,
  generateCodeHandle,
  generateMode
}: Props) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [clickEvent, setClickEvent] = useState<MouseEvent | null>(null);

  // Don't update code more often than every 200ms.
  const throttledCode = useThrottle(code, 200);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = throttledCode;

      iframe.addEventListener("load", function () {
        iframe.contentWindow?.document.body.addEventListener(
          "click",
          setClickEvent
        );
      });
    }
  }, [throttledCode]);

  return (
    <div
      className={cn(
        "absolute top-0 bottom-2 flex flex-col code-css",
        device === "desktop" ? "right-4 left-4" : "left-1/4 right-1/4"
      )}
    >
      <iframe
        id={`preview-${device}`}
        ref={iframeRef}
        title="Preview"
        className={classNames(
          "border-[4px] border-black shadow-lg flex-grow",
          "transform origin-top",
          "w-full"
        )}
      ></iframe>
      <EditPopup
        inSelectAndEditMode={inSelectAndEditMode}
        setUpdateInstruction={setUpdateInstruction}
        event={clickEvent}
        iframeRef={iframeRef}
        doUpdate={doUpdate}
        generateCodeHandle={generateCodeHandle}
        generateMode={generateMode}
        setInSelectAndEditMode={setInSelectAndEditMode}
      />
      <div
        className="d-hidden flex flex-col justify-center items-center"
        style={{
          color: "rgb(102, 102, 102)",
          fontSize: "12px",
          marginBottom: "7.5px",
        }}
      >
        <div>
          {t('AI_Generated_Content_Disclaimer')}
        </div>
        <div className="flex justify-center items-center gap-1">
          Powered By
          <a
            target="_blank"
            href={region ? "https://302.ai/" : "https://302ai.cn/"}
          >
            <img
              className="object-contain"
              src="https://file.302.ai/gpt/imgs/91f7b86c2cf921f61e8cf9dc7b1ec5ee.png"
              alt="gpt302"
              width="55"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Preview;
