package cata

import (
	"time"

	"github.com/wowsims/cata/sim/common/shared"
	"github.com/wowsims/cata/sim/core/stats"
)

func init() {
	// HASTE
	shared.NewHasteActive(67152, 617, time.Second*20, time.Minute*2)  // Lady La-La's Singing Shell
	shared.NewHasteActive(60233, 1935, time.Second*10, time.Minute*1) // Shard of Woe

	// CRIT
	shared.NewCritActive(66879, 512, time.Second*20, time.Minute*2) // Bottled Lightning
	shared.NewCritActive(61448, 970, time.Second*20, time.Minute*2) // Oremantle's Favor

	// STRENGTH
	shared.NewStrengthActive(59685, 830, time.Second*10, time.Minute)     // Kvaldir Battle Standard - Alliance
	shared.NewStrengthActive(59689, 830, time.Second*10, time.Minute)     // Kvaldir Battle Standard - Horde
	shared.NewStrengthActive(55251, 765, time.Second*15, time.Second*90)  // Might of the Ocean
	shared.NewStrengthActive(56285, 1425, time.Second*15, time.Second*90) // Might of the Ocean (Heroic)
	shared.NewStrengthActive(55814, 1075, time.Second*15, time.Second*90) // Magnetite Mirror
	shared.NewStrengthActive(56345, 1425, time.Second*15, time.Second*90) // Magnetite Mirror (Heroic)
	shared.NewStrengthActive(66994, 765, time.Second*15, time.Second*90)  // Soul's Anguish
	shared.NewStrengthActive(52351, 1425, time.Second*20, time.Minute*2)  // Figurine - King of Boars
	shared.NewStrengthActive(64689, 1520, time.Second*20, time.Minute*2)  // Bloodthirsty Gladiator's Badge of Victory
	shared.NewStrengthActive(62464, 1605, time.Second*20, time.Minute*2)  // Impatience of Youth (Alliance)
	shared.NewStrengthActive(62469, 1605, time.Second*20, time.Minute*2)  // Impatience of Youth (Horde)
	shared.NewStrengthActive(61034, 1605, time.Second*20, time.Minute*2)  // Vicious Gladiator's Badge of Victory

	// AGILITY
	shared.NewAgilityActive(63840, 1095, time.Second*15, time.Second*90) // Juju of Nimbleness
	shared.NewAgilityActive(63843, 1095, time.Second*15, time.Second*90) // Blood-Soaked Ale Mug
	shared.NewAgilityActive(64687, 1520, time.Second*20, time.Second*90) // Bloodthirsty Gladiator's Badge of Conquest
	shared.NewAgilityActive(52199, 1425, time.Second*20, time.Minute*2)  // Figurine - Demon Panther
	shared.NewAgilityActive(62468, 1605, time.Second*20, time.Minute*2)  // Unsolvable Riddle (Alliance)
	shared.NewAgilityActive(62463, 1605, time.Second*20, time.Minute*2)  // Unsolvable Riddle (Horde)
	shared.NewAgilityActive(68709, 1605, time.Second*20, time.Minute*2)  // Unsolvable Riddle (No Faction)
	shared.NewAgilityActive(61033, 1605, time.Second*20, time.Minute*2)  // Vicious Gladiator's Badge of Conquest

	// SPIRIT
	shared.NewSpiritActive(67101, 555, time.Second*20, time.Minute*2)  // Unquenchable Flame
	shared.NewSpiritActive(52354, 1425, time.Second*20, time.Minute*2) // Figurine - Dream Owl
	shared.NewSpiritActive(58184, 1926, time.Second*20, time.Minute*2) // Core of Ripeness

	// DODGE
	shared.NewDodgeActive(67037, 512, time.Second*20, time.Minute*2)  // Binding Promise
	shared.NewDodgeActive(52352, 1425, time.Second*20, time.Minute*2) // Figurine - Earthen Guardian
	shared.NewDodgeActive(59515, 1605, time.Second*20, time.Minute*2) // Vial of Stolen Memories
	shared.NewDodgeActive(65109, 1812, time.Second*20, time.Minute*2) // Vial of Stolen Memories (Heroic)

	// SpellPower
	shared.NewSpellPowerActive(61429, 970, time.Second*15, time.Second*90) // Insignia of the Earthen Lord
	shared.NewSpellPowerActive(55256, 765, time.Second*20, time.Minute*2)  // Sea Star
	shared.NewSpellPowerActive(56290, 1425, time.Second*20, time.Minute*2) // Sea Star (Heroic)
	shared.NewSpellPowerActive(52353, 1425, time.Second*20, time.Minute*2) // Figurine - Jeweled Serpent
	shared.NewSpellPowerActive(64688, 1520, time.Second*20, time.Minute*2) // Bloodthirsty Gladiator's Badge of Dominance
	shared.NewSpellPowerActive(58183, 1926, time.Second*20, time.Minute*2) // Soul Casket
	shared.NewSpellPowerActive(61035, 1605, time.Second*20, time.Minute*2) // Vicious Gladiator's Badge of Dominance

	// HEALTH
	shared.NewHealthActive(61433, 6985, time.Second*15, time.Minute*3)  // Insignia of Diplomacy
	shared.NewHealthActive(55845, 7740, time.Second*15, time.Minute*3)  // Heart of Thunder
	shared.NewHealthActive(56370, 10260, time.Second*15, time.Minute*3) // Heart of Thunder
	shared.NewHealthActive(64740, 15315, time.Second*15, time.Minute*2) // Bloodthirsty Gladiator's Emblem of Cruelty
	shared.NewHealthActive(64741, 15315, time.Second*15, time.Minute*2) // Bloodthirsty Gladiator's Emblem of Meditation
	shared.NewHealthActive(64742, 15315, time.Second*15, time.Minute*2) // Bloodthirsty Gladiator's Emblem of Tenacity
	shared.NewHealthActive(62048, 15500, time.Second*15, time.Minute*2) // Darkmoon Card: Earthquake
	shared.NewHealthActive(61026, 16196, time.Second*15, time.Minute*2) // Vicious Gladiator's Emblem of Cruelty
	shared.NewHealthActive(61028, 16196, time.Second*15, time.Minute*2) // Vicious Gladiator's Emblem of Alacrity
	shared.NewHealthActive(61029, 16196, time.Second*15, time.Minute*2) // Vicious Gladiator's Emblem of Prowess
	shared.NewHealthActive(61032, 16196, time.Second*15, time.Minute*2) // Vicious Gladiator's Emblem of Tenacity
	shared.NewHealthActive(61030, 16196, time.Second*15, time.Minute*2) // Vicious Gladiator's Emblem of Proficiency
	shared.NewHealthActive(61027, 16196, time.Second*15, time.Minute*2) // Vicious Gladiator's Emblem of Accuracy

	// INT
	shared.NewIntActive(67118, 567, time.Second*20, time.Minute*2) // Electrospark Heartstarter

	// MASTERY
	shared.NewMasteryActive(63745, 1095, time.Second*15, time.Second*90) // Za'brox's Lucky Tooth - Alliance
	shared.NewMasteryActive(63742, 1095, time.Second*15, time.Second*90) // Za'brox's Lucky Tooth - Horde
	shared.NewMasteryActive(56115, 1260, time.Second*20, time.Minute*2)  // Skardyn's Grace
	shared.NewMasteryActive(56440, 1425, time.Second*20, time.Minute*2)  // Skardyn's Grace (Heroic)
	shared.NewMasteryActive(56132, 1260, time.Second*15, time.Second*90) // Mark of Khardros
	shared.NewMasteryActive(56458, 1425, time.Second*15, time.Second*90) // Mark of Khardros (Heroic)
	shared.NewMasteryActive(70142, 1700, time.Second*20, time.Minute*2)  // Moonwell Chalice

	// PARRY
	shared.NewParryActive(55881, 1260, time.Second*10, time.Minute) // Impetuous Query
	shared.NewParryActive(56406, 1425, time.Second*10, time.Minute) // Impetuous Query (Heroic)

	// RESI
	shared.CreateDevensiveStatActive(62466, time.Second*10, time.Minute, stats.Stats{ // Mirror of Broken Images (Alliance)
		stats.ArcaneResistance: 400,
		stats.FrostResistance:  400,
		stats.FireResistance:   400,
		stats.ShadowResistance: 400,
		stats.NatureResistance: 400,
	})

	shared.CreateDevensiveStatActive(62471, time.Second*10, time.Minute, stats.Stats{ // Mirror of Broken Images (Horde)
		stats.ArcaneResistance: 400,
		stats.FrostResistance:  400,
		stats.FireResistance:   400,
		stats.ShadowResistance: 400,
		stats.NatureResistance: 400,
	})
}
