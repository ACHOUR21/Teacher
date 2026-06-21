const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
function getAuthToken() {
    if (typeof window === 'undefined')
        {return null;}
    try {
        const raw = localStorage.getItem('eduai-auth');
        if (!raw)
            {return null;}
        const parsed = JSON.parse(raw);
        return parsed?.state?.accessToken ?? null;
    }
    catch {
        return null;
    }
}
function authHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
export async function completeOnboarding(data) {
    const response = await fetch(`${BASE_URL}/tenants/onboarding-complete`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
            orgName: data.orgName,
            orgType: data.orgType,
            country: data.country,
            timezone: data.timezone,
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor,
            tagline: data.tagline,
        }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? `Request failed: ${response.status}`);
    }
}
export async function sendInvites(emails) {
    const validEmails = emails.filter((e) => e.trim().length > 0);
    if (validEmails.length === 0)
        {return;}
    const response = await fetch(`${BASE_URL}/invitations/bulk`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ emails: validEmails }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? `Request failed: ${response.status}`);
    }
}
export async function createFirstCourse(title, description) {
    const response = await fetch(`${BASE_URL}/courses`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title, description }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? `Request failed: ${response.status}`);
    }
}
