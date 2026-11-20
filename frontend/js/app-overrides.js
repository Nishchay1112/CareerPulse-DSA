'use strict';
// These interface upgrades leave the original C++ backend and its six ranked challenges unchanged.
const CPX_ORIGINAL_PRACTICE = practice;

shell = function(active,title,subtitle,content){
 const links=[['dashboard','Dashboard'],['practice','Practice'],['daily','Daily Questions'],['materials','Study Resources']];
 $('#app').innerHTML=`<nav>${logo()}<div class="links">${links.map(([page,label])=>`<a class="${active===page?'active':''}" href="#/${page}">${label}</a>`).join('')}</div><a class="avatar" href="#/profile" aria-label="Open profile">${esc((me.personal.name||me.username).slice(0,1).toUpperCase())}</a><a class="settings-link" href="#/settings" aria-label="Settings" title="Settings">⚙</a></nav><main class="shell"><header class="welcome"><div><p class="eyebrow">YOUR PERSONAL CAREER WORKSPACE</p><h1>${title}</h1><p class="muted">${subtitle}</p></div><span class="pill">${esc(me.career||'New journey')}</span></header>${content}<footer>CareerPulse · Progress with purpose. Learning estimates are indicative, not guarantees.</footer></main>`;
};
onboarding = function(step,title,description,content){
 $('#app').innerHTML=`<main class="onboard"><div class="topline">${logo()}<a href="#/settings">⚙ Settings</a></div><div class="steps"><span class="${step===1?'current':''}">01 · Personal information</span><span class="${step===2?'current':''}">02 · Your career</span><span class="${step===3?'current':''}">03 · Starting skills</span></div><p class="eyebrow">LET’S MAKE THIS YOURS</p><h1>${title}</h1><p class="muted">${description}</p>${content}</main>`;
};
chart = CPX.easyChart;

strengthMeter = function(id){
 const field=document.getElementById(id),bar=$('#strengthBar'),label=$('#strengthLabel');
 function refresh(){const v=field.value;
  const checks=[[v.length>=12&&v.length<=128,'12+ characters'],[/[a-z]/.test(v),'lowercase'],[/[A-Z]/.test(v),'uppercase'],[/\d/.test(v),'number'],[/[^a-z\d]/i.test(v),'symbol']];
  bar.style.width=checks.filter(c=>c[0]).length*20+'%';
  label.innerHTML=checks.map(([ok,t])=>`<span class="${ok?'met':''}">${ok?'✓':'○'} ${t}</span>`).join(' · ');
 }
 const box=document.createElement('div');box.className='password-actions';box.innerHTML='<button type="button" class="secondary">Generate a strong password</button><small>We can make one for you.</small>';
 label.after(box);
 box.querySelector('button').onclick=()=>{
  const groups=['abcdefghjkmnpqrstuvwxyz','ABCDEFGHJKMNPQRSTUVWXYZ','23456789','!@#$%'];
  const rand=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;};
  const chars=groups.map(g=>g[rand(g.length)]),pool=groups.join('');
  while(chars.length<16)chars.push(pool[rand(pool.length)]);
  for(let j=chars.length-1;j>0;j--){let k=rand(j+1);[chars[j],chars[k]]=[chars[k],chars[j]];}
  field.value=chars.join(''); const confirm=document.getElementById('confirm');if(confirm)confirm.value=field.value;
  field.type='text';const toggle=document.querySelector('[data-show="password"]');if(toggle)toggle.textContent='Hide';refresh();
 };
 field.addEventListener('input',refresh);refresh();
};

personal = function(edit=false){
 const p=me.personal,x=CPX.profile(me.id);
 const content=`<form id="personalForm" class="card">${CPX.personalFields(p,x)}<p class="help">Choose a college or department suggestion, or enter the full official name. Birthday and optional details stay in this browser.</p><p class="error" role="alert"></p><button type="submit">${edit?'Save personal information':'Next: choose your career →'}</button></form>`;
 if(edit)shell('settings','Personal information','Keep your profile up to date.',content);
 else onboarding(1,'First, a little about you.','Tell us a bit about your studies and goals.',content);
 CPX.wirePersonal();
 form('#personalForm',async b=>{
   me=await api('/personal',{name:b.name,college:b.college,department:b.department,year:b.year});
   CPX.saveProfile(me.id,{dob:b.dob,degree:b.degree,gender:b.gender,goal:b.goal});
   go(edit?'settings':'career');
 });
};

profile = async function(){
 const d=await api('/dashboard'),x=CPX.profile(me.id);
 shell('profile','Your story, in progress.','Your profile and your next goal.',`<section class="card"><div class="profile-head"><div class="avatar">${esc((me.personal.name||me.username)[0].toUpperCase())}</div><div><h2>${esc(me.personal.name||me.username)}</h2><p class="muted">@${esc(me.username)} · ${esc(me.personal.college||'College not set')}</p></div></div><div class="form-grid"><p><small>Department</small><br>${esc(me.personal.department)}</p><p><small>Degree</small><br>${esc(x.degree||'Not provided')}</p><p><small>Year of study</small><br>${esc(me.personal.year)}</p><p><small>Date of birth</small><br>${esc(x.dob||'Not provided')}</p><p><small>Age</small><br>${CPX.ageFromDOB(x.dob)}</p><p><small>Career</small><br>${esc(me.career)}</p><p><small>Your goal</small><br>${esc(x.goal||'Not provided')}</p><p><small>Milestones</small><br>${d.stats.completed} completed checks · ${d.stats.solved} ranked challenges</p></div><a href="#/edit-personal"><button class="secondary">Edit personal information</button></a></section>`);
};

