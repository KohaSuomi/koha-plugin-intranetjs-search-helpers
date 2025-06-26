$(document).ready(function () {
    const searchterms = document.getElementById('searchterms');
    if (searchterms) {
        const inputs = searchterms.querySelectorAll('input[type="text"]');
        inputs.forEach(attachSearchSuggestions);
        const ButtonPlus = document.getElementById('ButtonPlus');
        if (ButtonPlus) {
            ButtonPlus.onclick = function(event) {
                event.preventDefault();
                const line = this.parentNode;
                const dad  = line.parentNode;
                const clonedLine = line.cloneNode(true);
                dad.appendChild(clonedLine);
                const newInput = clonedLine.querySelector('input[type="text"]:not([_searchAttached])');
                if (newInput) {
                    attachSearchSuggestions(newInput);
                }
                line.removeChild(this);
            };
        }
    }
    // Add CSS for the suggestion list
    const style = document.createElement('style');
    style.textContent = `
        .search-spinner {
            display: none;
            vertical-align: middle;
            margin-left: 6px;
            width: 18px;
            height: 18px;
            position: static;
            text-indent: 0;
        }
        .suggestion-list {
            position: absolute;
            background: #fff;
            border: 1px solid #ccc;
            z-index: 1000;
            list-style: none;
            margin: 0;
            padding: 4px 0;
            width: 100%;
        }
        .suggestion-list li {
            padding: 4px 8px;
            cursor: pointer;
            list-style-type: none;
            text-indent: 0;
        }
        .suggestion-list li:hover {
            background: #e0e0e0;
        }
    `;
    document.head.appendChild(style);
});

function attachSearchSuggestions(element) {
    if (element.type !== 'text' || element._searchAttached) return;
    element._searchAttached = true;

    const spinner = document.createElement('div');
    spinner.className = 'search-spinner';
    spinner.style.position = 'static';
    spinner.innerHTML = `<svg width="18" height="18" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#888" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.415, 31.415" transform="rotate(0 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`;
    element.after(spinner);
    element._spinner = spinner;

    // Add an event listener to handle search functionality
    // Attach keydown handler only once per element
    if (!element._keydownHandlerAttached) {
        element._selectedIdx = -1;
        element._items = [];
        element.addEventListener('keydown', function(e) {
            const items = element._items;
            let selectedIdx = element._selectedIdx;
            if (!items.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIdx = (selectedIdx + 1) % items.length;
                items.forEach((li, i) => {
                    li.style.background = i === selectedIdx ? '#e0e0e0' : '';
                });
                // Keep focus on the input, just scroll the selected item into view
                items[selectedIdx].scrollIntoView({ block: 'nearest' });
                element._selectedIdx = selectedIdx;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIdx = (selectedIdx - 1 + items.length) % items.length;
                items.forEach((li, i) => {
                    li.style.background = i === selectedIdx ? '#e0e0e0' : '';
                });
                items[selectedIdx].scrollIntoView({ block: 'nearest' });
                element._selectedIdx = selectedIdx;
            } else if (e.key === 'Enter' && selectedIdx >= 0) {
                e.preventDefault();
                element.value = items[selectedIdx].textContent;
                if (items[selectedIdx].parentElement) {
                    items[selectedIdx].parentElement.remove();
                }
                element._selectedIdx = -1;
                element._items = [];
            } else if (e.key === 'Escape' || e.key === 'Tab') {
                e.preventDefault();
                let suggestionList = element.parentElement.querySelector('.suggestion-list');
                if (suggestionList) {
                    suggestionList.remove();
                }
                element._selectedIdx = -1;
                element._items = [];
            }
        });
        element._keydownHandlerAttached = true;
        element._updateSuggestions = function(newItems) {
            element._items = newItems;
            element._selectedIdx = -1;
        };
    }

    element.addEventListener('input', async (event) => {
        element.setAttribute('autocomplete', 'off');
        const searchTerm = event.target.value.trim();
        element._spinner.style.display = 'none'; // Hide spinner initially
        if (searchTerm.length === 0) return;
        try {
            // Add a debounce to wait for user to finish typing
            if (element._debounceTimeout) {
                clearTimeout(element._debounceTimeout);
            }
            
            element._debounceTimeout = setTimeout(async () => {
                if (searchTerm.length < 3) {
                    return;
                }
                // Show the spinner while fetching results
                element._spinner.style.display = 'inline-block';
                // Fetch search results from the Finto API
                const vocab = vocab_config || "yso finaf";
                const response = await fetch(`https://api.finto.fi/rest/v1/search?vocab=${encodeURIComponent(vocab)}&query=${encodeURIComponent(searchTerm)}*`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const results = await response.json();
                if (!results || !results.results || results.results.length === 0) {
                    // Hide the spinner if no results found
                    element._spinner.style.display = 'none';
                    return;
                }
                // Remove any existing suggestion list
                let oldList = element.parentElement.querySelector('.suggestion-list');
                if (oldList) oldList.remove();

                // Create a suggestion list
                const list = document.createElement('ul');
                list.className = 'suggestion-list';
                list.style.width = element.offsetWidth + 'px';

                // Assume results.results contains the suggestions
                (results.results || []).slice(0, 10).forEach((item, idx) => {
                    const li = document.createElement('li');
                    li.textContent = item.label || item.prefLabel || item.id || 'Unknown';
                    li.tabIndex = 0; // Make focusable for keyboard navigation
                    li.addEventListener('mousedown', () => {
                        element.value = li.textContent;
                        list.remove();
                    });
                    list.appendChild(li);
                });

                if (list.children.length > 0) {
                    // Position the suggestion list directly below the input
                    list.style.left = element.offsetLeft + 'px';
                    list.style.top = (element.offsetTop + element.offsetHeight) + 'px';
                    list.style.width = element.offsetWidth + 'px';
                    element.parentElement.appendChild(list);

                    const itemsArr = Array.from(list.children);
                    if (typeof element._updateSuggestions === 'function') {
                        element._updateSuggestions(itemsArr);
                    }
                    // Hide the spinner after results are fetched
                    element._spinner.style.display = 'none';
                    // Hide suggestions when input loses focus
                    element.addEventListener('blur', () => {
                        setTimeout(() => {
                            if (list.parentElement) list.remove();
                        }, 100);
                    });
                }
            }, 400); // 400ms debounce
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    });
}