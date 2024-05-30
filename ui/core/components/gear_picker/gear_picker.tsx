import { Button, Icon, Link } from '@wowsims/ui';
import tippy from 'tippy.js';
import { ref } from 'tsx-vanilla';

import { SortDirection } from '../../constants/other';
import { setItemQualityCssClass } from '../../css_utils';
import { IndividualSimUI } from '../../individual_sim_ui';
import { Player, ReforgeData } from '../../player';
import { Class, GemColor, ItemQuality, ItemRandomSuffix, ItemSlot, ItemSpec, ItemType } from '../../proto/common';
import { DatabaseFilters, RepFaction, UIEnchant as Enchant, UIGem as Gem, UIItem as Item, UIItem_FactionRestriction } from '../../proto/ui';
import { ActionId } from '../../proto_utils/action_id';
import { getEnchantDescription, getUniqueEnchantString } from '../../proto_utils/enchants';
import { EquippedItem } from '../../proto_utils/equipped_item';
import { gemMatchesSocket, getEmptyGemSocketIconUrl } from '../../proto_utils/gems';
import {
	difficultyNames,
	professionNames,
	REP_FACTION_NAMES,
	REP_FACTION_QUARTERMASTERS,
	REP_LEVEL_NAMES,
	shortSecondaryStatNames,
	slotNames,
} from '../../proto_utils/names';
import { Stats } from '../../proto_utils/stats';
import { getPVPSeasonFromItem, isPVPItem } from '../../proto_utils/utils';
import { Sim } from '../../sim';
import { SimUI } from '../../sim_ui';
import { EventID, TypedEvent } from '../../typed_event';
import { formatDeltaTextElem, mod } from '../../utils';
import { BaseModal } from '../base_modal';
import { Component } from '../component';
import { FiltersMenu } from '../filters_menu';
import {
	makePhaseSelector,
	makeShow1hWeaponsSelector,
	makeShow2hWeaponsSelector,
	makeShowEPValuesSelector,
	makeShowMatchingGemsSelector,
} from '../other_inputs';
import QuickSwapList from '../quick_swap';
import { Clusterize } from '../virtual_scroll/clusterize';
import { addQuickEnchantPopover } from './quick_enchant_popover';
import { addQuickGemPopover } from './quick_gem_popover';

const EP_TOOLTIP = `
	EP (Equivalence Points) is way of comparing items by multiplying the raw stats of an item with your current stat weights.
	More EP does not necessarily mean more DPS, as EP doesn't take into account stat caps and non-linear stat calculations.
`;

const createHeroicLabel = () => {
	return <span className="heroic-label">[H]</span>;
};

const createGemContainer = (socketColor: GemColor, gem: Gem | null, index: number) => {
	const gemIconElem = ref<HTMLImageElement>();
	const gemContainerElem = ref<HTMLAnchorElement>();
	const gemContainer = (
		<Link as="button" ref={gemContainerElem} className="gem-socket-container" dataset={{ socketIdx: index }}>
			<img ref={gemIconElem} className={`gem-icon ${gem == null ? 'hide' : ''}`} />
			<img className="socket-icon" src={getEmptyGemSocketIconUrl(socketColor)} />
		</Link>
	);

	if (!!gem) {
		ActionId.fromItemId(gem.id)
			.fill()
			.then(filledId => {
				filledId.setWowheadHref(gemContainerElem.value!);
				gemIconElem.value!.src = filledId.iconUrl;
			});
	}
	return gemContainer as HTMLAnchorElement;
};

export class GearPicker extends Component {
	// ItemSlot is used as the index
	readonly itemPickers: Array<ItemPicker>;
	readonly selectorModal: SelectorModal;

	constructor(parent: HTMLElement, simUI: SimUI, player: Player<any>) {
		super(parent, 'gear-picker-root');

		const leftSide = document.createElement('div');
		leftSide.classList.add('gear-picker-left', 'tab-panel-col');
		this.rootElem.appendChild(leftSide);

		const rightSide = document.createElement('div');
		rightSide.classList.add('gear-picker-right', 'tab-panel-col');
		this.rootElem.appendChild(rightSide);

		const leftItemPickers = [
			ItemSlot.ItemSlotHead,
			ItemSlot.ItemSlotNeck,
			ItemSlot.ItemSlotShoulder,
			ItemSlot.ItemSlotBack,
			ItemSlot.ItemSlotChest,
			ItemSlot.ItemSlotWrist,
			ItemSlot.ItemSlotMainHand,
			ItemSlot.ItemSlotOffHand,
			ItemSlot.ItemSlotRanged,
		].map(slot => new ItemPicker(leftSide, this, simUI, player, slot));

		const rightItemPickers = [
			ItemSlot.ItemSlotHands,
			ItemSlot.ItemSlotWaist,
			ItemSlot.ItemSlotLegs,
			ItemSlot.ItemSlotFeet,
			ItemSlot.ItemSlotFinger1,
			ItemSlot.ItemSlotFinger2,
			ItemSlot.ItemSlotTrinket1,
			ItemSlot.ItemSlotTrinket2,
		].map(slot => new ItemPicker(rightSide, this, simUI, player, slot));

		this.itemPickers = leftItemPickers.concat(rightItemPickers).sort((a, b) => a.slot - b.slot);

		this.selectorModal = new SelectorModal(simUI.rootElem, simUI, player, this);
	}
}

export class ItemRenderer extends Component {
	private readonly player: Player<any>;

	readonly iconElem: HTMLAnchorElement;
	readonly nameElem: HTMLAnchorElement;
	readonly enchantElem: HTMLAnchorElement;
	readonly reforgeElem: HTMLAnchorElement;
	readonly socketsContainerElem: HTMLElement;
	socketsElem: HTMLAnchorElement[] = [];

	constructor(parent: HTMLElement, root: HTMLElement, player: Player<any>) {
		super(parent, 'item-picker-root', root);
		this.player = player;

		const iconElem = ref<HTMLAnchorElement>();
		const nameElem = ref<HTMLAnchorElement>();
		const enchantElem = ref<HTMLAnchorElement>();
		const reforgeElem = ref<HTMLAnchorElement>();
		const sce = ref<HTMLDivElement>();
		this.rootElem.appendChild(
			<>
				<div className="item-picker-icon-wrapper">
					<Link ref={iconElem} className="item-picker-icon" />
					<div ref={sce} className="item-picker-sockets-container"></div>
				</div>
				<div className="item-picker-labels-container">
					<Link ref={nameElem} className="item-picker-name" />
					<Link ref={enchantElem} className="item-picker-enchant hide" />
					<Link ref={reforgeElem} className="item-picker-reforge hide" />
				</div>
			</>,
		);

		this.iconElem = iconElem.value!;
		this.nameElem = nameElem.value!;
		this.reforgeElem = reforgeElem.value!;
		this.enchantElem = enchantElem.value!;
		this.socketsContainerElem = sce.value!;
	}

	clear() {
		this.nameElem.removeAttribute('data-wowhead');
		this.nameElem.removeAttribute('href');
		this.iconElem.removeAttribute('data-wowhead');
		this.iconElem.removeAttribute('href');
		this.enchantElem.removeAttribute('data-wowhead');
		this.enchantElem.removeAttribute('href');
		this.enchantElem.classList.add('hide');
		this.reforgeElem.classList.add('hide');

		this.iconElem.style.backgroundImage = '';
		this.enchantElem.innerText = '';
		this.reforgeElem.innerText = '';
		this.socketsContainerElem.innerText = '';
		this.socketsElem = [];
		this.nameElem.textContent = '';
	}

