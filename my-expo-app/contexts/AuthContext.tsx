import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import api, { setAuthToken, getMediaUrl } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { registerForPushNotificationsAsync, savePushToken } from '../services/notifications';

export type UserRole = 'admin' | 'student' | 'teacher';

export interface User {
  id: string;
  email?: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  studentId?: string;
  teacherId?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  parentName?: string; 
  guardianPhone?: string;
  bloodGroup?: string;
  address?: string;
  category?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  studentPhoto?: string;
  fatherPhoto?: string;
  motherPhoto?: string;
  guardianPhoto?: string;
  fees?:          string;
  admissionDate?: string;
  fee_due_day?:   string;
  notification_settings?: {
    enabled?: boolean;
    payment?: boolean;
    attendance?: boolean;
    activity?: boolean;
  };
}

export interface FeeRecord {
    id: string;
    student_id: string;
    student_name: string;
    type: string;
    amount: number;
    status: 'paid' | 'unpaid';
    date: string;
    due_date?: string;
    paid_at?: string;
}

export interface FeeStructure {
    id: string;
    name: string;
    amount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  target: 'all' | 'student' | 'teacher';
  author: string;
}

export interface Comment {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  time: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  date: string;
  author: string;
  studentIds: string[];
  likesCount: number;
  comments: Comment[];
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  announcements: Announcement[];
  activities: Activity[];
  transactions: Transaction[];
  fees: FeeRecord[];
  feeStructures: FeeStructure[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  testLogin: (role: UserRole) => void;
  logout: () => void;
  addUser: (newUser: any) => Promise<void>;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  updateProfile: (updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addActivity: (activity: Activity) => Promise<void>;
  deleteActivity: (id: string) => Promise<boolean>;
  likeActivity: (id: string) => Promise<void>;
  addComment: (activityId: string, text: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateAvatar: () => Promise<void>;
  refreshFees: () => Promise<void>;
  updateNotificationSettings: (settings: any) => Promise<boolean>;
  fetchData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  // If it's an object, look for the first property that IS an array
  for (const key in data) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const auth_token = await AsyncStorage.getItem('auth_token');
      if (!auth_token) return;
      
      const [usersRes, announcementsRes, activitiesRes, transactionsRes, feesRes, feeStructuresRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/announcements').catch(() => ({ data: [] })),
        api.get('/activities').catch(() => ({ data: [] })),
        api.get('/transactions').catch(() => ({ data: [] })),
        api.get('/fees').catch(() => ({ data: [] })),
        api.get('/fee-structures').catch(() => ({ data: [] }))
      ]);

      setUsers(resolveArray(usersRes.data).map((u: any) => mapUser(u)));

      setAnnouncements(resolveArray(announcementsRes.data).map((a: any) => ({
        id: (a.id || a.announcement_id || Math.random()).toString(),
        title: a.title || 'Untitled',
        content: a.content || a.message || '',
        image: getMediaUrl(a.image_url || a.image || a.banner),
        date: a.date || a.created_at || new Date().toISOString().split('T')[0],
        target: a.target || 'all',
        author: a.author || 'Admin',
      })));

      setActivities(resolveArray(activitiesRes.data).map((a: any) => ({
        id: (a.id || Math.random()).toString(),
        title: a.title || 'Activity',
        description: a.description || '',
        mediaType: a.media_type || 'image',
        mediaUrl: getMediaUrl(a.media_url || a.image || a.video) || '',
        thumbnailUrl: getMediaUrl(a.thumbnail_url || a.thumb),
        date: a.date || a.created_at,
        author: a.author || 'Teacher',
        studentIds: a.student_id ? [a.student_id.toString()] : (a.students ? a.students.map((s: any) => s.id.toString()) : []),
        likesCount: a.likes_count || a.likes || 0,
        comments: a.comments ? a.comments.map((c: any) => ({
          id: c.id.toString(),
          user: c.user?.name || 'User',
          avatar: getMediaUrl(c.user?.avatar),
          text: c.text || c.comment || '',
          time: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'
        })) : []
      })));

      setTransactions(resolveArray(transactionsRes.data).map((t: any) => ({
        id:       (t.id || Math.random()).toString(),
        name:     t.name || t.description || 'Transaction',
        amount:   parseFloat(t.amount) || 0,
        category: t.category || 'General',
        type:     t.type || 'expense',
        date:     t.date || t.created_at,
      })));

      setFees(resolveArray(feesRes.data).map((f: any) => ({
          id: (f.id || Math.random()).toString(),
          student_id: (f.student_id || '').toString(),
          student_name: f.student_name || 'Student',
          type: f.type || 'Monthly Fee',
          amount: parseFloat(f.amount) || 0,
          status: f.status || 'unpaid',
          date: f.date || f.created_at,
          due_date: f.due_date,
          paid_at: f.paid_at
        })));

      setFeeStructures(resolveArray(feeStructuresRes.data).map((fs: any) => ({
          id: (fs.id || Math.random()).toString(),
          name: fs.name || 'Fee Structure',
          amount: parseFloat(fs.amount) || 0
      })));

      // If everything returned empty, maybe tell the user?
      if (resolveArray(announcementsRes.data).length === 0) {
        console.warn('No announcements found on server');
      }

    } catch (error) {
      console.error('CRITICAL: Data Mapping Error:', error);
      // Don't alert here to avoid annoying user, just log
    }
  }, []);

  const setupPushNotifications = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await savePushToken(token);
      }
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }, []);

  const refreshFees = useCallback(async () => {
    try {
      const res = await api.get('/fees');
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setFees(data.map((f: any) => ({
        id: f.id.toString(),
        student_id: f.student_id,
        student_name: f.student_name,
        type: f.type,
        amount: parseFloat(f.amount) || 0,
        status: f.status,
        date: f.date,
        due_date: f.due_date,
        paid_at: f.paid_at
      })));
    } catch (e) {}
  }, []);

  const mapUser = (u: any): User => ({
    id:            u.id.toString(),
    name:          u.name,
    username:      u.username,
    email:         u.email,
    role:          u.role,
    avatar:        getMediaUrl(u.avatar),
    status:        u.status,
    studentId:     u.student_id,
    teacherId:     u.teacher_id,
    fatherName:    u.father_name,
    motherName:    u.mother_name,
    fatherPhone:   u.father_phone,
    motherPhone:   u.mother_phone,
    parentName:    u.parent_name,
    guardianPhone: u.guardian_phone,
    bloodGroup:    u.blood_group,
    address:       u.address,
    category:      u.category,
    phone:         u.phone,
    gender:        u.gender,
    date_of_birth: u.date_of_birth,
    studentPhoto:  getMediaUrl(u.student_photo),
    fatherPhoto:   getMediaUrl(u.father_photo),
    motherPhoto:   getMediaUrl(u.mother_photo),
    guardianPhoto: getMediaUrl(u.guardian_photo),
    fees:          u.fees,
    admissionDate: u.admission_date,
    fee_due_day:   u.fee_due_day,
    notification_settings: u.notification_settings,
  });

  const mapToBackend = (data: any) => {
    const mapped: any = { ...data };
    
    // Mapping camelCase to snake_case for Laravel backend
    if (data.studentId !== undefined) mapped.student_id = data.studentId;
    if (data.teacherId !== undefined) mapped.teacher_id = data.teacherId;
    if (data.fatherName !== undefined) mapped.father_name = data.fatherName;
    if (data.fatherPhone !== undefined) mapped.father_phone = data.fatherPhone;
    if (data.motherName !== undefined) mapped.mother_name = data.motherName;
    if (data.motherPhone !== undefined) mapped.mother_phone = data.motherPhone;
    if (data.parentName !== undefined) mapped.parent_name = data.parentName;
    if (data.guardianPhone !== undefined) mapped.guardian_phone = data.guardianPhone;
    if (data.bloodGroup !== undefined) mapped.blood_group = data.bloodGroup;
    if (data.avatar !== undefined) {
      mapped.avatar = data.avatar;
      mapped.student_photo = data.avatar;
    }
    if (data.studentPhoto !== undefined) {
      mapped.student_photo = data.studentPhoto;
      if (!mapped.avatar) mapped.avatar = data.studentPhoto;
    }
    if (data.fatherPhoto !== undefined) mapped.father_photo = data.fatherPhoto;
    if (data.motherPhoto !== undefined) mapped.mother_photo = data.motherPhoto;
    if (data.guardianPhoto !== undefined) mapped.guardian_photo = data.guardianPhoto;
    if (data.admissionDate !== undefined) mapped.admission_date = data.admissionDate;

    // Remove camelCase keys to avoid confusion or validation issues
    const camelKeys = [
      'studentId', 'teacherId', 'fatherName', 'fatherPhone', 
      'motherName', 'motherPhone', 'parentName', 'guardianPhone', 
      'bloodGroup', 'studentPhoto', 'fatherPhoto', 'motherPhoto', 
      'guardianPhoto', 'admissionDate'
    ];
    camelKeys.forEach(key => delete mapped[key]);

    return mapped;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userDataString = await AsyncStorage.getItem('user_data');
        if (token && userDataString) {
          setAuthToken(token);
          const userData = JSON.parse(userDataString);
          setUser(userData); // Already mapped when stored
          await fetchData();
          await setupPushNotifications();
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [fetchData]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/login', { username, password });
      const { access_token, user: rawUser } = response.data;
      const userData = mapUser(rawUser);

      if (userData.status === 'inactive') {
         throw new Error('INACTIVE_USER_ALERT');
      }
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setAuthToken(access_token);
      setUser(userData);
      
      await fetchData();
      await setupPushNotifications();
      return true;
    } catch (error: any) {
      if (error.message === 'INACTIVE_USER_ALERT') {
         throw error;
      }
      console.error('Login Error:', error);
      return false;
    }
  }, [fetchData]);

  const testLogin = useCallback(async (role: UserRole) => {
    const emailMap = {
      admin: 'admin@chithodehappykids.com',
      teacher: 'sarah@teacher.com',
      student: 'arjun@student.com'
    };
    await login(emailMap[role], 'password');
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setAuthToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  }, []);

  const addUser = useCallback(async (newUser: User & { password?: string }) => {
    try {
      const backendData = mapToBackend(newUser);
      await api.post('/users', { 
        ...backendData, 
        password: newUser.password || 'password' 
      }); 
      await fetchData(); 
    } catch (error) {
      Alert.alert('Error', 'Failed to add user');
    }
  }, [fetchData]);

  const updateUser = useCallback(async (userId: string, updatedData: Partial<User> & { password?: string }) => {
    try {
      const backendData = mapToBackend(updatedData);
      await api.put(`/users/${userId}`, backendData);
      await fetchData();
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
      return false;
    }
  }, [fetchData]);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!user) return false;
    try {
      const backendData = mapToBackend(updatedData);
      const response = await api.put(`/users/${user.id}`, backendData);
      const mappedUser = mapUser(response.data);
      setUser(mappedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(mappedUser));
      await fetchData();
      return true;
    } catch (error: any) {
      console.error('Update Profile Error:', error.response?.data || error.message);
      Alert.alert('Update Failed', 'An error occurred.');
      return false;
    }
  }, [user, fetchData]);

  const updateAvatar = useCallback(async () => {
    if (!user) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const success = await updateProfile({ avatar: base64Image });
        if (success) {
          Alert.alert('Success ✨', 'Profile picture updated.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unexpected error occurred.');
    }
  }, [user, updateProfile]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user');
    }
  }, [fetchData]);

  const toggleUserStatus = useCallback(async (userId: string) => {
    try {
      const u = users.find(u => u.id === userId);
      if (!u) return;
      await api.put(`/users/${userId}`, {
        status: u.status === 'active' ? 'inactive' : 'active'
      });
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  }, [users, fetchData]);

  const addAnnouncement = useCallback(async (announcement: Announcement) => {
    try {
      let imageToShip = announcement.image;
      
      // If image is a local URI, we MUST convert to base64 so the server can store it/process it.
      if (imageToShip && imageToShip.startsWith('file://')) {
        try {
          const base64 = await FileSystem.readAsStringAsync(imageToShip, {
            encoding: 'base64',
          });
          imageToShip = `data:image/jpeg;base64,${base64}`;
        } catch (e) {
          console.error('File read error:', e);
        }
      }

      await api.post('/announcements', {
        title:     announcement.title,
        content:   announcement.content,
        image_url: imageToShip || null,
        date:      announcement.date,
        target:    announcement.target,
        author:    announcement.author,
      });
      await fetchData();
    } catch (error) {
      console.error('Add Announcement Error:', error);
      Alert.alert('Error', 'Failed to post announcement');
    }
  }, [fetchData]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete announcement');
    }
  }, [fetchData]);

  const addActivity = useCallback(async (activity: Activity) => {
    try {
      let mediaToShip = activity.mediaUrl;
      let thumbToShip = activity.thumbnailUrl;

      // Handle local files for activities as well
      if (mediaToShip && mediaToShip.startsWith('file://')) {
        try {
          const base64 = await FileSystem.readAsStringAsync(mediaToShip, {
            encoding: 'base64',
          });
          mediaToShip = `data:${activity.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${base64}`;
        } catch (e) {}
      }

      if (thumbToShip && thumbToShip.startsWith('file://')) {
        try {
          const base64 = await FileSystem.readAsStringAsync(thumbToShip, {
            encoding: 'base64',
          });
          thumbToShip = `data:image/jpeg;base64,${base64}`;
        } catch (e) {}
      }

      await api.post('/activities', {
        title: activity.title,
        description: activity.description,
        media_type: activity.mediaType,
        media_url: mediaToShip,
        thumbnail_url: thumbToShip,
        date: activity.date,
        author: activity.author,
        student_ids: activity.studentIds
      });
      await fetchData();
    } catch (error) {
      console.error('Add Activity Error:', error);
      Alert.alert('Error', 'Failed to post activity');
    }
  }, [fetchData]);

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/activities/${id}`);
      await fetchData();
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to delete activity');
      return false;
    }
  }, [fetchData]);

  const likeActivity = useCallback(async (id: string) => {
    try {
      await api.post(`/activities/${id}/like`);
      // Update local state for immediate feedback
      setActivities(prev => prev.map(act => 
        act.id === id ? { ...act, likesCount: (act.likesCount || 0) + 1 } : act
      ));
    } catch (error) {
      console.error('Failed to like activity:', error);
    }
  }, []);

  const addComment = useCallback(async (activityId: string, text: string) => {
    try {
      const res = await api.post(`/activities/${activityId}/comment`, { text });
      const newComment: Comment = {
        id: res.data.id.toString(),
        user: res.data.user?.name || 'You',
        avatar: res.data.user?.avatar || undefined,
        text: res.data.text,
        time: 'Just now'
      };
      setActivities(prev => prev.map(act => 
        act.id === activityId ? { ...act, comments: [...act.comments, newComment] } : act
      ));
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    try {
      await api.post('/transactions', transaction);
      await fetchData();
    } catch (error) {
      console.error('Failed to record transaction:', error);
      throw error;
    }
  }, [fetchData]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  }, [fetchData]);

  const updateTransaction = useCallback(async (id: string, transaction: Partial<Transaction>) => {
    try {
      await api.put(`/transactions/${id}`, transaction);
      await fetchData();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  }, [fetchData]);

  const updateNotificationSettings = useCallback(async (settings: any) => {
    try {
      const response = await api.post('/update-notification-settings', { settings });
      const updatedUser = { ...user!, notification_settings: response.data.settings };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Update Notification Settings Error:', error);
      return false;
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    users,
    announcements,
    activities,
    transactions,
    fees,
    feeStructures,
    isAuthenticated: !!user,
    isLoading,
    login,
    testLogin,
    logout,
    addUser,
    updateUser,
    updateProfile,
    deleteUser,
    toggleUserStatus,
    addAnnouncement,
    deleteAnnouncement,
    addActivity,
    deleteActivity,
    likeActivity,
    addComment,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateAvatar,
    refreshFees,
    updateNotificationSettings,
    fetchData
  }), [
    user, users, announcements, activities, transactions, fees, feeStructures,
    isLoading, login, testLogin, logout, addUser, updateUser, updateProfile,
    deleteUser, toggleUserStatus, addAnnouncement, deleteAnnouncement,
    addActivity, deleteActivity, likeActivity, addComment, addTransaction, deleteTransaction, updateTransaction,
    updateAvatar, refreshFees, updateNotificationSettings, fetchData
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
