import React from 'react'
import { Text, TextStyle } from 'react-native'

interface RichTextProps {
  children: string
  style?: TextStyle
}

export const RichText: React.FC<RichTextProps> = ({ children, style }) => {
  if (!children) return null

  // Parse markdown-like formatting
  const parseText = (text: string) => {
    const parts: React.ReactNode[] = []
    let currentIndex = 0
    let key = 0

    // Regex to match **bold**, *italic*, or plain text
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|[^*]+)/g
    const matches = text.match(regex)

    if (!matches) {
      return <Text key={key} style={style}>{text}</Text>
    }

    matches.forEach((match) => {
      if (match.startsWith('**') && match.endsWith('**')) {
        // Bold text
        const boldText = match.slice(2, -2)
        parts.push(
          <Text key={key++} style={[style, { fontWeight: '600' }]}>
            {boldText}
          </Text>
        )
      } else if (match.startsWith('*') && match.endsWith('*')) {
        // Italic text
        const italicText = match.slice(1, -1)
        parts.push(
          <Text key={key++} style={[style, { fontStyle: 'italic' }]}>
            {italicText}
          </Text>
        )
      } else {
        // Plain text (preserves emojis and special characters)
        parts.push(
          <Text key={key++} style={style}>
            {match}
          </Text>
        )
      }
    })

    return <>{parts}</>
  }

  return <Text style={style}>{parseText(children)}</Text>
}