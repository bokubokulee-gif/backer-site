/*!
 * Eye icon: AnimateIcons / Hugeicons (https://animateicons.in)
 * Author: Avijit Dey (@avijit07x)
 * Source: https://github.com/Avijit07x/animateicons
 * Native SVG animation adaptation for Backer.
 *
 * MIT License
 * Copyright (c) 2025 Avijit Dey
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */(()=>{"use strict";function u(){const a=window.matchMedia("(prefers-reduced-motion: reduce)"),c=[];document.querySelectorAll("[data-p2-eye]").forEach(t=>{if(t.dataset.p2EyeReady)return;const o=t.querySelector(".p2-asset-eye__outline"),d=t.querySelector(".p2-asset-eye__pupil");if(!o||!d||!o.animate||!d.animate)return;t.dataset.p2EyeReady="true";let s=[],n=null;function i(){s.forEach(e=>e.cancel()),s=[]}function l(){i(),!(a.matches||document.hidden)&&(s=[o.animate([1,.1,1].map(e=>({transform:`scaleY(${e})`,easing:"ease-in-out"})),{duration:250}),d.animate([-2,2,-1,1,0].map(e=>({transform:`translateX(${e}px)`,easing:"ease-in-out"})),{duration:1600})])}t.addEventListener("pointerenter",e=>{e.pointerType!=="touch"&&l()},{passive:!0}),t.addEventListener("pointerleave",e=>{(e.pointerType!=="touch"||n)&&(n=null,i())},{passive:!0}),t.addEventListener("pointerdown",e=>{e.pointerType==="touch"&&(n={id:e.pointerId,x:e.clientX,y:e.clientY},l())},{passive:!0}),t.addEventListener("pointermove",e=>{n&&n.id===e.pointerId&&Math.hypot(e.clientX-n.x,e.clientY-n.y)>9&&(n=null,i())},{passive:!0}),t.addEventListener("pointerup",()=>{n=null},{passive:!0}),t.addEventListener("pointercancel",()=>{n=null,i()},{passive:!0}),c.push(()=>{n=null,i()})});const r=()=>c.forEach(t=>t());a.addEventListener?a.addEventListener("change",r):a.addListener(r),window.addEventListener("blur",r),document.addEventListener("visibilitychange",()=>{document.hidden&&r()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u,{once:!0}):u()})();
