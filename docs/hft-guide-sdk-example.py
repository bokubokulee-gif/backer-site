"""Backer + Jev: a typed, sequential trader simulation (offline by default).
Python >=3.10; typesafe-sdk==0.7.1. Running this file uses only MockTransport.
All histories, probabilities, and fills are authored fixtures, not live Jev output.
No API key is read; no inference request or trade reaches an external service.
"""
from copy import deepcopy
from datetime import datetime, timedelta
from importlib.metadata import version
import json
import httpx2
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient, RetryPolicy

MODEL = "jev-1.13.0"
QUANTITY = 10
ACTION_TEXT = {
    "add": "Buy 10 shares now",
    "hold": "Keep the current position for this step",
    "reduce": "Sell 10 shares now",
    "insufficient": "The evidence does not support a next-action prediction",
}
URGENCY = ["No change by session close", "More than 60 minutes later",
           "15 to 60 minutes later", "Less than 15 minutes later"]


def moment(text):
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def validate_state(state):
    cutoff, decision = moment(state["history_cutoff"]), moment(state["decision_at"])
    if not cutoff < moment(state["event"]["published_at"]) <= decision:
        raise ValueError("History must be frozen before the visible event")
    for record in state["observed_history"]:
        if moment(record["available_at"]) > cutoff:
            raise ValueError("Future observation leaked into history")
    if moment(state["market"]["available_at"]) > decision:
        raise ValueError("Future market state")
    if moment(state["market"]["expires_at"]) <= decision:
        raise ValueError("Stale market state")
    for field in ("cash_cents", "shares"):
        if type(state["account"][field]) is not int or state["account"][field] < 0:
            raise ValueError("Invalid account")
    for field in ("price_cents", "fee_cents"):
        if type(state["market"][field]) is not int or state["market"][field] < 0:
            raise ValueError("Invalid fill assumption")
    if not state["market"]["price_cents"]:
        raise ValueError("Price must be positive")


def feasible_choices(state):
    validate_state(state)
    account, market = state["account"], state["market"]
    result = {key: ACTION_TEXT[key] for key in ("hold", "insufficient")}
    if account["cash_cents"] >= QUANTITY * market["price_cents"] + market["fee_cents"]:
        result["add"] = ACTION_TEXT["add"]
    if account["shares"] >= QUANTITY and account["cash_cents"] + QUANTITY * market["price_cents"] >= market["fee_cents"]:
        result["reduce"] = ACTION_TEXT["reduce"]
    return result


def evaluate(client, state):
    """The same function accepts a configured TypeSafeClient in a backend."""
    choices = feasible_choices(state)  # Exact arithmetic stays in code.
    return client.system_one(model=MODEL, state=state, questions={
        "next_action": Choice(
            instructions="Given this individual trader's history and current state, what is their next action? Predict their behavior; do not prescribe an ideal investment.",
            criteria=choices),
        "wait_for_confirmation": Noul(
            instructions="Will this trader wait for a second confirming signal before changing exposure this session? Judge from the supplied history and current state."),
        "reaction_urgency": Score(
            instructions="When is this trader likely to first change exposure after decision_at, this session? Judge from the supplied history and current state.",
            criteria=URGENCY),
    })


def apply_simulated_fill(state, action):
    """Toy immediate full fill; production supplies a separate execution model.
    Does not turn model abstention into an observed hold or simulate a motive.
    """
    if action not in feasible_choices(state):
        raise ValueError("Infeasible action")
    if action == "insufficient":
        raise ValueError("Unresolved simulation branch; retain as abstention")
    new = deepcopy(state)
    change = {"add": QUANTITY, "hold": 0, "reduce": -QUANTITY}[action]
    fee = state["market"]["fee_cents"] if change else 0
    new["account"]["shares"] += change
    new["account"]["cash_cents"] -= change * state["market"]["price_cents"] + fee
    new["simulated_path"].append({"at": state["decision_at"], "action": action,
        "shares_delta": change, "fee_cents": fee, "origin": "simulated"})
    # The demo advances one second with unchanged price; no new observed facts.
    new["decision_at"] = (moment(state["decision_at"]) + timedelta(seconds=1)).isoformat().replace("+00:00", "Z")
    return new


