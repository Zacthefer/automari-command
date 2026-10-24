import { ApiError, createMyPortalSession } from "@/lib/api";

/**
 * Opens the carrier's Stripe billing portal in a new tab.
 * Must be called directly from a click handler: the tab is opened before the
 * request so popup blockers allow it. Returns an error message, or null on success.
 */
export async function openCarrierBillingPortal(): Promise<string | null> {
  const portalTab = window.open("", "_blank");
  if (portalTab) portalTab.opener = null;
  try {
    const { portal_url } = await createMyPortalSession();
    if (portalTab) {
      portalTab.location.href = portal_url;
    } else {
      window.location.assign(portal_url);
    }
    return null;
  } catch (err) {
    portalTab?.close();
    if (err instanceof ApiError && err.status === 503) {
      return "Billing isn't set up yet. Contact Automari support.";
    }
    // 422: this carrier has no Stripe customer yet; the backend message says so
    if (err instanceof ApiError && err.status === 422) {
      return err.message;
    }
    return "Couldn't open billing. Try again in a moment.";
  }
}
