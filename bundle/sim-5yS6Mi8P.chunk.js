import{n as e,Y as t,o as a,_ as l,q as s,a3 as n,a1 as o,a2 as i,s as p,V as r,t as d,w as c,X as g,T as S,F as u,G as m,J as h}from"./preset_utils-DkHhB_Bm.chunk.js";import{R as I}from"./suggest_reforges_action-bi03Qr31.chunk.js";import{aK as f,aL as v,T as A,aM as y,S as T,a3 as O,G as M,aN as P,aO as R,aP as w,H as k,a8 as C,ab as E,a9 as b,aa as x,b as D,ad as H,ae as W,af as F,al as G,R as J,aQ as L,aR as V,aw as j,ag as B,ah as N,ai as _,aj as U,az as q,aA as z,aB as K,F as Q}from"./detailed_results-C-DDAdQD.chunk.js";import{s as X}from"./apl_utils-CsDYhaBB.chunk.js";import{P as Y,a as $}from"./inputs-CktlgH4I.chunk.js";const Z={inputs:[e({fieldName:"type",label:"Type",values:[{name:"Single Target",value:f.SingleTarget},{name:"AOE",value:f.Aoe}]}),e({fieldName:"sting",label:"Sting",labelTooltip:"Maintains the selected Sting on the primary target.",values:[{name:"None",value:v.NoSting},{name:"Scorpid Sting",value:v.ScorpidSting},{name:"Serpent Sting",value:v.SerpentSting}],showWhen:e=>e.getSimpleRotation().type==f.SingleTarget}),t({fieldName:"trapWeave",label:"Trap Weave",labelTooltip:"Uses Explosive Trap at appropriate times. Note that selecting this will disable Black Arrow because they share a CD."}),t({fieldName:"multiDotSerpentSting",label:"Multi-Dot Serpent Sting",labelTooltip:"Casts Serpent Sting on multiple targets",changeEmitter:e=>A.onAny([e.rotationChangeEmitter,e.talentsChangeEmitter])})]},ee={type:"TypeAPL",prepullActions:[{action:{castSpell:{spellId:{otherId:"OtherActionPotion"}}},doAtValue:{const:{val:"-1s"}}}],priorityList:[{action:{autocastOtherCooldowns:{}}},{action:{castSpell:{spellId:{spellId:13812}}}},{action:{castSpell:{spellId:{spellId:2643}}}},{action:{castSpell:{spellId:{spellId:56641}}}}]},te={type:"TypeAPL",prepullActions:[{action:{castSpell:{spellId:{spellId:13812}}},doAtValue:{const:{val:"-25s"}}},{action:{castSpell:{spellId:{otherId:"OtherActionPotion"}}},doAtValue:{const:{val:"-3s"}}},{action:{castSpell:{spellId:{spellId:13165}}},doAtValue:{const:{val:"-10s"}}},{action:{castSpell:{spellId:{spellId:1130}}},doAtValue:{const:{val:"-11s"}}},{action:{castSpell:{spellId:{spellId:2825,tag:-1}}},doAtValue:{const:{val:"-1s"}}}],priorityList:[{action:{autocastOtherCooldowns:{}}},{action:{condition:{or:{vals:[{cmp:{op:"OpLe",lhs:{spellCastTime:{spellId:{spellId:19434}}},rhs:{const:{val:"1s"}}}},{isExecutePhase:{threshold:"E90"}}]}},castSpell:{spellId:{spellId:19434}}}},{action:{condition:{and:{vals:[{not:{val:{dotIsActive:{spellId:{spellId:1978}}}}},{not:{val:{isExecutePhase:{threshold:"E90"}}}}]}},castSpell:{spellId:{spellId:1978}}}},{action:{condition:{and:{vals:[{not:{val:{isExecutePhase:{threshold:"E90"}}}}]}},castSpell:{spellId:{spellId:53209}}}},{action:{condition:{or:{vals:[{not:{val:{auraIsActive:{auraId:{spellId:53221,tag:1}}}}},{cmp:{op:"OpLe",lhs:{auraRemainingTime:{auraId:{spellId:53221,tag:1}}},rhs:{const:{val:"3s"}}}}]}},castSpell:{spellId:{spellId:56641}}}},{action:{condition:{spellCanCast:{spellId:{spellId:53351}}},castSpell:{spellId:{spellId:53351}}}},{action:{condition:{or:{vals:[{cmp:{op:"OpGe",lhs:{currentFocus:{}},rhs:{const:{val:"66"}}}},{cmp:{op:"OpGe",lhs:{spellTimeToReady:{spellId:{spellId:53209}}},rhs:{const:{val:"4"}}}}]}},castSpell:{spellId:{spellId:3044}}}},{action:{castSpell:{spellId:{spellId:56641}}}}]},ae={type:"TypeAPL",prepullActions:[{action:{castSpell:{spellId:{spellId:13812}}},doAtValue:{const:{val:"-25s"}}},{action:{castSpell:{spellId:{otherId:"OtherActionPotion"}}},doAtValue:{const:{val:"-3s"}}},{action:{castSpell:{spellId:{spellId:13165}}},doAtValue:{const:{val:"-10s"}}},{action:{castSpell:{spellId:{spellId:1130}}},doAtValue:{const:{val:"-11s"}}},{action:{castSpell:{spellId:{spellId:2825,tag:-1}}},doAtValue:{const:{val:"-1s"}}}],priorityList:[{action:{autocastOtherCooldowns:{}}},{action:{condition:{or:{vals:[{cmp:{op:"OpLe",lhs:{spellCastTime:{spellId:{spellId:19434}}},rhs:{const:{val:"1s"}}}},{isExecutePhase:{threshold:"E90"}}]}},castSpell:{spellId:{spellId:19434}}}},{action:{condition:{and:{vals:[{not:{val:{dotIsActive:{spellId:{spellId:1978}}}}},{not:{val:{isExecutePhase:{threshold:"E90"}}}}]}},castSpell:{spellId:{spellId:1978}}}},{action:{condition:{and:{vals:[{not:{val:{isExecutePhase:{threshold:"E90"}}}}]}},castSpell:{spellId:{spellId:53209}}}},{action:{condition:{or:{vals:[{not:{val:{auraIsActive:{auraId:{spellId:53221,tag:1}}}}},{cmp:{op:"OpLe",lhs:{auraRemainingTime:{auraId:{spellId:53221,tag:1}}},rhs:{const:{val:"3s"}}}}]}},castSpell:{spellId:{spellId:56641}}}},{action:{condition:{spellCanCast:{spellId:{spellId:53351}}},castSpell:{spellId:{spellId:53351}}}},{action:{condition:{or:{vals:[{cmp:{op:"OpGe",lhs:{currentFocus:{}},rhs:{const:{val:"66"}}}},{cmp:{op:"OpGe",lhs:{spellTimeToReady:{spellId:{spellId:53209}}},rhs:{const:{val:"4"}}}}]}},castSpell:{spellId:{spellId:3044}}}},{action:{castSpell:{spellId:{spellId:56641}}}}]},le={items:[{id:65206,enchant:4209,gems:[68778,52209],reforging:165},{id:69880,randomSuffix:-135,reforging:151},{id:65208,enchant:4204,gems:[52212],reforging:166},{id:69884,randomSuffix:-135,enchant:1099},{id:65204,enchant:4102,gems:[52212,52220]},{id:65028,enchant:4258,gems:[52212]},{id:65205,enchant:3222,gems:[52212,52212]},{id:65132,gems:[52212,52212]},{id:60230,enchant:3823,gems:[52212,52220,52209]},{id:65063,enchant:4105,gems:[52220]},{id:65082},{id:65367,randomSuffix:-133},{id:65140},{id:65026},{id:65139,enchant:4227,reforging:167},{},{id:65058,enchant:4175,reforging:167}]},se=a("MM PreRaid Preset",{items:[{id:59456,enchant:4209,gems:[68778,59478,59493]},{id:52350,gems:[52212]},{id:64712,enchant:4204,gems:[52212],reforging:152},{id:56315,enchant:1099},{id:56564,enchant:4063,gems:[52258],reforging:152},{id:63479,enchant:4071,gems:[0]},{id:64709,enchant:3222,gems:[52212,0],reforging:137},{id:56539,gems:[52212,52212],reforging:165},{id:56386,enchant:4126,gems:[52258,52258]},{id:62385,enchant:4076,gems:[52212],reforging:166},{id:52348,gems:[52212],reforging:167},{id:62362,reforging:166},{id:68709,reforging:166},{id:56328,reforging:137},{id:55066,enchant:4227,reforging:165},{},{id:59367,enchant:4175,gems:[52212],reforging:151}]}),ne=a("MM P1 Preset",le),oe=y.create({type:f.SingleTarget,sting:v.SerpentSting,trapWeave:!0,multiDotSerpentSting:!0,allowExplosiveShotDownrank:!0}),ie=l("Simple Default",T.SpecMarksmanshipHunter,oe),pe=s("MM",te),re=s("MM (Advanced)",ae),de=s("AOE",ee),ce={name:"Marksman",data:O.create({talentsString:"032002-2302320232120231201-03",glyphs:M.create({prime1:P.GlyphOfArcaneShot,prime2:P.GlyphOfRapidFire,prime3:P.GlyphOfSteadyShot,major1:R.GlyphOfDisengage,major2:R.GlyphOfRaptorStrike,major3:R.GlyphOfTrapLauncher})})},ge=w.create({classOptions:{useHuntersMark:!0,petType:k.Wolf,petTalents:n,petUptime:1}}),Se=C.create({defaultPotion:E.PotionOfTheTolvir,prepopPotion:E.PotionOfTheTolvir,flask:b.FlaskOfTheWinds,defaultConjured:o.value,food:x.FoodSeafoodFeast,tinkerHands:i.value}),ue={distanceFromTarget:24,duration:240,durationVariation:20,profession1:D.Engineering,profession2:D.Jewelcrafting},me=p(T.SpecMarksmanshipHunter,{cssClass:"marksmanship-hunter-sim-ui",cssScheme:"hunter",knownIssues:[],warnings:[],epStats:[H.StatStamina,H.StatIntellect,H.StatAgility,H.StatRangedAttackPower,H.StatMeleeHit,H.StatMeleeCrit,H.StatMeleeHaste,H.StatMP5,H.StatMastery],epPseudoStats:[W.PseudoStatRangedDps],epReferenceStat:H.StatRangedAttackPower,displayStats:[H.StatHealth,H.StatStamina,H.StatAgility,H.StatRangedAttackPower,H.StatMeleeHit,H.StatMeleeCrit,H.StatMeleeHaste,H.StatMastery],modifyDisplayStats:e=>{let t=new F;const a=e.getEquippedItem(G.ItemSlotRanged);return 3608==a?.enchant?.effectId&&(t=t.addStat(H.StatMeleeCrit,40)),e.getRace()==J.RaceDwarf&&a?.item.rangedWeaponType==L.RangedWeaponTypeGun&&(t=t.addStat(H.StatMeleeCrit,1*V)),e.getRace()==J.RaceTroll&&a?.item.rangedWeaponType==L.RangedWeaponTypeBow&&(t=t.addStat(H.StatMeleeCrit,1*V)),{talents:t}},defaults:{gear:ne.gear,epWeights:F.fromMap({[H.StatStamina]:.5,[H.StatAgility]:3.05,[H.StatRangedAttackPower]:1,[H.StatMeleeHit]:2.25,[H.StatMeleeCrit]:1.39,[H.StatMeleeHaste]:1.33,[H.StatMastery]:1.15},{[W.PseudoStatRangedDps]:6.32}),statCaps:(new F).withStat(H.StatMeleeHit,8*j),other:ue,consumes:Se,talents:ce.data,specOptions:ge,raidBuffs:B.create({arcaneBrilliance:!0,bloodlust:!0,markOfTheWild:!0,icyTalons:!0,moonkinForm:!0,leaderOfThePack:!0,powerWordFortitude:!0,strengthOfEarthTotem:!0,trueshotAura:!0,wrathOfAirTotem:!0,demonicPact:!0,blessingOfKings:!0,blessingOfMight:!0,communion:!0}),partyBuffs:N.create({}),individualBuffs:_.create({vampiricTouch:!0}),debuffs:U.create({sunderArmor:!0,faerieFire:!0,curseOfElements:!0,savageCombat:!0,bloodFrenzy:!0})},playerIconInputs:[Y()],rotationInputs:Z,petConsumeInputs:[],includeBuffDebuffInputs:[r,d],excludeBuffDebuffInputs:[],otherInputs:{inputs:[$(),c,g,S,u,m]},encounterPicker:{showExecuteProportion:!0},presets:{talents:[ce],rotations:[ie,pe,re,de],gear:[se,ne]},autoRotation:e=>e.sim.encounter.targets.length>=4?de.rotation.rotation:pe.rotation.rotation,simpleRotation:(e,t,a)=>{const[l,s]=X(a),n=q.fromJsonString('{"condition":{"not":{"val":{"auraIsActive":{"auraId":{"spellId":12472}}}}},"castSpell":{"spellId":{"otherId":"OtherActionPotion"}}}'),o=q.fromJsonString(`{"condition":{"cmp":{"op":"OpGt","lhs":{"remainingTime":{}},"rhs":{"const":{"val":"6s"}}}},"multidot":{"spellId":{"spellId":49001},"maxDots":${t.multiDotSerpentSting?3:1},"maxOverlap":{"const":{"val":"0ms"}}}}`),i=q.fromJsonString('{"condition":{"auraShouldRefresh":{"auraId":{"spellId":3043},"maxOverlap":{"const":{"val":"0ms"}}}},"castSpell":{"spellId":{"spellId":3043}}}'),p=q.fromJsonString('{"condition":{"not":{"val":{"dotIsActive":{"spellId":{"spellId":49067}}}}},"castSpell":{"spellId":{"tag":1,"spellId":49067}}}'),r=q.fromJsonString('{"castSpell":{"spellId":{"spellId":58434}}}'),d=q.fromJsonString('{"castSpell":{"spellId":{"spellId":61006}}}'),c=q.fromJsonString('{"castSpell":{"spellId":{"spellId":49050}}}'),g=q.fromJsonString('{"castSpell":{"spellId":{"spellId":49048}}}'),S=q.fromJsonString('{"castSpell":{"spellId":{"spellId":49052}}}'),u=q.fromJsonString('{"castSpell":{"spellId":{"spellId":34490}}}'),m=q.fromJsonString('{"castSpell":{"spellId":{"spellId":53209}}}');return t.type==f.Aoe?s.push(...[n,t.sting==v.ScorpidSting?i:null,t.sting==v.SerpentSting?o:null,t.trapWeave?p:null,r].filter((e=>e))):s.push(...[n,u,d,t.sting==v.ScorpidSting?i:null,t.sting==v.SerpentSting?o:null,t.trapWeave?p:null,m,c,g,S].filter((e=>e))),z.create({prepullActions:l,priorityList:s.map((e=>K.create({action:e})))})},raidSimPresets:[{spec:T.SpecMarksmanshipHunter,talents:ce.data,specOptions:ge,consumes:Se,defaultFactionRaces:{[Q.Unknown]:J.RaceUnknown,[Q.Alliance]:J.RaceWorgen,[Q.Horde]:J.RaceTroll},defaultGear:{[Q.Unknown]:{},[Q.Alliance]:{1:se.gear},[Q.Horde]:{1:se.gear}},otherDefaults:ue}]});class he extends h{constructor(e,t){super(e,t,me),t.sim.waitForInit().then((()=>{new I(this)}))}}export{he as M};
