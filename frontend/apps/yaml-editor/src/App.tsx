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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-800">YAML Editor with Version History</h1>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-0">
        <div className="md:col-span-1 border-r border-gray-200 bg-white">
          <VersionList />
        </div>
        <div className="md:col-span-3">
          <YamlEditor />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
