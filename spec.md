# Specification

## Summary
**Goal:** Add the ability to upload PDF or image medical records with OCR-based data extraction that pre-populates the Add Record form in MediTrack.

**Planned changes:**
- Add a backend `uploadFile` endpoint that accepts PDF/image file bytes, stores them per principal, and returns a file reference ID
- Add a backend `extractRecordFromFile` endpoint that performs OCR-style text parsing on a stored file to extract date, test names, and result values
- Add a backend `listUploadedFiles` endpoint returning file metadata (ID, timestamp, MIME type) for the calling principal
- Add a backend `deleteUploadedFile` endpoint to remove a file by ID for the owning principal
- Add an "Upload Record" tab/toggle on the Add Record page alongside the existing manual entry form
- Add a file upload area supporting drag-and-drop and file picker for PNG, JPEG, and PDF (max 5 MB)
- Show a loading/processing state while OCR extraction runs after file selection
- Pre-populate the date, category, and metric fields with extracted OCR data for user review and editing
- Show an expandable read-only "Extracted Text" section displaying raw OCR output
- Show a clear error/warning if OCR returns no usable data or the file exceeds 5 MB

**User-visible outcome:** Users can upload a PDF or image on the Add Record page, have dates, test names, and results automatically extracted and filled into the form, review and correct the pre-populated data, and then submit the record normally.
