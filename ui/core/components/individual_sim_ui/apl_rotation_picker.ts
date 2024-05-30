import tippy, { Instance as TippyInstance } from 'tippy.js';

import { Player } from '../../player';
import { APLAction, APLListItem, APLPrepullAction, APLValue } from '../../proto/apl';
import { ActionId } from '../../proto_utils/action_id';
import { SimUI } from '../../sim_ui';
import { EventID, TypedEvent } from '../../typed_event';
import { existsInDOM, randomUUID } from '../../utils';
import { Component } from '../component';
import { Input, InputConfig } from '../input';
import { ListItemPickerConfig, ListPicker } from '../list_picker';
import { AdaptiveStringPicker } from '../string_picker';
import { APLActionPicker } from './apl_actions';
import { APLValueImplStruct } from './apl_values';

export class APLRotationPicker extends Component {
	constructor(parent: HTMLElement, simUI: SimUI, modPlayer: Player<any>) {
		super(parent, 'apl-rotation-picker-root');

		new ListPicker<Player<any>, APLPrepullAction>(this.rootElem, modPlayer, {
			extraCssClasses: ['apl-prepull-action-picker'],
			title: 'Prepull Actions',
			titleTooltip: 'Actions to perform before the pull.',
			itemLabel: 'Prepull Action',
			changedEvent: (player: Player<any>) => player.rotationChangeEmitter,
			getValue: (player: Player<any>) => player.aplRotation.prepullActions,
			setValue: (eventID: EventID, player: Player<any>, newValue: Array<APLPrepullAction>) => {
				player.aplRotation.prepullActions = newValue;
				player.rotationChangeEmitter.emit(eventID);
			},
			newItem: () =>
				APLPrepullAction.create({
					action: {},
					doAtValue: {
						value: { oneofKind: 'const', const: { val: '-1s' } },
					},
				}),
			copyItem: (oldItem: APLPrepullAction) => APLPrepullAction.clone(oldItem),
			newItemPicker: (
				parent: HTMLElement,
				listPicker: ListPicker<Player<any>, APLPrepullAction>,
				index: number,
				config: ListItemPickerConfig<Player<any>, APLPrepullAction>,
			) => new APLPrepullActionPicker(parent, modPlayer, config, index),
			inlineMenuBar: true,
		});

		new ListPicker<Player<any>, APLListItem>(this.rootElem, modPlayer, {
			extraCssClasses: ['apl-list-item-picker'],
			title: 'Priority List',
			titleTooltip: 'At each decision point, the simulation will perform the first valid action from this list.',
			itemLabel: 'Action',
			changedEvent: (player: Player<any>) => player.rotationChangeEmitter,
			getValue: (player: Player<any>) => player.aplRotation.priorityList,
			setValue: (eventID: EventID, player: Player<any>, newValue: Array<APLListItem>) => {
				player.aplRotation.priorityList = newValue;
				player.rotationChangeEmitter.emit(eventID);
			},
			newItem: () =>
				APLListItem.create({
					action: {},
				}),
			copyItem: (oldItem: APLListItem) => APLListItem.clone(oldItem),
			newItemPicker: (
				parent: HTMLElement,
				listPicker: ListPicker<Player<any>, APLListItem>,
				index: number,
				config: ListItemPickerConfig<Player<any>, APLListItem>,
			) => new APLListItemPicker(parent, modPlayer, config, index),
			inlineMenuBar: true,
		});

		//modPlayer.rotationChangeEmitter.on(() => console.log('APL: ' + APLRotation.toJsonString(modPlayer.aplRotation)))
	}
}

class APLPrepullActionPicker extends Input<Player<any>, APLPrepullAction> {
	private readonly player: Player<any>;

	private readonly hidePicker: Input<Player<any>, boolean>;
	private readonly doAtPicker: Input<Player<any>, string>;
	private readonly actionPicker: APLActionPicker;

	private getItem(): APLPrepullAction {
		return (
			this.getSourceValue() ||
			APLPrepullAction.create({
				action: {},
			})
		);
	}

