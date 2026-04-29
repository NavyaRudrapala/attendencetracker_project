import React, { useState } from 'react';
import { authAPI } from './utils/api';
import './App.css';

const STUDENTS = [
  { id:1, name:'Arjun Patel',  roll:'CS101', cls:'10-A', initials:'AP' },
  { id:2, name:'Sneha Reddy',  roll:'CS102', cls:'10-A', initials:'SR' },
  { id:3, name:'Rohan Mehta',  roll:'CS103', cls:'10-A', initials:'RM' },
  { id:4, name:'Priya Singh',  roll:'CS104', cls:'10-B', initials:'PS' },
  { id:5, name:'Karthik Nair', roll:'CS105', cls:'10-B', initials:'KN' },
  { id:6, name:'Divya Rao',    roll:'CS106', cls:'10-B', initials:'DR' },
];

export default function App() {
  const [user, setUser]       = useState(null);
  const [page, setPage]       = useState('dashboard');
  const [role, setRole]       = useState('admin');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !pass) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.login({ email, password: pass });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setPage('dashboard');
    } catch {
      setError('Invalid credentials. Check email/password and selected role.');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null); setEmail(''); setPass('');
  };

  if (!user) return (
    <Login role={role} setRole={setRole} email={email} setEmail={setEmail}
      pass={pass} setPass={setPass} error={error} login={login} loading={loading} />
  );

  return (
    <div style={S.app}>
      <Sidebar user={user} page={page} setPage={setPage} logout={logout} />
      <div style={S.main}>
        <Topbar page={page} />
        <div style={S.content}>
          {page==='dashboard'   && <Dashboard />}
          {page==='students'    && <Students />}
          {page==='attendance'  && <Attendance />}
          {page==='marks'       && <Marks />}
          {page==='performance' && <Performance />}
          {page==='reports'     && <Reports />}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────
function Login({role,setRole,email,setEmail,pass,setPass,error,login,loading}) {
  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <h2 style={{marginBottom:4}}>EduTrack</h2>
        <p style={{color:'#888',fontSize:13,marginBottom:24}}>Attendance & Performance System</p>

        <div style={S.roleTabs}>
          {['admin','teacher','student'].map(r=>(
            <div key={r} onClick={()=>setRole(r)}
              style={{...S.roleTab,...(role===r?S.roleTabActive:{})}}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </div>
          ))}
        </div>

        <label style={S.label}>Email Address</label>
        <input style={S.input} type="email" placeholder="Enter your email"
          value={email} onChange={e=>setEmail(e.target.value)}/>

        <label style={S.label}>Password</label>
        <input style={S.input} type="password" placeholder="Enter your password"
          value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()}/>

        {error && <div style={S.errorBox}>{error}</div>}

        <button style={S.btnPrimary} onClick={login} disabled={loading}>
          {loading?'Signing in...':'Sign In'}
        </button>

        <div style={S.demoBox}>
          <strong>Demo Credentials:</strong><br/>
          admin@school.com / admin123<br/>
          teacher@school.com / teacher123<br/>
          student@school.com / student123
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────
function Sidebar({user,page,setPage,logout}) {
  const links = {
    admin:   [{id:'dashboard',label:'Dashboard'},{id:'students',label:'Students'},
              {id:'attendance',label:'Attendance'},{id:'marks',label:'Marks'},
              {id:'performance',label:'Performance'},{id:'reports',label:'Reports'}],
    teacher: [{id:'dashboard',label:'Dashboard'},{id:'attendance',label:'Mark Attendance'},
              {id:'marks',label:'Add Marks'},{id:'performance',label:'Performance'}],
    student: [{id:'dashboard',label:'Dashboard'},{id:'performance',label:'My Marks'},
              {id:'reports',label:'My Report'}],
  };
  return (
    <div style={S.sidebar}>
      <div style={S.brand}>
        <div style={{fontSize:18,fontWeight:700,color:'#fff'}}>EduTrack</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>School Management</div>
      </div>
      <div style={S.sideUser}>
        <div style={S.avatar}>{user.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
        <div>
          <div style={{color:'#fff',fontSize:13,fontWeight:500}}>{user.name}</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>{user.role}</div>
        </div>
      </div>
      <nav style={{flex:1,paddingTop:8}}>
        {(links[user.role]||[]).map(l=>(
          <div key={l.id} onClick={()=>setPage(l.id)}
            style={{...S.navItem,...(page===l.id?S.navActive:{})}}>
            {l.label}
          </div>
        ))}
      </nav>
      <div style={{padding:'12px 20px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={logout} style={S.logoutBtn}>← Logout</button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────
function Topbar({page}) {
  const titles={dashboard:'Dashboard',students:'Students',attendance:'Attendance',
    marks:'Marks',performance:'Performance',reports:'Reports'};
  return (
    <div style={S.topbar}>
      <div style={{fontWeight:600,fontSize:15}}>{titles[page]||'Page'}</div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:12,color:'#888'}}>{new Date().toDateString()}</span>
        <span style={{...S.badge,...S.badgeGreen}}>● Online</span>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────
function StatCard({label,value,sub,color}) {
  return (
    <div style={S.statCard}>
      <div style={{fontSize:11,color:'#999',textTransform:'uppercase',
        letterSpacing:0.5,marginBottom:6}}>{label}</div>
      <div style={{fontSize:26,fontWeight:700,color:color||'#1a1a1a'}}>{value}</div>
      {sub && <div style={{fontSize:11,color:'#bbb',marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────
function Dashboard() {
  return (
    <div>
      <div style={S.statGrid}>
        <StatCard label="Total Students" value="6"   sub="Across 2 classes"/>
        <StatCard label="Today Attendance" value="83%" sub="5 of 6 present" color="#2d6a4f"/>
        <StatCard label="Avg Performance"  value="76%" sub="Midterm average"/>
        <StatCard label="Low Attendance"   value="1"  sub="Below 75%" color="#c0392b"/>
      </div>
      <div style={S.alertBox}>⚠ 1 student has attendance below 75%. Review needed.</div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Student Overview</div>
        <table style={S.table}>
          <thead>
            <tr style={{background:'#fafafa'}}>
              <th style={S.th}>Student</th><th style={S.th}>Roll</th>
              <th style={S.th}>Class</th><th style={S.th}>Attendance</th><th style={S.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map(s=>(
              <tr key={s.id}>
                <td style={S.td}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={S.avSm}>{s.initials}</div>{s.name}
                  </div>
                </td>
                <td style={{...S.td,color:'#999'}}>{s.roll}</td>
                <td style={S.td}>{s.cls}</td>
                <td style={S.td}><strong style={{color:'#2d6a4f'}}>85%</strong></td>
                <td style={S.td}><span style={{...S.badge,...S.badgeGreen}}>Good</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── STUDENTS ─────────────────────────────────────────────
function Students() {
  const [list,setList] = useState(STUDENTS);
  const [form,setForm] = useState({name:'',roll:'',cls:'10-A',email:''});
  const [saved,setSaved] = useState(false);

  const add = () => {
    if(!form.name||!form.roll){alert('Name and Roll Number are required');return;}
    const initials=form.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    setList([...list,{id:list.length+1,...form,initials}]);
    setForm({name:'',roll:'',cls:'10-A',email:''});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.sectionTitle}>All Students ({list.length})</div>
        {list.map(s=>(
          <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,
            padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
            <div style={S.avSm}>{s.initials}</div>
            <div>
              <div style={{fontWeight:500,fontSize:13}}>{s.name}</div>
              <div style={{fontSize:11,color:'#999'}}>{s.roll} · {s.cls}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Add New Student</div>
        {saved && <div style={S.successBox}>✓ Student added successfully!</div>}
        <label style={S.label}>Full Name *</label>
        <input style={S.input} value={form.name}
          onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Rahul Kumar"/>
        <label style={S.label}>Roll Number *</label>
        <input style={S.input} value={form.roll}
          onChange={e=>setForm({...form,roll:e.target.value})} placeholder="CS107"/>
        <label style={S.label}>Class</label>
        <select style={S.input} value={form.cls}
          onChange={e=>setForm({...form,cls:e.target.value})}>
          <option>10-A</option><option>10-B</option>
        </select>
        <label style={S.label}>Email</label>
        <input style={S.input} value={form.email}
          onChange={e=>setForm({...form,email:e.target.value})} placeholder="student@school.com"/>
        <button style={{...S.btnAccent,marginTop:16}} onClick={add}>+ Add Student</button>
      </div>
    </div>
  );
}

// ─── ATTENDANCE ───────────────────────────────────────────
function Attendance() {
  const [date,setDate]       = useState(new Date().toISOString().slice(0,10));
  const [subject,setSubject] = useState('Mathematics');
  const [status,setStatus]   = useState({});
  const [saved,setSaved]     = useState(false);

  const toggle = (id,st) => setStatus({...status,[id]:st});
  const markAll = () => { const s={}; STUDENTS.forEach(st=>s[st.id]='present'); setStatus(s); };
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };

  const btnColor = (sid,st) => {
    if(status[sid]!==st) return {background:'#fff',color:'#666',border:'1px solid #ddd'};
    if(st==='present') return {background:'#e8f5ee',color:'#2d6a4f',border:'none'};
    if(st==='absent')  return {background:'#fdecea',color:'#c0392b',border:'none'};
    return {background:'#fef9e7',color:'#d68910',border:'none'};
  };

  return (
    <div>
      {saved && <div style={S.successBox}>✓ Attendance saved successfully!</div>}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.sectionTitle}>Mark Attendance</div>
          <div style={{display:'flex',gap:12,marginBottom:16}}>
            <div style={{flex:1}}>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div style={{flex:1}}>
              <label style={S.label}>Subject</label>
              <select style={S.input} value={subject} onChange={e=>setSubject(e.target.value)}>
                {['Mathematics','Science','English','History','Computer Science']
                  .map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {STUDENTS.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',
              justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={S.avSm}>{s.initials}</div>
                <div style={{fontSize:13,fontWeight:500}}>{s.name}</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                {['present','absent','late'].map(st=>(
                  <button key={st} onClick={()=>toggle(s.id,st)}
                    style={{padding:'5px 12px',borderRadius:20,cursor:'pointer',
                      fontSize:11,fontWeight:500,...btnColor(s.id,st)}}>
                    {st.charAt(0).toUpperCase()+st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{display:'flex',gap:10,marginTop:16}}>
            <button style={S.btnAccent} onClick={save}>Save Attendance</button>
            <button style={S.btnSecondary} onClick={markAll}>Mark All Present</button>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Attendance % Summary</div>
          {STUDENTS.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <div style={S.avSm}>{s.initials}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{s.name}</div>
                <div style={{height:6,background:'#f0f0f0',borderRadius:3}}>
                  <div style={{height:'100%',width:'85%',background:'#2d6a4f',borderRadius:3}}/>
                </div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:'#2d6a4f'}}>85%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MARKS ────────────────────────────────────────────────
function Marks() {
  const gradeOf=(m,mx)=>{const p=(m/mx)*100;return p>=90?'A+':p>=80?'A':p>=70?'B':p>=60?'C':p>=50?'D':'F';};
  const [form,setForm] = useState({studentId:'',subject:'',exam:'Midterm',marks:'',maxMarks:'100'});
  const [saved,setSaved] = useState(false);
  const [list,setList] = useState([
    {id:1,name:'Arjun Patel', subject:'Mathematics',exam:'Midterm',marks:88,max:100,grade:'A'},
    {id:2,name:'Sneha Reddy', subject:'Mathematics',exam:'Midterm',marks:76,max:100,grade:'B'},
    {id:3,name:'Rohan Mehta', subject:'Science',    exam:'Midterm',marks:92,max:100,grade:'A+'},
    {id:4,name:'Priya Singh', subject:'English',    exam:'Midterm',marks:65,max:100,grade:'C'},
  ]);

  const save = () => {
    if(!form.studentId||!form.subject||!form.marks){alert('Fill all required fields');return;}
    const s = STUDENTS.find(st=>st.id===parseInt(form.studentId));
    const g = gradeOf(+form.marks,+form.maxMarks);
    setList([...list,{id:list.length+1,name:s.name,subject:form.subject,
      exam:form.exam,marks:+form.marks,max:+form.maxMarks,grade:g}]);
    setForm({studentId:'',subject:'',exam:'Midterm',marks:'',maxMarks:'100'});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div style={S.grid2}>
      <div style={S.card}>
        <div style={S.sectionTitle}>Add Marks</div>
        {saved && <div style={S.successBox}>✓ Marks saved successfully!</div>}
        <label style={S.label}>Student *</label>
        <select style={S.input} value={form.studentId}
          onChange={e=>setForm({...form,studentId:e.target.value})}>
          <option value="">Select student...</option>
          {STUDENTS.map(s=><option key={s.id} value={s.id}>{s.name} ({s.roll})</option>)}
        </select>
        <label style={S.label}>Subject *</label>
        <select style={S.input} value={form.subject}
          onChange={e=>setForm({...form,subject:e.target.value})}>
          <option value="">Select subject...</option>
          {['Mathematics','Science','English','History','Computer Science']
            .map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={S.label}>Exam Type</label>
        <select style={S.input} value={form.exam}
          onChange={e=>setForm({...form,exam:e.target.value})}>
          {['Midterm','Final','Unit Test 1','Unit Test 2'].map(x=><option key={x}>{x}</option>)}
        </select>
        <div style={{display:'flex',gap:12}}>
          <div style={{flex:1}}>
            <label style={S.label}>Marks Obtained *</label>
            <input style={S.input} type="number" min="0" placeholder="e.g. 85"
              value={form.marks} onChange={e=>setForm({...form,marks:e.target.value})}/>
          </div>
          <div style={{flex:1}}>
            <label style={S.label}>Max Marks</label>
            <input style={S.input} type="number" value={form.maxMarks}
              onChange={e=>setForm({...form,maxMarks:e.target.value})}/>
          </div>
        </div>
        <button style={{...S.btnAccent,marginTop:16}} onClick={save}>Save Marks</button>
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Marks Ledger</div>
        <table style={S.table}>
          <thead>
            <tr style={{background:'#fafafa'}}>
              <th style={S.th}>Student</th><th style={S.th}>Subject</th>
              <th style={S.th}>Exam</th><th style={S.th}>Marks</th><th style={S.th}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r=>{
              const pct=r.marks/r.max;
              return (
                <tr key={r.id}>
                  <td style={S.td}>{r.name}</td>
                  <td style={{...S.td,color:'#999',fontSize:12}}>{r.subject}</td>
                  <td style={{...S.td,color:'#999',fontSize:12}}>{r.exam}</td>
                  <td style={S.td}><strong>{r.marks}</strong>/{r.max}</td>
                  <td style={S.td}>
                    <span style={{...S.badge,...(pct>=0.8?S.badgeGreen:pct>=0.6?S.badgeYellow:S.badgeRed)}}>
                      {r.grade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PERFORMANCE ──────────────────────────────────────────
function Performance() {
  const subjects = ['Math:88','Science:79','English:91'];
  return (
    <div>
      <div style={S.card}>
        <div style={S.sectionTitle}>Student Performance Report Cards</div>
        <div style={S.grid2}>
          {STUDENTS.map(s=>(
            <div key={s.id} style={{padding:16,border:'1px solid #f0f0f0',borderRadius:8}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={S.avSm}>{s.initials}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{s.name}</div>
                  <div style={{fontSize:11,color:'#999'}}>{s.roll} · {s.cls}</div>
                </div>
                <span style={{...S.badge,...S.badgeGreen,marginLeft:'auto'}}>A</span>
              </div>
              <div style={{display:'flex',gap:16,marginBottom:10}}>
                <div style={{fontSize:12}}>
                  <span style={{color:'#999'}}>Attendance: </span>
                  <strong style={{color:'#2d6a4f'}}>85%</strong>
                </div>
                <div style={{fontSize:12}}>
                  <span style={{color:'#999'}}>Avg Score: </span>
                  <strong style={{color:'#1a5276'}}>80%</strong>
                </div>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {subjects.map(t=>(
                  <span key={t} style={{fontSize:11,background:'#f5f5f5',
                    padding:'2px 8px',borderRadius:20,color:'#666'}}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────
function Reports() {
  const exportCSV = () => {
    const rows = [['Student','Roll','Class','Present','Absent','Att%','Status']];
    STUDENTS.forEach(s=>rows.push([s.name,s.roll,s.cls,'8','1','85%','Regular']));
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,'+encodeURIComponent(csv);
    a.download = 'attendance_report.csv';
    a.click();
  };

  return (
    <div>
      <div style={S.statGrid}>
        <StatCard label="Total Records" value="12"/>
        <StatCard label="Total Present" value="9"  color="#2d6a4f"/>
        <StatCard label="Total Absent"  value="2"  color="#c0392b"/>
        <StatCard label="Total Late"    value="1"  color="#d68910"/>
      </div>
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={S.sectionTitle}>Full Attendance Report</div>
          <button style={S.btnSecondary} onClick={exportCSV}>⬇ Export CSV</button>
        </div>
        <table style={S.table}>
          <thead>
            <tr style={{background:'#fafafa'}}>
              <th style={S.th}>Student</th><th style={S.th}>Roll</th><th style={S.th}>Class</th>
              <th style={S.th}>Present</th><th style={S.th}>Absent</th>
              <th style={S.th}>Att%</th><th style={S.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map(s=>(
              <tr key={s.id}>
                <td style={S.td}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={S.avSm}>{s.initials}</div>{s.name}
                  </div>
                </td>
                <td style={{...S.td,color:'#999'}}>{s.roll}</td>
                <td style={S.td}>{s.cls}</td>
                <td style={{...S.td,fontWeight:600,color:'#2d6a4f'}}>8</td>
                <td style={{...S.td,fontWeight:600,color:'#c0392b'}}>1</td>
                <td style={{...S.td,fontWeight:700,color:'#2d6a4f'}}>85%</td>
                <td style={S.td}><span style={{...S.badge,...S.badgeGreen}}>Regular</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const S = {
  app:         {display:'flex',minHeight:'100vh',fontFamily:"'Segoe UI',sans-serif",background:'#f7f6f2'},
  sidebar:     {width:220,background:'#1a1814',display:'flex',flexDirection:'column',minHeight:'100vh',position:'fixed',left:0,top:0,bottom:0},
  brand:       {padding:'20px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)'},
  sideUser:    {padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:10},
  avatar:      {width:32,height:32,borderRadius:'50%',background:'#2d6a4f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0},
  navItem:     {padding:'10px 20px',color:'rgba(255,255,255,0.55)',cursor:'pointer',fontSize:13,transition:'all 0.15s'},
  navActive:   {background:'rgba(255,255,255,0.1)',color:'#fff',fontWeight:500},
  logoutBtn:   {width:'100%',padding:'8px 12px',background:'rgba(255,255,255,0.06)',border:'none',borderRadius:6,color:'rgba(255,255,255,0.5)',fontSize:12,cursor:'pointer',textAlign:'left'},
  main:        {marginLeft:220,flex:1},
  topbar:      {background:'#fff',borderBottom:'1px solid #eee',padding:'0 28px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50},
  content:     {padding:'24px 28px'},
  statGrid:    {display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24},
  statCard:    {background:'#fff',borderRadius:10,border:'1px solid #eee',padding:'18px 20px'},
  grid2:       {display:'grid',gridTemplateColumns:'1fr 1fr',gap:20},
  card:        {background:'#fff',borderRadius:10,border:'1px solid #eee',padding:20,marginBottom:20},
  sectionTitle:{fontSize:13,fontWeight:600,marginBottom:14,margin:0},
  table:       {width:'100%',borderCollapse:'collapse',fontSize:13},
  th:          {textAlign:'left',padding:'10px 12px',fontSize:11,fontWeight:600,color:'#999',textTransform:'uppercase',borderBottom:'1px solid #eee'},
  td:          {padding:'11px 12px',borderBottom:'1px solid #f5f5f5'},
  avSm:        {width:28,height:28,borderRadius:'50%',background:'#e8f5ee',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#2d6a4f',flexShrink:0},
  badge:       {display:'inline-flex',alignItems:'center',padding:'3px 8px',borderRadius:20,fontSize:11,fontWeight:500},
  badgeGreen:  {background:'#e8f5ee',color:'#1b4332'},
  badgeRed:    {background:'#fdecea',color:'#c0392b'},
  badgeYellow: {background:'#fef9e7',color:'#d68910'},
  label:       {fontSize:12,fontWeight:500,color:'#666',display:'block',marginBottom:6,marginTop:12},
  input:       {width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:6,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
  btnPrimary:  {width:'100%',padding:11,background:'#1a1814',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer',marginTop:8},
  btnAccent:   {padding:'9px 18px',background:'#2d6a4f',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer'},
  btnSecondary:{padding:'8px 14px',background:'#f5f5f5',color:'#333',border:'1px solid #ddd',borderRadius:6,fontSize:13,cursor:'pointer'},
  loginWrap:   {minHeight:'100vh',background:'#f7f6f2',display:'flex',alignItems:'center',justifyContent:'center'},
  loginCard:   {background:'#fff',borderRadius:14,border:'1px solid #eee',padding:'36px 32px',width:'100%',maxWidth:380},
  roleTabs:    {display:'flex',gap:6,marginBottom:20,background:'#f5f5f5',borderRadius:8,padding:4},
  roleTab:     {flex:1,textAlign:'center',padding:8,borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',color:'#888'},
  roleTabActive:{background:'#fff',color:'#1a1814',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'},
  errorBox:    {background:'#fdecea',color:'#c0392b',padding:'10px 14px',borderRadius:6,fontSize:12,marginTop:8,marginBottom:4},
  successBox:  {background:'#e8f5ee',color:'#1b4332',padding:'10px 14px',borderRadius:6,fontSize:12,marginBottom:12},
  demoBox:     {marginTop:16,padding:12,background:'#f9f9f9',borderRadius:6,fontSize:11,color:'#888',lineHeight:1.8},
  alertBox:    {background:'#fef9e7',color:'#d68910',padding:'12px 16px',borderRadius:6,fontSize:13,marginBottom:20},
};
