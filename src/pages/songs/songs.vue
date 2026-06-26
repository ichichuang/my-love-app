<template>
  <page-meta
    :background-text-style="theme.nativeChromeTheme.backgroundTextStyle"
    :background-color="theme.nativeChromeTheme.backgroundColor"
    :background-color-top="theme.nativeChromeTheme.backgroundColorTop"
    :background-color-bottom="theme.nativeChromeTheme.backgroundColorBottom"
    :page-style="theme.nativeChromeTheme.pageStyle"
  />
  <app-shell nav-title="小歌单" nav-eyebrow="小小歌单" nav-show-back nav-variant="page">
    <template #nav-actions>
      <wd-button size="small" plain @click="goSongEdit">加一首歌</wd-button>
    </template>

    <view class="songs-intro app-reveal-1">
      <text class="songs-intro__title">想听你唱的歌都放在这里</text>
      <text class="songs-intro__body">先把歌名塞进来，唱不唱不着急。</text>
    </view>

    <view v-if="loading" class="songs-status app-anim-breath">
      <text>正在翻小歌单…</text>
    </view>

    <empty-state
      v-else-if="hasError"
      title="小歌单暂时没翻到"
      body="可能是网络慢了一点，稍后再试一次。"
    >
      <wd-button custom-class="songs-state__button" @click="loadSongs">再试一次</wd-button>
    </empty-state>

    <empty-state
      v-else-if="songs.length === 0"
      title="先放进第一首想听的歌"
      body="可以写一首她想听的，也可以写一首你想主动唱给她的。"
    >
      <wd-button custom-class="songs-state__button" @click="goSongEdit">加一首歌</wd-button>
    </empty-state>

    <view v-else class="songs-content">
      <view class="songs-filter-bar" :style="stickySectionStyle">
        <app-option-group :columns="2" responsive="auto">
          <app-option-button
            v-for="option in filterOptions"
            :key="option.value"
            :active="activeFilter === option.value"
            @click="setActiveFilter(option.value)"
          >
            <text>{{ option.label }}</text>
          </app-option-button>
        </app-option-group>
      </view>

      <app-animated-swap :value="activeFilter" v-slot="{ displayValue: currentFilter, phase }">
        <view class="songs-swap-container">
          <empty-state
            v-if="getFilteredSongs(currentFilter).length === 0"
            title="这个分类暂时还空着"
            body="换个分类看看，或者先加一首想听的。"
          >
            <wd-button custom-class="songs-state__button" @click="goSongEdit">加一首歌</wd-button>
          </empty-state>

          <view v-else class="song-list">
            <view
              v-for="(song, index) in getFilteredSongs(currentFilter)"
              :key="`${currentFilter}-${song.id}`"
              class="song-card app-rise-stagger"
              :class="{ 'app-card-exit': phase === 'leaving' }"
              :style="{ animationDelay: phase === 'leaving' ? '0s' : `calc(var(--app-stagger-reveal) * ${index})` }"
              hover-class="song-card--pressed"
              @click="openSong(song.id)"
            >
              <view class="app-paper-tape app-paper-tape--top-right" />
              <view class="song-card__head">
                <view class="song-card__title-group">
                  <text class="song-card__title">{{ song.title }}</text>
                  <text v-if="song.artist" class="song-card__artist">{{ song.artist }}</text>
                </view>

                <view class="song-card__tags">
                  <text class="song-card__tag" :class="song.statusClass">{{ song.statusLabel }}</text>
                  <text class="song-card__tag song-card__tag--priority">小愿望：{{ song.priorityLabel }}</text>
                </view>
              </view>

              <text v-if="song.content" class="song-card__content">{{ song.content }}</text>
              <text v-if="song.sungAtLabel" class="song-card__sung-at">{{ song.sungAtLabel }}唱过</text>

              <view class="song-card__actions" @click.stop>
                <wd-button
                  v-for="action in getStatusActions(song.songStatus)"
                  :key="action.value"
                  size="small"
                  plain
                  :type="action.type"
                  :loading="isStatusActionLoading(song.id, action.value)"
                  :disabled="isSongStatusUpdating(song.id)"
                  custom-class="song-card__action"
                  @click.stop="changeSongStatus(song.id, action.value)"
                >
                  {{ action.label }}
                </wd-button>
              </view>
            </view>
          </view>
        </view>
      </app-animated-swap>
    </view>
  </app-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue"
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app"
import { showAppWarning } from "@/composables/useAppToast"
import { useCachedList } from "@/composables/useCachedList"
import { useNativeChromeSync } from "@/composables/useNativeChromeSync"
import { consumeRouteFeedback } from "@/composables/useRouteFeedback"
import { useStickySectionOffset } from "@/composables/useStickySectionOffset"
import { dataCacheKeys } from "@/services/data-cache"
import {
  listSongs,
  songPriorityLabels,
  songStatusLabels,
  updateSongStatus,
  type SongPriority,
  type SongRecord,
  type SongStatus
} from "@/services/repositories/songs"

