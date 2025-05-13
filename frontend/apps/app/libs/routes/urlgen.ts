import type { RouteDefinitions } from './routeDefinitions'
import { routeDefinitions } from './routeDefinitions'

export function urlgen<T extends keyof RouteDefinitions>(
  route: T,
  // biome-ignore lint/suspicious/noExplicitAny: needed for conditional type to determine route function parameters
  ...params: RouteDefinitions[T] extends (...args: any[]) => string
    ? Parameters<RouteDefinitions[T]>
    : []
): string {
  const routeDef = routeDefinitions[route]

  if (typeof routeDef === 'string') {
    return routeDef
  }

  return (routeDef as (...args: unknown[]) => string)(...params)
}
