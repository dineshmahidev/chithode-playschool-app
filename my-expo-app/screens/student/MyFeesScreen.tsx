import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Modal, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function MyFeesScreen({ navigation }: any) {
  const { user, transactions, fees, feeStructures } = useAuth();
  const { colors, theme: appTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = appTheme === 'dark';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [pdfLoading, setPdfLoading] = useState(false);

  const studentTransactions = useMemo(() => {
    if (!user) return [];
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();

    return transactions
      .filter(t => 
        (t.student_id?.toString() === dbId || t.name.includes(user.name)) && 
        t.category === 'Fees' &&
        t.type === 'income'
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, user]);

  const studentFinancials = useMemo(() => {
    if (!user) return { paid: 0, pending: 0 };
    
    const dbId = user.id?.toString();
    const schoolId = user.studentId?.toString();
    
    // Aggregate all fee records from DB
    const myFeesList = fees.filter(f => 
      (f.student_id?.toString() === dbId || f.student_id?.toString() === schoolId)
    );
    
    // Source of Truth for "Paid": Sum of all fee transactions
    const paidSum = studentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
    // Source of Truth for "Pending": Sum of all unpaid fee records
    const pendingSum = myFeesList
      .filter(f => f.status === 'unpaid')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
      
    return { paid: paidSum, pending: pendingSum };
  }, [user, fees, studentTransactions]);

  const generateInvoiceHtml = (tx: any) => `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 50px; }
          .logo { background: #F472B6; color: white; width: 60px; height: 60px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; margin-bottom: 10px; }
          .title { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -1px; }
          .subtitle { color: #F472B6; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; }
          .receipt-box { border: 2px solid #F3F4F6; border-radius: 24px; padding: 30px; margin-top: 30px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #E5E7EB; padding-bottom: 10px; }
          .label { font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
          .value { font-size: 14px; font-weight: 700; color: #1F2937; }
          .amount-box { background: #FDF2F8; border: 1px solid #FBCFE8; padding: 20px; border-radius: 20px; text-align: center; margin-top: 40px; }
          .paid-stamp { border: 3px solid #10B981; color: #10B981; display: inline-block; padding: 5px 20px; border-radius: 10px; font-weight: 900; transform: rotate(-10deg); position: absolute; top: 100px; right: 80px; font-size: 24px; opacity: 0.5; }
          .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="paid-stamp">PAID</div>
        <div class="header">
          <div class="logo">H</div>
          <div class="title">CHITHODE HAPPYKIDS</div>
          <div class="subtitle">Official Fee Receipt</div>
        </div>
        <div class="receipt-box">
          <div class="row"><span class="label">Date</span><span class="value">${tx.date}</span></div>
          <div class="row"><span class="label">Student</span><span class="value">${user?.name}</span></div>
          <div class="row"><span class="label">Payment For</span><span class="value">${tx.name}</span></div>
        </div>
        <div class="amount-box">
            <div class="amount-value" style="font-size: 32px; font-weight: 900; color: #F472B6;">₹${tx.amount.toLocaleString()}</div>
        </div>
        <div class="footer">Issued on ${new Date().toLocaleDateString()}</div>
      </body>
    </html>
  `;

  const handleDownload = async (tx: any) => {
    try {
      setPdfLoading(true);
      const html = generateInvoiceHtml(tx);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invoice.');
    } finally {
      setPdfLoading(false);
    }
  };

  const renderDashboard = () => (
    <View className="px-6">
      {/* Overview Card */}
      <View
        style={{ elevation: 15 }}
        className={`mb-10 rounded-[48px] overflow-hidden border-2 shadow-2xl ${isDark ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-white'}`}
      >
        <LinearGradient
          colors={isDark ? ['#25251d', '#1c1c14'] : ['#FFFFFF', '#F9FAFB']}
          className="p-8"
        >
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary} mb-2 opacity-70`}>GLOBAL BALANCE</Text>
              <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>₹{studentFinancials.pending.toLocaleString()}</Text>
            </View>
            <View className="w-16 h-16 rounded-[22px] bg-brand-pink items-center justify-center shadow-xl shadow-brand-pink/30">
              <MaterialCommunityIcons name="wallet-outline" size={32} color="white" />
            </View>
          </View>

          <View className="flex-row gap-4 pt-8 border-t border-gray-100 dark:border-white/5">
            <View className="flex-1 bg-green-500/5 dark:bg-green-500/10 p-5 rounded-[28px] border border-green-500/10 items-center">
              <MaterialCommunityIcons name="check-decagram" size={22} color="#10B981" />
              <Text className="text-green-500 font-black text-lg mt-1 tracking-tight">₹{studentFinancials.paid.toLocaleString()}</Text>
              <Text className="text-[8px] font-black text-green-600/60 uppercase tracking-widest mt-1">TOTAL PAID</Text>
            </View>
            <View className="flex-1 bg-brand-pink/5 dark:bg-brand-pink/10 p-5 rounded-[28px] border border-brand-pink/10 items-center">
              <MaterialCommunityIcons name="calendar-clock" size={22} color="#F472B6" />
              <Text className="text-brand-pink font-black text-lg mt-1 tracking-tight">Day {user?.fee_due_day || '5'}</Text>
              <Text className="text-[8px] font-black text-brand-pink/60 uppercase tracking-widest mt-1">DUE DATE</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Structure Section */}
      <View className="mb-6">
        <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary} mb-6 opacity-60`}>Fee Architecture</Text>
        {feeStructures
          .filter(fs => fs.category === user?.category)
          .map((fs, idx) => (
            <View 
              key={idx}
              className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50 shadow-sm'} p-6 rounded-[32px] mb-4 border flex-row items-center justify-between`}
            >
              <View className="flex-row items-center">
                <View className="bg-indigo-500/10 w-12 h-12 rounded-[18px] items-center justify-center mr-4">
                  <MaterialCommunityIcons name="layers-triple-outline" size={24} color="#6366F1" />
                </View>
                <View>
                  <Text className={`font-black ${colors.text} text-sm tracking-tight`}>{fs.name}</Text>
                  <Text className={`text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5`}>{fs.frequency}</Text>
                </View>
              </View>
              <Text className={`font-black ${colors.text} text-lg tracking-tighter`}>₹{fs.amount.toLocaleString()}</Text>
            </View>
          ))}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View className="px-6">
      {studentTransactions.length === 0 ? (
        <View className="items-center py-24 opacity-30">
          <MaterialCommunityIcons name="history" size={80} color={colors.textTertiary} />
          <Text className={`font-black uppercase tracking-[5px] ${colors.textTertiary} mt-4 text-xs text-center`}>No Transaction Logs</Text>
        </View>
      ) : (
        studentTransactions.map((tx, idx) => (
          <TouchableOpacity 
            key={idx}
            activeOpacity={0.95}
            onPress={() => handleDownload(tx)}
            className={`${isDark ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-white'} p-6 mb-6 border-2 rounded-[40px] shadow-2xl relative overflow-hidden`}
          >
            <View className="absolute top-0 right-0 opacity-10">
                <MaterialCommunityIcons name="finance" size={120} color="#10B981" />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-green-500 w-16 h-16 rounded-[24px] items-center justify-center mr-5 shadow-lg">
                  <MaterialCommunityIcons name="hand-coin-outline" size={32} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={`font-black ${colors.text} text-xl tracking-tighter mb-0.5`} numberOfLines={1}>{tx.name}</Text>
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary} opacity-60`}>{tx.date}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="font-black text-2xl tracking-tighter text-green-500">+ ₹{tx.amount.toLocaleString()}</Text>
                <View className="bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded-lg mt-1">
                  <Text className="text-[8px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">SUCCESS</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* ── Background Header Illustration ── */}
      <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
          colors={[appTheme === 'dark' ? '#4c1d95' : '#FEF2F2', colors.backgroundHex]}
          className="absolute inset-0"
        />
        <Image 
          source={require('../../assets/images/playschool_actions.png')} 
          style={{ width: '100%', height: '100%', opacity: appTheme === 'dark' ? 0.08 : 0.12, transform: [{ scale: 1.7 }, { translateY: -20 }] }}
          resizeMode="cover"
        />
        {/* Fading Edge Mask */}
        <LinearGradient
          colors={['transparent', colors.backgroundHex]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 }}
        />
      </View>

      <View className="flex-1">
        {/* Header */}
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="px-6 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className={`w-12 h-12 rounded-2xl items-center justify-center border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-brand-pink/10 shadow-sm'}`}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black tracking-tighter ${colors.text}`}>Finance</Text>
              <Text className="text-2xl font-bold text-brand-pink mt-[-4px]">Dashboard 💎</Text>
            </View>
            <View className="bg-brand-pink w-20 h-20 rounded-[28px] items-center justify-center border-4 border-white shadow-2xl rotate-3 overflow-hidden">
               <MaterialCommunityIcons name="bank" size={40} color="white" />
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Tab Selection */}
          <View className="flex-row gap-5 mb-10 px-6">
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setActiveTab('dashboard')}
              className={`flex-1 py-5 rounded-[28px] items-center justify-center border-2 shadow-2xl relative overflow-hidden ${activeTab === 'dashboard' ? 'bg-brand-pink border-brand-pink' : (isDark ? 'bg-white/5 border-white/5' : 'bg-white border-brand-pink/5')}`}
            >
              <Text className={`font-black text-[10px] uppercase tracking-[4px] leading-tight ${activeTab === 'dashboard' ? 'text-white' : colors.textSecondary}`}>WALLETS</Text>
              {activeTab === 'dashboard' && (
                  <View className="absolute top-[-10] right-[-10] opacity-20 rotate-12">
                      <MaterialCommunityIcons name="wallet-membership" size={60} color="white" />
                  </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-5 rounded-[28px] items-center justify-center border-2 shadow-2xl relative overflow-hidden ${activeTab === 'history' ? 'bg-brand-pink border-brand-pink' : (isDark ? 'bg-white/5 border-white/5' : 'bg-white border-brand-pink/5')}`}
            >
              <Text className={`font-black text-[10px] uppercase tracking-[4px] leading-tight ${activeTab === 'history' ? 'text-white' : colors.textSecondary}`}>HISTORY</Text>
              {activeTab === 'history' && (
                  <View className="absolute top-[-10] right-[-10] opacity-20 rotate-12">
                      <MaterialCommunityIcons name="clock-check" size={60} color="white" />
                  </View>
              )}
            </TouchableOpacity>
          </View>

          {activeTab === 'dashboard' ? renderDashboard() : renderHistory()}
          <View className="h-32" />
        </ScrollView>
      </View>

      {pdfLoading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
           <View className="bg-white dark:bg-[#1a1a18] p-10 rounded-[40px] items-center shadow-2xl">
              <ActivityIndicator color="#F472B6" size="large" />
              <Text className="text-gray-900 dark:text-white font-black mt-6 uppercase tracking-[4px] text-[10px]">Encrypting Invoice...</Text>
           </View>
        </View>
      )}
    </View>
  );
}
