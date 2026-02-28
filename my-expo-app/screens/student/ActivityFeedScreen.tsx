import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Dimensions, FlatList, Animated, StyleSheet, StatusBar, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = SCREEN_WIDTH / 3;

interface Student {
  id: string;
  name: string;
  avatar: string;
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
}

interface ActivityFeedScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

// Separate component to handle per-item video references and local state if needed
const ReelItem = React.memo(({ 
  item, 
  showReel, 
  progress, 
  user, 
  onDelete, 
  onClose, 
  onOpenGroup 
}: { 
  item: Activity, 
  showReel: boolean, 
  progress: Animated.Value,
  user: any,
  onDelete: (id: string) => void,
  onClose: () => void,
  onOpenGroup: (p: Student[]) => void
}) => {
  const videoRef = useRef<Video>(null);

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
      {/* Background Layer */}
      <Image 
        source={{ uri: item.thumbnail }} 
        style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} 
        blurRadius={100}
      />

      {/* Media Layer */}
      {item.type === 'video' ? (
        <Video
          ref={videoRef}
          source={{ uri: item.media }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={showReel}
          isLooping
          useNativeControls={false}
        />
      ) : (
        <Image 
          source={{ uri: item.media }} 
          style={StyleSheet.absoluteFill} 
          resizeMode="contain" 
        />
      )}
      
      {/* Top Overlay */}
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

      {/* Bottom Content Area */}
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
    </View>
  );
});

export default function ActivityFeedScreen({ navigation }: ActivityFeedScreenProps) {
  const { colors, theme } = useTheme();
  const { activities, users, user, deleteActivity } = useAuth();
  const [selectedInitialIndex, setSelectedInitialIndex] = useState(0);
  const [showReel, setShowReel] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState<Student[]>([]);
  const progress = useRef(new Animated.Value(0)).current;

  // Use state to store balanced columns
  const [columns, setColumns] = useState<Activity[][]>([[], [], []]);

  // Convert AuthContext activities to the grid activity format
  const gridActivities: Activity[] = useMemo(() => {
    return activities.map((act, index) => {
      // Find the specific students tagged in this activity
      const taggedStudents = users.filter(u => act.studentIds?.includes(u.id));
      
      const primaryStudent = taggedStudents.length > 0 ? taggedStudents[0] : null;
      
      return {
        id: act.id,
        type: act.mediaType || 'image',
        title: act.title,
        media: act.mediaUrl,
        thumbnail: act.thumbnailUrl || act.mediaUrl,
        studentName: primaryStudent ? primaryStudent.name : act.author,
        studentId: primaryStudent ? (primaryStudent.student_id || primaryStudent.id) : 'ADMIN',
        studentAvatar: primaryStudent?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + act.author,
        timestamp: act.date,
        groupParticipants: taggedStudents.map(s => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + s.id
        })),
        // Alternate tall and square for that masonry look
        layoutType: index % 3 === 1 ? 'tall' : 'square'
      };
    });
  }, [activities, users]);

  // Balancing columns logic
  useEffect(() => {
    let colHeights = [0, 0, 0];
    let tempCols: Activity[][] = [[], [], []];

    gridActivities.forEach((activity) => {
      // Find index of shortest column
      let minHeight = Math.min(...colHeights);
      let colIndex = colHeights.indexOf(minHeight);

      tempCols[colIndex].push(activity);
      colHeights[colIndex] += activity.layoutType === 'tall' ? 2 : 1;
    });

    setColumns(tempCols);
  }, [gridActivities]);

  const startProgress = useCallback(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const openReel = useCallback((index: number) => {
    setSelectedInitialIndex(index);
    setShowReel(true);
    startProgress();
  }, [startProgress]);

  const closeReel = useCallback(() => {
    setShowReel(false);
    progress.setValue(0);
  }, [progress]);

  const handleDelete = useCallback((activityId: string) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This action cannot be undone. 🗑️',
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

  const renderReelItem = useCallback(({ item }: { item: Activity }) => (
    <ReelItem 
      item={item}
      showReel={showReel}
      progress={progress}
      user={user}
      onDelete={handleDelete}
      onClose={closeReel}
      onOpenGroup={openGroupModal}
    />
  ), [showReel, progress, user, handleDelete, closeReel, openGroupModal]);

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
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
            <Text className={`text-5xl font-black ${colors.text} tracking-tighter`}>Kids Activity</Text>
            <Text className="text-2xl font-bold text-brand-pink tracking-tight">Highlights 📸</Text>
          </View>
          <View className="bg-brand-yellow w-16 h-16 rounded-3xl items-center justify-center shadow-2xl border-4 border-white rotate-6">
            <MaterialCommunityIcons name="lightning-bolt" size={32} color="#92400E" />
          </View>
        </View>
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
          onMomentumScrollEnd={() => startProgress()}
        />
      </Modal>

      {/* Group Modal */}
      <Modal visible={showGroupModal} transparent={true} animationType="fade" onRequestClose={() => setShowGroupModal(false)}>
        <View className="flex-1 bg-black/90 justify-end items-center">
          <View className={`${colors.surface} w-full rounded-t-[50px] p-10 border-t-4 border-brand-pink shadow-2xl`}>
            <View className="w-16 h-1.5 bg-gray-300 rounded-full self-center mb-8 opacity-50" />
            <Text className={`text-3xl font-black ${colors.text} mb-8 tracking-tight`}>Active Group 👥</Text>
            {currentParticipants.length > 0 ? (
              currentParticipants.map((p) => (
                <View key={p.id} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-[32px] p-5 mb-5 flex-row items-center border border-brand-pink/10`}>
                  <Image source={{ uri: p.avatar }} className="w-14 h-14 rounded-full mr-5 border-4 border-white shadow-md" />
                  <View>
                    <Text className={`font-black ${colors.text} text-lg`}>{p.name}</Text>
                    <Text className="text-brand-pink font-black text-[10px] uppercase tracking-widest">Verified Student</Text>
                  </View>
                  <View className="flex-1 items-end">
                    <MaterialCommunityIcons name="check-decagram" size={24} color="#10B981" />
                  </View>
                </View>
              ))
            ) : (
              <View className="py-10 items-center">
                <MaterialCommunityIcons name="account-off-outline" size={60} color={colors.textTertiary} />
                <Text className={`text-lg font-bold ${colors.textTertiary} mt-4`}>No specific students tagged</Text>
              </View>
            )}
            <TouchableOpacity 
              onPress={() => setShowGroupModal(false)} 
              className="bg-brand-pink py-6 rounded-[32px] mt-4 items-center shadow-2xl shadow-pink-500/50 active:scale-95"
            >
              <Text className="text-white font-black text-xl">Great! Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  }
});
