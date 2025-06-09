document.addEventListener('DOMContentLoaded', () => {
  const saveCurrentPageButton = document.getElementById('saveCurrentPageButton');

  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  const savedLinksList = document.getElementById('savedLinksList');
  const savedTextList = document.getElementById('savedTextList');
  const savedImagesList = document.getElementById('savedImagesList');

  function showTab(tabId) {
    tabButtons.forEach(button => button.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`tab-content-${tabId}`).classList.add('active');

    loadAndDisplayItems();
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      showTab(tabId);
    });
  });

  function loadAndDisplayItems() {
    chrome.storage.local.get(['myClipItems'], (result) => {
      const myClipItems = result.myClipItems || [];

      savedLinksList.innerHTML = '';
      savedTextList.innerHTML = '';
      savedImagesList.innerHTML = '';

      const links = myClipItems.filter(item => item.type === 'url');
      const texts = myClipItems.filter(item => item.type === 'text');
      const images = myClipItems.filter(item => item.type === 'image_url');

      renderList(links, savedLinksList);
      renderList(texts, savedTextList);
      renderList(images, savedImagesList);
    });
  }

  function renderList(items, targetListElement) {
    if (items.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = `No items saved yet in this category.`;
      targetListElement.appendChild(emptyMessage);
      return;
    }

    items.forEach((item) => {
      const listItem = document.createElement('li');
      let displayContent = '';
      let itemUrl = item.url || '#';

      switch (item.type) {
        case 'url':
          displayContent = `<a href="${item.content}" target="_blank">${item.title || item.content}</a> <span style="font-size:0.8em; color:#888;">(<a href="${itemUrl}" target="_blank" style="color:#888;">Link</a>)</span>`; // <--- MODIFICADO AQUÍ
          break;
        case 'text':
          displayContent = `"${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}" <span style="font-size:0.8em; color:#888;">(<a href="${itemUrl}" target="_blank" style="color:#888;">Link</a>)</span>`; // <--- MODIFICADO AQUÍ
          break;
        case 'image_url':
          displayContent = `<img src="${item.content}" style="max-width: 80px; max-height: 80px; vertical-align: middle; margin-right: 8px;"> <span style="font-size:0.8em; color:#888;">(<a href="${itemUrl}" target="_blank" style="color:#888;">Link</a>)</span>`; // <--- MODIFICADO AQUÍ
          break;
        default:
          displayContent = JSON.stringify(item);
      }

      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add('item-buttons');

      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-btn');
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      `;
      copyButton.addEventListener('click', () => {
        copyToClipboard(item.content);
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.classList.remove('copied');
        }, 1500);
      });
      buttonContainer.appendChild(copyButton);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.classList.add('delete-btn');
      deleteButton.addEventListener('click', () => {
        deleteItem(item);
      });
      buttonContainer.appendChild(deleteButton);

      listItem.innerHTML = `<span>${displayContent}</span>`;
      listItem.appendChild(buttonContainer);

      targetListElement.appendChild(listItem);
    });
  }

  saveCurrentPageButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const newUrlItem = { type: "url", content: currentTab.url, url: currentTab.url, title: currentTab.title };
      saveItem(newUrlItem);
    });
  });

  function saveItem(item) {
    item.id = Date.now();

    chrome.storage.local.get(['myClipItems'], (result) => {
      const myClipItems = result.myClipItems || [];
      myClipItems.push(item);
      chrome.storage.local.set({ myClipItems: myClipItems }, () => {
        loadAndDisplayItems();
      });
    });
  }

  function deleteItem(itemToDelete) {
    chrome.storage.local.get(['myClipItems'], (result) => {
      let myClipItems = result.myClipItems || [];
      myClipItems = myClipItems.filter(item => item.id !== itemToDelete.id);

      chrome.storage.local.set({ myClipItems: myClipItems }, () => {
        loadAndDisplayItems();
      });
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Content copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy content:', err);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        console.log('Fallback copy successful!');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textarea);
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "itemSaved") {
      loadAndDisplayItems();
    }
  });

  showTab('links');
});