require('dotenv').config()
const { google } = require('googleapis')

const SHEET_ID = process.env.GOOGLE_SHEET_ID

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheetsClient() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

/**
 * Read all rows from a tab. Returns array of objects keyed by header row.
 */
async function getRows(tabName) {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tabName,
  })
  const [headers, ...rows] = res.data.values || []
  if (!headers) return []
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
  )
}

/**
 * Append a single row to a tab. rowData is an object keyed by column name.
 * Column order is determined by the header row already in the sheet.
 */
async function appendRow(tabName, rowData) {
  const sheets = await getSheetsClient()
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!1:1`,
  })
  const headers = (headerRes.data.values || [[]])[0]
  const row = headers.map((h) => rowData[h] ?? '')
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tabName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

/**
 * Overwrite an entire tab starting from row 1 (headers included).
 */
async function writeSheet(tabName, headers, rows) {
  const sheets = await getSheetsClient()
  const values = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))]
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
}

/**
 * Ensure a tab with the given name exists; create it if not.
 */
async function ensureTab(tabName) {
  const sheets = await getSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const exists = meta.data.sheets.some(
    (s) => s.properties.title === tabName
  )
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    })
  }
}

module.exports = { getRows, appendRow, writeSheet, ensureTab }
