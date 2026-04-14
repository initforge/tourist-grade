import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  const plugins = [react()]

  if (process.env.VITE_DISABLE_TAILWIND !== '1') {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    plugins.push(tailwindcss())
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@app': resolve(process.cwd(), 'src/app'),
        '@features': resolve(process.cwd(), 'src/features'),
        '@entities': resolve(process.cwd(), 'src/entities'),
        '@shared': resolve(process.cwd(), 'src/shared'),
      },
    },
  }
})
