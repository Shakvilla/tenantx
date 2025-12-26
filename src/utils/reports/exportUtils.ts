// Documentation: /docs/reports/reports-flow.md

import * as XLSX from 'xlsx'

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export const exportToCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToPDF = async (title: string, content: HTMLElement, filename: string) => {
  const { default: jsPDF } = await import('jspdf')

  await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.text(title, 14, 20)

  // For now, we'll export tables. Charts would need to be converted to images first
  const tables = content.querySelectorAll('table')
  let yPosition = 30

  tables.forEach((table, index) => {
    if (index > 0) {
      doc.addPage()
      yPosition = 20
    }

    const rows: any[][] = []
    const headers: string[] = []

    table.querySelectorAll('thead th').forEach((th) => {
      headers.push(th.textContent || '')
    })

    table.querySelectorAll('tbody tr').forEach((tr) => {
      const row: any[] = []

      tr.querySelectorAll('td').forEach((td) => {
        row.push(td.textContent || '')
      })

      if (row.length > 0) {
        rows.push(row)
      }
    })

    if (headers.length > 0 && rows.length > 0) {
      ;(doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        styles: { fontSize: 8 }
      })
    }
  })

  doc.save(`${filename}.pdf`)
}

