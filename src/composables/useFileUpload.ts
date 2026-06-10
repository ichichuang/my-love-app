import { shallowRef } from "vue"
import { appConfig } from "@/config/app"
import {
  deleteCloudFiles,
  getFriendlyErrorMessage,
  uploadFileToCloud,
  type CloudFile
} from "@/services/cloudbase"

interface LocalImageFile {
  path: string
  size?: number
  name: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

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
      fail: () => {
        reject(new Error("Image selection cancelled or failed"))
      }
    })
  })
}

export const useFileUpload = (initialFiles: CloudFile[] = []) => {
  const files = shallowRef<CloudFile[]>(initialFiles)
  const uploading = shallowRef(false)
  const errorMessage = shallowRef("")

  const setFiles = (nextFiles: CloudFile[]) => {
    files.value = nextFiles
  }

  const chooseAndUploadImages = async () => {
    const remaining = appConfig.maxUploadCount - files.value.length
    if (remaining <= 0) {
      errorMessage.value = `最多可以上传 ${appConfig.maxUploadCount} 张图片。`
      return
    }

    uploading.value = true
    errorMessage.value = ""

    try {
      const pickedFiles = await chooseImages(remaining)
      const maxBytes = appConfig.maxUploadSizeMb * 1024 * 1024
      const acceptedFiles = pickedFiles.filter((file) => typeof file.size !== "number" || file.size <= maxBytes)

      if (acceptedFiles.length !== pickedFiles.length) {
        uni.showToast({
          title: `单张图片需小于 ${appConfig.maxUploadSizeMb}MB`,
          icon: "none"
        })
      }

      const uploadedFiles: CloudFile[] = []
      for (const file of acceptedFiles) {
        const uploaded = await uploadFileToCloud({
          filePath: file.path,
          name: file.name,
          type: "image",
          size: file.size
        })
        uploadedFiles.push(uploaded)
      }

      files.value = [...files.value, ...uploadedFiles]
    } catch (error) {
      errorMessage.value = getFriendlyErrorMessage(error)
      if (errorMessage.value) {
        uni.showToast({
          title: errorMessage.value,
          icon: "none"
        })
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
    } catch (error) {
      errorMessage.value = getFriendlyErrorMessage(error)
      uni.showToast({
        title: errorMessage.value,
        icon: "none"
      })
    }
  }

  return {
    files,
    uploading,
    errorMessage,
    setFiles,
    chooseAndUploadImages,
    removeFileAt
  }
}
