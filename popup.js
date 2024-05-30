$(function() {
    $('#save').click(function() {
        var newItem = {}; // Initialisiere das Objekt

        Promise.all([
            executeDOMtoString('#viewad-title'),
            executeDOMtoString('#viewad-price'),
            executeDOMtoString('#viewad-description-text'),
            executeDOMtoString('#viewad-locality'),
            executeDOMtoString('#street-address'),
            executeDOMtoString('.boxedarticle--details--shipping'),
            executeDOMtoString('#addetailslist--detail--value')
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

            //document.getElementById('title1').innerText = JSON.stringify(newItem);
            //return;

            var items = {};
            chrome.storage.sync.get('allItems', function(data) {
                if (data) {
                    items = data.allItems;
                }
                items.push(newItem)
                chrome.storage.sync.set({'allItems' : items});
            });
        }).catch(function(error) {
            console.error('Error:', error);
        });
    });
});


function executeDOMtoString(selector) {
    return chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: DOMtoString,
            args: [selector]
        });
    }).then(function (results) {
        return results[0].result;
    }).catch(function (error) {
        throw new Error('There was an error injecting script: ' + error.message);
    });
}

function DOMtoString(selector) {
    if (selector) {
        selector = document.querySelector(selector);
        if (!selector) return "ERROR: querySelector failed to find node"
    } else {
        selector = document.documentElement;
    }
    return selector.innerText;
}

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

chrome.storage.onChanged.addListener(function() {
    chrome.storage.sync.get({
      profileId: 0
    }, function() {
        showItems();
    });
  });

window.onload = showItems;