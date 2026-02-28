import React, { useState, memo, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  TextInput, Image, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, Announcement } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}
interface AnnouncementsScreenProps {
  navigation: NavigationProps;
}

// ─── Isolated form — state lives here, never in parent ───────────────────────
const AddAnnouncementForm = memo(({
  theme, colors, userName, onClose, onSubmit, isSubmitting,
}: {
  theme: string; colors: any; userName: string;
  onClose: () => void; onSubmit: (a: Announcement) => void; isSubmitting: boolean;
}) => {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [image,   setImage]   = useState('');
  const [target,  setTarget]  = useState<'all' | 'student' | 'teacher'>('all');

  const pickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const handlePost = useCallback(() => {
    if (!title.trim())   { Alert.alert('Missing Title', 'Please enter a title'); return; }
    if (!content.trim()) { Alert.alert('Missing Content', 'Please enter a message'); return; }
    onSubmit({
      id:      `ann_${Date.now()}`,
      title:   title.trim(),
      content: content.trim(),
      image:   image || undefined,
      date:    new Date().toLocaleDateString(),
      target,
      author:  userName,
    });
  }, [title, content, image, target, userName, onSubmit]);

  const chipStyle = useCallback((active: boolean) => ({
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' as const,
    backgroundColor: active ? '#F472B6' : (theme === 'dark' ? '#2a2a28' : '#F3F4F6'),
  }), [theme]);

  const inputStyle = {
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '700' as const,
    color: theme === 'dark' ? '#fff' : '#111',
    backgroundColor: theme === 'dark' ? '#1e1e1c' : '#F9FAFB',
    borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111' : '#F9FAFB' }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 24, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#2a2a28' : '#F3F4F6',
        }}>
          <TouchableOpacity onPress={onClose} style={{
            width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme === 'dark' ? '#1e1e1c' : '#fff',
            borderWidth: 1.5, borderColor: theme === 'dark' ? '#3a3a38' : '#E5E7EB',
          }}>
            <MaterialCommunityIcons name="close" size={22} color={theme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme === 'dark' ? '#fff' : '#111' }}>
              Broadcast Message
            </Text>
            <Text style={{ color: '#F472B6', fontWeight: '700', fontSize: 13 }}>📢 New Announcement</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        >
          {/* ── Audience Target ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 10,
          }}>
            Audience Target
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
            {(['all', 'student', 'teacher'] as const).map(t => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                style={chipStyle(target === t)}
                onPress={() => setTarget(t)}
              >
                <Text style={{
                  fontSize: 11, fontWeight: '900', textTransform: 'capitalize',
                  color: target === t ? 'white' : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Headline ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Headline *
          </Text>
          <TextInput
            style={{ ...inputStyle, marginBottom: 18 }}
            placeholder="e.g. School Reopening Update"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          {/* ── Message ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Detailed Message *
          </Text>
          <TextInput
            style={{ ...inputStyle, minHeight: 110, textAlignVertical: 'top', marginBottom: 18 }}
            placeholder="Write your announcement here..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* ── Banner Image ── */}
          <Text style={{
            fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase',
            color: '#9CA3AF', marginBottom: 8,
          }}>
            Banner Image (optional)
          </Text>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={{
              borderWidth: 1.5, borderRadius: 16, paddingVertical: 16,
              borderColor: image ? '#F472B6' : (theme === 'dark' ? '#3a3a38' : '#E5E7EB'),
              backgroundColor: image ? '#FFF1F8' : (theme === 'dark' ? '#1e1e1c' : '#F9FAFB'),
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons
              name={image ? 'image-check' : 'image-plus'} size={22}
              color={image ? '#F472B6' : '#9CA3AF'}
            />
            <Text style={{ fontWeight: '700', marginLeft: 10,
              color: image ? '#F472B6' : '#9CA3AF' }}>
              {image ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>

          {image ? (
            <View style={{ borderRadius: 18, overflow: 'hidden', height: 180, marginBottom: 22 }}>
              <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setImage('')}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 6,
                }}
              >
                <MaterialCommunityIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Post button ── */}
          <TouchableOpacity
            onPress={handlePost}
            disabled={isSubmitting}
            activeOpacity={0.85}
            style={{
              backgroundColor: isSubmitting ? '#D1D5DB' : '#F472B6',
              paddingVertical: 20, borderRadius: 24, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center',
              shadowColor: '#F472B6', shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
              marginTop: 4,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={22} color="white" />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 17, marginLeft: 10 }}>
                  Post to Feed
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AnnouncementsScreen({ navigation }: AnnouncementsScreenProps) {
  const { announcements, addAnnouncement, deleteAnnouncement, user } = useAuth();
  const { colors, theme } = useTheme();

  const [showForm, setShowForm]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openForm  = useCallback(() => setShowForm(true),  []);
  const closeForm = useCallback(() => setShowForm(false), []);

  const handleSubmit = useCallback(async (a: Announcement) => {
    setIsSubmitting(true);
    try {
      await addAnnouncement(a);
      setShowForm(false);
      Alert.alert('Posted! 📢', 'Announcement is now live.');
    } catch {
      Alert.alert('Error', 'Failed to post announcement.');
    } finally {
      setIsSubmitting(false);
    }
  }, [addAnnouncement]);

  const handleDelete = useCallback((id: string, title: string) => {
    Alert.alert('Delete', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAnnouncement(id) },
    ]);
  }, [deleteAnnouncement]);

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* ── Header ── */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Announce</Text>
            <Text className="text-2xl font-bold text-brand-pink">Board 📢</Text>
          </View>
          <TouchableOpacity
            onPress={openForm}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#F472B6', width: 64, height: 64,
              borderRadius: 24, alignItems: 'center', justifyContent: 'center',
              shadowColor: '#F472B6', shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8,
            }}
          >
            <MaterialCommunityIcons name="bullhorn-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Feed list ── */}
      <ScrollView className="flex-1 px-6 pb-10" showsVerticalScrollIndicator={false}>
        <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
          Recent Posts ✨
        </Text>

        {announcements.length > 0 ? announcements.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            className="mb-6 bg-brand-pink relative overflow-hidden rounded-[32px] border-4 border-white shadow-xl"
            onPress={() => Alert.alert(item.title, item.content)}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-brand-pink/20">
                <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#F472B6" />
              </View>
            )}

            {/* Overlay with shadow for text readability */}
            <View className="absolute inset-0 bg-black/40 justify-end p-6">
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-brand-yellow/80 px-3 py-1 rounded-full">
                  <Text className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                    {item.target}
                  </Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">{item.date}</Text>
                </View>
              </View>

              <Text className="text-white text-2xl font-black tracking-tighter mb-1" numberOfLines={2}>
                {item.title}
              </Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="account-circle-outline" size={14} color="white" />
                  <Text className="text-white/80 text-xs font-bold ml-1">{item.author || 'Admin'}</Text>
                </View>
                <Text className="text-white/60 text-[10px] font-bold">Tap to read more →</Text>
              </View>
            </View>

            {/* Floating Delete Button */}
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.title)}
              className="absolute top-4 right-4 bg-red-500/80 w-10 h-10 rounded-2xl items-center justify-center border border-white/30"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        )) : (
          <View className="items-center py-20 opacity-20">
            <MaterialCommunityIcons name="post-outline" size={80} color={theme === 'dark' ? '#9CA3AF' : 'gray'} />
            <Text className={`font-black mt-4 uppercase tracking-widest ${colors.textSecondary}`}>
              No announcements yet
            </Text>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Add form in Modal (fully isolated) ── */}
      <Modal visible={showForm} animationType="slide" transparent={false} onRequestClose={closeForm}>
        <AddAnnouncementForm
          theme={theme}
          colors={colors}
          userName={user?.name || 'Admin'}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </SafeAreaView>
  );
}
