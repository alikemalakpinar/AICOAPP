import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWorkspaceStore } from '../store/workspaceStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme, getStatusColor, getStatusLabel } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface SearchResults {
  projects: any[];
  tasks: any[];
  notes: any[];
  requests: any[];
}

type FilterType = 'all' | 'projects' | 'tasks' | 'notes' | 'requests';

const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tümü', icon: 'apps' },
  { key: 'projects', label: 'Projeler', icon: 'folder' },
  { key: 'tasks', label: 'Görevler', icon: 'checkbox' },
  { key: 'notes', label: 'Notlar', icon: 'document-text' },
  { key: 'requests', label: 'Talepler', icon: 'mail' },
];

export default function Search() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResults>({ projects: [], tasks: [], notes: [], requests: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const performSearch = useCallback(async () => {
    if (!currentWorkspace?._id || searchQuery.length < 2) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const types = activeFilter === 'all' ? 'projects,tasks,notes,requests' : activeFilter;

      const response = await axios.get(`${API_URL}/api/search`, {
        params: {
          q: searchQuery,
          workspace_id: currentWorkspace._id,
          types
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
      setResults({ projects: [], tasks: [], notes: [], requests: [] });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id, searchQuery, activeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setResults({ projects: [], tasks: [], notes: [], requests: [] });
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilter]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults({ projects: [], tasks: [], notes: [], requests: [] });
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const getFilteredResults = () => {
    switch (activeFilter) {
      case 'projects':
        return { projects: results.projects, tasks: [], notes: [], requests: [] };
      case 'tasks':
        return { projects: [], tasks: results.tasks, notes: [], requests: [] };
      case 'notes':
        return { projects: [], tasks: [], notes: results.notes || [], requests: [] };
      case 'requests':
        return { projects: [], tasks: [], notes: [], requests: results.requests };
      default:
        return results;
    }
  };

  const navigateToItem = (type: string, item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();

    switch (type) {
      case 'project':
        router.push(`/project-detail?id=${item._id}` as any);
        break;
      case 'task':
        router.push(`/task-detail?id=${item._id}` as any);
        break;
      case 'note':
        router.push('/notes' as any);
        break;
      case 'request':
        router.push('/(tabs)/requests' as any);
        break;
    }
  };

  const filtered = getFilteredResults();
  const totalResults =
    (filtered.projects?.length || 0) +
    (filtered.tasks?.length || 0) +
    (filtered.notes?.length || 0) +
    (filtered.requests?.length || 0);

  const renderResultItem = (type: string, item: any, icon: keyof typeof Ionicons.glyphMap, color: string) => (
    <TouchableOpacity
      key={item._id}
      style={styles.resultCard}
      onPress={() => navigateToItem(type, item)}
      activeOpacity={0.7}
    >
      <View style={[styles.resultIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.name || item.title}
        </Text>
        {item.description && (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.status && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Proje, görev, not ara..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(filter.key)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={activeFilter === filter.key ? '#fff' : theme.colors.text.secondary}
            />
            <Text style={[
              styles.filterText,
              activeFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {searchQuery.length < 2 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search" size={48} color={theme.colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>Aramaya Başlayın</Text>
            <Text style={styles.emptySubtitle}>En az 2 karakter girin</Text>

            {/* Search Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Arama İpuçları</Text>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.semantic.success} />
                <Text style={styles.tipText}>Proje veya görev adları ile arayın</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.semantic.success} />
                <Text style={styles.tipText}>Filtreleri kullanarak sonuçları daraltın</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.semantic.success} />
                <Text style={styles.tipText}>Not içeriklerinde de arama yapılır</Text>
              </View>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent.primary} />
            <Text style={styles.loadingText}>Aranıyor...</Text>
          </View>
        ) : !hasSearched ? null : totalResults === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              "{searchQuery}" için sonuç yok. Farklı bir arama deneyin.
            </Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsCount}>{totalResults} sonuç bulundu</Text>

            {filtered.projects && filtered.projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Projeler ({filtered.projects.length})
                </Text>
                {filtered.projects.map((project: any) =>
                  renderResultItem('project', project, 'folder', theme.colors.accent.primary)
                )}
              </View>
            )}

            {filtered.tasks && filtered.tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Görevler ({filtered.tasks.length})
                </Text>
                {filtered.tasks.map((task: any) =>
                  renderResultItem('task', task, 'checkbox', theme.colors.semantic.success)
                )}
              </View>
            )}

            {filtered.notes && filtered.notes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Notlar ({filtered.notes.length})
                </Text>
                {filtered.notes.map((note: any) =>
                  renderResultItem('note', note, 'document-text', theme.colors.semantic.warning)
                )}
              </View>
            )}

            {filtered.requests && filtered.requests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Talepler ({filtered.requests.length})
                </Text>
                {filtered.requests.map((request: any) =>
                  renderResultItem('request', request, 'mail', theme.colors.accent.secondary)
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: theme.colors.accent.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsContainer: {
    marginTop: 40,
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  resultsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
