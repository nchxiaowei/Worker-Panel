import { fetchWarpConfigs } from '../protocols/warp';
import { Authenticate } from '../authentication/auth';

export async function getDataset(request, env) {
    let proxySettings, warpConfigs;

    try {
        proxySettings = await env.kv.get("proxySettings", {type: 'json'});
        warpConfigs = await env.kv.get('warpConfigs', {type: 'json'});
    } catch (error) {
        console.log(error);
        throw new Error(`An error occurred while getting KV - ${error}`);
    }

    if (!proxySettings) {
        proxySettings = await updateDataset(request, env);
        const { error, configs } = await fetchWarpConfigs(env, proxySettings);
        if (error) throw new Error(`An error occurred while getting Warp configs - ${error}`);
        warpConfigs = configs;
    }
    
    if (globalThis.panelVersion !== proxySettings.panelVersion) proxySettings = await updateDataset(request, env);
    return { proxySettings, warpConfigs }
}

async function fetchCleanIPsFromRemote() {
    const url = 'https://raw.githubusercontent.com/nchxiaowei/cf-speed-dns/main/ipTop.html';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`❌ 拉取 IPTop.html 失败: ${response.status}`);
            return '';
        }
        const text = await response.text();
        return text
            .split(',')
            .map(ip => ip.trim())
            .filter(ip => ip.length > 0)
            .join(',');
    } catch (error) {
        console.error('❌ fetchCleanIPsFromRemote 出错:', error);
        return '';
    }
}

