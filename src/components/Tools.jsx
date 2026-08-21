const breakpoints = {
    xs: 480,
    ss: 620,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};

export const useScreenSize = () => {
    const width = window.innerWidth;
  
    if (width < breakpoints.xs) return "xs";
    else if (width < breakpoints.sm) return "sm";
    else if (width < breakpoints.md) return "md";
    else if (width < breakpoints.lg) return "lg";
    else return "xl";
};
  

export const getLinkId = (url) => {
    let id;
    const youtubeMatch = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})(?:\S+)?$/;
    const dropboxMatch = /^(?:https?:\/\/)?(?:www\.)?dropbox\.com\/(?:s|sh)\/([\w\d]+)(?:\/.*)?$/;
    const megaMatch = /^(?:https?:\/\/)?mega\.(?:co\.nz|nz|io)\/(?:#!\/)?(?:file|enc|f)!([a-zA-Z0-9!_-]{8,})(?:\S+)?$/;
    const googleDriveMatch = /^(?:https?:\/\/)?drive\.google\.com\/(?:uc\?export=view&id=|file\/d\/|open\?id=)([^/&?#]+)/;
  
    if (youtubeMatch.test(url)) {
        id = url.match(youtubeMatch)[1];
    } else if (dropboxMatch.test(url)) {
        id = url.match(dropboxMatch)[1];
    } else if (megaMatch.test(url)) {
        id = url.match(megaMatch)[1];
    } else if (googleDriveMatch.test(url)) {
        id = url.match(googleDriveMatch)[1];
    } else {
        id = null;
    }
    return id;
}

export const convertDriveImageLink = (url) => {
    if(url.includes('drive.google.com'))
        return `https://drive.google.com/thumbnail?id=${getLinkId(url)}&sz=w1000`
    else
        return url
}

export const millisToTimeString = (millis) => {
    var seconds = Math.floor(millis / 1000);
    var hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    var minutes = Math.floor(seconds / 60);
    seconds %= 60;

    var timeString = "";
    if (hours > 0) {
        timeString += hours.toString().padStart(2, '0') + ":";
    }
    timeString += minutes.toString().padStart(2, '0') + ":" +
                  seconds.toString().padStart(2, '0');
    
    return timeString;
}

const importKey = async () => {
    const secretKey = import.meta.env.VITE_APP_SECRET_KEY;

    if (!secretKey) {
      return '';
    }

    const rawKey = Uint8Array.from(atob(secretKey), char => char.charCodeAt(0));
    const key = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    return key;
};

export const generateIV = () => window.crypto.getRandomValues(new Uint8Array(12));
export const fixIV = () => new Uint8Array(24);

export const encryptData = async (data) => {
    const cryptoKey = await importKey()
    if (!cryptoKey) return btoa(unescape(encodeURIComponent(data)));

    const iv = fixIV();
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encodedData
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
};

export const decryptData = async (encryptedText) => {
    const cryptoKey = await importKey()
    if (!cryptoKey) return decodeURIComponent(escape(atob(encryptedText)));

    const iv = fixIV();
    const encryptedArrayBuffer = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    const decryptedData = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encryptedArrayBuffer
    );

    return new TextDecoder().decode(decryptedData);
  };