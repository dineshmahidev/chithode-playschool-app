import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, FlatList, Platform, ActivityIndicator, Image, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, Transaction } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface IncomeExpenseScreenProps { navigation: NavigationProps; }

// ─── Professional Header Component ───────────────────────────────────
const ScreenHeader = ({ navigation, theme, colors }: { navigation: any, theme: string, colors: any }) => (
  <View className="flex-row items-center justify-between mb-6">
    <View>
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        className={`mb-4 ${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} w-12 h-12 rounded-2xl items-center justify-center border shadow-sm`}
      >
        <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
      </TouchableOpacity>
      <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>School</Text>
      <Text className="text-2xl font-bold text-brand-pink tracking-tight">Finance Audit 💎</Text>
    </View>
    <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
       <MaterialCommunityIcons name="finance" size={48} color="white" />
    </View>
  </View>
);

// ─── Balance Summary Card Component ──────────────────────────────────
const SummaryDashboard = ({ net, totalIncome, totalExpense, colors, theme, onPrint, pdfLoading, rupee }: any) => (
  <View className="mb-8 mt-2">
      <View className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} rounded-[40px] p-8 border shadow-xl`}>
          <View className="flex-row items-center justify-between mb-8">
              <View>
                  <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-1`}>Total Net Balance</Text>
                  <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>{rupee(net)}</Text>
              </View>
              <TouchableOpacity 
                onPress={onPrint} 
                disabled={pdfLoading}
                className="w-16 h-16 rounded-2xl bg-brand-pink items-center justify-center shadow-lg shadow-brand-pink/20"
              >
                  {pdfLoading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="file-chart" size={32} color="white" />}
              </TouchableOpacity>
          </View>

          <View className="flex-row justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <View className="items-center">
                  <Text className="text-green-500 font-black text-xl">{rupee(totalIncome)}</Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Total Revenue</Text>
              </View>
              <View className="items-center">
                  <Text className="text-red-500 font-black text-xl">{rupee(totalExpense)}</Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${colors.textTertiary}`}>Total Expenses</Text>
              </View>
          </View>
      </View>
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
    <View className="mb-6">
      <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-2 ml-1`}>{label}</Text>
      <TouchableOpacity 
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} p-4 rounded-2xl border flex-row items-center justify-between shadow-sm`}
      >
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${value === 'income' ? 'bg-green-500/10' : (value === 'expense' ? 'bg-red-500/10' : 'bg-brand-pink/10')}`}>
            <MaterialCommunityIcons name={icon || "layers-outline"} size={18} color={value === 'income' ? '#10B981' : (value === 'expense' ? '#EF4444' : '#F472B6')} />
          </View>
          <Text className={`font-black ${value ? colors.text : colors.textTertiary} capitalize`}>{value || 'Select'}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setIsOpen(false)} className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className={`${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} w-full rounded-[32px] p-6 shadow-2xl`}>
            <Text className={`text-xl font-black ${colors.text} mb-4 text-center`}>Select {label}</Text>
            {options.map((opt: any) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onSelect(opt.value); setIsOpen(false); }}
                className={`flex-row items-center p-4 rounded-2xl mb-2 ${value === opt.value ? 'bg-brand-pink' : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100')}`}
              >
                <MaterialCommunityIcons name={opt.icon} size={20} color={value === opt.value ? 'white' : colors.textTertiary} />
                <Text className={`ml-3 font-black ${value === opt.value ? 'text-white' : colors.text}`}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
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
        label="Transaction Type"
        value={type}
        options={[
          { label: 'Income', value: 'income', icon: 'trending-up' },
          { label: 'Expense', value: 'expense', icon: 'trending-down' }
        ]}
        onSelect={setType}
        colors={colors}
        theme={theme}
        icon={type === 'income' ? 'trending-up' : 'trending-down'}
      />

      <View className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} rounded-[40px] p-8 border shadow-xl`}>
          <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-6 text-center`}>
            Transaction Entry
          </Text>

          <View className="mb-6">
            <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-2`}>Description</Text>
            <TextInput 
                value={name} onChangeText={setName} 
                placeholder="Ex: Tuition Fees" 
                placeholderTextColor={theme === 'dark' ? '#4b4b4b' : '#E5E7EB'}
                className={`text-xl font-black ${colors.text}`}
            />
            <View className="h-[1px] bg-gray-100 dark:bg-gray-800 mt-2" />
          </View>

          <View className="flex-row gap-6 mb-6">
            <View className="flex-1">
                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-2`}>Amount (₹)</Text>
                <TextInput 
                    value={amount} onChangeText={setAmount} 
                    placeholder="0.00" 
                    keyboardType="numeric"
                    placeholderTextColor={theme === 'dark' ? '#4b4b4b' : '#E5E7EB'}
                    className={`text-2xl font-black ${type === 'income' ? 'text-green-500' : 'text-red-500'}`}
                />
                <View className="h-[1px] bg-gray-100 dark:bg-gray-800 mt-2" />
            </View>
            <View className="flex-1">
                <Text className={`text-[10px] font-black uppercase tracking-[2px] ${colors.textTertiary} mb-2`}>Category</Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert('Pick Category', 'Select transaction classification', [
                    { text: 'Salaries', onPress: () => setCategory('Salaries') },
                    { text: 'Fees Revenue', onPress: () => setCategory('Fees') },
                    { text: 'Maintenance', onPress: () => setCategory('Maintenance') },
                    { text: 'Stationery', onPress: () => setCategory('Stationery') },
                    { text: 'Other', onPress: () => setCategory('Miscellaneous') },
                    { text: 'Cancel', style: 'cancel' }
                  ])}
                  className={`p-3 rounded-2xl border ${colors.border} flex-row justify-between items-center`}
                >
                  <Text className={`font-black text-xs ${category ? colors.text : colors.textTertiary}`}>{category || 'Select Type'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8">
            <ProfDatePicker label="Date Selection" value={date} onChange={setDate} theme={theme} colors={colors} />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={isSubmitting} 
            activeOpacity={0.8}
            className={`bg-brand-pink py-6 rounded-[28px] items-center justify-center flex-row shadow-lg shadow-brand-pink/30`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name={initialData ? "sync" : "plus-circle"} size={22} color="white" />
                <Text className="text-white font-black text-lg ml-2 uppercase tracking-widest">{initialData ? 'Update Record' : 'Post Transaction'}</Text>
              </>
            )}
          </TouchableOpacity>

          {initialData && (
             <TouchableOpacity onPress={onCancel} className="mt-4 items-center">
                <Text className={`font-black ${colors.textTertiary} text-[10px] uppercase tracking-widest`}>Cancel Editing</Text>
             </TouchableOpacity>
          )}
      </View>
    </View>
  );
});

