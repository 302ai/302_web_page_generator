import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaCog } from "react-icons/fa";
import { EditorTheme, Settings } from "../types";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
// import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { capitalize } from "../lib/utils";
// import { IS_RUNNING_ON_CLOUD } from "../config";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "./ui/accordion";
import { Button } from "./ui/button";

interface Props {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  isChinese: boolean;
}

function SettingsDialog({ settings, setSettings, isChinese }: Props) {
  const handleThemeChange = (theme: EditorTheme) => {
    setSettings((s) => ({
      ...s,
      editorTheme: theme,
    }));
  };

  return (
    <Dialog>
      <DialogTrigger>
        <FaCog width={18} height={18}/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4">{isChinese ? "设置" : "Settings"}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center space-x-2">
          <Label htmlFor="image-generation">
            <div>{isChinese ? "DALL-E 占位符图像生成" : "DALL-E Placeholder Image Generation"}</div>
            <div className="font-light mt-2">
              {isChinese ? "它更有趣, 但如果你想省钱, 就关掉它" : "More fun with it but if you want to save money, turn it off."}
            </div>
          </Label>
          <Switch
            id="image-generation"
            checked={settings.isImageGenerationEnabled}
            onCheckedChange={() =>
              setSettings((s) => ({
                ...s,
                isImageGenerationEnabled: !s.isImageGenerationEnabled,
              }))
            }
          />
        </div>
        <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
            <Label htmlFor="editor-theme">
              <div>
                {isChinese ? "代码编辑器主题 - 需要刷新页面才能更新" : "Code Editor Theme - requires page refresh to update"}
              </div>
            </Label>
            <div>
              <Select // Use the custom Select component here
                name="editor-theme"
                value={settings.editorTheme}
                onValueChange={(value) =>
                  handleThemeChange(value as EditorTheme)
                }
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
          {/* <Label htmlFor="openai-api-key">
            <div>OpenAI API key</div>
            <div className="font-light mt-2 leading-relaxed">
              {isChinese ? "仅存储在您的浏览器中, 从未存储在服务器上, 覆盖您的.env配置" : "Only stored in your browser. Never stored on servers. Overrides your .env config."}
            </div>
          </Label>

          <Input
            id="openai-api-key"
            placeholder="OpenAI API key"
            value={settings.openAiApiKey || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                openAiApiKey: e.target.value,
              }))
            }
          /> */}

          {/* {!IS_RUNNING_ON_CLOUD && (
            <>
              <Label htmlFor="openai-api-key">
                <div>OpenAI Base URL (optional)</div>
                <div className="font-light mt-2 leading-relaxed">
                  {isChinese ? "如果您不想使用默认值, 请替换为代理 URL" : "Replace with a proxy URL if you don't want to use the default."}
                </div>
              </Label>

              <Input
                id="openai-base-url"
                placeholder="OpenAI Base URL"
                value={settings.openAiBaseURL || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    openAiBaseURL: e.target.value,
                  }))
                }
              />
            </>
          )} */}

          {/* <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{isChinese ? "URL配置截图" : "Screenshot by URL Config"}</AccordionTrigger>
              <AccordionContent>
                <Label htmlFor="screenshot-one-api-key">
                  <div className="leading-normal font-normal text-xs">
                    {isChinese ? "如果您想直接使用URL而不是自己截图, 请添加 ScreenshotOne API 密钥" : "If you want to use URLs directly instead of taking the screenshot yourself, add a ScreenshotOne API key."}
                    <br />
                    <a
                      href="https://screenshotone.com?via=screenshot-to-code"
                      className="underline"
                      target="_blank"
                    >
                      {isChinese ? " 每个月免费获取 100 张屏幕截图" : "Get 100 screenshots/mo for free."}
                    </a>
                  </div>
                </Label>

                <Input
                  id="screenshot-one-api-key"
                  className="mt-2"
                  placeholder="ScreenshotOne API key"
                  value={settings.screenshotOneApiKey || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      screenshotOneApiKey: e.target.value,
                    }))
                  }
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion> */}

          {/* <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{isChinese ? "主题设置" : "Theme Settings"}</AccordionTrigger>
              <AccordionContent className="space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-theme">
                    <div>{isChinese ? "App主题" : "App Theme"}</div>
                  </Label>
                  <div>
                    <button
                      className="flex rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50t"
                      onClick={() => {
                        document
                          .querySelector("div.mt-2")
                          ?.classList.toggle("dark"); // enable dark mode for sidebar
                        document.body.classList.toggle("dark");
                        document
                          .querySelector('div[role="presentation"]')
                          ?.classList.toggle("dark"); // enable dark mode for upload container
                      }}
                    >
                      转换黑夜模式
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="editor-theme">
                    <div>
                      {isChinese ? "代码编辑器主题 - 需要刷新页面才能更新" : "Code Editor Theme - requires page refresh to update"}
                    </div>
                  </Label>
                  <div>
                    <Select // Use the custom Select component here
                      name="editor-theme"
                      value={settings.editorTheme}
                      onValueChange={(value) =>
                        handleThemeChange(value as EditorTheme)
                      }
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
              </AccordionContent>
            </AccordionItem>
          </Accordion> */}
        </div>

        <DialogFooter>
          <DialogClose>
            <Button>{isChinese ? "保存" : "Save"}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
