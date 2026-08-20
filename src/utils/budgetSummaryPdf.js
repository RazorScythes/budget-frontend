import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/** Plain-text currency for PDF (avoids symbol/font rendering issues). e.g. "PHP 1,000.00" */
export function formatPdfAmount(value, currencyCode = 'PHP') {
    const code = String(currencyCode || 'PHP').toUpperCase()
    const num = Number(value) || 0
    const formatted = num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${code} ${formatted}`
}

/** Normalize smart quotes/special chars so Poppins renders consistently (no Helvetica fallback). */
export function sanitizePdfText(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2013\u2014\u2212]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .replace(/[^\t\n\r\x20-\x7E]/g, (ch) => {
            // Keep common Latin extended letters; strip rare symbols that break subset fonts
            const code = ch.charCodeAt(0)
            if (code >= 0x00C0 && code <= 0x024F) return ch
            return ''
        })
        .replace(/\s+/g, ' ')
        .trim()
}

const FONT_REGULAR_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.8/files/poppins-latin-400-normal.ttf'
const FONT_SEMIBOLD_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.8/files/poppins-latin-600-normal.ttf'

const MARGIN_X = 14
const HEADER_H = 26
const FOOTER_H = 14
const BODY_TOP = HEADER_H + 8
const BODY_BOTTOM_OFFSET = FOOTER_H + 6

const PDF_THEMES = {
    light: {
        page: [255, 255, 255],
        headerGradientTop: [239, 246, 255],
        headerGradientBottom: [238, 242, 255],
        headerAccent: [59, 130, 246],
        headerTitle: [30, 41, 59],
        headerSub: [100, 116, 139],
        headerMeta: [37, 99, 235],
        footerBg: [255, 255, 255],
        footerText: [148, 163, 184],
        border: [226, 232, 240],
        borderSoft: [241, 245, 249],
        text: [30, 41, 59],
        textSecondary: [71, 85, 105],
        muted: [100, 116, 139],
        tableHead: [248, 250, 252],
        tableRow: [255, 255, 255],
        tableAlt: [248, 250, 252],
        tableGroup: [241, 245, 249],
        tableHeadText: [100, 116, 139],
        tableFootText: [30, 41, 59],
        stat: {
            emerald: { bg: [236, 253, 245], text: [4, 120, 87], border: [167, 243, 208] },
            red: { bg: [254, 242, 242], text: [185, 28, 28], border: [254, 202, 202] },
            blue: { bg: [239, 246, 255], text: [29, 78, 216], border: [191, 219, 254] },
            amber: { bg: [255, 251, 235], text: [180, 83, 9], border: [253, 230, 138] },
        },
        emerald: [16, 185, 129],
        red: [239, 68, 68],
        amber: [245, 158, 11],
        primary: [37, 99, 235],
        quickPanel: [248, 250, 252],
        debtRow: [255, 251, 235],
        debtText: [180, 83, 9],
        incomeRow: [236, 253, 245],
        sectionAccent: [59, 130, 246],
    },
    dark: {
        page: [14, 14, 14],
        headerGradientTop: [17, 24, 39],
        headerGradientBottom: [30, 27, 75],
        headerAccent: [59, 130, 246],
        headerTitle: [255, 255, 255],
        headerSub: [156, 163, 175],
        headerMeta: [96, 165, 250],
        footerBg: [14, 14, 14],
        footerText: [107, 114, 128],
        border: [43, 43, 43],
        borderSoft: [31, 31, 31],
        text: [229, 231, 235],
        textSecondary: [209, 213, 219],
        muted: [156, 163, 175],
        tableHead: [17, 17, 17],
        tableRow: [14, 14, 14],
        tableAlt: [22, 22, 24],
        tableGroup: [10, 10, 10],
        tableHeadText: [156, 163, 175],
        tableFootText: [229, 231, 235],
        stat: {
            emerald: { bg: [6, 46, 34], text: [52, 211, 153], border: [6, 78, 59] },
            red: { bg: [69, 10, 10], text: [248, 113, 113], border: [127, 29, 29] },
            blue: { bg: [23, 37, 84], text: [96, 165, 250], border: [30, 58, 138] },
            amber: { bg: [69, 45, 7], text: [251, 191, 36], border: [120, 53, 15] },
        },
        emerald: [52, 211, 153],
        red: [248, 113, 113],
        amber: [251, 191, 36],
        primary: [96, 165, 250],
        quickPanel: [17, 17, 17],
        debtRow: [69, 45, 7],
        debtText: [251, 191, 36],
        incomeRow: [6, 46, 34],
        sectionAccent: [96, 165, 250],
    },
}

const TABLE_LAYOUTS = {
    budget: [
        { ratio: 0.34, halign: 'left' },
        { ratio: 0.165, halign: 'right', numeric: true },
        { ratio: 0.165, halign: 'right', numeric: true },
        { ratio: 0.165, halign: 'right', numeric: true },
        { ratio: 0.155, halign: 'right', numeric: true },
    ],
    payment: [
        { ratio: 0.48, halign: 'left' },
        { ratio: 0.34, halign: 'right', numeric: true },
        { ratio: 0.18, halign: 'right', numeric: true },
    ],
    ytd: [
        { ratio: 0.14, halign: 'left' },
        { ratio: 0.215, halign: 'right', numeric: true },
        { ratio: 0.215, halign: 'right', numeric: true },
        { ratio: 0.215, halign: 'right', numeric: true },
        { ratio: 0.215, halign: 'right', numeric: true },
    ],
    transactions: [
        { ratio: 0.11, halign: 'left' },
        { ratio: 0.33, halign: 'left' },
        { ratio: 0.22, halign: 'left' },
        { ratio: 0.16, halign: 'left' },
        { ratio: 0.18, halign: 'right', numeric: true },
    ],
    keyValue: [
        { ratio: 0.62, halign: 'left' },
        { ratio: 0.38, halign: 'right', numeric: true },
    ],
}

let cachedFontData = null
let fontLoadPromise = null

function bufferToBase64(buffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
}

async function loadPoppinsFonts() {
    if (cachedFontData) return cachedFontData
    if (!fontLoadPromise) {
        fontLoadPromise = Promise.all([
            fetch(FONT_REGULAR_URL).then(r => {
                if (!r.ok) throw new Error('Poppins Regular failed')
                return r.arrayBuffer()
            }),
            fetch(FONT_SEMIBOLD_URL).then(r => {
                if (!r.ok) throw new Error('Poppins SemiBold failed')
                return r.arrayBuffer()
            }),
        ]).then(([regular, semibold]) => {
            cachedFontData = {
                regular: bufferToBase64(regular),
                semibold: bufferToBase64(semibold),
            }
            return cachedFontData
        }).catch((err) => {
            console.warn('[PDF] Poppins load failed, using Helvetica:', err)
            fontLoadPromise = null
            return null
        })
    }
    return fontLoadPromise
}

function registerFonts(pdf, fonts) {
    if (!fonts) return false
    pdf.addFileToVFS('Poppins-Regular.ttf', fonts.regular)
    pdf.addFont('Poppins-Regular.ttf', 'Poppins', 'normal')
    pdf.addFileToVFS('Poppins-SemiBold.ttf', fonts.semibold)
    pdf.addFont('Poppins-SemiBold.ttf', 'Poppins', 'bold')
    return true
}

function fontFamily(pdf) {
    return pdf.getFontList()?.Poppins ? 'Poppins' : 'helvetica'
}

function setFont(pdf, style = 'normal', size = 9) {
    const family = fontFamily(pdf)
    if (family === 'Poppins') {
        pdf.setFont('Poppins', style === 'bold' ? 'bold' : 'normal')
    } else {
        pdf.setFont('helvetica', style === 'bold' ? 'bold' : 'normal')
    }
    pdf.setFontSize(size)
}

function pageHeight(pdf) {
    return pdf.internal.pageSize.getHeight()
}

function pageWidth(pdf) {
    return pdf.internal.pageSize.getWidth()
}

function contentWidth(pdf) {
    return pageWidth(pdf) - MARGIN_X * 2
}

function bodyBottom(pdf) {
    return pageHeight(pdf) - BODY_BOTTOM_OFFSET
}

function buildColumnStyles(pdf, layout, tableW = null) {
    const w = tableW ?? contentWidth(pdf)
    const family = fontFamily(pdf)
    const styles = {}
    layout.forEach((col, i) => {
        styles[i] = {
            cellWidth: w * col.ratio,
            halign: col.halign,
            valign: 'top',
            ...(col.numeric ? { font: family, fontStyle: 'normal' } : {}),
        }
    })
    return styles
}

function applyPlainNumericStyle(data, theme, pdf, { color } = {}) {
    const t = PDF_THEMES[theme]
    data.cell.styles.font = fontFamily(pdf)
    data.cell.styles.fontStyle = 'normal'
    data.cell.styles.textColor = color || t.text
    data.cell.styles.halign = 'right'
    data.cell.styles.valign = 'top'
}

function applyTextCellStyle(data, theme, pdf, { color, bold = false } = {}) {
    const t = PDF_THEMES[theme]
    data.cell.styles.font = fontFamily(pdf)
    data.cell.styles.fontStyle = bold ? 'bold' : 'normal'
    data.cell.styles.textColor = color || t.text
    data.cell.styles.valign = 'top'
}

function budgetStatusColor(theme, pct, hasBudget) {
    const t = PDF_THEMES[theme]
    if (!hasBudget) return t.muted
    if (pct > 100) return t.red
    if (pct >= 80) return t.amber
    return t.emerald
}

function parsePct(raw) {
    const n = parseInt(String(raw).replace(/[^\d-]/g, ''), 10)
    return Number.isFinite(n) ? n : null
}

function applyColumnLayout(data, layout) {
    const col = layout?.[data.column.index]
    if (!col) return
    data.cell.styles.halign = col.halign
    data.cell.styles.valign = 'top'
}

function isNumericCol(layout, colIndex) {
    return layout?.[colIndex]?.numeric === true
}

function baseTableStyles(pdf, theme) {
    const t = PDF_THEMES[theme]
    return {
        font: fontFamily(pdf),
        fontSize: 8,
        fillColor: t.tableRow,
        cellPadding: { top: 3, right: 3, bottom: 1, left: 3 },
        lineColor: t.border,
        lineWidth: 0.15,
        textColor: t.text,
        overflow: 'linebreak',
        valign: 'top',
        minCellHeight: 0,
    }
}

function applyBodyRowFill(data, theme) {
    if (data.section !== 'body') return
    if (data.cell.raw && typeof data.cell.raw === 'object' && data.cell.raw.colSpan) return
    const t = PDF_THEMES[theme]
    data.cell.styles.fillColor = data.row.index % 2 === 0 ? t.tableRow : t.tableAlt
}

function fillPageBackground(pdf, theme) {
    const t = PDF_THEMES[theme]
    pdf.setFillColor(...t.page)
    pdf.rect(0, 0, pageWidth(pdf), pageHeight(pdf), 'F')
}

function drawPageChrome(pdf, theme, meta, pageNum, totalPages) {
    const w = pageWidth(pdf)
    const h = pageHeight(pdf)
    const t = PDF_THEMES[theme]

    pdf.setFillColor(...t.headerAccent)
    pdf.rect(0, 0, w, 2.5, 'F')

    const steps = 6
    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1)
        const r = Math.round(t.headerGradientTop[0] + (t.headerGradientBottom[0] - t.headerGradientTop[0]) * ratio)
        const g = Math.round(t.headerGradientTop[1] + (t.headerGradientBottom[1] - t.headerGradientTop[1]) * ratio)
        const b = Math.round(t.headerGradientTop[2] + (t.headerGradientBottom[2] - t.headerGradientTop[2]) * ratio)
        pdf.setFillColor(r, g, b)
        const y0 = 2.5 + (i * (HEADER_H - 2.5)) / steps
        const y1 = 2.5 + ((i + 1) * (HEADER_H - 2.5)) / steps
        pdf.rect(0, y0, w, y1 - y0, 'F')
    }

    pdf.setDrawColor(...t.border)
    pdf.setLineWidth(0.25)
    pdf.line(MARGIN_X, HEADER_H, w - MARGIN_X, HEADER_H)

    setFont(pdf, 'bold', 13)
    pdf.setTextColor(...t.headerTitle)
    pdf.text('Monthly Budget Summary', MARGIN_X, 11.5)

    setFont(pdf, 'normal', 7.5)
    pdf.setTextColor(...t.headerSub)
    pdf.text('Budget · Finance tracker', MARGIN_X, 17)

    setFont(pdf, 'bold', 9)
    pdf.setTextColor(...t.headerMeta)
    pdf.text(`${meta.monthLabel} ${meta.year}`, w - MARGIN_X, 11.5, { align: 'right' })

    setFont(pdf, 'normal', 7.5)
    pdf.setTextColor(...t.headerSub)
    pdf.text(`${meta.currency} · Generated ${meta.generatedAt}`, w - MARGIN_X, 17, { align: 'right' })

    const footerY = h - FOOTER_H + 4.5
    pdf.setFillColor(...t.footerBg)
    pdf.rect(0, h - FOOTER_H - 2, w, FOOTER_H + 2, 'F')

    pdf.setDrawColor(...t.border)
    pdf.line(MARGIN_X, footerY - 3.5, w - MARGIN_X, footerY - 3.5)

    setFont(pdf, 'normal', 7.5)
    pdf.setTextColor(...t.footerText)
    pdf.text('Budget Manager', MARGIN_X, footerY)
    pdf.text(`Page ${pageNum} of ${totalPages}`, w - MARGIN_X, footerY, { align: 'right' })
}

function stampAllPages(pdf, theme, meta) {
    const total = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
        pdf.setPage(i)
        drawPageChrome(pdf, theme, meta, i, total)
    }
}

function sectionTitle(pdf, theme, y, title) {
    const t = PDF_THEMES[theme]
    setFont(pdf, 'bold', 9)
    pdf.setTextColor(...t.text)
    pdf.text(sanitizePdfText(title).toUpperCase(), MARGIN_X, y)
    pdf.setDrawColor(...t.borderSoft)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN_X, y + 1.5, pageWidth(pdf) - MARGIN_X, y + 1.5)
    return y + 6.5
}

function ensureSpace(pdf, theme, state, needed) {
    if (state.y + needed > bodyBottom(pdf)) {
        pdf.addPage()
        fillPageBackground(pdf, theme)
        state.y = BODY_TOP
    }
}

function fitText(pdf, text, maxWidth) {
    const str = String(text ?? '')
    if (pdf.getTextWidth(str) <= maxWidth) return str
    let trimmed = str
    while (trimmed.length > 1 && pdf.getTextWidth(`${trimmed}…`) > maxWidth) {
        trimmed = trimmed.slice(0, -1)
    }
    return `${trimmed}…`
}

function drawStatCards(pdf, theme, state, cards, { title } = {}) {
    const t = PDF_THEMES[theme]
    ensureSpace(pdf, theme, state, 22)
    if (title) {
        state.y = sectionTitle(pdf, theme, state.y, title)
    }
    const gap = 3
    const cardW = (contentWidth(pdf) - gap * 3) / 4
    const cardH = 19
    let x = MARGIN_X

    cards.forEach((card) => {
        const tone = t.stat[card.tone] || t.stat.blue
        pdf.setFillColor(...tone.bg)
        pdf.setDrawColor(...tone.border)
        pdf.setLineWidth(0.2)
        pdf.roundedRect(x, state.y, cardW, cardH, 2, 2, 'FD')

        setFont(pdf, 'normal', 6.5)
        pdf.setTextColor(...t.muted)
        pdf.text(card.label.toUpperCase(), x + 3, state.y + 6.5)

        setFont(pdf, 'normal', 9.5)
        pdf.setTextColor(...tone.text)
        pdf.text(fitText(pdf, card.value, cardW - 6), x + 3, state.y + 14.5)

        x += cardW + gap
    })

    state.y += cardH + 6
}

function runAutoTable(pdf, theme, state, options) {
    const t = PDF_THEMES[theme]
    const layout = options.layout
    const tableKey = options.tableKey
    const rowMeta = options.rowMeta || []
    const { tableKey: _tk, layout: _layout, rowMeta: _rm, ...tableOptions } = options
    const family = fontFamily(pdf)
    const colStyles = layout ? buildColumnStyles(pdf, layout) : (tableOptions.columnStyles || {})

    autoTable(pdf, {
        theme: 'plain',
        tableWidth: contentWidth(pdf),
        showHead: 'everyPage',
        rowPageBreak: 'auto',
        styles: baseTableStyles(pdf, theme),
        headStyles: {
            fillColor: t.tableHead,
            textColor: t.tableHeadText,
            font: family,
            fontStyle: 'bold',
            fontSize: 7.5,
            valign: 'top',
            cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
        },
        footStyles: {
            fillColor: t.tableHead,
            textColor: t.tableFootText,
            font: family,
            fontStyle: 'bold',
            fontSize: 8,
            valign: 'top',
        },
        alternateRowStyles: { fillColor: t.tableAlt },
        margin: { top: BODY_TOP, bottom: BODY_BOTTOM_OFFSET, left: MARGIN_X, right: MARGIN_X },
        startY: Math.max(state.y, BODY_TOP),
        columnStyles: colStyles,
        ...tableOptions,
        didParseCell: (data) => {
            data.cell.styles.valign = 'top'
            if (layout) applyColumnLayout(data, layout)
            applyBodyRowFill(data, theme)

            const meta = rowMeta[data.row.index]
            const rawText = typeof data.cell.raw === 'string' ? data.cell.raw : (data.cell.raw?.content ?? '')

            if (data.section === 'head') {
                data.cell.styles.font = family
                if (layout && isNumericCol(layout, data.column.index)) {
                    data.cell.styles.fontStyle = 'normal'
                    data.cell.styles.textColor = t.tableHeadText
                    data.cell.styles.halign = 'right'
                }
            }

            if (data.section === 'body' && data.cell.raw && typeof data.cell.raw === 'object' && data.cell.raw.colSpan) {
                data.cell.styles.fillColor = data.cell.raw.styles?.fillColor || t.tableGroup
                data.cell.styles.font = family
                data.cell.styles.fontStyle = 'bold'
                data.cell.styles.textColor = t.muted
                data.cell.styles.fontSize = 7.5
                data.cell.styles.halign = 'left'
            } else if (data.section === 'body' || data.section === 'foot') {
                const isNumeric = layout && isNumericCol(layout, data.column.index)
                if (isNumeric) {
                    let numColor = t.text
                    if (tableKey === 'budget') {
                        if (data.column.index === 2) numColor = t.red
                        if (data.column.index === 3) {
                            const rem = meta?.remaining
                            numColor = rem != null && rem < 0 ? t.red : t.emerald
                        }
                        if (data.column.index === 4) {
                            const pct = parsePct(rawText)
                            numColor = budgetStatusColor(theme, pct ?? 0, pct != null)
                        }
                    }
                    if (tableKey === 'ytd') {
                        if (data.column.index === 1) numColor = t.emerald
                        if (data.column.index === 2) numColor = t.red
                        if (data.column.index === 3 && rawText !== '—') {
                            numColor = String(rawText).startsWith('PHP -') ? t.red : t.emerald
                        }
                    }
                    if (tableKey === 'transactions' && data.column.index === 4) {
                        if (String(rawText).startsWith('+')) numColor = t.emerald
                        else if (String(rawText).startsWith('-')) numColor = t.red
                    }
                    applyPlainNumericStyle(data, theme, pdf, { color: numColor })
                } else {
                    applyTextCellStyle(data, theme, pdf)
                    if (tableKey === 'transactions' && data.column.index === 1 && meta?.isDebt) {
                        data.cell.styles.fillColor = t.debtRow
                        data.cell.styles.textColor = t.debtText
                        data.cell.styles.fontStyle = 'bold'
                    }
                    if (tableKey === 'transactions' && meta?.type === 'income' && data.column.index === 1) {
                        data.cell.styles.textColor = t.emerald
                    }
                    if (meta?.listOnly) {
                        data.cell.styles.textColor = t.muted
                    }
                }
            }

            if (meta?.isDebt && data.section === 'body' && layout && !isNumericCol(layout, data.column.index)) {
                if (!(data.cell.raw && typeof data.cell.raw === 'object' && data.cell.raw.colSpan)) {
                    data.cell.styles.fillColor = t.debtRow
                }
            }
            if (meta?.type === 'income' && data.section === 'body' && data.column.index === 0) {
                data.cell.styles.textColor = t.emerald
            }

            tableOptions.didParseCell?.(data)
        },
        willDrawPage: (data) => {
            if (data.cursor.y <= BODY_TOP + 1) {
                fillPageBackground(pdf, theme)
            }
        },
    })
    state.y = (pdf.lastAutoTable?.finalY ?? state.y) + 6
}

function drawKeyValueList(pdf, theme, state, title, rows, { totalLabel, totalValue, tone } = {}) {
    const t = PDF_THEMES[theme]
    ensureSpace(pdf, theme, state, 12 + rows.length * 5)
    state.y = sectionTitle(pdf, theme, state.y, title)

    const body = rows.map(r => [
        r.sub ? `${sanitizePdfText(r.label)} (${sanitizePdfText(r.sub)})` : sanitizePdfText(r.label),
        sanitizePdfText(r.value),
    ])

    const tableOpts = {
        theme: 'plain',
        tableWidth: contentWidth(pdf),
        body,
        margin: { left: MARGIN_X, right: MARGIN_X },
        startY: state.y,
        styles: {
            ...baseTableStyles(pdf, theme),
            lineWidth: 0,
            cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        },
        columnStyles: buildColumnStyles(pdf, TABLE_LAYOUTS.keyValue),
        didParseCell: (data) => {
            data.cell.styles.valign = 'top'
            applyColumnLayout(data, TABLE_LAYOUTS.keyValue)
            if (data.section === 'body' && data.column.index === 0) {
                applyTextCellStyle(data, theme, pdf, { color: t.textSecondary })
                data.cell.styles.halign = 'left'
            }
            if (data.section === 'body' && data.column.index === 1) {
                applyPlainNumericStyle(data, theme, pdf)
            }
            if (data.section === 'foot' && data.column.index === 0) {
                applyTextCellStyle(data, theme, pdf, { bold: true })
                data.cell.styles.halign = 'left'
            }
            if (data.section === 'foot' && data.column.index === 1) {
                const footColor = tone === 'emerald' ? t.emerald : tone === 'red' ? t.red : t.text
                applyPlainNumericStyle(data, theme, pdf, { color: footColor })
            }
        },
    }

    if (totalLabel) {
        tableOpts.foot = [[sanitizePdfText(totalLabel), sanitizePdfText(totalValue)]]
    }

    autoTable(pdf, tableOpts)
    state.y = (pdf.lastAutoTable?.finalY ?? state.y) + 6
}

function drawDebtTable(pdf, theme, state, debts) {
    if (!debts?.length) return
    const t = PDF_THEMES[theme]
    ensureSpace(pdf, theme, state, 14)
    state.y = sectionTitle(pdf, theme, state.y, 'Active Debts')

    const body = debts.map(d => {
        const remaining = (d.total_amount || 0) - (d.amount_paid || 0)
        const pct = d.total_amount > 0 ? Math.round((d.amount_paid / d.total_amount) * 100) : 0
        const due = d.due_date
            ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '—'
        return [
            sanitizePdfText(d.name),
            sanitizePdfText(d.person || '—'),
            d.type === 'owe' ? 'Payable' : 'Receivable',
            formatPdfAmount(remaining, d.currency || 'PHP'),
            `${pct}%`,
            due,
        ]
    })

    runAutoTable(pdf, theme, state, {
        tableKey: 'debts',
        layout: [
            { ratio: 0.26, halign: 'left' },
            { ratio: 0.18, halign: 'left' },
            { ratio: 0.14, halign: 'left' },
            { ratio: 0.2, halign: 'right', numeric: true },
            { ratio: 0.1, halign: 'right', numeric: true },
            { ratio: 0.12, halign: 'right', numeric: true },
        ],
        head: [['Debt', 'Person', 'Type', 'Remaining', 'Paid', 'Due']],
        body,
        rowMeta: debts.map(d => ({
            isDebt: true,
            type: d.type === 'owed' ? 'income' : 'expense',
            remaining: (d.total_amount || 0) - (d.amount_paid || 0),
        })),
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
                const raw = String(data.cell.raw)
                applyTextCellStyle(data, theme, pdf, {
                    color: raw === 'Payable' ? t.red : t.emerald,
                    bold: true,
                })
            }
            if (data.section === 'body' && data.column.index === 0) {
                data.cell.styles.fillColor = t.debtRow
                applyTextCellStyle(data, theme, pdf, { color: t.debtText, bold: true })
            }
        },
    })
}

const CHART_PALETTE = [
    [99, 102, 241],
    [16, 185, 129],
    [245, 158, 11],
    [239, 68, 68],
    [139, 92, 246],
    [6, 182, 212],
    [236, 72, 153],
    [249, 115, 22],
]

function parseChartColor(color, fallback) {
    if (Array.isArray(color) && color.length >= 3) return color.slice(0, 3)
    const hex = String(color || '').replace('#', '').trim()
    if (hex.length === 6) {
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
        ]
    }
    if (hex.length === 3) {
        return hex.split('').map(ch => parseInt(ch + ch, 16))
    }
    return fallback
}

function formatChartAmount(value, currencyCode = 'PHP') {
    const n = Number(value) || 0
    if (n >= 1_000_000) return `${currencyCode} ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 10_000) return `${currencyCode} ${(n / 1_000).toFixed(1)}k`
    return formatPdfAmount(n, currencyCode)
}

