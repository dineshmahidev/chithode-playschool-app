import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface SettingsScreenProps {
  navigation: NavigationProps;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors, theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          icon: 'theme-light-dark',
          label: 'Dark Mode',
          value: theme === 'dark',
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          icon: 'bell',
          label: 'Push Notifications',
          value: notifications,
          onToggle: () => setNotifications(!notifications),
        },
        {
          id: 'emailAlerts',
          icon: 'email',
          label: 'Email Alerts',
          value: emailAlerts,
          onToggle: () => setEmailAlerts(!emailAlerts),
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          id: 'autoBackup',
          icon: 'backup-restore',
          label: 'Auto Backup',
          value: autoBackup,
          onToggle: () => setAutoBackup(!autoBackup),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* Consistent Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>System</Text>
            <Text className="text-2xl font-bold text-brand-pink">Settings ⚙️</Text>
          </View>
          <View className="bg-gray-600 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="cog" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
              {section.title}
            </Text>
            
            <View className={`${colors.surface} rounded-2xl border ${colors.border} overflow-hidden`}>
              {section.items.map((item, itemIndex) => (
                <View 
                  key={item.id}
                  className={`flex-row items-center justify-between p-4 ${
                    itemIndex !== section.items.length - 1 ? `border-b ${colors.border}` : ''
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-3 rounded-2xl mr-4`}>
                      <MaterialCommunityIcons 
                        name={item.icon as any} 
                        size={24} 
                        color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                      />
                    </View>
                    <Text className={`font-bold ${colors.text} text-base`}>{item.label}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#D1D5DB', true: '#F472B6' }}
                    thumbColor={item.value ? '#FFFFFF' : '#F3F4F6'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Additional Settings */}
        <View className="mb-6">
          <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
            About
          </Text>
          
          <View className={`${colors.surface} rounded-2xl border ${colors.border} p-4`}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${colors.textSecondary} font-bold`}>Version</Text>
              <Text className={`${colors.text} font-black`}>1.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`${colors.textSecondary} font-bold`}>School Name</Text>
              <Text className={`${colors.text} font-black`}>ABC School</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className={`${colors.textSecondary} font-bold`}>License</Text>
              <Text className={`${colors.text} font-black`}>Premium</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Help', 'Contact support at support@school.com')}
          className={`${colors.surface} rounded-2xl p-4 mb-8 border ${colors.border} flex-row items-center justify-between`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="bg-blue-500/10 p-3 rounded-2xl mr-4">
              <MaterialCommunityIcons name="help-circle" size={24} color="#3B82F6" />
            </View>
            <Text className={`font-bold ${colors.text} text-base`}>Help & Support</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