// ─── Daily Log Item (Matches Attendance Log Style) ───────────────────────────────────
const TxItem = memo(({ item, theme, colors, onDelete, onEdit }: { item: Transaction; theme: string; colors: any; onDelete: (id: string) => void; onEdit: (t: Transaction) => void; }) => (
    <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => onEdit(item)}
        className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100'} p-5 mb-4 border rounded-[32px] shadow-sm`}
    >
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
                <View className={`${item.type === 'income' ? 'bg-green-500' : 'bg-red-500'} w-14 h-14 rounded-[20px] items-center justify-center mr-4 shadow-sm`}>
                    <MaterialCommunityIcons name={item.type === 'income' ? 'arrow-down-bold' : 'arrow-up-bold'} size={28} color="white" />
                </View>
                <View>
                    <Text className={`font-black ${colors.text} text-base mb-0.5`}>{item.name}</Text>
                    <View className="flex-row items-center">
                        <View className={`${item.type === 'income' ? 'bg-green-50' : 'bg-red-50'} px-2 py-0.5 rounded-md`}>
                            <Text className={`text-[8px] font-black uppercase tracking-widest ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{item.category}</Text>
                        </View>
                        <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                        <Text className={`text-[10px] font-black uppercase ${colors.textTertiary}`}>{item.date}</Text>
                    </View>
                </View>
            </View>
            
            <View className="items-end">
                <Text className={`font-black text-lg ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.type === 'income' ? '+' : '-'} ₹{item.amount.toLocaleString()}
                </Text>
                <View className="flex-row mt-2">
                    <TouchableOpacity onPress={() => onEdit(item)} className="mr-3">
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item.id)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#F87171" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </TouchableOpacity>
));

