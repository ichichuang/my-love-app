import { makeColorRole } from "@/design-system/color-scale"
import type { ColorRole, RomanticPalette, SemanticColorScheme, ShadowColorRole, StatusColorRoles, TextColorRole } from "@/design-system/types"

interface SchemeSeed {
  page: string
  pageSoft: string
  pageMuted: string
  card: string
  cardSoft: string
  cardMuted: string
  input: string
  control: string
  text: TextColorRole
  border: {
    base: string
    muted: string
    strong: string
    divider: string
    disabled: string
    focusRing: string
  }
  primary: {
    base: string
    soft: string
    muted: string
    pressed: string
    active: string
    disabled: string
    border: string
    focusRing: string
  }
  accent: {
    base: string
    soft: string
    muted: string
    pressed: string
    active: string
    disabled: string
    border: string
    focusRing: string
  }
  redPerson: {
    base: string
    soft: string
    muted: string
    pressed: string
    active: string
    disabled: string
    border: string
    focusRing: string
  }
  bluePerson: {
    base: string
    soft: string
    muted: string
    pressed: string
    active: string
    disabled: string
    border: string
    focusRing: string
  }
  status: StatusColorRoles
  overlay: ColorRole
  swatch: ColorRole
  photoBadge: ColorRole
  heartSoft: string
  pageGlow: string
  shadows: ShadowColorRole
}

const role = (
  base: string,
  soft: string,
  muted: string,
  pressed: string,
  active: string,
  foreground: string,
  border: string,
  disabled: string,
  divider: string,
  focusRing: string
): ColorRole =>
  makeColorRole({
    base,
    soft,
    muted,
    pressed,
    active,
    foreground,
    border,
    disabled,
    divider,
    focusRing
  })

const accentRole = (seed: SchemeSeed["primary"], foreground: string): ColorRole =>
  role(
    seed.base,
    seed.soft,
    seed.muted,
    seed.pressed,
    seed.active,
    foreground,
    seed.border,
    seed.disabled,
    seed.border,
    seed.focusRing
  )

const scheme = (seed: SchemeSeed): SemanticColorScheme => ({
  page: role(
    seed.page,
    seed.pageSoft,
    seed.pageMuted,
    seed.pageMuted,
    seed.pageSoft,
    seed.text.primary,
    seed.border.base,
    seed.border.disabled,
    seed.border.divider,
    seed.border.focusRing
  ),
  card: role(
    seed.card,
    seed.cardSoft,
    seed.cardMuted,
    seed.control,
    seed.cardSoft,
    seed.text.primary,
    seed.border.base,
    seed.cardMuted,
    seed.border.divider,
    seed.border.focusRing
  ),
  input: role(
    seed.input,
    seed.cardSoft,
    seed.cardMuted,
    seed.control,
    seed.cardSoft,
    seed.text.primary,
    seed.border.base,
    seed.cardMuted,
    seed.border.divider,
    seed.border.focusRing
  ),
  control: role(
    seed.control,
    seed.cardSoft,
    seed.cardMuted,
    seed.primary.pressed,
    seed.primary.active,
    seed.text.primary,
    seed.border.base,
    seed.cardMuted,
    seed.border.divider,
    seed.primary.focusRing
  ),
  text: seed.text,
  border: seed.border,
  primary: accentRole(seed.primary, seed.text.onPrimary),
  accent: accentRole(seed.accent, seed.text.onAccent),
  redPerson: accentRole(seed.redPerson, seed.text.onPrimary),
  bluePerson: accentRole(seed.bluePerson, seed.text.onAccent),
  status: seed.status,
  overlay: seed.overlay,
  swatch: seed.swatch,
  photoBadge: seed.photoBadge,
  heartSoft: seed.heartSoft,
  pageGlow: seed.pageGlow,
  shadows: seed.shadows
})

const lightText = (inverse = "#ffffff"): TextColorRole => ({
  primary: "#2b2024",
  secondary: "#58484b",
  muted: "#8a7672",
  disabled: "#b7a9a5",
  inverse: "#111827",
  onPrimary: inverse,
  onAccent: inverse,
  onOverlay: "#ffffff"
})

