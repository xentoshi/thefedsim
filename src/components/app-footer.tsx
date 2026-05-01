import React from 'react'

export function AppFooter() {
  return (
    <footer className="text-center p-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 text-xs">
      <a
        className="link hover:text-neutral-500 dark:hover:text-white"
        href="https://github.com/xentoshi/thefedsim-game"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      {' | '}
      <a
        className="link hover:text-neutral-500 dark:hover:text-white"
        href="https://twitter.com/thefedsimulator"
        target="_blank"
        rel="noopener noreferrer"
      >
        X / Twitter
      </a>
    </footer>
  )
}
