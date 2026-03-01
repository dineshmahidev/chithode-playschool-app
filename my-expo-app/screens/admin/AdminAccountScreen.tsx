import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      subtitle: `Current: ${theme === 'light' ? 'Light' : 'Dark'} Theme`,
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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  return (
    <View 
        className={`flex-1 ${colors.background}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
            <View className="flex-row items-center justify-between">
            <View className="flex-1">
                <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                My
                </Text>
                <Text className={`text-2xl font-bold text-brand-pink`}>
                Account 👤
                </Text>
                <Text className={`text-[10px] ${colors.textTertiary} font-black mt-1 uppercase tracking-[3px]`}>
                Admin Profile
                </Text>
            </View>
            <TouchableOpacity 
                className={`w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-brand-yellow border-white'} rotate-3 relative overflow-hidden`}
                onPress={updateAvatar}
            >
                {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                <MaterialCommunityIcons name="shield-account" size={42} color={theme === 'dark' ? '#F472B6' : '#92400E'} />
                )}
                <View className="absolute -bottom-1 -right-1 bg-brand-pink p-1.5 rounded-lg border-2 border-white">
                <MaterialCommunityIcons name="camera" size={14} color="white" />
                </View>
            </TouchableOpacity>
            </View>
        </View>
        
        {/* Profile Card Summary */}
        <View className="px-6 py-4">
            <View className={`${colors.surface} rounded-[40px] p-6 shadow-xl border ${colors.border} flex-row items-center`}>
            <View className={`p-4 rounded-2xl mr-4 ${theme === 'dark' ? 'bg-pink-900/20' : 'bg-brand-pink/10'}`}>
                <MaterialCommunityIcons name="security" size={32} color="#F472B6" />
            </View>
            <View className="flex-1">
                <Text className={`text-xl font-black ${colors.text}`}>{user?.name}</Text>
                <Text className={`text-xs ${colors.textSecondary} font-bold`}>{user?.email || 'admin@school.com'}</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full self-start mt-2 border border-brand-pink/20">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">System Admin</Text>
                </View>
            </View>
            </View>
        </View>

        {/* Menu Items */}
        <View className="flex-1 px-6 py-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-6 ml-1`}>Preferences & Settings</Text>
            {menuItems.map((item) => (
            <TouchableOpacity
                key={item.id}
                className={`${colors.surface} p-5 rounded-[32px] shadow-sm mb-4 flex-row items-center border ${colors.border}`}
                onPress={() => {
                if (item.id === 'theme') {
                    toggleTheme();
                } else {
                    console.log(`Navigate to ${item.id}`);
                }
                }}
            >
                <View className={`${item.color} p-3 rounded-xl mr-4 opacity-90 shadow-sm`}>
                    <MaterialCommunityIcons name={item.icon as any} size={22} color="white" />
                </View>
                <View className="flex-1">
                <Text className={`text-base font-black ${colors.text}`}>{item.title}</Text>
                <Text className={`text-xs ${colors.textSecondary} font-bold`}>{item.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme === 'dark' ? '#3e3e34' : '#E5E7EB'} />
            </TouchableOpacity>
            ))}
    
            {/* Logout Button */}
            <TouchableOpacity
                className={`py-5 rounded-[24px] mb-12 mt-6 flex-row items-center justify-center border ${theme === 'dark' ? 'bg-red-900/10 border-red-900/20' : 'bg-red-50 border-red-100'} shadow-sm`}
                onPress={handleLogout}
            >
                <MaterialCommunityIcons name="power" size={24} color="#EF4444" />
                <Text className="text-red-500 font-black text-lg ml-2 uppercase tracking-tighter">Sign Out</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    </View>
  );
}
