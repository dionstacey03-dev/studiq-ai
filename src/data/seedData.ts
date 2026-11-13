import { StudyStoreState, StudyTag } from '../types/study';

export const DEFAULT_SUBJECTS = [
  'Linear Algebra',
  'Organic Chemistry II',
  'Cognitive Neuroscience',
  'Macroeconomic Theory',
  'Computer Architecture',
  'Cell Biology',
  'General Studies',
];

export const DEFAULT_TAGS: StudyTag[] = [
  { id: 'tag-linalg', name: 'Linear Algebra', color: 'teal', category: 'subject' },
  { id: 'tag-ochem', name: 'Organic Chem II', color: 'amber', category: 'subject' },
  { id: 'tag-neuro', name: 'Neuroscience', color: 'violet', category: 'subject' },
  { id: 'tag-macro', name: 'Macroeconomics', color: 'sky', category: 'subject' },
  { id: 'tag-midterm', name: 'Midterm Prep', color: 'rose', category: 'project' },
  { id: 'tag-lab', name: 'Hippocampus Lab', color: 'emerald', category: 'project' },
  { id: 'tag-formulas', name: 'Exam Formulas', color: 'slate', category: 'project' },
];

export const INITIAL_STUDY_STATE: StudyStoreState = {
  profile: {
    name: 'Elena Vance',
    major: 'Applied Mathematics & Neuroscience',
    institution: 'Northbridge University',
    academicLevel: 'Undergraduate',
    dailyGoalMinutes: 120,
    weeklyGoalHours: 14,
    studyStreakDays: 6,
    enableReminders: true,
    enableGoalAlerts: true,
  },
  subjects: DEFAULT_SUBJECTS,
  tags: DEFAULT_TAGS,
  readNotificationIds: [],
  threads: [
    {
      id: 'thread-sample-1',
      title: 'Eigenvalues & Linear Transformations',
      subject: 'Linear Algebra',
      level: 'Undergraduate',
      style: 'Clear Overview',
      updatedAt: '2026-11-12T18:30:00.000Z',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Why do eigenvectors keep pointing along the same line after a matrix transformation?',
          createdAt: '2026-11-12T18:28:00.000Z',
          source: 'sample',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: `### Geometric Intuition

Most vectors get both **rotated** and **stretched** when multiplied by a matrix \`A\`. An **eigenvector** \`v\` is a special non-zero direction that experiences zero rotation—the transformation only scales its length by a factor \`λ\` (the **eigenvalue**):

\`\`\`
A * v = λ * v
\`\`\`

### Why This Happens

- **Invariant Span:** Any vector lying along the eigenvector's line remains on that exact line after \`A\` acts on it.
- **Scaling Factor:** If \`λ = 2\`, the vector doubles in length; if \`λ = -1\`, it reverses direction along the same axis; if \`λ = 0\`, it collapses onto the origin.
- **Practical Use:** In Principal Component Analysis (PCA) and coupled differential equations, eigenvectors decouple complex transformations into independent 1D scalings.

**Check your understanding:** If a 2×2 matrix stretches everything horizontally by 3 and leaves vertical heights unchanged, what are its two eigenvalues?`,
          createdAt: '2026-11-12T18:30:00.000Z',
          source: 'sample',
        },
      ],
    },
  ],
  documents: [
    {
      id: 'doc-sample-1',
      title: 'Week 7 Lecture Notes — Spectral Theorem & Orthogonal Diagonalization',
      subject: 'Linear Algebra',
      docType: 'Lecture Note',
      content: `1. Symmetric Matrix Definition: A real n×n matrix A is symmetric if A = A^T.
2. Spectral Theorem Guarantees:
   - Every eigenvalue of a real symmetric matrix is real (no complex conjugate pairs).
   - Eigenvectors corresponding to distinct eigenvalues are orthogonal (v_i · v_j = 0).
   - A can be factored as A = Q D Q^T where Q is orthogonal (Q^T Q = I) and D is diagonal.
3. Projection Form: A = λ1 q1 q1^T + λ2 q2 q2^T + ... + λn qn qn^T.`,
      createdAt: '2026-11-10T14:00:00.000Z',
      updatedAt: '2026-11-10T14:00:00.000Z',
      source: 'sample',
      tagIds: ['tag-linalg', 'tag-midterm'],
    },
    {
      id: 'doc-sample-2',
      title: 'Substitution & Elimination Reaction Conditions Sheet',
      subject: 'Organic Chemistry II',
      docType: 'Formula Sheet',
      content: `• SN2: Methyl / 1° substrate + strong nucleophile + polar aprotic solvent (DMSO, Acetone, DMF). Concerted backside attack -> 100% inversion.
• SN1: 3° substrate + weak nucleophile + polar protic solvent (H2O, EtOH). Planar carbocation -> racemic mixture + possible rearrangement.
• E2: Strong bulky or unbranched base (t-BuOK, NaOEt) + heat. Requires anti-periplanar β-H (180° dihedral).
• E1: 3° substrate + weak base + heat + polar protic solvent. Zaitsev (most substituted) alkene major product.`,
      createdAt: '2026-11-11T09:15:00.000Z',
      updatedAt: '2026-11-11T09:15:00.000Z',
      source: 'sample',
      tagIds: ['tag-ochem', 'tag-formulas', 'tag-midterm'],
    },
  ],
  summaries: [
    {
      id: 'sum-sample-1',
      title: 'Synaptic Plasticity & Long-Term Potentiation (LTP)',
      subject: 'Cognitive Neuroscience',
      format: 'Detailed Summary',
      tldr: 'Long-term potentiation (LTP) is a persistent strengthening of synapses driven by high-frequency stimulation, serving as a primary cellular mechanism for learning and memory formation in the hippocampus.',
      keyConcepts: [
        'NMDA receptors act as molecular coincidence detectors requiring both glutamate binding and postsynaptic depolarization.',
        'Magnesium (Mg2+) block removal allows Ca2+ influx into the postsynaptic dendritic spine.',
        'Intracellular Ca2+ activates CaMKII, triggering insertion of additional AMPA receptors into the membrane.',
        'Late-phase LTP requires CREB transcription and new protein synthesis for structural spine remodeling.',
      ],
      sections: [
        {
          heading: '1. Induction Phase (Coincidence Detection)',
          points: [
            'Presynaptic terminal releases glutamate into the synaptic cleft.',
            'AMPA receptors open immediately, letting Na+ enter and depolarize the spine.',
            'Strong depolarization expels the voltage-dependent Mg2+ ion blocking NMDA receptor pores.',
          ],
        },
        {
          heading: '2. Expression & Maintenance',
          points: [
            'Ca2+ influx through open NMDA channels activates CaMKII and PKC cascades.',
            'Vesicles carrying extra AMPA receptors fuse with the postsynaptic density, increasing synaptic sensitivity.',
            'Retrograde messengers like nitric oxide (NO) signal back to increase presynaptic vesicle release.',
          ],
        },
      ],
      keyTerms: [
        {
          term: 'NMDA Receptor',
          definition: 'Ionotropic glutamate receptor requiring both ligand binding and depolarization to conduct Ca2+.',
        },
        {
          term: 'CaMKII',
          definition: 'Calcium/calmodulin-dependent protein kinase II; phosphorylates AMPA receptors and promotes trafficking.',
        },
        {
          term: 'Hebbian Learning',
          definition: 'Principle that correlated presynaptic and postsynaptic firing strengthens the synaptic connection.',
        },
      ],
      reviewQuestions: [
        'Why does low-frequency glutamate release fail to open NMDA channels on its own?',
        'How does early-phase LTP differ biochemically from late-phase LTP?',
        'What would happen to spatial memory if AMPA receptor trafficking were blocked?',
      ],
      rawSourcePreview: 'Lecture 14 Notes — Hippocampal CA3-to-CA1 Schaffer collateral pathway, NMDA/AMPA dynamics...',
      createdAt: '2026-11-11T16:20:00.000Z',
      source: 'sample',
      tagIds: ['tag-neuro', 'tag-lab'],
    },
    {
      id: 'sum-sample-2',
      title: 'SN1 vs. SN2 Nucleophilic Substitution Mechanisms',
      subject: 'Organic Chemistry II',
      format: 'Revision Notes',
      tldr: 'Bimolecular (SN2) reactions proceed in a single concerted step with inversion of stereochemistry, while unimolecular (SN1) reactions proceed via a planar carbocation intermediate yielding racemization.',
      keyConcepts: [
        'SN2 rate = k[Substrate][Nucleophile]; favored by methyl/primary substrates and polar aprotic solvents.',
        'SN1 rate = k[Substrate]; favored by tertiary substrates and polar protic solvents that stabilize ions.',
        'SN2 produces 100% Walden inversion; SN1 produces a racemic mixture.',
      ],
      sections: [
        {
          heading: '1. Kinetics & Rate-Determining Steps',
          points: [
            'SN2 has no intermediate—one transition state with pentacoordinate carbon.',
            'SN1 rate-determining step is leaving group departure to form a carbocation.',
          ],
        },
        {
          heading: '2. Solvent & Nucleophile Effects',
          points: [
            'Polar aprotic solvents (DMSO, acetone, DMF) leave anionic nucleophiles unsolvated for SN2.',
            'Polar protic solvents (H2O, EtOH) stabilize both carbocation and leaving group for SN1.',
          ],
        },
      ],
      keyTerms: [
        {
          term: 'Walden Inversion',
          definition: 'Backside nucleophilic attack in SN2 that inverts stereochemical configuration at a chiral center.',
        },
        {
          term: 'Carbocation Rearrangement',
          definition: '1,2-hydride or 1,2-alkyl shift in SN1 intermediates to reach a more stable cation.',
        },
      ],
      reviewQuestions: [
        'Why do tertiary alkyl halides fail to undergo SN2 substitution?',
        'Which solvent class accelerates SN2 reactions and why?',
      ],
      createdAt: '2026-11-10T11:05:00.000Z',
      source: 'sample',
      tagIds: ['tag-ochem', 'tag-midterm'],
    },
  ],
  quizzes: [
    {
      id: 'quiz-sample-1',
      title: 'Linear Algebra: Determinants & Eigenvalues',
      subject: 'Linear Algebra',
      difficulty: 'Intermediate',
      questionType: 'multiple-choice',
      createdAt: '2026-11-11T14:00:00.000Z',
      source: 'sample',
      tagIds: ['tag-linalg', 'tag-midterm'],
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'If an n × n matrix A has an eigenvalue λ = 0, what must be true about A?',
          options: [
            'A is singular and its determinant equals 0',
            'A must be the zero matrix',
            'A is orthogonal with orthonormal columns',
            'All diagonal entries of A equal 0',
          ],
          correctIndex: 0,
          explanation:
            'If λ = 0 is an eigenvalue, there exists a non-zero vector v such that Av = 0v = 0, meaning A has a non-trivial nullspace and det(A) = 0.',
          concept: 'Nullspace & Singular Matrices',
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          question: 'The sum of all eigenvalues (with algebraic multiplicity) of a square matrix equals:',
          options: [
            'The determinant of the matrix',
            'The trace of the matrix',
            'The rank of the matrix',
            'The Frobenius norm squared',
          ],
          correctIndex: 1,
          explanation:
            'By Vieta’s formulas applied to det(A - λI) = 0, the sum of the eigenvalues equals the trace (sum of main diagonal entries).',
          concept: 'Trace Invariant',
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: 'When a 2 × 2 matrix scales every vector in R² by 2, areas of shapes scale by:',
          options: ['2', '1', '4', '√2'],
          correctIndex: 2,
          explanation:
            'Uniform scaling by 2 corresponds to matrix 2I, whose determinant is 2 × 2 = 4.',
          concept: 'Geometric Determinant',
        },
        {
          id: 'q4',
          type: 'multiple-choice',
          question: 'Which property guarantees an n × n real matrix is orthogonally diagonalizable?',
          options: [
            'It is invertible',
            'It is upper triangular',
            'It is symmetric (A = Aᵀ)',
            'All entries are positive',
          ],
          correctIndex: 2,
          explanation:
            'By the Spectral Theorem, every real symmetric matrix has real eigenvalues and an orthonormal eigenbasis.',
          concept: 'Spectral Theorem',
        },
      ],
    },
    {
      id: 'quiz-sample-2',
      title: 'Macroeconomics: IS-LM & Monetary Policy',
      subject: 'Macroeconomic Theory',
      difficulty: 'Foundational',
      questionType: 'mixed',
      createdAt: '2026-11-09T19:15:00.000Z',
      source: 'sample',
      tagIds: ['tag-macro'],
      questions: [
        {
          id: 'mq1',
          type: 'multiple-choice',
          question: 'In the standard IS-LM model, an expansionary open-market purchase shifts:',
          options: [
            'The IS curve to the right',
            'The LM curve to the right (downward)',
            'The LM curve to the left',
            'Both curves to the left',
          ],
          correctIndex: 1,
          explanation:
            'Increasing the money supply lowers the equilibrium interest rate for any output level, shifting LM rightward.',
          concept: 'Monetary Policy Transmission',
        },
        {
          id: 'mq2',
          type: 'true-false',
          question: 'True or False: Monetary policy becomes maximally effective when an economy is in a liquidity trap near the zero lower bound.',
          options: ['True', 'False'],
          correctIndex: 1,
          explanation:
            'False. Near the zero lower bound (flat LM curve), additional money supply injections do not lower interest rates further.',
          concept: 'Liquidity Trap',
        },
        {
          id: 'mq3',
          type: 'multiple-choice',
          question: 'What is "crowding out" in fiscal policy?',
          options: [
            'Higher government spending raises interest rates and reduces private investment',
            'Lower taxes reduce household savings below zero',
            'Imports automatically fall when exports rise',
            'Central banks stop issuing treasury bills',
          ],
          correctIndex: 0,
          explanation:
            'Debt-financed government spending increases interest rates, partially offsetting private investment.',
          concept: 'Fiscal Policy Crowding Out',
        },
      ],
    },
  ],
  quizAttempts: [
    {
      id: 'att-1',
      quizId: 'quiz-sample-1',
      quizTitle: 'Linear Algebra: Determinants & Eigenvalues',
      subject: 'Linear Algebra',
      score: 3,
      total: 4,
      percentage: 75,
      completedAt: '2026-11-08T15:30:00.000Z',
    },
    {
      id: 'att-2',
      quizId: 'quiz-sample-2',
      quizTitle: 'Macroeconomics: IS-LM & Monetary Policy',
      subject: 'Macroeconomic Theory',
      score: 2,
      total: 3,
      percentage: 67,
      completedAt: '2026-11-10T10:15:00.000Z',
    },
    {
      id: 'att-3',
      quizId: 'quiz-sample-1',
      quizTitle: 'Linear Algebra: Determinants & Eigenvalues',
      subject: 'Linear Algebra',
      score: 4,
      total: 4,
      percentage: 100,
      completedAt: '2026-11-11T17:45:00.000Z',
    },
  ],
  decks: [
    {
      id: 'deck-sample-1',
      title: 'Organic Chemistry II — Substitution & Elimination',
      subject: 'Organic Chemistry II',
      createdAt: '2026-11-10T09:00:00.000Z',
      source: 'sample',
      tagIds: ['tag-ochem', 'tag-formulas'],
      cards: [
        {
          id: 'fc-1',
          front: 'What stereochemical outcome occurs in an SN2 reaction at a chiral center?',
          back: 'Complete Walden inversion (100% inversion of configuration) due to mandatory 180° backside nucleophilic attack.',
          hint: 'Think of an umbrella flipping inside out in strong wind.',
          mastery: 'mastered',
        },
        {
          id: 'fc-2',
          front: 'Which solvent class accelerates SN2 reactions and why?',
          back: 'Polar aprotic solvents (DMSO, acetone, DMF, MeCN) because they solvate cations without hydrogen-bonding to the nucleophile.',
          hint: 'Aprotic = no O–H or N–H protons to cage the nucleophile.',
          mastery: 'mastered',
        },
        {
          id: 'fc-3',
          front: 'What is the rate law for an E1 elimination reaction?',
          back: 'Rate = k[Substrate]. It is unimolecular because leaving group departure to form the carbocation is rate-determining.',
          hint: 'Same rate-determining step as SN1.',
          mastery: 'difficult',
        },
        {
          id: 'fc-4',
          front: 'What geometric requirement must an E2 elimination satisfy?',
          back: 'Anti-periplanar geometry: the β-hydrogen and the leaving group must lie at a 180° dihedral angle.',
          hint: 'Allows optimal σ to π* orbital overlap in the transition state.',
          mastery: 'new',
        },
      ],
    },
    {
      id: 'deck-sample-2',
      title: 'Cognitive Neuroscience — Memory Systems',
      subject: 'Cognitive Neuroscience',
      createdAt: '2026-11-11T13:20:00.000Z',
      source: 'sample',
      tagIds: ['tag-neuro', 'tag-lab'],
      cards: [
        {
          id: 'fc-5',
          front: 'Which brain structure is critical for consolidating episodic memories into neocortical long-term storage?',
          back: 'The hippocampus (medial temporal lobe).',
          hint: 'Classic lesion evidence from patient H.M.',
          mastery: 'mastered',
        },
        {
          id: 'fc-6',
          front: 'Why is the NMDA receptor called a molecular coincidence detector?',
          back: 'Opening its channel requires BOTH presynaptic glutamate binding AND postsynaptic depolarization to expel the Mg2+ pore block.',
          hint: 'Requires two simultaneous events.',
          mastery: 'learning',
        },
        {
          id: 'fc-7',
          front: 'Which protein kinase is persistently activated by Ca2+ influx during early LTP?',
          back: 'CaMKII (Calcium/calmodulin-dependent protein kinase II), which drives AMPA receptor insertion into the postsynaptic density.',
          hint: 'Autophosphorylates to stay active briefly after Ca2+ drops.',
          mastery: 'difficult',
        },
      ],
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Solve Problem Set 6: Singular Value Decomposition',
      subject: 'Linear Algebra',
      day: 'Thu',
      dateLabel: 'Nov 12',
      dueDate: '2026-11-12',
      startTime: '09:00',
      durationMinutes: 75,
      priority: 'High',
      reminderEnabled: true,
      completed: true,
    },
    {
      id: 'task-2',
      title: 'Review LTP & NMDA receptor lecture notes',
      subject: 'Cognitive Neuroscience',
      day: 'Thu',
      dateLabel: 'Nov 12',
      dueDate: '2026-11-12',
      startTime: '14:00',
      durationMinutes: 45,
      priority: 'Medium',
      reminderEnabled: true,
      completed: false,
    },
    {
      id: 'task-3',
      title: 'Practice 15 SN1/SN2/E1/E2 synthesis problems',
      subject: 'Organic Chemistry II',
      day: 'Thu',
      dateLabel: 'Nov 12',
      dueDate: '2026-11-12',
      startTime: '18:30',
      durationMinutes: 60,
      priority: 'High',
      reminderEnabled: true,
      completed: false,
    },
    {
      id: 'task-4',
      title: 'Summarize Chapter 9: Phillips Curve & Inflation Expectations',
      subject: 'Macroeconomic Theory',
      day: 'Fri',
      dateLabel: 'Nov 13',
      dueDate: '2026-11-13',
      startTime: '10:30',
      durationMinutes: 50,
      priority: 'Medium',
      reminderEnabled: false,
      completed: false,
    },
    {
      id: 'task-5',
      title: 'Active recall session on Memory Systems flashcards',
      subject: 'Cognitive Neuroscience',
      day: 'Sat',
      dateLabel: 'Nov 14',
      dueDate: '2026-11-14',
      startTime: '11:00',
      durationMinutes: 35,
      priority: 'Low',
      reminderEnabled: false,
      completed: false,
    },
    {
      id: 'task-6',
      title: 'Timed Midterm Practice Quiz: Diagonalization',
      subject: 'Linear Algebra',
      day: 'Sun',
      dateLabel: 'Nov 15',
      dueDate: '2026-11-15',
      startTime: '16:00',
      durationMinutes: 60,
      priority: 'High',
      reminderEnabled: true,
      completed: false,
    },
  ],
  sessions: [
    {
      id: 'ses-1',
      subject: 'Linear Algebra',
      topic: 'Spectral Theorem & Orthogonal Projections',
      minutes: 95,
      date: '2026-11-09',
      day: 'Mon',
      source: 'sample',
    },
    {
      id: 'ses-2',
      subject: 'Organic Chemistry II',
      topic: 'Carbocation Stability & Solvent Effects',
      minutes: 80,
      date: '2026-11-09',
      day: 'Mon',
      source: 'sample',
    },
    {
      id: 'ses-3',
      subject: 'Cognitive Neuroscience',
      topic: 'Hippocampal Consolidation Pathways',
      minutes: 110,
      date: '2026-11-10',
      day: 'Tue',
      source: 'sample',
    },
    {
      id: 'ses-4',
      subject: 'Macroeconomic Theory',
      topic: 'IS-LM & Liquidity Trap Derivations',
      minutes: 70,
      date: '2026-11-11',
      day: 'Wed',
      source: 'sample',
    },
    {
      id: 'ses-5',
      subject: 'Linear Algebra',
      topic: 'Problem Set 6: SVD Decomposition',
      minutes: 75,
      date: '2026-11-12',
      day: 'Thu',
      source: 'sample',
    },
    {
      id: 'ses-6',
      subject: 'Organic Chemistry II',
      topic: 'Flashcard Review: Stereochemistry',
      minutes: 30,
      date: '2026-11-12',
      day: 'Thu',
      source: 'sample',
    },
  ],
  activities: [
    {
      id: 'act-1',
      module: 'planner',
      action: 'Completed study block',
      detail: 'Solve Problem Set 6: Singular Value Decomposition (75 min)',
      subject: 'Linear Algebra',
      timestamp: '2026-11-12T10:15:00.000Z',
      source: 'sample',
    },
    {
      id: 'act-2',
      module: 'quiz',
      action: 'Scored 100% on quiz',
      detail: 'Linear Algebra: Determinants & Eigenvalues (4/4)',
      subject: 'Linear Algebra',
      timestamp: '2026-11-11T17:45:00.000Z',
      source: 'sample',
    },
    {
      id: 'act-3',
      module: 'summarizer',
      action: 'Preloaded sample study guide',
      detail: 'Synaptic Plasticity & Long-Term Potentiation (LTP)',
      subject: 'Cognitive Neuroscience',
      timestamp: '2026-11-11T16:20:00.000Z',
      source: 'sample',
    },
    {
      id: 'act-4',
      module: 'flashcards',
      action: 'Preloaded flashcard deck',
      detail: 'Organic Chemistry II — Substitution & Elimination',
      subject: 'Organic Chemistry II',
      timestamp: '2026-11-10T09:30:00.000Z',
      source: 'sample',
    },
  ],
  readLater: [
    {
      id: 'rl-sample-1',
      title: 'Spectral Theorem & Orthogonal Projections — Deep Dive',
      subject: 'Linear Algebra',
      origin: 'assistant',
      originId: 'msg-2',
      estimatedMinutes: 3,
      status: 'unread',
      savedAt: '2026-11-11T19:10:00.000Z',
      source: 'sample',
      tagIds: ['tag-linalg', 'tag-midterm'],
      content: `# Spectral Theorem & Orthogonal Projections

## 1. Core Intuition
Every real symmetric matrix $A = A^T$ behaves like a pure scaling transformation along a set of mutually perpendicular axes. Instead of shearing or rotating vectors in complex ways, $A$ stretches space independently along an orthonormal eigenbasis.

## 2. Formal Statement
If $A \\in \\mathbb{R}^{n \\times n}$ is symmetric ($A^T = A$), then:

1. **Real Eigenvalues**: Every eigenvalue $\\lambda_i$ of $A$ is guaranteed to be a real number, even though general matrices can have complex eigenvalues.
2. **Orthogonal Eigenspaces**: Eigenvectors corresponding to distinct eigenvalues are automatically orthogonal ($v_i \\cdot v_j = 0$ whenever $\\lambda_i \\neq \\lambda_j$).
3. **Orthogonal Diagonalization**: There exists an orthogonal matrix $Q$ ($Q^T Q = I$) and a real diagonal matrix $\\Lambda$ such that:
   $$A = Q \\Lambda Q^T = \\sum_{i=1}^n \\lambda_i q_i q_i^T$$

## 3. Reading the Spectral Decomposition
The outer product $P_i = q_i q_i^T$ is the **rank-1 orthogonal projection matrix** onto the line spanned by unit eigenvector $q_i$:

- When you multiply $P_i x = (q_i^T x) q_i$, you extract the component of $x$ pointing along direction $q_i$.
- Multiplying by $A$ therefore projects $x$ onto each orthogonal axis, scales each component by $\\lambda_i$, and sums the pieces back together.
- Because the $q_i$ are orthonormal, $\\sum_{i=1}^n P_i = I$ and $P_i P_j = 0$ for $i \\neq j$.

## 4. Connection to Quadratic Forms & Optimization
For any vector $x$, the quadratic form $x^T A x$ simplifies in the eigenbasis $y = Q^T x$ to:
$$x^T A x = \\sum_{i=1}^n \\lambda_i y_i^2$$

This immediately tells you:
- **Positive Definite ($\\lambda_i > 0$)**: Bowl-shaped surface with a unique global minimum (crucial in convex optimization and Hessian tests).
- **Rayleigh Quotient Bounds**: For any unit vector $\\|x\\| = 1$, $\\lambda_{\\min} \\le x^T A x \\le \\lambda_{\\max}$.

## 5. Active Recall Checklist
- Why can a non-symmetric matrix fail to have an orthogonal eigenbasis?
- Prove in two lines why eigenvectors for distinct eigenvalues of $A^T = A$ must be orthogonal.
- Show why $P_i^2 = P_i$ and $P_i^T = P_i$ for any orthogonal projection matrix.`,
    },
    {
      id: 'rl-sample-2',
      title: 'Synaptic Plasticity & Hippocampal LTP Mechanisms',
      subject: 'Cognitive Neuroscience',
      origin: 'summarizer',
      originId: 'sum-1',
      estimatedMinutes: 3,
      status: 'unread',
      savedAt: '2026-11-11T16:45:00.000Z',
      source: 'sample',
      tagIds: ['tag-neuro', 'tag-lab'],
      content: `# Synaptic Plasticity & Long-Term Potentiation (LTP)

## Summary Overview
Long-Term Potentiation (LTP) is a persistent, activity-dependent increase in synaptic strength following high-frequency stimulation, most extensively characterized at the **Schaffer collateral–CA1 synapse** in the hippocampus. It serves as the primary cellular candidate mechanism for associative memory encoding.

## 1. The Coincidence-Detector NMDA Receptor
The NMDA glutamate receptor is uniquely gated by **two simultaneous conditions**:

- **Presynaptic Glutamate Release**: Glutamate binds to both AMPA and NMDA receptors on the postsynaptic dendritic spine.
- **Postsynaptic Depolarization**: Strong AMPA-mediated $\\text{Na}^+$ influx depolarizes the membrane enough to expel the extracellular $\\text{Mg}^{2+}$ ion blocking the NMDA channel pore.

Because both presynaptic firing and postsynaptic depolarization are required, the NMDA receptor physically implements **Hebbian learning** (*"neurons that fire together, wire together"*).

## 2. Intracellular Calcium Signaling Cascade
Once unblocked, NMDA channels admit $\\text{Ca}^{2+}$ into the dendritic spine, triggering a rapid biochemical cascade:

1. **CaMKII Activation**: Elevated $\\text{Ca}^{2+}$ binds calmodulin, activating **CaMKII** (Calcium/Calmodulin-dependent Protein Kinase II), which autophosphorylates to stay active beyond the initial stimulus.
2. **AMPA Receptor Trafficking**: Active CaMKII promotes phosphorylation of existing AMPA receptors (increasing single-channel conductance) and insertion of additional AMPA receptors from intracellular endosomes into the postsynaptic density.
3. **Structural Remodeling**: Actin polymerization enlarges the dendritic spine head, increasing synaptic contact area.

## 3. Early LTP vs. Late LTP
| Phase | Duration | Protein Synthesis Required? | Key Molecular Drivers |
| --- | --- | --- | --- |
| **Early LTP (E-LTP)** | 1–3 hours | No | CaMKII, PKC, rapid AMPA insertion |
| **Late LTP (L-LTP)** | > 24 hours | Yes | PKA -> MAPK/ERK -> **CREB** transcription |

## 4. Key Experimental Properties
- **Cooperativity**: Threshold stimulation across multiple fibers is needed to depolarize the postsynaptic cell enough to relieve the $\\text{Mg}^{2+}$ block.
- **Associativity**: Pairing a weak input with a strong convergent input potentiates the weak synapse.
- **Input Specificity**: LTP remains restricted to activated synapses and does not spread indiscriminately to inactive neighbors.

## 5. Revision Self-Check
- What happens to LTP induction if APV (an NMDA antagonist) is applied before vs. after high-frequency tetanus?
- Why does blocking protein synthesis with anisomycin spare E-LTP while abolishing L-LTP?`,
    },
  ],
};
