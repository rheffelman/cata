package retribution

import (
	_ "github.com/wowsims/cata/sim/common" // imported to get item effects included.
)

func init() {
	RegisterRetributionPaladin()
}

//func TestRetribution(t *testing.T) {
//	core.RunTestSuite(t, t.Name(), core.FullCharacterTestSuiteGenerator(core.CharacterSuiteConfig{
//		Class:      proto.Class_ClassPaladin,
//		Race:       proto.Race_RaceBloodElf,
//		OtherRaces: []proto.Race{proto.Race_RaceHuman, proto.Race_RaceDraenei, proto.Race_RaceDwarf, proto.Race_RaceTauren},
//
//		GearSet:     core.GetGearSet("../../../ui/paladin/retribution/gear_sets", "p1_bis"),
//		Talents:     StandardTalents,
//		Glyphs:      StandardGlyphs,
//		Consumes:    FullConsumes,
//		SpecOptions: core.SpecOptionsCombo{Label: "Basic", SpecOptions: DefaultOptions},
//		Rotation:    core.GetAplRotation("../../../ui/paladin/retribution/apls", "default"),
//
//		ItemFilter: core.ItemFilter{
//			WeaponTypes: []proto.WeaponType{
//				proto.WeaponType_WeaponTypeAxe,
//				proto.WeaponType_WeaponTypeSword,
//				proto.WeaponType_WeaponTypePolearm,
//				proto.WeaponType_WeaponTypeMace,
//			},
//			ArmorType: proto.ArmorType_ArmorTypePlate,
//			RangedWeaponTypes: []proto.RangedWeaponType{
//				proto.RangedWeaponType_RangedWeaponTypeRelic,
//			},
//		},
//	}))
//}
//
//func BenchmarkSimulate(b *testing.B) {
//	rsr := &proto.RaidSimRequest{
//		Raid: core.SinglePlayerRaidProto(
//			&proto.Player{
//				Race:           proto.Race_RaceBloodElf,
//				Class:          proto.Class_ClassPaladin,
//				Equipment:      core.GetGearSet("../../../ui/retribution_paladin/gear_sets", "p1").GearSet,
//				Consumes:       FullConsumes,
//				Spec:           DefaultOptions,
//				Glyphs:         StandardGlyphs,
//				TalentsString:  StandardTalents,
//				Buffs:          core.FullIndividualBuffs,
//				ReactionTimeMs: 100,
//			},
//			core.FullPartyBuffs,
//			core.FullRaidBuffs,
//			core.FullDebuffs),
//		Encounter: &proto.Encounter{
//			Duration: 300,
//			Targets: []*proto.Target{
//				core.NewDefaultTarget(),
//			},
//		},
//		SimOptions: core.AverageDefaultSimTestOptions,
//	}
//
//	core.RaidBenchmark(b, rsr)
//}
//
//var StandardTalents = "203002-02-23203213211113002311"
//var StandardGlyphs = &proto.Glyphs{
//	Prime1: int32(proto.PaladinPrimeGlyph_GlyphOfTemplarSVerdict),
//	Prime2: int32(proto.PaladinPrimeGlyph_GlyphOfSealOfTruth),
//	Prime3: int32(proto.PaladinPrimeGlyph_GlyphOfExorcism),
//	Major1: int32(proto.PaladinMajorGlyph_GlyphOfHammerOfWrath),
//	Major2: int32(proto.PaladinMajorGlyph_GlyphOfTheAsceticCrusader),
//	Major3: int32(proto.PaladinMajorGlyph_GlyphOfDivineProtection),
//	Minor1: int32(proto.PaladinMinorGlyph_GlyphOfBlessingOfMight),
//	Minor2: int32(proto.PaladinMinorGlyph_GlyphOfTruth),
//	Minor3: int32(proto.PaladinMinorGlyph_GlyphOfRighteousness),
//}
//
//var DefaultOptions = &proto.Player_RetributionPaladin{
//	RetributionPaladin: &proto.RetributionPaladin{
//		Options: &proto.RetributionPaladin_Options{
//			ClassOptions: &proto.PaladinOptions{
//				Seal: proto.PaladinSeal_Truth,
//				Aura: proto.PaladinAura_Retribution,
//			},
//		},
//	},
//}
//
//var FullConsumes = &proto.Consumes{
//	Flask:         proto.Flask_FlaskOfTitanicStrength,
//	DefaultPotion: proto.Potions_GolembloodPotion,
//	PrepopPotion:  proto.Potions_GolembloodPotion,
//	Food:          proto.Food_FoodBeerBasedCrocolisk,
//}
