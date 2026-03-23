import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking, Switch, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutModal from '../../components/LogoutModal';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface StudentAccountScreenProps {
  navigation: NavigationProps;
}

export default function StudentAccountScreen({ navigation }: StudentAccountScreenProps) {
  const { user, logout, updateAvatar, fetchData: refreshAuth } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAuth();
    setIsRefreshing(false);
  }, [refreshAuth]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View and update your profile',
      icon: 'account-circle',
      iconColor: '#F59E0B',
      bgColor: theme === 'dark' ? '#2d2110' : 'rgba(245, 158, 11, 0.15)',
    },
    {
      id: 'guardian',
      title: 'Guardian Contacts',
      subtitle: 'Emergency contact information',
      icon: 'account-group',
      iconColor: '#F472B6',
      bgColor: theme === 'dark' ? '#2d1a24' : 'rgba(244, 114, 182, 0.15)',
    },
    {
      id: 'theme',
      title: 'Theme Settings',
      subtitle: `Current: ${theme === 'light' ? 'Light' : 'Dark'} Theme`,
      icon: theme === 'light' ? 'weather-sunny' : 'weather-night',
      iconColor: theme === 'light' ? '#F97316' : '#818CF8', // Orange/Indigo
      bgColor: theme === 'light' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(129, 140, 248, 0.15)',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Activity and announcement alerts',
      icon: 'bell-outline',
      iconColor: '#10B981',
      bgColor: theme === 'dark' ? '#112d23' : 'rgba(16, 185, 129, 0.15)',
    },
    {
      id: 'about',
      title: 'About Us',
      subtitle: 'Visit our school website',
      icon: 'information-outline',
      iconColor: '#3B82F6',
      bgColor: theme === 'dark' ? '#14223d' : 'rgba(59, 130, 246, 0.15)',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={onRefresh}
                colors={['#F472B6']}
                tintColor={theme === 'dark' ? '#FFF' : '#F472B6'}
            />
        }
    >
      {/* ── Background Gradient & 3D Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#3d1d2b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_account.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.1 }, { translateY: -10 }] }}
            resizeMode="cover"
        />
        {/* Soft pink overlap glow */}
        <View className="absolute -top-20 -left-20 w-64 h-64 bg-brand-pink/10 rounded-full blur-3xl" />
        
        {/* Smooth transition gradient to content */}
        <LinearGradient
            colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute bottom-0 left-0 right-0 h-40"
        />
      </View>

      {/* Modern Header */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-widest`}>
              Settings & Hub ⚙️
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                {user?.name || 'My'} Account
              </Text>
            </View>
            <View className="bg-brand-pink/20 self-start px-3 py-1 rounded-full mt-2 border border-brand-pink/10 shadow-sm">
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Logged in as {user?.role || 'Student'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="bg-brand-yellow w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3 relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="face-man-shimmer-outline" size={42} color="#92400E" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-brand-pink p-1.5 rounded-lg border-2 border-white">
              <MaterialCommunityIcons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* ── Premium Identity Card ── */}
      <View className="px-6 py-4">
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => navigation.navigate('profile')}
          className="rounded-[30px] overflow-hidden shadow-2xl"
          style={{ elevation: 25 }}
        >
          <LinearGradient
            colors={theme === 'dark' ? ['#701a75', '#4c1d95'] : ['#F472B6', '#DB2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-8 relative"
          >
            <View className="flex-row items-center justify-between z-10">
              <View className="flex-1">
                <View className="mb-3">
                  <View className="flex-row items-center border-b border-white/20 pb-2 mb-2">
                    <MaterialCommunityIcons name="at" size={14} color="white" />
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-1">{user?.username || 'user_id'}</Text>
                  </View>
                  <Text className="text-[9px] font-black text-white/60 uppercase tracking-widest">Authorized Member</Text>
                </View>
                <Text className="text-3xl font-black text-white tracking-tighter">{user?.name || 'Explorer'}</Text>
                <Text className="text-sm text-white/80 font-bold mt-1">{user?.email || 'Not provided'}</Text>
                
                <View className="flex-row items-center mt-6">
                  <View className="bg-white/20 border-white/30 px-3 py-1.5 rounded-2xl border flex-row items-center">
                    <MaterialCommunityIcons name="card-account-details-star" size={16} color="white" />
                    <Text className="text-white text-xs font-black ml-2">{user?.studentId || '#S-001'}</Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-white/20 w-20 h-20 rounded-[24px] items-center justify-center border-2 border-white/30 shadow-sm relative overflow-hidden">
                <MaterialCommunityIcons name="school" size={40} color="white" />
                <View className="absolute -bottom-2 -right-2 opacity-10">
                   <MaterialCommunityIcons name="ribbon" size={60} color="white" />
                </View>
              </View>
            </View>



            {/* Background Glows */}
            <View className="absolute -top-20 -right-20 w-48 h-48 bg-brand-pink/5 rounded-full blur-3xl" />
            <View className="absolute -bottom-20 -left-20 w-48 h-48 bg-brand-yellow/5 rounded-full blur-3xl" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Modern Menu Hub ── */}
      <View className="px-6 py-6">
        <View className="flex-row items-center justify-between mb-5 px-1">
          <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Settings Hub ✨</Text>
          <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
            <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Configuration</Text>
          </View>
        </View>

        <View 
          className="rounded-[40px] overflow-hidden border shadow-2xl"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#262626' : '#F3F4F6'
          }}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              className={`p-5 flex-row items-center justify-between ${index !== menuItems.length - 1 ? 'border-b' : ''}`}
              style={{ borderBottomColor: theme === 'dark' ? '#262626' : '#F3F4F6' }}
              onPress={() => {
                if (item.id === 'theme') {
                  toggleTheme();
                } else if (item.id === 'profile') {
                  navigation.navigate('profile');
                } else if (item.id === 'guardian') {
                  navigation.navigate('emergencyContact');
                } else if (item.id === 'notifications') {
                  navigation.navigate('notificationSettings');
                } else if (item.id === 'about') {
                  Linking.openURL('https://chithodehappykids.com').catch(err => 
                    Alert.alert('Error', 'Could not open website')
                  );
                } else {
                  console.log(`Navigate to ${item.id}`);
                  Alert.alert('Coming Soon', `${item.title} screen is coming soon! ✨`);
                }
              }}
            >
              <View className="flex-row items-center flex-1">
                <View 
                  className={`p-3.5 rounded-[22px] mr-4 shadow-sm relative overflow-hidden`}
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#262626' : item.bgColor,
                  }}
                >
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={22} 
                    color={item.iconColor} 
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-black ${colors.text} tracking-tight`}>{item.title}</Text>
                  <Text className={`text-[11px] ${colors.textSecondary} font-bold opacity-60 mt-0.5`}>{item.subtitle}</Text>
                </View>
              </View>

              {item.id === 'theme' ? (
                <View 
                  className="flex-row items-center px-4 py-1.5 rounded-full border"
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#262626' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: theme === 'dark' ? '#333333' : 'rgba(0, 0, 0, 0.05)'
                  }}
                >
                    <View className="flex-row items-center mr-3">
                      <MaterialCommunityIcons 
                        name={theme === 'dark' ? "moon-waning-crescent" : "white-balance-sunny"} 
                        size={12} 
                        color={theme === 'dark' ? '#818CF8' : '#F59E0B'} 
                      />
                      <Text 
                        style={{ color: theme === 'dark' ? '#A5B4FC' : '#D97706' }}
                        className="text-[10px] font-black ml-1.5 uppercase tracking-tighter"
                      >
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </Text>
                    </View>
                    <Switch
                        value={theme === 'dark'}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: '#F472B6' }}
                        thumbColor="#FFFFFF"
                        style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                </View>
              ) : (
                <View 
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: theme === 'dark' ? '#262626' : '#F9FAFB' }}
                >
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} opacity={0.5} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign Out Action ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          className="mt-8 mb-12 rounded-[32px] overflow-hidden shadow-lg"
          style={{ elevation: 12 }}
        >
          <LinearGradient
            colors={['#EF4444', '#B91C1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5 flex-row items-center justify-center"
          >
            <MaterialCommunityIcons name="power" size={24} color="white" />
            <Text className="text-white font-black text-lg ml-3">Secure Sign Out</Text>
            
            {/* Soft decorative glow */}
            <View className="absolute inset-0 bg-white/10 opacity-50" />
          </LinearGradient>
        </TouchableOpacity>
        <View className="h-32" />
      </View>
    </ScrollView>
    <LogoutModal 
      visible={showLogoutModal} 
      onConfirm={logout} 
      onCancel={() => setShowLogoutModal(false)} 
    />
    </View>
  );
}