	update(newItem: EquippedItem) {
		this.nameElem.textContent = newItem.item.name;

		if (newItem.randomSuffix) {
			this.nameElem.textContent += ' ' + newItem.randomSuffix.name;
		}

		if (newItem.item.heroic) {
			this.nameElem.insertAdjacentElement('beforeend', createHeroicLabel());
		} else {
			this.nameElem.querySelector('.heroic-label')?.remove();
		}

		if (newItem.reforge) {
			const reforgeData = this.player.getReforgeData(newItem, newItem.reforge);
			const fromText = shortSecondaryStatNames.get(newItem.reforge?.fromStat[0]);
			const toText = shortSecondaryStatNames.get(newItem.reforge?.toStat[0]);
			this.reforgeElem.innerText = `Reforged ${Math.abs(reforgeData.fromAmount)} ${fromText} → ${reforgeData.toAmount} ${toText}`;
			this.reforgeElem.classList.remove('hide');
		} else {
			this.reforgeElem.innerText = '';
			this.reforgeElem.classList.add('hide');
		}

		setItemQualityCssClass(this.nameElem, newItem.item.quality);

		this.player.setWowheadData(newItem, this.iconElem);
		this.player.setWowheadData(newItem, this.nameElem);

		newItem
			.asActionId()
			.fill()
			.then(filledId => {
				filledId.setBackgroundAndHref(this.iconElem);
				filledId.setWowheadHref(this.nameElem);
			});

		if (newItem.enchant) {
			getEnchantDescription(newItem.enchant).then(description => {
				this.enchantElem.textContent = description;
			});
			// Make enchant text hover have a tooltip.
			if (newItem.enchant.spellId) {
				this.enchantElem.href = ActionId.makeSpellUrl(newItem.enchant.spellId);
				ActionId.makeSpellTooltipData(newItem.enchant.spellId).then(url => {
					this.enchantElem.dataset.wowhead = url;
				});
			} else {
				this.enchantElem.href = ActionId.makeItemUrl(newItem.enchant.itemId);
				ActionId.makeItemTooltipData(newItem.enchant.itemId).then(url => {
					this.enchantElem.dataset.wowhead = url;
				});
			}
			this.enchantElem.dataset.whtticon = 'false';
			this.enchantElem.classList.remove('hide');
		} else {
			this.enchantElem.classList.add('hide');
		}

		newItem.allSocketColors().forEach((socketColor, gemIdx) => {
			const gemContainer = createGemContainer(socketColor, newItem.gems[gemIdx], gemIdx);
			if (gemIdx === newItem.numPossibleSockets - 1 && [ItemType.ItemTypeWrist, ItemType.ItemTypeHands].includes(newItem.item.type)) {
				const updateProfession = () => {
					if (this.player.isBlacksmithing()) {
						gemContainer.classList.remove('hide');
					} else {
						gemContainer.classList.add('hide');
					}
				};
				this.player.professionChangeEmitter.on(updateProfession);
				updateProfession();
			}
			this.socketsElem.push(gemContainer);
			this.socketsContainerElem.appendChild(gemContainer);
		});
	}
}

export class ItemPicker extends Component {
	readonly slot: ItemSlot;

	private readonly simUI: SimUI;
	private readonly player: Player<any>;

	private readonly onUpdateCallbacks: (() => void)[] = [];

	private readonly itemElem: ItemRenderer;
	private readonly gearPicker: GearPicker;

	// All items and enchants that are eligible for this slot
	private _equippedItem: EquippedItem | null = null;

	private quickSwapEnchantPopover: QuickSwapList<Enchant> | null = null;
	private quickSwapGemPopover: QuickSwapList<Gem>[] = [];

	constructor(parent: HTMLElement, gearPicker: GearPicker, simUI: SimUI, player: Player<any>, slot: ItemSlot) {
		super(parent, 'item-picker-root');

		this.gearPicker = gearPicker;
		this.simUI = simUI;
		this.player = player;
		this.slot = slot;
		this.itemElem = new ItemRenderer(parent, this.rootElem, player);

		this.item = player.getEquippedItem(slot);

		player.sim.waitForInit().then(() => {
			const openGearSelector = (event: Event) => {
				event.preventDefault();
				this.openSelectorModal(SelectorModalTabs.Items);
			};
			const openReforgeSelector = (event: Event) => {
				event.preventDefault();
				this.openSelectorModal(SelectorModalTabs.Reforging);
			};

			this.itemElem.iconElem.addEventListener('click', openGearSelector);
			this.itemElem.nameElem.addEventListener('click', openGearSelector);
			this.itemElem.reforgeElem.addEventListener('click', openReforgeSelector);
			this.addQuickEnchantHelpers();
		});

		player.gearChangeEmitter.on(() => {
			this.item = this.player.getEquippedItem(this.slot);
			if (this._equippedItem) {
				if (this._equippedItem !== this.quickSwapEnchantPopover?.item) {
					this.quickSwapEnchantPopover?.update({ item: this._equippedItem });
				}
				this.addQuickGemHelpers();
			}
		});

		player.sim.filtersChangeEmitter.on(() => {
			if (this._equippedItem) {
				this.quickSwapEnchantPopover?.update({ item: this._equippedItem });
				this.quickSwapGemPopover.forEach(quickSwap => quickSwap.update({ item: this._equippedItem! }));
			}
		});

		player.sim.showQuickSwapChangeEmitter.on(() => {
			this.quickSwapEnchantPopover?.tooltip?.[this.player.sim.getShowQuickSwap() ? 'enable' : 'disable']();
			this.quickSwapGemPopover.forEach(quickSwap => quickSwap.tooltip?.[this.player.sim.getShowQuickSwap() ? 'enable' : 'disable']());
		});

		player.professionChangeEmitter.on(() => {
			if (!!this._equippedItem) {
				this.player.setWowheadData(this._equippedItem, this.itemElem.iconElem);
			}
		});
	}

	createGearData(): GearData {
		return {
			equipItem: (eventID: EventID, equippedItem: EquippedItem | null) => {
				this.player.equipItem(eventID, this.slot, equippedItem);
			},
			getEquippedItem: () => this.player.getEquippedItem(this.slot),
			changeEvent: this.player.gearChangeEmitter,
		};
	}

	get item(): EquippedItem | null {
		return this._equippedItem;
	}

	set item(newItem: EquippedItem | null) {
		// Clear everything first
		this.itemElem.clear();
		// Clear quick swap gems array since gem sockets are rerendered every time
		this.quickSwapGemPopover = [];
		this.itemElem.nameElem.textContent = slotNames.get(this.slot) ?? '';
		setItemQualityCssClass(this.itemElem.nameElem, null);

		if (!!newItem) {
			this.itemElem.update(newItem);
		} else {
			this.itemElem.iconElem.style.backgroundImage = `url('${getEmptySlotIconUrl(this.slot)}')`;
		}

		this._equippedItem = newItem;
		this.onUpdateCallbacks.forEach(callback => callback());
	}

	onUpdate(callback: () => void) {
		this.onUpdateCallbacks.push(callback);
	}

	openSelectorModal(selectedTab: SelectorModalTabs) {
		this.gearPicker.selectorModal.openTab(this.slot, selectedTab, this.createGearData());
	}

	private addQuickGemHelpers() {
		if (!this._equippedItem) return;
		const openGemDetailTab = (socketIdx: number) => this.openSelectorModal(`Gem${socketIdx + 1}` as SelectorModalTabs);
		this.itemElem.socketsElem?.forEach(element => {
			const socketIdx = Number(element.dataset.socketIdx) || 0;
			element.addEventListener('click', event => {
				event.preventDefault();
				openGemDetailTab(0);
			});
			const popover = addQuickGemPopover(this.player, element, this._equippedItem!, this.slot, socketIdx, () => openGemDetailTab(socketIdx));
			if (!this.player.sim.getShowQuickSwap()) popover.tooltip?.disable();
			this.quickSwapGemPopover.push(popover);
		});
	}

	private addQuickEnchantHelpers() {
		if (!this._equippedItem) return;
		const openEnchantSelector = () => this.openSelectorModal(SelectorModalTabs.Enchants);
		this.itemElem.enchantElem.addEventListener('click', event => {
			event?.preventDefault();
			openEnchantSelector();
		});
		this.quickSwapEnchantPopover = addQuickEnchantPopover(this.player, this.itemElem.enchantElem, this._equippedItem, this.slot, openEnchantSelector);
		if (!this.player.sim.getShowQuickSwap()) this.quickSwapEnchantPopover.tooltip?.disable();
	}
}

export class IconItemSwapPicker extends Component {
	private readonly iconAnchor: HTMLAnchorElement;
	private readonly socketsContainerElem: HTMLElement;
	private readonly player: Player<any>;
	private readonly slot: ItemSlot;

