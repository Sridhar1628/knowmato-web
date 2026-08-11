'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// ────────────────────────────────────────────
// Legal content (directly embedded)
// ────────────────────────────────────────────
const legalData = {
  legal: {
    about: 'About KnowMato',
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    communityGuidelines: 'Community Guidelines',
    creditsPolicy: 'Credits Policy',
    refundPolicy: 'Refund & Cancellation Policy',
    aiPolicy: 'AI Usage Policy',
    studentGuidelines: 'Student Guidelines',
    mentorGuidelines: 'Mentor Guidelines',
    institutionPolicy: 'Institution Policy',
    companyPolicy: 'Company / Recruiter Policy',
    help: 'Help & Support',
    faq: 'Frequently Asked Questions',
    licenses: 'Open Source Licenses',
  },
  aboutKnowmato: {
    pageTitle: 'ℹ️ About KnowMato',
    sections: {
      welcome: {
        title: '👋 Welcome to KnowMato',
        content: 'KnowMato is an end-to-end educational technology platform built by Jeblio Corporation Private Limited. We connect students, mentors, institutions, and companies in a safe, productive environment designed to accelerate learning and career growth.',
      },
      aboutJeblio: {
        title: '🏢 About Jeblio Corporation',
        content: 'Jeblio Corporation Private Limited is an Indian technology company focused on building accessible, high‑quality educational products. Incorporated under the Companies Act, our registered office is in India (address available on request). We are a passionate team of engineers, educators, and designers committed to transforming how India learns.',
      },
      vision: {
        title: '🔭 Vision',
        content: 'To become India’s most trusted learning companion — where every student, regardless of background, can instantly access expert guidance, quality resources, and meaningful career opportunities.',
      },
      mission: {
        title: '🎯 Mission',
        content: 'To democratise education by bridging the gap between curiosity and clarity. We simplify complex concepts through instant doubt resolution, live mentor sessions, structured courses, and AI‑assisted tools — all within a single, affordable ecosystem.',
      },
      whatIsKnowmato: {
        title: '❓ What is KnowMato?',
        content: 'KnowMato is the core platform that enables real‑time educational interactions. Students can post doubts via text, image, voice, or AI assistant, and get connected with verified mentors for chat, audio, or video sessions. It also includes a discussion forum, current affairs, coding practice, assessments, and a credit‑based system to access premium features.',
      },
      whatIsKnowmatoPlus: {
        title: '✨ What is KnowMato+?',
        content: 'KnowMato+ is the premium layer of the platform offering structured learning paths: video lectures, interactive quizzes, coding lectures, practice exercises, assignments, and resource libraries. It is designed for students who want a guided, curriculum‑aligned learning journey alongside on‑demand help.',
      },
      platformFeatures: {
        title: '🧩 Platform Features',
        content: 'KnowMato offers a comprehensive set of tools:\n\n• Instant Doubt Resolution (text, voice, image)\n• Doubt Pool & Individual Mentor Requests\n• Live Chat, Audio, & Video Sessions\n• Solved Doubts History\n• Current Affairs (updated daily)\n• Discussion Forum\n• Courses & Coding Practice\n• Integrated Programming Compiler\n• Assessments & Skill Score\n• Internships & Job Opportunities\n• AI‑powered Voice Assistant & Smart Recommendations',
      },
      supportedLanguages: {
        title: '🌐 Supported Languages',
        content: 'KnowMato is built for India’s linguistic diversity. The platform currently supports:\n\n• English\n• தமிழ் (Tamil)\n• More languages are being added regularly to ensure every student can learn in their mother tongue.',
      },
      creditsSystem: {
        title: '💰 Credits System',
        content: 'KnowMato uses virtual “Credits” as its internal currency. You can purchase credits via UPI, cards, net banking, or wallets. Credits are consumed when you post doubts, request mentors, enroll in courses, or access premium services.\n\nCredits are non‑transferable and have no cash value outside the platform. Unused credits remain in your wallet. For detailed pricing and refund rules, please see our Credits Policy and Refund & Cancellation Policy.',
      },
      whyKnowmato: {
        title: '🌟 Why KnowMato?',
        content: '• Instant access to verified mentors — no scheduling delays.\n• Pay only for what you use — flexible credit packs.\n• Safe, monitored environment with AI & human moderation.\n• Comprehensive learning: doubts + courses + practice + career.\n• Trusted by thousands of students across India.\n• Continuous innovation: AI voice input, Skill Score, and more.',
      },
      ourValues: {
        title: '💎 Our Values',
        content: '📘 **Accessibility** – Education should be barrier‑free.\n🛡️ **Safety** – Zero tolerance for abuse or misconduct.\n🤝 **Respect** – Every learner and mentor deserves dignity.\n💡 **Innovation** – We harness technology to simplify learning.\n🏆 **Excellence** – We strive for the highest quality in every interaction.',
      },
      contactInformation: {
        title: '📞 Contact Information',
        content: '**Jeblio Corporation Private Limited**\n\n📧 Email: knowmatoinfo@gmail.com\n🌐 Website: https://www.knowmato.in\n📍 Registered Office: [Address available on request]\n🕘 Business Hours: Monday – Saturday, 09:00 AM – 06:00 PM (IST)\n\nFor legal notices, please refer to the Terms & Conditions.',
      },
    },
  },
  aiPolicy: {
    title: '🤖 AI Usage Policy',
    copyright: '© {{year}} Jeblio Corporation Private Limited. All rights reserved.',
    section1: {
      title: '🤖 KnowMato AI',
      content: 'KnowMato integrates artificial intelligence to enhance the learning experience, improve platform safety, and provide intelligent assistance. AI is not a replacement for human mentors but a tool to make education faster, more accessible, and more personalised. This policy explains how AI is used, what data it processes, and your rights regarding AI‑powered features.',
    },
    section2: {
      title: '🎙️ Voice Assistant',
      content: 'The KnowMato Voice Assistant allows you to interact with the platform using natural language. You can post doubts, search for mentors, or get course recommendations by speaking. Voice input is transcribed into text using AI speech‑to‑text models. The transcribed text is then processed to understand your intent and provide appropriate responses. Voice recordings are processed in real time and are not stored permanently unless required for quality improvement or safety review.',
    },
    section3: {
      title: '🛡️ AI Monitoring',
      content: 'To maintain a safe and respectful environment, KnowMato uses AI to monitor platform interactions, including:\n\n• Detection of spam, fraud, and scam patterns\n• Identification of abusive language, hate speech, or harassment\n• Detection of personal contact details (phone, email, social IDs) shared in chats\n• Prevention of external platform promotion\n\nAI monitoring runs automatically in the background. Content flagged as high‑risk may be reviewed by our Trust & Safety team.',
    },
    section4: {
      title: '🧹 AI Moderation',
      content: 'AI moderation works alongside human moderators to enforce Community Guidelines and Terms & Conditions. It can:\n\n• Temporarily hide or blur flagged messages\n• Prevent posting of prohibited content\n• Automatically suspend accounts showing clear patterns of malicious behaviour\n\nAutomated decisions that significantly affect your account (e.g., suspension) are subject to human review upon appeal. Minor automated actions (e.g., hiding a spammy post) may not require human intervention.',
    },
    section5: {
      title: '🎯 AI Recommendations',
      content: 'KnowMato uses AI to personalise your experience by analysing your activity, skills, interests, and past interactions. This includes:\n\n• Recommending mentors who match your subject and language preferences\n• Suggesting relevant courses, assessments, and learning paths\n• Highlighting current affairs and discussion topics you may find useful\n• Recommending internship/job listings based on your profile\n\nRecommendation algorithms are designed to improve your learning outcomes and do not use sensitive personal attributes in a discriminatory manner.',
    },
    section6: {
      title: '👁️ Human Review',
      content: 'Certain AI‑processed data may be reviewed by authorised KnowMato personnel to:\n\n• Improve AI accuracy and reduce false positives\n• Investigate serious safety concerns or policy violations\n• Handle appeals against automated decisions\n\nAll human reviews are conducted in accordance with our Privacy Policy and confidentiality commitments.',
    },
    section7: {
      title: '🔄 Data Processing',
      content: 'AI features process the following types of data:\n\n• **Voice Input** – Converted to text; raw audio is not retained long‑term.\n• **Text Content** – Doubts, chat messages, forum posts are analysed for moderation and recommendations.\n• **Behavioural Signals** – Clicks, session duration, and feature usage inform personalisation.\n• **Profile Data** – Skills, interests, language preferences used for matching.\n\nData used for AI is handled according to our Privacy Policy and is not shared with third parties for external AI training.',
    },
    section8: {
      title: '⚠️ Limitations',
      content: 'AI systems are not perfect. You should be aware of the following:\n\n• Voice transcription may have errors, especially with accents or background noise.\n• Automated moderation may occasionally flag legitimate content.\n• AI‑generated responses (e.g., assistant answers) are for informational purposes and may not always be accurate.\n• AI does not replace professional mentors, counsellors, or career advisors.\n\nAlways use your judgment, especially when acting on AI‑generated information. When in doubt, consult a human mentor.',
    },
    section9: {
      title: '🔍 Transparency',
      content: 'We are committed to transparency in AI usage:\n\n• AI‑powered features are labelled as such within the platform.\n• Automated decisions that materially affect your experience will be communicated to you.\n• This policy will be updated whenever we introduce new AI capabilities.\n\nIf you have questions about how a specific AI feature works, you can contact us at knowmatoinfo@gmail.com.',
    },
    section10: {
      title: '✅ User Responsibilities',
      content: 'While using AI‑powered features, you agree to:\n\n• Not attempt to manipulate or deceive AI systems (e.g., jailbreaking, injecting harmful prompts).\n• Not use AI features to generate spam, abusive content, or disinformation.\n• Respect the limitations of AI and verify critical information from trusted sources.\n• Report unexpected or harmful AI behaviour through the in‑app reporting tool.\n\nMisuse of AI features may result in restricted access or account suspension.',
    },
  },
  communityGuidelines: {
    back: 'Back',
    title: '🛡 Community Guidelines',
    copyright: '© {{year}} Jeblio Corporation Private Limited. All rights reserved.',
    section1: {
      title: '🤝 Respect Others',
      content: 'KnowMato is built on mutual respect. Every user — whether a student, mentor, institution, or recruiter — deserves to be treated with dignity. Always communicate politely, even when you disagree. Constructive feedback is welcome; personal attacks are not.',
    },
    section2: {
      title: '🚫 Harassment',
      content: 'Harassment of any kind is strictly prohibited. This includes, but is not limited to:\n\n• Bullying or intimidation\n• Unwanted contact or stalking\n• Repeatedly messaging someone after being asked to stop\n• Using insults, threats, or derogatory language\n• Sexual harassment in any form\n\nHarassment reports are taken seriously and may lead to immediate suspension.',
    },
    section3: {
      title: '🛑 Hate Speech',
      content: 'We do not tolerate hate speech or content that attacks or degrades individuals or groups based on:\n\n• Race, ethnicity, or national origin\n• Religion or belief system\n• Gender, gender identity, or sexual orientation\n• Caste, disability, or medical condition\n• Age or socioeconomic status\n\nHate speech includes slurs, symbols, and any content intended to incite hatred or violence.',
    },
    section4: {
      title: '📢 Spam',
      content: 'Spam includes, but is not limited to:\n\n• Repeatedly posting the same or similar content\n• Unsolicited mass messaging\n• Advertising external products or services without permission\n• Flooding discussions with irrelevant messages\n• Posting links to phishing sites or malware\n\nSpam degrades the experience for everyone and will be removed. Repeat offenders may lose access to the platform.',
    },
    section5: {
      title: '⚠️ Scams',
      content: 'Do not engage in or promote any scam or fraudulent activity, including:\n\n• Phishing attempts\n• Fake job/internship offers\n• Pyramid or multi‑level marketing schemes\n• Requests for money, OTPs, passwords, or sensitive data\n• Impersonation of mentors, staff, or other users\n\nIf you encounter a scam, report it immediately. We will block the user and, if necessary, involve law enforcement.',
    },
    section6: {
      title: '📵 External Promotions',
      content: 'Users are not allowed to promote external platforms, businesses, tuition services, coaching centres, or competing products within KnowMato. This includes:\n\n• Sharing links to other learning platforms\n• Advertising personal coaching or classes\n• Recruiting for external groups or channels\n\nKnowMato is a self‑contained learning ecosystem. Keep all educational interactions inside the platform.',
    },
    section7: {
      title: '🔒 Sharing Contact Details',
      content: 'To protect your privacy and safety, never share personal contact information with other users. Prohibited information includes:\n\n• Phone numbers\n• WhatsApp numbers\n• Telegram IDs\n• Email addresses\n• Social media handles (Instagram, Facebook, etc.)\n• Physical addresses\n\nThis rule applies to chat, doubt posts, discussion forum, and live sessions. If someone asks for your contact details, please report them.',
    },
    section8: {
      title: '©️ Copyright',
      content: 'Respect intellectual property rights. You may only upload content you own or have permission to use. Do not post:\n\n• Copyrighted books, notes, or videos without authorization\n• Software, games, or media you did not create\n• Plagiarized assignments or answers\n\nIf you believe your work has been used without permission, you can file a copyright complaint by contacting support.',
    },
    section9: {
      title: '🚨 Fake Information',
      content: 'Misrepresenting your identity, qualifications, or affiliation is forbidden. This includes:\n\n• Creating fake accounts (students or mentors)\n• Posting false company or institution profiles\n• Lying about credentials or experience\n• Providing misleading information during applications\n\nFake information harms trust and safety. Accounts found in violation may be permanently terminated.',
    },
    section10: {
      title: '💬 Discussion Forum Rules',
      content: 'The Discussion Forum is a space for collaborative learning. Follow these rules:\n\n• Ask educational, career, or technology‑related questions\n• Provide helpful, accurate answers\n• Keep conversations civil and on‑topic\n• Do not post political or religious debates\n• Do not share personal contact information\n• Do not advertise products or services\n\nWe reserve the right to remove any post that violates these guidelines.',
    },
    section11: {
      title: '🎥 Live Session Rules',
      content: 'Live chat, audio, and video sessions are for learning only. During a live session:\n\n• Use respectful language at all times\n• Do not record the session without consent\n• Do not share your screen inappropriately\n• Do not share personal contact details\n• Do not engage in any form of harassment\n\nMentors must maintain professional boundaries. Students should never feel pressured to share personal information or continue communication outside the platform.',
    },
    section12: {
      title: '🚨 Reporting Users',
      content: 'If you witness a violation, please report it:\n\n• Use the Report button inside chats, doubt threads, or profiles\n• Provide as much detail as possible\n• You can also email knowmatoinfo@gmail.com\n\nKnowMato reviews all reports and takes appropriate action, which may include a warning, temporary restriction, or permanent ban. Your identity remains confidential during the investigation.',
    },
    section13: {
      title: '📛 Consequences',
      content: 'Violating these Community Guidelines can lead to:\n\n• **Warning** – First‑time minor violation\n• **Temporary Restriction** – Limited access for a set period\n• **Temporary Suspension** – Full account suspension for repeat offences\n• **Permanent Termination** – Immediate ban for severe violations (harassment, scams, hate speech)\n\nIn extreme cases, we may also report illegal activities to law enforcement. We reserve the right to take action at our discretion to protect the community.',
    },
  },
  companyPolicy: {
    pageTitle: 'Company / Recruiter Policy',
    sections: [
      {
        title: '🏢 Company Registration',
        content: 'Companies and recruiters can register on KnowMato to post jobs, internships, and search for candidates. Registration requires accurate company information, including legal name, registration number, GST/PAN (if applicable), and contact details. KnowMato may verify this information before activating the employer account. Providing false or misleading information may result in immediate removal.',
      },
      {
        title: '📢 Posting Jobs',
        content: 'Employers can publish full‑time, part‑time, contract, and remote job listings. All job postings must accurately reflect the role, required skills, experience level, location, and salary range. Fake or misleading job descriptions are strictly prohibited. KnowMato reserves the right to remove any job listing that violates these policies without prior notice.',
      },
      {
        title: '🎓 Posting Internships',
        content: 'Internships posted on KnowMato must provide real learning opportunities. Include internship type (full‑time, part‑time, remote, hybrid), duration, stipend, and expected skills. Unpaid internships must be clearly labelled and comply with applicable laws. PPO (Pre‑Placement Offer) details, if any, should be mentioned upfront.',
      },
      {
        title: '🔍 Candidate Search',
        content: 'Employers can search for candidates based on skills, Skill Scores, and profile information. Use the search tools responsibly. Do not misuse candidate data or contact candidates for purposes unrelated to recruitment. Bulk messaging, scraping, or automated harvesting of candidate data is forbidden.',
      },
      {
        title: '📊 Skill Score',
        content: 'The Skill Score is an internal metric that helps assess a candidate\'s platform‑based learning performance. It can be used as one factor in recruitment decisions but does not represent formal certification. Employers should not rely solely on the Skill Score when making hiring decisions.',
      },
      {
        title: '🤝 Fair Recruitment',
        content: 'KnowMato expects all employers to follow fair recruitment practices. Do not discriminate based on race, religion, caste, gender, age, disability, or any other protected characteristic. Job listings and candidate evaluations must be based on merit and relevant qualifications.',
      },
      {
        title: '🚫 No Fraud',
        content: 'Fraudulent activities are strictly forbidden. This includes:\n\n• Posting non‑existent jobs or internships\n• Misrepresenting salary, benefits, or role responsibilities\n• Impersonating a legitimate company or recruiter\n• Phishing for personal or financial information\n• Running any form of employment scam\n\nFraudulent accounts will be permanently banned and may be reported to law enforcement.',
      },
      {
        title: '💸 No Fees from Candidates',
        content: 'Companies and recruiters are prohibited from charging candidates any fees for recruitment, application processing, training deposits, or job guarantees through the platform. If any fee is legally required (e.g., a professional certification fee), it must be clearly disclosed in the job description and must not be a condition for application.',
      },
      {
        title: '🔒 Data Usage',
        content: 'Candidate data (resumes, contact details, profiles) obtained through KnowMato must be used solely for recruitment purposes. Employers must not:\n\n• Sell, rent, or share candidate data with third parties\n• Use candidate data for marketing or unsolicited offers\n• Retain candidate data indefinitely without consent\n\nEmployers must comply with applicable data protection and privacy laws when handling candidate information.',
      },
      {
        title: '🚨 Reporting Violations',
        content: 'Employers should report any misuse of their company account or any suspicious activity by candidates or other employers. Conversely, candidates and students can report employers who violate these policies. Reports can be submitted via the app or by emailing knowmatoinfo@gmail.com.',
      },
      {
        title: '🚫 Termination',
        content: 'KnowMato may suspend or permanently terminate a company\'s account for:\n\n• Repeated policy violations\n• Fraudulent job or internship listings\n• Charging illegal fees to candidates\n• Misusing candidate data\n• Discriminatory or unethical recruitment practices\n\nUpon termination, all active job listings will be removed, and access to candidate information will be revoked. The company may be restricted from re‑registering.',
      },
    ],
  },
  creditsPolicy: {
    pageTitle: 'Credits Policy',
    sections: [
      {
        title: '💰 What are Credits?',
        content: 'Credits are the virtual currency used within the KnowMato platform. They allow you to access premium educational services, including posting doubts, requesting mentors, enrolling in courses, taking assessments, and more. Credits have no cash value outside the platform and are not legal tender. Your credit balance is displayed in your wallet at all times.',
      },
      {
        title: '🛒 Buying Credits',
        content: 'You can purchase credit packs through the KnowMato app or website. Supported payment methods include UPI, debit/credit cards, net banking, and mobile wallets. Payments are processed via secure third‑party gateways; KnowMato does not store your full banking credentials. Purchased credits are added to your wallet immediately upon successful payment confirmation.',
      },
      {
        title: '🔄 Top‑up',
        content: 'Top‑up refers to adding more credits to your existing balance. There is no limit on how many times you can top up. Auto‑top‑up options may be offered in the future to ensure uninterrupted learning. All top‑up purchases are final unless covered by our refund policy.',
      },
      {
        title: '🏫 Institution Credits',
        content: 'Educational institutions partnering with KnowMato may purchase credit packs in bulk and distribute them to their students. Institution‑issued credits are subject to the same usage and expiry rules. Institutions may set their own expiry dates for distributed credits, which will be communicated to students at the time of allocation.',
      },
      {
        title: '🎁 Promotional Credits',
        content: 'KnowMato may offer promotional credits as part of welcome offers, referral bonuses, event participation, or seasonal campaigns. Promotional credits are non‑transferable and may come with an expiry date. They cannot be redeemed for cash or refunded. Any misuse (fake accounts, automated scripts) to obtain promotional credits will lead to account suspension.',
      },
      {
        title: '📘 Using Credits',
        content: 'Credits are deducted from your wallet when you:\n\n• Post a doubt in the Doubt Pool\n• Request a specific mentor for an individual session\n• Start a live chat, audio, or video session\n• Enroll in a premium course or learning path\n• Take an advanced assessment\n• Access other premium features as marked in the app\n\nThe exact credit cost for each service is displayed before you confirm the action. You will always be notified of the deduction.',
      },
      {
        title: '⏳ Expiry',
        content: 'Purchased credits generally remain valid for 12 months from the date of purchase, unless stated otherwise. Promotional credits may have a shorter validity (e.g., 30 days). Any unused credits after expiry will be forfeited. KnowMato will make reasonable efforts to notify you before credits expire. Expired credits cannot be reinstated.',
      },
      {
        title: '↩️ Refund of Credits',
        content: 'Refunds are governed by our Refund & Cancellation Policy. In summary:\n\n• If a mentor cancels, you get a full eligible credit refund.\n• If you cancel within the permitted window (usually 5 minutes after matching), you receive a refund minus any platform fee.\n• Technical failures validated by KnowMato may result in a full or partial credit adjustment.\n\nCompleted sessions, substantially accessed courses, and already consumed premium services are non‑refundable. To request a refund, contact support with the session details.',
      },
      {
        title: '🔄 Transfer',
        content: 'Credits are intended for personal use and are non‑transferable. You cannot send, sell, or transfer credits to another user unless explicitly permitted by KnowMato in special circumstances (e.g., institutional credit distribution). Unauthorized transfer may result in account restriction.',
      },
      {
        title: '🚫 Restrictions',
        content: 'The following activities are strictly prohibited and may lead to credit forfeiture and account suspension:\n\n• Purchasing credits using fraudulent payment methods\n• Exploiting bugs or loopholes to gain credits\n• Using multiple fake accounts to collect promotional credits\n• Trading credits outside the platform\n• Attempting to sell credits for real money\n\nKnowMato reserves the right to reverse, void, or confiscate credits obtained through misuse.',
      },
      {
        title: '🛡 Fraud Prevention',
        content: 'To protect users, KnowMato monitors credit transactions for suspicious activity. Unusual purchase patterns, rapid credit consumption, or login from high‑risk locations may trigger a security review. In such cases, we may temporarily freeze your credit balance until the review is complete. You will be notified if any action is taken on your account.',
      },
    ],
  },
  faq: {
    pageTitle: 'Frequently Asked Questions',
    items: [
      { question: 'How to buy credits?', answer: 'Open your Wallet from the sidebar or dashboard. Choose a credit pack that fits your needs. You can pay securely via UPI, debit/credit card, net banking, or supported wallets. Credits are added instantly after payment confirmation.' },
      { question: 'How refund works?', answer: 'If you cancel a session within 5 minutes of mentor matching, you get a partial refund (credits minus platform fee). If the mentor cancels, you get a full refund. Verified technical issues are also eligible. Refunds are credited to your wallet. Completed sessions are non‑refundable.' },
      { question: 'How to become a mentor?', answer: 'Apply via the KnowMato website or app under ‘Become a Tutor’. Fill in your qualifications, skills, and experience. Our team verifies your documents. Once approved, set up your profile and start accepting doubts.' },
      { question: 'How jobs work?', answer: 'Companies post job and internship listings on KnowMato. You can browse, search, and apply directly through the platform. KnowMato does not guarantee interviews or placements. Always verify offers before accepting.' },
      { question: 'Can I delete my account?', answer: 'Yes. You can request account deletion through Settings or by contacting knowmatoinfo@gmail.com. Please note that deletion permanently removes your purchased credits, progress, and history, subject to legal retention requirements.' },
      { question: 'Can I change the language?', answer: 'Absolutely. Go to Settings and choose between English and Tamil (தமிழ்). The entire app will switch immediately. More languages are planned.' },
      { question: 'How Skill Score works?', answer: 'Your Skill Score is an internal metric based on assessments, course completions, and coding challenges you complete on KnowMato. It helps mentors understand your strengths and may be visible to companies. It is not a formal certificate.' },
      { question: 'What if a mentor doesn’t respond?', answer: 'If a mentor doesn’t accept your doubt or goes offline, you can cancel the request (within the allowed window) to get a partial refund, or wait — the doubt may return to the Doubt Pool for another mentor to pick up.' },
      { question: 'Can I report someone?', answer: 'Yes. Use the Report button inside chats, on a user’s profile, or during a session. You can also email knowmatoinfo@gmail.com. We review all reports and take action according to our policies.' },
      { question: 'How AI works?', answer: 'KnowMato uses AI for voice‑to‑text doubt posting, mentor recommendations, and safety moderation. AI assists but does not replace real mentors. AI‑generated answers should be verified by you. No raw audio is stored long‑term.' },
    ],
  },
  helpSupport: {
    pageTitle: '❓ Help & Support',
    contactSupport: {
      heading: '📞 Contact Support',
      description: 'Need immediate help? Reach out via email or raise a support ticket below.',
      sendEmail: '✉️ Send Email',
      copyEmail: '📋 Copy Email',
    },
    raiseTicket: {
      heading: '🎫 Raise a Ticket',
      subjectLabel: 'Subject *',
      subjectPlaceholder: 'e.g., Payment issue, Doubt not answered',
      categoryLabel: 'Category *',
      categoryOptions: { selectCategory: 'Select a category', payment: 'Payment / Credits', technical: 'Technical Issue', session: 'Session / Mentor Problem', account: 'Account / Login', abuse: 'Report Abuse', other: 'Other' },
      descriptionLabel: 'Description *',
      descriptionPlaceholder: 'Describe your issue in detail...',
      submitButton: 'Submit Ticket',
      submitting: 'Submitting...',
    },
    toast: {
      fillAllFields: 'Please fill all fields.',
      ticketRaised: 'Ticket raised successfully! We\'ll get back to you soon.',
      emailCopied: 'Email copied to clipboard!',
      bugReportPreFilled: 'Bug report form pre-filled. Scroll up to submit.',
      featureRequestPreFilled: 'Feature request form pre-filled.',
      reportAbusePreFilled: 'Report abuse form pre-filled.',
      deleteAccountConfirm: 'Are you sure you want to delete your account? This action is irreversible.',
      deleteAccountSent: 'Account deletion request sent. Support will contact you.',
    },
    workingHours: {
      heading: '🕘 Working Hours',
      description: 'Our support team is available:',
      days: 'Monday – Saturday',
      time: '09:00 AM – 06:00 PM (IST)',
      closed: 'We are closed on Sundays and public holidays.',
    },
    quickActions: {
      heading: '⚡ Quick Actions',
      reportBug: '🐛 Report a Bug',
      featureRequest: '💡 Feature Request',
      reportAbuse: '🚨 Report Abuse',
      deleteAccount: '🗑️ Delete Account',
    },
    businessEnquiries: {
      heading: '💼 Business Enquiries',
      description: 'For partnerships, institutional tie‑ups, bulk credits, or media inquiries, please contact us at:',
      email: '✉️ knowmatoinfo@gmail.com',
    },
  },
  institutionPolicy: {
    pageTitle: 'Institution Policy',
    sections: [
      {
        title: '🏫 Institution Registration',
        content: 'Educational institutions (schools, colleges, coaching centres, universities) can register on KnowMato as an Institution. Registration requires submitting accurate institutional details, including official name, address, contact information, and proof of affiliation (if applicable). KnowMato reserves the right to verify these details before activating the institution account. Providing false information may result in immediate termination.',
      },
      {
        title: '👨‍💼 Admin Accounts',
        content: 'Every institution account has one or more designated Administrators. Admins are responsible for managing the institution\'s presence on KnowMato, including:\n\n• Adding or removing teacher and student accounts\n• Purchasing and distributing institution credits\n• Monitoring usage and compliance with platform policies\n• Ensuring data accuracy\n\nAdmins must be authorised representatives of the institution. Compromised admin accounts should be reported immediately to support.',
      },
      {
        title: '🧑‍🏫 Teacher Accounts',
        content: 'Teachers affiliated with a registered institution can be given dedicated accounts. They may access institution-issued credits, manage course materials, and interact with students on the platform. Teachers must adhere to the same professional conduct standards as individual mentors, including respecting student privacy and not sharing personal contact details.',
      },
      {
        title: '👩‍🎓 Student Accounts',
        content: 'Institutions can onboard their students to KnowMato in bulk. Student accounts created under an institution may have access to institutional credits, assigned courses, and institution-specific learning paths. Institutions are responsible for ensuring students comply with platform guidelines. Student data remains subject to our Privacy Policy.',
      },
      {
        title: '💰 Institution Credits',
        content: 'Institutions can purchase credit packs in bulk and distribute them to teachers and students. These credits function the same as regular credits but may have institution‑defined expiry dates or usage restrictions. KnowMato is not responsible for disputes between institutions and their members regarding credit distribution.',
      },
      {
        title: '🛡️ Institution Responsibilities',
        content: 'Institutions agree to:\n\n• Provide accurate and updated institutional information.\n• Ensure that all users (admins, teachers, students) follow KnowMato\'s Terms, Community Guidelines, and applicable policies.\n• Protect student data in accordance with applicable educational and privacy laws.\n• Not misuse the platform for non‑educational purposes, promotional activities, or competitive intelligence.\n• Report any policy violations by their users to KnowMato.',
      },
      {
        title: '🔒 Data Privacy',
        content: 'Institutions must respect the privacy of all users. They shall not collect, store, or process personal data of students or teachers obtained through KnowMato for purposes beyond educational engagement without explicit consent and compliance with applicable data protection laws. KnowMato processes institutional data as described in our Privacy Policy.',
      },
      {
        title: '🚨 Reporting Violations',
        content: 'Institutions should promptly report any violations of platform policies by their members or other users. Use the in‑app reporting tools or contact knowmatoinfo@gmail.com. KnowMato may investigate and take action, including suspension of individual accounts or the institution itself, if violations are substantiated.',
      },
      {
        title: '🚫 Termination',
        content: 'An institution\'s account may be suspended or terminated for:\n\n• Providing false information during registration.\n• Repeated or serious policy violations by the institution or its members.\n• Misuse of platform resources or credits.\n• Any activity that harms the safety or integrity of the platform.\n\nUpon termination, institutional credits may be forfeited, and access to associated accounts may be restricted. Institutions can contact knowmatoinfo@gmail.com to discuss reinstatement.',
      },
    ],
  },
  openSourceLicenses: {
    pageTitle: 'Open Source Licenses',
    intro: 'KnowMato is built with the help of many open source projects. We are grateful to the developers and communities behind these technologies. Below is a list of major dependencies along with their respective licenses.',
    libraries: [
      { name: 'React Native', license: 'MIT License', url: 'https://github.com/facebook/react-native/blob/main/LICENSE', description: 'Framework for building native apps using React.' },
      { name: 'Django', license: 'BSD 3-Clause License', url: 'https://github.com/django/django/blob/main/LICENSE', description: 'High-level Python web framework for rapid development.' },
      { name: 'Agora', license: 'Proprietary (SDK usage under Agora Terms)', url: 'https://www.agora.io/en/terms/', description: 'Real-time voice and video calling infrastructure.' },
      { name: 'Axios', license: 'MIT License', url: 'https://github.com/axios/axios/blob/main/LICENSE', description: 'Promise-based HTTP client for browser and Node.js.' },
      { name: 'Redux', license: 'MIT License', url: 'https://github.com/reduxjs/redux/blob/master/LICENSE.md', description: 'Predictable state container for JavaScript apps.' },
      { name: 'React Navigation', license: 'MIT License', url: 'https://github.com/react-navigation/react-navigation/blob/main/LICENSE', description: 'Routing and navigation for React Native apps.' },
      { name: 'Next.js', license: 'MIT License', url: 'https://github.com/vercel/next.js/blob/canary/license.md', description: 'React framework for production web applications.' },
      { name: 'Tailwind CSS', license: 'MIT License', url: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE', description: 'Utility-first CSS framework for rapid UI development.' },
      { name: 'Framer Motion', license: 'MIT License', url: 'https://github.com/motiondivision/motion/blob/main/LICENSE', description: 'Animation library for React.' },
      { name: 'Redux Toolkit', license: 'MIT License', url: 'https://github.com/reduxjs/redux-toolkit/blob/master/LICENSE', description: 'Official toolset for efficient Redux development.' },
      { name: 'React Hot Toast', license: 'MIT License', url: 'https://github.com/timolins/react-hot-toast/blob/main/LICENSE', description: 'Lightweight toast notifications for React.' },
      { name: 'i18next', license: 'MIT License', url: 'https://github.com/i18next/i18next/blob/master/LICENSE', description: 'Internationalization framework for JavaScript.' },
    ],
  },
  mentorGuidelines: {
    pageTitle: 'Mentor Guidelines',
    sections: [
      {
        title: '🧑‍🏫 Becoming a Mentor',
        content: 'To become a KnowMato mentor, you must apply through the official process (via the app or website). You need to provide your educational qualifications, skills, experience, and identity documents. Mentors are subject to verification before their profile goes live. KnowMato reserves the right to accept or reject any application.',
      },
      {
        title: '✅ Verification',
        content: 'All mentors undergo identity and qualification verification. You may be asked to submit: government ID, degree certificates, experience letters, or live video verification. Providing false documents leads to immediate rejection and possible legal action. Verified mentors receive a \'Verified\' badge on their profile.',
      },
      {
        title: '📋 Profile',
        content: 'Keep your profile complete and accurate. Include: clear display name, professional photo (optional but recommended), detailed skills list, language proficiency, years of experience, and a brief bio. A high-quality profile increases your chances of being selected by students.',
      },
      {
        title: '🤝 Accepting Doubts',
        content: 'You can browse the Doubt Pool and accept doubts that match your expertise. Do not accept doubts you cannot solve. Accept only if you can provide quality guidance in a timely manner. Repeatedly accepting and then abandoning doubts harms your reliability score.',
      },
      {
        title: '🟢 Online / Offline Status',
        content: 'Set your availability accurately. When online, you may receive doubt requests. Going offline while a session is active is considered a cancellation unless due to a genuine technical issue. If you\'re unavailable for extended periods, set your status to offline.',
      },
      {
        title: '👤 Individual Requests',
        content: 'Students may send you direct doubt requests. You can accept or decline. Declining frequently is fine, but avoid ignoring requests. If you accept, commit to providing quality help. Your responsiveness influences your visibility in search results.',
      },
      {
        title: '🎯 Session Quality',
        content: 'Provide clear, step‑by‑step explanations. Adapt your teaching style to the student\'s level. Use whiteboard, code sharing, or screen sharing tools when helpful. Do not rush sessions to earn more credits. Focus on concept clarity, not just answers.',
      },
      {
        title: '🤝 Professional Behaviour',
        content: 'Treat every student with respect and patience. Do not use abusive language, sarcasm, or make students feel inferior. Maintain a supportive and encouraging tone. Avoid discussing personal or unrelated topics during sessions.',
      },
      {
        title: '⭐ Ratings & Reviews',
        content: 'Students rate sessions. High ratings improve your visibility and earning potential. Low ratings due to poor quality may reduce your chance of receiving new doubts. Do not ask students to give you high ratings or coerce them. If you receive an unfair rating, contact support.',
      },
      {
        title: '📊 Reliability Score',
        content: 'Your reliability score is based on: response time, cancellation rate, session completion rate, and student ratings. A low score may result in fewer doubt assignments or temporary suspension. You can improve your score by consistently delivering quality sessions and avoiding cancellations.',
      },
      {
        title: '💰 Earnings',
        content: 'Mentors earn credits or monetary compensation as per the agreed terms. Earnings are calculated per session or per doubt. KnowMato deducts a platform commission as communicated. Earnings are reflected in your mentor wallet.',
      },
      {
        title: '🏦 Withdrawals',
        content: 'You can withdraw your earnings after reaching a minimum threshold (e.g., ₹500). Withdrawals are processed within 3–7 business days to your registered bank account or UPI ID. Ensure your payout details are correct. Any tax liability is the mentor\'s responsibility.',
      },
      {
        title: '❌ Cancellation',
        content: 'Avoid cancelling accepted sessions. If you must cancel, do so immediately with a valid reason. Frequent cancellations reduce your reliability score and may lead to fewer doubt assignments. If a student cancels, you will be notified. If KnowMato cancels due to platform issues, it will not affect your score.',
      },
      {
        title: '🚨 Reporting Students',
        content: 'If a student behaves inappropriately, shares personal contact details, or violates guidelines, report them immediately via the session screen or support. Do not engage in arguments. Your report helps maintain platform safety.',
      },
      {
        title: '©️ Copyright',
        content: 'Do not upload copyrighted materials (e.g., scanned books, pirated software) unless you own the rights. Respect intellectual property. Violations can lead to content removal and account suspension. If you believe your content has been misused, file a complaint.',
      },
      {
        title: '🚫 Suspension',
        content: 'KnowMato may suspend or permanently ban mentors for: fraud, fake credentials, misconduct, harassment, sharing personal contact details, demanding external payments, or repeated cancellations. Serious offences (e.g., sexual harassment) result in immediate termination and possible reporting to authorities.',
      },
      {
        title: '📨 Appeals',
        content: 'If you believe your account was suspended or terminated in error, you can appeal by contacting knowmatoinfo@gmail.com. Provide relevant evidence and details. KnowMato reviews appeals on a case‑by‑case basis. Decisions are final, but we strive to be fair.',
      },
    ],
  },
  privacyPolicy: {
    pageTitle: 'Privacy Policy',
    sections: [
      {
        title: 'Introduction',
        content: 'This Privacy Policy explains how Jeblio Corporation Private Limited (“KnowMato”, “we”, “our”, or “us”) collects, uses, discloses, and protects your personal information when you access the KnowMato platform (website, mobile app, APIs, and services).\n\nBy using KnowMato, you consent to the practices described in this policy. If you do not agree, please discontinue use of the platform.',
      },
      {
        title: 'Information We Collect',
        content: 'We collect information to provide, improve, and secure our services. The categories of data we collect fall into two groups: information you provide directly, and information collected automatically.',
      },
      {
        title: 'Information You Provide',
        content: 'When you create an account, post a doubt, apply to a job/internship, communicate with mentors, or otherwise interact with the platform, we may collect:\n\n• **Account Data** – Name, email address, phone number, profile picture, educational background, skills, and role (student, mentor, institution, etc.).\n• **Content Data** – Text, images, voice inputs, documents, and videos you upload or share.\n• **Communication Data** – Messages, session recordings (if applicable), feedback, and support tickets.\n• **Payment Data** – Transaction records, billing address, and partial payment method details (we do not store full card numbers).\n• **Application Data** – For companies: registration number, GST, PAN, address; for students: resumes, cover letters.',
      },
      {
        title: 'Automatically Collected Data',
        content: 'When you use the platform, we automatically collect certain information, including:\n\n• **Device Information** – Device type, operating system, browser type, IP address, and unique device identifiers.\n• **Usage Data** – Pages visited, features used, session duration, clicks, and navigation patterns.\n• **Log Data** – Timestamps, error logs, crash reports, and performance data.\n• **Location Data** – Approximate location derived from IP address; precise location only if you grant permission.\n• **Cookies & Similar Technologies** – Used on our website for authentication, preferences, analytics, and security.',
      },
      {
        title: 'Permissions Used',
        content: 'Our mobile app requests specific device permissions to enable core features. You can control these permissions in your device settings.',
      },
      {
        title: 'Camera',
        content: 'Used to capture images for doubt posting, scanning documents, and during live video sessions. The camera is only activated with your explicit action and can be revoked anytime.',
      },
      {
        title: 'Microphone',
        content: 'Used for voice-based doubt posting (voice-to-text), AI voice assistant, and live audio/video sessions. Recordings are processed securely and never stored without notification.',
      },
      {
        title: 'Location',
        content: 'Approximate location may be derived from your IP to improve content relevance (e.g., language, local news). Precise GPS location is only accessed if you enable location-based features (e.g., job filtering) and can be turned off.',
      },
      {
        title: 'Storage',
        content: 'Access to device storage is required to upload images, PDFs, or resumes from your gallery/file manager. We only access files you select.',
      },
      {
        title: 'Notifications',
        content: 'We use push notifications to alert you about session invites, mentor responses, job updates, and platform announcements. You can disable notifications in your device settings.',
      },
      {
        title: 'Device Information',
        content: 'We collect device model, OS version, and network type to optimize performance, troubleshoot issues, and ensure compatibility.',
      },
      {
        title: 'Cookies (Website)',
        content: 'Our website uses cookies and similar technologies for authentication, remembering language preferences, analytics, and security. You can manage cookie preferences through your browser settings. Disabling cookies may affect functionality.',
      },
      {
        title: 'How We Use Information',
        content: 'We use collected data to:\n\n• Provide, maintain, and improve the platform.\n• Process transactions (credit purchases, subscriptions).\n• Match students with mentors based on skills and availability.\n• Facilitate communication and live sessions.\n• Personalize content (language, recommended mentors, courses).\n• Monitor for policy violations, spam, and fraud.\n• Send service updates, security alerts, and support messages.\n• Comply with legal obligations and enforce our Terms.\n• Conduct research and analytics to enhance user experience.',
      },
      {
        title: 'AI Processing',
        content: 'KnowMato uses artificial intelligence to improve the platform, including:\n\n• **Voice-to-Text** – Your voice input is transcribed to create doubt posts.\n• **Smart Recommendations** – AI suggests mentors, courses, and content based on your activity.\n• **Moderation** – Automated systems detect spam, abusive language, and contact sharing.\n• **Voice Assistant** – Interactions are processed to provide relevant assistance.\n\nAI processing is done in compliance with this Privacy Policy. Unless explicitly stated, AI-generated responses are not a substitute for human mentors. You remain responsible for verifying AI‑assisted information.',
      },
      {
        title: 'Data Sharing',
        content: 'We do not sell your personal information. We share data only in the following circumstances:\n\n• **With your consent** – E.g., applying for a job directly shares your resume with the company.\n• **Service Providers** – Trusted third parties who assist us (cloud hosting, payment gateways, analytics, notification services) and are bound by confidentiality.\n• **Legal Obligations** – When required by law, court order, or to protect rights/safety.\n• **Business Transfers** – In the event of a merger, acquisition, or asset sale, user data may be transferred with prior notice.\n\nWhen you interact with mentors, institutions, or companies, those parties may see your profile information necessary for the interaction (e.g., your name, skills, and doubt content).',
      },
      {
        title: 'Third Parties',
        content: 'Our platform may integrate with third‑party services (payment gateways, video conferencing, AI providers). These services have their own privacy policies, and we recommend reviewing them. KnowMato is not responsible for the practices of third‑party services once you leave our platform.',
      },
      {
        title: 'Security',
        content: 'We implement industry‑standard security measures (encryption, firewalls, access controls) to protect your data. However, no online service is completely secure. You should also protect your account credentials and avoid sharing sensitive personal information during sessions.',
      },
      {
        title: 'Data Retention',
        content: 'We retain personal information for as long as necessary to provide services, resolve disputes, comply with legal obligations, and enforce our Terms. Even after account closure, we may retain certain data for legitimate business or legal reasons (e.g., transaction logs, moderation records).',
      },
      {
        title: 'Account Deletion',
        content: 'You can request account deletion via the app or by contacting support. Upon verification, we will delete or anonymize your personal data, subject to any retention requirements. Please note that deletion may remove access to purchased credits, course progress, and learning history.',
      },
      {
        title: 'Children\'s Privacy',
        content: 'KnowMato is intended for users 13 years and older. We do not knowingly collect personal information from children under 13 without parental consent. If you are a parent and believe your child has provided us with personal data, contact us immediately so we can delete it.',
      },
      {
        title: 'Your Rights',
        content: 'Depending on your jurisdiction, you may have rights to:\n\n• Access and obtain a copy of your data.\n• Rectify inaccurate or incomplete information.\n• Request deletion of your data.\n• Restrict or object to certain processing.\n• Data portability.\n• Withdraw consent at any time (does not affect prior lawful processing).\n\nTo exercise these rights, contact us at knowmatoinfo@gmail.com. We will respond within a reasonable timeframe.',
      },
      {
        title: 'Contact',
        content: 'For privacy‑related questions, requests, or complaints, please contact us at:\n\n**Jeblio Corporation Private Limited**\n📧 Email: knowmatoinfo@gmail.com\n🌐 Website: https://www.knowmato.in\n📍 Registered Office: [Address available on request]\n🕘 Business Hours: Monday – Saturday, 09:00 AM – 06:00 PM (IST)',
      },
    ],
  },
  refundPolicy: {
    pageTitle: 'Refund & Cancellation Policy',
    sections: [
      {
        title: '✅ Eligible Refunds',
        content: 'Refunds are available under specific conditions defined below. They apply only to credit‑based transactions on the KnowMato platform. Refunds are generally processed in the form of Credits returned to your KnowMato wallet, not as cash, unless required by applicable law. Eligibility depends on who initiates the cancellation, the timing, and the reason.',
      },
      {
        title: '👨‍🎓 Student Cancellation',
        content: 'As a student, you may cancel a doubt request or session after a mentor has been matched, but only within the permitted cancellation window — currently 5 minutes from the time of successful matching. If cancelled within this window, you will receive a refund of the session credits minus the applicable platform fee (see Platform Fee section). If the mentor has already begun substantial work (e.g., started explaining, sharing materials), the session may be considered non‑refundable.',
      },
      {
        title: '👨‍🏫 Mentor Cancellation',
        content: 'If a mentor cancels an accepted session without a valid reason (e.g., they are unable to attend, disconnect, or fail to provide the guidance), the student will receive a full refund of credits. The mentor\'s reliability score may also be reduced. Repeated cancellations by a mentor can result in fewer doubt assignments or temporary suspension.',
      },
      {
        title: '🛡 Platform Cancellation',
        content: 'KnowMato may cancel a session or doubt request due to policy violations, suspicious activity, or technical issues. If KnowMato cancels the session, the student will receive a full refund of credits. No platform fee will be deducted in such cases. This may also apply if a mentor is found to be in breach of terms during a session.',
      },
      {
        title: '🔧 Technical Failure',
        content: 'If a live session (chat, audio, or video) cannot be completed due to verified platform‑side technical issues — such as server downtime, connectivity loss on KnowMato\'s side, or app malfunction — we will investigate and provide an appropriate credit refund or session rescheduling. You may need to provide details or logs for verification. This does not cover issues arising from the user\'s own device, internet connection, or third‑party apps.',
      },
      {
        title: '⚖️ Partial Refunds',
        content: 'In some cases, only a partial refund may be applicable. For example: if a session was partially completed but the remaining time was unusable due to a minor issue, we may refund a proportion of credits. Partial refunds are determined at KnowMato\'s discretion after reviewing the session context.',
      },
      {
        title: '🏦 Platform Fee',
        content: 'When a student cancels within the eligible window, a small platform fee (currently up to 5% of the session cost) is deducted to cover payment processing and operational costs. For example, a 5‑credit session would incur a 0.25‑credit fee, resulting in a 4.75‑credit refund. This fee is not deducted if the mentor cancels or if KnowMato cancels the session.',
      },
      {
        title: '👛 Wallet Refund',
        content: 'All eligible refunds are credited back to your KnowMato credit wallet. Credits are not refunded as cash to your bank account or payment source unless specifically required by law or in cases where a credit purchase itself is refundable (e.g., accidental duplicate purchase). Wallet credits can be used for any future service.',
      },
      {
        title: '🚫 Non‑refundable Services',
        content: 'The following are generally non‑refundable:\n\n• Consumed credits already used in a completed session.\n• Courses or learning paths that have been substantially accessed or completed.\n• Premium assessments that have been attempted.\n• Expired credits (credit expiry is not grounds for a refund).\n• Promotional credits (these have no cash value and cannot be refunded).\n\nRefund requests for non‑refundable items will be declined.',
      },
      {
        title: '⏱️ Processing Time',
        content: 'Once a refund is approved, it is processed within 24–48 hours. Your credit wallet will be updated, and you will receive an in‑app notification or email confirmation. In rare cases where a cash refund is applicable, processing may take 5–10 business days depending on your payment provider.',
      },
    ],
  },
  studentGuidelines: {
    pageTitle: 'Student Guidelines',
    sections: [
      {
        title: '📝 Creating an Account',
        content: 'Create only one account per person. Use your real name and accurate information. Fake, duplicate, or impersonating accounts will be suspended. Students under 18 must have parental or guardian consent. Keep your login credentials secure and never share them.',
      },
      {
        title: '❓ Posting Doubts',
        content: 'Doubts must be genuine educational questions. Provide a clear title, detailed description, relevant category, and any supporting images or documents. Vague or off‑topic posts may be rejected. You can post via text, voice, or image upload. Ensure content is appropriate and non‑offensive.',
      },
      {
        title: '🎯 Doubt Pool',
        content: 'When you post a doubt in the Doubt Pool, it becomes visible to eligible mentors. Credits are deducted upon posting. A mentor may accept your doubt; you can then start a live session. You may cancel within 5 minutes of matching for a partial refund (platform fee applies).',
      },
      {
        title: '👤 Individual Requests',
        content: 'You can directly request a specific mentor. Credits are higher for individual requests. The mentor must accept before a session begins. Respect their availability — if they decline or are offline, choose another mentor or use the Doubt Pool.',
      },
      {
        title: '💰 Credits',
        content: 'Credits are required for posting doubts and accessing premium services. Purchase credits via UPI, cards, or wallets. Promotional credits may have expiry dates. Credits are non‑transferable and cannot be sold. Misuse (e.g., exploiting referral systems) leads to forfeiture.',
      },
      {
        title: '↩️ Refunds',
        content: 'Refer to the Refund & Cancellation Policy for full details. In brief: cancel within 5 minutes of matching for a partial refund; full refund if the mentor cancels or KnowMato cancels due to technical issues. Completed sessions are non‑refundable.',
      },
      {
        title: '🎥 Session Behaviour',
        content: 'During live chat, audio, or video sessions: be respectful and stay on topic. Do not share personal contact information (phone, WhatsApp, email, social IDs). Do not record sessions without explicit consent. Harassment, abuse, or inappropriate behaviour will result in immediate action.',
      },
      {
        title: '⭐ Ratings & Reviews',
        content: 'After a session, you can rate the mentor and leave feedback. Be honest and constructive. False or malicious ratings are against policy. Your ratings help maintain quality and influence mentor visibility. You cannot edit ratings after submission; contact support for genuine errors.',
      },
      {
        title: '💬 Discussion Forum',
        content: 'Use the forum to ask questions, share knowledge, and help peers. Follow Community Guidelines: no spam, hate speech, contact sharing, or promotions. Stay on educational topics. Moderators may remove inappropriate posts. Repeated violations can lead to forum access being revoked.',
      },
      {
        title: '📚 Courses & Learning',
        content: 'Enrol in courses using credits. Watch lectures, complete quizzes, and do assignments. Progress is tracked. Do not share course materials outside the platform. Cheating on assessments (plagiarism, copying) is prohibited. Course access may expire based on the plan.',
      },
      {
        title: '📝 Tests & Assessments',
        content: 'Take assessments honestly. Do not use unauthorised aids or impersonate others. Results contribute to your Skill Score. Attempting to cheat or exploit assessment flows may result in score nullification and account restriction.',
      },
      {
        title: '📊 Skill Score',
        content: 'Your Skill Score is an internal metric based on assessments, course completions, and platform activity. It is not a formal certificate but helps match you with relevant mentors and opportunities. Provide accurate skills to maintain a true reflection.',
      },
      {
        title: '📰 Current Affairs',
        content: 'Read daily current affairs to stay updated. Use the information for your own knowledge. Do not misuse the comment section (if any) for political or religious debates. Respect others\' viewpoints. Content is curated; factual errors can be reported.',
      },
      {
        title: '🚨 Reporting Mentors',
        content: 'If a mentor behaves inappropriately, violates guidelines, or asks for external contact/payment, report them immediately via the session screen or knowmatoinfo@gmail.com. Provide evidence if possible. Knowingly false reports may be considered a violation.',
      },
      {
        title: '⛔ Prohibited Activities',
        content: 'As a student, you must NOT:\n\n• Share personal contact details\n• Request or make payments outside KnowMato\n• Promote external coaching or platforms\n• Upload copyrighted or illegal content\n• Harass, bully, or discriminate against anyone\n• Use abusive language or hate speech\n• Create multiple fake accounts\n• Attempt to defraud the credit system\n\nViolations will be met with consequences up to permanent termination.',
      },
      {
        title: '🔒 Account Suspension',
        content: 'Serious or repeated violations can lead to suspension or permanent ban. KnowMato may issue a warning first, but gross misconduct (e.g., fraud, harassment) may result in immediate termination. You can appeal by contacting support. During suspension, access to credits and services is restricted.',
      },
    ],
  },
  termsAndConditions: {
    pageTitle: 'Terms & Conditions (Master Agreement)',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content: 'Welcome to KnowMato. These Terms & Conditions govern your access to and use of KnowMato, KnowMato+, the website, mobile applications, APIs, services, and any related products operated by Jeblio Corporation Private Limited (“KnowMato”, “we”, “our”, or “us”).\n\nBy creating an account, accessing, browsing, or using the Platform, you agree to comply with these Terms, our Privacy Policy, Community Guidelines, Refund Policy, and all other applicable policies. If you do not agree, you must discontinue using the Platform immediately.',
      },
      {
        title: '2. Definitions',
        content: '• **Platform** – KnowMato, KnowMato+, website, apps, APIs and related services.\n• **User** – Any person accessing the Platform.\n• **Student** – A learner using KnowMato for educational purposes.\n• **Mentor** – A verified expert providing educational guidance.\n• **Institution** – Schools, colleges, universities, coaching centres registered with KnowMato.\n• **Company** – Recruiters, employers or organizations posting jobs/internships.\n• **Credits** – The virtual currency used within KnowMato.\n• **Session** – Any interaction between users (chat, audio, video, AI, etc.).',
      },
      {
        title: '3. Eligibility',
        content: '• Users 18 years or older may register independently.\n• Users below 18 may use the Platform only with consent from a parent, guardian, or institution where legally required.\n• You agree to provide true, complete, and up-to-date information during registration. False information may lead to suspension or permanent termination.',
      },
      {
        title: '4. User Accounts',
        content: '• Each account is personal and non-transferable.\n• You are responsible for maintaining confidentiality of your login credentials and for all activities under your account.\n• You must notify KnowMato immediately if you suspect unauthorized access.\n• KnowMato is not liable for losses arising from your failure to protect your account.',
      },
      {
        title: '5. Platform Usage',
        content: '**Services** – KnowMato provides instant doubt resolution, live sessions, courses, coding practice, assessments, job/internship listings, AI tools, and more.\n\n**General Prohibitions** – Users must not:\n• Share personal contact details (phone, WhatsApp, Telegram, email, etc.)\n• Promote external tuition or competing platforms\n• Upload illegal, copyrighted, or harmful material\n• Abuse, harass, discriminate, or impersonate others\n• Attempt to bypass the Platform or solicit external payments\n\n**Students** agree to ask genuine questions, respect mentors, and follow Community Guidelines.\n**Mentors** agree to maintain professional conduct, deliver accurate guidance, and never demand external payments.\n\nViolation may result in warnings, temporary restrictions, or permanent termination.',
      },
      {
        title: '6. Payments',
        content: '• Credits can be purchased via UPI, debit/credit cards, net banking, wallets, and other supported payment methods.\n• Payments are processed through authorised third‑party gateways; KnowMato does not store complete banking credentials.\n• Refunds: Students may cancel a doubt before the mentor substantially begins (within 5 minutes of matching) for a partial refund after platform fees. Full refund if mentor cancels without valid reason. Technical failures may also be eligible for refunds.\n• Non‑refundable: consumed credits, completed sessions, substantially accessed courses, and already delivered premium services.',
      },
      {
        title: '7. Credits',
        content: '• Credits are virtual currency used for posting doubts, requesting mentors, purchasing courses, premium assessments, etc.\n• Credits have no cash value outside the Platform and cannot be transferred between users unless officially permitted.\n• KnowMato reserves the right to modify pricing, credit requirements, and promotional offers at any time.',
      },
      {
        title: '8. Intellectual Property',
        content: '• All rights to the Platform — including KnowMato, KnowMato+, Jeblio Corporation, logos, UI, software, source code, designs, trademarks, databases, and documentation — are owned by or licensed to Jeblio Corporation Private Limited.\n• No user may copy, modify, reverse engineer, or commercially exploit any part of the Platform without prior written permission.\n• Users retain ownership of their original content but grant KnowMato a non‑exclusive, royalty‑free license to store, display, and process it solely for operating the Platform.',
      },
      {
        title: '9. Suspension & Termination',
        content: 'KnowMato may suspend or terminate accounts for fraud, repeated policy violations, sharing contact details to bypass the Platform, illegal activities, copyright infringement, harassment, hate speech, or misuse of services.\n\nActions may include: warning, temporary restriction, temporary suspension, or permanent account termination. For serious offences, immediate permanent termination may occur without prior warning.\nUsers may contact support to appeal certain actions where applicable.',
      },
      {
        title: '10. Limitation of Liability',
        content: 'KnowMato is a technology platform connecting users; it does not guarantee uninterrupted access, that every doubt will be answered, admission, exam success, internship/employment placement, or career advancement.\n\nTo the maximum extent permitted by law, Jeblio Corporation Private Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of the Platform.',
      },
      {
        title: '11. Governing Law',
        content: 'These Terms shall be governed by and interpreted in accordance with the laws of the Republic of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts located in the jurisdiction of the registered office of Jeblio Corporation Private Limited.',
      },
      {
        title: '12. Dispute Resolution',
        content: 'Users are encouraged to first contact KnowMato Support for an amicable resolution. Where mutually agreed and legally permissible, disputes may be resolved through negotiation or mediation before litigation. Nothing limits statutory rights available under applicable law.',
      },
      {
        title: '13. Contact Information',
        content: '**Jeblio Corporation Private Limited**\n\n📧 Email: knowmatoinfo@gmail.com\n🌐 Website: https://www.knowmato.in\n📍 Registered Office: [Address available on request]\n🕘 Business Hours: Monday – Saturday, 09:00 AM – 06:00 PM (IST)',
      },
    ],
  },
};

