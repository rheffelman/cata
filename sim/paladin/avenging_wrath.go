package paladin

import (
	"time"

	"github.com/wowsims/cata/sim/core"
)

func (paladin *Paladin) registerAvengingWrath() {
	actionID := core.ActionID{SpellID: 31884}

	paladin.AvengingWrathAura = paladin.RegisterAura(core.Aura{
		Label:    "Avenging Wrath",
		ActionID: actionID,
		Duration: 20 * time.Second,

		OnGain: func(aura *core.Aura, sim *core.Simulation) {
			aura.Unit.PseudoStats.DamageDealtMultiplier *= 1.2
		},

		OnExpire: func(aura *core.Aura, sim *core.Simulation) {
			aura.Unit.PseudoStats.DamageDealtMultiplier /= 1.2
		},
	})
	core.RegisterPercentDamageModifierEffect(paladin.AvengingWrathAura, 1.2)

	paladin.AvengingWrath = paladin.RegisterSpell(core.SpellConfig{
		ActionID: actionID,
		Flags:    core.SpellFlagNoOnCastComplete | core.SpellFlagAPL,

		ManaCost: core.ManaCostOptions{
			BaseCost: 0.08,
		},
		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				NonEmpty: true,
			},
			CD: core.Cooldown{
				Timer:    paladin.NewTimer(),
				Duration: 3 * time.Minute,
			},
		},
		ApplyEffects: func(sim *core.Simulation, _ *core.Unit, _ *core.Spell) {
			paladin.AvengingWrathAura.Activate(sim)
		},
	})

	paladin.AddMajorCooldown(core.MajorCooldown{
		Spell: paladin.AvengingWrath,
		Type:  core.CooldownTypeDPS,
	})
}