export async function updateDataset (request, env) {
    let newSettings = request.method === 'POST' ? await request.formData() : null;
    const isReset = newSettings?.get('resetSettings') === 'true';
    let currentSettings;
    let udpNoises = [];
    if (!isReset) {
        try {
            currentSettings = await env.kv.get("proxySettings", {type: 'json'});
        } catch (error) {
            console.log(error);
            throw new Error(`An error occurred while getting current KV settings - ${error}`);
        }
        const udpNoiseModes = newSettings?.getAll('udpXrayNoiseMode') || [];
        const udpNoisePackets = newSettings?.getAll('udpXrayNoisePacket') || [];
        const udpNoiseDelaysMin = newSettings?.getAll('udpXrayNoiseDelayMin') || [];
        const udpNoiseDelaysMax = newSettings?.getAll('udpXrayNoiseDelayMax') || [];
        const udpNoiseCount = newSettings?.getAll('udpXrayNoiseCount') || [];
        udpNoises.push(...udpNoiseModes.map((mode, index) => ({
            type: mode,
            packet: udpNoisePackets[index],
            delay: `${udpNoiseDelaysMin[index]}-${udpNoiseDelaysMax[index]}`,
            count: udpNoiseCount[index]
        })));
    } else {
        newSettings = null;
    }

    const validateField = (field) => {
        const fieldValue = newSettings?.get(field);
        if (fieldValue === undefined) return null;
        if (fieldValue === 'true') return true;
        if (fieldValue === 'false') return false;
        return fieldValue;
    }

    const cleanIPsFromFile = await fetchCleanIPsFromRemote();

    const proxySettings = {
        remoteDNS: validateField('remoteDNS') ?? currentSettings?.remoteDNS ?? 'https://8.8.8.8/dns-query',
        localDNS: validateField('localDNS') ?? currentSettings?.localDNS ?? '8.8.8.8',
        VLTRFakeDNS: validateField('VLTRFakeDNS') ?? currentSettings?.VLTRFakeDNS ?? false,
        proxyIP: validateField('proxyIP')?.replaceAll(' ', '') ?? currentSettings?.proxyIP ?? '',
        outProxy: validateField('outProxy') ?? currentSettings?.outProxy ?? '',
        outProxyParams: extractChainProxyParams(validateField('outProxy')) ?? currentSettings?.outProxyParams ?? {},
        cleanIPs: (
            (validateField('cleanIPs')?.replaceAll(' ', '') || currentSettings?.cleanIPs || '') +
            (cleanIPsFromFile ? (',' + cleanIPsFromFile) : '')
        ),
        enableIPv6: validateField('enableIPv6') ?? currentSettings?.enableIPv6 ?? true,
        customCdnAddrs: validateField('customCdnAddrs')?.replaceAll(' ', '') ?? currentSettings?.customCdnAddrs ?? '',
        customCdnHost: validateField('customCdnHost')?.trim() ?? currentSettings?.customCdnHost ?? '',
        customCdnSni: validateField('customCdnSni')?.trim() ?? currentSettings?.customCdnSni ?? '',
        bestVLTRInterval: validateField('bestVLTRInterval') ?? currentSettings?.bestVLTRInterval ?? '30',
        VLConfigs: validateField('VLConfigs') ?? currentSettings?.VLConfigs ?? true,
        TRConfigs: validateField('TRConfigs') ?? currentSettings?.TRConfigs ?? false,
        ports: validateField('ports')?.split(',') ?? currentSettings?.ports ?? ['443'],
        lengthMin: validateField('fragmentLengthMin') ?? currentSettings?.lengthMin ?? '100',
        lengthMax: validateField('fragmentLengthMax') ?? currentSettings?.lengthMax ?? '200',
        intervalMin: validateField('fragmentIntervalMin') ?? currentSettings?.intervalMin ?? '1',
        intervalMax: validateField('fragmentIntervalMax') ?? currentSettings?.intervalMax ?? '1',
        fragmentPackets: validateField('fragmentPackets') ?? currentSettings?.fragmentPackets ?? 'tlshello',
        bypassLAN: validateField('bypass-lan') ?? currentSettings?.bypassLAN ?? false,
        bypassIran: validateField('bypass-iran') ?? currentSettings?.bypassIran ?? false,
        bypassChina: validateField('bypass-china') ?? currentSettings?.bypassChina ?? false,
        bypassRussia: validateField('bypass-russia') ?? currentSettings?.bypassRussia ?? false,
        blockAds: validateField('block-ads') ?? currentSettings?.blockAds ?? false,
        blockPorn: validateField('block-porn') ?? currentSettings?.blockPorn ?? false,
        blockUDP443: validateField('block-udp-443') ?? currentSettings?.blockUDP443 ?? false,
        customBypassRules: validateField('customBypassRules')?.replaceAll(' ', '') ?? currentSettings?.customBypassRules ?? '',
        customBlockRules: validateField('customBlockRules')?.replaceAll(' ', '') ?? currentSettings?.customBlockRules ?? '',
        warpEndpoints: validateField('warpEndpoints')?.replaceAll(' ', '') ?? currentSettings?.warpEndpoints ?? 'engage.cloudflareclient.com:2408',
        warpFakeDNS: validateField('warpFakeDNS') ?? currentSettings?.warpFakeDNS ?? false,
        warpEnableIPv6: validateField('warpEnableIPv6') ?? currentSettings?.warpEnableIPv6 ?? true,
        bestWarpInterval: validateField('bestWarpInterval') ?? currentSettings?.bestWarpInterval ?? '30',
        xrayUdpNoises: (udpNoises.length ? JSON.stringify(udpNoises) : currentSettings?.xrayUdpNoises) ?? JSON.stringify([
            {
                type: 'base64',
                packet: btoa(globalThis.userID),
                delay: '1-1',
                count: '1'
            }
        ]),
        hiddifyNoiseMode: validateField('hiddifyNoiseMode') ?? currentSettings?.hiddifyNoiseMode ?? 'm4',
        nikaNGNoiseMode: validateField('nikaNGNoiseMode') ?? currentSettings?.nikaNGNoiseMode ?? 'quic',
        noiseCountMin: validateField('noiseCountMin') ?? currentSettings?.noiseCountMin ?? '10',
        noiseCountMax: validateField('noiseCountMax') ?? currentSettings?.noiseCountMax ?? '15',
        noiseSizeMin: validateField('noiseSizeMin') ?? currentSettings?.noiseSizeMin ?? '5',
        noiseSizeMax: validateField('noiseSizeMax') ?? currentSettings?.noiseSizeMax ?? '10',
        noiseDelayMin: validateField('noiseDelayMin') ?? currentSettings?.noiseDelayMin ?? '1',
        noiseDelayMax: validateField('noiseDelayMax') ?? currentSettings?.noiseDelayMax ?? '1',
        amneziaNoiseCount: validateField('amneziaNoiseCount') ?? currentSettings?.amneziaNoiseCount ?? '5',
        amneziaNoiseSizeMin: validateField('amneziaNoiseSizeMin') ?? currentSettings?.amneziaNoiseSizeMin ?? '50',
        amneziaNoiseSizeMax: validateField('amneziaNoiseSizeMax') ?? currentSettings?.amneziaNoiseSizeMax ?? '100',
        panelVersion: globalThis.panelVersion
    };

    try {    
        await env.kv.put("proxySettings", JSON.stringify(proxySettings));
        if (isReset) await updateWarpConfigs(request, env);          
    } catch (error) {
        console.log(error);
        throw new Error(`An error occurred while updating KV - ${error}`);
    }

    return proxySettings;
}

function extractChainProxyParams(chainProxy) {
    let configParams = {};
    if (!chainProxy) return {};
    const url = new URL(chainProxy);
    const protocol = url.protocol.slice(0, -1);
    if (protocol === atob('dmxlc3M=')) {
        const params = new URLSearchParams(url.search);
        configParams = {
            protocol: protocol,
            uuid : url.username,
            server : url.hostname,
            port : url.port
        };
    
        params.forEach( (value, key) => {
            configParams[key] = value;
        });
    } else {
        configParams = {
            protocol: protocol, 
            user : url.username,
            pass : url.password,
            server : url.host,
            port : url.port
        };
    }

    return JSON.stringify(configParams);
}

export async function updateWarpConfigs(request, env) {
    const auth = await Authenticate(request, env); 
    if (!auth) return new Response('Unauthorized', { status: 401 });
    if (request.method === 'POST') {
        try {
            const { error: warpPlusError } = await fetchWarpConfigs(env);
            if (warpPlusError) return new Response(warpPlusError, { status: 400 });
            return new Response('Warp configs updated successfully', { status: 200 });
        } catch (error) {
            console.log(error);
            return new Response(`An error occurred while updating Warp configs! - ${error}`, { status: 500 });
        }
    } else {
        return new Response('Unsupported request', { status: 405 });
    }
}