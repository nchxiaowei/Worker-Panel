export async function renderHomePage (proxySettings, isPassSet) {
    const {
        remoteDNS, 
        localDNS,
        VLTRFakeDNS, 
        proxyIP, 
        outProxy,
        cleanIPs, 
        enableIPv6,
        customCdnAddrs,
        customCdnHost,
        customCdnSni,
        bestVLTRInterval,
        VLConfigs,
        TRConfigs,
        ports,
        lengthMin, 
        lengthMax, 
        intervalMin, 
        intervalMax,
        fragmentPackets, 
        warpEndpoints,
        warpFakeDNS,
        warpEnableIPv6,
        bestWarpInterval,
        xrayUdpNoises,
        hiddifyNoiseMode,
        nikaNGNoiseMode,
        noiseCountMin,
        noiseCountMax,
        noiseSizeMin,
        noiseSizeMax,
        noiseDelayMin,
        noiseDelayMax,
        amneziaNoiseCount,
        amneziaNoiseSizeMin,
        amneziaNoiseSizeMax,
        bypassLAN,
        bypassIran,
        bypassChina,
        bypassRussia,
        blockAds, 
        blockPorn,
        blockUDP443,
        customBypassRules,
        customBlockRules
    } = proxySettings;

    const activeProtocols = (VLConfigs ? 1 : 0) + (TRConfigs ? 1 : 0);
    let httpPortsBlock = '', httpsPortsBlock = '';
    const allPorts = [...(globalThis.hostName.includes('workers.dev') ? globalThis.defaultHttpPorts : []), ...globalThis.defaultHttpsPorts];

    allPorts.forEach(port => {
        const id = `port-${port}`;
        const isChecked = ports.includes(port) ? 'checked' : '';
        const portBlock = `
            <div class="routing" style="grid-template-columns: 1fr 2fr; margin-right: 10px;">
                <input type="checkbox" id=${id} name=${port} onchange="handlePortChange(event)" value="true" ${isChecked}>
                <label style="margin-bottom: 3px;" for=${id}>${port}</label>
            </div>`;
        globalThis.defaultHttpsPorts.includes(port) ? httpsPortsBlock += portBlock : httpPortsBlock += portBlock;
    });

    let udpNoiseBlocks = '';
    JSON.parse(xrayUdpNoises).forEach( (noise, index) => {
        udpNoiseBlocks += `
            <div id="udp-noise-container-${index}" class="udp-noise">
                <div class="header-container">
                    <h4 style="margin: 0 5px;">Noise ${index + 1}</h4>
                    <button type="button" onclick="deleteUdpNoise(this)" style="background: none; margin: 0; border: none; cursor: pointer;">
                        <i class="fa fa-minus-circle fa-2x" style="color: var(--button-color);" aria-hidden="true"></i>
                    </button>      
                </div>
                <div class="form-control">
                    <label for="udpXrayNoiseMode-${index}">😵‍💫 v2ray Mode</label>
                    <div class="input-with-select">
                        <select id="udpXrayNoiseMode-${index}" name="udpXrayNoiseMode">
                            <option value="base64" ${noise.type === 'base64' ? 'selected' : ''}>Base64</option>
                            <option value="rand" ${noise.type === 'rand' ? 'selected' : ''}>Random</option>
                            <option value="str" ${noise.type === 'str' ? 'selected' : ''}>String</option>
                            <option value="hex" ${noise.type === 'hex' ? 'selected' : ''}>Hex</option>
                        </select>
                    </div>
                </div>
                <div class="form-control">
                    <label for="udpXrayNoisePacket-${index}">📥 Noise Packet</label>
                    <input type="text" id="udpXrayNoisePacket-${index}" name="udpXrayNoisePacket" value="${noise.packet}">
                </div>
                <div class="form-control">
                    <label for="udpXrayNoiseDelayMin-${index}">🕞 Noise Delay</label>
                    <div class="min-max">
                        <input type="number" id="udpXrayNoiseDelayMin-${index}" name="udpXrayNoiseDelayMin"
                            value="${noise.delay.split('-')[0]}" min="1" required>
                        <span> - </span>
                        <input type="number" id="udpXrayNoiseDelayMax-${index}" name="udpXrayNoiseDelayMax"
                            value="${noise.delay.split('-')[1]}" min="1" required>
                    </div>
                </div>
                <div class="form-control">
                    <label for="udpXrayNoiseCount-${index}">🎚️ Noise Count</label>
                    <input type="number" id="udpXrayNoiseCount-${index}" name="udpXrayNoiseCount" value="${noise.count}" min="1" required>
                </div>
            </div>`;
    });


    const supportedApps = apps => apps.map(app => `
        <div>
            <span class="material-symbols-outlined symbol">verified</span>
            <span>${app}</span>
        </div>`).join('');
        
    const subQR = (path, app, tag, title, sbType, hiddifyType) => {
        const url = `${sbType ? 'sing-box://import-remote-profile?url=' : ''}${hiddifyType ? 'hiddify://import/' : ''}https://${globalThis.hostName}/${path}/${globalThis.subPath}${app ? `?app=${app}` : ''}#${tag}`;
        const encodedURL = encodeURI(url);
        return `
            <button onclick="openQR('${encodedURL}', '${title}')">
                QR Code&nbsp;<span class="material-symbols-outlined">qr_code</span>
            </button>`;
    };
    
    const subURL = (path, app, tag, hiddifyType) => {
        const url = `${hiddifyType ? 'hiddify://import/' : ''}https://${globalThis.hostName}/${path}/${globalThis.subPath}${app ? `?app=${app}` : ''}#${tag}`;
        const encodedURL = encodeURI(url);
        return `
            <button onclick="copyToClipboard('${encodedURL}')">
                Copy Sub<span class="material-symbols-outlined">format_list_bulleted</span>
            </button>`;
    }

    const dlConfig = (path, app) => {
        const url = `https://${globalThis.hostName}/${path}/${globalThis.subPath}${app ? `?app=${app}` : ''}`;
        return `
            <button onclick="dlURL('${url}')">
                Get config<span class="material-symbols-outlined">download</span>
            </button>`;
    };

    const style = `
    :root {
        --color: black;
        --primary-color: #09639f;
        --secondary-color: #3498db;
        --header-color: #09639f; 
        --background-color: #fff;
        --form-background-color: #f9f9f9;
        --table-active-color: #f2f2f2;
        --hr-text-color: #3b3b3b;
        --lable-text-color: #333;
        --border-color: #ddd;
        --button-color: #09639f;
        --input-background-color: white;
        --header-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    }
    body { font-family: Twemoji Country Flags, system-ui; background-color: var(--background-color); color: var(--color) }
    body.dark-mode {
        --color: white;
        --primary-color: #09639F;
        --secondary-color: #3498DB;
        --header-color: #3498DB; 
        --background-color: #121212;
        --form-background-color: #121212;
        --table-active-color: #252525;
        --hr-text-color: #D5D5D5;
        --lable-text-color: #DFDFDF;
        --border-color: #353535;
        --button-color: #3498DB;
        --input-background-color: #252525;
        --header-shadow: 2px 2px 4px rgba(255, 255, 255, 0.25);
    }
    .material-symbols-outlined {
        margin-left: 5px;
        font-variation-settings:
        'FILL' 0,
        'wght' 400,
        'GRAD' 0,
        'opsz' 24
    }
    details { border-bottom: 1px solid var(--border-color); }
    summary {
        font-weight: bold;
        cursor: pointer;
        text-align: center;
        text-wrap: nowrap;
    }
    summary::marker { font-size: 1.5rem; color: var(--secondary-color); }
    summary h2 { display: inline-flex; }
    h1 { font-size: 2.5em; text-align: center; color: var(--header-color); text-shadow: var(--header-shadow); }
    h2,h3 { margin: 30px 0; text-align: center; color: var(--hr-text-color); }
    hr { border: 1px solid var(--border-color); margin: 20px 0; }
    .footer {
        display: flex;
        font-weight: 600;
        margin: 10px auto 0 auto;
        justify-content: center;
        align-items: center;
    }
    .footer button {margin: 0 20px; background: #212121; max-width: fit-content;}
    .footer button:hover, .footer button:focus { background: #3b3b3b;}
    .form-control a, a.link { text-decoration: none; }
    .form-control {
        margin: 20px auto;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
    }
    .form-control button {
        background-color: var(--form-background-color);
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--button-color);
        border-color: var(--primary-color);
        border: 1px solid;
        width: 100%;
    }
    label {
        display: block;
        margin-bottom: 5px;
        font-size: 110%;
        font-weight: 600;
        color: var(--lable-text-color);
    }
    input[type="text"],
    input[type="number"],
    input[type="url"],
    textarea,
    select {
        width: 100%;
        text-align: center;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 5px;
        font-size: 16px;
        color: var(--lable-text-color);
        background-color: var(--input-background-color);
        box-sizing: border-box;
        transition: border-color 0.3s ease;
    }	
    input[type="text"]:focus,
    input[type="number"]:focus,
    input[type="url"]:focus,
    textarea:focus,
    select:focus { border-color: var(--secondary-color); outline: none; }
    .button,
    table button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 135px;
        white-space: nowrap;
        padding: 10px 0;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 1px;
        border: none;
        border-radius: 5px;
        color: white;
        background-color: var(--primary-color);
        cursor: pointer;
        outline: none;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    }
    .button {font-weight: 600; padding: 15px 15px; font-size: 1.1rem; width: max-content; }
    input[type="checkbox"] { 
        background-color: var(--input-background-color);
        style="margin: 0; 
        grid-column: 2;"
    }
    .button.disabled {
        background-color: #ccc;
        cursor: not-allowed;
        box-shadow: none;
        pointer-events: none;
    }
    .button:hover,
    table button:hover,
    table button:focus {
        background-color: #2980b9;
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
        transform: translateY(-2px);
    }
    .header-container button:hover {
        transform: scale(1.1);
    }
    button.button:hover { color: white; }
    .button:active,
    table button:active { transform: translateY(1px); box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3); }
    .form-container {
        max-width: 90%;
        margin: 0 auto;
        padding: 20px;
        background: var(--form-background-color);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 100px;
    }
    .table-container { overflow-x: auto; }
    table { 
        width: 100%;
        border: 1px solid var(--border-color);
        border-collapse: separate;
        border-spacing: 0; 
        border-radius: 10px;
        margin-bottom: 20px;
        overflow: hidden;
    }
    tbody { display: flex; flex-direction: column; }
    tr { display: flex; flex-direction: row; }
    th, td { 
        display: flex; 
        flex-direction: column;
        justify-content: center; 
        padding: 10px; 
        width: 100%;
        gap: 10px;
        border-bottom: 1px solid var(--border-color); 
    }
    td div { display: flex; align-items: center; }
    th { background-color: var(--secondary-color); color: white; font-weight: bold; font-size: 1.1rem; width: 50%;}
    td:last-child { 
        background-color: var(--table-active-color); 
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 10px;
    }               
    tr:hover { background-color: var(--table-active-color); }
    .modal {
        display: none;
        position: fixed;
        z-index: 1;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.4);
    }
    .modal-content {
        background-color: var(--form-background-color);
        margin: auto;
        padding: 10px 20px 20px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 80%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .close { color: var(--color); float: right; font-size: 28px; font-weight: bold; }
    .close:hover,
    .close:focus { color: black; text-decoration: none; cursor: pointer; }
    .form-control label {
        display: block;
        margin-bottom: 8px;
        font-size: 110%;
        font-weight: 600;
        color: var(--lable-text-color);
        line-height: 1.3em;
    }
    .form-control input[type="password"] {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 5px;
        font-size: 16px;
        color: var(--lable-text-color);
        background-color: var(--input-background-color);
        box-sizing: border-box;
        margin-bottom: 15px;
        transition: border-color 0.3s ease;
    }
    .routing { 
        display: grid;
        justify-content: flex-start;
        grid-template-columns: 1fr 1fr 10fr 1fr;
        margin-bottom: 15px;
    }
    .form-control .routing input { grid-column: 2 / 3; }
    #routing-rules.form-control { display: grid; grid-template-columns: 1fr 1fr; }
    .routing label {
        text-align: left;
        margin: 0 0 0 10px;
        font-weight: 400;
        font-size: 100%;
        text-wrap: nowrap;
    }
    .form-control input[type="password"]:focus { border-color: var(--secondary-color); outline: none; }
    #passwordError { color: red; margin-bottom: 10px; }
    .symbol { margin-right: 8px; }
    .modalQR {
        display: none;
        position: fixed;
        z-index: 1;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.4);
    }
    .floating-button {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background-color: var(--color);
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transition: background-color 0.3s, transform 0.3s;
    }
    .floating-button:hover { transform: scale(1.1); }
    .min-max { display: grid; grid-template-columns: 1fr auto 1fr; align-items: baseline; width: 100%; }
    .min-max span { text-align: center; white-space: pre; }
    .input-with-select { width: 100%; }
    body.dark-mode .floating-button { background-color: var(--color); }
    body.dark-mode .floating-button:hover { transform: scale(1.1); }
    #ips th { 
        background-color: var(--hr-text-color);
        color: var(--background-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1; 
    }
    #ips td { 
        background-color: unset; 
        overflow: hidden;
        flex: 1;
        text-overflow: clip;
        white-space: nowrap;
    }
    #ips tr { flex-wrap: wrap; }
    #ips td:first-child { background-color: var(--table-active-color); }
    .header-container { display: flex; justify-content: center; margin-bottom: 20px; }
    .udp-noise { border: 1px solid var(--border-color); border-radius: 15px; padding: 20px; margin-bottom: 10px;}
    @media only screen and (min-width: 768px) {
        .form-container { max-width: 70%; }
        .form-control { 
            margin-bottom: 15px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: baseline;
            justify-content: flex-end;
            font-family: Arial, sans-serif;
        }
        #apply { display: block; margin: 20px auto; max-width: 50%; }
        .modal-content { width: 30% }
        .routing { display: grid; grid-template-columns: 4fr 1fr 3fr 4fr; }
    }`;

    const js = `
    const defaultHttpsPorts = ['443', '8443', '2053', '2083', '2087', '2096'];
    let activePortsNo = ${ports.length};
    let activeHttpsPortsNo = ${ports.filter(port => globalThis.defaultHttpsPorts.includes(port)).length};
    let activeProtocols = ${activeProtocols};
    localStorage.getItem('darkMode') === 'enabled' && document.body.classList.add('dark-mode');

    document.addEventListener('DOMContentLoaded', async () => {
        const configForm = document.getElementById('configForm');            
        const changePass = document.getElementById('openModalBtn');
        const closeBtn = document.querySelector(".close");
        const passwordChangeForm = document.getElementById('passwordChangeForm');                    
        const initialFormData = new FormData(configForm);
        const modal = document.getElementById('myModal');
        const closeQR = document.getElementById('closeQRModal');
        const resetSettings = document.getElementById('resetSettings');
        let modalQR = document.getElementById('myQRModal');
        let qrcodeContainer = document.getElementById('qrcode-container');
        let forcedPassChange = false;
        const darkModeToggle = document.getElementById('darkModeToggle');
                
        const hasFormDataChanged = () => {
            const currentFormData = new FormData(configForm);
            const currentFormDataEntries = [...currentFormData.entries()];

            const nonCheckboxFieldsChanged = currentFormDataEntries.some(
                ([key, value]) => !initialFormData.has(key) || initialFormData.get(key) !== value
            );

            const checkboxFieldsChanged = Array.from(configForm.elements)
                .filter((element) => element.type === 'checkbox')
                .some((checkbox) => {
                const initialValue = initialFormData.has(checkbox.name)
                    ? initialFormData.get(checkbox.name)
                    : false;
                const currentValue = currentFormDataEntries.find(([key]) => key === checkbox.name)?.[1] || false;
                return initialValue !== currentValue;
            });

            return nonCheckboxFieldsChanged || checkboxFieldsChanged;
        };
        
        const enableApplyButton = () => {
            const isChanged = hasFormDataChanged();
            applyButton.disabled = !isChanged;
            applyButton.classList.toggle('disabled', !isChanged);
        };
                    
        passwordChangeForm.addEventListener('submit', event => resetPassword(event));
        document.getElementById('logout').addEventListener('click', event => logout(event));
        configForm.addEventListener('submit', (event) => applySettings(event, configForm));
        configForm.addEventListener('input', enableApplyButton);
        configForm.addEventListener('change', enableApplyButton);
        changePass.addEventListener('click', () => {
            forcedPassChange ? closeBtn.style.display = 'none' : closeBtn.style.display = '';
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            forcedPassChange = false;
        });        
        closeBtn.addEventListener('click', () => {
            modal.style.display = "none";
            document.body.style.overflow = "";
        });
        closeQR.addEventListener('click', () => {
            modalQR.style.display = "none";
            qrcodeContainer.lastElementChild.remove();
        });
        resetSettings.addEventListener('click', async () => {
            const confirmReset = confirm('⚠️ This will reset all panel settings.\\nAre you sure?');
            if(!confirmReset) return;
            const formData = new FormData();
            formData.append('resetSettings', 'true');
            try {
                document.body.style.cursor = 'wait';
                const refreshButtonVal = refreshBtn.innerHTML;
                refreshBtn.innerHTML = '⌛ Loading...';

                const response = await fetch('/panel', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                document.body.style.cursor = 'default';
                refreshBtn.innerHTML = refreshButtonVal;
                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error(errorMessage, response.status);
                    alert('⚠️ An error occured, Please try again!\\n⛔ ' + errorMessage);
                    return;
                }       
                alert('✅ Panel settings reset to default successfully! 😎');
                window.location.reload(true);
            } catch (error) {
                console.error('Error:', error);
            }
        });
        window.onclick = (event) => {
            if (event.target == modalQR) {
                modalQR.style.display = "none";
                qrcodeContainer.lastElementChild.remove();
            }
        }
        darkModeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        });

        const isPassSet = ${isPassSet};
        if (!isPassSet) {
            forcedPassChange = true;
            changePass.click();
        }

        await fetchIPInfo();
    });

    const downloadWarpConfigs = async (isAmnezia) => {
        const client = isAmnezia ? "?app=amnezia" : "";
        window.location.href = "/get-warp-configs" + client;
    }

    const dlURL = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'config.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };

    const fetchIPInfo = async () => {
        const updateUI = (ip = '-', country = '-', countryCode = '-', city = '-', isp = '-', cfIP) => {
            const flag = countryCode !== '-' ? String.fromCodePoint(...[...countryCode].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';
            document.getElementById(cfIP ? 'cf-ip' : 'ip').textContent = ip;
            document.getElementById(cfIP ? 'cf-country' : 'country').textContent = country + ' ' + flag;
            document.getElementById(cfIP ? 'cf-city' : 'city').textContent = city;
            document.getElementById(cfIP ? 'cf-isp' : 'isp').textContent = isp;
        };

        const refreshIcon = document.getElementById("refresh-geo-location").querySelector('i');
        refreshIcon.classList.add('fa-spin');
        document.body.style.cursor = 'wait';

        try {
            const ipResponse = await fetch('https://ipwho.is/' + '?nocache=' + Date.now(), { cache: "no-store" });
            const ipResponseObj = await ipResponse.json();
            const geoResponse = await fetch('/my-ip', { 
                method: 'POST',
                body: ipResponseObj.ip
            });
            const ipGeoLocation = await geoResponse.json();
            updateUI(ipResponseObj.ip, ipGeoLocation.country, ipGeoLocation.countryCode, ipGeoLocation.city, ipGeoLocation.isp);
            const cfIPresponse = await fetch('https://ipv4.icanhazip.com/?nocache=' + Date.now(), { cache: "no-store" });
            const cfIP = await cfIPresponse.text();
            const cfGeoResponse = await fetch('/my-ip', { 
                method: 'POST',
                body: cfIP.trim()
            });
            const cfIPGeoLocation = await cfGeoResponse.json();
            updateUI(cfIP, cfIPGeoLocation.country, cfIPGeoLocation.countryCode, cfIPGeoLocation.city, cfIPGeoLocation.isp, true);
            refreshIcon.classList.remove('fa-spin');
            document.body.style.cursor = 'default';
        } catch (error) {
            console.error('Error fetching IP address:', error);
        }
    }

    const addUdpNoise = () => {
        const container = document.getElementById("udp-noise-container");
        const noiseBlock = document.getElementById("udp-noise-container-0");
        const index = container.children.length;
        const clone = noiseBlock.cloneNode(true);
        clone.querySelector("h4").textContent = "Noise " + String(index + 1);
        container.appendChild(clone);
        document.getElementById("configForm").dispatchEvent(new Event("change"));
    }
    
    const deleteUdpNoise = (button) => {
        const container = document.getElementById("udp-noise-container");
        if (container.children.length === 1) {
            alert('⛔ You cannot delete all noises!');
            return;
        }   
        const confirmReset = confirm('⚠️ This will delete the noise.\\nAre you sure?');
        if(!confirmReset) return;
        button.closest(".udp-noise").remove();
        document.getElementById("configForm").dispatchEvent(new Event("change"));
    }

    const getWarpConfigs = async () => {
        const confirmReset = confirm('⚠️ Are you sure?');
        if(!confirmReset) return;
        const refreshBtn = document.getElementById('refreshBtn');

        try {
            document.body.style.cursor = 'wait';
            const refreshButtonVal = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '⌛ Loading...';

            const response = await fetch('/update-warp', {
                method: 'POST',
                credentials: 'include'
            });

            document.body.style.cursor = 'default';
            refreshBtn.innerHTML = refreshButtonVal;
            if (!response.ok) {
                const errorMessage = await response.text();
                console.error(errorMessage, response.status);
                alert('⚠️ An error occured, Please try again!\\n⛔ ' + errorMessage);
                return;
            }          
            alert('✅ Warp configs updated successfully! 😎');
        } catch (error) {
            console.error('Error:', error);
        } 
    }

    const handlePortChange = (event) => {
        
        if(event.target.checked) { 
            activePortsNo++ 
            defaultHttpsPorts.includes(event.target.name) && activeHttpsPortsNo++;
        } else {
            activePortsNo--;
            defaultHttpsPorts.includes(event.target.name) && activeHttpsPortsNo--;
        }

        if (activePortsNo === 0) {
            event.preventDefault();
            event.target.checked = !event.target.checked;
            alert("⛔ At least one port should be selected! 🫤");
            activePortsNo = 1;
            defaultHttpsPorts.includes(event.target.name) && activeHttpsPortsNo++;
            return false;
        }
            
        if (activeHttpsPortsNo === 0) {
            event.preventDefault();
            event.target.checked = !event.target.checked;
            alert("⛔ At least one TLS(https) port should be selected! 🫤");
            activeHttpsPortsNo = 1;
            return false;
        }
    }
    
    const handleProtocolChange = (event) => {
        
        if(event.target.checked) { 
            activeProtocols++ 
        } else {
            activeProtocols--;
        }

        if (activeProtocols === 0) {
            event.preventDefault();
            event.target.checked = !event.target.checked;
            alert("⛔ At least one Protocol should be selected! 🫤");
            activeProtocols = 1;
            return false;
        }
    }

    const openQR = (url, title) => {
        let qrcodeContainer = document.getElementById("qrcode-container");
        let qrcodeTitle = document.getElementById("qrcodeTitle");
        const modalQR = document.getElementById("myQRModal");
        qrcodeTitle.textContent = title;
        modalQR.style.display = "block";
        let qrcodeDiv = document.createElement("div");
        qrcodeDiv.className = "qrcode";
        qrcodeDiv.style.padding = "2px";
        qrcodeDiv.style.backgroundColor = "#ffffff";
        new QRCode(qrcodeDiv, {
            text: url,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        qrcodeContainer.appendChild(qrcodeDiv);
    }

    const copyToClipboard = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('📋 Copied to clipboard:\\n\\n' +  text);
    }

    const applySettings = async (event, configForm) => {
        event.preventDefault();
        event.stopPropagation();
        const applyButton = document.getElementById('applyButton');
        const getValue = (id) => parseInt(document.getElementById(id).value, 10);              
        const lengthMin = getValue('fragmentLengthMin');
        const lengthMax = getValue('fragmentLengthMax');
        const intervalMin = getValue('fragmentIntervalMin');
        const intervalMax = getValue('fragmentIntervalMax');
        const customCdnAddrs = document.getElementById('customCdnAddrs').value?.split(',').filter(addr => addr !== '');
        const customCdnHost = document.getElementById('customCdnHost').value;
        const customCdnSni = document.getElementById('customCdnSni').value;
        const isCustomCdn = customCdnAddrs.length || customCdnHost !== '' || customCdnSni !== '';
        const warpEndpoints = document.getElementById('warpEndpoints').value?.replaceAll(' ', '').split(',');
        const noiseCountMin = getValue('noiseCountMin');
        const noiseCountMax = getValue('noiseCountMax');
        const noiseSizeMin = getValue('noiseSizeMin');
        const noiseSizeMax = getValue('noiseSizeMax');
        const noiseDelayMin = getValue('noiseDelayMin');
        const noiseDelayMax = getValue('noiseDelayMax');
        const cleanIPs = document.getElementById('cleanIPs').value?.split(',');
        const proxyIPs = document.getElementById('proxyIP').value?.split(',');
        const chainProxy = document.getElementById('outProxy').value?.trim();
        const customBypassRules = document.getElementById('customBypassRules').value?.split(',');                    
        const customBlockRules = document.getElementById('customBlockRules').value?.split(',');                    
        const formData = new FormData(configForm);
        const is${atob('Vmxlc3M=')} = /${atob('dmxlc3M=')}:\\/\\/[^\s@]+@[^\\s:]+:[^\\s]+/.test(chainProxy);
        const isSocksHttp = /^(http|socks):\\/\\/(?:([^:@]+):([^:@]+)@)?([^:@]+):(\\d+)$/.test(chainProxy);
        const hasSecurity = /security=/.test(chainProxy);
        const securityRegex = /security=(tls|none|reality)/;
        const validSecurityType = securityRegex.test(chainProxy);
        let match = chainProxy.match(securityRegex);
        const securityType = match ? match[1] : null;
        match = chainProxy.match(/:(\\d+)\\?/);
        const ${atob('dmxlc3M=')}Port = match ? match[1] : null;
        const validTransmission = /type=(tcp|grpc|ws)/.test(chainProxy);
        const validIPDomain = /^((?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,})|(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(?:\\/(?:\\d|[12]\\d|3[0-2]))?|\\[(?:(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,7}:|(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,5}(?::[a-fA-F0-9]{1,4}){1,2}|(?:[a-fA-F0-9]{1,4}:){1,4}(?::[a-fA-F0-9]{1,4}){1,3}|(?:[a-fA-F0-9]{1,4}:){1,3}(?::[a-fA-F0-9]{1,4}){1,4}|(?:[a-fA-F0-9]{1,4}:){1,2}(?::[a-fA-F0-9]{1,4}){1,5}|[a-fA-F0-9]{1,4}:(?::[a-fA-F0-9]{1,4}){1,6}|:(?::[a-fA-F0-9]{1,4}){1,7})\\](?:\\/(?:12[0-8]|1[0-1]\\d|[0-9]?\\d))?)$/i;
        const validEndpoint = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|\\[(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\\]|\\[(?:[a-fA-F0-9]{1,4}:){1,7}:\\]|\\[(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}\\]|\\[(?:[a-fA-F0-9]{1,4}:){1,5}(?::[a-fA-F0-9]{1,4}){1,2}\\]|\\[(?:[a-fA-F0-9]{1,4}:){1,4}(?::[a-fA-F0-9]{1,4}){1,3}\\]|\\[(?:[a-fA-F0-9]{1,4}:){1,3}(?::[a-fA-F0-9]{1,4}){1,4}\\]|\\[(?:[a-fA-F0-9]{1,4}:){1,2}(?::[a-fA-F0-9]{1,4}){1,5}\\]|\\[[a-fA-F0-9]{1,4}:(?::[a-fA-F0-9]{1,4}){1,6}\\]|\\[:(?::[a-fA-F0-9]{1,4}){1,7}\\]|\\[::(?::[a-fA-F0-9]{1,4}){0,7}\\]):(?:[0-9]{1,5})$/;
        const checkedPorts = Array.from(document.querySelectorAll('input[id^="port-"]:checked')).map(input => input.id.split('-')[1]);
        formData.append('ports', checkedPorts);
        configForm.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            !formData.has(checkbox.name) && formData.append(checkbox.name, 'false');    
        });
        const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
        const udpNoiseModes = formData.getAll('udpXrayNoiseMode') || [];
        const udpNoisePackets = formData.getAll('udpXrayNoisePacket') || [];
        const udpNoiseDelaysMin = formData.getAll('udpXrayNoiseDelayMin') || [];
        const udpNoiseDelaysMax = formData.getAll('udpXrayNoiseDelayMax') || [];

        const invalidIPs = [...cleanIPs, ...proxyIPs, ...customCdnAddrs, ...customBypassRules, ...customBlockRules, customCdnHost, customCdnSni]?.filter(value => {
            if (value) {
                const trimmedValue = value.trim();
                return !validIPDomain.test(trimmedValue);
            }
        });

        const invalidEndpoints = warpEndpoints?.filter(value => {
            if (value) {
                const trimmedValue = value.trim();
                return !validEndpoint.test(trimmedValue);
            }
        });

        if (invalidIPs.length) {
            alert('⛔ Invalid IPs or Domains 🫤\\n\\n' + invalidIPs.map(ip => '⚠️ ' + ip).join('\\n'));
            return false;
        }
        
        if (invalidEndpoints.length) {
            alert('⛔ Invalid endpoint 🫤\\n\\n' + invalidEndpoints.map(endpoint => '⚠️ ' + endpoint).join('\\n'));
            return false;
        }

        if (lengthMin >= lengthMax || intervalMin > intervalMax || noiseCountMin > noiseCountMax || noiseSizeMin > noiseSizeMax || noiseDelayMin > noiseDelayMax) {
            alert('⛔ Minimum should be smaller or equal to Maximum! 🫤');               
            return false;
        }

        if (!(is${atob('Vmxlc3M=')} && (hasSecurity && validSecurityType || !hasSecurity) && validTransmission) && !isSocksHttp && chainProxy) {
            alert('⛔ Invalid Config! 🫤 \\n - The chain proxy should be ${atob('VkxFU1M=')}, Socks or Http!\\n - ${atob('VkxFU1M=')} transmission should be GRPC,WS or TCP\\n - ${atob('VkxFU1M=')} security should be TLS,Reality or None\\n - socks or http should be like:\\n + (socks or http)://user:pass@host:port\\n + (socks or http)://host:port');               
            return false;
        }

        if (is${atob('Vmxlc3M=')} && securityType === 'tls' && ${atob('dmxlc3M=')}Port !== '443') {
            alert('⛔ ${atob('VkxFU1M=')} TLS port can be only 443 to be used as a proxy chain! 🫤');               
            return false;
        }

        if (isCustomCdn && !(customCdnAddrs.length && customCdnHost && customCdnSni)) {
            alert('⛔ All "Custom" fields should be filled or deleted together! 🫤');               
            return false;
        }
        
        let submisionError = false;
        for (const [index, mode] of udpNoiseModes.entries()) {
            if (udpNoiseDelaysMin[index] > udpNoiseDelaysMax[index]) {
                alert('⛔ The minimum noise delay should be smaller or equal to maximum! 🫤');
                submisionError = true;
                break;
            }
            
            switch (mode) {
                case 'base64':
                    if (!base64Regex.test(udpNoisePackets[index])) {
                        alert('⛔ The Base64 noise packet is not a valid base64 value! 🫤');
                        submisionError = true;
                    }
                    break;

                case 'rand':
                    if (!(/^\\d+-\\d+$/.test(udpNoisePackets[index]))) {
                        alert('⛔ The Random noise packet should be a range like 0-10 or 10-30! 🫤');
                        submisionError = true;
                    }
                    const [min, max] = udpNoisePackets[index].split("-").map(Number);
                    if (min > max) {
                        alert('⛔ The minimum Random noise packet should be smaller or equal to maximum! 🫤');
                        submisionError = true;
                    }
                    break;

                case 'hex':
                    if (!(/^(?=(?:[0-9A-Fa-f]{2})*$)[0-9A-Fa-f]+$/.test(udpNoisePackets[index]))) {
                        alert('⛔ The Hex noise packet is not a valid hex value! It should have even length and consisted of 0-9, a-f and A-F. 🫤');
                        submisionError = true;
                    }
                    break;
            }
        }
        if (submisionError) return false;

        try {
            document.body.style.cursor = 'wait';
            const applyButtonVal = applyButton.value;
            applyButton.value = '⌛ Loading...';

            const response = await fetch('/panel', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            document.body.style.cursor = 'default';
            applyButton.value = applyButtonVal;

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error(errorMessage, response.status);
                alert('⚠️ Session expired! Please login again.');
                window.location.href = '/login';
                return;
            }                
            alert('✅ Parameters applied successfully 😎');
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const logout = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('/logout', {
                method: 'GET',
                credentials: 'same-origin'
            });
        
            if (!response.ok) {
                console.error('Failed to log out:', response.status);
                return;
            }
            window.location.href = '/login';
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const resetPassword = async (event) => {
        event.preventDefault();
        const modal = document.getElementById('myModal');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const passwordError = document.getElementById('passwordError');             
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            passwordError.textContent = "Passwords do not match";
            return false;
        }

        const hasCapitalLetter = /[A-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const isLongEnough = newPassword.length >= 8;

        if (!(hasCapitalLetter && hasNumber && isLongEnough)) {
            passwordError.textContent = '⚠️ Password must contain at least one capital letter, one number, and be at least 8 characters long.';
            return false;
        }
                
        try {
            const response = await fetch('/panel/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: newPassword,
                credentials: 'same-origin'
            });
        
            if (response.ok) {
                modal.style.display = "none";
                document.body.style.overflow = "";
                alert("✅ Password changed successfully! 👍");
                window.location.href = '/login';
            } else if (response.status === 401) {
                const errorMessage = await response.text();
                passwordError.textContent = '⚠️ ' + errorMessage;
                console.error(errorMessage, response.status);
                alert('⚠️ Session expired! Please login again.');
                window.location.href = '/login';
            } else {
                const errorMessage = await response.text();
                passwordError.textContent = '⚠️ ' + errorMessage;
                console.error(errorMessage, response.status);
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }`;
    
    const homePage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="timestamp" content=${Date.now()}>
        <title>${atob('QlBC')} Panel ${globalThis.panelVersion}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <title>Collapsible Sections</title>
        <style>
            ${style}
        </style>
    </head>
    <body>
        <h1>${atob('QlBC')} Panel <span style="font-size: smaller;">${globalThis.panelVersion}</span> 💦</h1>
        <div class="form-container">
            <form id="configForm">
                <details open>
                    <summary><h2>${atob('VkxFU1M=')} - ${atob('VFJPSkFO')} ⚙️</h2></summary>
                    <div class="form-control">
                        <label for="remoteDNS">🌏 Remote DNS</label>
                        <input type="url" id="remoteDNS" name="remoteDNS" value="${remoteDNS}" required>
                    </div>
                    <div class="form-control">
                        <label for="localDNS">🏚️ Local DNS</label>
                        <input type="text" id="localDNS" name="localDNS" value="${localDNS}"
                            pattern="^(localhost|(?:\\d{1,3}\\.){3}\\d{1,3})$"
                            title="Please enter a valid DNS IP Address!"  required>
                    </div>
                    <div class="form-control">
                        <label for="VLTRFakeDNS">🧢 Fake DNS</label>
                        <div class="input-with-select">
                            <select id="VLTRFakeDNS" name="VLTRFakeDNS">
                                <option value="true" ${VLTRFakeDNS ? 'selected' : ''}>Enabled</option>
                                <option value="false" ${!VLTRFakeDNS ? 'selected' : ''}>Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="proxyIP">📍 Proxy IPs / Domains</label>
                        <input type="text" id="proxyIP" name="proxyIP" value="${proxyIP.replaceAll(",", " , ")}">
                    </div>
                    <div class="form-control">
                        <label for="outProxy">✈️ Chain Proxy</label>
                        <input type="text" id="outProxy" name="outProxy" value="${outProxy}">
                    </div>
                    <div class="form-control">
                        <label for="cleanIPs">✨ Clean IPs / Domains</label>
                        <input type="text" id="cleanIPs" name="cleanIPs" value="${cleanIPs.replaceAll(",", " , ")}">
                    </div>
                    <div class="form-control">
                        <label for="scanner">🔎 Clean IP Scanner</label>
                        <a href="https://cfscan.vercel.app/" name="scanner" target="_blank" style="width: 100%;">
                            <button type="button" id="scanner" class="button">
                                Online Scanner
                                <span class="material-symbols-outlined">open_in_new</span>
                            </button>
                        </a>
                    </div>
                    <div class="form-control">
                        <label for="enableIPv6">🔛 IPv6</label>
                        <div class="input-with-select">
                            <select id="enableIPv6" name="enableIPv6">
                                <option value="true" ${enableIPv6 ? 'selected' : ''}>Enabled</option>
                                <option value="false" ${!enableIPv6 ? 'selected' : ''}>Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="customCdnAddrs">💀 Custom CDN Addrs</label>
                        <input type="text" id="customCdnAddrs" name="customCdnAddrs" value="${customCdnAddrs.replaceAll(",", " , ")}">
                    </div>
                    <div class="form-control">
                        <label for="customCdnHost">💀 Custom CDN Host</label> 
                        <input type="text" id="customCdnHost" name="customCdnHost" value="${customCdnHost}">
                    </div>
                    <div class="form-control">
                        <label for="customCdnSni">💀 Custom CDN SNI</label>
                        <input type="text" id="customCdnSni" name="customCdnSni" value="${customCdnSni}">
                    </div>
                    <div class="form-control">
                        <label for="bestVLTRInterval">🔄 Best Interval</label>
                        <input type="number" id="bestVLTRInterval" name="bestVLTRInterval" min="10" max="90" value="${bestVLTRInterval}">
                    </div>
                    <div class="form-control" style="padding-top: 10px;">
                        <label for="VLConfigs">⚙️ Protocols</label>
                        <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; align-items: baseline; margin-top: 10px;">
                            <div style = "display: flex; justify-content: center; align-items: center;">
                                <input type="checkbox" id="VLConfigs" name="VLConfigs" onchange="handleProtocolChange(event)" value="true" ${VLConfigs ? 'checked' : ''}>
                                <label for="VLConfigs" style="margin: 0 5px; font-weight: normal; font-size: unset;">${atob('VkxFU1M=')}</label>
                            </div>
                            <div style = "display: flex; justify-content: center; align-items: center;">
                                <input type="checkbox" id="TRConfigs" name="TRConfigs" onchange="handleProtocolChange(event)" value="true" ${TRConfigs ? 'checked' : ''}>
                                <label for="TRConfigs" style="margin: 0 5px; font-weight: normal; font-size: unset;">${atob('VHJvamFu')}</label>
                            </div>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="ports-block">
                            <tr>
                                <th style="text-wrap: nowrap; background-color: gray;">Config type</th>
                                <th style="text-wrap: nowrap; background-color: gray;">Ports</th>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-size: larger;"><b>TLS</b></td>
                                <td>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">${httpsPortsBlock}</div>
                                </td>    
                            </tr>
                            ${!httpPortsBlock ? '' : `<tr>
                                <td style="text-align: center; font-size: larger;"><b>Non TLS</b></td>
                                <td>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">${httpPortsBlock}</div>
                                </td>    
                            </tr>`}        
                        </table>
                    </div>
                </details>
                <details>
                    <summary><h2>FRAGMENT ⚙️</h2></summary>	
                    <div class="form-control">
                        <label for="fragmentLengthMin">📐 Length</label>
                        <div class="min-max">
                            <input type="number" id="fragmentLengthMin" name="fragmentLengthMin" value="${lengthMin}" min="10" required>
                            <span> - </span>
                            <input type="number" id="fragmentLengthMax" name="fragmentLengthMax" value="${lengthMax}" max="500" required>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="fragmentIntervalMin">🕞 Interval</label>
                        <div class="min-max">
                            <input type="number" id="fragmentIntervalMin" name="fragmentIntervalMin"
                                value="${intervalMin}" min="1" max="30" required>
                            <span> - </span>
                            <input type="number" id="fragmentIntervalMax" name="fragmentIntervalMax"
                                value="${intervalMax}" min="1" max="30" required>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="fragmentPackets">📦 Packets</label>
                        <div class="input-with-select">
                            <select id="fragmentPackets" name="fragmentPackets">
                                <option value="tlshello" ${fragmentPackets === 'tlshello' ? 'selected' : ''}>tlshello</option>
                                <option value="1-1" ${fragmentPackets === '1-1' ? 'selected' : ''}>1-1</option>
                                <option value="1-2" ${fragmentPackets === '1-2' ? 'selected' : ''}>1-2</option>
                                <option value="1-3" ${fragmentPackets === '1-3' ? 'selected' : ''}>1-3</option>
                                <option value="1-5" ${fragmentPackets === '1-5' ? 'selected' : ''}>1-5</option>
                            </select>
                        </div>
                    </div>
                </details>
                <details>
                    <summary><h2>WARP GENERAL ⚙️</h2></summary>
                    <div class="form-control">
                        <label for="warpEndpoints">✨ Endpoints</label>
                        <input type="text" id="warpEndpoints" name="warpEndpoints" value="${warpEndpoints.replaceAll(",", " , ")}" required>
                    </div>
                    <div class="form-control">
                        <label for="endpointScanner" style="line-height: 1.5;">🔎 Scan Endpoint</label>
                        <button type="button" id="endpointScanner" class="button" style="padding: 10px 0;" onclick="copyToClipboard('bash <(curl -fsSL https://raw.githubusercontent.com/bia-pain-bache/warp-script/refs/heads/main/endip/install.sh)', false)">
                            Copy Script<span class="material-symbols-outlined">terminal</span>
                        </button>
                    </div>
                    <div class="form-control">
                        <label for="warpFakeDNS">🧢 Fake DNS</label>
                        <div class="input-with-select">
                            <select id="warpFakeDNS" name="warpFakeDNS">
                                <option value="true" ${warpFakeDNS ? 'selected' : ''}>Enabled</option>
                                <option value="false" ${!warpFakeDNS ? 'selected' : ''}>Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="warpEnableIPv6">🔛 IPv6</label>
                        <div class="input-with-select">
                            <select id="warpEnableIPv6" name="warpEnableIPv6">
                                <option value="true" ${warpEnableIPv6 ? 'selected' : ''}>Enabled</option>
                                <option value="false" ${!warpEnableIPv6 ? 'selected' : ''}>Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="refreshBtn">♻️ Warp Configs</label>
                        <button id="refreshBtn" type="button" class="button" style="padding: 10px 0;" onclick="getWarpConfigs()">
                            Update<span class="material-symbols-outlined">autorenew</span>
                        </button>
                    </div>
                    <div class="form-control">
                        <label for="bestWarpInterval">🔄 Best Interval</label>
                        <input type="number" id="bestWarpInterval" name="bestWarpInterval" min="10" max="90" value="${bestWarpInterval}">
                    </div>
                </details>
                <details>
                    <summary><h2>WARP PRO ⚙️</h2></summary>
                    <div class="header-container">
                        <h3 style="margin: 0 5px;">V2RAYNG - V2RAYN</h3>
                        <button type="button" id="add-udp-noise" onclick="addUdpNoise()" style="background: none; margin: 0; border: none; cursor: pointer;">
                            <i class="fa fa-plus-circle fa-2x" style="color: var(--button-color);" aria-hidden="true"></i>
                        </button>       
                    </div>
                    <div id="udp-noise-container">
                        ${udpNoiseBlocks}
                    </div>
                    <h3>MAHSANG - NIKANG - HIDDIFY 🔧</h3>
                    <div class="form-control">
                        <label for="hiddifyNoiseMode">😵‍💫 Hiddify Mode</label>
                        <input type="text" id="hiddifyNoiseMode" name="hiddifyNoiseMode" 
                            pattern="^(m[1-6]|h_[0-9A-Fa-f]{2}|g_([0-9A-Fa-f]{2}_){2}[0-9A-Fa-f]{2})$" 
                            title="Enter 'm1-m6', 'h_HEX', 'g_HEX_HEX_HEX' which HEX can be between 00 to ff"
                            value="${hiddifyNoiseMode}" required>
                    </div>
                    <div class="form-control">
                        <label for="nikaNGNoiseMode">😵‍💫 NikaNG Mode</label>
                        <input type="text" id="nikaNGNoiseMode" name="nikaNGNoiseMode" 
                            pattern="^(none|quic|random|[0-9A-Fa-f]+)$" 
                            title="Enter 'none', 'quic', 'random', or any HEX string like 'ee0000000108aaaa'"
                            value="${nikaNGNoiseMode}" required>
                    </div>
                    <div class="form-control">
                        <label for="noiseCountMin">🎚️ Noise Count</label>
                        <div class="min-max">
                            <input type="number" id="noiseCountMin" name="noiseCountMin"
                                value="${noiseCountMin}" min="1" required>
                            <span> - </span>
                            <input type="number" id="noiseCountMax" name="noiseCountMax"
                                value="${noiseCountMax}" min="1" required>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="noiseSizeMin">📏 Noise Size</label>
                        <div class="min-max">
                            <input type="number" id="noiseSizeMin" name="noiseSizeMin"
                                value="${noiseSizeMin}" min="1" required>
                            <span> - </span>
                            <input type="number" id="noiseSizeMax" name="noiseSizeMax"
                                value="${noiseSizeMax}" min="1" required>
                        </div>
                    </div>
                    <div class="form-control">
                        <label for="noiseDelayMin">🕞 Noise Delay</label>
                        <div class="min-max">
                            <input type="number" id="noiseDelayMin" name="noiseDelayMin"
                                value="${noiseDelayMin}" min="1" required>
                            <span> - </span>
                            <input type="number" id="noiseDelayMax" name="noiseDelayMax"
                                value="${noiseDelayMax}" min="1" required>
                        </div>
                    </div>
                    <h3>CLASH - AMNEZIA 🔧</h3>
                    <div class="form-control">
                        <label for="amneziaNoiseCount">🎚️ Noise Count</label>
                        <input type="number" id="amneziaNoiseCount" name="amneziaNoiseCount"
                            value="${amneziaNoiseCount}" min="1" required>
                    </div>
                    <div class="form-control">
                        <label for="amneziaNoiseSizeMin">📏 Noise Size</label>
                        <div class="min-max">
                            <input type="number" id="amneziaNoiseSizeMin" name="amneziaNoiseSizeMin"
                                value="${amneziaNoiseSizeMin}" min="1" required>
                            <span> - </span>
                            <input type="number" id="amneziaNoiseSizeMax" name="amneziaNoiseSizeMax"
                                value="${amneziaNoiseSizeMax}" min="1" required>
                        </div>
                    </div>
                </details>
                <details>
                    <summary><h2>ROUTING RULES ⚙️</h2></summary>
                    <div id="routing-rules" class="form-control" style="margin-bottom: 20px;">			
                        <div class="routing">
                            <input type="checkbox" id="bypass-lan" name="bypass-lan" value="true" ${bypassLAN ? 'checked' : ''}>
                            <label for="bypass-lan">Bypass LAN</label>
                        </div>
                        <div class="routing">
                            <input type="checkbox" id="block-ads" name="block-ads" value="true" ${blockAds ? 'checked' : ''}>
                            <label for="block-ads">Block Ads.</label>
                        </div>
                        <div class="routing">
                            <input type="checkbox" id="bypass-iran" name="bypass-iran" value="true" ${bypassIran ? 'checked' : ''}>
                            <label for="bypass-iran">Bypass Iran</label>
                        </div>
                        <div class="routing">
                            <input type="checkbox" id="block-porn" name="block-porn" value="true" ${blockPorn ? 'checked' : ''}>
                            <label for="block-porn">Block Porn</label>
                        </div>
                        <div class="routing">
                            <input type="checkbox" id="bypass-china" name="bypass-china" value="true" ${bypassChina ? 'checked' : ''}>
                            <label for="bypass-china">Bypass China</label>
                        </div>
                        <div class="routing">
                            <input type="checkbox" id="block-udp-443" name="block-udp-443" value="true" ${blockUDP443 ? 'checked' : ''}>
                            <label for="block-udp-443">Block QUIC</label>
                        </div>
                        <div class="routing">
                            <input type="checkbox" id="bypass-russia" name="bypass-russia" value="true" ${bypassRussia ? 'checked' : ''}>
                            <label for="bypass-russia">Bypass Russia</label>
                        </div>
                    </div>
                    <h3>CUSTOM RULES 🔧</h3>
                    <div class="form-control">
                        <label for="customBypassRules">🟩 Bypass IPs / Domains</label>
                        <input type="text" id="customBypassRules" name="customBypassRules" value="${customBypassRules.replaceAll(",", " , ")}">
                    </div>
                    <div class="form-control">
                        <label for="customBlockRules">🟥 Block IPs / Domains</label>
                        <input type="text" id="customBlockRules" name="customBlockRules" value="${customBlockRules.replaceAll(",", " , ")}">
                    </div>
                </details>
                <div id="apply" class="form-control">
                    <div style="grid-column: 2; width: 100%; display: flex; justify-content: center; gap: 10px;">
                        <input type="submit" id="applyButton" style="margin-right: 10px;" class="button disabled" value="APPLY SETTINGS 💥" form="configForm">
                        <button type="button" id="resetSettings" style="background: none; margin: 0; border: none; cursor: pointer; width: max-content;">
                            <i class="fa fa-refresh fa-2x fa-border" style="border-radius: .2em; border-color: var(--border-color);" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </form>
            <hr>            
            <h2>🔗 NORMAL SUB</h2>
            <div class="table-container">
                <table id="normal-configs-table">
                    <tr>
                        <th>Application</th>
                        <th>Subscription</th>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['v2rayNG', 'NikaNG', 'MahsaNG', 'v2rayN', 'v2rayN-PRO', 'Shadowrocket', 'Streisand', 'Hiddify'])}
                        </td>
                        <td>
                            ${subQR('sub', '', `${atob('QlBC')}-Normal`, 'Normal Subscription')}
                            ${subURL('sub', '', `${atob('QlBC')}-Normal`)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['husi', 'Nekobox', 'Nekoray', 'Karing'])}
                        </td>
                        <td>
                            ${subQR('sub', 'singbox', `${atob('QlBC')}-Normal`, 'Normal Subscription', true)}
                            ${subURL('sub', 'singbox', `${atob('QlBC')}-Normal`)}
                        </td>
                    </tr>
                </table>
            </div>
            <h2>🔗 FULL NORMAL SUB</h2>
            <div class="table-container">
                <table id="full-normal-configs-table">
                    <tr>
                        <th>Application</th>
                        <th>Subscription</th>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['v2rayNG', 'NikaNG', 'MahsaNG', 'v2rayN', 'v2rayN-PRO', 'Streisand'])}
                        </td>
                        <td>
                            ${subQR('sub', 'xray', `${atob('QlBC')}-Full-Normal`, 'Full normal Subscription')}
                            ${subURL('sub', 'xray', `${atob('QlBC')}-Full-Normal`)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['sing-box', 'v2rayN (sing-box)'])}
                        </td>
                        <td>
                            ${subQR('sub', 'sfa', `${atob('QlBC')}-Full-Normal`, 'Full normal Subscription', true)}
                            ${subURL('sub', 'sfa', `${atob('QlBC')}-Full-Normal`)}
                            ${dlConfig('sub', 'sfa')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Clash Meta', 'Clash Verge', 'FlClash', 'Stash', 'v2rayN (mihomo)'])}
                        </td>
                        <td>
                            ${subQR('sub', 'clash', `${atob('QlBC')}-Full-Normal`, 'Full normal Subscription')}
                            ${subURL('sub', 'clash', `${atob('QlBC')}-Full-Normal`)}
                            ${dlConfig('sub', 'clash')}
                        </td>
                    </tr>
                </table>
            </div>
            <h2>🔗 FRAGMENT SUB</h2>
            <div class="table-container">
                <table id="frag-sub-table">
                    <tr>
                        <th style="text-wrap: nowrap;">Application</th>
                        <th style="text-wrap: nowrap;">Subscription</th>
                    </tr>
                    <tr>
                        <td style="text-wrap: nowrap;">
                            ${supportedApps(['v2rayNG', 'NikaNG', 'MahsaNG', 'v2rayN', 'v2rayN-PRO', 'Streisand'])}
                        </td>
                        <td>
                            ${subQR('fragsub', '', `${atob('QlBC')}-Fragment`, 'Fragment Subscription')}
                            ${subURL('fragsub', '', `${atob('QlBC')}-Fragment`)}
                        </td>
                    </tr>
                    <tr>
                        <td style="text-wrap: nowrap;">
                            ${supportedApps(['Hiddify'])}
                        </td>
                        <td>
                            ${subQR('fragsub', 'hiddify-frag', `${atob('QlBC')}-Fragment`, 'Fragment Subscription', false, true)}
                            ${subURL('fragsub', 'hiddify-frag', `${atob('QlBC')}-Fragment`, true)}
                        </td>
                    </tr>
                </table>
            </div>
            <h2>🔗 WARP SUB</h2>
            <div class="table-container">
                <table id="normal-configs-table">
                    <tr>
                        <th>Application</th>
                        <th>Subscription</th>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['v2rayNG', 'v2rayN', 'Streisand'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'xray', `${atob('QlBC')}-Warp`, 'Warp Subscription')}
                            ${subURL('warpsub', 'xray', `${atob('QlBC')}-Warp`)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['sing-box', 'v2rayN (sing-box)'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'singbox', `${atob('QlBC')}-Warp`, 'Warp Subscription', true)}
                            ${subURL('warpsub', 'singbox', `${atob('QlBC')}-Warp`)}
                            ${dlConfig('sub', 'singbox')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Hiddify'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'hiddify', `${atob('QlBC')}-Warp`, 'Warp Subscription', false, true)}
                            ${subURL('warpsub', 'hiddify', `${atob('QlBC')}-Warp`, true)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Clash Meta', 'Clash Verge', 'FlClash', 'Stash', 'v2rayN (mihomo)'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'clash', `${atob('QlBC')}-Warp`, 'Warp Subscription')}
                            ${subURL('warpsub', 'clash', `${atob('QlBC')}-Warp`)}
                            ${dlConfig('warpsub', 'clash')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Wireguard'])}
                        </td>
                        <td>
                            <button id="dlConfigsBtn" type="button" onclick="downloadWarpConfigs()">
                                Download<span class="material-symbols-outlined">download</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <h2>🔗 WARP PRO SUB</h2>
            <div class="table-container">
                <table id="warp-pro-configs-table">
                    <tr>
                        <th>Application</th>
                        <th>Subscription</th>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['v2rayNG', 'v2rayN', 'Streisand'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'xray-pro', `${atob('QlBC')}-Warp-Pro`, 'Warp Pro Subscription')}
                            ${subURL('warpsub', 'xray-pro', `${atob('QlBC')}-Warp-Pro`)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['NikaNG', 'MahsaNG', 'v2rayN-PRO'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'nikang', `${atob('QlBC')}-Warp-Pro`, 'Warp Pro Subscription')}
                            ${subURL('warpsub', 'nikang', `${atob('QlBC')}-Warp-Pro`)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Clash Meta', 'Clash Verge', 'FlClash', 'Stash', 'v2rayN (mihomo)'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'clash-pro', `${atob('QlBC')}-Warp-Pro`, 'Warp Pro Subscription')}
                            ${subURL('warpsub', 'clash-pro', `${atob('QlBC')}-Warp-Pro`)}
                            ${dlConfig('warpsub', 'clash-pro')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Hiddify'])}
                        </td>
                        <td>
                            ${subQR('warpsub', 'hiddify-pro', `${atob('QlBC')}-Warp-Pro`, 'Warp Pro Subscription', false, true)}
                            ${subURL('warpsub', 'hiddify-pro', `${atob('QlBC')}-Warp-Pro`, true)}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${supportedApps(['Amnezia', 'WG Tunnel'])}
                        </td>
                        <td>
                            <button id="dlAmneziaConfigsBtn" type="button" onclick="downloadWarpConfigs('amnezia')">
                                Download<span class="material-symbols-outlined">download</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div id="myModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <form id="passwordChangeForm">
                        <h2>Change Password</h2>
                        <div class="form-control">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" name="newPassword" required>
                            </div>
                        <div class="form-control">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                        </div>
                        <div id="passwordError" style="color: red; margin-bottom: 10px;"></div>
                        <button id="changePasswordBtn" type="submit" class="button">Change Password</button>
                    </form>
                </div>
            </div>
            <div id="myQRModal" class="modalQR">
                <div class="modal-content" style="width: auto; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 10px;">
                        <span id="closeQRModal" class="close" style="align-self: flex-end;">&times;</span>
                        <span id="qrcodeTitle" style="align-self: center; font-weight: bold;"></span>
                    </div>
                    <div id="qrcode-container"></div>
                </div>
            </div>
            <hr>
            <div class="header-container">
                <h2 style="margin: 0 5px;">💡 MY IP</h2>
                <button type="button" id="refresh-geo-location" onclick="fetchIPInfo()" style="background: none; margin: 0; border: none; cursor: pointer;">
                    <i class="fa fa-refresh fa-2x" style="color: var(--button-color);" aria-hidden="true"></i>
                </button>       
            </div>
            <div class="table-container">
                <table id="ips" style="text-align: center; margin-bottom: 15px; text-wrap-mode: nowrap;">
                    <tr>
                        <th>Target Address</th>
                        <th>IP</th>
                        <th>Country</th>
                        <th>City</th>
                        <th>ISP</th>
                    </tr>
                    <tr>
                        <td>Cloudflare CDN</td>
                        <td id="cf-ip"></td>
                        <td><b id="cf-country"></b></td>
                        <td><b id="cf-city"></b></td>
                        <td><b id="cf-isp"></b></td>
                    </tr>
                    <tr>
                        <td>Others</td>
                        <td id="ip"></td>
                        <td><b id="country"></b></td>
                        <td><b id="city"></b></td>
                        <td><b id="isp"></b></td>
                    </tr>
                </table>
            </div>
            <hr>
            <div class="footer">
                <i class="fa fa-github" style="font-size:36px; margin-right: 10px;"></i>
                <a class="link" href="https://github.com/bia-pain-bache/${atob('QlBC')}-Worker-Panel" style="color: var(--color); text-decoration: underline;" target="_blank">Github</a>
                <button id="openModalBtn" class="button">Change Password</button>
                <button type="button" id="logout" style="background: none; color: var(--color); margin: 0; border: none; cursor: pointer;">
                    <i class="fa fa-power-off fa-2x" aria-hidden="true"></i>
                </button>
            </div>
        </div>
        <button id="darkModeToggle" class="floating-button">
            <i id="modeIcon" class="fa fa-2x fa-adjust" style="color: var(--background-color);" aria-hidden="true"></i>
        </button>
    <script type="module" defer>
        import { polyfillCountryFlagEmojis } from "https://cdn.skypack.dev/country-flag-emoji-polyfill";
        polyfillCountryFlagEmojis();
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script>
        ${js}
    </script>
    </body>	
    </html>`;

    return new Response(homePage, {
        status: 200,
        headers: {
            'Content-Type': 'text/html;charset=utf-8',
            'Access-Control-Allow-Origin': globalThis.urlOrigin,
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, no-transform',
            'CDN-Cache-Control': 'no-store'
        }
    });
}