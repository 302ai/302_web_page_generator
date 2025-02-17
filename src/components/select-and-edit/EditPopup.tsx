import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { addHighlight, getAdjustedCoordinates, removeHighlight } from "./utils";

interface EditPopupProps {
  inSelectAndEditMode: boolean;
  event: MouseEvent | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  generateMode: "prompt" | "image"
  doUpdate: (updateInstruction: string, selectedElement?: HTMLElement) => void;
  setUpdateInstruction: (text: string) => void;
  setInSelectAndEditMode: (flag: boolean) => void;
  generateCodeHandle: (type: 'upd' | 'create', prompt: string) => void;
}

const EditPopup: React.FC<EditPopupProps> = ({
  event,
  iframeRef,
  doUpdate,
  inSelectAndEditMode,
  // setUpdateInstruction,
  generateCodeHandle,
  generateMode,
  setInSelectAndEditMode,
}) => {
  const inSelectAndEditModeRef = useRef(inSelectAndEditMode);

  useEffect(() => {
    inSelectAndEditModeRef.current = inSelectAndEditMode;
  }, [inSelectAndEditMode]);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const [selectedElement, setSelectedElement] = useState<
    HTMLElement | undefined
  >(undefined);
  const [updateText, setUpdateText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function onUpdate(updateText: string) {
    if (generateMode === 'image') {
      doUpdate(
        updateText,
        selectedElement ? removeHighlight(selectedElement) : selectedElement
      );
    }
    else {
      
      const prompt = updateText + " referring to this element specifically: " + selectedElement?.outerHTML
      console.log(prompt);

      generateCodeHandle('upd', prompt);
    }

    setSelectedElement(undefined);

    setPopupVisible(false);
  }

  useEffect(() => {
    if (!inSelectAndEditMode) {
      if (selectedElement) removeHighlight(selectedElement);
      setSelectedElement(undefined);
      setPopupVisible(false);
    }
  }, [inSelectAndEditMode, selectedElement]);

  useEffect(() => {
    if (!inSelectAndEditModeRef.current || !event) {
      return;
    }

    event.preventDefault();

    const targetElement = event.target as HTMLElement;

    if (!targetElement) return;

    setSelectedElement((prev) => {
      if (prev) {
        removeHighlight(prev);
      }
      return addHighlight(targetElement);
    });

    const adjustedCoordinates = getAdjustedCoordinates(
      event.clientX,
      event.clientY
      // iframeRef.current?.getBoundingClientRect()
    );

    setPopupVisible(true);
    setPopupPosition({ x: adjustedCoordinates.x, y: adjustedCoordinates.y });

    // Reset the update text
    setUpdateText("");

    textareaRef.current?.focus();
  }, [event, iframeRef]);

  useEffect(() => {
    if (popupVisible) {
      textareaRef.current?.focus();
    }

    const textarea = document.getElementById("editTextarea") as HTMLElement;
    textarea?.addEventListener("input", autoResize, false);
    function autoResize() {
      textarea.style.height = 36 + "px";
      textarea.style.height = textarea?.scrollHeight + "px";
    }
  }, [popupVisible]);

  if (!popupVisible) return;

  return (
    <div
      className="absolute bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded shadow-lg w-80"
      style={{ top: popupPosition.y, left: popupPosition.x }}
    >
      <div className="flex w-full box-border">
        <Textarea
          id="editTextarea"
          ref={textareaRef}
          value={updateText}
          onChange={(e) => {
            // setUpdateInstruction(e.target.value);
            setUpdateText(e.target.value);
          }}
          placeholder="输入你的修改想法"
          className="dark:bg-gray-700 dark:text-white shadow-none h-9 min-h-9 resize-none overflow-hidden"
          onKeyDown={(e) => {
            if (!e.shiftKey && e.keyCode === 13) {
              e.preventDefault();
              setInSelectAndEditMode(false);
              onUpdate(updateText);
            }
          }}
        />
        <Button
          className="ml-2 dark:bg-gray-700 dark:text-white h-9"
          onClick={() => {
            setInSelectAndEditMode(false);
            onUpdate(updateText);
          }}
          size="sm"
        >
          更新
        </Button>
      </div>
    </div>
  );
};

export default EditPopup;
