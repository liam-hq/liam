import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorDisplay } from './ErrorDisplay'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

const networkError: ErrorObject = {
  name: 'NetworkError',
  message: '[error message]',
  instruction: '[error instruction]',
}

const otherError: ErrorObject = {
  name: 'OtherError',
  message: '[error message]',
  instruction: '[error instruction]',
}

describe('no error', () => {
  it('displays nothing', () => {
    const { container } = render(<ErrorDisplay errors={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('network error', () => {
  it('displays the network error message', () => {
    const { container } = render(<ErrorDisplay errors={[networkError]} />)

    expect(container).toHaveTextContent(
      "Hmm, it's silent here...[error message][error instruction]",
    )
  })
})

describe('non-network error', () => {
  it('displays the error message with reporting links', () => {
    const { container } = render(<ErrorDisplay errors={[otherError]} />)

    expect(container).toHaveTextContent(
      /OtherError: [error message]It seems some SQL statements couldn't make it through the parser's orbit/,
    )
    expect(
      screen.getByRole('link', {
        name: 'Check out the troubleshooting guide →',
      }),
    ).toHaveAttribute('href', 'https://liambx.com/docs/parser/troubleshooting')
    expect(
      screen.getByRole('link', {
        name: 'Send Signal →',
      }),
    ).toHaveAttribute('href', 'https://github.com/liam-hq/liam/discussions')
  })
})

describe('multiple errors', () => {
  it('displays the first error message', () => {
    const { container } = render(
      <ErrorDisplay errors={[networkError, otherError]} />,
    )

    expect(container).toHaveTextContent(
      "Hmm, it's silent here...[error message][error instruction]",
    )
  })
})
