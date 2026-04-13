
import React from "react";

const LegalLayout = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-2">
            {title}
          </h1>
          <div className="w-20 h-1 bg-[var(--color-accent)] rounded-full"></div>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 shadow-sm">
          {children}
        </div>

      </div>
    </div>
  );
};

export default LegalLayout;