const theme = useNativeChromeSync()
const { stickySectionStyle } = useStickySectionOffset()
const songsRoute = "/pages/songs/songs"

type FilterValue = "all" | SongStatus

interface SongListItem extends SongRecord {
  priorityLabel: string
  statusClass: string
  statusLabel: string
  sungAtLabel: string
}

interface SongStatusAction {
  label: string
  type: "primary" | "success" | "warning" | "default"
  value: SongStatus
}

const { items: songs, loading, errorMessage, reload } = useCachedList<SongRecord>({
  cacheKey: dataCacheKeys.songList,
  loader: listSongs
})
const activeFilter = shallowRef<FilterValue>("all")
const statusUpdatingById = shallowRef<Partial<Record<string, SongStatus>>>({})

const filterOptions: Array<{
  label: string
  value: FilterValue
}> = [
  {
    label: "全部",
    value: "all"
  },
  {
    label: songStatusLabels.wanted,
    value: "wanted"
  },
  {
    label: songStatusLabels.sung,
    value: "sung"
  },
  {
    label: songStatusLabels.paused,
    value: "paused"
  }
]

const statusClassByValue: Record<SongStatus, string> = {
  wanted: "song-card__tag--wanted",
  sung: "song-card__tag--sung",
  paused: "song-card__tag--paused"
}

const statusActionsByValue: Record<SongStatus, SongStatusAction[]> = {
  wanted: [
    {
      label: "唱过了",
      type: "success",
      value: "sung"
    },
    {
      label: "先暂缓",
      type: "warning",
      value: "paused"
    }
  ],
  paused: [
    {
      label: "重新想听",
      type: "primary",
      value: "wanted"
    },
    {
      label: "唱过了",
      type: "success",
      value: "sung"
    }
  ],
  sung: [
    {
      label: "改回想听",
      type: "primary",
      value: "wanted"
    }
  ]
}

