
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform, StatusBar, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GEOFENCE_CONFIG } from '@/constants/GeofenceConfig';
import { Layers, Navigation, Crosshair, Radio, Menu, ChevronLeft, LocateFixed, Maximize } from 'lucide-react-native';
import Animated, { FadeInRight, FadeInLeft, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Mock data generator
const getMockUserLocation = () => ({
    latitude: GEOFENCE_CONFIG.OFFICE.LATITUDE + (Math.random() * 0.001 - 0.0005),
    longitude: GEOFENCE_CONFIG.OFFICE.LONGITUDE + (Math.random() * 0.001 - 0.0005),
    speed: Math.random() * 5,
    altitude: 10 + Math.random() * 50,
    heading: Math.random() * 360,
});

export default function TacticalTrackingScreen() {
    const { id, name } = useLocalSearchParams();
    const mapRef = useRef<MapView>(null);
    const [heading, setHeading] = useState<number>(0);
    const [activeChannel, setActiveChannel] = useState(2);
    const [targetLocation, setTargetLocation] = useState(getMockUserLocation());
    const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('hybrid');

    useEffect(() => {
        const interval = setInterval(() => {
            setTargetLocation(prev => ({
                ...prev,
                latitude: prev.latitude + (Math.random() * 0.0001 - 0.00005),
                longitude: prev.longitude + (Math.random() * 0.0001 - 0.00005),
                speed: Math.max(0, prev.speed + (Math.random() * 1 - 0.5)),
                altitude: prev.altitude,
                heading: (prev.heading + 5) % 360,
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.animateCamera({
                center: { latitude: targetLocation.latitude, longitude: targetLocation.longitude },
                zoom: 18,
                pitch: 45,
            });
        }
    }, []);

    const centerMap = () => {
        if (mapRef.current) {
            mapRef.current.animateCamera({
                center: {
                    latitude: targetLocation.latitude,
                    longitude: targetLocation.longitude,
                },
                heading: targetLocation.heading,
                pitch: 45,
                zoom: 19,
            });
        }
    };

    const toggleMapType = () => {
        setMapType(prev => prev === 'hybrid' ? 'standard' : 'hybrid');
    }

    const speedMph = (targetLocation.speed * 2.23694).toFixed(1);
    const altitude = Math.round(targetLocation.altitude);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" hidden />

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                mapType={mapType}
                showsCompass={false}
                initialRegion={{
                    latitude: GEOFENCE_CONFIG.OFFICE.LATITUDE,
                    longitude: GEOFENCE_CONFIG.OFFICE.LONGITUDE,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                }}
            >
                <Marker
                    coordinate={{
                        latitude: targetLocation.latitude,
                        longitude: targetLocation.longitude
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    rotation={targetLocation.heading}
                    flat
                >
                    <View style={styles.mapMarkerTarget}>
                        {/* Drone Icon Representation */}
                        <View style={[styles.droneBody, { transform: [{ rotate: '45deg' }] }]}>
                            <View style={[styles.rotor, styles.rotorTL]} />
                            <View style={[styles.rotor, styles.rotorTR]} />
                            <View style={[styles.rotor, styles.rotorBL]} />
                            <View style={[styles.rotor, styles.rotorBR]} />
                            <View style={styles.droneCenter} />
                        </View>
                    </View>
                </Marker>
            </MapView>

            {/* VIGNETTE OVERLAY for cinematic look */}
            <View style={styles.vignetteContainer} pointerEvents="none">
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.vignette}
                />
            </View>

            {/* TOP HUD */}
            <View style={styles.topHud}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
                        <ChevronLeft size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.statusPill}>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                        </View>
                        <Text style={styles.targetName}>{name?.toString().toUpperCase() || 'UNKNOWN'}</Text>
                        <View style={styles.divider} />
                        <Text style={styles.idText}>ID: {id?.toString() || '---'}</Text>
                    </View>

                    <TouchableOpacity style={styles.glassBtn} onPress={toggleMapType}>
                        <Layers size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* CENTER CROSSHAIR (Decorational) */}
            <View style={styles.centerCrosshair} pointerEvents="none">
                <View style={styles.crosshairLineV} />
                <View style={styles.crosshairLineH} />
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
            </View>

            {/* LEFT DATA COLUMN */}
            <Animated.View entering={FadeInLeft.delay(300)} style={styles.leftColumn}>
                <View style={styles.compasContainer}>
                    <View style={[styles.compassRing, { transform: [{ rotate: `-${heading}deg` }] }]}>
                        <Text style={[styles.compassText, { top: 5 }]}>N</Text>
                        <Text style={[styles.compassText, { bottom: 5 }]}>S</Text>
                        <Text style={[styles.compassText, { left: 5 }]}>W</Text>
                        <Text style={[styles.compassText, { right: 5 }]}>E</Text>
                    </View>
                    <Navigation size={20} color="#FDE047" fill="#FDE047" />
                </View>

                <View style={styles.dataBlock}>
                    <Text style={styles.dataLabel}>ALTITUDE</Text>
                    <Text style={styles.dataValue}>{altitude} <Text style={styles.dataUnit}>FT</Text></Text>
                </View>

                <View style={styles.dataBlock}>
                    <Text style={styles.dataLabel}>SPEED</Text>
                    <Text style={styles.dataValue}>{speedMph} <Text style={styles.dataUnit}>MPH</Text></Text>
                </View>
            </Animated.View>

            {/* RIGHT ACTIONS COLUMN */}
            <Animated.View entering={FadeInRight.delay(300)} style={styles.rightColumn}>
                <TouchableOpacity style={styles.actionBtn} onPress={centerMap}>
                    <LocateFixed size={20} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Maximize size={20} color="#000" />
                </TouchableOpacity>

                <View style={styles.batteryContainer}>
                    <View style={styles.batteryIcon}>
                        <View style={styles.batteryLevel} />
                    </View>
                    <Text style={styles.batteryText}>74%</Text>
                </View>
            </Animated.View>

            {/* BOTTOM CONTROLS */}
            <Animated.View entering={SlideInDown.delay(400)} style={styles.bottomBar}>
                <View style={styles.cameraControls}>
                    <TouchableOpacity style={[styles.camBtn, activeChannel === 1 && styles.camBtnActive]} onPress={() => setActiveChannel(1)}>
                        <Text style={[styles.camText, activeChannel === 1 && styles.camTextActive]}>CAM 1</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shutterOuter}>
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.camBtn, activeChannel === 2 && styles.camBtnActive]} onPress={() => setActiveChannel(2)}>
                        <Text style={[styles.camText, activeChannel === 2 && styles.camTextActive]}>CAM 2</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    vignetteContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
    },
    vignette: {
        flex: 1,
    },

    // TOP HUD
    topHud: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    glassBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)', // web support, native ignores
    },
    statusPill: {
        height: 44,
        paddingHorizontal: 20,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    liveIndicator: {
        marginRight: 10,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FDE047',
        shadowColor: '#FDE047',
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    targetName: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    divider: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 12,
    },
    idText: {
        color: '#CCC',
        fontSize: 12,
        fontWeight: '600',
    },

    // CROSSHAIR
    centerCrosshair: {
        position: 'absolute',
        top: height / 2 - 40,
        left: width / 2 - 40,
        width: 80,
        height: 80,
        zIndex: 4,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.4,
    },
    crosshairLineV: {
        position: 'absolute',
        width: 1,
        height: 20,
        backgroundColor: '#FFF',
    },
    crosshairLineH: {
        position: 'absolute',
        width: 20,
        height: 1,
        backgroundColor: '#FFF',
    },
    cornerTL: { position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#FFF' },
    cornerTR: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderTopWidth: 1, borderRightWidth: 1, borderColor: '#FFF' },
    cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: '#FFF' },
    cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#FFF' },

    // LEFT COLUMN
    leftColumn: {
        position: 'absolute',
        left: 20,
        top: 150,
        zIndex: 10,
    },
    compasContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    compassRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compassText: {
        position: 'absolute',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 8,
        fontWeight: 'bold',
    },
    dataBlock: {
        marginBottom: 20,
    },
    dataLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 2,
    },
    dataValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    dataUnit: {
        fontSize: 10,
        color: '#FDE047',
    },

    // RIGHT COLUMN
    rightColumn: {
        position: 'absolute',
        right: 20,
        top: 150,
        zIndex: 10,
        alignItems: 'flex-end',
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FDE047', // Yellow Accent
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    batteryContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    batteryIcon: {
        width: 24,
        height: 12,
        borderWidth: 1,
        borderColor: '#FFF',
        borderRadius: 2,
        padding: 1,
        marginBottom: 4,
    },
    batteryLevel: {
        width: '74%',
        height: '100%',
        backgroundColor: '#10B981',
    },
    batteryText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },

    // BOTTOM BAR
    bottomBar: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    cameraControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 24,
    },
    camBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    camBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: '#FDE047',
    },
    camText: {
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        fontSize: 12,
    },
    camTextActive: {
        color: '#FDE047',
    },
    shutterOuter: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#FDE047',
    },

    // DRONE MARKER
    mapMarkerTarget: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    droneBody: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    droneCenter: {
        width: 14,
        height: 14,
        backgroundColor: '#FDE047',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#000',
        zIndex: 2,
    },
    rotor: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    rotorTL: { top: 0, left: 0 },
    rotorTR: { top: 0, right: 0 },
    rotorBL: { bottom: 0, left: 0 },
    rotorBR: { bottom: 0, right: 0 },

});
