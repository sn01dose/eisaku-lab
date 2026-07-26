import { additionalSpellingLessons } from './additionalSpellingLessons'
import { additionalWritingLessonsA } from './additionalWritingLessonsA'
import { additionalWritingLessonsB } from './additionalWritingLessonsB'
import { spellingMiniLessons as baseSpellingMiniLessons } from './spellingLessons'
import { writingMiniLessons as baseWritingMiniLessons } from './writingLessons'

export {
  additionalSpellingLessons,
  additionalWritingLessonsA,
  additionalWritingLessonsB,
  baseSpellingMiniLessons,
  baseWritingMiniLessons,
}

export const spellingMiniLessons = [
  ...baseSpellingMiniLessons,
  ...additionalSpellingLessons,
]

export const writingMiniLessons = [
  ...baseWritingMiniLessons,
  ...additionalWritingLessonsA,
  ...additionalWritingLessonsB,
]

export const miniLessons = [
  ...baseSpellingMiniLessons,
  ...baseWritingMiniLessons,
  ...additionalSpellingLessons,
  ...additionalWritingLessonsA,
  ...additionalWritingLessonsB,
]

export const miniLessonById = new Map(
  miniLessons.map((lesson) => [lesson.id, lesson]),
)
