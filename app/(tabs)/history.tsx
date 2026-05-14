import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useAttendance } from '@/hooks/useAttendance';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Clock, MapPin, TrendingUp, Calendar, Info, Play, CheckCircle } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
// ... (imports)

// Helper to get days
const getWeekDays = () => {
    const days = [];
    const today = new Date();
    // Start from 3 days ago
    for (let i = -3; i <= 3; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
};

import { useAuth } from '@/context/AuthContext';
import { StorageService, AttendanceSession } from '@/services/storageService';

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth(); // Get user directly
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());

    const days = getWeekDays();

    // Explicit, independent data fetching
    const loadData = async () => {
        if (!user) return;
        try {
            // Fetch everything fresh from storage
            const data = await StorageService.getSessionsByUser(user.id);
            // Also check for any active session that might not be in the main list yet if handled separately
            const current = await StorageService.getCurrentSession();

            // Merge if necessary, or rely on getSessionsByUser if it includes everything
            // Note: StorageService.getSessionsByUser usually returns history. 
            // If the ACTIVE session is stored separately in '@current_session', we might need to append it.
            // Let's check Storage Service implementation: getSessionsByUser queries 'sessions' collection/key.
            // saveCurrentSession saves to 'current_session'. 
            // SO: We MUST append the current session if it exists and isn't in history yet.

            let allSessions = [...data];
            if (current && !allSessions.find(s => s.id === current.id)) {
                allSessions.push(current);
            }
            // Sort by time desc
            allSessions.sort((a, b) => new Date(b.enter_time).getTime() - new Date(a.enter_time).getTime());

            setSessions(allSessions);
        } catch (e) {
            console.error("Failed to load history:", e);
        }
    };

    // Refresh data whenever screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [user])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const renderSessionItem = ({ item, index }: { item: any; index: number }) => {
        const date = new Date(item.enter_time);
        const exitTime = item.exit_time ? new Date(item.exit_time) : null;

        let durationMins = 0;
        let hours = 0;
        let mins = 0;

        if (exitTime) {
            durationMins = Math.round((exitTime.getTime() - date.getTime()) / 60000);
            hours = Math.floor(durationMins / 60);
            mins = durationMins % 60;
        }

        const isOvertime = durationMins > 540; // > 9 hours

        return (
            <Animated.View
                layout={Layout.springify()}
                entering={FadeInDown.delay(index * 100).springify()}
            >
                <View style={[styles.logCard, !item.exit_time && styles.activeLogCard]}>
                    <View style={styles.logHeader}>
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateBadgeText}>{date.getDate()}</Text>
                            <Text style={styles.dateBadgeMonth}>{date.toLocaleDateString([], { month: 'short' })}</Text>
                        </View>
                        <View style={styles.timeInfo}>
                            <Text style={styles.logTitle}>{item.exit_time ? 'Shift Complete' : 'Currently Active'}</Text>
                            <Text style={styles.logTimeRange}>
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {exitTime ? exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </Text>
                        </View>
                        <View style={[styles.durationPill, !item.exit_time && { backgroundColor: '#FDE047' }]}>
                            {item.exit_time ? (
                                <Text style={styles.durationText}>{hours}h {mins}m</Text>
                            ) : (
                                <Play size={10} color="#000" fill="#000" />
                            )}
                        </View>
                    </View>
                    <View style={styles.logFooter}>
                        <View style={styles.footerTag}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.footerText}>Main HQ</Text>
                        </View>
                        {isOvertime && (
                            <View style={[styles.footerTag, { backgroundColor: '#FEF3C7' }]}>
                                <TrendingUp size={12} color="#D97706" />
                                <Text style={[styles.footerText, { color: '#D97706' }]}>High Performance</Text>
                            </View>
                        )}
                        {item.exit_time && (
                            <View style={[styles.footerTag, { marginLeft: 'auto', backgroundColor: '#ECFCCB' }]}>
                                <CheckCircle size={12} color="#4D7C0F" />
                                <Text style={[styles.footerText, { color: '#4D7C0F' }]}>Logged</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    };

    // Calculate Grand Total Stats (All Time) including Active Session
    const grandTotalMins = sessions.reduce((acc, curr) => {
        let duration = 0;
        if (curr.duration_seconds) {
            duration = curr.duration_seconds / 60;
        } else if (curr.exit_time) {
            duration = (new Date(curr.exit_time).getTime() - new Date(curr.enter_time).getTime()) / 60000;
        } else {
            // Active Session: Calculate time from enter_time to NOW
            duration = (new Date().getTime() - new Date(curr.enter_time).getTime()) / 60000;
        }
        return acc + duration;
    }, 0);
    const grandTotalHrs = Math.floor(grandTotalMins / 60);

    // Filter sessions for the selected date
    const selectedDateSessions = sessions.filter(s => {
        const d = new Date(s.enter_time);
        return d.getDate() === selectedDate;
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.screenTitle}>Work Logs</Text>
                    <Text style={styles.screenSub}>Review your activity</Text>
                </View>
            </View>

            {/* Horizontal Date Picker (Styled like chips) */}
            <View style={{ height: 100 }}>
                <FlatList
                    horizontal
                    data={days}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 30, gap: 12 }}
                    renderItem={({ item }) => {
                        const isSelected = item.getDate() === selectedDate;
                        return (
                            <TouchableOpacity
                                style={[styles.dateChip, isSelected && styles.dateChipActive]}
                                onPress={() => setSelectedDate(item.getDate())}
                            >
                                <Text style={[styles.chipDay, isSelected && { color: '#FFF' }]}>
                                    {item.toLocaleDateString([], { weekday: 'short' })}
                                </Text>
                                <Text style={[styles.chipNum, isSelected && { color: '#FFF' }]}>
                                    {item.getDate()}
                                </Text>
                                {isSelected && <View style={styles.activeDot} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Main Stats Card (Grand Total) */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={styles.statIcon}>
                            <Clock size={20} color="#000" />
                        </View>
                        <Text style={styles.statLabel}>Total Hours</Text>
                    </View>
                    <Text style={styles.statValue}>
                        {grandTotalHrs}<Text style={styles.statUnit}>h</Text> {Math.floor(grandTotalMins % 60)}<Text style={styles.statUnit}>m</Text>
                    </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#F3F4F6', flex: 0.8 }]}>
                    <View style={[styles.statHeader, { marginBottom: 12 }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF' }]}>
                            <TrendingUp size={20} color="#000" />
                        </View>
                    </View>
                    <Text style={styles.statValueSmall}>{sessions.length}</Text>
                    <Text style={styles.statSub}>Total Shifts</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Entries</Text>
                <Info size={16} color="#9CA3AF" />
            </View>

            {/* Logs List (Filtered by Day) */}
            <FlatList
                data={selectedDateSessions}
                renderItem={renderSessionItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Calendar size={32} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyText}>No logs for this date.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
    },
    header: {
        paddingHorizontal: 30,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        color: '#000',
    },
    screenSub: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 2,
    },

    // Date Chips
    dateChip: {
        width: 60,
        height: 80,
        borderRadius: 30, // Tall Pill
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dateChipActive: {
        backgroundColor: '#1F2937', // Dark Active
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    chipDay: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    chipNum: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FDE047', // Yellow Dot
        position: 'absolute',
        bottom: 12,
    },

    // Stats Grid
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 30,
        gap: 16,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FDE047', // Brand Yellow
        borderRadius: 24,
        padding: 20,
        justifyContent: 'space-between',
        height: 140,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
        marginTop: 4,
        opacity: 0.6,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        color: '#000',
    },
    statValueSmall: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        color: '#000',
    },
    statUnit: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
    },
    statSub: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },

    // List
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    },
    listContent: {
        paddingHorizontal: 30,
        paddingBottom: 50,
        gap: 16,
    },
    logCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
    },
    activeLogCard: {
        borderColor: '#FDE047',
        borderWidth: 2,
    },
    logHeader: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    dateBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        width: 50,
        height: 50,
    },
    dateBadgeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    dateBadgeMonth: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    timeInfo: {
        flex: 1,
    },
    logTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        marginBottom: 4,
    },
    logTimeRange: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    durationPill: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
    },

    logFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 0,
        paddingTop: 0,
    },
    footerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4B5563',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
});
