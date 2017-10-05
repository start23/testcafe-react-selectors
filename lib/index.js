'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/*global document window*/
var Selector = require('testcafe').Selector;

exports.default = Selector(function (selector) {
    var getRootElsReact15 = /*global document*/
    /*eslint-disable no-unused-vars*/
    function getRootElsReact15() {
        /*eslint-enable no-unused-vars*/
        var rootEls = document.querySelectorAll('[data-reactroot]');
        var checkRootEls = rootEls.length && Object.keys(rootEls[0]).some(function (prop) {
            return (/^__reactInternalInstance/.test(prop)
            );
        });

        return checkRootEls && rootEls || [];
    };
    var getRootElsReact16 = /*global document NodeFilter*/
    /*eslint-disable no-unused-vars*/
    function getRootElsReact16() {
        /*eslint-enable no-unused-vars*/
        var instance = null;
        var treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, function () {
            return NodeFilter.FILTER_ACCEPT;
        }, false);
        var currentNode = treeWalker.nextNode();

        while (currentNode) {
            instance = currentNode._reactRootContainer;

            if (instance) return [instance.current.child];

            currentNode = treeWalker.nextNode();
        }

        return [];
    };
    var selectorReact15 = /*global window rootEls defineSelectorProperty*/
    /*eslint-disable no-unused-vars*/
    function reactSelector15(selector) {
        /*eslint-enable no-unused-vars*/
        var visitedComponents = [];

        function getName(component) {
            var currentElement = component._currentElement;

            var name = component.getName ? component.getName() : component._tag;

            //NOTE: getName() returns null in IE, also it try to get function name for a stateless component
            if (name === null && currentElement && typeof currentElement === 'object') {
                var matches = currentElement.type.toString().match(/^function\s*([^\s(]+)/);

                if (matches) name = matches[1];
            }

            return name;
        }

        function getRootComponent(el) {
            if (!el || el.nodeType !== 1) return null;

            for (var _i2 = 0, _Object$keys2 = Object.keys(el); _i2 < _Object$keys2.length; _i2++) {
                var prop = _Object$keys2[_i2];
                if (!/^__reactInternalInstance/.test(prop)) continue;

                return el[prop]._hostContainerInfo._topLevelWrapper._renderedComponent;
            }
        }

        if (!window['%testCafeReactSelectorUtils%']) window['%testCafeReactSelectorUtils%'] = { getName, getRootComponent };

        function checkRootNodeVisited(component) {
            return visitedComponents.indexOf(component) > -1;
        }

        function getRenderedChildren(component) {
            var hostNode = component.getHostNode();
            var hostNodeType = hostNode.nodeType;
            var container = component._instance && component._instance.container;
            var isRootNode = hostNode.hasAttribute && hostNode.hasAttribute('data-reactroot');

            //NOTE: prevent the repeating visiting of reactRoot Component inside of portal
            if (component._renderedComponent && isRootNode) {
                if (checkRootNodeVisited(component._renderedComponent)) return [];

                visitedComponents.push(component._renderedComponent);
            }

            //NOTE: Detect if it's a portal component
            if (hostNodeType === 8 && container) {
                var domNode = container.querySelector('[data-reactroot]');

                return { _: getRootComponent(domNode) };
            }

            return component._renderedChildren || component._renderedComponent && { _: component._renderedComponent } || {};
        }

        function parseSelectorElements(compositeSelector) {
            var compositeSelectorTrimmed = compositeSelector.trim();
            var elements = [];
            var numSquareBrackets = 0;
            var elementName = '';

            for (var i = 0; i < compositeSelectorTrimmed.length; i++) {
                var c = compositeSelectorTrimmed[i];

                if (c === '[') numSquareBrackets++;

                if (c === ']') numSquareBrackets--;

                // If there's a space, we've reached the end of an element name which means
                //  we should push the element name to the list of elements
                if (c === ' ') {
                    if (numSquareBrackets === 0) {
                        elements.push(elementName);
                        elementName = '';
                        numSquareBrackets = 0;
                        continue;
                    }
                }

                elementName += c;
            }

            // Push the last element since there's no space to trigger the push above
            elements.push(elementName);

            return elements.filter(function (el) {
                return !!el;
            }).map(function (el) {
                var attributePairs = el.match(/\[.+?\]/g, function () {}) || [];
                var name = el.replace(/\[.+?\]/g, '').trim();
                var attributes = attributePairs.map(function (attribute) {
                    var attributeKeyValuePair = attribute.substr(1, attribute.length - 2);
                    var attributeName = attributeKeyValuePair.substr(0, attributeKeyValuePair.indexOf('='));
                    var attributeValue = attributeKeyValuePair.substr(attributeKeyValuePair.indexOf('=') + 1);

                    // Strip out quotation marks
                    if ((attributeValue[0] === '"' || attributeValue[0] === '\'') && (attributeValue[attributeValue.length - 1] === '"' || attributeValue[attributeValue.length - 1] === '\'')) attributeValue = attributeValue.substr(1, attributeValue.length - 2);

                    return {
                        name: attributeName,
                        value: attributeValue
                    };
                });

                return {
                    name,
                    attributes
                };
            });
        }

        function reactSelect(compositeSelector) {
            var foundComponents = [];

            function findDOMNode(rootEl) {
                if (typeof compositeSelector !== 'string') throw new Error(`Selector option is expected to be a string, but it was ${typeof compositeSelector}.`);

                var selectorIndex = 0;
                var selectorElms = parseSelectorElements(compositeSelector);

                if (selectorElms.length) defineSelectorProperty(selectorElms[selectorElms.length - 1].name);

                function walk(reactComponent, cb) {
                    if (!reactComponent) return;

                    var componentWasFound = cb(reactComponent);

                    //NOTE: we're looking for only between the children of component
                    if (selectorIndex > 0 && selectorIndex < selectorElms.length && !componentWasFound) {
                        var isTag = selectorElms[selectorIndex].name.toLowerCase() === selectorElms[selectorIndex].name;
                        var parent = reactComponent._hostParent;

                        if (isTag && parent) {
                            var renderedChildren = parent._renderedChildren;
                            var renderedChildrenKeys = Object.keys(renderedChildren);

                            var currentElementId = renderedChildrenKeys.filter(function (key) {
                                var renderedComponent = renderedChildren[key]._renderedComponent;

                                return renderedComponent && renderedComponent._domID === reactComponent._domID;
                            })[0];

                            if (!renderedChildren[currentElementId]) return;
                        }
                    }

                    var currSelectorIndex = selectorIndex;

                    renderedChildren = getRenderedChildren(reactComponent);

                    Object.keys(renderedChildren).forEach(function (key) {
                        walk(renderedChildren[key], cb);

                        selectorIndex = currSelectorIndex;
                    });
                }

                return walk(getRootComponent(rootEl), function (reactComponent) {
                    var componentName = getName(reactComponent);

                    if (!componentName) return false;

                    var domNode = reactComponent.getHostNode();

                    if (selectorElms[selectorIndex] && selectorElms[selectorIndex].name !== componentName) return false;
                    if (selectorElms[selectorIndex] && selectorElms[selectorIndex].attributes.length > 0) {
                        var props = reactComponent._instance && reactComponent._instance.props || {};
                        var unequalAttributes = selectorElms[selectorIndex].attributes.filter(function (attribute) {
                            return props[attribute.name] !== attribute.value;
                        });

                        if (unequalAttributes.length > 0) return false;
                    }

                    if (selectorIndex === selectorElms.length - 1) foundComponents.push(domNode);

                    selectorIndex++;

                    return true;
                });
            }

            [].forEach.call(rootEls, findDOMNode);

            return foundComponents;
        }

        return reactSelect(selector);
    };
    var selectorReact16 = /*global window document Node rootEls defineSelectorProperty*/
    /*eslint-disable no-unused-vars*/
    function react16Selector(selector) {
        /*eslint-enable no-unused-vars*/
        function createAnnotationForEmptyComponent(component) {
            var comment = document.createComment('testcafe-react-selectors: the requested component didn\'t render any DOM elements');

            comment.__$$reactInstance = component;

            window['%testCafeReactEmptyComponent%'] = comment;

            return comment;
        }

        function getName(component) {
            if (!component.type && !component.memoizedState) return null;

            var currentElement = component.type ? component : component.memoizedState.element;

            //NOTE: tag
            if (typeof component.type === 'string') return component.type;
            if (component.type.name) return component.type.name;

            var matches = currentElement.type.toString().match(/^function\s*([^\s(]+)/);

            if (matches) return matches[1];

            return null;
        }

        function getContainer(component) {
            var node = component;

            while (!(node.stateNode instanceof Node)) {
                if (node.child) node = node.child;else break;
            }

            if (!(node.stateNode instanceof Node)) return null;

            return node.stateNode;
        }

        if (!window['%testCafeReactSelectorUtils%']) window['%testCafeReactSelectorUtils%'] = { getName };

        function getRenderedChildren(component) {
            //Portal component
            if (!component.child && component.stateNode.container && component.stateNode.container._reactRootContainer) component = component.stateNode.container._reactRootContainer.current;

            if (!component.child) return [];

            var currentChild = component.child;

            if (typeof component.type !== 'string') currentChild = component.child;

            var children = [currentChild];

            while (currentChild.sibling) {
                children.push(currentChild.sibling);

                currentChild = currentChild.sibling;
            }

            return children;
        }

        function parseSelectorElements(compositeSelector) {
            var compositeSelectorTrimmed = compositeSelector.trim();
            var elements = [];
            var numSquareBrackets = 0;
            var elementName = '';

            for (var i = 0; i < compositeSelectorTrimmed.length; i++) {
                var c = compositeSelectorTrimmed[i];

                if (c === '[') numSquareBrackets++;

                if (c === ']') numSquareBrackets--;

                // If there's a space, we've reached the end of an element name which means
                //  we should push the element name to the list of elements
                if (c === ' ') {
                    if (numSquareBrackets === 0) {
                        elements.push(elementName);
                        elementName = '';
                        numSquareBrackets = 0;
                        continue;
                    }
                }

                elementName += c;
            }

            // Push the last element since there's no space to trigger the push above
            elements.push(elementName);

            return elements.filter(function (el) {
                return !!el;
            }).map(function (el) {
                var attributePairs = el.match(/\[.+?\]/g, function () {}) || [];
                var name = el.replace(/\[.+?\]/g, '').trim();
                var attributes = attributePairs.map(function (attribute) {
                    var attributeKeyValuePair = attribute.substr(1, attribute.length - 2);
                    var attributeName = attributeKeyValuePair.substr(0, attributeKeyValuePair.indexOf('='));
                    var attributeValue = attributeKeyValuePair.substr(attributeKeyValuePair.indexOf('=') + 1);

                    // Strip out quotation marks
                    if ((attributeValue[0] === '"' || attributeValue[0] === '\'') && (attributeValue[attributeValue.length - 1] === '"' || attributeValue[attributeValue.length - 1] === '\'')) attributeValue = attributeValue.substr(1, attributeValue.length - 2);

                    return {
                        name: attributeName,
                        value: attributeValue
                    };
                });

                return {
                    name,
                    attributes
                };
            });
        }

        function reactSelect(compositeSelector) {
            var foundComponents = [];

            function findDOMNode(rootComponent) {
                if (typeof compositeSelector !== 'string') throw new Error(`Selector option is expected to be a string, but it was ${typeof compositeSelector}.`);

                var selectorIndex = 0;
                var selectorElms = parseSelectorElements(compositeSelector);

                if (selectorElms.length) defineSelectorProperty(selectorElms[selectorElms.length - 1].name);

                function walk(reactComponent, cb) {
                    if (!reactComponent) return;

                    var componentWasFound = cb(reactComponent);
                    var currSelectorIndex = selectorIndex;

                    var isNotFirstSelectorPart = selectorIndex > 0 && selectorIndex < selectorElms.length;

                    if (isNotFirstSelectorPart && !componentWasFound) {
                        var isTag = selectorElms[selectorIndex].name.toLowerCase() === selectorElms[selectorIndex].name;

                        //NOTE: we're looking for only between the children of component
                        if (isTag && getName(reactComponent.return) !== selectorElms[selectorIndex - 1].name) return;
                    }

                    var renderedChildren = getRenderedChildren(reactComponent);

                    Object.keys(renderedChildren).forEach(function (key) {
                        walk(renderedChildren[key], cb);

                        selectorIndex = currSelectorIndex;
                    });
                }

                return walk(rootComponent, function (reactComponent) {
                    var componentName = getName(reactComponent);

                    if (!componentName) return false;

                    var domNode = getContainer(reactComponent);

                    if (selectorElms[selectorIndex] && selectorElms[selectorIndex].name !== componentName) return false;
                    if (selectorElms[selectorIndex] && selectorElms[selectorIndex].attributes.length > 0) {
                        var props = reactComponent.memoizedProps || {};
                        var unequalAttributes = selectorElms[selectorIndex].attributes.filter(function (attribute) {
                            return props[attribute.name] !== attribute.value;
                        });

                        if (unequalAttributes.length > 0) return false;
                    }

                    if (selectorIndex === selectorElms.length - 1) foundComponents.push(domNode || createAnnotationForEmptyComponent(reactComponent));

                    selectorIndex++;

                    return true;
                });
            }

            [].forEach.call(rootEls, findDOMNode);

            return foundComponents;
        }

        return reactSelect(selector);
    };
    var rootEls = null;

    function defineSelectorProperty(value) {
        if (window['%testCafeReactSelector%']) delete window['%testCafeReactSelector%'];

        Object.defineProperty(window, '%testCafeReactSelector%', {
            enumerable: false,
            configurable: true,
            writable: false,
            value: value
        });
    }

    rootEls = getRootElsReact15();

    if (rootEls.length) {
        window['%testCafeReactVersion%'] = 15;

        return selectorReact15(selector);
    }

    rootEls = getRootElsReact16();

    if (rootEls.length) {
        window['%testCafeReactVersion%'] = 16;

        return selectorReact16(selector);
    }

    throw new Error('testcafe-react-selectors supports React version 15.x and newer');
}).addCustomMethods({
    getReact: function getReact(node, fn) {
        var reactVersion = window['%testCafeReactVersion%'];
        var getReactReact15 = /*global window*/
        /*eslint-disable no-unused-vars*/
        function getReact15(node, fn) {
            /*eslint-enable no-unused-vars*/
            var utils = window['%testCafeReactSelectorUtils%'];

            function copyReactObject(obj) {
                var copiedObj = {};

                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop !== 'children') copiedObj[prop] = obj[prop];
                }

                return copiedObj;
            }

            function getComponentInstance(component) {
                var parent = component._hostParent || component;
                var renderedChildren = parent._renderedChildren || { _: component._renderedComponent } || {};
                var renderedChildrenKeys = Object.keys(renderedChildren);
                var componentName = window['%testCafeReactSelector%'];

                for (var index = 0; index < renderedChildrenKeys.length; ++index) {
                    var key = renderedChildrenKeys[index];
                    var renderedComponent = renderedChildren[key];
                    var _componentInstance = null;

                    while (renderedComponent) {
                        if (componentName === utils.getName(renderedComponent)) _componentInstance = renderedComponent._instance;

                        if (renderedComponent._domID === component._domID) return _componentInstance;

                        renderedComponent = renderedComponent._renderedComponent;
                    }
                }

                return null;
            }

            function getComponentForDOMNode(el) {
                if (!el || !(el.nodeType === 1 || el.nodeType === 8)) return null;

                var isRootNode = el.hasAttribute && el.hasAttribute('data-reactroot');
                var componentName = window['%testCafeReactSelector%'];

                if (isRootNode) {
                    var rootComponent = utils.getRootComponent(el);

                    //NOTE: check if it's not a portal component
                    if (utils.getName(rootComponent) === componentName) return rootComponent._instance;

                    return getComponentInstance(rootComponent);
                }

                for (var _i4 = 0, _Object$keys4 = Object.keys(el); _i4 < _Object$keys4.length; _i4++) {
                    var prop = _Object$keys4[_i4];
                    if (!/^__reactInternalInstance/.test(prop)) continue;

                    return getComponentInstance(el[prop]);
                }
            }

            var componentInstance = getComponentForDOMNode(node);

            if (!componentInstance) return null;

            delete window['%testCafeReactSelector%'];

            if (typeof fn === 'function') {
                return fn({
                    state: copyReactObject(componentInstance.state),
                    props: copyReactObject(componentInstance.props)
                });
            }

            return {
                state: copyReactObject(componentInstance.state),
                props: copyReactObject(componentInstance.props)
            };
        };
        var getReactReact16 = /*global window*/
        /*eslint-disable no-unused-vars*/
        function getReact16(node, fn) {
            /*eslint-enable no-unused-vars*/
            var utils = window['%testCafeReactSelectorUtils%'];

            function copyReactObject(obj) {
                var copiedObj = {};

                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop) && prop !== 'children') copiedObj[prop] = obj[prop];
                }

                return copiedObj;
            }

            function getComponentInstance(component) {
                var componentName = window['%testCafeReactSelector%'];
                var isTag = typeof component.type === 'string';
                var currentComponent = component;

                if (isTag) return null;

                while (componentName !== utils.getName(currentComponent) && currentComponent.return) {
                    currentComponent = currentComponent.return;
                }return {
                    props: currentComponent.memoizedProps,
                    state: currentComponent.memoizedState
                };
            }

            function getComponentForDOMNode(el) {
                if (!el || !(el.nodeType === 1 || el.nodeType === 8)) return null;

                if (window['%testCafeReactEmptyComponent%']) return getComponentInstance(window['%testCafeReactEmptyComponent%'].__$$reactInstance);

                for (var _i6 = 0, _Object$keys6 = Object.keys(el); _i6 < _Object$keys6.length; _i6++) {
                    var prop = _Object$keys6[_i6];
                    if (!/^__reactInternalInstance/.test(prop)) continue;

                    return getComponentInstance(el[prop].return);
                }
            }

            var componentInstance = getComponentForDOMNode(node);

            if (!componentInstance) return null;

            delete window['%testCafeReactSelector%'];
            delete window['%testCafeReactEmptyComponent%'];

            if (typeof fn === 'function') {
                return fn({
                    state: copyReactObject(componentInstance.state),
                    props: copyReactObject(componentInstance.props)
                });
            }

            return {
                state: copyReactObject(componentInstance.state),
                props: copyReactObject(componentInstance.props)
            };
        };

        delete window['%testCafeReactVersion%'];

        if (reactVersion === 15) return getReactReact15(node, fn);
        if (reactVersion === 16) return getReactReact16(node, fn);
    }
});