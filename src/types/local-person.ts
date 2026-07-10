export type LocalPersonKey = "owner" | "partner"

export interface LocalPerson {
  key: LocalPersonKey
  label: string
}

export type SelectedLocalPersonKey = LocalPersonKey | ""
