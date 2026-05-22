import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FaCheck, FaCreditCard, FaDownload, FaSpinner, FaCrown, FaUsers, FaRocket,
  FaStar, FaBolt, FaCheckCircle, FaExclamationTriangle, FaInfinity, FaLock,
  FaProjectDiagram, FaTasks, FaComments, FaClock, FaShieldAlt, FaArrowUp
} from 'react-icons/fa';
import { useWorkspace } from '../../context/WorkspaceContext';

const PLANS = [
  { key:'free', name:'Free', price:0, period:'forever', icon:FaStar, gradient:'from-gray-600 to-gray-800', maxProjects:1, maxTasks:2, maxMembers:5, chat:false,
    features:['1 Project limit','2 Tasks per project','5 Team members max','No chat access','Community support only','Basic project management'] },
  { key:'pro', name:'Pro', price:29, period:'per month', icon:FaBolt, gradient:'from-blue-500 to-cyan-500', popular:false, maxProjects:5, maxTasks:5, maxMembers:50, chat:true,
    features:['Up to 5 Projects','5 Tasks per project','50 Team members max','Limited workspace chat','Priority email support','Advanced task management'] },
  { key:'pro_plus', name:'Pro Plus', price:79, period:'per month', icon:FaRocket, gradient:'from-violet-500 to-purple-600', popular:true, maxProjects:7, maxTasks:7, maxMembers:100, chat:true,
    features:['Up to 7 Projects','7 Tasks per project','100 Team members max','Limited workspace chat','24/7 priority support','Full analytics dashboard'] },
  { key:'super_pro_max', name:'Super Pro Max', price:299, period:'per month', icon:FaCrown, gradient:'from-amber-500 to-orange-600', maxProjects:10, maxTasks:15, maxMembers:null, chat:true,
    features:['Up to 10 Projects','15 Tasks per project','Unlimited team members','Limited workspace chat','Dedicated account manager','Enterprise-grade security'] },
];

const TIER = { free:0, pro:1, pro_plus:2, super_pro_max:3 };

const StatusBadge = ({ status }) => {
  const s = { paid:'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', unpaid:'bg-red-500/20 text-red-300 border-red-500/30', refunded:'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${s[status]||s.paid}`}>{status}</span>;
};

const RemainingDays = ({ remaining, total }) => {
  if (remaining === null || remaining === undefined) return null;
  const pct = total ? Math.min(((total - remaining) / total) * 100, 100) : 0;
  const r = 54, c = 2 * Math.PI * r, offset = c - (pct / 100) * c;
  const color = remaining <= 5 ? '#ef4444' : remaining <= 15 ? '#f59e0b' : '#8b5cf6';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="8"/>
          <motion.circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} initial={{strokeDashoffset:c}} animate={{strokeDashoffset:offset}} transition={{duration:1.5,ease:'easeOut'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{remaining}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">days left</span>
        </div>
      </div>
      {remaining <= 5 && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><FaExclamationTriangle className="text-[10px]"/>Expiring soon</p>}
    </div>
  );
};

const UsageBar = ({ icon:Icon, label, current, max, color='violet' }) => {
  const isUnlimited = !max || max >= 999999;
  const pct = isUnlimited ? 10 : Math.min((current/max)*100,100);
  const warn = !isUnlimited && pct >= 80;
  const colors = { violet:'bg-violet-500', blue:'bg-blue-500', amber:'bg-amber-500', emerald:'bg-emerald-500' };
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 text-gray-400"><Icon className="text-[10px]"/>{label}</span>
        <span className={`font-semibold ${warn?'text-amber-400':'text-white'}`}>{current} / {isUnlimited?<FaInfinity className="inline"/>:max}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:'easeOut'}}
          className={`h-2 rounded-full ${warn?'bg-amber-500':colors[color]||colors.violet}`}/>
      </div>
      {warn && <p className="text-xs text-amber-400 mt-1 flex items-center gap-1"><FaExclamationTriangle className="text-[10px]"/>Approaching limit — consider upgrading</p>}
    </div>
  );
};

