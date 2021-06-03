// ==UserScript==
// @name         UNF User Minimap
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Minimap for unf faction
// @author       Some anon
// @match        https://pixelplanet.fun/*
// @match        http://pixelplanet.fun/
// @grant        none
// ==/UserScript==

fetch('https://raw.githubusercontent.com/AsumaPT/unf/main/script.js')
.then(res => res.text())
.then(code => {
	const e = document.createElement('script');
	e.innerHTML = code;
	document.body.appendChild(e);

});
