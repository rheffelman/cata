package core

import (
	"log"
	"os"
	"testing"

	"github.com/wowsims/cata/sim/core/proto"
	"github.com/wowsims/cata/sim/core/stats"
	googleProto "google.golang.org/protobuf/proto"
)

var DefaultSimTestOptions = &proto.SimOptions{
	Iterations: 20,
	IsTest:     true,
	Debug:      false,
	RandomSeed: 101,
}
var StatWeightsDefaultSimTestOptions = &proto.SimOptions{
	Iterations: 300,
	IsTest:     true,
	Debug:      false,
	RandomSeed: 101,
}
var AverageDefaultSimTestOptions = &proto.SimOptions{
	Iterations: 2000,
	IsTest:     true,
	Debug:      false,
	RandomSeed: 101,
}

const ShortDuration = 60
const LongDuration = 300

var DefaultTargetProto = &proto.Target{
	Level: CharacterLevel + 3,
	Stats: stats.Stats{
		stats.Armor:       11977,
		stats.AttackPower: 805,
	}.ToFloatArray(),
	MobType: proto.MobType_MobTypeGiant,

	SwingSpeed:    1.5,
	MinBaseDamage: 65000,
	ParryHaste:    true,
	DamageSpread:  0,
}

var FullRaidBuffs = &proto.RaidBuffs{
	BlessingOfKings:      true,
	PowerWordFortitude:   true,
	BlessingOfMight:      true,
	MoonkinForm:          true,
	ElementalOath:        true,
	StrengthOfEarthTotem: true,
	IcyTalons:            true,
	ArcaneBrilliance:     true,
	DemonicPact:          true,
	Bloodlust:            true,
	Communion:            true,
	ShadowForm:           true,
}
var FullPartyBuffs = &proto.PartyBuffs{
	//BraidedEterniumChain: true,
	// ManaTideTotems: 1,
}
var FullIndividualBuffs = &proto.IndividualBuffs{
	// BlessingOfMight:     true,
	// BlessingOfSanctuary: true,
	// BlessingOfWisdom:    true,
	// JudgementsOfTheWise: true,
	VampiricTouch: true,
}

var FullDebuffs = &proto.Debuffs{
	BloodFrenzy:       true,
	CurseOfElements:   true,
	CurseOfWeakness:   true,
	EarthAndMoon:      true,
	EbonPlaguebringer: true,
	ExposeArmor:       true,
	FaerieFire:        true,
	Mangle:            true,
	SunderArmor:       true,
	ThunderClap:       true,
	Vindication:       true,
	MasterPoisoner:    true,
	CriticalMass:      true,
	DemoralizingRoar:  true,
}

func NewDefaultTarget() *proto.Target {
	return DefaultTargetProto // seems to be read-only
}

func MakeDefaultEncounterCombos() []EncounterCombo {
	var DefaultTarget = NewDefaultTarget()

	multipleTargets := make([]*proto.Target, 20)
	for i := range multipleTargets {
		multipleTargets[i] = DefaultTarget
	}

	return []EncounterCombo{
		{
			Label: "ShortSingleTarget",
			Encounter: &proto.Encounter{
				Duration:             ShortDuration,
				ExecuteProportion_20: 0.2,
				ExecuteProportion_25: 0.25,
				ExecuteProportion_35: 0.35,
				ExecuteProportion_90: 0.90,
				Targets: []*proto.Target{
					DefaultTarget,
				},
			},
		},
		{
			Label: "LongSingleTarget",
			Encounter: &proto.Encounter{
				Duration:             LongDuration,
				ExecuteProportion_20: 0.2,
				ExecuteProportion_25: 0.25,
				ExecuteProportion_35: 0.35,
				ExecuteProportion_90: 0.90,
				Targets: []*proto.Target{
					DefaultTarget,
				},
			},
		},
		{
			Label: "LongMultiTarget",
			Encounter: &proto.Encounter{
				Duration:             LongDuration,
				ExecuteProportion_20: 0.2,
				ExecuteProportion_25: 0.25,
				ExecuteProportion_35: 0.35,
				ExecuteProportion_90: 0.90,
				Targets:              multipleTargets,
			},
		},
	}
}

