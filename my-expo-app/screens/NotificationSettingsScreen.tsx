import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Switch, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface NotificationSettings {
  enabled: boolean;
  payment: boolean;
  attendance: boolean;
  activity: boolean;
}

export default function NotificationSettingsScreen({ navigation }: any) {
  const { user, updateNotificationSettings } = useAuth();
  const { colors, theme } = useTheme();
  const btnScale = useRef(new Animated.Value(1)).current;
  
  const [settings, setSettings] = useState<NotificationSettings>(
    user?.notification_settings || {
      enabled: true,
      payment: true,
      attendance: true,
      activity: true,
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePressIn = () => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateNotificationSettings(settings);
      if (success) {
        Alert.alert('Success ✨', 'Your notification preferences have been perfectly saved!');
      }
    } catch (error) {
       Alert.alert('Error 😟', 'We couldn\'t save your settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, disabled = false, bgIcon }: any) => (
    <View 
      className={`flex-row items-center justify-between p-5 rounded-[32px] mb-5 border shadow-sm ${colors.surface}`}
      style={{ 
        opacity: disabled ? 0.4 : 1,
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        elevation: 2
      }}
    >
      <View className="flex-row items-center flex-1">
        <View 
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: bgIcon || 'rgba(244, 114, 182, 0.1)' }}
        >
          <MaterialCommunityIcons name={icon} size={28} color={bgIcon ? '#FFF' : '#F472B6'} />
        </View>
        <View className="flex-1">
          <Text className={`font-black text-lg tracking-tight ${colors.text}`}>{title}</Text>
          <Text className={`text-[11px] font-bold opacity-60 ${colors.textSecondary}`}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#CBD5E1', true: '#F472B6' }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <View className={`flex-1 ${colors.background}`}>
      {/* ── Decorative Background ── */}
      <View className="absolute top-0 left-0 right-0 h-full overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#2D1B24' : '#FFF1F2', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../assets/images/playschool_account.png')} 
            style={{ 
                width: width * 1.5, 
                height: width * 1.5, 
                opacity: theme === 'dark' ? 0.05 : 0.1, 
                position: 'absolute',
                top: -100,
                right: -width * 0.4,
                transform: [{ rotate: '-15deg' }]
            }}
            resizeMode="contain"
        />
        
        {/* Soft Glows */}
        <View className="absolute top-1/4 -left-40 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
        <View className="absolute bottom-1/4 -right-40 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl" />
      </View>

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Custom Header */}
        <View className="px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className={`w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} ${colors.surface}`}
            style={{ elevation: 5 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className={`text-2xl font-black ${colors.text} tracking-tighter`}>Alert Center</Text>
            <View className="bg-brand-pink/10 px-3 py-0.5 rounded-full mt-1">
                <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">Preferences</Text>
            </View>
          </View>
          <View className="w-12" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10 }}>
          {/* Master Control Card */}
          <TouchableOpacity 
            activeOpacity={0.95}
            onPress={() => toggleSetting('enabled')}
            className="mb-8"
          >
            <LinearGradient
              colors={['#F472B6', '#BE185D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-8 rounded-[40px] shadow-2xl shadow-pink-500/30 overflow-hidden"
              style={{ elevation: 15 }}
            >
              <View className="flex-row items-center justify-between z-10">
                <View className="flex-1">
                  <Text className="text-white text-3xl font-black tracking-tighter">All Signals</Text>
                  <Text className="text-white/80 font-bold text-sm mt-1">
                    {settings.enabled ? 'Push notifications active 🔔' : 'Quiet mode enabled 🔕'}
                  </Text>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={() => toggleSetting('enabled')}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(255,255,255,0.4)' }}
                  thumbColor="#FFF"
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>

              {/* Decorative keyhole/lock icon background */}
              <View className="absolute -right-10 -bottom-10 opacity-10">
                <MaterialCommunityIcons name={settings.enabled ? "bell-ring" : "bell-off"} size={160} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row items-center mb-6 px-2">
            <MaterialCommunityIcons name="tune-variant" size={16} color={colors.textTertiary} />
            <Text className={`text-xs font-black uppercase tracking-[3px] ml-2 ${colors.textTertiary}`}>
              Custom Channels
            </Text>
          </View>

          <SettingItem
            icon="cash-check"
            title="School Fees"
            subtitle="Receipts and payment reminders"
            value={settings.payment}
            onToggle={() => toggleSetting('payment')}
            disabled={!settings.enabled}
            bgIcon="#10B981"
          />

          <SettingItem
            icon="account-clock"
            title="Attendance"
            subtitle="Daily arrival and departure logs"
            value={settings.attendance}
            onToggle={() => toggleSetting('attendance')}
            disabled={!settings.enabled}
            bgIcon="#6366F1"
          />

          <SettingItem
            icon="star-face"
            title="Activity Feed"
            subtitle="New photos, likes and comments"
            value={settings.activity}
            onToggle={() => toggleSetting('activity')}
            disabled={!settings.enabled}
            bgIcon="#F59E0B"
          />

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity 
              className="mt-6 mb-12"
              activeOpacity={0.8}
              onPress={handleSave}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#F472B6', '#BE185D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-6 rounded-[32px] items-center justify-center shadow-2xl shadow-pink-500/40 border-b-4 border-black/10"
                style={{ elevation: 12 }}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="check-decagram" size={24} color="white" />
                    <Text className="text-white font-black text-xl ml-3 tracking-tight">Save Preferences ✨</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
