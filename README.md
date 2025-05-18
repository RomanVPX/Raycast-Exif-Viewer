> [!note]
> ### What the fork?
> This is a fork of the Exif Viewer extension for Raycast. Main changes:
>   - Fixed the display of text in UTF-8 encoding.
>   - Fixed (as far as possible) the formation of the markdown table with metadata displayed by the extension for cases when `newline` characters are present in the values. At least now the text stays in the same column.
>   - Added the ability to view the metadata of an image selected in Finder, without having to copy it to the clipboard.
>
> Since the UTF-8 issue was not with the extension itself, but with the third-party library ([__ExifReader__](https://github.com/mattiasw/ExifReader)) used by the extension, I [forked it](https://github.com/RomanVPX/ExifReader-UTF-8) and made some not-so-elegant keyboard pokes to make it properly read UTF-8. In 2025, yes. UTF-8, right... Since I have *absolutely no desire* to further dig into JS to bring my fixes to a state where they could be merged into the main repository, this extension fork simply uses the library from my fork, so there won't be a PR to the Raycast repository either. I'm satisfied with it as is, but,  in case you're interested for some reason, contributions to the [library fork](https://github.com/RomanVPX/ExifReader-UTF-8) are welcome.

# Exif

Show metadata (EXIF) for images from clipboard or URL in Raycast.
