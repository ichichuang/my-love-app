import { shallowRef } from "vue"

export interface TimelineAnchorSnapshot {
  key: string
  label: string
  top: number
}

export const useTimelineActiveMonth = () => {
  const activeKey = shallowRef("")
  const activeLabel = shallowRef("")
  const anchors = shallowRef<TimelineAnchorSnapshot[]>([])
  let boundaryOffset = 0

  const setBoundaryOffset = (offset: number): void => {
    boundaryOffset = Math.max(0, offset)
  }

  const updateAnchors = (nextAnchors: TimelineAnchorSnapshot[]): void => {
    anchors.value = nextAnchors

    const currentActive = nextAnchors.find((anchor) => anchor.key === activeKey.value)
    if (!currentActive && nextAnchors.length > 0) {
      activeKey.value = nextAnchors[0].key
      activeLabel.value = nextAnchors[0].label
    }
  }

  const updateActiveMonth = (scrollTop: number): void => {
    const boundary = scrollTop + boundaryOffset
    const currentAnchors = anchors.value
    if (currentAnchors.length === 0) {
      return
    }

    let nextKey = currentAnchors[0].key
    let nextLabel = currentAnchors[0].label

    for (const anchor of currentAnchors) {
      if (anchor.top <= boundary) {
        nextKey = anchor.key
        nextLabel = anchor.label
      } else {
        break
      }
    }

    if (nextKey === activeKey.value) {
      return
    }

    activeKey.value = nextKey
    activeLabel.value = nextLabel
  }

  const reset = (): void => {
    activeKey.value = ""
    activeLabel.value = ""
    anchors.value = []
    boundaryOffset = 0
  }

  return {
    activeKey,
    activeLabel,
    anchors,
    setBoundaryOffset,
    updateAnchors,
    updateActiveMonth,
    reset
  }
}
