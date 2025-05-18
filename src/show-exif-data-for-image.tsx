import type { Tags } from "exifreader";
import { useEffect, useState } from "react";

import {
  Clipboard,
  Toast,
  open,
  popToRoot,
  showToast,
  getSelectedFinderItems
} from "@raycast/api";

import { exifFromFile, exifFromUrl } from "@/utils/exif";

import TagsScreen from "./screens/TagsScreen";

const main = ({ arguments: { url } }: { arguments: { url: string } }) => {
  const [tagState, setTags] = useState<{ file: string; tags: ExifReader.Tags } | null>(null);

  useEffect(() => {
    const handleTags = (tags: Tags | null, file: string) => {
      if (tags === null) {
        console.log("No tags found, popping to root.");
        popToRoot();
        return;
      }
      setTags({ file, tags });
    };

    (async () => {
      // Check if URL is provided
      if (url && url.length > 0 && url.startsWith("http")) {
        const tags = await exifFromUrl(url);
        handleTags(tags, url);
        return;
      }
      // If URL is not provided, check Finder selection
      try {
        const finderItems = await getSelectedFinderItems();
        if (finderItems.length > 0) {
          // Get the first selected item
          const filePath = finderItems[0].path;
          // Check if the file is an image based on its extension
          const isImage = /\.(jpe?g|png|gif|tiff?|bmp|webp|heic)$/i.test(filePath);

          if (isImage) {
            const tags = await exifFromFile(`file://${filePath}`);
            handleTags(tags, `file://${filePath}`);
            return;
          }
        }
      } catch (error) {
        console.error("Error getting Finder items:", error);
        // Continue to check clipboard if Finder selection fails
      }

      // If no Finder selection, check clipboard
      const { file, text } = await Clipboard.read();

      if (file && file.startsWith("file://")) {
        const tags = await exifFromFile(file);
        handleTags(tags, file);
        return;
      }

      if (text && text.startsWith("http")) {
        const tags = await exifFromUrl(text);
        handleTags(tags, text);
        return;
      }

      await showToast({
        style: Toast.Style.Failure,
        title: "No image found",
        message: "No image in Finder selection or clipboard. Please select an image in Finder or copy to clipboard.",
        primaryAction: {
          title: "Open Clipboard history",
          onAction: async (toast) => {
            await open("raycast://extensions/raycast/clipboard-history/clipboard-history");
            await toast.hide();
          },
        },
      });
      popToRoot();
    })();
  }, []);

  if (tagState === null) {
    return null;
  }

  return <TagsScreen {...tagState} />;
};

export default main;
