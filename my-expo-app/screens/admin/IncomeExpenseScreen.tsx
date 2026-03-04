import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, FlatList, Platform, ActivityIndicator, Image, Modal,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, Transaction } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import ChoiceModal from '../../components/ChoiceModal';
import PremiumPopup from '../../components/PremiumPopup';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface IncomeExpenseScreenProps { navigation: NavigationProps; }

const ScreenHeader = ({ navigation, theme, colors }: { navigation: any, theme: string, colors: any }) => (
  <View className="mb-8">
    <View className="absolute top-0 left-0 right-0 h-[450px] overflow-hidden">
        <LinearGradient
            colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
            className="absolute inset-0"
        />
        <Image 
            source={require('../../assets/images/playschool_actions.png')} 
            style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.08 : 0.15, transform: [{ scale: 1.5 }, { translateY: -40 }] }}
            resizeMode="cover"
        />
    </View>
    
    <View className="flex-row items-center justify-between px-6 pt-12">
      <View className="flex-1">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/10'} w-14 h-14 rounded-2xl items-center justify-center border shadow-xl mb-6`}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
        </TouchableOpacity>
        <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>Finance</Text>
        <Text className="text-2xl font-black text-brand-pink mt-[-4px]">Intelligence 💎</Text>
      </View>
      <View className="bg-brand-pink w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden">
         <MaterialCommunityIcons name="finance" size={48} color="white" />
         <View className="absolute -bottom-2 -right-2 opacity-20">
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={60} color="white" />
         </View>
      </View>
    </View>
  </View>
);

