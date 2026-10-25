-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- Starter templates; staff can change or delete them under Dashboard → Email → Templates.
INSERT INTO "EmailTemplate" ("id", "name", "subject", "body", "sortOrder", "updatedAt") VALUES
('tpl_followup', 'Follow-up after enquiry', 'Your study abroad enquiry',
E'Hello {first_name},\n\nThank you for getting in touch with NRC. I am {my_name}, and I will be helping you with your plans.\n\nCould you tell me a little more about what you would like to study, which country you prefer, and when you hope to start? Then I can suggest the best options for you.\n\nKind regards,\n{my_name}', 1, CURRENT_TIMESTAMP),
('tpl_documents', 'Documents needed', 'Documents we need for your application',
E'Hello {first_name},\n\nTo move your application forward, please upload these documents:\n\n- Passport (photo page)\n- Academic certificates and transcripts\n- English test result (IELTS, PTE or similar)\n- CV / personal statement\n\nYou can upload them in your student portal: {portal_link}\n\nKind regards,\n{my_name}', 2, CURRENT_TIMESTAMP),
('tpl_offer', 'Offer received', 'Good news: you have an offer',
E'Hello {first_name},\n\nCongratulations! The university has sent you an offer. You can see the details in your student portal: {portal_link}\n\nI will be in touch about the next steps (deposit and CAS). If you have any questions, just reply to this email.\n\nKind regards,\n{my_name}', 3, CURRENT_TIMESTAMP),
('tpl_visa', 'Visa next steps', 'Your visa application: next steps',
E'Hello {first_name},\n\nNow that your CAS is ready, the next step is your visa application. Please have your passport, CAS, financial documents and TB test result (if required) ready.\n\nLet me know a good time for a call and we will go through it together.\n\nKind regards,\n{my_name}', 4, CURRENT_TIMESTAMP),
('tpl_noreply', 'No response', 'Are you still planning to study abroad?',
E'Hello {first_name},\n\nI tried to reach you about your study plans but could not get through. Are you still interested? Just reply to this email or let me know a good time to call.\n\nKind regards,\n{my_name}', 5, CURRENT_TIMESTAMP);
