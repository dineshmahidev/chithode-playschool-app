import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar, Alert,
  Modal, TextInput, ActivityIndicator, FlatList,
  KeyboardAvoidingView, Platform, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────
//  DRUM-ROLL TIME PICKER
// ─────────────────────────────────────────────────────────
const ITEM_H = 48;
const VISIBLE_ITEMS = 5;           // always odd
const PICKER_H = ITEM_H * VISIBLE_ITEMS;
const PADDING  = ITEM_H * Math.floor(VISIBLE_ITEMS / 2);

interface DrumColumnProps {
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
  label?: string;
  theme: string;
  colors: any;
}

function DrumColumn({ items, selected, onSelect, label, theme, colors }: DrumColumnProps) {
  const ref = useRef<ScrollView>(null);
  
  // Set initial position on mount
  useEffect(() => {
    setTimeout(() => {
      ref.current?.scrollTo({ y: selected * ITEM_H, animated: false });
    }, 100);
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_H);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== selected) {
      onSelect(clamped);
    }
  };

  const handlePress = (index: number) => {
    ref.current?.scrollTo({ y: index * ITEM_H, animated: true });
    onSelect(index);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      {label ? (
        <Text style={{ 
          fontSize: 10, 
          fontWeight: '900', 
          color: theme === 'dark' ? '#F472B6' : '#F472B6', 
          letterSpacing: 2, 
          marginBottom: 10, 
          textTransform: 'uppercase',
          opacity: 0.8
        }}>
          {label}
        </Text>
      ) : <View style={{ height: 26 }} />}

      <View style={{ height: PICKER_H, width: '100%', borderRadius: 20, overflow: 'hidden' }}>
        {/* Selection Glass Bar */}
        <View style={{
          position: 'absolute', 
          top: PADDING, 
          left: 8, 
          right: 8,
          height: ITEM_H, 
          borderRadius: 16,
          backgroundColor: theme === 'dark' ? 'rgba(244, 114, 182, 0.1)' : 'rgba(244, 114, 182, 0.05)',
          borderWidth: 1.5, 
          borderColor: 'rgba(244, 114, 182, 0.3)', 
          zIndex: 0,
        }} />

        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: PADDING }}
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled={true} // FIX: Ensures scrolling works inside another ScrollView
        >
          {items.map((item, i) => {
            const isActive = i === selected;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handlePress(i)}
                activeOpacity={0.7}
                style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{
                  fontSize: isActive ? 24 : 18,
                  fontWeight: isActive ? '900' : '600',
                  color: isActive ? '#F472B6' : (theme === 'dark' ? '#555' : '#D1D5DB'),
                  transform: [{ scale: isActive ? 1.1 : 1 }],
                  opacity: isActive ? 1 : 0.6
                }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3D Drum Shadow Overlays */}
        <LinearGradient
          colors={[theme === 'dark' ? '#1a1a18' : '#FAFAFA', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: PADDING, zIndex: 10 }}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', theme === 'dark' ? '#1a1a18' : '#FAFAFA']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: PADDING, zIndex: 10 }}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

// Format hour/min/period into "HH:MM AM/PM"
const buildTimeString = (hour: number, minute: number, period: number) => {
  const h = (hour + 1).toString().padStart(2, '0');      // 1-12
  const m = (minute * 5).toString().padStart(2, '0');    // 0,5,10,...55
  const p = period === 0 ? 'AM' : 'PM';
  return `${h}:${m} ${p}`;
};

// Parse "HH:MM AM/PM" back to indices
const parseTimeString = (t: string) => {
  const match = t.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return { hourIdx: 8, minIdx: 0, periodIdx: 0 }; // default 09:00 AM
  const h = parseInt(match[1]) - 1;             // 0-indexed (hour 1 => index 0)
  const m = Math.round(parseInt(match[2]) / 5); // minute → index
  const p = match[3].toUpperCase() === 'AM' ? 0 : 1;
  return {
    hourIdx:   Math.max(0, Math.min(h, 11)),
    minIdx:    Math.max(0, Math.min(m, 11)),
    periodIdx: p,
  };
};

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

interface TimeSelectorProps {
  value: string;          // e.g. "09:30 AM"
  onChange: (t: string) => void;
  theme: string;
  colors: any;
}

function TimeSelector({ value, onChange, theme, colors }: TimeSelectorProps) {
  const parsed = useMemo(() => parseTimeString(value), [value]);
  const [hourIdx,   setHourIdx]   = useState(parsed.hourIdx);
  const [minIdx,    setMinIdx]     = useState(parsed.minIdx);
  const [periodIdx, setPeriodIdx] = useState(parsed.periodIdx);

  const notify = useCallback((h: number, m: number, p: number) => {
    onChange(buildTimeString(h, m, p));
  }, [onChange]);

  return (
    <View style={{
      borderRadius: 32,
      borderWidth: 2,
      borderColor: theme === 'dark' ? '#3e3e3c' : '#F3F4F6',
      overflow: 'hidden',
      padding: 12,
      backgroundColor: theme === 'dark' ? '#1a1a18' : '#FAFAFA',
      marginBottom: 24,
      shadowColor: '#F472B6',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 }}>
        <DrumColumn
          items={HOURS}
          selected={hourIdx}
          onSelect={i => { setHourIdx(i); notify(i, minIdx, periodIdx); }}
          label="Hour"
          theme={theme}
          colors={colors}
        />

        {/* Colon divider */}
        <View style={{ justifyContent: 'center', paddingTop: 32, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 26, fontWeight: '900',
            color: '#F472B6', lineHeight: PICKER_H / 2 }}>:</Text>
        </View>

        <DrumColumn
          items={MINUTES}
          selected={minIdx}
          onSelect={i => { setMinIdx(i); notify(hourIdx, i, periodIdx); }}
          label="Min"
          theme={theme}
          colors={colors}
        />

        {/* Spacer */}
        <View style={{ width: 12 }} />

        <DrumColumn
          items={PERIODS}
          selected={periodIdx}
          onSelect={i => { setPeriodIdx(i); notify(hourIdx, minIdx, i); }}
          label="Period"
          theme={theme}
          colors={colors}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
//  ICON + COLOR palettes
// ─────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  { icon: 'hands-pray',              label: 'Prayer'   },
  { icon: 'alphabetical',            label: 'Alphabet' },
  { icon: 'yoga',                    label: 'Yoga'     },
  { icon: 'palette',                 label: 'Art'      },
  { icon: 'toy-brick-outline',       label: 'Games'    },
  { icon: 'numeric-3-box-outline',   label: 'Numbers'  },
  { icon: 'book-open-page-variant',  label: 'Story'    },
  { icon: 'music',                   label: 'Music'    },
  { icon: 'pine-tree',               label: 'Nature'   },
  { icon: 'shimmer',                 label: 'Clay'     },
  { icon: 'television-play',         label: 'Movie'    },
  { icon: 'tent',                    label: 'Camp'     },
  { icon: 'cookie',                  label: 'Snack'    },
  { icon: 'car-side',                label: 'Pickup'   },
  { icon: 'home-heart',              label: 'Home'     },
  { icon: 'sun-wireless',            label: 'Rest'     },
  { icon: 'soccer',                  label: 'Sport'    },
  { icon: 'food-apple',              label: 'Lunch'    },
  { icon: 'pencil',                  label: 'Write'    },
  { icon: 'run',                     label: 'Run'      },
  { icon: 'dance-ballroom',          label: 'Dance'    },
  { icon: 'microscope',              label: 'Science'  },
  { icon: 'calculator',              label: 'Maths'    },
  { icon: 'laptop',                  label: 'Computer' },
  { icon: 'swim',                    label: 'Swim'     },
  { icon: 'baby-bottle-outline',     label: 'Feeding'  },
  { icon: 'sleep',                   label: 'Nap'      },
  { icon: 'hospital-box-outline',    label: 'Health'   },
  { icon: 'bus-school',              label: 'Bus'      },
  { icon: 'flag-outline',            label: 'Event'    },
];

const COLOR_OPTIONS = [
  { color: 'bg-blue-500',    hex: '#3B82F6' },
  { color: 'bg-brand-pink',  hex: '#F472B6' },
  { color: 'bg-brand-yellow', hex: '#EAB308' },
  { color: 'bg-green-500',   hex: '#22C55E' },
  { color: 'bg-purple-500',  hex: '#A855F7' },
  { color: 'bg-orange-500',  hex: '#F97316' },
  { color: 'bg-red-500',     hex: '#EF4444' },
  { color: 'bg-cyan-500',    hex: '#06B6D4' },
  { color: 'bg-rose-500',    hex: '#F43F5E' },
  { color: 'bg-indigo-500',  hex: '#6366F1' },
];

const WEEKDAYS = [
  { name: 'Monday',    char: 'M' },
  { name: 'Tuesday',   char: 'T' },
  { name: 'Wednesday', char: 'W' },
  { name: 'Thursday',  char: 'T' },
  { name: 'Friday',    char: 'F' },
  { name: 'Saturday',  char: 'S' },
  { name: 'Sunday',    char: 'S' },
];

const EMPTY_FORM = {
  time:     '09:00 AM',
  activity: '',
  room:     '',
  icon:     'calendar-clock',
  color:    'bg-blue-500',
};

// ─────────────────────────────────────────────────────────
//  INTERFACES
// ─────────────────────────────────────────────────────────
interface NavigationProps { navigate: (s: string) => void; goBack: () => void; }
interface TimetableScreenProps { navigation: NavigationProps; }
interface TimeSlot {
  id: number; day: number; time: string;
  activity: string; room: string; icon: string; color: string;
}

// ─────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────
export default function TimetableScreen({ navigation }: TimetableScreenProps) {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const today          = new Date().getDay();
  const initialDayIndex = today === 0 ? 6 : today - 1;

  const [selectedDay, setSelectedDay] = useState(initialDayIndex);
  const [slots, setSlots]             = useState<TimeSlot[]>([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);

  // modal
  const [showModal, setShowModal]           = useState(false);
  const [editingSlot, setEditingSlot]       = useState<TimeSlot | null>(null);
  const [form, setForm]                     = useState({ ...EMPTY_FORM });
  const [showIconPicker, setShowIconPicker] = useState(false);

  const currentSchedule = useMemo(
    () => slots.filter(s => s.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time)),
    [slots, selectedDay],
  );

  // fetch
  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetable');
      setSlots(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  const openAdd = () => {
    setEditingSlot(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setForm({ time: slot.time, activity: slot.activity, room: slot.room, icon: slot.icon, color: slot.color });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.activity.trim()) {
      Alert.alert('Validation', 'Activity name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingSlot) {
        const res = await api.put(`/timetable/${editingSlot.id}`, { ...form, day: selectedDay });
        setSlots(prev => prev.map(s => s.id === editingSlot.id ? res.data : s));
      } else {
        const res = await api.post('/timetable', { ...form, day: selectedDay });
        setSlots(prev => [...prev, res.data]);
      }
      setShowModal(false);
    } catch {
      Alert.alert('Error', 'Failed to save slot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (slot: TimeSlot) => {
    Alert.alert(
      'Delete Slot',
      `Remove "${slot.activity}" from ${WEEKDAYS[slot.day].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/timetable/${slot.id}`);
              setSlots(prev => prev.filter(s => s.id !== slot.id));
            } catch {
              Alert.alert('Error', 'Failed to delete slot.');
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────
  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>Daily</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Timetable 📅</Text>
          </View>
          <View className="items-center">
            <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 border-white rotate-6">
              <MaterialCommunityIcons name="calendar-clock" size={32} color="#92400E" />
            </View>
            {isAdmin && (
              <TouchableOpacity
                onPress={openAdd}
                className="bg-brand-pink mt-3 w-14 h-14 rounded-2xl items-center justify-center shadow-lg"
              >
                <MaterialCommunityIcons name="plus" size={30} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Day Selector ── */}
      <View className="px-6 py-3">
        <View className={`${colors.surface} rounded-[32px] p-2 shadow-lg border ${colors.border} flex-row justify-between`}>
          {WEEKDAYS.map((day, index) => {
            const isActive = selectedDay === index;
            const isToday  = index === initialDayIndex;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDay(index)}
                className={`w-11 h-11 rounded-2xl items-center justify-center ${isActive ? 'bg-brand-pink' : 'bg-transparent'}`}
                activeOpacity={0.7}
              >
                <Text className={`font-black text-lg ${isActive ? 'text-white' : colors.textSecondary}`}>{day.char}</Text>
                {isToday && !isActive && <View className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brand-pink" />}
                {isToday &&  isActive && <View className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Label + count */}
      <View className="px-8 mt-1 flex-row items-center justify-between">
        <Text className={`text-xl font-black ${colors.text} opacity-60 uppercase tracking-widest`}>
          {WEEKDAYS[selectedDay].name}
        </Text>
        <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
          <Text className="text-brand-pink font-black text-[10px] uppercase">{currentSchedule.length} Sessions</Text>
        </View>
      </View>

      {/* ── Schedule list ── */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F472B6" />
          <Text className={`mt-3 ${colors.textSecondary} font-bold`}>Loading timetable…</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 mt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {currentSchedule.length === 0 ? (
            <View className="items-center mt-16">
              <View className="bg-brand-yellow/10 w-24 h-24 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#EAB308" />
              </View>
              <Text className={`text-xl font-black ${colors.text}`}>No sessions yet</Text>
              <Text className={`text-sm ${colors.textSecondary} mt-1`}>
                {isAdmin ? 'Tap + to add a timetable slot' : 'No schedule for this day'}
              </Text>
            </View>
          ) : (
            currentSchedule.map((item, index) => (
              <View key={item.id} className="flex-row mb-8">
                <View className="items-center mr-5">
                  <View className={`w-14 h-14 rounded-[22px] items-center justify-center ${item.color} shadow-lg z-10`}>
                    <MaterialCommunityIcons name={item.icon as any} size={28} color="white" />
                  </View>
                  {index !== currentSchedule.length - 1 && (
                    <View className={`w-1 flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} mt-2 rounded-full`} />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`text-lg font-black ${colors.text}`}>{item.time}</Text>
                    <View className={`${theme === 'dark' ? 'bg-[#3e3e34] border-[#4e4e44]' : 'bg-gray-50 border-gray-100'} px-3 py-1 rounded-full border`}>
                      <Text className={`text-[10px] font-black uppercase tracking-widest ${colors.textTertiary}`}>{item.room}</Text>
                    </View>
                  </View>
                  <View className={`${colors.surface} rounded-3xl p-5 border ${colors.border} shadow-sm`}>
                    <Text className={`text-lg font-black ${colors.text} mb-1.5`}>{item.activity}</Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <View className="bg-brand-pink/10 px-3 py-1 rounded-lg flex-row items-center">
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#F472B6" />
                        <Text className="text-brand-pink font-black text-[10px] ml-1.5 uppercase tracking-wider">{item.time}</Text>
                      </View>
                      {isAdmin && (
                        <View className="flex-row">
                          <TouchableOpacity onPress={() => openEdit(item)} className="bg-blue-100 p-2 rounded-xl mr-2">
                            <MaterialCommunityIcons name="pencil" size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(item)} className="bg-red-100 p-2 rounded-xl">
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════
          ADD / EDIT MODAL
          ══════════════════════════════════════════ */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: theme === 'dark' ? '#1c1c1a' : '#ffffff',
                borderTopLeftRadius: 36, borderTopRightRadius: 36,
                padding: 24, maxHeight: '95%', shadowColor: '#000',
                shadowOpacity: 0.25, shadowRadius: 20, elevation: 16,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Modal header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <View>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>
                      {editingSlot ? 'Edit Slot' : 'New Slot'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>
                      {WEEKDAYS[selectedDay].name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 16 }}
                  >
                    <MaterialCommunityIcons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* ── TIME PICKER ── */}
                <Text style={{
                  fontSize: 10, fontWeight: '900', letterSpacing: 2,
                  color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10,
                }}>
                  Select Time
                </Text>

                {/* Time preview badge */}
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <View style={{
                    backgroundColor: '#F472B6', paddingHorizontal: 24, paddingVertical: 8,
                    borderRadius: 999, flexDirection: 'row', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, marginLeft: 8, fontVariant: ['tabular-nums'] }}>
                      {form.time}
                    </Text>
                  </View>
                </View>

                <TimeSelector
                  value={form.time}
                  onChange={t => setForm(f => ({ ...f, time: t }))}
                  theme={theme}
                  colors={colors}
                />

                {/* ── Activity ── */}
                <Text style={{
                  fontSize: 10, fontWeight: '900', letterSpacing: 2,
                  color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Activity
                </Text>
                <TextInput
                  value={form.activity}
                  onChangeText={v => setForm(f => ({ ...f, activity: v }))}
                  placeholder="e.g. Morning Circle & Prayer"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: theme === 'dark' ? '#2a2a28' : '#F9FAFB',
                    borderWidth: 1.5, borderColor: theme === 'dark' ? '#3e3e3c' : '#E5E7EB',
                    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
                    color: theme === 'dark' ? '#fff' : '#111', fontWeight: '700', fontSize: 15,
                    marginBottom: 16,
                  }}
                />

                {/* ── Room ── */}
                <Text style={{
                  fontSize: 10, fontWeight: '900', letterSpacing: 2,
                  color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Room / Area
                </Text>
                <TextInput
                  value={form.room}
                  onChangeText={v => setForm(f => ({ ...f, room: v }))}
                  placeholder="e.g. Study Area"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: theme === 'dark' ? '#2a2a28' : '#F9FAFB',
                    borderWidth: 1.5, borderColor: theme === 'dark' ? '#3e3e3c' : '#E5E7EB',
                    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
                    color: theme === 'dark' ? '#fff' : '#111', fontWeight: '700', fontSize: 15,
                    marginBottom: 16,
                  }}
                />

                {/* ── Icon picker trigger ── */}
                <Text style={{
                  fontSize: 10, fontWeight: '900', letterSpacing: 2,
                  color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Icon
                </Text>

                {/* Live Icon + Color preview card */}
                <View style={{
                  alignItems: 'center', marginBottom: 14,
                }}>
                  <View style={{
                    backgroundColor: COLOR_OPTIONS.find(c => c.color === form.color)?.hex ?? '#3B82F6',
                    width: 80, height: 80, borderRadius: 28,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: COLOR_OPTIONS.find(c => c.color === form.color)?.hex ?? '#3B82F6',
                    shadowOpacity: 0.5, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
                    elevation: 10,
                  }}>
                    <MaterialCommunityIcons name={form.icon as any} size={40} color="white" />
                  </View>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, fontWeight: '700' }}>
                    Live Preview
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowIconPicker(true)}
                  style={{
                    backgroundColor: theme === 'dark' ? '#2a2a28' : '#F9FAFB',
                    borderWidth: 1.5, borderColor: theme === 'dark' ? '#3e3e3c' : '#E5E7EB',
                    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12,
                    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
                  }}
                >
                  {/* Icon badge uses the currently selected color */}
                  <View style={{
                    backgroundColor: COLOR_OPTIONS.find(c => c.color === form.color)?.hex ?? '#3B82F6',
                    width: 40, height: 40, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <MaterialCommunityIcons name={form.icon as any} size={22} color="white" />
                  </View>
                  <Text style={{ fontWeight: '700', color: theme === 'dark' ? '#ccc' : '#374151', flex: 1 }}>{form.icon}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* ── Color palette ── */}
                <Text style={{
                  fontSize: 10, fontWeight: '900', letterSpacing: 2,
                  color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10,
                }}>
                  Color
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {COLOR_OPTIONS.map(c => (
                    <TouchableOpacity
                      key={c.color}
                      onPress={() => setForm(f => ({ ...f, color: c.color }))}
                      style={{
                        width: 42, height: 42, borderRadius: 13,
                        backgroundColor: c.hex,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: form.color === c.color ? 3 : 0,
                        borderColor: theme === 'dark' ? '#fff' : '#1F2937',
                      }}
                    >
                      {form.color === c.color && <MaterialCommunityIcons name="check" size={20} color="white" />}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── Save button ── */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? '#9CA3AF' : '#F472B6',
                    paddingVertical: 18, borderRadius: 24, alignItems: 'center',
                    shadowColor: '#F472B6', shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 6 }, shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name={editingSlot ? 'content-save' : 'plus-circle'} size={22} color="white" />
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 17, marginLeft: 8 }}>
                        {editingSlot ? 'Save Changes' : 'Add Slot'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Icon Picker Modal ── */}
      <Modal visible={showIconPicker} animationType="slide" transparent onRequestClose={() => setShowIconPicker(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme === 'dark' ? '#1c1c1a' : '#ffffff',
            borderTopLeftRadius: 36, borderTopRightRadius: 36,
            padding: 24, maxHeight: '70%',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>Pick an Icon</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)} style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 16 }}>
                <MaterialCommunityIcons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ICON_OPTIONS}
              numColumns={5}
              keyExtractor={item => item.icon}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setForm(f => ({ ...f, icon: item.icon })); setShowIconPicker(false); }}
                  style={{ flex: 1, alignItems: 'center', margin: 4 }}
                >
                  <View style={{
                    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: form.icon === item.icon
                      ? (COLOR_OPTIONS.find(c => c.color === form.color)?.hex ?? '#3B82F6')
                      : (theme === 'dark' ? '#2e2e2c' : '#F3F4F6'),
                  }}>
                    <MaterialCommunityIcons name={item.icon as any} size={26}
                      color={form.icon === item.icon ? 'white' : (theme === 'dark' ? '#ccc' : '#374151')} />
                  </View>
                  <Text style={{ fontSize: 9, textAlign: 'center', marginTop: 4,
                    color: theme === 'dark' ? '#888' : '#6B7280' }} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
