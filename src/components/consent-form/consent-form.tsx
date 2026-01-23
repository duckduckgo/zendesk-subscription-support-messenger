'use client';

import { Button } from '@/components/button/button';
import { MAIN_SITE_URL } from '@/config/common';
import { LOAD_ZD_BUTTON_TEST_ID } from '@/constants/test-ids';
import { REDIRECT_DELAY_MS } from '@/constants/zendesk-timing';
import styles from './consent-form.module.css';

interface ConsentFormProps {
  onContinue: () => void;
}

export default function ConsentForm({ onContinue }: ConsentFormProps) {
  return (
    <>
      <h1 className={styles.mainHeading}>Before You Continue</h1>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p>By continuing, you agree to the following:</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
              sed augue dictum, placerat arcu nec, rutrum eros. Etiam fringilla
              malesuada dui eget viverra. Donec porta quam sed lacus pulvinar,
              et consectetur enim venenatis. Pellentesque non orci dictum,
              ultricies metus ac, blandit est. Duis fermentum felis orci, at
              hendrerit tellus efficitur viverra. Integer suscipit condimentum
              nunc, nec vehicula nibh accumsan sit amet. Sed dolor elit,
              placerat nec neque eget, cursus ullamcorper justo. Nunc facilisis
              urna et lacus feugiat pretium. Etiam elementum nunc vel lacinia
              dapibus. Donec non luctus lacus. Aliquam et eleifend felis.
              Phasellus in odio tortor. Morbi sed diam vitae libero condimentum
              maximus vitae vitae nulla. Sed risus velit, eleifend vitae ligula
              suscipit, sollicitudin posuere mauris. Donec ut lobortis augue.
              Donec et nisl malesuada nibh iaculis imperdiet. Aliquam justo
              tortor, porttitor eu lacus quis, mattis interdum est. Etiam
              eleifend nisl vel porttitor scelerisque. Cras a sapien faucibus,
              euismod arcu at, scelerisque elit. Sed at nulla nulla. Sed vitae
              tellus euismod, sollicitudin odio eu, interdum lorem. Donec
              dignissim molestie imperdiet. Maecenas eu arcu in mi dignissim
              ornare. Pellentesque in ante eleifend, maximus odio augue elit
              congue nisl, quis porta neque nunc non elit.
            </p>
            <p>
              Pellentesque posuere tellus ut aliquam pulvinar. Aliquam erat
              volutpat. Aliquam ac libero cursus, ultricies sem id, dapibus
              libero. Vestibulum ac ex et sapien bibendum bibendum. Nulla
              eleifend mauris nulla, non mattis ipsum pellentesque in. Integer
              lobortis mattis turpis, non dignissim justo efficitur eu. Ut et
              pretium libero. Curabitur bibendum blandit vehicula. Curabitur
              interdum sem id suscipit tincidunt. Integer non velit arcu. Nullam
              lacinia vehicula felis eu vulputate. Vivamus rhoncus tempor orci.
              Etiam mi lorem, tempor a nulla sollicitudin, dictum aliquet
              turpis. Pellentesque sit amet est massa. Nullam elementum
              porttitor nisl, vitae iaculis eros maximus ac. Donec sapien
              libero, gravida sit amet risus id, vulputate gravida dui. Lorem
              ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <Button
            text="Cancel"
            skipBaseStyles
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={() => {
              // allow time for a pixel to fire before redirecting
              setTimeout(() => {
                window.location.href = new URL(
                  '/subscription-support',
                  MAIN_SITE_URL,
                ).href;
              }, REDIRECT_DELAY_MS);
            }}
          />
          <Button
            text="Continue to Chat"
            skipBaseStyles
            className={`${styles.button} ${styles.continueButton}`}
            onClick={onContinue}
            data-testid={LOAD_ZD_BUTTON_TEST_ID}
          />
        </div>
      </div>
    </>
  );
}
