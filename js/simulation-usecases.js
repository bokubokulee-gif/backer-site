/* Original fictional studies. All numerical results below are authored teaching fixtures. */
(function () {
'use strict';
var CASES = {
  "product-innovation": {
    "label": "Product Innovation",
    "index": "01",
    "headline": "A product can win attention.",
    "emphasis": "Getting started still has a cost.",
    "intro": "A product enters attention before it enters a workflow. Follow the distance between noticing it, trying it and making room for it.",
    "caseName": "Atlas Research Workspace",
    "caseTag": "Company adoption",
    "caseTitle": "Design the first working session.",
    "caseIntro": "Atlas is a fictional research workspace preparing a team pilot. Compare a feature-led, self-service invitation with a guided first session around a real research task.",
    "decision": "Choose a launch package before assigning the onboarding team.",
    "constraint": "Hold the product, pilot price and eligible population fixed. Change the invitation and first-session support together.",
    "comparison": "Feature-led, self-service entry versus task-led, guided entry.",
    "outcome": "Start a trial, retain the current workflow or defer. Shares are illustrative assumptions, not observed product analytics.",
    "mechanism": "Attention brings a product into consideration. Workflow fit and the cost of the first session determine whether consideration becomes trial.",
    "validation": "Randomize launch packages, record exposure and measure trial starts within a predefined window. Evaluate repeat use as a separate outcome.",
    "objectives": [
      [
        "Separate notice from trial",
        "Compare notice with trial choice. More attention need not produce more adoption."
      ],
      [
        "Locate the adoption constraint",
        "Compare individual contributors, team leads and IT stewards. Both wording and support change between packages."
      ],
      [
        "Preserve the outside option",
        "Retain the current workflow and deferral as alternatives. An undecided response is not adoption."
      ]
    ],
    "audiences": [
      [
        "Individual contributors",
        "50%",
        "Need a useful answer quickly. They can start a personal trial but have limited time for setup."
      ],
      [
        "Team leads",
        "30%",
        "Need shared conventions and evidence that the new tool reduces coordination cost."
      ],
      [
        "IT stewards",
        "20%",
        "Need permission clarity and a credible path into existing systems. Interest alone does not remove this burden."
      ]
    ],
    "questions": [
      [
        "Q1",
        "Which invitation is noticed, and which leads to a trial choice?",
        "Two endpoints",
        "Use the same synthetic population as the denominator for notice and trial."
      ],
      [
        "Q2",
        "Which role changes its trial choice under guided entry?",
        "Paired comparison",
        "Compare each role under both launch packages. Role weights stay at 50%, 30% and 20%."
      ],
      [
        "Q3",
        "What do people choose when they do not start?",
        "Single choice",
        "Start Atlas, keep the current workflow, or defer. The three choices sum to 100%."
      ]
    ],
    "findings": [
      {
        "short": "Notice ≠ trial",
        "title": "The most visible invitation earns fewer trial choices.",
        "interpretation": "Feature-led entry wins notice; guided entry wins trial choices. Because wording and support change together, their effects cannot be separated here.",
        "question": "Q1 · Which invitation is noticed, and which leads to a trial choice?",
        "unit": "Share of assigned synthetic population · %",
        "type": "grouped",
        "series": [
          "Notices invitation",
          "Chooses trial"
        ],
        "labels": [
          "Feature-led / self-service",
          "Task-led / guided"
        ],
        "values": [
          [
            72,
            28
          ],
          [
            65,
            40
          ]
        ],
        "max": 100,
        "note": "Two outcomes, one population denominator. Trial is an immediate hypothetical choice; retention requires a later observation."
      },
      {
        "short": "Find the constraint",
        "title": "The largest change occurs where setup is hardest.",
        "interpretation": "IT stewards have the lowest initial trial share and the largest difference under guided entry: 16 percentage points. This is an assumed role difference, not a discovered segment.",
        "question": "Q2 · Which role changes its trial choice under guided entry?",
        "unit": "Trial choice within each synthetic role · %",
        "type": "dumbbell",
        "series": [
          "Self-service",
          "Guided entry"
        ],
        "labels": [
          "Individual contributors",
          "Team leads",
          "IT stewards"
        ],
        "values": [
          [
            34,
            46
          ],
          [
            26,
            37
          ],
          [
            14,
            30
          ]
        ],
        "max": 60,
        "note": "Role weights: 50%, 30%, 20%. Weighted trial shares are 27.6% and 40.1%, shown as 28% and 40% in the population summary."
      },
      {
        "short": "Keep the alternative",
        "title": "Most of the population still chooses an alternative.",
        "interpretation": "Guided entry increases trial choice. Retaining the current workflow and deferring remain common. Both alternatives belong in the decision.",
        "question": "Q3 · What do people choose when they do not start?",
        "unit": "Choice distribution · % of assigned population",
        "type": "stacked",
        "series": [
          "Start Atlas",
          "Keep workflow",
          "Defer"
        ],
        "labels": [
          "Self-service",
          "Guided entry"
        ],
        "values": [
          [
            28,
            47,
            25
          ],
          [
            40,
            39,
            21
          ]
        ],
        "max": 100,
        "note": "Illustrative shares, rounded and normalized. Each row sums to 100%; no real participant records are shown."
      }
    ]
  },
  "marketing-brand": {
    "label": "Marketing & Brand",
    "index": "02",
    "headline": "A campaign changes what people notice.",
    "emphasis": "Test what they choose next.",
    "intro": "A campaign can travel widely without changing a choice. Follow the message through notice, memory and commitment, measuring each outcome separately.",
    "caseName": "Fieldnotes Membership",
    "caseTag": "Internet attention → action",
    "caseTitle": "Choose a campaign for a creator membership.",
    "caseIntro": "Fieldnotes is a fictional independent publication launching paid membership. Compare a trend-led hook, practical proof and a member’s experience.",
    "decision": "Choose the campaign direction before committing to distribution.",
    "constraint": "Use the same membership, price, audience and placement allocation. Only the campaign territory changes.",
    "comparison": "Trend hook, practical proof and member voice are shown as three alternative campaign conditions.",
    "outcome": "Notice, delayed recall and immediate subscription choice. Renewal and lifetime value require separate evidence.",
    "mechanism": "A salient hook can recruit attention without establishing relevance. Remembering the offer and accepting its cost are additional transitions.",
    "validation": "Randomize exposure, measure correct recall at fixed delays and observe paid starts. Evaluate attribution and renewal separately.",
    "objectives": [
      [
        "Identify what the campaign changes",
        "Compare notice and subscription choice without collapsing them into one engagement score."
      ],
      [
        "Test what remains after the first encounter",
        "Inspect delayed recall under identical authored observation times. A high opening can decay quickly."
      ],
      [
        "Account for deferral",
        "Keep subscribing now, returning later and choosing elsewhere in the outcome distribution."
      ]
    ],
    "audiences": [
      [
        "Topic regulars",
        "35%",
        "Already follow the subject and evaluate whether membership offers something they cannot get elsewhere."
      ],
      [
        "Social discoverers",
        "40%",
        "Encounter the offer through peers or a feed; require context before considering the subscription."
      ],
      [
        "Occasional readers",
        "25%",
        "Have limited time and weaker familiarity. Attention can be incidental rather than evidence of buying intent."
      ]
    ],
    "questions": [
      [
        "Q1",
        "Which campaign is noticed, and which earns a subscription choice?",
        "Two endpoints",
        "Each campaign has the same assigned synthetic audience and the same membership price."
      ],
      [
        "Q2",
        "Which offer can still be recalled after the encounter?",
        "Repeated horizon",
        "Compare day 1, 3, 7 and 14 recall as separate constructed snapshots. This is not subscriber retention."
      ],
      [
        "Q3",
        "What is the immediate choice after seeing the campaign?",
        "Single choice",
        "Subscribe now, consider later, or choose another use of money and time."
      ]
    ],
    "findings": [
      {
        "short": "Beyond the hook",
        "title": "The strongest opening is not the strongest subscription case.",
        "interpretation": "The trend hook earns the most notice. Practical proof earns twice its subscription-choice share. Reach and action require separate measures.",
        "question": "Q1 · Which campaign is noticed, and which earns a subscription choice?",
        "unit": "Share of assigned synthetic audience · %",
        "type": "grouped",
        "series": [
          "Notices campaign",
          "Chooses subscription"
        ],
        "labels": [
          "Trend hook",
          "Practical proof",
          "Member voice"
        ],
        "values": [
          [
            74,
            11
          ],
          [
            58,
            22
          ],
          [
            49,
            19
          ]
        ],
        "max": 100,
        "note": "Hypothetical subscription choices are not paid conversions. No real creative has been scored."
      },
      {
        "short": "What remains",
        "title": "An early attention advantage can disappear from memory.",
        "interpretation": "By day 14, the trend hook falls below both alternatives. Practical proof and member voice reach the same recall share from different starts. These are illustrative trajectories, not fitted forgetting rates.",
        "question": "Q2 · Which offer can still be recalled after the encounter?",
        "unit": "Correct offer recall at each horizon · %",
        "type": "line",
        "series": [
          "Trend hook",
          "Practical proof",
          "Member voice"
        ],
        "labels": [
          "Day 1",
          "Day 3",
          "Day 7",
          "Day 14"
        ],
        "values": [
          [
            62,
            45,
            36
          ],
          [
            49,
            40,
            34
          ],
          [
            33,
            35,
            32
          ],
          [
            21,
            29,
            29
          ]
        ],
        "max": 80,
        "note": "Separate day-specific recall snapshots in the same assumed audience. Recall does not establish renewal or sustained use."
      },
      {
        "short": "The next choice",
        "title": "Deferral is a material outcome, not a rounding error.",
        "interpretation": "At least a quarter of each audience defers. Counting those responses as subscriptions overstates action and hides the next decision.",
        "question": "Q3 · What is the immediate choice after seeing the campaign?",
        "unit": "Immediate choice distribution · %",
        "type": "stacked",
        "series": [
          "Subscribe now",
          "Consider later",
          "Choose elsewhere"
        ],
        "labels": [
          "Trend hook",
          "Practical proof",
          "Member voice"
        ],
        "values": [
          [
            11,
            29,
            60
          ],
          [
            22,
            25,
            53
          ],
          [
            19,
            28,
            53
          ]
        ],
        "max": 100,
        "note": "The outside choice includes other spending, other content and no purchase. Every row sums to 100%."
      }
    ]
  },
  "audience-segmentation": {
    "label": "Audience Segmentation",
    "index": "03",
    "headline": "Averages hide",
    "emphasis": "the reasons people choose.",
    "intro": "Useful segments explain differences in response. Preserve the relationships among interest, social exposure, available time and the cost of changing a routine.",
    "caseName": "Common Ground Community",
    "caseTag": "Behavioral cohort differences",
    "caseTitle": "Choose an invitation that fits the constraint.",
    "caseIntro": "Common Ground is a fictional knowledge community launching a program. Compare how a reminder or an asynchronous format changes participation across three assumed groups.",
    "decision": "Choose which access change to test for each audience.",
    "constraint": "Keep the program topic and audience weights fixed. Compare a reminder with an asynchronous participation format.",
    "comparison": "Reference invitation, peer reminder and asynchronous format are separate authored conditions.",
    "outcome": "Participation choice within each group, and its contribution to total participation.",
    "mechanism": "Similar interest can coexist with different limits. A peer signal addresses uncertainty about relevance; a flexible format addresses the time needed to act.",
    "validation": "Test whether the groups persist in new data, compare simpler segmentation baselines and randomize the proposed access changes.",
    "objectives": [
      [
        "Represent joint profiles",
        "Show the assumed relationships between interest, peer sensitivity, time pressure and switching burden."
      ],
      [
        "Match a change to a constraint",
        "Compare the reminder and format changes within each group. Do not assume the most interested group is the most responsive."
      ],
      [
        "Separate size from contribution",
        "Weight participation by audience share. A large audience need not contribute a proportionate share of actions."
      ]
    ],
    "audiences": [
      [
        "Practitioners",
        "35%",
        "High domain interest and a clear use for the material, alongside a substantial time constraint."
      ],
      [
        "Peer-led explorers",
        "40%",
        "Moderate initial familiarity and stronger sensitivity to peer participation. Social evidence can make the program relevant."
      ],
      [
        "Quiet readers",
        "25%",
        "Strong subject interest but little dependence on peers and a high burden of synchronous participation."
      ]
    ],
    "questions": [
      [
        "Q1",
        "Which traits occur together in each assumed profile?",
        "Joint-profile description",
        "Illustrative indices from 0 to 100, not estimated proportions or discovered clusters."
      ],
      [
        "Q2",
        "Which access change increases participation choice for each group?",
        "Three-condition comparison",
        "Reference, peer reminder and asynchronous format are compared with fixed audience weights."
      ],
      [
        "Q3",
        "Which groups account for the population's participation choices?",
        "Weighted decomposition",
        "Compare population shares with each group's contribution under the reference invitation."
      ]
    ],
    "findings": [
      {
        "short": "Read the joint profile",
        "title": "Interest is similar where the ability to act is not.",
        "interpretation": "Practitioners and quiet readers share strong interest but differ in peer dependence and time constraints. These profiles are specified assumptions, not clustering results.",
        "question": "Q1 · Which traits occur together in each assumed profile?",
        "unit": "Authored trait index · 0–100",
        "type": "heatmap",
        "series": [
          "Interest",
          "Peer sensitivity",
          "Time pressure",
          "Switching burden"
        ],
        "labels": [
          "Practitioners",
          "Peer-led explorers",
          "Quiet readers"
        ],
        "values": [
          [
            84,
            32,
            70,
            45
          ],
          [
            62,
            86,
            48,
            38
          ],
          [
            71,
            24,
            88,
            72
          ]
        ],
        "max": 100,
        "note": "Each row is a joint profile. Indices express assumptions, not prevalence, survey responses or measured intensity."
      },
      {
        "short": "Match the constraint",
        "title": "A reminder and a flexible format reach different margins.",
        "interpretation": "Peer-led explorers respond most to the reminder; quiet readers respond to the asynchronous format. The average would conceal which constraint each change addresses.",
        "question": "Q2 · Which access change increases participation choice for each group?",
        "unit": "Participation choice within each group · %",
        "type": "grouped",
        "series": [
          "Reference",
          "Peer reminder",
          "Async format"
        ],
        "labels": [
          "Practitioners",
          "Peer-led explorers",
          "Quiet readers"
        ],
        "values": [
          [
            29,
            31,
            44
          ],
          [
            21,
            35,
            28
          ],
          [
            9,
            10,
            26
          ]
        ],
        "max": 60,
        "note": "Illustrative conditional response shares. They do not identify causal effects of reminders or format changes."
      },
      {
        "short": "Weight the contribution",
        "title": "Audience size and action share are different quantities.",
        "interpretation": "Quiet readers are 25% of the audience but about 11% of reference participation choices. Their contribution reflects both group size and conditional participation.",
        "question": "Q3 · Which groups account for the population's participation choices?",
        "unit": "Normalized composition · %",
        "type": "stacked",
        "series": [
          "Practitioners",
          "Peer-led explorers",
          "Quiet readers"
        ],
        "labels": [
          "Population",
          "Reference participants"
        ],
        "values": [
          [
            35,
            40,
            25
          ],
          [
            48.8,
            40.4,
            10.8
          ]
        ],
        "max": 100,
        "note": "Reference participation = 0.35×29% + 0.40×21% + 0.25×9% = 20.8%. Contribution shares are normalized over that total."
      }
    ]
  },
  "scenario-planning": {
    "label": "Scenario Planning",
    "index": "04",
    "headline": "An attention spike",
    "emphasis": "can lead to different trades.",
    "intro": "An information shock sends attention, beliefs and positions along different paths. Specify the comparison before inferring a financial consequence.",
    "caseName": "Northline Earnings Narrative",
    "caseTag": "Financial attention & decisions",
    "caseTitle": "Trace an earnings update without assuming the trade.",
    "caseIntro": "Northline is a fictional listed company announcing a capacity expansion. Investors encounter it with different prior beliefs, positions and limits on new buying.",
    "decision": "Establish the behavioral evidence needed to interpret an attention spike as buying demand.",
    "constraint": "Keep the announcement and initial investor mix fixed. Holdings, prices, order-book liquidity and fundamentals do not update in this illustration.",
    "comparison": "Follow notice, agreement with the expansion thesis and an increase-position choice over fourteen illustrative days.",
    "outcome": "Day-specific response shares and buy, hold or sell choices within each assumed investor group.",
    "mechanism": "An update can enter many consideration sets without changing beliefs to the same degree. Existing positions and risk capacity further limit what becomes an order.",
    "validation": "Freeze information at each forecast time. Observe exposure and beliefs separately, then evaluate orders alongside positions and size. Price impact requires a separate model.",
    "objectives": [
      [
        "Separate the three responses",
        "Track notice, thesis agreement and the choice to add to a position as different population endpoints."
      ],
      [
        "Preserve the portfolio constraint",
        "Show where buying capacity or an existing position limits action despite attention."
      ],
      [
        "Keep the accounting boundary",
        "Buy, hold and sell shares count choices. They do not measure order size, net flows or price impact."
      ]
    ],
    "audiences": [
      [
        "Narrative followers",
        "30%",
        "More responsive to circulating stories, with lower assumed buying capacity than fundamental analysts."
      ],
      [
        "Fundamental analysts",
        "40%",
        "More emphasis on the expansion thesis and its evidence. An update can be noticed and still fail the investment case."
      ],
      [
        "Risk-bound holders",
        "30%",
        "Already hold the asset and face a binding portfolio constraint. Favorable interpretation need not produce additional buying."
      ]
    ],
    "questions": [
      [
        "Q1",
        "How do attention, thesis agreement and buying choice evolve?",
        "Repeated horizon",
        "Each series is a distinct response share at the indicated day. None is cumulative."
      ],
      [
        "Q2",
        "What do the investor groups choose at day fourteen?",
        "Buy / hold / sell",
        "All groups are assumed to hold the asset. The three choices are mutually exclusive in each snapshot."
      ],
      [
        "Q3",
        "How much favorable interpretation reaches a buying choice?",
        "Paired endpoints",
        "Compare positive thesis agreement with the choice to increase the position within each group."
      ]
    ],
    "findings": [
      {
        "short": "Follow separate paths",
        "title": "Attention peaks before belief or position choice.",
        "interpretation": "Notice rises sharply. Agreement changes more slowly, and buying choice remains lower. These distinct trajectories illustrate responses, not returns.",
        "question": "Q1 · How do attention, thesis agreement and buying choice evolve?",
        "unit": "Share of synthetic investor population · %",
        "type": "line",
        "series": [
          "Notices update",
          "Agrees with thesis",
          "Chooses to add"
        ],
        "labels": [
          "Day 0",
          "Day 1",
          "Day 3",
          "Day 7",
          "Day 14"
        ],
        "values": [
          [
            18,
            22,
            8
          ],
          [
            72,
            26,
            12
          ],
          [
            65,
            30,
            15
          ],
          [
            49,
            31,
            14
          ],
          [
            32,
            28,
            12
          ]
        ],
        "max": 80,
        "note": "Day-specific authored shares. At day 14, weighted cohort values round to 28% agreement and 12% buying choice."
      },
      {
        "short": "Inspect the position",
        "title": "For constrained holders, attention often ends in holding.",
        "interpretation": "Risk-bound holders most often hold. The pattern reflects a specified portfolio constraint; it says nothing about trade volume or execution prices.",
        "question": "Q2 · What do the investor groups choose at day fourteen?",
        "unit": "Day-14 choice within each investor group · %",
        "type": "stacked",
        "series": [
          "Buy",
          "Hold",
          "Sell"
        ],
        "labels": [
          "Narrative followers",
          "Fundamental analysts",
          "Risk-bound holders"
        ],
        "values": [
          [
            20,
            62,
            18
          ],
          [
            13,
            61,
            26
          ],
          [
            3,
            85,
            12
          ]
        ],
        "max": 100,
        "note": "Choice shares sum to 100% in each row. Order sizes and available liquidity are not represented."
      },
      {
        "short": "Locate the gap",
        "title": "Favorable interpretation is larger than the buying margin.",
        "interpretation": "Every group shows a gap between agreement and buying. A belief is one input to a decision, not an order or a capital inflow.",
        "question": "Q3 · How much favorable interpretation reaches a buying choice?",
        "unit": "Day-14 share within each investor group · %",
        "type": "dumbbell",
        "series": [
          "Agrees with thesis",
          "Chooses to add"
        ],
        "labels": [
          "Narrative followers",
          "Fundamental analysts",
          "Risk-bound holders"
        ],
        "values": [
          [
            45,
            20
          ],
          [
            28,
            13
          ],
          [
            12,
            3
          ]
        ],
        "max": 60,
        "note": "Population weights: 30%, 40%, 30%. Weighted agreement is 28.3%; weighted buying choice is 12.1%. No price, return or net-flow inference follows."
      }
    ]
  },
  "strategic-communications": {
    "label": "Strategic Communications",
    "index": "05",
    "headline": "People hear the same words.",
    "emphasis": "They act on different meanings.",
    "intro": "Responsibilities, expectations and concerns shape how an announcement is read. Examine what each audience infers, supports and is prepared to do.",
    "caseName": "Vector Research Rollout",
    "caseTag": "Company stakeholder decisions",
    "caseTitle": "Explain a new AI workflow before asking people to adopt it.",
    "caseIntro": "Vector is a fictional company introducing AI-assisted research. Compare an efficiency-first announcement with one explaining the work, safeguards and responsibilities that remain with people.",
    "decision": "Choose the announcement framing and internal disclosure sequence for a limited pilot.",
    "constraint": "Keep the actual rollout plan fixed. Wording and communication sequence are examined as separate comparisons.",
    "comparison": "Efficiency-first versus work-and-safeguards framing; then manager briefing before versus after the company-wide post.",
    "outcome": "Inferred intent, support, resource commitment and willingness to join the pilot. Each is an authored hypothetical response.",
    "mechanism": "A reader interprets an announcement in light of their role. Support for a plan is different from assigning time, owning a task or volunteering for its pilot.",
    "validation": "Test comprehension with the actual announcement and observe role-specific actions. Where appropriate, randomize wording or sequence. Intent cannot substitute for action.",
    "objectives": [
      [
        "Examine the inferred intent",
        "Compare whether different audiences interpret the change as role elimination under each message."
      ],
      [
        "Distinguish support from commitment",
        "Measure agreement with the rollout separately from willingness to allocate time or resources."
      ],
      [
        "Test the disclosure sequence",
        "Compare a direct manager briefing before the public internal post with the reverse order, holding the underlying plan fixed."
      ]
    ],
    "audiences": [
      [
        "Research operators",
        "50%",
        "Will use the workflow day to day. Need clarity about responsibility, skill requirements and the effect on their role."
      ],
      [
        "Team leads",
        "30%",
        "Must translate the announcement into staffing, training and accountability."
      ],
      [
        "System owners",
        "20%",
        "Must support the data, permissions and operational integration behind the promised workflow."
      ]
    ],
    "questions": [
      [
        "Q1",
        "What intent does each audience infer from the announcement?",
        "Message comparison",
        "Efficiency-first: “Accelerate output with AI-assisted research.” Work-and-safeguards: “Assist research; people retain review and decision responsibility.”"
      ],
      [
        "Q2",
        "Who supports the plan, and who will commit resources?",
        "Separate endpoints",
        "Under the work-and-safeguards message, ask about support and the next concrete commitment separately."
      ],
      [
        "Q3",
        "Does notification order change willingness to join the pilot?",
        "Sequence comparison",
        "Compare a manager briefing before the company-wide post with the post arriving first."
      ]
    ],
    "findings": [
      {
        "short": "Meaning depends on role",
        "title": "The inferred intent changes across messages and audiences.",
        "interpretation": "Explaining the work and safeguards reduces the assumed share reading the change as role elimination. These are specified interpretations, not semantic scores for a real announcement.",
        "question": "Q1 · What intent does each audience infer from the announcement?",
        "unit": "Interprets change as role elimination · % within role",
        "type": "dumbbell",
        "series": [
          "Efficiency first",
          "Work & safeguards"
        ],
        "labels": [
          "Research operators",
          "Team leads",
          "System owners"
        ],
        "values": [
          [
            65,
            34
          ],
          [
            47,
            29
          ],
          [
            38,
            24
          ]
        ],
        "max": 80,
        "note": "Only one interpretation is plotted. A lower share does not by itself establish trust, acceptance or willingness to act."
      },
      {
        "short": "Support needs an owner",
        "title": "Support is broader than resource commitment.",
        "interpretation": "In every role, support exceeds commitment. The next question is who will take a concrete step.",
        "question": "Q2 · Who supports the plan, and who will commit resources?",
        "unit": "Share within role under work-and-safeguards framing · %",
        "type": "grouped",
        "series": [
          "Supports the plan",
          "Commits resources"
        ],
        "labels": [
          "Research operators",
          "Team leads",
          "System owners"
        ],
        "values": [
          [
            78,
            43
          ],
          [
            69,
            36
          ],
          [
            82,
            56
          ]
        ],
        "max": 100,
        "note": "The commitment is role-specific: trial time, team capacity or integration support. These are hypothetical choices, not executed commitments."
      },
      {
        "short": "Sequence is a condition",
        "title": "A direct briefing matters most to the people doing the work.",
        "interpretation": "Research operators show the largest difference between notification orders; system owners show less. One communication sequence need not suit every role.",
        "question": "Q3 · Does notification order change willingness to join the pilot?",
        "unit": "Chooses to join pilot · % within role",
        "type": "dumbbell",
        "series": [
          "Company post first",
          "Manager briefing first"
        ],
        "labels": [
          "Research operators",
          "Team leads",
          "System owners"
        ],
        "values": [
          [
            39,
            57
          ],
          [
            42,
            52
          ],
          [
            59,
            61
          ]
        ],
        "max": 80,
        "note": "The plan and message are fixed in this comparison. Illustrative differences are not measured sequence effects."
      }
    ]
  }
};
var key = document.body.dataset.case;
var study = CASES[key];
if (!study) return;
var $ = function (id) { return document.getElementById(id); };
var all = function (selector) { return Array.from(document.querySelectorAll(selector)); };
var colors = ['#e9bd86', '#e77b40', '#c4c0b8', '#817b73'];
var params = new URLSearchParams(location.search);
var initialView = ['scenario', 'design', 'findings'].includes(params.get('view')) ? params.get('view') : 'scenario';
var initialFinding = Math.max(0, Math.min(2, Number(params.get('finding')) || 0));
var state = { panel: initialView, design: 'objectives', finding: Math.floor(initialFinding) };
var namespace = 'http://www.w3.org/2000/svg';
var chartInspection = { finding: -1, row: -1, series: [] };
function t(value) { return window.BackerI18n ? window.BackerI18n.t(value) : value; }
function node(tag, text, className) { var e = document.createElement(tag); if (text !== undefined) e.textContent = t(text); if (className) e.className = className; return e; }
function svgNode(tag, attrs, text) { var e = document.createElementNS(namespace, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, /^aria-(?:label|description|valuetext|roledescription)$/.test(k) ? t(String(attrs[k])) : String(attrs[k])); }); if (text !== undefined) e.textContent = t(text); return e; }
function mark(svg, tag, attrs, text) { var e = svgNode(tag, attrs, text); svg.append(e); return e; }
function label(svg, x, y, value, attrs) { return mark(svg, 'text', Object.assign({x:x,y:y,'dominant-baseline':'middle',style:'font-size:14px'}, attrs || {}), value); }
function number(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
function updateUrl() { var u = new URL(location.href); u.searchParams.set('view', state.panel); if (state.panel === 'findings') u.searchParams.set('finding', state.finding); else u.searchParams.delete('finding'); history.replaceState(null, '', u); }
function selectPanel(name, focus) {
  state.panel = name;
  all('[data-panel]').forEach(function (button) { var active = button.dataset.panel === name; button.setAttribute('aria-selected', active); button.tabIndex = active ? 0 : -1; if (focus && active) button.focus(); });
  ['scenario','design','findings'].forEach(function (id) { $('case-' + id).hidden = id !== name; });
  if (name === 'findings') renderFinding();
  updateUrl();
}
function selectDesign(name, focus) {
  state.design = name;
  all('[data-design]').forEach(function (button) { var active = button.dataset.design === name; button.setAttribute('aria-selected', active); button.tabIndex = active ? 0 : -1; if (focus && active) button.focus(); });
  ['objectives','audiences','questions'].forEach(function (id) { $('design-' + id).hidden = id !== name; });
}
function keyboardTabs(selector, choose) {
  var buttons = all(selector);
  buttons.forEach(function (button, i) { button.addEventListener('keydown', function (event) {
    var next;
    if (event.key === 'ArrowRight') next = (i + 1) % buttons.length;
    else if (event.key === 'ArrowLeft') next = (i + buttons.length - 1) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault(); choose(buttons[next]); buttons[next].focus();
  }); });
}
function buildDesign() {
  ['objectives','audiences','questions'].forEach(function (kind) {
    study[kind].forEach(function (row, i) {
      var details = node('details'); details.setAttribute('name', 'study-' + kind); details.open = i === 0;
      var summary = node('summary'); summary.append(node('span', kind === 'questions' ? row[0] : String(i + 1).padStart(2, '0'), 'uc-row-index'), node('span', kind === 'questions' ? row[1] : row[0], 'uc-row-title'));
      details.append(summary);
      var content = node('div', undefined, 'uc-row-content');
      if (kind === 'audiences') {
        var weight = node('div', undefined, 'uc-row-weight'); var track = node('span'); track.setAttribute('aria-hidden', 'true'); var fill = node('i'); fill.style.width = row[1]; track.append(fill);
        weight.append(track, node('b', row[1] + ' of the assumed population')); content.append(weight, node('p', row[2]));
      } else if (kind === 'questions') content.append(node('p', row[2], 'uc-row-meta'), node('p', row[3]));
      else content.append(node('p', row[1]));
      details.append(content); $('design-' + kind).append(details);
      summary.addEventListener('click', function () { if (!details.open) Array.from(details.parentElement.children).forEach(function (other) { if (other !== details) other.open = false; }); });
    });
  });
}
function legend(finding) {
  $('chart-legend').replaceChildren();
  if (finding.type === 'heatmap') {
    var description = node('span', 'Lower index'); var gradient = node('i'); gradient.style.cssText = 'width:70px;height:8px;border-radius:2px;background:linear-gradient(90deg,#1b1a19,#e9bd86)'; description.append(gradient, node('span','Higher index')); $('chart-legend').append(description); return;
  }
  finding.series.forEach(function (name,i) { var item = node('span'); var dot = node('i'); dot.style.background = colors[i]; item.append(dot, document.createTextNode(t(name))); $('chart-legend').append(item); });
}
function renderTable(finding) {
  var table = node('table'); var head = node('thead'); var header = node('tr'); header.append(node('th', finding.type === 'line' ? 'Horizon' : 'Condition / group'));
  finding.series.forEach(function (series) { header.append(node('th',series)); }); head.append(header); table.append(head);
  var body = node('tbody'); finding.labels.forEach(function (name, i) { var row = node('tr'); var cell = node('th',name); cell.scope='row'; row.append(cell); finding.values[i].forEach(function (value) { row.append(node('td',number(value) + (finding.type === 'heatmap' ? '' : '%'))); }); body.append(row); }); table.append(body); $('finding-values').replaceChildren(table);
}
function ticks(svg, width, height, maximum, left, right, top) {
  [0,.25,.5,.75,1].forEach(function (fraction) { var x = left + fraction * (width-left-right); mark(svg,'line',{x1:x,x2:x,y1:top,y2:height-33,stroke:'#393735','stroke-dasharray':'2 5'}); label(svg,x,height-12,number(maximum*fraction) + '%',{'text-anchor':fraction===0?'start':fraction===1?'end':'middle',style:'font-size:14px'}); });
}
function chartRow(svg,index,name) {
  return mark(svg,'g',{'data-chart-row':index,'aria-label':'Inspect '+name,role:'button',tabindex:'0','aria-pressed':String(chartInspection.row===index),class:'uc-chart-row'});
}
function seriesMark(svg,tag,attrs,text,series) { attrs['data-chart-series']=series;return mark(svg,tag,attrs,text); }
function rowHit(svg,width,y,height) { return mark(svg,'rect',{x:0,y:y,width:width,height:height,fill:'transparent',class:'uc-chart-hit'}); }
function grouped(svg, f, width) {
  var each=f.series.length*31+47,height=f.labels.length*each+52,right=48,usable=width-right;
  svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';ticks(svg,width,height,f.max,0,right,28);
  f.labels.forEach(function(name,i){var y=i*each+15,layer=chartRow(svg,i,name);label(layer,0,y,name,{style:'font-size:15px;fill:#f5f3ee;paint-order:stroke;stroke:#121214;stroke-width:5px'});
    f.values[i].forEach(function(value,j){var by=y+22+j*31,bw=value/f.max*usable;seriesMark(layer,'rect',{x:0,y:by,width:Math.max(1,bw),height:13,rx:2,fill:colors[j]},undefined,j);seriesMark(layer,'text',{x:bw+9,y:by+7,'dominant-baseline':'middle',style:'font-size:14px;fill:#f5f3ee'},number(value)+'%',j);});rowHit(layer,width,y-13,each-7);
  });return height;
}
function dumbbell(svg,f,width) {
  var each=110,height=f.labels.length*each+52,right=24,left=8,usable=width-left-right;
  svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';ticks(svg,width,height,f.max,left,right,39);
  f.labels.forEach(function(name,i){var y=i*each+17,layer=chartRow(svg,i,name);label(layer,0,y,name,{style:'font-size:15px;fill:#f5f3ee;paint-order:stroke;stroke:#121214;stroke-width:5px'});var xs=f.values[i].map(function(v){return left+v/f.max*usable}),cy=y+51;mark(layer,'line',{x1:xs[0],x2:xs[1],y1:cy,y2:cy,stroke:'#8c8173','stroke-width':2});f.values[i].forEach(function(v,j){seriesMark(layer,'circle',{cx:xs[j],cy:cy,r:5,fill:colors[j],stroke:'#121214','stroke-width':2},undefined,j);seriesMark(layer,'text',{x:xs[j],y:cy+(j?20:-19),'dominant-baseline':'middle','text-anchor':'middle',style:'font-size:14px;fill:'+colors[j]},number(v)+'%',j);});rowHit(layer,width,y-14,each-6);});return height;
}
function stacked(svg,f,width) {
  var each=105,height=f.labels.length*each+45;svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';
  f.labels.forEach(function(name,i){var y=i*each+17,layer=chartRow(svg,i,name);label(layer,0,y,name,{style:'font-size:15px;fill:#f5f3ee'});var x=0;f.values[i].forEach(function(v,j){var w=width*v/100;seriesMark(layer,'rect',{x:x,y:y+24,width:Math.max(0,w-2),height:35,fill:colors[j],rx:2},undefined,j);var valueLabel=number(v)+'%',labelWidth=valueLabel.length*7.5;
      if(w>=labelWidth+10)seriesMark(layer,'text',{x:x+w/2,y:y+42,'dominant-baseline':'middle','text-anchor':'middle',style:'font-size:14px;fill:#08080a'},valueLabel,j);
      else{var labelX=x+w/2,anchor='middle';if(labelX+labelWidth/2>width-2){labelX=width-2;anchor='end';}else if(labelX-labelWidth/2<2){labelX=2;anchor='start';}seriesMark(layer,'text',{x:labelX,y:y+14,'dominant-baseline':'middle','text-anchor':anchor,style:'font-size:14px;fill:'+colors[j]},valueLabel,j);}x+=w;});rowHit(layer,width,y-14,each-6);});
  label(svg,0,height-13,'0%',{style:'font-size:14px'});label(svg,width,height-13,'100%',{'text-anchor':'end',style:'font-size:14px'});return height;
}
function lines(svg,f,width) {
  var height=355,left=43,right=15,top=20,bottom=45,pw=width-left-right,ph=height-top-bottom,times=f.labels.map(function(s){return Number(s.replace(/[^0-9.]/g,''));}),min=times[0],span=times[times.length-1]-min,x=function(t){return left+(t-min)/span*pw;},y=function(v){return top+(1-v/f.max)*ph;};svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';
  [0,.25,.5,.75,1].forEach(function(frac){var yy=y(frac*f.max);mark(svg,'line',{x1:left,x2:width-right,y1:yy,y2:yy,stroke:'#393735','stroke-dasharray':'2 5'});label(svg,left-9,yy,number(frac*f.max),{'text-anchor':'end',style:'font-size:14px'});});
  var lastTick=-Infinity;times.forEach(function(t,i){var position=x(t),endpoint=i===0||i===times.length-1,room=position-lastTick>=48&&x(times[times.length-1])-position>=32;if(endpoint||room){label(svg,position,height-18,(i===0?'Day ':'')+t,{'text-anchor':i===0?'start':i===times.length-1?'end':'middle',style:'font-size:14px'});lastTick=position;}});
  f.series.forEach(function(series,j){var d=f.values.map(function(row,i){return(i?'L':'M')+x(times[i])+','+y(row[j]);}).join(' ');seriesMark(svg,'path',{d:d,fill:'none',stroke:colors[j],'stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':j===2?'5 4':'none'},undefined,j);f.values.forEach(function(row,i){var dot=seriesMark(svg,'circle',{cx:x(times[i]),cy:y(row[j]),r:chartInspection.row===i?5:3.2,fill:colors[j]},undefined,j);dot.append(svgNode('title',{},t(series)+', '+t(f.labels[i])+': '+number(row[j])+'%'));});});
  times.forEach(function(t,i){var layer=chartRow(svg,i,f.labels[i]),position=x(t),start=i===0?left:(x(times[i-1])+position)/2,end=i===times.length-1?width-right:(position+x(times[i+1]))/2;if(chartInspection.row===i)mark(layer,'line',{x1:position,x2:position,y1:top,y2:height-bottom,stroke:'#dfd4c4','stroke-width':1,'stroke-dasharray':'3 5',opacity:.6});mark(layer,'rect',{x:start,y:top,width:end-start,height:height-top-bottom,fill:'transparent',class:'uc-chart-hit'});});return height;
}
function heatmap(svg,f,width) {
  var left=170,top=70,rowHeight=74,cell=(width-left)/f.series.length,height=top+f.labels.length*rowHeight+10;svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';
  f.series.forEach(function(name,i){var translatedName=t(name),words=translatedName===name?name.split(' '):(translatedName.match(/.{1,5}/gu)||[translatedName]);words.forEach(function(word,j){label(svg,left+(i+.5)*cell,23+j*18,word,{'text-anchor':'middle',style:'font-size:14px'});});});
  f.labels.forEach(function(name,i){var layer=chartRow(svg,i,name);label(layer,0,top+i*rowHeight+31,name,{style:'font-size:14px;fill:#f5f3ee'});f.values[i].forEach(function(v,j){var xx=left+j*cell,yy=top+i*rowHeight;seriesMark(layer,'rect',{x:xx+2,y:yy,width:cell-5,height:62,rx:3,fill:'rgba(233,189,134,'+(.1+.85*v/100)+')',stroke:'#393735'},undefined,j);seriesMark(layer,'text',{x:xx+cell/2,y:yy+31,'dominant-baseline':'middle','text-anchor':'middle',style:'font-size:18px;fill:'+(v>=55?'#08080a':'#f5f3ee')},number(v),j);});rowHit(layer,width,top+i*rowHeight,rowHeight-5);});return height;
}
function renderChart(f) {
  var wrap=document.querySelector('.uc-chart-scroll');var width=Math.max(200,Math.round(wrap.clientWidth)-4);var wide=f.type==='heatmap';document.querySelector('.uc-chart-figure').classList.toggle('is-heatmap',wide);if(wide)width=Math.max(650,width);var svg=$('finding-chart');svg.replaceChildren();svg.style.width=width+'px';
  var description=f.labels.map(function(name,i){return t(name)+': '+f.series.map(function(s,j){return t(s)+' '+number(f.values[i][j])+(f.type==='heatmap'?'':'%');}).join(', ');}).join('. ');
  svg.setAttribute('aria-label',t(f.title)+'. '+t(f.unit)+'. '+description+'. '+t('Illustrative values.'));svg.append(svgNode('title',{},f.title),svgNode('desc',{},description));
  ({grouped:grouped,dumbbell:dumbbell,stacked:stacked,line:lines,heatmap:heatmap}[f.type])(svg,f,width);
  applyChartInspection(f);
  document.querySelector('.uc-scroll-note').hidden=!(wide&&width>wrap.clientWidth+1);
}
function prepareChartInspection(finding) {
  if(chartInspection.finding!==state.finding){chartInspection.finding=state.finding;chartInspection.row=finding.type==='line'?finding.labels.length-1:0;chartInspection.series=finding.series.map(function(){return true;});}
  $('chart-inspect-label').textContent=finding.type==='line'?'Inspect a time point':'Inspect a condition or group';
  var select=$('chart-inspect-row');select.replaceChildren();var allRows=node('option',finding.type==='line'?'All time points':'All conditions / groups');allRows.value='-1';select.append(allRows);
  finding.labels.forEach(function(name,i){var option=node('option',name);option.value=i;select.append(option);});select.value=chartInspection.row;
  var controls=$('chart-series-controls');controls.replaceChildren();
  finding.series.forEach(function(name,i){var button=node('button');button.type='button';button.dataset.emphasizeSeries=i;var dot=node('i');dot.style.background=finding.type==='heatmap'?colors[0]:colors[i];button.append(dot,node('span',name));button.setAttribute('aria-pressed',chartInspection.series[i]);button.addEventListener('click',function(){chartInspection.series[i]=!chartInspection.series[i];button.setAttribute('aria-pressed',chartInspection.series[i]);applyChartInspection(finding);});controls.append(button);});
  var restore=node('button','Emphasize all','uc-series-all');restore.type='button';restore.addEventListener('click',function(){chartInspection.series=finding.series.map(function(){return true;});Array.from(controls.querySelectorAll('[data-emphasize-series]')).forEach(function(button){button.setAttribute('aria-pressed','true');});applyChartInspection(finding);});controls.append(restore);
}
function selectChartRow(index,keyboard) {
  var finding=study.findings[state.finding];chartInspection.row=index;$('chart-inspect-row').value=index;renderChart(finding);
  if(keyboard){var target=$('finding-chart').querySelector('[data-chart-row="'+index+'"]');if(target)target.focus({preventScroll:true});}
}
function selectionReading(finding) {
  var target=$('chart-selection');target.replaceChildren();var active=chartInspection.series.map(function(show,i){return show?i:-1;}).filter(function(i){return i>=0;});
  if(chartInspection.row<0){target.append(node('strong',finding.type==='line'?'All authored time points':'All authored conditions'),node('p','Select a row or time point in the chart, or use the inspector above, to read its exact values. Emphasis preserves the original scale and denominator.'));return;}
  var row=chartInspection.row;target.append(node('strong',finding.labels[row]));
  var values=node('div',undefined,'uc-selected-values');active.forEach(function(i){var value=node('span');var dot=node('i');dot.style.background=finding.type==='heatmap'?colors[0]:colors[i];value.append(dot,node('span',finding.series[i]),node('b',number(finding.values[row][i])+(finding.type==='heatmap'?'':'%')));values.append(value);});target.append(values);
  if(!active.length){target.append(node('p','No series is emphasized. Select a series above to inspect its authored value.'));return;}
  var explanation;
  if(finding.type==='stacked')explanation='This row totals '+number(finding.values[row].reduce(function(sum,v){return sum+v;},0))+'%. Dimmed segments retain their original share; selection does not renormalize them.';
  else if(finding.type==='heatmap')explanation='These are authored 0–100 trait indices for this joint profile. They do not express the prevalence of this group.';
  else if(active.length===2){var first=active[0],second=active[1],difference=finding.values[row][second]-finding.values[row][first];explanation=finding.series[second]+' minus '+finding.series[first]+': '+(difference>0?'+':'')+number(Math.round(difference*10)/10)+' percentage points. This is a descriptive contrast between authored rates.';}
  else explanation='These are the exact authored values at the selected '+(finding.type==='line'?'time point':'condition')+'. '+finding.unit+'.';
  target.append(node('p',explanation));
}
function applyChartInspection(finding) {
  var svg=$('finding-chart');Array.from(svg.querySelectorAll('[data-chart-series]')).forEach(function(el){el.style.opacity=chartInspection.series[Number(el.dataset.chartSeries)]?'1':'.16';});
  Array.from(svg.querySelectorAll('[data-chart-row]')).forEach(function(layer){var index=Number(layer.dataset.chartRow),selected=chartInspection.row===index;layer.setAttribute('aria-pressed',String(selected));layer.style.opacity=chartInspection.row<0||selected||finding.type==='line'?'1':'.7';
    if(!layer.dataset.inspectionBound){layer.dataset.inspectionBound='true';layer.addEventListener('click',function(){selectChartRow(index,false);});layer.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();selectChartRow(index,true);}else if(event.key==='ArrowDown'||event.key==='ArrowRight'){event.preventDefault();selectChartRow((index+1)%finding.labels.length,true);}else if(event.key==='ArrowUp'||event.key==='ArrowLeft'){event.preventDefault();selectChartRow((index+finding.labels.length-1)%finding.labels.length,true);}});}
  });selectionReading(finding);
}
$('chart-inspect-row').addEventListener('change',function(){selectChartRow(Number(this.value),false);});

