import { JSX } from 'react'

export function highlightCapsText(text: string): (string | JSX.Element)[] {
	// Match single or multiple ALL-CAPS words (numbers, slashes, ampersands allowed)
	const regex = /\b([A-Z0-9\/&]+(?:\s+[A-Z0-9\/&]+)*)\b/g

	const parts: (string | JSX.Element)[] = []
	let lastIndex = 0
	let match

	while ((match = regex.exec(text)) !== null) {
		const [fullMatch] = match
		const start = match.index

		// Skip if it's too short (like "A", "I") unless it's a known keyword
		if (fullMatch.length <= 1) continue

		// Push normal text before match
		if (start > lastIndex) {
			parts.push(text.slice(lastIndex, start))
		}

		// Push bolded match
		parts.push(<strong key={start}>{fullMatch}</strong>)

		lastIndex = regex.lastIndex
	}

	// Push any remaining text
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex))
	}

	return parts
}

/**
 * Process text with markdown-style bold (**text**) and bullet points
 * Returns HTML string ready for dangerouslySetInnerHTML
 */
export function processTextFormatting(text: string): string {
	if (!text) return '';
	
	let processed = text;
	
	// Convert bullet markers (-_-_) to bullet points
	processed = processed.replace(/-_-_/g, "• ");
	
	// Handle markdown-style bold: **text** or *text*
	processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
	
	return processed;
}

/**
 * Process text with bold (*text*) and highlight ALL CAPS words
 * Returns HTML string ready for dangerouslySetInnerHTML
 */
export function processTextWithBoldAndCaps(text: string): string {
	if (!text) return '';
	
	let processed = text;
	
	// Convert bullet markers (-_-_) to bullet points
	processed = processed.replace(/-_-_/g, "• ");
	
	// Handle markdown-style bold: **text** or *text*
	processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
	
	// Highlight ALL CAPS words (2+ characters)
	processed = processed.replace(/\b([A-Z0-9\/&]{2,}(?:\s+[A-Z0-9\/&]+)*)\b/g, '<strong>$1</strong>');
	
	return processed;
}

