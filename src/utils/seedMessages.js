// ─── Seed motivational messages into Firestore ────────────────────────────────
// Run once from the Admin Panel or a one-off script.
// Usage: import { seedMessages } from '../utils/seedMessages'
//        await seedMessages(db)

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const MESSAGES = [
  { text: 'Peak performance is a choice, not a chance.', author: null },
  { text: 'Your 5 tasks today shape your tomorrow.', author: null },
  { text: 'Balance is not something you find, it\'s something you create.', author: null },
  { text: 'Every touchdown brings you closer to mastery.', author: null },
  { text: 'Rest is productive. Recovery is growth.', author: null },
  { text: 'Your streak is proof of your commitment.', author: null },
  { text: 'High performance requires high intention.', author: null },
  { text: 'Small consistent wins compound into greatness.', author: null },
  { text: 'The grind today is the glory tomorrow.', author: null },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'Don\'t wish for fewer problems. Wish for more skills.', author: 'Jim Rohn' },
  { text: 'Success is the sum of small efforts repeated daily.', author: 'Robert Collier' },
  { text: 'Do the hard things first. Your future self will thank you.', author: null },
  { text: 'Progress, not perfection, is the goal.', author: null },
  { text: 'Energy flows where attention goes.', author: null },
  { text: 'A champion is made in the moments nobody is watching.', author: null },
  { text: 'If it was easy, everyone would do it.', author: null },
  { text: 'Momentum is built one completed task at a time.', author: null },
  { text: 'Your best investment is in your daily routine.', author: null },
  { text: 'Focus on systems, not just goals.', author: 'James Clear' },
  { text: 'You don\'t rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Every rep counts. Every task matters.', author: null },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Clarity fuels performance. Know your 5.', author: null },
  { text: 'Protect your energy like it\'s your most valuable asset.', author: null },
  { text: 'A good day starts with a clear game plan.', author: null },
  { text: 'Win the morning, win the day.', author: null },
  { text: 'You are always one decision away from a completely different life.', author: null },
  { text: 'Life balance isn\'t a luxury — it\'s a performance strategy.', author: null },
  { text: 'One day or day one. You decide.', author: null },
  { text: 'Consistency beats intensity every time.', author: null },
  { text: 'The pain of discipline weighs ounces. The pain of regret weighs tons.', author: null },
  { text: 'Make today a peak day.', author: null },
]

export async function seedMessages(db, userId) {
  const ref = collection(db, 'motivationalMessages')
  const results = []
  for (const msg of MESSAGES) {
    const docRef = await addDoc(ref, {
      text:      msg.text,
      author:    msg.author || null,
      createdBy: userId,
      isActive:  true,
      createdAt: serverTimestamp(),
    })
    results.push(docRef.id)
  }
  return results
}