function renderFinding() {
  var f=study.findings[state.finding];all('[data-finding]').forEach(function(button){var active=Number(button.dataset.finding)===state.finding;button.setAttribute('aria-selected',active);button.tabIndex=active?0:-1;});
  $('finding-panel').setAttribute('aria-labelledby','finding-tab-'+state.finding);$('finding-index').textContent='FINDING '+String(state.finding+1).padStart(2,'0')+' / 03';$('finding-title').textContent=t(f.title);$('chart-unit').textContent=t(f.unit);$('chart-note').textContent=t(f.note);$('finding-interpretation').textContent=t(f.interpretation);$('finding-question').textContent=t(f.question);legend(f);renderTable(f);prepareChartInspection(f);renderChart(f);
}
function chooseFinding(index,focus){state.finding=index;renderFinding();updateUrl();if(focus)$('finding-tab-'+index).focus();}
study.findings.forEach(function(f,i){var button=node('button');button.type='button';button.id='finding-tab-'+i;button.dataset.finding=i;button.setAttribute('role','tab');button.setAttribute('aria-controls','finding-panel');button.append(node('b',String(i+1).padStart(2,'0')),node('span',f.short));button.addEventListener('click',function(){chooseFinding(i,false);});document.querySelector('.uc-finding-tabs').append(button);});
all('[data-panel]').forEach(function(button){button.addEventListener('click',function(){selectPanel(button.dataset.panel,false);});});
all('[data-open-panel]').forEach(function(button){button.addEventListener('click',function(){selectPanel(button.dataset.openPanel,true);document.querySelector('.uc-explorer').scrollIntoView({behavior:'auto',block:'start'});});});
all('[data-design]').forEach(function(button){button.addEventListener('click',function(){selectDesign(button.dataset.design,false);});});
keyboardTabs('[data-panel]',function(button){selectPanel(button.dataset.panel,false);});keyboardTabs('[data-design]',function(button){selectDesign(button.dataset.design,false);});keyboardTabs('[data-finding]',function(button){chooseFinding(Number(button.dataset.finding),false);});
$('trace-question').addEventListener('click',function(){selectPanel('design',false);selectDesign('questions',false);var rows=Array.from($('design-questions').children);rows.forEach(function(row,i){row.open=i===state.finding;});rows[state.finding].querySelector('summary').focus();rows[state.finding].scrollIntoView({behavior:'auto',block:'center'});});
var resizeTimeout;window.addEventListener('resize',function(){clearTimeout(resizeTimeout);resizeTimeout=setTimeout(function(){if(state.panel==='findings')renderChart(study.findings[state.finding]);},120);});
buildDesign();selectDesign('objectives',false);selectPanel(state.panel,false);
var currentPageLink=document.querySelector('.sim-site-nav [aria-current=page]');
if(currentPageLink && window.innerWidth<1050) currentPageLink.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});

