    const toggleButton = document.querySelector('.mode');
    const body = document.body;
    let img = document.getElementById('img');
    const lightMode = '/img/brightness.png';
    const darkMode = '/img/brightness (1).png';
    const html = document.querySelector('html');
    const malware = document.querySelector('ul li:nth-child(2)');


    const btn = document.getElementById('button-addon2');
    const btn2 = document.getElementById('button-addon3');
    const ioc = document.getElementById('ioc');
    const dest = document.getElementById('ipdestDiv');
    const src1 = document.getElementById('ipsrcDiv');
    const btn3 = document.getElementById('button-addon4')
    const Alert = document.getElementById('alertdiv')
    const tools = document.getElementById('toolsdiv')
    const ttp = document.getElementById('ttpdiv')
    const intel = document.getElementById('intel')
    const reportNum = document.getElementById('reportNum')
    const letterNum = document.getElementById('letter')
    const btn_alert = document.getElementById('button-alert')
    const btn_tools = document.getElementById('button-tools')
    const btn_ttp = document.getElementById('button-ttp')
    const btn_ioc_delete = document.getElementById('button-delete-ioc')
    const btn_src_delete = document.getElementById('button-delete-src')
    const btn_dest_delete = document.getElementById('button-delete-dest')
    const btn_alert_delete = document.getElementById('button-delete-alert')
    const btn_tools_delete = document.getElementById('button-delete-tools')
    const btn_ttp_delete = document.getElementById('button-delete-ttp')
    const btn_ioc_clear = document.getElementById('button-clear-ioc')

    function addMoreText_ioc(num, text = '') {
        return `
            <label class="form-label">IOC's</label>
            <select required name="iocType[]" id="type${num}" required class="iocbox form-select form-select-sm mb-2" style="width: 10em;" aria-label="Select example">
                <option disabled selected>Type of IOC</option>
                <option value="Hash">Hash</option>
                <option value="IP">IP</option>
            </select>
            <input name="ioc[]" id="iocExtra${num}" type="text" required class="form-control ioctextbox" value="${text}">
        `;
    }

    function addMoreText_ttp(num, text = '') {
        return `
            <label class="form-label">TTP's</label>
            <input name="ttps[]" type="text" required id="ttp${num}" class="form-control" value="${text}">
        `;
    }
    
    function addMoreText_tools(num, text = '') {
        return `
            <label class="form-label">Tools Used</label>
            <input name="toolUsed[]" type="text" required id="tools${num}" class="form-control" autocomplete="on" list="names" value="${text}">
        `;
    }
    
    function addMoreText_dest(num, text = '') {
        return `
            <label class="form-label">Destination IP</label>
            <input name="destinationIPs[]" type="number" required id="ipDest${num}" class="form-control" value="${text}">
        `;
    }
    
    function addMoreText_src(num, text = '') {
        return `
            <label class="form-label">Source IP</label>
            <input name="sourceIPs[]" type="number" required id="ipSrc${num}" class="form-control" value="${text}">
        `;
    }
    
    function addMoreText_alert(num, text = '') {
        return `
            <label class="form-label">Alert/Policy Rule</label>
            <input name="alertPolicy[]" type="text" required id="alert${num}" class="form-control" autocomplete="on" list="names" value="${text}">
        `;
    }


    document.addEventListener('DOMContentLoaded', () => {
        const ul = document.querySelector('nav ul'); // Adjust the selector to match your target <ul> element
            ul.insertAdjacentHTML(
                'beforeend', // Position where the HTML will be inserted
                `<li class="nav-item mx-5">
                <a href="/logout" class="btn btn-danger" style="color: white;">Logout</a>
                </li>`
            );
    });

    malware.setAttribute('style', 'display: none;');

    document.addEventListener('DOMContentLoaded', function () {
        const follow = document.getElementById('follow');
    
        function updateFollowState() {
            // Get the value of the checked radio button
            const checkedRadio = document.querySelector('input[name="inlineRadioOptions"]:checked');
            const isActive = checkedRadio ? checkedRadio.value : null;
    
            // Disable the follow input if 'True' is selected, otherwise enable it
            follow.disabled = isActive === "False";
        }
    
        // Set initial state on page load
        updateFollowState();
    
        // Update state when radio buttons change
        document.querySelectorAll('input[name="inlineRadioOptions"]').forEach(input => {
            input.addEventListener('change', updateFollowState);
        });
    });
    
    btn.addEventListener("click", addText);
    btn2.addEventListener('click', addTextDest);
    btn3.addEventListener('click', addTextSrc);
    btn_alert.addEventListener("click", addTextAlert)
    btn_tools.addEventListener('click', addTextTools)
    btn_ttp.addEventListener('click', addTextTTP)
    btn_src_delete.addEventListener('click', deleteText_src)
    btn_dest_delete.addEventListener('click', deleteText_dest)
    btn_ioc_delete.addEventListener('click', deleteText_ioc)
    btn_alert_delete.addEventListener('click', deleteText_alert)
    btn_tools_delete.addEventListener('click', deleteText_tools)
    btn_ttp_delete.addEventListener('click', deleteText_ttp)


    intel.addEventListener('input', () => {
        if (intel.value.length >= 1){
            reportNum.disabled = false;
            letterNum.disabled = false;
        }else if (intel.value.length == 0) {
            reportNum.disabled = true;
            reportNum.value = ""
            letterNum.disabled = true;
            letterNum.value = ""
        }
    })
   
    