	constructor(parent: HTMLElement, player: Player<any>, config: ListItemPickerConfig<Player<any>, APLPrepullAction>, index: number) {
		config.enableWhen = () => !this.getItem().hide;
		super(parent, 'apl-list-item-picker-root', player, config);
		this.player = player;

		const itemHeaderElem = ListPicker.getItemHeaderElem(this);
		makeListItemWarnings(itemHeaderElem, player, player => player.getCurrentStats().rotationStats?.prepullActions[index]?.warnings || []);

		this.hidePicker = new HidePicker(itemHeaderElem, player, {
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => this.getItem().hide,
			setValue: (eventID: EventID, player: Player<any>, newValue: boolean) => {
				this.getItem().hide = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			},
		});

		this.doAtPicker = new AdaptiveStringPicker(this.rootElem, this.player, {
			id: randomUUID(),
			label: 'Do At',
			labelTooltip: "Time before pull to do the action. Should be negative, and formatted like, '-1s' or '-2500ms'.",
			extraCssClasses: ['apl-prepull-actions-doat'],
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => (this.getItem().doAtValue?.value as APLValueImplStruct<'const'> | undefined)?.const.val || '',
			setValue: (eventID: EventID, player: Player<any>, newValue: string) => {
				if (newValue) {
					this.getItem().doAtValue = APLValue.create({
						value: { oneofKind: 'const', const: { val: newValue } },
					});
				} else {
					this.getItem().doAtValue = undefined;
				}
				this.player.rotationChangeEmitter.emit(eventID);
			},
			inline: true,
		});
		//this.doAtPicker = new APLValuePicker(this.rootElem, this.player, {
		//	label: 'Do At',
		//	labelTooltip: 'Time before pull to do the action. Should be negative, and formatted like, \'-1s\' or \'-2500ms\'.',
		//	extraCssClasses: ['apl-prepull-actions-doat'],
		//	changedEvent: () => this.player.rotationChangeEmitter,
		//	getValue: () => this.getItem().doAtValue,
		//	setValue: (eventID: EventID, player: Player<any>, newValue: APLValue | undefined) => {
		//		this.getItem().doAtValue = newValue;
		//		this.player.rotationChangeEmitter.emit(eventID);
		//	},
		//	inline: true,
		//});

		this.actionPicker = new APLActionPicker(this.rootElem, this.player, {
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => this.getItem().action!,
			setValue: (eventID: EventID, player: Player<any>, newValue: APLAction) => {
				this.getItem().action = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			},
		});
		this.init();
	}

	getInputElem(): HTMLElement | null {
		return this.rootElem;
	}

	getInputValue(): APLPrepullAction {
		const item = APLPrepullAction.create({
			hide: this.hidePicker.getInputValue(),
			doAtValue: {
				value: { oneofKind: 'const', const: { val: this.doAtPicker.getInputValue() } },
			},
			action: this.actionPicker.getInputValue(),
		});
		return item;
	}

	setInputValue(newValue: APLPrepullAction) {
		if (!newValue) {
			return;
		}
		this.hidePicker.setInputValue(newValue.hide);
		this.doAtPicker.setInputValue((newValue.doAtValue?.value as APLValueImplStruct<'const'> | undefined)?.const.val || '');
		this.actionPicker.setInputValue(newValue.action || APLAction.create());
	}
}

class APLListItemPicker extends Input<Player<any>, APLListItem> {
	private readonly player: Player<any>;

	private readonly hidePicker: Input<Player<any>, boolean>;
	private readonly actionPicker: APLActionPicker;

	private getItem(): APLListItem {
		return (
			this.getSourceValue() ||
			APLListItem.create({
				action: {},
			})
		);
	}

