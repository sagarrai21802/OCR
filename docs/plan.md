Product Requirements Document (PRD)

Product Name

OCR AutoFill Extension for ASP.NET WebForms

⸻

1. Objective

Build a Chrome Extension that:
	1.	Extracts structured data from a JPG document displayed on an ASP.NET WebForms page.
	2.	Automatically fills 16 predefined text input fields in the DOM.
	3.	Notifies the user once fields are populated.
	4.	Never triggers Save under any condition.
	5.	Never auto-submits the form.
	6.	Leaves final submission fully manual.

Primary Goal:
Reduce manual data entry effort while preserving human validation before submission.

⸻

2. Problem Statement

Operators manually read a JPG document and retype information into 16 fields. This is:
	•	Time-consuming
	•	Error-prone
	•	Repetitive

The system is ASP.NET WebForms and cannot be modified server-side.
Solution must operate entirely at browser layer.

⸻

3. Product Scope

In Scope
	•	Chrome Extension (Manifest V3)
	•	OCR processing of displayed JPG
	•	Structured field mapping
	•	DOM autofill
	•	User notification
	•	Manual Submit only

Out of Scope
	•	Modifying backend
	•	Altering Save behavior
	•	Storing extracted data
	•	Automatically clicking Submit
	•	Database persistence

⸻

4. Target Environment
	•	Browser: Google Chrome
	•	Page Type: ASP.NET WebForms (.aspx)
	•	Authentication: Already handled by system
	•	Image format: JPG (consistent template layout)

⸻

5. High-Level Architecture

Browser Extension
↓
Content Script
↓
Image Extraction
↓
OCR Processing (Backend or Client-side)
↓
Structured JSON Response
↓
Field Mapping Engine
↓
DOM Autofill
↓
User Notification
↓
Manual Submit by User

⸻

6. Technical Stack

Extension Layer
	•	Manifest V3
	•	JavaScript (ES6)
	•	Chrome Extension APIs

OCR Layer (Recommended Approach)

Option A (Preferred):
	•	Python
	•	Tesseract OCR
	•	OpenAI / Google Vision for structured extraction
	•	FastAPI backend

Option B (Fully Client-side):
	•	Tesseract.js

Development Tools
	•	VS Code
	•	Chrome Developer Mode
	•	Python virtual environment

⸻

7. Functional Requirements
	1.	Detect page load of Current_Work.aspx
	2.	Detect image element with ID:
ContentPlaceHolder1_Frame5
	3.	Extract image source URL
	4.	Send image to OCR engine
	5.	Receive structured JSON
	6.	Map JSON fields to 16 input IDs
	7.	Trigger input events for WebForms compatibility
	8.	Display confirmation alert
	9.	Prevent any Save button auto-trigger
	10.	Do not auto-click Submit

⸻

8. Non-Functional Requirements
	•	Autofill time < 5 seconds
	•	No data persistence
	•	No data logging
	•	Secure API communication (HTTPS)
	•	Works after partial postbacks
	•	Extension must reinitialize after page refresh

⸻

9. Field Mapping Matrix

Image Field → DOM ID

First Name → ContentPlaceHolder1_txtFName
Last Name → ContentPlaceHolder1_txtLName
Email → ContentPlaceHolder1_txtEmail
SSN → ContentPlaceHolder1_txtSSN
Phone → ContentPlaceHolder1_txtPhone
Bank Name → ContentPlaceHolder1_txtBankName
Account No → ContentPlaceHolder1_txtAcNo
Loan Amount → ContentPlaceHolder1_txtLoanAmt
Address → ContentPlaceHolder1_txtAddress
City → ContentPlaceHolder1_txtCity
State → ContentPlaceHolder1_txtState
Zip → ContentPlaceHolder1_txtZip
DOB → ContentPlaceHolder1_txtDob
Licence No → ContentPlaceHolder1_txtLicenceNo
Licence State → ContentPlaceHolder1_txtLicenceState
IP → ContentPlaceHolder1_txtIP

⸻

10. Development Phases

⸻

Phase 1 — Research & Validation

Step 1: Confirm consistent JPG layout
Step 2: Confirm 16 DOM field IDs are stable
Step 3: Confirm image loads fully before script execution

Deliverable: Technical validation checklist

⸻

Phase 2 — Extension Base Setup

Step 1: Create project folder
Step 2: Add manifest.json
Step 3: Add content.js
Step 4: Configure matches for target URL
Step 5: Load unpacked extension in Chrome
Step 6: Validate content script injection

Deliverable: Console log confirmation on page load

⸻

Phase 3 — Image Extraction Layer

Step 1: Locate image by ID
Step 2: Extract src
Step 3: Remove toolbar hash parameters
Step 4: Validate fetchability

Deliverable: Console prints valid image URL

⸻

Phase 4 — OCR Engine Development

Option A (Backend)

Step 1: Setup Python environment
Step 2: Install Tesseract
Step 3: Create OCR script
Step 4: Extract raw text
Step 5: Convert raw text to structured JSON
Step 6: Wrap in FastAPI endpoint
Step 7: Test with sample image

Deliverable: API returns correct JSON

⸻

Phase 5 — Extension API Integration

Step 1: Add fetch call from content.js
Step 2: Send image URL or base64
Step 3: Handle JSON response
Step 4: Error handling if OCR fails

Deliverable: JSON visible in browser console

⸻

Phase 6 — DOM Autofill Engine

Step 1: Create generic setValue() function
Step 2: Assign value
Step 3: Dispatch input event
Step 4: Dispatch change event
Step 5: Map all 16 fields

Deliverable: Fields auto-populate correctly

⸻

Phase 7 — Notification Layer

Step 1: Display banner or alert
Step 2: Message: “Fields auto-filled. Please review and press Submit.”
Step 3: Ensure no Save click triggered

Deliverable: User confirmation appears

⸻

Phase 8 — WebForms Compatibility Hardening

Step 1: Test with __doPostBack behavior
Step 2: Test partial page updates
Step 3: Ensure ViewState integrity
Step 4: Validate no unintended postback

Deliverable: Stable operation

⸻

Phase 9 — Edge Case Handling
	•	Missing OCR fields
	•	Image load failure
	•	OCR low confidence
	•	Field ID mismatch

Deliverable: Graceful failure messages

⸻

11. Workflow (Operational)
	1.	User opens Current_Work.aspx
	2.	Extension detects page
	3.	Image extracted
	4.	OCR performed
	5.	Fields auto-filled
	6.	User reviews
	7.	User clicks Submit
	8.	Form posts to server

No Save interaction occurs.

⸻

12. Risks & Mitigation

Risk: OCR inaccuracy
Mitigation: Use LLM post-processing

Risk: Layout changes
Mitigation: Configurable field mapping file

Risk: ASP.NET partial reload
Mitigation: MutationObserver reinitialization

Risk: Security exposure
Mitigation: No data storage, HTTPS only

⸻

13. Future Enhancements
	•	Confidence score display
	•	Highlight modified fields
	•	Side-panel preview of extracted data
	•	Batch processing mode
	•	Enterprise deployment via policy

⸻

14. Success Metrics
	•	80% reduction in manual typing time
	•	95%+ field accuracy
	•	Zero unintended Save triggers
	•	Zero data persistence

⸻

End of PRD