const SummaryDashboard = ({ net, totalIncome, totalExpense, colors, theme, onPrint, pdfLoading, rupee }: any) => (
  <View className="px-6 mb-10 overflow-visible">
    <TouchableOpacity 
      activeOpacity={0.95}
      style={{ elevation: 15 }}
      className={`rounded-[48px] overflow-hidden shadow-2xl border-2 ${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-white'}`}
    >
        <LinearGradient
            colors={theme === 'dark' ? ['#25251d', '#1c1c14'] : ['#FFFFFF', '#F9FAFB']}
            className="p-8"
        >
            <View className="flex-row items-center justify-between mb-8">
                <View>
                    <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary} mb-2 opacity-70`}>GLOBAL NET LIQUIDITY</Text>
                    <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>{rupee(net)}</Text>
                </View>
                <TouchableOpacity 
                    onPress={onPrint} 
                    disabled={pdfLoading}
                    className="w-16 h-16 rounded-[22px] bg-brand-pink items-center justify-center shadow-xl shadow-brand-pink/30"
                >
                    {pdfLoading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="printer-eye" size={32} color="white" />}
                </TouchableOpacity>
            </View>

            <View className="flex-row gap-4 pt-8 border-t border-gray-100 dark:border-white/5">
                <View className="flex-1 bg-green-500/5 dark:bg-green-500/10 p-5 rounded-[28px] border border-green-500/10 items-center">
                    <MaterialCommunityIcons name="trending-up" size={22} color="#10B981" />
                    <Text className="text-green-500 font-black text-lg mt-1 tracking-tight">{rupee(totalIncome)}</Text>
                    <Text className="text-[8px] font-black text-green-600/60 uppercase tracking-widest mt-1">REVENUE</Text>
                </View>
                <View className="flex-1 bg-red-500/5 dark:bg-red-500/10 p-5 rounded-[28px] border border-red-500/10 items-center">
                    <MaterialCommunityIcons name="trending-down" size={22} color="#EF4444" />
                    <Text className="text-red-500 font-black text-lg mt-1 tracking-tight">{rupee(totalExpense)}</Text>
                    <Text className="text-[8px] font-black text-red-600/60 uppercase tracking-widest mt-1">EXPENSES</Text>
                </View>
            </View>
        </LinearGradient>
    </TouchableOpacity>
  </View>
);

// ─── Professional Date Picker (Matches App Theme) ──────────────────────────────────
function ProfDatePicker({ label, value, onChange, theme, colors }: {
  label: string; value: string; onChange: (v: string) => void; theme: string; colors: any;
}) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  return (
    <View style={{ flex: 1 }}>
      <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-2 ml-1`}>{label}</Text>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => setShow(true)}
        className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} p-4 rounded-2xl border flex-row items-center justify-between`}
      >
        <Text className={`font-black ${value ? colors.text : colors.textTertiary}`}>
          {value || 'Select Date'}
        </Text>
        <MaterialCommunityIcons name="calendar-edit" size={18} color="#F472B6" />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={(_, d) => {
            setShow(Platform.OS === 'ios');
            if (d) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              onChange(`${year}-${month}-${day}`);
            }
          }}
        />
      )}
    </View>
  );
}

const DropdownSelect = ({ label, value, options, onSelect, colors, theme, icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View className="mb-8 overflow-visible">
      <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary} mb-4 ml-1 opacity-60`}>{label}</Text>
      <TouchableOpacity 
        onPress={() => setIsOpen(true)}
        activeOpacity={0.9}
        className={`${theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/10'} p-6 rounded-[36px] border shadow-xl flex-row items-center justify-between`}
      >
        <View className="flex-row items-center">
          <View className={`w-14 h-14 rounded-[22px] items-center justify-center mr-4 shadow-sm ${value === 'income' ? 'bg-green-500/10' : (value === 'expense' ? 'bg-red-500/10' : 'bg-brand-pink/10')}`}>
            <MaterialCommunityIcons name={icon || "layers-outline"} size={28} color={value === 'income' ? '#10B981' : (value === 'expense' ? '#EF4444' : '#F472B6')} />
          </View>
          <View>
            <Text className={`text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5`}>Current Selection</Text>
            <Text className={`text-xl font-black ${value ? colors.text : colors.textTertiary} capitalize tracking-tighter`}>{value || 'Select Choice'}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={28} color={theme === 'dark' ? '#F472B6' : colors.textTertiary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setIsOpen(false)} className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className={`${theme === 'dark' ? 'bg-[#1a1a18]' : 'bg-white'} w-full rounded-[45px] p-8 shadow-2xl overflow-hidden`}>
            <View className="absolute top-0 right-0 opacity-10">
                <MaterialCommunityIcons name="format-list-bulleted-type" size={150} color={colors.text} />
            </View>
            <Text className={`text-2xl font-black ${colors.text} mb-8 text-center tracking-tighter`}>Select Ledger 📂</Text>
            {options.map((opt: any) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onSelect(opt.value); setIsOpen(false); }}
                className={`flex-row items-center p-5 rounded-[28px] mb-4 border-2 ${value === opt.value ? 'bg-brand-pink border-brand-pink shadow-lg shadow-brand-pink/30' : (theme === 'dark' ? 'bg-[#25251d] border-white/5' : 'bg-gray-50 border-transparent')}`}
              >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${value === opt.value ? 'bg-white/20' : 'bg-brand-pink/10'}`}>
                    <MaterialCommunityIcons name={opt.icon} size={24} color={value === opt.value ? 'white' : '#F472B6'} />
                </View>
                <Text className={`ml-4 font-black text-lg ${value === opt.value ? 'text-white' : colors.text} tracking-tight`}>{opt.label}</Text>
                {value === opt.value && (
                    <MaterialCommunityIcons name="check-circle" size={20} color="white" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity onPress={() => setIsOpen(false)} className="mt-4 items-center p-4">
                <Text className="font-black text-gray-400 uppercase tracking-[4px] text-[10px]">Cancel Action</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Next-Gen Form (Matches App Structure) ───────────────────────
const NewEntryForm = memo(({ theme, colors, onSubmit, isSubmitting, initialData, onCancel }: {
  theme: string; colors: any; onSubmit: (t: Omit<Transaction, 'id'>) => void; isSubmitting: boolean; 
  initialData?: Transaction | null; onCancel?: () => void;
}) => {
  const [name,     setName]     = useState(initialData?.name || '');
  const [amount,   setAmount]   = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [type,     setType]     = useState<'income' | 'expense'>(initialData?.type || 'income');
  const [date,     setDate]     = useState(initialData?.date || (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })());
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setType(initialData.type);
      setDate(initialData.date);
    }
  }, [initialData]);

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !amount || !category.trim()) {
      Alert.alert('Missing Fields', 'Please complete the details to post the entry.');
      return;
    }
    onSubmit({
      name:     name.trim(),
      amount:   parseFloat(amount),
      category: category.trim(),
      type,
      date,
    });
    if (!initialData) {
      setName(''); setAmount(''); setCategory('');
    }
  }, [name, amount, category, type, date, onSubmit, initialData]);

  return (
    <View style={{ flex: 1 }}>
      <DropdownSelect 
        label="Operational Channel"
        value={type}
        options={[
          { label: 'Asset Income', value: 'income', icon: 'trending-up' },
          { label: 'Liability Expense', value: 'expense', icon: 'trending-down' }
        ]}
        onSelect={setType}
        colors={colors}
        theme={theme}
        icon={type === 'income' ? 'trending-up' : 'trending-down'}
      />

      <View className={`${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-brand-pink/10'} rounded-[48px] p-8 border-2 shadow-2xl`}>
          <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary} mb-8 text-center opacity-60`}>
            INSTITUTIONAL LEDGER ENTRY
          </Text>

          <View className="mb-8">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-3 opacity-60`}>Audit Description</Text>
            <View className={`flex-row items-center p-6 rounded-[28px] ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'} border-2 shadow-sm`}>
                <MaterialCommunityIcons name="text-box-search-outline" size={24} color="#F472B6" style={{ marginRight: 15 }} />
                <TextInput 
                    value={name} onChangeText={setName} 
                    placeholder="Ex: Term Fees, Salary..." 
                    placeholderTextColor={theme === 'dark' ? '#333' : '#9CA3AF'}
                    className={`flex-1 text-xl font-black ${colors.text} tracking-tight`}
                />
            </View>
          </View>

          <View className="flex-row gap-5 mb-8">
            <View className="flex-1">
                <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-3 opacity-60`}>Value (₹)</Text>
                <View className={`p-6 rounded-[28px] ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'} border-2 shadow-sm`}>
                    <TextInput 
                        value={amount} onChangeText={setAmount} 
                        placeholder="0.00" 
                        keyboardType="numeric"
                        placeholderTextColor={theme === 'dark' ? '#333' : '#FBCFE8'}
                        className={`text-2xl font-black ${type === 'income' ? 'text-green-500' : 'text-red-500'} tracking-tighter`}
                    />
                </View>
            </View>
            <View className="flex-1">
                <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textTertiary} mb-3 opacity-60`}>Classification</Text>
                <TouchableOpacity 
                  onPress={() => setShowCategoryModal(true)}
                  className={`p-6 rounded-[28px] ${theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'} border-2 flex-row justify-between items-center shadow-sm`}
                >
                  <Text className={`font-black text-[10px] tracking-widest uppercase ${category ? colors.text : colors.textTertiary}`}>{category || 'TYPE'}</Text>
                  <MaterialCommunityIcons name="layers-triple-outline" size={20} color={theme === 'dark' ? '#F472B6' : colors.textTertiary} />
                </TouchableOpacity>
                <ChoiceModal
                  visible={showCategoryModal}
                  onClose={() => setShowCategoryModal(false)}
                  title="Entry Classification"
                  message="Select the strategic audit group for this ledger transaction."
                  iconName="layers-triple"
                  accentColor="#F472B6"
                  options={[
                    { label: 'Staff Salaries', icon: 'account-cash', onPress: () => setCategory('Salaries') },
                    { label: 'Fees Revenue', icon: 'school-outline', onPress: () => setCategory('Fees') },
                    { label: 'Utility & Maint', icon: 'hammer-wrench', onPress: () => setCategory('Maintenance') },
                    { label: 'Infrastructure', icon: 'office-building-marker', onPress: () => setCategory('Infrastructure') },
                    { label: 'Office Stationery', icon: 'pencil-ruler', onPress: () => setCategory('Stationery') },
                    { label: 'Other Audit', icon: 'dots-horizontal-circle', onPress: () => setCategory('Miscellaneous') },
                  ]}
                />
            </View>
          </View>

          <View className="mb-10">
            <ProfDatePicker label="Audit Date" value={date} onChange={setDate} theme={theme} colors={colors} />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={isSubmitting} 
            activeOpacity={0.85}
            className={`overflow-hidden rounded-[36px] shadow-2xl`}
            style={{ elevation: 15 }}
          >
            <LinearGradient
                colors={['#FBBF24', '#D97706']}
                className="py-8 items-center justify-center flex-row px-8"
            >
                {isSubmitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <MaterialCommunityIcons name={initialData ? "shield-sync-outline" : "plus-circle-outline"} size={32} color="white" />
                        <Text className="text-white font-black text-2xl ml-3 uppercase tracking-[4px] leading-none mt-1">
                            {initialData ? 'AUTHORIZE' : 'PUBLISH'}
                        </Text>
                    </>
                )}
            </LinearGradient>
          </TouchableOpacity>

          {initialData && (
             <TouchableOpacity onPress={onCancel} className="mt-8 items-center p-4">
                <Text className={`font-black ${colors.textTertiary} text-[11px] uppercase tracking-[5px] opacity-40`}>DISCARD CHANGES</Text>
             </TouchableOpacity>
          )}
      </View>
    </View>
  );
});

