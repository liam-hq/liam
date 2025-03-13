declare module '@prisma/nextjs-monorepo-workaround-plugin' {
  export class PrismaPlugin {
    constructor()
    // biome-ignore lint/suspicious/noExplicitAny: type is not fully defined
    apply(compiler: any): void
  }
}
