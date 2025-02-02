import { Tab } from 'bootstrap';
import clsx from 'clsx';
import { ref } from 'tsx-vanilla';

import { IndividualSimUI } from '../../individual_sim_ui';
import { BulkSettings, ProgressMetrics, TalentLoadout } from '../../proto/api';
import { GemColor, ItemSpec, SimDatabase, SimEnchant, SimGem, SimItem } from '../../proto/common';
import { SavedTalents, UIEnchant, UIGem, UIItem } from '../../proto/ui';
import { ActionId } from '../../proto_utils/action_id';
import { getEmptyGemSocketIconUrl } from '../../proto_utils/gems';
import { canEquipItem, getEligibleItemSlots, isSecondaryItemSlot } from '../../proto_utils/utils';
import { TypedEvent } from '../../typed_event';
import { getEnumValues } from '../../utils';
import { WorkerProgressCallback } from '../../worker_pool';
import { ItemData } from '../gear_picker/item_list';
import SelectorModal from '../gear_picker/selector_modal';
import { BulkGearJsonImporter } from '../importers/bulk_gear_json_importer';
import { BooleanPicker } from '../pickers/boolean_picker';
import { ResultsViewer } from '../results_viewer';
import { SimTab } from '../sim_tab';
import Toast from '../toast';
import BulkItemPickerGroup from './bulk/bulk_item_picker_group';
import BulkItemSearch from './bulk/bulk_item_search';
import BulkSimResultRenderer from './bulk/bulk_sim_results_renderer';
import GemSelectorModal from './bulk/gem_selector_modal';
import { BulkSimItemSlot, itemSlotToBulkSimItemSlot } from './bulk/utils';

export class BulkTab extends SimTab {
	readonly simUI: IndividualSimUI<any>;

	readonly itemsChangedEmitter = new TypedEvent<void>();
	readonly settingsChangedEmitter = new TypedEvent<void>();

	private readonly leftPanel: HTMLElement;
	private readonly rightPanel: HTMLElement;
	private readonly setupTabElem: HTMLElement;
	private readonly resultsTabElem: HTMLElement;
	private pendingDiv: HTMLDivElement;

	private setupTab: Tab;
	private resultsTab: Tab;
	private pendingResults: ResultsViewer;

	readonly selectorModal: SelectorModal;

	// The main array we will use to store items with indexes. Null values are the result of removed items to avoid having to shift pickers over and over.
	protected items: Array<ItemSpec | null> = new Array<ItemSpec | null>();
	// Separate Map used to store items broken down by item slot, specifically for combination generation
	protected itemsBySlot: Map<BulkSimItemSlot, Map<number, ItemSpec>> = new Map();
	protected pickerGroups: Array<BulkItemPickerGroup> = new Array<BulkItemPickerGroup>();

	// TODO: Make a real options probably
	doCombos: boolean;
	fastMode: boolean;
	autoGem: boolean;
	simTalents: boolean;
	autoEnchant: boolean;
	defaultGems: SimGem[];
	savedTalents: TalentLoadout[];
	gemIconElements: HTMLImageElement[];

