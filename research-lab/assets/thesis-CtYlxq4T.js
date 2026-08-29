import"./styles-Chs1Ivit.js";/* empty css                */const H=`# Backer Research Thesis #003

## Predicting where attention goes next

Backer Research Lab studies a concrete question: when a person, creator, product, project, or idea enters the internet's field of view, which cohorts will allocate attention to it next, how will that attention propagate or decay, and which interventions will change its path?

The internet is a feedback system. A platform or network chooses what to expose. A person notices or ignores it. Their dwell, return, search, follow, reply, share, purchase, collaboration, or trade becomes a signal. Platforms and other people react to that signal. New exposure follows. The cycle repeats.

Most available tools describe where attention has already accumulated. Backer studies whether linked exposure, response, commitment, intervention, and outcome records can forecast where durable attention will go next.

This produces the core thesis:

> Attention flow is the primary prediction target. Purchases, trades, and investments are dense downstream labels for some commercial questions, but they are not universal proxies for discovery, interest, trust, or cultural attention.

A forecast must identify the cohort, object, horizon, trajectory, outcome source, uncertainty, and failure conditions. It must also state whether it predicts an outcome or estimates the effect of an intervention.

## Why costly commitment still matters

A like is cheap. A comment requires more effort. A share risks identity and reputation. A purchase or investment commits scarce money under uncertainty.

The last action records more than interest. It combines belief, timing, price sensitivity, risk tolerance, budget, trust, identity, and opportunity cost. In a prediction market it also creates a probability-like public signal and a history that can be compared with resolution.

Costly action is most useful when it matches the domain being studied. A trade can illuminate market belief and risk-taking. A preorder can illuminate conditional demand. A return visit or deliberate recommendation may be more representative when the question is whether attention will endure or propagate. Backer should test these relationships rather than impose one universal terminal action.

That does not make a transaction causal by itself. A person who buys was not randomly assigned to buy. The platform selected the exposure, the person self-selected into the action, and many hidden variables shaped the choice. Costly action is stronger behavioral evidence, not automatic identification of cause and effect.

Backer Research therefore separates three things:

1. Observation: what people saw and did.
2. Prediction: what an agent or market expects will happen.
3. Intervention: what changes when Backer, a creator, or a platform deliberately changes one condition.

The causal asset appears when those layers are linked and the interventions are evaluated prospectively.

The agent state is not a biography prompt. At time \`t\`, each agent carries context and fitted traits, an evidence-linked memory stream, a limited attention budget, object-specific interest and uncertainty, domain-relevant resources, a weighted trust network, and an exposure history. At each step the environment ranks possible exposures, the person allocates attention, retrieves memories, updates belief, chooses whether to ignore or act, and sometimes reflects and replans. A market-conditioned experiment can also include cash, positions, and an order book, but those are one environment rather than the universal human model.

## The intellectual lineage

### Simile and the Stanford generative-agent program

The Simile research lineage progressively raises the grounding and evaluation bar.

Social Simulacra generated plausible community traces so designers could prototype social systems before a real community existed. The evaluation target was plausibility and design usefulness, not prediction.

Generative Agents introduced a durable loop: perceive, store experience, retrieve relevant memory, plan, act, and reflect. Memory retrieval combines recency, importance, and relevance. Reflection converts many small observations into higher-level beliefs that can guide future behavior. Ablation tests showed that memory, planning, and reflection each mattered for believable behavior.

Generative Agent Simulations of 1,000 People replaced invented biographies with two-hour interviews from 1,052 participants. The agents reproduced General Social Survey responses at 0.85 of the participants' own two-week test-retest consistency. This is not 85 percent accuracy on arbitrary future behavior. It is a normalized comparison on defined tasks. The robustness analysis is more useful for Backer than the headline number: interview-conditioned agents outperformed survey-and-experiment-only agents, shorter interviews lost information gradually, and subgroup error still required auditing.

SocSci210 expands the target from individual interview-conditioned agents to population response distributions across 210 social science experiments and 2.9 million responses. It distinguishes individual response accuracy from distribution alignment under experimental conditions. That distinction should be built into Backer from the start.

Backer should borrow the architecture, the interview grounding, the ablations, and the evaluation discipline. It should not borrow a broad claim that a plausible agent is a validated digital twin.

### Kalshi and prediction-market research

The Kalshi corpus shows how a market becomes both a product and a data-generating institution.

The Federal Reserve working paper on Kalshi macro markets converts contract prices across strikes into forecast distributions and compares them with surveys and financial benchmarks. Its strongest lesson is methodological: do not stop at directional accuracy. Test calibration, density forecasts, MAE, RMSE, and benchmark significance.

The Mamdani case study uses minute-level prices and volume to connect information shocks with market movement. It suggests that late behavioral evidence can move markets more than polls, media, or endorsements. But its event attribution is post-hoc and observational. For Backer, that makes the hierarchy a hypothesis to test, not a law to repeat.

The lead-lag paper first uses statistics to propose relationships among markets, then uses an LLM as a semantic plausibility filter. The reported benefit comes mainly from reducing average losses in a frictionless backtest. The transferable pattern is constrained AI: let statistics find candidates and let semantic reasoning veto implausible mechanisms. Do not let a language model invent causal links from prose alone.

The mention-market paper finds that market probability is a powerful prior. Text and LLM reasoning help most when market confidence is intermediate, while the blended improvement over the market is small and calibration can worsen. Backer should treat the market as a prior to refine, not a baseline to casually overturn.

### MiroFish, OASIS, and large-scale environments

MiroFish turns documents into an ontology and graph, turns graph entities into profiles, configures an OASIS social environment, runs X-like and Reddit-like interactions, updates graph memory, and produces a report. Its code exposes useful controls: activity cycles, response delay, stance, influence, recommendation weights, viral thresholds, echo-chamber strength, scheduled events, and action logs.

This is valuable engineering know-how. It is not by itself evidence that a forecast is accurate. MiroFish profiles can be generated from graph entities and defaults, several assumptions are model-generated, and the supplied repository does not include a general prospective forecast benchmark. OASIS validates scale and selected social phenomena more than individual human fidelity.

Backer should borrow the explicit environment, graph, action log, event injection, and deep-inspection workflow. It should add deterministic seeds, consented person-grounding, market microstructure, and prospective outcome scoring.

## A formal model of the loop

For person \`i\`, item or event \`j\`, and time \`t\`, let:

- \`E(i,j,t)\` be exposure selected by the platform or network.
- \`B(i,j,t)\` be subjective belief about the claim.
- \`A(i,j,t)\` be an action such as ignore, dwell, follow, share, buy, or trade.
- \`C(i,j,t)\` be costly commitment.
- \`P(j,t)\` be the public market price.
- \`Y(j)\` be the resolved outcome.

Exposure is not random. It depends on prior engagement, network structure, platform policy, and hidden traits. That means a correlation between exposure and payment cannot be read as the effect of exposure.

In the simulation, attention allocation is modeled as a bounded choice:

\`\`\`text
utility_of_attention =
  interest_match
  + recommender_relevance
  + network_pressure
  + social_proof
  + recency
  - attention_cost
\`\`\`

Belief begins with a market prior and changes with evidence, memory, and social observations:

\`\`\`text
logit(subjective_belief) =
  logit(market_prior)
  + private_tendency
  + evidence_update
  + social_update
  + memory_update
\`\`\`

A trade occurs when expected surplus is high enough for that specific person:

\`\`\`text
expected_surplus =
  subjective_belief * payoff
  - price
  - risk_penalty
  - liquidity_cost
  - identity_cost
\`\`\`

Orders enter a simplified central limit order book with price-time priority, partial fills, expiration, bounded cash, and bounded positions. This creates a legible experimental environment, not a claim that the demo reproduces Kalshi or Polymarket execution. Research-grade replay must later model observed spread, depth, fees, slippage, latency, maker and taker direction, and cancellation behavior.

The simulation is specified with an ODD-style contract before tuning: purpose, entities, state variables, initialization, ordered schedule, public inputs, submodels, calibration targets, and validation patterns. That contract makes environment assumptions separable from persona assumptions.

## The 5,000-agent population

The first lab population is modeled and reproducible. It is a research instrument for debugging the model, interface, interventions, and validation pipeline.

Each profile contains:

- Human context: age band, region, occupation, household, budget, platforms, and interests.
- Behavioral policy: attention budget, novelty seeking, patience, social susceptibility, price sensitivity, loss aversion, risk tolerance, ambiguity tolerance, identity expression, and trust threshold.
- Market policy: bankroll, order-size tendency, holding horizon, trading style, confidence, current belief, and calibration history.
- Social state: communities, graph position, influence, exposures, actions, and current event.
- Memory: recent episodes, retrieved memories, reflection, and plan.
- Provenance: feature source, interview status, consent status, confidence, validation state, and missing data.

The interface makes every subject inspectable. A dot is never just a decoration. It is a stateful research object with a traceable decision.

## Research hypotheses

### H1. Attention trajectories beat isolated popularity counters

Exposure history, return behavior, propagation, search, cohort structure, source diversity, and timing should forecast durable attention better than a single follower, view, volume, or market-price snapshot.

### H2. Costly commitment is powerful but domain-specific

Purchases, preorders, collaborations, investments, and trades should add predictive value for some commercial outcomes after controlling for exposure and prior attention. They should not be assumed to substitute for attention labels when forecasting creator discovery, cultural interest, or other non-transactional behavior.

### H3. Interview grounding improves heterogeneous response prediction

Interview-conditioned agents should better reproduce individual decisions and subgroup distributions than demographic or archetype-only agents.

### H4. The environment can dominate the persona

Recommendation weights, network concentration, timing, and initial exposure should sometimes change aggregate outcomes more than modest changes to individual traits.

### H5. Prediction quality and intervention quality are different

A model can forecast an attention or commercial outcome while giving the wrong answer about how to change it. Backer must score predicted outcomes and predicted treatment effects separately.

## The experiment program

### Sandbox phase

- Seed public attention situations from documented social, creator, product, project, and market sources.
- Use Kalshi and Polymarket as method and calibration environments, not as a representative population for all attention domains.
- Generate 5,000 deterministic modeled subjects from explicit priors.
- Build a network with communities, homophily, bridge nodes, and influence variation.
- Replay baseline and intervention runs from the same random seed.
- Expose all assumptions and log every state transition.

The APIs do not provide a defensible count of unique human bettors. Kalshi public trades do not expose user identity. Polymarket wallet activity can indicate sampled active wallets, but one wallet is not one person and one person can control many wallets. Mastodon trends are instance-level, not a global social sample. These fields can seed an environment, not turn generated profiles into observed humans.

### Human-grounding phase

- Recruit early followers and scouts, creator supporters, purchasers reached through social media, active prediction-market traders, and exposed people who chose not to act.
- Conduct consented semi-structured interviews, with a two-hour condition and shorter ablations.
- Collect decision diaries and opt-in transaction histories.
- Ask each participant to make prospective decisions that can later be checked.
- Compare the agent with the same person's test-retest consistency.

### Causal phase

- Randomize interventions such as creator response, price, fee, recommendation diversity, information quality, and timing.
- Estimate average and heterogeneous treatment effects.
- Compare simulated treatment effects with observed effects before using the simulator for decisions.
- Pre-register hypotheses, endpoints, exclusion rules, and analysis.

### Prospective phase

- Freeze the model before unseen events.
- Publish probability distributions, confidence, and failure conditions.
- Score resolution with Brier, log loss, calibration, MAE, and RMSE where appropriate.
- Report subgroup error, distribution error, and treatment-effect error.

## What success means

The goal is not a perfect oracle. It is a calibrated, inspectable forecasting system that knows what it has not seen.

The lab succeeds when it can answer five questions better over time:

1. Which cohort is likely to notice?
2. Where will its attention move next?
3. Will that attention return, propagate, or convert?
4. Which intervention changes the path rather than merely correlating with it?
5. How uncertain is the answer, and for whom does it fail?

That is the defensible path from attention observation to prospective attention forecasting and causal allocation research.

The executable Lab remains governed by Backer's current documented product boundary, \`BACKER-MANIFESTO-PRODUCT-BOUNDARY.md\`: real public profiles are research-only, executable profiles are fictional, commitments are non-redeemable, and no real money moves.

## Primary sources

- [Social Simulacra](https://arxiv.org/abs/2208.04024)
- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [Generative Agent Simulations of 1,000 People](https://arxiv.org/abs/2411.10109)
- [SocSci210 and human behavior prediction](https://aclanthology.org/2025.emnlp-main.1530/)
- [OASIS](https://arxiv.org/abs/2411.11581)
- [MiroFish source](https://github.com/666ghj/MiroFish)
- [Kalshi public API](https://docs.kalshi.com/api-reference/market/get-markets)
- [Polymarket API](https://docs.polymarket.com/api-reference/markets/list-markets)
- [Mastodon public trends API](https://docs.joinmastodon.org/methods/trends/)
- [Simile company research and product context](https://www.simile.com/)
`,W=`# Where Attention Goes Next

Every valuable online outcome begins before the transaction.

A developer finds an obscure repository. A viewer returns to a small channel. A community begins repeating an unfamiliar idea. A brand notices a creator before the rate card changes. At first, each action looks too small to matter. Together, they reveal that attention has started to move.

The internet is excellent at measuring attention after it accumulates. It counts the followers, views, clicks, and purchases. It is much worse at answering the question that matters before consensus:

> Which people will move their limited attention toward what next, and what could change that path?

That is the research question for Backer.

## Attention is a flow, not a score

Attention does not live inside one follower count. It moves between people, objects, platforms, and communities over time.

A useful forecast must state:

- Which cohort is being modeled.
- Which person, product, project, or idea may receive attention.
- Which source or network carries the exposure.
- How long the forecast covers.
- Whether attention is expected to return, propagate, or convert.
- Which intervention could redirect the path.
- How uncertain the model is and where it may fail.

This is more demanding than ranking what is popular now. A popularity chart describes the lake after it fills. Backer is trying to understand the tributaries while the water is still moving.

## Payment is one outcome, not the mission

Purchases, trades, preorders, and investments matter because they commit scarce resources. They combine belief with price, timing, risk, trust, and opportunity cost. A prediction-market trade adds a falsifiable claim and a later resolution.

That makes a transaction a dense label for some questions. It does not make transaction behavior a universal representation of attention.

Someone trading a political contract for profit is not automatically a good model for someone repeatedly watching an unknown musician, adopting an open-source tool, or recommending a creator to a friend. The behavior, object, incentive, and time horizon are different.

Backer should therefore ask which signal matches the outcome. A trade may be the right label for market belief. A preorder may be the right label for conditional demand. A return visit, search, share, or collaboration may be the right label for durable attention.

Payment remains part of the map. It no longer defines the territory.

## What prediction markets still teach us

Prediction markets remain useful research institutions. They force a question to be specified before the answer is known. They aggregate disagreement into a public prior. They preserve timing, confidence, volume, and resolution. They can be scored out of time instead of defended with a persuasive story after the fact.

Backer should keep those disciplines:

- Precommit the forecast and outcome definition.
- Treat a market price as a prior, not truth.
- Compare against simple baselines.
- Publish uncertainty and calibration.
- Preserve the record of failure.

Kalshi and Polymarket can seed methods and selected environments. They are not the proprietary core and their participants are not a representative sample of every audience Backer may study.

## Lab predicts, the Network commits

Prediction becomes economically valuable when it changes a scarce decision.

The Backer Research Lab can estimate which profiles or ideas are under-recognized, which cohorts may move toward them, how durable that attention could be, and which intervention may alter the path.

The Backer Network turns that forecast into an accountable commitment. A person may place reputation behind an early thesis. A brand may reserve a collaboration. A community may commit to test a product. A fund may request a first look. A profile may grant a defined commercial right. A future compliant product may allocate capital.

Trading is one possible instrument inside this layer. It is not the company definition.

The loop is:

\`\`\`text
observe
-> forecast
-> commit
-> intervene
-> resolve
-> calibrate
\`\`\`

The Lab gives the Network timing and judgment. The Network gives the Lab prospective decisions, logged interventions, and outcomes that cannot be scraped after the fact.

## The business is earlier allocation

Businesses already pay for attention once it is visible. They hire the proven person, sponsor the established creator, acquire the mature audience, and buy distribution at the new price.

The value of a forward-looking system is the ability to act before that repricing.

A brand could reserve future sponsorship inventory from an emerging creator. A developer-tools company could fund scouts who find fast-forming technical communities. A studio could test which narrative moves a particular cohort before committing a full launch budget. A talent firm could buy a first-look right rather than another retrospective trend report.

Backer can earn when the forecast improves or executes these decisions: research fees, allocation fees, clearing fees, option and servicing fees, outcome verification, and later performance participation once calibration supports it.

The customer is not buying a prophecy. The customer is buying a better allocation under uncertainty.

## Consumers are not only customers

The consumer side can be a distributed sensing network.

People constantly discover unusual work before institutions do. Their judgment disappears into feeds, group chats, bookmarks, and stories told after the outcome. Backer can turn that early belief into a timestamped, falsifiable record.

Someone who repeatedly sees important profiles early should build a proof-of-taste history. Institutions can fund discovery bounties, access proven scouts, or route first-look opportunities through them. Consumers gain reputation, access, and rewards. Profiles gain earlier support. Businesses pay for the timing advantage.

This structure does not require every participant to become a trader.

## The research moat must be earned

Public web data is available to many companies. Model capability will diffuse. A simulation can be copied. A contract can be copied.

The difficult-to-reproduce asset is a prospective, resolved record:

\`\`\`text
what was visible
-> what was forecast
-> how confident the forecaster was
-> what was committed
-> what intervention occurred
-> what attention did next
-> where the forecast failed
\`\`\`

A competitor can scrape a profile today. It cannot travel backward and recreate what people believed before the result, which action followed, and how the path changed.

Backer does not yet possess this record at meaningful scale. The current Lab is a modeled instrument prototype. The moat becomes real only through consent, useful participation, clean prospective resolution, retained rights, and forecast performance that beats simple baselines.

## Prediction can change the future

Attention forecasts are reflexive. Publishing a ranking, funding a creator, or routing a campaign can help cause the outcome that Backer predicted.

That does not make the system useless. It creates two different questions:

1. What would attention have done without Backer?
2. What changed because Backer acted?

The first is a forecasting problem. The second is an intervention problem. Backer must freeze forecasts before action, log every intervention, preserve holdouts where possible, and score prediction accuracy separately from incremental lift.

If the system touches the river, the model must record where it put its hand.

## Start narrow enough to learn

Backer's mission can eventually include creators, developers, founders, artists, researchers, products, projects, and ideas. Its first proof should remain much smaller.

One opted-in cohort. One defined attention horizon. One outcome source. One prospective forecast. One real allocation decision. One clean resolution.

The goal is not to claim a model of everyone. It is to build a repeatable loop in which early attention can be forecast, serious support can arrive sooner, and reality can correct the system.

Platforms measure where attention landed.

Backer is building the record of where it may go next, who acted before consensus, and what happened because they did.

## Sources and research context

- [Social Simulacra](https://arxiv.org/abs/2208.04024)
- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [Generative Agent Simulations of 1,000 People](https://arxiv.org/abs/2411.10109)
- [SocSci210](https://aclanthology.org/2025.emnlp-main.1530/)
- [OASIS](https://arxiv.org/abs/2411.11581)
- [MiroFish](https://github.com/666ghj/MiroFish)
- [Kalshi API documentation](https://docs.kalshi.com/)
- [Polymarket API documentation](https://docs.polymarket.com/)

This essay states a research and company direction. It does not claim that Backer's current modeled agents predict real people, that public data reveals private intent, or that any live-money or investment product currently exists. The executable Lab remains governed by Backer's current documented product boundary, \`BACKER-MANIFESTO-PRODUCT-BOUNDARY.md\`.
`,p=document.querySelector("#article-body"),L=document.querySelector("#article-title"),C=document.querySelector("#article-deck"),T=document.querySelector("#article-toc"),O=document.querySelector("#reading-time"),_=document.querySelector("#reading-progress-bar"),g=Array.from(document.querySelectorAll("[data-document]")),$={essay:{title:"Where Attention Goes Next",deck:"Attention becomes valuable before it becomes obvious. Backer studies where it moves, what changes its path, and how reality corrects the forecast.",source:W,label:"Essay"},protocol:{title:"Predicting where attention goes next",deck:"A research program for forecasting attention trajectories, separating prediction from intervention, and testing when costly commitment adds useful signal.",source:H,label:"Research protocol"}};let m="essay",j=null;function b(a){return String(a).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function A(a){const t=[];let e=b(a).replace(/`([^`]+)`/g,(n,o)=>{const r=`@@CODE${t.length}@@`;return t.push(`<code>${o}</code>`),r});return e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(n,o,r)=>{const i=/^https?:\/\//i.test(r);return`<a href="${r}"${i?' target="_blank" rel="noopener noreferrer"':""}>${o}${i?'<span class="external-mark" aria-hidden="true">&#8599;</span>':""}</a>`}).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g,"$1<em>$2</em>"),t.forEach((n,o)=>{e=e.replace(`@@CODE${o}@@`,n)}),e}function D(a,t){const e=a.toLowerCase().replace(/<[^>]+>/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"section",n=t.get(e)||0;return t.set(e,n+1),n?`${e}-${n+1}`:e}function F(a){const t=a.replace(/\r\n/g,`
`).split(`
`),e=[],n=[],o=new Map;let r=[],i=null,v=[],y=[],f=!1,w="",S=[];const l=()=>{r.length&&(e.push(`<p>${A(r.join(" "))}</p>`),r=[])},c=()=>{!v.length||!i||(e.push(`<${i}>${v.map(u=>`<li>${A(u)}</li>`).join("")}</${i}>`),v=[],i=null)},d=()=>{y.length&&(e.push(`<blockquote><p>${A(y.join(" "))}</p></blockquote>`),y=[])},E=()=>{const u=w?`<span>${b(w)}</span>`:"";e.push(`<div class="article-code">${u}<pre><code>${b(S.join(`
`))}</code></pre></div>`),S=[],w=""};return t.forEach(u=>{const s=u.trimEnd();if(s.startsWith("```")){f?(E(),f=!1):(l(),c(),d(),f=!0,w=s.slice(3).trim());return}if(f){S.push(u);return}const I=s.match(/^(#{1,3})\s+(.+)$/);if(I){l(),c(),d();const h=I[1].length,k=I[2].trim();if(h===1)return;const P=D(k,o);n.push({level:h,label:k,id:P}),e.push(`<h${h} id="${P}"><a href="#${P}" aria-label="Link to ${b(k)}">${A(k)}</a></h${h}>`);return}if(/^>\s?/.test(s)){l(),c(),y.push(s.replace(/^>\s?/,""));return}const B=s.match(/^[-*]\s+(.+)$/),R=s.match(/^\d+\.\s+(.+)$/);if(B||R){l(),d();const h=B?"ul":"ol";i&&i!==h&&c(),i=h,v.push((B||R)[1]);return}if(!s.trim()){l(),c(),d();return}if(/^---+$/.test(s.trim())){l(),c(),d(),e.push("<hr />");return}d(),c(),r.push(s.trim())}),f&&E(),l(),c(),d(),{html:e.join(`
`),headings:n}}function z(a){T&&(T.innerHTML=a.filter(t=>t.level===2).map((t,e)=>`<a href="#${t.id}" data-toc-id="${t.id}"><span>${String(e+1).padStart(2,"0")}</span>${b(t.label)}</a>`).join(""),T.querySelectorAll("a").forEach(t=>{t.addEventListener("click",e=>{const n=document.querySelector(t.getAttribute("href"));n&&(e.preventDefault(),n.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),history.replaceState(null,"",t.getAttribute("href")))})}))}function N(){j?.disconnect();const a=Array.from(p?.querySelectorAll("h2")||[]);!a.length||!("IntersectionObserver"in window)||(j=new IntersectionObserver(t=>{const e=t.filter(n=>n.isIntersecting).sort((n,o)=>o.intersectionRatio-n.intersectionRatio)[0];e&&T?.querySelectorAll("a").forEach(n=>{const o=n.dataset.tocId===e.target.id;n.classList.toggle("is-active",o),o?n.setAttribute("aria-current","location"):n.removeAttribute("aria-current")})},{rootMargin:"-18% 0px -70% 0px",threshold:[0,.15,.5]}),a.forEach(t=>j.observe(t)))}function G(a){const t=a.replace(/```[\s\S]*?```/g," ").replace(/[#>*_`\[\]()/-]/g," ").trim().split(/\s+/).filter(Boolean).length;return Math.max(1,Math.ceil(t/220))}function x(a,t={}){const e=$[a]||$.essay;m=a in $?a:"essay";const n=F(e.source);L&&(L.textContent=e.title),C&&(C.textContent=e.deck),p&&(p.innerHTML=n.html),O&&(O.textContent=`${G(e.source)} min`),document.title=`${e.title} | Backer Research Lab`,g.forEach(o=>{const r=o.dataset.document===m;o.setAttribute("aria-selected",r?"true":"false"),o.tabIndex=r?0:-1}),z(n.headings),N(),M(),t.updateHistory!==!1&&history.pushState({document:m},"",`#${m}`),t.focusArticle&&document.querySelector(".reader-boundary")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}g.forEach((a,t)=>{a.addEventListener("click",()=>{x(a.dataset.document,{focusArticle:!0})}),a.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight"].includes(e.key))return;e.preventDefault();const n=e.key==="ArrowRight"?1:-1,o=g[(t+n+g.length)%g.length];o.focus(),x(o.dataset.document)})});function M(){if(!p||!_)return;const a=p.getBoundingClientRect(),t=window.scrollY+a.top-window.innerHeight*.3,e=t+p.offsetHeight-window.innerHeight*.45,n=e<=t?0:(window.scrollY-t)/(e-t);_.style.transform=`scaleX(${Math.max(0,Math.min(1,n))})`}let q=!1;window.addEventListener("scroll",()=>{q||(q=!0,window.requestAnimationFrame(()=>{M(),q=!1}))},{passive:!0});window.addEventListener("resize",M,{passive:!0});window.addEventListener("popstate",()=>{const a=location.hash==="#protocol"?"protocol":location.hash==="#essay"?"essay":m;a!==m&&x(a,{updateHistory:!1})});document.querySelector("#print-article")?.addEventListener("click",()=>window.print());const K=location.hash==="#protocol"?"protocol":"essay";x(K,{updateHistory:!1});
