import React from "react";
import LegalLayout from "../../layouts/LegalLayout";
import LegalSection from "../../components/LegalSection";

const Terms = () => {
  return (
    <LegalLayout title="Terms and Conditions">

      <p className="text-[var(--text-secondary)] mb-6">
        By accessing and using this Job Portal, you agree to comply with the following terms and conditions.
      </p>

      <LegalSection title="1. User Roles">
        <ul className="list-disc ml-6">
          <li>Clients can search and apply for jobs</li>
          <li>Managers can post jobs and manage applications</li>
          <li>Admins manage platform operations</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Account Responsibility">
        <ul className="list-disc ml-6">
          <li>Provide accurate information</li>
          <li>Maintain account confidentiality</li>
          <li>Report unauthorized access</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Job Listings">
        <ul className="list-disc ml-6">
          <li>Jobs must be genuine and accurate</li>
          <li>Fake or misleading jobs are prohibited</li>
          <li>Admin may remove listings without notice</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Applications">
        <ul className="list-disc ml-6">
          <li>One application per job</li>
          <li>No modification after submission</li>
          <li>Managers handle application decisions</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Company Approval">
        <p>Companies must be approved by Admin before posting jobs.</p>
      </LegalSection>

      <LegalSection title="6. Prohibited Activities">
        <ul className="list-disc ml-6">
          <li>Providing false information</li>
          <li>Unauthorized system access</li>
          <li>Uploading harmful or illegal content</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Liability">
        <p>
          We are not responsible for hiring decisions or employment outcomes.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to Terms">
        <p>We may update these terms at any time.</p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Email: support@shnoor.com</p>
      </LegalSection>

    </LegalLayout>
  );
};

export default Terms;