import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, Activity } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import PremiumPopup from '../../components/PremiumPopup';

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface PostActivityScreenProps {
  navigation: NavigationProps;
}

export default function PostActivityScreen({ navigation }: PostActivityScreenProps) {
  const { users, user, addActivity } = useAuth();
  const { colors, theme } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const students = users.filter(u => u.role === 'student');

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  const handlePost = async () => {
    if (!title.trim() || !description.trim() || selectedStudentIds.length === 0) {
      Alert.alert('Error', 'Please fill in all fields and select at least one student.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulated upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const newActivity: Activity = {
        id: Date.now().toString(),
        title,
        description,
        mediaType,
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop',
        thumbnailUrl: thumbnailUrl || undefined,
        studentIds: selectedStudentIds,
        date: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        author: user?.name || 'Admin',
        likesCount: 0,
        comments: [],
      };

      await addActivity(newActivity);
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        setIsUploading(false);
        setShowSuccessModal(true);
      }, 500);
    } catch (error) {
      setIsUploading(false);
      clearInterval(progressInterval);
      Alert.alert('Error', 'Failed to post activity. Please try again.');
    }
  };

  const pickMedia = async (type: 'image' | 'video') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload media! 📸');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: type === 'image', 
      quality: 0.5, 
      base64: type === 'image',
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaType(type);
      const asset = result.assets[0];
      setMediaUrl(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      
      if (type === 'video') {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(
            result.assets[0].uri,
            { time: 500 }
          );
          setThumbnailUrl(uri);
        } catch (e) {
          console.warn('Failed to generate thumbnail', e);
          setThumbnailUrl(null);
        }
      } else {
        setThumbnailUrl(null);
      }
    }
  };

  return (
    <View 
        className={`flex-1 ${theme === 'dark' ? 'bg-[#1c1c14]' : 'bg-white'}`}
        style={{ backgroundColor: theme === 'dark' ? '#1c1c14' : '#FFFFFF' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ── Background Gradient & 3D Illustration ── */}
          <View className="absolute top-0 left-0 right-0 h-[400px] overflow-hidden">
            <LinearGradient
                colors={[theme === 'dark' ? '#1e1b4b' : '#FDF2F8', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute inset-0"
            />
            <Image 
                source={require('../../assets/images/playschool_actions.png')} 
                style={{ width: '100%', height: '100%', opacity: theme === 'dark' ? 0.1 : 0.2, transform: [{ scale: 1.4 }, { translateY: -40 }] }}
                resizeMode="cover"
            />
            <View className="absolute -top-20 -left-20 w-80 h-80 bg-brand-pink/10 rounded-full blur-3xl" />
            
            <LinearGradient
                colors={['transparent', theme === 'dark' ? '#1c1c14' : '#FFFFFF']}
                className="absolute bottom-0 left-0 right-0 h-40"
            />
          </View>

          {/* Header */}
          <View className="px-6 pt-12 pb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className={`${theme === 'dark' ? 'bg-[#2d2d24] border-gray-800' : 'bg-white border-brand-pink/20'} w-14 h-14 rounded-2xl items-center justify-center shadow-xl border mb-4`}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#F472B6'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Create</Text>
              <Text className="text-2xl font-black text-brand-pink mt-[-4px]">Activity Post ✨</Text>
            </View>
            <View className="bg-brand-yellow w-24 h-24 rounded-[36px] items-center justify-center shadow-2xl border-4 border-white rotate-3 relative overflow-hidden">
                <MaterialCommunityIcons name="movie-edit-outline" size={48} color="#92400E" />
                <View className="absolute -bottom-2 -right-2 opacity-20">
                    <MaterialCommunityIcons name="camera-iris" size={60} color="#92400E" />
                </View>
            </View>
          </View>

          <View className="px-6 py-4">
            {/* Activity Title Card */}
            <View className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} rounded-[32px] p-6 shadow-xl border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'} mb-6`}>
                <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textSecondary} mb-4 opacity-70`}>Activity Headline 📢</Text>
                <View className={`flex-row items-center ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'} rounded-2xl px-5 border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                    <MaterialCommunityIcons name="format-title" size={22} color={theme === 'dark' ? '#F472B6' : '#9CA3AF'} />
                    <TextInput
                        className={`flex-1 h-16 ml-3 font-bold text-lg ${colors.text}`}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Creative Arts Festival"
                        placeholderTextColor={theme === 'dark' ? '#4B5563' : '#9CA3AF'}
                    />
                </View>
            </View>

            {/* Student Selector Section */}
            <View className="mb-8">
                <View className="flex-row items-center justify-between mb-5 px-1">
                    <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Tag Students 👥</Text>
                    <View className="bg-brand-pink/10 px-3 py-1 rounded-full">
                        <Text className="text-brand-pink text-[9px] font-black uppercase tracking-widest">{selectedStudentIds.length} Selected</Text>
                    </View>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                    <TouchableOpacity 
                        onPress={() => {
                            if (selectedStudentIds.length === students.length) {
                                setSelectedStudentIds([]);
                            } else {
                                setSelectedStudentIds(students.map(s => s.id));
                            }
                        }}
                        className="items-center mr-5"
                    >
                        <View className={`w-24 h-24 rounded-[32px] items-center justify-center border-2 border-dashed ${selectedStudentIds.length === students.length ? 'border-brand-pink bg-brand-pink/10' : (theme === 'dark' ? 'border-gray-800 bg-black/20' : 'border-gray-200 bg-gray-50')}`}>
                            <MaterialCommunityIcons 
                                name={selectedStudentIds.length === students.length ? "minus-circle-outline" : "plus-circle-outline"} 
                                size={32} 
                                color={selectedStudentIds.length === students.length ? '#F472B6' : colors.textTertiary} 
                            />
                        </View>
                        <Text className={`text-[10px] font-black mt-3 uppercase tracking-widest ${selectedStudentIds.length === students.length ? 'text-brand-pink' : colors.textTertiary}`}>
                            {selectedStudentIds.length === students.length ? 'Deselect' : 'All'}
                        </Text>
                    </TouchableOpacity>

                    {students.map((student) => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                            <TouchableOpacity 
                                key={student.id} 
                                onPress={() => toggleStudentSelection(student.id)}
                                className="items-center mr-6"
                            >
                                <View className={`w-24 h-24 rounded-[32px] overflow-hidden border-2 shadow-sm ${isSelected ? 'border-brand-pink bg-brand-pink/10' : (theme === 'dark' ? 'border-gray-800 bg-[#2d2d24]' : 'border-white bg-white')}`}>
                                    {student.avatar ? (
                                        <Image source={{ uri: student.avatar }} className="w-full h-full" />
                                    ) : (
                                        <View className="flex-1 items-center justify-center">
                                            <MaterialCommunityIcons 
                                                name="account-child-circle" 
                                                size={48} 
                                                color={isSelected ? '#F472B6' : (theme === 'dark' ? '#3d3d2b' : '#FDF2F8')} 
                                            />
                                        </View>
                                    )}
                                    {isSelected && (
                                        <View className="absolute inset-0 bg-brand-pink/40 items-center justify-center">
                                            <View className="bg-white p-2 rounded-full shadow-2xl">
                                                <MaterialCommunityIcons name="check-bold" size={16} color="#F472B6" />
                                            </View>
                                        </View>
                                    )}
                                </View>
                                <Text className={`text-[10px] font-black mt-3 uppercase tracking-tighter text-center w-24 ${isSelected ? 'text-brand-pink' : colors.text}`} numberOfLines={1}>
                                    {student.name}
                                </Text>
                                <Text className={`text-[8px] font-bold ${isSelected ? 'text-brand-pink/60' : colors.textTertiary} uppercase tracking-widest mt-0.5`}>
                                    {isSelected ? 'TAGGED' : (student.studentId || 'ID#---')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Description Card */}
            <View className={`${theme === 'dark' ? 'bg-[#25251d]' : 'bg-white'} rounded-[40px] p-8 shadow-2xl border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'} mb-8`}>
                <Text className={`text-[10px] font-black uppercase tracking-[3px] ${colors.textSecondary} mb-5 opacity-70`}>Story Details 📝</Text>
                <TextInput
                    className={`w-full h-48 font-bold ${colors.text} text-xl leading-7`}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Capture the magic of today's learning journey..."
                    placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                    multiline
                    textAlignVertical="top"
                />
                <View className="h-px bg-gray-100 dark:bg-gray-800 my-6" />
                <View className="flex-row items-center justify-between">
                    <Text className={`text-[11px] font-black uppercase tracking-[2px] ${colors.textTertiary}`}>Author: {user?.name || 'Administrator'}</Text>
                    <MaterialCommunityIcons name="feather" size={20} color={colors.textTertiary} opacity={0.3} />
                </View>
            </View>

            {/* Media Choice Section */}
            <View className="mb-10">
                <View className="flex-row items-center justify-between mb-6 px-1">
                    <Text className={`text-xl font-black ${colors.text} tracking-tighter`}>Add Media Content 🎞️</Text>
                </View>

                <View className="flex-row justify-between">
                    <TouchableOpacity 
                        onPress={() => pickMedia('image')}
                        activeOpacity={0.9}
                        className="w-[48%] rounded-[36px] overflow-hidden shadow-2xl"
                        style={{ elevation: 12 }}
                    >
                        <LinearGradient
                            colors={mediaType === 'image' && mediaUrl ? ['#F472B6', '#BE185D'] : (theme === 'dark' ? ['#1e1e1e', '#111827'] : ['#FFFFFF', '#F9FAFB'])}
                            className={`p-6 h-44 justify-between border ${theme === 'dark' ? 'border-white/5' : 'border-gray-50'}`}
                        >
                            <View className={`${mediaType === 'image' && mediaUrl ? 'bg-white/20' : 'bg-brand-pink/10'} self-start p-4 rounded-2xl`}>
                                <MaterialCommunityIcons name="camera-plus-outline" size={28} color={mediaType === 'image' && mediaUrl ? '#FFF' : '#F472B6'} />
                            </View>
                            <View>
                                <Text className={`${mediaType === 'image' && mediaUrl ? 'text-white' : colors.text} text-xl font-black tracking-tighter`}>Add Photo</Text>
                                <Text className={`${mediaType === 'image' && mediaUrl ? 'text-white/60' : 'text-brand-pink/60'} text-[9px] font-black uppercase tracking-widest mt-1`}>Captures Moments</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => pickMedia('video')}
                        activeOpacity={0.9}
                        className="w-[48%] rounded-[36px] overflow-hidden shadow-2xl"
                        style={{ elevation: 12 }}
                    >
                        <LinearGradient
                            colors={mediaType === 'video' && mediaUrl ? ['#3B82F6', '#1E40AF'] : (theme === 'dark' ? ['#1e1e1e', '#111827'] : ['#FFFFFF', '#F9FAFB'])}
                            className={`p-6 h-44 justify-between border ${theme === 'dark' ? 'border-white/5' : 'border-gray-50'}`}
                        >
                            <View className={`${mediaType === 'video' && mediaUrl ? 'bg-white/20' : 'bg-blue-500/10'} self-start p-4 rounded-2xl`}>
                                <MaterialCommunityIcons name="video-plus-outline" size={28} color={mediaType === 'video' && mediaUrl ? '#FFF' : '#3B82F6'} />
                            </View>
                            <View>
                                <Text className={`${mediaType === 'video' && mediaUrl ? 'text-white' : colors.text} text-xl font-black tracking-tighter`}>Add Video</Text>
                                <Text className={`${mediaType === 'video' && mediaUrl ? 'text-white/60' : 'text-blue-500/60'} text-[9px] font-black uppercase tracking-widest mt-1`}>Action Clips</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {mediaUrl && (
                    <View className="mt-6 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative">
                        <Image source={{ uri: thumbnailUrl || mediaUrl }} className="w-full h-64" resizeMode="cover" />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            className="absolute inset-0 items-center justify-center"
                        >
                            <View className="bg-white/20 p-6 rounded-full border-2 border-white/30">
                                <MaterialCommunityIcons 
                                    name={mediaType === 'video' ? "play-circle-outline" : "image-check-outline"} 
                                    size={64} 
                                    color="white" 
                                />
                            </View>
                        </LinearGradient>
                        <TouchableOpacity 
                            onPress={() => {setMediaUrl(null); setThumbnailUrl(null);}}
                            className="absolute top-5 right-5 bg-black/60 w-12 h-12 rounded-2xl items-center justify-center border border-white/20 shadow-lg"
                        >
                            <MaterialCommunityIcons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <View className="absolute bottom-5 left-5 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">
                             <Text className="text-white font-black uppercase text-[10px] tracking-widest">Media Selected</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Post Action Button */}
            <TouchableOpacity 
                onPress={handlePost}
                activeOpacity={0.9}
                className="mb-16 rounded-[32px] overflow-hidden shadow-2xl"
                style={{ elevation: 15 }}
            >
                <LinearGradient
                    colors={['#F472B6', '#BE185D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-6 flex-row items-center justify-center"
                >
                    <MaterialCommunityIcons name="rocket-launch-outline" size={28} color="white" />
                    <Text className="text-white font-black text-xl ml-3 uppercase tracking-tighter">Share Magical Update</Text>
                </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Uploading Status Overlay */}
      <Modal visible={isUploading} transparent animationType="slide">
        <View className="flex-1 bg-black/80 items-center justify-center px-8">
            <View className={`${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} w-full rounded-[50px] p-10 items-center border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-50'} shadow-2xl`}>
                <View className="bg-brand-pink/10 w-24 h-24 rounded-full items-center justify-center mb-8 border border-brand-pink/20">
                    <ActivityIndicator size="large" color="#F472B6" />
                </View>
                
                <Text className={`text-3xl font-black ${colors.text} tracking-tighter text-center`}>Publishing Story</Text>
                <Text className={`text-sm ${colors.textSecondary} text-center mt-3 mb-10 leading-6 px-4`}>
                    We're preparing your magical moments for the school gallery... ✨
                </Text>

                {/* Modern Progress Bar */}
                <View className="w-full h-3 bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden mb-5 border border-gray-100 dark:border-gray-800">
                    <View 
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full bg-brand-pink rounded-full shadow-lg"
                    />
                </View>
                <View className="flex-row items-center justify-between w-full mb-12">
                     <Text className="text-brand-pink font-black uppercase text-[10px] tracking-widest">{uploadProgress}% SYNCED</Text>
                     <Text className={`${colors.textTertiary} font-black text-[10px] uppercase tracking-widest`}>FINALIZING...</Text>
                </View>

                <TouchableOpacity 
                    onPress={() => setIsUploading(false)}
                    className="bg-gray-100 dark:bg-gray-800 px-10 py-4 rounded-2xl"
                >
                    <Text className={`${colors.textTertiary} font-black uppercase tracking-widest text-xs`}>Cancel Request</Text>
                </TouchableOpacity>
            </View>
            {/* Background 3D Glow */}
            <View className="absolute inset-0 -z-10 bg-brand-pink/5 blur-3xl rounded-full" />
        </View>
      </Modal>

      <PremiumPopup
        visible={showSuccessModal}
        type="success"
        title="Epic Upload! 🚀"
        message="Your magical activity has been successfully published to the school gallery. Everyone is going to love it! ✨"
        buttonText="Back to Desk"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}
