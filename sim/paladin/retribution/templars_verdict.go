package retribution

import (
	"github.com/wowsims/cata/sim/core"
	"github.com/wowsims/cata/sim/paladin"
)

func (retPaladin *RetributionPaladin) RegisterTemplarsVerdict() {
	actionId := core.ActionID{SpellID: 85256}
	hpMetrics := retPaladin.NewHolyPowerMetrics(actionId)

	retPaladin.TemplarsVerdict = retPaladin.RegisterSpell(core.SpellConfig{
		ActionID:       actionId,
		SpellSchool:    core.SpellSchoolPhysical,
		ProcMask:       core.ProcMaskMeleeMHSpecial,
		Flags:          core.SpellFlagMeleeMetrics | core.SpellFlagIncludeTargetBonusDamage | core.SpellFlagAPL,
		ClassSpellMask: paladin.SpellMaskTemplarsVerdict | paladin.SpellMaskSpecialAttack,

		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
			IgnoreHaste: true,
		},
		ExtraCastCondition: func(sim *core.Simulation, target *core.Unit) bool {
			return retPaladin.GetHolyPowerValue() > 0
		},

		DamageMultiplier: 1,
		CritMultiplier:   retPaladin.DefaultMeleeCritMultiplier(),
		ThreatMultiplier: 1,

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			holyPower := retPaladin.GetHolyPowerValue()

			multiplier := 0.3 * float64(holyPower)

			spell.DamageMultiplierAdditive += multiplier
			baseDamage := spell.Unit.MHWeaponDamage(sim, spell.MeleeAttackPower())
			spell.DamageMultiplierAdditive -= multiplier

			result := spell.CalcAndDealDamage(sim, target, baseDamage, spell.OutcomeMeleeSpecialHitAndCrit)

			if result.Landed() {
				retPaladin.SpendHolyPower(sim, hpMetrics)
			}
		},
	})
}
