import { fromPath } from 'pdf2pic'
import Tesseract from 'tesseract.js'
import path from 'path'
import fs from 'fs'

const TMP_DIR = path.join(process.cwd(), 'tmp')

// Ensure tmp folder exists
if (!fs.existsSync(TMP_DIR)) {
	fs.mkdirSync(TMP_DIR, { recursive: true })
}

export async function extractTextFromScannedPDF(pdfPath: string): Promise<string> {
	const convert = fromPath(pdfPath, {
		density: 300, // Higher density = better OCR accuracy
		format: 'png',
		saveFilename: `page`, // prefix for saved files
		savePath: TMP_DIR,
	})

	let pages
	try {
		pages = await convert.bulk(-1) // Convert all pages
	} catch (err) {
		console.error('❌ PDF to image conversion failed:', err)
		throw new Error('Failed to convert PDF to images.')
	}

	if (!pages || pages.length === 0) {
		throw new Error('No pages were generated from PDF.')
	}

	const texts: string[] = []

	for (let i = 0; i < pages.length; i++) {
		const imagePath = pages[i]?.path

		if (!imagePath || !fs.existsSync(imagePath)) {
			console.warn(`⚠️ Page ${i + 1} image not found: ${imagePath}`)
			continue
		}

		try {
			console.log(`🔍 OCR: Page ${i + 1} - ${imagePath}`)
			const result = await Tesseract.recognize(imagePath, 'eng', {
				logger: m => {
					if (m.status === 'recognizing text') {
						console.log(`🧠 OCR progress (page ${i + 1}): ${Math.floor(m.progress * 100)}%`)
					}
				},
			})
			texts.push(result.data.text)
		} catch (err) {
			console.error(`❌ OCR failed on page ${i + 1}:`, err)
			texts.push('') // To preserve structure
		} finally {
			// Optional: clean up image after processing
			try {
				fs.unlinkSync(imagePath)
			} catch (err) {
				console.warn(`⚠️ Failed to delete ${imagePath}:`, err)
			}
		}
	}

	const output = texts.join('\n\n')
	if (!output.trim()) {
		throw new Error('OCR completed but no text was extracted.')
	}

	return output
}