func MakeSingleTargetEncounter(variation float64) *proto.Encounter {
	return &proto.Encounter{
		Duration:             LongDuration,
		DurationVariation:    variation,
		ExecuteProportion_20: 0.2,
		ExecuteProportion_25: 0.25,
		ExecuteProportion_35: 0.35,
		ExecuteProportion_90: 0.90,
		Targets: []*proto.Target{
			NewDefaultTarget(),
		},
	}
}

func CharacterStatsTest(label string, t *testing.T, raid *proto.Raid, expectedStats stats.Stats) {
	csr := &proto.ComputeStatsRequest{
		Raid: raid,
	}

	result := ComputeStats(csr)
	finalStats := stats.FromFloatArray(result.RaidStats.Parties[0].Players[0].FinalStats.Stats)

	const tolerance = 0.5
	if !finalStats.EqualsWithTolerance(expectedStats, tolerance) {
		t.Fatalf("%s failed: CharacterStats() = %v, expected %v", label, finalStats, expectedStats)
	}
}

func StatWeightsTest(label string, t *testing.T, _swr *proto.StatWeightsRequest, expectedStatWeights stats.Stats) {
	// Make a copy so we can safely change fields.
	swr := googleProto.Clone(_swr).(*proto.StatWeightsRequest)

	swr.Encounter.Duration = LongDuration
	swr.SimOptions.Iterations = 5000

	result := StatWeights(swr)
	resultWeights := stats.FromFloatArray(result.Dps.Weights.Stats)

	const tolerance = 0.05
	if !resultWeights.EqualsWithTolerance(expectedStatWeights, tolerance) {
		t.Fatalf("%s failed: CalcStatWeight() = %v, expected %v", label, resultWeights, expectedStatWeights)
	}
}

func RaidSimTest(label string, t *testing.T, rsr *proto.RaidSimRequest, expectedDps float64) {
	result := RunRaidSim(rsr)
	if result.ErrorResult != "" {
		t.Fatalf("Sim failed with error: %s", result.ErrorResult)
	}
	tolerance := 0.5
	if result.RaidMetrics.Dps.Avg < expectedDps-tolerance || result.RaidMetrics.Dps.Avg > expectedDps+tolerance {
		// Automatically print output if we had debugging enabled.
		if rsr.SimOptions.Debug {
			log.Printf("LOGS:\n%s\n", result.Logs)
		}
		t.Fatalf("%s failed: expected %0f dps from sim but was %0f", label, expectedDps, result.RaidMetrics.Dps.Avg)
	}
}

func RaidBenchmark(b *testing.B, rsr *proto.RaidSimRequest) {
	rsr.Encounter.Duration = LongDuration
	rsr.SimOptions.Iterations = 1

	// Set to false because IsTest adds a lot of computation.
	rsr.SimOptions.IsTest = false

	for i := 0; i < b.N; i++ {
		result := RunRaidSim(rsr)
		if result.ErrorResult != "" {
			b.Fatalf("RaidBenchmark() at iteration %d failed: %v", i, result.ErrorResult)
		}
	}
}

func GetAplRotation(dir string, file string) RotationCombo {
	filePath := dir + "/" + file + ".apl.json"
	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("failed to load apl json file: %s, %s", filePath, err)
	}

	return RotationCombo{Label: file, Rotation: APLRotationFromJsonString(string(data))}
}

func GetGearSet(dir string, file string) GearSetCombo {
	filePath := dir + "/" + file + ".gear.json"
	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("failed to load gear json file: %s, %s", filePath, err)
	}

	return GearSetCombo{Label: file, GearSet: EquipmentSpecFromJsonString(string(data))}
}
