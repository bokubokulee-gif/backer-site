"""Offline TypeSafe SDK interface audit. No network, credentials, or orders."""
import json
from importlib.metadata import version
import httpx2
from typesafe_sdk import TypeSafeClient, Choice, Noul, Score, RetryPolicy

seen = []
def handle(request):
    body = json.loads(request.content)
    assert request.method == 'POST'
    assert str(request.url) == 'https://api.typesafe.ai/v1/systemone'
    assert body['model'] == 'jev-1.13.0'
    assert body['state']['example_kind'] == 'synthetic_fixture'
    assert body['questions']['reaction']['type'] == 'choice'
    assert set(body['questions']['reaction']['criteria']) == {'add','reduce','wait','insufficient_evidence'}
    assert body['questions']['event_relevant']['type'] == 'noul'
    assert body['questions']['salience']['type'] == 'score'
    seen.append(body)
    return httpx2.Response(200,json={
      'model':'jev-1.13.0',
      'answers':{
        'reaction':{'type':'choice','choice':'wait','probabilities':{'add':0.2,'reduce':0.1,'wait':0.6,'insufficient_evidence':0.1},'confidence':0.4},
        'event_relevant':{'type':'noul','noul':0.8},
        'salience':{'type':'score','score':1.6,'legend':{'0':'No apparent relevance','1':'Indirect relevance','2':'Directly concerns held position'},'probabilities':{'0':0.1,'1':0.2,'2':0.7},'confidence':0.55}
      },'usage':{'input_tokens':500,'output_tokens':75}})

with TypeSafeClient(api_key='offline-fixture-only',model='jev-1.13.0',transport=httpx2.MockTransport(handle),retry=RetryPolicy(max_retries=0),timeout=0.5) as client:
    result=client.system_one(state={'example_kind':'synthetic_fixture','event':'Company lowers its revenue guidance.','profile':'Historically waits for earnings calls before changing positions.','cutoff_utc':'2026-09-23T00:00:00Z'},questions={
      'reaction':Choice(instructions='Given only the supplied historical behavior and current event, which candidate near-term reaction is most plausible? This is a research label, not an order.',criteria={'add':'Increase exposure','reduce':'Reduce exposure','wait':'Keep exposure unchanged while awaiting more information','insufficient_evidence':'No supported comparison can be made'}),
      'event_relevant':Noul(instructions='Does the supplied event directly concern the company held in the supplied profile?'),
      'salience':Score(instructions='How directly does this event concern the supplied holding?',criteria=['No apparent relevance','Indirect relevance','Directly concerns held position'])
    })
assert result.choices['reaction'].choice == 'wait'
assert result.choices['reaction'].confidence == 0.4
assert abs(sum(result.choices['reaction'].probabilities.values())-1)<1e-10
assert result.nouls['event_relevant'].noul == 0.8
assert result.scores['salience'].score == 1.6
assert len(seen)==1
print(json.dumps({'status':'PASS','sdk_version':version('typesafe-sdk'),'mock_requests':len(seen),'endpoint':'POST /v1/systemone','validated':['Choice/Noul/Score construction','batched request serialization','versioned model field','typed response access'], 'not_validated':['live API access','Jev output accuracy','live latency','financial calibration','strategy performance'],'external_network_calls':0,'orders':0},indent=2))
