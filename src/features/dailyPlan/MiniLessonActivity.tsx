import { Button, Card } from '../../components'
import type { MiniLesson } from '../../domain/learner/types'

interface MiniLessonActivityProps {
  lesson: MiniLesson
  onNext: () => void
}

export function MiniLessonActivity({
  lesson,
  onNext,
}: MiniLessonActivityProps): React.JSX.Element {
  return (
    <Card label="短い確認｜弱点から選択">
      <h2>{lesson.title}</h2>
      <div className="mini-lesson">
        <p>{lesson.bodyMd}</p>
        <div className="mini-lesson__examples">
          {lesson.examples.map((example) => (
            <div key={`${example.en}:${example.ja}`}>
              <p className="en-reading" lang="en">
                {example.en}
              </p>
              <p className="muted">{example.ja}</p>
            </div>
          ))}
        </div>
      </div>
      <Button fullWidth onClick={onNext}>
        確認して次へ
      </Button>
    </Card>
  )
}
