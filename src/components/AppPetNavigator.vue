<template>
  <view class="app-pet-host">
    <view
      class="app-pet-navigator"
      :class="{
        'app-pet-navigator--ready': petReady,
        'app-pet-navigator--open': menuOpen,
        'app-pet-navigator--touching': touching,
        'app-pet-navigator--dragging': dragging
      }"
      :style="petStyle"
      hover-class="app-pet-navigator--pressed"
      @touchstart.stop="handlePetTouchStart"
      @touchmove.stop.prevent="handlePetTouchMove"
      @touchend.stop="handlePetTouchEnd"
      @touchcancel.stop="handlePetTouchCancel"
    >
      <view class="app-pet-navigator__paper">
        <view class="app-pet-navigator__eyes">
          <view class="app-pet-navigator__eye" />
          <view class="app-pet-navigator__eye" />
        </view>
        <view class="app-pet-navigator__line app-pet-navigator__line--primary" />
        <view class="app-pet-navigator__line app-pet-navigator__line--accent" />
      </view>
    </view>

    <view
      v-if="menuOpen"
      class="app-pet-backdrop"
      @click="closeMenu"
    />

    <view
      class="app-pet-bubble"
      :class="bubbleClass"
      :style="bubbleStyle"
      @click.stop
    >
      <view class="app-pet-bubble__tail" :style="bubbleTailStyle" />
      <view class="app-pet-bubble__paper-corner" />
      <view class="app-pet-bubble__speech">
        <text class="app-pet-bubble__title">想去哪儿呀？</text>
        <text class="app-pet-bubble__subtitle">我悄悄带你过去。</text>
      </view>

      <view class="app-pet-bubble__actions">
        <wd-button
          v-for="item in menuItems"
          :key="item.path"
          block
          plain
          size="small"
          custom-class="app-pet-bubble__action-button"
          @click="navigateToMenuItem(item)"
        >
          {{ item.label }}
        </wd-button>
      </view>

      <view class="app-pet-bubble__close">
        <wd-button
          plain
          size="small"
          custom-class="app-pet-bubble__hide-button"
          @click="closeMenu"
        >
          先藏起来
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref } from "vue"

interface MenuItem {
  label: string
  path: `/${string}`
}

interface Point {
  x: number
  y: number
}

interface Position {
  left: number
  top: number
}

interface ElementSize {
  width: number
  height: number
}

interface ViewportMetrics extends ElementSize {
  safeBottom: number
}

interface StoredPetPosition {
  xRatio: number
  yRatio: number
}

interface RuntimePage {
  route?: string
  __route__?: string
}

interface SystemInfoSnapshot {
  windowWidth?: number
  windowHeight?: number
  screenHeight?: number
  safeAreaInsets?: {
    bottom?: number
  }
  safeArea?: {
    bottom?: number
  }
}

interface LayoutRect {
  width?: number
  height?: number
}

interface DragState {
  startPoint: Point
  startPosition: Position
}

type BubblePlacement = "left-top" | "right-top" | "left-bottom" | "right-bottom"
type BubbleTailEdge = "top" | "right" | "bottom" | "left"
type HorizontalPlacement = "left" | "right"
type VerticalPlacement = "top" | "bottom"

const maxNavigateStackDepth = 9
const storageKey = "app-pet-navigator-position"
const cssPixelUnit = "px"
const zeroPosition = { left: 0, top: 0 } satisfies Position
const zeroSize = { width: 0, height: 0 } satisfies ElementSize

const instance = getCurrentInstance()
const menuOpen = ref(false)
const petReady = ref(false)
const touching = ref(false)
const dragging = ref(false)
const dragState = ref<DragState | null>(null)
const petPosition = ref<Position>({ ...zeroPosition })
const petSize = ref<ElementSize>({ ...zeroSize })
const bubbleSize = ref<ElementSize>({ ...zeroSize })
const bubblePosition = ref<Position>({ ...zeroPosition })
const bubbleTailPosition = ref<Position>({ ...zeroPosition })
const bubbleTailEdge = ref<BubbleTailEdge>("right")
const bubblePlacement = ref<BubblePlacement>("left-top")
const viewport = ref<ViewportMetrics>({
  width: 0,
  height: 0,
  safeBottom: 0
})

const menuItems: MenuItem[] = [
  {
    label: "写回忆",
    path: "/pages/create/create"
  },
  {
    label: "小歌单",
    path: "/pages/songs/songs"
  },
  {
    label: "小约定",
    path: "/pages/tasks/tasks"
  },
  {
    label: "换样子",
    path: "/pages/settings/settings"
  }
]

