import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Stack, STACK_DESCRIPTIONS } from "../lib/stacks";
import { cn } from "@/lib/utils";
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
  stack: Stack | undefined;
  setStack: (config: Stack) => void;
  language: 'zh' | 'en' | 'ja';
  label?: string;
  shouldDisableUpdates?: boolean;
}

function OutputSettingsSection({
  stack,
  setStack,
  language,
  label = "Generating:",
  shouldDisableUpdates = false,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:mt-4 gap-y-2 justify-between text-sm flex-grow">
      <div className="flex items-center">
        <span style={{ width: "130px" }} className={cn(language === 'zh' ? "generating-label" : "")}>{label}</span>
        <Select
          value={stack}
          onValueChange={(value: string) => setStack(value as Stack)}
          disabled={shouldDisableUpdates}
        >
          <SelectTrigger className="col-span-2" id="output-settings-js">
            {stack ? generateDisplayComponent(stack) : (t('select'))}
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
    </div>
  );
}

export default OutputSettingsSection;