	constructor(parent: HTMLElement, simUI: SimUI, player: Player<any>, slot: ItemSlot) {
		super(parent, 'icon-picker-root');
		this.rootElem.classList.add('icon-picker');
		this.player = player;
		this.slot = slot;

		this.iconAnchor = document.createElement('a');
		this.iconAnchor.classList.add('icon-picker-button');
		this.iconAnchor.target = '_blank';
		this.rootElem.prepend(this.iconAnchor);

		this.socketsContainerElem = document.createElement('div');
		this.socketsContainerElem.classList.add('item-picker-sockets-container');
		this.iconAnchor.appendChild(this.socketsContainerElem);

		const selectorModal = new SelectorModal(simUI.rootElem, simUI, this.player);

		player.sim.waitForInit().then(() => {
			this.iconAnchor.addEventListener('click', (event: Event) => {
				event.preventDefault();
				selectorModal.openTab(this.slot, SelectorModalTabs.Items, this.createGearData());
			});
		});

		player.itemSwapChangeEmitter.on(() => {
			this.update(player.getItemSwapGear().getEquippedItem(slot));
		});
	}

	update(newItem: EquippedItem | null) {
		this.iconAnchor.style.backgroundImage = `url('${getEmptySlotIconUrl(this.slot)}')`;
		this.iconAnchor.removeAttribute('data-wowhead');
		this.iconAnchor.href = '#';
		this.socketsContainerElem.innerText = '';

		if (newItem) {
			this.iconAnchor.classList.add('active');

			newItem.asActionId().fillAndSet(this.iconAnchor, true, true);
			this.player.setWowheadData(newItem, this.iconAnchor);

			newItem.allSocketColors().forEach((socketColor, gemIdx) => {
				this.socketsContainerElem.appendChild(createGemContainer(socketColor, newItem.gems[gemIdx], gemIdx));
			});
		} else {
			this.iconAnchor.classList.remove('active');
		}
	}

	private createGearData(): GearData {
		return {
			equipItem: (eventID: EventID, newItem: EquippedItem | null) => {
				this.player.equipItemSwapitem(eventID, this.slot, newItem);
			},
			getEquippedItem: () => this.player.getItemSwapItem(this.slot),
			changeEvent: this.player.itemSwapChangeEmitter,
		};
	}
}

export interface GearData {
	equipItem: (eventID: EventID, equippedItem: EquippedItem | null) => void;
	getEquippedItem: () => EquippedItem | null;
	changeEvent: TypedEvent<any>;
}

export enum SelectorModalTabs {
	Items = 'Items',
	RandomSuffixes = 'Random Suffix',
	Enchants = 'Enchants',
	Reforging = 'Reforging',
	Gem1 = 'Gem1',
	Gem2 = 'Gem2',
	Gem3 = 'Gem3',
}

export class SelectorModal extends BaseModal {
	private readonly simUI: SimUI;
	private player: Player<any>;
	private gearPicker: GearPicker | undefined;
	private ilists: ItemList<ItemListType>[] = [];

	private readonly itemSlotTabElems: HTMLElement[] = [];
	private readonly titleElem: HTMLElement;
	private readonly tabsElem: HTMLElement;
	private readonly contentElem: HTMLElement;

	private currentSlot: ItemSlot = ItemSlot.ItemSlotHead;
	private currentTab: SelectorModalTabs = SelectorModalTabs.Items;

	constructor(parent: HTMLElement, simUI: SimUI, player: Player<any>, gearPicker?: GearPicker) {
		super(parent, 'selector-modal', { disposeOnClose: false, size: 'xl' });

		this.simUI = simUI;
		this.player = player;
		this.gearPicker = gearPicker;

		this.addItemSlotTabs();

		this.header!.insertAdjacentElement(
			'afterbegin',
			<div>
				<h6 className="selector-modal-title" />
				<ul className="nav nav-tabs selector-modal-tabs"></ul>
			</div>,
		);

		this.body.appendChild(<div className="tab-content selector-modal-tab-content"></div>);

		this.titleElem = this.rootElem.querySelector<HTMLElement>('.selector-modal-title')!;
		this.tabsElem = this.rootElem.querySelector<HTMLElement>('.selector-modal-tabs')!;
		this.contentElem = this.rootElem.querySelector<HTMLElement>('.selector-modal-tab-content')!;

		this.body.appendChild(
			<div className="d-flex align-items-center form-text mt-3">
				<Icon icon="circle-exclamation" size="xl" className="me-2" />
				<span>
					If gear is missing, check the selected phase and your gear filters.
					<br />
					If the problem persists, save any un-saved data, click the
					<Icon icon="cog" className="mx-1" />
					to open your sim options, then click the "Restore Defaults".
				</span>
			</div>,
		);
	}

	openTab(selectedSlot: ItemSlot, selectedTab: SelectorModalTabs, gearData: GearData) {
		this.titleElem.textContent = slotNames.get(selectedSlot) ?? '';
		this.setData(selectedSlot, selectedTab, gearData);
		this.setActiveItemSlotTab(selectedSlot);
		this.open();
	}

	onShow() {
		if (this.gearPicker) {
			// Allow you to switch between gear picker slots with the up and down arrows
			const switchToPreviousItemSlotTab = this.switchToPreviousItemSlotTab.bind(this);
			const switchToNextItemSlotTab = this.switchToNextItemSlotTab.bind(this);

			document.addEventListener('keydown', switchToPreviousItemSlotTab);
			document.addEventListener('keydown', switchToNextItemSlotTab);

			this.addOnHideCallback(() => document.removeEventListener('keydown', switchToPreviousItemSlotTab));
			this.addOnHideCallback(() => document.removeEventListener('keydown', switchToNextItemSlotTab));
		}
	}

	private setData(selectedSlot: ItemSlot, selectedTab: SelectorModalTabs, gearData: GearData) {
		this.tabsElem.innerText = '';
		this.contentElem.innerText = '';
		this.ilists = [];

		const equippedItem = gearData.getEquippedItem();

		const eligibleItems = this.player.getItems(selectedSlot);
		const eligibleEnchants = this.player.getEnchants(selectedSlot);
		const eligibleReforges = equippedItem?.item ? this.player.getAvailableReforgings(equippedItem.getWithRandomSuffixStats()) : [];

		// If the enchant tab is selected but the item has no eligible enchants, default to items
		// If the reforge tab is selected but the item has no eligible reforges, default to items
		// If a gem tab is selected but the item has no eligible sockets, default to items
		if (
			(selectedTab === SelectorModalTabs.Enchants && !eligibleEnchants.length) ||
			(selectedTab === SelectorModalTabs.Reforging && !eligibleReforges.length) ||
			([SelectorModalTabs.Gem1, SelectorModalTabs.Gem2, SelectorModalTabs.Gem3].includes(selectedTab) &&
				equippedItem?.numSockets(this.player.isBlacksmithing()) === 0)
		) {
			selectedTab = SelectorModalTabs.Items;
		}

		this.currentTab = selectedTab;
		this.currentSlot = selectedSlot;

		this.addTab<Item>({
			label: SelectorModalTabs.Items,
			gearData,
			itemData: eligibleItems.map(item => {
				return {
					item: item,
					id: item.id,
					actionId: ActionId.fromItem(item),
					name: item.name,
					quality: item.quality,
					heroic: item.heroic,
					phase: item.phase,
					baseEP: this.player.computeItemEP(item, selectedSlot),
					ignoreEPFilter: false,
					onEquip: (eventID, item) => {
						const equippedItem = gearData.getEquippedItem();
						if (equippedItem) {
							gearData.equipItem(eventID, equippedItem.withItem(item));
						} else {
							gearData.equipItem(eventID, new EquippedItem(item));
						}
					},
				};
			}),
			computeEP: (item: Item) => this.player.computeItemEP(item, selectedSlot),
			equippedToItemFn: (equippedItem: EquippedItem | null) => equippedItem?.item,
			onRemove: (eventID: number) => {
				gearData.equipItem(eventID, null);
				this.removeTabs('Gem');
				this.removeTabs(SelectorModalTabs.RandomSuffixes);
			},
		});

		this.addTab<Enchant>({
			label: SelectorModalTabs.Enchants,
			gearData,
			itemData: eligibleEnchants.map(enchant => {
				return {
					item: enchant,
					id: enchant.effectId,
					actionId: enchant.itemId ? ActionId.fromItemId(enchant.itemId) : ActionId.fromSpellId(enchant.spellId),
					name: enchant.name,
					quality: enchant.quality,
					phase: enchant.phase || 1,
					baseEP: this.player.computeStatsEP(new Stats(enchant.stats)),
					ignoreEPFilter: true,
					heroic: false,
					onEquip: (eventID, enchant) => {
						const equippedItem = gearData.getEquippedItem();
						if (equippedItem) gearData.equipItem(eventID, equippedItem.withEnchant(enchant));
					},
				};
			}),
			computeEP: (enchant: Enchant) => this.player.computeEnchantEP(enchant),
			equippedToItemFn: (equippedItem: EquippedItem | null) => equippedItem?.enchant,
			onRemove: (eventID: number) => {
				const equippedItem = gearData.getEquippedItem();
				if (equippedItem) gearData.equipItem(eventID, equippedItem.withEnchant(null));
			},
		});

		this.addRandomSuffixTab(equippedItem, gearData);
		this.addReforgingTab(equippedItem, gearData);
		this.addGemTabs(selectedSlot, equippedItem, gearData);

		this.ilists.find(list => selectedTab === list.label)?.sizeRefresh();
	}

