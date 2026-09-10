const baseWeeks = 8; // 2 months, used for the week calculation
let state = {q1:null,q11:[],q2:null,q21:null,q3:[],q4:null,weeks:0};
const $=id=>document.getElementById(id); const form=$("survey");
const data={
 q1:{title:'1. Is the data already sequenced?',opts:[['yes','Yes'],['no','No']]},
 q11:{title:'2 Who performed the sequencing?',opts:[['self','We outsourced the sequencing or We sequenced it ourselves.'],['single','Single Cell facility'],['diag','Data was sequenced by the biobank']]},
 q2:{title:'3. Do all the samples you plan to submit come from patients at the Máxima?',opts:[['maxima','Yes, all our samples belong to Maxima patients'],['external','No, part or all of our samples come from external individuals']]},
 q21:{title:'4. For your external samples, are you allowed to share and make the resulting data available?',opts:[['unknown','I don’t know'],['no','No'],['yes','Yes']]},
 q3:{title:'5. What data types/libraries does your dataset include?',opts:[['bulk','Bulk sequencing RNA-seq, WES, WGS, …'],['single','Single-cell sequencing (rna-seq, …)'],['spatial','Spatial sequencing'],['nano','Nanopore'],['methyl','Methylation data'],['other','Other?']]},
 q4:{title:'6. How many samples are included in your dataset?',opts:[['under100','Below 100'],['100-500','between 100 – 500'],['500-1000','between 500 – 100'],['1000+','more than 1000']]}
};
const advice={single:'single-cell doesn’t fit always into our existing data model. It’s important that before we meet you have a good overview of how the samples where prepared. How were replicates handled, etc…',methyl:'Methylation data requires slightly more information! Pay attention to the needed metadata!'};
function render(key){
 const d=data[key], multi=key==='q11'||key==='q3'; let html=`<div class="question"><h2>${d.title}</h2>`;
 if(key==='q3') html+=`<p class="question-note">You can select more than one data type.</p>`;
 d.opts.forEach(([v,t])=>html+=`<label class="option"><input type="${multi?'checkbox':'radio'}" name="${key}" value="${v}"> ${t}</label>`);
 html+=`<div class="actions"><button type="submit">Continue</button></div></div>`; form.innerHTML=html;
 const current=state[key]; if(Array.isArray(current)) current.forEach(v=>{const e=form.querySelector(`input[value="${CSS.escape(v)}"]`);if(e)e.checked=true}); else if(current){const e=form.querySelector(`input[value="${CSS.escape(current)}"]`);if(e)e.checked=true}
 form.onsubmit=e=>{e.preventDefault(); const vals=[...form.querySelectorAll('input:checked')].map(x=>x.value); state[key]=multi?vals:vals[0]; advance(key)};
}
function progress(n){$("progressText").textContent=`Question ${n} of 4`;$("progressBar").style.width=`${Math.min(100,n/4*100)}%`}
function advance(key){
 if(key==='q1'&&state.q1==='no') return stop('You are not yet ready to submit your data.','You don not have your data yet. Once you do, take the questionnaire again.');
 if(key==='q1'){progress(1);render('q11');return}
 if(key==='q11'){state.weeks=0;if(state.q11.includes('self'))state.weeks+=2;if(state.q11.includes('single'))state.weeks+=2;progress(2);render('q2');return}
 if(key==='q2'){if(state.q2==='external')state.weeks+=2;progress(2);render('q21');return}
 if(key==='q21'&&state.q21==='no') return stop('We can not share this data','Without authorization from the data/samples provider we are not allowed to proceed with the submission. If applicable, you want to proceed with only Máxima patient data continue the survey');
 if(key==='q21'){progress(3);render('q3');return}
 if(key==='q3'){progress(4);render('q4');return}
 if(key==='q4'){state.weeks += ({'under100':0,'100-500':1,'500-1000':2,'1000+':3})[state.q4]||0;showResult();}
}
function stop(title,text){form.classList.add('hidden');$('stop').classList.remove('hidden');$('stopTitle').textContent=title;$('stopText').textContent=text;$("progressText").textContent='Questionnaire stopped';$("progressBar").style.width='100%'}
function showResult(){form.classList.add('hidden');$('result').classList.remove('hidden');$("progressText").textContent='Complete';$("progressBar").style.width='100%';$('duration').textContent=`Normal 2 months + ${state.weeks} week${state.weeks===1?'':'s'}`;$('recommendation').textContent=`Considering the replies in your survey, we recommend you to reach out to the Big Data Core with that time line with the expected timeline above.`;const items=[];items.push('Your project and related datasets are already registered in FAIR Wizard, following these instructions [link].');if(state.q11.some(v=>v!=='diag'))items.push('Make sure you know the protocol used during the sequencing of your cells. If you don’t go ask them how x happened and how y were treated.');if(state.q2==='external')items.push('Make sure you know information about the provenance of the sample. I.e., The sex of the individual that provided the sample, the tumor type and topography. Contact them in advance.');if(state.q2==='external')items.push('Because our submission data model relies on the existance of identifiers for each class. We require the existance of identifiers for each individual');if(state.q3.includes('methyl'))items.push('Prepare in advance relevant assay information for the methylation data.');$('checklist').innerHTML=items.map(x=>`<li class="check">☐ ${x}</li>`).join('')}
function reset(){state={q1:null,q11:[],q2:null,q21:null,q3:[],q4:null,weeks:0};form.classList.remove('hidden');$('stop').classList.add('hidden');$('result').classList.add('hidden');progress(1);render('q1')}
$("restart").onclick=reset;$("restart2").onclick=reset;reset();