function addText(num, text) {
    ioc.insertAdjacentHTML('beforeend', addMoreText_ioc(num, text));
}
function addTextTTP(num, text) {
    ttp.insertAdjacentHTML('beforeend', addMoreText_ttp(num, text));
}

function deleteText_ioc() {
   if (ioc.children.length >= 4 ) {
    ioc.removeChild(ioc.lastElementChild)
    ioc.removeChild(ioc.lastElementChild)
    ioc.removeChild(ioc.lastElementChild)
   }
}
function deleteText_ttp() {
    if (ttp.children.length >= 3 ) {
     ttp.removeChild(ttp.lastElementChild)
     ttp.removeChild(ttp.lastElementChild)
    }
 }
function deleteText_src() {
    if (src1.children.length >= 3 ) {
     src1.removeChild(src1.lastElementChild)
     src1.removeChild(src1.lastElementChild)
    }
 }
 function deleteText_dest() {
    if (dest.children.length >= 3 ) {
     dest.removeChild(dest.lastElementChild)
     dest.removeChild(dest.lastElementChild)
     console.log("ee")
    }
 }
 function deleteText_alert() {
    if (Alert.children.length >= 3 ) {
     Alert.removeChild(Alert.lastElementChild)
     Alert.removeChild(Alert.lastElementChild)
    }
 }
 function deleteText_tools() {
    if (tools.children.length >= 3 ) {
     tools.removeChild(tools.lastElementChild)
     tools.removeChild(tools.lastElementChild)
    }
 }

function addTextDest(num, text) {
    dest.insertAdjacentHTML('beforeend', addMoreText_dest(num, text));
   
    
}
function addTextAlert(num, text) {
    Alert.insertAdjacentHTML('beforeend', addMoreText_alert(num, text));
   
    
}
function addTextTools(num, text) {
    tools.insertAdjacentHTML('beforeend', addMoreText_tools(num, text));
   
    
}
function addTextSrc(num, text) {
    src1.insertAdjacentHTML('beforeend', addMoreText_src(num, text));
    
}



    if (localStorage.getItem("darkMode") === 'true') {
        body.classList.add('dark-mode');
        img.src = lightMode;
    }


function changeMode() {
    if (html.getAttribute('data-bs-theme') === 'dark'){
        console.log(1);
        html.setAttribute('data-bs-theme', 'light')
        img.src = darkMode;
    }else {
        html.setAttribute('data-bs-theme', 'dark')
        img.src = lightMode;
    }
}

