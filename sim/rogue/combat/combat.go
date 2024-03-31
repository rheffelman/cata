package combat

import (
	"github.com/wowsims/cata/sim/core"
	"github.com/wowsims/cata/sim/core/proto"
	"github.com/wowsims/cata/sim/core/stats"
	"github.com/wowsims/cata/sim/rogue"
)

func RegisterCombatRogue() {
	core.RegisterAgentFactory(
		proto.Player_CombatRogue{},
		proto.Spec_SpecCombatRogue,
		func(character *core.Character, options *proto.Player) core.Agent {
			return NewCombatRogue(character, options)
		},
		func(player *proto.Player, spec interface{}) {
			playerSpec, ok := spec.(*proto.Player_CombatRogue)
			if !ok {
				panic("Invalid spec value for Combat Rogue!")
			}
			player.Spec = playerSpec
		},
	)
}

func NewCombatRogue(character *core.Character, options *proto.Player) *CombatRogue {
	combatOptions := options.GetCombatRogue().Options

	combatRogue := &CombatRogue{
		Rogue: rogue.NewRogue(character, combatOptions.ClassOptions, options.TalentsString),
	}
	combatRogue.CombatOptions = combatOptions

	return combatRogue
}

func (combatRogue *CombatRogue) Initialize() {
	combatRogue.Rogue.Initialize()

	// Vitality Passive
	combatRogue.AutoAttacks.OHConfig().DamageMultiplier *= 1.75
	combatRogue.EnergyTickMultiplier *= 1.25
	combatRogue.MultiplyStat(stats.AttackPower, 1.3)

	combatRogue.registerRevealingStrike()
	combatRogue.registerBladeFlurry()
	combatRogue.registerBanditsGuile()

	combatRogue.applyCombatPotency()

	combatRogue.registerKillingSpreeCD()
	combatRogue.registerAdrenalineRushCD()
	combatRogue.applyRestlessBlades()

	combatRogue.applyMastery()
}

type CombatRogue struct {
	*rogue.Rogue

	mainGauche *core.Spell

	mainGaucheAura *core.Aura
}

func (combatRogue *CombatRogue) GetRogue() *rogue.Rogue {
	return combatRogue.Rogue
}

func (combatRogue *CombatRogue) Reset(sim *core.Simulation) {
	combatRogue.Rogue.Reset(sim)

	combatRogue.mainGaucheAura.Activate(sim)

	if combatRogue.Talents.RestlessBlades > 0 {
		combatRogue.RestlessBladesAura.Activate(sim)
	}

	if combatRogue.Talents.BanditsGuile > 0 {
		combatRogue.BanditsGuileAura.Activate(sim)
	}

}