function drawChartLegend(pdf, theme, x, y, items) {
    const t = PDF_THEMES[theme]
    let cx = x
    items.forEach((item) => {
        const color = parseChartColor(item.color, t.primary)
        pdf.setFillColor(...color)
        pdf.rect(cx, y - 2.5, 3, 3, 'F')
        setFont(pdf, 'normal', 6)
        pdf.setTextColor(...t.muted)
        pdf.text(item.label, cx + 4.5, y)
        cx += pdf.getTextWidth(item.label) + 10
    })
}

function drawHorizontalBarChart(pdf, theme, state, title, items, options = {}) {
    if (!items?.length) return
    const t = PDF_THEMES[theme]
    const maxItems = options.maxItems ?? 8
    const rows = items.slice(0, maxItems)
    const rowH = 7
    const labelW = options.labelWidth ?? 36
    const valueW = options.valueWidth ?? 26
    const chartLeft = MARGIN_X + labelW
    const chartRight = pageWidth(pdf) - MARGIN_X - valueW
    const barH = 3.2
    const needed = 8 + rows.length * rowH + (options.legend ? 6 : 0)

    ensureSpace(pdf, theme, state, needed)
    state.y = sectionTitle(pdf, theme, state.y, title)

    const maxVal = Math.max(...rows.map(r => Number(r.value) || 0), 1)
    const barW = chartRight - chartLeft

    rows.forEach((item, i) => {
        const y = state.y + i * rowH
        const val = Number(item.value) || 0
        const barColor = parseChartColor(
            item.color,
            options.barColor || CHART_PALETTE[i % CHART_PALETTE.length],
        )

        setFont(pdf, 'normal', 7)
        pdf.setTextColor(...t.textSecondary)
        pdf.text(fitText(pdf, sanitizePdfText(item.label), labelW - 2), MARGIN_X, y + 3.5)

        pdf.setFillColor(...(options.trackColor || t.borderSoft))
        pdf.roundedRect(chartLeft, y + 1.2, barW, barH, 1, 1, 'F')

        if (val > 0) {
            const fillW = Math.max((val / maxVal) * barW, 1.5)
            pdf.setFillColor(...barColor)
            pdf.roundedRect(chartLeft, y + 1.2, fillW, barH, 1, 1, 'F')
        }

        setFont(pdf, 'normal', 6.5)
        pdf.setTextColor(...(options.valueColor || t.text))
        const valueText = options.formatValue
            ? options.formatValue(val)
            : formatChartAmount(val, options.currencyCode)
        pdf.text(valueText, pageWidth(pdf) - MARGIN_X, y + 3.5, { align: 'right' })
    })

    state.y += rows.length * rowH + 2
    if (options.legend?.length) {
        drawChartLegend(pdf, theme, MARGIN_X, state.y + 3, options.legend)
        state.y += 6
    } else {
        state.y += 2
    }
}

