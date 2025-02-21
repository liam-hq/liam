import { useVersion } from '@/providers'
import type { FC } from 'react'
import styles from './ReleaseVersion.module.css'

export const ReleaseVersion: FC = () => {
  const { version } = useVersion()

  // Example output for version:
  // - Released version:
  //   v0.0.11 (2024-12-19)
  // - Unreleased version:
  //   v0.0.11 + 0d6169a (2024-12-19)
  //
  // Explanation:
  // - "Released version" means the current Git hash matches a tagged release.
  // - "Unreleased version" includes a short Git hash prefix to indicate changes since the last release.
  return (
    <div className={styles.version}>
      {version.displayedOn === 'cli' ? (
        <>
          <span>{`v${version.version}`}</span>
          <span>
            {' '}
            {version.isReleasedGitHash || `+ ${version.gitHash.slice(0, 7)} `}
          </span>
          <span>{`(${version.date})`}</span>
        </>
      ) : (
        <>
          <span>{version.gitHash.slice(0, 7)}</span>
          <span> </span>
          <span>{`(${version.date})`}</span>
        </>
      )}
    </div>
  )
}
