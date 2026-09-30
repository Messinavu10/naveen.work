# naveen.work

Personal site for Naveen Kumar Rajesh. Plain HTML, CSS, and a little JavaScript, with no build step, hosted free on GitHub Pages.

## Photos

- **Profile photo:** save it as `images/me.jpg`. It fills the top of the profile card and is cropped to fit, so any photo works. A portrait or square shot with your face near the middle looks best.
- **Gallery:** save photos as `images/gallery/1.jpg`, `2.jpg`, and so on. Any size or orientation works; each is cropped to fill its rounded tile, and clicking a tile opens the full photo.
  - To add more than five, copy one `<button class="shot">` line in `index.html` and change the number.
  - To describe a photo for screen readers, fill in its `alt=""`.
  - If a crop cuts off the wrong part, add `style="object-position: center top"` (or `left`, `right`, `bottom`) to that `<img>`.
- Keep photos under about 500 KB each so the page stays fast. Exporting at 1600px on the long side is plenty.

## Editing

- All content lives in `index.html`; styles are in `styles.css`.
- The track in the profile card is the navigation. Each numbered turn links to a section by its `id`, and `script.js` lights up the turn for the section on screen.
- Replace `resume.pdf` whenever the resume changes.
- After changing `styles.css` or `script.js`, bump the `?v=` number where `index.html` loads them, so browsers pick up the new files instead of a cached copy.

Preview locally with `python3 -m http.server` and visit http://localhost:8000.

## Hosting

GitHub Pages serves the `main` branch. The `CNAME` file points it at `naveen.work`.

DNS records at GoDaddy:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | messinavu10.github.io  |