const Billing = () => {
  const { currentWorkspace } = useWorkspace();
  const [billingInfo, setBillingInfo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmPlan, setConfirmPlan] = useState(null);

  const showToast = (type, message) => { setToast({type,message}); setTimeout(()=>setToast(null),4000); };

  const fetchAll = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    setLoading(true);
    try {
      const [infoRes, invRes] = await Promise.all([axios.get('/api/billing/info'), axios.get('/api/billing/invoices')]);
      setBillingInfo(infoRes.data); setInvoices(invRes.data);
    } catch (err) { showToast('error', err.response?.data?.message || 'Failed to load billing info'); }
    finally { setLoading(false); }
  }, [currentWorkspace?._id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpgrade = async (planKey) => {
    setConfirmPlan(null); setUpgrading(planKey);
    try {
      const { data } = await axios.post('/api/billing/upgrade', { plan: planKey });
      showToast('success', data.message); await fetchAll();
    } catch (err) { showToast('error', err.response?.data?.message || 'Upgrade failed'); }
    finally { setUpgrading(null); }
  };

  const handleDownload = async (invoice) => {
    setDownloading(invoice._id);
    try {
      const res = await axios.get(`/api/billing/invoices/${invoice._id}/download`, { responseType:'blob' });
      const url = URL.createObjectURL(new Blob([res.data],{type:'text/csv'}));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `${invoice.invoiceId}.csv`);
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      showToast('success','Invoice downloaded');
    } catch { showToast('error','Download failed'); }
    finally { setDownloading(null); }
  };

  const currentPlanKey = billingInfo?.currentPlan || 'free';
  const currentTier = TIER[currentPlanKey] ?? 0;
  const activeMembers = billingInfo?.activeMembers ?? 0;
  const maxMembersRaw = billingInfo?.maxMembersRaw ?? 5;
  const isAdmin = billingInfo?.isAdmin ?? false;
  const projectCount = billingInfo?.currentProjectCount ?? 0;
  const maxProjects = billingInfo?.maxProjects ?? 1;
  const maxTasksPerProject = billingInfo?.maxTasksPerProject ?? 2;
  const chatEnabled = billingInfo?.chatEnabled ?? false;
  const remainingDays = billingInfo?.remainingDays;
  const totalDays = billingInfo?.totalDays;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—';
  const formatAmount = (a) => a === 0 ? 'Free' : `$${Number(a).toFixed(2)}`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <FaSpinner className="animate-spin text-3xl text-violet-400"/>
        <p className="text-sm text-gray-500">Loading billing info…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium
              ${toast.type==='success'?'bg-emerald-900/90 border border-emerald-500/40 text-emerald-200':'bg-red-900/90 border border-red-500/40 text-red-200'}`}>
            {toast.type==='success'?<FaCheckCircle className="text-emerald-400"/>:<FaExclamationTriangle className="text-red-400"/>}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmPlan && (() => {
          const plan = PLANS.find(p=>p.key===confirmPlan);
          return (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setConfirmPlan(null)}>
              <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
                onClick={e=>e.stopPropagation()} className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-sm shadow-2xl">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-4`}>
                  <FaArrowUp className="text-white text-xl"/>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 text-center">Confirm Upgrade</h3>
                <p className="text-gray-400 text-sm mb-1 text-center">
                  Upgrade to <span className="text-white font-semibold">{plan.name}</span> for <span className="text-white font-semibold">${plan.price}</span>/{plan.period}
                </p>
                <p className="text-gray-500 text-xs mb-6 text-center">An invoice will be generated immediately. Downgrading is not permitted.</p>
                <div className="flex gap-3">
                  <button onClick={()=>setConfirmPlan(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm font-medium">Cancel</button>
                  <button onClick={()=>handleUpgrade(confirmPlan)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-white bg-gradient-to-r ${plan.gradient} hover:opacity-90`}>Confirm Upgrade</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
            <FaShieldAlt className="text-violet-400 text-lg"/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
            <p className="text-gray-400 text-sm">Manage your plan, resource limits, and download invoices</p>
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon:FaCreditCard, label:'Current Plan', value: PLANS.find(p=>p.key===currentPlanKey)?.name||'Free', color:'violet' },
          { icon:FaProjectDiagram, label:'Projects', value:`${projectCount}/${maxProjects}`, color:'blue' },
          { icon:FaTasks, label:'Tasks/Project', value:`max ${maxTasksPerProject}`, color:'emerald' },
          { icon:FaComments, label:'Chat Access', value:chatEnabled?'Enabled':'Locked', color:chatEnabled?'emerald':'red' },
        ].map((s,i) => (
          <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`text-xs text-${s.color}-400`}/>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Plans Grid */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="xl:col-span-2 bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Choose Your Plan</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <FaLock className="text-red-400 text-[10px]"/>
              <span className="text-xs text-red-300 font-medium">No downgrading permitted</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlanKey;
              const isLower = TIER[plan.key] <= currentTier && !isCurrent;
              const isUpgrading = upgrading === plan.key;
              return (
                <motion.div key={plan.key} whileHover={!isCurrent && !isLower ? {scale:1.02} : {}} transition={{duration:0.15}}
                  className={`relative border-2 rounded-xl p-5 transition-all ${isCurrent
                    ? 'border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/30'
                    : isLower ? 'border-gray-800/30 bg-gray-800/10 opacity-50' : 'border-gray-800/60 bg-gray-800/20 hover:border-gray-700'}`}>
                  {isCurrent && <span className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">✓ Current Plan</span>}
                  {plan.popular && !isCurrent && <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">★ Most Popular</span>}
                  {isLower && <span className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold bg-gray-700 text-gray-400"><FaLock className="inline mr-1 text-[8px]"/>Locked</span>}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.gradient}`}><plan.icon className="text-sm text-white"/></div>
                    <h4 className="text-base font-bold text-white">{plan.name}</h4>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-white">{plan.price===0?'Free':`$${plan.price}`}</span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm ml-1">/ {plan.period}</span>}
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((f,i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {f.includes('No chat') ? <FaLock className="text-red-400 mt-0.5 flex-shrink-0 text-[10px]"/> : <FaCheck className="text-emerald-400 mt-0.5 flex-shrink-0 text-[10px]"/>}
                        <span className={f.includes('No chat')?'text-gray-500':'text-gray-300'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-lg text-center text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Active Plan</div>
                  ) : isLower ? (
                    <div className="w-full py-2.5 rounded-lg text-center text-sm font-semibold text-gray-600 bg-gray-800/40 border border-gray-800 cursor-not-allowed"><FaLock className="inline mr-1.5 text-[10px]"/>Downgrade Blocked</div>
                  ) : (
                    <button disabled={!isAdmin||!!upgrading} onClick={()=>setConfirmPlan(plan.key)}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 text-white bg-gradient-to-r ${plan.gradient} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}>
                      {isUpgrading ? <><FaSpinner className="animate-spin"/>Upgrading…</> : <><FaArrowUp className="text-xs"/>Upgrade</>}
                    </button>
                  )}
                  {!isAdmin && !isCurrent && !isLower && <p className="text-center text-xs text-gray-600 mt-2">Admin only</p>}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="space-y-5">
          {/* Remaining Days */}
          {currentPlanKey !== 'free' && (
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><FaClock className="text-violet-400 text-sm"/>Subscription Period</h3>
              <RemainingDays remaining={remainingDays} total={totalDays}/>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">{billingInfo?.planStartDate ? formatDate(billingInfo.planStartDate) : '—'} → {billingInfo?.planEndDate ? formatDate(billingInfo.planEndDate) : '—'}</p>
              </div>
            </div>
          )}
          {/* Usage */}
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">Plan Usage</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Current Plan</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30`}>{PLANS.find(p=>p.key===currentPlanKey)?.name||'Free'}</span>
            </div>
            <UsageBar icon={FaProjectDiagram} label="Projects" current={projectCount} max={maxProjects} color="blue"/>
            <UsageBar icon={FaUsers} label="Team Members" current={activeMembers} max={maxMembersRaw} color="violet"/>
            <div className="mt-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><FaComments className="text-[10px]"/>Chat Access</span>
                {chatEnabled
                  ? <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><FaCheckCircle className="text-[10px]"/>Enabled</span>
                  : <span className="text-xs font-semibold text-red-400 flex items-center gap-1"><FaLock className="text-[10px]"/>Locked</span>}
              </div>
            </div>
          </div>
          {/* Payment Method */}
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">Payment Method</h3>
            <div className="flex items-center gap-3 p-3.5 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="p-2.5 rounded-lg bg-gray-700/50"><FaCreditCard className="text-lg text-gray-400"/></div>
              <div><p className="text-sm font-medium text-white">No payment method</p><p className="text-xs text-gray-500">Add a card to upgrade your plan</p></div>
            </div>
            <button className="w-full mt-3 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-violet-500/50 hover:text-violet-300 transition-all">Add Payment Method</button>
          </div>
        </motion.div>
      </div>

      {/* Billing History */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Billing History</h3>
          <span className="text-xs text-gray-500">{invoices.length} invoice{invoices.length!==1?'s':''}</span>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/60 flex items-center justify-center mx-auto mb-3"><FaCreditCard className="text-2xl text-gray-600"/></div>
            <p className="text-gray-500 text-sm">No invoices yet</p>
            <p className="text-gray-600 text-xs mt-1">Invoices will appear here after upgrading your plan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800/60">
                {['Invoice','Date','Plan','Period','Amount','Status','Action'].map(h=>(
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invoices.map((inv,i) => {
                  const planInfo = PLANS.find(p=>p.key===inv.plan);
                  return (
                    <motion.tr key={inv._id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                      className="border-b border-gray-800/30 hover:bg-gray-800/25 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-300 font-medium">{inv.invoiceId}</td>
                      <td className="py-3.5 px-4 text-gray-400">{formatDate(inv.createdAt)}</td>
                      <td className="py-3.5 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300`}>{planInfo?.name||inv.plan}</span></td>
                      <td className="py-3.5 px-4 text-gray-400 text-xs">{inv.period?.start&&inv.period?.end ? `${formatDate(inv.period.start)} → ${formatDate(inv.period.end)}` : '—'}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{formatAmount(inv.amount)}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={inv.status}/></td>
                      <td className="py-3.5 px-4">
                        <button onClick={()=>handleDownload(inv)} disabled={downloading===inv._id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                          {downloading===inv._id ? <FaSpinner className="animate-spin text-[10px]"/> : <FaDownload className="text-[10px]"/>} Download
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Billing;