function drawGroupedHorizontalBarChart(pdf, theme, state, title, items, options = {}) {
    if (!items?.length) return
    const t = PDF_THEMES[theme]
    const rows = items.slice(0, options.maxItems ?? 8)
    const rowH = 8
    const labelW = 36
    const chartLeft = MARGIN_X + labelW
    const chartRight = pageWidth(pdf) - MARGIN_X
    const barH = 2.4
    const gap = 0.8
    const needed = 10 + rows.length * rowH + 6

    ensureSpace(pdf, theme, state, needed)
    state.y = sectionTitle(pdf, theme, state.y, title)

    const maxVal = Math.max(
        ...rows.flatMap(r => [Number(r.budget) || 0, Number(r.spent) || 0]),
        1,
    )
    const barW = chartRight - chartLeft
    const budgetColor = options.budgetColor || (theme === 'dark' ? [42, 42, 42] : [226, 232, 240])
    const spentColor = options.spentColor || t.primary

    drawChartLegend(pdf, theme, MARGIN_X, state.y + 2, [
        { label: 'Budget', color: budgetColor },
        { label: 'Spent', color: spentColor },
    ])
    state.y += 5

    rows.forEach((item, i) => {
        const y = state.y + i * rowH
        const budget = Number(item.budget) || 0
        const spent = Number(item.spent) || 0

        setFont(pdf, 'normal', 7)
        pdf.setTextColor(...t.textSecondary)
        pdf.text(fitText(pdf, sanitizePdfText(item.label), labelW - 2), MARGIN_X, y + 4)

        pdf.setFillColor(...budgetColor)
        const budgetFill = Math.max((budget / maxVal) * barW, budget > 0 ? 1.5 : 0)
        if (budgetFill > 0) {
            pdf.roundedRect(chartLeft, y + 0.8, budgetFill, barH, 0.8, 0.8, 'F')
        }

        pdf.setFillColor(...spentColor)
        const spentFill = Math.max((spent / maxVal) * barW, spent > 0 ? 1.5 : 0)
        if (spentFill > 0) {
            pdf.roundedRect(chartLeft, y + 0.8 + barH + gap, spentFill, barH, 0.8, 0.8, 'F')
        }
    })

    state.y += rows.length * rowH + 4
}

