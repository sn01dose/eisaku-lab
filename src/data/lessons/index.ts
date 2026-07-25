import { spellingMiniLessons } from './spellingLessons'
import { writingMiniLessons } from './writingLessons'

export { spellingMiniLessons, writingMiniLessons }

export const miniLessons = [...spellingMiniLessons, ...writingMiniLessons]
export const miniLessonById = new Map(miniLessons.map((lesson) => [lesson.id, lesson]))
