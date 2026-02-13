import Image from 'next/image';
import FireIconColorLarge from '../../../public/static-assets/images/Fire-96.svg';
import FireIconSmall from '../../../public/static-assets/images/Fire-Solid-16.svg';
import styles from './fire-button.module.css';
import { DELETE_DATA_BUTTON_TEST_ID } from '@/constants/test-ids';

interface FireButtonProps {
  onClick: () => void;
  appearance?: 'icon' | 'button';
}

/**
 * FireButton component displays a button to clear conversation data.
 *
 * @param props - Component props
 * @param props.onClick - Click handler
 * @param props.appearance - Button appearance style ('icon' or 'button')
 *
 * @returns Fire button element
 */
export default function FireButton({
  onClick,
  appearance = 'icon',
}: FireButtonProps) {
  if (appearance === 'button') {
    return (
      <button
        className={styles.fireButtonSolid}
        onClick={onClick}
        aria-label="Clear conversation data"
        type="button"
        data-testid={DELETE_DATA_BUTTON_TEST_ID}
      >
        <Image src={FireIconSmall} alt="" width={16} height={16} />
        <span>Clear Conversation Data</span>
      </button>
    );
  }

  return (
    <button
      className={styles.fireButtonIcon}
      onClick={onClick}
      aria-label="Clear conversation data"
      type="button"
      data-testid={DELETE_DATA_BUTTON_TEST_ID}
    >
      <Image src={FireIconColorLarge} alt="" width={48} height={48} />
    </button>
  );
}
