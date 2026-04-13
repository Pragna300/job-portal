
import React from "react";
import LegalLayout from "../../layouts/LegalLayout";
import LegalSection from "../../components/LegalSection";

const Privacy = () => {
  return (
    <LegalLayout title="Privacy Policy">

      <p className="text-[var(--text-secondary)] mb-6">
        This Privacy Policy explains how we collect, use, and protect your information.
      </p>

      <LegalSection title="1. Information We Collect">
        <ul className="list-disc ml-6">
          <li>Personal details (name, email)</li>
          <li>Profile data (resume, skills)</li>
          <li>Application activity</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Usage of Information">
        <ul className="list-disc ml-6">
          <li>Provide job services</li>
          <li>Enable employer access to applications</li>
          <li>Improve platform performance</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Data Sharing">
        <ul className="list-disc ml-6">
          <li>Shared with employers upon application</li>
          <li>No selling of personal data</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Data Security">
        <p>
          We implement security measures, but absolute security cannot be guaranteed.
        </p>
      </LegalSection>

      <LegalSection title="5. User Rights">
        <ul className="list-disc ml-6">
          <li>Update profile anytime</li>
          <li>Request account deletion</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <p>We use cookies to enhance user experience.</p>
      </LegalSection>

      <LegalSection title="7. Policy Updates">
        <p>This policy may change at any time.</p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>Email: support@shnoor.com</p>
      </LegalSection>

    </LegalLayout>
  );
};

export default Privacy;