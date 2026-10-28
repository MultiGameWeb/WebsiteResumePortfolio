# BotCraft chat screen

The chat UI where shop owners create their AI salesman bot (see `docs/BOTCRAFT_CONCEPT.md`). It is shown on `ai-chatbot-software.html`. Replies are still simulated in `mockChat.js` until Phase 1 connects Gemini.

This is an isolated, no-build HTML/CSS/JavaScript prototype for the BotCraft conversation screen. It uses the current SiteCraft-style static frontend approach and adds no framework, dependency, backend, API key, or existing-site edits.

## Files

- `index.html` — isolated page entry point.
- `styles.css` — responsive light/dark styles, mobile keyboard-safe layout, animations, and accessibility states.
- `chat-screen.js` — page state, event handlers, validation, drag-and-drop, scrolling, progress, and lightbox behavior.
- `components.js` — reusable DOM-rendered UI components: ProgressHeader, MessageList, MessageBubble, QuickChips, TypingIndicator, InputBar, AttachMenu, AttachmentTray, ImageLightbox, and FileCard.
- `mockChat.js` — simulated answers and the one `sendChatAction()` placeholder used for all outbound text, quick-option, attachment, and retry actions.
- `types.js` — JSDoc definitions for messages, options, files, and actions. This is JavaScript rather than `.ts` so GitHub Pages can load it directly without a TypeScript build.

## View locally (no install required)

From the repository root, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/chatbot-builder/
```

Use an HTTP server instead of opening `index.html` with a `file://` URL, because native JavaScript modules are restricted when opened directly from disk.

## Try the interactions

- Tap a starter chip to begin, then use quick-answer chips.
- Type a message and press Enter to send; use Shift+Enter for a new line.
- Use `+` to select a camera image, gallery images, or allowed documents. Files stay local and are not uploaded.
- Remove staged attachments with ×. Try an unsupported extension, a file over 10 MB, or more than five attachments to see inline validation.
- On desktop, drag files into the chat area.
- Click an image message to open the lightbox and use Zoom.
- Use the microphone button to preview its visual recording state. No audio is recorded.
- Send `simulate error` to display a failed message and retry button.
- Use the theme button to switch between light and dark modes.
- Send `నమస్కారం`, Hindi text such as `नमस्ते`, or English to check script rendering.

## Integration boundary

`sendChatAction(action)` in `mockChat.js` is the single outbound boundary. Replace its mock response with your future backend call only when you approve backend work. Do not put Gemini keys or other secrets in this folder. File object URLs are local previews only and are revoked when attachments are removed or the page unloads.

This preview is not connected to live AI, cloud upload, persistent storage, authentication, or production route registration.

## Rollback

Delete only the new `/chatbot-builder/` folder. No existing files, routes, components, config, styles, DB tables, or navigation items are required by this isolated preview.