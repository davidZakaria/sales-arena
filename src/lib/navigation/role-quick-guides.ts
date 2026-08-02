import type { RoleQuickGuideProps } from "@/components/layout/role-quick-guide";

export const operationsQuickGuide: RoleQuickGuideProps = {
  roleName: "Operations: Data Gatekeeper",
  primaryGoal:
    "Ensure absolute data integrity by verifying compliance documents and preventing duplicate broker entries.",
  tasks: [
    "Intake & De-duplication: Review DRAFT leads and publish clean records to the assignment queue.",
    "Document Audit: Review uploaded Tax IDs and CR files, and manually type the verified numbers into the system.",
    "Quality Control: Return invalid or blurry documents back to Sales for correction.",
  ],
};

export const managerQuickGuide: RoleQuickGuideProps = {
  roleName: "Manager: Territory Commander",
  primaryGoal:
    "Optimize pipeline velocity, dispatch live inquiries, and resolve territory conflicts.",
  tasks: [
    "Assignment: Assign OPEN_RACE broker leads and live property inquiries to your team based on workload.",
    "Pipeline oversight: Monitor team assignments, pending audits, and EOIs awaiting Finance.",
    "Arbitration: Review Audit Logs to resolve Disputed Assignments objectively (Add Co-Pilot or Transfer Ownership).",
  ],
};

export const salesQuickGuide: RoleQuickGuideProps = {
  roleName: "Sales: Deal Closer",
  primaryGoal:
    "Manage broker relationships, secure legal compliance documents, and submit EOIs.",
  tasks: [
    "Compliance: Upload Contracts, Tax IDs, and CR files to the Compliance Vault.",
    "Inquiry response: Reply to assigned property inquiries in My Work using Inventory templates.",
    "Account management: Monitor 'Needs Immediate Action' for agencies missing legal documents.",
    "Revenue tracking: Submit Expressions of Interest (EOIs) with payment receipts to Finance for clearance.",
  ],
};

export const financeQuickGuide: RoleQuickGuideProps = {
  roleName: "Finance: Revenue Guardian",
  primaryGoal:
    "Verify that every EOI submitted by Sales is backed by cleared funds in official bank accounts.",
  tasks: [
    "Clearance: Review the EOI queue for pending payments.",
    "Verification: Cross-reference uploaded receipts and Swift codes with official bank statements.",
    "Resolution: Mark funds as Verified, or Reject bounced/missing payments with explicit notes.",
  ],
};
