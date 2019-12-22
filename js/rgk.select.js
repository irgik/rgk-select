/*
 * rgk.select
 * version: 2.2 (10.11.19)
 * Ivan Kolesnikov (myivanko@gmail.com)
 *
 *
 *
 rgk = {
    open: false,
    travelIndex: 0,
    selectedIndexes: [],
    focusFlas: false,
    touchFlag: false,
    size: 0,
    events: {}
 }
 
 ******************************************** */



function rgkSelect(selector, method) {

    var SelectAdd = function(el) {

        var select = el;

        // if element is not select or already used by plugin
        if (select.nodeName != 'SELECT' || select.rgk) {
            return;
        }

        // mark element as rgk
        select.rgk = {
            open: false,
            travelIndex: (select.selectedIndex < 0) ? 0 : select.selectedIndex,
            selectedIndexes: [],
            focusFlas: false,
            touchFlag: false,
            size: select.size,
            events: {
                'blur':    _ListenerBlur,
                'change':  SelectUpdate,
                'keydown': _ListenerKeydown,
                'reset':   _ListenerReset
            }
        };

        // add attribute 'size' to easy catch 'change' event
        if (!select.rgk.size) select.size = '2';

        select.classList.add('rgk-select__field');

        // html layout
        var wrapper = document.createElement('span');
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        wrapper.appendChild(select);
        wrapper.className = 'rgk-select';

        var toggler = document.createElement('span');
        toggler.className = 'rgk-select__toggler';
        wrapper.appendChild(toggler);

        var dropdown = document.createElement('span');
        dropdown.className = 'rgk-select__dropdown';
        wrapper.appendChild(dropdown);

        var list = document.createElement('span');
        list.className = 'rgk-select__list';
        dropdown.appendChild(list);

        // add options to visual select
        SelectBuild(select);

        // add element to form object
        var form = select.form;
        if (form) {
            if (!form.rgk) {
                form.rgk = { select: [] };
            } else {
                if (!form.rgk.select) form.rgk.select = [];
            }
            if (!form.rgk.select.length) {
                form.rgk.select.push(select.rgk.events['reset']);
            }
            form.rgk.select.push(select);
        }

        // add events listeners to select
        for (var evt in select.rgk.events) {
            if (evt == 'reset' && form) {
                //select.form.addEventListener(evt, select.rgk.events[evt]);
                form.addEventListener(evt, form.rgk.select[0]);
            } else {
                select.addEventListener(evt, select.rgk.events[evt]);
            }
        }

        // add events listeners to visual element
        wrapper.addEventListener('mouseover', function() {
            select.rgk.focusFlag = true;
        });
        wrapper.addEventListener('mouseout', function() {
            select.rgk.focusFlag = false;
        });
        wrapper.addEventListener('touchstart', function() {
            select.rgk.touchFlag = true;
            this.classList.add('rgk-select--touch');
        });
        wrapper.addEventListener('click', function(e) {

            if (select.disabled) return;

            var target = e.target,
                parent = target.parentNode;

            select.focus();

            if (!select.rgk.touchFlag) {

                if (!target.getAttribute('disabled') && !parent.getAttribute('disabled')) {

                    if (target.getAttribute('data-index')) {

                        // set active option for keybord navigation
                        for (var i = 0; i < select.options.length; i++) {
                            switch (parseInt(target.dataset.index, 10)) {
                                case -2:
                                    select.options[i].selected = true;
                                    break;
                                case -1:
                                    select.options[i].selected = false;
                                    break;
                                case select.options[i].index:
                                    select.options[i].selected = select.multiple ? !select.options[i].selected : true;
                                    break;
                            }
                        }

                        // trigger change event and apply choise
                        var evt = new CustomEvent('change');
                        select.dispatchEvent(evt);

                    }

                    if (!select.multiple) {
                        _SelectToggle(select, 'toggle');
                    } else if (target.classList.contains('rgk-select__toggler')) {
                        _SelectToggle(select, 'toggle');
                    } else if (parent.classList.contains('rgk-select__toggler')) {
                        _SelectToggle(select, 'hide');
                    }

                }

            }

        });

    };

    var SelectBuild = function(el) {

        // set elements with which will working
        var select = el,
            optionsList = '';

        // if element is not select or not used by plugin
        if (select.nodeName != 'SELECT' || !select.rgk) {
            return;
        }

        // fix ie option.index value
        for (var i = 0; i < select.options.length; i++) {
            var opt = select.options[i];
            opt.index = opt.index;
        }

        // add options to visual select
        if (select.multiple && select.dataset.all) {
            optionsList += '<span data-index="-2" class="rgk-select__item rgk-select__item--muted">'+ select.dataset.all +'</span>';
        }

        for (var i = 0; i < select.children.length; i++) {

            var item = select.children[i];

            if (item.tagName == 'OPTGROUP') {
                optionsList +=
                    '<span class="rgk-select__optgroup"'+ (item.disabled ? ' disabled="disabled"' : '') +'>'+
                        '<span class="rgk-select__optlabel" disabled="disabled">'+ item.getAttribute('label') +'</span>'+
                        _SelectBuildList(item.children) +
                    '</span>';
            } else {
                optionsList += _SelectBuildList([item]);
            }

        }

        select.parentNode.querySelector('.rgk-select__list').innerHTML = optionsList;

        // set selected option text and mark selected item in list
        SelectUpdate(select);

    };

    var SelectUpdate = function(el) {

        var select = el.target || el;

        // if element is not select or not used by plugin
        if (select.nodeName != 'SELECT' || !select.rgk) {
            return;
        }

        var toggler = select.nextSibling,
            dropdown = toggler.nextSibling,
            list = dropdown.querySelector('.rgk-select__list'),
            items = dropdown.querySelectorAll('[data-index]'),
            selectedIndexesNew = [],
            longestWord = '';

        // find all selected index
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].selected)
                selectedIndexesNew.push(select.options[i].index);
            if (select.options[i].text.length > longestWord.length)
                longestWord = select.options[i].text;
        };

        // detect last selected index
        var selectedLarge = (select.rgk.selectedIndexes.length > selectedIndexesNew.length) ? select.rgk.selectedIndexes : selectedIndexesNew,
        selectedSmall = (selectedLarge == selectedIndexesNew) ? select.rgk.selectedIndexes : selectedIndexesNew,
        selectedLast =  selectedLarge.filter(function(i) { return selectedSmall.indexOf(i) < 0 });

        select.rgk.selectedIndexes = selectedIndexesNew;

        // mark selected item in list
        for (var i = 0; i < items.length; i++) {

            var item = items[i];
            item.classList.remove('rgk-select__item--selected', 'rgk-select__item--focus');

            if (select.rgk.selectedIndexes.indexOf(parseInt(item.dataset.index, 10)) > -1) {
                item.classList.add('rgk-select__item--selected');
            }

            if (item.dataset.index == selectedLast) {
                item.classList.add('rgk-select__item--focus');

                // moving scroll with selected item
                if (select.rgk.open && !select.multiple) {
                    list.scrollTop = item.offsetTop;
                }
            }

        };

        // set selected option text
        if (select.rgk.selectedIndexes.length && !select.multiple) {

            toggler.innerHTML = '<span class="rgk-select__value">'+ select.options[select.selectedIndex].text +'</span>';
            toggler.setAttribute('data-longest', longestWord);

            toggler.classList.toggle('rgk-select__toggler--muted', select.options[select.selectedIndex].hasAttribute('data-placeholder'));

        } else {

            var opts = '';

            for (var i = 0; i < select.rgk.selectedIndexes.length; i++) {
                var item = select.rgk.selectedIndexes[i];
                opts += '<span class="rgk-select__selected" data-index="'+ select.options[item].index +'">'+ select.options[item].text +'</span>';
            };

            if (opts) {
                opts += '<span class="rgk-select__clear" data-index="-1">Clear</span>';
                toggler.innerHTML = opts;
            } else {
                toggler.innerHTML = select.dataset.placeholder || '';
            }
            toggler.classList.toggle('rgk-select__toggler--muted', !opts);

        }

    };

    var SelectDestroy = function(el) {

        // set elements with which will working
        var select = el,
            wrapper = select.parentNode;

        // if element is select and already used by plugin
        if (select.nodeName == 'SELECT' && select.rgk) {

            // remove element from form object
            var form = select.form,
                event = false;
            if (form) {
                for (var i = 1; i < form.rgk.select.length; i++) {
                    if (form.rgk.select[i] === select) {
                        form.rgk.select.splice(i, 1);
                        break;
                    }
                }
                if (form.rgk.select.length == 1) {
                    event = form.rgk.select[0];
                    delete form.rgk.select;
                    if (Object.keys(form.rgk).length === 0) delete form.rgk;
                }
            }

            // remove events listeners from select
            for (var evt in select.rgk.events) {
                if (evt == 'reset' && form && event) {
                    //select.form.removeEventListener(evt, select.rgk.events[evt]);
                    form.removeEventListener(evt, event);
                } else {
                    select.removeEventListener(evt, select.rgk.events[evt]);
                }
            }

            select.rgk.size ? select.size = select.rgk.size : select.removeAttribute('size');
            delete select.rgk;
            select.classList.remove('rgk-select__field');
            wrapper.parentNode.replaceChild(select, wrapper);

        }

    };



    var _SelectToggle = function(el, trigger) {

        // set elements with which will working
        var select = el,
            wrapper = select.parentNode,
            dropdown = wrapper.querySelector('.rgk-select__dropdown'),
            list = wrapper.querySelector('.rgk-select__list'),
            trigger = trigger || 'toggle',
            evt;

        // show/hide list
        if (trigger == 'toggle') {
            select.rgk.open ? trigger = 'hide' : trigger = 'show';
        }

        switch (trigger) {
            case 'hide':

                evt = new CustomEvent('hide.rgk.select');
                select.dispatchEvent(evt);
                select.rgk.open = false;
                wrapper.classList.remove('rgk-select--open', 'rgk-select--up', 'rgk-select--right');

                break;
            case 'show':

                evt = new CustomEvent('show.rgk.select');
                select.dispatchEvent(evt);
                select.rgk.open = true;
                wrapper.classList.add('rgk-select--open');

                if (dropdown.getBoundingClientRect().bottom > window.innerHeight) {
                    wrapper.classList.toggle('rgk-select--up', dropdown.getBoundingClientRect().top >= 0);
                }

                if (dropdown.getBoundingClientRect().right > window.innerWidth) {
                    wrapper.classList.toggle('rgk-select--right', dropdown.getBoundingClientRect().left >= 0);
                }

                if (!select.multiple) {
                    list.scrollTop = (select.selectedIndex < 0) ? 0 : list.querySelector('[data-index="'+ select.selectedIndex +'"]').offsetTop;
                }

                break;
            default:
                break;
        }

    };

    var _SelectBuildList = function(items) {

        var optionsList = '';

        for (var i = 0; i < items.length; i++) {
            var el = items[i];
            optionsList += '<span data-index="'+ el.index +'"'+ (el.disabled ? ' disabled="disabled"' : '') +' class="rgk-select__item '+ el.className + (el.hasAttribute('data-placeholder') ? ' rgk-select__item--muted' : '') +'">'+ el.text +'</span>';
        }

        return optionsList;

    };

    var _ListenerBlur = function() {

        var select = this;

        // close list
        if (!select.rgk.focusFlag) _SelectToggle(select, 'hide');

    };

    var _ListenerKeydown = function(e) {

        var select = this;

        // catching alt key
        if (e.altKey) {
            if (e.keyCode == 38 || e.keyCode == 40) {
                _SelectToggle(select, 'toggle');
            }
        }

        // catching keystrokes
        switch (e.keyCode) {
            case 9: // Tab
                select.rgk.focusFlag = false;
                break;
            case 27: // Esc
                // clear multiselect if closed
                if (select.multiple && !select.rgk.open) {
                    for (var i = 0; i < select.options.length; i++) {
                        select.options[i].selected = false;
                    }
                    SelectUpdate(select);
                }
                _SelectToggle(select, 'hide');
                break;
            case 13: // Enter
                if (select.rgk.open) {
                    _SelectToggle(select, 'hide');
                    // prevent form submit in webkit and opera
                    return e.returnValue = false;
                }
                break;
            default:
                break;
        }

        // traveling by miltiselect
        if (select.multiple && !e.altKey) {
            switch (e.keyCode) {
                case 37: // Left
                case 38: // Up
                    for (var i = select.rgk.travelIndex - 1; i > -1; i--) {
                        if (!select.options[i].disabled) {
                            select.rgk.travelIndex = i;
                            break;
                        }
                    }
                    break;
                case 39: // Right
                case 40: // Down
                    for (var i = select.rgk.travelIndex + 1; i < select.options.length; i++) {
                        if (!select.options[i].disabled) {
                            select.rgk.travelIndex = i;
                            break;
                        }
                    }
                    break;
                case 36: // Home
                    for (var i = 0; i < select.options.length - 1; i++) {
                        if (!select.options[i].disabled) {
                            select.rgk.travelIndex = i;
                            break;
                        }
                    }
                    break;
                case 35: // End
                    for (var i = select.options.length - 1; i > -1; i--) {
                        if (!select.options[i].disabled) {
                            select.rgk.travelIndex = i;
                            break;
                        }
                    }
                    break;
            }

            var list = select.parentNode.querySelector('.rgk-select__list'),
                focusPrev = list.querySelector('.rgk-select__item--focus'),
                focusCurr = list.querySelector('[data-index="'+ select.rgk.travelIndex +'"]');
            if (focusPrev) focusPrev.classList.remove('rgk-select__item--focus');
            focusCurr.classList.add('rgk-select__item--focus');
            list.scrollTop = focusCurr.offsetTop;
        }

    };

    var _ListenerReset = function() {

        var form = this;

        setTimeout(function() {
            for (var i = 1; i < form.rgk.select.length; i++) {
                SelectUpdate(form.rgk.select[i]);
            }
        }, 1);

    };



    var els = null;

    switch (typeof selector) {
        case 'string':
            els = document.querySelectorAll(selector);
            break;
        case 'object':
            selector.length ? els = selector : els = [selector];
            break;
    }

    if (els === null) {
        throw new TypeError('Element must not be null!');
    }

    for (var i = 0; i < els.length; i++) {

        var el = els[i];

        switch (method) {
            case 'init':
                SelectAdd(el);
                break;
            case 'build':
                SelectBuild(el);
                break;
            case 'update':
                SelectUpdate(el);
                break;
            case 'destroy':
                SelectDestroy(el);
                break;
            default:
                SelectAdd(el);
                break;
        }

    };

}