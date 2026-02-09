import { CONSENT_HEADING, MAIN_HEADING } from '@/config/common';
import styles from './main-heading.module.css';

/**
 * Main heading component displayed on both consent form and chat screens.
 * Provides consistent branding and page title across the application.
 */
export default function MainHeading({
  isConsentScreen,
}: {
  isConsentScreen?: boolean;
}) {
  return (
    <>
      {isConsentScreen ? (
        <h1 className={styles.mainHeading}>{CONSENT_HEADING}</h1>
      ) : (
        <h1 className={styles.mainHeading}>{MAIN_HEADING}</h1>
      )}
    </>
  );
}
