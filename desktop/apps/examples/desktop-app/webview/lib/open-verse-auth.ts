/**
 * OPEN-VERSE Authentication & Session Management
 *
 * Implements first-party identity management with:
 * - Supabase Auth REST protocol compliance
 * - Offline / Local Mode autonomous fallback
 * - Secure session handling (no passwords stored, safe storage)
 * - Zero coupling to local Hub tokens (local AI agent remains isolated)
 */

export interface OpenVerseUser {
	id: string;
	email: string;
	displayName?: string;
	avatarUrl?: string;
	isOfflineMode?: boolean;
	createdAt?: string;
}

export interface OpenVerseSession {
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
	user: OpenVerseUser;
}

export type AuthScreenState =
	| "welcome"
	| "sign_in"
	| "sign_up"
	| "verify_email"
	| "forgot_password"
	| "reset_password"
	| "offline_mode";

const AUTH_STORAGE_KEY = "openverse.auth.session.v1";
const AUTH_STATE_CHANGE_EVENT = "openverse:auth-state-change";

export interface AuthConfig {
	authUrl?: string;
	anonKey?: string;
}

export function getAuthConfig(): AuthConfig {
	const authUrl =
		process.env.NEXT_PUBLIC_OPENVERSE_AUTH_URL ||
		process.env.NEXT_PUBLIC_SUPABASE_URL ||
		process.env.OPENVERSE_AUTH_URL ||
		"";
	const anonKey =
		process.env.NEXT_PUBLIC_OPENVERSE_ANON_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.OPENVERSE_AUTH_ANON_KEY ||
		"";
	return { authUrl: authUrl.trim(), anonKey: anonKey.trim() };
}

export function isAuthConfigured(): boolean {
	const config = getAuthConfig();
	return Boolean(config.authUrl && config.anonKey);
}

// In-memory session cache
let currentSession: OpenVerseSession | null = null;
let sessionInitialized = false;

export function parseStoredSession(raw: string | null): OpenVerseSession | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as OpenVerseSession;
		if (!parsed || typeof parsed !== "object" || !parsed.user?.email) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function getStoredSession(): OpenVerseSession | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
		return parseStoredSession(raw);
	} catch {
		return null;
	}
}

export function setStoredSession(session: OpenVerseSession | null): void {
	currentSession = session;
	if (typeof window === "undefined") return;
	try {
		if (session) {
			window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
		} else {
			window.localStorage.removeItem(AUTH_STORAGE_KEY);
		}
	} catch {
		// Session will persist in memory for the running instance
	}
	window.dispatchEvent(
		new CustomEvent(AUTH_STATE_CHANGE_EVENT, { detail: { session } }),
	);
}

export function getCurrentSession(): OpenVerseSession | null {
	if (!sessionInitialized) {
		currentSession = getStoredSession();
		sessionInitialized = true;
	}
	return currentSession;
}

export function getCurrentUser(): OpenVerseUser | null {
	return getCurrentSession()?.user ?? null;
}

export function subscribeAuthChange(
	callback: (session: OpenVerseSession | null) => void,
): () => void {
	if (typeof window === "undefined") return () => {};
	const handler = (event: Event) => {
		const customEvent = event as CustomEvent<{ session: OpenVerseSession | null }>;
		callback(customEvent.detail.session);
	};
	window.addEventListener(AUTH_STATE_CHANGE_EVENT, handler);
	return () => {
		window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handler);
	};
}

// Validation helpers
export function isValidEmail(email: string): boolean {
	const trimmed = email.trim();
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
	if (password.length < 8) {
		return { valid: false, message: "Password must be at least 8 characters long." };
	}
	return { valid: true };
}

/**
 * Sign In with Email & Password
 */
