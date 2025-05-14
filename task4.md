# YAML Editor Integration Plan

## Current Issues

1. The YAML editor has been moved from the standalone app (`frontend/apps/yaml-editor/`) to the Next.js app (`frontend/apps/app/`), but the styling is not working correctly.
2. The editor needs to be properly integrated into the Next.js app layout (with sidebar and top bar).
3. The editor needs to be converted to dark mode to match the app's theme.

## Analysis

### Original YAML Editor (frontend/apps/yaml-editor/)

- Uses a simple layout with a header, sidebar (25% width) for version history, and main editor area (75% width)
- Uses Tailwind CSS for styling
- Has a light theme by default
- Uses Monaco editor for YAML editing
- Uses Zustand for state management (version history)

### Next.js App (frontend/apps/app/)

- Uses a more complex layout with:
  - GlobalNav (sidebar navigation)
  - AppBar (top navigation)
  - Main content area
- Uses CSS modules and CSS variables for styling
- Has dark mode support through next-themes
- Already has the YAML editor components copied over, but they're not properly integrated with the layout

## Integration Plan

### 1. Fix Component Structure

The current implementation tries to render the entire YAML editor app (with its own header and layout) inside the Next.js app layout, causing nested layouts and styling conflicts. Instead, we need to:

- Remove the redundant header from the YAML editor component
- Adapt the YAML editor to fit within the main content area of the Next.js app
- Ensure the editor respects the app's theme (dark/light mode)

### 2. Update CSS Modules

- Update the YAML editor CSS modules to use the app's CSS variables for colors, borders, etc.
- Ensure proper height and width calculations to fit within the layout
- Add specific dark mode styles using the app's theme system

### 3. Fix Monaco Editor Styling

- Ensure Monaco editor properly respects the dark/light theme
- Fix any padding/margin issues
- Ensure proper height calculations

### 4. Implementation Steps

1. **Update App.tsx Component**:
   - Remove the header
   - Adjust the layout to fit within the main content area
   - Use CSS variables for colors and styling

2. **Update YamlEditor.module.css**:
   - Use app's CSS variables for colors
   - Ensure proper height calculations
   - Add dark mode specific styles

3. **Update YamlEditor Component**:
   - Ensure Monaco editor respects the theme
   - Update Monaco editor options for dark mode

4. **Update VersionList Component**:
   - Ensure styling matches the app's design system
   - Use CSS variables for colors

5. **Update page.tsx**:
   - Ensure proper theme handling
   - Ensure the component fits correctly in the layout

## Detailed CSS Changes

### Colors and Theme

Replace hardcoded colors with CSS variables:

- Replace `bg-white`, `bg-gray-50`, etc. with `var(--card)`, `var(--global-background)`, etc.
- Replace `text-gray-800`, etc. with `var(--global-foreground)`
- Replace border colors with `var(--border)`

### Layout

- Ensure the YAML editor container has `height: 100%` and `width: 100%`
- Remove any fixed heights and use flex layout
- Ensure proper overflow handling

### Monaco Editor

- Add theme detection to set Monaco editor theme based on app theme
- Ensure proper height calculations
- Fix any padding/margin issues

## Expected Result

After implementation, the YAML editor should:

1. Fit perfectly within the Next.js app layout (with sidebar and top bar)
2. Use the app's dark theme when in dark mode
3. Have consistent styling with the rest of the app
4. Maintain all functionality of the original editor
