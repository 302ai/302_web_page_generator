import { History } from "./history_types";
import toast from "react-hot-toast";
import classNames from "classnames";

import { Badge } from "../ui/badge";
import { renderHistory } from "./utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Button } from "../ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Dialog, Flex } from '@radix-ui/themes'
import { useTranslation } from "react-i18next";

interface Props {
  history: History;
  currentVersion: number | null;
  revertToVersion: (version: number) => void;
  shouldDisableReverts: boolean;
  regenerate: () => void;
}

export default function HistoryDisplay({
  history,
  currentVersion,
  revertToVersion,
  shouldDisableReverts,
  regenerate,
}: Props) {
  const { t } = useTranslation();

  localStorage.setItem("history", JSON.stringify(history));
  let renderedHistory = renderHistory(history, currentVersion);


  return renderedHistory.length === 0 ? null : (
    <div className="flex flex-col mb-3">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-bold">{t("version")}</h1>
        {renderedHistory.length < 2 && <Button
          onClick={regenerate}
          className="flex items-center gap-x-2"
          size="sm"
        >
          {t("regenerate")}
        </Button>}
        {renderedHistory.length >= 2 && <Dialog.Root>
          <Dialog.Trigger>
            <Button size="sm">{t("regenerate")}</Button>
          </Dialog.Trigger>

          <Dialog.Content maxWidth="450px">
            <Dialog.Title>{t("prompt")}</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              {t("clear_all_modifications_confirmation")}
            </Dialog.Description>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button
                  color="gray"
                  size="sm"
                  variant="outline"
                >
                  {t('cancel')}
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button
                  onClick={regenerate}
                  className="flex items-center gap-x-2 bg-violet-500 hover:bg-violet-600 active:hover:bg-violet-600"
                  size="sm"
                >
                  {t('confirm')}
                </Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>}
      </div>

      <ul className="space-y-0 flex flex-col-reverse">
        {renderedHistory.map((item, index) => (
          <li key={index}>
            <Collapsible>
              <div
                className={classNames(
                  "flex items-center justify-between space-x-2 w-full pr-2 border",
                  "border-b cursor-pointer rounded-md",
                  {
                    " hover:bg-gray-100": !item.isActive,
                    "bg-gray-300 text-violet-500": item.isActive,
                  }
                )}
              >
                <div
                  className="flex justify-between truncate flex-1 p-2"
                  onClick={() =>
                    shouldDisableReverts
                      ? toast.error(
                        t('wait_for_code_generation')
                      )
                      : revertToVersion(index)
                  }
                >
                  <div className="flex gap-x-1 truncate">
                    <h2 className="text-sm truncate">{item.summary}</h2>
                    {item.parentVersion !== null && (
                      <h2 className="text-sm">
                        ({t('parent_version')}: {item.parentVersion}
                        )
                      </h2>
                    )}
                  </div>
                  <h2 className="text-sm">v{index + 1}</h2>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6">
                    <CaretSortIcon className="h-4 w-4" />
                    <span className="sr-only">
                      {t('toggle')}
                    </span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="w-full bg-gray-100 p-2 rounded-md">
                <div className="text-sm">{t('full_prompt')}: {item.summary}</div>
                <div className="flex justify-end">
                  <Badge>{item.type}</Badge>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        ))}
      </ul>
    </div>
  );
}
