'use client';

import { Button } from '@/components/button/button';
import { MAIN_SITE_URL } from '@/config/common';
import { LOAD_ZD_BUTTON_TEST_ID } from '@/constants/test-ids';
import { REDIRECT_DELAY_MS } from '@/constants/zendesk-timing';
import { DECLINE_BUTTON_TEXT, CONSENT_BUTTON_TEXT } from '@/config/zendesk';
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
          <p>DuckDuckGo Subscription Support Zendesk AI Agent Notice</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <p>
              DuckDuckGo Subscription support uses an AI Agent powered by
              Zendesk (the &quot;AI Agent&quot;) to perform customer support
              functions, including interacting with users via AI chat bot. The
              AI Agent allows DuckDuckGo to respond to users quickly and
              efficiently by accessing our help pages and assisting users with
              questions related to the Subscription Service. Zendesk is a third
              party and the information you submit is transmitted to
              Zendesk&apos;s AI. Please keep this in mind when determining what
              information you provide to the AI Agent.
            </p>

            <p>
              <strong>
                The AI Agent collects and processes customer support data,
                including personal information
              </strong>
            </p>

            <p>
              The AI Agent collects information submitted through the chat bot
              and a third party Zendesk script [insert any other methods] and
              processes support transcripts so that it can automate
              conversations, provide analytics, and improve the service.
              DuckDuckGo and Zendesk collect other automated data related to
              your support session, such as page impressions, consent
              preference, chat session IDs, errors, and button clicks. Zendesk
              also sets cookies to support functionality such as cross-tab
              messaging, to which you may opt out. Certain Zendesk cookies are
              required for the chat bot to function and cannot be disabled.
            </p>

            <p>
              <strong>
                We minimize the amount of personal information the AI Agent uses
              </strong>
            </p>

            <p>
              Due to the nature of customer support, the AI Agent inevitably
              collects certain personal information, including the content of
              support requests and conversations, but we take additional steps
              to protect your privacy during the support process. For example,
              the AI Agent is isolated in a separate subdomain to separate it
              from other sensitive data. For incoming data, Zendesk anonymizes
              certain types of personal information to prevent them from being
              processed, such as bank account numbers, credit cards, and social
              security numbers, though this does not guarantee complete
              &quot;anonymization&quot; or removal of all personal information
              submitted to the chat bot. We also take steps to prevent the
              script from storing potentially sensitive data in the DuckDuckGo
              browser beyond the support chat session. See Zendesk&apos;s
              privacy policy for more information.
            </p>

            <p>
              <strong>
                Zendesk AI [does not use your chat bot content to train its
                models]
              </strong>
            </p>

            <p>
              According to Zendesk, Zendesk removes most personal information,
              including through the anonymization method noted above, then
              tokenizes the remaining data before using it to train its AI
              models. Further, according to Zendesk, no training datasets are
              stored within any Zendesk model. See
              https://support.zendesk.com/hc/en-us/articles/5729714731290-Zendesk-AI-Data-Use-Information
              for more information. While the parties have taken various steps
              to prevent your personal information from being used in training,
              DuckDuckGo cannot completely guarantee that no personal
              information will be used for training Zendesk AI models.
            </p>

            <p>
              <strong>Zendesk may transfer your information</strong>
            </p>

            <p>
              Zendesk uses other service providers to provide its support
              services, resolve system issues, and provide security and
              infrastructure, and your information will be processed by some or
              all of those service providers. Zendesk has committed to requiring
              its service providers to follow specific data protection
              obligations. See Zendesk&apos;s Sub-processor Policy for more
              information. If you are located outside of the U.S., your
              information may be transferred to the U.S. for processing.
            </p>

            <p>
              <strong>
                DuckDuckGo&apos;s support team is here to assist you
              </strong>
            </p>

            <p>
              You may have the option to escalate a support request to a live
              agent. If so, your personal information shared with the chat bot
              will be shared with the live agent. DuckDuckGo agents may review
              transcripts of conversations between AI agents and users to ensure
              accuracy and conduct quality assurance.
            </p>

            <p>
              DuckDuckGo&apos;s Subscription Privacy Policy and Terms of Service
              also apply. If there&apos;s a conflict with the DuckDuckGo
              Subscription Privacy Policy and Terms of Service (and/or other
              DuckDuckGo privacy policy) and this policy, the terms of this
              policy will prevail.
            </p>

            <p>
              By selecting &quot;{CONSENT_BUTTON_TEXT}&quot;, you acknowledge
              and consent to the following:
            </p>

            <p>
              By opting into the AI Agent, I understand that a third party
              (Zendesk) script will be loaded and the AI chat bot will be
              enabled for my [account/device].
            </p>

            <p>
              If you wish to withdraw your consent for DuckDuckGo&apos;s Zendesk
              AI Agent, you may do so by [insert].
            </p>

            <p>
              By clicking &quot;{CONSENT_BUTTON_TEXT}&quot;, you confirm that
              you have read, understand, and consent to DuckDuckGo&apos;s
              collection, processing, and transfer of your personal information
              as described above.
            </p>

            <p>Last updated: January 30, 2026</p>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <Button
            text={DECLINE_BUTTON_TEXT}
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
            text={CONSENT_BUTTON_TEXT}
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
