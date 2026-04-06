/**
 * Parse MXL (compressed MusicXML) → ParsedScore.
 * MXL is a ZIP containing META-INF/container.xml and the root MusicXML file.
 */
import AdmZip from "adm-zip";
import { parseMusicXML } from "./musicxmlParser.js";
function getRootfilePath(containerXml) {
    const match = containerXml.match(/<rootfile\s+[^>]*full-path="([^"]+)"/);
    if (match)
        return match[1];
    const alt = containerXml.match(/full-path='([^']+)'/);
    return alt ? alt[1] : null;
}
/**
 * Extract MusicXML from MXL buffer and parse to ParsedScore.
 */
export function parseMXL(buffer) {
    try {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        let containerXml = null;
        const xmlEntries = [];
        for (const entry of entries) {
            if (entry.isDirectory)
                continue;
            const name = entry.entryName;
            const content = entry.getData().toString("utf-8");
            if (name === "META-INF/container.xml" || name.endsWith("/container.xml")) {
                containerXml = content;
            }
            if (name.endsWith(".xml") || name.endsWith(".musicxml")) {
                xmlEntries.push({ path: name, content });
            }
        }
        let xmlContent = null;
        if (containerXml) {
            const rootPath = getRootfilePath(containerXml);
            if (rootPath) {
                const found = xmlEntries.find((e) => e.path === rootPath || e.path.endsWith(rootPath));
                xmlContent = found?.content ?? null;
            }
        }
        if (!xmlContent && xmlEntries.length > 0) {
            xmlContent = xmlEntries[0].content;
        }
        if (!xmlContent)
            return null;
        return parseMusicXML(xmlContent);
    }
    catch {
        return null;
    }
}