const normalizeRoute = (route: string): string => route.replace(/^\/+/, "")

const getCurrentRoute = (): string => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as RuntimePage | undefined

  return normalizeRoute(currentPage?.route ?? currentPage?.__route__ ?? "")
}

const finiteNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const clamp = (value: number, min: number, max: number): number => {
  const safeMax = Math.max(min, max)
  return Math.min(Math.max(value, min), safeMax)
}

const positionToStyle = (position: Position): string =>
  `left: ${Math.round(position.left)}${cssPixelUnit}; top: ${Math.round(position.top)}${cssPixelUnit};`

const petStyle = computed(() => positionToStyle(petPosition.value))
const bubbleStyle = computed(() => positionToStyle(bubblePosition.value))
const bubbleTailStyle = computed(() => positionToStyle(bubbleTailPosition.value))
const bubbleClass = computed<Record<string, boolean>>(() => ({
  "app-pet-bubble--open": menuOpen.value,
  [`app-pet-bubble--${bubblePlacement.value}`]: true,
  [`app-pet-bubble--tail-${bubbleTailEdge.value}`]: true
}))

const getTouchPoint = (event: TouchEvent): Point | null => {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0]
  const x = finiteNumber(touch?.clientX, finiteNumber(touch?.pageX, Number.NaN))
  const y = finiteNumber(touch?.clientY, finiteNumber(touch?.pageY, Number.NaN))

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return { x, y }
}

const readViewportMetrics = (): ViewportMetrics => {
  let info: SystemInfoSnapshot = {}

  try {
    info = uni.getSystemInfoSync() as SystemInfoSnapshot
  } catch {
    info = {}
  }

  const width = finiteNumber(info.windowWidth)
  const height = finiteNumber(info.windowHeight)
  const screenHeight = finiteNumber(info.screenHeight, height)
  const safeAreaInsetBottom = finiteNumber(info.safeAreaInsets?.bottom, Number.NaN)
  const safeAreaBottom = finiteNumber(info.safeArea?.bottom, screenHeight)
  const safeBottom = Number.isFinite(safeAreaInsetBottom)
    ? safeAreaInsetBottom
    : Math.max(0, screenHeight - safeAreaBottom)

  return {
    width,
    height,
    safeBottom
  }
}

const normalizeRect = (rect: unknown): LayoutRect | null => {
  if (Array.isArray(rect)) {
    return normalizeRect(rect[0])
  }

  if (!rect || typeof rect !== "object") {
    return null
  }

  return rect as LayoutRect
}

const measureElementSize = (selector: string, fallback: ElementSize): Promise<ElementSize> =>
  new Promise((resolve) => {
    const query = instance?.proxy ? uni.createSelectorQuery().in(instance.proxy) : uni.createSelectorQuery()

    query
      .select(selector)
      .boundingClientRect((rect) => {
        const layout = normalizeRect(rect)
        const width = finiteNumber(layout?.width, fallback.width)
        const height = finiteNumber(layout?.height, fallback.height)

        resolve({
          width,
          height
        })
      })
      .exec()
  })

const resolvePetEdgeGap = (): number => {
  const smallestSide = Math.min(petSize.value.width, petSize.value.height)
  return smallestSide > 0 ? smallestSide / 4 : 0
}

const resolveBubbleEdgeGap = (): number => resolvePetEdgeGap() / 2

const resolveBubbleTailInset = (): number => {
  const petSide = Math.min(petSize.value.width, petSize.value.height)
  const bubbleSide = Math.min(bubbleSize.value.width, bubbleSize.value.height)
  const idealInset = petSide > 0 ? petSide / 5 : bubbleSide / 8

  return clamp(idealInset, 0, bubbleSide / 2)
}

const resolveDragThreshold = (): number => {
  const smallestSide = Math.min(petSize.value.width, petSize.value.height)
  return smallestSide > 0 ? smallestSide / 6 : 0
}

const resolvePetBounds = () => {
  const gap = resolvePetEdgeGap()

  return {
    minLeft: gap,
    minTop: gap,
    maxLeft: viewport.value.width - petSize.value.width - gap,
    maxTop: viewport.value.height - viewport.value.safeBottom - petSize.value.height - gap
  }
}

