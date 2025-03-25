# @liam-hq/cli

## 0.5.1

### Patch Changes

- [#957](https://github.com/liam-hq/liam/pull/957) - 🐛 Enhance tests for long SQL statements and fix errorOffset handling. ref. https://github.com/liam-hq/liam/issues/874 / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!

## 0.5.0

### Minor Changes

- [#908](https://github.com/liam-hq/liam/pull/908) - ✨ Add --output-dir option to specify output directory / Thanks [@tnagatomi](https://github.com/tnagatomi)!

### Patch Changes

- [#909](https://github.com/liam-hq/liam/pull/909) - ✨ Set table show mode in related tables to TABLE_NAME / Thanks [@tnyo43](https://github.com/tnyo43)!

## 0.4.6

### Patch Changes

- [#819](https://github.com/liam-hq/liam/pull/819) - 🔧 fix: update vite and fumadocs-mdx to latest versions / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!
- [#819](https://github.com/liam-hq/liam/pull/819) - 🔧 fix: update vite and fumadocs-mdx to latest versions / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!

## 0.4.5

### Patch Changes

- [#806](https://github.com/liam-hq/liam/pull/806) - ✨ Allow sidebar width adjustment / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!
- [#813](https://github.com/liam-hq/liam/pull/813) - 🔧 fix runPreprocess to support undefined format / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!
- [#806](https://github.com/liam-hq/liam/pull/806) - ✨ Allow sidebar width adjustment / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!

## 0.4.4

### Patch Changes

- [#792](https://github.com/liam-hq/liam/pull/792) - ♻️ Added a tooltip for truncated table names to improve usability. / Thanks [@prakha](https://github.com/prakha)!
- [#759](https://github.com/liam-hq/liam/pull/759) - ♻️ Reorganize erd-core Structure: Parallelize ERDContent & Consolidate Shared Utilities in features/erd-core / Thanks [@junkisai](https://github.com/junkisai)!
- [#798](https://github.com/liam-hq/liam/pull/798) - 🐛 integrate user editing state into related tables component / Thanks [@junkisai](https://github.com/junkisai)!
- [#797](https://github.com/liam-hq/liam/pull/797) - 🐛 When nodes without relationships are present, display only that node in RelatedTables. / Thanks [@junkisai](https://github.com/junkisai)!

## 0.4.3

### Patch Changes

- [#760](https://github.com/liam-hq/liam/pull/760) - ✨ Made `--format` optional in CLI command / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!
- [#699](https://github.com/liam-hq/liam/pull/699) - ♻️ Refactor SQL chunk processing to reduce memory errors. / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!

Increases the likelihood of processing larger `.sql` files without encountering memory errors.

- [#767](https://github.com/liam-hq/liam/pull/767) - ✨ Support field name mapping with @map in Prisma / Thanks [@tnyo43](https://github.com/tnyo43)!

## 0.4.2

### Patch Changes

- [#754](https://github.com/liam-hq/liam/pull/754) - 🐛 Fix file operations to support Windows compatibility. ref. https://github.com/liam-hq/liam/issues/751 / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!

## 0.4.1

### Patch Changes

- [#746](https://github.com/liam-hq/liam/pull/746) - 🐛 Exclude hidden and showMode query parameters from ERDContent rendering in RelatedTables / Thanks [@junkisai](https://github.com/junkisai)!
- [#746](https://github.com/liam-hq/liam/pull/746) - 🐛 Exclude hidden and showMode query parameters from ERDContent rendering in RelatedTables / Thanks [@junkisai](https://github.com/junkisai)!

## 0.4.0

### Minor Changes

- [#739](https://github.com/liam-hq/liam/pull/739) - ✨ Pre-calculate layout for Related Tables before displaying in Main Area / Thanks [@junkisai](https://github.com/junkisai)!

### Patch Changes

- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Swap useReactflow's fitView() with a custom fitView() function / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Remove useSyncHiddenNodesChange hook and update VisibilityButton to manage node visibility directly / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Consolidate table selection/deselection logic into useTableSelection hook / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - 🐛 Fix RelatedTables additional buttons prop rendering / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Limit useAutoLayout functionality to layout calculations only / Thanks [@junkisai](https://github.com/junkisai)!
- [#726](https://github.com/liam-hq/liam/pull/726) - feat: expose all useReactflow functions in useCustomReactflow and replace direct useReactflow usages / Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)!
- [#739](https://github.com/liam-hq/liam/pull/739) - ✨ Pre-calculate layout for Related Tables before displaying in Main Area / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Swap useReactflow's fitView() with a custom fitView() function / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Remove useSyncHiddenNodesChange hook and update VisibilityButton to manage node visibility directly / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Consolidate table selection/deselection logic into useTableSelection hook / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - 🐛 Fix RelatedTables additional buttons prop rendering / Thanks [@junkisai](https://github.com/junkisai)!
- [#708](https://github.com/liam-hq/liam/pull/708) - ♻️ Limit useAutoLayout functionality to layout calculations only / Thanks [@junkisai](https://github.com/junkisai)!

## 0.3.6

### Patch Changes

- [#713](https://github.com/liam-hq/liam/pull/713) - 🐛 Fix hydration error in Mobile / Thanks [@MH4GF](https://github.com/MH4GF)!

## 0.3.5

### Patch Changes

- [#696](https://github.com/liam-hq/liam/pull/696) - 🐛 Version bump failed, re-run / Thanks [@MH4GF](https://github.com/MH4GF)!

## 0.3.4

### Patch Changes

- [#677](https://github.com/liam-hq/liam/pull/677) - 🐛 Removed a green dot on the left top when it rendered / Thanks [@tnyo43](https://github.com/tnyo43)!
- [#680](https://github.com/liam-hq/liam/pull/680) - 🎨 Add Mr.Jack svg to NetworkError / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!
- [#671](https://github.com/liam-hq/liam/pull/671) - 🐛 Improve ERD auto-layout rendering with state-based approach / Thanks [@junkisai](https://github.com/junkisai)!
- [#677](https://github.com/liam-hq/liam/pull/677) - 🐛 Removed a green dot on the left top when it rendered / Thanks [@tnyo43](https://github.com/tnyo43)!
- [#680](https://github.com/liam-hq/liam/pull/680) - 🎨 Add Mr.Jack svg to NetworkError / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!
- [#690](https://github.com/liam-hq/liam/pull/690) - ✨ Disable selectionOnDrag on touch devices / Thanks [@MH4GF](https://github.com/MH4GF)!
- [#673](https://github.com/liam-hq/liam/pull/673) - 🐛 Adjust the item height calculation in the Columns component. / Thanks [@MH4GF](https://github.com/MH4GF)!
- [#671](https://github.com/liam-hq/liam/pull/671) - 🐛 Improve ERD auto-layout rendering with state-based approach / Thanks [@junkisai](https://github.com/junkisai)!

## 0.3.3

### Patch Changes

- c69f975: 🚸 New Mobile Toolbar's `ShowModeMenu`
- 0675da3: 💄Improve version display styling with flexbox alignment
- f607e58: 🐛 Fix AppBar scrolling issue on mobile safari view
- da96e73: ✨ Add close functionality for mobile toolbar when clicking outside
- 5a9ffd4: 🔧Add ExternalLink flag to some LeftPane menu items
- 232382c: 🎨 Hide Sidebar trigger at canvas on mobile view
- 8a19c1e: 💄 Adjust UI of LeftPane on mobile widths
- ad6e8bb: 🐛 Refactor ERD renderer toolbar positioning and visibility
- 2403f2c: Fix sticky header z-index for Related Tables
- d8c46c3: 💄 Refactor Comment component markup and styling
- ec8d044: 🎨 Make SidebarFooter appear after scrolling when table list overflows
- ba092dc: ➕ Bump _path-to-regexp_ from 0.1.10 to 0.1.12 along with a few other packages

## 0.3.2

### Patch Changes

- 17d61e8: 🐛 Fixed the 'data-erd' attribute in the active table to make type names visible
- 7904b7e: 💄 Change position of info icon to error display for mobile view
- 21d5609: 🐛 remove meaningless connection

## 0.3.1

### Patch Changes

- aecb91a: ✨ Implement collapsible columns in ERD table detail view
- 56fab7f: ♻︎ Simplify tbls schema.json generation instructions
- d7bbb7f: 🚸 Add new Mobilie Toolbar
- ee5f79e: ✨ Add support for hidden nodes in URL state management
- f3a8940: 💄 Add styling for mobile widths
- 69e391a: 💄 Enhance mobile Toolbar animation behavior and improve UI responsiveness
- fe2af29: ✨ Add toggle function for all sections in TableDetailDrawer
- 203936a: 💄 Update styles for responsive design and sticky headers in TableDetail components
- 47a7cdb: ✨ Add browser back and forward support for showMode
- 93fc858: ♻️ Refactor TableDetail components to use CollapsibleHeader
- 553c40f: 💄 Improve error display responsive styling

## 0.3.0

### Minor Changes

- e87929c: ✨Add tbls, MySQL, SQLite, BigQuery setup to init command

### Patch Changes

- 18db4ca: 💄Fixed icon size
- 70741a0: ✨ Add support for primary key constraints in tbls parser
- 44975cc: ✨ Add support for default values in tbls parser and tests
- 9cba809: 💄 Add icons to the table detail component and update the header style.

## 0.2.2

### Patch Changes

- 2002de6: ✨ Add initial tbls parser
- 5417568: ✨ Add support for unique column constraints in tbls parser
- 7085005: 🔧 Implement convertToPostgresColumnType function for PostgreSQL type conversion and update parser to utilize it
- cc4a49b: ✨ Support relationship cardinality parsing for tbls schema
- 971143e: 🔧 Update Prisma column types to match PostgreSQL standards
- 3dbc04c: ✨ Add JSON Schema to Zod generation for tbls schema

## 0.2.1

### Patch Changes

- 2137216: 💄 Add elk.alignment property to node conversion for centralized layout
- 76bc7be: 🚸 Make node width variable to accommodate table/column name and type
- 7a8dd85: 💬 tweak: Rename default placeholder .sql file to 'schema.sql'
- 18e75a3: 🚧 Prevent omission of TableColumn

## 0.2.0

### Minor Changes

- 4ac6174: ✨ Support glob pattern as input paths

### Patch Changes

- e63a29d: ✨ Support index for Prisma parser
- 65194ce: ✅ Add tests for unique fields in Prisma model
- d243467: ✨ Support on delete fk constraint in Prisma parser

## 0.1.0

### Minor Changes

- d5713ff: 🎉 Bumped minor version for public announcement

### Patch Changes

- 77c079a: ✨ Add support for column comments in Prisma schema
- b31ad8e: 🐛 fix: exclude model type from columns in Prisma parser
- 851e966: 🐛 Fix prisma relationship direction
- 2d8a20f: ✨ Add Open Graph image metadata for ERD pages and cli pages
- bd2a4ca: 🚸 Updated CLI help text to dynamically display supported formats
- 0fea145: ✨️ feat(db-structure): support parsing default values in Prisma schema
- 433df21: ✨ Support Prisma relationship cardinality
- 577ee06: ✨ Add support for table comments in Prisma schema

## 0.0.25

### Patch Changes

- 20752a3: 🐛 Update `erd build` to exit with status 1 if there is at least one error
- 60881ef: ✨ initCommand: Add `Drizzle` intruction support and `Other` option
- 48ae2c2: 🐛 Update TableCounter to count only table nodes
- 3f211a4: 🚸 Improve success/error message at `erd build`

  - Clarified the success message when an ERD is generated.
  - Included a troubleshooting URL when errors occur

## 0.0.24

### Patch Changes

- c32feec: ♻️ Refactor initCommand to split Inquirer prompts, allowing conditional questions for pg_dump usage
- a7ed268: ✨ Add support for Prisma format in parser
- f5ee4ea: ✨ Enhance format detection by adding support for prisma

## 0.0.23

### Patch Changes

- b628bcb: ✨️ Add interactive init command with Inquirer and optional GitHub Actions workflow
- 97c5996: ✨ Implement show mode handling in URL parameters and state management
- 6a34d7b: 🚸 Enhanced error rendering in the `ErrorDisplay` component, adding detailed error summaries

## 0.0.22

### Patch Changes

- aa74483: 🐛 Fix argument type of errors

## 0.0.21

### Patch Changes

- d0858af: 🚸 delete unnecessary margin on mobile
- 40dffc8: 💄 Move react flow attribution from bottom-right to bottom-left

## 0.0.20

### Patch Changes

- 6caac30: :sparkle: Improved error output

  - Output logs are now prefixed with `ERROR:` and `WARN:` and output in color.
  - In case of `ERROR` exit 1.

- 6a37715: ♻️ refactor usePopStateListener

## 0.0.19

### Patch Changes

- 75053da: 🐛 Fix unnecessary whitespace generation
- 950f375: :bug: No focus when Active table in Related Tables
- 9c6bcc6: ✨ feat: Enable browser back and forward for active table

## 0.0.18

### Patch Changes

- a2999c5: :children_crossing: Delay the warning `ExperimentalWarning: WASI is an experimental feature and might change at any time` for prism/wasm until the actual moment prism is used.
- e0c748c: :bug: Fixed problem with fitView not working properly while displaying only some tables
- 69865f3: :sparkles: Add `initCommand` for interactive setup guidance (first step)
- d10e628: 🐛: Fix ReleaseVersion display
- 17746fd: ♻️ Rename cliVersion to version

## 0.0.17

### Patch Changes

- 21e4ad4: 🐛 : move RelationshipEdgeParticleMarker for gradient rendering to ERDRenderer
- 7a97784: 🐛 : move CardinalityMarkers component in ERDRenderer
- 9ca556c: 🚸 : disable click events on RelationshipEdge
- 95dd878: 🐛 update TableHeader styles and add handle positioning for connections
- ef56f37: :recycle: Refactoring the process of getting sidebar state from cookie
- 177ea71: :bug: Fix compatibility issue with Node.js v18 in ERD tool
- 2235c2c: ♻️: Refactor ReleaseVersion for ERD Web

## 0.0.16

### Patch Changes

- 4e114d0: :lipstick: Eliminate overlap between rail and scrollbar

## 0.0.15

### Patch Changes

- 9ba18b9: ⚡️ Disable edge animation in highlightNodesAndEdges
- 31575c5: 💄 feat: Sticky positioning for related tables in TableDetail
- d097cea: :bug: fix: Comment component to use `<span>` instead of `<p>`
- e3f3f37: ⚒️ Fixing CSS Modules error with toolbar
- 9ba18b9: 🚸 Add animated particles to highlighted relationship edges

## 0.0.14

### Patch Changes

- 28a9eb2: :lipstick: Update font-family settings across ERD Renderer components
- e3faa74: ⚒️ Adjust the appearance of the toolbar on mobile devices.
- 34dd3eb: refactor: Remove unused isRelatedToTable function and simplify TableNode component logic
- 1c20fd1: ⚒️ Fixing the toolbar display bug
- 82ec743: 🐛 Fixed problem with TableNode not being highlighted when opened from URL with query parameter
- 1eb5dc1: :recycle: Update css module for edge marker

## 0.0.13

### Patch Changes

- e2d2c06: 🐛 bug-fix: Highlight source cardinality with multi-foreign keys
- 90ccd89: refactor: Update handleLayout to accept nodes and improve hidden node handling
- 486286a: 📈 : Add open related tables log event
- 0a129c2: ✨ Enhance node conversion functions to support hierarchical structure and layout options for NonRelatedTableGroup nodes
- fb03451: 📈 Add cliVer parameter to log event functions and component.s
- 704f606: :chart_with_upwards_trend: add type for reposition table logging
- b63e2da: fix: Render CardinalityMarkers based on loading state
- ee77b3f: Show column types in table nodes when the table is highlighted
- 116365d: 📈 Add appEnv parameter to logging events for environment tracking
- 54d6ca9: ✨ Add NonRelatedTableGroupNode component with styling
- 582ac0e: 📈 Add click logging for toolbar actions and include show mode in event data
- bc2118d: 🐛 Fixed problem with active tables not being highlighted in LeftPane when opened via query parameter
- d0a27e0: maintenance: Add GitHub Release Link and Disable some features

## 0.0.12

### Patch Changes

- f3e454a: refactor: integrate highlightNodesAndEdges function for improved node and edge highlighting on hover
- 18e5e8e: ♻️ Remove LinkIcon and replace its usage with Link component
- 594386f: refactor: Remove highlightedHandles
- 0870088: ⚒️ Fix SVG attributes to use camelCase for consistency
- 298c7cc: ✨Implementing a key-only view
- 555a157: feat: hidden nodes can now be reflected from query parameters
- c0934d3: ✨ Add LinkIcon🔗 and apply it as an icon for foreign keys.
- 9b62de2: Resolving the issue of remaining highlights
- 343e01d: New `ReleaseVersion` component into `HelpButton`
- 4859d37: feat: get hidden nodes via query parameter now compresses
- 8c9c9c5: 🐛 Fixed an issue where opening an active table from a query parameter would not highlight it
- b372a0f: refactor: Refactoring of highlight edges on active table
- 7c75b53: 📈: integrate toggle logging for sidebar and visibility button actions
- f46d097: 📈 : add click logging for CopyLinkButton
- d8ff5d5: Refactoring and testing of highlights on active tables
- 6c2a2d5: 📈 : add toggleLogEvent utility for logging toggle actions
- c0b2d01: refactor Integrated `isRelated` into `isHighlighted`
- aecbcc5: fix: Fixed failure to highlight parent tables

## 0.0.11

### Patch Changes

- 987082d: Update hidden node cardinalities
- 60bfdeb: refactor: Move the calculation to TableColumnList and TableColumn only displays the props
- 16118e3: 💄 add loading spinner
- 9c44a6a: fix: Fixed an issue where the correct table was not focused when sharing URLs in TableDetail
- 3ebbac2: Corrected incorrect cardinality direction.
- c3756b1: Reduce the width of TableDetail to prevent TableNode from being obscured
- 594a73b: Enable hiding cardinalities on source node if target node is hidden
- 88cf707: refactor: The behavior of TableNode when clicked is unified to be handled by ERDContent
- b08232b: Highlight related edges and cardinalities when a TableNode is active.
- e21fdc5: Enable clicking while Table Detail opened
- 296fdaa: Restored columnType visibility.
- b4b76d6: Minor refactoring of ERDContent

## 0.0.10

### Patch Changes

- 66bef4c: fix: reword to open in main area
- bfcbb3a: LeftPane now shows the number of tables currently being displayed
- ae4e27a: fix: Fixed an issue where edges were displayed during the initial loading
- 3f4965f: `Tidy up` button now allows layout adjustments for only the currently displayed nodes
- 9e88995: Refactored components for better maintainability: TableColumnList, TableColumn, Cardinality.
- 28e7f9e: fix: reduce button-in-button
- 91895fd: `-V/--version` now displays the correct version number.
- 9ed0bdd: It is now possible to hide tables other than Related Tables
- 8109940: refactor: reduce useEffect
- b6112e9: Fixed incorrect cardinality icon positioning (left/right)
- a9b9579: ✨Changed the default show mode to 'Table name only'
- 471d49b: fix: Fixed an issue where edges were displayed incorrectly when switching the show mode
- 7eccf51: Add current link copy button
- 3b9c3b4: refactor: Reduced performance degradation caused by calculations for source and target
- a85acb3: fix: Fixed an issue where URL sharing in TableDetail sometimes did not work correctly
- 846feee: Fixed excessive highlighting of cardinality elements.
- d255ff3: fix: Removed the highlight on Edge hover to prevent performance degradation

## 0.0.9

### Patch Changes

- 1aeed01: fix: reduce button-in-button
- 8ed7b59: Enabled toggling the visibility of Table Nodes from the Left Pane.
- b1521ed: Add url query params for quick access

## 0.0.8

### Patch Changes

- Fixed border radius for TABLE_NAME show mode.
- Update HTML and view header titles in ERD.
- feat: 1:n and 1:1 notations can now be displayed when highlighting relationships
- Added links to documentation and community resources
- feat: update ELK layout options for improved node placement and spacing
- fix: disable delete key functionality for delete TableNode
- refactor: optimize edge highlighting using useReactFlow hooks

## 0.0.7

### Patch Changes

- 48f610a: Add tooltips to display the full table name when it is truncated in the Table node

## 0.0.6

### Patch Changes

- Various improvements to the UI/UX

## 0.0.5

### Patch Changes

- Various improvements to the UI/UX

## 0.0.4

### Patch Changes

- Various improvements to the UI/UX

## 0.0.3

### Patch Changes

- Various improvements to the UI/UX

## 0.0.2

### Patch Changes

- 22d8714: Use GitHub App Token for release workflow in GitHub Actions
- 4abcf14: Fix build process: call `pnpm build` before release publishing

## 0.0.1

### Patch Changes

- 562e1fe: First release
