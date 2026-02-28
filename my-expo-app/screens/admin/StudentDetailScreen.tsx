import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentDetailScreenProps {
  navigation: NavigationProps;
  route: { params: { studentId: string } };
}

export default function StudentDetailScreen({ navigation, route }: StudentDetailScreenProps) {
  const { studentId } = route?.params || {};
  const { users } = useAuth();
  const { colors, theme } = useTheme();

  const student = users.find(u => u.id === studentId);

  if (!student) {
    return (
      <SafeAreaView className={`flex-1 ${colors.background} items-center justify-center`}>
        <View className="items-center px-10">
          <MaterialCommunityIcons name="account-search-outline" size={80} color={colors.textTertiary} />
          <Text className={`text-xl font-bold ${colors.text} mt-4 text-center`}>Student not found</Text>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="mt-8 bg-brand-pink px-8 py-4 rounded-3xl shadow-lg"
          >
            <Text className="text-white font-black">BACK TO LIST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderInfoRow = (label: string, value: string | undefined, icon: string, color: string = colors.textTertiary, isPhone: boolean = false) => (
    <View className="mb-8 w-full">
      <View className="flex-row items-start">
        <View className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-sm`}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <View className="flex-1">
          <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-1`}>{label}</Text>
          <View className="flex-row items-center justify-between">
            <Text className={`text-lg font-bold ${colors.text} flex-1 mr-2`} style={{ lineHeight: 24 }}>
              {value || 'Not provided'}
            </Text>
            {isPhone && value && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${value}`)}
                className="bg-green-500 w-10 h-10 rounded-full items-center justify-center shadow-md shadow-green-200"
              >
                <MaterialCommunityIcons name="phone" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="px-6 pt-4 pb-12 w-full">
          {/* Navigation Bar */}
          <View className="flex-row items-center justify-between mb-8 w-full">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('profile', { studentId: student.id })}
              className="bg-brand-yellow px-6 h-12 rounded-2xl items-center justify-center shadow-lg shadow-amber-200 border-2 border-white"
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="pencil" size={18} color="#92400E" />
                <Text className="text-amber-900 font-black ml-2 uppercase text-xs tracking-widest">Edit</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Card - Fixed Image Container and Tag Position */}
          <View className="items-center justify-center w-full">
            <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Main Photo Circle */}
              <View 
                className="bg-brand-pink border-4 border-white shadow-2xl overflow-hidden" 
                style={{ width: 192, height: 192, borderRadius: 96, alignItems: 'center', justifyContent: 'center' }}
              >
                {student.studentPhoto ? (
                  <Image source={{ uri: student.studentPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="account" size={100} color="white" />
                )}
              </View>
              
              {/* Verified Badge - Positioned perfectly at bottom right of the circle */}
              <View 
                className="absolute bg-green-500 items-center justify-center border-4 border-white shadow-lg z-20"
                style={{ 
                  width: 52, 
                  height: 52, 
                  borderRadius: 26, 
                  bottom: 8, 
                  right: 8 
                }}
              >
                <MaterialCommunityIcons name="check-decagram" size={26} color="white" />
              </View>
            </View>

            <Text className={`text-4xl font-black ${colors.text} mt-8 tracking-tighter text-center`}>{student.name}</Text>
            <View className="flex-row items-center mt-3 bg-brand-pink/10 px-6 py-2 rounded-full border border-brand-pink/20">
              <MaterialCommunityIcons name="tag-outline" size={16} color="#F472B6" />
              <Text className="text-brand-pink font-black text-xs ml-2 uppercase tracking-[3px]">{student.studentId}</Text>
            </View>
          </View>
        </View>

        {/* Info Content */}
        <View className="px-6 pb-24 w-full">
          {/* General Information Card */}
          <View className={`${colors.surface} rounded-[48px] p-8 shadow-xl border ${colors.border} mb-8 w-full`}>
            <View className="flex-row items-center mb-10">
              <View className="w-8 h-1 bg-brand-pink rounded-full mr-3" />
              <Text className="text-brand-pink font-black text-lg uppercase tracking-widest">General Info</Text>
            </View>
            
            {renderInfoRow('Category', student.category, 'school', '#3B82F6')}
            {renderInfoRow('Blood Group', student.bloodGroup, 'water', '#EF4444')}
            {renderInfoRow('Admission Date', student.admissionDate, 'calendar-star', '#8B5CF6')}
            {renderInfoRow('Monthly Fees', student.fees, 'cash-multiple', '#10B981')}
            {renderInfoRow('Full Address', student.address, 'map-marker', '#F59E0B')}
          </View>

          {/* Family Contact Card */}
          <View className={`${colors.surface} rounded-[48px] p-8 shadow-xl border ${colors.border} w-full`}>
            <View className="flex-row items-center mb-10">
              <View className="w-8 h-1 bg-blue-500 rounded-full mr-3" />
              <Text className="text-blue-500 font-black text-lg uppercase tracking-widest">Family & Contacts</Text>
            </View>
            
            <View className="mb-2">
              <Text className="text-gray-400 font-bold text-[10px] uppercase mb-8 ml-1 tracking-[4px]">Paternal Records</Text>
              {renderInfoRow('Father Name', student.fatherName, 'account-tie', colors.textSecondary)}
              {renderInfoRow('Father Phone', student.fatherPhone, 'phone', '#22C55E', true)}
            </View>

            <View className="pt-8 border-t border-gray-100 mb-2">
              <Text className="text-gray-400 font-bold text-[10px] uppercase mb-8 ml-1 tracking-[4px]">Maternal Records</Text>
              {renderInfoRow('Mother Name', student.motherName, 'account-female', colors.textSecondary)}
              {renderInfoRow('Mother Phone', student.motherPhone, 'phone', '#22C55E', true)}
            </View>

            <View className="pt-8 border-t border-gray-100">
              <Text className="text-gray-400 font-bold text-[10px] uppercase mb-8 ml-1 tracking-[4px]">Legal Guardian</Text>
              {renderInfoRow('Guardian Name', student.parentName, 'account-group', colors.textSecondary)}
              {renderInfoRow('Guardian Phone', student.guardianPhone, 'phone', '#22C55E', true)}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
