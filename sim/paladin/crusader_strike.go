package paladin

import (
	"github.com/wowsims/cata/sim/core"
)

func (paladin *Paladin) RegisterCrusaderStrike() {
	actionId := core.ActionID{SpellID: 35395}
	hpMetrics := paladin.NewHolyPowerMetrics(actionId)

	paladin.CrusaderStrike = paladin.RegisterSpell(core.SpellConfig{
		ActionID:       actionId,
		SpellSchool:    core.SpellSchoolPhysical,
		ProcMask:       core.ProcMaskMeleeMHSpecial,
		Flags:          core.SpellFlagMeleeMetrics | core.SpellFlagIncludeTargetBonusDamage | core.SpellFlagAPL,
		ClassSpellMask: SpellMaskCrusaderStrike | SpellMaskSpecialAttack,

		ManaCost: core.ManaCostOptions{
			BaseCost: 0.1,
		},

		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				GCD: core.GCDDefault,
			},
			IgnoreHaste: true,
			CD:          *paladin.sharedBuilderCooldown,
		},

		DamageMultiplier: 1.35,
		CritMultiplier:   paladin.DefaultMeleeCritMultiplier(),
		ThreatMultiplier: 1,

		ApplyEffects: func(sim *core.Simulation, target *core.Unit, spell *core.Spell) {
			baseDamage := spell.Unit.MHNormalizedWeaponDamage(sim, spell.MeleeAttackPower())

			result := spell.CalcAndDealDamage(sim, target, baseDamage, spell.OutcomeMeleeSpecialHitAndCrit)

			if result.Landed() {
				paladin.GainHolyPower(sim, 1, hpMetrics)
			}
		},
	})

}
