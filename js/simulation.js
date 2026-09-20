/* Public teaching instruments. All values and coefficients below are assumed. */
(function () {
  'use strict';
  var legacyRoutes = {product:'product-innovation', marketing:'marketing-brand', audience:'audience-segmentation', scenario:'scenario-planning', communications:'strategic-communications'};
  var legacyCase = new URLSearchParams(window.location.search).get('usecase');
  if (Object.prototype.hasOwnProperty.call(legacyRoutes, legacyCase)) {
    var target=new URL('use-cases/' + legacyRoutes[legacyCase] + '.html',location.href);var lang=new URLSearchParams(location.search).get('lang');if(['en','zh','ja','ko'].includes(lang))target.searchParams.set('lang',lang);window.location.replace(target.href);
    return;
  }
  var definitions = [
    '<p class="sim-eyebrow">Decision brief</p><h3>Which introduction changes next week’s choice?</h3><p>Compare a feature announcement with a guided trial. Measure intended tool choice over the next seven days.</p><p class="scenario-condition">Hold the audience and offer constant. Change the introduction.</p>',
    '<div class="population-row"><span>Habitual users</span><strong>45%</strong><small>Frequent use of an incumbent; high switching effort.</small></div><div class="population-row"><span>Active evaluators</span><strong>35%</strong><small>Known need; comparing alternatives now.</small></div><div class="population-row"><span>Occasional users</span><strong>20%</strong><small>Infrequent need; low urgency to change.</small></div><p class="scenario-condition">Assumed groups and weights. These are not discovered customer segments.</p>',
    '<p class="sim-eyebrow">Q01 / Choice under a condition</p><h3>After a guided trial, which option would you use in the next seven days?</h3><ul class="question-options"><li>The new product</li><li>The incumbent</li><li>Neither</li></ul><p class="scenario-condition">Repeat under the announcement-only condition. Compare the full distribution, including no action.</p>'
  ];
  var tabs = Array.from(document.querySelectorAll('[data-definition]'));
  function selectDefinition(index, focus) {
    tabs.forEach(function (tab, i) { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    document.getElementById('definition-content').innerHTML = definitions[index];
    document.getElementById('definition-panel').setAttribute('aria-labelledby', tabs[index].id);
    if (focus) tabs[index].focus();
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectDefinition(index, false); });
    tab.addEventListener('keydown', function (event) {
      var next = index;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
      else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); selectDefinition(next, true);
    });
  });
  var reference = [40,35,25], prediction = [52,35,13];
  var chart = document.getElementById('distribution-chart'), dragOutcome = null;
  function distributionLabel(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
  function updateDistribution() {
    var labels = ['New offer','Incumbent','Neither'];
    var tvd = prediction.reduce(function(sum,n,i){return sum+Math.abs(n-reference[i]);},0)/200;
    var active = document.activeElement && document.activeElement.dataset.outcome;
    var svg = '<title id="distribution-title">Hypothetical choice distributions. Drag the predicted endpoints to transfer probability mass.</title><desc>Reference: 40,35,25 percent. Prediction: '+prediction.join(',')+' percent. Total variation distance '+tvd.toFixed(2)+'.</desc>';
    [0,25,50,75,100].forEach(function(tick){var x=132+tick*3.55;svg+='<line x1="'+x+'" x2="'+x+'" y1="24" y2="235" stroke="#4b4238" stroke-dasharray="2 6"/><text x="'+x+'" y="261" text-anchor="'+(tick===0?'start':tick===100?'end':'middle')+'">'+tick+'%</text>';});
    reference.forEach(function(value,i){var y=32+i*72,x=132+prediction[i]*3.55;svg+='<text x="0" y="'+(y+22)+'">'+labels[i]+'</text><rect x="132" y="'+y+'" width="'+value*3.55+'" height="12" rx="2" fill="#ba9c75" opacity=".5"/><text x="'+(139+value*3.55)+'" y="'+(y+10)+'">'+value+'</text><g data-outcome="'+i+'" role="slider" tabindex="0" aria-label="Predicted '+labels[i]+' share" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+prediction[i]+'" class="distribution-outcome"><rect x="132" y="'+(y+24)+'" width="'+prediction[i]*3.55+'" height="15" rx="3" fill="#e9bd86"/><circle cx="'+x+'" cy="'+(y+31.5)+'" r="7" fill="#e9bd86" stroke="#141211" stroke-width="2"/><text x="'+(x+(prediction[i]>87?-12:12))+'" y="'+(y+37)+'" text-anchor="'+(prediction[i]>87?'end':'start')+'">'+distributionLabel(prediction[i])+'</text><rect x="125" y="'+(y+12)+'" width="370" height="41" fill="transparent"/></g>';});
    chart.innerHTML=svg;document.getElementById('tvd-value').textContent=tvd.toFixed(2);chart.dataset.prediction=prediction.join(',');chart.dataset.tvd=tvd.toFixed(3);
    if(active!==undefined){var target=chart.querySelector('[data-outcome="'+active+'"]');if(target)target.focus({preventScroll:true});}
  }
  function transfer(index,target) {
    target=Math.round(Math.max(0,Math.min(100,target)));var remaining=100-target,others=[0,1,2].filter(function(i){return i!==index;}),sum=prediction[others[0]]+prediction[others[1]];
    prediction[others[0]]=Math.round(remaining*(sum?prediction[others[0]]/sum:.5)*10)/10;prediction[others[1]]=Math.round((remaining-prediction[others[0]])*10)/10;prediction[index]=target;updateDistribution();
  }
  function pointerValue(event){var b=chart.getBoundingClientRect();return ((event.clientX-b.left)/b.width*560-132)/3.55;}
  chart.addEventListener('pointerdown',function(e){var row=e.target.closest('[data-outcome]');if(!row)return;dragOutcome=Number(row.dataset.outcome);chart.setPointerCapture(e.pointerId);transfer(dragOutcome,pointerValue(e));});
  chart.addEventListener('pointermove',function(e){if(dragOutcome!==null)transfer(dragOutcome,pointerValue(e));});
  chart.addEventListener('pointerup',function(){dragOutcome=null;});chart.addEventListener('pointercancel',function(){dragOutcome=null;});
  chart.addEventListener('keydown',function(e){var row=e.target.closest('[data-outcome]');if(!row)return;var i=Number(row.dataset.outcome);if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();var target=e.key==='Home'?0:e.key==='End'?100:prediction[i]+((e.key==='ArrowRight'||e.key==='ArrowUp')?1:-1);transfer(i,target);}});
  document.getElementById('distribution-reset').addEventListener('click',function(){prediction=reference.slice();updateDistribution();});updateDistribution();
  var current = document.querySelector('.sim-site-nav [aria-current=page]');
  if (current && window.innerWidth < 1050) current.scrollIntoView({block:'nearest', inline:'center'});
}());