export async function openVerseSignIn(params: {
	email: string;
	password: string;
}): Promise<OpenVerseSession> {
	const email = params.email.trim();
	const password = params.password;

	if (!isValidEmail(email)) {
		throw new Error("Please enter a valid email address.");
	}
	if (!password) {
		throw new Error("Password is required.");
	}

	const config = getAuthConfig();
	if (config.authUrl && config.anonKey) {
		const url = `${config.authUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: config.anonKey,
			},
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error_description || data.msg || data.message || "Failed to sign in.");
		}

		const session: OpenVerseSession = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: data.expires_at ? data.expires_at * 1000 : Date.now() + 3600 * 1000,
			user: {
				id: data.user.id,
				email: data.user.email,
				displayName: data.user.user_metadata?.full_name || email.split("@")[0],
				avatarUrl: data.user.user_metadata?.avatar_url,
				createdAt: data.user.created_at,
			},
		};
		setStoredSession(session);
		return session;
	}

	// Autonomous local fallback when no remote backend URL is configured
	const session: OpenVerseSession = {
		user: {
			id: `ov-local-${Buffer.from(email).toString("base64").slice(0, 10)}`,
			email,
			displayName: email.split("@")[0],
			isOfflineMode: false,
			createdAt: new Date().toISOString(),
		},
		expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
	};
	setStoredSession(session);
	return session;
}

/**
 * Sign Up with Email, Password and Full Name
 */
export async function openVerseSignUp(params: {
	email: string;
	password: string;
	fullName?: string;
}): Promise<{ session: OpenVerseSession | null; requiresEmailConfirmation: boolean }> {
	const email = params.email.trim();
	const password = params.password;
	const fullName = params.fullName?.trim();

	if (!isValidEmail(email)) {
		throw new Error("Please enter a valid email address.");
	}
	const pwCheck = validatePassword(password);
	if (!pwCheck.valid) {
		throw new Error(pwCheck.message);
	}

	const config = getAuthConfig();
	if (config.authUrl && config.anonKey) {
		const url = `${config.authUrl.replace(/\/$/, "")}/auth/v1/signup`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: config.anonKey,
			},
			body: JSON.stringify({
				email,
				password,
				data: { full_name: fullName },
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error_description || data.msg || data.message || "Failed to create account.");
		}

		if (data.session) {
			const session: OpenVerseSession = {
				accessToken: data.session.access_token,
				refreshToken: data.session.refresh_token,
				expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600 * 1000,
				user: {
					id: data.user.id,
					email: data.user.email,
					displayName: fullName || email.split("@")[0],
					createdAt: data.user.created_at,
				},
			};
			setStoredSession(session);
			return { session, requiresEmailConfirmation: false };
		}

		return { session: null, requiresEmailConfirmation: true };
	}

	// Autonomous local mode account creation
	const session: OpenVerseSession = {
		user: {
			id: `ov-user-${Date.now()}`,
			email,
			displayName: fullName || email.split("@")[0],
			isOfflineMode: false,
			createdAt: new Date().toISOString(),
		},
		expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
	};
	setStoredSession(session);
	return { session, requiresEmailConfirmation: false };
}

/**
 * Request Password Reset Email
 */
export async function openVerseSendPasswordReset(email: string): Promise<void> {
	const cleanEmail = email.trim();
	if (!isValidEmail(cleanEmail)) {
		throw new Error("Please enter a valid email address.");
	}

	const config = getAuthConfig();
	if (config.authUrl && config.anonKey) {
		const url = `${config.authUrl.replace(/\/$/, "")}/auth/v1/recover`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: config.anonKey,
			},
			body: JSON.stringify({ email: cleanEmail }),
		});
		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			throw new Error(data.msg || data.message || "Failed to send password reset email.");
		}
	}
}

/**
 * Reset Password with token or OTP
 */
export async function openVerseResetPassword(params: {
	token: string;
	newPassword: string;
}): Promise<void> {
	const pwCheck = validatePassword(params.newPassword);
	if (!pwCheck.valid) {
		throw new Error(pwCheck.message);
	}
	if (!params.token.trim()) {
		throw new Error("Reset verification code or token is required.");
	}

	const config = getAuthConfig();
	if (config.authUrl && config.anonKey) {
		const url = `${config.authUrl.replace(/\/$/, "")}/auth/v1/user`;
		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				apikey: config.anonKey,
				Authorization: `Bearer ${params.token.trim()}`,
			},
			body: JSON.stringify({ password: params.newPassword }),
		});
		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			throw new Error(data.msg || data.message || "Failed to update password.");
		}
	}
}

/**
 * Verify Email OTP / token
 */
export async function openVerseVerifyOtp(params: {
	email: string;
	token: string;
}): Promise<OpenVerseSession> {
	const email = params.email.trim();
	const token = params.token.trim();

	const config = getAuthConfig();
	if (config.authUrl && config.anonKey) {
		const url = `${config.authUrl.replace(/\/$/, "")}/auth/v1/verify`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: config.anonKey,
			},
			body: JSON.stringify({
				type: "signup",
				email,
				token,
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.msg || data.message || "Invalid or expired verification code.");
		}

		const session: OpenVerseSession = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: data.expires_at ? data.expires_at * 1000 : Date.now() + 3600 * 1000,
			user: {
				id: data.user.id,
				email: data.user.email,
				displayName: data.user.user_metadata?.full_name || email.split("@")[0],
				createdAt: data.user.created_at,
			},
		};
		setStoredSession(session);
		return session;
	}

	// Local verification
	const session: OpenVerseSession = {
		user: {
			id: `ov-user-${Date.now()}`,
			email,
			displayName: email.split("@")[0],
			isOfflineMode: false,
			createdAt: new Date().toISOString(),
		},
	};
	setStoredSession(session);
	return session;
}

/**
 * Continue in Offline / Local Mode
 * Preserves full local AI Agent and Hub capability without cloud credentials
 */
export function continueInOfflineMode(): OpenVerseSession {
	const offlineSession: OpenVerseSession = {
		user: {
			id: "openverse-local-developer",
			email: "local@openverse.internal",
			displayName: "Local Developer",
			isOfflineMode: true,
			createdAt: new Date().toISOString(),
		},
	};
	setStoredSession(offlineSession);
	return offlineSession;
}

/**
 * Sign Out
 */
export async function openVerseSignOut(): Promise<void> {
	const config = getAuthConfig();
	const session = getCurrentSession();
	if (config.authUrl && config.anonKey && session?.accessToken) {
		try {
			const url = `${config.authUrl.replace(/\/$/, "")}/auth/v1/logout`;
			await fetch(url, {
				method: "POST",
				headers: {
					apikey: config.anonKey,
					Authorization: `Bearer ${session.accessToken}`,
				},
			});
		} catch {
			// Local cleanup proceeds regardless of network error
		}
	}
	setStoredSession(null);
}

