'use strict';

class FakeClassList {
  constructor(element) {
    this.element = element;
    this.set = new Set();
  }

  add(...tokens) {
    tokens.filter(Boolean).forEach((token) => this.set.add(token));
    this.sync();
  }

  remove(...tokens) {
    tokens.forEach((token) => this.set.delete(token));
    this.sync();
  }

  contains(token) {
    return this.set.has(token);
  }

  toggle(token, force) {
    if (force === true) {
      this.set.add(token);
      this.sync();
      return true;
    }
    if (force === false) {
      this.set.delete(token);
      this.sync();
      return false;
    }
    if (this.set.has(token)) {
      this.set.delete(token);
      this.sync();
      return false;
    }
    this.set.add(token);
    this.sync();
    return true;
  }

  sync() {
    this.element.className = Array.from(this.set).join(' ');
  }
}

class FakeElement {
  constructor(id, ownerDocument, tagName) {
    this.id = id || null;
    this.ownerDocument = ownerDocument;
    this.tagName = (tagName || 'div').toUpperCase();
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.classList = new FakeClassList(this);
    this._className = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.type = '';
    this.textContent = '';
    this.src = '';
    this.alt = '';
    this.files = [];
    this.parentNode = null;
    this.focused = false;
  }

  set className(value) {
    this._className = String(value || '');
    this.classList.set = new Set(this._className.split(/\s+/).filter(Boolean));
  }

  get className() {
    return this._className;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  addEventListener(type, listener) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(listener);
  }

  dispatchEvent(type, event) {
    (this.listeners[type] || []).forEach((listener) => listener(event || { target: this }));
  }

  click() {
    this.dispatchEvent('click', { target: this, preventDefault() {} });
  }

  keydown(key) {
    this.dispatchEvent('keydown', { key, target: this, preventDefault() {} });
  }

  focus() {
    this.focused = true;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML || '';
  }
}

class FakeDocument {
  constructor(ids) {
    this.elements = {};
    ids.forEach((id) => {
      this.elements[id] = new FakeElement(id, this, 'div');
    });
  }

  createElement(tagName) {
    return new FakeElement(null, this, tagName);
  }

  getElementById(id) {
    return this.elements[id] || null;
  }
}

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

module.exports = {
  FakeDocument,
  createStorage,
};
