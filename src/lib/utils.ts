import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const morphic_data = 'screenshot_to_code_data'

export function setLocalStorage(window: Window, objects: any) {
  if (window) {
    let existedData = JSON.parse(
      window.localStorage.getItem(morphic_data) || '{}'
    )
    existedData = {
      ...existedData,
      ...objects
    }
    window.localStorage.setItem(morphic_data, JSON.stringify(existedData))
  }
}

export function getLocalStorage(window: Window, key: string) {
  if (window) {
    const data = JSON.parse(window.localStorage.getItem(morphic_data) || '{}')
    return data[key]
  }
  return null
}

export function extractCodeBlocksContent(markdown: string) {
  const codeBlocksRegex =
    /(?:```([a-zA-Z0-9]+)?\s*([\s\S]*?)\s*```|```([a-zA-Z0-9]+)?\s*([\s\S]+?)\s*```)(?![^`]*```)|```([a-zA-Z0-9]+)?\s*([\s\S]+)/gm;
  let match;
  const codeBlocksContent = [];
  while ((match = codeBlocksRegex.exec(markdown))) {
    const codeBlockContent =
      match[6] || match[5] || match[4] || match[3] || match[2] || match[1];
    if (codeBlockContent) {
      codeBlocksContent.push(codeBlockContent);
    }
  }
  return codeBlocksContent;
}
