import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface ReportsScreenProps {
  navigation: NavigationProps;
}

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
  const { colors, theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setReportData(response.data.overview || []);
      setRecentActivity(response.data.recentActivity || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View 
      className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
      style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      {/* ── Background Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_3d.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.1 : 0.15, transform: [{ scale: 1.4 }, { translateY: -40 }] }}
            resizeMode="cover"
        />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* ── Header ── */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-6`}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>School</Text>
              <Text className="text-2xl font-black text-brand-pink mt-[-4px]">Intelligence 📊</Text>
            </View>
            <View className="bg-brand-pink w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden">
                <MaterialCommunityIcons name="chart-pie" size={48} color="white" />
                <View className="absolute -bottom-2 -right-2 opacity-20">
                    <MaterialCommunityIcons name="poll" size={60} color="white" />
                </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F472B6" />
            <Text className="mt-4 font-black text-brand-pink/40 uppercase text-[10px] tracking-[4px]">Analyzing Campus...</Text>
          </View>
        ) : (
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F472B6" />
            }
          >
            {/* ── Overview Stats Grid ── */}
            <View className="px-6 mb-8 mt-2">
              <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter uppercase opacity-60 tracking-widest`}>Overview 📈</Text>
                <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                  <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Live Pulse</Text>
                </View>
              </View>
              
              <View className="flex-row flex-wrap justify-between">
                {reportData.map((report) => {
                  const isAttendance = report.title?.toLowerCase().includes('attendance');
                  
                  if (isAttendance) {
                    return (
                      <View 
                        key={report.id} 
                        style={{ elevation: 20 }}
                        className={`w-full rounded-[45px] overflow-hidden mb-8 shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/5'}`}
                      >
                        <LinearGradient
                          colors={theme === 'dark' ? ['#831843', '#1c1c14'] : ['#FFFFFF', '#FFF1F2']}
                          className="p-8"
                        >
                          <View className="flex-row items-center justify-between mb-8">
                            <View className="bg-brand-pink w-16 h-16 rounded-[28px] items-center justify-center shadow-lg shadow-brand-pink/30">
                              <MaterialCommunityIcons name="account-multiple-check" size={36} color="white" />
                            </View>
                            <View className={`${theme === 'dark' ? 'bg-brand-pink/20' : 'bg-brand-pink/10'} px-5 py-2 rounded-2xl border border-brand-pink/20`}>
                              <Text className="text-brand-pink text-[11px] font-black uppercase tracking-[3px]">Target 95%</Text>
                            </View>
                          </View>
                          
                          <View className="flex-row items-end justify-between mb-8">
                            <View>
                              <Text className={`text-[12px] font-black uppercase tracking-[4px] mb-2 ${theme === 'dark' ? 'text-brand-pink' : 'text-gray-400'}`}>{report.title}</Text>
                              <View className="flex-row items-baseline">
                                <Text style={{ color: theme === 'dark' ? '#FFF' : '#111' }} className="text-6xl font-black tracking-tighter">{report.value}</Text>
                                <Text className="text-brand-pink font-black text-2xl ml-3 mb-1">↑ 2.4%</Text>
                              </View>
                            </View>
                            <View className="items-end">
                               <Text style={{ color: colors.text }} className="text-[10px] font-black uppercase opacity-40 mb-1">Real-time</Text>
                               <Text className="text-brand-pink font-black text-xs uppercase tracking-tighter">Daily Pulse ⚡</Text>
                            </View>
                          </View>
                          
                          <View className="h-5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden p-1 shadow-inner">
                            <LinearGradient
                              colors={['#F472B6', '#BE185D']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ width: report.value || '85%', height: '100%', borderRadius: 10 }}
                            />
                          </View>
                          <Text className={`text-[9px] font-black uppercase tracking-widest mt-4 text-center ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Live Statistics Updated Just Now</Text>
                        </LinearGradient>
                      </View>
                    );
                  }

                  return (
                    <View 
                      key={report.id} 
                      style={{ elevation: 15 }}
                      className={`w-[48%] rounded-[40px] overflow-hidden mb-6 shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/5'}`}
                    >
                      <LinearGradient
                        colors={theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#FFFFFF', '#F9FAFB']}
                        className="p-6 h-40 justify-between"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className={`${report.color || 'bg-brand-pink'} w-12 h-12 rounded-2xl items-center justify-center shadow-lg`}>
                            <MaterialCommunityIcons name={report.icon as any || 'chart-line'} size={24} color="white" />
                          </View>
                        </View>
                        <View>
                          <Text className={`text-[10px] font-black uppercase tracking-[2px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{report.title}</Text>
                          <Text className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tighter`}>{report.value}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Recent Action Timeline ── */}
            <View className="px-6 mt-4">
              <View className="flex-row items-center justify-between mb-6 px-1">
                <Text className={`text-xl font-black ${colors.text} tracking-tighter uppercase opacity-60 tracking-widest`}>Recent Activity 📋</Text>
              </View>
              
              <View className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/5'} rounded-[40px] p-8 border shadow-2xl`} style={{ elevation: 20 }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const iconColor = activity.color?.replace('bg-', '#').replace('500', '') || '#F472B6';
                    return (
                      <View key={index} className={`flex-row ${index !== recentActivity.length - 1 ? 'mb-10' : ''}`}>
                        <View className="items-center mr-5">
                          <View style={{ backgroundColor: iconColor + '20' }} className="w-12 h-12 rounded-2xl items-center justify-center z-10">
                            <MaterialCommunityIcons name={activity.icon || 'star-outline'} size={22} color={iconColor} />
                          </View>
                          {index !== recentActivity.length - 1 && (
                            <View className={`w-1 flex-1 mt-3 rounded-full ${theme === 'dark' ? 'bg-brand-pink/30' : 'bg-gray-100'}`} />
                          )}
                        </View>
                        <View className="flex-1 pt-1">
                          <Text style={{ color: colors.text }} className="text-lg font-black tracking-tight">{activity.title}</Text>
                          <Text style={{ color: colors.textSecondary }} className="text-[13px] font-bold mt-1 leading-5">{activity.description}</Text>
                          <View className="bg-brand-pink/10 self-start px-3 py-1 rounded-lg mt-3">
                            <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">{activity.time}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View className="items-center py-10">
                    <MaterialCommunityIcons name="radar" size={48} color="#9CA3AF" />
                    <Text className={`mt-4 font-black ${colors.textTertiary} uppercase tracking-widest text-[10px]`}>No Signals Detected</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
