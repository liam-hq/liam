import fs from 'node:fs'
import { URL } from 'node:url'

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isGitHubFileUrl(url: string): boolean {
  const parsedUrl = new URL(url)
  return parsedUrl.hostname === 'github.com' && url.includes('/blob/')
}

function readLocalFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error('Invalid input path. Please provide a valid file.')
  }
  return fs.readFileSync(filePath, 'utf8')
}

async function downloadGitHubRawContent(githubUrl: string): Promise<string> {
  const rawFileUrl = githubUrl
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/blob', '')
  return await downloadFile(rawFileUrl)
}

async function downloadFile(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  const data = await response.text()
  return data
}

export async function getInputContent(inputPath: string): Promise<string> {
  if (!isValidUrl(inputPath)) {
    return readLocalFile(inputPath)
  }

  return isGitHubFileUrl(inputPath)
    ? await downloadGitHubRawContent(inputPath)
    : await downloadFile(inputPath)
}
