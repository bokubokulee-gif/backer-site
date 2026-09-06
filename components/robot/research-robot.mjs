import { mountResearchRobot } from './robot-scene.mjs';
const host = document.getElementById('research-robot');
const dispose = mountResearchRobot(host);
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true });
