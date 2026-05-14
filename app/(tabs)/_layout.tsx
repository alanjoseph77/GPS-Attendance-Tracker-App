
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  return (
    <Tabs
      key={user?.role} // Force re-render when role changes
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Staff',
          href: isAdmin ? '/admin' : null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Logs',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Menu',
        }}
      />
    </Tabs>
  );
}
