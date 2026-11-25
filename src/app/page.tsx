import SunsetNotice from '@/components/sunset-notice/sunset-notice';
import PageLoadPixel from '@/components/page-load-pixel/page-load-pixel';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <main id="main-content" className={styles.main}>
        <SunsetNotice />
      </main>
      <PageLoadPixel />
    </>
  );
}
