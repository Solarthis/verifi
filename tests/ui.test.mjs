import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
async function setup({storageBlocked=false,noGsap=false,reduced=false,saved=null,dark=false}={}){
 const errors=[],motion=[],timers=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://example.invalid/',runScripts:'outside-only',virtualConsole:vc});const w=dom.window,d=w.document;
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 w.matchMedia=q=>({matches:q.includes('reduced-motion')?reduced:dark,addEventListener(){},removeEventListener(){}});
 w.IntersectionObserver=class{observe(){}};
 if(storageBlocked)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('blocked','SecurityError');}});else if(saved)w.localStorage.setItem('theme',saved);
 w.setTimeout=fn=>{timers.push(fn);return timers.length;};w.clearTimeout=id=>{timers[id-1]=()=>{};};
 const targets=t=>typeof t==='string'?[...d.querySelectorAll(t)]:Array.isArray(t)?t:t&&Symbol.iterator in Object(t)?[...t]:[t];
 const apply=(t,p={})=>{for(const el of targets(t)){if(!el?.style)continue;if('autoAlpha'in p){el.style.opacity=String(p.autoAlpha);el.style.visibility=p.autoAlpha?'visible':'hidden';}if('display'in p)el.style.display=p.display;}p.onComplete?.();};
 if(!noGsap)w.gsap={set:(t,p)=>{motion.push('set');apply(t,p);},to:(t,p)=>{motion.push('to');apply(t,p);},fromTo:(t,a,p)=>{motion.push('fromTo');apply(t,p);},killTweensOf(){},registerPlugin(){},utils:{toArray:s=>[...d.querySelectorAll(s)]},timeline:(cfg={})=>{let reversed=!!cfg.reversed,progress=0;const tasks=[];const chain={to(t,p){motion.push('timeline');tasks.push([t,p]);if(!cfg.paused)apply(t,p);return chain;},set(t,p){if(!cfg.paused)apply(t,p);return chain;},from(){return chain;},play(){reversed=false;progress=1;tasks.forEach(([t,p])=>apply(t,p));return chain;},reverse(){reversed=true;progress=0;return chain;},reversed:()=>reversed,progress:()=>progress};return chain;}};
 w.ScrollTrigger={};w.eval(script);d.dispatchEvent(new w.Event('DOMContentLoaded'));
 const trigger=d.querySelector('[data-modal-trigger]');const open=()=>{trigger.focus();trigger.click();};
 return {w,d,errors,motion,timers,open,close:()=>dom.window.close()};
}
test('blocked localStorage does not break initialization or theme switch',async()=>{const s=await setup({storageBlocked:true});s.d.querySelector('.theme-toggle-btn').click();assert.equal(s.errors.length,0);assert.ok(s.d.documentElement.classList.contains('dark'));s.close();});
test('invalid stored theme falls back to system preference',async()=>{const s=await setup({saved:'invalid',dark:true});assert.ok(s.d.documentElement.classList.contains('dark'));s.close();});
test('modal and menu work when animation CDN is unavailable',async()=>{const s=await setup({noGsap:true});s.open();assert.equal(s.errors.length,0);assert.equal(s.d.getElementById('waitlist-modal').hidden,false);s.close();});
test('reduced motion avoids animation initialization',async()=>{const s=await setup({reduced:true});assert.equal(s.motion.length,0);s.close();});
test('modal traps Tab and restores trigger focus on Escape',async()=>{const s=await setup();s.open();const form=s.d.getElementById('waitlist-form');const last=form.querySelector('button');last.focus();s.d.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(s.d.activeElement.id,'modal-close-btn');s.d.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(s.d.activeElement,s.d.querySelector('[data-modal-trigger]'));assert.equal(s.d.getElementById('waitlist-modal').hidden,true);s.close();});
test('demo confirmation never claims a real subscription',async()=>{const s=await setup();s.open();s.d.getElementById('email').value='test@example.invalid';s.d.getElementById('waitlist-form').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));const text=s.d.getElementById('modal-success-state').textContent;assert.match(text,/No email was saved or sent/);assert.equal(s.d.activeElement.id,'modal-success-close-btn');s.close();});
test('closing and reopening cannot reset new input with a stale timer',async()=>{const s=await setup();s.open();s.d.getElementById('email').value='first@example.invalid';s.d.getElementById('waitlist-form').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));s.d.getElementById('modal-success-close-btn').click();s.open();s.d.getElementById('email').value='second@example.invalid';s.timers.forEach(fn=>fn());assert.equal(s.d.getElementById('email').value,'second@example.invalid');assert.equal(s.d.getElementById('modal-form-state').style.opacity,'1');s.close();});
test('mobile menu closes with Escape and restores its button focus',async()=>{const s=await setup();const b=s.d.querySelector('.mobile-menu-button');b.style.display='flex';b.click();assert.equal(b.getAttribute('aria-expanded'),'true',JSON.stringify(s.errors));s.d.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(b.getAttribute('aria-expanded'),'false');assert.equal(s.d.activeElement,b);s.close();});
