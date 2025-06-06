import type { Tags } from "exifreader";
import ExifReader from "exifreader";
import fetch from "node-fetch";
import fs from "node:fs/promises";

import { showActionToast, showFailureToast } from "./toast";

const handleError = (error: unknown) => {
  console.error(error);

  if (error instanceof Error) {
    showFailureToast("Failed to load EXIF data", error);
  }
};

export const tagsToMarkdownTable = (tags: Tags): string => {
  const table = Object.entries(tags)
    .filter(([key]) => !["Thumbnail", "Images"].includes(key))
    .sort(([key1], [key2]) => key1.localeCompare(key2))
    .map(([key, value]) => {
      if (value === undefined) {
        return `| ${key} | \`undefined\` | \`undefined\` |`;
      }

      if (["ApplicationNotes", "MakerNote"].includes(key)) {
        return `| ${key} | _... omitted (see JSON export) ..._ | \`...\` |`;
      } else if (value instanceof Array) {
        return formatMultilineRow(key, value.map((v) => v.description).join(", "),
          JSON.stringify(value.map((v) => v.value)));
      } else if (value instanceof Date) {
        return formatMultilineRow(key, value.toISOString(),
          JSON.stringify(value.value));
      } else {
        return formatMultilineRow(key, value.description,
          JSON.stringify(value.value));
      }
    })
    .join("\n");

  return `| **Tag** | **Value** | **Raw Value** |\n| --- | --- | --- |\n${table}`;
};

function formatMultilineRow(tag: string, valueText: unknown, rawValueText: unknown): string {
  // Safely convert values to strings
  const valueStr = valueText !== undefined && valueText !== null ? String(valueText) : "";
  const rawValueStr = rawValueText !== undefined && rawValueText !== null ? String(rawValueText) : "";

  if (!valueStr || !valueStr.includes("\n")) {
    // If the value doesn't contain a newline, we can return a single line
    return `| ${tag} | ${valueStr} | \`${rawValueStr}\` |`;
  }

  // Split the value string by newlines
  const valueLines = valueStr.split("\n");

  // Also split the raw value string by newlines
  // We need to replace the newline characters with a temporary marker to avoid splitting the raw value incorrectly
  const tempMarker = "___LINE_BREAK___";
  const rawValue = rawValueStr.replace(/\\n/g, tempMarker);
  const rawValueLines = rawValue.split(tempMarker);

  // First line of the value and raw value
  let result = `| ${tag} | ${valueLines[0]} | \`${rawValueLines[0]}\` |`;

  // Process the rest of the lines
  for (let i = 1; i < valueLines.length; i++) {
    const rawPart = i < rawValueLines.length ? rawValueLines[i] : "";
    const rawDisplay = rawPart ? `\`${rawPart}\`` : "";
    result += `\n| | ${valueLines[i]} | ${rawDisplay} |`;
  }

  return result;
}

export const exifFromFile = async (file: string): Promise<Tags | null> => {
  const toast = await showActionToast({
    title: "Loading EXIF data...",
    cancelable: false,
  });
  try {
    const filePath = decodeURIComponent(file).replace("file://", "");
    const buff = await fs.readFile(filePath);
    const tags = ExifReader.load(buff, { includeUnknown: true });
    toast.hide();
    return tags;
  } catch (error) {
    toast.hide();
    handleError(error);
    return null;
  }
};

export const exifFromUrl = async (url: string): Promise<Tags | null> => {
  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Invalid URL protocol");
    }
    const controller = await showActionToast({
      title: "Loading EXIF data...",
      cancelable: true,
    });
    const buff = await fetch(urlObj, { signal: controller.signal }).then((res) => res.arrayBuffer());
    const tags = ExifReader.load(buff, { includeUnknown: true });

    return tags;
  } catch (error) {
    handleError(error);
    return null;
  }
};
