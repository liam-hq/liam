# YAML Editor Integration into Next.js App

## Problem Statement
The YAML editor from `frontend/apps/yaml-editor/` has been moved to the Next.js app at `frontend/apps/app` and is accessible at `http://localhost:3001/app/yaml-editor`. However, there are styling issues, and it needs to be properly integrated with the app's layout (sidebar, top navigation) and support dark mode.

## Analysis

### Current Implementation Issues
1. The YAML editor is not properly integrated with the Next.js app's layout system
2. Styling conflicts between the original light theme and the app's theme system
3. The component structure doesn't fit within the CommonLayout
4. Dark mode support is missing

### Original YAML Editor Structure
- Uses a standalone layout with its own header
- Has a sidebar for version history and main editor area
- Uses Tailwind CSS with light theme styling

### Next.js App Structure
- Uses CommonLayout with GlobalNav (sidebar) and AppBar (top navigation)
- Has theme support with CSS variables for dark/light modes
- Content should fit within the main content area of the layout

## Implementation Plan

1. **Update the page component**: Modify the page.tsx to better integrate with the CommonLayout
2. **Enhance the CSS**: Update the CSS to use theme variables and ensure proper dark mode support
3. **Adjust component structure**: Modify the App component to fit within the layout structure
4. **Fix Monaco editor theme**: Ensure the editor supports dark mode

## Changes to be Made

### 1. Update App.tsx
- Remove the header since it's redundant with the app's AppBar
- Adjust the layout to fit within the parent container
- Use theme variables for colors

### 2. Update CSS Modules
- Use theme variables for colors
- Ensure proper sizing within the parent layout
- Add dark mode support

### 3. Update YamlEditor Component
- Ensure the editor uses theme variables
- Add dark mode support for the Monaco editor or textarea fallback

### 4. Update VersionList Component
- Ensure it uses theme variables
- Add dark mode support for UI elements

## Implementation Details

### 1. App.tsx Changes
- Added `useTheme` hook to access the current theme
- Added `data-theme` attribute to the container to enable theme-specific styling
- Removed the header since it's redundant with the app's AppBar
- Adjusted the layout to fit within the parent container

### 2. YamlEditor.module.css Changes
- Replaced hardcoded color values with CSS variables
- Added dark mode specific styles using `[data-theme="dark"]` selectors
- Added styles to ensure proper integration with the app layout
- Fixed sizing issues to ensure the editor fills the available space

### 3. YamlEditor.tsx Changes
- Added `useTheme` hook to access the current theme
- Updated styling to use CSS variables for colors
- Added inline styles with theme variables for elements that need dynamic theming
- Ensured proper dark mode support for the editor

### 4. VersionList.tsx Changes
- Added `useTheme` hook to access the current theme
- Updated styling to use CSS variables for colors
- Added inline styles with theme variables for elements that need dynamic theming
- Improved the selected version styling for dark mode

### 5. Page Component Changes
- Added `useTheme` hook to access the current theme
- Added `data-theme` attribute to the container to enable theme-specific styling
- Updated the page.module.css to ensure proper integration with the layout

### 6. Global CSS Changes
- Updated yaml-editor.css to use theme variables
- Added dark mode specific styles
- Added Monaco editor dark theme support
- Fixed layout issues to ensure proper integration with the app

## Results
The YAML editor is now properly integrated with the Next.js app's layout system and supports dark mode. The editor fits correctly within the parent layout with the sidebar and top navigation. The styling is consistent with the app's theme system, and all UI elements adapt to both light and dark modes.
