// adds save button event to popup page
$(function() {
    $('#saveImages').click(function(){saveButtonClick(true)});
    $('#save').click(function(){saveButtonClick()});
});

function saveButtonClick(withImages = false) {
    var newItem = {};

    Promise.all([
        DOMgetValue('title'),
        DOMgetValue('price'),
        DOMgetValue('description'),
        DOMgetValue('locality'),
        DOMgetValue('street'),
        DOMgetValue('shipping'),
        DOMgetValue('condition'),
        DOMgetValue('images')
    ]).then(function(results) {
        newItem.title = results[0];
        newItem.price = results[1];

        if (newItem.price.includes('VB')) {
            newItem.priceType = 1;
        } else if (newItem.price.includes('verschenken')) {
            newItem.priceType = 2;
        } else {
            newItem.priceType = 0;
        }

        newItem.description = results[2];
        newItem.postCode = results[3].trim().split(' ')[0];
        newItem.street = results[4];
        if (newItem.street.includes('querySelector')) {
            newItem.street = "";
        }
        newItem.shipping = results[5].trim().split(' ')[3];
        newItem.condition = results[6].trim();
        newItem.date = new Date().toLocaleDateString('de-de');

        if (withImages) {
            results[7].forEach(image => {
                chrome.downloads.download({url: image});        // needs permission "downloads"!
            });
            newItem.images = results[7].map(function(image) {
                return image.split('/').pop().split('?')[0] + '.jpg';
            });

        } else {
            newItem.images = [];
        }

        // document.getElementById('test').innerText = JSON.stringify(newItem);
        // return;

        var items = {};
        chrome.storage.sync.get('allItems', function(data) {        // needs permission "storage"!
            if (data) {
                items = data.allItems;
            }
            items.push(newItem)
            chrome.storage.sync.set({'allItems' : items});
        });
    }).catch(function(error) {
        console.error('Error:', error);
    });
}

// selects and returns dom elements content by query selector
function DOMgetValue(selector) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {        // needs permission "activeTab"!
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;
        
        var keyWordID = ['title', 'price', 'description', 'locality', 'street', 'shipping', 'condition', 'images'].indexOf(selector);
        if (activeTab.url.includes('s-anzeige')) {
            selector = ['#viewad-title', '#viewad-price', '#viewad-description-text', '#viewad-locality', '#street-address', '.boxedarticle--details--shipping', '#addetailslist--detail--value', '#viewad-image>data-imgsrc'][keyWordID];
        } else if (activeTab.url.includes('p-anzeige')) {
            selector = ['#postad-title', '#micro-frontend-price', '#pstad-descrptn', '#pstad-zip', '#pstad-street', '#jsx-3271908351 PackageSizeItem--Price', '.jsx-3300347113', '.imagebox-new-thumbnail--cover>data-xxl'][keyWordID]; // ----------------------------- HIER WEITER ---------------------------- //
        } else {
            throw new Error('Page Type not implemented!');
        }

        if (selector.includes('>')) {
            var attribute = selector.split('>')[1];
            selector = selector.split('>')[0];
            return chrome.scripting.executeScript({         // needs permission "scripting"!
                target: { tabId: activeTabId },
                func: DOMattributeToString,
                args: [selector, attribute]
            });
            
        } else {
            return chrome.scripting.executeScript({         // needs permission "scripting"!
                target: { tabId: activeTabId },
                func: DOMtoString,
                args: [selector]
            });
        }
    }).then(function (results) {
        return results[0].result;
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

// reats dom elements innerText by selector and returns as string
function DOMtoString(selector) {
    if (selector) {
        selector = document.querySelector(selector);
        if (!selector) return "ERROR: querySelector failed to find node"
    } else {
        selector = document.documentElement;
    }
    return selector.innerText;
}

function DOMattributeToString(selector, attribute) {
    let elements;
    if (selector) {
        elements = document.querySelectorAll(selector);
        if (!elements.length) return "ERROR: querySelector failed to find nodes";
    } else {
        elements = [document.documentElement];
    }

    let values = [];
    elements.forEach(element => {
        let value = attribute ? element.getAttribute(attribute) : element.innerHTML;
        values.push(value);
    });

    return values;
}


// sets value of e.g. input in dom by query selector
function DOMSetValue(selector, value) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: (selector, value) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.value = value;
                }
            },
            args: [selector, value]
        });
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

