import { describe, expect, it } from "vitest"
import { formatBlogDate } from "./blog-date"

describe("blog date formatting", () => {
  it("keeps date-only frontmatter stable across local timezones", () => {
    expect(formatBlogDate("2024-12-02")).toBe("December 2, 2024")
  })

  it("returns invalid source text instead of rendering an invalid date", () => {
    expect(formatBlogDate("not-a-date")).toBe("not-a-date")
  })
})