settings = async function(){
 const d=await api('/dashboard'),x=CPX.profile(me.id);
 const entries=[['Name',me.personal.name],['Username',me.username],['Email',me.email],['Verified phone',me.phone],['College',me.personal.college],['Department',me.personal.department],['Degree',x.degree],['Year of study',me.personal.year],['Date of birth',x.dob],['Age',CPX.ageFromDOB(x.dob)],['Career',me.career],['Your goal',x.goal]];
 shell('settings','Make yourself at home.','Update your profile and skill levels whenever you like.',`<div class="grid">
  <section class="card"><h2>Your account</h2>${entries.map(([key,value])=>`<div class="skill-row"><small>${esc(key)}</small><b>${esc(value||'Not set')}</b></div>`).join('')}<p><a href="#/edit-personal">Edit personal details →</a></p><p class="help">Date of birth, degree and optional goal are stored in this browser only. Email and phone need an account re-verification flow to change.</p><p><a href="#/forgot">Change / recover password →</a></p></section>
  <section class="card"><h2>Appearance</h2><p class="muted">CareerPulse starts in light mode. Theme changes last for this visit.</p><div class="theme-buttons"><button id="lightTheme" class="secondary">☀ Light</button><button id="darkTheme" class="secondary">☾ Dark</button></div><h2 style="margin-top:40px">Session</h2><p class="muted">Log out when you're done using this device.</p><button id="logout" class="secondary">Log out</button></section>
  <section class="card wide settings-skill-block"><h2>Edit your skill levels</h2><p class="muted">These are the ratings you selected after choosing your career. Updating them changes your recommended resources without deleting completed learning checks.</p><form id="levelSettings">${CPX.selectLevels(relevant(),d.ratings)}<p class="error" role="alert"></p><button type="submit">Save levels & refresh recommendations →</button></form></section>
  <section class="card wide"><h2>Account controls</h2><div class="settings-row"><div><b>Reset all progress</b><p>Clear assessments, learning checks and ranked challenges while keeping your profile.</p></div><button class="secondary" data-action="reset">Reset progress</button></div><div class="settings-row"><div><b>Change career & reset progress</b><p>Choose a new career; your existing progress will be cleared.</p></div><button class="secondary" data-action="career">Change career</button></div><div class="settings-row"><div><b>Delete account</b><p>Permanently delete server-stored account and progress.</p></div><button class="danger" data-action="delete">Delete account</button></div></section>
 </div>`);
 $('#lightTheme').onclick=()=>document.body.dataset.theme='light';
 $('#darkTheme').onclick=()=>document.body.dataset.theme='dark';
 $('#logout').onclick=async()=>{try{await api('/auth/logout',{});me=null;go('login');}catch(e){toast(e.message);}};
 document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>confirmAction(b.dataset.action));
 form('#levelSettings',async b=>{
  await api('/assessment',{ratings:Object.entries(b).map(([skillId,level])=>({skillId:Number(skillId),level:Number(level)}))});
  toast('Updated! Your level-matched resources are ready.');await settings();
 });
};

async function materials(){
 const d=await api('/dashboard');
 shell('materials','Resources for your current level.','Your ratings guide you to a sensible place to start for each career skill.',
  `<p class="notice">Changed your skill rating? Update it in <a href="#/settings">Settings</a>. The next visit here uses your latest ratings. All suggested resources are free to access.</p><div class="resource-grid">${CPX.resourceCards(relevant(),d.ratings)}</div><p class="help">Links point to external learning material; course completion is not tracked automatically.</p>`);
}

practice = async function(daily=false){
 dashboard=await api('/dashboard');
 CPX.challengePage(daily);
};

// The original backend still tracks its six ranked problems and today's college leaderboard.
// This button offers those unchanged server-verified challenges without mixing their scores
// with local guided-practice completion.
document.addEventListener('click',e=>{
 const button=e.target.closest('a[href="#/ranked"]');
 if(button){e.preventDefault();location.hash='/ranked';}
});

// Render again after extensions load, so opening a deep link also uses the updated UI.
render();

// Include the added local guided-question history in existing destructive controls.
confirmAction = function(action){
 const title={reset:'Reset all progress?',career:'Change career and start fresh?',delete:'Permanently delete your account?'};
 modal(`<h2>${title[action]}</h2><p>${action==='delete'?'Your account, personal details and learning records will be deleted permanently.':'All assessments, completed checks, guided questions and ranked attempts will be cleared. Your personal information is kept.'} This cannot be undone.</p><form id="actionForm">${action==='career'?`<label for="newCareer">New career</label><select id="newCareer" name="career">${catalog.careers.filter(c=>c.name!==me.career).map(c=>`<option>${esc(c.name)}</option>`).join('')}</select>`:''}${password('Confirm your current password')}<p class="error" role="alert"></p><div class="row"><button id="cancelDialog" type="button" class="secondary">Cancel</button><button class="danger" type="submit">${action==='delete'?'Delete permanently':'Confirm reset'}</button></div></form>`);
 form('#actionForm',async values=>{
  const userId=me.id;
  await api('/settings/action',{action,...values});
  // These keys are browser-only; server authentication and ranked history use the old API.
  try {
   for(let i=localStorage.length-1;i>=0;i--){let key=localStorage.key(i);if(key?.startsWith('cp-challenges-v2-'+userId+'-'))localStorage.removeItem(key);}
   if(action==='delete')localStorage.removeItem('cp-extra-profile-v2-'+userId);
  } catch(_) { /* browser storage may be disabled */ }
  $('#dialog').close();
  if(action==='delete'){me=null;go('login');}
  else{me=await api('/me');go('assessment');}
  toast(action==='delete'?'Account deleted.':'Progress reset; your profile is retained.');
 });
};
