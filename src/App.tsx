import toast from "react-hot-toast";
import classNames from "classnames";
import { Stack } from "./lib/stacks";
import copy from "copy-to-clipboard";
import html2canvas from "html2canvas";
import Preview from "./components/Preview";
import Spinner from "./components/Spinner";
import CodeTab from "./components/CodeTab";
import { generateCode } from "./generateCode";
import { useNavigate } from "react-router-dom";
import { IoIosShareAlt } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { IS_RUNNING_ON_CLOUD } from "./config";
import { Switch } from "./components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, Text } from "@radix-ui/themes";
import CodePreview from "./components/CodePreview";
import ImageUpload from "./components/ImageUpload";
import { Textarea } from "@/components/ui/textarea";
import { ErrorToast } from "./components/errorToast";
import SpinnerComp from "./components/Spinner/Spinner";
import { CodeGenerationModel, LANG } from "./lib/models";
import { USER_CLOSE_WEB_SOCKET_CODE } from "./constants";
import { cn, extractCodeBlocksContent } from "./lib/utils";
import ImportHTMLDialog from "./components/ImportHTMLDialog";
import { History } from "./components/history/history_types";
import { useEffect, useMemo, useRef, useState } from "react";
import { OnboardingNote } from "./components/OnboardingNote";
import { Dialog as DialogComp, Flex } from '@radix-ui/themes';
import { usePersistedState } from "./hooks/usePersistedState";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { LanguagePopover } from "./components/LanguagePopover";
import { extractHtml } from "./components/preview/extractHtml";
import { extractHistoryTree } from "./components/history/utils";
import HistoryDisplay from "./components/history/HistoryDisplay";
import { selectGlobal, setGlobalState } from "./store/globalSlice";
import OutputSettingsSection from "./components/OutputSettingsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { AppState, CodeGenerationParams, EditorTheme, Settings } from "./types";
import { FaCode, FaDesktop, FaDownload, FaMobile, FaUndo } from "react-icons/fa";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"


const region = import.meta.env.VITE_APP_REGION;
const apiKey = import.meta.env.VITE_APP_API_KEY;
const apiUrl = import.meta.env.VITE_APP_API_URL;
const modelName = import.meta.env.VITE_APP_MODEL_NAME;
const hideBrand = import.meta.env.VITE_APP_SHOW_BRAND === 'true';

const IS_OPENAI_DOWN = false;

