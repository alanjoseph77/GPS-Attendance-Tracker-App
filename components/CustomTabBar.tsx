
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, History, Settings, Users, Menu, FileText } from 'lucide-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { useAuth } from '@/context/AuthContext';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.bar}>
                {state.routes.map((route, index) => {
                    // Direct Auth Check: Hide Admin tab if not admin
                    if (route.name === 'admin' && user?.role !== 'admin') return null;

                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            // Trigger animation 
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    // Icon Mapping
                    let IconComponent = Home;
                    if (route.name === 'index') IconComponent = Home;
                    else if (route.name === 'admin') IconComponent = Users;
                    else if (route.name === 'history') IconComponent = FileText;
                    else if (route.name === 'settings') IconComponent = Menu;

                    // Type safe check for href
                    const opts = options as any;
                    // Expo Router signals a hidden tab with href: null
                    if (opts.href === null) return null;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.9}
                            style={[
                                styles.tabItem,
                                isFocused ? styles.tabItemFocused : null
                            ]}
                        >
                            <View style={[
                                styles.iconCircle,
                                isFocused ? styles.iconCircleFocused : styles.iconCircleInactive
                            ]}>
                                <IconComponent size={20} color="#000" strokeWidth={2.5} />
                            </View>

                            {isFocused && (
                                <Text style={styles.label} numberOfLines={1}>
                                    {options.title || route.name}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'flex-end',
        pointerEvents: 'box-none',
    },
    bar: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        borderRadius: 40,
        padding: 6,
        height: 76,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        // Ensure the bar wraps content tight but has min width
        minWidth: 200,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 32,
        height: 64,
        marginHorizontal: 4,
        // Default inactive state
        width: 64,
        justifyContent: 'center',
    },
    tabItemFocused: {
        // Expanded state
        width: 'auto',
        paddingRight: 24, // Space for text
        backgroundColor: 'transparent',
        justifyContent: 'flex-start',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleInactive: {
        backgroundColor: '#FFF', // White circle for inactive
    },
    iconCircleFocused: {
        backgroundColor: '#FDE047', // Yellow accent for active
    },
    label: {
        color: '#FFF',
        marginLeft: 12,
        fontWeight: '600',
        fontSize: 15,
    }
});
