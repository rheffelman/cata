import { TypedEvent } from '../typed_event.js';
import { arrayEquals } from '../utils.js';
import { Input, InputConfig } from './input.js';

/**
 * Data for creating a number list picker.
 */
export interface NumberListPickerConfig<ModObject> extends InputConfig<ModObject, Array<number>> {
	id: string;
	placeholder?: string;
}

// UI element for picking an arbitrary number list field.
export class NumberListPicker<ModObject> extends Input<ModObject, Array<number>> {
	private readonly inputElem: HTMLInputElement;

	constructor(parent: HTMLElement, modObject: ModObject, config: NumberListPickerConfig<ModObject>) {
		super(parent, 'number-list-picker-root', modObject, config);

		this.inputElem = document.createElement('input');
		this.inputElem.id = config.id;
		this.inputElem.type = 'text';
		this.inputElem.placeholder = config.placeholder || '';
		this.inputElem.classList.add('number-list-picker-input', 'form-control');
		this.rootElem.appendChild(this.inputElem);

		this.init();

		this.inputElem.addEventListener(
			'change',
			() => {
				this.inputChanged(TypedEvent.nextEventID());
			},
			{ signal: this.signal },
		);
	}

	getInputElem(): HTMLElement {
		return this.inputElem;
	}

	getInputValue(): Array<number> {
		const str = this.inputElem.value;
		if (!str) {
			return [];
		}

		return str
			.split(',')
			.map(parseFloat)
			.filter(val => !isNaN(val));
	}

	setInputValue(newValue: Array<number>) {
		if (arrayEquals(this.getInputValue(), newValue)) {
			return;
		}

		this.inputElem.value = newValue.map(v => String(v)).join(',');
	}
}
