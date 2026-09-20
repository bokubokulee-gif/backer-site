/* Independent teaching figures. Parameters are assumptions, never fitted estimates. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const text = (id, value) => { const node = byId(id); if (node) node.textContent = value; };
  const pct = n => `${Math.round(n * 100)}%`;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  const smallScreen = window.matchMedia('(max-width:700px)');
  const resizeFigures = () => {
    const jointChart = document.querySelector('.joint-chart');
    if (jointChart) jointChart.setAttribute('viewBox', smallScreen.matches ? '0 0 500 310' : '0 0 800 310');
    const quoteChart = document.querySelector('.quote-chart');
    if (quoteChart) quoteChart.setAttribute('viewBox', smallScreen.matches ? '0 0 800 190' : '0 0 800 245');
  };
  smallScreen.addEventListener('change', resizeFigures); resizeFigures();

  // Base figures always remain complete. Scroll only traces a highlight over them.
  const traces = new Map();
  document.querySelectorAll('[data-paper-trace]').forEach(source => {
    const trace = source.cloneNode(false);
    trace.removeAttribute('id'); trace.removeAttribute('data-paper-trace');
    trace.setAttribute('class', 'paper-path-trace'); trace.setAttribute('aria-hidden', 'true');
    trace.setAttribute('pathLength', '1'); trace.setAttribute('stroke-dasharray', '1');
    trace.setAttribute('stroke-dashoffset', '1'); source.after(trace);
    traces.set(source, trace);
  });
  const setPath = (node, path) => {
    node.setAttribute('d', path);
    if (traces.has(node)) traces.get(node).setAttribute('d', path);
  };
  const progress = document.createElement('div');
  progress.className = 'paper-reading-progress'; progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);
  let scrollFrame = 0;
  const paintScroll = () => {
    scrollFrame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = range > 0 ? Math.max(0, Math.min(1, window.scrollY / range)) : 1;
    progress.style.transform = `scaleX(${ratio})`;
    traces.forEach((trace, source) => {
      const svg = source.ownerSVGElement;
      const top = svg.getBoundingClientRect().top;
      const reveal = reducedMotion.matches || svg.dataset.interacted ? 1 : Math.max(0, Math.min(1, (innerHeight * .9 - top) / (innerHeight * .55)));
      trace.setAttribute('stroke-dashoffset', String(1 - reveal));
    });
  };
  const scheduleScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScroll); };
  window.addEventListener('scroll', scheduleScroll, {passive:true});
  window.addEventListener('resize', scheduleScroll, {passive:true});
  paintScroll();

  // Entry motion is a small positional cue; text is never hidden awaiting script.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (!reducedMotion.matches && entry.target.animate) entry.target.animate(
        [{transform:'translateY(9px)',opacity:.9},{transform:'translateY(0)',opacity:1}],
        {duration:420,easing:'cubic-bezier(.2,.7,.3,1)'}
      );
    }), {threshold:.08});
    document.querySelectorAll('.paper-section,.paper-figure,.paper-sources').forEach(node => observer.observe(node));
  }

  // Only an input event interpolates a figure. Readouts update immediately.
  const tweens = new Map();
  const tween = (key, from, to, draw, animate) => {
    const old = tweens.get(key); if (old) cancelAnimationFrame(old.frame);
    if (!animate || reducedMotion.matches) { draw(to); tweens.delete(key); return; }
    const start = performance.now();
    const state = {frame:0, finish:() => draw(to)};
    const step = now => {
      const t = Math.min(1, (now - start) / 180);
      draw(from + (to - from) * (1 - (1 - t) ** 3));
      if (t < 1) state.frame = requestAnimationFrame(step); else tweens.delete(key);
    };
    tweens.set(key, state); state.frame = requestAnimationFrame(step);
  };
  const interacted = node => {
    node.closest('figure').querySelector('svg').dataset.interacted = 'true'; paintScroll();
  };
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      tweens.forEach(state => { cancelAnimationFrame(state.frame); state.finish(); }); tweens.clear();
      document.getAnimations().forEach(animation => animation.finish());
    }
    paintScroll();
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const attrs = (node, values) => Object.entries(values).forEach(([name,value]) => node.setAttribute(name,String(value)));
  const svgNode = (name, values) => { const node = document.createElementNS('http://www.w3.org/2000/svg',name); attrs(node,values); return node; };
  const localPoint = (svg,event) => {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  };
  const activateSvg = (node, action) => {
    node.addEventListener('click', action);
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); action(event); }
    });
  };

  const quoteChart = document.querySelector('.quote-chart');
  if (quoteChart) {
    const marker = byId('quote-marker');
    let belief = .7, bid = .59, ask = .63, displayed = .7, side = 'ask', inspecting = false, dragging = false;
    const draw = q => {
      displayed = q; marker.setAttribute('transform', `translate(${60 + q * 680} 0)`);
      byId('quote-marker-label').setAttribute('text-anchor', q > .85 ? 'end' : q < .15 ? 'start' : 'middle');
    };
    const render = animate => {
      const bx = 60 + bid * 680, ax = 60 + ask * 680;
      attrs(byId('quote-left-region'),{width:bx-60}); attrs(byId('quote-spread-region'),{x:bx,width:ax-bx}); attrs(byId('quote-right-region'),{x:ax,width:740-ax});
      attrs(byId('quote-bid-line'),{x1:bx,x2:bx}); attrs(byId('quote-ask-line'),{x1:ax,x2:ax});
      attrs(byId('quote-bid-leader'),{x2:bx}); attrs(byId('quote-ask-leader'),{x2:ax});
      text('quote-bid-label',`BID ${bid.toFixed(2)}`); text('quote-ask-label',`ASK ${ask.toFixed(2)}`);
      text('quote-value',pct(belief)); text('quote-marker-label',`q = ${belief.toFixed(2)}`);
      attrs(marker,{'aria-valuenow':Math.round(belief*100),'aria-valuetext':`${Math.round(belief*100)} percent`});
      text('quote-buy',`${belief-ask>=0?'+':''}${(belief-ask).toFixed(2)}`); text('quote-sell',`${bid-belief>=0?'+':''}${(bid-belief).toFixed(2)}`);
      text('quote-interpretation',belief>ask?'Acquisition has positive expected value before costs.':belief<bid?'Selling an owned contract exceeds its subjective expected payout.':'Neither quoted transaction offers a positive edge before costs.');
      const price = side === 'ask' ? ask : bid;
      text('quote-side-label',side === 'ask'?'Ask · buy a YES':'Bid · sell an owned YES'); text('quote-price-value',`$${price.toFixed(2)}`);
      text('quote-cost-note',side === 'ask'?`Buying costs $${ask.toFixed(2)}; the assumed expected payout is $${belief.toFixed(2)}.`:`Selling receives $${bid.toFixed(2)} instead of retaining an assumed expected payout of $${belief.toFixed(2)}.`);
      document.querySelectorAll('[data-quote-side]').forEach(node => attrs(node,{'aria-pressed':inspecting && node.dataset.quoteSide === side,'aria-expanded':inspecting && node.dataset.quoteSide === side,'aria-controls':'quote-inspector'}));
      byId('quote-less').disabled=belief<=0; byId('quote-more').disabled=belief>=1;
      byId('quote-cheaper').disabled=side==='ask'?ask<=bid:bid<=0; byId('quote-dearer').disabled=side==='ask'?ask>=1:bid>=ask;
      quoteChart.dataset.belief=belief.toFixed(2); quoteChart.dataset.bid=bid.toFixed(2); quoteChart.dataset.ask=ask.toFixed(2);
      tween('quote',displayed,belief,draw,animate);
    };
    const setBelief = (q,animate=true) => { belief=clamp(Math.round(q*100)/100,0,1); interacted(marker); render(animate); };
    const setFromPointer = event => setBelief((localPoint(quoteChart,event).x-60)/680,false);
    quoteChart.addEventListener('pointerdown', event => {
      if (event.target.closest('[data-quote-side]') || event.button>0) return;
      dragging=true; quoteChart.setPointerCapture(event.pointerId); marker.focus({preventScroll:true}); setFromPointer(event);
    });
    quoteChart.addEventListener('pointermove', event => { if (dragging) setFromPointer(event); });
    const release = () => { dragging=false; };
    quoteChart.addEventListener('pointerup',release); quoteChart.addEventListener('pointercancel',release);
    marker.addEventListener('keydown', event => {
      const offsets={ArrowLeft:-.01,ArrowDown:-.01,ArrowRight:.01,ArrowUp:.01,PageDown:-.1,PageUp:.1};
      if (event.key in offsets) { event.preventDefault(); setBelief(belief+offsets[event.key]); }
      else if (event.key==='Home'||event.key==='End') { event.preventDefault(); setBelief(event.key==='Home'?0:1); }
    });
    byId('quote-less').addEventListener('click',()=>setBelief(belief-.01)); byId('quote-more').addEventListener('click',()=>setBelief(belief+.01));
    document.querySelectorAll('[data-quote-side]').forEach(node => {
      const select = event => { event.stopPropagation(); side=node.dataset.quoteSide; inspecting=true; byId('quote-inspector').hidden=false; render(false); };
      if (node instanceof SVGElement) activateSvg(node,select); else node.addEventListener('click',select);
    });
    const editPrice = step => {
      if (side==='ask') ask=clamp(Math.round((ask+step)*100)/100,bid,1);
      else bid=clamp(Math.round((bid+step)*100)/100,0,ask);
      interacted(marker); render(false);
    };
    byId('quote-cheaper').addEventListener('click',()=>editPrice(-.01)); byId('quote-dearer').addEventListener('click',()=>editPrice(.01));
    byId('quote-reset').addEventListener('click',()=>{bid=.59;ask=.63;render(false);}); render(false);
  }

  const memoryChart = document.querySelector('.memory-chart');
  if (memoryChart) {
    let pulses=Array.from({length:20},(_,i)=>i<4),rho=.75,selected=4,head=20,values=[],playing=false,frame=0,started=0;
    const path = (series, end=20) => series.slice(0,end+1).map((value,t)=>`${t?'L':'M'}${60+t*34},${230-value*180}`).join(' ');
    const showFrame = step => {
      head=clamp(step,0,20); byId('memory-line').setAttribute('d',path(values,head));
      byId('memory-playhead').setAttribute('transform',`translate(${60+head*34} 0)`); byId('memory-state-point').setAttribute('cy',String(230-values[head]*180));
      text('memory-current',`Step ${head} · state ${values[head].toFixed(3)}`); memoryChart.dataset.playhead=String(head);
    };
    byId('memory-current').setAttribute('aria-live','off');
    const stop = () => { playing=false; cancelAnimationFrame(frame); text('memory-play','Play →'); byId('memory-play').setAttribute('aria-pressed','false'); };
    const selectStep = step => {
      selected=clamp(step,1,20); byId('memory-selected').value=String(selected); byId('memory-selected-step').setAttribute('x',String(60+(selected-1)*34));
      text('memory-toggle',`${pulses[selected-1]?'Remove':'Add'} pulse at step ${selected}`);
      text('memory-selection-note',`Step ${selected}: exposure ${pulses[selected-1]?'on':'off'}.`);
      text('memory-description',`Selected step ${selected}: exposure ${pulses[selected-1]?'on':'off'}. Retention ${rho.toFixed(2)}. Use arrow keys to select and Enter to toggle.`);
    };
    const recompute = (complete=false) => {
      stop(); values=[0]; pulses.forEach((on,i)=>values.push(rho*values[i]+(1-rho)*(on?1:0)));
      byId('memory-preview').setAttribute('d',path(values));
      let exposure=`M60 ${pulses[0]?50:230}`;
      pulses.forEach((on,i)=>{ exposure+=`V${on?50:230}H${60+(i+1)*34}`; });
      byId('memory-exposure').setAttribute('d',exposure);
      const backdrop=byId('memory-pulse-backdrop'); backdrop.replaceChildren();
      pulses.forEach((on,i)=>{
        if(on)backdrop.append(svgNode('rect',{x:60+i*34,y:50,width:34,height:180,fill:'#aaa398','fill-opacity':.07}));
        const cell=byId('memory-pulse-cells').children[i]; cell.setAttribute('fill',on?'#e9bd86':'#1b1a19'); cell.setAttribute('stroke',on?'#e9bd86':'#393735');
      });
      text('memory-value',`ρ = ${rho.toFixed(2)}`); text('memory-peak',Math.max(...values).toFixed(3)); text('memory-later',values[10].toFixed(3)); text('memory-half',`${(Math.log(.5)/Math.log(rho)).toFixed(1)} steps`);
      selectStep(selected); showFrame(complete||reducedMotion.matches?20:0); stop();
      memoryChart.dataset.pulses=pulses.map(Number).join(''); memoryChart.dataset.retention=rho.toFixed(2);
    };
    const toggle = () => { pulses[selected-1]=!pulses[selected-1]; interacted(memoryChart); recompute(); };
    memoryChart.addEventListener('click',event=>{ selectStep(Math.ceil((localPoint(memoryChart,event).x-60)/34)); toggle(); });
    memoryChart.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();selectStep(selected+(event.key==='ArrowRight'?1:-1));}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}
    });
    byId('memory-selected').addEventListener('change',event=>selectStep(Number(event.target.value))); byId('memory-toggle').addEventListener('click',toggle);
    byId('memory-retention').addEventListener('change',event=>{rho=Number(event.target.value)/100;recompute();});
    byId('memory-clear').addEventListener('click',()=>{pulses.fill(false);selected=1;recompute();});
    byId('memory-reset').addEventListener('click',()=>{pulses=pulses.map((_,i)=>i<4);rho=.75;selected=4;byId('memory-retention').value='75';recompute(true);});
    const advance = now => {
      if(!playing)return; const next=clamp(Math.floor((now-started)/240),0,20); if(next!==head)showFrame(next);
      if(head===20)stop(); else frame=requestAnimationFrame(advance);
    };
    byId('memory-play').addEventListener('click',()=>{
      interacted(memoryChart); if(playing){stop();return;}
      if(reducedMotion.matches){showFrame(20);stop();return;}
      if(head===20)showFrame(0); playing=true; text('memory-play','Pause'); byId('memory-play').setAttribute('aria-pressed','true');
      started=performance.now()-head*240; frame=requestAnimationFrame(advance);
    });
    byId('memory-step').addEventListener('click',()=>{stop();showFrame(head===20?1:head+1);stop();});
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){stop();showFrame(20);stop();}});
    recompute(true);
  }

  const jointChart=document.querySelector('.joint-chart');
  if(jointChart){
    let overlap=25,displayed=25;
    const names=['Interested and able','Interested and unable','Not interested and able','Not interested and unable'];
    const draw=value=>{
      displayed=value;[value,50-value,50-value,value].forEach((v,i)=>{
        byId(`joint-fill-${i}`).setAttribute('fill-opacity',String(.04+(v/50)*.12)); byId(`joint-mass-${i}`).setAttribute('r',String(Math.sqrt(v/50)*36));
      });byId('joint-bar').setAttribute('width',String(value*3.6));
    };
    const render=animate=>{
      const cells=[overlap,50-overlap,50-overlap,overlap];
      cells.forEach((v,i)=>{
        text(`joint-cell-${i}`,`${v}%`); const node=jointChart.querySelector(`[data-joint-cell="${i}"]`);
        attrs(node,{'aria-label':`${names[i]}: ${v} percent. Add five percentage points to this diagonal.`,'aria-disabled':v===50});
      });
      text('joint-value',`${overlap}%`);text('joint-action',`${overlap}%`);text('joint-correlation',((overlap/100-.25)/.25).toFixed(2));
      text('joint-description',`${overlap}% is both interested and able. Each trait margin remains 50%; all four cells sum to 100%.`);
      byId('joint-less').disabled=overlap===0;byId('joint-more').disabled=overlap===50;jointChart.dataset.overlap=String(overlap);
      tween('joint',displayed,overlap,draw,animate);
    };
    const reassign=direction=>{
      const next=clamp(overlap+direction*5,0,50);
      if(next===overlap){text('joint-transfer','That diagonal is at its limit. Choose the other diagonal to move population back.');return;}
      overlap=next;interacted(jointChart);
      jointChart.querySelectorAll('[data-joint-cell]').forEach(node=>{const i=Number(node.dataset.jointCell);node.classList.toggle('is-selected',direction>0?(i===0||i===3):(i===1||i===2));});
      text('joint-transfer',`Added 5 percentage points to each ${direction>0?'matching':'opposing'} cell. Both trait totals stay at 50%.`);render(true);
    };
    jointChart.querySelectorAll('[data-joint-cell]').forEach(node=>activateSvg(node,()=>reassign([0,3].includes(Number(node.dataset.jointCell))?1:-1)));
    byId('joint-less').addEventListener('click',()=>reassign(-1));byId('joint-more').addEventListener('click',()=>reassign(1));
    byId('joint-reset').addEventListener('click',()=>{overlap=25;jointChart.querySelectorAll('.is-selected').forEach(node=>node.classList.remove('is-selected'));text('joint-transfer','Restored independence: 25% in each cell.');render(true);});render(false);
  }
})();
