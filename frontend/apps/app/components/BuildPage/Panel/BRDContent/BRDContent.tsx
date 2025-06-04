'use client'

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './BRDContent.module.css'
import { BRDDetailContent, type BusinessRequirement } from './BRDDetailContent'

type TabInfo = {
  id: string
  title: string
  type: 'overview' | 'detail'
  brdId?: string
}

const mockBRDData: BusinessRequirement[] = [
  {
    id: 'BR-01',
    title: 'Users can create/join multiple channels',
    description:
      'To organize conversations by project, team, or interest, and streamline information flow',
  },
  {
    id: 'BR-02',
    title: 'Channels can be toggled between "public" and "private"',
    description:
      'To support both organization-wide announcements and closed discussions for limited members',
  },
  {
    id: 'BR-03',
    title: 'Users can reply to messages to form threads',
    description:
      'To enable in-depth discussions on specific topics without cluttering the main timeline',
  },
  {
    id: 'BR-04',
    title: 'Users can express agreement with emoji reactions on messages',
    description:
      'To reduce unnecessary "+1" posts and convey emotions or approval asynchronously',
  },
  {
    id: 'BR-05',
    title: 'User/message deletion preserves history (soft delete)',
    description:
      'To prepare for future audits and issue resolution, with complete deletion selectively performed by administrators',
  },
  {
    id: 'BR-06',
    title: 'Schema prioritizes search performance and extensibility',
    description:
      'To avoid hindering future features such as file sharing, pinning, external API integration, etc.',
  },
]

export const BRDContent: FC = () => {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'overview', title: 'Overview', type: 'overview' },
  ])
  const [activeTab, setActiveTab] = useState('overview')

  const handleBRDClick = (brd: BusinessRequirement) => {
    const tabId = `detail-${brd.id}`
    const existingTab = tabs.find((tab) => tab.id === tabId)

    if (!existingTab) {
      const newTab: TabInfo = {
        id: tabId,
        title: brd.id,
        type: 'detail',
        brdId: brd.id,
      }
      setTabs([...tabs, newTab])
    }
    setActiveTab(tabId)
  }

  const handleCloseTab = (tabId: string) => {
    if (tabId === 'overview') return

    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(newTabs)

    if (activeTab === tabId) {
      setActiveTab('overview')
    }
  }

  const selectedBRD = activeTab.startsWith('detail-')
    ? mockBRDData.find((brd) => `detail-${brd.id}` === activeTab)
    : null

  return (
    <TabsRoot
      value={activeTab}
      onValueChange={setActiveTab}
      className={styles.wrapper}
    >
      <div className={styles.header}>
        <div className={styles.title}>BRD</div>
        <TabsList className={styles.tabsList}>
          {tabs.map((tab) => (
            <div key={tab.id} className={styles.tabContainer}>
              <TabsTrigger value={tab.id} className={styles.tabsTrigger}>
                {tab.title}
              </TabsTrigger>
              {tab.type === 'detail' && (
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseTab(tab.id)
                  }}
                  aria-label={`Close ${tab.title} tab`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </TabsList>
      </div>
      <TabsContent value="overview" className={styles.listSection}>
        <div className={styles.brdList}>
          {mockBRDData.map((brd) => (
            <button
              key={brd.id}
              type="button"
              className={styles.brdItem}
              onClick={() => handleBRDClick(brd)}
            >
              <div className={styles.brdId}>{brd.id}</div>
              <div className={styles.brdBody}>
                <div className={styles.brdTitle}>{brd.title}</div>
                <div className={styles.brdDescription}>{brd.description}</div>
              </div>
            </button>
          ))}
        </div>
      </TabsContent>
      {selectedBRD && (
        <TabsContent
          value={`detail-${selectedBRD.id}`}
          className={styles.detailSection}
        >
          <BRDDetailContent brd={selectedBRD} />
        </TabsContent>
      )}
    </TabsRoot>
  )
}