const clampPetPosition = (position: Position): Position => {
  const bounds = resolvePetBounds()

  return {
    left: clamp(position.left, bounds.minLeft, bounds.maxLeft),
    top: clamp(position.top, bounds.minTop, bounds.maxTop)
  }
}

const readStoredPetPosition = (): StoredPetPosition | null => {
  try {
    const value = uni.getStorageSync(storageKey) as unknown

    if (!value || typeof value !== "object") {
      return null
    }

    const position = value as Partial<StoredPetPosition>
    const xRatio = position.xRatio
    const yRatio = position.yRatio

    if (
      typeof xRatio !== "number" ||
      typeof yRatio !== "number" ||
      !Number.isFinite(xRatio) ||
      !Number.isFinite(yRatio)
    ) {
      return null
    }

    return {
      xRatio: clamp(xRatio, 0, 1),
      yRatio: clamp(yRatio, 0, 1)
    }
  } catch {
    return null
  }
}

const savePetPosition = () => {
  if (viewport.value.width <= 0 || viewport.value.height <= 0) {
    return
  }

  const centerX = petPosition.value.left + petSize.value.width / 2
  const centerY = petPosition.value.top + petSize.value.height / 2

  try {
    uni.setStorageSync(storageKey, {
      xRatio: clamp(centerX / viewport.value.width, 0, 1),
      yRatio: clamp(centerY / viewport.value.height, 0, 1)
    } satisfies StoredPetPosition)
  } catch {
    // Local UI preference persistence is best-effort only.
  }
}

const restorePetPosition = () => {
  const storedPosition = readStoredPetPosition()
  const bounds = resolvePetBounds()

  if (storedPosition) {
    petPosition.value = clampPetPosition({
      left: viewport.value.width * storedPosition.xRatio - petSize.value.width / 2,
      top: viewport.value.height * storedPosition.yRatio - petSize.value.height / 2
    })
    return
  }

  petPosition.value = clampPetPosition({
    left: bounds.maxLeft,
    top: bounds.maxTop
  })
}

const resolveBubbleFallbackSize = (): ElementSize => ({
  width: bubbleSize.value.width || viewport.value.width * 0.64,
  height: bubbleSize.value.height || petSize.value.height * 3
})

const refreshLayout = async () => {
  viewport.value = readViewportMetrics()

  const nextPetSize = await measureElementSize(".app-pet-navigator", petSize.value)
  petSize.value = nextPetSize

  const nextBubbleSize = await measureElementSize(".app-pet-bubble", resolveBubbleFallbackSize())
  bubbleSize.value = nextBubbleSize

  petPosition.value = clampPetPosition(petPosition.value)
}

const chooseHorizontalPlacement = (centerX: number, requiredSpace: number): HorizontalPlacement => {
  const availableLeft = centerX
  const availableRight = viewport.value.width - centerX
  const centerBias = petSize.value.width / 2
  const preferred = Math.abs(centerX - viewport.value.width / 2) <= centerBias
    ? availableLeft > availableRight ? "left" : "right"
    : centerX > viewport.value.width / 2 ? "left" : "right"
  const preferredSpace = preferred === "left" ? availableLeft : availableRight
  const oppositeSpace = preferred === "left" ? availableRight : availableLeft

  return preferredSpace >= requiredSpace || preferredSpace >= oppositeSpace
    ? preferred
    : preferred === "left" ? "right" : "left"
}

const chooseVerticalPlacement = (centerY: number, requiredSpace: number): VerticalPlacement => {
  const availableTop = centerY
  const availableBottom = viewport.value.height - viewport.value.safeBottom - centerY
  const centerBias = petSize.value.height / 2
  const preferred = Math.abs(centerY - viewport.value.height / 2) <= centerBias
    ? availableTop > availableBottom ? "top" : "bottom"
    : centerY > viewport.value.height / 2 ? "top" : "bottom"
  const preferredSpace = preferred === "top" ? availableTop : availableBottom
  const oppositeSpace = preferred === "top" ? availableBottom : availableTop

  return preferredSpace >= requiredSpace || preferredSpace >= oppositeSpace
    ? preferred
    : preferred === "top" ? "bottom" : "top"
}

