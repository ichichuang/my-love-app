import { appConfig, isCloudConfigured } from "@/config/app"

export type CloudFileKind = "image" | "file"

export interface CloudFile {
  fileID: string
  cloudPath: string
  name: string
  type: CloudFileKind
  size?: number
  tempFileURL?: string
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

  return "操作没有完成，请稍后再试。"
}

const getNativeCloud = (): WxCloudNative.Api => {
  const cloud = (globalThis as WxHost).wx?.cloud
  if (!cloud) {
    throw new CloudBaseUserError("请在微信开发者工具或真机中打开云开发能力后再试。")
  }

  return cloud
}

export const initCloudBase = (): CloudInitState => {
  try {
    if (initState.initialized) {
      return initState
    }

    if (!isCloudConfigured()) {
      initState.message = "云开发环境未配置，请检查 .env 中的 VITE_CLOUDBASE_ENV_ID。"
      if (import.meta.env.DEV) {
        console.info("[珊瑚行动] 云开发环境配置状态：未配置")
      }
      return initState
    }

    const cloud = getNativeCloud()
    if (import.meta.env.DEV) {
      console.info("[珊瑚行动] 云开发环境配置状态：已配置")
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
    initState.message = friendlyError("云开发初始化失败，请检查微信开发者工具云开发配置。", error).message
    return initState
  }
}

const ensureCloudBaseReady = (): WxCloudNative.Api => {
  const state = initCloudBase()
  if (!state.initialized) {
    throw new CloudBaseUserError(state.message || "云开发尚未初始化。")
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
    throw friendlyError("读取纪念列表失败，请稍后再试。", error)
  }
}

export const getDocument = async <T extends object>(collectionName: string, id: string): Promise<T> => {
  try {
    const result = await database().collection<T>(collectionName).doc(id).get()
    return result.data
  } catch (error) {
    throw friendlyError("读取纪念详情失败，请稍后再试。", error)
  }
}

export const addDocument = async <T extends object>(collectionName: string, data: T): Promise<string> => {
  try {
    const result = await database().collection<T>(collectionName).add({
      data
    })
    return result._id
  } catch (error) {
    throw friendlyError("保存纪念失败，请稍后再试。", error)
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
    throw friendlyError("更新纪念失败，请稍后再试。", error)
  }
}

export const removeDocument = async (collectionName: string, id: string): Promise<void> => {
  try {
    await database().collection(collectionName).doc(id).remove()
  } catch (error) {
    throw friendlyError("删除纪念失败，请稍后再试。", error)
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
    const tempUrls = await getTemporaryFileURLs([result.fileID])

    return {
      fileID: result.fileID,
      cloudPath,
      name: input.name,
      type: input.type,
      size: input.size,
      tempFileURL: tempUrls.get(result.fileID),
      uploadedAt: Date.now()
    }
  } catch (error) {
    throw friendlyError("上传文件失败，请检查网络后再试。", error)
  }
}

export const deleteCloudFiles = async (fileIDs: string[]): Promise<void> => {
  try {
    const uniqueFileIDs = Array.from(new Set(fileIDs.filter(Boolean)))
    if (uniqueFileIDs.length === 0) {
      return
    }

    await ensureCloudBaseReady().deleteFile({
      fileList: uniqueFileIDs
    })
  } catch (error) {
    throw friendlyError("删除云端文件失败，请稍后再试。", error)
  }
}
