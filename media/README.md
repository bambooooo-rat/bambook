# Bambook local media

Put images, audio, video, and other locally hosted files here when multiple Markdown articles need to reuse them.

Use site-root relative paths in Markdown:

```md
![diagram](media/diagram.png)

<video controls src="media/demo.mp4"></video>

[download the source file](media/source.zip)
```

For article-specific media, you can also put files next to the Markdown file and reference them by filename:

```text
content/
  math/
    note.md
    figure.png
```

```md
![figure](figure.png)
```

The renderer resolves that to `content/math/figure.png`.

<div style="display: flex; justify-content: space-between; gap: 10px; align-items: center;">
  <div style="flex: 1; text-align: center;">
    <img src="_assets\_Envelope_vF.png" alt="高中畢冊素材" style="width: 100%; height: auto;">
    <p style="font-size: 0.9em; color: #555;">高中畢冊素材</p>
  </div>
  <div style="flex: 1; text-align: center;">
    <img src="_assets\videoframe_195782.png" alt="《成名在望》5525版MV" style="width: 100%; height: auto;">
    <p style="font-size: 0.9em; color: #555;">《成名在望》5525版MV</p>
  </div>
  <div style="flex: 1; text-align: center;">
    <img src="_assets\videoframe_221471.png" alt="《成名在望》公司版MV" style="width: 100%; height: auto;">
    <p style="font-size: 0.9em; color: #555;">《成名在望》公司版MV</p>
  </div>
</div>

<div style="width: 100%; max-width: 800px; margin: 10px auto; text-align: center;">
  <video controls width="100%" poster="path_to_video_cover.jpg" style="border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
    <source src="path_to_video.mp4" type="video/mp4">
    <source src="path_to_video.webm" type="video/webm">
    您的瀏覽器不支援 HTML5 影片播放。
  </video>
</div>

<div style="width: 100%; max-width: 500px; margin: 10px auto; text-align: center;">
  <audio controls style="width: 100%;">
    <source src="path_to_audio.mp3" type="audio/mpeg">
    <source src="path_to_audio.wav" type="audio/wav">
    您的瀏覽器不支援 HTML5 聲音播放。
  </audio>
</div>