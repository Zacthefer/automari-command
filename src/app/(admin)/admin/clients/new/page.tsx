"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreateClientForm } from "@/components/admin/create-client-form";
import { BlurFadeStack } from "@/components/ui/blur-fade";

export default function NewClientPage() {
  return (
    <BlurFadeStack className="space-y-6">
      <PageHeader
        title="Add Client"
        description="Onboard a new carrier company to the platform."
      />
      <CreateClientForm />
    </BlurFadeStack>
  );
}