// ────────────────────────────────────────────
// Helpers to render different policy shapes
// ────────────────────────────────────────────
const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white flex-1 pr-4">{title}</h3>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-violet-300 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-white/80 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Render a policy that has an array of sections (companyPolicy, creditsPolicy, etc.)
const ArraySectionPolicy = ({ pageTitle, sections }: { pageTitle: string; sections: { title: string; content: string }[] }) => (
  <PolicySection title={pageTitle}>
    {sections.map((s, i) => (
      <div key={i}>
        <h4 className="text-white font-semibold mb-1">{s.title}</h4>
        <p className="whitespace-pre-line text-sm">{s.content}</p>
      </div>
    ))}
  </PolicySection>
);

// Render a policy that has numbered sections (aiPolicy, communityGuidelines)
const NumberedSectionPolicy = ({ title, data }: { title: string; data: any }) => {
  const sections = Object.keys(data)
    .filter(k => k.startsWith('section'))
    .map(k => ({ title: data[k].title, content: data[k].content }));

  return (
    <PolicySection title={title}>
      {sections.map((s, i) => (
        <div key={i}>
          <h4 className="text-white font-semibold mb-1">{s.title}</h4>
          <p className="whitespace-pre-line text-sm">{s.content}</p>
        </div>
      ))}
    </PolicySection>
  );
};

