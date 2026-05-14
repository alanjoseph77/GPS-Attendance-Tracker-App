
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Platform, Image, Dimensions } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { ChevronRight, Figma, Image as ImageIcon, Box, Activity, ArrowLeft, MoreHorizontal, Phone, Mail, LogOut, Clock, MapPin, User, Shield } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const { totalTimeToday, isInside } = useAttendance();

    const handleLogout = () => {
        Alert.alert("Logout", "Sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout }
        ]);
    };

    const MenuItem = ({ icon: Icon, label, value, onPress, isDanger }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIconBox, isDanger && { backgroundColor: '#FEF2F2' }]}>
                <Icon size={20} color={isDanger ? '#EF4444' : '#000'} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, isDanger && { color: '#EF4444' }]}>{label}</Text>
                {value && <Text style={styles.menuValue}>{value}</Text>}
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* New Design: Full Screen Profile Header */}
            <View style={styles.headerBg}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.backBtn}>
                        <LogOut size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <Animated.View entering={FadeInDown.delay(100)} style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: `https://ui-avatars.com/api/?name=${user?.name}&background=random&size=256` }}
                            style={styles.avatar}
                        />
                        <View style={[styles.statusDot, { backgroundColor: isInside ? '#10B981' : '#9CA3AF' }]} />
                    </View>
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.role}>{user?.role?.toUpperCase()} • {user?.id}</Text>
                </Animated.View>
            </View>

            <View style={styles.sheetContainer}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Quick Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>
                                {Math.floor(totalTimeToday / 3600)}<Text style={styles.statUnit}>h</Text>
                            </Text>
                            <Text style={styles.statLabel}>Today</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>98%</Text>
                            <Text style={styles.statLabel}>Score</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNum}>
                                {isInside ? 'On' : 'Off'}
                            </Text>
                            <Text style={styles.statLabel}>Duty</Text>
                        </View>
                    </View>

                    {/* Menu Section */}
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem icon={User} label="Personal Info" value="Edit" />
                        {user?.role === 'admin' && (
                            <MenuItem icon={Shield} label="Admin Console" onPress={() => router.push('/admin')} />
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem icon={MapPin} label="Geofence Settings" />
                        <MenuItem icon={Clock} label="Timezone" value="IST" />
                    </View>

                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem icon={Mail} label="Help & Support" />
                        <MenuItem icon={LogOut} label="Sign Out" isDanger onPress={handleLogout} />
                    </View>

                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Dark background for top half
    },
    headerBg: {
        height: 300,
        backgroundColor: '#111827',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#111827',
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    },
    role: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        fontWeight: '600',
    },

    // Bottom Sheet
    sheetContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    statNum: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    statUnit: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },

    // Menu
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuGroup: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 8,
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 16,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    menuValue: {
        fontSize: 13,
        color: '#6B7280',
    },
});