const resolveBubbleTailLayout = (petCenter: Point): { edge: BubbleTailEdge; position: Position } => {
  const { width, height } = bubbleSize.value

  if (width <= 0 || height <= 0) {
    return {
      edge: "right",
      position: { ...zeroPosition }
    }
  }

  const bubbleCenter = {
    x: bubblePosition.value.left + width / 2,
    y: bubblePosition.value.top + height / 2
  }
  const deltaX = petCenter.x - bubbleCenter.x
  const deltaY = petCenter.y - bubbleCenter.y
  const halfWidth = width / 2
  const halfHeight = height / 2
  const verticalEdgeScale = deltaX === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(deltaX)
  const horizontalEdgeScale = deltaY === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(deltaY)
  const inset = resolveBubbleTailInset()

  if (verticalEdgeScale <= horizontalEdgeScale) {
    return {
      edge: deltaX >= 0 ? "right" : "left",
      position: {
        left: deltaX >= 0 ? width : 0,
        top: clamp(halfHeight + deltaY * verticalEdgeScale, inset, height - inset)
      }
    }
  }

  return {
    edge: deltaY >= 0 ? "bottom" : "top",
    position: {
      left: clamp(halfWidth + deltaX * horizontalEdgeScale, inset, width - inset),
      top: deltaY >= 0 ? height : 0
    }
  }
}

const resolveBubbleLayout = () => {
  const gap = resolveBubbleEdgeGap()
  const centerX = petPosition.value.left + petSize.value.width / 2
  const centerY = petPosition.value.top + petSize.value.height / 2
  const horizontal = chooseHorizontalPlacement(centerX, bubbleSize.value.width + gap)
  const vertical = chooseVerticalPlacement(centerY, bubbleSize.value.height + gap)
  const idealLeft = horizontal === "left"
    ? petPosition.value.left - bubbleSize.value.width - gap
    : petPosition.value.left + petSize.value.width + gap
  const idealTop = vertical === "top"
    ? petPosition.value.top - bubbleSize.value.height - gap
    : petPosition.value.top + petSize.value.height + gap

  bubblePlacement.value = `${horizontal}-${vertical}` as BubblePlacement
  bubblePosition.value = {
    left: clamp(idealLeft, gap, viewport.value.width - bubbleSize.value.width - gap),
    top: clamp(idealTop, gap, viewport.value.height - viewport.value.safeBottom - bubbleSize.value.height - gap)
  }

  const tail = resolveBubbleTailLayout({
    x: centerX,
    y: centerY
  })
  bubbleTailEdge.value = tail.edge
  bubbleTailPosition.value = tail.position
}

const openMenu = async () => {
  await refreshLayout()
  resolveBubbleLayout()
  menuOpen.value = true
}

const closeMenu = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  if (menuOpen.value) {
    closeMenu()
    return
  }

  void openMenu()
}

const goToPath = (path: MenuItem["path"]) => {
  if (getCurrentPages().length >= maxNavigateStackDepth) {
    uni.redirectTo({ url: path })
    return
  }

  uni.navigateTo({
    url: path,
    fail: () => {
      uni.redirectTo({ url: path })
    }
  })
}

const navigateToMenuItem = async (item: MenuItem) => {
  const isCurrentPage = getCurrentRoute() === normalizeRoute(item.path)

  closeMenu()
  await nextTick()

  if (!isCurrentPage) {
    goToPath(item.path)
  }
}

const handlePetTouchStart = (event: TouchEvent) => {
  const point = getTouchPoint(event)
  if (!point || !petReady.value) {
    return
  }

  void refreshLayout()
  touching.value = true
  dragging.value = false
  dragState.value = {
    startPoint: point,
    startPosition: { ...petPosition.value }
  }
}

const handlePetTouchMove = (event: TouchEvent) => {
  const point = getTouchPoint(event)
  const state = dragState.value

  if (!point || !state) {
    return
  }

  const deltaX = point.x - state.startPoint.x
  const deltaY = point.y - state.startPoint.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  if (!dragging.value && distance < resolveDragThreshold()) {
    return
  }

  if (!dragging.value) {
    dragging.value = true
    closeMenu()
  }

  petPosition.value = clampPetPosition({
    left: state.startPosition.left + deltaX,
    top: state.startPosition.top + deltaY
  })
}

const resetTouchState = () => {
  touching.value = false
  dragging.value = false
  dragState.value = null
}

const handlePetTouchEnd = () => {
  const wasDragging = dragging.value

  if (wasDragging) {
    petPosition.value = clampPetPosition(petPosition.value)
    savePetPosition()
    resetTouchState()
    return
  }

  resetTouchState()
  toggleMenu()
}

