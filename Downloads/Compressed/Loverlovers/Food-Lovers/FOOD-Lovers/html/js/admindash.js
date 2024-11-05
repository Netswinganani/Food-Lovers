function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none'; // Hide all tabs
    });

    const activeTab = document.getElementById(tabId);
    activeTab.style.display = 'block'; // Show the selected tab
}

// Optionally, you can show the first tab by default
document.addEventListener('DOMContentLoaded', () => {
    showTab('add-product');
});
