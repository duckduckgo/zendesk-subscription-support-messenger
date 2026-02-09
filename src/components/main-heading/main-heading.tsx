import { SITE_TITLE } from '@/config/common';
import styles from './main-heading.module.css';

/**
 * Main heading component displayed on both consent form and chat screens.
 * Provides consistent branding and page title across the application.
 */
export default function MainHeading() {
  return <h1 className={styles.mainHeading}>{SITE_TITLE}</h1>;
}
