// ==UserScript==
// @name         roundcube - Show only unread by default
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Automatically hide read mails when entering inbox **and** the hide read mails filter has been activated
//               manually before or when entering the junk folder (always).
// @author       skafau
// @match        https://mail.halumi.at/?_task=mail*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  let _hideReadInInbox = false;

  function _isBoxLocation(boxName) {
    const params = new URLSearchParams(window.location.search);
    const task = params.get('_task');
    const box = params.get('_mbox');
    return 'mail' === task && box === boxName;
  }
  const _isInboxLocation = () => _isBoxLocation('INBOX');

  const _getHideReadBtn = () => document.querySelector('[role="search"] > a.button.unread');
  const _getInboxMenuLi = () => document.querySelector('li.mailbox.inbox');
  const _getJunkMenuLi = () => document.querySelector('li.mailbox.junk');

  const _isLoading = () => !!document.querySelector('#messagestack > .loading');
  const _isHideReadBtnSelected = () => _getHideReadBtn().classList.contains('selected');

  function _hideReadItems() {
    const hideReadBtn = _getHideReadBtn();
    if (hideReadBtn && !_isHideReadBtnSelected()) {
      if (_isLoading()) {
        // Wait with click until after the loading indicator is hidden
        window.setTimeout(_hideReadItems, 50);
      } else {
        hideReadBtn.click();
      }
    }
  }

  function _onUnreadBtnClick() {
    console.info('Unread button clicked!');
    if (_isInboxLocation()) {
      // It takes a little until the `selected` class is actually toggled...
      _hideReadInInbox = !_isHideReadBtnSelected();
    }
  }

  function _onInboxMenuItemClick() {
    console.info('Inbox menu item clicked');
    if (_hideReadInInbox) {
      _hideReadItems();
    }
  }

  function _onJunkMenuItemClick() {
    console.info('Junk menu item clicked');
    _hideReadItems();
  }

  function _init() {
    console.info('_init');

    const hideReadBtn = _getHideReadBtn();
    const inboxLi = _getInboxMenuLi();
    const junkLi = _getJunkMenuLi();
    if (!hideReadBtn || !inboxLi || !junkLi) {
      // Poll for all required DOM elements to become available...
      window.setTimeout(_init, 100);
    } else {
      hideReadBtn.addEventListener('click', _onUnreadBtnClick);
      inboxLi.addEventListener('click', _onInboxMenuItemClick);
      junkLi.addEventListener('click', _onJunkMenuItemClick);
    }
  }

  _init();
})();