function drawVerticalBarChart(pdf, theme, state, title, series, options = {}) {
    if (!series?.length) return
    const t = PDF_THEMES[theme]
    const chartH = options.height ?? 40
    const yAxisW = options.yAxisWidth ?? 14
    const legendH = options.legend?.length ? 6 : 0
    const needed = chartH + 16 + legendH

    ensureSpace(pdf, theme, state, needed)
    state.y = sectionTitle(pdf, theme, state.y, title)

    const chartTop = state.y + 2
    const chartBottom = chartTop + chartH
    const chartLeft = MARGIN_X + yAxisW
    const chartRight = pageWidth(pdf) - MARGIN_X
    const chartW = chartRight - chartLeft

    const maxVal = Math.max(
        ...series.flatMap(s => (s.bars || [{ value: s.value }]).map(b => Number(b.value) || 0)),
        1,
    )

    pdf.setDrawColor(...t.border)
    pdf.setLineWidth(0.15)
    pdf.line(chartLeft, chartBottom, chartRight, chartBottom)

    for (let tick = 0; tick <= 4; tick++) {
        const ratio = tick / 4
        const y = chartBottom - ratio * chartH
        pdf.setDrawColor(...t.borderSoft)
        pdf.line(chartLeft, y, chartRight, y)
        if (tick > 0) {
            setFont(pdf, 'normal', 5.5)
            pdf.setTextColor(...t.muted)
            const tickVal = maxVal * ratio
            pdf.text(formatChartAmount(tickVal, options.currencyCode), chartLeft - 1.5, y + 1, { align: 'right' })
        }
    }

    const n = series.length
    const groupW = chartW / n
    const grouped = options.grouped === true

    series.forEach((item, i) => {
        const bars = item.bars || [{ value: item.value, color: item.color || options.barColor || t.primary }]
        const barsCount = bars.length
        const innerGap = grouped ? 0.8 : 1.2
        const barW = grouped
            ? Math.max((groupW - innerGap * (barsCount + 1)) / barsCount, 1.2)
            : Math.max(groupW - innerGap * 2, 1.2)
        const groupX = chartLeft + i * groupW

        bars.forEach((bar, bi) => {
            const val = Number(bar.value) || 0
            const barHeight = Math.max((val / maxVal) * (chartH - 1), val > 0 ? 0.8 : 0)
            const x = grouped
                ? groupX + innerGap + bi * (barW + innerGap)
                : groupX + (groupW - barW) / 2
            const color = parseChartColor(bar.color, options.barColor || t.primary)
            pdf.setFillColor(...color)
            pdf.rect(x, chartBottom - barHeight, barW, barHeight, 'F')
        })

        const showLabel = options.labelInterval
            ? i % options.labelInterval === 0 || i === n - 1
            : true
        if (showLabel) {
            setFont(pdf, 'normal', 5.5)
            pdf.setTextColor(...t.muted)
            pdf.text(sanitizePdfText(item.label), groupX + groupW / 2, chartBottom + 4, { align: 'center' })
        }
    })

    state.y = chartBottom + 6
    if (options.legend?.length) {
        drawChartLegend(pdf, theme, MARGIN_X, state.y + 2, options.legend)
        state.y += legendH
    }
    state.y += 2
}

