import { BaseElement } from 'core/components';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './alert.component.html'
});

export class AlertElement extends BaseElement {
  static readonly selector = 'alert-message';

  private message: HTMLDivElement;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.message = this.template.querySelector('[name="message"]');
  }

  set error(value: string) {
    this.message.innerText = `Oops, something's wrong. It says ${value.toLowerCase()} :(`;
    this.hidden = !value;

    if (!this.message.parentElement.classList.contains('')) {
      this.message.parentElement.classList.add('error');
    }
  }
}
