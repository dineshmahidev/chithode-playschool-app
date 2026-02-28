import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface EmergencyContactScreenProps {
  navigation: NavigationProps;
}

export default function EmergencyContactScreen({ navigation }: EmergencyContactScreenProps) {
  const { colors, theme } = useTheme();

  const emergencyContacts = [
    {
      id: '1',
      name: 'Father',
      relation: 'Parent',
      phone: '+91 98765 43210',
      icon: 'account-tie',
      color: 'bg-blue-500',
    },
    {
      id: '2',
      name: 'Mother',
      relation: 'Parent',
      phone: '+91 98765 43211',
      icon: 'account-heart',
      color: 'bg-pink-500',
    },
    {
      id: 'teacher',
      name: 'Class Teacher',
      relation: 'Academic Support',
      phone: '+91 98765 43215',
      icon: 'account-school',
      color: 'bg-green-600',
    },
    {
      id: '3',
      name: 'School Office',
      relation: 'Administration',
      phone: '+91 98765 43212',
      icon: 'office-building',
      color: 'bg-yellow-600',
    },
    {
      id: '4',
      name: 'Emergency Services',
      relation: 'Police/Ambulance',
      phone: '112',
      icon: 'ambulance',
      color: 'bg-red-500',
    },
  ];

  const handleCall = (phone: string, name: string) => {
    Alert.alert(
      'Make Call',
      `Do you want to call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phone}`);
          },
        },
      ]
    );
  };

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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Emergency</Text>
            <Text className="text-2xl font-bold text-brand-pink">Contacts 🚨</Text>
          </View>
          <View className="bg-red-500 w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="phone-alert" size={32} color="white" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className={`${colors.surface} rounded-2xl p-5 mb-6 border ${colors.border}`}>
          <View className="flex-row items-center mb-3">
            <View className="bg-red-500/10 p-3 rounded-full mr-4">
              <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className={`font-black ${colors.text} text-base`}>Emergency Information</Text>
              <Text className={`text-xs ${colors.textSecondary} mt-1`}>
                Use these contacts only in case of emergency
              </Text>
            </View>
          </View>
        </View>

        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Quick Dial 📞
        </Text>

        {emergencyContacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            onPress={() => handleCall(contact.phone, contact.name)}
            className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className={`${contact.color} p-4 rounded-2xl mr-4`}>
                <MaterialCommunityIcons name={contact.icon as any} size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className={`font-black ${colors.text} text-lg mb-1`}>{contact.name}</Text>
                <Text className={`text-xs ${colors.textSecondary} mb-2`}>{contact.relation}</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="phone" size={14} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Text className={`text-sm ${colors.textTertiary} ml-2 font-bold`}>{contact.phone}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </View>
          </TouchableOpacity>
        ))}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
