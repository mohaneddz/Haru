import type { Syllabus } from '@/types/home/library';
import { loadSyllabusFile, saveSyllabusFile } from '@/utils/home/courses/syllabusUtils';
import { createSignal, onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';

export default function useSyllabus() {
    const location = useLocation();
    const [courseData, setCourseData] = createSignal<Syllabus>({ syllabus: [] });
    const [moduleName, setModuleName] = createSignal('');
    const [parentFolder, setParentFolder] = createSignal('');

    onMount(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        const courseIndex = segments.findIndex((segment) => segment === 'course' || segment === 'library');

        if (courseIndex !== -1 && courseIndex + 1 < segments.length) {
            const path = window.location.pathname;
            const pathParts = path.split('/');
            const modulename = pathParts.pop();
            const parentname = pathParts.pop();
            setModuleName(modulename || '');
            setParentFolder(parentname || '');
            loadSyllabus();
        }
    });

    function formatDesc(d: unknown): string {
        if (typeof d === 'string') return d;
        if (d == null) return '';
        if (Array.isArray(d))
            return d.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' • ');
        if (typeof d === 'object') {
            const obj = d as Record<string, any>;
            const candidates = ['description', 'desc', 'text', 'content', 'details', 'body'];
            for (const k of candidates) {
                if (k in obj && typeof obj[k] === 'string') return obj[k];
            }
            const firstString = Object.values(obj).find((v) => typeof v === 'string');
            if (firstString) return firstString;
            try {
                return JSON.stringify(obj);
            } catch {
                return String(obj);
            }
        }
        return String(d);
    }

    async function fetchSyllabus() {
        if (!moduleName()) return;
        try {
            const response = await fetch('http://localhost:4999/module-syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module_name: moduleName() }),
            });

            if (!response.ok) {
                console.error('Failed to fetch syllabus:', await response.text());
                return;
            }

            const data = await response.json();
            console.log('Fetched syllabus:', data);
            setCourseData(data);
        } catch (err) {
            console.error('Error fetching syllabus:', err);
        }
    }

    const handleCourseClick = (courseTitle: string) => {
        console.log(`Navigating to: ${courseTitle}`);
    };

    const loadSyllabus = async () => {
        const syllabusArray = await loadSyllabusFile(parentFolder(), moduleName());
        if (syllabusArray) {
            // FIX: Wrap the returned array in the expected object structure
            setCourseData({ syllabus: Array.isArray(syllabusArray) ? syllabusArray : [] });
            console.log('Loaded syllabus:', syllabusArray);
        }
    };

    const saveSyllabus = async () => {
        // No changes needed here, but ensure courseData().syllabus is correctly accessed.
        const syllabusToSave = courseData().syllabus;
        if (!syllabusToSave) return;
        await saveSyllabusFile(parentFolder(), moduleName(), { syllabus: syllabusToSave });
    };

    const getChapters = () => {
    const syllabusArray = courseData().syllabus;
    if (Array.isArray(syllabusArray) && syllabusArray.length > 0 && typeof syllabusArray[0] === 'object') {
      return Object.entries(syllabusArray[0]);
    }
    return [];
  };

    return { courseData, moduleName, handleCourseClick, formatDesc, fetchSyllabus, loadSyllabus, saveSyllabus, getChapters };
}