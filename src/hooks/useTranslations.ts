import { createSignal, onMount } from 'solid-js';
import { loadTranslations } from '@/utils/home/dictionary/translationUtils';
import { saveFile } from '@/utils/core/appdata';

export function useTranslations() {
  const [translations, setTranslations] = createSignal<Translation[]>([]);
  const [selectedIndices, setSelectedIndices] = createSignal<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [filtered, setFiltered] = createSignal<Translation[]>([]);
  const [sortField, setSortField] = createSignal<keyof Translation>('dateAdded');

  onMount(async () => {
    const data = await loadTranslations();
    sortTranslations('dateAdded', 'asc');
    setTranslations(data);
    setFiltered(data);
  });

  const sortTranslations = (field: keyof Translation, order: 'asc' | 'desc') => {
    setSortField(field);
    setFiltered((prev) =>
      [...prev].sort((a: Translation, b: Translation) => {
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        return 0;
      })
    );
  };

  const searchForTerm = (term: string) => {
    setFiltered(
      translations().filter((tr) =>
        tr.from.toLowerCase().includes(term.toLowerCase()) ||
        tr.to.toLowerCase().includes(term.toLowerCase()) ||
        tr.term.toLowerCase().includes(term.toLowerCase()) ||
        tr.translation.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const deleteSelected = () => {
    const newTranslations = translations().filter((_, i) => !selectedIndices().includes(i));
    setTranslations(newTranslations);
    setFiltered(newTranslations);
    setSelectedIndices([]);
    setShowDeleteModal(false);
    saveFile('translations.json', JSON.stringify(newTranslations, null, 2));
  };

  const addTranslation = (from: string, to: string, term: string, translation: string) => {
    const newTranslation = {
      dateAdded: new Date().toISOString(),
      from,
      to,
      term,
      translation,
    };
    if (newTranslation.from && newTranslation.to && newTranslation.term && newTranslation.translation) {
      const updatedTranslations = [...translations(), newTranslation];
      setTranslations(updatedTranslations);
      setFiltered(updatedTranslations);
      setSelectedIndices((prev) => [...prev, updatedTranslations.length - 1]);
      setShowAddModal(false);
      saveFile('translations.json', JSON.stringify(updatedTranslations, null, 2));
    }
  };

  const editTranslation = (index: number, field: keyof Translation, value: string) => {
    const updated = [...translations()];
    updated[index] = { ...updated[index], [field]: value };
    setTranslations(updated);
    setFiltered(updated); // Re-set filtered to updated translations; re-sort if needed
    saveFile('translations.json', JSON.stringify(updated, null, 2));
  };

  const refreshTranslations = async () => {
    const data = await loadTranslations();
    setTranslations(data);
    setFiltered(data);
    sortTranslations('dateAdded', 'asc');
  };

  return {
    translations,
    selectedIndices,
    setSelectedIndices,
    showDeleteModal,
    setShowDeleteModal,
    showAddModal,
    setShowAddModal,
    filtered,
    sortField,
    sortTranslations,
    searchForTerm,
    toggleSelect,
    deleteSelected,
    addTranslation,
    editTranslation,
    refreshTranslations,
  };
}
