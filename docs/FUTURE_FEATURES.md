# Future Feature Wishlist

Re-checked against the source on 2026-10-04. Items this file previously listed as "not yet done"
but which **are** implemented are recorded at the bottom so they are not re-added later.

- **Wire up offline / PWA support** — DONE 2026-10-09: migrated to `@serwist/next`
  (`app/sw.ts` + `SwRegister`), stale artefacts deleted, generated worker git-ignored.
  - (Original note, kept for history: `next-pwa` was in `package.json` but `next.config.ts`
    never wrapped the config and nothing registered the worker.)

- **Move / reparent tree nodes**
  - Create, rename and delete exist (`Sidebar.tsx:111`, `:147`, `:180`), but `parentId` never
    changes after creation — there is no drag-and-drop or "Move to…" dialog.

- **Periodic autosave**
  - `Ctrl+S` saves and the store tracks `documentStatus` (`store.ts:386-467`), but no timer or
    idle-debounce autosave exists anywhere in `app/` or `src/`.

- **Global and content search**
  - Current search is a case-insensitive substring match on node **names inside the active
    project** (`Sidebar.tsx:281-312`).
  - Missing: searching document contents, cross-project scope, fuzzy matching, result
    highlighting, and a unified results UI.

- **Touch & Mobile UX Optimizations**
  - The sidebar overlay and toggle are done. Still open: fine-grained touch gestures,
    virtual-keyboard handling, and phone/tablet layout tuning.

- **Additional Export Formats**
  - EPUB, ODF, LaTeX, or custom Markdown-flavoured HTML templates.
  - Also open: image embedding in DOCX (PDF already embeds PNG/JPG).

- **Edit-only / preview-only view modes**
  - `ResizableLayout.tsx` renders a permanent 50/50 split (`defaultSize={50} minSize={20}`);
    there is no toggle to a single pane.

- **Performance Optimizations**
  - ~~Lazy-load export modules~~ already done via dynamic `import()` in `export-service.ts:21-34`.
  - Still open: lazy-loading Mermaid on the preview side, and Dexie pagination / indexed lookups
    for very large projects.

## Already implemented — do not re-add to this list

| Item | Evidence |
|---|---|
| Plain-text (.txt) export, with UI | `ExportMenu.tsx:14`, `plaintext-exporter.ts`, dispatch at `export-service.ts:24` |
| Nested folder support | `nodes.parentId` (`Database.ts:13,32`), recursive `NodeList` (`Sidebar.tsx:379,421`) |
| Bulk export of a whole project | `app/utils/zip-project.ts` (`buildProjectZip`), used at `Sidebar.tsx:10` |
| PPTX export | `pptx-exporter.ts` (325 lines) using `pptxgenjs` |
| Rich DOCX conversion | `docx-exporter.ts` — headings, lists, blockquotes, tables, inline runs |
| Image embedding in PDF | `pdf-exporter.ts:202-206`, `MAX_IMAGE_BYTES` |
| Responsive/mobile sidebar | commit `d73b54f`, `Sidebar.tsx` overlay + `toggle-sidebar` |
| Editor↔preview scroll sync | `Editor.tsx:79`, toggle in `Header.tsx:365` |
