# Specification

## Summary
**Goal:** Fix OCR date extraction in MediTrack so that report dates are reliably detected from uploaded medical documents and pre-populated in the upload form.

**Planned changes:**
- Expand regex patterns in `frontend/src/lib/ocrExtraction.ts` to support common date formats: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`, `DD MMM YYYY`, and `MMM DD, YYYY`
- Add support for label-prefixed date detection: `Date:`, `Report Date:`, `Collection Date:`, `Sample Date:`, `Test Date:`, and `Date of Report:`
- Convert all extracted dates to ISO 8601 format (`YYYY-MM-DD`) in the `ExtractedTestData` result
- Wire the extracted date into the date field of the `UploadRecordForm` component so it is pre-populated on review
- If no date is found, leave the date field empty without errors

**User-visible outcome:** When a user uploads a medical report PDF or image, the report date is automatically detected and pre-filled in the review form, regardless of the date format used in the document.