	constructor(parentElem: HTMLElement, simUI: IndividualSimUI<any>) {
		super(parentElem, simUI, { identifier: 'bulk-tab', title: 'Batch (<span class="text-success">New</span>)' });

		this.simUI = simUI;

		getEnumValues<number>(BulkSimItemSlot).forEach(slot => {
			this.itemsBySlot.set(slot, new Map());
		});

		const leftPanelRef = ref<HTMLDivElement>();
		const rightPanelRef = ref<HTMLDivElement>();
		const setupTabBtnRef = ref<HTMLButtonElement>();
		const setupTabRef = ref<HTMLDivElement>();
		const resultsTabBtnRef = ref<HTMLButtonElement>();
		const resultsTabRef = ref<HTMLDivElement>();
		this.contentContainer.appendChild(
			<>
				<div className="bulk-tab-left tab-panel-left" ref={leftPanelRef}>
					<div className="bulk-tab-tabs">
						<ul className="nav nav-tabs" attributes={{ role: 'tablist' }}>
							<li className="nav-item" attributes={{ role: 'presentation' }}>
								<button
									className="nav-link active"
									type="button"
									attributes={{
										role: 'tab',
										// @ts-expect-error
										'aria-controls': 'bulkSetupTab',
										'aria-selected': true,
									}}
									dataset={{
										bsToggle: 'tab',
										bsTarget: `#bulkSetupTab`,
									}}
									ref={setupTabBtnRef}>
									Setup
								</button>
							</li>
							<li className="nav-item" attributes={{ role: 'presentation' }}>
								<button
									className="nav-link"
									type="button"
									attributes={{
										role: 'tab',
										// @ts-expect-error
										'aria-controls': 'bulkResultsTab',
										'aria-selected': false,
									}}
									dataset={{
										bsToggle: 'tab',
										bsTarget: `#bulkResultsTab`,
									}}
									ref={resultsTabBtnRef}>
									Results
								</button>
							</li>
						</ul>
						<div className="tab-content">
							<div id="bulkSetupTab" className="tab-pane fade active show" ref={setupTabRef} />
							<div id="bulkResultsTab" className="tab-pane fade show" ref={resultsTabRef}>
								<div className="d-flex align-items-center justify-content-center p-gap">Run a simulation to view results</div>
							</div>
						</div>
					</div>
				</div>
				<div className="bulk-tab-right tab-panel-right" ref={rightPanelRef} />
			</>,
		);

		this.leftPanel = leftPanelRef.value!;
		this.rightPanel = rightPanelRef.value!;
		this.setupTabElem = setupTabRef.value!;
		this.resultsTabElem = resultsTabRef.value!;
		this.pendingDiv = (<div className="results-pending-overlay" />) as HTMLDivElement;

		this.setupTab = new Tab(setupTabBtnRef.value!);
		this.resultsTab = new Tab(resultsTabBtnRef.value!);

		this.pendingResults = new ResultsViewer(this.pendingDiv);
		this.pendingResults.hideAll();
		this.selectorModal = new SelectorModal(this.simUI.rootElem, this.simUI, this.simUI.player, undefined, {
			id: 'bulk-selector-modal',
		});

		this.doCombos = true;
		this.fastMode = true;
		this.autoGem = true;
		this.autoEnchant = true;
		this.savedTalents = [];
		this.simTalents = false;
		this.defaultGems = [UIGem.create(), UIGem.create(), UIGem.create(), UIGem.create()];
		this.gemIconElements = [];

		this.buildTabContent();

		this.simUI.sim.waitForInit().then(() => {
			this.loadSettings();

			const loadEquippedItems = () => {
				this.simUI.player.getEquippedItems().forEach((equippedItem, slot) => {
					if (!!equippedItem) {
						getEligibleItemSlots(equippedItem.item).forEach(eligibleSlot => {
							// Avoid duplicating rings/trinkets
							if (isSecondaryItemSlot(slot) || !canEquipItem(equippedItem.item, this.simUI.player.getPlayerSpec(), eligibleSlot)) return;

							const bulkSlot = itemSlotToBulkSimItemSlot.get(eligibleSlot)!;
							const group = this.pickerGroups[bulkSlot];
							const idx = isSecondaryItemSlot(slot) ? -2 : -1;

							group.add(idx, equippedItem);
						});
					}
				});
			};
			loadEquippedItems();
			this.simUI.player.gearChangeEmitter.on(() => loadEquippedItems());
		});
	}

	private getSettingsKey(): string {
		return this.simUI.getStorageKey('bulk-settings.v1');
	}

	private loadSettings() {
		const storedSettings = window.localStorage.getItem(this.getSettingsKey());
		if (storedSettings != null) {
			const settings = BulkSettings.fromJsonString(storedSettings, {
				ignoreUnknownFields: true,
			});

			this.doCombos = settings.combinations;
			this.fastMode = settings.fastMode;
			this.autoEnchant = settings.autoEnchant;
			this.savedTalents = settings.talentsToSim;
			this.autoGem = settings.autoGem;
			this.simTalents = settings.simTalents;
			this.defaultGems = new Array<SimGem>(
				SimGem.create({ id: settings.defaultRedGem }),
				SimGem.create({ id: settings.defaultYellowGem }),
				SimGem.create({ id: settings.defaultBlueGem }),
				SimGem.create({ id: settings.defaultMetaGem }),
			);

			this.defaultGems.forEach((gem, idx) => {
				ActionId.fromItemId(gem.id)
					.fill()
					.then(filledId => {
						if (gem.id) {
							this.gemIconElements[idx].src = filledId.iconUrl;
							this.gemIconElements[idx].classList.remove('hide');
						}
					});
			});
		}
	}

