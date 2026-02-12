import styles from './horizontal-rule.module.css';

/**
 * HorizontalRule component renders a horizontal separator line.
 *
 * Used to visually separate sections, styled with 12% black opacity.
 *
 * @returns Horizontal rule element
 */
export default function HorizontalRule() {
  return <hr className={styles.horizontalRule} />;
}
