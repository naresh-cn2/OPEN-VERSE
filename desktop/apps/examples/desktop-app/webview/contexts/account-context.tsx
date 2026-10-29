"use client";

import type { ClineAccountOrganization, ClineAccountUser } from "@cline/core";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { isClineAccountNotAuthenticatedResult } from "@/lib/cline-account-state";
import { desktopClient } from "@/lib/desktop-client";
import {
	type OpenVerseUser,
	getCurrentSession,
	getStoredSession,
	openVerseSignOut,
	subscribeAuthChange,
} from "@/lib/open-verse-auth";

export const ACCOUNT_IDENTITY_STORAGE_KEY = "openverse.account-identity.v1";

const SIGNED_OUT_ERROR_MARKERS = [
	"No Cline account auth token found",
	"no longer valid",
];

type AccountContextValue = {
	user: ClineAccountUser | null;
	openVerseUser: OpenVerseUser | null;
	/** False until the first identity lookup has finished, so a `null` user
	 * can be told apart from "still loading". */
	accountReady: boolean;
	organizations: ClineAccountOrganization[];
	activeOrganization: ClineAccountOrganization | null;
	refreshAccount: () => Promise<void>;
	signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue>({
	user: null,
	openVerseUser: null,
	accountReady: false,
	organizations: [],
	activeOrganization: null,
	refreshAccount: async () => undefined,
	signOut: async () => undefined,
});

export function parseCachedAccountUser(
	raw: string | null,
): ClineAccountUser | null {
	if (!raw) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as { user?: ClineAccountUser | null };
		const user = parsed?.user;
		if (!user || typeof user !== "object") {
			return null;
		}
		if (
			typeof user.email !== "string" &&
			typeof user.displayName !== "string"
		) {
			return null;
		}
		return user;
	} catch {
		return null;
	}
}

function readCachedAccountUser(): ClineAccountUser | null {
	if (typeof window === "undefined") {
		return null;
	}
	try {
		const cached = parseCachedAccountUser(
			window.localStorage.getItem(ACCOUNT_IDENTITY_STORAGE_KEY),
		);
		if (cached) return cached;
		const ovSession = getStoredSession();
		if (ovSession?.user) {
			return {
				id: ovSession.user.id,
				email: ovSession.user.email,
				displayName: ovSession.user.displayName,
			} as ClineAccountUser;
		}
		return null;
	} catch {
		return null;
	}
}

function writeCachedAccountUser(user: ClineAccountUser | null): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		if (user) {
			window.localStorage.setItem(
				ACCOUNT_IDENTITY_STORAGE_KEY,
				JSON.stringify({ user }),
			);
		} else {
			window.localStorage.removeItem(ACCOUNT_IDENTITY_STORAGE_KEY);
		}
	} catch {
		// Account identity still works for this session without the cache.
	}
}

export function isSignedOutAccountError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return SIGNED_OUT_ERROR_MARKERS.some((marker) => message.includes(marker));
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<ClineAccountUser | null>(null);
	const [openVerseUser, setOpenVerseUser] = useState<OpenVerseUser | null>(null);
	const [accountReady, setAccountReady] = useState(false);

	const refreshAccount = useCallback(async () => {
		try {
			const ovSession = getStoredSession();
			if (ovSession?.user) {
				setOpenVerseUser(ovSession.user);
				setUser({
					id: ovSession.user.id,
					email: ovSession.user.email,
					displayName: ovSession.user.displayName,
				} as ClineAccountUser);
				return;
			}

			const me = await desktopClient.invoke<ClineAccountUser>("cline_account", {
				action: "clineAccount",
				operation: "fetchMe",
			});
			// Signed out arrives as a typed result, not an error: an expected
			// state that clears the cached identity without any error handling.
			if (isClineAccountNotAuthenticatedResult(me)) {
				setUser(null);
				setOpenVerseUser(null);
				writeCachedAccountUser(null);
				return;
			}
			setUser(me ?? null);
			writeCachedAccountUser(me ?? null);
		} catch (error) {
			if (isSignedOutAccountError(error)) {
				setUser(null);
				setOpenVerseUser(null);
				writeCachedAccountUser(null);
			}
			// Transient failures (offline, sidecar restarting) keep the cached
			// identity rather than flashing a signed-out state.
		} finally {
			setAccountReady(true);
		}
	}, []);

	const signOut = useCallback(async () => {
		await openVerseSignOut();
		setOpenVerseUser(null);
		setUser(null);
		writeCachedAccountUser(null);
	}, []);

	useEffect(() => {
		// Seed from the cached identity after mount so the signed-in name renders
		// without waiting on the network fetch, which revalidates it right after.
		const ovSession = getStoredSession();
		if (ovSession?.user) {
			setOpenVerseUser(ovSession.user);
			setUser({
				id: ovSession.user.id,
				email: ovSession.user.email,
				displayName: ovSession.user.displayName,
			} as ClineAccountUser);
		} else {
			setUser((current) => current ?? readCachedAccountUser());
		}
		void refreshAccount();

		const unsubscribe = subscribeAuthChange((session) => {
			if (session?.user) {
				setOpenVerseUser(session.user);
				setUser({
					id: session.user.id,
					email: session.user.email,
					displayName: session.user.displayName,
				} as ClineAccountUser);
			} else {
				setOpenVerseUser(null);
				setUser(null);
			}
		});

		return () => {
			unsubscribe();
		};
	}, [refreshAccount]);

	const value = useMemo<AccountContextValue>(() => {
		const organizations = user?.organizations ?? [];
		return {
			user,
			openVerseUser,
			accountReady,
			organizations,
			activeOrganization:
				organizations.find((organization) => organization.active) ?? null,
			refreshAccount,
			signOut,
		};
	}, [accountReady, openVerseUser, refreshAccount, signOut, user]);

	return (
		<AccountContext.Provider value={value}>{children}</AccountContext.Provider>
	);
}

export function useAccount(): AccountContextValue {
	return useContext(AccountContext);
}