	private storeSettings() {
		const settings = this.createBulkSettings();
		const setStr = BulkSettings.toJsonString(settings, { enumAsInteger: true });
		window.localStorage.setItem(this.getSettingsKey(), setStr);
	}

	protected createBulkSettings(): BulkSettings {
		return BulkSettings.create({
			items: this.getItems(),
			// TODO(Riotdog-GehennasEU): Make all of these configurable.
			// For now, it's always constant iteration combinations mode for "sim my bags".
			combinations: this.doCombos,
			fastMode: this.fastMode,
			autoEnchant: this.autoEnchant,
			autoGem: this.autoGem,
			simTalents: this.simTalents,
			talentsToSim: this.savedTalents,
			defaultRedGem: this.defaultGems[0].id,
			defaultYellowGem: this.defaultGems[1].id,
			defaultBlueGem: this.defaultGems[2].id,
			defaultMetaGem: this.defaultGems[3].id,
			iterationsPerCombo: this.simUI.sim.getIterations(), // TODO(Riotdog-GehennasEU): Define a new UI element for the iteration setting.
		});
	}

	protected createBulkItemsDatabase(): SimDatabase {
		const itemsDb = SimDatabase.create();
		for (const is of this.items.values()) {
			if (!is) continue;

			const item = this.simUI.sim.db.lookupItemSpec(is);
			if (!item) {
				throw new Error(`item with ID ${is.id} not found in database`);
			}
			itemsDb.items.push(SimItem.fromJson(UIItem.toJson(item.item), { ignoreUnknownFields: true }));
			if (item.enchant) {
				itemsDb.enchants.push(
					SimEnchant.fromJson(UIEnchant.toJson(item.enchant), {
						ignoreUnknownFields: true,
					}),
				);
			}
			for (const gem of item.gems) {
				if (gem) {
					itemsDb.gems.push(SimGem.fromJson(UIGem.toJson(gem), { ignoreUnknownFields: true }));
				}
			}
		}
		for (const gem of this.defaultGems) {
			if (gem.id > 0) {
				itemsDb.gems.push(gem);
			}
		}
		return itemsDb;
	}

	addItem(item: ItemSpec) {
		this.addItems([item]);
	}
	addItems(items: ItemSpec[]) {
		items.forEach(item => {
			const equippedItem = this.simUI.sim.db.lookupItemSpec(item);
			if (!!equippedItem) {
				const idx = this.items.push(item) - 1;

				getEligibleItemSlots(equippedItem.item).forEach(slot => {
					// Avoid duplicating rings/trinkets
					if (isSecondaryItemSlot(slot) || !canEquipItem(equippedItem.item, this.simUI.player.getPlayerSpec(), slot)) return;

					const bulkSlot = itemSlotToBulkSimItemSlot.get(slot)!;
					const group = this.pickerGroups[bulkSlot];
					group.add(idx, equippedItem);
					this.itemsBySlot.get(bulkSlot)?.set(idx, item);
				});
			}
		});

		this.itemsChangedEmitter.emit(TypedEvent.nextEventID());
	}

	updateItem(idx: number, newItem: ItemSpec) {
		const equippedItem = this.simUI.sim.db.lookupItemSpec(newItem);
		if (!!equippedItem) {
			this.items[idx] = newItem;

			getEligibleItemSlots(equippedItem.item).forEach(slot => {
				// Avoid duplicating rings/trinkets
				if (isSecondaryItemSlot(slot)) return;

				const bulkSlot = itemSlotToBulkSimItemSlot.get(slot)!;
				const group = this.pickerGroups[bulkSlot];
				group.update(idx, equippedItem);
				this.itemsBySlot.get(bulkSlot)?.set(idx, newItem);
			});
		}

		this.itemsChangedEmitter.emit(TypedEvent.nextEventID());
	}

