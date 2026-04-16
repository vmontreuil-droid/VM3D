import type { Dictionary } from './nl'

const en: Dictionary = {
  /* ── Navigation ── */
  nav: {
    solutions: 'Solutions',
    design: 'Design',
    agents: 'Agents',
    faq: 'FAQ',
    offerte: 'Quote',
    login: 'Login',
    offerteRequest: 'Request a Quote',
  },

  /* ── Hero ── */
  hero: {
    badge: 'Stay Synchronized',
    description:
      'One platform for all your sites, machines and files. Manage everything from the office \u2014 without travelling. MV3D.CLOUD is your perfect 3D assistant.',
    contactBtn: 'Contact Us',
    loginBtn: 'Login',
    badges: [
      { val: '99.9%', label: 'Uptime' },
      { val: '500+', label: 'Sites' },
      { val: '24/7', label: 'Monitoring' },
    ],
  },

  /* ── Spotlight labels ── */
  spotlight: [
    'Live Statistics',
    'Site Progress',
    'Machine Conversion',
    'Remote Screen',
    'Push Plans',
    'Sites Map',
    'Activity Feed',
    'Full Overview',
  ],

  /* ── Dashboard preview ── */
  dashboard: {
    search: 'Search...',
    title: 'Dashboard',
    subtitle: 'Overview of all your sites',
    tabs: ['Today', 'Week', 'Month'],
    statLabels: ['Sites', 'Machines', 'Files', 'Uptime'],
    stable: 'Stable',
    progress: 'Site Progress',
    active: 'Active',
    completed: 'Completed',
    recentActivity: 'Recent Activity',
    activities: [
      { t: 'Site Antwerp', s: 'New files uploaded', time: '2m' },
      { t: 'GPS Rover #4', s: 'Came online', time: '8m' },
      { t: 'Site Brussels', s: 'Survey completed', time: '15m' },
      { t: 'Machine MC-12', s: 'Sync complete', time: '23m' },
      { t: 'Site Ghent-South', s: 'Invoice sent', time: '1h' },
    ],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    siteMap: 'Sites Map',
    quick: 'Quick',
    quickActions: ['+ New Site', '+ Upload File', '+ Link Machine'],
  },

  /* ── Solutions ── */
  solutions: {
    title: 'One central cloud for all your 3D solutions',
    description:
      'Synchronize sites, files and settings automatically across your entire MV3D fleet without leaving your desk. Have your plans designed and push them directly to Machine or Rover.',
    cards: [
      'Have your 3D plans designed for all machine controls or rovers',
      'Synchronize the delivered files directly to excavator or bulldozer',
      'Manage your sites and settings in the cloud with ticket service',
    ],
  },

  /* ── Design ── */
  design: {
    title: 'Have your 3D plans custom designed',
    desc1: 'Our team of experienced surveyor experts designs your 3D machine control plans fully customized. From DXF and DWG to XML \u2014 we deliver files that are ready to load into your machine.',
    desc2: 'The earlier you order before the execution date, the more affordable. Plan ahead and save on your design costs \u2014 we make sure everything is ready on time.',
    tiers: [
      { weeks: '4+ weeks in advance', discount: 'Best price' },
      { weeks: '1\u20134 weeks in advance', discount: 'Standard rate' },
      { weeks: '48h\u20131 week in advance', discount: 'Rush rate' },
      { weeks: '< 48h before delivery', discount: 'Express rate' },
    ],
    planning: 'PLANNING',
  },

  /* ── Conversion ── */
  conversion: {
    title: 'Different brand? No worries \u2014 convert and send',
    desc1: 'Do you have a machine control file from another brand? No problem. Upload it to MV3D Cloud, convert it with one click to the right format and send it directly to your excavator or rover.',
    desc2: 'From Topcon to Leica, from Trimble to any other system \u2014 MV3D Cloud bridges the gap between brands. No hassle with incompatible files, no time lost on site.',
    brandX: 'BRAND X',
    convert: 'CONVERT',
    crane: 'EXCAVATOR',
    rover: 'ROVER',
    price: 'PRICE',
  },

  /* ── CTA ── */
  cta: {
    title: 'Request a Quote',
    description: 'Receive a tailored proposal with no obligation',
    button: 'Request a Quote',
  },

  /* ── Stats ── */
  stats: [
    { value: '85', label: '3D Agents' },
    { value: '850+', label: 'Sites Processed' },
    { value: '99.9%', label: 'Uptime Guarantee' },
  ],

  /* ── Brands ── */
  brands: { subtitle: 'Compatible with all major machine controls' },

  /* ── Agents ── */
  agents: {
    subtitle: 'Our Network',
    title: '3D Agents',
    titleSuffix: 'Ready to help you',
    description:
      'Your request is automatically forwarded to the 3D partner closest to your site.\nFast, local and personal.',
    cards: [
      { label: '4 Countries', headline: 'Active network', text: 'Our agents are active in Belgium, the Netherlands, France and Luxembourg. Wherever your project is, we have a local specialist nearby.' },
      { label: '85 Agents', headline: 'Certified', text: 'Every member of our network is a certified surveyor, drone pilot or 3D specialist. Guaranteed quality with every assignment.' },
      { label: '12H', headline: 'Response time', text: 'Within 12 hours of your request, a qualified agent is assigned to your project. No waiting, no delays.' },
      { label: 'Ticket Service', headline: 'Always reachable', text: 'Through our ticket system you follow every request in real-time. Ask questions, share files and receive updates \u2014 all in one place.' },
    ],
  },

  /* ── Partner ── */
  partner: {
    badge: 'Become a 3D Agent',
    title: ['Join', 'the MV3D', 'network'],
    description:
      'Are you a surveyor, drone pilot or 3D specialist? Join as a certified MV3D agent and automatically receive requests from your region. You determine your own availability and rates.',
    services: [
      { title: 'Surveys', desc: 'Classic and GPS surveys on site' },
      { title: 'Drone surveys', desc: 'Aerial photogrammetry and terrain scans' },
      { title: '3D Design', desc: 'Machine control plans and ground models' },
      { title: 'Stakeouts', desc: 'Precise stakeouts and as-built control' },
    ],
    formTitle: 'Become an Agent',
    formSubtitle: 'Register as a partner',
    firstName: 'First name',
    lastName: 'Last name',
    company: 'Company name',
    email: 'Email address',
    phone: 'Phone number',
    region: 'Region / Work area',
    servicesLabel: 'Which services do you offer?',
    serviceOptions: ['Surveys', 'Drone surveys', '3D Design', 'Stakeouts'],
    experience: 'Briefly describe your experience and available equipment...',
    submit: 'Register as Agent',
  },

  /* ── FAQ ── */
  faq: {
    subtitle: 'MV3D Cloud',
    title: 'FAQ',
    moreQuestions: 'More questions? Email us at',
    items: [
      { q: 'What is MV3D Cloud?', a: 'MV3D Cloud is a cloud service that lets you send site files directly from your office to your teams in the field. No more walking between machines to transfer data \u2014 it saves you time and effort. Operators and surveyors can upload project data, points, lines and as-built information. All project data is automatically saved, ensuring thorough and accurate documentation for every project phase. Everyone with cloud access can collaborate and improve productivity.' },
      { q: 'What are the benefits of MV3D Cloud?', a: 'MV3D Cloud offers several benefits: 1) Improved collaboration \u2014 quickly and easily exchange as-built information and site files between office and field. 2) Streamlined data management \u2014 automatic synchronization of logged points and lines, real-time updates and direct sync. 3) Improved machine efficiency \u2014 remote diagnostics and backup recovery minimize downtime and improve overall fleet efficiency.' },
      { q: 'Which file formats are supported?', a: 'MV3D Cloud supports uploads in popular formats such as DXF, XML, DWG and more. Upload project data and design files, and work quickly and easily with as-built information.' },
      { q: 'How do you upload files to MV3D Cloud?', a: 'To upload files, simply create a site, assign your machines and rovers, and drag files via the \u201CFiles\u201D > \u201CUpload Design\u201D option. All files are automatically sent to the machines assigned to the site.' },
      { q: 'Can I integrate MV3D Cloud with other systems?', a: 'Yes! MV3D Cloud integrates seamlessly with various platforms, enabling a digital data flow of designs and as-built information across different machine control software. This creates an open data flow regardless of the machine control software composition in your fleet.' },
      { q: 'In which countries is MV3D active?', a: 'MV3D is active in 4 countries: Belgium, the Netherlands, France and Luxembourg. Our network of 85 certified agents covers the entire Benelux and France, so a local specialist is always available near your site.' },
      { q: 'How quickly is my request processed?', a: 'Within 12 hours of your request, a qualified agent is assigned to your project. Through our ticket system you can track progress in real-time, ask questions, share files and receive updates \u2014 all in one place.' },
      { q: 'What exactly does an MV3D Agent do?', a: 'An MV3D Agent is a certified surveyor, drone pilot or 3D specialist who is locally available for surveys, drone surveys, 3D designs and stakeouts on site. Agents automatically receive requests from their region and determine their own availability and rates.' },
      { q: 'How can I become an MV3D Agent?', a: 'Are you a surveyor, drone pilot or 3D specialist? Through the form on our website you can register as a certified MV3D Agent. After approval, you will automatically receive requests from your region. You determine your own availability, services and rates.' },
      { q: 'What services do MV3D Agents offer?', a: 'Our agents offer four core services: 1) Classic and GPS surveys on site. 2) Aerial photogrammetry and terrain scans via drones. 3) Machine control plans and ground models (3D design). 4) Precise stakeouts and as-built control. Each agent chooses which services they offer.' },
      { q: 'How does the ticket service work?', a: 'For every request, a ticket is automatically created in our system. Through the ticket you can upload files, ask questions to your agent and receive real-time updates on the status of your assignment. This way you always have a complete overview.' },
      { q: 'Can I request a quote through the platform?', a: 'Yes, through our quote page you can easily request a quote. Fill in your details and project information, and we will connect you with the nearest available agent. You will receive a personalized quote within 12 hours.' },
    ],
  },

  /* ── Footer ── */
  footer: {
    description: 'Improve collaboration, optimize productivity and reduce downtime with MV3D Cloud.',
    solutionsTitle: 'Solutions',
    solutions: ['3D Survey', 'Site Management', 'Machine Control', 'Rover'],
    platformTitle: 'Platform',
    platform: ['Dashboard', 'Support', 'Machines', 'Files'],
    contactTitle: 'Contact',
    country: 'Belgium',
    copyright: '\u00A9 2026 MV3D Cloud. All rights reserved.',
    login: 'Login',
    support: 'Support',
  },

  /* ── Contact page ── */
  contact: {
    portal: 'Contact Portal',
    title: 'Contact Request',
    subtitle: 'Ask your question or tell us how we can help. We will get back to you as soon as possible.',
    successTitle: 'Message sent!',
    successMsg: 'Your contact request has been successfully submitted with reference',
    successEmail: 'You will receive a confirmation email. We will contact you as soon as possible.',
    newMessage: 'Send a new message',
    nameLabel: 'Full name *',
    namePlaceholder: 'John Smith',
    emailLabel: 'Email address *',
    emailPlaceholder: 'john@example.com',
    phoneLabel: 'Phone number *',
    phonePlaceholder: '+32 470 12 34 56',
    vatLabel: 'VAT number',
    vatPlaceholder: 'BE 0123.456.789',
    serviceLabel: 'Regarding',
    servicePlaceholder: 'Choose a subject...',
    serviceOptions: [
      '3D Design (machine control plan)',
      '3D Survey',
      'Plan check (verify existing file)',
      'File conversion (other brand \u2192 your machine)',
      'Site management & Cloud Setup',
      'Advice & Consultancy',
      'General question',
      'Other',
    ],
    subjectLabel: 'Subject *',
    subjectPlaceholder: 'E.g. Question about 3D survey',
    messageLabel: 'Message *',
    messagePlaceholder: 'Describe your question or tell us how we can help you...',
    required: '* Required fields',
    submitBtn: 'Send Message',
    submitting: 'Sending...',
    errors: {
      name: 'Please fill in your name.',
      email: 'Please enter a valid email address.',
      phone: 'Please fill in your phone number.',
      subject: 'Please fill in a subject.',
      server: 'Your request could not be saved. Please try again later.',
    },
  },

  /* ── Offerte page ── */
  offerte: {
    portal: 'Quote Portal',
    title: 'Request a Quote',
    subtitle: 'Receive a tailored quote for your 3D project.',
    successTitle: 'Request submitted!',
    successMsg: 'Your quote request has been successfully submitted with reference',
    successEmail: 'You will receive a confirmation email. We will send you a quote as soon as possible.',
    newRequest: 'New request',
    nameLabel: 'Full name *',
    namePlaceholder: 'John Smith',
    emailLabel: 'Email address *',
    emailPlaceholder: 'john@example.com',
    phoneLabel: 'Phone number *',
    phonePlaceholder: '+32 470 12 34 56',
    vatLabel: 'VAT number *',
    vatPlaceholder: 'BE 0123.456.789',
    serviceLabel: 'Desired service *',
    servicePlaceholder: 'Select a service...',
    serviceOptions: [
      '3D Design (machine control plan)',
      '3D Survey',
      'Plan check (verify existing file)',
      'File conversion (other brand \u2192 your machine)',
      'Machine Control Installation',
      'Site management & Cloud Setup',
      'Advice & Consultancy',
      'Other',
    ],
    dateLabel: 'Desired execution date',
    dateHint: 'Order earlier = better rate!',
    subjectLabel: 'Title / Subject *',
    subjectPlaceholder: 'E.g. Quote request site Antwerp',
    descLabel: 'Project description',
    descPlaceholder: 'Describe your project or request in more detail...',
    required: '* Required fields',
    submitBtn: 'Submit Request',
    submitting: 'Sending...',
    errors: {
      name: 'Please fill in your name.',
      email: 'Please enter a valid email address.',
      phone: 'Please fill in your phone number.',
      vat: 'Please fill in your VAT number.',
      subject: 'Please fill in a subject.',
      server: 'Your request could not be saved. Please try again later.',
    },
  },

  /* ── Login page ── */
  login: {
    welcome: 'Welcome back',
    subtitle: 'Log in to view your sites, files and deliverables.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@company.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginBtn: 'Login',
    signupBtn: 'Create account',
    loading: 'Loading...',
    backHome: '\u2190 Back to home',
    errors: {
      empty: 'Please fill in email and password.',
      emailRequired: 'Please fill in your email address first.',
      login: 'Something went wrong while logging in.',
      signup: 'Something went wrong while creating your account.',
      forgot: 'Something went wrong. Please try again later.',
    },
    success: {
      forgot: 'An email has been sent to reset your password.',
      login: 'Successfully logged in, redirecting...',
    },
  },

  /* ── Reset password ── */
  resetPassword: {
    title: 'Set password',
    subtitle: 'Choose a new password for your account.',
    passwordLabel: 'New password *',
    passwordPlaceholder: 'Min. 8 characters',
    confirmLabel: 'Confirm password *',
    confirmPlaceholder: 'Repeat password',
    submitBtn: 'Save password',
    submitting: 'Saving...',
    mismatch: 'Passwords do not match.',
    minLength: 'Password must be at least 8 characters.',
    success: 'Password changed successfully! Redirecting...',
  },
}

export default en
