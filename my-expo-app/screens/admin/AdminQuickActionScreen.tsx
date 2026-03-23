import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface AdminQuickActionScreenProps {
  navigation: NavigationProps;
}

export default function AdminQuickActionScreen({ navigation }: AdminQuickActionScreenProps) {
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    // Simulate data fetch
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    // Refresh logic when screen comes into focus
    onRefresh();
  }, [onRefresh]);

  const quickActions = [
    { 
      id: 'liveCamera', 
      title: 'Live Monitoring', 
      subtitle: 'Secure surveillance', 
      icon: 'broadcast', 
      iconColor: '#EF4444', 
      bgColor: 'rgba(239, 68, 68, 0.15)', 
      screen: 'liveCamera' 
    },
    { 
      id: 'activityFeed', 
      title: 'Daily Highlights', 
      subtitle: 'Parent social feed', 
      icon: 'image-multiple-outline', 
      iconColor: '#F472B6', 
      bgColor: 'rgba(244, 114, 182, 0.15)', 
      screen: 'activityFeed' 
    },
    { 
      id: 'studentList', 
      title: 'Student List', 
      subtitle: 'Global database', 
      icon: 'briefcase-account', 
      iconColor: '#2563EB', 
      bgColor: 'rgba(37, 99, 235, 0.15)', 
      screen: 'studentList' 
    },
    { 
      id: 'teacherAttendanceReport', 
      title: 'Staff Logs', 
      subtitle: 'Attendance stats', 
      icon: 'account-tie', 
      iconColor: '#4F46E5', 
      bgColor: 'rgba(79, 70, 229, 0.15)', 
      screen: 'teacherAttendanceReport' 
    },
    { 
      id: 'studentAttendanceReport', 
      title: 'Analytics', 
      subtitle: 'Monthly tracking', 
      icon: 'file-chart', 
      iconColor: '#10B981', 
      bgColor: 'rgba(16, 185, 129, 0.15)', 
      screen: 'studentAttendanceReport' 
    },
    { 
      id: 'takeAttendance', 
      title: 'Attendance', 
      subtitle: 'Record presence', 
      icon: 'calendar-check', 
      iconColor: '#14B8A6', 
      bgColor: 'rgba(20, 184, 166, 0.15)', 
      screen: 'takeAttendance' 
    },
    { 
      id: 'addUser', 
      title: 'User Add', 
      subtitle: 'Create account', 
      icon: 'account-plus', 
      iconColor: '#FBBF24', 
      bgColor: 'rgba(251, 191, 36, 0.15)', 
      screen: 'userManagement' 
    },
    { 
      id: 'addFee', 
      title: 'Assign Fee', 
      subtitle: 'Student records', 
      icon: 'cash-plus', 
      iconColor: '#F472B6', 
      bgColor: 'rgba(244, 114, 182, 0.15)', 
      screen: 'feesManagement' 
    },
    { 
      id: 'incomeExpense', 
      title: 'Finances', 
      subtitle: 'Budget tracker', 
      icon: 'cash-multiple', 
      iconColor: '#059669', 
      bgColor: 'rgba(5, 150, 105, 0.15)', 
      screen: 'incomeExpense' 
    },
    { 
      id: 'reports', 
      title: 'Reports', 
      subtitle: 'School stats', 
      icon: 'chart-bar', 
      iconColor: '#D97706', 
      bgColor: 'rgba(217, 119, 6, 0.15)', 
      screen: 'reports' 
    },
    { 
      id: 'announcements', 
      title: 'Broadcast', 
      subtitle: 'Push alerts', 
      icon: 'bullhorn', 
      iconColor: '#DB2777', 
      bgColor: 'rgba(219, 39, 119, 0.15)', 
      screen: 'announcements' 
    },
    { 
      id: 'postActivity', 
      title: 'Post Now', 
      subtitle: 'Media sharing', 
      icon: 'camera-burst', 
      iconColor: '#3B82F6', 
      bgColor: 'rgba(59, 130, 246, 0.15)', 
      screen: 'postActivity' 
    },
    { 
      id: 'backup', 
      title: 'Backup', 
      subtitle: 'System vault', 
      icon: 'database', 
      iconColor: '#F59E0B', 
      bgColor: 'rgba(245, 158, 11, 0.15)', 
      screen: 'backup' 
    },
    { 
      id: 'timetable', 
      title: 'Timetable', 
      subtitle: 'Daily plans', 
      icon: 'calendar-clock', 
      iconColor: '#6366F1', 
      bgColor: 'rgba(99, 102, 241, 0.15)', 
      screen: 'timetable' 
    }
  ];

  const filteredActions = useMemo(() => {
    return quickActions.filter(action => 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const insets = useSafeAreaInsets();

  return (
    <View
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
        <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl 
                    refreshing={isRefreshing} 
                    onRefresh={onRefresh}
                    colors={['#F472B6']}
                    tintColor={theme === 'dark' ? '#FFF' : '#F472B6'}
                />
            }
        >
        {/* ── Background Gradient & 3D Illustration ── */}
        <View className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e3a8a' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_actions.png')} 
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
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>
                        Admin
                    </Text>
                    <Text className="text-2xl font-black text-brand-pink mt-[-4px]">
                        Operations ⚡
                    </Text>
                    <View className="bg-brand-pink/20 self-start px-3 py-1.5 rounded-full mt-3 border border-brand-pink/10 shadow-sm">
                        <Text className="text-brand-pink text-[9px] font-black uppercase tracking-[2px]">Management Vault</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-brand-pink/20'} w-16 h-16 rounded-2xl items-center justify-center shadow-2xl border`}
                >
                    <MaterialCommunityIcons name="menu" size={32} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
                </TouchableOpacity>
            </View>

            {/* Search Input Box */}
            <View className="mt-8">
                <View 
                    className="flex-row items-center px-4 h-16 rounded-[24px] border shadow-2xl"
                    style={{ 
                        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF',
                        borderColor: theme === 'dark' ? '#262626' : '#F3F4F6'
                    }}
                >
                    <MaterialCommunityIcons name="magnify" size={24} color={theme === 'dark' ? '#4F4F4F' : '#F472B6'} />
                    <TextInput
                        className={`flex-1 ml-3 font-bold ${colors.text} text-base`}
                        placeholder="Search for an operation..."
                        placeholderTextColor={theme === 'dark' ? '#4F4F4F' : '#9CA3AF'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} opacity={0.5} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>

        {/* Master Operations Hub List */}
        <View className="px-6 mt-4">
            <View className="flex-row items-center justify-between mb-8 px-1">
                <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>
                    {searchQuery ? 'Filtered Operations 🔍' : 'Master Operations Hub ⚙️'}
                </Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full border border-brand-pink/20">
                    <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">
                        {filteredActions.length} Actions
                    </Text>
                </View>
            </View>

            <View>
                {filteredActions.length > 0 ? (
                    filteredActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate(action.screen as any)}
                            className="p-5 flex-row items-center justify-between mb-5 rounded-[28px] border shadow-xl"
                            style={{ 
                                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#FFFFFF',
                                borderColor: theme === 'dark' ? '#262626' : '#F3F4F6',
                                elevation: 8
                            }}
                        >
                            <View className="flex-row items-center flex-1">
                                <View 
                                    className={`p-4 rounded-[22px] mr-5 shadow-sm relative overflow-hidden`}
                                    style={{ 
                                        backgroundColor: theme === 'dark' ? '#262626' : action.bgColor,
                                    }}
                                >
                                    <MaterialCommunityIcons 
                                        name={action.icon as any} 
                                        size={24} 
                                        color={action.iconColor} 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={`text-base font-black ${colors.text} tracking-tight`}>{action.title}</Text>
                                    <Text className={`text-[11px] ${colors.textSecondary} font-bold opacity-60 mt-0.5`}>{action.subtitle}</Text>
                                </View>
                            </View>

                            <View 
                                className="bg-brand-pink/10 w-10 h-10 rounded-2xl items-center justify-center border border-brand-pink/20"
                            >
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#F472B6" />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View className="items-center justify-center py-20">
                        <MaterialCommunityIcons name="search-off" size={64} color={colors.textSecondary} opacity={0.2} />
                        <Text className={`mt-4 text-lg font-bold ${colors.textSecondary}`}>No operations found</Text>
                        <Text className={`text-sm ${colors.textTertiary}`}>Try a different search term</Text>
                    </View>
                )}
            </View>
        </View>
        <View className="h-32" />
        </ScrollView>
    </View>
  );
}