	removeItem(item: ItemSpec) {
		const idx = this.items.findIndex(i => !!i && ItemSpec.equals(i, item));
		this.removeItemByIndex(idx);
	}
	removeItemByIndex(idx: number) {
		if (idx < 0 || this.items.length < idx || !this.items[idx]) {
			new Toast({
				variant: 'error',
				body: 'Failed to remove item, please report this issue.',
			});
			return;
		}

		const item = this.items[idx]!;

		const equippedItem = this.simUI.sim.db.lookupItemSpec(item);
		if (!!equippedItem) {
			this.items[idx] = null;

			getEligibleItemSlots(equippedItem.item).forEach(slot => {
				// Avoid duplicating rings/trinkets
				if (isSecondaryItemSlot(slot) || !canEquipItem(equippedItem.item, this.simUI.player.getPlayerSpec(), slot)) return;

				const bulkSlot = itemSlotToBulkSimItemSlot.get(slot)!;
				const group = this.pickerGroups[bulkSlot];
				group.remove(idx);
				this.itemsBySlot.get(bulkSlot)?.delete(idx);
			});

			this.itemsChangedEmitter.emit(TypedEvent.nextEventID());
		}
	}

	clearItems() {
		for (let idx = 0; idx < this.items.length; idx++) {
			this.removeItemByIndex(idx);
		}
		this.items = new Array<ItemSpec>();
		this.itemsChangedEmitter.emit(TypedEvent.nextEventID());
	}

	hasItem(item: ItemSpec) {
		return this.items.some(i => !!i && ItemSpec.equals(i, item));
	}

	getItems(): Array<ItemSpec> {
		const result = new Array<ItemSpec>();
		this.items.forEach(spec => {
			if (!spec) return;

			result.push(ItemSpec.clone(spec));
		});
		return result;
	}

	private setCombinations(doCombos: boolean) {
		this.doCombos = doCombos;
		this.settingsChangedEmitter.emit(TypedEvent.nextEventID());
	}

	private setFastMode(fastMode: boolean) {
		this.fastMode = fastMode;
		this.settingsChangedEmitter.emit(TypedEvent.nextEventID());
	}

	protected async runBulkSim(onProgress: WorkerProgressCallback) {
		this.pendingResults.setPending();

		try {
			await this.simUI.sim.runBulkSim(this.createBulkSettings(), this.createBulkItemsDatabase(), onProgress);
		} catch (e) {
			this.simUI.handleCrash(e);
		}
	}

	protected buildTabContent() {
		this.buildSetupTabContent();
		this.buildResultsTabContent();
		this.buildBatchSettings();
	}

	private buildSetupTabContent() {
		const bagImportBtnRef = ref<HTMLButtonElement>();
		const favsImportBtnRef = ref<HTMLButtonElement>();
		const clearBtnRef = ref<HTMLButtonElement>();
		this.setupTabElem.appendChild(
			<>
				{/* // TODO: Remove once we're more comfortable with the state of Batch sim */}
				<p className="mb-0">
					<span className="bold">Batch Simming</span> is a new feature akin to the <span className="bold">Top Gear</span> sim on{' '}
					<a href="https://raidbots.com" target="_blank">
						Raidbots.com
					</a>{' '}
					that allows you to select multiple items and sim them find the best combinations.
					<br />
					This is an <span className="text-brand">Alpha</span> feature, so if you find a bug please report it!
					<br />
					<br />
					<span className="text-warning d-flex align-items-center">
						<i className="fas fa-exclamation-triangle fa-3x me-2" />
						Warning: Simming over 100k iterations in the web sim may take a long time. For larger batch sims we recommend using Fast Mode or
						downloading the executable version.
					</span>
				</p>
				<div className="bulk-gear-actions">
					<button className="btn btn-secondary" ref={bagImportBtnRef}>
						<i className="fa fa-download me-1" /> Import From Bags
					</button>
					<button className="btn btn-secondary" ref={favsImportBtnRef}>
						<i className="fa fa-download me-1" /> Import Favorites
					</button>
					<button className="btn btn-danger ms-auto" ref={clearBtnRef}>
						<i className="fas fa-times me-1" />
						Clear Items
					</button>
				</div>
			</>,
		);

		const bagImportButton = bagImportBtnRef.value!;
		const favsImportButton = favsImportBtnRef.value!;
		const clearButton = clearBtnRef.value!;

		bagImportButton.addEventListener('click', () => new BulkGearJsonImporter(this.simUI.rootElem, this.simUI, this).open());

		favsImportButton.addEventListener('click', () => {
			const filters = this.simUI.player.sim.getFilters();
			const items = filters.favoriteItems.map(itemID => ItemSpec.create({ id: itemID }));
			this.addItems(items);
		});

		clearButton.addEventListener('click', this.clearItems);

		new BulkItemSearch(this.setupTabElem, this.simUI, this);

		const itemList = (<div className="bulk-gear-combo" />) as HTMLElement;
		this.setupTabElem.appendChild(itemList);

		getEnumValues<BulkSimItemSlot>(BulkSimItemSlot).forEach(slot => {
			this.pickerGroups.push(new BulkItemPickerGroup(itemList, this.simUI, this, slot));
		});
	}

