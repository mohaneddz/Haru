// // for now we will use a data.csv file in the data folder 

// // courses : course name | course description | course image 
// // course : course 

// export async function fetchCourseData(course: string): Promise<any[]> {
//     try {
        
//         const courses = await import('/data/courses.json');
//         const courseData = await import('/data/' + course + '.json');
        
//         if (!courseData || !courses) {
//             throw new Error("Course data not found");
//         }



// }