# Employer Verification Implementation TODO

## Phase 1: Update AuthProvider for Document Uploads
- [x] Modify signUp function to handle uploadedDocuments, documentTypes, verificationNotes
- [x] Add document upload to "verification-documents" bucket
- [x] Create employer_verification_request record
- [x] Send "verification in review" notification

## Phase 2: Add Verification Functions to EmployerProvider
- [x] Add submitVerificationRequest function
- [x] Add getVerificationStatus function
- [x] Add uploadVerificationDocuments function

## Phase 3: Add Verification Tab to Admin Dashboard
- [ ] Add verification tab button to admin dashboard
- [ ] Implement verification requests table
- [ ] Add approve/reject functionality with notifications

## Phase 4: Testing and Error Handling
- [ ] Test document upload functionality
- [ ] Test admin approval/rejection
- [ ] Verify notifications are sent correctly
- [ ] Handle error cases for failed uploads
