import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, Activity } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      };

      await addActivity(newActivity);
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        setIsUploading(false);
        Alert.alert('Success', 'Activity posted to Kids Activity! 🎊');
        navigation.goBack();
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaType(type);
      setMediaUrl(result.assets[0].uri);
      
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
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="pt-4 pb-6 flex-row items-center justify-between">
            <View>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
              </TouchableOpacity>
              <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>Post</Text>
              <Text className="text-2xl font-bold text-brand-pink tracking-tight">Activity 🎨</Text>
            </View>
            <View className="bg-brand-pink w-20 h-20 rounded-3xl items-center justify-center shadow-lg border-4 border-white rotate-3">
              <MaterialCommunityIcons name="palette" size={48} color="white" />
            </View>
          </View>

          {/* Activity Title */}
          <View className="mb-6">
            <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-3 ml-1`}>Activity Name</Text>
            <View className={`flex-row items-center ${colors.surface} rounded-2xl px-5 border ${colors.border}`}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textTertiary} />
              <TextInput
                className={`flex-1 h-14 ml-3 font-bold ${colors.text}`}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Morning Drawing Session"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Student Selector */}
          <View className="mb-6">
            <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-3 ml-1`}>Tag Students ({selectedStudentIds.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
              <TouchableOpacity 
                onPress={() => {
                  if (selectedStudentIds.length === students.length) {
                    setSelectedStudentIds([]);
                  } else {
                    setSelectedStudentIds(students.map(s => s.id));
                  }
                }}
                className="items-center mr-4"
              >
                <View className={`w-16 h-16 rounded-2xl items-center justify-center border-2 border-dashed ${selectedStudentIds.length === students.length ? 'border-brand-pink bg-brand-pink/10' : (theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50')}`}>
                   <MaterialCommunityIcons name="check-all" size={24} color={selectedStudentIds.length === students.length ? '#F472B6' : (theme === 'dark' ? '#4B5563' : '#9CA3AF')} />
                </View>
                <Text className={`text-[10px] font-black mt-2 uppercase ${selectedStudentIds.length === students.length ? 'text-brand-pink' : colors.textTertiary}`}>Select All</Text>
              </TouchableOpacity>

              {students.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <TouchableOpacity 
                    key={student.id} 
                    onPress={() => toggleStudentSelection(student.id)}
                    className="items-center mr-4"
                  >
                    <View className={`w-16 h-16 rounded-2xl items-center justify-center overflow-hidden border-2 ${isSelected ? 'border-brand-pink' : (theme === 'dark' ? 'border-gray-700' : 'border-white')} shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-brand-pink/10'}`}>
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} className="w-full h-full" />
                      ) : (
                        <MaterialCommunityIcons name="account" size={32} color="#F472B6" />
                      )}
                      {isSelected && (
                        <View className="absolute inset-0 bg-brand-pink/20 items-center justify-center">
                          <MaterialCommunityIcons name="check-circle" size={28} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text className={`text-[10px] font-black mt-2 text-center w-16 ${isSelected ? 'text-brand-pink' : colors.textTertiary}`} numberOfLines={1}>{student.name.split(' ')[0]}</Text>
                    <Text className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{student.student_id || student.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-3 ml-1`}>Description</Text>
            <View className={`${colors.surface} rounded-3xl px-5 py-4 border ${colors.border}`}>
              <TextInput
                className={`flex-1 h-32 font-bold ${colors.text} text-base`}
                value={description}
                onChangeText={setDescription}
                placeholder="What did the kids do today?"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Media Upload */}
          <View className="mb-8">
            <Text className={`text-xs font-black uppercase tracking-widest ${colors.textTertiary} mb-3 ml-1`}>Select Media</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => pickMedia('image')}
                className={`flex-1 h-24 rounded-3xl border-2 border-dashed items-center justify-center ${mediaType === 'image' && mediaUrl ? 'bg-brand-pink/10 border-brand-pink' : (theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50')}`}
              >
                <MaterialCommunityIcons name="image-outline" size={32} color={mediaType === 'image' && mediaUrl ? '#F472B6' : (theme === 'dark' ? '#4B5563' : '#9CA3AF')} />
                <Text className={`text-[10px] font-black mt-1 uppercase ${mediaType === 'image' && mediaUrl ? 'text-brand-pink' : colors.textTertiary}`}>Add Image</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => pickMedia('video')}
                className={`flex-1 h-24 rounded-3xl border-2 border-dashed items-center justify-center ${mediaType === 'video' && mediaUrl ? 'bg-blue-500/10 border-blue-500' : (theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50')}`}
              >
                <MaterialCommunityIcons name="video-outline" size={32} color={mediaType === 'video' && mediaUrl ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#9CA3AF')} />
                <Text className={`text-[10px] font-black mt-1 uppercase ${mediaType === 'video' && mediaUrl ? 'text-blue-500' : colors.textTertiary}`}>Add Video</Text>
              </TouchableOpacity>
            </View>

            {mediaUrl && (
              <View className="mt-4 relative">
                <Image source={{ uri: thumbnailUrl || mediaUrl }} className="w-full h-48 rounded-3xl" />
                <View className="absolute inset-0 bg-black/10 rounded-3xl items-center justify-center">
                  <MaterialCommunityIcons 
                    name={mediaType === 'video' ? "play-circle" : "image-check"} 
                    size={48} 
                    color="white" 
                  />
                </View>
                <TouchableOpacity 
                   onPress={() => {setMediaUrl(null); setThumbnailUrl(null);}}
                   className="absolute top-2 right-2 bg-black/50 w-8 h-8 rounded-full items-center justify-center"
                >
                  <MaterialCommunityIcons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Post Button */}
          <TouchableOpacity 
            onPress={handlePost}
            className="bg-brand-pink py-5 rounded-[28px] items-center shadow-lg shadow-pink-200 mb-20"
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="send" size={20} color="white" />
              <Text className="text-white font-black text-lg ml-2">Post Activity</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Uploading Progress Overlay */}
      <Modal visible={isUploading} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-10">
          <View className={`w-full ${colors.surface} rounded-[40px] p-8 items-center border ${colors.border} shadow-2xl`}>
            <View className="bg-brand-pink/10 w-20 h-20 rounded-full items-center justify-center mb-6">
              <ActivityIndicator size="large" color="#F472B6" />
            </View>
            
            <Text className={`text-2xl font-black ${colors.text} mb-2`}>Uploading Post</Text>
            <Text className={`text-sm ${colors.textSecondary} text-center mb-8`}>
              Sharing your magical moment with parents... ✨
            </Text>

            {/* Progress Bar */}
            <View className={`w-full h-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full overflow-hidden mb-4 border ${colors.border}`}>
              <View 
                style={{ width: `${uploadProgress}%` }}
                className="h-full bg-brand-pink rounded-full"
              />
            </View>
            <Text className="text-brand-pink font-black mb-10">{uploadProgress}% Complete</Text>

            <TouchableOpacity 
              onPress={() => setIsUploading(false)}
              className={`px-8 py-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl`}
            >
              <Text className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cancel Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
