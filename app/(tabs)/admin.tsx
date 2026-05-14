
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, RefreshControl, Image, Dimensions, Platform } from 'react-native';
import { StorageService, User, subscribeToStaffLocation } from '@/services/storageService';
import { UserPlus, MapPin, X, Check, Activity, Search, Trash2 } from 'lucide-react-native';
import { GEOFENCE_CONFIG } from '@/constants/GeofenceConfig';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');
    const [newPass, setNewPass] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        const allUsers = await StorageService.getUsers();
        setUsers(allUsers.filter(u => u.role !== 'admin'));
    };

    useEffect(() => {
        const unsubscribe = subscribeToStaffLocation((updatedUsers) => {
            setUsers(updatedUsers);
        });
        loadData();
        return () => unsubscribe();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAddStaff = async () => {
        if (!newName || !newId || !newPass) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        const newUser: User = { id: newId, name: newName, password: newPass, role: 'staff' };
        await StorageService.addUser(newUser);
        setModalVisible(false);
        setNewName(''); setNewId(''); setNewPass('');
        loadData();
    };

    const handleOpenMap = (user?: User) => {
        // Navigate to the dedicated Tracking Screen
        const target = user || users[0];
        if (target) {
            router.push(`/tracking?id=${target.id}&name=${target.name}`);
        } else {
            Alert.alert("No active staff to track");
        }
    };

    const renderStaffCard = ({ item, index }: { item: User, index: number }) => {
        const lastLoc = item.lastLocation;
        const isLive = lastLoc && (new Date().getTime() - new Date(lastLoc.timestamp).getTime() < 10 * 60 * 1000);

        return (
            <Animated.View entering={FadeInDown.delay(index * 100)}>
                <TouchableOpacity style={styles.card} onPress={() => handleOpenMap(item)}>
                    {/* Left: Avatar */}
                    <View style={styles.cardLeft}>
                        <Image
                            source={{ uri: `https://ui-avatars.com/api/?name=${item.name}&background=FFFFFF&color=000` }}
                            style={styles.avatar}
                        />
                        {isLive && <View style={styles.statusDot} />}
                    </View>

                    {/* Middle: Info */}
                    <View style={styles.cardCenter}>
                        <Text style={styles.cardName}>{item.name}</Text>
                        <Text style={styles.cardId}>ID: {item.id}</Text>

                        {isLive ? (
                            <View style={styles.liveTag}>
                                <Activity size={10} color="#166534" />
                                <Text style={styles.liveText}>Active Now</Text>
                            </View>
                        ) : (
                            <Text style={styles.offlineText}>Offline</Text>
                        )}
                    </View>

                    {/* Right: Actions */}
                    <View style={styles.cardRight}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenMap(item)}>
                            <MapPin size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header (Matching Login/Dashboard) */}
            <View style={styles.header}>
                <View style={styles.headerTitles}>
                    <Text style={styles.pageTitle}>Staff</Text>
                    <Text style={styles.pageSub}>Direcotry</Text>
                </View>
                {/* Floating style Add Button in Header */}
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <UserPlus size={22} color="#000000" />
                </TouchableOpacity>
            </View>

            {/* Stats / Info Banner (Yellow Brand) */}
            <TouchableOpacity style={styles.summaryCard} onPress={() => handleOpenMap()}>
                <View style={styles.summaryContent}>
                    <View>
                        <Text style={styles.summaryTitle}>{users.length} Active Members</Text>
                        <Text style={styles.summarySub}>Tap to view live team map</Text>
                    </View>
                    <View style={styles.summaryIcon}>
                        <MapPin size={24} color="#000" />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Search Bar (Gray Pill) */}
            <View style={styles.searchContainer}>
                <Search size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or ID..."
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <FlatList
                data={users}
                keyExtractor={item => item.id}
                renderItem={renderStaffCard}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            />

            {/* Modal for Add User */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Member</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <X color="#000" size={24} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <View style={styles.inputWrapper}>
                                <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Full Name" placeholderTextColor="#9CA3AF" />
                            </View>
                            <View style={styles.inputWrapper}>
                                <TextInput style={styles.input} value={newId} onChangeText={setNewId} placeholder="Staff ID" placeholderTextColor="#9CA3AF" />
                            </View>
                            <View style={styles.inputWrapper}>
                                <TextInput style={styles.input} value={newPass} onChangeText={setNewPass} placeholder="Password" secureTextEntry placeholderTextColor="#9CA3AF" />
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddStaff}>
                                <Text style={styles.submitText}>Add to Team</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 30, // Match Login/Dashboard padding
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitles: {
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    },
    pageSub: {
        fontSize: 34,
        fontWeight: '400',
        color: '#000',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        marginTop: 0,
        opacity: 0.5,
    },
    addBtn: {
        width: 52,
        height: 52,
        borderRadius: 20, // Match Card Radius style
        backgroundColor: '#FDE047',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Summary Card
    summaryCard: {
        backgroundColor: '#111827', // Dark Contrast
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    summarySub: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        height: '100%',
    },

    // List
    listContent: {
        paddingBottom: 100,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Match Theme Gray
        borderRadius: 24, // Chunky Radius
        padding: 16,
    },
    cardLeft: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 20, // Squircle Avatar
        backgroundColor: '#FFF',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#F3F4F6',
    },
    cardCenter: {
        flex: 1,
    },
    cardName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    },
    cardId: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 6,
        fontWeight: '500',
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#166534',
    },
    offlineText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    cardRight: {
        marginLeft: 8,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Add Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 32,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    inputWrapper: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        marginBottom: 16,
        height: 64,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    input: {
        fontSize: 16,
        color: '#000',
    },
    submitBtn: {
        backgroundColor: '#FDE047',
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#FDE047',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    submitText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
