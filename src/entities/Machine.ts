import { Z } from '../animation/ZIndexManager';

/** The centre position of the machine in game-space percent. */
const MACHINE_X_PCT = 50;
const MACHINE_Y_PCT = 50;
const MACHINE_W_PCT = 22;
const MACHINE_H_PCT = 38;

export { MACHINE_X_PCT, MACHINE_Y_PCT, MACHINE_W_PCT, MACHINE_H_PCT };

export class Machine {
  readonly el: HTMLElement;
  private running = false;

  constructor(gameRoot: HTMLElement) {
    this.el = this.buildMachine();
    gameRoot.appendChild(this.el);
  }

  start(): void {
    this.running = true;
    this.el.classList.add('machine--running');
  }

  stop(): void {
    this.running = false;
    this.el.classList.remove('machine--running');
  }

  get isRunning(): boolean {
    return this.running;
  }

  private buildMachine(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('machine');
    Object.assign(wrapper.style, {
      position:        'absolute',
      left:            `${MACHINE_X_PCT}%`,
      top:             `${MACHINE_Y_PCT}%`,
      width:           `${MACHINE_W_PCT}vw`,
      height:          `${MACHINE_H_PCT}vh`,
      transform:       'translate(-50%, -50%)',
      transformOrigin: 'bottom center',
    });

    const leg = document.createElement('img');
    leg.src    = '/assets/images/machine_leg.png';
    leg.draggable = false;
    leg.classList.add('machine__layer');
    leg.style.zIndex = String(Z.machineLeg);

    const body = document.createElement('img');
    body.src   = '/assets/images/machine_body.png';
    body.draggable = false;
    body.classList.add('machine__layer');
    body.style.zIndex = String(Z.machineBody);

    wrapper.appendChild(leg);
    wrapper.appendChild(body);
    return wrapper;
  }
}
