# YAML Editor Integration Plan

## Current Issues

1. **Height and Layout Issues**: 
   - The YAML editor isn't properly respecting the height constraints of the Next.js app layout
   - The editor isn't properly fitting within the content area of the CommonLayout

2. **CSS Conflicts**:
   - The original YAML editor uses direct Tailwind classes
   - The Next.js app uses CSS modules and CSS variables
   - Some styles aren't being properly applied in the new context

3. **Structure Differences**:
   - The original app had its own header, while the Next.js app already has an AppBar
   - The layout nesting is different, causing sizing issues

## Solution Plan

### 1. Update the Page Component

- Modify `frontend/apps/app/app/(app)/app/(root)/yaml-editor/page.tsx` to ensure it takes full height of the content area
- Update the CSS module `page.module.css` to properly handle height and overflow

### 2. Modify the App Component

- Update `frontend/apps/app/yaml-editor/App.tsx` to:
  - Remove redundant header (since we're using the app's AppBar)
  - Ensure proper height calculations
  - Fix flex layout to work within the Next.js app structure

### 3. Update CSS Modules

- Modify `frontend/apps/app/yaml-editor/YamlEditor.module.css` to:
  - Ensure proper height calculations
  - Fix container sizing
  - Handle overflow correctly
  - Use appropriate CSS variables for theming

### 4. Fix YamlEditor Component

- Update `frontend/apps/app/yaml-editor/YamlEditor.tsx` to:
  - Apply appropriate CSS classes
  - Ensure proper sizing and positioning
  - Fix any styling issues with the editor

### 5. Fix VersionList Component

- Update `frontend/apps/app/yaml-editor/VersionList.tsx` to:
  - Apply appropriate CSS classes
  - Ensure proper sizing and positioning
  - Fix any styling issues with the version list

### 6. Update Global Styles

- Modify `frontend/apps/app/styles/yaml-editor.css` to:
  - Add any necessary global styles
  - Fix any conflicts with the app's global styles
  - Ensure proper integration with the app's theme

## Component Structure

The components should be structured as follows:

```
CommonLayout
├── GlobalNav (sidebar)
├── MainContent
    ├── AppBar (top bar)
    └── Content Area
        └── YamlEditorPage
            └── App Component
                ├── VersionList
                └── YamlEditor
```

## Implementation Steps

1. First, update the page component and its CSS module
2. Then, modify the App component to fit within the layout
3. Update the CSS modules for proper height calculations
4. Fix the YamlEditor and VersionList components
5. Test the integration to ensure proper layout and styling
6. Make any necessary adjustments based on testing results
