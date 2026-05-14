import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.replace('/(tabs)');
        }
    }, [user]);

    const handleLogin = async () => {
        if (!userId || !password) return;
        setLoading(true);
        const success = await login(userId, password);
        setLoading(false);
        if (success) {
            router.replace('/(tabs)');
        } else {
            alert('Invalid Credentials');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Top Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.headerSection}>
                    {/* Abstract Logo Shape */}
                    <View style={styles.logoShape}>
                        <View style={styles.logoInner} />
                    </View>

                    <Text style={styles.greetingText}>Hey,</Text>
                    <Text style={styles.titleText}>Login Now!</Text>
                </Animated.View>

                {/* Tab / Switcher Text */}
                <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.tabRow}>
                    <Text style={styles.tabTextInactive}>I Am A Old User / </Text>
                    <TouchableOpacity>
                        <Text style={styles.tabTextActive}>Create New</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Form Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>

                    {/* Username Input */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            // placeholderTextColor="#1F2937"
                            value={userId}
                            onChangeText={setUserId}
                            autoCapitalize="none"
                        />
                        {userId.length > 0 && (
                            <View style={styles.checkIcon}>
                                <Check size={14} color="#000" strokeWidth={3} />
                            </View>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    {/* Forgot Password Row */}
                    <View style={styles.forgotRow}>
                        <Text style={styles.forgotText}>Forget Password? / </Text>
                        <TouchableOpacity>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login Now</Text>
                        )}
                    </TouchableOpacity>

                    {/* Skip */}
                    {/* <TouchableOpacity style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip Now</Text>
                    </TouchableOpacity> */}

                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    headerSection: {
        marginBottom: 40,
    },
    logoShape: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        position: 'absolute',
        top: -15,
        left: 5,
    },
    greetingText: {
        fontSize: 32,
        color: '#1F2937',
        fontWeight: '400',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), // Attempting serif look
    },
    titleText: {
        fontSize: 32,
        color: '#000000',
        fontWeight: 'bold',
        marginTop: 5,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    },
    tabRow: {
        flexDirection: 'row',
        marginBottom: 30,
        alignItems: 'center',
    },
    tabTextInactive: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    tabTextActive: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '700',
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        backgroundColor: '#F3F4F6', // Light gray bg
        borderRadius: 16,
        height: 64,
        paddingHorizontal: 20,
        justifyContent: 'center',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        height: '100%',
    },
    checkIcon: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    forgotRow: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 40,
        alignItems: 'center',
    },
    forgotText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    resetText: {
        fontSize: 13,
        color: '#000',
        fontWeight: '700',
    },
    loginButton: {
        backgroundColor: '#FDE047', // Vibrant pastel yellow
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FDE047',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 5,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    skipButton: {
        marginTop: 30,
        alignSelf: 'center',
        padding: 10,
    },
    skipText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    }
});