const handlePetTouchCancel = () => {
  if (dragging.value) {
    petPosition.value = clampPetPosition(petPosition.value)
    savePetPosition()
  }

  resetTouchState()
}

onMounted(async () => {
  await nextTick()
  await refreshLayout()
  restorePetPosition()
  petReady.value = true
})
</script>

<style lang="scss" scoped>
@import "../styles/mixins.scss";

.app-pet-host {
  position: relative;
}

.app-pet-navigator {
  @include pressable;
  position: fixed;
  top: var(--app-space-0);
  left: var(--app-space-0);
  z-index: 16;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-space-44);
  height: var(--app-space-40);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-card) var(--app-radius-2xl) var(--app-radius-card) var(--app-radius-2xl);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-floating);
  pointer-events: none;
  visibility: hidden;
}

.app-pet-navigator::before {
  position: absolute;
  top: var(--app-space-0);
  right: var(--app-space-0);
  width: var(--app-space-13);
  height: var(--app-space-13);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-left: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-space-0) var(--app-radius-card) var(--app-space-0) var(--app-radius-xs);
  background: var(--app-field);
  content: "";
}

.app-pet-navigator::after {
  position: absolute;
  right: var(--app-space-8);
  bottom: calc(var(--app-space-0) - var(--app-space-2));
  width: var(--app-space-10);
  height: var(--app-space-5);
  border-right: var(--app-panel-border-width) solid var(--app-border);
  border-bottom: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-round);
  background: var(--app-surface);
  content: "";
}

.app-pet-navigator--ready {
  pointer-events: auto;
  visibility: visible;
}

.app-pet-navigator--pressed,
.app-pet-navigator--touching,
.app-pet-navigator--dragging,
.app-pet-navigator--open {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale));
}

.app-pet-navigator__paper {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  overflow: hidden;
}

.app-pet-navigator__eyes {
  display: flex;
  gap: var(--app-space-6);
}

.app-pet-navigator__eye {
  width: var(--app-space-2);
  height: var(--app-space-2);
  border-radius: var(--app-radius-round);
  background: var(--app-text);
}

.app-pet-navigator__line {
  height: var(--app-border-width-focus);
  border-radius: var(--app-radius-pill);
  opacity: var(--app-decor-opacity);
}

.app-pet-navigator__line--primary {
  width: var(--app-space-18);
  background: var(--app-color-red-person);
}

.app-pet-navigator__line--accent {
  width: var(--app-space-24);
  background: var(--app-color-blue-person);
}

.app-pet-backdrop {
  position: fixed;
  inset: var(--app-space-0);
  z-index: 14;
}

.app-pet-bubble {
  @include pressable;
  position: fixed;
  top: var(--app-space-0);
  left: var(--app-space-0);
  z-index: 15;
  display: flex;
  flex-direction: column;
  width: calc(var(--app-space-64) + var(--app-space-20));
  max-width: calc(100vw - var(--app-page-padding-x) - var(--app-page-padding-x));
  gap: var(--app-space-2);
  padding: var(--app-space-7) var(--app-space-8) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-3xl) var(--app-radius-xl) var(--app-radius-2xl) var(--app-radius-lg);
  background: var(--app-field);
  box-shadow: var(--app-shadow-button);
  opacity: var(--app-space-0);
  pointer-events: none;
  transform: translateY(var(--app-fade-offset-y)) scale(var(--app-press-scale));
  visibility: hidden;
}

.app-pet-bubble--open {
  opacity: initial;
  pointer-events: auto;
  transform: none;
  visibility: visible;
}

.app-pet-bubble--left-top {
  transform-origin: right bottom;
}

.app-pet-bubble--right-top {
  transform-origin: left bottom;
}

.app-pet-bubble--left-bottom {
  transform-origin: right top;
}

.app-pet-bubble--right-bottom {
  transform-origin: left top;
}

.app-pet-bubble::before,
.app-pet-bubble::after {
  position: absolute;
  z-index: 0;
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  background: var(--app-field);
  content: "";
  pointer-events: none;
}

.app-pet-bubble::before {
  top: calc(var(--app-space-0) - var(--app-space-5));
  left: var(--app-space-8);
  width: var(--app-space-18);
  height: var(--app-space-11);
  border-bottom: 0;
  border-radius: var(--app-radius-pill) var(--app-radius-lg) var(--app-space-0) var(--app-space-0);
}

