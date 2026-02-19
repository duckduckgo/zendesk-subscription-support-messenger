import { MAIN_SITE_URL } from '@/config/common';
import styles from './chat-navigation.module.css';
import NewTabLabel from '@/components/new-tab-label/new-tab-label';

/**
 * ChatNavigation component displays help links at the bottom of the chat widget.
 *
 * @returns Chat navigation element
 */
export default function ChatNavigation() {
  return (
    <nav className={styles.chatNavigation}>
      <h3 className={styles.heading}>Need help or more details?</h3>
      <div className={styles.links}>
        <a
          href={`${MAIN_SITE_URL}/duckduckgo-help-pages/most-common-questions`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          FAQs and Support
          <NewTabLabel />
        </a>
        <a
          href={`${MAIN_SITE_URL}/feedback`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Send Feedback
          <NewTabLabel />
        </a>
      </div>
    </nav>
  );
}
