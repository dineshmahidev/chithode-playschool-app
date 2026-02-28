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

interface StudentAccountScreenProps {
  navigation: NavigationProps;
}

export default function StudentAccountScreen({ navigation }: StudentAccountScreenProps) {
  const { user, logout, updateAvatar } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();

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
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      icon: 'cog-outline',
      color: 'bg-gray-600',
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact school',
      icon: 'help-circle-outline',
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
    <ScrollView className={`flex-1 ${colors.background}`} showsVerticalScrollIndicator={false}>
      {/* Attractive Header - Blends with status bar */}
      <View className="px-6 pt-8 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
              My
            </Text>
            <Text className={`text-2xl font-bold text-brand-pink`}>
              Account 👤
            </Text>
            <Text className={`text-sm ${colors.textTertiary} font-bold mt-1 uppercase tracking-widest`}>
              Student Profile
            </Text>
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
              <MaterialCommunityIcons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Profile Card Summary */}
      <View className="px-6 py-4">
        <View className={`${colors.surface} rounded-[32px] p-6 shadow-xl border border-yellow-50 flex-row items-center`}>
          <View className="bg-brand-pink/10 p-4 rounded-2xl mr-4">
            <MaterialCommunityIcons name="school-outline" size={32} color="#F472B6" />
          </View>
          <View className="flex-1">
            <Text className={`text-xl font-black ${colors.text}`}>{user?.name}</Text>
            <Text className={`text-sm ${colors.textSecondary} font-bold`}>{user?.email || 'student@school.com'}</Text>
            <View className="flex-row items-center mt-2 flex-wrap">
              <View className="bg-brand-yellow/20 px-3 py-1 rounded-full mr-2 mb-1">
                <Text className="text-amber-900 text-[10px] font-black uppercase">ID: {user?.studentId || '#S-001'}</Text>
              </View>
              {user?.parentName && (
                <View className="bg-blue-50 px-2 py-1 rounded-lg mr-2 mb-1">
                  <Text className="text-blue-700 text-[9px] font-black uppercase">Guardian: {user.parentName}</Text>
                </View>
              )}
              {user?.category && (
                <View className="bg-pink-50 px-2 py-1 rounded-lg mb-1">
                  <Text className="text-brand-pink text-[9px] font-black uppercase">{user.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View className="flex-1 px-6 py-4">
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1`}>Settings ✨</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            className={`${colors.menuItemBackground} p-5 rounded-3xl shadow-sm mb-4 flex-row items-center border border-yellow-50`}
            onPress={() => {
              if (item.id === 'theme') {
                toggleTheme();
              } else if (item.id === 'profile') {
                navigation.navigate('profile');
              } else if (item.id === 'guardian') {
                navigation.navigate('emergencyContact');
              } else {
                console.log(`Navigate to ${item.id}`);
                Alert.alert('Info', `${item.title} screen is coming soon! ✨`);
              }
            }}
          >
            <View className={`${item.color} p-3 rounded-2xl mr-4 bg-opacity-20`}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={theme === 'dark' ? 'white' : 'rgba(0,0,0,0.6)'} />
            </View>
            <View className="flex-1">
              <Text className={`text-base font-black ${colors.menuItemText}`}>{item.title}</Text>
              <Text className={`text-xs ${colors.menuItemTextSecondary} font-bold`}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
 
        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-50 py-5 rounded-3xl mb-12 mt-6 flex-row items-center justify-center border border-red-100 shadow-sm"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="power" size={24} color="#EF4444" />
          <Text className="text-red-500 font-black text-lg ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
