import { db } from '@/database/connection';;

export async function CoursesTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_name TEXT NOT NULL,
      course_description TEXT,
      course_image TEXT,
      course_overview TEXT,
      roadmap_id INTEGER,
      course_status TEXT DEFAULT 'not_started',
      course_progress INTEGER DEFAULT 0,
      course_completion_date TIMESTAMP,
      FOREIGN KEY (course_roadmap_id) REFERENCES course_roadmaps(id)
      CHECK (course_status IN ('not_started', 'in_progress', 'completed', 'archived', 'abandeoned'))
    );
  `);
  console.log('Create Courses Table result:', result);
  return result;
}

export async function SyllabusTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS syllabus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      syllabus_name TEXT NOT NULL,
      course_id INTEGER NOT NULL,
      syllabus_source TEXT,
      syllabus_num_weeks INTEGER DEFAULT 0,
      syllabus_overview TEXT,
      syllabus_progress INTEGER DEFAULT 0,
      syllabus_completion_date TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );
  `);
  console.log('Create Syllabus Table result:', result);
  return result;
}

export async function SectionTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_name TEXT NOT NULL,
      section_source TEXT,
      section_num_weeks INTEGER DEFAULT 0,
      section_overview TEXT,
      section_progress INTEGER DEFAULT 0,
      section_completion_date TIMESTAMP,
    );
  `);
  console.log('Create Sections Table result:', result);
  return result;
}

export async function SyllabusSectionTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS syllabus_section (
      section_id INTEGER NOT NULL,
      syllabus_id INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (syllabus_id) REFERENCES syllabus(id)
      PRIMARY KEY (section_id, syllabus_id)
    );
  `);
  console.log('Create Section Syllabus Table result:', result);
  return result;
}

export async function ChapterTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_name TEXT NOT NULL,
      chapter_overview TEXT,
      chapter_progress INTEGER DEFAULT 0,
      chapter_completion_date TIMESTAMP,
      section_id INTEGER NOT NULL,
    );
  `);
  console.log('Create Chapters Table result:', result);
  return result;
}

export async function SectionChapterTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS section_chapter (
      chapter_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      PRIMARY KEY (chapter_id, section_id)
    );
  `);
  console.log('Create Section Chapter Table result:', result);
  return result;
}

export async function ResourcesTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_name TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_source TEXT NOT NULL,
      resource_description TEXT,
      resource_data TEXT,
      resource_status TEXT DEFAULT 'not_started',
      chapter_id INTEGER NOT NULL,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id)
      CHECK (resource_status IN ('not_started', 'in_progress', 'completed', 'archived', 'abandoned'))
    );
  `);
  console.log('Create Resources Table result:', result);
  return result;
}

export async function ConceptTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS concepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_name TEXT NOT NULL,
      concept_description TEXT,
      concept_status TEXT DEFAULT 'not_started',
      concept_completion_date TIMESTAMP,
      resource_id INTEGER NOT NULL,
      FOREIGN KEY (resource_id) REFERENCES resources(id)
      CHECK (concept_status IN ('not_started', 'in_progress', 'completed', 'archived', 'abandoned'))
    );
  `);
  console.log('Create Concepts Table result:', result);
  return result;
}

export async function ChapterConceptTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS chapter_concept (
      concept_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      FOREIGN KEY (concept_id) REFERENCES concepts(id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id),
      PRIMARY KEY (concept_id, chapter_id)
    );
  `);
  console.log('Create Chapter Concept Table result:', result);
  return result;
}

export async function RoadmapTable() {
  const result = await db.execute(`
    CREATE TABLE IF NOT EXISTS course_roadmaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roadmap_name TEXT NOT NULL,
      roadmap_source TEXT,
      roadmap_progress INTEGER DEFAULT 0,
      roadmap_completion_date TIMESTAMP,
    );
  `);
  console.log('Create Roadmap Table result:', result);
  return result;
}