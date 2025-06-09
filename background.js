const MYCLIP_CONTEXT_MENU_ID = "myclip_context_menu";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MYCLIP_CONTEXT_MENU_ID,
    title: "Guardar con MyClip",
    contexts: ["selection", "link", "image", "page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MYCLIP_CONTEXT_MENU_ID) {
    let itemToSave = null;

    if (info.selectionText) {
      itemToSave = { type: "text", content: info.selectionText, url: tab.url, title: tab.title };
    } else if (info.linkUrl) {
      itemToSave = { type: "url", content: info.linkUrl, url: tab.url, title: tab.title };
    } else if (info.srcUrl) {
      itemToSave = { type: "image_url", content: info.srcUrl, url: tab.url, title: tab.title };
    } else {
      itemToSave = { type: "url", content: tab.url, url: tab.url, title: tab.title };
    }

    if (itemToSave) {
      saveItem(itemToSave);
    }
  }
});

function saveItem(item) {
  item.id = Date.now();

  chrome.storage.local.get(['myClipItems'], (result) => {
    const myClipItems = result.myClipItems || [];
    myClipItems.push(item);
    chrome.storage.local.set({ myClipItems: myClipItems }, () => {
      console.log('Item saved:', item);
      chrome.runtime.sendMessage({ action: "itemSaved" });
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "someOtherAction") {
  }
});