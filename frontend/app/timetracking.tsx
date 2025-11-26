import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useWorkspaceStore } from '../stores/workspaceStore';
import axios from 'axios';
import { format, differenceInMinutes } from 'date-fns';
import { ModernCard } from '../components/ModernCard';
import { GradientButton } from '../components/GradientButton';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface TimeEntry {
  _id: string;
  check_in: string;
  check_out?: string;
  note?: string;
  created_at: string;
}

export default function TimeTracking() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Her 30 saniyede güncelle
    return () => clearInterval(interval);
  }, [currentWorkspace]);

  const fetchData = async () => {
    if (!currentWorkspace) return;
    try {
      const [activeRes, entriesRes] = await Promise.all([
        axios.get(`${API_URL}/time-entries/active`),
        axios.get(`${API_URL}/time-entries?workspace_id=${currentWorkspace._id}`),
      ]);
      setActiveEntry(activeRes.data);
      setEntries(entriesRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentWorkspace) return;
    try {
      await axios.post(`${API_URL}/time-entries`, {
        workspace_id: currentWorkspace._id,
        check_in: new Date().toISOString(),
        note,
      });
      setNote('');
      setModalVisible(false);
      fetchData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Hata', 'Giriş yapılamadı');
    }
  };

  const handleCheckOut = async () => {
    if (!activeEntry) return;
    try {
      await axios.put(`${API_URL}/time-entries/${activeEntry._id}/checkout`);
      fetchData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Başarılı', 'Çıkış yapıldı');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılamadı');
    }
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const minutes = differenceInMinutes(end, start);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}d`;
  };

  const getTotalHours = () => {
    const total = entries.reduce((sum, entry) => {
      if (entry.check_out) {
        const minutes = differenceInMinutes(new Date(entry.check_out), new Date(entry.check_in));
        return sum + minutes;
      }
      return sum;
    }, 0);
    return (total / 60).toFixed(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Zaman Takibi</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Active Timer */}
          <View style={styles.timerSection}>
            {activeEntry ? (
              <ModernCard colors={['#3b82f6', '#8b5cf6']}>
                <View style={styles.activeTimer}>
                  <View style={styles.timerHeader}>
                    <Ionicons name="time" size={32} color="#ffffff" />
                    <View style={styles.pulseAnimation}>
                      <View style={styles.pulseDot} />
                    </View>
                  </View>
                  <Text style={styles.timerText}>Aktif Çalışma</Text>
                  <Text style={styles.timerDuration}>
                    {calculateDuration(activeEntry.check_in)}
                  </Text>
                  <Text style={styles.timerStarted}>
                    Başlangıç: {format(new Date(activeEntry.check_in), 'HH:mm')}
                  </Text>
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckOut}
                  >
                    <Text style={styles.checkoutText}>Çıkış Yap</Text>
                  </TouchableOpacity>
                </View>
              </ModernCard>
            ) : (
              <ModernCard>
                <View style={styles.inactiveTimer}>
                  <Ionicons name="time-outline" size={48} color="#9ca3af" />
                  <Text style={styles.inactiveText}>Şu an aktif çalışma yok</Text>
                  <TouchableOpacity
                    style={styles.checkinButton}
                    onPress={() => setModalVisible(true)}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#8b5cf6']}
                      style={styles.checkinGradient}
                    >
                      <Ionicons name="play" size={24} color="#ffffff" />
                      <Text style={styles.checkinText}>Giriş Yap</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ModernCard>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Toplam Giriş</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getTotalHours()}h</Text>
              <Text style={styles.statLabel}>Toplam Süre</Text>
            </View>
          </View>

          {/* History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Geçmiş</Text>
            {entries.map((entry) => (
              <ModernCard key={entry._id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTime}>
                    <Ionicons name="log-in" size={16} color="#10b981" />
                    <Text style={styles.entryTimeText}>
                      {format(new Date(entry.check_in), 'HH:mm')}
                    </Text>
                  </View>
                  <View style={styles.entryTime}>
                    <Ionicons name="log-out" size={16} color="#ef4444" />
                    <Text style={styles.entryTimeText}>
                      {entry.check_out
                        ? format(new Date(entry.check_out), 'HH:mm')
                        : 'Devam ediyor'}
                    </Text>
                  </View>
                  <Text style={styles.entryDuration}>
                    {calculateDuration(entry.check_in, entry.check_out)}
                  </Text>
                </View>
                <Text style={styles.entryDate}>
                  {format(new Date(entry.check_in), 'dd MMM yyyy')}
                </Text>
                {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
              </ModernCard>
            ))}
          </View>
        </ScrollView>

        {/* Check-in Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Giriş Yap</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Not (opsiyonel)"
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
              />

              <GradientButton onPress={handleCheckIn} title="Giriş Yap" />
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  scrollView: { flex: 1 },
  timerSection: { padding: 20 },
  activeTimer: { alignItems: 'center', padding: 32 },
  timerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  pulseAnimation: { position: 'relative' },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  timerText: { fontSize: 18, color: '#ffffff', marginBottom: 8 },
  timerDuration: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  timerStarted: { fontSize: 14, color: '#ffffff', opacity: 0.8, marginBottom: 24 },
  checkoutButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkoutText: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  inactiveTimer: { alignItems: 'center', padding: 48 },
  inactiveText: { fontSize: 16, color: '#6b7280', marginTop: 16, marginBottom: 24 },
  checkinButton: { borderRadius: 12, overflow: 'hidden' },
  checkinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 12,
  },
  checkinText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
  statsSection: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6b7280' },
  historySection: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  entryCard: { marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryTimeText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  entryDuration: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  entryDate: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  entryNote: { fontSize: 14, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
});
