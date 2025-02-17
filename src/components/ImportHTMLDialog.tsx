import React, { useCallback, useState } from "react";
import { Button, Dialog, Flex, Text, TextArea } from "@radix-ui/themes";
import { Stack, STACK_DESCRIPTIONS } from "../lib/stacks";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { useDropzone } from "react-dropzone";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";

function generateDisplayComponent(stack: Stack) {
  const stackComponents = STACK_DESCRIPTIONS[stack].components;

  return (
    <div>
      {stackComponents.map((component, index) => (
        <React.Fragment key={index}>
          <span className="font-semibold">{component}</span>
          {index < stackComponents.length - 1 && " + "}
        </React.Fragment>
      ))}
    </div>
  );
}

interface Props {
  shouldDisableUpdates?: boolean;
  importFromCode: (code: string, stack: Stack) => void;
  setSettings: (config: Stack) => void;
}

export default function ImportHTMLDialog({
  shouldDisableUpdates = false,
  importFromCode,
  setSettings
}: Props) {
  const { t } = useTranslation();

  const [htmlContent, setHtmlContent] = useState<string | undefined>();
  const [stack, setStack] = useState<Stack | undefined>(undefined);

  const onDrop = useCallback((acceptedFiles: any) => {
    const reader = new FileReader();
    reader.readAsText(acceptedFiles[0]);
    reader.onload = function (e: any) {
      const result = e.currentTarget.result;
      setHtmlContent(result);
    };
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    accept: {
      "text/html": [".html", ".htm"],
    },
    maxFiles: 1,
    multiple: false,
    onDrop,
  });

  const onImportCode = () => {
    if (!htmlContent) {
      toast.warning(t('please_enter_code'), {
        position: "top-center",
        autoClose: 500,
        hideProgressBar: true,
        pauseOnHover: true,
        theme: "light",
        closeButton: false,
      });
      return
    }
    if (!stack) {
      toast.warning(t('please_select_tech_stack'), {
        position: "top-center",
        autoClose: 500,
        hideProgressBar: true,
        pauseOnHover: true,
        theme: "light",
        closeButton: false,
      });
      return;
    }
    setSettings(stack)
    importFromCode(htmlContent as string, stack)
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button color="violet">{t('import_html_code')}</Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="650px">
        <Flex justify="between">
          <Dialog.Title>{t('import_your_code')}</Dialog.Title>
          <Dialog.Close
            className="cursor-pointer"
            onClick={() => {
              setHtmlContent(undefined)
              setStack(undefined)
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Dialog.Close>
        </Flex>
        <Flex direction="column" className="flex-grow mt-4">
          <p className="text-xs text-gray-500">
            {t('ensure_valid_html')}
          </p>
          <div className="my-4">
            <TextArea radius="full" className="h-[400px]" value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} />
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-nowrap">{t('tech_stack')}：</Text>
            <Select
              value={stack}
              onValueChange={(value: string) => setStack(value as Stack)}
              disabled={shouldDisableUpdates}
            >
              <SelectTrigger
                className="col-span-2 max-w-52"
                id="output-settings-js"
              >
                {stack
                  ? generateDisplayComponent(stack)
                  : t('select')}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.values(Stack).map((stack) => (
                    <SelectItem key={stack} value={stack}>
                      <div className="flex items-center">
                        {generateDisplayComponent(stack)}
                        {STACK_DESCRIPTIONS[stack].inBeta && (
                          <Badge className="ml-2" variant="secondary">
                            Beta
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div {...getRootProps({})}>
              <Input type="file" name="file" {...getInputProps({})} />
              <Button onClick={open} color="violet" variant="outline">
                {t('select_file')}
              </Button>
            </div>
            <Button
              color="violet"
              style={{
                padding: "0 26px",
              }}
              onClick={onImportCode}
            >
              {t('import')}
            </Button>
          </div>
        </Flex>
        <ToastContainer />
      </Dialog.Content>
    </Dialog.Root>
  );
}
