export type HeartReactionType = "heart"

export interface HeartReactor {
  key: string
  label: string
}

export interface HeartReactionRecord {
  id: string
  coupleId: string
  targetCollection: string
  targetKind: string
  targetId: string
  reactionType: HeartReactionType
  reactorKey: string
  reactorLabel: string
  createdAt: number
  updatedAt: number
}

export interface StoredHeartReactionDocument {
  _id?: string
  coupleId: string
  targetCollection: string
  targetKind: string
  targetId: string
  reactionType: HeartReactionType
  reactorKey: string
  reactorLabel: string
  createdAt: number
  updatedAt: number
}

export interface HeartReactionState {
  targetId: string
  hasReacted: boolean
  hasReceived?: boolean
  reactorLabel?: string
  reactedAt?: number
}
