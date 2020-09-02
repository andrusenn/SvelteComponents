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
function null_to_empty(value) {
    return value == null ? '' : value;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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

let current_component;
function set_current_component(component) {
    current_component = component;
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
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
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
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/Reveal.svelte generated by Svelte v3.24.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-djiw9h-style";
	style.textContent = ".wrapper.svelte-djiw9h{overflow:hidden;position:relative;padding:0;margin:0}.hide.svelte-djiw9h{opacity:0;padding:0;margin:0}.fade.svelte-djiw9h{position:relative;--animation-delay:0s;--animation-duration:1s;animation-duration:var(--animation-duration);animation-fill-mode:forwards;animation-direction:normal;animation-delay:var(--animation-delay);animation-timing-function:ease-in-out;animation-iteration-count:1}.fadeIn.svelte-djiw9h{animation-name:svelte-djiw9h-fadeIn}.fadeOut.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOut}@keyframes svelte-djiw9h-fadeIn{0%{opacity:0}100%{opacity:1}}@keyframes svelte-djiw9h-fadeOut{0%{opacity:1}100%{opacity:0}}.fadeInUp.svelte-djiw9h{animation-name:svelte-djiw9h-fadeInUp}.fadeOutUp.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOutUp}@keyframes svelte-djiw9h-fadeInUp{0%{opacity:0;transform:translate3d(0, 15px, 0)}100%{opacity:1;transform:translateY(0)}}@keyframes svelte-djiw9h-fadeOutUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translate3d(0, -15px, 0)}}.fadeInDown.svelte-djiw9h{animation-name:svelte-djiw9h-fadeInDown}.fadeOutDown.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOutDown}@keyframes svelte-djiw9h-fadeInDown{0%{opacity:0;transform:translate3d(0, -15px, 0)}100%{opacity:1;transform:translateY(0)}}@keyframes svelte-djiw9h-fadeOutDown{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translate3d(0, 15px, 0)}}.fadeInLeft.svelte-djiw9h{animation-name:svelte-djiw9h-fadeInLeft}.fadeOutLeft.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOutLeft}@keyframes svelte-djiw9h-fadeInLeft{0%{opacity:0;transform:translate3d(-15px, 0, 0)}100%{opacity:1;transform:translateX(0)}}@keyframes svelte-djiw9h-fadeOutLeft{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translate3d(-15px, 0, 0)}}.fadeInRight.svelte-djiw9h{animation-name:svelte-djiw9h-fadeInRight}.fadeOutRight.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOutRight}@keyframes svelte-djiw9h-fadeInRight{0%{opacity:0;transform:translate3d(15px, 0, 0)}100%{opacity:1;transform:translateX(0)}}@keyframes svelte-djiw9h-fadeOutRight{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translate3d(15px, 0, 0)}}.fadeInRotY.svelte-djiw9h{animation-name:svelte-djiw9h-fadeInRotY}.fadeOutRotY.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOutRotY}@keyframes svelte-djiw9h-fadeInRotY{0%{opacity:0;transform:rotate3d(0, 1, 0, 90deg)}100%{opacity:1;transform:rotate3d(0)}}@keyframes svelte-djiw9h-fadeOutRotY{0%{opacity:1;transform:rotate3d(0)}100%{opacity:0;transform:rotate3d(0, 1, 0, 90deg)}}.fadeInRotX.svelte-djiw9h{animation-name:svelte-djiw9h-fadeInRotX}.fadeOutRotX.svelte-djiw9h{animation-name:svelte-djiw9h-fadeOutRotX}@keyframes svelte-djiw9h-fadeInRotX{0%{opacity:0;transform:rotate3d(1, 0, 0, 90deg)}100%{opacity:1;transform:rotate3d(0)}}@keyframes svelte-djiw9h-fadeOutRotX{0%{opacity:1;transform:rotate3d(0)}100%{opacity:0;transform:rotate3d(1, 0, 0, 90deg)}}";
	append(document.head, style);
}

function create_fragment(ctx) {
	let div1;
	let div0;
	let div0_class_value;
	let rev_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*$$slots*/ ctx[8].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			if (default_slot) default_slot.c();
			attr(div0, "class", div0_class_value = "" + (null_to_empty("hide fade " + /*cssClass*/ ctx[4]) + " svelte-djiw9h"));
			attr(div1, "class", "wrapper svelte-djiw9h");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(rev_action = /*rev*/ ctx[5].call(null, div1, {
						duration: /*duration*/ ctx[0],
						delay: /*delay*/ ctx[1]
					})),
					listen(div1, "in", /*in_handler*/ ctx[9]),
					listen(div1, "out", /*out_handler*/ ctx[10])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 128) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
				}
			}

			if (!current || dirty & /*cssClass*/ 16 && div0_class_value !== (div0_class_value = "" + (null_to_empty("hide fade " + /*cssClass*/ ctx[4]) + " svelte-djiw9h"))) {
				attr(div0, "class", div0_class_value);
			}

			if (rev_action && is_function(rev_action.update) && dirty & /*duration, delay*/ 3) rev_action.update.call(null, {
				duration: /*duration*/ ctx[0],
				delay: /*delay*/ ctx[1]
			});
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
			if (detaching) detach(div1);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { trigger = 0 } = $$props;
	let { duration = 0.4 } = $$props;
	let { delay = 0 } = $$props;
	let { reveal = "fadeIn" } = $$props;
	let { hide = "" } = $$props;
	let cssClass = "";

	// Action -----------------
	function rev(node, args) {
		// Anim settings
		node.style.setProperty("--animation-delay", args.delay + "s");

		node.style.setProperty("--animation-duration", args.duration + "s");

		const handler = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.dispatchEvent(new CustomEvent("in"));

					if (hide === "") {
						observer.disconnect();
					}
				} else {
					if (hide !== "") {
						entry.target.dispatchEvent(new CustomEvent("out"));
					}
				}
			});
		};

		let _trigger = 100 * trigger;

		const observer = new IntersectionObserver(handler,
		{
				root: null,
				rootMargin: `0% 0% -${_trigger}% 0%`,
				threshold: 0
			});

		// Observe
		observer.observe(node);

		// Return
		return {
			destroy(observer) {
				observer.disconnect();
			}
		};
	}

	let { $$slots = {}, $$scope } = $$props;
	const in_handler = e => $$invalidate(4, cssClass = reveal);
	const out_handler = e => $$invalidate(4, cssClass = hide);

	$$self.$set = $$props => {
		if ("trigger" in $$props) $$invalidate(6, trigger = $$props.trigger);
		if ("duration" in $$props) $$invalidate(0, duration = $$props.duration);
		if ("delay" in $$props) $$invalidate(1, delay = $$props.delay);
		if ("reveal" in $$props) $$invalidate(2, reveal = $$props.reveal);
		if ("hide" in $$props) $$invalidate(3, hide = $$props.hide);
		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
	};

	return [
		duration,
		delay,
		reveal,
		hide,
		cssClass,
		rev,
		trigger,
		$$scope,
		$$slots,
		in_handler,
		out_handler
	];
}

class Reveal extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-djiw9h-style")) add_css();

		init(this, options, instance, create_fragment, safe_not_equal, {
			trigger: 6,
			duration: 0,
			delay: 1,
			reveal: 2,
			hide: 3
		});
	}
}

export default Reveal;