// Render aboutKnowmato with its sections object
const AboutSectionPolicy = ({ pageTitle, sections }: { pageTitle: string; sections: any }) => {
  const secs = Object.keys(sections).map(k => ({ title: sections[k].title, content: sections[k].content }));
  return (
    <PolicySection title={pageTitle}>
      {secs.map((s, i) => (
        <div key={i}>
          <h4 className="text-white font-semibold mb-1">{s.title}</h4>
          <p className="whitespace-pre-line text-sm">{s.content}</p>
        </div>
      ))}
    </PolicySection>
  );
};

// Render FAQ
const FAQPolicy = ({ pageTitle, items }: { pageTitle: string; items: { question: string; answer: string }[] }) => (
  <PolicySection title={pageTitle}>
    {items.map((item, i) => (
      <div key={i} className="mb-4">
        <h4 className="text-white font-semibold">Q: {item.question}</h4>
        <p className="text-sm whitespace-pre-line">{item.answer}</p>
      </div>
    ))}
  </PolicySection>
);

// Render Help & Support as a special block (static info)
const HelpSupportPolicy = ({ data }: { data: any }) => {
  const copyEmail = () => {
    navigator.clipboard.writeText('knowmatoinfo@gmail.com');
    toast.success('Email copied to clipboard!');
  };

  return (
    <PolicySection title={data.pageTitle}>
      <div className="space-y-6">
        {/* Contact Support */}
        <div>
          <h4 className="text-white font-semibold mb-1">{data.contactSupport.heading}</h4>
          <p className="text-sm">{data.contactSupport.description}</p>
          <div className="flex gap-3 mt-3 flex-wrap">
            <a
              href="mailto:knowmatoinfo@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/30 text-violet-200 hover:bg-violet-600/50 transition text-sm"
            >
              ✉️ Send Email
            </a>
            <button
              onClick={copyEmail}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-sm"
            >
              📋 Copy Email
            </button>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <h4 className="text-white font-semibold mb-1">{data.workingHours.heading}</h4>
          <p className="text-sm">{data.workingHours.description}</p>
          <p className="text-sm">{data.workingHours.days} | {data.workingHours.time}</p>
          <p className="text-xs text-white/50 mt-1">{data.workingHours.closed}</p>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-white font-semibold mb-2">{data.quickActions.heading}</h4>
          <div className="flex flex-wrap gap-2">
            {['reportBug', 'featureRequest', 'reportAbuse', 'deleteAccount'].map((action) => (
              <span key={action} className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">
                {data.quickActions[action]}
              </span>
            ))}
          </div>
        </div>

        {/* Business Enquiries */}
        <div>
          <h4 className="text-white font-semibold mb-1">{data.businessEnquiries.heading}</h4>
          <p className="text-sm">{data.businessEnquiries.description}</p>
          <a href="mailto:knowmatoinfo@gmail.com" className="text-sm text-violet-300 hover:underline">
            {data.businessEnquiries.email}
          </a>
        </div>
      </div>
    </PolicySection>
  );
};