def fixture():
    return {
        "example_kind": "authored_fixture",
        "trader_id": "014",
        "history_cutoff": "2026-09-23T13:59:59Z",
        "observed_history": [
            {"available_at": "2026-09-11T14:15:00Z", "event": "Guidance cut",
             "action": "Sold 20 shares", "reaction_minutes": 15,
             "holding_before": 120, "cash_available": True},
            {"available_at": "2026-08-09T14:40:00Z", "event": "Guidance raised",
             "action": "Bought 20 shares", "reaction_minutes": 40,
             "holding_before": 100, "cash_available": True},
        ],
        "event": {"text": "Management cuts guidance. Earnings call at 15:00Z.",
                  "published_at": "2026-09-23T14:00:00Z"},
        "decision_at": "2026-09-23T14:00:01Z",
        "session_closes_at": "2026-09-23T20:00:00Z",
        "market": {"price_cents": 9400, "fee_cents": 100,
                   "available_at": "2026-09-23T14:00:00Z",
                   "expires_at": "2026-09-23T14:05:00Z"},
        "account": {"cash_cents": 500000, "shares": 100},
        "constraints": {"shorting": False, "quantity_per_action": QUANTITY},
        "simulated_path": [],
    }


def offline_check():
    requests = []

    def respond(request):
        body = json.loads(request.content)
        assert request.method == "POST" and str(request.url) == "https://api.typesafe.ai/v1/systemone"
        assert body["model"] == MODEL
        assert body["questions"]["reaction_urgency"]["criteria"] == URGENCY
        assert "legend" not in body["questions"]["reaction_urgency"]
        requests.append(body)
        action = "reduce" if len(requests) == 1 else "hold"
        probabilities = {key: (0.7 if key == action else 0.1) for key in ACTION_TEXT}
        return httpx2.Response(200, json={"model": MODEL, "answers": {
            "next_action": {"type": "choice", "choice": action, "probabilities": probabilities, "confidence": 0.6},
            "wait_for_confirmation": {"type": "noul", "noul": 0.22},
            "reaction_urgency": {"type": "score", "score": 2.2,
                "legend": {str(i): value for i, value in enumerate(URGENCY)},
                "probabilities": {"0": 0.05, "1": 0.15, "2": 0.35, "3": 0.45}, "confidence": 0.3},
        }, "usage": {"input_tokens": 700, "output_tokens": 90}})

    initial = fixture()
    with TypeSafeClient(api_key="offline-fixture-only", transport=httpx2.MockTransport(respond),
                        retry=RetryPolicy(max_retries=0), timeout=0.5) as client:
        first = evaluate(client, initial)
        assert first.choices["next_action"].choice == "reduce"
        assert first.nouls["wait_for_confirmation"].noul == 0.22
        assert first.scores["reaction_urgency"].score == 2.2
        second_state = apply_simulated_fill(initial, first.choices["next_action"].choice)
        assert second_state["account"] == {"shares": 90, "cash_cents": 593900}
        second = evaluate(client, second_state)  # Dependent decision: a new request.
        final = apply_simulated_fill(second_state, second.choices["next_action"].choice)
        assert final["account"] == second_state["account"]
    assert requests[1]["state"]["account"] == second_state["account"]
    assert requests[1]["state"]["observed_history"] == initial["observed_history"]
    assert initial == fixture() and len(final["simulated_path"]) == 2
    assert apply_simulated_fill(initial, "add")["account"] == {"shares": 110, "cash_cents": 405900}
    constrained = fixture(); constrained["account"] = {"shares": 0, "cash_cents": 0}
    assert set(feasible_choices(constrained)) == {"hold", "insufficient"}
    for bad, action in [(constrained, "add"), (constrained, "reduce"), (fixture(), "insufficient")]:
        try: apply_simulated_fill(bad, action)
        except ValueError: pass
        else: raise AssertionError("Expected rejection")
    leaked = fixture(); leaked["observed_history"][0]["available_at"] = "2026-09-23T14:01:00Z"
    try: feasible_choices(leaked)
    except ValueError: pass
    else: raise AssertionError("Leakage was not rejected")
    print(json.dumps({"status": "PASS", "sdk_version": version("typesafe-sdk"),
        "mock_requests": len(requests), "external_network_calls": 0, "orders": 0,
        "second_account": second_state["account"], "final_account": final["account"],
        "verified": ["Choice/Noul/Score serialization and typed response access", "sequential updated state", "observed history frozen", "buy/sell fees and cash accounting", "hold leaves balances", "feasibility and abstention rejection", "future history rejection", "input immutability"]}, indent=2))


if __name__ == "__main__":
    offline_check()
