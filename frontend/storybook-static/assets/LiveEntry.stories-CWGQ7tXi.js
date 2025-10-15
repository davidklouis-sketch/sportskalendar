import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as v}from"./iframe-DAjbPkK6.js";import"./preload-helper-PPVm8Dsz.js";const t=v.memo(function({entry:r,sport:g}){const x=d=>{switch(d){case"football":return"⚽";case"nfl":return"🏈";case"f1":return"🏎️";case"nba":return"🏀";case"nhl":return"🏒";case"mlb":return"⚾";case"tennis":return"🎾";default:return"🏆"}},f=d=>{switch(d.toLowerCase()){case"live":case"ongoing":return"text-red-600 dark:text-red-400";case"finished":case"completed":return"text-gray-600 dark:text-gray-400";case"upcoming":case"scheduled":return"text-blue-600 dark:text-blue-400";default:return"text-gray-600 dark:text-gray-400"}};return e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"text-2xl",children:x(g)}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:r.name}),r.teams&&e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:r.teams}),r.circuit&&e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:r.circuit})]})]}),e.jsxs("div",{className:"text-right",children:[r.score&&e.jsx("div",{className:"text-lg font-bold text-gray-900 dark:text-white mb-1",children:r.score}),r.time&&e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-400 mb-1",children:r.time}),e.jsx("div",{className:`text-sm font-medium ${f(r.status)}`,children:r.status})]})]})})});t.__docgenInfo={description:"",methods:[],displayName:"LiveEntry",props:{entry:{required:!0,tsType:{name:"LiveEntry"},description:""},sport:{required:!0,tsType:{name:"string"},description:""}}};const j={title:"Live/LiveEntry",component:t,parameters:{layout:"centered",docs:{description:{component:"Displays a single live event entry with sport icon, team info, score, and status."}}},tags:["autodocs"],argTypes:{entry:{description:"Live event data",control:"object"},sport:{description:"Sport type for icon display",control:"select",options:["football","nfl","f1","nba","nhl","mlb","tennis"]}}},l={id:"1",name:"Bayern Munich vs Borussia Dortmund",status:"Live",score:"2-1",time:"67'",teams:"Bayern Munich vs Borussia Dortmund"},m={id:"2",name:"Monaco Grand Prix",status:"Live",score:"Lap 45/78",time:"1:23:45",circuit:"Circuit de Monaco"},p={id:"3",name:"New England Patriots vs Buffalo Bills",status:"Live",score:"21-14",time:"Q3 8:45",teams:"Patriots vs Bills"},u={id:"4",name:"Lakers vs Warriors",status:"Finished",score:"108-95",time:"Final",teams:"Lakers vs Warriors"},y={id:"5",name:"Tennis Championship",status:"Upcoming",time:"14:30",teams:"Djokovic vs Nadal"},s={args:{entry:l,sport:"football"}},n={args:{entry:m,sport:"f1"}},a={args:{entry:p,sport:"nfl"}},o={args:{entry:u,sport:"nba"}},i={args:{entry:y,sport:"tennis"}},c={render:()=>e.jsxs("div",{className:"space-y-4 w-96",children:[e.jsx(t,{entry:l,sport:"football"}),e.jsx(t,{entry:m,sport:"f1"}),e.jsx(t,{entry:p,sport:"nfl"}),e.jsx(t,{entry:u,sport:"nba"}),e.jsx(t,{entry:y,sport:"tennis"})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    entry: footballEntry,
    sport: 'football'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    entry: f1Entry,
    sport: 'f1'
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    entry: nflEntry,
    sport: 'nfl'
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    entry: finishedEntry,
    sport: 'nba'
  }
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    entry: upcomingEntry,
    sport: 'tennis'
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4 w-96">\r
      <LiveEntry entry={footballEntry} sport="football" />\r
      <LiveEntry entry={f1Entry} sport="f1" />\r
      <LiveEntry entry={nflEntry} sport="nfl" />\r
      <LiveEntry entry={finishedEntry} sport="nba" />\r
      <LiveEntry entry={upcomingEntry} sport="tennis" />\r
    </div>
}`,...c.parameters?.docs?.source}}};const N=["FootballLive","F1Live","NFLLive","Finished","Upcoming","AllSports"];export{c as AllSports,n as F1Live,o as Finished,s as FootballLive,a as NFLLive,i as Upcoming,N as __namedExportsOrder,j as default};
