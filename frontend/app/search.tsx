import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useWorkspaceStore } from '../stores/workspaceStore';
import axios from 'axios';
import { ModernCard } from '../components/ModernCard';
import { ChipButton } from '../components/ChipButton';
import { EmptyState } from '../components/EmptyState';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export default function Search() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState<any>({ projects: [], tasks: [], requests: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setResults({ projects: [], tasks: [], requests: [] });
    }
  }, [searchQuery]);

  const performSearch = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/search?q=${encodeURIComponent(searchQuery)}&workspace_id=${currentWorkspace._id}`
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResults = () => {
    switch (activeFilter) {
      case 'projects': return { projects: results.projects, tasks: [], requests: [] };
      case 'tasks': return { projects: [], tasks: results.tasks, requests: [] };
      case 'requests': return { projects: [], tasks: [], requests: results.requests };
      default: return results;
    }
  };

  const filtered = getFilteredResults();
  const totalResults = (filtered.projects?.length || 0) + (filtered.tasks?.length || 0) + (filtered.requests?.length || 0);

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
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filters}>
          <ChipButton
            label="Tümü"
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <ChipButton
            label="Projeler"
            selected={activeFilter === 'projects'}
            onPress={() => setActiveFilter('projects')}
          />
          <ChipButton
            label="Görevler"
            selected={activeFilter === 'tasks'}
            onPress={() => setActiveFilter('tasks')}
          />
          <ChipButton
            label="Talepler"
            selected={activeFilter === 'requests'}
            onPress={() => setActiveFilter('requests')}
          />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {searchQuery.length < 3 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>Aramaya başlayın</Text>
              <Text style={styles.emptySubtext}>En az 3 karakter girin</Text>
            </View>
          ) : loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aranıyor...</Text>
            </View>
          ) : totalResults === 0 ? (
            <EmptyState
              icon="search"
              title="Sonuç Bulunamadı"
              subtitle="Farklı bir arama deneyin"
            />
          ) : (
            <View style={styles.resultsContainer}>
              {filtered.projects && filtered.projects.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Projeler ({filtered.projects.length})</Text>
                  {filtered.projects.map((project: any) => (
                    <ModernCard key={project._id} style={styles.resultCard}>
                      <View style={styles.resultHeader}>
                        <Ionicons name="folder" size={24} color="#8b5cf6" />
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{project.name}</Text>
                          {project.description && (
                            <Text style={styles.resultDescription} numberOfLines={2}>
                              {project.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </ModernCard>
                  ))}
                </View>
              )}

              {filtered.tasks && filtered.tasks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Görevler ({filtered.tasks.length})</Text>
                  {filtered.tasks.map((task: any) => (
                    <ModernCard key={task._id} style={styles.resultCard}>
                      <View style={styles.resultHeader}>
                        <Ionicons name="checkbox" size={24} color="#3b82f6" />
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{task.title}</Text>
                          {task.description && (
                            <Text style={styles.resultDescription} numberOfLines={2}>
                              {task.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </ModernCard>
                  ))}
                </View>
              )}

              {filtered.requests && filtered.requests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Talepler ({filtered.requests.length})</Text>
                  {filtered.requests.map((request: any) => (
                    <ModernCard key={request._id} style={styles.resultCard}>
                      <View style={styles.resultHeader}>
                        <Ionicons name="document-text" size={24} color="#10b981" />
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{request.title}</Text>
                          {request.description && (
                            <Text style={styles.resultDescription} numberOfLines={2}>
                              {request.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </ModernCard>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  scrollView: { flex: 1 },
  resultsContainer: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  resultCard: { marginBottom: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  resultContent: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  resultDescription: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 16, color: '#6b7280', marginTop: 8 },
});
