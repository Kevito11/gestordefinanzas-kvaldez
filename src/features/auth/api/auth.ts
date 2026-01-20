import type { AuthState } from '../../../types/auth';

const API_URL = 'http://localhost:3001/api/auth';

export async function loginWithApi(credentials: { username: string; password: string }): Promise<AuthState> {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
    }

    return res.json();
}

export async function registerWithApi(data: { username: string; password: string; name: string }): Promise<AuthState> {
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
    }

    return res.json();
}

export async function changePassword(data: { currentPassword: string; newPassword: string }, token: string) {
    const res = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to change password');
    }

    return res.json();
}

export async function exportData(token: string) {
    const res = await fetch(`${API_URL}/export-data`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
    });

    if (!res.ok) {
        throw new Error('Failed to export data');
    }

    return res.json();
}
