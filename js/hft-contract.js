/* Public local-preview schema. No key, private records or provider request is included. */
window.BackerHftContract = {
  "name": "Backer behavioral research API",
  "version": "local-preview/v1",
  "availability": "Optional local preview only. The static website does not operate a hosted inference API. No live Jev result or production availability has been established by this demonstration.",
  "endpoint": {
    "method": "POST",
    "path": "/api/hft/evaluate",
    "contentType": "application/json"
  },
  "request": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "eventId",
      "profileId",
      "historyIncluded"
    ],
    "properties": {
      "eventId": {
        "enum": [
          "beat",
          "cut",
          "mixed"
        ]
      },
      "profileId": {
        "type": "integer",
        "enum": [
          0,
          1,
          2
        ]
      },
      "historyIncluded": {
        "type": "boolean"
      }
    }
  },
  "exampleRequest": {
    "eventId": "cut",
    "profileId": 2,
    "historyIncluded": true
  },
  "response": {
    "selection": "The exact eventId, profileId and historyIncluded snapshot, echoed so clients can reject a stale response.",
    "judgment": {
      "type": "choice",
      "choice": [
        "hold",
        "add",
        "reduce",
        "abstain"
      ],
      "probabilities": "Exactly hold/add/reduce/abstain; finite values in [0,1] with sum 1. The selected choice is a maximum.",
      "confidence": "Finite [0,1]. Distribution concentration, not the probability of correctness.",
      "source": "jev",
      "model": "jev-1.13.0"
    }
  },
  "alternativeSemantics": {
    "hold": "Retain the current shares and cash while observing or seeking confirmation; the available evidence supports this waiting behavior.",
    "add": "Buy additional shares within the cash and order-size constraints as a plausible response to this context.",
    "reduce": "Sell some currently held shares within the position and order-size constraints as a plausible response to this context; no short selling.",
    "abstain": "The supplied evidence does not support choosing a likely behavior among holding, adding and reducing, or no candidate fits."
  },
  "evidenceBoundary": "Participant histories, holdings and market snapshots are authored synthetic fixtures. Probabilities compare possible participant behaviors, not future prices, profitability or fund actions. Model abstention, an observed hold and a missing observation are separate concepts.",
  "simulationBoundary": "Code separately compares reader-selected fund alternatives on identical authored future price paths with explicit cash, inventory, spread, fee and fill assumptions. These future paths and fund results are never sent to Jev. Repeating a synthetic example does not train or calibrate a model.",
  "verification": "Mocked provider tests check the software contract and failures. Behavioral accuracy, incremental net returns, latency and real-data coverage require separate held-out and prospective evaluation.",
  "security": "Only the local Node process reads TYPESAFE_API_KEY. Requests accept three allowlisted fixture selectors; no arbitrary history, client prompt or uploaded records. The upstream endpoint, model and English question are fixed server-side. Size, time, rate and concurrency limits apply.",
  "errors": {
    "not_configured": 503,
    "invalid_request": 400,
    "upstream_unavailable": 502,
    "invalid_response": 502,
    "timeout": 504,
    "too_large": 413,
    "forbidden": 403,
    "method_not_allowed": 405,
    "busy": 429,
    "not_found": 404
  },
  "errorBehavior": "Errors return only a stable error code. The UI may retain its explicitly labeled fixture; it must not label that fixture as a Jev response.",
  "documentationReviewed": "2026-09-24",
  "sources": [
    "https://docs.typesafe.ai/api",
    "https://docs.typesafe.ai/primitives/choice",
    "https://docs.typesafe.ai/concepts/state",
    "https://docs.typesafe.ai/models",
    "https://docs.typesafe.ai/cookbooks/function_calling"
  ]
};
