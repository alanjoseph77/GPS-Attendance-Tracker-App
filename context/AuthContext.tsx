
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService, User } from '../services/storageService';

interface AuthContextType {
    user: User | null;
    login: (userId: string, pass: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        StorageService.getLoggedUser().then(u => {
            setUser(u);
            setIsLoading(false);
        });
    }, []);

    const login = async (userId: string, pass: string) => {
        const users = await StorageService.getUsers();
        const found = users.find(u => u.id === userId && u.password === pass);
        if (found) {
            const { password, ...safeUser } = found; // Don't store plain password in state
            await StorageService.setLoggedUser(found);
            setUser(found);
            return true;
        }
        return false;
    };

    const logout = async () => {
        await StorageService.setLoggedUser(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