.app-pet-bubble::after {
  right: var(--app-space-10);
  bottom: calc(var(--app-space-0) - var(--app-space-4));
  width: var(--app-space-20);
  height: var(--app-space-9);
  border-top: 0;
  border-radius: var(--app-space-0) var(--app-space-0) var(--app-radius-lg) var(--app-radius-pill);
}

.app-pet-bubble__tail {
  position: absolute;
  z-index: 0;
  width: var(--app-space-14);
  height: var(--app-space-14);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-sm);
  background: var(--app-field);
  box-shadow: var(--app-shadow-none);
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(45deg);
}

.app-pet-bubble--tail-top .app-pet-bubble__tail {
  border-right: 0;
  border-bottom: 0;
}

.app-pet-bubble--tail-right .app-pet-bubble__tail {
  border-bottom: 0;
  border-left: 0;
}

.app-pet-bubble--tail-bottom .app-pet-bubble__tail {
  border-top: 0;
  border-left: 0;
}

.app-pet-bubble--tail-left .app-pet-bubble__tail {
  border-top: 0;
  border-right: 0;
}

.app-pet-bubble__paper-corner {
  position: absolute;
  top: var(--app-space-3);
  right: var(--app-space-3);
  z-index: 0;
  width: var(--app-space-12);
  height: var(--app-space-12);
  border-top: var(--app-panel-border-width) solid var(--app-border-muted);
  border-right: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-space-0) var(--app-radius-md) var(--app-space-0) var(--app-space-0);
  background: var(--app-surface);
  opacity: var(--app-decor-opacity);
  pointer-events: none;
}

.app-pet-bubble__paper-corner::after {
  position: absolute;
  right: var(--app-space-1);
  bottom: var(--app-space-1);
  width: var(--app-space-6);
  height: var(--app-border-width-hairline);
  border-radius: var(--app-radius-pill);
  background: var(--app-border-muted);
  content: "";
  transform: rotate(-45deg);
}

.app-pet-bubble__speech {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  padding-bottom: var(--app-space-3);
}

.app-pet-bubble__speech::after {
  position: absolute;
  bottom: var(--app-space-0);
  left: var(--app-space-0);
  width: var(--app-space-16);
  height: var(--app-border-width-hairline);
  border-radius: var(--app-radius-pill);
  background: var(--app-primary-soft);
  content: "";
  opacity: var(--app-decor-opacity);
}

.app-pet-bubble__speech::before {
  position: absolute;
  top: calc(var(--app-space-0) - var(--app-space-2));
  left: var(--app-space-28);
  width: var(--app-space-8);
  height: var(--app-border-width-hairline);
  border-radius: var(--app-radius-pill);
  background: var(--app-border-muted);
  content: "";
  opacity: var(--app-decor-opacity);
}

.app-pet-bubble__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.app-pet-bubble__subtitle {
  color: var(--app-text-muted);
  font: var(--app-font-caption);
}

.app-pet-bubble__actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-1);
  margin-top: var(--app-space-1);
}

.app-pet-bubble__close {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
}

:deep(.app-pet-bubble__action-button) {
  justify-content: center;
  height: var(--app-control-scale-2xs);
  min-height: var(--app-control-scale-2xs);
  padding: var(--app-space-0) var(--app-space-3);
  border-color: var(--app-divider);
  border-radius: var(--app-radius-sm) var(--app-radius-lg) var(--app-radius-md) var(--app-radius-sm);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-none);
  color: var(--app-text);
  font: var(--app-font-caption);
  transform: rotate(-1deg);
}

:deep(.app-pet-bubble__action-button:nth-child(2n)) {
  border-radius: var(--app-radius-lg) var(--app-radius-sm) var(--app-radius-sm) var(--app-radius-md);
  background: var(--app-surface-strong);
  transform: rotate(1deg);
}

:deep(.app-pet-bubble__action-button:nth-child(3n)) {
  background: var(--app-accent-soft);
}

:deep(.app-pet-bubble__action-button:nth-child(4n)) {
  background: var(--app-primary-soft);
}

:deep(.app-pet-bubble__hide-button) {
  height: var(--app-space-12);
  min-height: var(--app-space-12);
  padding: var(--app-space-0) var(--app-space-2);
  border-color: transparent;
  background: transparent;
  box-shadow: var(--app-shadow-none);
  color: var(--app-text-muted);
  font: var(--app-font-caption);
  opacity: var(--app-muted-opacity);
  text-decoration: underline;
  text-decoration-color: var(--app-divider);
  text-underline-offset: var(--app-space-1);
}
</style>
