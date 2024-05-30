package warlock

import (
	"time"

	"github.com/wowsims/cata/sim/core"
)

func (warlock *Warlock) registerShadowflame() {

	shadowflameDot := warlock.RegisterSpell(core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 47960},
		SpellSchool:    core.SpellSchoolFire,
		ProcMask:       core.ProcMaskSpellDamage,
		ClassSpellMask: WarlockSpellShadowflameDot,

		DamageMultiplier: 1,
		CritMultiplier:   warlock.DefaultSpellCritMultiplier(),

		Dot: core.DotConfig{
			Aura:                core.Aura{Label: "Shadowflame (DoT)"},
			NumberOfTicks:       3,
			TickLength:          2 * time.Second,
			AffectedByCastSpeed: true,
			BonusCoefficient:    0.20000000298,
			OnSnapshot: func(sim *core.Simulation, target *core.Unit, dot *core.Dot, isRollover bool) {
				dot.Snapshot(target, warlock.CalcScalingSpellDmg(0.16899999976))
			},
			OnTick: func(sim *core.Simulation, target *core.Unit, dot *core.Dot) {
				dot.CalcAndDealPeriodicSnapshotDamage(sim, target, dot.OutcomeSnapshotCrit)
			},
		},

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			spell.Dot(target).Apply(sim)
		},
	})

	warlock.RegisterSpell(core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 47897},
		SpellSchool:    core.SpellSchoolShadow,
		ProcMask:       core.ProcMaskSpellDamage,
		Flags:          core.SpellFlagAPL,
		ClassSpellMask: WarlockSpellShadowflame,

		ManaCost: core.ManaCostOptions{BaseCost: 0.25},
		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
			CD: core.Cooldown{
				Timer:    warlock.NewTimer(),
				Duration: 12 * time.Second,
			},
		},

		DamageMultiplier: 1,
		CritMultiplier:   warlock.DefaultSpellCritMultiplier(),
		ThreatMultiplier: 1,
		BonusCoefficient: 0.10199999809,

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			baseDamage := warlock.CalcAndRollDamageRange(sim, 0.72699999809, 0.09000000358)
			result := spell.CalcDamage(sim, target, baseDamage, spell.OutcomeMagicHitAndCrit)

			if result.Landed() {
				shadowflameDot.Cast(sim, target)
			}
			spell.DealDamage(sim, result)
		},
	})
}