export default function IncomeExpenseScreen({ navigation }: IncomeExpenseScreenProps) {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useAuth();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab,    setActiveTab]    = useState<'history' | 'entry'>('history');
  const [editingItem,  setEditingItem]  = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState<'all' | 'income' | 'expense'>('all');
  const [pdfLoading,   setPdfLoading]   = useState(false);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (fromDate) list = list.filter(t => t.date >= fromDate);
    if (toDate)   list = list.filter(t => t.date <= toDate);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, typeFilter, fromDate, toDate]);

  const totalIncome  = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t)  => s + parseFloat(t.amount as any || 0), 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount as any || 0), 0), [filtered]);
  const net          = totalIncome - totalExpense;

  const handleApplyAction = useCallback(async (data: Omit<Transaction, 'id'>) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateTransaction(editingItem.id, data);
        Alert.alert('Updated ✅', 'The transaction record has been updated.');
      } else {
        await addTransaction({ ...data, id: Date.now().toString() });
        Alert.alert('Posted 🚀', 'New transaction has been recorded.');
      }
      setEditingItem(null);
      setActiveTab('history');
    } catch (err) {
      console.error('Transaction Action Error:', err);
      Alert.alert('Error ❌', 'Failed to save the transaction.');
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
    <View className="flex-row gap-4 mb-6">
      <TouchableOpacity 
        onPress={() => { setActiveTab('history'); setEditingItem(null); }}
        className={`flex-1 py-4 rounded-[24px] items-center justify-center border shadow-sm ${activeTab === 'history' ? 'bg-brand-pink border-brand-pink shadow-brand-pink/20' : (theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100')}`}
      >
        <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'history' ? 'text-white' : colors.textSecondary}`}>Records Log</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setActiveTab('entry')}
        className={`flex-1 py-4 rounded-[24px] items-center justify-center border shadow-sm ${activeTab === 'entry' ? 'bg-brand-pink border-brand-pink shadow-brand-pink/20' : (theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100')}`}
      >
        <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'entry' ? 'text-white' : colors.textSecondary}`}>{editingItem ? 'Edit Entry' : 'Manual Entry'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF', paddingTop: insets.top }}>
      
      {activeTab === 'history' ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TxItem item={item} theme={theme} colors={colors} onDelete={handleDelete} onEdit={handleEdit} />
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          ListHeaderComponent={
            <View className="pt-4">
               {/* Rollable Header */}
               <ScreenHeader navigation={navigation} theme={theme} colors={colors} />
               
               {/* Rollable Dashboard */}
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

               {/* Rollable Tab Selector */}
               {renderTabSelector()}

               {/* Rollable Filters */}
               <View className="mb-6">
                  <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-4`}>Filter Records</Text>
                  <View className="flex-row gap-4 mb-6">
                      <ProfDatePicker label="From Date" value={fromDate} onChange={setFromDate} theme={theme} colors={colors} />
                      <ProfDatePicker label="To Date" value={toDate} onChange={setToDate} theme={theme} colors={colors} />
                  </View>

                  <View className="flex-row gap-3">
                    {(['all', 'income', 'expense'] as const).map(f => (
                      <TouchableOpacity 
                        key={f} 
                        onPress={() => setTypeFilter(f)}
                        className={`py-3 px-6 rounded-2xl border ${typeFilter === f ? 'bg-brand-pink/10 border-brand-pink' : (theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-100')}`}
                      >
                        <Text className={`font-black text-[10px] uppercase tracking-widest ${typeFilter === f ? 'text-brand-pink' : colors.textSecondary}`}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                    {(fromDate || toDate || typeFilter !== 'all') && (
                      <TouchableOpacity 
                        onPress={() => { setFromDate(''); setToDate(''); setTypeFilter('all'); }}
                        className="ml-auto w-10 h-10 border border-red-100 bg-red-50 rounded-xl items-center justify-center"
                      >
                        <MaterialCommunityIcons name="refresh" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
               </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-20 opacity-30">
               <MaterialCommunityIcons name="database-off-outline" size={64} color={colors.textTertiary} />
               <Text className={`font-black uppercase tracking-[3px] mt-4 ${colors.textTertiary} text-center`}>No Financial Records</Text>
            </View>
          }
        />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 100 }}
        >
           <ScreenHeader navigation={navigation} theme={theme} colors={colors} />
           {renderTabSelector()}
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
           <NewEntryForm 
              theme={theme} 
              colors={colors}
              onSubmit={handleApplyAction} 
              isSubmitting={isSubmitting} 
              initialData={editingItem}
              onCancel={() => { setEditingItem(null); setActiveTab('history'); }} 
           />
        </ScrollView>
      )}
    </View>
  );
}
