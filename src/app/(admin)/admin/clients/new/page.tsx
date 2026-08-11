"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreateClientForm } from "@/components/admin/create-client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Client"
        description="Onboard a new carrier company to the platform."
      />
      <CreateClientForm />
    </div>
  );
}