	private addItemSlotTabs() {
		if (!this.gearPicker) {
			return;
		}

		this.dialog.prepend(
			<div className="gear-picker-modal-slots">
				{this.gearPicker.itemPickers.map(picker => {
					const anchorRef = ref<HTMLAnchorElement>();
					const wrapper = (
						<div className="item-picker-icon-wrapper" dataset={{ slot: picker.slot }}>
							<a
								ref={anchorRef}
								className="item-picker-icon"
								href="javascript:void(0)"
								onclick={(e: Event) => {
									e.preventDefault();
									if (picker.slot != this.currentSlot) {
										picker.openSelectorModal(this.currentTab);
									}
								}}
								dataset={{ whtticon: 'false' }}
							/>
						</div>
					) as HTMLElement;

					picker.onUpdate(() => {
						if (picker.item) {
							this.player.setWowheadData(picker.item, anchorRef.value!);
							picker.item
								.asActionId()
								.fill()
								.then(filledId => {
									filledId.setBackgroundAndHref(anchorRef.value!);
								});
						} else {
							anchorRef.value!.style.backgroundImage = `url('${getEmptySlotIconUrl(picker.slot)}')`;
						}
					});
					tippy(anchorRef.value!, {
						content: `Edit ${slotNames.get(picker.slot)}`,
						placement: 'left',
					});
					this.itemSlotTabElems.push(wrapper);
					return wrapper;
				})}
			</div>,
		);
	}

	private setActiveItemSlotTab(slot: ItemSlot) {
		this.itemSlotTabElems.forEach(elem => {
			if (elem.dataset.slot === slot.toString()) {
				elem.classList.add('active');
			} else if (elem.classList.contains('active')) {
				elem.classList.remove('active');
			}
		});
	}

	private switchToPreviousItemSlotTab(event: KeyboardEvent) {
		if (event.key === 'ArrowUp' && this.gearPicker) {
			event.preventDefault();
			const newSlot = mod(this.currentSlot - 1, Object.keys(ItemSlot).length / 2) as unknown as ItemSlot;
			this.gearPicker.itemPickers[newSlot].openSelectorModal(this.currentTab);
		}
	}

	private switchToNextItemSlotTab(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' && this.gearPicker) {
			event.preventDefault();
			const newSlot = mod(this.currentSlot + 1, Object.keys(ItemSlot).length / 2) as unknown as ItemSlot;
			this.gearPicker.itemPickers[newSlot].openSelectorModal(this.currentTab);
		}
	}

	private addGemTabs(_slot: ItemSlot, equippedItem: EquippedItem | null, gearData: GearData) {
		if (!equippedItem) {
			return;
		}

		const socketBonusEP = this.player.computeStatsEP(new Stats(equippedItem.item.socketBonus)) / (equippedItem.item.gemSockets.length || 1);
		equippedItem.curSocketColors(this.player.isBlacksmithing()).forEach((socketColor, socketIdx) => {
			this.addTab<Gem>({
				label: SelectorModalTabs[`Gem${socketIdx + 1}` as keyof typeof SelectorModalTabs],
				gearData,
				itemData: this.player.getGems(socketColor).map((gem: Gem) => {
					return {
						item: gem,
						id: gem.id,
						actionId: ActionId.fromItemId(gem.id),
						name: gem.name,
						quality: gem.quality,
						phase: gem.phase,
						heroic: false,
						baseEP: this.player.computeStatsEP(new Stats(gem.stats)),
						ignoreEPFilter: true,
						onEquip: (eventID, gem) => {
							const equippedItem = gearData.getEquippedItem();
							if (equippedItem) gearData.equipItem(eventID, equippedItem.withGem(gem, socketIdx));
						},
					};
				}),
				computeEP: (gem: Gem) => {
					let gemEP = this.player.computeGemEP(gem);
					if (gemMatchesSocket(gem, socketColor)) {
						gemEP += socketBonusEP;
					}
					return gemEP;
				},
				equippedToItemFn: (equippedItem: EquippedItem | null) => equippedItem?.gems[socketIdx],
				onRemove: (eventID: number) => {
					const equippedItem = gearData.getEquippedItem();
					if (equippedItem) gearData.equipItem(eventID, equippedItem.withGem(null, socketIdx));
				},
				setTabContent: (tabAnchor: HTMLAnchorElement) => {
					const gemContainer = createGemContainer(socketColor, null, socketIdx);
					tabAnchor.appendChild(gemContainer);
					tabAnchor.classList.add('selector-modal-tab-gem');

					const gemElem = tabAnchor.querySelector<HTMLElement>('.gem-icon')!;
					const emptySocketUrl = getEmptyGemSocketIconUrl(socketColor);

					const updateGemIcon = () => {
						const equippedItem = gearData.getEquippedItem();
						const gem = equippedItem?.gems[socketIdx];

						if (gem) {
							gemElem.classList.remove('hide');
							ActionId.fromItemId(gem.id)
								.fill()
								.then(filledId => {
									gemElem.setAttribute('src', filledId.iconUrl);
								});
						} else {
							gemElem.classList.add('hide');
							gemElem.setAttribute('src', emptySocketUrl);
						}
					};

					gearData.changeEvent.on(updateGemIcon);
					this.addOnDisposeCallback(() => gearData.changeEvent.off(updateGemIcon));
					updateGemIcon();
				},
				socketColor,
			});
		});
	}

	private addRandomSuffixTab(equippedItem: EquippedItem | null, gearData: GearData) {
		if (!equippedItem || !equippedItem.item.randomSuffixOptions.length) {
			return;
		}

		const itemProto = equippedItem.item;

		this.addTab<ItemRandomSuffix>({
			label: SelectorModalTabs.RandomSuffixes,
			gearData,
			itemData: this.player.getRandomSuffixes(itemProto).map((randomSuffix: ItemRandomSuffix) => {
				return {
					item: randomSuffix,
					id: randomSuffix.id,
					actionId: ActionId.fromRandomSuffix(itemProto, randomSuffix),
					name: randomSuffix.name,
					quality: itemProto.quality,
					phase: itemProto.phase,
					heroic: false,
					baseEP: this.player.computeRandomSuffixEP(randomSuffix),
					ignoreEPFilter: true,
					onEquip: (eventID, randomSuffix) => {
						const equippedItem = gearData.getEquippedItem();
						if (equippedItem) gearData.equipItem(eventID, equippedItem.withItem(equippedItem.item).withRandomSuffix(randomSuffix));
					},
				};
			}),
			computeEP: (randomSuffix: ItemRandomSuffix) => this.player.computeRandomSuffixEP(randomSuffix),
			equippedToItemFn: (equippedItem: EquippedItem | null) => equippedItem?.randomSuffix,
			onRemove: (eventID: number) => {
				const equippedItem = gearData.getEquippedItem();
				if (equippedItem) gearData.equipItem(eventID, equippedItem.withRandomSuffix(null));
			},
		});
	}

	private addReforgingTab(equippedItem: EquippedItem | null, gearData: GearData) {
		if (!equippedItem || (equippedItem.hasRandomSuffixOptions() && !equippedItem.randomSuffix)) {
			return;
		}

		const itemProto = equippedItem.item;

		this.addTab<ReforgeData>({
			label: SelectorModalTabs.Reforging,
			gearData,
			itemData: this.player.getAvailableReforgings(equippedItem).map(reforgeData => {
				return {
					item: reforgeData,
					id: reforgeData.id,
					actionId: ActionId.fromReforge(itemProto, reforgeData.reforge),
					name: (
						<div>
							<span className="reforge-value negative">
								{reforgeData.fromAmount} {shortSecondaryStatNames.get(reforgeData.fromStat[0])}
							</span>
							<span className="reforge-value positive">
								+{reforgeData.toAmount} {shortSecondaryStatNames.get(reforgeData.toStat[0])}
							</span>
						</div>
					) as HTMLElement,
					quality: ItemQuality.ItemQualityCommon,
					phase: itemProto.phase,
					heroic: false,
					baseEP: this.player.computeReforgingEP(reforgeData),
					ignoreEPFilter: true,
					onEquip: (eventID, reforgeData) => {
						const equippedItem = gearData.getEquippedItem();
						if (equippedItem) gearData.equipItem(eventID, equippedItem.withReforge(reforgeData.reforge));
					},
				};
			}),
			computeEP: (reforge: ReforgeData) => this.player.computeReforgingEP(reforge),
			equippedToItemFn: (equippedItem: EquippedItem | null) =>
				equippedItem?.reforge ? this.player.getReforgeData(equippedItem, equippedItem.reforge) : null,
			onRemove: (eventID: number) => {
				const equippedItem = gearData.getEquippedItem();
				if (equippedItem) gearData.equipItem(eventID, equippedItem.withItem(equippedItem.item));
			},
		});
	}

	/**
	 * Adds one of the tabs for the item selector menu.
	 *
	 * T is expected to be Item, Enchant, or Gem. Tab menus for all 3 looks extremely
	 * similar so this function uses extra functions to do it generically.
	 */
	private addTab<T extends ItemListType>({
		label,
		gearData,
		itemData,
		computeEP,
		equippedToItemFn,
		onRemove,
		setTabContent,
		socketColor,
	}: {
		label: SelectorModalTabs;
		gearData: GearData;
		itemData: ItemData<T>[];
		computeEP: (item: T) => number;
		equippedToItemFn: (equippedItem: EquippedItem | null) => T | null | undefined;
		onRemove: (eventID: EventID) => void;
		setTabContent?: (tabElem: HTMLAnchorElement) => void;
		socketColor?: GemColor;
	}) {
		if (!itemData.length) {
			return;
		}

		const tabContentId = (label + '-tab').split(' ').join('');
		const selected = label === this.currentTab;

		const tabAnchor = ref<HTMLAnchorElement>();
		this.tabsElem.appendChild(
			<li className="nav-item">
				<a
					ref={tabAnchor}
					className={`nav-link selector-modal-item-tab ${selected ? 'active' : ''}`}
					dataset={{
						label: label,
						contentId: tabContentId,
						bsToggle: 'tab',
						bsTarget: `#${tabContentId}`,
					}}
					attributes={{
						role: 'tab',
						'aria-selected': selected,
					}}
					type="button"></a>
			</li>,
		);

		if (setTabContent) {
			setTabContent(tabAnchor.value!);
		} else {
			tabAnchor.value!.textContent = label;
		}

		const ilist = new ItemList(
			this.contentElem,
			this.simUI,
			this.currentSlot,
			this.currentTab,
			this.player,
			label,
			gearData,
			itemData,
			socketColor || GemColor.GemColorUnknown,
			computeEP,
			equippedToItemFn,
			onRemove,
			itemData => {
				const item = itemData;
				itemData.onEquip(TypedEvent.nextEventID(), item.item);

				const isItemChange = Item.is(item.item);
				const isRandomSuffixChange = !!item.actionId.randomSuffixId;
				// If the item changes, then gem slots and random suffix options will also change, so remove and recreate these tabs.
				if (isItemChange || isRandomSuffixChange) {
					if (!isRandomSuffixChange) {
						this.removeTabs(SelectorModalTabs.RandomSuffixes);
						this.addRandomSuffixTab(gearData.getEquippedItem(), gearData);
					}

					this.removeTabs(SelectorModalTabs.Reforging);
					this.addReforgingTab(gearData.getEquippedItem(), gearData);

					this.removeTabs('Gem');
					this.addGemTabs(this.currentSlot, gearData.getEquippedItem(), gearData);
				}
			},
		);

		const invokeUpdate = () => {
			ilist.updateSelected();
		};
		const applyFilter = () => {
			ilist.applyFilters();
		};
		const hideOrShowEPValues = () => {
			ilist.hideOrShowEPValues();
		};
		// Add event handlers
		gearData.changeEvent.on(invokeUpdate);

		this.player.sim.phaseChangeEmitter.on(applyFilter);
		this.player.sim.filtersChangeEmitter.on(applyFilter);
		this.player.sim.showEPValuesChangeEmitter.on(hideOrShowEPValues);

		this.addOnDisposeCallback(() => {
			gearData.changeEvent.off(invokeUpdate);
			this.player.sim.phaseChangeEmitter.off(applyFilter);
			this.player.sim.filtersChangeEmitter.off(applyFilter);
			this.player.sim.showEPValuesChangeEmitter.off(hideOrShowEPValues);
			ilist.dispose();
		});

		tabAnchor.value!.addEventListener('click', _event => {
			this.currentTab = label;
		});
		tabAnchor.value!.addEventListener('shown.bs.tab', _event => {
			ilist.sizeRefresh();
		});

		this.ilists.push(ilist as unknown as ItemList<ItemListType>);
	}

	private removeTabs(labelSubstring: string) {
		const tabElems = Array.prototype.slice
			.call(this.tabsElem.getElementsByClassName('selector-modal-item-tab'))
			.filter(tab => tab.dataset.label.includes(labelSubstring));

		const contentElems = tabElems.map(tabElem => document.getElementById(tabElem.dataset.contentId!)).filter(tabElem => Boolean(tabElem));

		tabElems.forEach(elem => elem.parentElement.remove());
		contentElems.forEach(elem => elem!.remove());
	}
}

