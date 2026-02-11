import Image from 'next/image';
import FireIcon from '../../../public/static-assets/images/Fire-96.svg';
import styles from './fire-button.module.css';

interface FireButtonProps {
  onClick: () => void;
}

export default function FireButton({ onClick }: FireButtonProps) {
  return (
    <button
      className={styles.fireButton}
      onClick={onClick}
      aria-label="Fire action"
      type="button"
    >
      <Image src={FireIcon} alt="" width={48} height={48} />
    </button>
  );
}