function App() {
  const dispatch = useAppDispatch();

  const { t, i18n } = useTranslation();
  const global = useAppSelector(selectGlobal);

  useEffect(() => {
    const windowLanguage = window.navigator.language;
    let lang: 'zh' | 'en' | 'ja' = 'en';
    if (["en-US", "zh-CN", "ja-JP"].includes(windowLanguage)) {
      // @ts-ignore
      lang = LANG[windowLanguage]
    }
    const localStorageLanguage = localStorage.getItem('lang')
    if (localStorageLanguage) lang = localStorageLanguage as 'zh' | 'en' | 'ja';
    const searchLang = new URLSearchParams(window.location.search).get('lang')
    if (searchLang) {
      // @ts-ignore
      if (["en-US", "zh-CN", "ja-JP"].includes(searchLang)) lang = LANG[searchLang];
      // @ts-ignore
      else if (["en", "zh", "ja"].includes(searchLang)) lang = searchLang
      else lang = 'en'
    }
    localStorage.setItem('lang', lang)
    dispatch(setGlobalState({ language: lang }))
    i18n.changeLanguage(lang)
  }, [])

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState<string>("");
  const [updateInstruction, setUpdateInstruction] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const [inputMode, setInputMode] = useState<"image" | "video">("image");
  const [generateMode, setGenerateMode] = useState<"prompt" | "image">("image");

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [inSelectAndEditMode, setInSelectAndEditMode] = useState(false);
  const [isImportedFromCode, setIsImportedFromCode] = useState<boolean>(false);
  const [isHasSelectAndEditModel, setIsHasSelectAndEditModel] = useState(true);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [executionConsole, setExecutionConsole] = useState<string[]>([]);

  const shareUrl = useMemo(() => name, [name]);

  // Settings
  const [settings, setSettings] = usePersistedState<Settings>(
    {
      openAiApiKey: apiKey,
      openAiBaseURL: null,
      screenshotOneApiKey: null,
      isImageGenerationEnabled: true,
      editorTheme: EditorTheme.COBALT,
      generatedCodeConfig: Stack.HTML_TAILWIND,
      codeGenerationModel: CodeGenerationModel.GPT_4_TURBO_2024_04_09,
      // Only relevant for hosted version
      isTermOfServiceAccepted: false,
    },
    "setting"
  );

  // App history
  const [appHistory, setAppHistory] = useState<History>([]);
  // Tracks the currently shown version from app history
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  const [shouldIncludeResultImage, setShouldIncludeResultImage] =
    useState<boolean>(false);

  const wsRef = useRef<WebSocket>(null);

  // Indicate coding state using the browser tab's favicon and title
  // useBrowserTabIndicator(appState === AppState.CODING);

  // When the user already has the settings in local storage, newly added keys
  // do not get added to the settings so if it's falsy, we populate it with the default
  // value
  useEffect(() => {
    if (!settings.generatedCodeConfig) {
      setSettings((prev) => ({
        ...prev,
        generatedCodeConfig: Stack.HTML_TAILWIND,
      }));
    }
  }, [settings.generatedCodeConfig, setSettings]);

  const takeScreenshot = async (): Promise<string> => {
    const iframeElement = document.querySelector(
      "#preview-desktop"
    ) as HTMLIFrameElement;
    if (!iframeElement?.contentWindow?.document.body) {
      return "";
    }

    const canvas = await html2canvas(iframeElement.contentWindow.document.body);
    const png = canvas.toDataURL("image/png");
    return png;
  };

  const downloadCode = () => {
    // Create a blob from the generated code
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Create an anchor element and set properties for download
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html"; // Set the file name for download
    document.body.appendChild(a); // Append to the document
    a.click(); // Programmatically click the anchor to trigger download

    // Clean up by removing the anchor and revoking the Blob URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setIsDisabled(false);
    setAppState(AppState.INITIAL);
    setGeneratedCode("");
    setReferenceImages([]);
    setExecutionConsole([]);
    setUpdateInstruction("");
    setIsImportedFromCode(false);
    setAppHistory([]);
    setCurrentVersion(null);
    setShouldIncludeResultImage(false);
    setInSelectAndEditMode(false);
    localStorage.removeItem("history");
    localStorage.removeItem("code");
    localStorage.removeItem("currentVersion");
    localStorage.removeItem("generateMode");
  };

  const regenerate = () => {
    if (currentVersion === null) {
      toast.error(t('No_Current_Version_Set'));
      reset();
      return;
    }

    // Retrieve the previous command
    const previousCommand = appHistory[currentVersion];
    if (previousCommand.type !== "ai_create") {
      toast.error(t('Can_Only_Regenerate_First_Version'));
      reset();
      return;
    }

    // Re-run the create
    if (generateMode === "prompt") {
      generateCodeHandle("create", prompt);
    } else {
      doCreate(referenceImages, inputMode);
    }
  };

  const cancelCodeGeneration = () => {
    wsRef.current?.close?.(USER_CLOSE_WEB_SOCKET_CODE);
    // make sure stop can correct the state even if the websocket is already closed
    cancelCodeGenerationAndReset();
  };

  const previewCode =
    inputMode === "video" && appState === AppState.CODING
      ? extractHtml(generatedCode)
      : generatedCode;

  const cancelCodeGenerationAndReset = () => {
    // When this is the first version, reset the entire app state
    if (currentVersion === null) {
      reset();
    } else {
      // Otherwise, revert to the last version
      setGeneratedCode(appHistory[currentVersion].code);
      setAppState(AppState.CODE_READY);
    }
  };

  function doGenerateCode(
    params: CodeGenerationParams,
    parentVersion: number | null
  ) {
    setExecutionConsole([]);
    setAppState(AppState.CODING);

    // Merge settings with params
    const updatedParams = { ...params, ...settings };

    generateCode(
      wsRef,
      updatedParams,
      // On change
      (token) => setGeneratedCode((prev) => prev + token),
      // On set code
      (code) => {
        setGeneratedCode(code);
        localStorage.setItem("code", code);
        const oldHistory = localStorage.getItem("history");
        if (params.generationType === "create") {
          let data;
          if (!oldHistory) {
            data = [
              {
                type: "ai_create",
                parentIndex: null,
                code,
                inputs: { image_url: referenceImages[0] },
              },
            ];
          } else {
            data = [
              ...JSON.parse(oldHistory),
              {
                type: "ai_create",
                parentIndex: null,
                code,
                inputs: { image_url: referenceImages[0] },
              },
            ];
          }
          setCurrentVersion(0);
          localStorage.setItem("currentVersion", "0");
          setAppHistory(data);
        } else {
          setAppHistory((prev) => {
            // Validate parent version
            if (parentVersion === null) {
              toast.error(t('No_Parent_Version_Set'));
              reset();
              return prev;
            }

            const newHistory: History = [
              ...prev,
              {
                type: "ai_edit",
                parentIndex: parentVersion,
                code,
                inputs: {
                  prompt: params.history
                    ? params.history[params.history.length - 1]
                    : "",
                },
              },
            ];
            setCurrentVersion(newHistory.length - 1);
            localStorage.setItem(
              "currentVersion",
              (newHistory.length - 1).toString()
            );
            return newHistory;
          });
        }
      },
      // On status update
      (line) => setExecutionConsole((prev) => [...prev, line]),
      // On cancel
      () => {
        cancelCodeGenerationAndReset();
      },
      // On complete
      () => {
        setAppState(AppState.CODE_READY);
      },
      (code) => {
        toast.error(<ErrorToast code={code} />)
      },
      // Pass the translation function
      t
    );
  }

  // Initial version creation
  function doCreate(referenceImages: string[], inputMode: "image" | "video") {
    // Reset any existing state
    reset();

    setReferenceImages(referenceImages);
    setGenerateMode("image");
    localStorage.setItem("generateMode", "image");
    setInputMode(inputMode);
    if (referenceImages.length > 0) {
      doGenerateCode(
        {
          generationType: "create",
          image: referenceImages[0],
          inputMode,
        },
        currentVersion
      );
    }
  }

  // Subsequent updates
  async function doUpdate(
    updateInstruction: string,
    selectedElement?: HTMLElement
  ) {
    if (updateInstruction.trim() === "") {
      toast.error("请为ai提供一些更新内容的说明。");
      return;
    }
    if (currentVersion === null) {
      toast.error(t('No_Current_Version_Set'));
      reset();
      return;
    }

    let historyTree;
    try {
      historyTree = extractHistoryTree(appHistory, currentVersion);
    } catch {
      toast.error(t('Invalid_Version_History'));
      reset();
      return;
    }

    let modifiedUpdateInstruction = updateInstruction;

    if (selectedElement) {
      modifiedUpdateInstruction =
        updateInstruction +
        " referring to this element specifically: " +
        selectedElement.outerHTML;
    }

    const updatedHistory = [...historyTree, modifiedUpdateInstruction];

    if (shouldIncludeResultImage) {
      const resultImage = await takeScreenshot();
      doGenerateCode(
        {
          generationType: "update",
          inputMode,
          image: referenceImages[0],
          resultImage: resultImage,
          history: updatedHistory,
          isImportedFromCode,
        },
        currentVersion
      );
    } else {
      doGenerateCode(
        {
          generationType: "update",
          inputMode,
          image: referenceImages[0],
          history: updatedHistory,
          isImportedFromCode,
        },
        currentVersion
      );
    }

    setGeneratedCode("");
    setUpdateInstruction("");
  }

  function setStack(stack: Stack) {
    setSettings((prev) => ({
      ...prev,
      generatedCodeConfig: stack,
      importHtmlCodeConfig: stack,
    }));
  }

  function setOpenAiApiKey(openAiApiKey: string) {
    setSettings((prev) => ({
      ...prev,
      openAiApiKey,
    }));
  }

  function importFromCode(code: string, stack: Stack) {
    reset();
    setIsImportedFromCode(true);
    setIsHasSelectAndEditModel(true);

    // Set up this project
    setGeneratedCode(code);
    setStack(stack);
    localStorage.setItem("code", code);
    const history = localStorage.getItem("history");
    if (history) {
      setAppHistory([
        ...JSON.parse(history),
        {
          type: "code_create",
          parentIndex: null,
          code,
          inputs: { code },
        },
      ]);
    } else {
      setAppHistory([
        {
          type: "code_create",
          parentIndex: null,
          code,
          inputs: { code },
        },
      ]);
    }
    setCurrentVersion(0);
    localStorage.setItem("currentVersion", "0");
    localStorage.setItem("generateMode", "image");
    setGenerateMode("image");
    setAppState(AppState.CODE_READY);
  }

  // api_key
  useEffect(() => {
    const history = localStorage.getItem("history");
    const code = localStorage.getItem("code");
    const version = localStorage.getItem("currentVersion");
    const Mode = localStorage.getItem("generateMode") as "image" | "prompt";
    setOpenAiApiKey(apiKey);
    if (history && code && version && Mode) {
      setAppHistory(JSON.parse(history));
      setAppState(AppState.CODE_READY);
      setGeneratedCode(code);
      setCurrentVersion(+version);
      setIsImportedFromCode(true);
      setGenerateMode(Mode);
    }
  }, []);

  const [containerMinHeight, setContainerMinHeight] = useState(0);
  useEffect(() => {
    const textarea = document.getElementById("autoresizing") as HTMLElement;
    textarea?.addEventListener("input", autoResize, false);
    function autoResize() {
      // Set the height to automatic so that the browser can calculate the text height
      textarea.style.height = 36 + "px";
      // Set the height to be equal to scrollHeight, which contains the actual height required for the element content
      textarea.style.height = textarea?.scrollHeight + "px";
    }
    function setMinHeight() {
      const height = window.innerHeight - 64 - 60 - 22 - 16 - 10;
      setContainerMinHeight(height);
    }
    setMinHeight();
    window.onresize = function () {
      setMinHeight();
    };

    return () => {
      textarea?.addEventListener("input", autoResize);
    };
  }, [appState]);

  function handleCode(chunk: string) {
    let answer = "";
    if (!chunk) return answer;
    const chunkList = chunk
      .split("\n")
      .filter((chunk) => chunk)
      .map((chunk) => chunk.replace("data:", ""));

    chunkList.forEach((chunk) => {
      if (!chunk) return;
      try {
        const chunkJSON = JSON.parse(chunk);

        chunkJSON?.choices.forEach(
          (choice: {
            delta: {
              content: string;
            };
          }) => {
            const content = choice?.delta?.content;
            if (content) {
              answer += content;
              setGeneratedCode(answer);
            }
          }
        );
      } catch (err) { }
    });
    return answer;
  }

  async function generateCodeHandle(type: "upd" | "create", prompt: string) {
    if (type === 'create') reset();
    if (!prompt.trim()) {
      toast.error(t('Provide_Update_Instructions'));
      return;
    }
    setIsDisabled(true);
    setGenerateMode("prompt");
    localStorage.setItem("generateMode", "prompt");
    const query =
      type === "create"
        ? prompt
        : "Given the following HTML:\n\n " + generatedCode + " \n\n " + prompt;
    let stack_type = settings.generatedCodeConfig.split("_");
    stack_type = stack_type.map(
      (item) => item.charAt(0).toUpperCase() + item.slice(1)
    );

    const body = JSON.stringify({
      api_key: apiKey,
      models_name: modelName || 'gpt4o',
      type: stack_type.join(" + "),
      query,
    });

    fetch(`${apiUrl}/api/generate_code_with_word`, {
      method: "post",
      body,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
      },
    })
      .then((response) => {
        setAppState(AppState.CODING);
        if (!(response.ok && response.body)) {
          return;
        }
        const reader = response.body.getReader();
        let chunk = "";
        return reader.read().then(function processData({ done, value }): any {
          while (!done && value) {
            chunk += new TextDecoder("utf-8").decode(value);
            if (chunk.indexOf("Error") > -1) {
              if (chunk.indexOf("err_code") === -1) {
                toast.error(t('global.error.unknown_error'));
                return
              }

              const chunkArr = chunk
                .replace("Error:", "")
                .replace("{", "")
                .replace("}", "")
                .trimStart()
                .trimEnd()
                .split(",");

              for (let index = 0; index < chunkArr.length; index++) {
                const chunk = chunkArr[index]
                console.log('==========chunk', +chunk.split(":")[2]);
                if (chunk.indexOf("err_code") > -1) {
                  const code = +chunk.split(":")[2]
                  if (code) {
                    toast.error(<ErrorToast code={code} />)
                    setAppState(AppState.INITIAL);
                  } else {
                    toast.error(t('global.error.unknown_error'));
                    setAppState(AppState.INITIAL);
                  }
                  setIsDisabled(false);
                  return;
                }
              }
              setIsDisabled(false);
              return;
            }

            handleCode(chunk);
            return reader.read().then(processData);
          }

          return chunk;
        });
      })
      .then((chunk: string) => {
        if (chunk) {
          const answer = handleCode(chunk);
          return answer;
        }
      })
      .then(async (answer: string | undefined) => {
        if (!answer) return;
        let result = extractCodeBlocksContent(answer)[0];
        result = result ? result : answer;
        let data: History;
        let version = 0;
        if (settings.isImageGenerationEnabled) {
          const res = await fetch(`${apiUrl}/api/generate_images`, {
            method: 'post',
            body: JSON.stringify({
              api_key: apiKey,
              models_name: modelName || 'gpt-4o-mini-2024-07-18',
              query: result
            }),
            headers: {
              accept: "application/json",
              "Content-Type": "application/json;charset=UTF-8",
            },
          });
          const json = await res.json();

          if (json.data.error) {
            setIsDisabled(false);
            setAppState(AppState.INITIAL);
            toast.error(<ErrorToast code={json.data.error.err_code} />)
            return;
          }
          result = json.data.content;
        }

        if (type === "create") {
          data = [
            {
              type: "ai_create",
              parentIndex: null,
              code: result,
              inputs: { prompt },
            },
          ];
          version = 0;
        } else {
          if (currentVersion === null) {
            toast.error(t('No_Parent_Version_Set'));
            reset();
            return;
          }

          data = [
            ...appHistory,
            {
              type: "ai_edit",
              parentIndex: currentVersion,
              code: result,
              inputs: {
                prompt,
              },
            },
          ];
          version = data.length - 1;
        }
        setIsDisabled(false);
        setGeneratedCode(result);
        setAppState(AppState.CODE_READY);
        setCurrentVersion(version);
        localStorage.setItem("currentVersion", version.toString());
        localStorage.setItem("code", result);
        setAppHistory(data);
      })
      .catch((error) => {
        console.log('============err0r', error);
      });
  }

  function upload(code: string) {
    const blob = new Blob([code], { type: 'text/html;charset=UTF-8' });
    const formdata = new FormData();
    formdata.append('file', blob, Math.random().toString(16).slice(1) + '.html');
    return fetch('https://dash-api.302.ai/gpt/api/upload/gpt/image', {
      method: "POST",
      body: formdata
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.data.url) {
          return { url: res.data.url };
        }
        throw Error();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  function shareHandle() {
    if (loading) return;
    setLoading(true);
    upload(generatedCode)
      .then((res: any) => {
        if (res?.url) {
          setIsOpen(true);
          setName(res?.url);
        }
      })
      .finally(() => setLoading(false));
  }

  function onCopyHandle() {
    copy(shareUrl);
    setIsOpen(false);
    toast.success(t('Copy_Success'));
  }

  return (
    <div
      className="min-h-[100vh] flex flex-col"
      style={{
        background: "#f6f6f6",
      }}
    >
      <div
        id="main-container"
        className="mt-2 dark:bg-black dark:text-white app-css flex-1 w-full mx-auto"
      >
        <div className="lg:inset-y-0 lg:z-40 md:flex lg:w-96 md:flex-col sider-css bg-white border-r border-gray-200 overflow-hidden">
          <div
            id="app-title"
            className="flex justify-center items-center lg:mt-8 lg:mb-0 mb-4 mt-4 gap-1 lg:px-5 px-3"
          >
            {
              !hideBrand &&
              <img
                src="https://file.302.ai/gpt/imgs/5b36b96aaa052387fb3ccec2a063fe1e.png"
                className="object-contain app-icon"
                alt="302"
                height={60}
                width={60}
              />
            }
            <div className={cn("app-title", "app-title-en")}>
              {t('AI_Web_Generator')}
            </div>
          </div>
          <div className="flex grow flex-col gap-y-2 overflow-y-auto lg:px-5 px-3 dark:bg-zinc-950 dark:text-white sider-css my-4">
            <div className="flex items-center justify-between gap-2">
              <OutputSettingsSection
                language={global.language}
                stack={settings.generatedCodeConfig}
                setStack={(config) => setStack(config)}
                label={t('Generate')}
                shouldDisableUpdates={
                  appState === AppState.CODING ||
                  appState === AppState.CODE_READY
                }
              />
            </div>
            <div className="flex justify-between">
              <div className="flex gap-1 items-center text-sm text-slate-700 dark:text-white">
                <span>{t('Generate_Placeholder_Image')}</span>
                <Popover.Root>
                  <Popover.Trigger className="cursor-pointer">
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
                      {t('More_Fun_But_Expensive')}
                    </Text>
                  </Popover.Content>
                </Popover.Root>
                :
              </div>
              <Switch
                checked={settings.isImageGenerationEnabled}
                onCheckedChange={() =>
                  setSettings((s) => ({
                    ...s,
                    isImageGenerationEnabled: !s.isImageGenerationEnabled,
                  }))
                }
                disabled={
                  appState === AppState.CODING ||
                  appState === AppState.CODE_READY
                }
                className="data-[state=checked]:bg-violet-500"
              />
            </div>

            {IS_RUNNING_ON_CLOUD && !settings.openAiApiKey && (
              <OnboardingNote />
            )}

            {IS_OPENAI_DOWN && (
              <div className="bg-black text-white dark:bg-white dark:text-black p-3 rounded">
                {t('OpenAI_API_Down')}
              </div>
            )}

            {(appState === AppState.CODING ||
              appState === AppState.CODE_READY) && (
                <>
                  {/* Show code preview only when coding */}
                  {appState === AppState.CODING && (
                    <div className="flex flex-col">
                      {/* Speed disclaimer for video mode */}
                      {inputMode === "video" && (
                        <div
                          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700
                      p-2 text-xs mb-4 mt-1"
                        >
                          {t('Video_Generation_Time')}
                        </div>
                      )}

                      <div className="flex items-center gap-x-1">
                        <Spinner />
                        {executionConsole.slice(-1)[0]}
                      </div>

                      <CodePreview code={generatedCode} />

                      <div className="flex w-full">
                        <Button
                          onClick={cancelCodeGeneration}
                          className="w-full dark:text-white dark:bg-gray-700"
                          size="sm"
                        >
                          {t('Cancel')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {appState === AppState.CODE_READY && (
                    <div>
                      <div className="flex justify-between items-center gap-x-2">
                        <div className="font-500 text-sm text-slate-700 dark:text-white">
                          {t('Include_Current_Version_Screenshot')}
                        </div>
                        <Switch
                          checked={shouldIncludeResultImage}
                          onCheckedChange={setShouldIncludeResultImage}
                          className="data-[state=checked]:bg-violet-500"
                        />
                      </div>
                      <div className="flex mt-2 w-full rounded-md box-border">
                        <Textarea
                          id="autoresizing"
                          className="shadow-none overflow-hidden h-9 min-h-9 resize-none"
                          placeholder={
                            t('Tell_AI_What_To_Change')
                          }
                          onChange={(e) => setUpdateInstruction(e.target.value)}
                          value={updateInstruction}
                          onKeyDown={(e) => {
                            if (!e.shiftKey && e.keyCode === 13) {
                              e.preventDefault();
                              if (generateMode === "prompt") {
                                generateCodeHandle("upd", updateInstruction);
                              } else {
                                doUpdate(updateInstruction);
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            if (generateMode === "prompt") {
                              generateCodeHandle("upd", updateInstruction);
                            } else {
                              doUpdate(updateInstruction);
                            }
                          }}
                          className="ml-2 dark:text-white dark:bg-gray-700 h-9"
                          size="sm"
                        >
                          {t('Update')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reference image display */}
                  <div className="flex gap-x-2 mt-2 justify-center">
                    {referenceImages.length > 0 && (
                      <div className="flex flex-col">
                        <div
                          className={classNames({
                            "scanning relative": appState === AppState.CODING,
                          })}
                        >
                          {inputMode === "image" && (
                            <img
                              className="w-[340px] border border-gray-200 rounded-md"
                              src={referenceImages[0]}
                              alt="Reference"
                            />
                          )}
                          {inputMode === "video" && (
                            <video
                              muted
                              autoPlay
                              loop
                              className="w-[340px] border border-gray-200 rounded-md"
                              src={referenceImages[0]}
                            />
                          )}
                        </div>
                        <div className="text-gray-400 uppercase text-sm text-center mt-1">
                          {inputMode === "video"
                            ? t('Original_Video')
                            : t('Original_Screenshot')}
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-400 px-4 py-2 rounded text-sm hidden">
                      <h2 className="text-lg mb-4 border-b border-gray-800">
                        Console
                      </h2>
                      {executionConsole.map((line, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-400 mb-2 text-gray-600 font-mono"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            {appHistory.length !== 0 && (
              <HistoryDisplay
                regenerate={regenerate}
                history={appHistory}
                currentVersion={currentVersion}
                revertToVersion={(index) => {
                  if (
                    index < 0 ||
                    index >= appHistory.length ||
                    !appHistory[index]
                  )
                    return;
                  setCurrentVersion(index);
                  setGeneratedCode(appHistory[index].code);
                }}
                shouldDisableReverts={appState === AppState.CODING}
              />
            )}
          </div>
        </div>

        <main className="flex relative flex-col flex-grow items-center bg-white md:rounded-tr-[16px] md:rounded-br-[16px]">
        <div className='flex absolute right-2 top-2'><LanguagePopover /></div>
          {appState === AppState.INITIAL && (
            <div className="flex flex-col justify-center items-center gap-y-6 flex-grow w-full overflow-auto">
              <div className="flex mt-8 border rounded-lg overflow-hidden w-[60%]">
                <Textarea
                  disabled={isDisabled}
                  value={prompt}
                  onKeyDown={(e) => {
                    if (!e.shiftKey && e.keyCode === 13) {
                      e.preventDefault();
                      generateCodeHandle("create", prompt);
                    }
                  }}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('Describe_Page_To_Generate')}
                  className="h-9 min-h-9 border-none rounded-none resize-none overflow-hidden"
                />
                <Button
                  disabled={isDisabled}
                  onClick={() => {
                    generateCodeHandle("create", prompt);
                  }}
                  className="rounded-none bg-violet-500 hover:bg-violet-600 active:bg-violet-600"
                >
                  {t('Generate')}
                </Button>
              </div>
              {!isDisabled ? (
                <>
                  <Text className="text-gray-500">{t('Or')}</Text>
                  <ImageUpload
                    setReferenceImages={doCreate}
                  />
                  <div className="text-center mb-12">
                    <p className="mb-4 text-xs text-gray-500">{t('Have_HTML_File')}</p>
                    <ImportHTMLDialog
                      setSettings={(config) =>
                        setSettings({
                          ...settings,
                          generatedCodeConfig: config,
                        })
                      }
                      importFromCode={importFromCode}
                    />
                  </div>
                </>
              ) : (
                <div className="text-lg flex h-full items-center">
                  <SpinnerComp />
                  <span className="ml-8 text-gray-400">{t('Generating')}</span>
                </div>
              )}
            </div>
          )}

          {(appState === AppState.CODING ||
            appState === AppState.CODE_READY) && (
              <>
                <div className="w-full flex-grow flex">
                  <Tabs
                    defaultValue="desktop"
                    onValueChange={(val) => {
                      const flag = val === "code" ? false : true;
                      setIsHasSelectAndEditModel(flag);
                      setInSelectAndEditMode(false);
                    }}
                  >
                    <div
                      className={cn(
                        "lg:flex mt-2 mb-2 lg:mx-4",
                        appState === AppState.CODE_READY ? "app-button" : ""
                      )}
                    >
                      <div className="flex items-center gap-x-2 w-full mr-2">
                        {appState === AppState.CODE_READY && (
                          <>
                            <DialogComp.Root>
                              <DialogComp.Trigger>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex items-center gap-x-2">
                                  <FaUndo />
                                  {t('Reset')}
                                </Button>
                              </DialogComp.Trigger>
                              <DialogComp.Content maxWidth="450px">
                                <DialogComp.Title>{t('Prompt')}</DialogComp.Title>
                                <DialogComp.Description size="2" mb="4">
                                  {t('Reset_All_Data_Confirmation')}
                                </DialogComp.Description>
                                <Flex gap="3" mt="4" justify="end">
                                  <DialogComp.Close>
                                    <Button
                                      color="gray"
                                      size="sm"
                                      variant="outline"
                                    >
                                      {t('Cancel')}
                                    </Button>
                                  </DialogComp.Close>
                                  <DialogComp.Close>
                                    <Button
                                      onClick={reset}
                                      className="flex items-center gap-x-2 bg-violet-500 hover:bg-violet-600 active:hover:bg-violet-600"
                                      size="sm"
                                    >
                                      {t('Confirm')}
                                    </Button>
                                  </DialogComp.Close>
                                </Flex>
                              </DialogComp.Content>
                            </DialogComp.Root>
                            <Button
                              onClick={downloadCode}
                              variant="outline"
                              className="flex items-center gap-x-2"
                              size="sm"
                            >
                              <FaDownload />{t('Download')}
                            </Button>
                            {isHasSelectAndEditModel && (
                              <Button
                                onClick={() => {
                                  setInSelectAndEditMode(!inSelectAndEditMode);
                                }}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-x-2"
                              >
                                {inSelectAndEditMode
                                  ? t('Exit_Selection_Mode')
                                  : t('Select_And_Modify')}
                              </Button>
                            )}
                            <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={shareHandle}
                                  variant="outline"
                                  className="flex items-center gap-x-2"
                                  size="sm"
                                >
                                  {loading ? (
                                    <Spinner />
                                  ) : (
                                    <>
                                      <IoIosShareAlt className="w-[1.5em] h-[1.5em]" />
                                      {t('Share')}
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="min-w-[60%]">
                                <DialogHeader>
                                  <DialogTitle>{t('Share_Page')}</DialogTitle>
                                </DialogHeader>
                                <div><a href={shareUrl} target="_blank">{shareUrl}</a></div>
                                <DialogFooter>
                                  <Button onClick={onCopyHandle} className="bg-violet-500 hover:bg-violet-500 active:bg-violet-500">{t('Copy')}</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                      <div className="flex items-center md:mt-2 lg:mt-0">
                        <TabsList>
                          <TabsTrigger
                            value="desktop"
                            className="flex gap-x-2"
                            style={{ fontSize: "12px" }}
                          >
                            <FaDesktop />{t('Desktop')}
                          </TabsTrigger>
                          <TabsTrigger
                            value="mobile"
                            className="flex gap-x-2"
                            style={{ fontSize: "12px" }}
                          >
                            <FaMobile />{t('Mobile')}
                          </TabsTrigger>
                          <TabsTrigger
                            value="code"
                            className="flex gap-x-2"
                            style={{ fontSize: "12px" }}
                          >
                            <FaCode />
                            {t('Code')}
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                    <div className="flex-grow relative lg:overflow-auto">
                      <TabsContent value="desktop">
                        <Preview
                          code={previewCode}
                          device="desktop"
                          region={region}
                          inSelectAndEditMode={inSelectAndEditMode}
                          generateMode={generateMode}
                          doUpdate={doUpdate}
                          generateCodeHandle={generateCodeHandle}
                          setUpdateInstruction={setUpdateInstruction}
                          setInSelectAndEditMode={setInSelectAndEditMode}
                        />
                      </TabsContent>
                      <TabsContent value="mobile">
                        <Preview
                          code={previewCode}
                          setUpdateInstruction={setUpdateInstruction}
                          device="mobile"
                          generateMode={generateMode}
                          region={region}
                          inSelectAndEditMode={inSelectAndEditMode}
                          setInSelectAndEditMode={setInSelectAndEditMode}
                          generateCodeHandle={generateCodeHandle}
                          doUpdate={doUpdate}
                        />
                      </TabsContent>
                      <TabsContent value="code">
                        <CodeTab
                          setSettings={setSettings}
                          code={previewCode}
                          setCode={setGeneratedCode}
                          settings={settings}
                          region={region}
                        />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </>
            )}
        </main>
      </div>
      {
        !hideBrand &&
        <div
          className="flex flex-col items-center m-hidden"
          style={{ color: "rgb(102, 102, 102)", fontSize: "12px" }}
        >
          <div className="flex justify-center items-center gap-1  my-4 mb-2">
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
          <div
            className="mb-1"
            style={{ color: "rgb(200, 200, 200)", fontSize: "12px" }}
          >
            {t('AI_Generated_Content_Disclaimer')}
          </div>
        </div>
      }
    </div>
  );
}

export default App;
