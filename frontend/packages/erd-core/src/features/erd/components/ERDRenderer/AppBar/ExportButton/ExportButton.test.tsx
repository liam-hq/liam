import { aSchema, aTable } from '@liam-hq/schema'
import { ToastProvider } from '@liam-hq/ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC, PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SchemaProvider } from '../../../../../../stores'
import { ExportButton } from './ExportButton'

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <ToastProvider>
    <SchemaProvider
      current={aSchema({ tables: { users: aTable({ name: 'users' }) } })}
    >
      {children}
    </SchemaProvider>
  </ToastProvider>
)

describe('YAML export', () => {
  it('should handle successful YAML copy', async () => {
    const user = userEvent.setup()
    render(<ExportButton />, { wrapper })

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Copy YAML'))

    const clipboard = await navigator.clipboard.readText()
    expect(clipboard).toContain('tables:\n  users:') // check clipboard content, should contain YAML for users table

    // check toast
    expect(await screen.findByText('YAML copied!')).toBeInTheDocument()
    expect(
      await screen.findByText('Schema YAML has been copied to clipboard'),
    ).toBeInTheDocument()
  })

  it('should show error toast if clipboard write fails', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('Clipboard write failed'),
    )

    const user = userEvent.setup()
    render(<ExportButton />, { wrapper })

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Copy YAML'))

    // check toast
    expect(await screen.findByText('Copy failed')).toBeInTheDocument()
    expect(
      await screen.findByText(
        'Failed to copy YAML to clipboard: Clipboard write failed',
      ),
    ).toBeInTheDocument()
  })

  it.todo('should show error toast if YAML generation fails')
})