	private buildResultsTabContent() {
		this.simUI.sim.bulkSimStartEmitter.on(() => this.resultsTabElem.replaceChildren());

		this.simUI.sim.bulkSimResultEmitter.on((_, bulkSimResult) => {
			for (const r of bulkSimResult.results) {
				new BulkSimResultRenderer(this.resultsTabElem, this.simUI, this, r, bulkSimResult.equippedGearResult!);
			}

			this.simUI.rootElem.classList.remove('blurred');
			this.pendingDiv.remove();
			this.pendingResults.hideAll();

			this.resultsTab.show();
		});
	}

	protected buildBatchSettings() {
		const settingsContainerRef = ref<HTMLDivElement>();
		const combinationsElemRef = ref<HTMLHeadingElement>();
		const bulkSimBtnRef = ref<HTMLButtonElement>();
		const booleanSettingsContainerRef = ref<HTMLDivElement>();
		this.rightPanel.append(
			<div className="bulk-settings-outer-container">
				<div className="bulk-settings-container" ref={settingsContainerRef}>
					<h4 className="bulk-combinations-count" ref={combinationsElemRef}>
						{this.getCombinationsCount()}
					</h4>
					<button className="btn btn-primary bulk-settings-btn" ref={bulkSimBtnRef}>
						Simulate Batch
					</button>
					<div className="bulk-boolean-settings-container" ref={booleanSettingsContainerRef}></div>
				</div>
			</div>,
		);

		const combinationsElem = combinationsElemRef.value!;
		const bulkSimButton = bulkSimBtnRef.value!;
		const settingsContainer = settingsContainerRef.value!;
		const booleanSettingsContainer = booleanSettingsContainerRef.value!;

		TypedEvent.onAny([this.itemsChangedEmitter, this.settingsChangedEmitter, this.simUI.sim.iterationsChangeEmitter]).on(() => {
			combinationsElem.replaceChildren(this.getCombinationsCount());
		});

		bulkSimButton.addEventListener('click', () => {
			this.simUI.rootElem.classList.add('blurred');
			this.simUI.rootElem.insertAdjacentElement('afterend', this.pendingDiv);

			let simStart = new Date().getTime();
			let lastTotal = 0;
			let rounds = 0;
			let currentRound = 0;
			let combinations = 0;

			this.runBulkSim((progressMetrics: ProgressMetrics) => {
				const msSinceStart = new Date().getTime() - simStart;
				const iterPerSecond = progressMetrics.completedIterations / (msSinceStart / 1000);

				if (combinations === 0) {
					combinations = progressMetrics.totalSims;
				}
				if (this.fastMode) {
					if (rounds === 0 && progressMetrics.totalSims > 0) {
						rounds = Math.ceil(Math.log(progressMetrics.totalSims / 20) / Math.log(2)) + 1;
						currentRound = 1;
					}
					if (progressMetrics.totalSims < lastTotal) {
						currentRound += 1;
						simStart = new Date().getTime();
					}
				}

				this.setSimProgress(progressMetrics, iterPerSecond, currentRound, rounds, combinations);
				lastTotal = progressMetrics.totalSims;
			});
		});

		const fastModeCheckbox = new BooleanPicker<BulkTab>(null, this, {
			id: 'bulk-fast-mode',
			label: 'Fast Mode',
			labelTooltip: 'Fast mode reduces accuracy but will run faster.',
			changedEvent: _modObj => this.settingsChangedEmitter,
			getValue: _modObj => this.fastMode,
			setValue: (_, _modObj, newValue: boolean) => {
				this.setFastMode(newValue);
			},
		});
		const combinationsCheckbox = new BooleanPicker<BulkTab>(null, this, {
			id: 'bulk-combinations',
			label: 'Combinations',
			labelTooltip:
				'When checked bulk simulator will create all possible combinations of the items. When disabled trinkets and rings will still run all combinations becausee they have two slots to fill each.',
			changedEvent: _modObj => this.settingsChangedEmitter,
			getValue: _modObj => this.doCombos,
			setValue: (_, _modObj, newValue: boolean) => {
				this.setCombinations(newValue);
			},
		});
		const autoEnchantCheckbox = new BooleanPicker<BulkTab>(null, this, {
			id: 'bulk-auto-enchant',
			label: 'Auto Enchant',
			labelTooltip: 'When checked bulk simulator apply the current enchant for a slot to each replacement item it can.',
			changedEvent: (_obj: BulkTab) => this.settingsChangedEmitter,
			getValue: _obj => this.autoEnchant,
			setValue: (_, obj: BulkTab, value: boolean) => {
				obj.autoEnchant = value;
			},
		});

		const socketsContainerRef = ref<HTMLDivElement>();
		const defaultGemDiv = (
			<div className={clsx('default-gem-container', !this.autoGem && 'hide')}>
				<h6>Default Gems</h6>
				<div ref={socketsContainerRef} className="sockets-container"></div>
			</div>
		);

		const talentsContainerRef = ref<HTMLDivElement>();
		const talentsToSimDiv = (
			<div className={clsx('talents-picker-container', !this.simTalents && 'hide')}>
				<h6>Talents to Sim</h6>
				<div ref={talentsContainerRef} className="talents-container"></div>
			</div>
		);

		const autoGemCheckbox = new BooleanPicker<BulkTab>(null, this, {
			id: 'bulk-auto-gem',
			label: 'Auto Gem',
			labelTooltip: 'When checked bulk simulator will fill any un-filled gem sockets with default gems.',
			changedEvent: (_obj: BulkTab) => this.settingsChangedEmitter,
			getValue: _obj => this.autoGem,
			setValue: (_, obj: BulkTab, value: boolean) => {
				obj.autoGem = value;
				defaultGemDiv.classList[value ? 'remove' : 'add']('hide');
			},
		});

		const simTalentsCheckbox = new BooleanPicker<BulkTab>(null, this, {
			id: 'bulk-sim-talents',
			label: 'Sim Talents',
			labelTooltip: 'When checked bulk simulator will sim chosen talent setups. Warning, it might cause the bulk sim to run for a lot longer',
			changedEvent: (_obj: BulkTab) => this.settingsChangedEmitter,
			getValue: _obj => this.simTalents,
			setValue: (_, obj: BulkTab, value: boolean) => {
				obj.simTalents = value;
				talentsToSimDiv.classList[value ? 'remove' : 'add']('hide');
			},
		});

		booleanSettingsContainer.appendChild(
			<>
				{fastModeCheckbox.rootElem}
				{combinationsCheckbox.rootElem}
				{autoEnchantCheckbox.rootElem}
				{autoGemCheckbox.rootElem}
				{simTalentsCheckbox.rootElem}
			</>,
		);

		settingsContainer.appendChild(
			<>
				{defaultGemDiv}
				{talentsToSimDiv}
			</>,
		);

		Array<GemColor>(GemColor.GemColorRed, GemColor.GemColorYellow, GemColor.GemColorBlue, GemColor.GemColorMeta).forEach((socketColor, socketIndex) => {
			const gemContainerRef = ref<HTMLDivElement>();
			const gemIconRef = ref<HTMLImageElement>();
			const socketIconRef = ref<HTMLImageElement>();

			socketsContainerRef.value!.appendChild(
				<div ref={gemContainerRef} className="gem-socket-container">
					<img ref={gemIconRef} className="gem-icon hide" />
					<img ref={socketIconRef} className="socket-icon" />
				</div>,
			);

			this.gemIconElements.push(gemIconRef.value!);
			socketIconRef.value!.src = getEmptyGemSocketIconUrl(socketColor);

			let selector: GemSelectorModal;

			const onSelectHandler = (itemData: ItemData<UIGem>) => {
				this.defaultGems[socketIndex] = itemData.item;
				this.storeSettings();
				ActionId.fromItemId(itemData.id)
					.fill()
					.then(filledId => {
						if (itemData.id) {
							this.gemIconElements[socketIndex].src = filledId.iconUrl;
							this.gemIconElements[socketIndex].classList.remove('hide');
						}
					});
				selector.close();
			};

			const onRemoveHandler = () => {
				this.defaultGems[socketIndex] = UIGem.create();
				this.storeSettings();
				this.gemIconElements[socketIndex].classList.add('hide');
				this.gemIconElements[socketIndex].src = '';
				selector.close();
			};

			const openGemSelector = () => {
				if (!selector) selector = new GemSelectorModal(this.simUI.rootElem, this.simUI, socketColor, onSelectHandler, onRemoveHandler);
				selector.show();
			};

			this.gemIconElements[socketIndex].addEventListener('click', openGemSelector);
			gemContainerRef.value?.addEventListener('click', openGemSelector);
		});

		const dataStr = window.localStorage.getItem(this.simUI.getSavedTalentsStorageKey());

		let jsonData;
		try {
			if (dataStr !== null) {
				jsonData = JSON.parse(dataStr);
			}
		} catch (e) {
			console.warn('Invalid json for local storage value: ' + dataStr);
		}

		const handleToggle = (element: HTMLElement, load: TalentLoadout) => {
			const exists = this.savedTalents.some(talent => talent.name === load.name); // Replace 'id' with your unique identifier
			// console.log('Exists:', exists);
			// console.log('Load Object:', load);
			// console.log('Saved Talents Before Update:', this.savedTalents);

			if (exists) {
				// If the object exists, find its index and remove it
				const indexToRemove = this.savedTalents.findIndex(talent => talent.name === load.name);
				this.savedTalents.splice(indexToRemove, 1);
				element?.classList.remove('active');
			} else {
				// If the object does not exist, add it
				this.savedTalents.push(load);
				element?.classList.add('active');
			}
		};

		for (const name in jsonData) {
			try {
				const savedTalentLoadout = SavedTalents.fromJson(jsonData[name]);
				const loadout = {
					talentsString: savedTalentLoadout.talentsString,
					glyphs: savedTalentLoadout.glyphs,
					name: name,
				};

				const index = this.savedTalents.findIndex(talent => JSON.stringify(talent) === JSON.stringify(loadout));
				const talentChipRef = ref<HTMLDivElement>();
				const talentButtonRef = ref<HTMLButtonElement>();

				// console.log('Adding event for loadout', loadout);
				talentsContainerRef.value!.appendChild(
					<div ref={talentChipRef} className={clsx('saved-data-set-chip badge rounded-pill', index !== -1 && 'active')}>
						<button ref={talentButtonRef} className="saved-data-set-name">
							{name}
						</button>
					</div>,
				);
				talentButtonRef.value!.addEventListener('click', () => handleToggle(talentChipRef.value!, loadout));
			} catch (e) {
				console.log(e);
				console.warn('Failed parsing saved data: ' + jsonData[name]);
			}
		}
	}

