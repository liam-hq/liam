'use client'

import {
  Button,
  Link2,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { useState } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import { CreateProjectForm } from './CreateProjectForm'
import { ProjectSelector } from './ProjectSelector'

type Props = {
  sessionId: string
}

export const ConnectProjectButton: FC<Props> = ({ sessionId }) => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('existing')

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline-secondary"
        size="sm"
      >
        <Link2 />
        Connect Project
      </Button>

      <ModalRoot open={open} onOpenChange={setOpen}>
        <ModalPortal>
          <ModalOverlay />
          <ModalContent>
            <ModalTitle>Connect to Project</ModalTitle>

            <TabsRoot value={activeTab} onValueChange={setActiveTab}>
              <div
                style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}
              >
                <Button
                  variant={
                    activeTab === 'existing'
                      ? 'solid-primary'
                      : 'outline-secondary'
                  }
                  onClick={() => setActiveTab('existing')}
                >
                  Existing Project
                </Button>
                <Button
                  variant={
                    activeTab === 'new' ? 'solid-primary' : 'outline-secondary'
                  }
                  onClick={() => setActiveTab('new')}
                >
                  New Project
                </Button>
              </div>

              <TabsContent value="existing">
                <ProjectSelector
                  sessionId={sessionId}
                  onSuccess={() => setOpen(false)}
                />
              </TabsContent>

              <TabsContent value="new">
                <CreateProjectForm onSuccess={() => setOpen(false)} />
              </TabsContent>
            </TabsRoot>
          </ModalContent>
        </ModalPortal>
      </ModalRoot>
    </>
  )
}
