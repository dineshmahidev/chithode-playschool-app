import React, { useState, memo, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, FlatList, Modal, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, Transaction } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface NavigationProps { navigate: (screen: string) => void; goBack: () => void; }
interface IncomeExpenseScreenProps { navigation: NavigationProps; }

// ─── Tiny date input (YYYY-MM-DD) ─────────────────────────────────────────────
// ─── DD / MM / YYYY box date picker ─────────────────────────────────────────
function MiniDatePicker({ label, value, onChange, theme }: {
  label: string; value: string; onChange: (v: string) => void; theme: string;
}) {
  // value is YYYY-MM-DD, parse back for display
  const parts = value ? value.split('-') : ['', '', ''];
  const [day,   setDay]   = useState(parts[2] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [year,  setYear]  = useState(parts[0] || '');

  const commit = (d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`);
    } else if (!d && !m && !y) {
      onChange('');
    }
  };

  const box: any = {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 11,
    textAlign: 'center', fontSize: 13, fontWeight: '700',
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: value ? '#F472B6' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
        color: value ? '#F472B6' : '#9CA3AF', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <TextInput style={{ ...box, flex: 1 }} placeholder="DD" placeholderTextColor="#9CA3AF"
          keyboardType="numeric" maxLength={2} value={day}
          onChangeText={v => { setDay(v); commit(v, month, year); }} />
        <TextInput style={{ ...box, flex: 1.1 }} placeholder="MM" placeholderTextColor="#9CA3AF"
          keyboardType="numeric" maxLength={2} value={month}
          onChangeText={v => { setMonth(v); commit(day, v, year); }} />
        <TextInput style={{ ...box, flex: 2 }} placeholder="YYYY" placeholderTextColor="#9CA3AF"
          keyboardType="numeric" maxLength={4} value={year}
          onChangeText={v => { setYear(v); commit(day, month, v); }} />
      </View>
    </View>
  );
}

// ─── Isolated New Entry Form (memo — fixes render loop) ───────────────────────
const NewEntryForm = memo(({ theme, colors, onSubmit, isSubmitting }: {
  theme: string; colors: any; onSubmit: (t: Omit<Transaction, 'id'>) => void; isSubmitting: boolean;
}) => {
  const [name,     setName]     = useState('');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('');
  const [type,     setType]     = useState<'income' | 'expense'>('income');

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !amount || !category.trim()) {
      Alert.alert('Missing Fields', 'Please fill all fields');
      return;
    }
    onSubmit({
      name:     name.trim(),
      amount:   parseFloat(amount),
      category: category.trim(),
      type,
      date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
    });
    setName(''); setAmount(''); setCategory('');
  }, [name, amount, category, type, onSubmit]);

  const inp: any = {
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, fontWeight: '700',
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };

  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 20, paddingBottom: 60 }}>

      {/* Income / Expense toggle */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => setType('income')}
          style={{
            flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            backgroundColor: type === 'income' ? '#10B981' : (theme === 'dark' ? '#1e1e1c' : '#F9FAFB'),
            borderWidth: 2, borderColor: type === 'income' ? '#10B981' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
          }}>
          <MaterialCommunityIcons name="arrow-bottom-left" size={20}
            color={type === 'income' ? 'white' : '#10B981'} />
          <Text style={{ fontWeight: '900', color: type === 'income' ? 'white' : '#10B981' }}>INCOME</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => setType('expense')}
          style={{
            flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            backgroundColor: type === 'expense' ? '#EF4444' : (theme === 'dark' ? '#1e1e1c' : '#F9FAFB'),
            borderWidth: 2, borderColor: type === 'expense' ? '#EF4444' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
          }}>
          <MaterialCommunityIcons name="arrow-top-right" size={20}
            color={type === 'expense' ? 'white' : '#EF4444'} />
          <Text style={{ fontWeight: '900', color: type === 'expense' ? 'white' : '#EF4444' }}>EXPENSE</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
        color: '#9CA3AF', marginBottom: 8 }}>Description *</Text>
      <TextInput style={{ ...inp, marginBottom: 16 }} placeholder="e.g. Monthly Rent"
        placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8 }}>Amount (₹) *</Text>
          <TextInput style={inp} placeholder="0.00" placeholderTextColor="#9CA3AF"
            keyboardType="numeric" value={amount} onChangeText={setAmount} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8 }}>Category *</Text>
          <TextInput style={inp} placeholder="e.g. Utility" placeholderTextColor="#9CA3AF"
            value={category} onChangeText={setCategory} />
        </View>
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}
        style={{
          backgroundColor: type === 'income' ? '#10B981' : '#EF4444',
          paddingVertical: 20, borderRadius: 22, alignItems: 'center',
          flexDirection: 'row', justifyContent: 'center',
          shadowColor: type === 'income' ? '#10B981' : '#EF4444',
          shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
          marginTop: 8,
        }}>
        {isSubmitting ? <ActivityIndicator color="white" /> : (
          <>
            <MaterialCommunityIcons name="plus-circle" size={22} color="white" />
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginLeft: 10 }}>
              Save Transaction
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
});

// ─── History item ──────────────────────────────────────────────────────────────
const TxItem = memo(({ item, colors, theme, onDelete }: { item: Transaction; colors: any; theme: string; onDelete: (id: string) => void }) => (
  <View style={{
    backgroundColor: theme === 'dark' ? '#1a1a18' : '#fff',
    borderRadius: 20, marginBottom: 10, overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: item.type === 'income'
      ? (theme === 'dark' ? '#064e3b' : '#D1FAE5')
      : (theme === 'dark' ? '#450a0a' : '#FEE2E2'),
  }}>
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
      backgroundColor: item.type === 'income' ? '#10B981' : '#EF4444' }} />
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingLeft: 18 }}>
      <View style={{
        width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2',
      }}>
        <MaterialCommunityIcons name={item.type === 'income' ? 'arrow-bottom-left' : 'arrow-top-right'}
          size={22} color={item.type === 'income' ? '#10B981' : '#EF4444'} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontWeight: '900', fontSize: 14, color: theme === 'dark' ? '#fff' : '#111' }}>
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>{item.category}</Text>
          <View style={{ width: 3, height: 3, borderRadius: 99, backgroundColor: '#D1D5DB', marginHorizontal: 6 }} />
          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>{item.date}</Text>
        </View>
      </View>
      <Text style={{ fontWeight: '900', fontSize: 16,
        color: item.type === 'income' ? '#10B981' : '#EF4444' }}>
        {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
      </Text>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={{ marginLeft: 10, padding: 4 }}>
        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FCA5A5" />
      </TouchableOpacity>
    </View>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IncomeExpenseScreen({ navigation }: IncomeExpenseScreenProps) {
  const { transactions, addTransaction, deleteTransaction } = useAuth();
  const { colors, theme } = useTheme();

  const [activeTab,    setActiveTab]    = useState<'entry' | 'history'>('history');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState<'all' | 'income' | 'expense'>('all');
  const [pdfLoading,   setPdfLoading]   = useState(false);

  // ── Filtered data ──
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

  // ── Add ──
  const handleAddSubmit = useCallback(async (data: Omit<Transaction, 'id'>) => {
    setIsSubmitting(true);
    try {
      await addTransaction({ ...data, id: Date.now().toString() });
      setActiveTab('history');
      Alert.alert('Saved! ✅', 'Transaction recorded.');
    } catch {
      Alert.alert('Error', 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }, [addTransaction]);

  // ── Delete ──
  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteTransaction(id);
          Alert.alert('Success', 'Transaction deleted successfully! 🗑️');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete transaction.');
        }
      }},
    ]);
  }, [deleteTransaction]);

  // ── PDF with current filters ──
  const generatePDF = useCallback(async () => {
    setPdfLoading(true);
    const periodLabel = fromDate || toDate
      ? `Period: ${fromDate || 'Start'} → ${toDate || 'Now'}`
      : 'All Time';
    const html = `
      <html><head><style>
        body { font-family: Helvetica, sans-serif; padding: 40px; color: #1F2937; margin: 0; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #F472B6; padding-bottom: 20px; }
        .school { font-size: 26px; font-weight: 800; color: #F472B6; }
        .subtitle { font-size: 13px; color: #6B7280; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; }
        .period { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
        .cards { display: flex; gap: 16px; margin-bottom: 32px; }
        .card { flex: 1; padding: 18px; border-radius: 16px; color: white; text-align: center; }
        .label { font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.85; }
        .value { font-size: 22px; font-weight: 900; margin-top: 6px; }
        .inc { background:#10B981; } .exp { background:#EF4444; } .net { background: ${net >= 0 ? '#3B82F6' : '#F97316'}; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { padding: 12px 15px; text-align: left; border-bottom: 2px solid #E5E7EB;
             color: #9CA3AF; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; }
        td { padding: 13px 15px; border-bottom: 1px solid #F3F4F6; }
        .in  { color: #10B981; font-weight: 800; }
        .ex  { color: #EF4444; font-weight: 800; }
        .amt { font-weight: 900; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9CA3AF; }
      </style></head><body>
        <div class="header">
          <div class="school">Kids Academy 👑</div>
          <div class="subtitle">Financial Transaction Report</div>
          <div class="period">${periodLabel} &nbsp;·&nbsp; ${filtered.length} transactions</div>
        </div>
        <div class="cards">
          <div class="card inc"><div class="label">Total Income</div><div class="value">₹${totalIncome.toLocaleString()}</div></div>
          <div class="card exp"><div class="label">Total Expense</div><div class="value">₹${totalExpense.toLocaleString()}</div></div>
          <div class="card net"><div class="label">Net ${net >= 0 ? 'Profit' : 'Loss'}</div><div class="value">₹${Math.abs(net).toLocaleString()}</div></div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            ${filtered.map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.name}</td>
                <td>${t.category}</td>
                <td class="${t.type === 'income' ? 'in' : 'ex'}">${t.type.toUpperCase()}</td>
                <td class="amt" style="text-align:right;color:${t.type === 'income' ? '#10B981' : '#EF4444'}">
                  ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString()}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">Generated ${new Date().toLocaleString()} · Kids Academy Management System</div>
      </body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  }, [filtered, totalIncome, totalExpense, net, fromDate, toDate]);

  const clearRange = useCallback(() => { setFromDate(''); setToDate(''); setTypeFilter('all'); }, []);

  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TxItem item={item} colors={colors} theme={theme} onDelete={handleDelete} />
  ), [colors, theme, handleDelete]);

  const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111' : '#F9FAFB' }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{
            width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme === 'dark' ? '#1e1e1c' : '#fff',
            borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
          }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme === 'dark' ? '#fff' : '#111'} />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>
            Finance Hub 💸
          </Text>

          <TouchableOpacity onPress={generatePDF} disabled={pdfLoading} style={{
            width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#F472B6',
            shadowColor: '#F472B6', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
          }}>
            {pdfLoading
              ? <ActivityIndicator color="white" size="small" />
              : <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />}
          </TouchableOpacity>
        </View>

        {/* ── Summary Cards ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Income',  value: rupee(totalIncome),      color: '#10B981', bg: '#ECFDF5', icon: 'arrow-bottom-left' },
            { label: 'Expense', value: rupee(totalExpense),     color: '#EF4444', bg: '#FEF2F2', icon: 'arrow-top-right' },
            { label: net >= 0 ? 'Profit' : 'Loss', value: rupee(Math.abs(net)), color: net >= 0 ? '#3B82F6' : '#F97316', bg: net >= 0 ? '#EFF6FF' : '#FFF7ED', icon: net >= 0 ? 'trending-up' : 'trending-down' },
          ].map(c => (
            <View key={c.label} style={{
              flex: 1, backgroundColor: c.bg, borderRadius: 20, padding: 14,
              borderWidth: 1.5, borderColor: c.color + '33',
            }}>
              <MaterialCommunityIcons name={c.icon as any} size={18} color={c.color} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: c.color, marginTop: 6 }}>{c.value}</Text>
              <Text style={{ fontSize: 9, fontWeight: '900', color: c.color, opacity: 0.7, marginTop: 2, letterSpacing: 1 }}>
                {c.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Tab toggle ── */}
        <View style={{
          flexDirection: 'row', gap: 0,
          backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F3F4F6',
          borderRadius: 18, padding: 5,
          borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
        }}>
          {(['history', 'entry'] as const).map(tab => (
            <TouchableOpacity key={tab} activeOpacity={0.7}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
                backgroundColor: activeTab === tab ? '#F472B6' : 'transparent',
              }}>
              <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
                color: activeTab === tab ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF') }}>
                {tab === 'history' ? '📋 History' : '➕ New Entry'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── History tab ── */}
      {activeTab === 'history' ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 14 }}>
              {/* Date range picker */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <MiniDatePicker label="From Date" value={fromDate} onChange={setFromDate} theme={theme} />
                <MiniDatePicker label="To Date"   value={toDate}   onChange={setToDate}   theme={theme} />
              </View>

              {/* Type filter chips */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {(['all', 'income', 'expense'] as const).map(t => (
                  <TouchableOpacity key={t} activeOpacity={0.7}
                    onPress={() => setTypeFilter(t)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: typeFilter === t
                        ? (t === 'income' ? '#10B981' : t === 'expense' ? '#EF4444' : '#F472B6')
                        : (theme === 'dark' ? '#1e1e1c' : '#F3F4F6'),
                      borderWidth: 1.5,
                      borderColor: typeFilter === t
                        ? (t === 'income' ? '#10B981' : t === 'expense' ? '#EF4444' : '#F472B6')
                        : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
                    }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase',
                      color: typeFilter === t ? 'white' : '#9CA3AF' }}>
                      {t === 'all' ? 'All' : t === 'income' ? '↙ Income' : '↗ Expense'}
                    </Text>
                  </TouchableOpacity>
                ))}

                {(fromDate || toDate || typeFilter !== 'all') && (
                  <TouchableOpacity onPress={clearRange} style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6',
                    borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                  }}>
                    <MaterialCommunityIcons name="close" size={12} color="#9CA3AF" />
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF' }}>CLEAR</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Result count */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>
                Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                {(fromDate || toDate) ? ` · ${fromDate || '...'} → ${toDate || '...'}` : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, opacity: 0.3 }}>
              <MaterialCommunityIcons name="cash-remove" size={64} color="#9CA3AF" />
              <Text style={{ fontWeight: '900', marginTop: 12, color: '#9CA3AF' }}>No transactions found</Text>
            </View>
          }
        />
      ) : (
        /* ── New Entry tab — isolated in memo ── */
        <NewEntryForm
          theme={theme}
          colors={colors}
          onSubmit={handleAddSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </SafeAreaView>
  );
}
