<template>
  <view class="app-pet-host">
    <view
      class="app-pet-navigator"
      :class="{
        'app-pet-navigator--ready': petReady,
        'app-pet-navigator--open': menuOpen,
        'app-pet-navigator--touching': touching,
        'app-pet-navigator--dragging': dragging,
        [`app-pet-navigator--dock-${petDockEdge}`]: true
      }"
      :style="petStyle"
      hover-class="app-pet-navigator--pressed"
      @touchstart.stop="handlePetTouchStart"
      @touchmove.stop.prevent="handlePetTouchMove"
      @touchend.stop="handlePetTouchEnd"
      @touchcancel.stop="handlePetTouchCancel"
    >
      <view class="app-pet-navigator__paper">
        <image
          v-show="!petImageFailed"
          class="app-pet-navigator__image"
          src="/static/pet/pet-idle.png"
          mode="aspectFit"
          @load="handlePetImageLoad"
          @error="handlePetImageError"
        />
        <view v-if="petImageFailed" class="app-pet-navigator__fallback" aria-hidden="true">
          <text class="app-pet-navigator__fallback-mark">珊</text>
        </view>
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
        <text class="app-pet-bubble__subtitle">我悄悄带你过去，慢慢逛。</text>
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
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref } from "vue"
import { readPlatformViewportMetrics } from "@/services/platform/system-info"

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
const storageKey = "app-pet-navigator-position-v2"
const cssPixelUnit = "px"
const zeroPosition = { left: 0, top: 0 } satisfies Position
const zeroSize = { width: 0, height: 0 } satisfies ElementSize

const instance = getCurrentInstance()
const menuOpen = ref(false)
const petReady = ref(false)
const petImageFailed = ref(false)
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
    label: "小档案",
    path: "/pages/memos/memos"
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

const petDockEdge = computed<HorizontalPlacement>(() => {
  const petCenterX = petPosition.value.left + petSize.value.width / 2
  const viewportCenterX = viewport.value.width / 2

  return petCenterX <= viewportCenterX ? "left" : "right"
})
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
  const metrics = readPlatformViewportMetrics()

  return {
    width: metrics.windowWidth,
    height: metrics.windowHeight,
    safeBottom: metrics.safeBottom
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

const resolveBubblePetGap = (): number => {
  const petSide = Math.min(petSize.value.width, petSize.value.height)
  // The PNG has transparent breathing room, so the bubble needs to overlap the hitbox.
  return petSide > 0 ? -petSide / 3 : 0
}

const resolveBubbleScreenGap = (): number => resolvePetEdgeGap() / 2

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
    left: bounds.minLeft,
    top: bounds.maxTop
  })
}

