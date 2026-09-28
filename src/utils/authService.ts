import { User, UserRole } from '../types/business';

const USERS_STORAGE_KEY = 'spotsini_users_v1';
const CURRENT_USER_KEY = 'spotsini_current_user_v1';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Admin Kelurahan Penggilingan',
    email: 'admin@spotsini.id',
    password: 'admin',
    role: 'admin',
    phone: '0812-8734-7903',
    location_address: 'Kantor Kelurahan Penggilingan, RW 07',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    points_balance: 9999,
    created_at: '2026-01-01'
  },
  {
    id: 'USR-OWNER-01',
    name: 'Ibu Hj. Ratu',
    email: 'ratu@konveksi.id',
    password: 'owner',
    role: 'owner',
    phone: '0813-8899-1001',
    location_address: 'Jl. Penggilingan Baru No. 15, RT 05/RW 07',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    points_balance: 320,
    created_at: '2026-02-15'
  },
  {
    id: 'USR-CUST-01',
    name: 'Budi Santoso',
    email: 'budi@warga.id',
    password: 'user',
    role: 'customer',
    phone: '0812-3456-7890',
    location_address: 'Penggilingan RT 02/RW 10',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    points_balance: 185,
    created_at: '2026-03-01'
  }
];

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  location_address?: string;
}): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === params.email.toLowerCase());
  if (existing) {
    return { success: false, error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' };
  }

  const newUser: User = {
    id: `USR-${Date.now()}`,
    name: params.name,
    email: params.email,
    password: params.password || 'password123',
    role: params.role,
    phone: params.phone || '',
    location_address: params.location_address || 'Kelurahan Penggilingan',
    avatar_url: params.role === 'owner' 
      ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    points_balance: params.role === 'customer' ? 50 : 0, // 50 welcome bonus points!
    created_at: new Date().toISOString().slice(0, 10)
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  setCurrentUser(newUser);

  return { success: true, user: newUser };
}

export function loginUser(email: string, password?: string): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!found) {
    return { success: false, error: 'Akun dengan email ini belum terdaftar.' };
  }

  if (password && found.password && found.password !== password) {
    return { success: false, error: 'Kata sandi tidak sesuai.' };
  }

  setCurrentUser(found);
  return { success: true, user: found };
}

export function updateUserPoints(userId: string, pointsDelta: number): User | null {
  const users = getUsers();
  let updatedUser: User | null = null;
  const updated = users.map(u => {
    if (u.id === userId) {
      updatedUser = {
        ...u,
        points_balance: Math.max(0, u.points_balance + pointsDelta)
      };
      return updatedUser;
    }
    return u;
  });

  saveUsers(updated);
  const current = getCurrentUser();
  if (current && current.id === userId && updatedUser) {
    setCurrentUser(updatedUser);
  }
  return updatedUser;
}

export function logoutUser(): void {
  setCurrentUser(null);
}