function drawChartPairRow(pdf, theme, state, leftChart, rightChart) {
    const hasLeft = leftChart?.items?.length
    const hasRight = rightChart?.items?.length
    if (!hasLeft && !hasRight) return
    if (!hasLeft || !hasRight) {
        if (hasLeft) drawHorizontalBarChart(pdf, theme, state, leftChart.title, leftChart.items, leftChart.options)
        if (hasRight) drawHorizontalBarChart(pdf, theme, state, rightChart.title, rightChart.items, rightChart.options)
        return
    }

    const t = PDF_THEMES[theme]
    const maxItems = Math.max(
        leftChart.options?.maxItems ?? 6,
        rightChart.options?.maxItems ?? 6,
    )
    const leftRows = leftChart.items.slice(0, maxItems)
    const rightRows = rightChart.items.slice(0, maxItems)
    const rowCount = Math.max(leftRows.length, rightRows.length)
    const rowH = 7
    const gap = 4
    const colW = (contentWidth(pdf) - gap) / 2
    const labelW = 22
    const valueW = 18
    const needed = 10 + rowCount * rowH

    ensureSpace(pdf, theme, state, needed)
    const titleY = state.y
    setFont(pdf, 'bold', 9)
    pdf.setTextColor(...t.text)
    pdf.text(sanitizePdfText(leftChart.title).toUpperCase(), MARGIN_X, titleY)
    pdf.text(sanitizePdfText(rightChart.title).toUpperCase(), MARGIN_X + colW + gap, titleY)
    pdf.setDrawColor(...t.borderSoft)
    pdf.setLineWidth(0.2)
    pdf.line(MARGIN_X, titleY + 1.5, MARGIN_X + colW, titleY + 1.5)
    pdf.line(MARGIN_X + colW + gap, titleY + 1.5, pageWidth(pdf) - MARGIN_X, titleY + 1.5)
    state.y = titleY + 6.5

    const drawMiniBars = (items, originX, barColorDefault) => {
        const chartLeft = originX + labelW
        const chartRight = originX + colW - valueW
        const barW = chartRight - chartLeft
        const maxVal = Math.max(...items.map(r => Number(r.value) || 0), 1)
        const barH = 3

        items.forEach((item, i) => {
            const y = state.y + i * rowH
            const val = Number(item.value) || 0
            const barColor = parseChartColor(item.color, barColorDefault || CHART_PALETTE[i % CHART_PALETTE.length])

            setFont(pdf, 'normal', 6.5)
            pdf.setTextColor(...t.textSecondary)
            pdf.text(fitText(pdf, sanitizePdfText(item.label), labelW - 1.5), originX, y + 3.5)

            pdf.setFillColor(...t.borderSoft)
            pdf.roundedRect(chartLeft, y + 1.2, barW, barH, 1, 1, 'F')
            if (val > 0) {
                pdf.setFillColor(...barColor)
                pdf.roundedRect(chartLeft, y + 1.2, Math.max((val / maxVal) * barW, 1.5), barH, 1, 1, 'F')
            }

            setFont(pdf, 'normal', 6)
            pdf.setTextColor(...t.text)
            pdf.text(
                formatChartAmount(val, leftChart.options?.currencyCode || rightChart.options?.currencyCode),
                originX + colW,
                y + 3.5,
                { align: 'right' },
            )
        })
    }

    drawMiniBars(leftRows, MARGIN_X, leftChart.options?.barColor || t.red)
    drawMiniBars(rightRows, MARGIN_X + colW + gap, rightChart.options?.barColor || t.emerald)
    state.y += rowCount * rowH + 4
}

