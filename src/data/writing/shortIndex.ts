import { shortWritingStage1 } from './shortStage1'
import { shortWritingStage2 } from './shortStage2'
import { shortWritingStage3 } from './shortStage3'
import { shortWritingStage4 } from './shortStage4'
import { shortWritingStage5 } from './shortStage5'
import { shortWritingStage6 } from './shortStage6'
import { shortWritingPack02 } from './shortPack02'
import { shortWritingPack03 } from './shortPack03'
import { shortWritingPack04 } from './shortPack04'
import { advancedTranslationStage5 } from './advancedTranslationStage5'
import { advancedTranslationStage6 } from './advancedTranslationStage6'

export {
  advancedTranslationStage5,
  advancedTranslationStage6,
  shortWritingStage1,
  shortWritingStage2,
  shortWritingStage3,
  shortWritingStage4,
  shortWritingStage5,
  shortWritingStage6,
  shortWritingPack02,
  shortWritingPack03,
  shortWritingPack04,
}

export const shortWritingTasks = [
  ...shortWritingStage1,
  ...shortWritingStage2,
  ...shortWritingStage3,
  ...shortWritingStage4,
  ...shortWritingStage5,
  ...shortWritingStage6,
  ...shortWritingPack02,
  ...shortWritingPack03,
  ...shortWritingPack04,
  ...advancedTranslationStage5,
  ...advancedTranslationStage6,
]