	private getCombinationsCount(): Element {
		let comboCount = 1;
		this.itemsBySlot.forEach((items, _) => {
			if (items.size != 0) {
				if (this.doCombos) {
					const uniqueItemCount = new Set([...items.values()].map(item => item.id)).size;
					comboCount *= uniqueItemCount + 1;
				} else {
					comboCount += items.size;
				}
			}
		});
		if (this.simTalents) comboCount *= this.savedTalents.length;

		const baseNumIterations = this.fastMode ? 50 : this.simUI.sim.iterations;

		// let multiplier = 0;
		// if (this.doCombos) {
		// 	multiplier = Math.pow(2, itemCount);
		// } else {
		// 	multiplier = itemCount + 1;
		// }

		// if (this.fastMode) multiplier /= 2;

		const iterationCount = baseNumIterations * comboCount;

		return (
			<>
				{comboCount === 1 ? '1 Combination' : `${comboCount} Combinations`}
				<br />
				<small>{iterationCount} Iterations</small>
			</>
		);
	}

	private setSimProgress(progress: ProgressMetrics, iterPerSecond: number, currentRound: number, rounds: number, combinations: number) {
		const secondsRemaining = ((progress.totalIterations - progress.completedIterations) / iterPerSecond).toFixed();
		if (isNaN(Number(secondsRemaining))) return;

		this.pendingResults.setContent(
			<div className="results-sim">
				<div>{combinations} total combinations.</div>
				<div>
					{rounds > 0 && (
						<>
							{currentRound} / {rounds} refining rounds
						</>
					)}
				</div>
				<div>
					{progress.completedSims} / {progress.totalSims}
					<br />
					simulations complete
				</div>
				<div>
					{progress.completedIterations} / {progress.totalIterations}
					<br />
					iterations complete
				</div>
				<div>{secondsRemaining} seconds remaining.</div>
			</div>,
		);
	}
}