const darkText = (): TextColorRole => ({
  primary: "#f7f0ea",
  secondary: "#d9c8c1",
  muted: "#ad9ba1",
  disabled: "#786b72",
  inverse: "#111827",
  onPrimary: "#111827",
  onAccent: "#111827",
  onOverlay: "#ffffff"
})

const lightStatus = (focusRing: string): StatusColorRoles => ({
  danger: role("#9f2f3e", "#f9d9dd", "#f7edef", "#7f2431", "#f4ccd2", "#ffffff", "rgba(159, 47, 62, 0.2)", "#e6b6bd", "rgba(159, 47, 62, 0.14)", focusRing),
  warning: role("#b7791f", "#f7e4bd", "#fbf1dd", "#925f16", "#f1d49c", "#ffffff", "rgba(183, 121, 31, 0.22)", "#dfc89f", "rgba(183, 121, 31, 0.14)", focusRing),
  success: role("#43866a", "#d5ecdf", "#edf7f2", "#2f684f", "#c3e2d0", "#ffffff", "rgba(67, 134, 106, 0.22)", "#b7d6c4", "rgba(67, 134, 106, 0.14)", focusRing),
  info: role("#4f87aa", "#d8eaf5", "#eef6fb", "#2d5f7b", "#c8e0ee", "#ffffff", "rgba(79, 135, 170, 0.22)", "#bbd6e6", "rgba(79, 135, 170, 0.14)", focusRing)
})

const darkStatus = (focusRing: string): StatusColorRoles => ({
  danger: role("#ee8b93", "rgba(238, 139, 147, 0.2)", "rgba(238, 139, 147, 0.12)", "#f3a3aa", "rgba(238, 139, 147, 0.28)", "#111827", "rgba(238, 139, 147, 0.28)", "rgba(238, 139, 147, 0.1)", "rgba(238, 139, 147, 0.18)", focusRing),
  warning: role("#deb66b", "rgba(222, 182, 107, 0.2)", "rgba(222, 182, 107, 0.12)", "#e8c985", "rgba(222, 182, 107, 0.28)", "#111827", "rgba(222, 182, 107, 0.28)", "rgba(222, 182, 107, 0.1)", "rgba(222, 182, 107, 0.18)", focusRing),
  success: role("#88bea3", "rgba(136, 190, 163, 0.2)", "rgba(136, 190, 163, 0.12)", "#9ed0b7", "rgba(136, 190, 163, 0.28)", "#111827", "rgba(136, 190, 163, 0.28)", "rgba(136, 190, 163, 0.1)", "rgba(136, 190, 163, 0.18)", focusRing),
  info: role("#86b8d6", "rgba(134, 184, 214, 0.2)", "rgba(134, 184, 214, 0.12)", "#9ac6dd", "rgba(134, 184, 214, 0.28)", "#111827", "rgba(134, 184, 214, 0.28)", "rgba(134, 184, 214, 0.1)", "rgba(134, 184, 214, 0.18)", focusRing)
})

const lightOverlay = role(
  "rgba(43, 32, 36, 0.28)",
  "rgba(43, 32, 36, 0.18)",
  "rgba(43, 32, 36, 0.1)",
  "rgba(43, 32, 36, 0.72)",
  "rgba(43, 32, 36, 0.62)",
  "#ffffff",
  "rgba(255, 255, 255, 0.48)",
  "rgba(43, 32, 36, 0.08)",
  "rgba(255, 255, 255, 0.24)",
  "rgba(255, 255, 255, 0.86)"
)

const darkOverlay = role(
  "rgba(16, 24, 39, 0.42)",
  "rgba(16, 24, 39, 0.28)",
  "rgba(16, 24, 39, 0.16)",
  "rgba(16, 24, 39, 0.74)",
  "rgba(16, 24, 39, 0.66)",
  "#ffffff",
  "rgba(255, 255, 255, 0.42)",
  "rgba(16, 24, 39, 0.1)",
  "rgba(255, 255, 255, 0.2)",
  "rgba(255, 255, 255, 0.86)"
)

