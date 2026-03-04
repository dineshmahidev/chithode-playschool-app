import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Switch, Linking } from 'react-native';
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

interface AdminAccountScreenProps {
  navigation: NavigationProps;
}

export default function AdminAccountScreen({ navigation }: AdminAccountScreenProps) {
  const { user, logout, updateAvatar } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Update your profile information',
      icon: 'account-cog',
      color: 'bg-brand-yellow',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification settings',
      icon: 'bell-outline',
      color: 'bg-brand-pink',
    },
    {
      id: 'theme',
      title: 'Theme Settings',
      subtitle: `Current: ${theme === 'light' ? 'Light' : 'Dark'} Mode`,
      icon: theme === 'light' ? 'weather-sunny' : 'weather-night',
      color: theme === 'light' ? 'bg-orange-400' : 'bg-indigo-400',
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Configure app preferences',
      icon: 'cog-outline',
      color: 'bg-gray-600',
    },
    {
      id: 'support',
      title: 'Support & Help',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      color: 'bg-yellow-600',
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-outline',
      color: 'bg-pink-600',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* ── Background Gradient & 3D Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#1e3a8a' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_account.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.3 }, { translateY: -30 }] }}
            resizeMode="cover"
        />
        <View className="absolute -top-20 -left-20 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
        
        <LinearGradient
            colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute bottom-0 left-0 right-0 h-60"
        />
      </View>

      {/* Header */}
      <View className="px-6 pt-12 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.textSecondary} uppercase tracking-[3px]`}>
              Admin Hub 🔐
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                 {user?.name || 'Admin'}
              </Text>
            </View>
            <View className="bg-brand-pink/20 self-start px-4 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm flex-row items-center">
                <MaterialCommunityIcons name="shield-check" size={12} color="#F472B6" />
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px] ml-1.5">System Administrator</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="shield-account-outline" size={48} color="#92400E" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-brand-pink p-2 rounded-xl border-2 border-white">
              <MaterialCommunityIcons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Premium Admin Card Summary */}
      <View className="px-6 py-4">
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('profile')}
            className="rounded-[40px] overflow-hidden shadow-2xl"
            style={{ elevation: 25 }}
        >
            <LinearGradient
                colors={theme === 'dark' ? ['#0f172a', '#1e293b'] : ['#FFFFFF', '#F9FAFB']}
                className={`p-8 border ${theme === 'dark' ? 'border-white/10' : 'border-gray-50'}`}
            >
                <View className="flex-row items-center">
                    <View className="bg-brand-pink/10 p-5 rounded-3xl mr-5">
                        <MaterialCommunityIcons name="security" size={36} color="#F472B6" />
                    </View>
                    <View className="flex-1">
                        <View className="mb-2">
                             <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest leading-3">Security Level: High</Text>
                        </View>
                        <Text className={`text-2xl font-black ${colors.text} tracking-tight`}>{user?.name || 'Administrator'}</Text>
                        <Text className={`text-sm ${colors.textSecondary} font-bold opacity-70`}>{user?.email || 'admin@school.com'}</Text>
                        <View className="bg-brand-yellow/20 px-4 py-1.5 rounded-full self-start mt-3 border border-brand-yellow/10">
                            <Text className="text-amber-900 text-[10px] font-black uppercase tracking-widest">Verified Badge</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#F472B6" />
                </View>
                <View className="absolute -bottom-10 -right-10 opacity-5">
                    <MaterialCommunityIcons name="key-chain-variant" size={120} color={colors.text} />
                </View>
            </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Menu Options Hub */}
      <View className="flex-1 px-6 py-8">
        <View className="flex-row items-center justify-between mb-6 px-1">
            <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Settings & Controls ✨</Text>
            <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Management</Text>
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
                } else {
                  console.log(`Navigate to ${item.id}`);
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
                      trackColor={{ false: '#D1D5DB', true: '#F472B6' }}
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
 
        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          className="mt-8 mb-16 overflow-hidden rounded-[32px] shadow-2xl"
          style={{ elevation: 15 }}
        >
            <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-6 flex-row items-center justify-center border border-red-200/20"
            >
                <MaterialCommunityIcons name="power" size={28} color="white" />
                <Text className="text-white font-black text-xl ml-3 uppercase tracking-tighter">Secure Sign Out</Text>
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