function drawQuickStats(pdf, theme, state, items) {
    const t = PDF_THEMES[theme]
    ensureSpace(pdf, theme, state, 10 + Math.ceil(items.length / 2) * 7)
    state.y = sectionTitle(pdf, theme, state.y, 'Quick Stats')

    const startY = state.y
    const panelH = Math.ceil(items.length / 2) * 8 + 4
    pdf.setFillColor(...t.quickPanel)
    pdf.roundedRect(MARGIN_X, startY - 1, contentWidth(pdf), panelH, 2, 2, 'F')

    autoTable(pdf, {
        theme: 'plain',
        tableWidth: contentWidth(pdf) - 8,
        margin: { left: MARGIN_X + 4, right: MARGIN_X + 4 },
        startY: startY + 2,
        body: items.map(item => [sanitizePdfText(item.label), sanitizePdfText(String(item.value))]),
        columnStyles: {
            0: { cellWidth: (contentWidth(pdf) - 8) * 0.5, halign: 'left', valign: 'top' },
            1: { cellWidth: (contentWidth(pdf) - 8) * 0.5, halign: 'right', valign: 'top', font: fontFamily(pdf), fontStyle: 'normal' },
        },
        styles: {
            ...baseTableStyles(pdf, theme),
            fontSize: 8,
            lineWidth: 0,
            cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        },
        didParseCell: (data) => {
            data.cell.styles.valign = 'top'
            if (data.section === 'body' && data.column.index === 0) {
                applyTextCellStyle(data, theme, pdf, { color: t.muted })
                data.cell.styles.halign = 'left'
            }
            if (data.section === 'body' && data.column.index === 1) {
                const item = items[data.row.index]
                const tone = item?.tone
                const valColor = tone === 'emerald' ? t.emerald : tone === 'red' ? t.red : tone === 'amber' ? t.amber : t.text
                applyPlainNumericStyle(data, theme, pdf, { color: valColor })
            }
        },
    })

    state.y = (pdf.lastAutoTable?.finalY ?? startY) + 6
}

