
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// --- PALETTES ---

export const PALETTES = {
    cosmic: {
        background: ['#0f0c29', '#302b63', '#24243e'], // Deep nebula
        primary: '#6C63FF',
        secondary: '#FF6584',
        accent: '#00F0FF',
        surface: 'rgba(255, 255, 255, 0.1)',
        surfaceHighlight: 'rgba(255, 255, 255, 0.2)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.7)',
        border: 'rgba(255, 255, 255, 0.2)',
        success: '#00E096',
        error: '#FF3B30',
    },
    executive: {
        background: ['#FFFFFF', '#F3F4F6', '#E5E7EB'],
        primary: '#111827', // Gray 900
        secondary: '#4B5563', // Gray 600
        accent: '#D97706', // Amber 600
        surface: '#FFFFFF',
        surfaceHighlight: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        success: '#059669',
        error: '#DC2626',
    },
    future: {
        background: ['#000000', '#1A1A1A', '#000000'],
        primary: '#CCFF00', // Neon Lime
        secondary: '#00FFCC', // Cyan
        accent: '#FF00FF', // Magenta
        surface: '#111111',
        surfaceHighlight: '#222222',
        text: '#E0E0E0',
        textSecondary: '#888888',
        border: '#333333',
        success: '#CCFF00',
        error: '#FF0055',
    }
};

// Explicitly type GRADIENTS to ensure compatibility with expo-linear-gradient
export const GRADIENTS: Record<string, [string, string, ...string[]]> = {
    cosmic: ['#0F172A', '#1E293B', '#312e81'], // Adjusted for better screen feel
    cosmic_accent: ['#4F46E5', '#7C3AED'],

    executive: ['#F9FAFB', '#F3F4F6', '#E5E7EB'],
    executive_dark: ['#1F2937', '#111827'],

    future: ['#000000', '#0a0a0a', '#111111'],
    future_glow: ['rgba(204, 255, 0, 0.2)', 'rgba(0, 0, 0, 0)'],
};

export const SHADOWS = {
    soft: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    glow: {
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    sharp: {
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 0,
    }
};

export const FONTS = {
    // Assuming system fonts for now, but configured for weights
    thin: '100',
    regular: '400',
    medium: '500',
    bold: '700',
    black: '900',
};

// Current Active Theme - Change this to switch globally or use Context
export const ACTIVE_THEME = 'cosmic'; 
