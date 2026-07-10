import { computed, ref, type ComputedRef, type Ref } from "vue"
import type { LocalPerson, LocalPersonKey, SelectedLocalPersonKey } from "@/types/local-person"

const LOCAL_PERSON_STORAGE_KEY = "heart-reaction-local-person-v1"

const LOCAL_PERSON_OPTIONS: LocalPerson[] = [
  { key: "owner", label: "我" },
  { key: "partner", label: "对方" }
]

const isValidLocalPersonKey = (value: unknown): value is LocalPersonKey =>
  value === "owner" || value === "partner"

const readStoredKey = (): SelectedLocalPersonKey => {
  try {
    const raw = uni.getStorageSync(LOCAL_PERSON_STORAGE_KEY) as unknown
    if (isValidLocalPersonKey(raw)) {
      return raw
    }
  } catch {
    // Local preference persistence is best-effort only.
  }

  return ""
}

const writeStoredKey = (key: SelectedLocalPersonKey) => {
  try {
    if (!key) {
      uni.removeStorageSync(LOCAL_PERSON_STORAGE_KEY)
      return
    }

    uni.setStorageSync(LOCAL_PERSON_STORAGE_KEY, key)
  } catch {
    // Local preference persistence is best-effort only.
  }
}

export interface UseLocalPersonResult {
  options: LocalPerson[]
  selectedKey: Ref<SelectedLocalPersonKey>
  selectedPerson: ComputedRef<LocalPerson | null>
  hasSelectedPerson: ComputedRef<boolean>
  selectPerson: (key: LocalPersonKey) => void
  clearSelectedPerson: () => void
  isValidLocalPersonKey: (value: unknown) => value is LocalPersonKey
}

export const useLocalPerson = (): UseLocalPersonResult => {
  const selectedKey = ref<SelectedLocalPersonKey>(readStoredKey())

  const selectedPerson = computed<LocalPerson | null>(() => {
    if (!selectedKey.value) {
      return null
    }

    return LOCAL_PERSON_OPTIONS.find((option) => option.key === selectedKey.value) ?? null
  })

  const hasSelectedPerson = computed<boolean>(() => selectedKey.value !== "")

  const selectPerson = (key: LocalPersonKey) => {
    if (!isValidLocalPersonKey(key)) {
      return
    }

    selectedKey.value = key
    writeStoredKey(key)
  }

  const clearSelectedPerson = () => {
    selectedKey.value = ""
    writeStoredKey("")
  }

  return {
    options: LOCAL_PERSON_OPTIONS,
    selectedKey,
    selectedPerson,
    hasSelectedPerson,
    selectPerson,
    clearSelectedPerson,
    isValidLocalPersonKey
  }
}
