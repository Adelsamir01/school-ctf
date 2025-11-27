export interface CtfEmojiEntry {
  key: string
  emoji: string
}

const entries: CtfEmojiEntry[] = [
  { key: 'cryptography-challenge/caesar-cipher', emoji: '🔴' },
  { key: 'cryptography-challenge/hidden-message', emoji: '⚪️' },
  { key: 'cryptography-challenge/qr-cyberchef', emoji: '🔵' },
  { key: 'cryptography-challenge/secret-number', emoji: '🟡' },
  { key: 'web-basics-challenge/console-secret', emoji: '🟣' },
  { key: 'web-basics-challenge/cookie-clue', emoji: '🟢' },
  { key: 'web-basics-challenge/element-inspector', emoji: '⚫️' },
  { key: 'web-basics-challenge/robot-rules', emoji: '🟠' },
]

export const CTF_EMOJI_ORDER = entries.map((entry) => entry.key)

const emojiMap = new Map(entries.map((entry) => [entry.key, entry.emoji]))

export const getCtfKey = (challengeId: string, ctfId: string) =>
  `${challengeId}/${ctfId}`

export const getEmojiForCtf = (challengeId: string, ctfId: string) =>
  emojiMap.get(getCtfKey(challengeId, ctfId))

export const getEmojiForKey = (key: string) => emojiMap.get(key)

export const getOrderedEmojisForKeys = (keys: Iterable<string>) => {
  const keySet = new Set(keys)
  return entries
    .filter((entry) => keySet.has(entry.key))
    .map((entry) => entry.emoji)
}

