import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';


interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface TeacherAccountScreenProps {
  navigation: NavigationProps;
}

export default function TeacherAccountScreen({ navigation }: TeacherAccountScreenProps) {
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
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.15 : 0.25, transform: [{ scale: 1.2 }, { translateY: -20 }] }}
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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
              My
            </Text>
            <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
              Profile 🍎
            </Text>
            <View className="bg-brand-pink/20 self-start px-3 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm flex-row items-center">
                <MaterialCommunityIcons name="star-circle" size={12} color="#F472B6" />
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px] ml-1.5">Senior Faculty</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden"
            onPress={updateAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <MaterialCommunityIcons name="face-woman-outline" size={48} color="#92400E" />
            )}
            <View className="absolute -bottom-1 -right-1 bg-brand-pink p-2 rounded-xl border-2 border-white">
              <MaterialCommunityIcons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Profile Card Summary */}
      <View className="px-6 py-4">
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('profile')}
            className="rounded-[40px] overflow-hidden shadow-2xl"
            style={{ elevation: 20 }}
        >
            <LinearGradient
                colors={theme === 'dark' ? ['#1e1b4b', '#312e81'] : ['#FFFFFF', '#F9FAFB']}
                className={`p-8 border ${theme === 'dark' ? 'border-white/10' : 'border-gray-50'}`}
            >
                <View className="flex-row items-center">
                    <View className="bg-brand-pink/10 p-5 rounded-3xl mr-5">
                        <MaterialCommunityIcons name="card-account-details-outline" size={36} color="#F472B6" />
                    </View>
                    <View className="flex-1">
                        <Text className={`text-2xl font-black ${colors.text} tracking-tight`}>{user?.name}</Text>
                        <Text className={`text-sm ${colors.textSecondary} font-bold opacity-70`}>{user?.email || 'teacher@school.com'}</Text>
                        <View className="bg-brand-yellow/20 px-4 py-1.5 rounded-full self-start mt-3 border border-brand-yellow/10">
                            <Text className="text-amber-900 text-[10px] font-black uppercase tracking-widest">Employee ID: {user?.teacherId || '#T-001'}</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#F472B6" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View className="flex-1 px-6 py-8">
        <View className="flex-row items-center justify-between mb-6 px-1">
            <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Settings & Tools ⚙️</Text>
            <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Preferences</Text>
            </View>
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} p-6 rounded-[32px] shadow-xl mb-4 flex-row items-center border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'}`}
            onPress={() => {
              if (item.id === 'theme') {
                toggleTheme();
              } else {
                console.log(`Navigate to ${item.id}`);
              }
            }}
          >
            <View className={`${item.color} p-4 rounded-2xl mr-5 bg-opacity-20`}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={theme === 'dark' ? 'white' : 'rgba(0,0,0,0.6)'} />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-black ${colors.text}`}>{item.title}</Text>
              <Text className={`text-xs ${colors.textSecondary} font-bold opacity-60`}>{item.subtitle}</Text>
            </View>
            {item.id === 'theme' ? (
                <View className="flex-row items-center bg-gray-100/50 dark:bg-white/5 px-2 py-1 rounded-2xl">
                    <Text className={`text-[10px] font-black mr-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-orange-500'} uppercase tracking-tighter`}>{theme === 'dark' ? 'Dark' : 'Light'}</Text>
                    <Switch
                        value={theme === 'dark'}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#D1D5DB', true: '#F472B6' }}
                        thumbColor={theme === 'dark' ? '#FFFFFF' : '#FFFFFF'}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                </View>
            ) : (
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} opacity={0.3} />
            )}
          </TouchableOpacity>
        ))}
 
        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          className="mt-8 mb-16 overflow-hidden rounded-[32px] shadow-2xl"
          style={{ elevation: 15 }}
        >
            <LinearGradient
                colors={theme === 'dark' ? ['#7f1d1d', '#450a0a'] : ['#FEE2E2', '#FECACA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-6 flex-row items-center justify-center border border-red-200/20"
            >
                <MaterialCommunityIcons name="power" size={28} color={theme === 'dark' ? 'white' : '#EF4444'} />
                <Text className={`${theme === 'dark' ? 'text-white' : 'text-red-500'} font-black text-xl ml-3 uppercase tracking-tighter`}>Sign Out</Text>
            </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}
