import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CommandPreview } from './CommandPreview'

describe('it displays demonstration video', () => {
  it('when command is "copy link"', () => {
    render(<CommandPreview commandName="copy link" />)

    expect(
      screen.getByLabelText(
        'Demonstration of the copy link command execution result',
      ),
    ).toBeInTheDocument()
  })

  it('when command is "Zoom to Fit"', () => {
    render(<CommandPreview commandName="Zoom to Fit" />)

    expect(
      screen.getByLabelText(
        'Demonstration of the Zoom to Fit command execution result',
      ),
    ).toBeInTheDocument()
  })

  it('when command is "Tidy Up"', () => {
    render(<CommandPreview commandName="Tidy Up" />)

    expect(
      screen.getByLabelText(
        'Demonstration of the Tidy Up command execution result',
      ),
    ).toBeInTheDocument()
  })
})

describe('it displays demonstration image', () => {
  it('when command is "Show All Fields"', () => {
    render(<CommandPreview commandName="Show All Fields" />)

    expect(
      screen.getByAltText(
        'Demonstration of the Show All Fields command execution result',
      ),
    ).toBeInTheDocument()
  })

  it('when command is "Show Key Only"', () => {
    render(<CommandPreview commandName="Show Key Only" />)

    expect(
      screen.getByAltText(
        'Demonstration of the Show Key Only command execution result',
      ),
    ).toBeInTheDocument()
  })

  it('when command is "Show Table Name"', () => {
    render(<CommandPreview commandName="Show Table Name" />)

    expect(
      screen.getByAltText(
        'Demonstration of the Show Table Name command execution result',
      ),
    ).toBeInTheDocument()
  })
})
