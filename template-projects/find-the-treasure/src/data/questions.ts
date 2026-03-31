import type { Stage } from '../types'


const defaultStages: Stage[] = [
  {
    id: 'sunny-shore',
    location: 'Sunny Shore',
    story: 'A warm beach opens the first clue with a shell-covered signpost.',
    prompt: 'What do plants need from the sun to make their own food?',
    options: ['Moonlight', 'Solar energy', 'Sand'],
    correctAnswer: 1,
    explanation:
      'Plants use sunlight as energy during photosynthesis, which helps them make food.',
    points: 10,
  },
  {
    id: 'echo-cave',
    location: 'Echo Cave',
    story: 'The cave walls repeat every answer, so the team must listen closely.',
    prompt: 'Which fraction is equal to one-half?',
    options: ['2/6', '3/6', '5/12'],
    correctAnswer: 1,
    explanation: 'Three-sixths can be simplified by dividing top and bottom by 3.',
    points: 10,
  },
  {
    id: 'misty-falls',
    location: 'Misty Falls',
    story: 'A bridge appears only when the best reading clue is chosen.',
    prompt: 'Which word is a synonym for "rapid"?',
    options: ['Slow', 'Quick', 'Quiet'],
    correctAnswer: 1,
    explanation: '"Rapid" means fast or quick, so "Quick" is the closest synonym.',
    points: 10,
  },
  {
    id: 'jungle-gate',
    location: 'Jungle Gate',
    story: 'Ancient stones glow when the correct geography answer is spoken.',
    prompt: 'What is the name of the large body of water between continents?',
    options: ['River', 'Ocean', 'Pond'],
    correctAnswer: 1,
    explanation:
      'An ocean is a vast body of salt water that separates continents.',
    points: 10,
  },
  {
    id: 'treasure-cove',
    location: 'Treasure Cove',
    story: 'The final lock opens with one last pattern clue from the map.',
    prompt: 'What number comes next in the pattern 5, 10, 15, 20, ...?',
    options: ['24', '25', '30'],
    correctAnswer: 1,
    explanation:
      'The pattern adds 5 each time, so the next number after 20 is 25.',
    points: 15,
  },
  {
    id: 'forest-gate',
    location: 'Whispering Forest',
    story: 'A glowing tree asks you to solve a simple number riddle.',
    prompt: 'What number comes next in the pattern 2, 4, 6, 8, ...?',
    options: ['10', '12', '14'],
    correctAnswer: 0,
    explanation:
      'The pattern increases by 2 each time, so the next number is 10.',
    points: 10,
  },
  {
    id: 'river-crossing',
    location: 'Crystal River',
    story: 'A bridge appears only if you answer correctly.',
    prompt: 'What is 7 + 5?',
    options: ['11', '12', '13'],
    correctAnswer: 1,
    explanation:
      '7 + 5 equals 12.',
    points: 10,
  },
  {
    id: 'cave-door',
    location: 'Dark Cave',
    story: 'A stone door blocks your path with a math puzzle.',
    prompt: 'What number comes next in the pattern 3, 6, 9, 12, ...?',
    options: ['14', '15', '18'],
    correctAnswer: 1,
    explanation:
      'The pattern adds 3 each time, so the next number is 15.',
    points: 10,
  },
  {
    id: 'mountain-peak',
    location: 'High Mountain',
    story: 'The wind whispers a question as you climb higher.',
    prompt: 'What is 9 - 4?',
    options: ['3', '4', '5'],
    correctAnswer: 2,
    explanation:
      '9 minus 4 equals 5.',
    points: 10,
  },
  {
    id: 'hidden-lake',
    location: 'Hidden Lake',
    story: 'A magical fish asks you to solve its puzzle.',
    prompt: 'What number comes next in the pattern 10, 20, 30, ...?',
    options: ['35', '40', '50'],
    correctAnswer: 1,
    explanation:
      'The pattern increases by 10 each time, so the next number is 40.',
    points: 10,
  },
  {
    id: 'sky-temple',
    location: 'Sky Temple',
    story: 'Floating stones guide you with one final question.',
    prompt: 'What is 6 × 2?',
    options: ['10', '12', '14'],
    correctAnswer: 1,
    explanation:
      '6 multiplied by 2 equals 12.',
    points: 15,
  },
  {
    id: 'desert-ruins',
    location: 'Ancient Desert',
    story: 'The sand reveals a hidden number puzzle from the past.',
    prompt: 'What number comes next in the pattern 1, 3, 5, 7, ...?',
    options: ['8', '9', '10'],
    correctAnswer: 1,
    explanation:
      'The pattern increases by 2 each time, so the next number is 9.',
    points: 10,
  },
  {
    id: 'icy-cavern',
    location: 'Frozen Cave',
    story: 'A block of ice glows with a simple math challenge.',
    prompt: 'What is 8 + 6?',
    options: ['12', '13', '14'],
    correctAnswer: 2,
    explanation:
      '8 plus 6 equals 14.',
    points: 10,
  },
  {
    id: 'jungle-path',
    location: 'Deep Jungle',
    story: 'The path is blocked by vines forming a number sequence.',
    prompt: 'What number comes next in the pattern 4, 8, 12, 16, ...?',
    options: ['18', '20', '24'],
    correctAnswer: 1,
    explanation:
      'The pattern increases by 4 each time, so the next number is 20.',
    points: 10,
  },
  {
    id: 'volcano-core',
    location: 'Burning Volcano',
    story: 'The heat intensifies as a final equation appears.',
    prompt: 'What is 5 × 3?',
    options: ['10', '15', '20'],
    correctAnswer: 1,
    explanation:
      '5 multiplied by 3 equals 15.',
    points: 15,
  },
]

export const MY_APP_DATA: Stage[] = 
  import.meta.env.PROD && 
  typeof window !== 'undefined' &&  
  (window as Window & typeof globalThis & { __MY_APP_DATA__: Stage[] })[
    '__MY_APP_DATA__'
  ]
    ? (window as Window & typeof globalThis & { __MY_APP_DATA__: Stage[] }) ['__MY_APP_DATA__']
    : defaultStages