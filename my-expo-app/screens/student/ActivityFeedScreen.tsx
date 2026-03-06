import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Dimensions, FlatList, Animated, StyleSheet, StatusBar, Alert, Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumPopup from '../../components/PremiumPopup';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = SCREEN_WIDTH / 3;

interface Student {
  id: string;
  name: string;
  avatar: string;
  studentId?: string;
}

interface Activity {
  id: string;
  type: 'image' | 'video';
  title: string;
  media: string;
  thumbnail: string;
  studentName: string;
  studentId: string;
  studentAvatar: string;
  timestamp: string;
  groupParticipants: Student[];
  layoutType: 'square' | 'tall';
  likesCount: number;
  comments: any[];
}

interface ActivityFeedScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
  route?: {
    params?: {
      id?: string | number;
      [key: string]: any;
    };
  };
}

// Separate component to handle per-item video references and local state if needed
const ReelItem = React.memo(({ 
  item, 
  showReel, 
  isActive,
  user, 
  onDelete, 
  onClose, 
  onOpenGroup,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onComment
}: { 
  item: Activity, 
  showReel: boolean, 
  isActive: boolean,
  user: any,
  onDelete: (id: string) => void,
  onClose: () => void,
  onOpenGroup: (p: Student[]) => void,
  isLiked: boolean,
  isSaved: boolean,
  onLike: () => void,
  onSave: () => void,
  onComment: (id: string) => void
}) => {
  const videoRef = useRef<Video>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const [duration, setDuration] = useState(1);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const fileName = `${item.title.replace(/\s/g, '_')}_${item.id}${item.type === 'video' ? '.mp4' : '.jpg'}`;
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) throw new Error('Cache directory not available');
      const fileUri = `${cacheDir}${fileName}`;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        item.media,
        fileUri,
        {},
        (p) => {
          const prog = p.totalBytesWritten / p.totalBytesExpectedToWrite;
          setDownloadProgress(prog);
        }
      );

      const res = await downloadResumable.downloadAsync();
      if (res) {
        await Sharing.shareAsync(res.uri);
      }
      setIsDownloading(false);
    } catch (e) {
      console.error(e);
      setIsDownloading(false);
      Alert.alert('Error', 'Failed to download media');
    }
  };

  const handleShare = async () => {
    try {
      await Sharing.shareAsync(item.media, {
        dialogTitle: `Check out ${item.studentName}'s activity!`,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share link');
    }
  };

  useEffect(() => {
    if (isActive && showReel && !isPaused) {
      if (item.type === 'image') {
        // Calculate remaining duration based on current progress value
        const currentVal = (progress as any)._value || 0;
        const remainingDuration = 7000 * (1 - currentVal);
        
        animationRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: remainingDuration,
          useNativeDriver: false,
        });
        animationRef.current.start();
      }
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (!isActive || !showReel) {
        progress.setValue(0);
      }
    }
  }, [isActive, showReel, isPaused, item.type]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    
    if (status.durationMillis) {
      setDuration(status.durationMillis);
      const prog = status.positionMillis / status.durationMillis;
      progress.setValue(prog);
    }
  };

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
      {/* Background Layer */}
      <Image 
        source={{ uri: item.thumbnail }} 
        style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} 
        blurRadius={100}
      />

      {/* Right Interaction Sidebar */}
      {!isPaused && (
        <View style={styles.rightBar}>
          <TouchableOpacity onPress={onLike} className="items-center mb-4">
            <MaterialCommunityIcons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={32} 
              color={isLiked ? "#EF4444" : "white"} 
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2 }}
            />
            <Text className="text-white text-xs font-black mt-1" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 }}>{item.likesCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onComment(item.id)} className="items-center mb-4">
            <MaterialCommunityIcons 
              name="comment-text-outline" 
              size={28} 
              color="white" 
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2 }}
            />
            <Text className="text-white text-xs font-black mt-1" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 }}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSave} className="items-center mb-4">
            <MaterialCommunityIcons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={28} 
              color={isSaved ? "#FBBF24" : "white"} 
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDownload} className="items-center">
            <MaterialCommunityIcons 
              name="download" 
              size={28} 
              color="#10B981" 
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2 }}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Download Progress Overlay */}
      {isDownloading && (
        <View style={StyleSheet.absoluteFill} className="bg-black/80 items-center justify-center z-50">
          <View className="bg-white/10 p-8 rounded-[40px] items-center border border-white/10 backdrop-blur-3xl w-60">
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="text-white font-black mt-6">Downloading...</Text>
            <Text className="text-green-400 font-black mt-1">{(downloadProgress * 100).toFixed(0)}%</Text>
            <View className="w-full h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
               <View style={{ width: `${downloadProgress * 100}%` }} className="h-full bg-green-500" />
            </View>
          </View>
        </View>
      )}
      <TouchableOpacity 
        activeOpacity={1}
        onLongPress={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        style={StyleSheet.absoluteFill}
      >
        {item.type === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: item.media }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={showReel && isActive && !isPaused}
            isLooping
            isMuted={!(showReel && isActive)}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            useNativeControls={false}
          />
        ) : (
          <Image 
            source={{ uri: item.media }} 
            style={StyleSheet.absoluteFill} 
            resizeMode="contain" 
          />
        )}
      </TouchableOpacity>
      
      {/* Top Overlay - Hidden when paused to "free" the view */}
      {!isPaused && (
        <View style={styles.topOverlay}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pt-4">
            <View className="h-[2px] bg-white/20 rounded-full overflow-hidden">
              <Animated.View 
                style={{
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  height: '100%',
                  backgroundColor: 'white'
                }}
              />
            </View>
          </View>
          
          <View className="flex-row items-center justify-between px-6 py-6">
            <View className="bg-black/60 px-4 py-1.5 rounded-full border border-white/20 flex-row items-center">
              <MaterialCommunityIcons 
                name={item.type === 'video' ? 'video' : 'camera'} 
                size={12} 
                color="white" 
                style={{marginRight: 6}}
              />
              <Text className="text-white font-bold text-[10px] tracking-[1px]">{item.type.toUpperCase()}</Text>
            </View>
            <View className="flex-row items-center">
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <TouchableOpacity 
                  onPress={() => onDelete(item.id)} 
                  className="bg-red-500/60 w-11 h-11 rounded-full items-center justify-center border border-white/20 mr-3"
                >
                  <MaterialCommunityIcons name="delete" size={24} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={onClose} 
                className="bg-black/60 w-11 h-11 rounded-full items-center justify-center border border-white/20"
              >
                <MaterialCommunityIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        </View>
      )}

      {/* Bottom Content Area - Hidden when paused */}
      {!isPaused && (
        <View style={styles.bottomOverlay}>
          <View className="flex-row items-center mb-6">
            <View className="bg-white w-14 h-14 rounded-full p-0.5 mr-4 border-2 border-brand-pink overflow-hidden">
              <Image source={{ uri: item.studentAvatar }} className="w-full h-full rounded-full" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-black mb-0.5" numberOfLines={1}>{item.studentName}</Text>
              <Text className="text-white/70 text-sm font-bold tracking-tight">ID: {item.studentId}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onOpenGroup(item.groupParticipants)}
              className="bg-brand-pink/50 w-12 h-12 rounded-2xl items-center justify-center border border-white/20"
            >
              <View className="relative">
                <MaterialCommunityIcons name="account-group" size={26} color="white" />
                {item.groupParticipants.length > 0 && (
                  <View className="absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-brand-pink text-[10px] font-black">{item.groupParticipants.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View className="bg-black/70 p-6 rounded-[32px] border border-white/10 backdrop-blur-3xl shadow-2xl">
            <Text className="text-white font-black text-lg mb-2 leading-6">{item.title}</Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="clock-outline" size={14} color="#F472B6" />
              <Text className="text-brand-pink/90 text-[10px] ml-1.5 font-black uppercase tracking-widest">{item.timestamp}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

const CommentModal = ({ 
  visible, 
  onClose, 
  activityId,
  comments,
  colors,
  theme 
}: { 
  visible: boolean, 
  onClose: () => void, 
  activityId: string | null,
  comments: any[],
  colors: any,
  theme: string
}) => {
  const [commentText, setCommentText] = useState('');
  const { addComment } = useAuth();

  const handleSend = async () => {
    if (commentText.trim() && activityId) {
      await addComment(activityId, commentText);
      setCommentText('');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className={`${colors.surface} rounded-t-[40px] p-8 border-t border-white/10 shadow-2xl maxHeight-[80%]`}>
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6 opacity-30" />
          <View className="flex-row items-center justify-between mb-8">
            <Text className={`text-3xl font-black ${colors.text}`}>Comments 💭</Text>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
               <MaterialCommunityIcons name="close" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView className="mb-6 space-y-6" showsVerticalScrollIndicator={false}>
            {comments.map(c => (
              <View key={c.id} className="flex-row items-start mb-6">
                <View className="bg-brand-pink/20 w-10 h-10 rounded-full items-center justify-center mr-4 overflow-hidden">
                  {c.avatar ? (
                    <Image source={{ uri: c.avatar }} className="w-full h-full" />
                  ) : (
                    <Text className="text-brand-pink font-black">{c.user[0]}</Text>
                  )}
                </View>
                <View className="flex-1 bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`font-black text-sm ${colors.text}`}>{c.user}</Text>
                    <Text className="text-[10px] text-gray-400">{c.time}</Text>
                  </View>
                  <Text className={`${colors.textSecondary} text-sm leading-5`}>{c.text}</Text>
                </View>
              </View>
            ))}
            {comments.length === 0 && (
              <View className="py-10 items-center">
                <MaterialCommunityIcons name="comment-off-outline" size={48} color={colors.textTertiary} />
                <Text className={`text-sm font-bold ${colors.textTertiary} mt-2`}>No comments yet. Be the first!</Text>
              </View>
            )}
          </ScrollView>

          <View className="flex-row items-center bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-white/5 mb-4">
            <TextInput 
              placeholder="Add a comment..." 
              placeholderTextColor={colors.textTertiary}
              className={`flex-1 px-4 py-3 font-bold ${colors.text}`}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity 
              className="bg-brand-pink w-12 h-12 rounded-xl items-center justify-center shadow-lg shadow-pink-500/30"
              onPress={handleSend}
            >
              <MaterialCommunityIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default function ActivityFeedScreen({ navigation, route }: ActivityFeedScreenProps) {
  const { colors, theme } = useTheme();
  const { activities, users, user, deleteActivity } = useAuth();
  
  const [selectedInitialIndex, setSelectedInitialIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showReel, setShowReel] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isMyKidOnly, setIsMyKidOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<Student[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const { likeActivity } = useAuth();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSavedData = async () => {
      const saved = await AsyncStorage.getItem('saved_activities');
      const liked = await AsyncStorage.getItem('liked_activities');
      if (saved) setSavedIds(JSON.parse(saved));
      if (liked) setLikedIds(JSON.parse(liked));
    };
    loadSavedData();
  }, []);

  const toggleSave = useCallback(async (id: string) => {
    setSavedIds(prev => {
      const isSaved = prev.includes(id);
      const next = isSaved ? prev.filter(sid => sid !== id) : [...prev, id];
      AsyncStorage.setItem('saved_activities', JSON.stringify(next));
      return next;
    });
  }, []); // Removed [activeTab] to prevent potential loop

  const toggleLike = useCallback(async (id: string) => {
    setLikedIds(prev => {
      const next = prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id];
      AsyncStorage.setItem('liked_activities', JSON.stringify(next));
      if (!prev.includes(id)) {
        likeActivity(id);
      }
      return next;
    });
  }, [likeActivity]);

  // Use state to store balanced columns
  const [columns, setColumns] = useState<Activity[][]>([[], [], []]);

  // Convert AuthContext activities to the grid activity format
  const gridActivities: Activity[] = useMemo(() => {
    let filtered = activities;
    
    if (isMyKidOnly && user && user.role === 'student') {
      const studentIdStr = user.studentId || user.id.toString();
      filtered = activities.filter(act => 
        act.studentIds?.some(id => id.toString() === studentIdStr)
      );
    }

    if (activeTab === 'saved') {
      filtered = filtered.filter(a => savedIds.includes(a.id));
    }

    return filtered.map((act, index) => {
      const taggedStudents = users.filter(u => act.studentIds?.includes(u.id));
      const primaryStudent = taggedStudents.length > 0 ? taggedStudents[0] : null;
      
      return {
        id: act.id,
        type: (act.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
        title: act.title,
        media: act.mediaUrl,
        thumbnail: act.thumbnailUrl || act.mediaUrl,
        studentName: primaryStudent ? primaryStudent.name : act.author,
        studentId: primaryStudent ? (primaryStudent.studentId || primaryStudent.id) : 'ADMIN',
        studentAvatar: primaryStudent?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + act.author,
        timestamp: act.date,
        groupParticipants: taggedStudents.map(s => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar || '',
          studentId: s.studentId || s.id
        })),
        layoutType: index % 3 === 1 ? 'tall' : 'square',
        likesCount: act.likesCount || 0,
        comments: act.comments || []
      };
    });
  }, [activities, users, isMyKidOnly, user, savedIds, activeTab]);

  // Handle deep linking from notifications
  useEffect(() => {
    if (route?.params?.id && gridActivities.length > 0) {
      const targetId = route.params.id.toString();
      const index = gridActivities.findIndex(a => a.id.toString() === targetId);
      if (index !== -1) {
        // Small delay to ensure layout is ready
        const timer = setTimeout(() => {
          openReel(index);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [route?.params?.id, gridActivities.length]);

  // Balancing columns logic
  useEffect(() => {
    let colHeights = [0, 0, 0];
    let tempCols: Activity[][] = [[], [], []];

    gridActivities.forEach((activity) => {
      let minHeight = Math.min(...colHeights);
      let colIndex = colHeights.indexOf(minHeight);
      tempCols[colIndex].push(activity);
      colHeights[colIndex] += activity.layoutType === 'tall' ? 2 : 1;
    });

    setColumns(tempCols);
  }, [gridActivities]);

  const openReel = useCallback((index: number) => {
    setSelectedInitialIndex(index);
    setActiveIndex(index);
    setShowReel(true);
  }, []);

  const closeReel = useCallback(() => {
    setShowReel(false);
  }, []);

  const handleDelete = useCallback((activityId: string) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? 🗑️',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteActivity(activityId);
            if (success) {
              closeReel();
            }
          }
        }
      ]
    );
  }, [deleteActivity, closeReel]);

  const openGroupModal = useCallback((participants: Student[]) => {
    setCurrentParticipants(participants);
    setShowGroupModal(true);
  }, []);

  const renderReelItem = useCallback(({ item, index }: { item: Activity, index: number }) => (
    <ReelItem 
      item={item}
      showReel={showReel}
      isActive={activeIndex === index}
      user={user}
      onDelete={handleDelete}
      onClose={closeReel}
      onOpenGroup={openGroupModal}
      isLiked={likedIds.includes(item.id)}
      isSaved={savedIds.includes(item.id)}
      onLike={() => toggleLike(item.id)}
      onSave={() => toggleSave(item.id)}
      onComment={(id) => {
        setActiveActivityId(id);
        setShowCommentModal(true);
      }}
    />
  ), [showReel, activeIndex, user, handleDelete, closeReel, openGroupModal, likedIds, savedIds, toggleLike, toggleSave]);

  return (
    <View className={`flex-1 ${colors.background}`}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border} shadow-sm`}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>Kids Activity</Text>
                <Text className="text-2xl font-bold text-brand-pink tracking-tight">Highlights 📸</Text>
              </View>
              {user?.role === 'student' && (
                <TouchableOpacity 
                  onPress={() => setIsMyKidOnly(!isMyKidOnly)}
                  activeOpacity={0.8}
                  className={`flex-row items-center px-4 py-2 rounded-2xl border ${isMyKidOnly ? 'bg-brand-pink border-brand-pink' : colors.surface + ' ' + colors.border} shadow-sm`}
                >
                  <MaterialCommunityIcons 
                    name={isMyKidOnly ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                    size={20} 
                    color={isMyKidOnly ? "white" : colors.textTertiary} 
                  />
                  <Text className={`ml-2 font-black text-xs ${isMyKidOnly ? 'text-white' : colors.textSecondary}`}>MY KID</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {user?.role !== 'student' && (
            <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 border-white rotate-6 ml-4">
              <MaterialCommunityIcons name="lightning-bolt" size={32} color="#92400E" />
            </View>
          )}
        </View>
      </View>

      {/* Tab Selector Dropdown */}
      <View className="px-8 mb-6 mt-2 relative z-50">
        <TouchableOpacity 
          onPress={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
          activeOpacity={0.9}
          className={`flex-row items-center justify-between px-6 py-4 rounded-3xl ${colors.surface} border ${colors.border} shadow-sm`}
        >
          <View className="flex-row items-center">
            <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${activeTab === 'posts' ? 'bg-brand-pink' : 'bg-amber-400'}`}>
              <MaterialCommunityIcons name={activeTab === 'posts' ? "grid" : "bookmark"} size={16} color="white" />
            </View>
            <Text className={`font-black text-sm uppercase tracking-widest ${colors.text}`}>
              {activeTab === 'posts' ? 'School Posts' : 'My Saved'}
            </Text>
          </View>
          <MaterialCommunityIcons 
            name={isTabDropdownOpen ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={colors.textTertiary} 
          />
        </TouchableOpacity>

        {isTabDropdownOpen && (
          <View className={`absolute top-[72px] left-8 right-8 ${colors.surface} rounded-[32px] border ${colors.border} shadow-2xl overflow-hidden z-50`}>
            <TouchableOpacity 
              onPress={() => {
                setActiveTab('posts');
                setIsTabDropdownOpen(false);
              }}
              className={`flex-row items-center px-6 py-5 border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} ${activeTab === 'posts' ? 'bg-brand-pink/5' : ''}`}
            >
              <MaterialCommunityIcons name="grid" size={20} color={activeTab === 'posts' ? '#F472B6' : colors.textTertiary} />
              <Text className={`ml-4 font-black ${activeTab === 'posts' ? 'text-brand-pink' : colors.textSecondary}`}>School Highlights</Text>
              {activeTab === 'posts' && <MaterialCommunityIcons name="check" size={20} color="#F472B6" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setActiveTab('saved');
                setIsTabDropdownOpen(false);
              }}
              className={`flex-row items-center px-6 py-5 ${activeTab === 'saved' ? 'bg-amber-400/5' : ''}`}
            >
              <MaterialCommunityIcons name="bookmark" size={20} color={activeTab === 'saved' ? '#FBBF24' : colors.textTertiary} />
              <Text className={`ml-4 font-black ${activeTab === 'saved' ? 'text-amber-500' : colors.textSecondary}`}>Saved Moments</Text>
              {activeTab === 'saved' && <MaterialCommunityIcons name="check" size={20} color="#FBBF24" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Balanced Masonry Grid */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row px-0.5">
          {columns.map((col, colIdx) => (
            <View key={colIdx} style={{ flex: 1 }}>
              {col.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={{ 
                    width: '100%', 
                    height: activity.layoutType === 'tall' ? COLUMN_WIDTH * 2 : COLUMN_WIDTH,
                    padding: 0.5,
                  }}
                  activeOpacity={0.9}
                  onPress={() => {
                    const idx = gridActivities.findIndex(a => a.id === activity.id);
                    if (idx !== -1) openReel(idx);
                  }}
                >
                  <View className="w-full h-full overflow-hidden" style={{ backgroundColor: theme === 'dark' ? '#111827' : '#F3F4F6' }}>
                    <Image source={{ uri: activity.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <View className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded-lg flex-row items-center border border-white/20">
                      <MaterialCommunityIcons 
                        name={activity.type === 'video' ? 'play' : 'image'} 
                        size={12} 
                        color="white" 
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
        {gridActivities.length === 0 && (
          <View className="py-20 items-center">
            <MaterialCommunityIcons name={activeTab === 'saved' ? "bookmark-outline" : "image-off-outline"} size={64} color={colors.textTertiary} />
            <Text className={`text-lg font-bold ${colors.textTertiary} mt-4`}>
              {activeTab === 'saved' ? "No saved highlights yet" : "No magical moments yet"}
            </Text>
          </View>
        )}
        <View className="h-32" />
      </ScrollView>

      {/* Reel Modal */}
      <Modal visible={showReel} transparent={false} animationType="fade" onRequestClose={closeReel}>
        <FlatList
          data={gridActivities}
          renderItem={renderReelItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          horizontal={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={selectedInitialIndex}
          getItemLayout={(data, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
            setActiveIndex(index);
          }}
        />
      </Modal>

      <PremiumPopup
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Active Group"
        type="action"
        icon="account-group"
        buttonText="Great! Close"
        onButtonPress={() => setShowGroupModal(false)}
      >
        <View>
          {currentParticipants.length > 0 ? (
            currentParticipants.map((p) => (
              <View key={p.id} className={`${theme === 'dark' ? 'bg-[#1a1a18]' : 'bg-gray-50'} rounded-[36px] p-5 mb-5 flex-row items-center border ${theme === 'dark' ? 'border-gray-800' : 'border-brand-pink/10'} shadow-sm`}>
                <View className="relative">
                  {p.avatar ? (
                    <Image source={{ uri: p.avatar }} className="w-16 h-16 rounded-[24px] border-4 border-white shadow-xl" />
                  ) : (
                    <View className={`w-16 h-16 rounded-[24px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-brand-pink/10'} items-center justify-center border-4 border-white shadow-xl`}>
                      <MaterialCommunityIcons name="account-child" size={36} color="#F472B6" />
                    </View>
                  )}
                  <View className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white items-center justify-center">
                    <MaterialCommunityIcons name="check" size={12} color="white" />
                  </View>
                </View>
                <View className="ml-5 flex-1">
                  <Text className={`font-black ${colors.text} text-xl tracking-tight`}>{p.name}</Text>
                  <View className="bg-brand-pink/10 self-start px-3 py-0.5 rounded-lg mt-1 border border-brand-pink/20">
                    <Text className="text-brand-pink font-black text-[9px] uppercase tracking-widest">ID: {p.studentId || "N/A"}</Text>
                  </View>
                </View>
                <View className="bg-brand-pink/5 w-10 h-10 rounded-xl items-center justify-center">
                  <MaterialCommunityIcons name="star-face" size={24} color="#F472B6" />
                </View>
              </View>
            ))
          ) : (
            <View className="py-10 items-center">
              <MaterialCommunityIcons name="account-off-outline" size={60} color={colors.textTertiary} />
              <Text className={`text-lg font-bold ${colors.textTertiary} mt-4`}>No specific students tagged</Text>
            </View>
          )}
        </View>
      </PremiumPopup>

      <CommentModal 
        visible={showCommentModal} 
        onClose={() => setShowCommentModal(false)} 
        activityId={activeActivityId}
        comments={gridActivities.find(a => a.id === activeActivityId)?.comments || []}
        colors={colors}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingBottom: 20,
    zIndex: 10
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    paddingBottom: 60,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 10
  },
  rightBar: {
    position: 'absolute',
    right: 15,
    top: '38%',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
