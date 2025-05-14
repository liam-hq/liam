"use client"

import { ThemeProvider } from "@/components/theme-provider"
import App from "../../../../../yaml-editor/App"

export default function YamlEditorPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="yaml-editor-theme">
      <App />
    </ThemeProvider>
  )
}