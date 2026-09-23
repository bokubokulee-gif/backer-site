# Jev inside Backer’s trader simulation

Reviewed against current TypeSafe documentation on 23 September 2026. No live inference, credentials, brokerage connection or order was used. This is an integration design, not a measured forecasting result.

## Core correction

**The edge is the accumulated record of how individual people have actually traded. Backer reconstructs those people and places them in concrete market situations. Jev supplies a bounded next-action judgment inside that simulation.**

Do not reduce Jev to classifying earnings announcements. Event interpretation can help prepare inputs, but the central demonstration should ask: **Given this person’s trading history and present situation, what would they do next?** Predict descriptive behavior; do not ask Jev to pick the economically optimal trade for an ideal investor.

Backer owns the behavioral record, selection of historical evidence, current actor state, simulated environment, action menu, state transitions and evaluation. Jev maps the supplied person-in-situation state to a defined next choice. A more capable future model can replace this primitive while the same histories and evaluation protocol remain in place.

## One concrete decision loop

Use a fictional, clearly marked teaching example with a one-minute decision window:

1. **Reconstruct the person.** Backer retrieves the actor’s prior decisions and the circumstances around them: what they could see, what they held, their available cash, what they actually did and when. Preserve observed data, inferred summaries and simulated trajectory events as separate fields. The production advantage would come from accumulated individual records, not three manually assigned personality labels.
2. **Place them in the situation.** Add the currently visible announcement, price/volume context, market state, holdings, cash and constraints. Code computes all quantities and feasible actions. A model should not infer what the person saw merely because information was public.
3. **Ask Jev for the next choice.** One Choice question selects between feasible, mutually exclusive actions at this decision point. The scope is one actor, one instrument, one window, one action menu.
4. **Advance the simulation.** Backer selects the most likely action for a deterministic replay, or branches/samples from a behaviorally calibrated distribution for multiple trajectories. Code applies the chosen order to a stated fill model and updates cash, holdings, pending orders and time. A requested order is not automatically a fill.
5. **Repeat from the new state.** At the next decision point, supply the changed portfolio, new information and simulated path. Never insert simulated actions into the actor’s observed history as if they really happened.
6. **Compare with reality.** In historical replay, hide subsequent actions until after the prediction. Compare simulated actions and timing with the actor’s observed decisions; use a separate calibration split and final holdout. Those outcomes refine prompts, history retrieval, transition assumptions or a downstream calibrator. They do not fine-tune Jev automatically.

### Concrete request shape

This follows the current HTTP API shape; every record below is fictional. Price arithmetic and option feasibility have already been computed by code.

```json
{
  "model": "jev-1.13.0",
  "state": {
    "fixture": "Fictional example; no live prediction",
    "decision": {
      "actor_id": "A17",
      "instrument": "EXAMPLE",
      "cutoff": "2026-09-23T14:31:00Z",
      "window": "Next one minute"
    },
    "actor": {
      "observed_history": [
        {
          "situation": "Earnings exceeded expectations; price rose; actor had cash and a small existing position",
          "observed_action": "Added in the first five minutes"
        },
        {
          "situation": "Guidance was raised; price rose; actor was already near their position limit",
          "observed_action": "Did not add during the observed window"
        }
      ],
      "current": {
        "shares": 100,
        "cash_usd": 5000,
        "pending_orders": [],
        "position_capacity": "Can buy or sell the stated 10-share lot without breaching constraints"
      },
      "simulated_actions_so_far": []
    },
    "visible_situation": {
      "announcement": "Revenue exceeds expectations and management raises guidance",
      "market": "Price is rising on elevated volume",
      "reference_price_usd": 100,
      "exposure": "The actor has received the announcement"
    },
    "permitted_orders": {
      "buy_10": "Buy 10 shares; reference notional USD 1000",
      "sell_10": "Sell 10 shares from the existing holding",
      "no_order": "Submit no order during this decision window"
    }
  },
  "questions": {
    "next_action": {
      "type": "choice",
      "instructions": "Given only this actor's observed trading history, current state and visible situation, which permitted action would this actor most likely choose during the stated decision window? Predict this person's behavior, not an ideal investment. Use insufficient_evidence if the supplied evidence cannot support a comparison. Do not infer motives or access future information.",
      "criteria": {
        "buy_10": "Submit the specified buy order during the window",
        "sell_10": "Submit the specified sell order during the window",
        "no_order": "Submit no order during the window, given adequate observation coverage",
        "insufficient_evidence": "The evidence does not support a next-action judgment"
      }
    }
  }
}
```

The response exposes `answers.next_action.choice`, `.probabilities` and `.confidence`. `choice` is the maximum-probability option. Backer should retain the whole distribution for analysis; repeatedly taking the maximum collapses uncertainty and may produce an artificially uniform population.

For an illustrative fill at USD 100 with zero fees, a filled `buy_10` would change 100 shares / USD 5,000 cash to 110 shares / USD 4,000 cash. The actual simulator must use its declared fees, partial-fill and execution-price assumptions. Jev does none of this arithmetic.

