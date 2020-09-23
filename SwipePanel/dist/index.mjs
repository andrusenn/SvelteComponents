function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

/* src/SwipePanel.svelte generated by Svelte v3.26.0 */

const { document: document_1, window: window_1 } = globals;

function add_css() {
	var style = element("style");
	style.id = "svelte-164973g-style";
	style.textContent = ".svelte-c-swipepanel.svelte-164973g{position:fixed;overflow:hidden;top:0;left:0;width:0;height:100vh;transition:width 0.1s;z-index:9999;box-shadow:5px 0 8px rgba(0, 0, 0, 0.4)}.transp.svelte-164973g{position:fixed;overflow:hidden;top:0;left:0;width:0;height:100vh;z-index:9998;background:transparent}";
	append(document_1.head, style);
}

function create_fragment(ctx) {
	let aside;
	let t;
	let div;
	let current;
	let mounted;
	let dispose;
	add_render_callback(/*onwindowresize*/ ctx[8]);
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

	return {
		c() {
			aside = element("aside");
			if (default_slot) default_slot.c();
			t = space();
			div = element("div");
			attr(aside, "id", "svelte-c-swipepanel");
			attr(aside, "class", "svelte-c-swipepanel svelte-164973g");
			attr(div, "id", "svelte-c-bg-panel");
			set_style(div, "width", /*ww*/ ctx[1] * /*touchMargin*/ ctx[0] + "px");
			attr(div, "class", "transp svelte-164973g");
		},
		m(target, anchor) {
			insert(target, aside, anchor);

			if (default_slot) {
				default_slot.m(aside, null);
			}

			insert(target, t, anchor);
			insert(target, div, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(window_1, "touchstart", /*moveStart*/ ctx[2]),
					listen(window_1, "resize", /*onwindowresize*/ ctx[8])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 64) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
				}
			}

			if (!current || dirty & /*ww, touchMargin*/ 3) {
				set_style(div, "width", /*ww*/ ctx[1] * /*touchMargin*/ ctx[0] + "px");
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(aside);
			if (default_slot) default_slot.d(detaching);
			if (detaching) detach(t);
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	let { panelWidth = 1 } = $$props,
		{ swipeAng = 15 } = $$props,
		{ touchMargin = 0.05 } = $$props,
		{ open = false } = $$props;

	//
	let active = false;

	let touching = false;
	let x, ix, y, iy, px, cx;
	let lng = 0;
	let dir = 0;
	let panel, bgPanel;
	let ww = 0;

	onMount(() => {
		panel = document.getElementById("svelte-c-swipepanel");
		bgPanel = document.getElementById("svelte-c-bg-panel");
	});

	afterUpdate(() => {
		if (panel) {
			if (open) {
				panel.style.width = ww * panelWidth + "px";
			} else {
				panel.style.width = "0px";
			}
		}
	});

	function moveStart(e) {
		e.stopImmediatePropagation();
		e.stopPropagation();
		ix = e.touches ? e.touches[0].screenX : e.screenX;
		iy = e.touches ? e.touches[0].screenY : e.screenY;

		if (!open && ix < ww * touchMargin) {
			active = true;
		}

		if (active) {
			touching = true;
			x = ix;
			y = iy;
			px = ix;
			cx = ix;

			if (typeof window !== "undefined") {
				window.addEventListener("touchmove", moveHandler);
				window.addEventListener("touchend", endHandler);
			}
		}
	}

	function endHandler(e) {
		e && e.stopImmediatePropagation();
		e && e.stopPropagation();
		touching = false;
		let ang = Math.atan2(y - iy, x - ix) * (180 / Math.PI);

		if (!open && Math.abs(ang) < swipeAng) {
			if (dir === 1 && lng > window.innerWidth * 0.1) {
				if (panel) {
					panel.style.width = ww * panelWidth + "px";
					bgPanel.style.width = ww + "px";
				}

				$$invalidate(3, open = true);
			} else {
				panel.style.width = "0px";
				bgPanel.style.width = ww * touchMargin + "px";
			}
		}

		if (open && Math.abs(ang) < 180 + swipeAng) {
			if (dir === -1 && lng > window.innerWidth * 0.1) {
				if (panel) {
					panel.style.width = "0px";
					bgPanel.style.width = ww * touchMargin + "px";
				}

				active = false;
				$$invalidate(3, open = false);
			} else {
				panel.style.width = ww * panelWidth + "px";
				bgPanel.style.width = ww + "px";
			}
		}

		lng = 0;
		dir = 0;
		x = null;
		y = null;

		if (typeof window !== "undefined") {
			window.removeEventListener("touchmove", moveHandler);
			window.removeEventListener("touchend", endHandler);
		}
	}

	function moveHandler(e) {
		if (touching) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			x = e.touches ? e.touches[0].screenX : e.screenX;
			y = e.touches ? e.touches[0].screenY : e.screenY;

			if (ix) {
				lng = Math.abs(x - ix);
				cx = x;

				if (cx - px < 0) {
					dir = -1;
				} else {
					dir = 1;
				}

				let ang = Math.atan2(y - iy, x - ix) * (180 / Math.PI);

				if (open && dir < 0) {
					let w = ww * panelWidth;

					if (Math.abs(ang) < 180 + swipeAng) {
						panel.style.width = w - lng + "px";
					} else {
						panel.style.width = w + "px";
					}
				}

				if (!open && dir > 0) {
					let w = x - ix;

					if (Math.abs(ang) < swipeAng) {
						panel.style.width = w + "px";
					} else {
						panel.style.width = "0px";
					}
				}

				px = cx;
			}
		}
	}

	function onwindowresize() {
		$$invalidate(1, ww = window_1.innerWidth);
	}

	$$self.$$set = $$props => {
		if ("panelWidth" in $$props) $$invalidate(4, panelWidth = $$props.panelWidth);
		if ("swipeAng" in $$props) $$invalidate(5, swipeAng = $$props.swipeAng);
		if ("touchMargin" in $$props) $$invalidate(0, touchMargin = $$props.touchMargin);
		if ("open" in $$props) $$invalidate(3, open = $$props.open);
		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
	};

	return [
		touchMargin,
		ww,
		moveStart,
		open,
		panelWidth,
		swipeAng,
		$$scope,
		slots,
		onwindowresize
	];
}

class SwipePanel extends SvelteComponent {
	constructor(options) {
		super();
		if (!document_1.getElementById("svelte-164973g-style")) add_css();

		init(this, options, instance, create_fragment, safe_not_equal, {
			panelWidth: 4,
			swipeAng: 5,
			touchMargin: 0,
			open: 3
		});
	}
}

export default SwipePanel;
