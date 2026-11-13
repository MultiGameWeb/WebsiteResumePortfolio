# Vendored libraries and fonts

These files are copied into the repository so the browser-only tools (Resume
Builder, PDF Tools, Document Editor) work without any CDN or backend. They are
loaded only when a feature needs them.

| File | Version | License | Used by |
|---|---|---|---|
| `html-to-image.min.js` | 1.11.11 | MIT | Resume PDF, Document Editor PDF, PDF Tools HTML to PDF |
| `pdf-lib.min.js` | 1.17.1 | MIT | PDF Tools, Document Editor PDF |
| `fontkit.umd.min.js` | @pdf-lib/fontkit 1.1.1 | MIT | PDF Tools (Indian-language text) |
| `regenerator-runtime.js` | 0.14.1 | MIT | needed by fontkit |
| `pdfjs/pdf.min.mjs`, `pdfjs/pdf.worker.min.mjs` | pdfjs-dist 4.4.168 | Apache-2.0 | PDF Tools (read PDFs) |
| `docx.min.js` | docx 9.9.0, minified with terser | MIT | Document Editor and PDF Tools Word export |
| `html2canvas.min.js` | 1.4.1 | MIT | Document Editor PNG export |
| `fonts/NotoSans*_400Regular.ttf` | @expo-google-fonts 0.4.x | SIL Open Font License 1.1 (Noto fonts) | PDF Tools (Indian-language text) |

License texts are in `licenses/` (`noto-fonts-OFL.txt` covers the Noto fonts). The Noto fonts are by Google and are under
the SIL Open Font License 1.1: https://openfontlicense.org
