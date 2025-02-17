import { FaCopy } from "react-icons/fa";
import CodeMirror from "./CodeMirror";
import { Button } from "./ui/button";
import copy from "copy-to-clipboard";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { capitalize } from "../lib/utils";
import { EditorTheme, Settings } from "../types";
import { Popover, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

interface Props {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  settings: Settings;
  region: number;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

function CodeTab({
  code,
  setCode,
  settings,
  setSettings,
  region,
}: Props) {
  const { t } = useTranslation();
  const copyCode = useCallback(() => {
    copy(code);
    toast.success(t('copied_to_clipboard'));
  }, [code]);

  const doOpenInCodepenio = useCallback(async () => {
    // TODO: Update CSS and JS external links depending on the framework being used
    const data = {
      html: code,
      editors: "100", // 1: Open HTML, 0: Close CSS, 0: Close JS
      layout: "left",
      css_external:
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" +
        (code.includes("<ion-")
          ? ",https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css"
          : ""),
      js_external:
        "https://cdn.tailwindcss.com " +
        (code.includes("<ion-")
          ? ",https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js,https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"
          : ""),
    };

    // Create a hidden form and submit it to open the code in CodePen
    // Can't use fetch API directly because we want to open the URL in a new tab
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "data");
    input.setAttribute("value", JSON.stringify(data));

    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://codepen.io/pen/define");
    form.setAttribute("target", "_blank");
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }, [code]);

  const handleThemeChange = (theme: EditorTheme) => {
    setSettings((s) => ({
      ...s,
      editorTheme: theme,
    }));
  };

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 flex flex-col">
      <div className="flex justify-between items-center py-1 mb-2 lg:mx-4">
        <div className="flex">
          <span
            title={t('copy_code')}
            className="bg-black text-white text-nowrap flex items-center justify-center hover:text-black hover:bg-gray-100 cursor-pointer rounded-lg text-sm p-2.5 py-1.5"
            onClick={copyCode}
            style={{ fontSize: "12px" }}
          >
            {t('copy_code')} <FaCopy className="ml-2" />
          </span>
          <Button
            onClick={doOpenInCodepenio}
            className="bg-gray-100 text-black ml-2 mr-2 py-2 px-4 border border-black rounded-md hover:bg-gray-400 focus:outline-none"
            size="sm"
          >
            {t('open')}{" "}
            <img
              src="https://assets.codepen.io/t-1/codepen-logo.svg"
              alt="codepen.io"
              className="h-4 ml-1"
            />
          </Button>
        </div>
        <div className="flex items-center">
          <Popover.Root>
            <Popover.Trigger className="cursor-pointer mr-1">
              <svg
                width="18"
                height="18"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM7.49991 1.82689C4.36689 1.82689 1.82708 4.36671 1.82708 7.49972C1.82708 10.6327 4.36689 13.1726 7.49991 13.1726C10.6329 13.1726 13.1727 10.6327 13.1727 7.49972C13.1727 4.36671 10.6329 1.82689 7.49991 1.82689ZM8.24993 10.5C8.24993 10.9142 7.91414 11.25 7.49993 11.25C7.08571 11.25 6.74993 10.9142 6.74993 10.5C6.74993 10.0858 7.08571 9.75 7.49993 9.75C7.91414 9.75 8.24993 10.0858 8.24993 10.5ZM6.05003 6.25C6.05003 5.57211 6.63511 4.925 7.50003 4.925C8.36496 4.925 8.95003 5.57211 8.95003 6.25C8.95003 6.74118 8.68002 6.99212 8.21447 7.27494C8.16251 7.30651 8.10258 7.34131 8.03847 7.37854L8.03841 7.37858C7.85521 7.48497 7.63788 7.61119 7.47449 7.73849C7.23214 7.92732 6.95003 8.23198 6.95003 8.7C6.95004 9.00376 7.19628 9.25 7.50004 9.25C7.8024 9.25 8.04778 9.00601 8.05002 8.70417L8.05056 8.7033C8.05924 8.6896 8.08493 8.65735 8.15058 8.6062C8.25207 8.52712 8.36508 8.46163 8.51567 8.37436L8.51571 8.37433C8.59422 8.32883 8.68296 8.27741 8.78559 8.21506C9.32004 7.89038 10.05 7.35382 10.05 6.25C10.05 4.92789 8.93511 3.825 7.50003 3.825C6.06496 3.825 4.95003 4.92789 4.95003 6.25C4.95003 6.55376 5.19628 6.8 5.50003 6.8C5.80379 6.8 6.05003 6.55376 6.05003 6.25Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Popover.Trigger>
            <Popover.Content
              style={{
                padding: "8px",
              }}
            >
              <Text as="p" trim="both" size="1">
              {t('code_theme_refresh_note')}
              </Text>
            </Popover.Content>
          </Popover.Root>
          <Select
            name="editor-theme"
            value={settings.editorTheme}
            onValueChange={(value) => handleThemeChange(value as EditorTheme)}
          >
            <SelectTrigger className="w-[180px]">
              {capitalize(settings.editorTheme)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cobalt">Cobalt</SelectItem>
              <SelectItem value="espresso">Espresso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <CodeMirror
        code={code}
        editorTheme={settings.editorTheme}
        onCodeChange={setCode}
        mHidden={true}
      />
      <div className="d-hidden">
        <CodeMirror
          code={code}
          editorTheme={settings.editorTheme}
          onCodeChange={setCode}
        />
        <div
          className="d-hidden flex flex-col justify-center items-center"
          style={{
            color: "rgb(102, 102, 102)",
            fontSize: "12px",
            marginBottom: "7.5px",
            marginTop: "7.5px",
          }}
        >
          <div>
            {t('AI_Generated_Content_Disclaimer')}
          </div>
          <div className="flex justify-center items-center gap-1">
            {t('powered_by')}
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
    </div>
  );
}

export default CodeTab;