const snapPetToNearestEdge = () => {
  const bounds = resolvePetBounds()
  const petCenterX = petPosition.value.left + petSize.value.width / 2
  const viewportCenterX = viewport.value.width / 2

  petPosition.value = clampPetPosition({
    left: petCenterX <= viewportCenterX ? bounds.minLeft : bounds.maxLeft,
    top: petPosition.value.top
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

const resolveBubbleTailTarget = (horizontal: HorizontalPlacement, vertical: VerticalPlacement): Point => ({
  x: petPosition.value.left + petSize.value.width * (horizontal === "left" ? 1 / 3 : 2 / 3),
  y: petPosition.value.top + petSize.value.height * (vertical === "top" ? 1 / 3 : 2 / 3)
})

const resolveBubbleLayout = () => {
  const petGap = resolveBubblePetGap()
  const screenGap = resolveBubbleScreenGap()
  const centerX = petPosition.value.left + petSize.value.width / 2
  const centerY = petPosition.value.top + petSize.value.height / 2
  const horizontal = chooseHorizontalPlacement(centerX, bubbleSize.value.width + petGap + screenGap)
  const vertical = chooseVerticalPlacement(centerY, bubbleSize.value.height + petGap + screenGap)
  const idealLeft = horizontal === "left"
    ? petPosition.value.left - bubbleSize.value.width - petGap
    : petPosition.value.left + petSize.value.width + petGap
  const idealTop = vertical === "top"
    ? petPosition.value.top - bubbleSize.value.height - petGap
    : petPosition.value.top + petSize.value.height + petGap

  bubblePlacement.value = `${horizontal}-${vertical}` as BubblePlacement
  bubblePosition.value = {
    left: clamp(idealLeft, screenGap, viewport.value.width - bubbleSize.value.width - screenGap),
    top: clamp(idealTop, screenGap, viewport.value.height - viewport.value.safeBottom - bubbleSize.value.height - screenGap)
  }

  const tail = resolveBubbleTailLayout(resolveBubbleTailTarget(horizontal, vertical))
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
    snapPetToNearestEdge()
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
    snapPetToNearestEdge()
    savePetPosition()
  }

  resetTouchState()
}

const handlePetImageLoad = () => {
  petImageFailed.value = false
}

const handlePetImageError = () => {
  petImageFailed.value = true
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
  z-index: var(--app-z-index-pet);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--app-space-44);
  height: var(--app-space-44);
  border: 0;
  background: transparent;
  box-shadow: none;
  pointer-events: none;
  visibility: hidden;
}

.app-pet-navigator--ready {
  pointer-events: auto;
  visibility: visible;
  // 松手后回到最近边缘时，让位置滑过去（拖拽中再关掉，保证 1:1 跟手）
  transition: left var(--app-duration-slow) var(--app-ease-bounce), top var(--app-duration-slow) var(--app-ease-bounce), opacity var(--app-transition-fast), transform var(--app-transition-fast);
}

.app-pet-navigator--pressed,
.app-pet-navigator--touching,
.app-pet-navigator--dragging {
  opacity: var(--app-press-opacity);
  transform: scale(var(--app-press-scale-strong));
  // 交互中位置不做过渡，跟手不延迟
  transition: opacity var(--app-transition-fast), transform var(--app-transition-fast);
}

.app-pet-navigator--open {
  transform: translateY(calc(var(--app-space-0) - var(--app-space-1)));
}

.app-pet-navigator__paper {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.app-pet-navigator__paper::after {
  position: absolute;
  right: var(--app-space-8);
  bottom: var(--app-space-2);
  left: var(--app-space-8);
  height: var(--app-space-5);
  border-radius: var(--app-radius-round);
  background:
    linear-gradient(90deg, var(--app-primary-muted), var(--app-accent-soft));
  content: "";
  opacity: var(--app-muted-opacity);
}

.app-pet-navigator__image {
  position: relative;
  z-index: 1;
  display: block;
  width: calc(100% + var(--app-space-8));
  height: calc(100% + var(--app-space-8));
  max-width: none;
}

// 待机时极轻微的呼吸，给小宠物一点活气（开菜单/触摸/拖拽时停下）
.app-pet-navigator--ready .app-pet-navigator__image {
  animation: app-pet-breath var(--app-duration-breath-idle) var(--app-ease-emphasized) infinite;
}

.app-pet-navigator--open .app-pet-navigator__image,
.app-pet-navigator--touching .app-pet-navigator__image,
.app-pet-navigator--dragging .app-pet-navigator__image {
  animation: none;
}

// 点一下开菜单时，小宠物俏皮地晃一下
.app-pet-navigator--open .app-pet-navigator__paper {
  animation: app-wiggle var(--app-duration-slow) var(--app-ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  .app-pet-navigator--ready .app-pet-navigator__image,
  .app-pet-navigator--open .app-pet-navigator__paper {
    animation: none;
  }
}

.app-pet-navigator__fallback {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-round);
  background:
    linear-gradient(135deg, var(--app-surface-strong), var(--app-field));
  box-shadow: var(--app-shadow-card);
  // 图片没加载出来时，纸团兜底也轻轻落定，不突兀
  animation: app-pop-in var(--app-duration-normal) var(--app-ease-bounce) both;
}

.app-pet-navigator__fallback-mark {
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-6xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-none);
}

.app-pet-backdrop {
  position: fixed;
  inset: var(--app-space-0);
  z-index: calc(var(--app-z-index-pet) - 2);
}

.app-pet-bubble {
  @include pressable;
  position: fixed;
  top: var(--app-space-0);
  left: var(--app-space-0);
  z-index: var(--app-z-index-pet);
  display: flex;
  flex-direction: column;
  width: calc(var(--app-space-64) + var(--app-space-20));
  max-width: calc(100vw - var(--app-page-padding-x) - var(--app-page-padding-x));
  gap: var(--app-space-4);
  padding: var(--app-space-10);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-3xl) var(--app-radius-3xl) var(--app-radius-2xl) var(--app-radius-3xl);
  background:
    radial-gradient(circle at 18% 12%, var(--app-surface), transparent 54%),
    radial-gradient(circle at 86% 20%, var(--app-surface-strong), transparent 48%),
    linear-gradient(180deg, var(--app-field), var(--app-surface));
  box-shadow: var(--app-shadow-md);
  // 开合用回弹缓动 + 更明显的缩放，像从小宠物身边「啵」一下冒出来；
  // visibility 仅在关闭方向延迟，让关闭也能看到收回动画。
  transition: opacity var(--app-transition-fast), transform var(--app-duration-slow) var(--app-ease-bounce), visibility var(--app-duration-instant) linear var(--app-duration-slow);
  opacity: 0;
  pointer-events: none;
  transform: translateY(var(--app-fade-offset-y)) scale(var(--app-press-scale-strong));
  visibility: hidden;
}

