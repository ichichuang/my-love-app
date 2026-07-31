// Neutral keyset-cursor helpers shared by paginated list pages. Kept free of
// any business cursor shape beyond the common `createdAt + _id` boundary.
export interface CreatedAtIdCursor {
  createdAt: number
  id: string
}

// CloudBase orders `_id` by plain code-unit order, so the boundary comparison
// must use relational operators; `localeCompare` follows locale collation
// rules and is a different comparison contract.
export const compareCursorIdDesc = (left: string, right: string): number =>
  left === right ? 0 : left > right ? -1 : 1

// Fetch-order comparison for `createdAt DESC, _id DESC` keyset cursors:
// negative when `left` is fetched before `right`.
export const compareCreatedAtIdCursors = (left: CreatedAtIdCursor, right: CreatedAtIdCursor): number =>
  right.createdAt - left.createdAt || compareCursorIdDesc(left.id, right.id)