const makePalette = (
  id: string,
  name: string,
  description: string,
  preview: RomanticPalette["preview"],
  light: SchemeSeed,
  dark: SchemeSeed
): RomanticPalette => ({
  id,
  name,
  description,
  preview,
  schemes: {
    light: scheme(light),
    dark: scheme(dark)
  }
})

export const romanticPalettes: RomanticPalette[] = [
  makePalette(
    "warm-red-blue",
    "暖白红蓝",
    "默认手绘小人配色",
    {
      primary: "#bd5a62",
      accent: "#4f87aa",
      glow: "rgba(189, 90, 98, 0.16)"
    },
    {
      page: "#fffaf3",
      pageSoft: "#f7efe3",
      pageMuted: "#efe0d2",
      card: "#ffffff",
      cardSoft: "#fffdfb",
      cardMuted: "#f8eee7",
      input: "#fffefa",
      control: "#fff7f1",
      text: lightText(),
      border: {
        base: "rgba(68, 42, 48, 0.14)",
        muted: "rgba(68, 42, 48, 0.1)",
        strong: "rgba(68, 42, 48, 0.22)",
        divider: "rgba(68, 42, 48, 0.12)",
        disabled: "rgba(68, 42, 48, 0.08)",
        focusRing: "rgba(189, 90, 98, 0.38)"
      },
      primary: {
        base: "#bd5a62",
        soft: "#f9d7d6",
        muted: "#fff1f1",
        pressed: "#8f3846",
        active: "#f3c8ca",
        disabled: "#e6b6bd",
        border: "rgba(189, 90, 98, 0.28)",
        focusRing: "rgba(189, 90, 98, 0.38)"
      },
      accent: {
        base: "#4f87aa",
        soft: "#d8eaf5",
        muted: "#eef6fb",
        pressed: "#2d5f7b",
        active: "#c8e0ee",
        disabled: "#bbd6e6",
        border: "rgba(79, 135, 170, 0.28)",
        focusRing: "rgba(79, 135, 170, 0.36)"
      },
      redPerson: {
        base: "#bd5a62",
        soft: "#f9d7d6",
        muted: "#fff1f1",
        pressed: "#8f3846",
        active: "#f3c8ca",
        disabled: "#e6b6bd",
        border: "rgba(189, 90, 98, 0.28)",
        focusRing: "rgba(189, 90, 98, 0.38)"
      },
      bluePerson: {
        base: "#4f87aa",
        soft: "#d8eaf5",
        muted: "#eef6fb",
        pressed: "#2d5f7b",
        active: "#c8e0ee",
        disabled: "#bbd6e6",
        border: "rgba(79, 135, 170, 0.28)",
        focusRing: "rgba(79, 135, 170, 0.36)"
      },
      status: lightStatus("rgba(189, 90, 98, 0.34)"),
      overlay: lightOverlay,
      swatch: role("#bd5a62", "#f9d7d6", "#fff1f1", "#8f3846", "rgba(255, 255, 255, 0.26)", "#ffffff", "rgba(255, 255, 255, 0.86)", "rgba(255, 255, 255, 0.34)", "rgba(255, 255, 255, 0.28)", "rgba(255, 255, 255, 0.9)"),
      photoBadge: role("rgba(43, 32, 36, 0.28)", "rgba(43, 32, 36, 0.18)", "rgba(43, 32, 36, 0.1)", "rgba(43, 32, 36, 0.72)", "rgba(43, 32, 36, 0.62)", "#ffffff", "rgba(255, 255, 255, 0.48)", "rgba(43, 32, 36, 0.08)", "rgba(255, 255, 255, 0.24)", "rgba(255, 255, 255, 0.86)"),
      heartSoft: "#f7dce4",
      pageGlow: "rgba(189, 90, 98, 0.16)",
      shadows: {
        card: "0 24rpx 80rpx rgba(85, 44, 50, 0.14)",
        floating: "0 28rpx 96rpx rgba(85, 44, 50, 0.18)",
        button: "0 12rpx 28rpx rgba(85, 44, 50, 0.12)",
        image: "0 12rpx 30rpx rgba(85, 44, 50, 0.1)",
        logo: "0 16rpx 42rpx rgba(85, 44, 50, 0.12)"
      }
    },
    {
      page: "#101827",
      pageSoft: "#1b2536",
      pageMuted: "#263246",
      card: "#202a3a",
      cardSoft: "#263246",
      cardMuted: "#182234",
      input: "#182234",
      control: "#263246",
      text: darkText(),
      border: {
        base: "rgba(247, 240, 234, 0.14)",
        muted: "rgba(247, 240, 234, 0.1)",
        strong: "rgba(247, 240, 234, 0.24)",
        divider: "rgba(247, 240, 234, 0.12)",
        disabled: "rgba(247, 240, 234, 0.08)",
        focusRing: "rgba(223, 123, 132, 0.42)"
      },
      primary: {
        base: "#df7b84",
        soft: "rgba(223, 123, 132, 0.2)",
        muted: "rgba(223, 123, 132, 0.12)",
        pressed: "#f0a4aa",
        active: "rgba(223, 123, 132, 0.28)",
        disabled: "rgba(223, 123, 132, 0.1)",
        border: "rgba(223, 123, 132, 0.3)",
        focusRing: "rgba(223, 123, 132, 0.42)"
      },
      accent: {
        base: "#86b8d6",
        soft: "rgba(134, 184, 214, 0.2)",
        muted: "rgba(134, 184, 214, 0.12)",
        pressed: "#9ac6dd",
        active: "rgba(134, 184, 214, 0.28)",
        disabled: "rgba(134, 184, 214, 0.1)",
        border: "rgba(134, 184, 214, 0.3)",
        focusRing: "rgba(134, 184, 214, 0.4)"
      },
      redPerson: {
        base: "#df7b84",
        soft: "rgba(223, 123, 132, 0.2)",
        muted: "rgba(223, 123, 132, 0.12)",
        pressed: "#f0a4aa",
        active: "rgba(223, 123, 132, 0.28)",
        disabled: "rgba(223, 123, 132, 0.1)",
        border: "rgba(223, 123, 132, 0.3)",
        focusRing: "rgba(223, 123, 132, 0.42)"
      },
      bluePerson: {
        base: "#86b8d6",
        soft: "rgba(134, 184, 214, 0.2)",
        muted: "rgba(134, 184, 214, 0.12)",
        pressed: "#9ac6dd",
        active: "rgba(134, 184, 214, 0.28)",
        disabled: "rgba(134, 184, 214, 0.1)",
        border: "rgba(134, 184, 214, 0.3)",
        focusRing: "rgba(134, 184, 214, 0.4)"
      },
      status: darkStatus("rgba(223, 123, 132, 0.42)"),
      overlay: darkOverlay,
      swatch: role("#df7b84", "rgba(223, 123, 132, 0.2)", "rgba(223, 123, 132, 0.12)", "#f0a4aa", "rgba(255, 255, 255, 0.22)", "#ffffff", "rgba(255, 255, 255, 0.86)", "rgba(255, 255, 255, 0.22)", "rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.86)"),
      photoBadge: role("rgba(16, 24, 39, 0.42)", "rgba(16, 24, 39, 0.28)", "rgba(16, 24, 39, 0.16)", "rgba(16, 24, 39, 0.74)", "rgba(16, 24, 39, 0.66)", "#ffffff", "rgba(255, 255, 255, 0.42)", "rgba(16, 24, 39, 0.1)", "rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.86)"),
      heartSoft: "rgba(229, 168, 184, 0.18)",
      pageGlow: "rgba(223, 123, 132, 0.16)",
      shadows: {
        card: "0 24rpx 72rpx rgba(0, 0, 0, 0.24)",
        floating: "0 28rpx 96rpx rgba(0, 0, 0, 0.34)",
        button: "0 12rpx 28rpx rgba(0, 0, 0, 0.2)",
        image: "0 12rpx 30rpx rgba(0, 0, 0, 0.2)",
        logo: "0 16rpx 42rpx rgba(0, 0, 0, 0.22)"
      }
    }
  ),
  makePalette(
    "soft-pink-blue",
    "软粉蓝",
    "更轻的粉蓝记忆感",
    {
      primary: "#c96f86",
      accent: "#6da1c2",
      glow: "rgba(201, 111, 134, 0.15)"
    },
    {
      page: "#fff8f6",
      pageSoft: "#fff0ef",
      pageMuted: "#f7e5e7",
      card: "#fffefe",
      cardSoft: "#fff7fa",
      cardMuted: "#f8ecef",
      input: "#fffafb",
      control: "#fff3f6",
      text: lightText(),
      border: {
        base: "rgba(77, 48, 59, 0.13)",
        muted: "rgba(77, 48, 59, 0.09)",
        strong: "rgba(77, 48, 59, 0.22)",
        divider: "rgba(77, 48, 59, 0.12)",
        disabled: "rgba(77, 48, 59, 0.08)",
        focusRing: "rgba(201, 111, 134, 0.36)"
      },
      primary: {
        base: "#c96f86",
        soft: "#f7dce4",
        muted: "#fff3f6",
        pressed: "#9b435d",
        active: "#f0ccd7",
        disabled: "#e8bdc9",
        border: "rgba(201, 111, 134, 0.28)",
        focusRing: "rgba(201, 111, 134, 0.36)"
      },
      accent: {
        base: "#6da1c2",
        soft: "#dcedf6",
        muted: "#f0f8fc",
        pressed: "#477e9f",
        active: "#cde4f0",
        disabled: "#bfd9e8",
        border: "rgba(109, 161, 194, 0.28)",
        focusRing: "rgba(109, 161, 194, 0.36)"
      },
      redPerson: {
        base: "#c96f86",
        soft: "#f7dce4",
        muted: "#fff3f6",
        pressed: "#9b435d",
        active: "#f0ccd7",
        disabled: "#e8bdc9",
        border: "rgba(201, 111, 134, 0.28)",
        focusRing: "rgba(201, 111, 134, 0.36)"
      },
      bluePerson: {
        base: "#6da1c2",
        soft: "#dcedf6",
        muted: "#f0f8fc",
        pressed: "#477e9f",
        active: "#cde4f0",
        disabled: "#bfd9e8",
        border: "rgba(109, 161, 194, 0.28)",
        focusRing: "rgba(109, 161, 194, 0.36)"
      },
      status: lightStatus("rgba(201, 111, 134, 0.34)"),
      overlay: lightOverlay,
      swatch: role("#c96f86", "#f7dce4", "#fff3f6", "#9b435d", "rgba(255, 255, 255, 0.26)", "#ffffff", "rgba(255, 255, 255, 0.86)", "rgba(255, 255, 255, 0.34)", "rgba(255, 255, 255, 0.28)", "rgba(255, 255, 255, 0.9)"),
      photoBadge: role("rgba(43, 32, 36, 0.28)", "rgba(43, 32, 36, 0.18)", "rgba(43, 32, 36, 0.1)", "rgba(43, 32, 36, 0.72)", "rgba(43, 32, 36, 0.62)", "#ffffff", "rgba(255, 255, 255, 0.48)", "rgba(43, 32, 36, 0.08)", "rgba(255, 255, 255, 0.24)", "rgba(255, 255, 255, 0.86)"),
      heartSoft: "#fff3f6",
      pageGlow: "rgba(201, 111, 134, 0.15)",
      shadows: {
        card: "0 24rpx 80rpx rgba(82, 47, 58, 0.13)",
        floating: "0 28rpx 96rpx rgba(82, 47, 58, 0.17)",
        button: "0 12rpx 28rpx rgba(82, 47, 58, 0.12)",
        image: "0 12rpx 30rpx rgba(82, 47, 58, 0.1)",
        logo: "0 16rpx 42rpx rgba(82, 47, 58, 0.12)"
      }
    },
    {
      page: "#131722",
      pageSoft: "#222634",
      pageMuted: "#2a2f3d",
      card: "#242938",
      cardSoft: "#2a2f3d",
      cardMuted: "#1b2030",
      input: "#1b2030",
      control: "#2a2f3d",
      text: darkText(),
      border: {
        base: "rgba(247, 240, 234, 0.13)",
        muted: "rgba(247, 240, 234, 0.09)",
        strong: "rgba(247, 240, 234, 0.24)",
        divider: "rgba(247, 240, 234, 0.12)",
        disabled: "rgba(247, 240, 234, 0.08)",
        focusRing: "rgba(233, 160, 179, 0.42)"
      },
      primary: {
        base: "#e9a0b3",
        soft: "rgba(233, 160, 179, 0.2)",
        muted: "rgba(233, 160, 179, 0.12)",
        pressed: "#f2b8c7",
        active: "rgba(233, 160, 179, 0.28)",
        disabled: "rgba(233, 160, 179, 0.1)",
        border: "rgba(233, 160, 179, 0.3)",
        focusRing: "rgba(233, 160, 179, 0.42)"
      },
      accent: {
        base: "#9ac6dd",
        soft: "rgba(154, 198, 221, 0.2)",
        muted: "rgba(154, 198, 221, 0.12)",
        pressed: "#abd3e6",
        active: "rgba(154, 198, 221, 0.28)",
        disabled: "rgba(154, 198, 221, 0.1)",
        border: "rgba(154, 198, 221, 0.3)",
        focusRing: "rgba(154, 198, 221, 0.4)"
      },
      redPerson: {
        base: "#e9a0b3",
        soft: "rgba(233, 160, 179, 0.2)",
        muted: "rgba(233, 160, 179, 0.12)",
        pressed: "#f2b8c7",
        active: "rgba(233, 160, 179, 0.28)",
        disabled: "rgba(233, 160, 179, 0.1)",
        border: "rgba(233, 160, 179, 0.3)",
        focusRing: "rgba(233, 160, 179, 0.42)"
      },
      bluePerson: {
        base: "#9ac6dd",
        soft: "rgba(154, 198, 221, 0.2)",
        muted: "rgba(154, 198, 221, 0.12)",
        pressed: "#abd3e6",
        active: "rgba(154, 198, 221, 0.28)",
        disabled: "rgba(154, 198, 221, 0.1)",
        border: "rgba(154, 198, 221, 0.3)",
        focusRing: "rgba(154, 198, 221, 0.4)"
      },
      status: darkStatus("rgba(233, 160, 179, 0.42)"),
      overlay: darkOverlay,
      swatch: role("#e9a0b3", "rgba(233, 160, 179, 0.2)", "rgba(233, 160, 179, 0.12)", "#f2b8c7", "rgba(255, 255, 255, 0.22)", "#ffffff", "rgba(255, 255, 255, 0.86)", "rgba(255, 255, 255, 0.22)", "rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.86)"),
      photoBadge: role("rgba(16, 24, 39, 0.42)", "rgba(16, 24, 39, 0.28)", "rgba(16, 24, 39, 0.16)", "rgba(16, 24, 39, 0.74)", "rgba(16, 24, 39, 0.66)", "#ffffff", "rgba(255, 255, 255, 0.42)", "rgba(16, 24, 39, 0.1)", "rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.86)"),
      heartSoft: "rgba(233, 160, 179, 0.18)",
      pageGlow: "rgba(233, 160, 179, 0.14)",
      shadows: {
        card: "0 24rpx 72rpx rgba(0, 0, 0, 0.24)",
        floating: "0 28rpx 96rpx rgba(0, 0, 0, 0.34)",
        button: "0 12rpx 28rpx rgba(0, 0, 0, 0.2)",
        image: "0 12rpx 30rpx rgba(0, 0, 0, 0.2)",
        logo: "0 16rpx 42rpx rgba(0, 0, 0, 0.22)"
      }
    }
  ),
  makePalette(
    "night-red-blue",
    "夜航红蓝",
    "深色友好的红蓝系统",
    {
      primary: "#a9505f",
      accent: "#3f7897",
      glow: "rgba(63, 120, 151, 0.14)"
    },
    {
      page: "#fbf5ee",
      pageSoft: "#f0e7dc",
      pageMuted: "#e7d8cb",
      card: "#fffdfa",
      cardSoft: "#fbf6f0",
      cardMuted: "#f0e5dc",
      input: "#fffaf5",
      control: "#f8eee7",
      text: lightText(),
      border: {
        base: "rgba(36, 50, 71, 0.16)",
        muted: "rgba(36, 50, 71, 0.1)",
        strong: "rgba(36, 50, 71, 0.24)",
        divider: "rgba(36, 50, 71, 0.12)",
        disabled: "rgba(36, 50, 71, 0.08)",
        focusRing: "rgba(169, 80, 95, 0.36)"
      },
      primary: {
        base: "#a9505f",
        soft: "#f1ced3",
        muted: "#fbebee",
        pressed: "#7f3242",
        active: "#e7bdc5",
        disabled: "#d8adb6",
        border: "rgba(169, 80, 95, 0.28)",
        focusRing: "rgba(169, 80, 95, 0.36)"
      },
      accent: {
        base: "#3f7897",
        soft: "#d4e8f2",
        muted: "#edf6fb",
        pressed: "#295a74",
        active: "#c3deec",
        disabled: "#b4d1e1",
        border: "rgba(63, 120, 151, 0.28)",
        focusRing: "rgba(63, 120, 151, 0.36)"
      },
      redPerson: {
        base: "#a9505f",
        soft: "#f1ced3",
        muted: "#fbebee",
        pressed: "#7f3242",
        active: "#e7bdc5",
        disabled: "#d8adb6",
        border: "rgba(169, 80, 95, 0.28)",
        focusRing: "rgba(169, 80, 95, 0.36)"
      },
      bluePerson: {
        base: "#3f7897",
        soft: "#d4e8f2",
        muted: "#edf6fb",
        pressed: "#295a74",
        active: "#c3deec",
        disabled: "#b4d1e1",
        border: "rgba(63, 120, 151, 0.28)",
        focusRing: "rgba(63, 120, 151, 0.36)"
      },
      status: lightStatus("rgba(169, 80, 95, 0.34)"),
      overlay: lightOverlay,
      swatch: role("#a9505f", "#f1ced3", "#fbebee", "#7f3242", "rgba(255, 255, 255, 0.26)", "#ffffff", "rgba(255, 255, 255, 0.86)", "rgba(255, 255, 255, 0.34)", "rgba(255, 255, 255, 0.28)", "rgba(255, 255, 255, 0.9)"),
      photoBadge: role("rgba(43, 32, 36, 0.28)", "rgba(43, 32, 36, 0.18)", "rgba(43, 32, 36, 0.1)", "rgba(43, 32, 36, 0.72)", "rgba(43, 32, 36, 0.62)", "#ffffff", "rgba(255, 255, 255, 0.48)", "rgba(43, 32, 36, 0.08)", "rgba(255, 255, 255, 0.24)", "rgba(255, 255, 255, 0.86)"),
      heartSoft: "#ead5dd",
      pageGlow: "rgba(63, 120, 151, 0.14)",
      shadows: {
        card: "0 24rpx 80rpx rgba(36, 50, 71, 0.13)",
        floating: "0 28rpx 96rpx rgba(36, 50, 71, 0.17)",
        button: "0 12rpx 28rpx rgba(36, 50, 71, 0.12)",
        image: "0 12rpx 30rpx rgba(36, 50, 71, 0.1)",
        logo: "0 16rpx 42rpx rgba(36, 50, 71, 0.12)"
      }
    },
    {
      page: "#0f1726",
      pageSoft: "#18243a",
      pageMuted: "#212d43",
      card: "#212d43",
      cardSoft: "#293750",
      cardMuted: "#18243a",
      input: "#18243a",
      control: "#293750",
      text: darkText(),
      border: {
        base: "rgba(247, 240, 234, 0.14)",
        muted: "rgba(247, 240, 234, 0.09)",
        strong: "rgba(247, 240, 234, 0.24)",
        divider: "rgba(247, 240, 234, 0.12)",
        disabled: "rgba(247, 240, 234, 0.08)",
        focusRing: "rgba(226, 138, 149, 0.42)"
      },
      primary: {
        base: "#e28a95",
        soft: "rgba(226, 138, 149, 0.2)",
        muted: "rgba(226, 138, 149, 0.12)",
        pressed: "#f0a0aa",
        active: "rgba(226, 138, 149, 0.28)",
        disabled: "rgba(226, 138, 149, 0.1)",
        border: "rgba(226, 138, 149, 0.3)",
        focusRing: "rgba(226, 138, 149, 0.42)"
      },
      accent: {
        base: "#7fb2cf",
        soft: "rgba(127, 178, 207, 0.2)",
        muted: "rgba(127, 178, 207, 0.12)",
        pressed: "#91c0da",
        active: "rgba(127, 178, 207, 0.28)",
        disabled: "rgba(127, 178, 207, 0.1)",
        border: "rgba(127, 178, 207, 0.3)",
        focusRing: "rgba(127, 178, 207, 0.4)"
      },
      redPerson: {
        base: "#e28a95",
        soft: "rgba(226, 138, 149, 0.2)",
        muted: "rgba(226, 138, 149, 0.12)",
        pressed: "#f0a0aa",
        active: "rgba(226, 138, 149, 0.28)",
        disabled: "rgba(226, 138, 149, 0.1)",
        border: "rgba(226, 138, 149, 0.3)",
        focusRing: "rgba(226, 138, 149, 0.42)"
      },
      bluePerson: {
        base: "#7fb2cf",
        soft: "rgba(127, 178, 207, 0.2)",
        muted: "rgba(127, 178, 207, 0.12)",
        pressed: "#91c0da",
        active: "rgba(127, 178, 207, 0.28)",
        disabled: "rgba(127, 178, 207, 0.1)",
        border: "rgba(127, 178, 207, 0.3)",
        focusRing: "rgba(127, 178, 207, 0.4)"
      },
      status: darkStatus("rgba(226, 138, 149, 0.42)"),
      overlay: darkOverlay,
      swatch: role("#e28a95", "rgba(226, 138, 149, 0.2)", "rgba(226, 138, 149, 0.12)", "#f0a0aa", "rgba(255, 255, 255, 0.22)", "#ffffff", "rgba(255, 255, 255, 0.86)", "rgba(255, 255, 255, 0.22)", "rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.86)"),
      photoBadge: role("rgba(16, 24, 39, 0.42)", "rgba(16, 24, 39, 0.28)", "rgba(16, 24, 39, 0.16)", "rgba(16, 24, 39, 0.74)", "rgba(16, 24, 39, 0.66)", "#ffffff", "rgba(255, 255, 255, 0.42)", "rgba(16, 24, 39, 0.1)", "rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.86)"),
      heartSoft: "rgba(226, 138, 149, 0.18)",
      pageGlow: "rgba(127, 178, 207, 0.14)",
      shadows: {
        card: "0 24rpx 72rpx rgba(0, 0, 0, 0.24)",
        floating: "0 28rpx 96rpx rgba(0, 0, 0, 0.34)",
        button: "0 12rpx 28rpx rgba(0, 0, 0, 0.2)",
        image: "0 12rpx 30rpx rgba(0, 0, 0, 0.2)",
        logo: "0 16rpx 42rpx rgba(0, 0, 0, 0.22)"
      }
    }
  )
]

export const defaultPalette = romanticPalettes[0]

export const getPaletteById = (paletteId: string): RomanticPalette =>
  romanticPalettes.find((palette) => palette.id === paletteId) ?? defaultPalette

export const hasPalette = (paletteId: string): boolean =>
  romanticPalettes.some((palette) => palette.id === paletteId)
