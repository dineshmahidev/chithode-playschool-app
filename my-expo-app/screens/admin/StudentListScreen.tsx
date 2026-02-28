import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface StudentListScreenProps {
  navigation: NavigationProps;
}

export default function StudentListScreen({ navigation }: StudentListScreenProps) {
  const { users } = useAuth();
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const students = users.filter(u => u.role === 'student');
  
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Playschool': return 'text-brand-pink bg-brand-pink/10';
      case 'Toddler': return 'text-brand-yellow bg-brand-yellow/10';
      case 'Daycare': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Student</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Directory 📚</Text>
          </View>
          <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 border-white rotate-6">
            <MaterialCommunityIcons name="account-group-outline" size={32} color="#92400E" />
          </View>
        </View>

        {/* Search Bar */}
        <View className={`flex-row items-center ${colors.surface} rounded-2xl px-4 py-3 border ${colors.border} mb-4`}>
          <MaterialCommunityIcons name="magnify" size={24} color={colors.textTertiary} />
          <TextInput
            placeholder="Search student name or ID..."
            placeholderTextColor="#9CA3AF"
            className={`flex-1 ml-3 font-bold ${colors.text}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pb-10">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                className={`${colors.surface} rounded-[32px] p-5 mb-4 border ${colors.border} shadow-sm overflow-hidden`}
              >
                <View className="flex-row items-center">
                  {/* Profile Photo Icon */}
                  <View className="w-20 h-20 rounded-32 bg-brand-pink/20 items-center justify-center overflow-hidden border-2 border-white shadow-lg" style={{ borderRadius: 28 }}>
                    {student.studentPhoto ? (
                      <Image source={{ uri: student.studentPhoto }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons name="account" size={40} color="#F472B6" />
                    )}
                  </View>

                  <View className="flex-1 ml-5">
                    <Text className={`text-xl font-black ${colors.text} tracking-tight`}>{student.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <MaterialCommunityIcons name="card-account-details-outline" size={14} color={colors.textTertiary} />
                      <Text className={`text-xs font-bold ${colors.textTertiary} ml-1`}>{student.studentId}</Text>
                    </View>
                    
                    <View className="flex-row items-center mt-3">
                       <View className={`px-4 py-1.5 rounded-2xl ${getCategoryColor(student.category)}`}>
                         <Text className="text-[10px] font-black uppercase tracking-widest">{student.category}</Text>
                       </View>
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center justify-center py-20">
              <MaterialCommunityIcons name="account-search-outline" size={64} color={colors.textTertiary} />
              <Text className={`text-lg font-bold ${colors.textSecondary} mt-4`}>No students found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
