let toastId = 0;
let addToastFn = null;

export function setToastHandler(fn) {
  addToastFn = fn;
}

export function toast(message, type = 'info', duration = 3500) {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type, duration });
  }
}