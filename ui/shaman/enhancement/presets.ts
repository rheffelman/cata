import * as PresetUtils from '../../core/preset_utils.js';
import { Consumes, Debuffs, Flask, Food, Glyphs, Potions, Profession,RaidBuffs, TinkerHands } from '../../core/proto/common.js';
import {
	AirTotem,
	CallTotem,
	EarthTotem,
	EnhancementShaman_Options as EnhancementShamanOptions,
	FireTotem,
	ShamanImbue,
	ShamanMajorGlyph,
	ShamanMinorGlyph,
	ShamanPrimeGlyph,
	ShamanShield,
	ShamanSyncType,
	ShamanTotems,
	TotemSet,
	WaterTotem,
} from '../../core/proto/shaman.js';
import { SavedTalents } from '../../core/proto/ui.js';
import DefaultApl from './apls/default.apl.json';
import P1DraeneiGear from './gear_sets/p1draenei.gear.json';
import P1OrcGear from './gear_sets/p1orc.gear.json';
import PreraidGear from './gear_sets/preraid.gear.json';

// Preset options for this spec.
// Eventually we will import these values for the raid sim too, so its good to
// keep them in a separate file.

export const PRERAID_PRESET = PresetUtils.makePresetGear('Pre-raid Preset', PreraidGear);
export const P1ORC_PRESET = PresetUtils.makePresetGear('P1 Orc Preset', P1OrcGear);
export const P1DRAENEI_PRESET = PresetUtils.makePresetGear('P1 Draenei Preset', P1DraeneiGear);

export const ROTATION_PRESET_DEFAULT = PresetUtils.makePresetAPLRotation('Default', DefaultApl);

// Default talents. Uses the wowhead calculator format, make the talents on
// https://wowhead.com/cata/talent-calc and copy the numbers in the url.
export const StandardTalents = {
	name: 'Standard',
	data: SavedTalents.create({
		talentsString: '3022003-2333310013003012321',
		glyphs: Glyphs.create({
			prime1: ShamanPrimeGlyph.GlyphOfLavaLash,
			prime2: ShamanPrimeGlyph.GlyphOfStormstrike,
			prime3: ShamanPrimeGlyph.GlyphOfFeralSpirit,
			major1: ShamanMajorGlyph.GlyphOfLightningShield,
			major2: ShamanMajorGlyph.GlyphOfChainLightning,
			major3: ShamanMajorGlyph.GlyphOfFireNova,
			minor1: ShamanMinorGlyph.GlyphOfWaterWalking,
			minor2: ShamanMinorGlyph.GlyphOfRenewedLife,
			minor3: ShamanMinorGlyph.GlyphOfTheArcticWolf,
		}),
	}),
};

export const DefaultOptions = EnhancementShamanOptions.create({
	classOptions: {
		shield: ShamanShield.LightningShield,
		call: CallTotem.Elements,
		totems: ShamanTotems.create({
			elements: TotemSet.create({
				earth: EarthTotem.StrengthOfEarthTotem,
				air: AirTotem.WrathOfAirTotem,
				fire: FireTotem.SearingTotem,
				water: WaterTotem.ManaSpringTotem,
			}),
			ancestors: TotemSet.create({
				earth: EarthTotem.StrengthOfEarthTotem,
				air: AirTotem.WrathOfAirTotem,
				fire: FireTotem.SearingTotem,
				water: WaterTotem.ManaSpringTotem,
			}),
			spirits: TotemSet.create({
				earth: EarthTotem.StrengthOfEarthTotem,
				air: AirTotem.WrathOfAirTotem,
				fire: FireTotem.SearingTotem,
				water: WaterTotem.ManaSpringTotem,
			}),
			earth: EarthTotem.StrengthOfEarthTotem,
			air: AirTotem.WrathOfAirTotem,
			fire: FireTotem.SearingTotem,
			water: WaterTotem.ManaSpringTotem,
		}),
		imbueMh: ShamanImbue.WindfuryWeapon,
	},
	imbueOh: ShamanImbue.FlametongueWeapon,
	syncType: ShamanSyncType.Auto,
});

export const OtherDefaults = {
	profession1: Profession.Engineering,
	profession2: Profession.Tailoring,
	distanceFromTarget: 5,
};

export const DefaultConsumes = Consumes.create({
	defaultPotion: Potions.PotionOfTheTolvir,
	prepopPotion: Potions.PotionOfTheTolvir,
	flask: Flask.FlaskOfTheWinds,
	food: Food.FoodSeafoodFeast,
	tinkerHands: TinkerHands.TinkerHandsSynapseSprings,
});

export const DefaultRaidBuffs = RaidBuffs.create({
	arcaneBrilliance: true,
	bloodlust: true,
	markOfTheWild: true,
	icyTalons: true,
	moonkinForm: true,
	leaderOfThePack: true,
	powerWordFortitude: true,
	strengthOfEarthTotem: true,
	trueshotAura: true,
	wrathOfAirTotem: true,
	demonicPact: true,
	blessingOfKings: true,
	blessingOfMight: true,
	communion: true,
});

export const DefaultDebuffs = Debuffs.create({
	bloodFrenzy: true,
	sunderArmor: true,
	ebonPlaguebringer: true,
	mangle: true,
	criticalMass: true,
	demoralizingShout: true,
	frostFever: true,
	judgement: true,
});
