import * as XLSX from 'xlsx'

/**
 * Generic utility to export JSON data to an Excel file with styled headers and auto-sized columns.
 *
 * @param data - Array of objects containing the data.
 * @param columns - Array of { header: string, key: string | ((row) => any) } objects.
 * @param fileName - Name of the exported file.
 */
export function exportToExcel<T>(
	data: T[],
	columns: { header: string; key: keyof T | ((row: T, index: number) => any) }[],
	fileName: string
) {
	// Transform data into rows according to the provided columns
	const rows = data.map((row, index) =>
		columns.reduce((acc: any, col) => {
			if (typeof col.key === 'function') {
				acc[col.header] = col.key(row, index)
			} else {
				acc[col.header] = (row as any)[col.key]
			}
			return acc
		}, {})
	)

	// Add headers manually as first row
	const worksheet = XLSX.utils.aoa_to_sheet([
		columns.map(c => c.header), // header row
		...rows.map(r => columns.map(c => r[c.header])),
	])

	// Apply header styles (bold + light blue background)
	const range = XLSX.utils.decode_range(worksheet['!ref']!)
	for (let C = range.s.c; C <= range.e.c; ++C) {
		const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
		const cell = worksheet[cellAddress]
		if (cell) {
			cell.s = {
				font: { bold: true },
				fill: { fgColor: { rgb: 'ADD8E6' } }, // light blue
				alignment: { horizontal: 'center', vertical: 'center' },
			}
		}
	}

	// Auto column widths
	const colWidths = columns.map((c, colIdx) => {
		const headerText = c.header?.toString() || ''
		const maxLen = Math.max(
			headerText.length,
			...rows.map(r => (r[c.header] ? String(r[c.header]).length : 0))
		)
		return { wch: maxLen + 2 } // +2 padding
	})
	worksheet['!cols'] = colWidths

	// Auto filter for table-like view
	worksheet['!autofilter'] = { ref: worksheet['!ref']! }

	// Workbook
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

	// Format timestamp: dd/mm/yyyy, hh:mm
	const now = new Date()
	const pad = (n: number) => n.toString().padStart(2, '0')
	const timestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(
		now.getHours()
	)}:${pad(now.getMinutes())}`

	const finalFileName = `${fileName} - ${timestamp}.xlsx`

	// Export
	XLSX.writeFile(workbook, finalFileName)
}
