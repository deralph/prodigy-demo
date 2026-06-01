import React, { useState, useEffect } from 'react';
import { Target, Plus, X, TrendingUp, Home, GraduationCap, Plane, Car, Briefcase } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import GoalCard from '../../components/ui/GoalCard';
import ModalOverlay from '../../components/ui/ModalOverlay';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const GOAL_ICONS = { Retirement: Briefcase, Education: GraduationCap, 'Home Purchase': Home, Travel: Plane, Vehicle: Car, Other: Target };
const GOAL_COLORS = ['#22c55e', '#3b82f6', '#ec4899', '#f97316', '#8b5cf6', '#e8b84b'];

export default function PersonalGoals() {
  const { plans } = useAppStore();
  const [goals, setGoals]   = useState([]);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm]     = useState({ name: '', icon: 'Other', target: '', saved: '', deadline: '', planId: '', color: '#22c55e' });

  useEffect(() => {
    import('../../services/api').then(({ goalApi }) => {
      goalApi?.findAll?.().then(data => { if (data && Array.isArray(data)) setGoals(data); }).catch(() => {});
    }).catch(() => {});
  }, []);

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.saved, 0);

  const handleAdd = () => {
    if (!form.name || !form.target) return;
    const plan = plans.find(p => p.id === form.planId);
    const IconComp = GOAL_ICONS[form.icon] || Target;
    setGoals(prev => [...prev, {
      id: 'G-' + Date.now(), name: form.name, icon: IconComp,
      target: Number(form.target), saved: Number(form.saved) || 0,
      deadline: form.deadline, color: form.color, plan: plan?.name || '—',
    }]);
    setNewOpen(false);
    setForm({ name: '', icon: 'Other', target: '', saved: '', deadline: '', planId: '', color: '#22c55e' });
  };

  const inputStyle = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', color: 'var(--navy)' };

  return (
    <div>
      <PageHeader
        title="Personal Goals"
        subtitle="Investment Goal Tracker · Single Account"
      />

      {/* Overview hero */}
      <div style={{ background: 'var(--navy)', borderRadius: 14, padding: '22px 26px', marginBottom: 22, position: 'relative', overflow: 'hidden' }} className="animate-in delay-1">
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(232,184,75,0.05)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Portfolio Goal Progress</p>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(22px,3vw,32px)', color: 'white', letterSpacing: '-0.01em', marginBottom: 6 }}>
              {fmt(totalSaved)} <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>of {fmt(totalTarget)}</span>
            </h2>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendingUp size={12} color="var(--green)" />
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                {goals.length === 0 ? '0 Goals Created' : `${Math.round((totalSaved / totalTarget) * 100)}% Overall Progress Across ${goals.length} Goals`}
              </span>
            </div>
          </div>
          <button onClick={() => setNewOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: 'var(--navy)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', letterSpacing: '0.06em', flexShrink: 0 }}>
            <Plus size={13} /> NEW GOAL
          </button>
        </div>
        <div style={{ marginTop: 14, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}%`, background: 'var(--gold)', borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Goal cards */}
      {goals.length === 0 && (
        <EmptyState icon={Target} title="No goals yet" message="Create your first investment goal to start tracking your financial milestones." action={{ label: 'Create Goal', onClick: () => setNewOpen(true) }} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }} className="animate-in delay-2">
        {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
      </div>

      {/* New goal modal */}
      {newOpen && (
        <ModalOverlay
          onClose={() => setNewOpen(false)}
          maxWidth={460}
          scrollable
          headerContent={
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'white', textTransform: 'uppercase' }}>New Investment Goal</div>
          }
        >
          {[
            { label: 'Goal Name', key: 'name', type: 'text', placeholder: 'e.g. Retirement Fund' },
            { label: 'Target Amount (₦)', key: 'target', type: 'number', placeholder: 'e.g. 50000000' },
            { label: 'Current Savings (₦)', key: 'saved', type: 'number', placeholder: 'e.g. 5000000' },
            { label: 'Target Deadline', key: 'deadline', type: 'text', placeholder: 'e.g. Dec 2030' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 5, fontWeight: 600 }}>{f.label}</div>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 5, fontWeight: 600 }}>Goal Category</div>
            <select value={form.icon} onChange={e => setForm(x => ({ ...x, icon: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', background: 'white' }}>
              {Object.keys(GOAL_ICONS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 5, fontWeight: 600 }}>Linked Investment Product</div>
            <select value={form.planId} onChange={e => setForm(x => ({ ...x, planId: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', background: 'white' }}>
              <option value="">— None —</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8, fontWeight: 600 }}>Goal Color</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {GOAL_COLORS.map(c => (
                <div key={c} onClick={() => setForm(x => ({ ...x, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.name || !form.target} style={{ width: '100%', padding: '12px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, opacity: (!form.name || !form.target) ? 0.5 : 1 }}>
            CREATE GOAL
          </button>
        </ModalOverlay>
      )}
    </div>
  );
}
