export const site = {
  name: 'Continuo',
  url: 'https://continuo-data.com',
  description:
    'A control plane for dbt and Python projects with blue/green validation and agentic remediation.',
  githubUrl: 'https://github.com/carolsimone/continuo',
  linkedinUrl: 'https://www.linkedin.com/in/simonecarolini/',
  /** Substack publication URL, e.g. https://continuo.substack.com. Empty disables the form. Set in Task 13. */
  substackUrl: '',
  /** YouTube video ID of the two-minute walkthrough. Empty renders the placeholder. */
  youtubeId: '',
  /** Helm chart version shown in the quickstart. Bump with each chart release. */
  chartVersion: '0.4.0',
  /** Cloudflare Web Analytics token. Public by design. Set in Task 11. */
  analyticsToken: '',
  author: {
    name: 'Simone Carolini',
    bio: 'Builds Continuo. Data platform engineer in Berlin.',
  },
} as const;