export interface ItemData<T extends ItemListType> {
	item: T;
	name: string | HTMLElement;
	id: number;
	actionId: ActionId;
	quality: ItemQuality;
	phase: number;
	baseEP: number;
	ignoreEPFilter: boolean;
	heroic: boolean;
	onEquip: (eventID: EventID, item: T) => void;
}

interface ItemDataWithIdx<T extends ItemListType> {
	idx: number;
	data: ItemData<T>;
}

const emptySlotIcons: Record<ItemSlot, string> = {
	[ItemSlot.ItemSlotHead]: '/cata/assets/item_slots/head.jpg',
	[ItemSlot.ItemSlotNeck]: '/cata/assets/item_slots/neck.jpg',
	[ItemSlot.ItemSlotShoulder]: '/cata/assets/item_slots/shoulders.jpg',
	[ItemSlot.ItemSlotBack]: '/cata/assets/item_slots/shirt.jpg',
	[ItemSlot.ItemSlotChest]: '/cata/assets/item_slots/chest.jpg',
	[ItemSlot.ItemSlotWrist]: '/cata/assets/item_slots/wrists.jpg',
	[ItemSlot.ItemSlotHands]: '/cata/assets/item_slots/hands.jpg',
	[ItemSlot.ItemSlotWaist]: '/cata/assets/item_slots/waist.jpg',
	[ItemSlot.ItemSlotLegs]: '/cata/assets/item_slots/legs.jpg',
	[ItemSlot.ItemSlotFeet]: '/cata/assets/item_slots/feet.jpg',
	[ItemSlot.ItemSlotFinger1]: '/cata/assets/item_slots/finger.jpg',
	[ItemSlot.ItemSlotFinger2]: '/cata/assets/item_slots/finger.jpg',
	[ItemSlot.ItemSlotTrinket1]: '/cata/assets/item_slots/trinket.jpg',
	[ItemSlot.ItemSlotTrinket2]: '/cata/assets/item_slots/trinket.jpg',
	[ItemSlot.ItemSlotMainHand]: '/cata/assets/item_slots/mainhand.jpg',
	[ItemSlot.ItemSlotOffHand]: '/cata/assets/item_slots/offhand.jpg',
	[ItemSlot.ItemSlotRanged]: '/cata/assets/item_slots/ranged.jpg',
};
export function getEmptySlotIconUrl(slot: ItemSlot): string {
	return emptySlotIcons[slot];
}

type ItemListType = Item | Enchant | Gem | ReforgeData | ItemRandomSuffix;
enum ItemListSortBy {
	EP,
	ILVL,
}

export class ItemList<T extends ItemListType> {
	private listElem: HTMLElement;
	private readonly player: Player<any>;
	public label: string;
	private slot: ItemSlot;
	private itemData: Array<ItemData<T>>;
	private itemsToDisplay: Array<number>;
	private currentFilters: DatabaseFilters;
	private searchInput: HTMLInputElement;
	private socketColor: GemColor;
	private computeEP: (item: T) => number;
	private equippedToItemFn: (equippedItem: EquippedItem | null) => T | null | undefined;
	private gearData: GearData;
	private tabContent: Element;
	private onItemClick: (itemData: ItemData<T>) => void;
	private scroller: Clusterize;