// Render Open Source Licenses
const OpenSourcePolicy = ({ pageTitle, intro, libraries }: { pageTitle: string; intro: string; libraries: any[] }) => (
  <PolicySection title={pageTitle}>
    <p className="text-sm mb-4">{intro}</p>
    <div className="space-y-3">
      {libraries.map((lib, i) => (
        <div key={i} className="p-3 rounded-lg bg-white/5">
          <h4 className="text-white font-medium">{lib.name}</h4>
          <p className="text-xs text-white/60">{lib.license}</p>
          <p className="text-xs mt-1">{lib.description}</p>
          <a href={lib.url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-300 hover:underline break-all">
            {lib.url}
          </a>
        </div>
      ))}
    </div>
  </PolicySection>
);

// ────────────────────────────────────────────
// Main Legal Page Component
// ────────────────────────────────────────────
export default function LegalPage() {
  return (
    <div className="relative min-h-screen overflow-auto bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background blobs & grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(to_right,#ffffff_1px,transparent_1px)] [background-size:45px_45px]" />
      </div>

      <Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            Legal & Policies
          </h1>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">
            Everything you need to know about using KnowMato — from terms to guidelines and support.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* About */}
          <AboutSectionPolicy
            pageTitle={legalData.aboutKnowmato.pageTitle}
            sections={legalData.aboutKnowmato.sections}
          />

          {/* Terms & Conditions */}
          <ArraySectionPolicy
            pageTitle={legalData.termsAndConditions.pageTitle}
            sections={legalData.termsAndConditions.sections}
          />

          {/* Privacy Policy */}
          <ArraySectionPolicy
            pageTitle={legalData.privacyPolicy.pageTitle}
            sections={legalData.privacyPolicy.sections}
          />

          {/* Community Guidelines */}
          <NumberedSectionPolicy
            title={legalData.communityGuidelines.title}
            data={legalData.communityGuidelines}
          />

          {/* Credits Policy */}
          <ArraySectionPolicy
            pageTitle={legalData.creditsPolicy.pageTitle}
            sections={legalData.creditsPolicy.sections}
          />

          {/* Refund Policy */}
          <ArraySectionPolicy
            pageTitle={legalData.refundPolicy.pageTitle}
            sections={legalData.refundPolicy.sections}
          />

          {/* AI Usage Policy */}
          <NumberedSectionPolicy
            title={legalData.aiPolicy.title}
            data={legalData.aiPolicy}
          />

          {/* Student Guidelines */}
          <ArraySectionPolicy
            pageTitle={legalData.studentGuidelines.pageTitle}
            sections={legalData.studentGuidelines.sections}
          />

          {/* Mentor Guidelines */}
          <ArraySectionPolicy
            pageTitle={legalData.mentorGuidelines.pageTitle}
            sections={legalData.mentorGuidelines.sections}
          />

          {/* Institution Policy */}
          <ArraySectionPolicy
            pageTitle={legalData.institutionPolicy.pageTitle}
            sections={legalData.institutionPolicy.sections}
          />

          {/* Company/Recruiter Policy */}
          <ArraySectionPolicy
            pageTitle={legalData.companyPolicy.pageTitle}
            sections={legalData.companyPolicy.sections}
          />

          {/* Help & Support */}
          <HelpSupportPolicy data={legalData.helpSupport} />

          {/* FAQ */}
          <FAQPolicy
            pageTitle={legalData.faq.pageTitle}
            items={legalData.faq.items}
          />

          {/* Open Source Licenses */}
          <OpenSourcePolicy
            pageTitle={legalData.openSourceLicenses.pageTitle}
            intro={legalData.openSourceLicenses.intro}
            libraries={legalData.openSourceLicenses.libraries}
          />
        </motion.div>

        <p className="text-center text-white/30 text-xs mt-8">
          © {new Date().getFullYear()} Jeblio Corporation Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}