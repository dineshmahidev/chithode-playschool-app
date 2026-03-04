import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Linking, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { user, logout, updateAvatar } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View and update your profile',
      icon: 'account-circle',
      color: 'bg-brand-yellow',
    },
    {
      id: 'guardian',
      title: 'Guardian Contacts',
      subtitle: 'Emergency contact information',
      icon: 'account-group',
      color: 'bg-brand-pink',
    },
    {
      id: 'theme',
      title: 'Theme Settings',
      subtitle: `Current: ${theme === 'light' ? 'Light' : 'Dark'} Theme`,
      icon: theme === 'light' ? 'weather-sunny' : 'weather-night',
      color: theme === 'light' ? 'bg-orange-400' : 'bg-indigo-400',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Activity and announcement alerts',
      icon: 'bell-outline',
      color: 'bg-yellow-600',
    },
    {
      id: 'about',
      title: 'About Us',
      subtitle: 'Visit our school website',
      icon: 'information-outline',
      color: 'bg-blue-600',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View className={`flex-1 ${colors.background}`} style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
      <View className="px-6 pt-10 pb-6">
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
          className="rounded-[40px] overflow-hidden shadow-2xl"
          style={{ elevation: 25 }}
        >
          <LinearGradient
            colors={theme === 'dark' ? ['#1e1b4b', '#1e293b'] : ['#FDF2F8', '#FFFFFF']}
            className="p-8 relative"
          >
            <View className="flex-row items-center justify-between z-10">
              <View className="flex-1">
                <View className="mb-3">
                  <View className="flex-row items-center border-b border-gray-100 dark:border-white/5 pb-2 mb-2">
                    <MaterialCommunityIcons name="at" size={14} color="#F472B6" />
                    <Text className="text-brand-pink text-[10px] font-black uppercase tracking-widest ml-1">{user?.username || 'user_id'}</Text>
                  </View>
                  <Text className={`text-[9px] font-black ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest`}>Authorized Member</Text>
                </View>
                <Text className={`text-3xl font-black ${colors.text} tracking-tighter`}>{user?.name || 'Explorer'}</Text>
                <Text className={`text-sm ${colors.textSecondary} font-bold mt-1`}>{user?.email || 'student@school.com'}</Text>
                
                <View className="flex-row items-center mt-6">
                  <View className="bg-brand-yellow/20 px-3 py-1.5 rounded-2xl border border-brand-yellow/30 flex-row items-center">
                    <MaterialCommunityIcons name="card-account-details-star" size={16} color="#B45309" />
                    <Text className="text-amber-900 text-xs font-black ml-2">{user?.studentId || '#S-001'}</Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-brand-pink/10 w-20 h-20 rounded-[30px] items-center justify-center border-2 border-brand-pink/20 shadow-sm relative overflow-hidden">
                <MaterialCommunityIcons name="school" size={40} color="#F472B6" />
                <View className="absolute -bottom-2 -right-2 opacity-10">
                   <MaterialCommunityIcons name="ribbon" size={60} color="#F472B6" />
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
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6'
          }}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              className={`p-5 flex-row items-center justify-between ${index !== menuItems.length - 1 ? 'border-b' : ''}`}
              style={{ borderBottomColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}
              onPress={() => {
                if (item.id === 'theme') {
                  toggleTheme();
                } else if (item.id === 'profile') {
                  navigation.navigate('profile');
                } else if (item.id === 'guardian') {
                  navigation.navigate('emergencyContact');
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
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(244, 114, 182, 0.08)',
                  }}
                >
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={22} 
                    color={theme === 'dark' ? '#F472B6' : '#DB2777'} 
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
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
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
              ) : item.id === 'notifications' ? (
                <View 
                  className="flex-row items-center px-4 py-1.5 rounded-full border"
                  style={{ 
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }}
                >
                    <View className="flex-row items-center mr-3">
                      <MaterialCommunityIcons 
                        name={isNotificationsEnabled ? "bell-ring-outline" : "bell-off-outline"} 
                        size={12} 
                        color={isNotificationsEnabled ? '#10B981' : '#6B7280'} 
                      />
                      <Text 
                        style={{ color: isNotificationsEnabled ? '#10B981' : '#6B7280' }}
                        className="text-[10px] font-black ml-1.5 uppercase tracking-tighter"
                      >
                        {isNotificationsEnabled ? 'On' : 'Off'}
                      </Text>
                    </View>
                    <Switch
                      value={isNotificationsEnabled}
                      onValueChange={setIsNotificationsEnabled}
                      trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                </View>
              ) : (
                <View 
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB' }}
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
