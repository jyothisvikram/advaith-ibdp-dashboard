import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let DATA=[], progress={};
let currentSession=null;
let offset=0,selected=DATA.find(x=>x.id==='49072862')?.id||DATA[0]?.id,subject='All',type='All',query='',monthShift=0;
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>{if(!s)return null;const m=String(s).match(/^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d))?/);return m?new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0)):null};
const fmt=(d,opt={day:'numeric',month:'short',year:'numeric'})=>d?d.toLocaleDateString('en-GB',opt):'—';const time=d=>d?d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}):'';
const midnight=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());const add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const color={'Mathematics':'#2679eb','Physics':'#e73c4a','Computer Science':'#13a55d','Business Management':'#f08b21','English':'#7c40d3','German':'#10a4a0','Unclassified':'#99a3b2'};
const pval=e=>progress[e.id]||{};
const status=e=>pval(e).status||'Not Started';
const types=['Unclassified','Class Activity','Assignment','Practice Questions','Assessment','Revision Material','Event','Task'];
async function saveActivity(e, patch){
  $('saveNote').textContent='Saving…';
  const {error}=await supabase.from('activities').update(patch).eq('managebac_uid',e.id);
  if(error){$('saveNote').textContent='Save failed';alert('Unable to save: '+error.message);return false;}
  $('saveNote').textContent='Saved to Supabase';
  return true;
}
function renderSidebar(){const ts=['All',...new Set(DATA.map(e=>e.type))];$('types').innerHTML=ts.map(t=>`<div class="sideitem ${type===t?'active':''}" data-type="${esc(t)}"><span>${esc(t==='All'?'All Activities':t)}</span><span>${t==='All'?DATA.length:DATA.filter(e=>e.type===t).length}</span></div>`).join('');const ss=['All',...new Set(DATA.map(e=>e.subject))];$('subjects').innerHTML=ss.map(s=>`<div class="sideitem ${subject===s?'active':''}" data-subject="${esc(s)}"><span>${s==='All'?'All Subjects':`<i class="dot" style="background:${color[s]||'#999'}"></i>`+esc(s)}</span><span>${s==='All'?DATA.length:DATA.filter(e=>e.subject===s).length}</span></div>`).join('');document.querySelectorAll('[data-type]').forEach(x=>x.onclick=()=>{type=x.dataset.type;render()});document.querySelectorAll('[data-subject]').forEach(x=>x.onclick=()=>{subject=x.dataset.subject;render()})}
function render(){renderSidebar();const now=midnight(new Date()),anchor=add(now,offset*30),from=add(anchor,-10),to=add(anchor,20);$('rangeTitle').textContent=`${fmt(from)} – ${fmt(to)}`;const visible=DATA.filter(e=>{let d=date(e.due)||date(e.start);return d&&d>=from&&d<add(to,1)&& (subject==='All'||e.subject===subject)&&(type==='All'||e.type===type)&&(!query||(e.title+' '+e.description+' '+e.subject).toLowerCase().includes(query))}).sort((a,b)=>(date(a.due)||date(a.start))-(date(b.due)||date(b.start)));
const complete=DATA.filter(e=>status(e)==='Completed').length,overdue=DATA.filter(e=>e.verified&&date(e.due)<new Date()&&!['Completed','Submitted'].includes(status(e))).length,upcoming=DATA.filter(e=>{let d=date(e.due)||date(e.start);return d&&d>=now&&d<add(now,7)}).length;
$('stats').innerHTML=[[DATA.length,'Calendar records'],[DATA.filter(e=>e.verified).length,'Verified deadlines'],[complete,'Marked completed'],[upcoming,'Activities next 7 days']].map(([n,l])=>`<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');
$('rows').innerHTML=visible.length?visible.map(e=>{const d=date(e.due)||date(e.start),st=status(e),cls=st==='Completed'?'completed':st==='In Progress'?'progress':st==='Submitted'?'completed':'pending';return `<tr data-id="${esc(e.id)}" class="${selected===e.id?'selected':''}"><td style="white-space:nowrap">${fmt(d,{day:'numeric',month:'short'})}<div class="sub">${fmt(d,{weekday:'short'})}</div></td><td class="activity">${esc(e.title)}${e.review?'<div class="sub">Classification needs review</div>':''}</td><td><span class="pill ${/Assignment|Assessment/.test(e.type)?'assignment':/Practice/.test(e.type)?'practice':''}">${esc(e.type)}</span></td><td><i class="dot" style="background:${color[e.subject]||'#999'}"></i>${esc(e.subject)}</td><td>${e.verified?fmt(date(e.due),{day:'numeric',month:'short'})+' '+time(date(e.due)):'—'}</td><td><span class="pill ${cls}">${esc(st)}</span></td></tr>`}).join(''):'<tr><td colspan="6" class="empty">No matching activities in this date range.</td></tr>';
document.querySelectorAll('tr[data-id]').forEach(x=>x.onclick=()=>{selected=x.dataset.id;render()});renderDetail();renderCalendar()}
function renderDetail(){const e=DATA.find(x=>x.id===selected);if(!e){$('detail').innerHTML='<h3>Activity details</h3>Select an activity.';return}const p=pval(e);$('detail').innerHTML=`<h3>Activity details</h3><div class="detail-title">${esc(e.title)}</div><div class="field"><b>Activity classification</b><select id="activityType">${types.map(t=>`<option value="${esc(t)}" ${e.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select></div><div class="field"><b>Subject</b>${esc(e.subject)}</div><div class="field"><b>Scheduled start</b>${fmt(date(e.start))} ${time(date(e.start))}</div><div class="field"><b>Scheduled end</b>${fmt(date(e.end))} ${time(date(e.end))}</div><div class="field"><b>Verified submission deadline</b>${e.verified?fmt(date(e.due))+' '+time(date(e.due)):'Not verified'}</div><div class="field"><b>Personal progress</b><select id="progressStatus">${['Not Started','In Progress','Completed','Submitted'].map(s=>`<option ${status(e)===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><b>Notes</b><textarea id="progressNotes" placeholder="Add personal notes...">${esc(p.notes||'')}</textarea></div><button id="saveProgress">Save progress</button><div class="field"><b>Calendar description</b><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(e.description||'No description in the calendar feed.')}</div></div>${e.review?'<p class="warning">The activity classification is provisional.</p>':''}<p class="warning">ManageBac submission status is not available from the calendar feed. Progress here is manually maintained.</p>`;const saveButton=$('saveProgress');
  const fields={type:$('activityType'),status:$('progressStatus'),notes:$('progressNotes')};
  let saved={type:e.type,status:status(e),notes:p.notes||''};
  let hasSaved=false, saving=false;
  const values=()=>({type:fields.type.value,status:fields.status.value,notes:fields.notes.value});
  const refreshButton=()=>{
    const v=values();
    const changed=v.type!==saved.type||v.status!==saved.status||v.notes!==saved.notes;
    saveButton.disabled=saving||!changed;
    saveButton.textContent=saving?'Saving…':changed?'Save Progress':hasSaved?'Saved':'Save Progress';
  };
  fields.type.addEventListener('change',refreshButton);
  fields.status.addEventListener('change',refreshButton);
  fields.notes.addEventListener('input',refreshButton);
  refreshButton();
  saveButton.onclick=async()=>{
    if(saveButton.disabled)return;
    const v=values();saving=true;refreshButton();
    const ok=await saveActivity(e,{progress_status:v.status,notes:v.notes,activity_type:v.type});
    saving=false;
    if(ok){
      progress[e.id]={status:v.status,notes:v.notes};e.type=v.type;
      saved={...v};hasSaved=true;
      // Update summary, filters and activity rows while preserving the detail form.
      render();
      const button=$('saveProgress');
      if(button){button.textContent='Saved';button.disabled=true;}
    }else refreshButton();
  };
}}

function renderCalendar(){const base=new Date(),m=new Date(base.getFullYear(),base.getMonth()+monthShift,1);$('monthTitle').textContent=fmt(m,{month:'long',year:'numeric'});const day=(m.getDay()+6)%7,days=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();let html=['M','T','W','T','F','S','S'].map(x=>`<div class="weekday">${x}</div>`).join('');for(let i=0;i<day;i++)html+='<div></div>';for(let i=1;i<=days;i++){const d=new Date(m.getFullYear(),m.getMonth(),i),has=DATA.some(e=>{const ed=date(e.due)||date(e.start);return ed&&ed.toDateString()===d.toDateString()});html+=`<div class="${has?'has':''} ${d.toDateString()===new Date().toDateString()?'current':''}" title="${has?'Has calendar activities':''}">${i}</div>`}$('cal').innerHTML=html}
$('prev').onclick=()=>{offset--;render()};$('next').onclick=()=>{offset++;render()};$('today').onclick=()=>{offset=0;render()};$('search').oninput=e=>{query=e.target.value.toLowerCase();render()};$('monthPrev').onclick=()=>{monthShift--;renderCalendar()};$('monthNext').onclick=()=>{monthShift++;renderCalendar()};
async function loadActivities(){
  const {data,error}=await supabase.from('activities').select('*').order('start_date',{ascending:true}).limit(1000);
  if(error)throw error;
  DATA=(data||[]).map(r=>({
    id:r.managebac_uid,title:r.title,description:r.description||'',
    start:r.start_date?new Date(r.start_date).toLocaleString('sv-SE',{timeZone:'Asia/Dubai'}).replace('T',' '):'',
    end:r.end_date?new Date(r.end_date).toLocaleString('sv-SE',{timeZone:'Asia/Dubai'}).replace('T',' '):'',
    due:r.due_date?new Date(r.due_date).toLocaleString('sv-SE',{timeZone:'Asia/Dubai'}).replace('T',' '):'',
    subject:r.subject||'Unclassified',type:r.activity_type||'Unclassified',
    verified:!!r.deadline_verified,review:false
  }));
  progress=Object.fromEntries((data||[]).map(r=>[r.managebac_uid,{status:r.progress_status||'Not Started',notes:r.notes||''}]));
  selected=DATA.find(x=>x.id==='49072862')?.id||DATA[0]?.id;
  $('saveNote').textContent='Connected to Supabase';render();
}
async function showSession(session){
  currentSession=session;
  $('loginPanel').hidden=!!session;
  $('dashboard').hidden=!session;
  $('signOutBtn').hidden=!session;
  if(session){
    try{await loadActivities()}catch(err){$('saveNote').textContent='Unable to load records: '+err.message;}
  }
}
$('loginForm').onsubmit=async ev=>{
  ev.preventDefault();$('loginMessage').textContent='Signing in…';
  const {data,error}=await supabase.auth.signInWithPassword({email:$('email').value,password:$('password').value});
  if(error){$('loginMessage').textContent=error.message;return;}
  $('loginMessage').textContent='';
  await showSession(data.session);
};
$('signOutBtn').onclick=async()=>{await supabase.auth.signOut();DATA=[];progress={};await showSession(null)};
const {data:sessionData}=await supabase.auth.getSession();
await showSession(sessionData.session);
