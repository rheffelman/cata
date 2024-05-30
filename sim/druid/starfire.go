package druid

import (
	"time"

	"github.com/wowsims/cata/sim/core"
	"github.com/wowsims/cata/sim/core/proto"
)

func (druid *Druid) registerStarfireSpell() {
	solarMetric := druid.NewSolarEnergyMetrics(core.ActionID{SpellID: 2912})

	hasStarfireGlyph := druid.HasMajorGlyph(proto.DruidMajorGlyph(proto.DruidPrimeGlyph_GlyphOfStarfire))

	starfireGlyphSpell := druid.RegisterSpell(Humanoid|Moonkin, core.SpellConfig{
		ActionID: core.ActionID{SpellID: 54845},
		ProcMask: core.ProcMaskSuppressedProc,
		Flags:    core.SpellFlagNoLogs,
		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			moonfireDot := druid.MoonfireDoT.Dot(target)
			sunfireDot := druid.SunfireDoT.Dot(target)

			tryExtendDot(moonfireDot, &druid.ExtendingMoonfireStacks)
			tryExtendDot(sunfireDot, &druid.ExtendingMoonfireStacks)
		},
	})

	druid.Starfire = druid.RegisterSpell(Humanoid|Moonkin, core.SpellConfig{
		ActionID:       core.ActionID{SpellID: 2912},
		SpellSchool:    core.SpellSchoolArcane,
		ProcMask:       core.ProcMaskSpellDamage,
		ClassSpellMask: DruidSpellStarfire,
		Flags:          core.SpellFlagAPL | SpellFlagOmenTrigger,

		ManaCost: core.ManaCostOptions{
			BaseCost:   0.11,
			Multiplier: 1,
		},

		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD:      core.GCDDefault,
				CastTime: time.Millisecond * 3200,
			},
		},

		BonusCoefficient: 1.231,

		BonusCritRating: 1,

		DamageMultiplier: 1,

		CritMultiplier: druid.BalanceCritMultiplier(),

		ThreatMultiplier: 1,

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			min, max := core.CalcScalingSpellEffectVarianceMinMax(proto.Class_ClassDruid, 1.383, 0.22)
			baseDamage := sim.Roll(min, max)
			result := spell.CalcDamage(sim, target, baseDamage, spell.OutcomeMagicHitAndCrit)

			if result.Landed() {
				druid.AddEclipseEnergy(20, SolarEnergy, sim, solarMetric)

				if hasStarfireGlyph {
					starfireGlyphSpell.Cast(sim, target)
				}

				spell.DealDamage(sim, result)
			}
		},
	})
}

func tryExtendDot(dot *core.Dot, extendingStacks *int) {
	if dot.IsActive() && *extendingStacks > 0 {
		*extendingStacks -= 1
		dot.UpdateExpires(dot.ExpiresAt() + time.Second*3)
	}
}