	private sortBy = ItemListSortBy.ILVL;
	private sortDirection = SortDirection.DESC;

	constructor(
		parent: HTMLElement,
		simUI: SimUI,
		currentSlot: ItemSlot,
		currentTab: SelectorModalTabs,
		player: Player<any>,
		label: string,
		gearData: GearData,
		itemData: Array<ItemData<T>>,
		socketColor: GemColor,
		computeEP: (item: T) => number,
		equippedToItemFn: (equippedItem: EquippedItem | null) => T | null | undefined,
		onRemove: (eventID: EventID) => void,
		onItemClick: (itemData: ItemData<T>) => void,
	) {
		this.label = label;
		this.player = player;
		this.itemData = itemData;
		this.socketColor = socketColor;
		this.computeEP = computeEP;
		this.equippedToItemFn = equippedToItemFn;
		this.onItemClick = onItemClick;

		this.slot = currentSlot;
		this.gearData = gearData;
		this.currentFilters = this.player.sim.getFilters();

		const tabContentId = (label + '-tab').split(' ').join('');
		const selected = label === currentTab;
		const itemLabel = label === SelectorModalTabs.Reforging ? 'Reforge' : 'Item';

		const sortByIlvl = (event: MouseEvent) => {
			event.preventDefault();
			this.sort(ItemListSortBy.ILVL);
		};
		const sortByEP = (event: MouseEvent) => {
			event.preventDefault();
			this.sort(ItemListSortBy.EP);
		};

		const searchRef = ref<HTMLInputElement>();
		const epButtonRef = ref<HTMLButtonElement>();
		const filtersButtonRef = ref<HTMLButtonElement>();
		const showEpValuesRef = ref<HTMLDivElement>();
		const phaseSelectorRef = ref<HTMLDivElement>();
		const matchingGemsRef = ref<HTMLDivElement>();
		const show1hWeaponRef = ref<HTMLDivElement>();
		const show2hWeaponRef = ref<HTMLDivElement>();
		const modalListRef = ref<HTMLUListElement>();
		const simAllButtonRef = ref<HTMLButtonElement>();
		const removeButtonRef = ref<HTMLButtonElement>();

		this.tabContent = (
			<div id={tabContentId} className={`selector-modal-tab-pane tab-pane fade ${selected ? 'active show' : ''}`}>
				<div className="selector-modal-filters">
					<input className="selector-modal-search form-control" type="text" placeholder="Search..." />
					{label === SelectorModalTabs.Items && (
						<Button variant="primary" className="selector-modal-filters-button">
							Filters
						</Button>
					)}
					<div ref={phaseSelectorRef} className="selector-modal-phase-selector"></div>
					<div ref={show1hWeaponRef} className="sim-input selector-modal-boolean-option selector-modal-show-1h-weapons"></div>
					<div ref={show2hWeaponRef} className="sim-input selector-modal-boolean-option selector-modal-show-2h-weapons"></div>
					<div ref={matchingGemsRef} className="sim-input selector-modal-boolean-option selector-modal-show-matching-gems"></div>
					<div ref={showEpValuesRef} className="sim-input selector-modal-boolean-option selector-modal-show-ep-values"></div>
					<Button variant="warning" className="selector-modal-simall-button">
						Add to Batch Sim
					</Button>
					<Button variant="danger" className="selector-modal-remove-button">
						Unequip Item
					</Button>
				</div>
				<div className="selector-modal-list-labels">
					<label className="item-label">
						<small>{itemLabel}</small>
					</label>
					{label === SelectorModalTabs.Items && (
						<>
							<label className="source-label">
								<small>Source</small>
							</label>
							<label className="ilvl-label interactive" onclick={sortByIlvl}>
								<small>ILvl</small>
							</label>
						</>
					)}
					<label className="ep-label interactive" onclick={sortByEP}>
						<small>EP</small>
						<Icon icon="plus-minus" size="2xs" />
						<Button ref={epButtonRef} variant="link" className="p-0 ms-1" iconLeft={<Icon icon="question-circle" size="lg" />} />
					</label>
					<label className="favorite-label"></label>
				</div>
				<ul ref={modalListRef} className="selector-modal-list"></ul>
			</div>
		);

		parent.appendChild(this.tabContent);

		tippy(epButtonRef.value!, {
			content: EP_TOOLTIP,
		});

		if (
			label === SelectorModalTabs.Items &&
			(currentSlot === ItemSlot.ItemSlotMainHand || (currentSlot === ItemSlot.ItemSlotOffHand && player.getClass() === Class.ClassWarrior))
		) {
			if (show1hWeaponRef.value) makeShow1hWeaponsSelector(show1hWeaponRef.value, player.sim);
			if (show2hWeaponRef.value) makeShow2hWeaponsSelector(show2hWeaponRef.value, player.sim);
		}

		if (showEpValuesRef.value) makeShowEPValuesSelector(showEpValuesRef.value, player.sim);

		if (matchingGemsRef.value) {
			makeShowMatchingGemsSelector(matchingGemsRef.value, player.sim);
			if (!label.startsWith('Gem')) {
				matchingGemsRef.value?.classList.add('hide');
			}
		}

		if (phaseSelectorRef.value) makePhaseSelector(phaseSelectorRef.value, player.sim);

		if (label === SelectorModalTabs.Items) {
			const filtersMenu = new FiltersMenu(parent, player, currentSlot);
			filtersButtonRef.value?.addEventListener('click', () => filtersMenu.open());
		}

		this.listElem = modalListRef.value!;
		this.itemsToDisplay = [];

		this.scroller = new Clusterize(
			{
				getNumberOfRows: () => {
					return this.itemsToDisplay.length;
				},
				generateRows: (startIdx, endIdx) => {
					const items = [];
					for (let i = startIdx; i < endIdx; ++i) {
						if (i >= this.itemsToDisplay.length) break;
						items.push(this.createItemElem({ idx: this.itemsToDisplay[i], data: this.itemData[this.itemsToDisplay[i]] }));
					}
					return items;
				},
			},
			{
				rows: [],
				scroll_elem: this.listElem,
				content_elem: this.listElem,
				item_height: 56,
				show_no_data_row: false,
				no_data_text: '',
				tag: 'li',
				rows_in_block: 16,
				blocks_in_cluster: 2,
			},
		);

		const removeButton = removeButtonRef.value;
		if (removeButton) {
			removeButton.addEventListener('click', _event => {
				onRemove(TypedEvent.nextEventID());
			});

			switch (label) {
				case SelectorModalTabs.Enchants:
					removeButton.textContent = 'Remove Enchant';
					break;
				case SelectorModalTabs.Reforging:
					removeButton.textContent = 'Remove Reforge';
					break;
				case SelectorModalTabs.Gem1:
				case SelectorModalTabs.Gem2:
				case SelectorModalTabs.Gem3:
					removeButton.textContent = 'Remove Gem';
					break;
			}
		}

		this.updateSelected();

		this.searchInput = searchRef.value!;
		this.searchInput.addEventListener('input', () => this.applyFilters());

		const simAllButton = simAllButtonRef.value;
		if (simAllButton) {
			if (label === SelectorModalTabs.Items) {
				simAllButton.hidden = !player.sim.getShowExperimental();
				player.sim.showExperimentalChangeEmitter.on(() => {
					simAllButton.hidden = !player.sim.getShowExperimental();
				});
				simAllButton.addEventListener('click', _event => {
					if (simUI instanceof IndividualSimUI) {
						const itemSpecs = Array<ItemSpec>();
						const isRangedOrTrinket =
							this.slot === ItemSlot.ItemSlotRanged || this.slot === ItemSlot.ItemSlotTrinket1 || this.slot === ItemSlot.ItemSlotTrinket2;

						const curItem = this.equippedToItemFn(this.player.getEquippedItem(this.slot));
						let curEP = 0;
						if (!!curItem) {
							curEP = this.computeEP(curItem);
						}

						for (const i of this.itemsToDisplay) {
							const idata = this.itemData[i];
							if (!isRangedOrTrinket && curEP > 0 && idata.baseEP < curEP / 2) {
								continue; // If we have EPs on current item, dont sim items with less than half the EP.
							}

							// Add any item that is either >0 EP or a trinket/ranged item.
							if (idata.baseEP > 0 || isRangedOrTrinket) {
								itemSpecs.push(ItemSpec.create({ id: idata.id }));
							}
						}
						simUI.bt.addItems(itemSpecs);
						// TODO: should we open the bulk sim UI or should we run in the background showing progress, and then sort the items in the picker?
					}
				});
			} else {
				// always hide non-items from being added to batch.
				simAllButton.hidden = true;
			}
		}
	}

