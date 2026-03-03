import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
    const isDark = theme === 'dark';
    switch (category) {
      case 'Playschool': return isDark ? 'text-pink-400 bg-pink-500/20' : 'text-brand-pink bg-brand-pink/10';
      case 'Toddler': return isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-brand-yellow bg-brand-yellow/10';
      case 'Daycare': return isDark ? 'text-blue-400 bg-blue-500/20' : 'text-blue-500 bg-blue-500/10';
      default: return isDark ? 'text-gray-400 bg-gray-500/20' : 'text-gray-500 bg-gray-500/10';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Playschool': return 'face-man-profile';
      case 'Toddler': return 'baby-face-outline';
      case 'Daycare': return 'home-heart';
      default: return 'school';
    }
  };

  return (
    <View 
      className="flex-1"
      style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      {/* ── Fixed High-Visibility Background ── */}
      <View className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden">
        <Image 
            source={require('../../assets/images/directory_header_bg.png')} 
            style={{ 
              width: '100%', 
              height: '100%', 
              opacity: theme === 'dark' ? 0.4 : 0.9, 
              position: 'absolute'
            }}
            resizeMode="cover"
        />
        
        <LinearGradient
            colors={[
              theme === 'dark' ? 'rgba(28,28,20,0.6)' : 'rgba(255,255,255,0.4)', 
              theme === 'dark' ? '#1c1c14' : '#FFFFFF'
            ]}
            style={{ position: 'absolute', inset: 0 }}
        />

        <Image 
            source={require('../../assets/images/playschool_3d.png')} 
            style={{ 
              width: '100%', 
              height: '100%', 
              opacity: theme === 'dark' ? 0.08 : 0.12, 
              position: 'absolute',
              transform: [{ scale: 1.5 }, { translateY: -40 }]
            }}
            resizeMode="cover"
        />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* ── High-Contrast Header ── */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={{ elevation: 15 }}
                className={`${theme === 'dark' ? 'bg-[#25251d] border-white/10' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-2xl border mb-6`}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text style={{ color: colors.text }} className="text-5xl font-black tracking-tighter">Student</Text>
              <Text style={{ color: colors.text }} className="text-3xl font-bold opacity-80 mt-[-4px]">Directory 📚</Text>
            </View>
            
            <View 
              style={{ elevation: 25 }}
              className={`w-28 h-28 rounded-[42px] items-center justify-center border-[8px] ${theme === 'dark' ? 'bg-indigo-950/40 border-indigo-900/40' : 'bg-white border-gray-100'} rotate-6 shadow-2xl relative overflow-hidden`}
            >
                <LinearGradient
                   colors={['#FCD34D', '#F59E0B']}
                   className="absolute inset-0 opacity-30"
                />
                <MaterialCommunityIcons name="account-group" size={54} color="#FBBF24" />
                <View className="absolute -bottom-3 -right-3 opacity-20">
                    <MaterialCommunityIcons name="human-child" size={70} color="#FBBF24" />
                </View>
            </View>
          </View>

          {/* Premium Search Engine UI */}
          <View 
            style={{ elevation: 8 }}
            className={`mt-10 ${theme === 'dark' ? 'bg-[#1a1a18] border-white/10' : 'bg-white border-brand-pink/10'} border-2 rounded-[36px] px-8 py-5 shadow-sm mb-4`}
          >
            <View className="flex-row items-center justify-center">
              <MaterialCommunityIcons name="account-search" size={28} color="#F472B6" />
              <TextInput
                placeholder="Search student"
                placeholderTextColor={theme === 'dark' ? '#4B5563' : '#9CA3AF'}
                style={{ color: colors.text, textAlign: 'center' }}
                className="flex-1 font-black text-xl ml-2"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Status Pills */}
        <View className="px-8 mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
             <View className="w-2 h-2 rounded-full bg-brand-pink mr-2" />
             <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} opacity-60`}>Database Stream</Text>
          </View>
          <View className="bg-brand-pink/10 px-4 py-1.5 rounded-full border border-brand-pink/10">
            <Text className="text-brand-pink font-black text-[9px] uppercase tracking-widest">{filteredStudents.length} Active Records</Text>
          </View>
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          <View className="px-6">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('studentDetail', { studentId: student.id })}
                  style={{ elevation: 12 }}
                  className={`${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/5'} rounded-[45px] p-6 mb-8 border shadow-2xl overflow-hidden`}
                >
                  <View className="flex-row items-center">
                    {/* Immersive Photo Container */}
                    <View 
                      className="w-24 h-24 rounded-[36px] bg-brand-pink/5 items-center justify-center p-1.5 border-2 border-brand-pink/10 shadow-lg"
                    >
                      <View className="w-full h-full rounded-[30px] overflow-hidden bg-brand-pink/10 items-center justify-center">
                        {student.avatar ? (
                          <Image source={{ uri: student.avatar }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <MaterialCommunityIcons name="face-recognition" size={44} color="#F472B6" />
                        )}
                      </View>
                      <View className="absolute -bottom-1 -right-1 bg-white dark:bg-[#25251d] p-2.5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <MaterialCommunityIcons name={getCategoryIcon(student.category)} size={16} color="#F472B6" />
                      </View>
                    </View>

                    <View className="flex-1 ml-6">
                      <Text 
                        style={{ color: colors.text }}
                        className="text-2xl font-black tracking-tighter" 
                        numberOfLines={1}
                      >
                        {student.name}
                      </Text>
                      
                      <View className="flex-row items-center mt-1.5">
                        <View className="bg-brand-pink/10 px-3 py-1 rounded-lg flex-row items-center border border-brand-pink/5">
                           <MaterialCommunityIcons name="tag-outline" size={12} color="#F472B6" />
                           <Text className="text-brand-pink text-[10px] font-black ml-2 uppercase tracking-widest">{student.studentId || "ID-PENDING"}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mt-3">
                         <View className={`px-4 py-1.5 rounded-full flex-row items-center ${getCategoryColor(student.category)}`}>
                           <View className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-50" />
                           <Text className="text-[10px] font-black uppercase tracking-widest">{student.category || "General"}</Text>
                         </View>
                      </View>
                    </View>

                    <View className="bg-gray-50 dark:bg-white/5 w-14 h-14 rounded-[24px] items-center justify-center border border-gray-100 dark:border-white/10">
                      <MaterialCommunityIcons name="arrow-right" size={24} color="#F472B6" />
                    </View>
                  </View>
                  
                  {/* Faint Background Geometry */}
                  <View className="absolute -bottom-10 -right-10" style={{ opacity: 0.03 }}>
                    <MaterialCommunityIcons name="account-group" size={150} color={theme === 'dark' ? 'white' : 'black'} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center justify-center py-24 mt-4">
                <View className="bg-brand-pink/5 w-40 h-40 rounded-[50px] items-center justify-center mb-10 border border-brand-pink/5">
                   <MaterialCommunityIcons name="account-search-outline" size={100} color={theme === 'dark' ? '#3e3e34' : '#E5E7EB'} />
                </View>
                <Text style={{ color: colors.text }} className="text-3xl font-black tracking-tighter">No Pupils Found</Text>
                <Text className={`text-[15px] ${colors.textSecondary} mt-3 text-center px-12 leading-6 font-medium`}>We couldn't locate any records matching your search. Please verify the spelling or student ID.</Text>
                <TouchableOpacity 
                   onPress={() => setSearchQuery('')}
                   className="mt-12 bg-brand-pink px-12 py-5 rounded-[26px] shadow-2xl shadow-brand-pink/40"
                >
                  <Text className="text-white font-black uppercase tracking-widest text-xs">Reset Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