/* Object-driven teaching scenes; authored assumptions remain inspectable. */
function initializeExperiment() {
  var host=document.querySelector('.uc-scene');if(!host)return;
  var plot=$('experiment-plot'),mode=host.dataset.experiment;
  var blue='#e9bd86',ink='#f5f3ee',gray='#c4c0b8',line='#393735',gold='#e77b40';
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var scene={obstacles:[true,true,true],linked:false,armed:-1,eventDay:3,injected:false,frame:0,message:0,sent:false,progress:1,visible:true,pinned:-1,hovered:-1};
  var costs=[.20,.25,.27],frames=['Research operators','Team leads','System owners'];
  var messages=[{name:'Novelty',p:[.81,.42,.14]},{name:'Practical utility',p:[.62,.72,.36]},{name:'Peer endorsement',p:[.55,.80,.31]}];
  var messageNames=['Efficiency target','Accountability','Joint pilot'];
  var priors=[[.30,.55,.15],[.55,.20,.25],[.20,.10,.70]],messageWeights=[[1.45,1.15,.55],[1.30,.55,1.10],[1.20,.40,1.45]];
  var positions={},starts={},raf=0,started=0,duration=0,dragging=false,dragMoved=false,lastWidth=0;
  function pct(value){return (Math.round(value*10)/10).toFixed(1).replace(/\.0$/,'')+'%';}
  function ease(t){return 1-Math.pow(1-Math.max(0,Math.min(1,t)),3);}
  function textAt(parent,x,y,text,attrs){return mark(parent,'text',Object.assign({x:x,y:y,'text-anchor':'middle','dominant-baseline':'middle',style:'font-size:14px;fill:'+gray},attrs||{}),text);}
  function path(parent,d,color,width,opacity){return mark(parent,'path',{d:d,fill:'none',stroke:color,'stroke-width':width||1,opacity:opacity===undefined?1:opacity});}
  function dot(parent,x,y,r,color,opacity){return mark(parent,'circle',{cx:x,cy:y,r:r,fill:color,opacity:opacity===undefined?1:opacity});}
  function person(id,x,y,color,r){var start=starts[id]||{x:x,y:y},t=ease(scene.progress),px=start.x+(x-start.x)*t,py=start.y+(y-start.y)*t;positions[id]={x:px,y:py};var point=dot(plot,px,py,r||2.7,color,.92);point.setAttribute('data-profile',id);point.append(svgNode('title',{},'Synthetic profile '+(id+1)));return point;}
  function interactive(id,label,pressed,activate,role){var group=mark(plot,'g',{'data-scene-object':id,class:'uc-scene-object',role:role||'button',tabindex:0,'aria-label':label});if(role!=='slider')group.setAttribute('aria-pressed',String(pressed));group.addEventListener('click',function(event){event.stopPropagation();activate(event);});group.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(event);}});return group;}
  function metrics(items){var target=host.querySelector('.uc-experiment-metrics');target.replaceChildren();items.forEach(function(item){var row=node('span');row.append(node('strong',item[1]),node('small',item[0]));target.append(row);});}
  function annotate(reading,description){$('experiment-reading').textContent=t(reading);plot.setAttribute('aria-label',t(description)+' '+t('Interactive teaching scene using explicit assumptions.'));}
  function stop(){cancelAnimationFrame(raf);raf=0;}
  function redraw(){var focused=document.activeElement&&document.activeElement.closest?document.activeElement.closest('[data-scene-object]'):null;var focusId=focused&&plot.contains(focused)?focused.dataset.sceneObject:null;var width=Math.max(235,Math.round(host.querySelector('.uc-experiment-plot').clientWidth));lastWidth=width;var mobile=width<600;var height=mode==='product-innovation'?(mobile?552:352):mode==='marketing-brand'?(mobile?420:355):mode==='audience-segmentation'?(mobile?445:485):mode==='scenario-planning'?370:430;plot.replaceChildren();plot.setAttribute('viewBox','0 0 '+width+' '+height);plot.style.height=height+'px';
    if(mode==='product-innovation')drawProduct(width,height,mobile);
    else if(mode==='marketing-brand')drawMarketing(width,height,mobile);
    else if(mode==='audience-segmentation')drawAudience(width,height,mobile);
    else if(mode==='scenario-planning')drawScenario(width,height,mobile);
    else drawCommunications(width,height,mobile);
    if(focusId){var replacement=plot.querySelector('[data-scene-object="'+focusId+'"]');if(replacement)replacement.focus({preventScroll:true});}
  }
  function animate(ms){stop();starts=Object.assign({},positions);scene.progress=0;started=0;duration=ms;if(motion.matches||!scene.visible||document.hidden){scene.progress=1;redraw();return;}function tick(now){if(!started)started=now;scene.progress=Math.min(1,(now-started)/duration);redraw();if(scene.progress<1)raf=requestAnimationFrame(tick);else{raf=0;updateText();}}raf=requestAnimationFrame(tick);}
  function productCounts(){var counts=[0,0,0,0];for(var i=0;i<72;i++){var ready=(i+.5)/72,threshold=.12,group=3;for(var gate=0;gate<3;gate++){threshold+=scene.obstacles[gate]?costs[gate]:0;if(ready<=threshold){group=gate;break;}}counts[group]++;}return counts;}
  function messageRates(){var rates=[1];messages[scene.message].p.forEach(function(p){rates.push(rates[rates.length-1]*p);});return rates;}
  function communicationResult(){var weighted=priors[scene.frame].map(function(v,i){return v*messageWeights[scene.message][i];}),sum=weighted.reduce(function(a,b){return a+b;},0),posterior=weighted.map(function(v){return v/sum;});return{posterior:posterior,choice:posterior.reduce(function(sum,p,i){return sum+p*[.62,.12,.44][i];},0)*100};}
  function scenarioSeries(){var result=[[],[],[]];for(var day=0;day<=14;day++){var t=scene.injected?Math.max(0,day-scene.eventDay):0;result[0].push(18+.72*65*Math.exp(-t/7)*(1-Math.exp(-t/.55)));result[1].push(22+.23*65*(1-Math.exp(-t/3))*Math.exp(-t/30));result[2].push(8+.14*65*(1-Math.exp(-t/4))*Math.exp(-t/18));}return result;}
  function updateText(){
    if(mode==='product-innovation'){var counts=productCounts(),active=scene.obstacles.filter(Boolean).length;metrics([['consider the product','72 / 100'],['choose a first trial',counts[3]+' / 100'],['active obstacles',active+' / 3']]);annotate('The same profiles retain their readiness. Removing a barrier lowers the cumulative threshold; it does not create new interest. '+counts[3]+' of 100 now choose an immediate trial.','Click the time, setup or switching barrier. '+active+' active obstacles; '+counts[3]+' of 100 choose a trial.');}
    else if(mode==='marketing-brand'){var rates=messageRates(),focus=scene.pinned>=0?scene.pinned:scene.hovered;metrics([['expected notice',scene.sent?Math.round(rates[1]*1000).toLocaleString():'—'],['expected recall',scene.sent?Math.round(rates[2]*1000).toLocaleString():'—'],['expected choice',scene.sent?Math.round(rates[3]*1000).toLocaleString():'—']]);var reading=scene.sent?'The launch follows one fixed population of 1,000. Curved width is proportional to the share remaining; nested rings are a visual layer, not additional people. Select a segment to isolate its stage.':'Choose an original message card and launch the wave. The outlined funnel previews the assumed conditional structure; no observed campaign data is used.';if(scene.sent&&focus>=0)reading=['Eligible audience: 1,000 people form the fixed denominator.','Notice: '+pct(rates[1]*100)+' of the eligible population; the first probability for '+messages[scene.message].name.toLowerCase()+'.','Recall: '+pct(messages[scene.message].p[1]*100)+' of those noticing, or '+pct(rates[2]*100)+' of the full population.','Subscription choice: '+pct(messages[scene.message].p[2]*100)+' of those recalling, or '+pct(rates[3]*100)+' of the full population.'][focus];annotate(reading,(scene.sent?'Launched ':'Selected ')+messages[scene.message].name+'. Expected stage counts: '+rates.map(function(v){return Math.round(v*1000);}).join(', ')+'.');}
    else if(mode==='audience-segmentation'){var cells=scene.linked?[40,10,10,40]:[25,25,25,25],response=cells.reduce(function(sum,v,i){return sum+v*[.72,.12,.18,.04][i];},0);metrics([['high interest','50 / 100'],['time available','50 / 100'],['expected trial',pct(response)]]);annotate((scene.linked?'A positive association now places 40 people in each matching cell and 10 in each opposing cell.':'Independence places 25 people in each cell.')+' Both margins remain 50%. The same profile identities move; the assumed conditional response changes with the joint structure.','Connect or disconnect Interest and Available time. '+(scene.linked?'Connected':'Independent')+' joint cells '+cells.join(', ')+'. Expected trial '+pct(response)+'.');$('experiment-instruction').textContent=scene.armed>=0?'Now select the other trait node to '+(scene.linked?'separate':'connect')+' them.':scene.linked?'Select the connection to separate the traits, or select both nodes again.':'Select Interest, then Available time to connect the traits.';}
    else if(mode==='scenario-planning'){var values=scenarioSeries();metrics([['event day',scene.injected?'Day '+scene.eventDay:'Not injected'],['day 14 agreement',pct(values[1][14])],['day 14 add choice',pct(values[2][14])]]);annotate(scene.injected?'The shock arrives on day '+scene.eventDay+'. Attention reacts and decays; agreement and position choice adjust more slowly under the stated equations. These are daily shares, not cumulative people, holdings or net capital flow.':'The population begins at its assumed baseline. Place the event on any day below the graph; moving its marker changes how much response time remains within the fourteen-day window.','Select a timeline day or move the event marker. '+(scene.injected?'Event injected on day '+scene.eventDay+'.':'No event injected.')+' Day fourteen agreement '+pct(values[1][14])+', add-position choice '+pct(values[2][14])+'.');}
    else{var result=communicationResult();metrics([['stakeholder',frames[scene.frame]],['announcement',messageNames[scene.message]],['expected pilot choice',scene.sent?pct(result.choice):'—']]);annotate(scene.sent?'The '+messageNames[scene.message].toLowerCase()+' message updates the assumed concerns of '+frames[scene.frame].toLowerCase()+'. Interpretation shares normalize to 100%; their weighted pilot-choice probability is '+pct(result.choice)+'. These are specified message weights, not an assessment of arbitrary text.':'Select a stakeholder node and an announcement card, then send it. The scene separates the recipient’s assumed prior concerns from the meanings attributed to the message and the action that follows.','Select a stakeholder and send an announcement. '+frames[scene.frame]+', '+messageNames[scene.message]+'. '+(scene.sent?'Expected pilot choice '+pct(result.choice)+'.':'Not yet sent.'));}
    var hint=host.querySelector('.uc-scene-sendhint');if(hint)hint.textContent=scene.sent?(mode==='marketing-brand'?'Wave launched. Select a funnel segment to inspect it.':'Announcement sent. Select another recipient to compare.'):(mode==='marketing-brand'?messages[scene.message].name+' is ready to launch.':messageNames[scene.message]+' → '+frames[scene.frame]+'.');
    Array.from(host.querySelectorAll('[data-scene-message]')).forEach(function(button){button.setAttribute('aria-pressed',String(Number(button.dataset.sceneMessage)===scene.message));});
    if(window.BackerI18n)window.BackerI18n.refresh(host);
  }
  function drawProduct(width,height,mobile){var middle=width/2,gateXs=[width*.25,width*.5,width*.75],gateYs=[124,232,340],names=['Time','Setup','Switching'],counts=productCounts(),groupIndex=[0,0,0,0];
    if(mobile){path(plot,'M'+middle+' 35V459',line,1.2);textAt(plot,middle,23,'72 considering',{style:'font-size:14px;fill:'+ink});}
    else{path(plot,'M25 152H'+(width-22),line,1.2);textAt(plot,30,63,'72 considering',{'text-anchor':'start',style:'font-size:14px;fill:'+ink});textAt(plot,width-20,63,counts[3]+' choose trial',{'text-anchor':'end',style:'font-size:14px;fill:'+ink});}
    for(var i=0;i<100;i++){if(i>=72){var ix=i-72;person(i,mobile?25+(ix%7)*7:40+(ix%7)*9,mobile?499+Math.floor(ix/7)*7:277+Math.floor(ix/7)*9,'#817b73',mobile?2:2.4);continue;}var ready=(i+.5)/72,threshold=.12,group=3;if(ready<=.12){person(i,mobile?middle-9+(i%3)*9:35+(i%3)*10,mobile?46+Math.floor(i/3)*8:123+Math.floor(i/3)*10,gray,mobile?2.5:3);continue;}for(var k=0;k<3;k++){threshold+=scene.obstacles[k]?costs[k]:0;if(ready<=threshold){group=k;break;}}var index=groupIndex[group]++;var x,y;if(mobile){x=group===3?middle-28+(index%9)*7:middle-16+(index%5)*8;y=group===3?412+Math.floor(index/9)*8:gateYs[group]-37-Math.floor(index/5)*8;}else{x=group===3?width-93+(index%6)*10:gateXs[group]-80+(index%4)*10;y=115+Math.floor(index/(group===3?6:4))*10;}person(i,x,y,group===3?blue:gray,mobile?2.5:3);}
    names.forEach(function(name,index){var active=scene.obstacles[index],x=mobile?middle-61:gateXs[index]-31,y=mobile?gateYs[index]-22:102,w=mobile?122:62,h=mobile?44:99;var group=interactive('obstacle-'+index,(active?'Remove ':'Restore ')+name+' barrier',active,function(){scene.obstacles[index]=!scene.obstacles[index];updateText();animate(800);});mark(group,'rect',{x:x,y:y,width:w,height:h,rx:4,fill:active?'#1b1a19':'#121214',stroke:active?'#e9bd86':'#393735','stroke-dasharray':active?'none':'3 5',class:'uc-object-surface'});textAt(group,x+w/2,y+(mobile?15:32),name,{style:'font-size:14px;fill:'+ink});textAt(group,x+w/2,y+(mobile?32:56),active?'+'+costs[index].toFixed(2):'Removed',{style:'font-size:'+(mobile?12:13)+'px;fill:'+gray});if(!mobile)textAt(group,x+w/2,y+80,active?'Remove':'Restore',{style:'font-size:12px;fill:'+blue});});
    if(mobile){textAt(plot,middle,482,counts[3]+' choose a first trial',{style:'font-size:14px;fill:'+ink});textAt(plot,93,512,'28 outside consideration',{'text-anchor':'start',style:'font-size:12px;fill:'+gray});}else textAt(plot,122,291,'28 remain outside consideration',{'text-anchor':'start',style:'font-size:14px;fill:'+gray});
  }
  /* Adapted from supplied FunnelChart hSegmentPath/vSegmentPath and layered springs. */
  function funnelPath(a,b,length,breadth,scale,vertical){var middle=breadth/2,r0=a*breadth*.44*scale,r1=b*breadth*.44*scale,c=length*.55;if(vertical)return'M'+(middle-r0)+' 0C'+(middle-r0)+' '+c+' '+(middle-r1)+' '+(length-c)+' '+(middle-r1)+' '+length+'L'+(middle+r1)+' '+length+'C'+(middle+r1)+' '+(length-c)+' '+(middle+r0)+' '+c+' '+(middle+r0)+' 0Z';return'M0 '+(middle-r0)+'C'+c+' '+(middle-r0)+' '+(length-c)+' '+(middle-r1)+' '+length+' '+(middle-r1)+'L'+length+' '+(middle+r1)+'C'+(length-c)+' '+(middle+r1)+' '+c+' '+(middle+r0)+' 0 '+(middle+r0)+'Z';}
  function spring(t){if(t<=0)return 0;return Math.max(0,1-Math.exp(-10*t)*(Math.cos(Math.sqrt(20)*t)+10/Math.sqrt(20)*Math.sin(Math.sqrt(20)*t)));}
  function applyFunnelFocus(){var focus=scene.pinned>=0?scene.pinned:scene.hovered;Array.from(plot.querySelectorAll('[data-funnel-segment]')).forEach(function(group){var index=Number(group.dataset.funnelSegment),selected=focus===index;group.style.opacity=focus<0||selected?'1':'.35';group.setAttribute('aria-pressed',String(scene.pinned===index));Array.from(group.querySelectorAll('[data-funnel-ring]')).forEach(function(ring){var scale=selected?1+Number(ring.dataset.funnelRing)*.06:1;ring.style.transform=(lastWidth<600?'scaleX(':'scaleY(')+scale+')';});});}
  function drawMarketing(width,height,mobile){var rates=messageRates(),labels=['Eligible','Notice','Recall','Choose'],gap=mobile?7:8,seg=mobile?82:(width-3*gap)/4,full=mobile?Math.max(136,width-90):238,offset=mobile?90:0;
    if(!scene.sent)textAt(plot,width/2,mobile?17:18,'Choose a message and launch',{style:'font-size:14px;fill:'+gray});
    rates.forEach(function(rate,index){var start=mobile?30+index*(seg+gap):index*(seg+gap),group=interactive('funnel-'+index,'Inspect '+labels[index]+' stage',scene.pinned===index,function(){scene.pinned=scene.pinned===index?-1:index;applyFunnelFocus();updateText();});group.dataset.funnelSegment=index;var graphic=mark(group,'g',{transform:mobile?'translate('+offset+' '+start+')':'translate('+start+' 50)'});var normEnd=rates[Math.min(index+1,3)],entered=scene.sent?(scene.progress>=1?1:spring(Math.max(0,scene.progress*1.65-index*.19))):1;var entrance=mark(graphic,'g',{transform:mobile?'translate('+(full/2)+' 0) scale('+entered+' '+entered+') translate('+(-full/2)+' 0)':'translate(0 '+full/2+') scale('+entered+' '+entered+') translate(0 '+(-full/2)+')'});
      for(var ring=0;ring<3;ring++){var pathD=funnelPath(rate,normEnd,seg,full,1-ring*.35/3,mobile);mark(entrance,'path',{d:pathD,fill:scene.sent?blue:'none',stroke:blue,'stroke-width':scene.sent?.5:1,opacity:scene.sent?.18+ring*.325:.14,class:'uc-funnel-ring','data-funnel-ring':ring,style:'transform-box:fill-box;transform-origin:center;transition:transform 450ms cubic-bezier(.22,1.25,.35,1)'});}
      if(mobile){textAt(group,0,start+seg*.35,labels[index],{'text-anchor':'start',style:'font-size:14px;fill:'+gray});textAt(group,0,start+seg*.35+22,scene.sent?Math.round(rate*1000).toLocaleString():'—',{'text-anchor':'start',style:'font-size:16px;fill:'+ink});mark(group,'rect',{x:0,y:start,width:width,height:seg,fill:'transparent',stroke:'transparent',class:'uc-object-surface'});}else{textAt(group,start+seg/2,26,scene.sent?Math.round(rate*1000).toLocaleString():'—',{style:'font-size:19px;fill:'+ink});textAt(group,start+seg/2,314,labels[index],{style:'font-size:14px;fill:'+gray});textAt(group,start+seg/2,337,scene.sent?pct(rate*100):'Ready',{style:'font-size:13px;fill:'+gray});mark(group,'rect',{x:start,y:0,width:seg,height:height,fill:'transparent',stroke:'transparent',class:'uc-object-surface'});}
      group.addEventListener('pointerenter',function(event){if(event.pointerType==='mouse'){scene.hovered=index;applyFunnelFocus();updateText();}});group.addEventListener('pointerleave',function(event){if(event.pointerType==='mouse'){scene.hovered=-1;applyFunnelFocus();updateText();}});group.addEventListener('focus',function(){scene.hovered=index;applyFunnelFocus();});group.addEventListener('blur',function(){scene.hovered=-1;applyFunnelFocus();});
    });applyFunnelFocus();
  }
  function changeTrait(index){if(scene.armed<0){scene.armed=index;redraw();updateText();return;}if(scene.armed===index){scene.armed=-1;redraw();updateText();return;}scene.linked=!scene.linked;scene.armed=-1;updateText();animate(950);}
  function drawAudience(width,height,mobile){var center=width/2,nodes=[mobile?width*.23:width*.35,mobile?width*.77:width*.65],top=157,size=mobile?Math.min(213,width-52):246,left=mobile?42:center-size/2,half=size/2;var link=interactive('trait-link',scene.linked?'Disconnect the traits':'Connect the traits',scene.linked,function(){scene.linked=!scene.linked;scene.armed=-1;updateText();animate(950);});path(link,'M'+nodes[0]+' 47C'+(center-20)+' 9 '+(center+20)+' 9 '+nodes[1]+' 47',scene.linked?blue:line,scene.linked?2:1,1);mark(link,'path',{d:'M'+nodes[0]+' 47C'+(center-20)+' 9 '+(center+20)+' 9 '+nodes[1]+' 47',fill:'none',stroke:'transparent','stroke-width':28,class:'uc-object-surface'});textAt(plot,center,112,scene.linked?'Connected · select to separate':scene.armed<0?'Select both trait nodes':'Now select the other node',{style:'font-size:13px;fill:'+gray});
    ['Interest','Available time'].forEach(function(name,index){var group=interactive('trait-'+index,'Select '+name+' trait node',scene.armed===index,function(){changeTrait(index);});mark(group,'circle',{cx:nodes[index],cy:45,r:26,fill:scene.armed===index?'#30271e':'#1b1a19',stroke:scene.armed===index?ink:blue,class:'uc-object-surface'});for(var j=0;j<3;j++)path(group,'M'+(nodes[index]-10)+' '+(37+j*8)+'H'+(nodes[index]+[5,11,1][j]),index?gray:blue,2);textAt(group,nodes[index],45+45,name,{style:'font-size:'+(mobile?13:14)+'px;fill:'+ink});});
    textAt(plot,left+half*.5,top-25,'Time available',{style:'font-size:'+(mobile?12:14)+'px;fill:'+gray});textAt(plot,left+half*1.5,top-25,'Time limited',{style:'font-size:'+(mobile?12:14)+'px;fill:'+gray});var counts=scene.linked?[40,10,10,40]:[25,25,25,25];
    counts.forEach(function(value,index){var x=left+(index%2)*half,y=top+Math.floor(index/2)*half;mark(plot,'rect',{x:x+2,y:y+2,width:half-4,height:half-4,fill:'#1b1a19',stroke:'#393735',rx:3});textAt(plot,x+half/2,y+half-18,value+' profiles',{style:'font-size:'+(mobile?13:14)+'px;fill:'+ink});});
    var used=[0,0,0,0];for(var i=0;i<100;i++){var high=i<50,available=scene.linked?(i<40||(i>=50&&i<60)):(i<25||(i>=50&&i<75)),cell=(high?0:2)+(available?0:1),index=used[cell]++,x=left+(cell%2)*half+13+(index%8)*(half-26)/7,y=top+Math.floor(cell/2)*half+19+Math.floor(index/8)*9;person(i,x,y,high?blue:gray,mobile?1.8:2.4);}
    textAt(plot,left-4,top+half*.5-7,'High',{'text-anchor':'end',style:'font-size:12px;fill:'+gray});textAt(plot,left-4,top+half*.5+7,'interest',{'text-anchor':'end',style:'font-size:12px;fill:'+gray});textAt(plot,left-4,top+half*1.5-7,'Low',{'text-anchor':'end',style:'font-size:12px;fill:'+gray});textAt(plot,left-4,top+half*1.5+7,'interest',{'text-anchor':'end',style:'font-size:12px;fill:'+gray});textAt(plot,center,top+size+25,'Interest / time margins remain 50% / 50%',{style:'font-size:'+(mobile?12:14)+'px;fill:'+gray});
  }
  function inject(day,animateIt){scene.eventDay=Math.max(0,Math.min(14,Math.round(day)));scene.injected=true;updateText();if(animateIt)animate(1500);else{stop();scene.progress=1;redraw();}}
  function timelineDay(event){var rect=plot.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*lastWidth;return Math.max(0,Math.min(14,Math.round((x-35)/(lastWidth-51)*14)));}
  function drawScenario(width,height,mobile){var values=scenarioSeries(),left=35,right=16,top=48,ph=225,pw=width-left-right,x=function(day){return left+day/14*pw;},y=function(value){return top+(1-value/100)*ph;};var labels=['Attention','Agreement','Add choice'];[gray,blue,gold].forEach(function(color,i){var lx=i*width/3;dot(plot,lx+3,16,2.7,color);textAt(plot,lx+11,16,labels[i],{'text-anchor':'start',style:'font-size:'+(mobile?12:14)+'px;fill:'+gray});});[0,25,50,75,100].forEach(function(v){path(plot,'M'+left+' '+y(v)+'H'+(width-right),'#393735',1,.8);textAt(plot,left-9,y(v),String(v),{'text-anchor':'end',style:'font-size:13px;fill:'+gray});});
    var shown=scene.injected?Math.min(14,scene.eventDay+(14-scene.eventDay)*ease(scene.progress)):14;values.forEach(function(series,index){var end=Math.floor(shown),d=series.slice(0,end+1).map(function(v,i){return(i?'L':'M')+x(i)+' '+y(v);}).join(' ');if(shown>end&&end<14)d+='L'+x(shown)+' '+y(series[end]+(series[end+1]-series[end])*(shown-end));var trace=path(plot,d,[gray,blue,gold][index],2.2,scene.injected?1:.38);if(index===2)trace.setAttribute('stroke-dasharray','4 5');if(scene.injected)dot(plot,x(shown),y(series[Math.min(14,Math.round(shown))]),3,[gray,blue,gold][index]);});
    path(plot,'M'+left+' 312H'+(width-right),'#8c8173',1.4);for(var day=0;day<=14;day++){(function(d){var group=interactive('day-'+d,'Inject shock on day '+d,scene.injected&&scene.eventDay===d,function(){inject(d,true);});mark(group,'rect',{x:x(d)-Math.max(6,pw/28),y:294,width:Math.max(12,pw/14),height:39,fill:'transparent',stroke:'transparent',class:'uc-object-surface'});path(group,'M'+x(d)+' 307V318',gray,1);if(d===0||d===7||d===14)textAt(group,x(d),337,d===0?'Day 0':String(d),{'text-anchor':d===0?'start':d===14?'end':'middle',style:'font-size:14px;fill:'+gray});})(day);}
    var marker=interactive('event-marker','Move event day with arrow keys, or drag',false,function(event){if(event.type==='keydown'||event.detail===0)inject(scene.eventDay,true);},'slider');marker.setAttribute('aria-valuemin','0');marker.setAttribute('aria-valuemax','14');marker.setAttribute('aria-valuenow',scene.eventDay);marker.setAttribute('aria-valuetext',t('Day '+scene.eventDay+(scene.injected?' injected':' ready')));path(marker,'M'+x(scene.eventDay)+' 42V303',blue,1,scene.injected?.6:.25);mark(marker,'circle',{cx:x(scene.eventDay),cy:312,r:8,fill:scene.injected?blue:'#1b1a19',stroke:blue,'stroke-width':1.5,class:'uc-object-surface'});textAt(marker,Math.min(width-26,Math.max(26,x(scene.eventDay))),288,scene.injected?'Shock':'Inject',{style:'font-size:12px;fill:'+ink});marker.addEventListener('keydown',function(event){if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();inject(event.key==='Home'?0:event.key==='End'?14:scene.eventDay+(event.key==='ArrowRight'?1:-1),true);}});marker.addEventListener('pointerdown',function(event){event.preventDefault();dragging=true;dragMoved=false;marker.focus({preventScroll:true});plot.setPointerCapture(event.pointerId);});
  }
  function drawCommunications(width,height,mobile){var nodeXs=[width/6,width/2,width*5/6],nodeWidth=mobile?Math.min(77,width/3-9):136,result=communicationResult(),progress=scene.sent?scene.progress:0,center=width/2;frames.forEach(function(name,index){var group=interactive('stakeholder-'+index,'Select '+name,scene.frame===index,function(){scene.frame=index;scene.sent=false;scene.progress=1;stop();redraw();updateText();});mark(group,'rect',{x:nodeXs[index]-nodeWidth/2,y:20,width:nodeWidth,height:68,rx:4,fill:scene.frame===index?'#30271e':'#1b1a19',stroke:scene.frame===index?blue:'#393735',class:'uc-object-surface'});dot(group,nodeXs[index],34,4,scene.frame===index?blue:gray);path(group,'M'+(nodeXs[index]-8)+' 48Q'+nodeXs[index]+' 38 '+(nodeXs[index]+8)+' 48',scene.frame===index?blue:gray,1.5);var words=[['Research','operators'],['Team','leads'],['System','owners']][index];textAt(group,nodeXs[index],62,words[0],{style:'font-size:'+(mobile?12:14)+'px;fill:'+ink});textAt(group,nodeXs[index],77,words[1],{style:'font-size:'+(mobile?12:14)+'px;fill:'+gray});});
    path(plot,'M'+nodeXs[scene.frame]+' 89C'+nodeXs[scene.frame]+' 119 '+center+' 113 '+center+' 141',blue,1.7,.3+.6*progress);mark(plot,'rect',{x:center-55,y:140,width:110,height:33,rx:3,fill:'#1b1a19',stroke:'#8c8173'});textAt(plot,center,157,scene.sent?'Message received':'Awaiting send',{style:'font-size:13px;fill:'+ink});var titles=[['Task','support'],['Role','threat'],['Human','review']];nodeXs.forEach(function(nx,index){var active=Math.max(0,Math.min(1,(progress-.22)/.40)),share=result.posterior[index],weight=1+share*8,color=[blue,gray,gold][index];path(plot,'M'+center+' 173C'+center+' 205 '+nx+' 204 '+nx+' 226',color,scene.sent?weight:1,scene.sent?.14+.65*active:.16);dot(plot,nx,226,4,color,scene.sent?.4+.6*active:.3);textAt(plot,nx,248,titles[index][0],{style:'font-size:14px;fill:'+gray});textAt(plot,nx,266,titles[index][1],{style:'font-size:14px;fill:'+gray});textAt(plot,nx,292,scene.sent?pct(share*100):'—',{style:'font-size:'+(mobile?18:22)+'px;fill:'+ink});var finalWave=Math.max(0,Math.min(1,(progress-.61)/.39));path(plot,'M'+nx+' 310C'+nx+' 337 '+center+' 329 '+center+' 350',color,scene.sent?weight:1,scene.sent?.1+.5*finalWave:.12);});dot(plot,center,352,4,blue,scene.sent?1:.2);textAt(plot,center,385,scene.sent?'Pilot choice · '+pct(result.choice):'Select recipient · choose message · send',{style:'font-size:'+(mobile?12:14)+'px;fill:'+ink});
    if(scene.sent&&progress<1){var py=89+263*progress,px=py<141?nodeXs[scene.frame]+(center-nodeXs[scene.frame])*((py-89)/52):center;dot(plot,px,py,3.5,ink,.9);}
  }
  Array.from(host.querySelectorAll('[data-scene-message]')).forEach(function(button){button.addEventListener('click',function(){stop();scene.message=Number(button.dataset.sceneMessage);scene.sent=false;scene.progress=1;scene.pinned=-1;scene.hovered=-1;redraw();updateText();});});
  var launch=host.querySelector('.uc-scene-launch');if(launch)launch.addEventListener('click',function(){scene.sent=true;scene.pinned=-1;scene.hovered=-1;updateText();animate(mode==='marketing-brand'?2050:1900);});
  host.querySelector('.uc-experiment-reset').addEventListener('click',function(){stop();scene.obstacles=[true,true,true];scene.linked=false;scene.armed=-1;scene.eventDay=3;scene.injected=false;scene.frame=0;scene.message=0;scene.sent=false;scene.progress=1;scene.pinned=-1;scene.hovered=-1;positions={};starts={};redraw();updateText();});
  plot.addEventListener('pointermove',function(event){if(dragging&&mode==='scenario-planning'){var next=timelineDay(event);if(next!==scene.eventDay){dragMoved=true;inject(next,false);}}});plot.addEventListener('pointerup',function(event){if(dragging){dragging=false;if(plot.hasPointerCapture(event.pointerId))plot.releasePointerCapture(event.pointerId);if(!dragMoved)inject(scene.eventDay,true);}});plot.addEventListener('pointercancel',function(){dragging=false;});
  var resize;window.addEventListener('resize',function(){clearTimeout(resize);resize=setTimeout(function(){stop();scene.progress=1;starts={};positions={};redraw();},120);});
  function finish(){if(raf){stop();scene.progress=1;redraw();updateText();}}
  new IntersectionObserver(function(entries){scene.visible=entries[0].isIntersecting;if(!scene.visible)finish();},{threshold:.05}).observe(host);
  motion.addEventListener('change',function(){if(motion.matches)finish();});document.addEventListener('visibilitychange',function(){if(document.hidden)finish();});
  redraw();updateText();
}
initializeExperiment();

}());
