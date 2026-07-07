import { appConfig, isCloudConfigured } from "@/config/app"

export type CloudFileKind = "image" | "file"

export interface CloudFile {
  fileID: string
  cloudPath: string
  name: string
  type: CloudFileKind
  size?: number
  resolvedTempURL?: string
  uploadedAt: number
}

export interface UploadCloudFileInput {
  filePath: string
  name: string
  type: CloudFileKind
  size?: number
}

export interface QueryOptions {
  where?: Record<string, unknown>
  orderBy?: {
    field: string
    direction: WxCloudNative.SortDirection
  }
  limit?: number
  skip?: number
}

export interface CloudFileDeleteFailure {
  fileID: string
  status?: number
  errMsg: string
}

export interface CloudFileDeleteResult {
  requestedFileIDs: string[]
  deletedFileIDs: string[]
  failures: CloudFileDeleteFailure[]
}

export interface CloudFunctionCallInput<TData extends object> {
  name: string
  data?: TData
}

interface CloudInitState {
  initialized: boolean
  message: string
}

type WxHost = typeof globalThis & {
  wx?: {
    cloud?: WxCloudNative.Api
  }
}

const initState: CloudInitState = {
  initialized: false,
  message: ""
}

export class CloudBaseUserError extends Error {
  readonly causeDetail: string

  constructor(message: string, causeDetail = "") {
    super(message)
    this.name = "CloudBaseUserError"
    this.causeDetail = causeDetail
  }
}

const extractMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return ""
}

const friendlyError = (message: string, error: unknown): CloudBaseUserError => {
  if (error instanceof CloudBaseUserError) {
    return error
  }

  return new CloudBaseUserError(message, extractMessage(error))
}

export const getFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof CloudBaseUserError) {
    return error.message
  }

  return "暂时没处理好，请稍后再试。"
}

const getNativeCloud = (): WxCloudNative.Api => {
  const cloud = (globalThis as WxHost).wx?.cloud
  if (!cloud) {
    throw new CloudBaseUserError(
      "云端小仓库暂时打不开，请稍后再试。",
      "wx.cloud is unavailable; open in WeChat DevTools or a device with CloudBase enabled."
    )
  }

  return cloud
}

export const initCloudBase = (): CloudInitState => {
  try {
    if (initState.initialized) {
      return initState
    }

    if (!isCloudConfigured()) {
      initState.message = "云端小仓库暂时还没配置好。"
      if (import.meta.env.DEV) {
        console.info("[小珊的树洞] 云开发环境配置状态：未配置，请检查 VITE_CLOUDBASE_ENV_ID")
      }
      return initState
    }

    const cloud = getNativeCloud()
    if (import.meta.env.DEV) {
      console.info("[小珊的树洞] 云开发环境配置状态：已配置")
    }
    cloud.init({
      env: appConfig.cloudbaseEnvId,
      traceUser: true
    })

    initState.initialized = true
    initState.message = "云开发已初始化。"
    return initState
  } catch (error) {
    initState.initialized = false
    if (import.meta.env.DEV) {
      console.info("[小珊的树洞] 云开发初始化失败", error)
    }
    initState.message = friendlyError("云端小仓库暂时打不开，请稍后再试。", error).message
    return initState
  }
}

const ensureCloudBaseReady = (): WxCloudNative.Api => {
  const state = initCloudBase()
  if (!state.initialized) {
    throw new CloudBaseUserError(
      state.message || "云端小仓库暂时打不开，请稍后再试。",
      "CloudBase init state is not initialized."
    )
  }

  return getNativeCloud()
}

const database = (): WxCloudNative.Database => {
  return ensureCloudBaseReady().database({
    env: appConfig.cloudbaseEnvId
  })
}

export const listDocuments = async <T extends object>(collectionName: string, options: QueryOptions = {}): Promise<T[]> => {
  try {
    const collection = database().collection<T>(collectionName)
    let query: WxCloudNative.QueryRef<T> = collection

    if (options.where) {
      query = query.where(options.where)
    }

    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction)
    }

    if (typeof options.skip === "number" && options.skip > 0) {
      query = query.skip(options.skip)
    }

    if (typeof options.limit === "number" && options.limit > 0) {
      query = query.limit(options.limit)
    }

    const result = await query.get()
    return result.data
  } catch (error) {
    throw friendlyError("读取记录列表失败，请稍后再试。", error)
  }
}

export const getDocument = async <T extends object>(collectionName: string, id: string): Promise<T> => {
  try {
    const result = await database().collection<T>(collectionName).doc(id).get()
    return result.data
  } catch (error) {
    throw friendlyError("读取记录详情失败，请稍后再试。", error)
  }
}

export const addDocument = async <T extends object>(collectionName: string, data: T): Promise<string> => {
  try {
    const result = await database().collection<T>(collectionName).add({
      data
    })
    return result._id
  } catch (error) {
    throw friendlyError("保存记录失败，请稍后再试。", error)
  }
}

export const updateDocument = async <T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  try {
    await database().collection<T>(collectionName).doc(id).update({
      data
    })
  } catch (error) {
    throw friendlyError("更新记录失败，请稍后再试。", error)
  }
}

export const removeDocument = async (collectionName: string, id: string): Promise<void> => {
  try {
    await database().collection(collectionName).doc(id).remove()
  } catch (error) {
    throw friendlyError("删除记录失败，请稍后再试。", error)
  }
}

