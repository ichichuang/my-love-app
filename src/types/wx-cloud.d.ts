export {}

declare global {
  namespace WxCloudNative {
    type SortDirection = "asc" | "desc"
    type UnknownRecord = Record<string, unknown>

    interface InitOptions {
      env: string
      traceUser?: boolean
    }

    interface AddResult {
      _id: string
    }

    interface QueryResult<T extends object> {
      data: T[]
    }

    interface DocumentResult<T extends object> {
      data: T
    }

    interface WriteStats {
      updated?: number
      removed?: number
    }

    interface WriteResult {
      stats?: WriteStats
      updated?: number
      removed?: number
    }

    interface QueryRef<T extends object> {
      where(query: UnknownRecord): QueryRef<T>
      orderBy(field: string, direction: SortDirection): QueryRef<T>
      skip(count: number): QueryRef<T>
      limit(count: number): QueryRef<T>
      get(): Promise<QueryResult<T>>
    }

    interface DocumentRef<T extends object> {
      get(): Promise<DocumentResult<T>>
      update(options: { data: Partial<T> }): Promise<WriteResult>
      remove(): Promise<WriteResult>
    }

    interface CollectionRef<T extends object> extends QueryRef<T> {
      doc(id: string): DocumentRef<T>
      add(options: { data: T }): Promise<AddResult>
    }

    interface Database {
      collection<T extends object>(name: string): CollectionRef<T>
    }

    interface UploadFileOptions {
      cloudPath: string
      filePath: string
    }

    interface UploadFileResult {
      fileID: string
      statusCode?: number
    }

    interface TempFileURLItem {
      fileID: string
      tempFileURL: string
      maxAge?: number
      status?: number
      errMsg?: string
    }

    interface TempFileURLResult {
      fileList: TempFileURLItem[]
    }

    interface DeleteFileItem {
      fileID: string
      status?: number
      errMsg?: string
    }

    interface DeleteFileResult {
      fileList: DeleteFileItem[]
    }

    interface Api {
      init(options: InitOptions): void
      database(options?: { env?: string }): Database
      uploadFile(options: UploadFileOptions): Promise<UploadFileResult>
      getTempFileURL(options: { fileList: string[] }): Promise<TempFileURLResult>
      deleteFile(options: { fileList: string[] }): Promise<DeleteFileResult>
    }
  }
}