	constructor(parent: HTMLElement, player: Player<any>, config: ListItemPickerConfig<Player<any>, APLListItem>, index: number) {
		config.enableWhen = () => !this.getItem().hide;
		super(parent, 'apl-list-item-picker-root', player, config);
		this.player = player;

		const itemHeaderElem = ListPicker.getItemHeaderElem(this);
		makeListItemWarnings(itemHeaderElem, player, player => player.getCurrentStats().rotationStats?.priorityList[index]?.warnings || []);

		this.hidePicker = new HidePicker(itemHeaderElem, player, {
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => this.getItem().hide,
			setValue: (eventID: EventID, player: Player<any>, newValue: boolean) => {
				this.getItem().hide = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			},
		});

		this.actionPicker = new APLActionPicker(this.rootElem, this.player, {
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => this.getItem().action!,
			setValue: (eventID: EventID, player: Player<any>, newValue: APLAction) => {
				this.getItem().action = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			},
		});
		this.init();
	}

	getInputElem(): HTMLElement | null {
		return this.rootElem;
	}

	getInputValue(): APLListItem {
		const item = APLListItem.create({
			hide: this.hidePicker.getInputValue(),
			action: this.actionPicker.getInputValue(),
		});
		return item;
	}

	setInputValue(newValue: APLListItem) {
		if (!newValue) {
			return;
		}
		this.hidePicker.setInputValue(newValue.hide);
		this.actionPicker.setInputValue(newValue.action || APLAction.create());
	}
}

function makeListItemWarnings(itemHeaderElem: HTMLElement, player: Player<any>, getWarnings: (player: Player<any>) => Array<string>) {
	const warningsElem = ListPicker.makeActionElem('apl-warnings', 'fa-exclamation-triangle');
	warningsElem.classList.add('warning', 'link-warning');
	warningsElem.setAttribute('data-bs-html', 'true');
	const warningsTooltip = tippy(warningsElem, {
		theme: 'dropdown-tooltip',
		content: 'Warnings',
	});

	itemHeaderElem.appendChild(warningsElem);

	const updateWarnings = async () => {
		if (!existsInDOM(warningsElem)) {
			warningsTooltip?.destroy();
			warningsElem?.remove();
			player.currentStatsEmitter.off(updateWarnings);
			return;
		}
		warningsTooltip.setContent('');
		const warnings = getWarnings(player);
		if (!warnings.length) {
			warningsElem.style.visibility = 'hidden';
		} else {
			warningsElem.style.visibility = 'visible';
			const formattedWarnings = await Promise.all(warnings.map(w => ActionId.replaceAllInString(w)));
			warningsTooltip.setContent(
				`
				<p>This action has warnings, and might not behave as expected.</p>
				<ul>
					${formattedWarnings.map(w => `<li>${w}</li>`).join('')}
				</ul>
			`,
			);
		}
	};
	updateWarnings();
	player.currentStatsEmitter.on(updateWarnings);
}

class HidePicker extends Input<Player<any>, boolean> {
	private readonly inputElem: HTMLElement;
	private readonly iconElem: HTMLElement;
	private tooltip: TippyInstance;

	constructor(parent: HTMLElement, modObject: Player<any>, config: InputConfig<Player<any>, boolean>) {
		super(parent, 'hide-picker-root', modObject, config);

		this.inputElem = ListPicker.makeActionElem('hide-picker-button', 'fa-eye');
		this.iconElem = this.inputElem.childNodes[0] as HTMLElement;

		this.inputElem.addEventListener(
			'click',
			() => {
				this.setInputValue(!this.getInputValue());
				this.inputChanged(TypedEvent.nextEventID());
			},
			{ signal: this.signal },
		);

		this.rootElem.appendChild(this.inputElem);
		this.tooltip = tippy(this.inputElem, { content: 'Enable/Disable' });
		this.addOnDisposeCallback(() => this.tooltip.destroy());

		this.init();
	}

	getInputElem(): HTMLElement {
		return this.inputElem;
	}

	getInputValue(): boolean {
		return this.iconElem.classList.contains('fa-eye-slash');
	}

	setInputValue(newValue: boolean) {
		if (newValue) {
			this.iconElem.classList.add('fa-eye-slash');
			this.iconElem.classList.remove('fa-eye');
			this.tooltip.setContent('Enable Action');
		} else {
			this.iconElem.classList.add('fa-eye');
			this.iconElem.classList.remove('fa-eye-slash');
			this.tooltip.setContent('Disable Action');
		}
	}
}