export async function generateBudgetSummaryPdf(report) {
    const theme = report.theme === 'dark' ? 'dark' : 'light'
    const fonts = await loadPoppinsFonts()

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    registerFonts(pdf, fonts)

    const meta = {
        monthLabel: report.monthLabel,
        year: report.year,
        currency: report.currency,
        generatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    }

    fillPageBackground(pdf, theme)

    const state = { y: BODY_TOP }

    const chartCurrency = report.currency || 'PHP'

    drawStatCards(pdf, theme, state, report.overviewCards)
    drawQuickStats(pdf, theme, state, report.quickStats)

    if (report.expenseChart?.length || report.incomeChart?.length) {
        drawChartPairRow(pdf, theme, state, {
            title: 'Expense Distribution',
            items: report.expenseChart || [],
            options: { maxItems: 6, barColor: PDF_THEMES[theme].red, currencyCode: chartCurrency },
        }, {
            title: 'Income Sources',
            items: report.incomeChart || [],
            options: { maxItems: 6, barColor: PDF_THEMES[theme].emerald, currencyCode: chartCurrency },
        })
    }

    if (report.paymentChart?.length) {
        drawHorizontalBarChart(pdf, theme, state, 'Payment Methods', report.paymentChart, {
            maxItems: 8,
            currencyCode: chartCurrency,
        })
    }

    if (report.dailySpendingChart?.some(d => d.value > 0)) {
        const days = report.dailySpendingChart.length
        drawVerticalBarChart(pdf, theme, state, 'Daily Spending', report.dailySpendingChart.map(d => ({
            label: d.label,
            value: d.value,
        })), {
            height: 38,
            barColor: PDF_THEMES[theme].primary,
            currencyCode: chartCurrency,
            labelInterval: days > 20 ? Math.ceil(days / 10) : days > 12 ? 2 : 1,
        })
    }

    if (report.expenseRows?.length) {
        drawKeyValueList(pdf, theme, state, 'Expense Breakdown', report.expenseRows, {
            totalLabel: 'Total Expenses',
            totalValue: report.totalExpenses,
            tone: 'red',
        })
    }

    if (report.incomeRows?.length) {
        drawKeyValueList(pdf, theme, state, 'Income Sources', report.incomeRows, {
            totalLabel: 'Total Income',
            totalValue: report.totalIncome,
            tone: 'emerald',
        })
    }

    if (report.budgetChart?.length) {
        drawGroupedHorizontalBarChart(pdf, theme, state, 'Budget vs Spending', report.budgetChart, {
            maxItems: 8,
        })
    }

    if (report.budgetTable?.rows?.length) {
        ensureSpace(pdf, theme, state, 14)
        state.y = sectionTitle(pdf, theme, state.y, 'Budget vs Actual')
        runAutoTable(pdf, theme, state, {
            tableKey: 'budget',
            layout: TABLE_LAYOUTS.budget,
            head: [['Category', 'Budget', 'Spent', 'Remaining', 'Status']],
            body: report.budgetTable.rows.map(r => r.map(c => (typeof c === 'string' ? sanitizePdfText(c) : c))),
            foot: report.budgetTable.foot ? [report.budgetTable.foot.map(c => sanitizePdfText(c))] : undefined,
            rowMeta: report.budgetTable.rowMeta || [],
        })
    }

    if (report.paymentRows?.length) {
        ensureSpace(pdf, theme, state, 14)
        state.y = sectionTitle(pdf, theme, state.y, 'Payment Methods')
        runAutoTable(pdf, theme, state, {
            layout: TABLE_LAYOUTS.payment,
            head: [['Method', 'Amount', 'Share']],
            body: report.paymentRows.map(r => r.map(c => (typeof c === 'string' ? sanitizePdfText(c) : c))),
        })
    }

    if (report.ytdCards?.length) {
        drawStatCards(pdf, theme, state, report.ytdCards, { title: `Year-to-Date (${report.year})` })
    }

    if (report.ytdMonthlyChart?.length) {
        const t = PDF_THEMES[theme]
        drawVerticalBarChart(pdf, theme, state, 'Monthly Trend (YTD)', report.ytdMonthlyChart.map(m => ({
            label: m.label,
            bars: [
                { value: m.income, color: t.emerald },
                { value: m.expense, color: t.red },
            ],
        })), {
            height: 42,
            grouped: true,
            currencyCode: chartCurrency,
            legend: [
                { label: 'Income', color: t.emerald },
                { label: 'Expenses', color: t.red },
            ],
        })
    }

    if (report.ytdMonthlyRows?.length) {
        ensureSpace(pdf, theme, state, 14)
        state.y = sectionTitle(pdf, theme, state.y, 'Monthly Breakdown (YTD)')
        runAutoTable(pdf, theme, state, {
            tableKey: 'ytd',
            layout: TABLE_LAYOUTS.ytd,
            head: [['Month', 'Income', 'Expenses', 'Net', 'Txns']],
            body: report.ytdMonthlyRows,
            foot: report.ytdMonthlyFoot ? [report.ytdMonthlyFoot] : undefined,
        })
    }

    if (report.debtRows?.length) {
        drawDebtTable(pdf, theme, state, report.debtRows)
    }

    if (report.ytdTopCategories?.length) {
        drawKeyValueList(pdf, theme, state, 'Top Spending Categories (YTD)', report.ytdTopCategories)
    }

    if (report.transactionRows?.length) {
        ensureSpace(pdf, theme, state, 14)
        state.y = sectionTitle(pdf, theme, state.y, 'Daily Transactions')
        runAutoTable(pdf, theme, state, {
            tableKey: 'transactions',
            layout: TABLE_LAYOUTS.transactions,
            head: [['Date', 'Description', 'Category', 'Method', 'Amount']],
            body: report.transactionRows,
            foot: report.transactionFoot || undefined,
            rowMeta: report.transactionRowMeta || [],
        })
    }

    stampAllPages(pdf, theme, meta)
    pdf.save(report.filename)
}
