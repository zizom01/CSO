function setupEventListeners() {
    const iocOPs = document.querySelectorAll('.iocbox');
    const iocTexts = document.querySelectorAll('.ioctextbox');

    iocOPs.forEach((iocOP, index) => {
            const iocText = iocTexts[index];
            if (iocOP.value === "IP") {
                iocText.setAttribute('type', 'number');
            } else {
                iocText.setAttribute('type', 'text');
            }
    });
}

// Initial setup
setupEventListeners();

// Call this function whenever you add new elements dynamically
document.addEventListener('change', () => {
    setupEventListeners();
});
