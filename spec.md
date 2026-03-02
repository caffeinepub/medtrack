# Specification

## Summary
**Goal:** Add a private Records section to MediTrack where authenticated users can upload, view, search, filter, and delete their own PDF and image medical records, with automatic metadata extraction on upload.

**Planned changes:**
- Add a backend store for file blobs (PDF/PNG/JPEG) per user, tracking file name, MIME type, upload timestamp, extracted metadata, and owner principal; expose upload, list, retrieve, and delete functions scoped to the calling user
- Add a "Records" page accessible from main navigation showing only the authenticated user's own records, each displaying a file-type icon or image thumbnail, file name, upload date, and extracted metadata
- On file selection, run OCR extraction (using existing `ocrExtraction.ts`) to pull record date and patient name, show a review/edit step before saving, and store extracted metadata alongside the blob
- Enable in-app viewing: PDFs open in an embedded viewer (iframe/object), images open in a fullscreen lightbox modal, both with a close button
- Add a delete button per record that shows a confirmation dialog before removing the record from the backend, with success/error toast feedback
- Add a search input (filters by file name or extracted patient name in real time) and date range pickers (from/to) to the Records page; show an empty state when no results match

**User-visible outcome:** After logging in, users can upload PDFs and images, have key info auto-extracted, browse their private records list with search and date filtering, open any file in-app, and delete records — with no access to other users' data.
