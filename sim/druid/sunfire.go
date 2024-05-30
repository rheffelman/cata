package druid

import (
	"time"

	"github.com/wowsims/cata/sim/core"
	"github.com/wowsims/cata/sim/core/proto"
)

func (druid *Druid) registerSunfireSpell() {
	druid.registerSunfireDoTSpell()
	druid.registerSunfireImpactSpell()
}

func (druid *Druid) registerSunfireDoTSpell() {
	druid.SunfireDoT = druid.RegisterSpell(Humanoid|Moonkin, core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 93402, Tag: 1},
		SpellSchool:    core.SpellSchoolNature,
		ProcMask:       core.ProcMaskSpellDamage,
		ClassSpellMask: DruidSpellSunfireDoT,
		Flags:          core.SpellFlagAPL | SpellFlagOmenTrigger,

		DamageMultiplier: 1,
		CritMultiplier:   druid.BalanceCritMultiplier(),
		ThreatMultiplier: 1,

		Dot: core.DotConfig{
			Aura: core.Aura{
				Label: "Sunfire",
			},
			NumberOfTicks:       6,
			TickLength:          time.Second * 2,
			AffectedByCastSpeed: true,
			BonusCoefficient:    0.18,

			OnSnapshot: func(sim *core.Simulation, target *core.Unit, dot *core.Dot, isRollover bool) {
				baseDamage := core.CalcScalingSpellAverageEffect(proto.Class_ClassDruid, 0.095)
				dot.Snapshot(target, baseDamage)
			},
			OnTick: func(sim *core.Simulation, target *core.Unit, dot *core.Dot) {
				dot.CalcAndDealPeriodicSnapshotDamage(sim, target, dot.OutcomeSnapshotCrit)
			},
		},

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			result := spell.CalcOutcome(sim, target, spell.OutcomeAlwaysHit)

			spell.SpellMetrics[target.UnitIndex].Hits--

			spell.Dot(target).Apply(sim)
			spell.DealOutcome(sim, result)
		},
	})
}

func (druid *Druid) registerSunfireImpactSpell() {
	druid.Sunfire = druid.RegisterSpell(Humanoid|Moonkin, core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 93402},
		SpellSchool:    core.SpellSchoolNature,
		ProcMask:       core.ProcMaskSpellDamage,
		ClassSpellMask: DruidSpellSunfire,
		Flags:          core.SpellFlagAPL | SpellFlagOmenTrigger,

		ManaCost: core.ManaCostOptions{
			BaseCost:   0.09,
			Multiplier: 1,
		},
		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
		},

		DamageMultiplier: 1,

		CritMultiplier:   druid.BalanceCritMultiplier(),
		ThreatMultiplier: 1,
		BonusCoefficient: 0.18,

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			min, max := core.CalcScalingSpellEffectVarianceMinMax(proto.Class_ClassDruid, 0.221, 0.2)
			baseDamage := sim.Roll(min, max)
			result := spell.CalcDamage(sim, target, baseDamage, spell.OutcomeMagicHitAndCrit)

			if result.Landed() {
				druid.MoonfireDoT.Dot(target).Deactivate(sim)

				druid.ExtendingMoonfireStacks = 3
				druid.SunfireDoT.Cast(sim, target)
			}

			spell.DealDamage(sim, result)
		},
	})
}
