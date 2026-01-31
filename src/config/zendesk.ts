export const WEB_WIDGET_KEY = '5b61a0c7-ef59-4296-9880-526703b24e69';
export const ZENDESK_SCRIPT_URL = `https://static.zdassets.com/ekr/snippet.js?key=${WEB_WIDGET_KEY}`;
export const EMBEDDED_TARGET_ELEMENT = 'messaging-container';
export const DECLINE_BUTTON_TEXT = 'Decline';
export const CONSENT_BUTTON_TEXT = 'I Agree';

/**
 * Map of Zendesk article IDs to their corresponding public help page path.
 * Keys should match article IDs found in Zendesk.
 * Values are the paths to append to the base url with a leading slash.
 * @note this will be automated in a future iteration. See {@link
 * https://app.asana.com/1/137249556945/project/1212312923065453/task/1211456826025706?focus=true}
 */
export const ARTICLE_LINK_MAP: Record<string, string> = {
  '44195025522323': '/privacy-pro/i-lost-my-device',
  '44195026045843': '/privacy-pro/vpn/calls-protected',
  '44195026217107': '/privacy-pro/vpn/smart-home-devices-affected',
  '44195026232083': '/privacy-pro/vpn/text-messages-protected',
  '44195037080467': '/privacy-pro/getting-started',
  '44195044424723': '/privacy-pro/cancel-or-change-subscription',
  '44195044576659': '/privacy-pro/identity-theft-restoration/home-title-theft',
  '44195044946451':
    '/privacy-pro/personal-information-removal/overdue-removal-requests',
  '44195045238291': '/privacy-pro/vpn/android-auto-vpn',
  '44195045431315': '/privacy-pro/vpn/security',
  '44195051769875': '/most-common-questions',
  '44195051943315': '/privacy-pro/cant-see-subscription',
  '44195052225555': '/privacy-pro/personal-information-removal/getting-started',
  '44195052506131': '/privacy-pro/subscription-on-older-os',
  '44195052528915': '/privacy-pro/turn-off-autocomplete',
  '44195052622227': '/privacy-pro/vpn/dns-blocklists',
  '44195058294803':
    '/privacy-pro/personal-information-removal/pii-still-in-search-results',
  '44195058371347':
    '/privacy-pro/personal-information-removal/stored-personal-information',
  '44195058514963': '/privacy-pro/vpn/how-do-i-know-vpn-is-connected',
  '44195064114323': '/privacy-pro/activate-subscription-on-another',
  '44195064197523': '/privacy-pro/business-corporate-subscription',
  '44195064228243': '/privacy-pro/cant-access-email',
  '44195064687507':
    '/privacy-pro/personal-information-removal/how-long-for-removals',
  '44195070971795':
    '/privacy-pro/personal-information-removal/no-records-found',
  '44195071133715': '/privacy-pro/remove-records-from-duckduckgo',
  '44213120678547': '/duckai/recent-chats',
  '44213133430547':
    '/privacy-pro/duck-ai/do-i-need-to-install-anything-to-start-using-duckai',
  '44213167650707': '/duckai/chat-models',
  '44449378258579':
    '/privacy-pro/duck-ai/which-advanced-models-do-i-get-for-duckai',
  '44449419521171': '/privacy-pro/duck-ai/subscription-chat-models',
  '44195025407123': '/privacy-pro/adding-email',
  '44195025702547': '/privacy-pro/cancel-or-change-subscription',
  '44195025991699': '/privacy-pro/using-privacy-pro-outside-us',
  '44195026257811':
    '/privacy-pro/personal-information-removal/bypass-vpn-setting',
  '44195037249171':
    '/privacy-pro/identity-theft-restoration/suspicious-activity',
  '44195037292947': '/privacy-pro/personal-information-removal/getting-started',
  '44195044477843': '/privacy-pro/free-trial-offer',
  '44195044548499': '/privacy-pro/identity-theft-restoration/covered-losses',
  '44195045136019': '/privacy-pro/terms-and-privacy',
  '44195052652179': '/privacy-pro/vpn/logs',
  '44195057932051': '/privacy-pro/change-subscription-monthly-annual',
  '44195058675603': '/privacy-pro/vpn/troubleshooting',
  '44195064386835': '/privacy-pro/identity-theft-restoration/getting-started',
  '44195071057171': '/privacy-pro/personal-information-removal/privacy',
  '44195071355923': '/privacy-pro/vpn/port-forwarding',
  '44435429411219': '/duckai/subscriber-only-ai',
  '44435447500691':
    '/privacy-pro/duck-ai/do-i-need-to-install-anything-to-start-using-duckai',
  '44449378117779':
    '/privacy-pro/duck-ai/can-i-share-duckai-with-a-family-member',
  '44449378131347':
    '/privacy-pro/duck-ai/do-i-need-to-install-anything-to-start-using-duckai',
  '44449378176275':
    '/privacy-pro/duck-ai/how-many-messages-do-i-get-per-day-is-there-a-way-to-purchase-more',
  '44449378251027':
    '/privacy-pro/duck-ai/what-is-duckai-why-is-it-included-in-the-subscription',
  '44449395474451':
    '/privacy-pro/duck-ai/im-getting-odd-or-inaccurate-answers-what-should-i-do',
  '44449395555859':
    '/privacy-pro/duck-ai/will-this-become-a-separate-upcharge-in-the-future',
  '44449419435923': '/privacy-pro/duck-ai/does-duckai-support-file-uploads',
  '44449419449619':
    '/privacy-pro/duck-ai/how-can-i-purchase-duckai-by-itself-i-already-have-a-vpn',
  '44449419459091':
    '/privacy-pro/duck-ai/how-do-i-activate-my-subscription-in-duckai-in-3rd-party-browsers',
  '44449424788883':
    '/privacy-pro/duck-ai/can-i-save-or-delete-my-message-history',
  '44449424891283':
    '/privacy-pro/duck-ai/i-dont-want-anything-to-do-with-ai-how-can-i-opt-out-of-this',
  '44449439441427':
    '/privacy-pro/duck-ai/do-any-of-these-providers-see-my-prompts',
  '44679483898387':
    '/privacy-pro/personal-information-removal/list-of-supported-data-brokers',
  '44195025690259': '/privacy-pro/not-receiving-otp',
  '44195026000915': '/privacy-pro/vpn/app-tracking-protection',
  '44195037193491':
    '/privacy-pro/identity-theft-restoration/identity-was-stolen',
  '44195037224979': '/privacy-pro/identity-theft-restoration/iris',
  '44195044369427': '/privacy-pro/activating',
  '44195044960403':
    '/privacy-pro/personal-information-removal/personal-info-reappear',
  '44195045027731': '/privacy-pro/personal-information-removal/removal-process',
  '44195045061139':
    '/privacy-pro/personal-information-removal/rescan-frequency',
  '44195045298195': '/privacy-pro/vpn/exclude-apps-websites',
  '44195045352339': '/privacy-pro/vpn/manually-choose-server-location',
  '44195052037139':
    '/privacy-pro/identity-theft-restoration/identity-was-stolen',
  '44195052180243': '/privacy-pro/personal-information-removal/2-pir-profiles',
  '44195052207379':
    '/privacy-pro/personal-information-removal/cancel-subscription-reappear',
  '44195052266131':
    '/privacy-pro/personal-information-removal/info-not-on-dashboard',
  '44195052694547': '/privacy-pro/vpn/protocols',
  '44195057780883': '/privacy-pro/cancel-or-change-subscription',
  '44195057850003': '/privacy-pro/bookmarks-passwords-gone',
  '44195058302483': '/privacy-pro/personal-information-removal/pir-outside-us',
  '44195065046547': '/privacy-pro/vpn/app-tracking-protection',
  '44195070890131':
    '/privacy-pro/personal-information-removal/bypass-vpn-setting',
  '44195071094675':
    '/privacy-pro/personal-information-removal/remove-personal-info-myself',
  '44195071217939': '/privacy-pro/vpn/add-vpn-widget',
  '44195071393683': '/privacy-pro/vpn/servers',
  '44213120764179': '/duckai/usage-limits',
  '44213133486099': '/duckai/ai-chat-privacy',
  '44213150061203': '/duckai/approach-to-ai',
  '44213167716371': '/duckai/how-to-hide-ai-chat',
} as const;
