import { Box } from '@mui/material'
import { JSX } from 'react'
import { BalloonLetterPickerAppData } from '../../types'
import { SummarySidebar, WordsTab } from './components'
import { useBalloonCrud } from './hooks/useBalloonCrud'

interface Props {
  appData: BalloonLetterPickerAppData
  projectDir: string
  onChange: (data: BalloonLetterPickerAppData) => void
}

function normalize(d: BalloonLetterPickerAppData): BalloonLetterPickerAppData {
  return { ...d, _wordCounter: d._wordCounter ?? 0, words: d.words ?? [] }
}

/**
 * Balloon Letter Picker Editor
 * Teachers create words where students pop balloons to spell words from hints.
 */
export default function BalloonLetterPickerEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): JSX.Element {
  const data = normalize(raw)

  // Extract CRUD logic to hook
  const { words, addWord, addWordFromDrop, updateWord, deleteWord } = useBalloonCrud(
    data,
    projectDir,
    onChange
  )

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <SummarySidebar words={words} />

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <WordsTab
          words={words}
          projectDir={projectDir}
          onAddWord={addWord}
          onAddWordFromDrop={addWordFromDrop}
          onUpdateWord={updateWord}
          onDeleteWord={deleteWord}
        />
      </Box>
    </Box>
  )
}
