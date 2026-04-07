/**
 * Convert MusicXML score-timewise to score-partwise.
 * OpenSheetMusicDisplay only supports partwise format; the backend outputs timewise.
 */

function findByLocalName(parent: Document | Element, localName: string): Element | null {
  const list = parent.getElementsByTagName(localName);
  if (list.length > 0) return list[0];
  const all = parent.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i];
  }
  return null;
}

function findAllByLocalName(parent: Document | Element, localName: string): Element[] {
  const list = parent.getElementsByTagName(localName);
  if (list.length > 0) return Array.from(list);
  const all = parent.getElementsByTagName("*");
  const out: Element[] = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) out.push(all[i]);
  }
  return out;
}

/**
 * Convert score-timewise MusicXML to score-partwise.
 * Returns the original string if already partwise or if conversion fails.
 */
export function timewiseToPartwise(xml: string): string {
  if (typeof window === "undefined") return xml;
  if (xml.includes("<score-partwise")) return xml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) return xml;

  const scoreTimewise =
    doc.querySelector("score-timewise") ?? findByLocalName(doc, "score-timewise");
  if (!scoreTimewise) return xml;

  const partList =
    scoreTimewise.querySelector("part-list") ?? findByLocalName(scoreTimewise, "part-list");
  const measures =
    scoreTimewise.querySelectorAll("measure").length > 0
      ? Array.from(scoreTimewise.querySelectorAll("measure"))
      : findAllByLocalName(scoreTimewise, "measure");

  if (measures.length === 0) return xml;

  const partIds: string[] = [];
  if (partList) {
    const scoreParts =
      partList.querySelectorAll("score-part").length > 0
        ? Array.from(partList.querySelectorAll("score-part"))
        : findAllByLocalName(partList, "score-part");
    scoreParts.forEach((sp) => {
      const id = sp.getAttribute("id");
      if (id) partIds.push(id);
    });
  }
  if (partIds.length === 0) {
    const firstMeasure = measures[0];
    const parts =
      firstMeasure.querySelectorAll("part").length > 0
        ? Array.from(firstMeasure.querySelectorAll("part"))
        : findAllByLocalName(firstMeasure, "part");
    parts.forEach((p) => {
      const id = p.getAttribute("id");
      if (id) partIds.push(id);
    });
  }
  if (partIds.length === 0) return xml;

  const partMeasures: Map<string, Element[]> = new Map();
  partIds.forEach((id) => partMeasures.set(id, []));

  for (const measureEl of measures) {
    for (const partId of partIds) {
      const partEl =
        measureEl.querySelector(`part[id="${partId}"]`) ??
        findAllByLocalName(measureEl, "part").find((p) => p.getAttribute("id") === partId);
      if (partEl) {
        const measureClone = doc.createElementNS(
          measureEl.namespaceURI || "http://www.musicxml.org/ns/partwise",
          "measure"
        );
        measureClone.setAttribute("number", measureEl.getAttribute("number") ?? "1");
        for (const child of Array.from(partEl.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            measureClone.appendChild((child as Element).cloneNode(true));
          }
        }
        partMeasures.get(partId)!.push(measureClone);
      }
    }
  }

  const partwiseDoc = parser.parseFromString(
    '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.0"></score-partwise>',
    "text/xml"
  );
  const scorePartwise = partwiseDoc.documentElement;

  let insertedPartList = false;
  for (const child of Array.from(scoreTimewise.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    if (el.localName === "part-list" || el.tagName === "part-list") {
      scorePartwise.appendChild(el.cloneNode(true));
      insertedPartList = true;
    } else if (!insertedPartList) {
      scorePartwise.appendChild(el.cloneNode(true));
    }
  }

  if (!insertedPartList && partList) {
    scorePartwise.appendChild(partList.cloneNode(true));
  }

  const ns = scoreTimewise.namespaceURI || "http://www.musicxml.org/ns/partwise";
  for (const partId of partIds) {
    const measuresForPart = partMeasures.get(partId) ?? [];
    const partEl = partwiseDoc.createElementNS(ns, "part");
    partEl.setAttribute("id", partId);
    for (const m of measuresForPart) {
      partEl.appendChild(partwiseDoc.importNode(m, true));
    }
    scorePartwise.appendChild(partEl);
  }

  return new XMLSerializer().serializeToString(partwiseDoc);
}
