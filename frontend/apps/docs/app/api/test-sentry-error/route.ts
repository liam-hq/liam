export async function GET() {
  throw new Error('Test server-side error for Sentry')
}
