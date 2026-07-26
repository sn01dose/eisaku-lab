import { Button, Card } from '../../components'

export function FeedbackPastePanel({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <Card label="添削｜返却文">
      <label className="control-field">
        <span>返ってきた添削結果を貼り付ける</span>
        <textarea
          data-input-policy-id="writingFeedback.pastedFeedback"
          rows={7}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={(event) =>
            event.currentTarget.scrollIntoView({ block: 'center' })
          }
          placeholder="先生や外部サービスから返ってきた文章を、そのまま貼り付けます。"
        />
        <small>
          貼り付けると指摘が自動で分かれます。分類を確定するまで、復習には登録しません。
        </small>
      </label>
      {value && (
        <Button
          variant="ghost"
          onClick={() => onChange('')}
        >
          貼り付け内容を消す
        </Button>
      )}
    </Card>
  )
}