	public sizeRefresh() {
		this.scroller.refresh(true);
		this.applyFilters();
	}

	public dispose() {
		this.scroller.dispose();
	}

	private getUpdateType(item: ItemListType | null | undefined) {
		if (!item) return null;
		const itemProperties = Object.keys(item);
		if ('reforge' in item && !!item.reforge) return 'reforge';
		else if ('enchantType' in item) return 'enchant';
		else if ('color' in item) return 'gem';
		else if (itemProperties.length === 3 && 'name' in item && item.id && item.name && item.stats) return 'randomSuffix';
		else return 'item';
	}

	private getItemIdByUpdateType(item: ItemListType | null | undefined) {
		if (!item) return null;
		const updateType = this.getUpdateType(item);
		switch (updateType) {
			case 'reforge':
				return (item as ReforgeData).reforge!.id;
			case 'enchant':
				return (item as Enchant).effectId;
			case 'item':
			case 'gem':
			case 'randomSuffix':
				return (item as Item | Gem | ItemRandomSuffix).id;
			default:
				return null;
		}
	}

	public updateSelected() {
		const newEquippedItem = this.gearData.getEquippedItem();
		const newItem = this.equippedToItemFn(newEquippedItem);
		const newItemId = this.getItemIdByUpdateType(newItem);
		const newEP = newItem ? this.computeEP(newItem) : 0;

		this.scroller.elementUpdate(item => {
			const idx = (item as HTMLElement).dataset.idx!;
			const itemData = this.itemData[parseFloat(idx)];

			if (itemData.id === newItemId) item.classList.add('active');
			else item.classList.remove('active');

			const epDeltaElem = item.querySelector<HTMLSpanElement>('.selector-modal-list-item-ep-delta');
			if (epDeltaElem) {
				epDeltaElem.textContent = '';
				if (itemData.item) {
					const listItemEP = this.computeEP(itemData.item);
					if (newEP !== listItemEP) {
						formatDeltaTextElem(epDeltaElem, newEP, listItemEP, 0);
					}
				}
			}
		});
	}

	public applyFilters() {
		this.currentFilters = this.player.sim.getFilters();
		let itemIdxs = new Array<number>(this.itemData.length);
		for (let i = 0; i < this.itemData.length; ++i) {
			itemIdxs[i] = i;
		}

		const currentEquippedItem = this.player.getEquippedItem(this.slot);
		const newItem = this.equippedToItemFn(currentEquippedItem);
		const type = this.getUpdateType(newItem);

		if (type === 'item' || this.label === SelectorModalTabs.Items)
			itemIdxs = this.player.filterItemData(itemIdxs, i => this.itemData[i].item as unknown as Item, this.slot);
		else if (type === 'enchant' || this.label === SelectorModalTabs.Enchants)
			itemIdxs = this.player.filterEnchantData(itemIdxs, i => this.itemData[i].item as unknown as Enchant, this.slot, currentEquippedItem);
		else if (type === 'gem') itemIdxs = this.player.filterGemData(itemIdxs, i => this.itemData[i].item as unknown as Gem, this.slot, this.socketColor);

		itemIdxs = itemIdxs.filter(i => {
			const listItemData = this.itemData[i];

			if (listItemData.phase > this.player.sim.getPhase()) {
				return false;
			}

			if (!!this.searchInput.value.length) {
				const formatQuery = (value: string) => value.toLowerCase().replaceAll(/[^a-zA-Z0-9\s]/g, '');

				const searchQuery = formatQuery(this.searchInput.value).split(' ');
				const name = formatQuery(listItemData.name.toString());

				let include = true;
				searchQuery.some(v => {
					if (!name.includes(v)) include = false;
				});
				if (!include) {
					return false;
				}
			}

			return true;
		});

		if ([ItemSlot.ItemSlotTrinket1, ItemSlot.ItemSlotTrinket2].includes(this.slot)) {
			// Trinket EP is weird so just sort by ilvl instead.
			this.sortBy = ItemListSortBy.ILVL;
		} else {
			this.sortBy = ItemListSortBy.EP;
		}

		itemIdxs = this.sortIdxs(itemIdxs);

		this.itemsToDisplay = itemIdxs;
		this.scroller.update();

		this.hideOrShowEPValues();
	}

	public sort(sortBy: ItemListSortBy) {
		if (this.sortBy === sortBy) {
			this.sortDirection = 1 - this.sortDirection;
		} else {
			this.sortDirection = SortDirection.DESC;
		}
		this.sortBy = sortBy;
		this.itemsToDisplay = this.sortIdxs(this.itemsToDisplay);
		this.scroller.update();
	}

	private sortIdxs(itemIdxs: Array<number>): number[] {
		let sortFn = (itemA: T, itemB: T) => {
			const first = this.sortDirection === SortDirection.DESC ? itemB : itemA;
			const second = this.sortDirection === SortDirection.DESC ? itemA : itemB;
			const diff = this.computeEP(first) - this.computeEP(second);
			// if EP is same, sort by ilvl
			if (Math.abs(diff) < 0.01) return (first as unknown as Item).ilvl - (second as unknown as Item).ilvl;
			return diff;
		};
		switch (this.sortBy) {
			case ItemListSortBy.ILVL:
				sortFn = (itemA: T, itemB: T) => {
					const first = this.sortDirection === SortDirection.DESC ? itemB : itemA;
					const second = this.sortDirection === SortDirection.DESC ? itemA : itemB;
					return (first as unknown as Item).ilvl - (second as unknown as Item).ilvl;
				};
				break;
		}

		return itemIdxs.sort((dataA, dataB) => {
			const itemA = this.itemData[dataA];
			const itemB = this.itemData[dataB];
			if (this.isItemFavorited(itemA) && !this.isItemFavorited(itemB)) return -1;
			if (this.isItemFavorited(itemB) && !this.isItemFavorited(itemA)) return 1;

			return sortFn(itemA.item, itemB.item);
		});
	}

	public hideOrShowEPValues() {
		const labels = this.tabContent.querySelectorAll('.ep-label');
		const container = this.tabContent.querySelectorAll('.selector-modal-list');
		const show = this.player.sim.getShowEPValues();
		const display = show ? '' : 'none';

		for (const label of labels) {
			(label as HTMLElement).style.display = display;
		}

		for (const c of container) {
			if (show) c.classList.remove('hide-ep');
			else c.classList.add('hide-ep');
		}
	}

