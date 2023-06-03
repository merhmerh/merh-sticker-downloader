export function safeText(name) {
    const forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/g; // Regex to match forbidden characters
    // Remove forbidden characters and replace them with the replacement character
    let safeText = name.replace(forbiddenChars, "");
    safeText = safeText.replace(/[\.-\s]/g, "_")
    safeText = safeText.toLowerCase()

    return safeText;
}
