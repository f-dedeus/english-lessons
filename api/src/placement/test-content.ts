export type PlacementItem = {
  level: 'A1' | 'A2' | 'B1'
  prompt: string
  options: [string, string, string]
  correct: 0 | 1 | 2 // index of the right option
  passage?: string
}

const LEO =
  "Hi! My name is Leo. I'm from Brazil and I live in Recife with my mom and my brother. I love soccer. I play with my friends on Saturdays. I don't like vegetables, but I love fruit!"

const CARLA =
  "Last summer, Carla went to Chile with her best friend. They stayed in a small hotel near the mountains. On the first day it was very cold, so they bought jackets at a market. Carla's favorite part of the trip was skiing for the first time. She fell many times, but she wants to go back next year."

const PHONES =
  'Many people say they want to spend less time on their phones, but changing habits is not easy. Experts suggest starting small: for example, leaving the phone in another room during meals. Some people also turn off notifications, which helps them focus. However, avoiding technology completely is unrealistic for most of us, since we need it for work, school and staying in touch with family. The goal is balance, not perfection.'

export const PLACEMENT_TEST: PlacementItem[] = [
  // ---- Block 1 · A1 ----
  { level: 'A1', prompt: 'My sister ___ a teacher.', options: ['am', 'is', 'are'], correct: 1 },
  { level: 'A1', prompt: '___ you like pizza?', options: ['Do', 'Does', 'Are'], correct: 0 },
  { level: 'A1', prompt: 'There ___ two cats in my house.', options: ['is', 'am', 'are'], correct: 2 },
  { level: 'A1', prompt: 'He ___ to school by bus every day.', options: ['go', 'goes', 'going'], correct: 1 },
  { level: 'A1', prompt: 'Which word is a family member?', options: ['kitchen', 'uncle', 'Monday'], correct: 1 },
  { level: 'A1', prompt: 'This is Ana. ___ bag is blue.', options: ['Her', 'She', 'His'], correct: 0 },
  { level: 'A1', prompt: "I get up ___ 7 o'clock.", options: ['on', 'in', 'at'], correct: 2 },
  { level: 'A1', passage: LEO, prompt: 'Where does Leo live?', options: ['In Salvador', 'In Recife', 'In Rio'], correct: 1 },
  { level: 'A1', passage: LEO, prompt: 'When does Leo play soccer?', options: ['On Sundays', 'Every day', 'On Saturdays'], correct: 2 },
  { level: 'A1', passage: LEO, prompt: "Leo doesn't like ___.", options: ['vegetables', 'fruit', 'soccer'], correct: 0 },

  // ---- Block 2 · A2 ----
  { level: 'A2', prompt: 'Last weekend we ___ a movie at home.', options: ['watch', 'watched', 'watching'], correct: 1 },
  { level: 'A2', prompt: 'Look at those dark clouds! It ___ rain.', options: ['is going to', 'goes', 'rained'], correct: 0 },
  { level: 'A2', prompt: 'My phone is ___ than yours.', options: ['newest', 'more new', 'newer'], correct: 2 },
  { level: 'A2', prompt: '___ did you go on vacation? — To the beach.', options: ['What', 'Where', 'Who'], correct: 1 },
  { level: 'A2', prompt: "Sorry, I can't talk now. I ___ dinner.", options: ['am cooking', 'cook', 'cooks'], correct: 0 },
  { level: 'A2', prompt: 'Did she ___ her homework yesterday?', options: ['finished', 'finishes', 'finish'], correct: 2 },
  { level: 'A2', prompt: "We don't have ___ milk. Can you buy some?", options: ['some', 'any', 'many'], correct: 1 },
  { level: 'A2', passage: CARLA, prompt: 'Why did they buy jackets?', options: ['Because it was cold', 'Because the jackets were cheap', 'Because they lost their bags'], correct: 0 },
  { level: 'A2', passage: CARLA, prompt: 'What did Carla do for the first time?', options: ['Stay in a hotel', 'Ski', 'Travel with a friend'], correct: 1 },
  { level: 'A2', passage: CARLA, prompt: 'What does Carla want to do?', options: ['Learn to ski in Brazil', 'Stay home next year', 'Go back to Chile'], correct: 2 },

  // ---- Block 3 · B1 ----
  { level: 'B1', prompt: 'I ___ English for three years, and I still love it.', options: ['have studied', 'studied', 'study'], correct: 0 },
  { level: 'B1', prompt: 'If it rains tomorrow, we ___ at home.', options: ['would stay', 'will stay', 'stayed'], correct: 1 },
  { level: 'B1', prompt: 'Have you ever ___ sushi?', options: ['ate', 'eat', 'eaten'], correct: 2 },
  { level: 'B1', prompt: 'The book ___ I borrowed from you was amazing.', options: ['who', 'that', 'where'], correct: 1 },
  { level: 'B1', prompt: "In the library, you ___ be quiet. It's a rule.", options: ['must', 'might', 'could'], correct: 0 },
  { level: 'B1', prompt: 'When I arrived at the party, my friends ___ already left.', options: ['have', 'had', 'were'], correct: 1 },
  { level: 'B1', prompt: "I'm really interested ___ learning photography.", options: ['in', 'on', 'at'], correct: 0 },
  { level: 'B1', passage: PHONES, prompt: 'According to the text, a good first step is to ___.', options: ['delete social media', 'keep the phone away during meals', 'buy a simpler phone'], correct: 1 },
  { level: 'B1', passage: PHONES, prompt: 'Why do some people turn off notifications?', options: ['To save battery', "Because it's free", 'To focus better'], correct: 2 },
  { level: 'B1', passage: PHONES, prompt: 'What is the main idea of the text?', options: ['Technology is bad for everyone', 'We should find a balance with technology', 'Phones are only necessary for work'], correct: 1 },
]