	private createItemElem(item: ItemDataWithIdx<T>): JSX.Element {
		const itemData = item.data;
		const itemEP = this.computeEP(itemData.item);

		const equippedItem = this.equippedToItemFn(this.gearData.getEquippedItem());
		const equippedItemID = equippedItem
			? this.label === 'Enchants'
				? (equippedItem as unknown as Enchant).effectId
				: (equippedItem as unknown as Item).id
			: 0;
		const equippedItemEP = equippedItem ? this.computeEP(equippedItem) : 0;

		const nameElem = ref<HTMLLabelElement>();
		const anchorElem = ref<HTMLAnchorElement>();
		const iconElem = ref<HTMLImageElement>();
		const favoriteElem = ref<HTMLButtonElement>();
		const favoriteIconElem = ref<HTMLElement>();

		const listItemElem = (
			<li className={`selector-modal-list-item ${equippedItemID === itemData.id ? 'active' : ''}`} dataset={{ idx: item.idx.toString() }}>
				<div className="selector-modal-list-label-cell">
					<Link className="selector-modal-list-item-link" ref={anchorElem} dataset={{ whtticon: 'false' }}>
						<img className="selector-modal-list-item-icon" ref={iconElem}></img>
						<label className="selector-modal-list-item-name" ref={nameElem}>
							{itemData.name}
							{itemData.heroic && createHeroicLabel()}
						</label>
					</Link>
				</div>
				{this.label === SelectorModalTabs.Items && (
					<>
						<div className="selector-modal-list-item-source-container">{this.getSourceInfo(itemData.item as unknown as Item, this.player.sim)}</div>
						<div className="selector-modal-list-item-ilvl-container">{(itemData.item as unknown as Item).ilvl}</div>
					</>
				)}
				{![ItemSlot.ItemSlotTrinket1, ItemSlot.ItemSlotTrinket2].includes(this.slot) && (
					<div className="selector-modal-list-item-ep">
						<span className="selector-modal-list-item-ep-value">
							{itemEP < 9.95 ? itemEP.toFixed(1).toString() : Math.round(itemEP).toString()}
						</span>
						<span
							className="selector-modal-list-item-ep-delta"
							ref={e => itemData.item && equippedItemEP !== itemEP && formatDeltaTextElem(e, equippedItemEP, itemEP, 0)}></span>
					</div>
				)}
				<div className="selector-modal-list-item-favorite-container">
					<Button
						ref={favoriteElem}
						variant="link"
						className="selector-modal-list-item-favorite p-0"
						onclick={() => setFavorite(listItemElem.dataset.fav == 'false')}
						iconLeft={<Icon icon="star" size="xl" />}
					/>
				</div>
			</li>
		);

		anchorElem.value!.addEventListener('click', (event: Event) => {
			event.preventDefault();
			if (event.target === favoriteElem.value) return false;
			this.onItemClick(itemData);
		});

		itemData.actionId.fill().then(filledId => {
			filledId.setWowheadHref(anchorElem.value!);
			iconElem.value!.src = filledId.iconUrl;
		});

		setItemQualityCssClass(nameElem.value!, itemData.quality);

		tippy(favoriteElem.value!, {
			content: 'Add to favorites',
		});

		const setFavorite = (isFavorite: boolean) => {
			const filters = this.player.sim.getFilters();
			if (this.label === SelectorModalTabs.Items) {
				const favId = itemData.id;
				if (isFavorite) {
					filters.favoriteItems.push(favId);
				} else {
					const favIdx = filters.favoriteItems.indexOf(favId);
					if (favIdx !== -1) {
						filters.favoriteItems.splice(favIdx, 1);
					}
				}
			} else if (this.label === 'Enchants') {
				const favId = getUniqueEnchantString(itemData.item as unknown as Enchant);
				if (isFavorite) {
					filters.favoriteEnchants.push(favId);
				} else {
					const favIdx = filters.favoriteEnchants.indexOf(favId);
					if (favIdx !== -1) {
						filters.favoriteEnchants.splice(favIdx, 1);
					}
				}
			} else if (this.label.startsWith('Gem')) {
				const favId = itemData.id;
				if (isFavorite) {
					filters.favoriteGems.push(favId);
				} else {
					const favIdx = filters.favoriteGems.indexOf(favId);
					if (favIdx !== -1) {
						filters.favoriteGems.splice(favIdx, 1);
					}
				}
			}
			favoriteIconElem.value?.classList.toggle('fas');
			favoriteIconElem.value?.classList.toggle('far');
			listItemElem.dataset.fav = isFavorite.toString();

			this.player.sim.setFilters(TypedEvent.nextEventID(), filters);
		};

		const isFavorite = this.isItemFavorited(itemData);

		if (isFavorite) {
			favoriteIconElem.value?.classList.add('fas');
			listItemElem.dataset.fav = 'true';
		} else {
			favoriteIconElem.value?.classList.add('far');
			listItemElem.dataset.fav = 'false';
		}

		return listItemElem;
	}

	private isItemFavorited(itemData: ItemData<T>): boolean {
		if (this.label === SelectorModalTabs.Items) {
			return this.currentFilters.favoriteItems.includes(itemData.id);
		} else if (this.label === 'Enchants') {
			return this.currentFilters.favoriteEnchants.includes(getUniqueEnchantString(itemData.item as unknown as Enchant));
		} else if (this.label.startsWith('Gem')) {
			return this.currentFilters.favoriteGems.includes(itemData.id);
		}
		return false;
	}

	private getSourceInfo(item: Item, sim: Sim): JSX.Element {
		const makeAnchor = (href: string, inner: string | JSX.Element) => {
			return (
				<Link href={href} target="_blank" dataset={{ whtticon: 'false' }}>
					<small>{inner}</small>
				</Link>
			);
		};

		if (!item.sources?.length) {
			if (item.randomSuffixOptions.length) {
				return makeAnchor(`${ActionId.makeItemUrl(item.id)}#dropped-by`, 'World Drop');
			} else if (isPVPItem(item)) {
				const season = getPVPSeasonFromItem(item);
				if (!season) return <></>;

				return makeAnchor(
					ActionId.makeItemUrl(item.id),
					<span>
						{season}
						<br />
						PVP
					</span>,
				);
			}
			return <></>;
		}

		let source = item.sources[0];
		if (source.source.oneofKind === 'crafted') {
			const src = source.source.crafted;

			if (src.spellId) {
				return makeAnchor(ActionId.makeSpellUrl(src.spellId), professionNames.get(src.profession) ?? 'Unknown');
			}
			return makeAnchor(ActionId.makeItemUrl(item.id), professionNames.get(src.profession) ?? 'Unknown');
		} else if (source.source.oneofKind === 'drop') {
			const src = source.source.drop;
			const zone = sim.db.getZone(src.zoneId);
			const npc = sim.db.getNpc(src.npcId);
			if (!zone) {
				throw new Error('No zone found for item: ' + item);
			}

			const category = src.category ? ` - ${src.category}` : '';
			if (npc) {
				return makeAnchor(
					ActionId.makeNpcUrl(npc.id),
					<span>
						{zone.name} ({difficultyNames.get(src.difficulty) ?? 'Unknown'})
						<br />
						{npc.name + category}
					</span>,
				);
			} else if (src.otherName) {
				return makeAnchor(
					ActionId.makeZoneUrl(zone.id),
					<span>
						{zone.name}
						<br />
						{src.otherName}
					</span>,
				);
			}
			return makeAnchor(ActionId.makeZoneUrl(zone.id), zone.name);
		} else if (source.source.oneofKind === 'quest' && source.source.quest.name) {
			const src = source.source.quest;
			return makeAnchor(
				ActionId.makeQuestUrl(src.id),
				<span>
					Quest
					{item.factionRestriction === UIItem_FactionRestriction.ALLIANCE_ONLY && (
						<img src="/cata/assets/img/alliance.png" className="ms-1" width="15" height="15" />
					)}
					{item.factionRestriction === UIItem_FactionRestriction.HORDE_ONLY && (
						<img src="/cata/assets/img/horde.png" className="ms-1" width="15" height="15" />
					)}
					<br />
					{src.name}
				</span>,
			);
		} else if ((source = item.sources.find(source => source.source.oneofKind === 'rep') ?? source).source.oneofKind === 'rep') {
			const factionNames = item.sources
				.filter(source => source.source.oneofKind === 'rep')
				.map(source =>
					source.source.oneofKind === 'rep' ? REP_FACTION_NAMES[source.source.rep.repFactionId] : REP_FACTION_NAMES[RepFaction.RepFactionUnknown],
				);
			const src = source.source.rep;
			const npcId = REP_FACTION_QUARTERMASTERS[src.repFactionId];
			return makeAnchor(
				ActionId.makeNpcUrl(npcId),
				<>
					{factionNames.map(name => (
						<span>
							{name}
							{item.factionRestriction === UIItem_FactionRestriction.ALLIANCE_ONLY && (
								<img src="/cata/assets/img/alliance.png" className="ms-1" width="15" height="15" />
							)}
							{item.factionRestriction === UIItem_FactionRestriction.HORDE_ONLY && (
								<img src="/cata/assets/img/horde.png" className="ms-1" width="15" height="15" />
							)}
							<br />
						</span>
					))}
					<span>{REP_LEVEL_NAMES[src.repLevel]}</span>
				</>,
			);
		} else if (isPVPItem(item)) {
			const season = getPVPSeasonFromItem(item);
			if (!season) return <></>;

			return makeAnchor(
				ActionId.makeItemUrl(item.id),
				<span>
					{season}
					<br />
					PVP
				</span>,
			);
		} else if (source.source.oneofKind === 'soldBy') {
			const src = source.source.soldBy;
			return makeAnchor(
				ActionId.makeNpcUrl(src.npcId),
				<span>
					Sold by
					<br />
					{src.npcName}
				</span>,
			);
		}
		return <></>;
	}
}