const formatSungAt = (timestamp?: number): string => {
  if (typeof timestamp !== "number" || timestamp <= 0) {
    return ""
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const resolvePriorityLabel = (priority: SongPriority): string => songPriorityLabels[priority]

const decoratedSongs = computed<SongListItem[]>(() =>
  songs.value.map((song) => ({
    ...song,
    priorityLabel: resolvePriorityLabel(song.songPriority),
    statusClass: statusClassByValue[song.songStatus],
    statusLabel: songStatusLabels[song.songStatus],
    sungAtLabel: formatSungAt(song.sungAt)
  }))
)

const filteredSongs = computed(() => {
  if (activeFilter.value === "all") {
    return decoratedSongs.value
  }

  return decoratedSongs.value.filter((song) => song.songStatus === activeFilter.value)
})

const getFilteredSongs = (filterVal: FilterValue) => {
  if (filterVal === "all") {
    return decoratedSongs.value
  }
  return decoratedSongs.value.filter((song) => song.songStatus === filterVal)
}

const hasError = computed(() => errorMessage.value.length > 0 && songs.value.length === 0)

const loadSongs = async (notifyCachedFailure = false) => {
  try {
    const result = await reload()
    if (notifyCachedFailure && result.fromCache && !result.refreshed) {
      showAppWarning("小纸条暂时没更新好，请稍后再试。")
    }
  } catch {
    return
  } finally {
    uni.stopPullDownRefresh()
  }
}

const setActiveFilter = (filter: FilterValue) => {
  activeFilter.value = filter
}

const getStatusActions = (status: SongStatus): SongStatusAction[] => statusActionsByValue[status]

const isSongStatusUpdating = (id: string): boolean => typeof statusUpdatingById.value[id] !== "undefined"

const isStatusActionLoading = (id: string, status: SongStatus): boolean => statusUpdatingById.value[id] === status

const setSongStatusUpdating = (id: string, status: SongStatus | null) => {
  const nextState = { ...statusUpdatingById.value }

  if (status === null) {
    delete nextState[id]
  } else {
    nextState[id] = status
  }

  statusUpdatingById.value = nextState
}

const replaceSong = (nextSong: SongRecord) => {
  songs.value = songs.value.map((song) => (song.id === nextSong.id ? nextSong : song))
}

const changeSongStatus = async (id: string, status: SongStatus) => {
  if (isSongStatusUpdating(id)) {
    return
  }

  setSongStatusUpdating(id, status)

  try {
    const nextSong = await updateSongStatus(id, status)
    replaceSong(nextSong)
  } catch {
    showAppWarning("这首歌暂时没改好，请稍后再试。")
  } finally {
    setSongStatusUpdating(id, null)
  }
}

const goSongEdit = () => {
  uni.navigateTo({
    url: "/pages/song-edit/song-edit"
  })
}

const openSong = (id: string) => {
  uni.navigateTo({
    url: `/pages/song-edit/song-edit?id=${encodeURIComponent(id)}`
  })
}

onShow(() => {
  consumeRouteFeedback(songsRoute)
  void loadSongs()
})

onPullDownRefresh(() => {
  void loadSongs(true)
})
</script>

<style lang="scss" scoped>
@import "../../styles/mixins.scss";

.songs-intro {
  @include panel;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  margin-bottom: var(--app-form-gap);
  padding: var(--app-card-padding);
  background:
    linear-gradient(135deg, var(--app-surface), var(--app-surface-strong));
}

.songs-intro__title {
  color: var(--app-text);
  font: var(--app-font-section-title);
}

.songs-intro__body {
  color: var(--app-text-soft);
  font: var(--app-font-body);
}

.songs-status {
  @include panel;
  padding: var(--app-empty-padding-y) var(--app-empty-padding-x);
  color: var(--app-text-soft);
  font: var(--app-font-body);
  text-align: center;
}

.songs-content,
.song-list {
  display: flex;
  flex-direction: column;
}

.songs-content {
  gap: var(--app-form-gap);
}

.songs-filter-bar {
  @include sticky-section;
  padding: var(--app-space-4) var(--app-space-0);
}

.song-list {
  gap: var(--app-list-gap);
}

.song-card {
  @include panel;
  @include pressable;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-8);
  padding: var(--app-card-padding);
  transition: transform var(--app-duration-normal) var(--app-ease-bounce), opacity var(--app-transition-fast), background-color var(--app-transition-normal), border-color var(--app-transition-normal), box-shadow var(--app-transition-normal);
}

.song-card--pressed {
  opacity: var(--app-press-opacity);
  box-shadow: var(--app-shadow-image);
  transform: scale(var(--app-press-scale-strong)) rotate(-0.6deg);
}

.song-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-8);
}

.song-card__title-group {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.song-card__title {
  color: var(--app-text);
  font: var(--app-font-card-title);
}

.song-card__artist,
.song-card__content,
.song-card__sung-at {
  color: var(--app-text-soft);
  font: var(--app-font-caption);
}

.song-card__artist {
  margin-top: var(--app-space-3);
}

.song-card__content {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.song-card__sung-at {
  color: var(--app-success);
}

.song-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-5);
}

:deep(.song-card__action) {
  min-height: var(--app-control-scale-xs);
  border-radius: var(--app-radius-badge);
  box-shadow: var(--app-shadow-none);
  font: var(--app-font-caption);
}

.song-card__tags {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--app-space-4);
}

.song-card__tag {
  padding: var(--app-space-2) var(--app-space-5);
  border: var(--app-panel-border-width) solid var(--app-border);
  border-radius: var(--app-radius-badge);
  background: var(--app-field);
  color: var(--app-text-soft);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-none);
}

.song-card__tag--wanted {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.song-card__tag--sung {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
}

.song-card__tag--paused {
  border-color: var(--app-warning);
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.song-card__tag--priority {
  background: var(--app-surface-strong);
}

:deep(.songs-state__button) {
  margin-top: var(--app-card-padding);
}
</style>
