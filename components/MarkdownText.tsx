import React from 'react'
import { Text, TextStyle, View } from 'react-native'

interface MarkdownTextProps {
  children: string
  style?: TextStyle
}

export function MarkdownText({ children, style }: MarkdownTextProps) {
  // Handle undefined or null children
  if (!children) {
    return <Text style={style}>Loading...</Text>
  }
  
  // Process bold first, then italics
  const processMarkdown = (text: string): React.ReactNode => {
    // First replace bold markers
    const boldParts = text.split(/\*\*([^*]+)\*\*/g)
    
    const elements: React.ReactNode[] = []
    
    boldParts.forEach((part, index) => {
      if (index % 2 === 1) {
        // This is bold text
        elements.push(
          <Text key={`bold-${index}`} style={{ fontWeight: '700' }}>
            {part}
          </Text>
        )
      } else if (part) {
        // This is regular or italic text - check for italics
        const italicParts = part.split(/\*([^*]+)\*/g)
        
        italicParts.forEach((italicPart, italicIndex) => {
          if (italicIndex % 2 === 1) {
            // This is italic text
            elements.push(
              <Text key={`italic-${index}-${italicIndex}`} style={{ fontStyle: 'italic' }}>
                {italicPart}
              </Text>
            )
          } else if (italicPart) {
            // This is regular text
            elements.push(italicPart)
          }
        })
      }
    })
    
    return elements.length > 0 ? elements : text
  }
  
  return (
    <Text style={style}>
      {processMarkdown(children)}
    </Text>
  )
}