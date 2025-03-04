'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const Header = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>Liam Migration</h1>
      </div>
      <nav className={styles.nav}>
        <Link
          href="/review"
          className={`${styles.navLink} ${isActive('/review') ? styles.active : ''}`}
          aria-label="Go to Review page"
          tabIndex={0}
        >
          Review
        </Link>
        <Link
          href="/vectorize"
          className={`${styles.navLink} ${isActive('/vectorize') ? styles.active : ''}`}
          aria-label="Go to Vectorize page"
          tabIndex={0}
        >
          Vectorize
        </Link>
        <Link
          href="/knowledge_retrieval"
          className={`${styles.navLink} ${isActive('/knowledge_retrieval') ? styles.active : ''}`}
          aria-label="Go to Knowledge Retrieval page"
          tabIndex={0}
        >
          Knowledge Retrieval
        </Link>
      </nav>
    </header>
  );
};

export default Header;
