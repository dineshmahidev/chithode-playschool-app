import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      setReportData(response.data.overview);
      setRecentActivity(response.data.recentActivity);
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
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>School</Text>
            <Text className="text-2xl font-bold text-brand-pink">Reports 📊</Text>
          </View>
          <View className="bg-brand-pink w-16 h-16 rounded-3xl items-center justify-center">
            <MaterialCommunityIcons name="chart-bar" size={32} color="white" />
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F472B6" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-6" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F472B6" />
          }
        >
          <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>Overview 📈</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {reportData.map((report) => (
              <View 
                key={report.id} 
                className={`${colors.surface} p-5 rounded-2xl mb-4 w-[48%] border ${colors.border}`}
              >
                <View className={`${report.color} p-3 rounded-2xl w-12 h-12 items-center justify-center mb-4`}>
                  <MaterialCommunityIcons name={report.icon as any} size={24} color="white" />
                </View>
                <Text className={`text-[10px] ${colors.textSecondary} mb-1 uppercase font-black tracking-wider`}>{report.title}</Text>
                <Text className={`text-xl font-black ${colors.text}`}>{report.value}</Text>
              </View>
            ))}
          </View>

          <View className="mt-4 mb-8">
            <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>Recent Activity 📋</Text>
            <View className={`${colors.surface} rounded-2xl p-4 border ${colors.border}`}>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <View key={index} className={`flex-row items-center ${index !== recentActivity.length - 1 ? 'mb-6' : ''}`}>
                    <View className={`${activity.color}/10 p-3 rounded-full mr-4`}>
                      <MaterialCommunityIcons name={activity.icon} size={20} color={activity.color.replace('bg-', '#').replace('500', '')} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold ${colors.text}`}>{activity.title}</Text>
                      <Text className={`text-sm ${colors.textSecondary}`}>{activity.description}</Text>
                      <Text className={`text-[10px] ${colors.textTertiary} mt-1 font-bold`}>{activity.time}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className={`text-center py-4 ${colors.textSecondary}`}>No recent activity</Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
