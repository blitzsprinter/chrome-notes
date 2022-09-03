import * as sync from './modules/sync/sync';
import {migrate} from './modules/storage/migrate';
import idb from './modules/db/idb';
import { IDBNote } from './modules/db/interfaces';
// import {Encrypter} from './modules/encryption/encrypter'


const colors = {
  RED: '\x1b[31m%s\x1b[0m',
  GREEN: '\x1b[32m%s\x1b[0m',
  BLUE: '\x1b[34m%s\x1b[0m',
};

function TEraseData() {
  chrome.storage.local.clear().finally(() => {
    chrome.storage.sync.clear().finally(async() => {
      idb.load((data: IDBNote[]) => {
        for (let i = 0; i < data.length; i++) {
          const element = data[i];

          element.locked = false;
          element.inCloud = false;
          idb.update(element); 
        }
        
        chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
      });
    });
  });
}

interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

var _time_: number;

chrome.runtime.onInstalled.addListener(() => {
  TEraseData();
  chrome.alarms.clearAll();
  chrome.alarms.create('alert', {periodInMinutes: 1});
  chrome.alarms.create('sync', {periodInMinutes: 0.25});
  // chrome.alarms.create('sync', {periodInMinutes: 0.45});
  // chrome.alarms.create('sync', {periodInMinutes: 1.45});
  // chrome.alarms.create('sync', {periodInMinutes: 15});
  chrome.storage.local.remove('syncProcessing');

  chrome.storage.local.get(['mode', 'migrate', 'oldNotes', 'syncEnabled', 'internalKey', 'shareKey', 'appId'], function(result) {
    if (!result.appId) {
      sync.initApp();
    }

    if (result.migrate && result.oldNotes) {
      migrate(result.oldNotes);
      return chrome.storage.local.clear();
    }
    
    if (result.migrate) {
      chrome.action.setPopup({popup: ''}, ()=>{});
      chrome.storage.local.set({mode: 4});
      return chrome.tabs.create({url: chrome.runtime.getURL('migration.html')});
    }

    setPopup(Number(result.mode));
    chrome.storage.onChanged.addListener(eventOnStorageChanged);
    startSync();
  });
});

chrome.alarms.onAlarm.addListener((alarm:chrome.alarms.Alarm) => {
  _time_ = new Date().getTime();

  if (alarm.name === 'sync') {
    return startSync();
  }

  chrome.storage.local.get(['mode'], function(result) {
    setPopup(Number(result.mode));
  });
});

chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get(['mode', 'window', 'migrate', 'tabInfo'], function(result) {
    let mode: number = Number(result.mode);
    let window: IWindow = result.window;

    if (result.migrate) {
      return openMigration();
    }

    if (result.tabInfo) {
      findTab(result.tabInfo.id, (tab: chrome.tabs.Tab) => {
        openPopup(mode, window, tab.id, tab.windowId);
      }, () => {
        openPopup(mode, window);
      });
    } else {
      openPopup(mode, window);
    }
  });
});

chrome.runtime.onMessage.addListener((message: string, sender: any, sendResponse: (response?: any) => void) => {
  if (message === 'get-sync-notes') {
    sendResponse({working: sync.isBusy(), time: _time_});
  }
});

function eventOnStorageChanged(changes: {[key: string]: chrome.storage.StorageChange}, namespace: chrome.storage.AreaName) {
  if (namespace === 'local') {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
      if (key === 'mode' && oldValue !== newValue) {
        console.log('storage.onChanged.mode:', oldValue, newValue);
        setPopup(Number(newValue));
      }

      if (key === 'internalKey' && oldValue && newValue && oldValue !== newValue) {
        let promise: Promise<void> = sync.wait();

        promise.finally(() => {
          sync.resync(oldValue, newValue);
        });
      }
    }
  }

  if (namespace === 'sync') {
    sync.onStorageChanged(changes, namespace);
  }
}

function setPopup(mode: number) {
  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({popup: ''}, ()=>{});
  } else {
    chrome.action.setPopup({popup: 'popup.html'}, ()=>{});
  }
}

function findTab(tabId: number, found: Function, defaults?: Function) {
  chrome.tabs.query({}, function (tabs) {
    for(let i = 0; i < tabs.length; i++) {
      if (tabs[i].id === tabId) {
        return found(tabs[i]);
      }
    }

    if (defaults) {
      defaults();
    }
  });
}

function openPopup(mode: number, window?: IWindow, tabId?: number, windowId?: number) {
  if (tabId) {
    if (windowId) {
      chrome.windows.update(windowId, {focused: true});
    }

    return chrome.tabs.update(tabId, {active: true});
  }

  if (mode === 3) {
    return chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
  }

  if (mode === 4) {
    if (window) {
      chrome.windows.create({
        focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup',
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      });
    } else {
      chrome.windows.create({focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup'});
    }
  }
}

function openMigration() {
  var url = chrome.runtime.getURL('migration.html');

  chrome.tabs.query({url: url, currentWindow: true}, function (tabs) {
    if (tabs.length) {
      let tab = tabs[0];
      
      chrome.tabs.update(tab.id, {active: true});
    } else {
      chrome.tabs.query({url: url}, function (allTabs) {
        if (tabs.length) {
          let tab = allTabs[0];

          if (tab.windowId) {
            chrome.windows.update(tab.windowId, {focused: true});
          }
      
          chrome.tabs.update(tab.id, {active: true});
        } else {
          chrome.tabs.create({url: url});
        }
      });
    }
  });
}

function startSync(): Promise<void> {
  console.log(colors.GREEN, '=>=>=> start Sync...');

  sync.isBusy().then((busy: boolean) => {

    if (!busy) {
      sync.start().finally(() => {
        chrome.storage.sync.getBytesInUse().then((bytes: number) => {
          console.log('bytes: ', bytes, chrome.storage.sync.QUOTA_BYTES);
          console.log(colors.GREEN, '=>=>=> Sync is completed!');
        });
      });
    } else {
      console.log(colors.GREEN, '... busy');
    }
  });

  return Promise.resolve();
}
