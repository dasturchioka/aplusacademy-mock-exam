import { OpenAI } from 'openai'
import { getStrictSystemPrompt } from './getPrompt' // canvas file
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function parseListeningFromText(text: string) {
	const systemPrompt = await getStrictSystemPrompt('listening')

	const response = await openai.chat.completions.create({
		model: 'gpt-4o',
		temperature: 0,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: text },
		],
	})

	try {
		return JSON.parse(response.choices[0].message.content || '{}')
	} catch (err) {
		console.error('❌ Failed to parse GPT JSON:', err)
		return {}
	}
}