.app-pet-bubble--open {
  opacity: 1;
  pointer-events: auto;
  // 打开方向：可见即时生效，立刻看到弹出
  transition: opacity var(--app-transition-fast), transform var(--app-duration-slow) var(--app-ease-bounce), visibility var(--app-duration-instant);
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
  top: calc(var(--app-space-0) - var(--app-space-7));
  left: var(--app-space-10);
  width: var(--app-space-28);
  height: var(--app-space-16);
  border-bottom: 0;
  border-radius: var(--app-radius-pill) var(--app-radius-pill) var(--app-space-0) var(--app-space-0);
}

.app-pet-bubble::after {
  top: calc(var(--app-space-0) - var(--app-space-5));
  right: var(--app-space-11);
  width: var(--app-space-20);
  height: var(--app-space-13);
  border-bottom: 0;
  border-radius: var(--app-radius-pill) var(--app-radius-pill) var(--app-space-0) var(--app-space-0);
  background: var(--app-surface);
}

.app-pet-bubble__tail {
  position: absolute;
  z-index: 0;
  width: var(--app-space-13);
  height: var(--app-space-13);
  border: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-radius-3xl) var(--app-radius-md) var(--app-radius-3xl) var(--app-radius-lg);
  background:
    linear-gradient(135deg, var(--app-field), var(--app-surface));
  box-shadow: var(--app-shadow-none);
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(45deg);
  transition: left var(--app-duration-slow) var(--app-ease-bounce), top var(--app-duration-slow) var(--app-ease-bounce);
}

.app-pet-bubble__tail::before,
.app-pet-bubble__tail::after {
  position: absolute;
  border-radius: var(--app-radius-round);
  background: var(--app-field);
  content: "";
}

.app-pet-bubble__tail::before {
  top: var(--app-space-1);
  left: var(--app-space-1);
  width: var(--app-space-7);
  height: var(--app-space-7);
}

.app-pet-bubble__tail::after {
  right: var(--app-space-1);
  bottom: var(--app-space-1);
  width: var(--app-space-5);
  height: var(--app-space-5);
  background: var(--app-surface);
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
  top: var(--app-space-5);
  right: var(--app-space-6);
  z-index: 0;
  width: var(--app-space-8);
  height: var(--app-space-8);
  border-top: var(--app-panel-border-width) solid var(--app-border-muted);
  border-right: var(--app-panel-border-width) solid var(--app-border-muted);
  border-radius: var(--app-space-0) var(--app-radius-md) var(--app-space-0) var(--app-space-0);
  background: var(--app-field);
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
  gap: var(--app-space-3);
  padding-right: var(--app-space-8);
  padding-bottom: var(--app-space-5);
}

.app-pet-bubble__speech::after {
  position: absolute;
  bottom: var(--app-space-0);
  left: var(--app-space-0);
  width: var(--app-space-20);
  height: var(--app-border-width-hairline);
  border-radius: var(--app-radius-pill);
  background: var(--app-accent-soft);
  content: "";
  opacity: var(--app-decor-opacity);
}

.app-pet-bubble__speech::before {
  position: absolute;
  top: calc(var(--app-space-0) - var(--app-space-2));
  left: var(--app-space-32);
  width: var(--app-space-10);
  height: var(--app-border-width-hairline);
  border-radius: var(--app-radius-pill);
  background: var(--app-border-muted);
  content: "";
  opacity: var(--app-decor-opacity);
}

.app-pet-bubble__title {
  color: var(--app-primary);
  font-family: var(--app-font-family-display);
  font-size: var(--app-font-size-2xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: var(--app-line-height-tight);
}

.app-pet-bubble__subtitle {
  color: var(--app-text-soft);
  font-family: var(--app-font-family-body);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-normal);
}

.app-pet-bubble__actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-4);
  margin-top: var(--app-space-2);
}

:deep(.app-pet-bubble__action-button) {
  justify-content: center;
  height: var(--app-control-scale-xs);
  min-height: var(--app-control-scale-xs);
  padding: var(--app-space-0) var(--app-space-5);
  border-color: var(--app-border-muted);
  border-radius: var(--app-radius-pill) var(--app-radius-lg) var(--app-radius-pill) var(--app-radius-md);
  background: var(--app-field);
  box-shadow: var(--app-shadow-none);
  color: var(--app-text);
  font-family: var(--app-font-family-body);
  font-size: var(--app-font-size-sm);
  font-weight: var(--app-font-weight-medium);
  line-height: var(--app-line-height-none);
  transform: rotate(-1deg);
}

:deep(.app-pet-bubble__action-button:nth-child(2n)) {
  border-radius: var(--app-radius-lg) var(--app-radius-pill) var(--app-radius-md) var(--app-radius-pill);
  background: var(--app-surface-strong);
  transform: rotate(1deg);
}

:deep(.app-pet-bubble__action-button:nth-child(3n)) {
  background: var(--app-accent-soft);
}

:deep(.app-pet-bubble__action-button:nth-child(4n)) {
  background: var(--app-primary-soft);
}
</style>
