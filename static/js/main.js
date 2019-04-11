/** @const {!Array<string>} */
const KEYS_TO_IGNORE = [
  'Meta', 'Shift', 'Alt', 'Control', 'Tab', 'Dead', 'Enter', 'CapsLock', '`',
  'Escape', 'Delete',
];

/** @enum {string} */
const States = {
  WAITING: 'waiting',
  LISTENING: 'listening',
  COMPLETED: 'completed',
};

/**
 * Time to wait before stopping keydown listening in milliseconds.
 * @const {number}
 */
const WAIT_TIME = 500;

/**
 * Time to refresh the screen in milliseconds.
 * @const {number}
 */
const TIME_TO_REFRESH = 30000;

/**
 * A Keydown class.
 * @final
 */
class Keydown {
  /**
   * Creates a new Keydown.
   * @param {string} key Pressed key.
   * @param {number} time Pressed timing in ms.
   */
  constructor(key, time) {
    /** @export */
    this.key = key;
    /** @export */
    this.time = time;
  }
}

/**
 * A Keydowns class.
 * @final
 */
class Keydowns {
  /**
   * Creates a new Keydowns.
   * @param {Element} The element to bind keydowns.
   */
  constructor(ele) {
    this.data_ = [];
    this.viewElement_ = ele;
  }

  get() {
    return this.data_;
  }

  getLastItem() {
    return this.data_[this.data_.length - 1];
  }

  getLength() {
    return this.data_.length;
  }

  add(key, time) {
    this.data_.push(new Keydown(key, time));
    this.viewElement_.textContent += key;
  }

  clear() {
    this.data_ = [];
    this.viewElement_.textContent = '';
  }
}

class DemoController {
  constructor() {
    let keydownViewElement = document.querySelector('.keydowns');
    this.demoElement_ = document.querySelector('.demo');
    this.inputViewElement_ = document.querySelector('.input');
    this.keydowns_ = new Keydowns(keydownViewElement);
    this.startTime_ = null;
    this.demoElement_.dataset.state = States.WAITING;
    document.addEventListener('keydown', this.onKeydown_.bind(this), false);
    this.checkToRefresh_();
  }

  checkToRefresh_() {
    if (this.startTime_) {
      let currentTime = new Date().getTime() - this.startTime_;
      if (currentTime > TIME_TO_REFRESH) {
        location.reload();
      }
    }
    setTimeout(this.checkToRefresh_.bind(this), 2000);
  }

  onKeydown_(e) {
    if (KEYS_TO_IGNORE.indexOf(e.key) > -1) return;
    if (e.key == 'Backspace') {
      this.backspace_();
      return;
    }
    if (this.keydowns_.getLength() == 0) {
      this.startRecording_();
    }
    let currentTime = new Date().getTime() - this.startTime_;
    this.keydowns_.add(e.key, currentTime);
  }

  startRecording_() {
    this.demoElement_.dataset.state = States.LISTENING;
    this.startTime_ = new Date().getTime();
    this.intervalId_ = window.setInterval(
      this.checksToStopRecording_.bind(this), 100);
  }

  stopRecording_() {
    window.clearInterval(this.intervalId_);
    if (this.keydowns_.getLength() < 3) {
      this.demoElement_.dataset.state = States.WAITING;
      this.keydowns_.clear();
    } else {
      fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.keydowns_.get()),
      }).then(res => res.json())
      .then((response) => {
        if (response['status'] != 'ok') {
          this.demoElement_.dataset.state = States.WAITING;
          this.keydowns_.clear();
        } else {
          let result = response['result'];
          this.inputViewElement_.textContent += result[0]['character'];
          this.demoElement_.dataset.state = States.COMPLETED;
          this.keydowns_.clear();
          if (window['gtag']) {
            window['gtag']('event', 'input', {
              'event_category' : 'kiosk',
            });
          }
        }
      });
    }
  }

  checksToStopRecording_() {
    let lastTime = this.keydowns_.getLastItem().time;
    let currentTime = new Date().getTime() - this.startTime_;
    if (currentTime - lastTime > WAIT_TIME) this.stopRecording_();
  }

  backspace_() {
    let newString = this.inputViewElement_.textContent.slice(0, -1);
    this.inputViewElement_.textContent = newString;
  }
}

const demo = new DemoController();
