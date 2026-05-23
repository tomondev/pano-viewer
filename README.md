# pano-viewer

A minimal web app for viewing 360° equirectangular panoramas, built with [three.js](https://threejs.org/).

## Run

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

## Use

1. Click **Load panorama** in the top-left, or drag an image file anywhere onto the page.
2. The image should be an **equirectangular** panorama (2:1 aspect ratio, e.g. 4096×2048).

### Controls

| Action | Effect |
| --- | --- |
| Drag | Look around |
| Scroll wheel | Zoom (changes FOV between 20° and 100°) |

Drag sensitivity scales with the current zoom level, so panning stays smooth when zoomed in.

## Files

- `index.html` — page shell, file picker, drop overlay, three.js import map
- `app.js` — scene setup, controls, and panorama loading
