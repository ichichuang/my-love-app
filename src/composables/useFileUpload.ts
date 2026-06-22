import { computed, shallowRef } from "vue"
import { appConfig } from "@/config/app"
import { showAppError, showAppWarning } from "@/composables/useAppToast"
import {
  deleteCloudFiles,
  getFriendlyErrorMessage,
  uploadFileToCloud,
  type CloudFile
} from "@/services/cloudbase"
import { queueCloudFilesForCleanup } from "@/services/cloud-file-cleanup"
import { batchResolveFiles } from "@/services/cloud-file-resolver"

interface LocalImageFile {
  path: string
  size?: number
  name: string
}

const chooseImageCancelKeywords = ["cancel", "canceled", "cancelled", "abort", "用户取消"] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const getChooseImageErrMsg = (result: unknown): string => {
  if (!isRecord(result)) {
    return ""
  }

  return typeof result.errMsg === "string" ? result.errMsg : ""
}

const isChooseImageCancel = (result: unknown): boolean => {
  const errMsg = getChooseImageErrMsg(result).trim().toLowerCase()

  return errMsg.length > 0 && chooseImageCancelKeywords.some((keyword) => errMsg.includes(keyword))
}

const normalizeCloudFileIDs = (files: readonly CloudFile[] | undefined): string[] =>
  Array.from(
    new Set(
      (files ?? [])
        .map((file) => file.fileID.trim())
        .filter((fileID) => fileID.length > 0)
    )
  )

const toLocalImageFiles = (result: UniNamespace.ChooseImageSuccessCallbackResult): LocalImageFile[] => {
  const tempFiles: unknown[] = Array.isArray(result.tempFiles) ? result.tempFiles : [result.tempFiles]
  const filesFromObjects = tempFiles
    .filter(isRecord)
    .map((file, index) => {
      const path = typeof file.path === "string" ? file.path : ""
      return {
        path,
        size: typeof file.size === "number" ? file.size : undefined,
        name: `memory-${Date.now()}-${index}.jpg`
      }
    })
    .filter((file) => file.path.length > 0)

  if (filesFromObjects.length > 0) {
    return filesFromObjects
  }

  const paths = Array.isArray(result.tempFilePaths) ? result.tempFilePaths : [result.tempFilePaths]
  return paths.map((path, index) => ({
    path,
    name: `memory-${Date.now()}-${index}.jpg`
  }))
}

const chooseImages = (count: number): Promise<LocalImageFile[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ["compressed", "original"],
      sourceType: ["album", "camera"],
      success: (result) => {
        resolve(toLocalImageFiles(result))
      },
      fail: (result: unknown) => {
        if (isChooseImageCancel(result)) {
          resolve([])
          return
        }

        reject(new Error(getChooseImageErrMsg(result) || "选择图片失败"))
      }
    })
  })
}

export const useFileUpload = (initialFiles: CloudFile[] = []) => {
  const files = shallowRef<CloudFile[]>(initialFiles)
  const uploading = shallowRef(false)
  const errorMessage = shallowRef("")
  const uncommittedUploadedFileIDs = new Set<string>()
  const maxUploadCount = appConfig.maxUploadCount
  const remainingUploadCount = computed(() => Math.max(0, maxUploadCount - files.value.length))
  const maxUploadReached = computed(() => remainingUploadCount.value === 0)

  const setFiles = (nextFiles: CloudFile[]) => {
    files.value = nextFiles
  }

  const rememberUploadedFile = (file: CloudFile): void => {
    const fileID = file.fileID.trim()
    if (fileID) {
      uncommittedUploadedFileIDs.add(fileID)
    }
  }

  const forgetUncommittedUploadedFileIDs = (fileIDs: readonly string[]): void => {
    fileIDs.forEach((fileID) => {
      uncommittedUploadedFileIDs.delete(fileID.trim())
    })
  }

  const markFilesCommitted = (committedFiles: CloudFile[] = []): void => {
    forgetUncommittedUploadedFileIDs(normalizeCloudFileIDs(committedFiles))
  }

  const queueUncommittedUploadedFilesForCleanup = (retainedFiles: CloudFile[] = []): void => {
    const retainedFileIDs = new Set(normalizeCloudFileIDs(retainedFiles))
    const fileIDsToCleanup = Array.from(
      new Set(
        [...uncommittedUploadedFileIDs]
          .map((fileID) => fileID.trim())
          .filter((fileID) => fileID.length > 0 && !retainedFileIDs.has(fileID))
      )
    )

    if (fileIDsToCleanup.length === 0) {
      return
    }

    queueCloudFilesForCleanup(fileIDsToCleanup)
    forgetUncommittedUploadedFileIDs(fileIDsToCleanup)
  }

  const isUncommittedUploadedFile = (fileID: string): boolean =>
    uncommittedUploadedFileIDs.has(fileID.trim())

  const chooseAndUploadImages = async () => {
    if (uploading.value || maxUploadReached.value) {
      return
    }

    uploading.value = true
    errorMessage.value = ""

    try {
      const pickedFiles = await chooseImages(remainingUploadCount.value)
      if (pickedFiles.length === 0) {
        return
      }

      const maxBytes = appConfig.maxUploadSizeMb * 1024 * 1024
      const acceptedFiles = pickedFiles.filter((file) => typeof file.size !== "number" || file.size <= maxBytes)

      if (acceptedFiles.length !== pickedFiles.length) {
        showAppWarning(`单张图片需小于 ${appConfig.maxUploadSizeMb}MB`)
      }

      const uploadedFiles: CloudFile[] = []
      for (const file of acceptedFiles) {
        const uploaded = await uploadFileToCloud({
          filePath: file.path,
          name: file.name,
          type: "image",
          size: file.size
        })
        rememberUploadedFile(uploaded)
        uploadedFiles.push(uploaded)
      }

      let resolvedUploadedFiles = uploadedFiles
      try {
        resolvedUploadedFiles = await batchResolveFiles(uploadedFiles, {
          force: true
        })
      } catch {
        showAppWarning("图片链接暂时没取到，稍后会再试。")
      }
      files.value = [...files.value, ...resolvedUploadedFiles]
    } catch (error) {
      errorMessage.value = getFriendlyErrorMessage(error)
      if (errorMessage.value) {
        showAppError(errorMessage.value)
      }
    } finally {
      uploading.value = false
    }
  }

  const removeFileAt = async (index: number, deleteRemote = true) => {
    const file = files.value[index]
    if (!file) {
      return
    }

    files.value = files.value.filter((_, fileIndex) => fileIndex !== index)

    if (!deleteRemote) {
      return
    }

    try {
      await deleteCloudFiles([file.fileID])
      forgetUncommittedUploadedFileIDs([file.fileID])
    } catch (error) {
      if (isUncommittedUploadedFile(file.fileID)) {
        queueUncommittedUploadedFilesForCleanup(files.value)
      }
      errorMessage.value = getFriendlyErrorMessage(error)
      showAppError(errorMessage.value)
    }
  }

  return {
    files,
    uploading,
    errorMessage,
    maxUploadCount,
    remainingUploadCount,
    maxUploadReached,
    setFiles,
    chooseAndUploadImages,
    removeFileAt,
    markFilesCommitted,
    queueUncommittedUploadedFilesForCleanup,
    isUncommittedUploadedFile
  }
}