// sets index of list in dom by query selector
function DOMSetIndex(selector, value) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: (selector, value) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.selectedIndex = value;
                }
            },
            args: [selector, value]
        });
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

// sets checkbox state in dom by query selector
function DOMSetCheckbox(selector, value) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: (selector, value) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.checked = value;
                }
            },
            args: [selector, value]
        });
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

// changes atribute of element in dom by query selector
function DOMChangeAttribute(selector, oldValue, newValue) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: (selector, value) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.removeAttribute(oldValue, "");
                    element.setAttribute(newValue, "");
                }
            },
            args: [selector, value]
        });
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

// stets innerText of dom by query selector
function DOMSetTextContent(selector, value) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: (selector, value) => {
                const element = document.querySelector(selector);
                if (element) {
                    element.textContent = value;
                }
            },
            args: [selector, value]
        });
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

// displays list of all currently stored items
function showItems() {
    allItems = chrome.storage.sync.get('allItems', function(data) {
        if (data) {
            const container = document.getElementById('item-list');
            container.textContent = '';

            if (data.allItems.length < 1) {
                const itemDiv = document.createElement('div');
                itemDiv.innerHTML = `<div class="no-items">no items</div>`
                container.appendChild(itemDiv);
                return;
            }

            data.allItems.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item';
                itemDiv.id = 'item_' + (index + 1);

                itemDiv.innerHTML = `
                    <div class="item-info">
                        <img src="noimage.png" alt="${item.title}">
                        <div class="item-details">
                            <div class="item-title">${item.title}</div>
                            <div class="item-price">${item.price}</div>
                            <div class="item-date">Gespeichert am ${item.date}</div>
                        </div>
                    </div>
                    <div class="item-buttons">
                        <button id="load_${index + 1}">Load</button>
                        <button id="delete_${index + 1}">Delete</button>
                    </div>`;
                container.appendChild(itemDiv);
            });
            container.addEventListener('click', handleButtonClick);
        } 
    });
}

// manages button click events of item buttons
function handleButtonClick(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON') {
        const buttonId = target.id;
        const itemId = buttonId.split('_')[1];
        if (itemId >= 0) {
            if (buttonId.startsWith('load')) {
                handleLoadClick(itemId);
            } else if (buttonId.startsWith('delete')) {
                handleDeleteClick(itemId);
            }
        }
    }
}

// fills form from stored items
function handleLoadClick(id) {
    chrome.storage.sync.get('allItems', function(data) {
        if (data) {
            if (id <= data.allItems.length) {
                let item = data.allItems[id - 1];
                DOMSetValue('#postad-title', item.title);
                DOMSetValue('#micro-frontend-price', item.price.split(' ')[0]);
                DOMSetIndex('#micro-frontend-price-type', (item.priceType + 1));
                DOMSetValue('#pstad-descrptn', item.description);
                DOMSetTextContent('#jsx-3300347113', item.condition);
                DOMSetValue('#pstad-zip', item.postCode)
                if (item.street.length > 1){
                    DOMSetCheckbox('#addressVisibility', true);
                    DOMChangeAttribute('#pstad-street', 'disabled', 'enabled')
                    DOMSetValue('#pstad-street', item.street);
                } else {
                    DOMSetCheckbox('#addressVisibility', false);
                    DOMChangeAttribute('#pstad-street', 'enabled', 'disabled')
                    DOMSetValue('#pstad-street', "");
                }
            }
        }
    });
}

// remove item from the list in storage and refresh popup page
function handleDeleteClick(id) {
    chrome.storage.sync.get('allItems', function(data) {
        if (data) {
            if (id <= data.allItems.length) {
                let items = [];
                data.allItems.forEach((item, index) => {
                    if ((index + 1) != id) {
                        items.push(item);
                    }
                });
                chrome.storage.sync.set({'allItems' : items});
            }
        }
    });
}

// add listener to fire reload event if item list in storage has changed
chrome.storage.onChanged.addListener(function() {
    chrome.storage.sync.get({
      profileId: 0
    }, function() {
        showItems();
    });
});

// initial loading of already stored items
window.onload = showItems;