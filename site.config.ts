export const site = {
  name: 'Continuo',
  /** <title> of the landing page. The H1 carries the description; the title carries the query. */
  homeTitle: 'Continuo: open-source control plane for dbt and Python pipelines',
  url: 'https://continuo-data.com',
  description:
    'A control plane that runs your dbt and Python pipelines — with blue/green validation, agentic remediation, and an LLM chat.',
  githubUrl: 'https://github.com/carolsimone/continuo',
  linkedinUrl: 'https://www.linkedin.com/in/simone-carolini/',
  /** Substack publication URL, e.g. https://continuo.substack.com. Empty disables the form. Set in Task 13. */
  substackUrl: 'https://continuodata.substack.com',
  /** Show the Blog + RSS links in the nav and footer. Flip to true when the Airflow post ships. */
  showBlog: false,
  /** YouTube video ID of the two-minute walkthrough. Empty renders the placeholder. */
  youtubeId: 'OlYvNGzs5L8',
  /** Helm chart version shown in the quickstart. Bump with each chart release. */
  chartVersion: '0.6.0',
  /** Cloudflare Web Analytics token. Public by design. Set in Task 11. */
  analyticsToken: '',
  /** Open Graph card. 1280x640 JPEG, under 150 KB. */
  ogImage: { path: '/og.jpg', width: 1280, height: 640, type: 'image/jpeg' },
  author: {
    name: 'Simone Carolini',
    bio: 'Builds Continuo. Data platform engineer in Berlin.',
    githubUrl: 'https://github.com/carolsimone',
  },
} as const;
