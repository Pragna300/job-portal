import React from "react";
const LegalSection = ({ title, children }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-3">
        {title}
      </h2>
      <div className="text-[var(--text-secondary)] leading-relaxed text-sm space-y-2">
        {children}
      </div>
    </div>
  );
};

export default LegalSection;