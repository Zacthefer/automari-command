"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ErrorBanner } from "@/components/layout/error-banner";
import { CallbackBanner } from "@/components/integrations/callback-banner";
import { MotiveCard } from "@/components/integrations/motive-card";
import { activeMotiveConnection } from "@/components/integrations/motive-text";
import { BlurFadeStack } from "@/components/ui/blur-fade";
import { ApiError, getIntegrations } from "@/lib/api";
import type { IntegrationConnection } from "@/types";

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<IntegrationConnection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reloads keep the current card on screen, so a sync result isn't wiped by the refresh
  const load = useCallback(
    () =>
      getIntegrations()
        .then((list) => {
          setConnections(list);
          setError(null);
        })
        .catch((err) =>
          setError(
            err instanceof ApiError && err.status === 403
              ? "Integrations connect a carrier's own account. Sign in with a carrier login to connect Motive."
              : "Couldn't load your integrations."
          )
        ),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  if (connections === null && !error) return <PageSkeleton />;

  return (
    <BlurFadeStack className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect the apps you already use, so your fleet comes into Automari without retyping it."
      />
      <Suspense fallback={null}>
        <CallbackBanner />
      </Suspense>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {connections ? <MotiveCard connection={activeMotiveConnection(connections)} onChanged={load} /> : null}
    </BlurFadeStack>
  );
}