export const callCloudFunction = async <TData extends object, TResult>(
  input: CloudFunctionCallInput<TData>
): Promise<TResult> => {
  try {
    const result = await ensureCloudBaseReady().callFunction<TData, TResult>({
      name: input.name,
      data: input.data
    })

    return result.result
  } catch (error) {
    throw friendlyError("访问校验暂时不可用，请稍后再试。", error)
  }
}

const fileExtension = (name: string): string => {
  const segments = name.split(".")
  const extension = segments.length > 1 ? segments[segments.length - 1] : ""
  return extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg"
}

const safeFileName = (name: string): string => {
  const rawName = name.split(/[\\/]/).filter(Boolean).pop() ?? "memory"
  const normalized = rawName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .slice(0, 96)

  const baseName = normalized || "memory"
  if (/\.[a-zA-Z0-9]{1,12}$/.test(baseName)) {
    return baseName
  }

  return `${baseName}.${fileExtension(name)}`
}

const makeCloudPath = (input: UploadCloudFileInput): string => {
  return `${appConfig.storageEntriesPath}/${Date.now()}-${safeFileName(input.name)}`
}

const normalizeCloudFileIDs = (fileIDs: readonly string[]): string[] =>
  Array.from(new Set(fileIDs.map((fileID) => fileID.trim()).filter(Boolean)))

export const getTemporaryFileURLs = async (fileIDs: string[]): Promise<Map<string, string>> => {
  try {
    const uniqueFileIDs = Array.from(new Set(fileIDs.filter(Boolean)))
    if (uniqueFileIDs.length === 0) {
      return new Map()
    }

    const result = await ensureCloudBaseReady().getTempFileURL({
      fileList: uniqueFileIDs
    })

    return new Map(
      result.fileList
        .filter((file) => file.status === 0 || typeof file.status === "undefined")
        .map((file) => [file.fileID, file.tempFileURL])
    )
  } catch (error) {
    throw friendlyError("获取私密图片链接失败，请稍后再试。", error)
  }
}

export const uploadFileToCloud = async (input: UploadCloudFileInput): Promise<CloudFile> => {
  try {
    const cloudPath = makeCloudPath(input)
    const result = await ensureCloudBaseReady().uploadFile({
      cloudPath,
      filePath: input.filePath
    })

    return {
      fileID: result.fileID,
      cloudPath,
      name: input.name,
      type: input.type,
      size: input.size,
      uploadedAt: Date.now()
    }
  } catch (error) {
    throw friendlyError("上传文件失败，请检查网络后再试。", error)
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const readDeleteFileItem = (value: unknown): Partial<WxCloudNative.DeleteFileItem> => {
  if (!isRecord(value)) {
    return {}
  }

  return {
    fileID: typeof value.fileID === "string" ? value.fileID : undefined,
    status: typeof value.status === "number" ? value.status : undefined,
    errMsg: typeof value.errMsg === "string" ? value.errMsg : undefined
  }
}

const buildDeleteFileFailures = (fileIDs: string[], errMsg: string): CloudFileDeleteFailure[] =>
  fileIDs.map((fileID) => ({
    fileID,
    errMsg
  }))

const formatDeleteFailureCause = (failures: CloudFileDeleteFailure[]): string =>
  failures
    .map((failure) => {
      const status = typeof failure.status === "number" ? failure.status : "missing"
      return `${failure.fileID} status=${status} errMsg=${failure.errMsg}`
    })
    .join("; ")

export const deleteCloudFilesWithResult = async (fileIDs: string[]): Promise<CloudFileDeleteResult> => {
  const requestedFileIDs = normalizeCloudFileIDs(fileIDs)
  const emptyResult: CloudFileDeleteResult = {
    requestedFileIDs,
    deletedFileIDs: [],
    failures: []
  }

  if (requestedFileIDs.length === 0) {
    return emptyResult
  }

  try {
    const result = await ensureCloudBaseReady().deleteFile({
      fileList: requestedFileIDs
    })
    const rawFileList = (result as { fileList?: unknown }).fileList

    if (!Array.isArray(rawFileList)) {
      return {
        requestedFileIDs,
        deletedFileIDs: [],
        failures: buildDeleteFileFailures(requestedFileIDs, "deleteFile result.fileList is not an array")
      }
    }

    const requestedSet = new Set(requestedFileIDs)
    const returnedItems = new Map<string, Partial<WxCloudNative.DeleteFileItem>>()

    rawFileList.forEach((rawItem) => {
      const item = readDeleteFileItem(rawItem)
      if (!item.fileID || !requestedSet.has(item.fileID) || returnedItems.has(item.fileID)) {
        return
      }

      returnedItems.set(item.fileID, item)
    })

    const deletedFileIDs: string[] = []
    const failures: CloudFileDeleteFailure[] = []

    requestedFileIDs.forEach((fileID) => {
      const item = returnedItems.get(fileID)
      if (!item) {
        failures.push({
          fileID,
          errMsg: "deleteFile result.fileList missing requested fileID"
        })
        return
      }

      if (item.status === 0 || typeof item.status === "undefined") {
        deletedFileIDs.push(fileID)
        return
      }

      failures.push({
        fileID,
        status: item.status,
        errMsg: item.errMsg || "deleteFile returned non-zero status"
      })
    })

    return {
      requestedFileIDs,
      deletedFileIDs,
      failures
    }
  } catch (error) {
    throw friendlyError("删除云端文件失败，请稍后再试。", error)
  }
}

export const deleteCloudFiles = async (fileIDs: string[]): Promise<void> => {
  const result = await deleteCloudFilesWithResult(fileIDs)
  if (result.failures.length > 0) {
    throw new CloudBaseUserError("删除云端文件失败，请稍后再试。", formatDeleteFailureCause(result.failures))
  }
}
