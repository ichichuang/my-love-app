import { getTemporaryFileURLs, type CloudFile } from "@/services/cloudbase"
import { getEntry, type EntryRecord } from "@/services/repositories/entries"

interface RuntimeImageUrl {
  resolvedAt: number
  url: string
}

interface ResolveOptions {
  force?: boolean
}

const RESOLVED_IMAGE_URL_TTL_MS = 50 * 60 * 1000
const TEMP_FILE_URL_BATCH_SIZE = 20
const runtimeImageUrls = new Map<string, RuntimeImageUrl>()

const uniqueFileIDs = (fileIDs: string[]): string[] => Array.from(new Set(fileIDs.filter(Boolean)))

const chunkFileIDs = (fileIDs: string[]): string[][] => {
  const chunks: string[][] = []
  for (let index = 0; index < fileIDs.length; index += TEMP_FILE_URL_BATCH_SIZE) {
    chunks.push(fileIDs.slice(index, index + TEMP_FILE_URL_BATCH_SIZE))
  }

  return chunks
}

const readCachedImageUrl = (fileID: string, now: number): string | null => {
  const cachedUrl = runtimeImageUrls.get(fileID)
  if (!cachedUrl) {
    return null
  }

  if (now - cachedUrl.resolvedAt >= RESOLVED_IMAGE_URL_TTL_MS) {
    runtimeImageUrls.delete(fileID)
    return null
  }

  return cachedUrl.url
}

export const getTempFileURLByFileIds = async (
  fileIDs: string[],
  options: ResolveOptions = {}
): Promise<Map<string, string>> => {
  const ids = uniqueFileIDs(fileIDs)
  const resolvedUrls = new Map<string, string>()
  const now = Date.now()
  const idsToResolve: string[] = []

  ids.forEach((fileID) => {
    const cachedUrl = options.force ? null : readCachedImageUrl(fileID, now)
    if (cachedUrl) {
      resolvedUrls.set(fileID, cachedUrl)
      return
    }

    idsToResolve.push(fileID)
  })

  if (idsToResolve.length === 0) {
    return resolvedUrls
  }

  let firstResolveError: unknown = null
  let freshResolvedCount = 0
  for (const batchFileIDs of chunkFileIDs(idsToResolve)) {
    try {
      const freshUrls = await getTemporaryFileURLs(batchFileIDs)
      const resolvedAt = Date.now()
      freshUrls.forEach((url, fileID) => {
        runtimeImageUrls.set(fileID, {
          resolvedAt,
          url
        })
        resolvedUrls.set(fileID, url)
        freshResolvedCount += 1
      })
    } catch (error) {
      firstResolveError ??= error
    }
  }

  if (firstResolveError && freshResolvedCount === 0) {
    throw firstResolveError
  }

  return resolvedUrls
}

export const setResolvedTempURLForFile = (
  files: CloudFile[],
  fileID: string,
  resolvedTempURL: string
): CloudFile[] => {
  let changed = false
  const nextFiles = files.map((file) => {
    if (file.fileID !== fileID || file.resolvedTempURL === resolvedTempURL) {
      return file
    }

    changed = true
    return {
      ...file,
      resolvedTempURL
    }
  })

  return changed ? nextFiles : files
}

export const removeResolvedTempURLFromFiles = (files: CloudFile[], fileID: string): CloudFile[] => {
  let changed = false
  const nextFiles = files.map((file) => {
    if (file.fileID !== fileID || typeof file.resolvedTempURL !== "string") {
      return file
    }

    const fileWithoutResolvedUrl = { ...file }
    delete fileWithoutResolvedUrl.resolvedTempURL
    changed = true
    return fileWithoutResolvedUrl
  })

  return changed ? nextFiles : files
}

export const applyResolvedTempURLsToFiles = (files: CloudFile[], urls: Map<string, string>): CloudFile[] => {
  let changed = false
  const nextFiles = files.map((file) => {
    const resolvedTempURL = urls.get(file.fileID)
    if (!resolvedTempURL || file.resolvedTempURL === resolvedTempURL) {
      return file
    }

    changed = true
    return {
      ...file,
      resolvedTempURL
    }
  })

  return changed ? nextFiles : files
}

const applyResolvedTempURLsToEntries = (entries: EntryRecord[], urls: Map<string, string>): EntryRecord[] => {
  let changed = false
  const nextEntries = entries.map((entry) => {
    const nextFiles = applyResolvedTempURLsToFiles(entry.files, urls)
    if (nextFiles === entry.files) {
      return entry
    }

    changed = true
    return {
      ...entry,
      files: nextFiles
    }
  })

  return changed ? nextEntries : entries
}

export const mergeResolvedTempURLsForFiles = (currentFiles: CloudFile[], freshFiles: CloudFile[]): CloudFile[] => {
  const freshByFileID = new Map(freshFiles.map((file) => [file.fileID, file]))
  let changed = false
  const nextFiles = currentFiles.map((file) => {
    const freshFile = freshByFileID.get(file.fileID)
    if (!freshFile?.resolvedTempURL || file.resolvedTempURL === freshFile.resolvedTempURL) {
      return file
    }

    changed = true
    return {
      ...file,
      resolvedTempURL: freshFile.resolvedTempURL
    }
  })

  return changed ? nextFiles : currentFiles
}

export const mergeResolvedTempURLsForEntry = (current: EntryRecord, fresh: EntryRecord): EntryRecord => {
  const nextFiles = mergeResolvedTempURLsForFiles(current.files, fresh.files)
  return nextFiles === current.files
    ? current
    : {
        ...current,
        files: nextFiles
      }
}

export const batchResolveFiles = async (
  files: CloudFile[],
  options: ResolveOptions = {}
): Promise<CloudFile[]> => {
  const urls = await getTempFileURLByFileIds(
    files.map((file) => file.fileID),
    options
  )
  return applyResolvedTempURLsToFiles(files, urls)
}

export const batchResolveEntryCovers = async (entries: EntryRecord[]): Promise<EntryRecord[]> => {
  const urls = await getTempFileURLByFileIds(
    entries.map((entry) => entry.files[0]?.fileID ?? "")
  )

  return applyResolvedTempURLsToEntries(entries, urls)
}

export const batchResolveEntries = async (entries: EntryRecord[]): Promise<EntryRecord[]> => {
  const urls = await getTempFileURLByFileIds(
    entries.flatMap((entry) => entry.files.map((file) => file.fileID))
  )

  return applyResolvedTempURLsToEntries(entries, urls)
}

export const refreshImageUrlsForEntry = async (entryId: string): Promise<EntryRecord> => {
  const entry = await getEntry(entryId)
  const [resolvedEntry] = await batchResolveEntries([entry])
  return resolvedEntry
}
