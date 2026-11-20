'use strict';
// CareerPulse experience upgrades. The original six ranked backend challenges remain intact.
const CPX = (() => {
  const TOPICS = ['Arrays','Searching','Stacks','Graphs'];
  const DEGREES = {'B.Tech':4,'B.E.':4,'BCA':3,'B.Sc.':3,'BBA':3,'B.Com':3,'BA':3,'M.Tech':2,'M.E.':2,'MCA':2,'M.Sc.':2,'MBA':2,'MA':2,'Diploma':3,'Ph.D.':6,'Other':4};
  const COLLEGES = [
    'Shoolini University','Jaypee University of Information Technology','Chitkara University','Himachal Pradesh University',
    'National Institute of Technology Hamirpur','Indian Institute of Technology Mandi','Indian Institute of Technology Delhi',
    'Indian Institute of Technology Bombay','Indian Institute of Technology Kanpur','Indian Institute of Technology Madras',
    'Indian Institute of Technology Roorkee','Indian Institute of Technology Kharagpur','Indian Institute of Technology Guwahati',
    'Indian Institute of Technology Hyderabad','National Institute of Technology Jalandhar','National Institute of Technology Kurukshetra',
    'National Institute of Technology Delhi','National Institute of Technology Trichy','National Institute of Technology Surathkal',
    'National Institute of Technology Warangal','Delhi Technological University','NSUT Delhi',
    'VIT Vellore','SRM Institute of Science and Technology','Lovely Professional University','Amity University',
    'Thapar Institute of Engineering and Technology','Panjab University','University of Delhi',
    'Christ University','Manipal Institute of Technology','Graphic Era University','Other (type your college)'
  ];
  const DEPARTMENTS = [
    'Computer Science and Engineering','Information Technology','Artificial Intelligence and Machine Learning',
    'Artificial Intelligence and Data Science','Cybersecurity','Software Engineering',
    'Electronics and Communication Engineering','Electrical Engineering','Mechanical Engineering',
    'Civil Engineering','Chemical Engineering','Biotechnology','Data Science',
    'Computer Applications','Mathematics','Physics','Commerce','Management','Economics',
    'Humanities','CSE','IT','ECE','EE','ME','Civil','Other'
  ];
  const TODAY = () => new Date().toISOString().slice(0,10);
  function load(key, fallback={}) { try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch (_) {return fallback;} }
  function save(key,val) {try{localStorage.setItem(key,JSON.stringify(val));return true;}catch(_){return false;}}
  const profileKey=id=>'cp-extra-profile-v2-'+id;
  const profile=id=>load(profileKey(id));
  const saveProfile=(id,details)=>save(profileKey(id),details);
  function ageFromDOB(value){ if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return 'Not provided'; const t=new Date();const birth=new Date(value+'T12:00:00');if(isNaN(birth)||birth>t)return 'Not provided';let a=t.getFullYear()-birth.getFullYear();if(t.getMonth()<birth.getMonth()||(t.getMonth()===birth.getMonth()&&t.getDate()<birth.getDate()))a--;return a>=0&&a<120?String(a):'Not provided'; }
  const yearOptions=(degree)=>Array.from({length:DEGREES[degree]||4},(_,i)=>`${i+1}${i===0?'st':i===1?'nd':i===2?'rd':'th'} year`);
  function options(values,selected=''){return values.map(v=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(v)}</option>`).join('');}
  function personalFields(p={},extra={}){
    const degree=DEGREES[extra.degree]?extra.degree:'B.Tech';
    const year=yearOptions(degree);
    const value=p.year&&year.includes(p.year)?p.year:year[0];
    const oldCollege=p.college||'';
    const collegeList=COLLEGES.filter(x=>!x.startsWith('Other'));
    return `<div class="profile-section"><h2>About you</h2><p class="muted">A few personal details to make your path feel yours. Birthday and optional details stay in this browser.</p><div class="form-grid spacious">
      <div>${input('name','Full name','text',p.name||'','maxlength="100" autocomplete="name"')}</div>
      <div><label for="dob">Date of birth (optional)</label><input type="date" id="dob" name="dob" max="${TODAY()}" value="${esc(extra.dob||'')}"><small id="agePreview">Age: ${ageFromDOB(extra.dob)}</small></div>
      <div><label for="degree">Degree / programme</label><select id="degree" name="degree">${options(Object.keys(DEGREES),degree)}</select></div>
      <div><label for="year">Year of study</label><select id="year" name="year">${options(year,value)}</select></div>
      <div><label for="college">College / university</label><input list="collegeChoices" id="college" name="college" type="text" maxlength="150" required value="${esc(oldCollege)}" placeholder="Choose or type your college"><datalist id="collegeChoices">${collegeList.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist></div>
      <div><label for="department">Department</label><input list="departmentChoices" id="department" name="department" type="text" maxlength="100" required value="${esc(p.department||'')}" placeholder="Choose or type department"><datalist id="departmentChoices">${DEPARTMENTS.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist></div>
      <div><label for="gender">How would you like to identify? (optional)</label><select name="gender" id="gender">${options(['Prefer not to say','Woman','Man','Non-binary','Other'],extra.gender||'Prefer not to say')}</select></div>
      <div><label for="goal">Your current goal (optional)</label><input id="goal" name="goal" maxlength="120" value="${esc(extra.goal||'')}" placeholder="e.g. crack GATE / become a developer"></div>
    </div></div>`;
  }
  function wirePersonal(){
    const degree=document.querySelector('#degree'),year=document.querySelector('#year'),dob=document.querySelector('#dob');
    if(degree&&year){degree.onchange=()=>{const old=year.value;year.innerHTML=options(yearOptions(degree.value),old);};}
    if(dob){dob.onchange=()=>{document.querySelector('#agePreview').textContent='Age: '+ageFromDOB(dob.value);};}
  }
  function selectLevels(skills,ratings){const m=new Map(ratings.map(r=>[r.skill_id,r.level]));return skills.map(s=>`<div class="skill-row"><div><b>${esc(s.name)}</b><p>${esc(s.category)} · Current: ${['New','Basic','Learning','Intermediate','Advanced','Confident'][m.get(s.id)||0]}</p></div><select name="${s.id}" aria-label="${esc(s.name)} level">${['0 · New','1 · Basic','2 · Learning','3 · Intermediate','4 · Advanced','5 · Confident'].map((x,i)=>`<option value="${i}" ${i===(m.get(s.id)||0)?'selected':''}>${x}</option>`).join('')}</select></div>`).join('');}
  const RESOURCES = {
    1:['https://www.learncpp.com/','https://www.learncpp.com/','https://en.cppreference.com/w/cpp'],
    2:['https://www.geeksforgeeks.org/data-structures/','https://visualgo.net/en','https://cp-algorithms.com/'],
    3:['https://www.geeksforgeeks.org/fundamentals-of-algorithms/','https://visualgo.net/en','https://cp-algorithms.com/'],
    4:['https://www.learncpp.com/cpp-tutorial/introduction-to-object-oriented-programming/','https://www.learncpp.com/','https://en.cppreference.com/w/cpp/language/classes'],
    5:['https://sqlbolt.com/','https://sqlbolt.com/','https://www.postgresql.org/docs/current/tutorial.html'],
    6:['https://pages.cs.wisc.edu/~remzi/OSTEP/','https://pages.cs.wisc.edu/~remzi/OSTEP/','https://pages.cs.wisc.edu/~remzi/OSTEP/'],
    7:['https://www.cloudflare.com/learning/network-layer/what-is-a-computer-network/','https://www.cloudflare.com/learning/','https://www.rfc-editor.org/'],
    8:['https://docs.python.org/3/tutorial/','https://docs.python.org/3/tutorial/','https://docs.python.org/3/library/'],
    9:['https://www.khanacademy.org/math/linear-algebra','https://www.khanacademy.org/math/linear-algebra','https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/'],
    10:['https://www.khanacademy.org/math/statistics-probability','https://www.khanacademy.org/math/statistics-probability','https://seeing-theory.brown.edu/'],
    11:['https://developers.google.com/machine-learning/crash-course','https://scikit-learn.org/stable/tutorial/index.html','https://scikit-learn.org/stable/user_guide.html'],
    12:['https://www.tensorflow.org/tutorials','https://pytorch.org/tutorials/','https://pytorch.org/tutorials/'],
    13:['https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html','https://pandas.pydata.org/docs/user_guide/index.html','https://pandas.pydata.org/docs/'],
    14:['https://git-scm.com/book/en/v2','https://skills.github.com/','https://git-scm.com/docs'],
    15:['https://www.geeksforgeeks.org/logic-building-for-beginners/','https://visualgo.net/en','https://cp-algorithms.com/']
  };
  function resourceLevel(level){return level<=1?0:level<=3?1:2;}
  const levelText=['Getting started','Build confidence','Go deeper'];
  const resourceDescription=['Start with definitions, examples and step-by-step exercises.','Use guided examples and practise the ideas you know.','Study advanced applications and test yourself with harder problems.'];
  function resourceCards(skills,ratings){
    const m=new Map(ratings.map(r=>[r.skill_id,r.level]));
    return skills.map(s=>{const level=m.get(s.id)||0,idx=resourceLevel(level);return `<article class="card resource-card"><div class="topline"><h3>${esc(s.name)}</h3><span class="pill">Level ${level}/5</span></div><p class="muted">${levelText[idx]} · ${resourceDescription[idx]}</p><div class="resource-steps"><span class="badge">${idx===0?'Foundation':idx===1?'Guided practice':'Advanced learning'}</span><span class="badge">Free resource</span></div><a target="_blank" rel="noopener noreferrer" href="${RESOURCES[s.id]?.[idx]||'https://www.khanacademy.org/'}">Open matching resource ↗</a></article>`;}).join('');
  }
  function easyChart(history){
    const map=new Map(history.map(h=>[h.date,Number(h.count)||0]));
    const rows=[];for(let i=6;i>=0;i--){const d=new Date(Date.now()-i*86400000),key=d.toISOString().slice(0,10);rows.push({label:d.toLocaleDateString('en-IN',{month:'short',day:'numeric'}),val:map.get(key)||0});}
    const max=Math.max(1,...rows.map(x=>x.val));
    return `<div class="activity-chart" role="img" aria-label="Learning checks completed on each of the last seven calendar days">${rows.map(r=>`<div class="activity-line"><span>${esc(r.label)}</span><div class="activity-track"><div class="activity-fill" style="width:${r.val/max*100}%"></div></div><b>${r.val}</b></div>`).join('')}</div><p class="help">Each bar is one day. The number on the right is how many learning checks you completed that day; 0 means no new checks recorded.</p>`;
  }
  const p=(id,topic,difficulty,title,statement,answer,hint,explain)=>({id,topic,difficulty,title,statement,answer:String(answer),hint,explain});
  const PRACTICE=[
    p('a1','Arrays','Easy','Add the numbers','Find the sum of [3, 6, 2, 9].',20,'Add each element once.','3 + 6 + 2 + 9 = 20.'),
    p('a2','Arrays','Easy','Largest item','What is the maximum of [8, 2, 7, 2, 5]?',8,'Scan while keeping the largest value.','8 is larger than every other entry.'),
    p('a3','Arrays','Medium','Index detective','In [4, 1, 7, 3, 9], give the zero-based index of 7.',2,'Indexing starts from zero.','4 is index 0, 1 index 1, 7 index 2.'),
    p('a4','Arrays','Medium','Increasing streak','What is the length of the longest strictly increasing contiguous subarray of [2, 1, 3, 4]?',3,'Look at 1, 3, 4.','The segment [1,3,4] has length 3.'),
    p('a5','Arrays','Hard','Maximum subarray','Find the maximum contiguous subarray sum of [3, -2, 5, -1, 4].',9,'Try tracking the best sum ending at each element.','The entire array sums to 9, which is the maximum.'),
    p('s1','Searching','Easy','Find the index','Find the zero-based index of 9 in [1, 4, 7, 9, 12].',3,'Begin counting at index 0.','9 occurs at index 3.'),
    p('s2','Searching','Easy','Middle element','Binary search for 7 in [1,3,5,7,9,11,13]: how many comparisons?',1,'What is the middle element?','The middle is 7, so one comparison.'),
    p('s3','Searching','Medium','First occurrence','Find the first zero-based index of 2 in [1,2,2,2,5,8].',1,'Scan from left or use lower bound.','The first 2 occurs at index 1.'),
    p('s4','Searching','Medium','Lower bound','What is the lower-bound index of 10 in [2,5,8,11,17]?',3,'Find the first item at least 10.','11 occurs at index 3.'),
    p('s5','Searching','Hard','Rotated array','Find the zero-based index of 4 in [9,12,15,2,4,6].',4,'Locate the rotation before searching.','4 is at index 4.'),
    p('t1','Stacks','Easy','Stack top','Push 2, push 5, pop once. What is the top?',2,'The last pushed item is removed first.','5 is popped, leaving 2.'),
    p('t2','Stacks','Easy','Balanced brackets','Is the expression ()[]{} balanced? Answer YES or NO.','YES','Every opening bracket needs the right closing one.','All three pairs are balanced.'),
    p('t3','Stacks','Medium','Track the stack','Push 4, push 7, push 2, pop, push 9, pop. What is the top?',7,'Trace last-in, first-out.','After popping 2 and 9, top is 7.'),
    p('t4','Stacks','Medium','Next greater','In [4,2,6,3], what is the next greater element to the right of 4?',6,'Scan right until a larger number appears.','The first larger value to the right of 4 is 6.'),
    p('t5','Stacks','Hard','Postfix expression','Evaluate postfix: 5 1 2 + 4 * + 3 -',14,'Apply the most recent two numbers to each operator.','1+2=3; 3*4=12; 5+12-3=14.'),
    p('g1','Graphs','Easy','Count neighbors','Edges are A-B, A-C and A-D. What is degree(A)?',3,'Count edges touching A.','A has three incident edges.'),
    p('g2','Graphs','Easy','Connected traversal','In a chain A-B-C-D, how many vertices does BFS from A visit?',4,'The chain is fully connected.','BFS visits all four vertices.'),
    p('g3','Graphs','Medium','BFS order','From A with edges A-B, A-C, B-D, C-E (alphabetical neighbors), write BFS order without spaces.','ABCDE','A then its immediate neighbors, then theirs.','Order: A, B, C, D, E.'),
    p('g4','Graphs','Medium','Shortest path','Undirected edges: A-B=4, A-C=2, C-B=1, B-D=5, C-D=8. Find distance A→D.',8,'A-C-B-D is worth testing.','2+1+5=8.'),
    p('g5','Graphs','Hard','Paths in a DAG','Directed edges A→B, A→C, B→D, C→D, B→E, E→D. How many paths A→D?',3,'Count both ways through B and the way through C.','A-B-D, A-B-E-D, A-C-D: three paths.')
  ];
  function seedDate(day){const n=Math.floor(Date.parse(day+'T00:00:00Z')/86400000);return ((n%6)+6)%6+1;}
  function dailyQuestions(day=TODAY()){
    const x=seedDate(day),q=(id,topic,diff,title,statement,answer,hint,explain)=>p('d'+id,topic,diff,title,statement,answer,hint,explain);
    return [
      q(1,'Arrays','Easy','Daily sum',`Find the sum of [${x}, ${2*x}, 3].`,3*x+3,'Add every value.',`${x}+${2*x}+3=${3*x+3}.`),
      q(2,'Arrays','Easy','Find the largest',`Find the maximum of [${x+3}, ${2*x+1}, ${x+9}].`,x+9,'Compare all entries.',`${x+9} is the largest.`),
      q(3,'Arrays','Medium','Count evens',`How many even values are in [${x}, ${x+1}, ${x+2}, ${x+3}]?`,2,'Four consecutive integers contain two even values.','Exactly two are even.'),
      q(4,'Arrays','Medium','Product of array',`Find the product of [${x}, 2, ${x+1}].`,2*x*(x+1),'Multiply all three values.',`${x} × 2 × ${x+1} = ${2*x*(x+1)}.`),
      q(5,'Arrays','Hard','Best stock profit',`One buy then one later sell: maximum profit from [${x+7}, ${x+2}, ${x+9}, ${x+6}]?`,7,'Buy at the lowest earlier price.',`Buy at ${x+2}, sell at ${x+9}: profit 7.`),
      q(6,'Searching','Easy','Find sorted index',`Index of ${x+4} in [${x},${x+2},${x+4},${x+6}] (zero-based)?`,2,'Count from zero.','Third item = index 2.'),
      q(7,'Searching','Easy','Binary search steps',`In seven sorted values from ${x} to ${x+6}, searching the middle value ${x+3} takes how many comparisons?`,1,'Look at the midpoint first.','The target is the midpoint, so 1 comparison.'),
      q(8,'Searching','Medium','First greater or equal',`Lower-bound index of ${x+5} in [${x},${x+3},${x+6},${x+9}]?`,2,'Find the first value ≥ target.','At index 2 is '+(x+6)+'.'),
      q(9,'Searching','Medium','First duplicate',`First zero-based index of ${x} in [${x-1}, ${x}, ${x}, ${x+2}]?`,1,'Read from left to right.','The first match is index 1.'),
      q(10,'Searching','Hard','Rotation pivot',`At what zero-based index is the minimum of [${x+4},${x+7},${x+9},${x},${x+2}]?`,3,'Look for the smallest number after rotation.','The minimum is at index 3.'),
      q(11,'Stacks','Easy','Pop the top',`Push ${x}, push ${x+2}, then pop. What is on top?`,x,'Last in, first out.','The top is '+x+'.'),
      q(12,'Stacks','Easy','Bracket check','Is the string (()()) balanced? Answer YES or NO.','YES','Every opening bracket has a matching close.','The string is balanced.'),
      q(13,'Stacks','Medium','Stack simulation',`Push ${x}, push ${x+1}, push ${x+2}, pop. What is now on top?`,x+1,'Remove the most recent item.',`Top is ${x+1}.`),
      q(14,'Stacks','Medium','Postfix arithmetic',`Evaluate postfix: ${x} 2 + 3 *`,3*(x+2),'Perform + before *.','(' + x + ' + 2) × 3 = ' + 3*(x+2) + '.'),
      q(15,'Stacks','Hard','Next greater element',`In [${x},${x+3},${x+1},${x+5}], find next greater value to the right of ${x+1}.`,x+5,'Find its first larger neighbor on the right.',`The answer is ${x+5}.`),
      q(16,'Graphs','Easy','Star graph','A connects to B, C, D and E. What is degree(A)?',4,'Count connected edges.','Four edges touch A.'),
      q(17,'Graphs','Easy','Two-edge path',`A-B has weight ${x} and B-C weight 2. Find path cost A→B→C.`,x+2,'Sum the edge weights.',`${x} + 2 = ${x+2}.`),
      q(18,'Graphs','Medium','Daily BFS','Undirected edges A-C, A-B, B-D, C-E. Starting A, alphabetical neighbors: BFS order without spaces?','ABCDE','Use a queue and mark visited.','A, B, C, D, E.'),
      q(19,'Graphs','Medium','Weighted shortest path',`Edges A-B=${x+2}, A-C=2, C-B=1, B-D=2, C-D=10. Find shortest A→D.`,5,'Try A-C-B-D.','2 + 1 + 2 = 5.'),
      q(20,'Graphs','Hard','Topological orders','In DAG A→C, B→C, C→D, how many valid topological orders?',2,'A and B may swap; C must follow both.','ABCD and BACD.')
    ];
  }
  const storageKey=(userId,daily=false)=>`cp-challenges-v2-${userId}-${daily?'daily-'+TODAY():'practice'}`;
  const solvedFor=(userId,daily=false)=>load(storageKey(userId,daily));
  const answerCorrect=(given,expected)=>String(given??'').trim().replace(/\s+/g,'').toUpperCase()===String(expected).trim().replace(/\s+/g,'').toUpperCase();
  const challengeState={topic:'All topics',difficulty:'All levels',daily:false};
  function challengePage(daily=false){
    if(challengeState.daily!==daily){challengeState.topic='All topics';challengeState.difficulty='All levels';}
    challengeState.daily=daily;
    const data=daily?dailyQuestions():PRACTICE;
    const progress=solvedFor(me.id,daily);
    const solved=data.filter(p=>progress[p.id]).length;
    const ratingInfo=dashboard?.ratings||[];
    const dsa=Math.max(0,...ratingInfo.filter(r=>[2,3,15].includes(r.skill_id)).map(r=>r.level));
    const recommended=dsa<=1?'Easy':dsa<=3?'Medium':'Hard';
    const pageTitle=daily?'Your daily 20':'Explore 20 DSA problems';
    shell(daily?'daily':'practice',pageTitle,daily?'Four topics · five questions each · a fresh set each UTC day.':'Four topics · five questions each · learn at your own pace.',
      `<section class="card challenge-intro"><div><p class="eyebrow">PERSONALIZED PRACTICE</p><h2>${solved} / 20 solved</h2><p class="muted">Based on your DSA self-rating, start with <b>${recommended}</b> questions. All three difficulties remain available.</p></div><a href="#/ranked"><button class="secondary">Open the 6 ranked daily problems →</button></a></section>
       <div class="challenge-controls card"><div><label for="topicFilter">Topic</label><select id="topicFilter">${options(['All topics',...TOPICS],challengeState.topic)}</select></div><div><label for="difficultyFilter">Difficulty</label><select id="difficultyFilter">${options(['All levels','Easy','Medium','Hard'],challengeState.difficulty)}</select></div><button id="recommendFilter" class="secondary" type="button">Show ${recommended}</button></div>
       <p class="notice">These 20 guided questions save progress in this browser. The original six challenges are the ones counted in your college leaderboard.</p>
       <div id="challengeGrid" class="problem-grid"></div>`);
    const paint=()=>{const list=data.filter(p=>(challengeState.topic==='All topics'||p.topic===challengeState.topic)&&(challengeState.difficulty==='All levels'||p.difficulty===challengeState.difficulty));
      document.querySelector('#challengeGrid').innerHTML=list.map(q=>`<article class="card problem-card guided-card"><div class="topline"><span class="pill difficulty-${q.difficulty.toLowerCase()}">${q.difficulty}</span><span class="badge">${q.topic}</span></div><h3>${esc(q.title)}</h3><p class="muted">${progress[q.id]?'✓ Completed':'Try the challenge, with a hint when you need it.'}</p><button data-cpx-problem="${q.id}" class="${progress[q.id]?'secondary':''}">${progress[q.id]?'Review answer':'Solve question →'}</button></article>`).join('');
      document.querySelectorAll('[data-cpx-problem]').forEach(b=>b.onclick=()=>openQuestion(data.find(q=>q.id===b.dataset.cpxProblem),daily));};
    document.querySelector('#topicFilter').onchange=e=>{challengeState.topic=e.target.value;paint();};
    document.querySelector('#difficultyFilter').onchange=e=>{challengeState.difficulty=e.target.value;paint();};
    document.querySelector('#recommendFilter').onclick=()=>{challengeState.difficulty=recommended;document.querySelector('#difficultyFilter').value=recommended;paint();};
    paint();
  }
  function openQuestion(q,daily=false){const existing=solvedFor(me.id,daily)[q.id];
    modal(`<div class="topline"><span class="pill">${q.topic} · ${q.difficulty}</span><span class="muted">${existing?'Solved':'Practice question'}</span></div><h2>${esc(q.title)}</h2><p>${esc(q.statement)}</p><button type="button" class="secondary" id="hintQuestion">Show hint</button><p id="hintText" class="help" hidden>${esc(q.hint)}</p>
      ${existing?`<p class="check">✓ Completed</p><p><b>Answer:</b> ${esc(q.answer)}</p><p>${esc(q.explain)}</p><button type="button" id="cancelDialog">Done</button>`:`<form id="guidedAnswer"><label for="guidedValue">Your answer</label><input id="guidedValue" name="answer" placeholder="Type a number or short answer" required autocomplete="off"><p class="error" role="alert"></p><div class="row"><button type="button" id="cancelDialog" class="secondary">Back</button><button type="submit">Check answer →</button></div></form>`}`);
    document.querySelector('#hintQuestion').onclick=()=>{document.querySelector('#hintText').hidden=false;};
    if(!existing)form('#guidedAnswer',async({answer})=>{if(!answerCorrect(answer,q.answer))throw new Error('Not quite. Check the hint and try again.');const state=solvedFor(me.id,daily);state[q.id]=true;save(storageKey(me.id,daily),state);document.querySelector('#dialog').close();toast('Correct! '+q.explain);challengePage(daily);});
  }
  return {TOPICS,DEGREES,COLLEGES,DEPARTMENTS,profile,saveProfile,ageFromDOB,yearOptions,options,personalFields,wirePersonal,selectLevels,resourceCards,easyChart,challengePage,PRACTICE,dailyQuestions,solvedFor};
})();
