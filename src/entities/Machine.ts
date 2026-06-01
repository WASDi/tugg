import { Z } from '../animation/ZIndexManager';

/** The centre position of the machine in game-space percent. */
const MACHINE_X_PCT = 50;
const MACHINE_Y_PCT = 50;
const MACHINE_W_PCT = 22;

/** Machine source-image aspect ratio (width / height). */
const MACHINE_ASPECT = 518 / 734;

const MACHINE_H_PCT = MACHINE_W_PCT / MACHINE_ASPECT;

export { MACHINE_X_PCT, MACHINE_Y_PCT, MACHINE_W_PCT, MACHINE_H_PCT, MACHINE_ASPECT };

export class Machine {
  readonly el: HTMLElement;
  private readonly leg: HTMLImageElement;
  private running = false;

  constructor(gameRoot: HTMLElement) {
    this.el  = this.buildWrapper();
    this.leg = this.buildLeg();
    gameRoot.appendChild(this.el);
    gameRoot.appendChild(this.leg);
  }

  start(): void {
    this.running = true;
    this.el.classList.add('machine--running');
    this.leg.classList.add('machine--running');
  }

  stop(): void {
    this.running = false;
    this.el.classList.remove('machine--running');
    this.leg.classList.remove('machine--running');
  }

  get isRunning(): boolean {
    return this.running;
  }

  private buildWrapper(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('machine');
    Object.assign(wrapper.style, {
      position:        'absolute',
      left:            `${MACHINE_X_PCT}%`,
      top:             `${MACHINE_Y_PCT}%`,
      width:           `${MACHINE_W_PCT}vw`,
      height:          `${MACHINE_H_PCT}vw`,
      transform:       'translate(-50%, -50%)',
      transformOrigin: 'bottom center',
      zIndex:          String(Z.machineBody),
    });

    const body = document.createElement('img');
    body.src   = '/assets/images/machine_body.png';
    body.draggable = false;
    body.classList.add('machine__layer');
    body.style.zIndex = String(Z.machineBody);

    wrapper.appendChild(body);
    return wrapper;
  }

  private buildLeg(): HTMLImageElement {
    const leg = document.createElement('img');
    leg.src    = '/assets/images/machine_leg.png';
    leg.draggable = false;
    leg.classList.add('machine__layer');
    Object.assign(leg.style, {
      position:        'absolute',
      left:            `${MACHINE_X_PCT}%`,
      top:             `${MACHINE_Y_PCT}%`,
      width:           `${MACHINE_W_PCT}vw`,
      height:          `${MACHINE_H_PCT}vw`,
      transform:       'translate(-50%, -50%)',
      transformOrigin: 'bottom center',
      zIndex:          String(Z.machineLeg),
    });
    return leg;
  }
}
