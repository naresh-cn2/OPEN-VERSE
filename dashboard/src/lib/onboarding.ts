export const ONBOARDING_STORAGE_KEY = "openverse.onboarding.v1";
export const ONBOARDING_RESET_EVENT = "openverse:onboarding-reset";

export type OnboardingStorage = {
  completedAt: string | null;
  setupMethod?: "cline" | "api-key" | null;
  providerId?: string | null;
  modelId?: string | null;
};

export function parseOnboardingStorage(raw: string | null): OnboardingStorage {
  if (!raw) {
    return { completedAt: null };
  }
  try {
    const parsed = JSON.parse(raw);
    const completedAt =
      parsed && typeof parsed === "object" && typeof parsed.completedAt === "string" && parsed.completedAt.trim().length > 0
        ? parsed.completedAt
        : null;
    return {
      completedAt,
      setupMethod: parsed.setupMethod ?? null,
      providerId: parsed.providerId ?? null,
      modelId: parsed.modelId ?? null,
    };
  } catch {
    return { completedAt: null };
  }
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const storage = parseOnboardingStorage(window.localStorage.getItem(ONBOARDING_STORAGE_KEY));
    return storage.completedAt !== null;
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(details?: {
  setupMethod: "cline" | "api-key";
  providerId: string;
  modelId: string;
}): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const storage: OnboardingStorage = {
      completedAt: new Date().toISOString(),
      setupMethod: details?.setupMethod ?? "api-key",
      providerId: details?.providerId ?? null,
      modelId: details?.modelId ?? null,
    };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn("Failed to mark onboarding completed:", error);
  }
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to reset onboarding:", error);
  }
  window.dispatchEvent(new CustomEvent(ONBOARDING_RESET_EVENT));
}
