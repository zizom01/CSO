function setupEventListeners() {
    const iocOPs = document.querySelectorAll('.iocbox');
    const iocTexts = document.querySelectorAll('.ioctextbox');

    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id'); // Get caseId from URL

    iocOPs.forEach((iocOP, index) => {
            const iocText = iocTexts[index];
            if (iocOP.value === "IP") {
                iocText.setAttribute('pattern', '^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$', 'title', 'Enter a valid IPv4 address (e.g., 192.168.1.1)');
                iocText.setAttribute('title', 'Enter a valid IPv4 address (e.g., 192.168.1.1)');
            } else {
                iocText.removeAttribute('pattern');
                iocText.removeAttribute('title');
            }
    });
}


// Call this function whenever you add new elements dynamically
document.addEventListener('change', () => {
    setupEventListeners();
});
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});
