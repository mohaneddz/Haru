export interface CourseInfo {
	title: string;
	description: string;
	difficulty: string;
	duration: string;
	overview: string;
	prerequisites: string[];
	topics: string[];
	tags?: string[];
	img: string;
}

export interface ExtendedCourseInfo extends CourseInfo {
  icon?: string;
  tags: string[];
  field: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface Section {
  name: string;
  courses: ExtendedCourseInfo[];
}

export interface CourseContentResponse {
  title: string;
  description: string;
  overview: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: number;
  prerequisites: string[];
  topics: { "what we will learn": string[] }[];
  tags: string[];
  img: string;
}
export interface GameInfo extends CourseInfo {
	benefits: string[];
}

export interface Syllabus {
  syllabus: {
    [chapter: string]: {
      [subtopic: string]: string;
    }[];
  }[];
}