// ─── Daily Log Item (Matches Attendance Log Style) ───────────────────────────────────
const TxItem = memo(({ item, theme, colors, onDelete, onEdit, onPrint }: { item: Transaction; theme: string; colors: any; onDelete: (id: string) => void; onEdit: (t: Transaction) => void; onPrint?: (t: Transaction, mode: 'view' | 'download') => void; }) => (
    <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => onEdit(item)}
        style={{ elevation: 12 }}
        className={`${theme === 'dark' ? 'bg-[#1a1a18] border-gray-800' : 'bg-white border-white'} p-6 mb-6 border-2 rounded-[40px] shadow-2xl relative overflow-hidden`}
    >
        <View className="absolute top-0 right-0 opacity-10">
            <MaterialCommunityIcons name={item.type === 'income' ? 'finance' : 'bank-transfer-out'} size={120} color={item.type === 'income' ? '#10B981' : '#EF4444'} />
        </View>
        
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View className={`${item.type === 'income' ? 'bg-green-500' : 'bg-red-500'} w-16 h-16 rounded-[24px] items-center justify-center mr-5 shadow-lg relative`}>
                    <MaterialCommunityIcons name={item.type === 'income' ? 'arrow-down-bold-circle' : 'arrow-up-bold-circle'} size={38} color="white" />
                </View>
                <View className="flex-1">
                    <Text className={`font-black ${colors.text} text-xl tracking-tighter mb-0.5`} numberOfLines={1}>{item.name}</Text>
                    <View className="flex-row items-center">
                        <View className={`${item.type === 'income' ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'} px-3 py-1 rounded-lg`}>
                            <Text className={`text-[9px] font-black uppercase tracking-widest ${item.type === 'income' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{item.category}</Text>
                        </View>
                        <View className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-3" />
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary} opacity-60`}>{item.date}</Text>
                    </View>
                </View>
            </View>
            
            <View className="items-end ml-2">
                <Text className={`font-black text-2xl tracking-tighter ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                </Text>
                <View className="flex-row mt-3 gap-2">
                    <TouchableOpacity 
                        onPress={() => onEdit(item)} 
                        className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-xl items-center justify-center border border-gray-200 dark:border-white/10"
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={theme === 'dark' ? '#9CA3AF' : '#4B5563'} />
                    </TouchableOpacity>
                    {item.category === 'Fees' && item.type === 'income' && onPrint && (
                      <>
                        <TouchableOpacity 
                            onPress={() => onPrint(item, 'view')} 
                            className="w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center shadow-md shadow-indigo-500/20"
                        >
                            <MaterialCommunityIcons name="printer-outline" size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => onPrint(item, 'download')} 
                            className="w-10 h-10 bg-brand-pink rounded-xl items-center justify-center shadow-md shadow-brand-pink/20"
                        >
                            <MaterialCommunityIcons name="share-variant-outline" size={18} color="white" />
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity 
                        onPress={() => onDelete(item.id)} 
                        className="w-10 h-10 bg-red-500 rounded-xl items-center justify-center shadow-md shadow-red-500/20"
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </TouchableOpacity>
));

export default function IncomeExpenseScreen({ navigation }: IncomeExpenseScreenProps) {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, users, fees, fetchData } = useAuth();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab,    setActiveTab]    = useState<'history' | 'entry'>('history');
  const [editingItem,  setEditingItem]  = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState<'all' | 'income' | 'expense'>('all');
  const [pdfLoading,   setPdfLoading]   = useState(false);

  const generateInvoiceHtml = (item: any) => `
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
          <div class="row"><span class="label">Payment Date</span><span class="value">${item.date}</span></div>
          <div class="row" style="margin-top: 20px;"><span class="label">Reference</span><span class="value" style="font-size: 18px;">${item.name}</span></div>
          <div class="row"><span class="label">Classification</span><span class="value">${item.category}</span></div>
        </div>
        <div class="amount-box">
            <div class="amount-value">₹${item.amount.toLocaleString('en-IN')}</div>
        </div>
        <div class="footer">Computer Generated Document • Issued on ${new Date().toLocaleDateString()}</div>
      </body>
    </html>
  `;

  const handleInvoiceAction = async (item: Transaction, mode: 'view' | 'download') => {
    try {
      setPdfLoading(true);
      const html = generateInvoiceHtml(item);
      if (mode === 'view') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (err) {
      Alert.alert('PDF Error', 'Action could not be completed.');
    } finally {
      setPdfLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (fromDate) list = list.filter(t => t.date >= fromDate);
    if (toDate)   list = list.filter(t => t.date <= toDate);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, typeFilter, fromDate, toDate]);

  const [statusModal, setStatusModal] = useState({ visible: false, title: '', message: '', type: 'info' as 'success' | 'info' | 'error' | 'action' });

  const totalIncome  = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t)  => s + parseFloat(t.amount as any || 0), 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount as any || 0), 0), [filtered]);
  const net          = totalIncome - totalExpense;

  const handleApplyAction = useCallback(async (data: Omit<Transaction, 'id'>) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateTransaction(editingItem.id, data);
        setStatusModal({
          visible: true,
          title: 'Updated ✅',
          message: 'The transaction record has been successfully updated in the school audit log.',
          type: 'success'
        });
      } else {
        await addTransaction({ ...data, id: Date.now().toString() });
        setStatusModal({
          visible: true,
          title: 'Posted 🚀',
          message: 'New transaction has been recorded and verified in the ledger.',
          type: 'success'
        });
      }
      setEditingItem(null);
      setActiveTab('history');
    } catch (err) {
      console.error('Transaction Action Error:', err);
      setStatusModal({
        visible: true,
        title: 'Error ❌',
        message: 'Failed to save the transaction to the database. Please check your connection.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [addTransaction, updateTransaction, editingItem]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Record?', 'Are you sure you want to remove this entry from the database? 🗑️', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteTransaction(id);
          Alert.alert('Deleted', 'Record removed successfully.');
        } catch (err) {
          Alert.alert('Error', 'Failed to delete record.');
        }
      }},
    ]);
  }, [deleteTransaction]);

  const handleEdit = useCallback((t: Transaction) => {
    setEditingItem(t);
    setActiveTab('entry');
  }, []);

  const generatePDF = useCallback(async () => {
    setPdfLoading(true);
    const html = `
      <html><body style="font-family: sans-serif; padding: 40px; color: #1F2937;">
        <h1 style="color:#F472B6; text-align:center; font-size:32px; font-weight:900;">Academic Financial Audit</h1>
        <hr style="border:0; border-top:2px solid #E5E7EB; margin:20px 0;"/>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px; margin:40px 0;">
          <div style="background:#f0fdf4; padding:24px; border-radius:16px; border:1px solid #bbf7d0; text-align:center;">
            <div style="font-size:10px; font-weight:900; color:#166534; text-transform:uppercase; letter-spacing:2px;">Total Income</div>
            <div style="font-size:24px; font-weight:900; color:#14532D; margin-top:8px;">₹${totalIncome.toLocaleString()}</div>
          </div>
          <div style="background:#fef2f2; padding:24px; border-radius:16px; border:1px solid #fecaca; text-align:center;">
             <div style="font-size:10px; font-weight:900; color:#991b1b; text-transform:uppercase; letter-spacing:2px;">Total Expense</div>
             <div style="font-size:24px; font-weight:900; color:#7f1d1d; margin-top:8px;">₹${totalExpense.toLocaleString()}</div>
          </div>
          <div style="background:#eff6ff; padding:24px; border-radius:16px; border:1px solid #bfdbfe; text-align:center;">
             <div style="font-size:10px; font-weight:900; color:#1e40af; text-transform:uppercase; letter-spacing:2px;">Net Balance</div>
             <div style="font-size:24px; font-weight:900; color:#1e3a8a; margin-top:8px;">₹${net.toLocaleString()}</div>
          </div>
        </div>
        <table style="width:100%; border-collapse:collapse; margin-top:40px;">
          <tr style="background:#F9FAFB; text-align:left; border-bottom:2px solid #E5E7EB;">
            <th style="padding:16px; font-size:10px; font-weight:900; color:#9CA3AF; text-transform:uppercase;">Date</th>
            <th style="padding:16px; font-size:10px; font-weight:900; color:#9CA3AF; text-transform:uppercase;">Description</th>
            <th style="padding:16px; font-size:10px; font-weight:900; color:#9CA3AF; text-transform:uppercase;">Type</th>
            <th style="padding:16px; font-size:10px; font-weight:900; color:#9CA3AF; text-transform:uppercase; text-align:right;">Amount</th>
          </tr>
          ${filtered.map(t => `<tr style="border-bottom:1px solid #F3F4F6;">
            <td style="padding:16px; font-weight:700;">${t.date}</td>
            <td style="padding:16px; font-weight:700;">${t.name}<br/><span style="font-size:10px; color:#9CA3AF; font-weight:400;">${t.category.toUpperCase()}</span></td>
            <td style="padding:16px; font-weight:900; color:${t.type === 'income' ? '#10B981' : '#EF4444'};">${t.type.toUpperCase()}</td>
            <td style="padding:16px; font-weight:900; text-align:right;">₹${t.amount.toLocaleString()}</td>
          </tr>`).join('')}
        </table>
        <div style="margin-top:60px; text-align:center; font-size:10px; color:#9CA3AF; font-weight:900; letter-spacing:2px; text-transform:uppercase;">
           Official Institutional Document • Generated ${new Date().toLocaleDateString()}
        </div>
      </body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch { Alert.alert('Error', 'Audit report generation failed.'); }
    finally { setPdfLoading(false); }
  }, [filtered, totalIncome, totalExpense, net]);

  const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const renderTabSelector = () => (
    <View className="flex-row gap-5 mb-10 px-6">
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => { setActiveTab('history'); setEditingItem(null); }}
        className={`flex-1 py-5 rounded-[28px] items-center justify-center border-2 shadow-2xl relative overflow-hidden ${activeTab === 'history' ? 'bg-brand-pink border-brand-pink' : (theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/5')}`}
      >
        <Text className={`font-black text-[10px] uppercase tracking-[4px] leading-tight ${activeTab === 'history' ? 'text-white' : colors.textSecondary}`}>REGISTRY</Text>
        {activeTab === 'history' && (
            <View className="absolute top-[-10] right-[-10] opacity-20 rotate-12">
                <MaterialCommunityIcons name="database-check" size={60} color="white" />
            </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => setActiveTab('entry')}
        className={`flex-1 py-5 rounded-[28px] items-center justify-center border-2 shadow-2xl relative overflow-hidden ${activeTab === 'entry' ? 'bg-brand-pink border-brand-pink' : (theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-white border-brand-pink/5')}`}
      >
        <Text className={`font-black text-[10px] uppercase tracking-[4px] leading-tight ${activeTab === 'entry' ? 'text-white' : colors.textSecondary}`}>{editingItem ? 'UPDATE' : 'POST ENTRY'}</Text>
        {activeTab === 'entry' && (
            <View className="absolute top-[-10] right-[-10] opacity-20 rotate-12">
                <MaterialCommunityIcons name="pencil-plus" size={60} color="white" />
            </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}>
      
      {activeTab === 'history' ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View className="px-6">
                <TxItem item={item} theme={theme} colors={colors} onDelete={handleDelete} onEdit={handleEdit} onPrint={handleInvoiceAction} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <View>
               <ScreenHeader navigation={navigation} theme={theme} colors={colors} />
               <SummaryDashboard 
                  net={net} 
                  totalIncome={totalIncome} 
                  totalExpense={totalExpense} 
                  colors={colors} 
                  theme={theme} 
                  onPrint={generatePDF} 
                  pdfLoading={pdfLoading} 
                  rupee={rupee} 
               />
               {renderTabSelector()}
               <View className="px-6 mb-10">
                  <Text className={`text-[10px] font-black uppercase tracking-[4px] ${colors.textTertiary} mb-6 opacity-60`}>Ledger Intelligence Filter</Text>
                  <View className="flex-row gap-5 mb-8">
                      <ProfDatePicker label="COMMENCEMENT" value={fromDate} onChange={setFromDate} theme={theme} colors={colors} />
                      <ProfDatePicker label="TERMINATION" value={toDate} onChange={setToDate} theme={theme} colors={colors} />
                  </View>

                  <View className="flex-row items-center gap-3">
                    {(['all', 'income', 'expense'] as const).map(f => (
                      <TouchableOpacity 
                        key={f} 
                        activeOpacity={0.8}
                        onPress={() => setTypeFilter(f)}
                        className={`py-4 px-6 rounded-2xl border-2 ${typeFilter === f ? 'bg-brand-pink/10 border-brand-pink' : (theme === 'dark' ? 'bg-[#25251d] border-gray-800' : 'bg-gray-50 border-gray-100')}`}
                      >
                        <Text className={`font-black text-[10px] uppercase tracking-widest ${typeFilter === f ? 'text-brand-pink' : colors.textSecondary}`}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                    {(fromDate || toDate || typeFilter !== 'all') && (
                      <TouchableOpacity 
                        onPress={() => { setFromDate(''); setToDate(''); setTypeFilter('all'); }}
                        className="ml-auto w-14 h-14 border-2 border-red-500/20 bg-red-500/5 rounded-2xl items-center justify-center shadow-sm"
                      >
                        <MaterialCommunityIcons name="refresh" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
               </View>

               <View className="px-6 mb-6">
                  <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Transaction Logs</Text>
                  <Text className="text-[10px] font-black uppercase tracking-[3px] text-brand-pink mt-1">Audit Trail Active</Text>
               </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-24 opacity-30 px-6">
               <View className="bg-gray-100 dark:bg-white/5 p-12 rounded-[50px] mb-8">
                  <MaterialCommunityIcons name="database-off-outline" size={80} color={colors.textTertiary} />
               </View>
               <Text className={`font-black uppercase tracking-[5px] ${colors.textTertiary} text-center text-sm px-10`}>NO FINANCIAL DATA RETRIEVED</Text>
            </View>
          }
        />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
           <ScreenHeader navigation={navigation} theme={theme} colors={colors} />
           <SummaryDashboard 
              net={net} 
              totalIncome={totalIncome} 
              totalExpense={totalExpense} 
              colors={colors} 
              theme={theme} 
              onPrint={generatePDF} 
              pdfLoading={pdfLoading} 
              rupee={rupee} 
           />
           {renderTabSelector()}
           <View className="px-6">
             <NewEntryForm 
                theme={theme} 
                colors={colors}
                onSubmit={handleApplyAction} 
                isSubmitting={isSubmitting} 
                initialData={editingItem}
                onCancel={() => { setEditingItem(null); setActiveTab('history'); }} 
             />
           </View>
        </ScrollView>
      )}

       {(isSubmitting || pdfLoading) && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
             <View className="bg-white dark:bg-[#1a1a18] p-10 rounded-[40px] items-center shadow-2xl">
                <ActivityIndicator color="#F472B6" size="large" />
                <Text className="text-gray-900 dark:text-white font-black mt-6 uppercase tracking-[4px] text-[10px]">Processing Protocol...</Text>
             </View>
          </View>
      )}

      <PremiumPopup
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ ...statusModal, visible: false })}
        buttonText="Acknowledge"
      />
    </View>
  );
}
