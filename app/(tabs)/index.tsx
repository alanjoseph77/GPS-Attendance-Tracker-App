
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Image, Platform } from 'react-native';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowUpRight, Bell, Calendar, MapPin, Clock, Users } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { GEOFENCE_CONFIG } from '@/constants/GeofenceConfig';

const { width } = Dimensions.get('window');

// Reusing the Gauge Logic but styling it to match Login
const SegmentedGauge = ({ totalSeconds }: { totalSeconds: number }) => {
  const progress = Math.min(totalSeconds / 28800, 1);

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeWrapper}>
        <View style={styles.gaugeBackground} />
        <View style={[styles.gaugeActive, { transform: [{ rotate: `${-135 + (progress * 90)}deg` }] }]} />
        <View style={styles.gaugeCenter}>
          <Text style={styles.gaugeMainText}>
            {Math.floor(totalSeconds / 3600)}<Text style={{ fontSize: 20, fontWeight: '400' }}>h</Text> {Math.floor((totalSeconds % 3600) / 60)}<Text style={{ fontSize: 20, fontWeight: '400' }}>m</Text>
          </Text>
          <Text style={styles.gaugeSubText}>Today's Focus</Text>
        </View>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { currentSession, totalTimeToday, isInside, refreshData } = useAttendance();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.logoShape}>
            <View style={styles.logoInner} />
          </View>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Bell size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Big Typography Title (Match Login Serif) */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.titleSection}>
          <Text style={styles.greetingSub}>Hello, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.greetingMain}>Your Stats</Text>
          <Text style={styles.greetingFocus}>Overview</Text>
        </Animated.View>

        {/* Status Pill (Chunky Gray Style) */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <TouchableOpacity style={styles.statusPill} onPress={() => router.push('/tracking')}>
            <View style={styles.statusIcon}>
              <View style={[styles.dot, { backgroundColor: isInside ? '#FDE047' : '#9CA3AF' }]} />
              <Text style={styles.pillText}>
                {isInside ? 'Currently Clocked In' : 'Currently Offline'}
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <ArrowUpRight size={16} color="#000" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Central Gauge Section */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <SegmentedGauge totalSeconds={totalTimeToday} />
        </Animated.View>

        {/* Live Mini Map Card */}
        {/* Live Mini Map Card - Premium Dark Style */}
        {/* Live Mini Map Card (Hidden for Admins) */}
        {user?.role !== 'admin' && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.mapCard}>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.mapView}
                provider={PROVIDER_GOOGLE}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                customMapStyle={[
                  {
                    "elementType": "geometry",
                    "stylers": [{ "color": "#f5f5f5" }]
                  },
                  {
                    "elementType": "labels.icon",
                    "stylers": [{ "visibility": "off" }]
                  },
                  {
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#616161" }]
                  },
                  {
                    "elementType": "labels.text.stroke",
                    "stylers": [{ "color": "#f5f5f5" }]
                  },
                  {
                    "featureType": "poi",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#eeeeee" }]
                  },
                  {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#ffffff" }]
                  },
                  {
                    "featureType": "water",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#c9c9c9" }]
                  }
                ]}
                initialRegion={{
                  latitude: GEOFENCE_CONFIG.OFFICE.LATITUDE,
                  longitude: GEOFENCE_CONFIG.OFFICE.LONGITUDE,
                  latitudeDelta: 0.004, // Slightly wider to ensure radius isn't clipped
                  longitudeDelta: 0.004,
                }}
              >
                <Circle
                  center={{ latitude: GEOFENCE_CONFIG.OFFICE.LATITUDE, longitude: GEOFENCE_CONFIG.OFFICE.LONGITUDE }}
                  radius={GEOFENCE_CONFIG.OFFICE.RADIUS}
                  strokeColor="rgba(250, 204, 21, 0.8)" // Stronger Yellow stroke
                  strokeWidth={2}
                  fillColor="rgba(253, 224, 71, 0.3)" // Light Yellow Fill
                  zIndex={1}
                />
                <Marker
                  coordinate={{ latitude: GEOFENCE_CONFIG.OFFICE.LATITUDE, longitude: GEOFENCE_CONFIG.OFFICE.LONGITUDE }}
                  zIndex={2}
                >
                  <View style={styles.officeMarker}>
                    <View style={styles.officeRing} />
                    <View style={styles.officeDot} />
                  </View>
                </Marker>
              </MapView>

              <View style={styles.mapOverlayTop}>
                <View style={styles.liveBadge}>
                  <View style={[styles.liveDot, { backgroundColor: isInside ? '#4ADE80' : '#EF4444' }]} />
                  <Text style={styles.liveText}>LIVE ZONE</Text>
                </View>
              </View>

            </View>
          </Animated.View>
        )}

        {/* Bottom Cards (Match Login Inputs Style: Gray Backgrounds) */}
        <View style={styles.cardsRow}>
          {/* Admin Card - Only Visible to Admin Users */}
          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.bottomCard} onPress={() => router.push('/admin')}>
              <View style={[styles.cardIconBg, { backgroundColor: '#FDE047' }]}>
                <Users size={24} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Team Admin</Text>
                <Text style={styles.cardDesc}>Manage staff & overview</Text>
              </View>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>Open</Text>
              </View>
            </TouchableOpacity>
          )}

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White
  },
  content: {
    flex: 1,
    paddingHorizontal: 30, // Match Login Padding
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoShape: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
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
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Typography (Serif Match)
  titleSection: {
    marginBottom: 40,
  },
  greetingSub: {
    fontSize: 16,
    color: '#9CA3AF', // Gray
    fontWeight: '500',
    marginBottom: 8,
  },
  greetingMain: {
    fontSize: 36,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 42,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  greetingFocus: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 42,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },

  // Status Pill
  statusPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Match Input BG
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  statusIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE047',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gauge
  gaugeContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gaugeWrapper: {
    width: 260,
    height: 130, // Half circle
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeBackground: {
    position: 'absolute',
    top: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 25,
    borderColor: '#F3F4F6',
  },
  gaugeActive: {
    position: 'absolute',
    top: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 25,
    borderColor: 'transparent',
    borderLeftColor: '#FDE047',
    borderTopColor: '#FDE047',
    transform: [{ rotate: '-45deg' }]
  },
  gaugeCenter: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  gaugeMainText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlign: 'center',
  },
  gaugeSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '500',
  },

  // Map Card
  mapCard: {
    marginBottom: 30,
  },
  mapContainer: {
    height: 240, // Taller
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6', // Light BG
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapView: {
    flex: 1,
  },

  // Custom Marker
  officeMarker: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  officeRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.6)',
  },
  officeDot: {
    width: 14, // Slightly larger
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000', // PURE BLACK
    borderWidth: 2,
    borderColor: '#FFF', // White border for freshness
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, // Stronger shadow
    shadowRadius: 4,
  },

  // Overlays
  mapOverlayTop: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  mapOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // White Glass
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  overlayIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  overlaySub: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Bottom Cards
  cardsRow: {
    gap: 16,
    marginBottom: 40,
  },
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Match Input BG
    borderRadius: 24,
    padding: 20,
    height: 88,
    gap: 16,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionBadge: {
    marginLeft: 'auto',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
});