**Three different states must remain separate:** `no_order` is a modeled or observed action over a known window; a missing observation is a data-coverage gap; `insufficient_evidence` is model abstention. Neither missing data nor abstention should silently turn into “the trader chose to wait.” Stop/mark that simulated branch or route it to a defined fallback.

## Why Jev fits this loop

- **The output is already a decision.** It chooses from Backer’s explicit action menu and returns probabilities. Code consumes an enum; it does not parse a conversation or a generated investment essay.
- **The decision is conditional on this person’s state.** The same event can be presented with different accumulated histories, holdings, cash and constraints. A later step receives the updated state. Jev itself does not retain a private memory between these requests; Backer supplies the context.
- **The outputs can be compared.** A fixed action taxonomy, horizon and version let Backer compare the same person across situations and different people in the same situation. Comparability of schema is built in; comparability and calibration of behavioral probabilities must be measured.
- **Independent decisions can be batched.** For a frozen market snapshot, ask one explicitly scoped question per actor in a compact shared state, or run separate actor requests concurrently. Questions in a single call are evaluated independently against the same state. They cannot use one another’s answers. Extra questions still consume tokens, and large unrelated histories can degrade accuracy.
- **Dependent steps remain sequential.** If A’s simulated order changes market state before B decides, first update the environment in code, then query B. The next decision of the same actor also needs a new request after their state changes. Do not present one batch as an interacting multi-step market simulation.

This is a fit to the documented interface, not evidence that Jev already predicts real traders well. It should be tested against a simple history-based policy and competing decision models on the same held-out behavior. The generic model alone is not Backer’s proprietary edge.

## The truth about “why”

**Jev does not return a rationale.** Its Choice answer contains a selection, probabilities and confidence, not a generated explanation. Any “why” panel must identify its provenance:

- Show the observed historical decisions and current constraints supplied to the model.
- Change one supplied condition and show how the modeled decision changes, labelled sensitivity under the simulator.
- If separately asking Jev to select a possible driver from a fixed list, label it an inferred attribution, not the person’s true motivation or a proven cause.

A counterfactual change in a model is not causal evidence about a real person. Chinese public copy can simply say **“把这个人放进当下的行情，看他下一步会怎么交易。”** It communicates the mechanism without claiming access to unobserved motives.

## Recommended page demonstration

One actor card should show a short timeline of accumulated trades and contemporaneous situations, then current holdings and cash. The visitor changes the event or chooses another actor. A fixed action menu and probability distribution update. **Advance one step** applies an explicitly illustrative selected action to a visible ledger, and the next question uses the changed state. A reset restores the same initial state. A population view aggregates many such actor decisions; it must not imply that three hand-set persona labels are the full behavioral model.

Concise English headline: **Backer knows the history. Jev chooses the next move.**

More precise supporting copy: **We accumulate how individual traders act, place them in real market situations, and use Jev to choose among explicit next actions. Backer advances the simulation and tests those choices against observed behavior.**

Natural Chinese: **Backer 积累个人交易行为，Jev 在具体情境中模拟下一步选择。**

Supporting Chinese: **我们把交易者的历史操作、当前持仓和资金状况放回真实行情，让 Jev 从明确的选项中判断：这个人此刻更可能买入、卖出，还是不下单。Backer 据此推进模拟，再用实际交易检验结果。**

For a static fixture demo, use **“决策过程示例”** with an adjacent note that the choices are authored and no live model is called. Do not label fabricated numbers “Jev output.”

## Primary documentation, read live

- [State](https://docs.typesafe.ai/concepts/state): named JSON state; related observations and application context; each question evaluates against the same supplied state.
- [Choice](https://docs.typesafe.ai/primitives/choice): exact request/response semantics; maximum-probability choice, distribution, confidence; closed options and no-match option. Question IDs are not visible to the model, so include the target actor in the instructions.
- [API](https://docs.typesafe.ai/api): `POST /v1/systemone`, `state`, `model`, `questions`, structured answers.
- [Building with TypeSafe](https://docs.typesafe.ai/concepts/how-to-build-with-system-one): code owns control flow and side effects; model supplies narrow judgments. Its statement that Jev does not choose its own next action concerns autonomous agent control. Here Backer asks for a simulated trader’s bounded action; code still owns the loop.
- [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out): independent questions in one request, then composition in code. Not sequential communication among simulated people.
- [Models](https://docs.typesafe.ai/models): current `jev-1.13.0`, version pinning, context and rate limits, no customer fine-tuning, English strongest.
- [Confidence](https://docs.typesafe.ai/confidence): concentration of a Choice/Score distribution; threshold using domain evaluation. Not an observed trader frequency or profit probability.
- [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13): numeric reasoning, dates, unrelated context, adversarial material and indirection require explicit handling. Keep account arithmetic and feasibility in code.

Design status: documentation-supported architecture; current request shape reviewed. Live behavior accuracy, probability calibration, population realism, latency under load and incremental alpha remain unmeasured here.
