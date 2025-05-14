"use client"

import { useEffect } from "react"
import { YamlEditor } from "./YamlEditor"
import { VersionList } from "./VersionList"
import { useVersionStore } from "./versionStore"
import { Toaster } from "@/components/ui/toaster"

export default function App() {
  const { initializeStore } = useVersionStore()

  useEffect(() => {
    // Initialize with a sample YAML document
    initializeStore()
  }, [initializeStore])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-800">YAML Editor with Version History</h1>
      </header>

      <main className="flex-1 flex flex-row overflow-hidden">
        <div className="w-1/4 overflow-auto border-r border-gray-200 bg-white">
          <VersionList />
        </div>
        <div className="w-3/4 overflow-auto">
          <YamlEditor />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
