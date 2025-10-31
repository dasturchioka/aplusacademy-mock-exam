import { readFile } from 'fs/promises'
import path from 'path'

export async function getStrictSystemPrompt(part: string): Promise<string> {
	const filePath = path.resolve(process.cwd(), 'prompts', `${part}-prompt.txt`)
	const content = await readFile(filePath, { encoding: 'utf-8' })
	return content.trim() // optional: trim trailing whitespace
}
